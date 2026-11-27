import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
const base=process.env.DEMO_BASE_URL || 'https://coursewareagent.chenjialing.cn';
const output=process.env.DEMO_CHECK_OUTPUT || '/tmp/courseware-permission-checks';
await mkdir(output,{recursive:true});
const browser=await chromium.launch();
const results=[];
async function page(width=1393,grants){
 const p=await browser.newPage({viewport:{width,height:985}});
 if(process.env.DEMO_BUILD_DIR)await p.route(base+'/**',async route=>{
  const pathname=new URL(route.request().url()).pathname;
  const file=path.resolve(process.env.DEMO_BUILD_DIR,'.'+(pathname==='/'?'/index.html':pathname));
  assert(file.startsWith(path.resolve(process.env.DEMO_BUILD_DIR)+path.sep));
  const ext=path.extname(file);const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'}[ext]||'application/octet-stream';
  try{await route.fulfill({body:await readFile(file),contentType:type})}catch{await route.fulfill({status:404,body:'Not found'})}
 });
 if(grants)await p.addInitScript(value=>{window.__COURSEWARE_FEATURE_ACCESS__=value},grants);
 return p;
}
try{
 await Promise.all([1393,745].flatMap(width=>['slow-on','slow-off'].map(async mode=>{
  const p=await page(width);await p.goto(base+'/?demoVideoAccess='+mode);
  await p.locator('.vc-format-skeleton').waitFor();
  const before=await p.locator('.agent-welcome-hero').boundingBox();
  const inputBefore=await p.locator('.agent-chat-input-shell').boundingBox();
  const robotBefore=await p.locator('.agent-welcome-robot-anchor').boundingBox();
  assert.equal(await p.getByRole('button',{name:'视频互动课件',exact:true}).count(),0);
  assert(await p.getByRole('button',{name:'一键同款',exact:true}).first().isDisabled());
  assert(await p.locator('[data-inspiration-region] button').filter({hasText:'试玩一下'}).first().isEnabled());
  const color=await p.evaluate(()=>{const top=getComputedStyle(document.querySelector('.vc-format-skeleton')),bottom=getComputedStyle(document.querySelector('.agent-home-prompt-row'),'::after');return {top:top.backgroundColor,bottom:bottom.backgroundImage,a:top.opacity,b:bottom.opacity}});
  assert(color.bottom.includes(color.top));assert(Math.abs(Number(color.a)-Number(color.b))<.01);
  await p.locator('textarea').waitFor({state:'visible',timeout:10000});
  assert.deepEqual(await p.locator('.agent-welcome-hero').boundingBox(),before);
  assert.deepEqual(await p.locator('.agent-chat-input-shell').boundingBox(),inputBefore);
  assert.deepEqual(await p.locator('.agent-welcome-robot-anchor').boundingBox(),robotBefore);
  assert.equal(await p.getByRole('button',{name:'视频互动课件',exact:true}).count(),mode==='slow-on'?1:0);
  if(mode==='slow-off')assert.equal(await p.locator('.vc-format-description').innerText(),'互动课件：知识点游戏、知识讲解、演示教具、空间展示、课堂气氛...');
  assert(await p.getByRole('button',{name:'一键同款',exact:true}).first().isEnabled());
  await p.locator('.agent-welcome-robot').evaluate(i=>i.decode());
  await p.locator('.agent-welcome-hero').screenshot({path:path.join(output,`${width}-${mode}.png`)});
  results.push({width,mode,height:before.height,passed:true});await p.close();
 })));
 const real=await page(1393,{videoCourseware:false});await real.goto(base+'/?demoVideoAccess=slow-on');await real.locator('.vc-format-description').waitFor();assert.equal(await real.locator('.vc-format-skeleton').count(),0);assert.equal(await real.getByRole('button',{name:'视频互动课件',exact:true}).count(),0);await real.close();results.push({name:'host grants take precedence over demo query',passed:true});
 const error=await page();await error.goto(base+'/?demoVideoAccess=error');await error.getByText('加载失败，请重试',{exact:true}).waitFor();await error.getByRole('button',{name:'重新加载',exact:true}).click();await error.locator('.vc-format-skeleton').waitFor();await error.getByRole('button',{name:'视频互动课件',exact:true}).waitFor();await error.close();results.push({name:'retry',passed:true});
 await writeFile(path.join(output,'checks.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser.close()}
