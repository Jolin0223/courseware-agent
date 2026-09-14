import { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Check, ChevronDown, Film, Gamepad2, Image as ImageIcon, Layers, Loader2, PencilLine, Plus, Volume2, X } from 'lucide-react';
import type { MediaAsset, OutlineChapter, VideoProject, VideoSegment, WorkflowStage } from '../../data/videoCourseware/model';
import { segmentLabels } from '../../data/videoCourseware/model';
import { outlineIssues } from '../../data/videoCourseware/outline';
import { buildVideoShots, materialsKey, synchronizeSegment, videoPlanIssues } from '../../data/videoCourseware/planning';
import { useVideoCoursewareStore } from '../../store/videoCoursewareStore';
import { confirmOutline, confirmVideoPlan } from './workflow';
import GenerationPreferencePicker from '../Generator/GenerationPreferencePicker';
import { AssetPreview, AudioPreview, VideoModal } from './Shared';
import { ShotEditor } from './VideoPlanReview';
import VideoResourceEditor from './VideoResourceEditor';
import { runtimeURL, sendRuntimeSettings } from './runtime';
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
 function reorder(i:number,delta:number){const next=[...chapters];[next[i],next[i+delta]]=[next[i+delta],next[i]];store.update(project.id,{chapters:next});}
 function save(){if(!editing)return;store.update(project.id,{chapters:chapters.some(c=>c.id===editing.id)?chapters.map(c=>c.id===editing.id?editing:c):[...chapters,editing]});setEditing(null);}
 if(project.phase==='planning')return <section className="vc-card"><h3><Loader2 className="vc-spin" size={17}/>正在整理教学大纲</h3><p>根据需求与材料，整理本课讲什么、按什么顺序讲。</p></section>;
 return <section className="vc-card of-outline" data-video-plan={project.id}><div className="of-card-heading"><div><span className="of-step">01 · 教学大纲</span><h3>先确定这节课讲什么</h3><p>可修改章节内容、增删章节和调整顺序。</p></div><span className="of-status">{readOnly?'已确认':'待确认'}</span></div>
 <div className="vc-form"><label>教学目标<textarea aria-label="教学目标" readOnly={readOnly} value={project.framework.userRequirement} onChange={e=>store.update(project.id,{framework:{...project.framework,userRequirement:e.target.value}})}/></label></div>
 <div className="vc-tabs" role="tablist" aria-label="大纲与偏好"><button role="tab" aria-selected={tab==='outline'} className={tab==='outline'?'active':''} onClick={()=>setTab('outline')}>教学大纲</button><button role="tab" aria-selected={tab==='style'} className={tab==='style'?'active':''} onClick={()=>setTab('style')}>画面与配音</button></div>
 {tab==='style'?<Preferences project={project} readOnly={readOnly}/>:<div role="tabpanel"><div className="of-list-heading"><span>{chapters.length} 个章节</span>{!readOnly&&<button className="vc-text-btn" disabled={Boolean(editing)} onClick={()=>setEditing({id:crypto.randomUUID(),title:'',content:'',segmentIds:[]})}><Plus size={14}/>添加章节</button>}</div>
 <div className="of-chapters">{chapters.map((chapter,i)=><article key={chapter.id} className="of-chapter"><span className="of-number">{String(i+1).padStart(2,'0')}</span><div className="of-chapter-copy"><h4>{chapter.title}</h4><p>{chapter.content}</p>{removing===chapter.id&&<div className="of-delete"><span>删除本章及其后续场景安排？</span><button className="vc-btn" onClick={()=>setRemoving(null)}>取消</button><button className="vc-btn" onClick={()=>{store.update(project.id,{chapters:chapters.filter(c=>c.id!==chapter.id)});setRemoving(null);}}>删除章节</button></div>}</div>{!readOnly&&<div className="of-row-actions"><button className="vc-text-btn" aria-label={'编辑章节 '+chapter.title} onClick={()=>setEditing({...chapter})}><PencilLine size={14}/>编辑</button><div><button className="vc-icon" aria-label={'上移章节 '+chapter.title} disabled={!i} onClick={()=>reorder(i,-1)}><ArrowUp size={14}/></button><button className="vc-icon" aria-label={'下移章节 '+chapter.title} disabled={i===chapters.length-1} onClick={()=>reorder(i,1)}><ArrowDown size={14}/></button><button className="vc-icon" aria-label={'删除章节 '+chapter.title} disabled={chapters.length===1} onClick={()=>setRemoving(chapter.id)}><X size={14}/></button></div></div>}</article>)}</div></div>}
 {!readOnly&&<footer className="of-confirm"><p>确认后规划场景，并依次准备图片和配音。</p><button className="vc-btn primary" disabled={Boolean(outlineIssues(project).length)||!project.framework.userRequirement.trim()||Boolean(editing)} onClick={()=>confirmOutline(project.id)}>确认教学大纲，继续生成</button></footer>}
 <p className="of-demo-note">流程演示 · 使用已制作的示例素材，未接入在线生成服务</p>
 {editing&&<VideoModal title={chapters.some(c=>c.id===editing.id)?'编辑章节':'添加章节'} onClose={()=>setEditing(null)}><div className="vc-form"><label>章节名称<input aria-label="章节名称" value={editing.title} onChange={e=>setEditing({...editing,title:e.target.value})}/></label><label>本章主要内容<textarea aria-label="本章主要内容" value={editing.content} placeholder="说明这一章要讲的知识、故事或任务。" onChange={e=>setEditing({...editing,content:e.target.value})}/></label></div><footer className="vc-actions"><button className="vc-btn" onClick={()=>setEditing(null)}>取消</button><button className="vc-btn primary" disabled={!editing.title.trim()||!editing.content.trim()} onClick={save}>保存章节</button></footer></VideoModal>}
 </section>;
}
function MaterialCards({project}:{project:VideoProject}){
 const [viewing,setViewing]=useState<MediaAsset|null>(null),[imagesOpen,setImagesOpen]=useState(true),[audioOpen,setAudioOpen]=useState(true);
 const images=project.assets.filter(a=>a.kind==='image'),audio=project.assets.filter(a=>a.kind==='audio');
 const imagesDone=images.every(a=>project.readyAssetIds.includes(a.id));
 const audioStarted=imagesDone&&project.job?.kind!=='scene-planning'&&project.job?.kind!=='images';
 const ready=(a:MediaAsset)=>project.readyAssetIds.includes(a.id);
 if(project.job?.kind==='scene-planning')return <section className="vc-card"><h3><Loader2 className="vc-spin" size={17}/>正在根据大纲规划场景</h3><p>整理每章需要的画面、台词和互动，随后开始准备图片。</p><Controls project={project}/></section>;
 return <><section className="vc-card"><div className="of-material-heading"><h3><ImageIcon size={18}/>图片生成 {imagesDone&&<Check size={16}/>}</h3><span>{images.filter(ready).length} / {images.length}</span><button aria-label="展开或收起图片" className="vc-icon" onClick={()=>setImagesOpen(!imagesOpen)}><ChevronDown size={16}/></button></div>{imagesOpen&&<div className="of-image-grid">{images.map(a=><button className="of-image-item" key={a.id} disabled={!ready(a)} onClick={()=>setViewing(a)}>{ready(a)?<img src={a.url} alt={a.name}/>:<div className="of-placeholder"><Loader2 className="vc-spin" size={19}/><span>准备中</span></div>}<b>{a.name}</b><small>{a.role}</small></button>)}</div>}</section>
 {audioStarted&&<section className="vc-card"><div className="of-material-heading"><h3><Volume2 size={18}/>音频生成 {audio.every(ready)&&<Check size={16}/>}</h3><span>{audio.filter(ready).length} / {audio.length}</span><button aria-label="展开或收起音频" className="vc-icon" onClick={()=>setAudioOpen(!audioOpen)}><ChevronDown size={16}/></button></div>{audioOpen&&project.speakers.map(s=><section key={s.id} className="of-audio-group"><h4>{s.name} · {s.voiceName}</h4><div className="of-audio-grid">{audio.filter(a=>a.speakerId===s.id).map(a=><div className="of-audio-item" key={a.id}><div><b>{a.name}</b><small>{a.seconds?`${a.seconds.toFixed(1)} 秒`:''}</small></div>{ready(a)?<><AudioPreview url={a.url}/><button className="vc-text-btn" onClick={()=>setViewing(a)}>文本</button></>:<Loader2 size={16} className="vc-spin"/>}</div>)}</div></section>)}</section>}
 {['images','audio'].includes(project.job?.kind||'')&&<Controls project={project}/>}
 {viewing&&<VideoModal title={viewing.name} onClose={()=>setViewing(null)}><AssetPreview asset={viewing}/></VideoModal>}
 </>;
}
function SceneCard({project,scene,index,readOnly}:{project:VideoProject;scene:VideoSegment;index:number;readOnly:boolean}){
 const [expanded,setExpanded]=useState(false),[draft,setDraft]=useState<VideoSegment|null>(null),[shotId,setShotId]=useState<string|null>(null),[resource,setResource]=useState<MediaAsset|null>(null);
 const store=useVideoCoursewareStore();
 const related=project.assets.filter(a=>a.segmentIds.includes(scene.id)),images=related.filter(a=>a.kind==='image'),audio=related.filter(a=>a.kind==='audio'),shots=project.shots?.filter(s=>s.segmentId===scene.id)||[];
 const thumbnail=images.find(a=>a.role==='镜头画面'||a.role==='封面')||images.find(a=>a.role==='场景画面')||images[0];
 function save(){
  if(!draft)return;
  const patch=synchronizeSegment(project,draft),next={...project,...patch};
  store.update(project.id,{...patch,shots:buildVideoShots(next),approvedMaterialsKey:materialsKey(next),readySceneIds:project.readySceneIds?.filter(id=>id!==scene.id)});setDraft(null);
 }
 return <article className="of-scene" data-scene-id={scene.id}><div className="of-scene-summary"><div className="of-scene-image">{thumbnail?<img src={thumbnail.url} alt={thumbnail.name}/>:<Gamepad2 size={25}/>}</div><div className="of-scene-copy"><span className="of-scene-index">场景 {index+1}</span><h4>{scene.title}</h4><Kind kind={scene.kind}/></div><button className="vc-text-btn" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?'收起':'查看方案'}<ChevronDown size={15}/></button></div>
 <p className="of-scene-description">{scene.content}</p>
 {expanded&&<div className="of-scene-details">{draft?<div className="vc-form of-inline-editor"><label>场景名称<input value={draft.title} aria-label="场景名称" onChange={e=>setDraft({...draft,title:e.target.value})}/></label><label>内容形式<div className="vc-options">{(['h5','video','mixed'] as const).map(kind=><button key={kind} className={draft.kind===kind?'selected':''} onClick={()=>setDraft({...draft,kind,seconds:kind==='h5'?0:draft.seconds||6})}>{segmentLabels[kind]}</button>)}</div></label><label>本场景内容<textarea aria-label="本场景内容" value={draft.content||''} onChange={e=>setDraft({...draft,content:e.target.value})}/></label><p className="vc-hint">描述希望看到的画面、讲述内容、互动任务与反馈。修改后只更新本场相关内容。</p><div className="vc-actions"><button className="vc-btn" onClick={()=>setDraft(null)}>取消</button><button className="vc-btn primary" disabled={!draft.title.trim()||!draft.content?.trim()} onClick={save}>保存场景内容</button></div></div>:!readOnly&&<button className="vc-btn edit" onClick={()=>setDraft({...scene})}><PencilLine size={14}/>修改场景内容</button>}
 <h5>本场图片</h5><div className="of-scene-assets">{images.map(a=><button key={a.id} onClick={()=>setResource(a)}><img src={a.url} alt={a.name}/><span>{a.name}</span></button>)}</div>{!images.length&&<p className="vc-hint">按场景内容制作页面。</p>}
 <h5>旁白与角色配音</h5>{audio.length?audio.map(a=><div className="of-scene-audio" key={a.id}><div><small>{project.speakers.find(s=>s.id===a.speakerId)?.name} · {a.name}</small><p>{a.text}</p></div><AudioPreview url={a.url}/>{!readOnly&&<button className="vc-text-btn" onClick={()=>setResource(a)}>修改</button>}</div>):<p className="vc-hint">本场无需配音。</p>}
 {shots.length>0&&<><h5>视频分镜</h5>{shots.map((shot,i)=><div className="of-scene-shot" key={shot.id}><div><b>{shots.length>1?`分镜 ${i+1} · `:''}{project.assets.find(a=>a.id===shot.videoAssetId)?.name}</b><small>{shot.seconds} 秒 · {shot.audioIds.length?'沿用本场配音':'环境画面'}</small></div>{!readOnly&&<button className="vc-btn edit" onClick={()=>setShotId(shot.id)}>修改视频方案</button>}</div>)}</>}
 </div>}
 {shotId&&project.shots?.find(s=>s.id===shotId)&&<ShotEditor project={project} shot={project.shots.find(s=>s.id===shotId)!} onClose={()=>setShotId(null)}/>}
 {resource&&(readOnly?<VideoModal title={resource.name} onClose={()=>setResource(null)}><AssetPreview asset={resource}/></VideoModal>:<VideoResourceEditor projectId={project.id} initialTab={resource.kind==='audio'?'audio':'image'} initialAssetId={resource.id} sceneId={scene.id} onClose={()=>setResource(null)}/>)}
 </article>;
}
function Scenes({project,readOnly}:{project:VideoProject;readOnly:boolean}){
 const issues=videoPlanIssues(project);
 return <section className="vc-card of-scene-plan"><div className="of-card-heading"><div><span className="of-step">02 · 场景方案</span><h3>确认每一场怎么呈现</h3><p>{project.chapters?.length} 个章节 · {project.segments.length} 个场景方案</p></div><span className="of-status">{readOnly?'已确认':'待确认'}</span></div><p className="of-plan-intro">图片与配音已放入对应场景。查看画面、台词和互动内容，需要调整的部分可单独修改。</p>
 {project.chapters?.map((c,i)=><section className="of-scene-chapter" key={c.id}><header><span>{String(i+1).padStart(2,'0')}</span><div><h4>{c.title}</h4><small>{project.segments.filter(s=>s.chapterId===c.id).length} 个场景</small></div></header>{project.segments.filter(s=>s.chapterId===c.id).map(s=><SceneCard key={s.id} project={project} scene={s} index={project.segments.indexOf(s)} readOnly={readOnly}/>)}</section>)}
 {!readOnly&&<footer className="of-confirm"><p>确认后生成视频与互动页面，再统一剪辑交付。</p>{issues.length>0&&<div role="alert">{[...new Set(issues)].map(x=><p className="vc-error" key={x}>{x}</p>)}</div>}<button className="vc-btn primary" disabled={Boolean(issues.length)} onClick={()=>confirmVideoPlan(project.id)}>确认全部场景，生成课件</button></footer>}
 </section>;
}
function Production({project}:{project:VideoProject}){
 const [viewing,setViewing]=useState<MediaAsset|null>(null),[sceneId,setSceneId]=useState<string|null>(null);
 const preview=useRef<HTMLIFrameElement>(null);
 const videos=project.assets.filter(a=>a.kind==='video'),done=videos.filter(a=>project.readyAssetIds.includes(a.id)).length;
 const pages=project.segments.filter(s=>s.kind!=='video');
 const h5Started=['h5','assembly'].includes(project.job?.kind||'')||project.phase==='ready';
 return <><section className="vc-card"><h3><Film size={18}/>{done===videos.length?'视频已准备好':'视频生成'}<span className="of-count">{done} / {videos.length}</span></h3><div className="of-image-grid">{videos.map(a=><button className="of-image-item" key={a.id} disabled={!project.readyAssetIds.includes(a.id)} onClick={()=>setViewing(a)}>{project.readyAssetIds.includes(a.id)?<img src={a.poster||project.assets.find(x=>x.id===a.videoInputs?.firstFrameId)?.url} alt={a.name}/>:<div className="of-placeholder"><Loader2 size={20} className="vc-spin"/></div>}<b>{a.name}</b><small>{a.seconds} 秒</small></button>)}</div></section>
 {h5Started&&<section className="vc-card"><h3><Gamepad2 size={18}/>互动页面生成<span className="of-count">{pages.filter(s=>project.readySceneIds?.includes(s.id)).length} / {pages.length}</span></h3><div className="of-page-results">{pages.map(s=><div key={s.id}><span>{s.title}</span>{project.readySceneIds?.includes(s.id)?<button className="vc-text-btn" onClick={()=>setSceneId(s.id)}>预览</button>:<Loader2 size={16} className="vc-spin"/>}</div>)}</div></section>}
 {['video','h5'].includes(project.job?.kind||'')&&<Controls project={project}/>}
 {viewing&&<VideoModal title={viewing.name} onClose={()=>setViewing(null)}><AssetPreview asset={viewing}/></VideoModal>}
 {sceneId&&<VideoModal title={project.segments.find(s=>s.id===sceneId)?.title||'页面预览'} onClose={()=>setSceneId(null)}><iframe ref={preview} onLoad={()=>sendRuntimeSettings(preview.current?.contentWindow,project,project.composition)} className="of-preview" title="互动页面预览" src={runtimeURL(project,project.composition,sceneId)} allow="autoplay; fullscreen"/></VideoModal>}
 </>;
}
export default function OutlineSceneFlow({project,stage,runId}:{project:VideoProject;stage:WorkflowStage;runId?:string}){
 const old=Boolean(project.workflowRuns?.[stage]&&runId!==project.workflowRuns[stage]);
 const snapshot=old&&runId?project.workflowSnapshots?.[runId]:undefined;
 const current=snapshot?{...project,...snapshot,phase:'ready' as const,job:undefined}:project;
 if(stage==='plan')return <Outline project={project}/>;
 if(!old&&['planning','plan'].includes(project.phase))return null;
 return <div className="vc-workflow of-flow" data-workflow-stage={stage}>{stage==='assets'?<MaterialCards project={current}/>:stage==='video-plan'?<Scenes project={current} readOnly={old||project.phase!=='assets-review'}/>:stage==='production'?<Production project={current}/>:<section className="vc-card"><h3>{current.phase==='assembling'?<Loader2 size={18} className="vc-spin"/>:<Check size={18}/>}剪辑与整课交付</h3><p>{current.phase==='assembling'?'对齐配音、字幕与画面，连接视频和互动页面。':'视频与互动页面已组合为一份课件。'}</p>{current.phase==='assembling'&&<Controls project={current}/>}</section>}</div>;
}
