import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
const output='docs/reviews/20261012-scene-content-types';
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1355,height:984}});
const checks=[],errors=[],metrics={};
page.on('pageerror',e=>errors.push(e.message));
const check=(name,ok=true)=>{expect(ok,name).toBeTruthy();checks.push(name);console.log('PASS',name);};
async function project(){return page.evaluate(async()=>{
 const url=p=>performance.getEntriesByType('resource').find(e=>new URL(e.name).pathname===p)?.name||p;
 const {useConversationStore:c}=await import(url('/src/store/conversationStore.ts'));
 const {videoProjectForConversation}=await import(url('/src/store/videoCoursewareStore.ts'));
 return videoProjectForConversation(c.getState().activeConversationId);
});}
async function tick(){await page.evaluate(async()=>{
 const url=p=>performance.getEntriesByType('resource').find(e=>new URL(e.name).pathname===p)?.name||p;
 const {useVideoCoursewareStore:s}=await import(url('/src/store/videoCoursewareStore.ts'));
 const {advanceVideoJobs}=await import(url('/src/components/VideoCourseware/workflow.ts'));
 const job=Object.values(s.getState().projects).find(p=>p.job)?.job;
 if(job)advanceVideoJobs(job.start+job.duration+100);
});}
async function editScene(id){await page.locator(`.of-scene[data-scene-id="${id}"]`).getByRole('button',{name:'编辑',exact:true}).click();}
const save=()=>page.getByRole('button',{name:'保存',exact:true}).click();
const shell=()=>page.frameLocator('iframe[title$="默认预览"]');
async function dimensions(frame){return frame.locator('#teacher-tools').evaluate(root=>{
 const r=root.getBoundingClientRect(),p=document.getElementById('tools-panel').getBoundingClientRect(),t=document.getElementById('tools-trigger').getBoundingClientRect();
 return {rootWidth:r.width,rootHeight:r.height,panelWidth:p.width,panelHeight:p.height,buttonWidth:t.width,buttonHeight:t.height,panelLogicalWidth:document.getElementById('tools-panel').offsetWidth,panelLogicalHeight:document.getElementById('tools-panel').offsetHeight};
});}
try{
 await page.goto('http://127.0.0.1:4186/wukong-demo');await page.getByRole('button',{name:/发送/}).click();
 await page.getByRole('button',{name:'确认需求，继续生成',exact:true}).click({timeout:15000});
 const generate=page.getByRole('button',{name:'确认全部场景，生成课件',exact:true});
 for(let i=0;i<5&&!await generate.isVisible();i++){await tick();await page.waitForTimeout(300);}
 await expect(generate).toBeVisible({timeout:20000});
 await expect(page.locator('.of-scene-description')).toHaveCount(0);
 await expect(page.locator('.of-scene-type-art')).toHaveCount(12);
 await expect.poll(()=>page.locator('.of-scene-type-art').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0))).toBe(true);
 const sources=await page.locator('.of-scene-type-art').evaluateAll(imgs=>[...new Set(imgs.map(i=>i.getAttribute('src')))]);
 check('场景列表无内容摘要，三种类型默认图全部加载',sources.length===3);
 await page.waitForTimeout(800);await page.locator('.of-scene-plan').screenshot({path:`${output}/01-scene-list.png`});
 const p0=await project(),video=p0.segments.find(s=>s.kind==='video'),mixed=p0.segments.find(s=>s.kind==='mixed');
 await editScene('cover');
 await expect(page.getByRole('heading',{name:'本场景互动内容',exact:true})).toBeVisible();
 await expect(page.locator('.se-shot')).toHaveCount(0);
 await expect(page.locator('.se-section-note')).toContainText('AI 生成的本场景 H5 页面');
 await page.getByLabel('本场景互动内容',{exact:true}).fill('展示悟空主题；点击开始闯关按钮后进入故事，答对时显示星星反馈。');
 await page.screenshot({path:`${output}/02-interactive-editor.png`});await save();
 check('纯互动只有互动内容模块，描述可编辑保存', (await project()).segments.find(s=>s.id==='cover').content.includes('星星反馈'));
 await page.setViewportSize({width:1010,height:853});
 await editScene(video.id);
 await expect(page.locator('.se-interaction')).toHaveCount(0);
 await expect(page.getByRole('heading',{name:'本场景视频内容',exact:true})).toBeVisible();
 await expect(page.getByLabel('视频画面描述提示词 01',{exact:true})).toBeVisible();
 await page.screenshot({path:`${output}/03-video-editor.png`});
 await page.getByRole('button',{name:'取消',exact:true}).click();
 check('纯视频没有场景内容模块，单段显示本场景视频内容');
 // Add a second video to exercise independent controls without changing the demo fixture.
 await page.evaluate(async id=>{
  const url=p=>performance.getEntriesByType('resource').find(e=>new URL(e.name).pathname===p)?.name||p;
  const {useVideoCoursewareStore:s}=await import(url('/src/store/videoCoursewareStore.ts'));
  const {buildVideoShots}=await import(url('/src/data/videoCourseware/planning.ts'));
  const p=Object.values(s.getState().projects).find(p=>p.phase==='assets-review');
  const asset=p.assets.find(a=>a.kind==='video'&&a.segmentIds.includes(id));
  const first=p.shots.find(s=>s.videoAssetId===asset.id);
  const extra={...asset,id:asset.id+'-second',name:'第二段视频'};
  const next={...p,assets:[...p.assets,extra],segments:p.segments.map(s=>s.id===id?{...s,content:''}:s),shots:[...p.shots,{...first,id:extra.id,videoAssetId:extra.id,prompt:'第二段视频独立提示词',firstFrameId:undefined,lastFrameId:undefined,audioCues:[],audioIds:[],sourceKey:''}]};
  s.getState().update(p.id,{assets:next.assets,segments:next.segments,shots:buildVideoShots(next)});
 },video.id);
 const beforeMulti=await project(),firstBefore=beforeMulti.shots.find(s=>s.segmentId===video.id);
 await editScene(video.id);
 await expect(page.getByRole('heading',{name:'本场景视频内容01',exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:'本场景视频内容02',exact:true})).toHaveCount(1);
 await page.getByLabel('视频画面描述提示词 01',{exact:true}).fill('第一段：固定镜头，悟空站在火焰山前。');
 const second=page.locator('.se-shot').nth(1);
 await page.getByLabel('视频画面描述提示词 02',{exact:true}).fill('第二段：镜头缓慢推进，展示前进方向。');
 await second.locator('.se-frame').nth(0).click();await page.locator('.se-picker-item').first().click();
 await second.locator('.se-frame').nth(1).click();await page.locator('.se-picker-item').nth(1).click();
 await second.getByRole('button',{name:'添加配音',exact:true}).click();await page.locator('.se-picker-item').first().click();
 await expect(second.locator('.se-cue')).toHaveCount(1);
 await second.getByRole('button',{name:/移除本视频配音/}).click();await expect(second.locator('.se-cue')).toHaveCount(0);
 await second.getByRole('button',{name:'添加配音',exact:true}).click();await page.locator('.se-picker-item').first().click();
 await expect(page.getByLabel('视频画面描述提示词 02',{exact:true})).toHaveValue('第二段：镜头缓慢推进，展示前进方向。');
 await page.screenshot({path:`${output}/04-multiple-video-config.png`});
 await expect(page.getByRole('button',{name:'保存',exact:true})).toBeEnabled();await save();
 const multi=(await project()).shots.filter(s=>s.segmentId===video.id);
 check('多个视频按01/02编号，各自提示词、首尾帧、配音独立保存',multi.length===2&&multi[0].prompt.startsWith('第一段')&&multi[1].prompt.startsWith('第二段')&&multi[1].firstFrameId&&multi[1].lastFrameId&&multi[1].audioCues.length===1&&JSON.stringify(multi[0].audioCues)===JSON.stringify(firstBefore.audioCues)&&multi[0].firstFrameId===firstBefore.firstFrameId);
 check('纯视频旧内容字段为空也可保存，不增加隐形填写要求',(await project()).segments.find(s=>s.id===video.id).content==='');
 const mixedBefore=(await project()).shots.find(s=>s.segmentId===mixed.id);
 await editScene(mixed.id);
 await expect(page.getByRole('heading',{name:'本场景互动内容',exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:'本场景视频内容',exact:true})).toBeVisible();
 await page.getByLabel('本场景互动内容',{exact:true}).fill('视频结束后显示三张任务卡，点击任务卡展开说明；点击出发继续。');
 await page.screenshot({path:`${output}/05-mixed-editor.png`});await save();
 check('视频加互动显示两个模块，修改互动描述保留视频提示词',(await project()).shots.find(s=>s.segmentId===mixed.id).prompt===mixedBefore.prompt);
 const p=await project();await page.reload();await page.getByText(p.title,{exact:true}).first().click();
 await expect(generate).toBeEnabled();await editScene(video.id);
 await expect(page.getByLabel('视频画面描述提示词 02',{exact:true})).toHaveValue(/第二段：/);
 await expect(page.locator('.se-interaction')).toHaveCount(0);await page.getByRole('button',{name:'取消',exact:true}).click();
 check('刷新后多视频配置与类型模块保持一致');
 await generate.click();for(let i=0;i<5&&(await project()).revision===0;i++){await tick();await page.waitForTimeout(400);}
 await expect.poll(async()=>(await project()).revision,{timeout:25000}).toBe(1);
 check('三种类型均可统一生成整课');
 await page.setViewportSize({width:1132,height:853});
 await expect(shell().getByRole('button',{name:'打开教师工具',exact:true})).toBeVisible();
 metrics.previewTrigger=await dimensions(shell());
 check('教师工具按钮随1920画布等比缩放',Math.abs(metrics.previewTrigger.buttonWidth/metrics.previewTrigger.rootWidth-184/1920)<.001);
 await page.screenshot({path:`${output}/06-scaled-teacher-trigger.png`});
 await shell().getByRole('button',{name:'打开教师工具',exact:true}).click();
 metrics.previewPanel=await dimensions(shell());
 check('展开工具为画布一半宽一半高，占四分之一面积',metrics.previewPanel.panelLogicalWidth===960&&metrics.previewPanel.panelLogicalHeight===540&&Math.abs(metrics.previewPanel.panelWidth/metrics.previewPanel.rootWidth-.5)<.001&&Math.abs(metrics.previewPanel.panelHeight/metrics.previewPanel.rootHeight-.5)<.001);
 await page.screenshot({path:`${output}/07-teacher-quarter-area.png`});
 await shell().locator('[data-id="learn"]').click();await expect(shell().frameLocator('#lesson').locator('#stage')).toHaveAttribute('data-phase','learn');
 check('缩放后教师工具仍可切换真实教学环节');
 await page.setViewportSize({width:1920,height:1128});await page.getByRole('button',{name:'全屏预览并测试',exact:true}).click();
 const full=page.frameLocator('iframe[title$="全屏预览"]');await full.getByRole('button',{name:'打开教师工具',exact:true}).click();
 await page.waitForTimeout(1100);metrics.fullPanel=await dimensions(full);
 check('原尺寸画布中工具面板为960×540',Math.abs(metrics.fullPanel.rootWidth-1920)<2&&Math.abs(metrics.fullPanel.panelWidth-960)<2&&Math.abs(metrics.fullPanel.panelHeight-540)<2);
 await page.screenshot({path:`${output}/08-teacher-full-canvas.png`});
 await page.keyboard.press('Escape');await expect(full.getByRole('button',{name:'打开教师工具',exact:true})).toBeVisible();
 check('无页面脚本错误',errors.length===0);
 await fs.writeFile(`${output}/checks.json`,JSON.stringify({checks,metrics,errors},null,2)+'\n');
}catch(e){await page.screenshot({path:`${output}/failure.png`});throw e;}finally{await browser.close();}
