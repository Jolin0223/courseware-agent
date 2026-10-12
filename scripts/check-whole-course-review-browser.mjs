import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
const output='docs/reviews/20261012-whole-course';
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:960}});
const checks=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));
const check=(name,ok)=>{expect(ok,name).toBeTruthy();checks.push(name);console.log('PASS',name);};
async function state(){return page.evaluate(async()=>{
 const url=p=>performance.getEntriesByType('resource').find(e=>new URL(e.name).pathname===p)?.name||p;
 const {useConversationStore}=await import(url('/src/store/conversationStore.ts'));
 const {videoProjectForConversation}=await import(url('/src/store/videoCoursewareStore.ts'));
 return videoProjectForConversation(useConversationStore.getState().activeConversationId);
});}
async function edit(id,title){
 await page.locator('.vc-result-scenes').last().locator(`[data-delivery-scene="${id}"]`).getByRole('button',{name:'修改',exact:true}).click();
 await expect(page.getByRole('button',{name:'保存并开始生成',exact:true})).toHaveCount(0);
 await page.getByLabel('场景名称',{exact:true}).fill(title);
 await page.getByRole('button',{name:'保存',exact:true}).click();
 await expect(page.locator('.vc-scene-modal')).toHaveCount(0);
}
try{
 await page.goto('http://127.0.0.1:4186/wukong-demo');
 await page.getByRole('button',{name:/发送/}).click();
 const confirm=page.getByRole('button',{name:'确认需求，继续生成',exact:true});
 await expect(confirm).toBeEnabled({timeout:15000});
 await expect(page.locator('.agent-chat-input-area')).toHaveCount(0);
 check('首版前隐藏整个底部输入区域',true);
 await page.screenshot({path:`${output}/01-outline.png`});
 await confirm.click();
 const generate=page.getByRole('button',{name:'确认全部场景，生成课件',exact:true});
 await expect(generate).toBeVisible({timeout:30000});
 check('场景方案无封面缩略图',await page.locator('.of-scene img').count()===0);
 await page.locator('[data-scene-id="cover"]').getByRole('button',{name:'编辑',exact:true}).click();
 await expect(page.getByRole('button',{name:'保存并开始生成',exact:true})).toHaveCount(0);
 await page.getByLabel('场景名称',{exact:true}).fill('和悟空一起开始闯关');
 await page.screenshot({path:`${output}/02-scene-editor.png`});
 await page.getByRole('button',{name:'保存',exact:true}).click();
 let p=await state();
 check('首版场景保存不创建单场任务或交付',p.phase==='assets-review'&&!p.job&&!p.sceneJobs&&p.revision===0);
 await page.screenshot({path:`${output}/03-scene-plans.png`});
 await generate.click();
 await expect(page.getByText('生成整课',{exact:true})).toBeVisible();
 await expect(page.locator('.agent-chat-input-area')).toHaveCount(0);
 check('统一提交后无单场预览或单场生成',await page.locator('.vc-delivery-card').getByRole('button',{name:'预览',exact:true}).count()===0);
 await expect.poll(async()=>(await state()).revision,{timeout:35000}).toBe(1);
 await expect(page.locator('.agent-chat-input-area')).toBeVisible();
 p=await state();const before=structuredClone(p.resultMessages[0]);
 check('首版完成后显示输入框，整课一次性交付',p.resultMessages.length===1&&p.readySceneIds.length===12);
 check('场景列表没有Vn标签和缩略图',await page.locator('.vc-result-scenes .vc-scene-version, .vc-result-scenes img').count()===0);
 await expect(page.getByRole('button',{name:'一键同款',exact:true}).last()).toBeDisabled();
 await expect(page.getByRole('button',{name:'编辑资源',exact:true}).last()).toBeDisabled();
 await expect(page.getByRole('button',{name:'标注修改，敬请期待',exact:true})).toBeDisabled();
 check('三个暂不支持入口均禁用',true);
 await edit('cover','一起出发 · 已修改');
 await edit('learn','认识雨字家族 · 已修改');
 p=await state();
 check('连续保存两个场景汇入同一草稿，旧整课不变',p.courseDraft.sceneIds.length===2&&p.revision===1&&p.segments[0].title==='和悟空一起开始闯关'&&JSON.stringify(p.resultMessages[0])===JSON.stringify(before));
 await page.locator('.vc-course-draft').scrollIntoViewIfNeeded();
 await page.screenshot({path:`${output}/04-pending-changes.png`});
 await page.reload();
 await page.getByText(p.title,{exact:true}).first().click();
 await expect.poll(async()=>(await state())?.courseDraft?.sceneIds.length).toBe(2);
 check('刷新恢复两场修改草稿',true);
 // Restore this conversation if the app intentionally lands on home after reload.
 await page.getByRole('button',{name:'全部生成',exact:true}).click();
 await expect(page.getByRole('button',{name:'生成中…',exact:true})).toBeDisabled();
 await expect(page.locator('.agent-chat-input-area textarea').first()).toBeDisabled();
 p=await state();check('生成中保留旧版本且禁止重复提交',p.revision===1&&p.resultMessages.length===1&&p.courseDraft.status==='generating');
 await expect.poll(async()=>(await state()).revision,{timeout:18000}).toBe(2);
 p=await state();
 check('批量修改只产生一个整课版本',p.resultMessages.length===2&&!p.courseDraft&&p.segments.find(s=>s.id==='cover').title==='一起出发 · 已修改'&&p.segments.find(s=>s.id==='learn').title==='认识雨字家族 · 已修改');
 check('历史HTML和快照字节保持不变',JSON.stringify(p.resultMessages[0])===JSON.stringify(before));
 await page.setViewportSize({width:1135,height:853});
 await page.locator('.vc-result-scenes').last().scrollIntoViewIfNeeded();
 await page.screenshot({path:`${output}/05-result-1135.png`});
 await page.locator('.vc-result-scenes').last().locator('[data-delivery-scene="learn"]').getByRole('button',{name:'修改',exact:true}).click();
 check('重新编辑读取已生效的整课内容',await page.getByLabel('场景名称',{exact:true}).inputValue()==='认识雨字家族 · 已修改');
 await page.getByRole('button',{name:'取消',exact:true}).click();
 // Failure must preserve the delivered lesson and pending edits. Missing asset is a fixture, not a network request.
 await edit('learn','等待重试的修改');
 await page.evaluate(async()=>{
  const url=p=>performance.getEntriesByType('resource').find(e=>new URL(e.name).pathname===p)?.name||p;
  const {useVideoCoursewareStore:s}=await import(url('/src/store/videoCoursewareStore.ts'));
  const p=Object.values(s.getState().projects).find(p=>p.courseDraft);
  const draft=structuredClone(p.courseDraft);draft.snapshot.assets[0].url=undefined;
  s.getState().update(p.id,{courseDraft:draft});
 });
 await page.getByRole('button',{name:'全部生成',exact:true}).click();
 await expect.poll(async()=>(await state()).courseDraft?.status,{timeout:18000}).toBe('failed');
 p=await state();check('失败保留草稿和已交付版本',p.revision===2&&p.resultMessages.length===2&&p.courseDraft.snapshot.segments.find(s=>s.id==='learn').title==='等待重试的修改');
 await page.getByRole('button',{name:'放弃草稿',exact:true}).click();
 await page.getByRole('dialog',{name:'放弃整课草稿'}).getByRole('button',{name:'放弃草稿',exact:true}).click();
 check('可放弃未生成草稿，保留当前整课',!(await state()).courseDraft&&(await state()).revision===2);
 check('无页面脚本错误',errors.length===0);
 await fs.writeFile(`${output}/checks.json`,JSON.stringify({checks,errors},null,2)+'\n');
}finally{await browser.close();}
