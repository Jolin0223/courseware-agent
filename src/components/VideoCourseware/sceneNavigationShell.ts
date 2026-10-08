export interface CoursewareSceneNavigation {
  scenes: Array<{ id: string; title: string }>;
  chapters: Array<{ title: string; sceneIds: string[] }>;
  navigateMessageType: string;
  activeMessageType: string;
}

/** A courseware opts in by providing its scene map and a small postMessage adapter. */
export function buildCoursewareShellHTML(
  lessonUrl: string,
  setupMessage: unknown,
  navigation?: CoursewareSceneNavigation,
  pauseMessageType = 'pause-video-courseware',
) {
  const safeUrl = lessonUrl.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const data = JSON.stringify({ setupMessage, navigation, pauseMessageType }).replace(/</g, '\\u003c');
  const origin = JSON.stringify(location.origin);
  return `<!doctype html><html lang="zh-CN"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;font-family:system-ui,-apple-system,"PingFang SC",sans-serif;background:#0b1220}button{font:inherit}#canvas{position:absolute;left:50%;top:50%;width:1920px;height:1080px;overflow:hidden;transform:translate(-50%,-50%) scale(var(--canvas-scale,0));background:#000}#lesson{position:absolute;inset:0;display:block;width:100%;height:100%;border:0}
    #nav-tab{position:absolute;z-index:5;left:0;top:50%;transform:translateY(-50%);width:60px;height:88px;border:1px solid rgba(255,255,255,.14);border-left:0;border-radius:0 11px 11px 0;background:rgba(15,23,42,.76);color:#fff;box-shadow:0 8px 24px rgba(10,17,30,.24);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);cursor:pointer;display:grid;place-items:center;opacity:.82;transition:opacity .18s,background .18s}#nav-tab:hover,#nav-tab:focus-visible{opacity:1;background:rgba(15,23,42,.92)}#nav-tab:focus-visible,#nav-close:focus-visible,#nav-list button:focus-visible{outline:2px solid #93c5fd;outline-offset:-2px}#nav-tab[hidden],#nav-panel[hidden]{display:none}
    #nav-panel{position:absolute;z-index:6;left:12px;top:50%;transform:translateY(-50%);width:440px;height:1008px;display:flex;flex-direction:column;border:1px solid rgba(255,255,255,.16);border-radius:14px;background:rgba(15,23,42,.88);color:#f8fafc;box-shadow:0 20px 48px rgba(6,14,27,.42);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);overflow:hidden}#nav-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:22px 26px;border-bottom:1px solid rgba(255,255,255,.12);color:#f8fafc;font-size:26px;font-weight:650}#nav-close{width:52px;height:52px;border:0;border-radius:7px;background:transparent;color:#cbd5e1;cursor:pointer;font-size:40px;line-height:1}#nav-close:hover{background:rgba(255,255,255,.12)}#nav-list{min-height:0;flex:1;padding:16px;overflow:auto;scrollbar-color:#64748b transparent}#nav-list h2{margin:22px 12px 10px;color:#94a3b8;font-size:22px;font-weight:600}#nav-list button{display:flex;align-items:center;gap:8px;width:100%;min-height:64px;padding:14px 16px;border:0;border-radius:8px;background:transparent;color:#e2e8f0;text-align:left;font-size:24px;cursor:pointer}#nav-list button:hover{background:rgba(255,255,255,.1);color:#fff}#nav-list button[aria-current="page"]{background:rgba(96,165,250,.22);color:#fff;font-weight:650}#nav-list .number{flex:0 0 40px;color:#94a3b8;font-size:20px}#nav-list button[aria-current="page"] .number{color:#93c5fd}
  </style></head><body><div id="canvas"><iframe id="lesson" title="互动课件" src="${safeUrl}" allow="autoplay; fullscreen"></iframe><button id="nav-tab" type="button" aria-label="打开场景目录" aria-expanded="false" aria-controls="nav-panel" hidden><svg width="32" height="32" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 4h7M6 8h7M6 12h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="3" cy="4" r="1" fill="currentColor"/><circle cx="3" cy="8" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/></svg></button><nav id="nav-panel" aria-label="场景目录" hidden><div id="nav-head"><span>场景目录</span><button id="nav-close" type="button" aria-label="关闭场景目录">×</button></div><div id="nav-list"></div></nav></div><script>
    const config=${data},origin=${origin},frame=document.getElementById('lesson'),tab=document.getElementById('nav-tab'),panel=document.getElementById('nav-panel'),list=document.getElementById('nav-list'),nav=config.navigation;
    const resizeCanvas=()=>document.getElementById('canvas').style.setProperty('--canvas-scale',Math.min(innerWidth/1920,innerHeight/1080));
    resizeCanvas();window.addEventListener('resize',resizeCanvas);
    let activeId=nav?.scenes?.[0]?.id;
    function closeNav(){panel.hidden=true;tab.hidden=!nav;tab.setAttribute('aria-expanded','false');tab.focus()}
    function sync(){list.querySelectorAll('[data-id]').forEach(button=>{if(button.dataset.id===activeId)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current')})}
    if(nav?.scenes?.length>1){
      tab.hidden=false;
      const seen=new Set();let index=0;
      const addScene=id=>{const scene=nav.scenes.find(item=>item.id===id);if(!scene||seen.has(id))return;seen.add(id);index++;const button=document.createElement('button');button.type='button';button.dataset.id=id;const number=document.createElement('span');number.className='number';number.textContent=String(index).padStart(2,'0');button.append(number,document.createTextNode(scene.title));button.onclick=()=>{activeId=id;sync();frame.contentWindow?.postMessage({type:nav.navigateMessageType,sceneId:id},origin);closeNav()};list.append(button)};
      for(const chapter of nav.chapters||[]){const ids=chapter.sceneIds.filter(id=>nav.scenes.some(scene=>scene.id===id)&&!seen.has(id));if(!ids.length)continue;const heading=document.createElement('h2');heading.textContent=chapter.title;list.append(heading);ids.forEach(addScene)}
      nav.scenes.forEach(scene=>addScene(scene.id));sync();
      tab.onclick=()=>{tab.hidden=true;panel.hidden=false;tab.setAttribute('aria-expanded','true');list.querySelector('[aria-current="page"]')?.focus()};document.getElementById('nav-close').onclick=closeNav;
      document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden)closeNav()});
    }
    frame.addEventListener('load',()=>frame.contentWindow?.postMessage(config.setupMessage,origin));
    window.addEventListener('message',event=>{
      if(event.origin!==origin)return;
      if(nav&&event.source===frame.contentWindow&&event.data?.type===nav.activeMessageType&&nav.scenes.some(scene=>scene.id===event.data.sceneId)){activeId=event.data.sceneId;sync();return}
      if(event.source===parent&&event.data?.type==='pause-video-courseware')frame.contentWindow?.postMessage({type:config.pauseMessageType},origin);
    });
  </script></body></html>`;
}
