import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
const out='docs/reviews/20261123-scene-submission';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1920,height:1080}}),checks=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));
const check=(name,ok)=>{expect(ok,name).toBeTruthy();checks.push(name);console.log('PASS',name);};
try{
 await page.goto(process.env.DEMO_URL||'http://127.0.0.1:4191/');
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
 const card=page.locator('.vc-result-scenes').last();await card.getByRole('button',{name:/视频互动课件 · .*个场景/}).click();
 const modal=page.locator('.vc-scene-modal');
 for(const [index,title] of [[0,'场景一修改后的名称'],[2,'场景三修改后的名称']]){
  await card.getByRole('button',{name:'修改',exact:true}).nth(index).click();await modal.getByLabel('场景名称',{exact:true}).fill(title);await modal.getByRole('button',{name:'保存',exact:true}).click();
 }
 await card.getByRole('button',{name:'修改',exact:true}).nth(1).click();await modal.getByLabel('场景名称',{exact:true}).fill('未保存的修改');await modal.getByRole('button',{name:'取消',exact:true}).click();
 await expect(page.locator('.vc-scene-submission')).toHaveCount(0);check('保存草稿和取消未保存修改均不新增提交消息',true);
 await card.getByRole('button',{name:'全部生成',exact:true}).click();
 const summary=page.locator('.vc-scene-submission');await expect(summary).toHaveCount(1);
 await expect(summary).toContainText('场景1「场景一修改后的名称」');await expect(summary).toContainText('场景3「场景三修改后的名称」');await expect(summary).not.toContainText('未保存的修改');
 const submitted=(await project()).submittedEdits.at(-1),messageId=submitted.message.id;
 const sequence=await page.evaluate(async id=>{const u=performance.getEntriesByType('resource').find(e=>new URL(e.name).pathname==='/src/store/conversationStore.ts').name;return(await import(u)).useConversationStore.getState().conversations.find(c=>'video-'+c.id===id).messages.map(m=>({id:m.id,type:m.type}));},id);
 expect(sequence.at(-2).id).toBe(messageId);expect(sequence.at(-1).type).toBe('video-courseware-workflow');check('仅包含实际提交的场景，摘要在系统处理消息之前',true);
 const repeated=await page.evaluate(async id=>{const u=performance.getEntriesByType('resource').find(e=>new URL(e.name).pathname==='/src/components/VideoCourseware/courseDraftActions.ts').name;return(await import(u)).startCourseDraft(id);},id);expect(repeated).toBe(false);await expect(summary).toHaveCount(1);check('重复提交不新增消息',true);
 await page.evaluate(async id=>{const u=performance.getEntriesByType('resource').find(e=>new URL(e.name).pathname==='/src/store/videoCoursewareStore.ts').name;const s=(await import(u)).useVideoCoursewareStore;const p=s.getState().projects[id];s.getState().update(id,{courseDraft:{...p.courseDraft,status:'failed',error:'本次生成失败，请重试。'}});},id);
 await expect(summary.getByRole('status')).toHaveText('生成失败，可重试');
 await summary.getByText('查看本次修改',{exact:true}).click();
 await summary.getByRole('button',{name:'提交方案',exact:true}).first().click();await expect(modal.getByLabel('场景名称',{exact:true})).toHaveValue('场景一修改后的名称');await expect(modal.getByLabel('场景名称',{exact:true})).toHaveAttribute('readonly','');await modal.getByRole('button',{name:'关闭',exact:true}).click();
 await summary.getByRole('button',{name:'修改前',exact:true}).first().click();await expect(modal.getByLabel('场景名称',{exact:true})).not.toHaveValue('场景一修改后的名称');await modal.getByRole('button',{name:'关闭',exact:true}).click();check('可查看提交快照与修改前方案，均为只读',true);
 await summary.screenshot({path:out+'/submission-details.png',animations:'disabled'});
 await page.reload();await page.locator('.chat-history-shell').getByText((await project()).title,{exact:true}).first().click();await expect(page.getByRole('status',{name:'正在加载会话'})).toBeHidden({timeout:5000});
 await expect(summary).toHaveCount(1);await expect(summary.getByRole('status')).toHaveText('生成失败，可重试');check('失败和刷新保留摘要及失败状态',true);
 await page.getByRole('button',{name:'重新生成视频互动课件',exact:true}).click();await expect(summary).toHaveCount(1);expect((await project()).courseDraft.messageId).toBe(messageId);
 await summary.screenshot({path:out+'/submission.png',animations:'disabled'});
 await expect.poll(async()=>(await project()).revision,{timeout:30000}).toBe(2);expect((await project()).resultMessages.at(-1).sourceMessageId).toBe(messageId);check('重试复用原提交消息，成功结果与摘要关联',true);
 await page.evaluate(async id=>{const u=performance.getEntriesByType('resource').find(e=>new URL(e.name).pathname==='/src/store/videoCoursewareStore.ts').name;const s=(await import(u)).useVideoCoursewareStore,p=s.getState().projects[id];s.getState().update(id,{segments:p.segments.map((x,i)=>i===0?{...x,title:'后续又改名'}:x)});},id);
 await expect(summary).toContainText('场景一修改后的名称');await expect(summary).not.toContainText('后续又改名');check('历史摘要不随后续改名变化',true);
 await page.getByRole('button',{name:'撤回',exact:true}).click();await expect(summary).toHaveCount(0);expect((await project()).revision).toBe(1);check('第73条撤回仍可恢复上一版',true);
 check('无页面运行错误',errors.length===0);await fs.writeFile(out+'/checks.json',JSON.stringify({checks,errors},null,2));
}finally{await browser.close();}
