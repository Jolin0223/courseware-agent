import { useEffect, useRef, useState } from 'react';
import { Check, ArrowLeft, ArrowUp, ArrowDown, GripVertical, Palette, ListOrdered, PencilLine, Film, Loader2, Gamepad2, Layers, Volume2, RefreshCw, Play, Pause } from 'lucide-react';
import RequirementCard from '../Generator/RequirementCard';
import GenerationPreferencePicker from '../Generator/GenerationPreferencePicker';
import { useVideoCoursewareStore } from '../../store/videoCoursewareStore';
import { useConversationStore } from '../../store/conversationStore';
import type { VideoProject, VideoSegment, MediaAsset, WorkflowStage } from '../../data/videoCourseware/model';
import { segmentLabels } from '../../data/videoCourseware/model';
import { VideoModal, AssetPreview } from './Shared';
import VideoResourceEditor from './VideoResourceEditor';
import { ensureWorkflowMessage, beginVideoPlanReview } from './workflow';
import { synchronizeSegment, reorderSegments } from '../../data/videoCourseware/planning';
import ImageGenerationPanelV2 from '../Generator/ImageGenerationPanelV2';
import AudioGenerationPanel from '../Generator/AudioGenerationPanel';
import VideoPlanReview from './VideoPlanReview';

function SegmentEditor({project,segment,onClose}:{project:VideoProject;segment:VideoSegment;onClose:()=>void}){
 const [draft,setDraft]=useState({...segment});const update=useVideoCoursewareStore(s=>s.update);
 return <VideoModal title={`编辑环节 · ${segment.title}`} onClose={onClose}><div className="vc-form"><label>环节名称<input value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></label><label>内容形式<div className="vc-options">{(['video','mixed','h5'] as const).map(kind=><button className={draft.kind===kind?'selected':''} key={kind} onClick={()=>setDraft({...draft,kind,seconds:kind==='h5'?0:draft.seconds||6})}>{segmentLabels[kind]}</button>)}</div></label><label>教学内容<textarea value={draft.purpose} onChange={e=>setDraft({...draft,purpose:e.target.value})}/></label><label>学生如何参与<textarea value={draft.interaction} onChange={e=>setDraft({...draft,interaction:e.target.value})}/></label>{draft.kind!=='h5'&&<><label>画面和人物动作<textarea value={draft.visual} onChange={e=>setDraft({...draft,visual:e.target.value})}/></label><label>台词<textarea value={draft.dialogue} onChange={e=>setDraft({...draft,dialogue:e.target.value})}/></label><label>谁来说<div className="vc-options">{project.speakers.map(s=><button className={draft.speakerId===s.id?'selected':''} key={s.id} onClick={()=>setDraft({...draft,speakerId:s.id})}>{s.name}</button>)}</div></label><label>预计视频时长（秒）<input type="number" min={3} max={60} value={draft.seconds} onChange={e=>setDraft({...draft,seconds:Number(e.target.value)})}/></label></>}<label>怎样进入下一环节<textarea value={draft.next} onChange={e=>setDraft({...draft,next:e.target.value})}/></label></div><p className="vc-hint">这里修改教学方案。确认后，会据此准备图片、配音和视频。</p><footer className="vc-actions"><button className="vc-btn" onClick={onClose}>取消</button><button className="vc-btn primary" disabled={!draft.title.trim()||!draft.purpose.trim()} onClick={()=>{update(project.id,synchronizeSegment(project,draft));onClose();}}>保存修改</button></footer></VideoModal>;
}
function PlanContents({project,readOnly}:{project:VideoProject;readOnly:boolean}){
 const [editing,setEditing]=useState<VideoSegment|null>(null),[tab,setTab]=useState('flow'),[dragged,setDragged]=useState<string|null>(null),[over,setOver]=useState<string|null>(null);
 const drag=useRef<{from:string;to:string;startY:number;active:boolean}|null>(null);
 const update=useVideoCoursewareStore(s=>s.update);
 function reorder(from:string,to:string){update(project.id,reorderSegments(project,from,to));setDragged(null);setOver(null);}
 return <div className="vc-plan-body">
  <label className="vc-plan-goal">教学目标<textarea readOnly={readOnly} aria-label="教学目标" value={project.framework.userRequirement} onChange={e=>update(project.id,{framework:{...project.framework,userRequirement:e.target.value},approvedPlanKey:undefined})}/></label>
  <div className="vc-tabs vc-plan-tabs" role="tablist" aria-label="教学方案内容">{[['flow','教学流程'],['presentation','画面与配音']].map(([id,label])=><button role="tab" aria-selected={tab===id} className={tab===id?'active':''} key={id} onClick={()=>setTab(id)}>{id==='flow'?<ListOrdered size={16}/>:<Palette size={16}/ >}{label}</button>)}</div>
  {tab==='flow'&&<div role="tabpanel"><div className="vc-plan-summary"><span>{project.segments.length} 个教学场景</span><span>{project.segments.filter(s=>s.kind!=='h5').length} 个场景含视频</span>{!readOnly&&<span>拖动左侧手柄调整顺序</span>}</div>
   <div className="vc-segments vc-segments-compact" role="region" aria-label="教学场景列表，可滚动" tabIndex={0}>{project.segments.map((scene,i)=><div className={'vc-segment '+(dragged===scene.id?'is-dragging ':'')+(over===scene.id?'is-drop-target':'')} data-scene-id={scene.id} key={scene.id} onDragOver={e=>{if(readOnly)return;e.preventDefault();setOver(scene.id);}} onDrop={e=>{e.preventDefault();if(!readOnly&&dragged)reorder(dragged,scene.id);}}>
    {!readOnly&&<button className="vc-drag-handle vc-icon" aria-label={'拖动排序 '+scene.title} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);drag.current={from:scene.id,to:scene.id,startY:e.clientY,active:false};}} onPointerMove={e=>{
 const state=drag.current;if(!state)return;
 if(Math.abs(e.clientY-state.startY)>5)state.active=true;
 if(!state.active)return;setDragged(state.from);
 const target=document.elementFromPoint(e.clientX,e.clientY)?.closest<HTMLElement>('[data-scene-id]');
 if(target?.dataset.sceneId){state.to=target.dataset.sceneId;setOver(state.to);}
 const list=e.currentTarget.closest('.vc-segments');if(list){const rect=list.getBoundingClientRect();if(e.clientY>Math.min(rect.bottom,innerHeight-210)-24)list.scrollTop+=10;else if(e.clientY<rect.top+24)list.scrollTop-=10;}
 }} onPointerUp={e=>{const state=drag.current;drag.current=null;e.currentTarget.releasePointerCapture(e.pointerId);if(state?.active)reorder(state.from,state.to);else{setDragged(null);setOver(null);}}} onPointerCancel={()=>{drag.current=null;setDragged(null);setOver(null);}}><GripVertical size={17}/></button>}
    <span className="vc-order">{i+1}</span><div className="vc-segment-copy"><div><b>{scene.title}</b><span className={'vc-kind vc-kind-'+scene.kind}>{scene.kind==='h5'?<Gamepad2 size={13}/>:scene.kind==='video'?<Film size={13}/>:<Layers size={13}/ >}{segmentLabels[scene.kind]}</span></div><small>{scene.kind==='h5'?'互动练习':scene.seconds+' 秒'} · {scene.purpose}</small></div>
    {!readOnly&&<div className="vc-segment-actions"><button className="vc-btn edit" onClick={()=>setEditing(scene)}><PencilLine size={13}/>编辑</button><button className="vc-icon" aria-label={'上移'+scene.title} disabled={i===0} onClick={()=>reorder(scene.id,project.segments[i-1].id)}><ArrowUp size={13}/></button><button className="vc-icon" aria-label={'下移'+scene.title} disabled={i===project.segments.length-1} onClick={()=>reorder(scene.id,project.segments[i+1].id)}><ArrowDown size={13}/></button></div>}
   </div>)}</div>
  </div>}
  {tab==='presentation'&&<div role="tabpanel" className="vc-plan-presentation"><div className="vc-form"><label>画面风格<textarea aria-label="画面风格与教学呈现" readOnly={readOnly} value={project.framework.designStyle} onChange={e=>update(project.id,{framework:{...project.framework,designStyle:e.target.value},approvedPlanKey:undefined})}/></label></div><SpeakerSettings project={project} readOnly={readOnly} onEditScene={scene=>{setTab('flow');setEditing(scene);}}/></div>}
  {editing&&<SegmentEditor project={project} segment={editing} onClose={()=>setEditing(null)}/>}
 </div>;
}
function SpeakerSettings({project,readOnly=false,onEditScene}:{project:VideoProject;readOnly?:boolean;onEditScene?:(scene:VideoSegment)=>void}){
 const update=useVideoCoursewareStore(s=>s.update);
 return <section className="vc-speakers"><h3><Volume2 size={16}/>旁白和角色配音</h3><p className="vc-hint">根据教学流程中的讲述者与台词分配音色。新增角色需先安排出场环节和台词，再准备形象与配音。</p>{project.speakers.map(s=><div className="vc-speaker" key={s.id}><div><b>{s.name}</b><small>{s.role==='narrator'?'讲解、读题与反馈':'角色对白与行动邀请'}</small><div className="vc-speaker-scenes">{project.segments.filter(scene=>scene.speakerId===s.id&&scene.dialogue.trim()).map(scene=>readOnly?<span key={scene.id}>{scene.title}</span>:<button className="vc-text-btn" key={scene.id} onClick={()=>onEditScene?.(scene)}>{scene.title}</button>)}</div></div>{readOnly?<span>{s.voiceName}</span>:<GenerationPreferencePicker controls="voice" voiceLabel={s.role==='narrator'?'旁白音色':'角色音色'} showMode={false} value={{voiceMode:'manual',voiceName:s.voiceName,voiceId:s.voiceId,voiceLanguage:s.voiceLanguage||(project.subject==='英语'?'英语-英音':'中文')}} onChange={value=>update(project.id,{speakers:project.speakers.map(x=>x.id===s.id?{...x,voiceName:value.voiceName||'智能匹配',voiceId:value.voiceId,voiceLanguage:value.voiceLanguage}:x),preferences:s.role==='narrator'?{...project.preferences,voiceMode:value.voiceMode,voiceName:value.voiceName,voiceId:value.voiceId,voiceLanguage:value.voiceLanguage}:project.preferences,approvedPlanKey:undefined,readyAssetIds:project.readyAssetIds.filter(id=>!project.assets.some(a=>a.id===id&&a.kind==='audio'&&a.speakerId===s.id)),pendingEdit:`调整${s.name}的声音`})}/>}</div>)}</section>;
}

function JobControls({project}:{project:VideoProject}){
 const store=useVideoCoursewareStore();
 if(!project.job)return null;
 const paused=project.phase==='paused'||project.phase==='failed';
 return <div className="vc-job-controls"><span>{project.phase==='failed'?project.error:paused?'生成已暂停，已完成的内容会保留。':''}</span>{paused?<><button className="vc-btn" onClick={()=>store.update(project.id,{phase:'plan',job:undefined,approvedPlanKey:undefined})}><ArrowLeft size={14}/>返回方案</button><button className="vc-btn primary" onClick={()=>store.resume(project.id)}><RefreshCw size={14}/>{project.phase==='failed'?'重试未完成内容':'继续生成'}</button></>:<button className="vc-text-btn" onClick={()=>store.pause(project.id)}>暂停生成</button>}</div>;
}
function GenerationProgress({project,embedded=false}:{project:VideoProject;embedded?:boolean}){
 const [clock,setClock]=useState(()=>Date.now());
 useEffect(()=>{const timer=setInterval(()=>setClock(Date.now()),180);return()=>clearInterval(timer);},[]);
 const job=project.job,paused=['paused','failed'].includes(project.phase);
 const ratio=job?Math.min(1,((paused?0:clock-job.start)+job.elapsed)/job.duration):1;
 const videos=project.assets.filter(a=>a.kind==='video'),done=videos.filter(a=>project.readyAssetIds.includes(a.id)).length;
 const isPlan=job?.kind==='plan',isAssembly=job?.kind==='assembly';
 const progress=isPlan||isAssembly?Math.round(ratio*100):Math.round(done/Math.max(1,videos.length)*100);
 const title=isPlan?'正在整理教学方案':isAssembly?'正在衔接视频与互动页面':'正在生成视频';
 return <section className={embedded?'vc-progress vc-progress-inline':'vc-card vc-progress'} aria-live="polite"><header><h3>{paused?<Pause size={17}/>:<Loader2 size={17} className="vc-spin"/>}{paused?(project.phase==='failed'?'部分内容生成失败':'生成已暂停'):title}</h3><span>{progress}%</span></header><div className="vc-progress-track"><i style={{width:progress+'%'}}/></div><p>{isPlan?'正在理解材料、教学目标，并安排视频与互动的顺序。':isAssembly?'正在接入视频、教学文字与操作反馈，让每个环节自然衔接。':'根据已确认的视频方案逐段生成，完成的片段可以先查看。'}</p>{!isPlan&&!isAssembly&&<div className="vc-job-counts">已完成 {done} / {videos.length} 个视频片段</div>}</section>;
}
function MediaViewer({project,asset,onClose}:{project:VideoProject;asset:MediaAsset;onClose:()=>void}){
 return <VideoModal title={asset.name} onClose={onClose}><AssetPreview asset={asset}/>{asset.text&&<p>{asset.text}</p>}<p className="vc-hint">使用位置：{asset.segmentIds.map(id=>project.segments.find(s=>s.id===id)?.title).filter(Boolean).join('、')}</p><details className="vc-details"><summary>查看生成描述</summary><pre>{asset.prompt}</pre></details></VideoModal>;
}
function Materials({project,readOnly=false}:{project:VideoProject;readOnly?:boolean}){
 const [imagesOpen,setImagesOpen]=useState(true),[audioOpen,setAudioOpen]=useState(true),[viewing,setViewing]=useState<MediaAsset|null>(null),[edit,setEdit]=useState<'image'|'audio'|null>(null);
 const images=project.assets.filter(a=>a.kind==='image'),audio=project.assets.filter(a=>a.kind==='audio');
 const stateFor=(items:MediaAsset[])=>{const count=items.filter(a=>project.readyAssetIds.includes(a.id)).length;return {status:count===items.length?'completed':project.phase==='failed'?'failed':project.phase==='paused'?'paused':'in-progress',progress:Math.round(count/Math.max(1,items.length)*100),detail:'已完成 '+count+' / '+items.length+' 项',error:project.error} as const;};
 const ready=(a:MediaAsset)=>project.readyAssetIds.includes(a.id),canEdit=project.phase==='materials-review';
 return <>
  <div className="vc-generation-cards">
   <div><ImageGenerationPanelV2 headerAction={!readOnly&&<button className="vc-btn edit" disabled={!canEdit} onClick={()=>setEdit('image')}><PencilLine size={14}/>修改图片</button>} stage={stateFor(images)} items={images.map(a=>({id:a.id,label:a.name,src:ready(a)?a.url:undefined,prompt:a.role||a.prompt,status:ready(a)?'completed':'generating'}))} isExpanded={imagesOpen} onToggle={()=>setImagesOpen(!imagesOpen)} onPreview={a=>setViewing(images.find(x=>x.id===a.id)!)} onRetry={()=>useVideoCoursewareStore.getState().resume(project.id)}/></div>
   <div><AudioGenerationPanel headerAction={!readOnly&&<button className="vc-btn edit" disabled={!canEdit} onClick={()=>setEdit('audio')}><PencilLine size={14}/>修改配音</button>} stage={stateFor(audio)} items={audio.map(a=>({id:a.id,label:a.name,url:ready(a)?a.url:undefined,type:'tts',duration:a.seconds,status:ready(a)?'completed':'generating'}))} groups={project.speakers.map(s=>({id:s.id,label:s.name+' · '+s.voiceName,itemIds:audio.filter(a=>a.speakerId===s.id).map(a=>a.id)}))} isExpanded={audioOpen} onToggle={()=>setAudioOpen(!audioOpen)} onPreview={a=>setViewing(audio.find(x=>x.id===a.id)!)} onRetry={()=>useVideoCoursewareStore.getState().resume(project.id)}/></div>
  </div>
  {!readOnly&&<div className="vc-material-confirm"><div><p>{canEdit?'图片和配音已准备好，请查看并试听。':'正在准备图片与配音，完成后可确认。'}</p></div><button className="vc-btn primary" disabled={!canEdit||[...images,...audio].some(a=>!ready(a)||!a.url)} onClick={()=>beginVideoPlanReview(project.id)}>确认素材，生成视频方案</button></div>}
  {!readOnly&&<JobControls project={project}/>}
  {viewing&&<MediaViewer project={project} asset={viewing} onClose={()=>setViewing(null)}/>}
  {edit&&<VideoResourceEditor projectId={project.id} initialTab={edit} onClose={()=>setEdit(null)}/>}
 </>;
}
function Production({project,readOnly=false}:{project:VideoProject;readOnly?:boolean}){
 const [viewing,setViewing]=useState<MediaAsset|null>(null);
 const videos=project.assets.filter(a=>a.kind==='video').sort((a,b)=>(project.shots?.findIndex(s=>s.videoAssetId===a.id)??0)-(project.shots?.findIndex(s=>s.videoAssetId===b.id)??0));
 return <section className="vc-card vc-production">{project.job?.kind==='video'&&!readOnly?<GenerationProgress project={project} embedded/>:<h3><Check size={17}/>视频片段已生成</h3>}<div className="vc-asset-grid">{videos.map(a=><button className="vc-asset" key={a.id} disabled={!project.readyAssetIds.includes(a.id)} onClick={()=>setViewing(a)}>{project.readyAssetIds.includes(a.id)?<><img src={a.poster||a.url} alt={a.name}/><Play className="vc-play-overlay" size={25}/></>:<div className="vc-media-placeholder"><Loader2 className={project.phase==='paused'?'':'vc-spin'} size={20}/><span>{project.phase==='failed'?'等待重试':project.phase==='paused'?'已暂停':'生成中'}</span></div>}<b>{a.name}</b><small>{a.seconds} 秒</small></button>)}</div>{!readOnly&&project.job?.kind==='video'&&<JobControls project={project}/ >}{viewing&&<MediaViewer project={project} asset={viewing} onClose={()=>setViewing(null)}/>}</section>;
}
export default function VideoWorkflowCard({projectId,stage='plan',runId}:{projectId:string;stage?:WorkflowStage;runId?:string}){
 const current=useVideoCoursewareStore(s=>s.projects[projectId]),store=useVideoCoursewareStore();
 if(!current)return null;
 if(stage==='plan'){
  if(current.phase==='planning')return <GenerationProgress project={current}/>;
  const editable=current.phase==='plan';
  return <div className="vc-workflow" data-video-plan={current.id}><RequirementCard title="视频互动课件设计方案确认" framework={current.framework} readOnly={!editable} bodyContent={<PlanContents project={current} readOnly={!editable}/>}/>{editable&&<div className="vc-confirm-action"><button className="vc-btn primary" disabled={!current.framework.userRequirement.trim()} onClick={()=>{useConversationStore.getState().addUserMessage(current.conversationId,'确认需求，开始生成图片和配音。');ensureWorkflowMessage(current,'assets');useConversationStore.getState().setWaitingForUserAction(current.conversationId,false);store.update(current.id,{workflowVersion:4,approvedMaterialsKey:undefined});store.start(current.id,'assets');}}>确认需求，开始生成</button></div>}</div>;
 }
 const old=Boolean(current.workflowRuns?.[stage]&&runId!==current.workflowRuns[stage]);
 const snapshot=old&&runId?current.workflowSnapshots?.[runId]:undefined;
 const project=snapshot?{...current,...snapshot,phase:'ready' as const,job:undefined}:current;
 const active=stage==='assets'?['materials-review','assets-loading'].includes(project.phase)||project.job?.kind==='assets':stage==='video-plan'?project.phase==='assets-review'||project.job?.kind==='video-plan':stage==='production'?project.job?.kind==='video':project.job?.kind==='assembly';
 const readOnly=old||!active;
 if(!old&&['plan','planning'].includes(project.phase))return null;
 if(stage==='assembly')return <div className="vc-workflow" data-workflow-stage="assembly"><section className="vc-card">{active&&!old?<><GenerationProgress project={project} embedded/><div className="vc-assembly-steps"><span>剪辑与配音对齐</span><span>制作互动页面</span><span>连接场景与操作反馈</span></div><JobControls project={project}/></>:<h3><Check size={17}/>互动课件合成完成</h3>}</section></div>;
 return <div className="vc-workflow" data-workflow-stage={stage}>{stage==='assets'?<Materials project={project} readOnly={readOnly}/>:stage==='video-plan'?<><VideoPlanReview project={project} readOnly={readOnly}/>{!readOnly&&<JobControls project={project}/>}</>:<Production project={project} readOnly={readOnly}/>}</div>;
}
