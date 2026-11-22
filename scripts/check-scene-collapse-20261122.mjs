import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
const out='docs/reviews/20261122-scene-collapse';
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


 const card=page.locator('.vc-result-scenes').last();
 const toggle=card.getByRole('button',{name:/视频互动课件 · .*个场景/});
 await expect(toggle).toHaveAttribute('aria-expanded','false');
 await expect(card.getByRole('region',{name:'按教学顺序排列的场景'})).toBeHidden();
 await card.screenshot({path:out+'/collapsed.png'});
 await toggle.focus();await page.keyboard.press('Enter');
 await expect(toggle).toHaveAttribute('aria-expanded','true');
 await expect(card.getByRole('region',{name:'按教学顺序排列的场景'})).toBeVisible();
 check('默认收起，键盘可展开全部场景',await card.locator('[data-delivery-scene]').count()===(await project()).segments.length);
 await card.screenshot({path:out+'/expanded.png'});
 await card.getByRole('button',{name:'修改',exact:true}).first().click();
 const modal=page.locator('.vc-scene-modal');
 await modal.getByLabel('场景名称',{exact:true}).fill('场景折叠验证');
 await modal.getByRole('button',{name:'保存',exact:true}).click();
 await expect(modal).toBeHidden();
 await toggle.click();
 await expect(card.getByText('1 个场景有待生成修改',{exact:true})).toBeVisible();
 await expect(card.getByRole('button',{name:'全部生成',exact:true})).toBeEnabled();
 await expect(card.getByRole('region',{name:'按教学顺序排列的场景'})).toBeHidden();
 check('收起后草稿数量和原生成入口仍可见',true);
 await card.screenshot({path:out+'/draft-collapsed.png'});
 await page.setViewportSize({width:1135,height:853});
 await card.screenshot({path:out+'/draft-collapsed-narrow.png'});
 await toggle.click();
 await expect(card.getByText('已保存修改',{exact:true})).toBeVisible();
 await card.getByRole('button',{name:'修改',exact:true}).first().click();
 await expect(modal.getByLabel('场景名称',{exact:true})).toHaveValue('场景折叠验证');
 await modal.getByRole('button',{name:'取消',exact:true}).click();
 await toggle.click();
 await card.getByRole('button',{name:'全部生成',exact:true}).click();
 await expect.poll(async()=>(await project()).revision,{timeout:30000}).toBe(2);
 await expect(page.locator('.vc-result-scenes').last().getByRole('button',{name:/视频互动课件 · .*个场景/})).toHaveAttribute('aria-expanded','false');
 const latest=await project();
 check('收起后可生成新版，草稿保留且上一版快照不变',latest.segments[0].title==='场景折叠验证'&&latest.resultMessages[0].snapshot.segments[0].title!=='场景折叠验证');
 check('无浏览器运行错误',errors.length===0);
 await fs.writeFile(out+'/checks.json',JSON.stringify({checks,errors},null,2));

}finally{await browser.close();}
