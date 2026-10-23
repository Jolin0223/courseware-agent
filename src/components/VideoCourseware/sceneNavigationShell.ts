import { wukongTeacherToolsCSS, wukongTeacherToolsMarkup } from './wukongTeacherTools';

export interface CoursewareSceneNavigation {
  theme: 'wukong';
  scenes: Array<{ id: string; title: string }>;
  chapters: Array<{ title: string; sceneIds: string[] }>;
  navigateMessageType: string;
  activeMessageType: string;
}

/** Each lesson opts into its own teacher-tool design and navigation adapter. */
export function buildCoursewareShellHTML(
  lessonUrl: string,
  setupMessage: unknown,
  navigation?: CoursewareSceneNavigation,
  pauseMessageType = 'pause-video-courseware',
) {
  const safeUrl = lessonUrl.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const themedNavigation = navigation?.theme === 'wukong' ? navigation : undefined;
  const data = JSON.stringify({ setupMessage, navigation: themedNavigation, pauseMessageType }).replace(/</g, '\\u003c');
  const origin = JSON.stringify(location.origin);
  return `<!doctype html><html lang="zh-CN"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#0b1220}#canvas{position:absolute;left:50%;top:50%;width:1920px;height:1080px;overflow:hidden;transform:translate(-50%,-50%) scale(var(--canvas-scale,0));background:#000}#lesson{position:absolute;inset:0;display:block;width:100%;height:100%;border:0}
    ${themedNavigation ? wukongTeacherToolsCSS : ''}
  </style></head><body><div id="canvas"><iframe id="lesson" title="互动课件" src="${safeUrl}" allow="autoplay; fullscreen"></iframe>${themedNavigation ? wukongTeacherToolsMarkup : ''}</div><script>
    const config=${data},origin=${origin},frame=document.getElementById('lesson'),root=document.getElementById('teacher-tools'),trigger=document.getElementById('tools-trigger'),shade=document.getElementById('tools-shade'),list=document.getElementById('tools-list'),nav=config.navigation;
    const resizeCanvas=()=>document.getElementById('canvas').style.setProperty('--canvas-scale',Math.min(innerWidth/1920,innerHeight/1080));
    resizeCanvas();window.addEventListener('resize',resizeCanvas);
    let activeId=nav?.scenes?.[0]?.id;
    function closeTools(){shade.hidden=true;trigger.hidden=false;trigger.setAttribute('aria-expanded','false');trigger.focus()}
    function sync(){list.querySelectorAll('[data-id]').forEach(button=>{if(button.dataset.id===activeId)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current')})}
    if(nav?.scenes?.length>1){
      root.hidden=false;
      const seen=new Set();
      const addGroup=(title,ids)=>{
        const scenes=ids.map(id=>nav.scenes.find(scene=>scene.id===id)).filter(scene=>scene&&!seen.has(scene.id));if(!scenes.length)return;
        const group=document.createElement('section');group.className='tools-group';const heading=document.createElement('h2');heading.textContent=title;group.append(heading);const items=document.createElement('div');items.className='tools-scenes';group.append(items);
        for(const scene of scenes){seen.add(scene.id);const button=document.createElement('button');button.type='button';button.dataset.id=scene.id;button.textContent=scene.title;button.onclick=()=>{activeId=scene.id;sync();frame.contentWindow?.postMessage({type:nav.navigateMessageType,sceneId:scene.id},origin);closeTools()};items.append(button)}list.append(group);
      };
      for(const chapter of nav.chapters||[])addGroup(chapter.title,chapter.sceneIds);
      addGroup('其他教学环节',nav.scenes.map(scene=>scene.id));sync();
      let drag=null,suppressClick=false;
      trigger.addEventListener('pointerdown',event=>{
        if(event.button!==0)return;
        const canvas=document.getElementById('canvas').getBoundingClientRect();
        drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:trigger.offsetLeft,top:trigger.offsetTop,scale:canvas.width/1920,moved:false};
        suppressClick=false;trigger.setPointerCapture(event.pointerId);
      });
      trigger.addEventListener('pointermove',event=>{
        if(!drag||event.pointerId!==drag.id)return;
        const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
        if(!drag.moved&&Math.hypot(dx,dy)<5)return;
        drag.moved=true;event.preventDefault();
        trigger.style.left=Math.max(8,Math.min(1920-trigger.offsetWidth-8,drag.left+dx/drag.scale))+'px';
        trigger.style.top=Math.max(8,Math.min(1080-trigger.offsetHeight-8,drag.top+dy/drag.scale))+'px';trigger.style.bottom='auto';
      });
      const finishDrag=event=>{if(!drag||event.pointerId!==drag.id)return;suppressClick=drag.moved;drag=null;if(trigger.hasPointerCapture(event.pointerId))trigger.releasePointerCapture(event.pointerId)};
      trigger.addEventListener('pointerup',finishDrag);trigger.addEventListener('pointercancel',finishDrag);
      trigger.addEventListener('lostpointercapture',()=>{if(drag){suppressClick=drag.moved;drag=null}});
      trigger.onclick=(event)=>{if(suppressClick&&event.detail!==0){suppressClick=false;return;}suppressClick=false;
        const panel=document.getElementById('tools-panel');panel.style.left=Math.max(16,Math.min(1920-960-16,trigger.offsetLeft))+'px';panel.style.top=Math.max(16,Math.min(1080-540-16,trigger.offsetTop-540-12))+'px';panel.style.bottom='auto';trigger.hidden=true;shade.hidden=false;trigger.setAttribute('aria-expanded','true');const selected=list.querySelector('[aria-current="step"]');selected?.scrollIntoView({block:'nearest'});(selected||document.getElementById('tools-close')).focus()};
      document.getElementById('tools-close').onclick=closeTools;
      document.addEventListener('keydown',event=>{
        if(shade.hidden)return;
        if(event.key==='Escape'){event.preventDefault();closeTools()}
      });
    }
    frame.addEventListener('load',()=>frame.contentWindow?.postMessage(config.setupMessage,origin));
    window.addEventListener('message',event=>{
      if(event.origin!==origin)return;
      if(nav&&event.source===frame.contentWindow&&event.data?.type===nav.activeMessageType&&nav.scenes.some(scene=>scene.id===event.data.sceneId)){activeId=event.data.sceneId;sync();return}
      if(event.source===parent&&event.data?.type==='pause-video-courseware')frame.contentWindow?.postMessage({type:config.pauseMessageType},origin);
    });
  </script></body></html>`;
}
