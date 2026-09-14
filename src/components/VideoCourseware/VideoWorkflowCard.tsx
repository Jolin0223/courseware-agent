import { useEffect, useState } from 'react';
import { Check, ChevronDown, ArrowLeft, ArrowUp, ArrowDown, PencilLine, Film, Loader2, Gamepad2, Layers, Volume2, RefreshCw, Play, Pause } from 'lucide-react';
import RequirementCard from '../Generator/RequirementCard';
import GenerationPreferencePicker from '../Generator/GenerationPreferencePicker';
import { useVideoCoursewareStore } from '../../store/videoCoursewareStore';
import { useConversationStore } from '../../store/conversationStore';
import type { VideoProject, VideoSegment, MediaAsset } from '../../data/videoCourseware/model';
import { segmentLabels } from '../../data/videoCourseware/model';
import { VideoModal, AssetPreview } from './Shared';
import VideoResourceEditor from './VideoResourceEditor';
import { ensureWorkflowMessage } from './workflow';
import { synchronizeSegment } from '../../data/videoCourseware/planning';
import ImageGenerationPanelV2 from '../Generator/ImageGenerationPanelV2';
import AudioGenerationPanel from '../Generator/AudioGenerationPanel';
import VideoPlanReview from './VideoPlanReview';

function SegmentEditor({project,segment,onClose}:{project:VideoProject;segment:VideoSegment;onClose:()=>void}){
 const [draft,setDraft]=useState({...segment});const update=useVideoCoursewareStore(s=>s.update);
 return <VideoModal title={`编辑环节 · ${segment.title}`} onClose={onClose}><div className="vc-form"><label>环节名称<input value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></label><label>内容形式<div className="vc-options">{(['video','mixed','h5'] as const).map(kind=><button className={draft.kind===kind?'selected':''} key={kind} onClick={()=>setDraft({...draft,kind,seconds:kind==='h5'?0:draft.seconds||6})}>{segmentLabels[kind]}</button>)}</div></label><label>教学内容<textarea value={draft.purpose} onChange={e=>setDraft({...draft,purpose:e.target.value})}/></label><label>学生如何参与<textarea value={draft.interaction} onChange={e=>setDraft({...draft,interaction:e.target.value})}/></label>{draft.kind!=='h5'&&<><label>画面和人物动作<textarea value={draft.visual} onChange={e=>setDraft({...draft,visual:e.target.value})}/></label><label>台词<textarea value={draft.dialogue} onChange={e=>setDraft({...draft,dialogue:e.target.value})}/></label><label>谁来说<div className="vc-options">{project.speakers.map(s=><button className={draft.speakerId===s.id?'selected':''} key={s.id} onClick={()=>setDraft({...draft,speakerId:s.id})}>{s.name}</button>)}</div></label><label>预计视频时长（秒）<input type="number" min={3} max={60} value={draft.seconds} onChange={e=>setDraft({...draft,seconds:Number(e.target.value)})}/></label></>}<label>怎样进入下一环节<textarea value={draft.next} onChange={e=>setDraft({...draft,next:e.target.value})}/></label></div><p className="vc-hint">这里修改教学方案。确认后，会据此准备图片、配音和视频。</p><footer className="vc-actions"><button className="vc-btn" onClick={onClose}>取消</button><button className="vc-btn primary" disabled={!draft.title.trim()||!draft.purpose.trim()} onClick={()=>{update(project.id,synchronizeSegment(project,draft));onClose();}}>保存修改</button></footer></VideoModal>;
}
function PlanContents({project,readOnly}:{project:VideoProject;readOnly:boolean}){
 const [editing,setEditing]=useState<VideoSegment|null>(null),[expanded,setExpanded]=useState(false);const update=useVideoCoursewareStore(s=>s.update);const shown=expanded?project.segments:project.segments.slice(0,5);
 function move(id:string,delta:number){const next=[...project.segments],index=next.findIndex(s=>s.id===id);[next[index],next[index+delta]]=[next[index+delta],next[index]];update(project.id,{segments:next,pendingEdit:'调整环节顺序'});}
 return <><div className="vc-plan-summary"><span><Film size={15}/>视频用于{project.videoUse}</span><span>{project.segments.filter(s=>s.kind!=='h5').length} 段视频 · 约 {Math.round(project.segments.reduce((n,s)=>n+s.seconds,0))} 秒</span></div><div className="vc-segments">{shown.map((s,i)=><div className="vc-segment" key={s.id}><span className="vc-order">{i+1}</span><div className="vc-segment-copy"><div><b>{s.title}</b><span className={`vc-kind vc-kind-${s.kind}`}>{s.kind==='h5'?<Gamepad2 size={13}/>:s.kind==='video'?<Film size={13}/>:<Layers size={13}/ >}{segmentLabels[s.kind]}</span></div><p>{s.purpose}</p><small>{s.kind==='h5'?'由学生操作推进':`视频约 ${s.seconds} 秒`} · {s.next}</small></div>{!readOnly&&<div className="vc-segment-actions"><button className="vc-btn edit" onClick={()=>setEditing(s)}><PencilLine size={13}/>编辑</button><button className="vc-icon" aria-label={`上移${s.title}`} disabled={i===0} onClick={()=>move(s.id,-1)}><ArrowUp size={13}/></button><button className="vc-icon" aria-label={`下移${s.title}`} disabled={i===project.segments.length-1} onClick={()=>move(s.id,1)}><ArrowDown size={13}/></button></div>}</div>)}</div>{project.segments.length>5&&<button className="vc-text-btn" onClick={()=>setExpanded(!expanded)}>{expanded?'收起环节':`展开全部 ${project.segments.length} 个环节`}<ChevronDown size={14}/></button>}{editing&&<SegmentEditor project={project} segment={editing} onClose={()=>setEditing(null)}/>}</>;
}
function SpeakerSettings({project,readOnly=false}:{project:VideoProject;readOnly?:boolean}){
 const update=useVideoCoursewareStore(s=>s.update);
 return <section className="vc-speakers"><h3><Volume2 size={16}/>旁白和角色配音</h3><p className="vc-hint">旁白负责讲解与读题；有台词的人物分别使用自己的声音。</p>{project.speakers.map(s=><div className="vc-speaker" key={s.id}><div><b>{s.name}</b><small>{s.role==='narrator'?'讲解、读题与反馈':'角色对白与行动邀请'}</small></div>{readOnly?<span>{s.voiceName}</span>:<GenerationPreferencePicker controls="voice" voiceLabel={s.role==='narrator'?'旁白音色':'角色音色'} showMode={false} value={{voiceMode:'manual',voiceName:s.voiceName,voiceId:s.voiceId,voiceLanguage:s.voiceLanguage||(project.subject==='英语'?'英语-英音':'中文')}} onChange={value=>update(project.id,{speakers:project.speakers.map(x=>x.id===s.id?{...x,voiceName:value.voiceName||'智能匹配',voiceId:value.voiceId,voiceLanguage:value.voiceLanguage}:x),preferences:s.role==='narrator'?{...project.preferences,voiceMode:value.voiceMode,voiceName:value.voiceName,voiceId:value.voiceId,voiceLanguage:value.voiceLanguage}:project.preferences,approvedPlanKey:undefined,readyAssetIds:project.readyAssetIds.filter(id=>!project.assets.some(a=>a.id===id&&a.kind==='audio'&&a.speakerId===s.id)),pendingEdit:`调整${s.name}的声音`})}/>}</div>)}</section>;
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
 const [imagesOpen,setImagesOpen]=useState(true),[audioOpen,setAudioOpen]=useState(true),[viewing,setViewing]=useState<MediaAsset|null>(null),[edit,setEdit]=useState(false);
 const images=project.assets.filter(a=>a.kind==='image'&&!a.planningOnly),audio=project.assets.filter(a=>a.kind==='audio');
 const stateFor=(items:MediaAsset[])=>{
  const count=items.filter(a=>project.readyAssetIds.includes(a.id)).length;
  const progress=Math.round(count/Math.max(1,items.length)*100);
  const status=count===items.length?'completed':project.phase==='failed'?'failed':project.phase==='paused'?'paused':'in-progress';
  return {status,progress,detail:'已完成 '+count+' / '+items.length+' 项',error:project.error} as const;
 };
 const ready=(a:MediaAsset)=>project.readyAssetIds.includes(a.id);
 const showReview=project.job?.kind==='video-plan'||Boolean(project.shots?.length);
 return <><div className="vc-generation-cards">
  <ImageGenerationPanelV2 stage={stateFor(images)} items={images.map(a=>({id:a.id,label:a.name,src:ready(a)?a.url:undefined,prompt:a.role||a.prompt,status:ready(a)?'completed':'generating'}))} isExpanded={imagesOpen} onToggle={()=>setImagesOpen(!imagesOpen)} onPreview={a=>setViewing(images.find(x=>x.id===a.id)!)} onRetry={()=>useVideoCoursewareStore.getState().resume(project.id)}/>
  <AudioGenerationPanel stage={stateFor(audio)} items={audio.map(a=>({id:a.id,label:a.name,url:ready(a)?a.url:undefined,type:'tts',duration:a.seconds,status:ready(a)?'completed':'generating'}))} groups={project.speakers.map(s=>({id:s.id,label:s.name+' · '+s.voiceName,itemIds:audio.filter(a=>a.speakerId===s.id).map(a=>a.id)}))} isExpanded={audioOpen} onToggle={()=>setAudioOpen(!audioOpen)} onPreview={a=>setViewing(audio.find(x=>x.id===a.id)!)} onRetry={()=>useVideoCoursewareStore.getState().resume(project.id)}/>
 </div>
 {!readOnly&&<div className="vc-material-actions"><span>{project.job?.kind==='assets'?'正在生成图片和配音，完成后会自动整理视频方案。':'图片与配音可分别查看和调整。'}</span><button className="vc-btn" disabled={project.phase!=='assets-review'} onClick={()=>setEdit(true)}><PencilLine size={14}/>编辑资源</button></div>}
 {showReview&&<VideoPlanReview project={project} readOnly={readOnly}/>}
 {!readOnly&&<JobControls project={project}/>}
 {viewing&&<MediaViewer project={project} asset={viewing} onClose={()=>setViewing(null)}/>}
 {edit&&<VideoResourceEditor projectId={project.id} onClose={()=>setEdit(false)}/>}
 </>;
}
function Production({project,readOnly=false}:{project:VideoProject;readOnly?:boolean}){
 const [viewing,setViewing]=useState<MediaAsset|null>(null);
 const videos=project.assets.filter(a=>a.kind==='video');
 return <section className="vc-card vc-production">{project.job&&!readOnly?<GenerationProgress project={project} embedded/>:<h3><Check size={17}/>视频与互动课件已生成</h3>}<div className="vc-asset-grid">{videos.map(a=><button className="vc-asset" key={a.id} disabled={!project.readyAssetIds.includes(a.id)} onClick={()=>setViewing(a)}>{project.readyAssetIds.includes(a.id)?<><img src={a.poster||a.url} alt={a.name}/><Play className="vc-play-overlay" size={25}/></>:<div className="vc-media-placeholder"><Loader2 className={project.phase==='paused'?'':'vc-spin'} size={20}/><span>{project.phase==='failed'?'等待重试':project.phase==='paused'?'已暂停':'生成中'}</span></div>}<b>{a.name}</b><small>{a.seconds} 秒</small></button>)}</div>{!readOnly&&<JobControls project={project}/ >}{viewing&&<MediaViewer project={project} asset={viewing} onClose={()=>setViewing(null)}/>}</section>;
}
export default function VideoWorkflowCard({projectId,stage='plan',runId}:{projectId:string;stage?:'plan'|'assets'|'production';runId?:string}){
 const current=useVideoCoursewareStore(s=>s.projects[projectId]),store=useVideoCoursewareStore();
 if(!current)return null;
 if(stage==='plan'){
  if(current.phase==='planning')return <GenerationProgress project={current}/>;
  const editable=current.phase==='plan';
  return <div className="vc-workflow" data-video-plan={current.id}><RequirementCard title="视频互动课件设计方案确认" framework={current.framework} readOnly={!editable} onFrameworkChange={framework=>store.update(current.id,{framework,approvedPlanKey:undefined,pendingEdit:'调整教学方案'})} featureContent={<PlanContents project={current} readOnly={!editable}/>}><SpeakerSettings project={current} readOnly={!editable}/>{editable&&<p className="vc-hint">确认后先生成图片与配音，再结合素材整理视频方案，确认合适后生成视频。</p>}</RequirementCard>{editable&&<div className="vc-confirm-action"><button className="vc-btn primary" disabled={!current.framework.userRequirement.trim()} onClick={()=>{useConversationStore.getState().addUserMessage(current.conversationId,'确认需求，开始生成图片和配音。');ensureWorkflowMessage(current,'assets');useConversationStore.getState().setWaitingForUserAction(current.conversationId,false);store.start(current.id,'assets');}}>确认需求，开始生成</button></div>}</div>;
 }
 const isOld=Boolean(current.workflowRuns?.[stage]&&runId!==current.workflowRuns[stage])||(stage==='production'&&!['video-loading','assembling','ready'].includes(current.phase)&&current.job?.kind!=='video'&&current.job?.kind!=='assembly');
 const snapshot=runId?current.workflowSnapshots?.[runId]:undefined;
 if(isOld&&!snapshot)return <div className="vc-history-summary"><Check size={17}/>{stage==='assets'?'此前的图片和配音已确认':'此前的视频与互动课件已生成'}</div>;
 if(!isOld&&(current.phase==='plan'||current.phase==='planning'))return null;
 const project=snapshot&&isOld?{...current,...snapshot,phase:'ready' as const,job:undefined,readyAssetIds:snapshot.assets.filter(a=>a.url).map(a=>a.id)}:current;
 const readOnly=isOld||(stage==='assets'&&project.phase!=='assets-review'&&project.job?.kind!=='assets'&&project.job?.kind!=='video-plan');
 return <div className="vc-workflow" data-workflow-stage={stage}>{stage==='assets'?<Materials project={project} readOnly={readOnly}/>:<Production project={project} readOnly={isOld}/>}</div>;
}
