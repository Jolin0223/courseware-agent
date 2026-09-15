import {chromium} from 'playwright';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({headless:true}),page=await browser.newPage({reducedMotion:'reduce'}),checks=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));
const check=(name,ok)=>{checks.push({name,passed:!!ok});console.log(ok?'PASS':'FAIL',name);if(!ok)throw Error(name);};
const replacement='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL2kAAAAASUVORK5CYII=';
const config={openingVersion:'v33',sceneOrder:['learn','trace','quiz1','quiz2'],sceneAssetOverrides:{learn:{'assets/images/v3/G01_cave_daylight.png':replacement},quiz1:{'assets/images/v20/A01.png':replacement}},assetOverrides:{}};
try{
 await page.route('**/scope-check',route=>route.fulfill({contentType:'text/html',body:`<iframe style="width:960px;height:600px" src="/wukong/lesson-v5.html?studio=1&scene=learn&openingVersion=v33&sceneOrder=learn,trace,quiz1,quiz2"></iframe><script>const f=document.querySelector('iframe');f.onload=()=>f.contentWindow.postMessage({type:'wukong-studio-config',composition:${JSON.stringify(config)}},location.origin)</script>`}));
 await page.goto('http://127.0.0.1:4186/scope-check');const frame=page.frameLocator('iframe');
 await frame.locator('.backdrop').evaluate((el,url)=>new Promise(resolve=>{const t=setInterval(()=>{if(el.getAttribute('src')===url){clearInterval(t);resolve();}},50)}),replacement);
 check('selected scene uses scoped image replacement',await frame.locator('.backdrop').getAttribute('src')===replacement);
 await frame.locator('#toTrace').click();await page.waitForTimeout(250);
 check('next scene restores original shared image',await frame.locator('.backdrop').getAttribute('src')==='assets/images/v3/G01_cave_daylight.png');
 await page.locator('iframe').evaluate(el=>el.src='/wukong/lesson-v5.html?studio=1&scene=quiz1&openingVersion=v33&sceneOrder=learn,trace,quiz1,quiz2');await frame.locator('.option').first().waitFor();
 await page.waitForTimeout(250);
 check('scoped image also updates CSS artwork',await frame.locator('.option').first().evaluate(el=>getComputedStyle(el,'::before').backgroundImage.includes('data:image/png')));
 await frame.locator('[data-answer="0"]').click();await frame.locator('#nextQuiz').click();await page.waitForTimeout(600);
 check('quiz transition clears previous scene CSS override',await frame.locator('.option').first().evaluate(el=>!getComputedStyle(el,'::before').backgroundImage.includes('data:image/png')));
 await page.evaluate(()=>document.querySelector('iframe').contentWindow.postMessage({type:'wukong-studio-config',composition:{openingVersion:'v33',assetOverrides:{}}},location.origin));await page.waitForTimeout(100);
 check('legacy configuration without scoped assets retains original images',await frame.locator('.backdrop').getAttribute('src')==='assets/images/v3/G01_cave_daylight.png');
 check('no runtime errors',errors.length===0);writeFileSync('docs/scene-runtime-scope-check.json',JSON.stringify({checks,errors},null,2)+'\n');
}finally{await browser.close();}
