import { useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ConfirmationDockContext } from './ConfirmationDockContext';
import { ArrowDown, ArrowUp, Check, ChevronDown, Play, GripVertical, Film, Gamepad2, Layers, ListOrdered, Loader2, PencilLine, Plus, X } from 'lucide-react';
import type { MediaAsset, OutlineChapter, VideoProject, VideoSegment, WorkflowStage } from '../../data/videoCourseware/model';
import { scenePreviewURL } from '../../data/videoCourseware/scenePreview';
import { outlineIssues } from '../../data/videoCourseware/outline';
import { sceneGenerationIssues } from '../../data/videoCourseware/sceneJobs';
import { videoPlanIssues } from '../../data/videoCourseware/planning';
import { useVideoCoursewareStore } from '../../store/videoCoursewareStore';
import { confirmOutline, confirmVideoPlan } from './workflow';
import { displayVoiceName } from '../../data/videoCourseware/voices';
import { AssetPreview, VideoModal } from './Shared';
import SceneEditor from './SceneEditor';
import ScenePreview from './ScenePreview';
import RequirementCard from '../Generator/RequirementCard';
import ImageGenerationPanelV2 from '../Generator/ImageGenerationPanelV2';
import AudioGenerationPanel from '../Generator/AudioGenerationPanel';
import SceneDeliveryCard from './SceneDeliveryCard';
import { handoffNestedScroll } from './nestedScroll';
import './outlineSceneFlow.css';

function Kind({kind}:{kind:VideoSegment['kind']}){return <span className={'vc-kind vc-kind-'+kind}>{kind==='h5'?<Gamepad2 size={13}/>:kind==='mixed'?<Layers size={13}/>:<Film size={13}/ >}{kind==='video'?'视频页面':kind==='mixed'?'视频＋互动页面':'互动页面'}</span>;}
function Controls({project}:{project:VideoProject}){
 const store=useVideoCoursewareStore();
 if(!project.job)return null;
 const stopped=['paused','failed'].includes(project.phase);
 if(!stopped)return null;
 return <div className="of-job-controls">{project.error&&<p role="alert">{project.error}</p>}<button className="vc-btn" onClick={()=>store.update(project.id,{phase:'plan',job:undefined,error:undefined})}>返回教学大纲</button>{!project.error?.includes('未接入')&&<button className="vc-btn" onClick={()=>store.resume(project.id)}>继续处理未完成内容</button>}</div>;
}
function Outline({project}:{project:VideoProject}){
 const confirmationDock=useContext(ConfirmationDockContext);
 const store=useVideoCoursewareStore(),readOnly=project.phase!=='plan';
 const [editing,setEditing]=useState<OutlineChapter|null>(null),[removing,setRemoving]=useState<string|null>(null);
 const removeTrigger=useRef<HTMLButtonElement|null>(null);
 const removePopover=useRef<HTMLDivElement|null>(null);
 const chapters=project.chapters||[];
 const [streamedChapterCount,setStreamedChapterCount]=useState(readOnly&&project.phase!=='planning'?chapters.length:0);
 const [streaming,setStreaming]=useState(!readOnly);
 useEffect(()=>{
  let count=0;
  const reset=window.setTimeout(()=>{
   if(readOnly){setStreaming(false);setStreamedChapterCount(project.phase==='planning'?0:chapters.length);return;}
   setStreaming(true);
   setStreamedChapterCount(0);
  },0);
  if(readOnly)return()=>window.clearTimeout(reset);
  const initialChapterCount=chapters.length;
  const timer=window.setInterval(()=>{count+=1;setStreamedChapterCount(Math.min(count,initialChapterCount));if(count>=initialChapterCount){window.clearInterval(timer);setStreaming(false);}},280);
  return()=>{window.clearTimeout(reset);window.clearInterval(timer);};
 },[project.id,project.phase,readOnly]);
 useEffect(()=>{
  if(!removing)return;
  const dismiss=(event:PointerEvent)=>{
   const target=event.target as Node;
   if(!removePopover.current?.contains(target)&&!removeTrigger.current?.contains(target))setRemoving(null);
  };
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){setRemoving(null);removeTrigger.current?.focus();}else if(['PageUp','PageDown','Home','End'].includes(event.key))setRemoving(null);};
  const close=()=>setRemoving(null);
  document.addEventListener('pointerdown',dismiss);
  document.addEventListener('keydown',escape);
  window.addEventListener('wheel',close,true);
  window.addEventListener('touchmove',close,true);
  window.addEventListener('resize',close);
  return()=>{document.removeEventListener('pointerdown',dismiss);document.removeEventListener('keydown',escape);window.removeEventListener('wheel',close,true);window.removeEventListener('touchmove',close,true);window.removeEventListener('resize',close);};
 },[removing]);
 const editingId=editing?.id;
 useEffect(()=>{
  if(!editingId)return;
  requestAnimationFrame(()=>requestAnimationFrame(()=>document.querySelector(`[data-chapter-id="${editingId}"]`)?.scrollIntoView({behavior:'smooth',block:'nearest'})));
 },[editingId]);
 const isStreaming=!readOnly&&streaming;
 const visibleChapters=isStreaming?chapters.slice(0,streamedChapterCount):chapters;
 const removeRect=removing?removeTrigger.current?.getBoundingClientRect():undefined;
 const removePopoverStyle=removeRect?{left:Math.max(12,Math.min(removeRect.right-320,window.innerWidth-332)),top:removeRect.bottom+124>window.innerHeight?Math.max(12,removeRect.top-116):removeRect.bottom+8}:undefined;
 const drag=useRef<{from:string;to:string;edge:'before'|'after';startY:number;active:boolean;x:number;y:number;list:HTMLElement|null;height:number}|null>(null);
 const dragFrame=useRef<number|undefined>(undefined);
 useEffect(()=>()=>{if(dragFrame.current!==undefined)cancelAnimationFrame(dragFrame.current);document.body.classList.remove('of-is-sorting');},[]);
 function clearDrag(){if(dragFrame.current!==undefined)cancelAnimationFrame(dragFrame.current);dragFrame.current=undefined;drag.current=null;document.body.classList.remove('of-is-sorting');setDragged(null);setOver(null);setDropEdge(null);setDragGhost(null);}
 function trackDrag(){const current=drag.current;if(!current?.active)return;
  if(current.list){const rect=current.list.getBoundingClientRect(),edge=54;if(current.y>rect.bottom-edge)current.list.scrollTop+=Math.max(5,(current.y-(rect.bottom-edge))*.32);else if(current.y<rect.top+edge)current.list.scrollTop-=Math.max(5,((rect.top+edge)-current.y)*.32);}
  const target=document.elementFromPoint(current.x,current.y)?.closest<HTMLElement>('[data-chapter-id]');if(target?.dataset.chapterId){const rect=target.getBoundingClientRect();current.to=target.dataset.chapterId;current.edge=current.y<rect.top+rect.height/2?'before':'after';setOver(current.to);setDropEdge(current.edge);}
  setDragGhost(previous=>previous?{...previous,y:current.y-current.height/2}:previous);
  dragFrame.current=requestAnimationFrame(trackDrag);
 }
 const [dragged,setDragged]=useState<string|null>(null),[over,setOver]=useState<string|null>(null),[dropEdge,setDropEdge]=useState<'before'|'after'|null>(null),[dragGhost,setDragGhost]=useState<{x:number;y:number;width:number;title:string}|null>(null),[announcement,setAnnouncement]=useState('');
 function finishDrag(){const current=drag.current;clearDrag();if(!current?.active||readOnly||editing)return;
  const next=[...chapters],from=next.findIndex(c=>c.id===current.from);let to=next.findIndex(c=>c.id===current.to);if(from<0||to<0)return;const [chapter]=next.splice(from,1);if(current.edge==='after')to+=1;if(from<to)to-=1;to=Math.max(0,Math.min(to,next.length));if(to===from)return;next.splice(to,0,chapter);store.update(project.id,{chapters:next});setAnnouncement(chapter.title+'已移至第 '+(to+1)+' 章');
 }
 function reorder(i:number,delta:number){const next=[...chapters];[next[i],next[i+delta]]=[next[i+delta],next[i]];store.update(project.id,{chapters:next});}
 function save(){if(!editing)return;store.update(project.id,{chapters:chapters.some(c=>c.id===editing.id)?chapters.map(c=>c.id===editing.id?editing:c):[...chapters,editing]});setEditing(null);}
 const editor=editing?<div className="vc-form of-chapter-editor"><label>章节名称<input autoFocus aria-label="章节名称" value={editing.title} onChange={e=>setEditing({...editing,title:e.target.value})}/></label><label>本章主要内容<textarea aria-label="本章主要内容" value={editing.content} placeholder="说明这一章要讲的知识、故事或任务。" onChange={e=>setEditing({...editing,content:e.target.value})}/></label><footer className="vc-actions"><button className="vc-btn" onClick={()=>setEditing(null)}>取消</button><button className="vc-btn primary" disabled={!editing.title.trim()||!editing.content.trim()} onClick={save}>保存章节</button></footer></div>:null;
 if(project.phase==='planning')return <section className="vc-card vc-progress"><header><h3><Loader2 className="vc-spin" size={17}/>正在整理教学大纲</h3></header><p>根据需求与材料，整理本课内容和章节顺序。</p></section>;
 const contents=<div className="vc-plan-body">
  <label className="vc-plan-goal">教学目标<textarea aria-label="教学目标" readOnly={readOnly} value={project.framework.userRequirement} onChange={e=>store.update(project.id,{framework:{...project.framework,userRequirement:e.target.value}})}/></label>
  <h4 className="of-outline-heading"><ListOrdered size={16}/>教学大纲</h4>
  <div><div className="vc-plan-summary vc-outline-summary"><span>{isStreaming?`正在输出第 ${Math.max(1,streamedChapterCount+1)} / ${chapters.length} 个章节`:chapters.length+' 个章节'}</span><span>{readOnly?'确认后规划视频与互动场景':isStreaming?'AI 正在整理教学流程…':'拖动左侧手柄调整顺序'}</span>{!readOnly&&<button className="vc-text-btn" disabled={Boolean(editing)||isStreaming} onClick={()=>setEditing({id:crypto.randomUUID(),title:'',content:'',segmentIds:[]})}><Plus size={14}/>添加章节</button>}</div>
  <div className="vc-segments vc-segments-compact" role="region" aria-label="教学大纲章节列表" tabIndex={0} onWheel={handoffNestedScroll}>{visibleChapters.map((chapter,i)=><article key={chapter.id} data-chapter-id={chapter.id} className={'vc-segment of-chapter'+(!readOnly?' of-sortable':'')+(dragged===chapter.id?' is-dragging':'')+(over===chapter.id?' is-drop-target is-drop-'+dropEdge:'')}>
  {!readOnly&&<button className="vc-drag-handle vc-icon" disabled={Boolean(editing)} aria-label={'拖动排序章节 '+chapter.title} onKeyDown={e=>{if(e.key==='ArrowUp'&&i>0||e.key==='ArrowDown'&&i<chapters.length-1){e.preventDefault();reorder(i,e.key==='ArrowUp'?-1:1);}}} onPointerDown={e=>{if(e.button!==0)return;e.preventDefault();e.currentTarget.focus();e.currentTarget.setPointerCapture(e.pointerId);const row=e.currentTarget.closest<HTMLElement>('[data-chapter-id]'),rect=row?.getBoundingClientRect();drag.current={from:chapter.id,to:chapter.id,edge:'before',startY:e.clientY,active:false,x:e.clientX,y:e.clientY,list:e.currentTarget.closest<HTMLElement>('.vc-segments'),height:rect?.height||68};}} onPointerMove={e=>{
   const state=drag.current;if(!state)return;state.x=e.clientX;state.y=e.clientY;if(!state.active&&Math.abs(e.clientY-state.startY)>5){const row=e.currentTarget.closest<HTMLElement>('[data-chapter-id]'),rect=row?.getBoundingClientRect();state.active=true;document.body.classList.add('of-is-sorting');setDragged(state.from);setDragGhost({x:rect?.left||e.clientX,y:e.clientY-state.height/2,width:rect?.width||420,title:chapter.title});trackDrag();}
  }} onPointerUp={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);finishDrag();}} onPointerCancel={clearDrag}><GripVertical size={16}/></button>}
  <span className="vc-order">{i+1}</span><div className="vc-segment-copy">{editing?.id===chapter.id?editor:<><b>{chapter.title}</b><small>{chapter.content}</small></>}</div>{!readOnly&&editing?.id!==chapter.id&&<div className="vc-segment-actions"><button disabled={Boolean(editing)} className="vc-btn edit" aria-label={'编辑章节 '+chapter.title} onClick={()=>setEditing({...chapter})}><PencilLine size={13}/>编辑</button><button className="vc-icon" aria-label={'上移章节 '+chapter.title} disabled={!i||Boolean(editing)} onClick={()=>reorder(i,-1)}><ArrowUp size={13}/></button><button className="vc-icon" aria-label={'下移章节 '+chapter.title} disabled={i===chapters.length-1||Boolean(editing)} onClick={()=>reorder(i,1)}><ArrowDown size={13}/></button><button className="vc-icon" aria-label={'删除章节 '+chapter.title} disabled={chapters.length===1||Boolean(editing)} onClick={e=>{removeTrigger.current=e.currentTarget;setRemoving(chapter.id);}}><X size={13}/></button></div>}</article>)}</div><span className="of-sort-announcement" role="status">{announcement}</span>{isStreaming&&<div className="of-streaming-placeholder" role="status"><Loader2 size={14} className="vc-spin"/>正在生成章节内容…</div>}{editing&&!chapters.some(c=>c.id===editing.id)&&<div className="of-new-chapter">{editor}</div>}</div>
 <label className="vc-plan-goal of-design-style">设计风格<textarea aria-label="设计风格" readOnly={readOnly} value={project.framework.designStyle} placeholder="描述画面风格、配色、布局，以及文字和按钮的呈现方式。" onChange={e=>store.update(project.id,{framework:{...project.framework,designStyle:e.target.value}})}/></label>
 {dragGhost&&<div className="of-drag-ghost" style={{left:dragGhost.x,top:dragGhost.y,width:dragGhost.width}}><GripVertical size={16}/><span>{dragGhost.title}</span></div>}
 </div>;
 return <div className="vc-workflow of-outline" data-video-plan={project.id}><RequirementCard title="视频互动课件需求确认" framework={project.framework} readOnly={readOnly} bodyContent={contents}/>
 {!readOnly&&confirmationDock&&createPortal(<div className="vc-confirm-action"><button className="vc-btn primary" disabled={Boolean(outlineIssues(project).length)||!project.framework.userRequirement.trim()||Boolean(editing)||isStreaming} onClick={()=>confirmOutline(project.id)}>确认需求，继续生成</button></div>,confirmationDock)}
 {removing&&removePopoverStyle&&createPortal(<div ref={removePopover} className="of-delete-popover" role="dialog" aria-label="确认删除章节" style={removePopoverStyle}><strong>删除本章及其后续场景安排？</strong><div className="of-delete-actions"><button className="vc-btn" onClick={()=>{setRemoving(null);removeTrigger.current?.focus();}}>取消</button><button className="vc-btn danger" onClick={()=>{store.update(project.id,{chapters:chapters.filter(c=>c.id!==removing)});setRemoving(null);}}>删除章节</button></div></div>,document.body)}

 </div>;
}
function MaterialCards({project}:{project:VideoProject}){
 const [viewing,setViewing]=useState<MediaAsset|null>(null),[imagesOpen,setImagesOpen]=useState(true),[audioOpen,setAudioOpen]=useState(true);
 const images=project.assets.filter(a=>a.kind==='image'),audio=project.assets.filter(a=>a.kind==='audio');
 const audioSpeaker=(a:MediaAsset)=>a.speakerId||((a.originAssetId||a.id)==='cover-voice'?'hero':undefined);
 const ready=(a:MediaAsset)=>project.readyAssetIds.includes(a.id);
 const imagesDone=images.every(ready);
 const audioStarted=imagesDone&&project.job?.kind!=='scene-planning'&&project.job?.kind!=='images';
 const stateFor=(items:MediaAsset[])=>{const count=items.filter(ready).length,completed=count===items.length;return {status:completed?'completed':project.phase==='failed'?'failed':project.phase==='paused'?'paused':'in-progress',progress:Math.round(count/Math.max(1,items.length)*100),detail:completed?undefined:'已完成 '+count+' / '+items.length+' 项',error:project.error} as const;};
 if(project.job?.kind==='scene-planning')return <section className="vc-card vc-progress"><header><h3><Loader2 className="vc-spin" size={17}/>正在根据大纲规划场景</h3></header><p>整理每章需要的画面、台词和互动，随后开始准备图片。</p><Controls project={project}/></section>;
 return <><div className="vc-generation-cards"><ImageGenerationPanelV2 stage={stateFor(images)} items={images.map(a=>({id:a.id,label:a.name,src:ready(a)?a.url:undefined,prompt:a.role||a.prompt,status:ready(a)?'completed':'generating'}))} isExpanded={imagesOpen} onToggle={()=>setImagesOpen(!imagesOpen)} onPreview={a=>setViewing(images.find(x=>x.id===a.id)!)} onRetry={()=>useVideoCoursewareStore.getState().resume(project.id)}/>
 {audioStarted&&<AudioGenerationPanel stage={stateFor(audio)} items={audio.map(a=>({id:a.id,label:(a.originAssetId||a.id)==='cover-voice'?'封面开场':a.name,url:ready(a)?a.url:undefined,type:'tts',duration:a.seconds,status:ready(a)?'completed':'generating'}))} groups={[...project.speakers.map(s=>({id:s.id,label:s.name+' · '+displayVoiceName(s.voiceName),itemIds:audio.filter(a=>audioSpeaker(a)===s.id).map(a=>a.id)})),...(audio.some(a=>!audioSpeaker(a))?[{id:'uploaded',label:'用户提供的录音',itemIds:audio.filter(a=>!audioSpeaker(a)).map(a=>a.id)}]:[])]} isExpanded={audioOpen} onToggle={()=>setAudioOpen(!audioOpen)} onRetry={()=>useVideoCoursewareStore.getState().resume(project.id)}/>}</div>
 {['images','audio'].includes(project.job?.kind||'')&&<Controls project={project}/>}
 {viewing&&<VideoModal title={viewing.name} onClose={()=>setViewing(null)}><AssetPreview asset={viewing}/></VideoModal>}
 </>;
}
function SceneCard({project,scene,index,readOnly}:{project:VideoProject;scene:VideoSegment;index:number;readOnly:boolean}){
 const [editing,setEditing]=useState(false),[previewing,setPreviewing]=useState(false);
 const job=project.sceneJobs?.[scene.id],issues=sceneGenerationIssues(project,scene.id);
 const busy=job&&['queued','generating'].includes(job.status);
 const images=project.assets.filter(a=>a.kind==='image'&&a.segmentIds.includes(scene.id));
 const scenePreview=scenePreviewURL(project,scene.id);
 const thumbnail=images.find(a=>a.role==='镜头画面'||a.role==='封面')||images.find(a=>a.role==='场景画面')||images[0];
 return <article className={'of-scene'+(job?.status==='ready'?' is-ready':'')} data-scene-id={scene.id}><div className="of-scene-summary"><div className="of-scene-image">{scenePreview?<img src={scenePreview} alt={scene.title}/>:thumbnail?<img src={thumbnail.url} alt={thumbnail.name}/>:<Gamepad2 size={25}/>}</div><div className="of-scene-copy"><span className="of-scene-index">场景 {index+1}</span><h4>{scene.title}</h4><div className="of-scene-labels"><Kind kind={scene.kind}/>{job?.status==='ready'&&<span className="of-scene-ready" role="status"><Check size={13}/>已生成</span>}</div></div><div className="of-scene-actions"><button className="vc-text-btn" onClick={()=>setEditing(true)}><PencilLine size={14}/>{readOnly?'查看':'编辑'}</button>{busy?<span className="of-scene-job is-loading" role="status"><Loader2 size={14} className="vc-spin"/>{job.status==='queued'?'排队中…':'生成中…'}</span>:job?.status==='ready'?<button className="vc-text-btn" onClick={()=>setPreviewing(true)}><Play size={14}/>预览</button>:job?.status==='failed'?<span className="of-scene-job is-error">生成失败</span>:job?.status==='needs-confirmation'?<span className="of-scene-job">待重新确认</span>:null}</div></div>
 <p className="of-scene-description">{scene.content}</p>{!readOnly&&<>{job?.error&&<p className="of-scene-job is-error" role="status">{job.error}</p>}{issues.map(issue=><p className="vc-error" key={issue}>{issue}</p>)}</>}
 {previewing&&<ScenePreview project={project} sceneId={scene.id} onClose={()=>setPreviewing(false)}/>}
 {editing&&<SceneEditor project={project} sceneId={scene.id} readOnly={readOnly} onClose={()=>setEditing(false)}/>}
 </article>;
}
function remainingSceneCount(project:VideoProject){return project.segments.filter(s=>!['queued','generating','ready'].includes(project.sceneJobs?.[s.id]?.status||'')).length;}
function Scenes({project,readOnly}:{project:VideoProject;readOnly:boolean}){
 const issues=videoPlanIssues(project),pending=remainingSceneCount(project),done=project.readySceneIds?.length||0;
 const [expanded,setExpanded]=useState(false);
 const showList=(!readOnly&&pending>0)||!project.sceneJobs||expanded;
 return <section className={'vc-card of-scene-plan'+(!showList?' is-collapsed':'')}><div className="vc-card-header"><div><h3><Film size={17}/>{showList?'完整场景方案':'场景方案已确认'}</h3><p>{project.chapters?.length} 个章节 · {project.segments.length} 场{project.sceneJobs?' · 已完成 '+done+' 场':''}</p></div>{project.sceneJobs&&pending===0?<button className="vc-text-btn" onClick={()=>setExpanded(!expanded)}>{showList?'收起方案':'查看方案'}<ChevronDown size={14}/></button>:<span className="vc-kind">{readOnly?'已确认':'可编辑'}</span>}</div>
 {!showList&&<div className="of-confirmed-outline">{project.chapters?.map((c,i)=><div key={c.id}><span>{String(i+1).padStart(2,'0')}</span><div><b>{c.title}</b><p>{project.segments.filter(s=>s.chapterId===c.id).map(s=>s.title).join(' · ')}</p></div></div>)}</div>}
 {showList&&<><p className="of-plan-intro">检查每场内容，进入编辑后可单独生成，也可确认后一次生成全部。</p>
 {project.sceneJobs&&<div className="vc-delivery-types">{(['video','h5','mixed'] as const).map(kind=>{const scenes=project.segments.filter(s=>s.kind===kind);return <span key={kind} className={'vc-kind vc-kind-'+kind}><Kind kind={kind}/>{scenes.filter(s=>project.readySceneIds?.includes(s.id)).length} / {scenes.length}</span>;})}</div>}
 <div className="of-scenes-scroll" role="region" aria-label="场景方案列表" tabIndex={0} onWheel={handoffNestedScroll}>{project.chapters?.map((c,i)=><section className="of-scene-chapter" key={c.id}><header><span>{String(i+1).padStart(2,'0')}</span><div><h4>{c.title}</h4><small>{project.segments.filter(s=>s.chapterId===c.id).length} 个场景</small></div></header>{project.segments.filter(s=>s.chapterId===c.id).map(s=><SceneCard key={s.id} project={project} scene={s} index={project.segments.indexOf(s)} readOnly={readOnly}/>)}</section>)}</div>
 {!readOnly&&<footer className="of-confirm of-review-footer"><div><b>{pending?'还有 '+pending+' 场待确认':'全部场景已确认'}</b><p>{pending?'已开始的场景继续生成，不会重复制作。':'完成后将自动剪辑并交付整课。'}</p>{issues.length>0&&<p className="vc-error">部分场景需补全内容，请在对应场景编辑。</p>}</div>{pending>0?<button className="vc-btn primary" disabled={Boolean(issues.length)} onClick={()=>confirmVideoPlan(project.id)}>{project.sceneJobs?'确认并生成剩余 '+pending+' 场':'确认全部场景，生成课件'}</button>:<Check size={18}/>}</footer>}</>}
 </section>;
}
export default function OutlineSceneFlow({project,stage,runId}:{project:VideoProject;stage:WorkflowStage;runId?:string}){
 const old=Boolean(project.workflowRuns?.[stage]&&runId!==project.workflowRuns[stage]);
 const snapshot=old&&runId?project.workflowSnapshots?.[runId]:undefined;
 const current=snapshot?{...project,...snapshot,phase:'ready' as const,job:undefined}:project;
 if(stage==='plan')return <Outline project={project}/>;
 if(!old&&['planning','plan'].includes(project.phase))return null;
 if(stage==='assembly'||(stage==='production'&&(old||(project.sceneJobs&&project.phase==='assets-review'&&remainingSceneCount(project)>0))))return null;
 return <div className="vc-workflow of-flow" data-workflow-stage={stage}>{stage==='assets'?<MaterialCards project={current}/>:stage==='video-plan'?<Scenes project={current} readOnly={old||project.phase!=='assets-review'}/>:<SceneDeliveryCard project={current}><Controls project={current}/></SceneDeliveryCard>}</div>;
}
