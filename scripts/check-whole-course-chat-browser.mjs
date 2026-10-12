import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1135,height:853}}),checks=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));
const check=(name,ok)=>{expect(ok,name).toBeTruthy();checks.push(name);console.log('PASS',name);};
try{
 await page.goto('http://127.0.0.1:4186/');
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
 const shell=page.locator('.agent-chat-input-shell').last();
 await shell.getByRole('button',{name:'选择场景修改',exact:true}).click();
 await shell.getByRole('button',{name:/石头后面的雨字/}).click();
 await shell.getByPlaceholder('填写这个场景的修改意见',{exact:true}).fill('雨字的提示字号放大一些');
 await page.getByRole('button',{name:/发送，/}).last().click();
 await expect(page.locator('.vc-course-draft')).toBeAttached();
 let p=await project();check('聊天场景修改进入草稿且不自动生成',p.revision===1&&p.courseDraft.sceneIds.length===1&&p.courseDraft.status==='draft');
 await page.locator('.vc-course-draft').scrollIntoViewIfNeeded();
 await page.screenshot({path:'docs/reviews/20261012-whole-course/06-chat-draft-1135.png'});
 await page.getByRole('button',{name:'全部生成',exact:true}).click();
 await expect.poll(async()=>(await project()).revision,{timeout:16000}).toBe(2);
 check('聊天修改统一生成整课成功',!(await project()).courseDraft);
 await page.getByRole('button',{name:'一键同款',exact:true}).last().scrollIntoViewIfNeeded();
 await page.screenshot({path:'docs/reviews/20261012-whole-course/07-disabled-actions.png'});
 await page.getByRole('button',{name:'全屏预览并测试',exact:true}).click();
 await expect(page.getByRole('button',{name:'编辑资源，敬请期待',exact:true})).toBeDisabled();
 check('全屏也不能绕过资源编辑禁用',true);
 await page.getByRole('button',{name:'退出全屏',exact:true}).click();
 await page.evaluate(async()=>{
  const url=p=>performance.getEntriesByType('resource').find(e=>new URL(e.name).pathname===p)?.name||p;
  const {useUIStore}=await import(url('/src/store/uiStore.ts'));
  const {useConversationStore}=await import(url('/src/store/conversationStore.ts'));
  useConversationStore.getState().setActiveConversation('conv_1');useUIStore.getState().openPreview(1);
 });
 await expect(page.getByRole('button',{name:'标注修改',exact:true})).toBeEnabled();
 await expect(page.getByRole('button',{name:'一键同款',exact:true}).last()).toBeEnabled();
 check('普通H5仍可标注与一键同款',true);
 check('无页面脚本错误',!errors.length);
 await fs.writeFile('docs/reviews/20261012-whole-course/chat-checks.json',JSON.stringify({checks,errors},null,2)+'\n');
}finally{await browser.close();}
