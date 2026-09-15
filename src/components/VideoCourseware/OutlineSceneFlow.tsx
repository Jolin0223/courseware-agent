import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, GripVertical, Film, Gamepad2, Layers, ListOrdered, Loader2, Palette, PencilLine, Plus, X } from 'lucide-react';
import type { MediaAsset, OutlineChapter, VideoProject, VideoSegment, WorkflowStage } from '../../data/videoCourseware/model';
import { scenePreviewURL } from '../../data/videoCourseware/scenePreview';
import { outlineIssues } from '../../data/videoCourseware/outline';
import { videoPlanIssues } from '../../data/videoCourseware/planning';
import { useVideoCoursewareStore } from '../../store/videoCoursewareStore';
import { confirmOutline, confirmVideoPlan } from './workflow';
import GenerationPreferencePicker from '../Generator/GenerationPreferencePicker';
import { AssetPreview, VideoModal } from './Shared';
import SceneEditor from './SceneEditor';
import RequirementCard from '../Generator/RequirementCard';
import ImageGenerationPanelV2 from '../Generator/ImageGenerationPanelV2';
import AudioGenerationPanel from '../Generator/AudioGenerationPanel';
import SceneDeliveryCard from './SceneDeliveryCard';
import './outlineSceneFlow.css';

function Kind({kind}:{kind:VideoSegment['kind']}){return <span className={'vc-kind vc-kind-'+kind}>{kind==='h5'?<Gamepad2 size={13}/>:kind==='mixed'?<Layers size={13}/>:<Film size={13}/ >}{kind==='video'?'视频页面':kind==='mixed'?'视频＋互动页面':'互动页面'}</span>;}
function Controls({project}:{project:VideoProject}){
 const store=useVideoCoursewareStore();
 if(!project.job)return null;
 const stopped=['paused','failed'].includes(project.phase);
 return <div className="of-job-controls">{project.error&&<p role="alert">{project.error}</p>}{stopped?<><button className="vc-btn" onClick={()=>store.update(project.id,{phase:'plan',job:undefined,error:undefined})}>返回教学大纲</button>{!project.error?.includes('未接入')&&<button className="vc-btn" onClick={()=>store.resume(project.id)}>继续处理未完成内容</button>}</>:<button className="vc-text-btn" onClick={()=>store.pause(project.id)}>暂停</button>}<span className="vc-hint">已完成的内容会保留</span></div>;
}
function Preferences({project,readOnly}:{project:VideoProject;readOnly:boolean}){
 const update=useVideoCoursewareStore(s=>s.update);
 return <div className="of-preferences"><div className="vc-form"><label>画面风格<textarea readOnly={readOnly} value={project.framework.designStyle} onChange={e=>update(project.id,{framework:{...project.framework,designStyle:e.target.value}})}/></label></div><h4>旁白与角色声音</h4><p className="vc-hint">旁白负责讲解与读题，角色负责对白。沿用同一说话人的声音。</p>{project.speakers.map(s=><div className="vc-speaker" key={s.id}><div><b>{s.name}</b><small>{s.role==='narrator'?'讲解、读题与反馈':'角色对白与行动邀请'}</small></div>{readOnly?<span>{s.voiceName}</span>:<GenerationPreferencePicker controls="voice" showMode={false} voiceLabel="音色" value={{voiceMode:'manual',voiceName:s.voiceName,voiceId:s.voiceId,voiceLanguage:s.voiceLanguage||'中文'}} onChange={v=>update(project.id,{speakers:project.speakers.map(x=>x.id===s.id?{...x,voiceName:v.voiceName||'智能匹配',voiceId:v.voiceId,voiceLanguage:v.voiceLanguage}:x)})}/ >}</div>)}</div>;
}
function Outline({project}:{project:VideoProject}){
 const store=useVideoCoursewareStore(),readOnly=project.phase!=='plan';
 const [tab,setTab]=useState<'outline'|'style'>('outline');
 const [editing,setEditing]=useState<OutlineChapter|null>(null),[removing,setRemoving]=useState<string|null>(null);
 const chapters=project.chapters||[];
 const drag=useRef<{from:string;to:string;startY:number;active:boolean;x:number;y:number;list:HTMLElement|null}|null>(null);
 const dragFrame=useRef<number|undefined>(undefined);
 useEffect(()=>()=>{if(dragFrame.current!==undefined)cancelAnimationFrame(dragFrame.current);},[]);
 function clearDrag(){if(dragFrame.current!==undefined)cancelAnimationFrame(dragFrame.current);dragFrame.current=undefined;drag.current=null;setDragged(null);setOver(null);}
 function trackDrag(){const current=drag.current;if(!current?.active)return;
  if(current.list){const rect=current.list.getBoundingClientRect();if(current.y>rect.bottom-28)current.list.scrollTop+=7;else if(current.y<rect.top+28)current.list.scrollTop-=7;}
  const target=document.elementFromPoint(current.x,current.y)?.closest<HTMLElement>('[data-chapter-id]');if(target?.dataset.chapterId){current.to=target.dataset.chapterId;setOver(current.to);}
  dragFrame.current=requestAnimationFrame(trackDrag);
 }
 const [dragged,setDragged]=useState<string|null>(null),[over,setOver]=useState<string|null>(null),[announcement,setAnnouncement]=useState('');
 function finishDrag(){const current=drag.current;clearDrag();if(!current?.active||current.from===current.to||readOnly||editing)return;
  const next=[...chapters],from=next.findIndex(c=>c.id===current.from),to=next.findIndex(c=>c.id===current.to);if(from<0||to<0)return;const [chapter]=next.splice(from,1);next.splice(to,0,chapter);store.update(project.id,{chapters:next});setAnnouncement(chapter.title+'已移至第 '+(to+1)+' 章');
 }
 function reorder(i:number,delta:number){const next=[...chapters];[next[i],next[i+delta]]=[next[i+delta],next[i]];store.update(project.id,{chapters:next});}
 function save(){if(!editing)return;store.update(project.id,{chapters:chapters.some(c=>c.id===editing.id)?chapters.map(c=>c.id===editing.id?editing:c):[...chapters,editing]});setEditing(null);}
 const editor=editing?<div className="vc-form of-chapter-editor"><label>章节名称<input autoFocus aria-label="章节名称" value={editing.title} onChange={e=>setEditing({...editing,title:e.target.value})}/></label><label>本章主要内容<textarea aria-label="本章主要内容" value={editing.content} placeholder="说明这一章要讲的知识、故事或任务。" onChange={e=>setEditing({...editing,content:e.target.value})}/></label><footer className="vc-actions"><button className="vc-btn" onClick={()=>setEditing(null)}>取消</button><button className="vc-btn primary" disabled={!editing.title.trim()||!editing.content.trim()} onClick={save}>保存章节</button></footer></div>:null;
 if(project.phase==='planning')return <section className="vc-card vc-progress"><header><h3><Loader2 className="vc-spin" size={17}/>正在整理教学大纲</h3></header><p>根据需求与材料，整理本课内容和章节顺序。</p></section>;
 const contents=<div className="vc-plan-body">
  <label className="vc-plan-goal">教学目标<textarea aria-label="教学目标" readOnly={readOnly} value={project.framework.userRequirement} onChange={e=>store.update(project.id,{framework:{...project.framework,userRequirement:e.target.value}})}/></label>
  <div className="vc-tabs vc-plan-tabs" role="tablist" aria-label="大纲与偏好"><button role="tab" aria-selected={tab==='outline'} className={tab==='outline'?'active':''} onClick={()=>setTab('outline')}><ListOrdered size={16}/>教学大纲</button><button role="tab" aria-selected={tab==='style'} className={tab==='style'?'active':''} onClick={()=>setTab('style')}><Palette size={16}/>画面与配音</button></div>
  {tab==='style'?<Preferences project={project} readOnly={readOnly}/>:<div role="tabpanel"><div className="vc-plan-summary vc-outline-summary"><span>{chapters.length} 个章节</span><span>{readOnly?'确认后规划视频与互动场景':'拖动左侧手柄调整顺序'}</span>{!readOnly&&<button className="vc-text-btn" disabled={Boolean(editing)} onClick={()=>setEditing({id:crypto.randomUUID(),title:'',content:'',segmentIds:[]})}><Plus size={14}/>添加章节</button>}</div>
  <div className="vc-segments vc-segments-compact" role="region" aria-label="教学大纲章节列表" tabIndex={0}>{chapters.map((chapter,i)=><article key={chapter.id} data-chapter-id={chapter.id} className={'vc-segment of-chapter'+(!readOnly?' of-sortable':'')+(dragged===chapter.id?' is-dragging':'')+(over===chapter.id?' is-drop-target':'')}>
  {!readOnly&&<button className="vc-drag-handle vc-icon" disabled={Boolean(editing)} aria-label={'拖动排序章节 '+chapter.title} onKeyDown={e=>{if(e.key==='ArrowUp'&&i>0||e.key==='ArrowDown'&&i<chapters.length-1){e.preventDefault();reorder(i,e.key==='ArrowUp'?-1:1);}}} onPointerDown={e=>{if(e.button!==0)return;e.preventDefault();e.currentTarget.focus();e.currentTarget.setPointerCapture(e.pointerId);drag.current={from:chapter.id,to:chapter.id,startY:e.clientY,active:false,x:e.clientX,y:e.clientY,list:e.currentTarget.closest<HTMLElement>('.vc-segments')};}} onPointerMove={e=>{
   const state=drag.current;if(!state)return;state.x=e.clientX;state.y=e.clientY;if(!state.active&&Math.abs(e.clientY-state.startY)>5){state.active=true;setDragged(state.from);trackDrag();}
  }} onPointerUp={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);finishDrag();}} onPointerCancel={clearDrag}><GripVertical size={16}/></button>}
  <span className="vc-order">{i+1}</span><div className="vc-segment-copy">{editing?.id===chapter.id?editor:<><b>{chapter.title}</b><small>{chapter.content}</small>{removing===chapter.id&&<div className="of-delete"><span>删除本章及其后续场景安排？</span><button className="vc-btn" onClick={()=>setRemoving(null)}>取消</button><button className="vc-btn" onClick={()=>{store.update(project.id,{chapters:chapters.filter(c=>c.id!==chapter.id)});setRemoving(null);}}>删除章节</button></div>}</>}</div>{!readOnly&&editing?.id!==chapter.id&&<div className="vc-segment-actions"><button disabled={Boolean(editing)} className="vc-btn edit" aria-label={'编辑章节 '+chapter.title} onClick={()=>setEditing({...chapter})}><PencilLine size={13}/>编辑</button><button className="vc-icon" aria-label={'上移章节 '+chapter.title} disabled={!i||Boolean(editing)} onClick={()=>reorder(i,-1)}><ArrowUp size={13}/></button><button className="vc-icon" aria-label={'下移章节 '+chapter.title} disabled={i===chapters.length-1||Boolean(editing)} onClick={()=>reorder(i,1)}><ArrowDown size={13}/></button><button className="vc-icon" aria-label={'删除章节 '+chapter.title} disabled={chapters.length===1||Boolean(editing)} onClick={()=>setRemoving(chapter.id)}><X size={13}/></button></div>}</article>)}</div><span className="of-sort-announcement" role="status">{announcement}</span>{editing&&!chapters.some(c=>c.id===editing.id)&&<div className="of-new-chapter">{editor}</div>}</div>}
 </div>;
 return <div className="vc-workflow of-outline" data-video-plan={project.id}><RequirementCard title="视频互动课件教学大纲确认" framework={project.framework} readOnly={readOnly} bodyContent={contents}/>
 {!readOnly&&<div className="vc-confirm-action"><button className="vc-btn primary" disabled={Boolean(outlineIssues(project).length)||!project.framework.userRequirement.trim()||Boolean(editing)} onClick={()=>confirmOutline(project.id)}>确认教学大纲，继续生成</button></div>}

 </div>;
}
function MaterialCards({project}:{project:VideoProject}){
 const [viewing,setViewing]=useState<MediaAsset|null>(null),[imagesOpen,setImagesOpen]=useState(true),[audioOpen,setAudioOpen]=useState(true);
 const images=project.assets.filter(a=>a.kind==='image'),audio=project.assets.filter(a=>a.kind==='audio');
 const audioSpeaker=(a:MediaAsset)=>a.speakerId||((a.originAssetId||a.id)==='cover-voice'?'hero':undefined);
 const ready=(a:MediaAsset)=>project.readyAssetIds.includes(a.id);
 const imagesDone=images.every(ready);
 const audioStarted=imagesDone&&project.job?.kind!=='scene-planning'&&project.job?.kind!=='images';
 const stateFor=(items:MediaAsset[])=>{const count=items.filter(ready).length;return {status:count===items.length?'completed':project.phase==='failed'?'failed':project.phase==='paused'?'paused':'in-progress',progress:Math.round(count/Math.max(1,items.length)*100),detail:'已完成 '+count+' / '+items.length+' 项',error:project.error} as const;};
 if(project.job?.kind==='scene-planning')return <section className="vc-card vc-progress"><header><h3><Loader2 className="vc-spin" size={17}/>正在根据大纲规划场景</h3></header><p>整理每章需要的画面、台词和互动，随后开始准备图片。</p><Controls project={project}/></section>;
 return <><div className="vc-generation-cards"><ImageGenerationPanelV2 stage={stateFor(images)} items={images.map(a=>({id:a.id,label:a.name,src:ready(a)?a.url:undefined,prompt:a.role||a.prompt,status:ready(a)?'completed':'generating'}))} isExpanded={imagesOpen} onToggle={()=>setImagesOpen(!imagesOpen)} onPreview={a=>setViewing(images.find(x=>x.id===a.id)!)} onRetry={()=>useVideoCoursewareStore.getState().resume(project.id)}/>
 {audioStarted&&<AudioGenerationPanel stage={stateFor(audio)} items={audio.map(a=>({id:a.id,label:(a.originAssetId||a.id)==='cover-voice'?'封面开场':a.name,url:ready(a)?a.url:undefined,type:'tts',duration:a.seconds,status:ready(a)?'completed':'generating'}))} groups={[...project.speakers.map(s=>({id:s.id,label:s.name+' · '+s.voiceName,itemIds:audio.filter(a=>audioSpeaker(a)===s.id).map(a=>a.id)})),...(audio.some(a=>!audioSpeaker(a))?[{id:'uploaded',label:'用户提供的录音',itemIds:audio.filter(a=>!audioSpeaker(a)).map(a=>a.id)}]:[])]} isExpanded={audioOpen} onToggle={()=>setAudioOpen(!audioOpen)} onPreview={a=>setViewing(audio.find(x=>x.id===a.id)!)} onRetry={()=>useVideoCoursewareStore.getState().resume(project.id)}/>}</div>
 {['images','audio'].includes(project.job?.kind||'')&&<Controls project={project}/>}
 {viewing&&<VideoModal title={viewing.name} onClose={()=>setViewing(null)}><AssetPreview asset={viewing}/></VideoModal>}
 </>;
}
function SceneCard({project,scene,index,readOnly}:{project:VideoProject;scene:VideoSegment;index:number;readOnly:boolean}){
 const [editing,setEditing]=useState(false);
 const images=project.assets.filter(a=>a.kind==='image'&&a.segmentIds.includes(scene.id));
 const scenePreview=scenePreviewURL(project,scene.id);
 const thumbnail=images.find(a=>a.role==='镜头画面'||a.role==='封面')||images.find(a=>a.role==='场景画面')||images[0];
 return <article className="of-scene" data-scene-id={scene.id}><div className="of-scene-summary"><div className="of-scene-image">{scenePreview?<img src={scenePreview} alt={scene.title}/>:thumbnail?<img src={thumbnail.url} alt={thumbnail.name}/>:<Gamepad2 size={25}/>}</div><div className="of-scene-copy"><span className="of-scene-index">场景 {index+1}</span><h4>{scene.title}</h4><Kind kind={scene.kind}/></div><button className="vc-btn edit" onClick={()=>setEditing(true)}><PencilLine size={14}/>{readOnly?'查看场景方案':'编辑场景方案'}</button></div>
 <p className="of-scene-description">{scene.content}</p>
 {editing&&<SceneEditor project={project} sceneId={scene.id} readOnly={readOnly} onClose={()=>setEditing(false)}/>}
 </article>;
}
function Scenes({project,readOnly}:{project:VideoProject;readOnly:boolean}){
 const issues=videoPlanIssues(project);
 return <section className="vc-card of-scene-plan"><div className="vc-card-header"><div><h3><Film size={17}/>完整场景方案确认</h3><p>{project.chapters?.length} 个章节 · {project.segments.length} 个场景方案</p></div><span className="vc-kind">{readOnly?'已确认':'可编辑'}</span></div><p className="of-plan-intro">图片与配音已放入对应场景。查看画面、台词和互动内容，需要调整的部分可单独修改。</p>
 {project.chapters?.map((c,i)=><section className="of-scene-chapter" key={c.id}><header><span>{String(i+1).padStart(2,'0')}</span><div><h4>{c.title}</h4><small>{project.segments.filter(s=>s.chapterId===c.id).length} 个场景</small></div></header>{project.segments.filter(s=>s.chapterId===c.id).map(s=><SceneCard key={s.id} project={project} scene={s} index={project.segments.indexOf(s)} readOnly={readOnly}/>)}</section>)}
 {!readOnly&&<footer className="of-confirm"><p>确认后生成视频与互动页面，再统一剪辑交付。</p>{issues.length>0&&<div role="alert">{[...new Set(issues)].map(x=><p className="vc-error" key={x}>{x}</p>)}</div>}<button className="vc-btn primary" disabled={Boolean(issues.length)} onClick={()=>confirmVideoPlan(project.id)}>确认全部场景，生成课件</button></footer>}
 </section>;
}
export default function OutlineSceneFlow({project,stage,runId}:{project:VideoProject;stage:WorkflowStage;runId?:string}){
 const old=Boolean(project.workflowRuns?.[stage]&&runId!==project.workflowRuns[stage]);
 const snapshot=old&&runId?project.workflowSnapshots?.[runId]:undefined;
 const current=snapshot?{...project,...snapshot,phase:'ready' as const,job:undefined}:project;
 if(stage==='plan')return <Outline project={project}/>;
 if(!old&&['planning','plan'].includes(project.phase))return null;
 if(stage==='assembly'||(stage==='production'&&old))return null;
 return <div className="vc-workflow of-flow" data-workflow-stage={stage}>{stage==='assets'?<MaterialCards project={current}/>:stage==='video-plan'?<Scenes project={current} readOnly={old||project.phase!=='assets-review'}/>:<SceneDeliveryCard project={current}><Controls project={current}/></SceneDeliveryCard>}</div>;
}
