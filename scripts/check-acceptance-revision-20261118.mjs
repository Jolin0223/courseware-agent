import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
const out='docs/reviews/20261118-acceptance';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1920,height:1080}}),checks=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));
const check=(name,ok)=>{expect(ok,name).toBeTruthy();checks.push(name);console.log('PASS',name);};
try{
 await page.goto(process.env.DEMO_URL||'http://127.0.0.1:4190/');
 const id=await page.evaluate(async()=>{
  const url=p=>performance.getEntriesByType('resource').find(e=>new URL(e.name).pathname===p)?.name||p;
  const {useConversationStore:c}=await import(url('/src/store/conversationStore.ts'));
  const {useVideoCoursewareStore:s}=await import(url('/src/store/videoCoursewareStore.ts'));
  const flow=await import(url('/src/components/VideoCourseware/workflow.ts'));
  const {wukongFixture:f,exampleAttachments}=await import(url('/src/data/videoCourseware/fixtures.ts'));
  if(!s.persist.hasHydrated())await new Promise(resolve=>{const stop=s.persist.onFinishHydration(()=>{stop();resolve();});});
  const cid=c.getState().createNewConversation('整课修改验证');flow.startVideoProject(cid,f.request,exampleAttachments,{contentFormat:'video'});const id='video-'+cid;
  const tick=()=>{const job=s.getState().projects[id].job;flow.advanceVideoJobs(job.start+job.duration);};
  tick();flow.confirmOutline(id);tick();tick();tick();flow.confirmVideoPlan(id);tick();tick();return id;
 });
 const project=()=>page.evaluate(async id=>{const url=performance.getEntriesByType('resource').find(e=>new URL(e.name).pathname==='/src/store/videoCoursewareStore.ts')?.name;return (await import(url)).useVideoCoursewareStore.getState().projects[id];},id);

 const before=await project(),shell=page.locator('.agent-chat-input-shell').last();
 const scenes=[before.segments[0],before.segments.find(s=>s.id==='learn')];
 await shell.getByRole('button',{name:'选择场景修改',exact:true}).click();
 for(const [i,scene] of scenes.entries()){
  await shell.getByRole('button',{name:new RegExp(scene.title)}).click();
  const row=shell.locator(`[data-scene-edit="${scene.id}"]`);
  await row.getByPlaceholder('填写这个场景的修改意见').fill(i?'雨字提示放大，保持Q版画风和16:9比例':'封面标题更清晰，保持人物造型一致');
  const chooserPromise=page.waitForEvent('filechooser');
  await row.getByRole('button',{name:'添加本场图片'}).click();
  await (await chooserPromise).setFiles('public/wukong/assets/images/v10/cover.png');
  await expect(row.locator('img')).toHaveCount(1);
 }
 await shell.locator('textarea').last().fill('整体保持现在的画风');
 await page.getByRole('button',{name:/发送，/}).last().click();
 const submitted=page.getByLabel('已发送的场景修改');
 await expect(submitted).toHaveCount(1);
 await expect(submitted.locator('section')).toHaveCount(2);
 await expect(submitted.locator('img')).toHaveCount(2);
 await expect(submitted).toContainText('封面标题更清晰');
 await expect(submitted).toContainText('雨字提示放大');
 check('按场景回显名称、原话、对应图片',(await project()).submittedEdits[0].message.content.sceneEdits.length===2);
 check('发送即开始生成，完成前仍为第1版',(await project()).revision===1&&(await project()).courseDraft.status==='generating');
 await submitted.scrollIntoViewIfNeeded();
 await page.screenshot({path:out+'/01-scene-submission.png'});
 await submitted.locator('button').first().click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.getByRole('dialog').getByRole('button',{name:'关闭',exact:true}).click();
 // Allow the real IndexedDB write queue to commit, then reload mid-generation.
 await expect.poll(()=>page.evaluate(async id=>{
  const db=await new Promise(resolve=>{const r=indexedDB.open('courseware-projects',1);r.onsuccess=()=>resolve(r.result);});
  const value=await new Promise(resolve=>{const r=db.transaction('state').objectStore('state').get('video-courseware-platform-v2');r.onsuccess=()=>resolve(r.result);});db.close();
  return JSON.parse(value).state.projects[id].submittedEdits?.length;
 },id)).toBe(1);
 await page.reload();
 await page.evaluate(async id=>{
  const url=p=>performance.getEntriesByType('resource').find(e=>new URL(e.name).pathname===p)?.name||p;
  const {useVideoCoursewareStore:s}=await import(url('/src/store/videoCoursewareStore.ts'));
  const {useConversationStore:c}=await import(url('/src/store/conversationStore.ts'));
  const flow=await import(url('/src/components/VideoCourseware/workflow.ts'));
  if(!s.persist.hasHydrated())await new Promise(resolve=>{const stop=s.persist.onFinishHydration(()=>{stop();resolve();});});
  flow.restoreVideoConversations();c.getState().setActiveConversation(s.getState().projects[id].conversationId);
 },id);
 await expect(page.getByLabel('已发送的场景修改').locator('img')).toHaveCount(2);
 check('刷新后保留逐场景原话和图片',true);
 await expect.poll(async()=>(await project()).revision,{timeout:16000}).toBe(2);
 let p=await project();check('第2版生成完成且旧版快照未被修改',p.resultMessages.length===2&&JSON.stringify(p.resultMessages[0])===JSON.stringify(before.resultMessages[0])&&!p.courseDraft);
 await expect(page.getByRole('button',{name:'第1版 未发布草稿',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'第2版 未发布草稿',exact:true})).toBeVisible();
 check('会话版本历史显示第1版与第2版',true);
 await page.getByRole('button',{name:'一键同款',exact:true}).last().scrollIntoViewIfNeeded();
 await page.screenshot({path:out+'/02-version-two.png'});
 const text='现在整个都点不动，从封面进去就点不动';
 await shell.getByPlaceholder('输入修改意见，发送后生成新版本').fill(text);
 await page.getByRole('button',{name:/发送，/}).last().click();
 await expect(page.locator('.agent-user-message').filter({hasText:text})).toHaveCount(1);
 check('整体修改完整回显用户原话且只出现一次',true);
 await expect.poll(async()=>(await project()).revision,{timeout:16000}).toBe(3);
 p=await project();check('整体修改生成第3版，未重复交付',p.resultMessages.length===3&&p.submittedEdits.length===2);
 await page.setViewportSize({width:1135,height:853});
 await page.locator('.agent-user-message').filter({hasText:text}).scrollIntoViewIfNeeded();
 await page.screenshot({path:out+'/03-overall-submission.png'});
 check('无页面脚本错误',!errors.length);
 await fs.writeFile(out+'/browser-checks.json',JSON.stringify({checks,errors},null,2)+'\n');
}finally{await browser.close();}
