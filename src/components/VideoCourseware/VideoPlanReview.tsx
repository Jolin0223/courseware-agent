import { useState } from 'react';
import { ChevronDown, Film, PencilLine, ArrowLeft, Loader2, Check, Volume2 } from 'lucide-react';
import type { VideoProject, VideoShot } from '../../data/videoCourseware/model';
import { shotIssues, shotPrompt, shotSourceKey, videoPlanIssues } from '../../data/videoCourseware/planning';
import { useVideoCoursewareStore } from '../../store/videoCoursewareStore';
import { VideoModal, AudioPreview } from './Shared';
import { confirmVideoPlan, beginVideoPlanReview } from './workflow';

function ShotEditor({project,shot,onClose}:{project:VideoProject;shot:VideoShot;onClose:()=>void}){
 const [draft,setDraft]=useState(shot);
 const images=project.assets.filter(a=>a.kind==='image'&&project.readyAssetIds.includes(a.id));
 const audio=project.assets.filter(a=>a.kind==='audio'&&a.segmentIds.includes(shot.segmentId));
 const update=(patch:Partial<VideoShot>)=>setDraft(current=>{const next={...current,...patch};return {...next,sourceKey:shotSourceKey(project,project.assets.find(a=>a.id===shot.videoAssetId)!,next),prompt:shotPrompt(project,next)};});
 const issues=shotIssues({...project,shots:project.shots?.map(s=>s.id===draft.id?draft:s)},draft);
 return <VideoModal title={'编辑视频方案 · '+project.assets.find(a=>a.id===shot.videoAssetId)?.name} onClose={onClose}>
  <div className="vc-form">
   <div className="vc-field-label">起始画面<div className="vc-frame-choices">{images.map(a=><button key={a.id} className={draft.firstFrameId===a.id?'selected':''} onClick={()=>update({firstFrameId:a.id})}><img src={a.url} alt=""/><span>{a.name}</span>{draft.firstFrameId===a.id&&<Check size={15}/>}</button>)}</div></div>
   <label>画面与人物动作<textarea value={draft.action} onChange={e=>update({action:e.target.value})}/></label>
   <label>视频中的配音</label><div className="vc-shot-audio">{audio.length?audio.map(a=><label className="vc-checkbox" key={a.id}><input type="checkbox" checked={draft.audioIds.includes(a.id)} onChange={e=>update({audioIds:e.target.checked?[...draft.audioIds,a.id]:draft.audioIds.filter(id=>id!==a.id)})}/><span>{project.speakers.find(s=>s.id===a.speakerId)?.name} · {a.text}<small>{a.seconds?.toFixed(1)} 秒</small></span><AudioPreview url={a.url}/></label>):<p className="vc-hint">本段不使用配音。</p>}</div>
   <label>视频时长（秒）<input aria-label="视频时长（秒）" type="number" min={1} max={60} step={.1} value={draft.seconds} onChange={e=>update({seconds:Number(e.target.value)})}/></label>
   <label>结束画面与后续互动<textarea value={draft.ending} onChange={e=>update({ending:e.target.value})}/></label>
   <label className="vc-checkbox"><input type="checkbox" checked={Boolean(draft.lastFrameId)} onChange={e=>update({lastFrameId:e.target.checked?draft.firstFrameId:undefined})}/>指定结束参考画面</label>
   {draft.lastFrameId&&<div className="vc-frame-choices">{images.map(a=><button className={draft.lastFrameId===a.id?'selected':''} key={a.id} onClick={()=>update({lastFrameId:a.id})}><img src={a.url} alt=""/><span>{a.name}</span></button>)}</div>}
   <details className="vc-details"><summary>查看和修改视频生成描述</summary><textarea aria-label="视频生成描述" value={draft.prompt} onChange={e=>setDraft({...draft,prompt:e.target.value})}/></details>
  </div>
  {issues.map(x=><p className="vc-error" key={x}>{x}</p>)}
  <footer className="vc-actions"><button className="vc-btn" onClick={onClose}>取消</button><button className="vc-btn primary" disabled={Boolean(issues.length)} onClick={()=>{useVideoCoursewareStore.getState().update(project.id,{shots:project.shots?.map(s=>s.id===draft.id?draft:s),approvedPlanKey:undefined,readyAssetIds:project.readyAssetIds.filter(id=>id!==draft.videoAssetId)});onClose();}}>保存视频方案</button></footer>
 </VideoModal>;
}
export default function VideoPlanReview({project,readOnly=false}:{project:VideoProject;readOnly?:boolean}){
 const [expanded,setExpanded]=useState<string|null>(null),[editing,setEditing]=useState<VideoShot|null>(null);
 const planning=project.job?.kind==='video-plan';
 const paused=project.phase==='paused';
 const issues=videoPlanIssues(project);
 return <section className="vc-card vc-video-plan" data-video-review={project.id}>
  <header className="vc-card-header"><div><h3>{planning?<Loader2 size={17} className={paused?'':'vc-spin'}/>:<Film size={17}/ >}{planning?(paused?'视频方案整理已暂停':'正在整理视频方案'):readOnly?'已确认的视频方案':'确认画面、配音与视频方案'}</h3><p>{planning?'正在结合已生成的图片和实际配音时长，安排每段视频的画面、动作与收尾。':readOnly?'视频将按以下方案制作。':'逐段查看画面和配音，确认动作、时长以及视频结束后的互动。需要调整的部分可以单独编辑。'}</p></div></header>
  {planning?<><div className="vc-planning-steps"><span><Check size={14}/>读取图片与配音</span><span><Loader2 size={14} className={paused?'':'vc-spin'}/>准备起始画面与镜头描述</span><span>检查时长和互动衔接</span></div><div className="vc-frame-loading">{project.assets.filter(a=>a.planningOnly).map(a=><div key={a.id}>{project.readyAssetIds.includes(a.id)?<img src={a.url} alt={a.name}/>:<div className="vc-media-placeholder"><Loader2 className={paused?'':'vc-spin'} size={20}/>{paused?'已暂停':'正在准备画面'}</div>}<span>{a.name}</span></div>)}</div></>:<div className="vc-shots">{project.shots?.map((shot,i)=>{
   const video=project.assets.find(a=>a.id===shot.videoAssetId),frame=project.assets.find(a=>a.id===shot.firstFrameId);
   const segment=project.segments.find(s=>s.id===shot.segmentId);
   const audio=project.assets.filter(a=>shot.audioIds.includes(a.id));
   const errors=shotIssues(project,shot),open=expanded===shot.id;
   return <article className="vc-shot" key={shot.id}><div className="vc-shot-summary"><div className="vc-shot-frame">{frame?.url&&project.readyAssetIds.includes(frame.id)?<img src={frame.url} alt={'起始画面 · '+video?.name}/>:<div className="vc-media-placeholder">待准备画面</div>}<small>起始画面</small></div><div className="vc-shot-copy"><h4>{i+1}. {video?.name}<span>{shot.seconds} 秒</span></h4><p>{shot.action}</p><small><Volume2 size={13}/>{audio.length?audio.map(a=>project.speakers.find(s=>s.id===a.speakerId)?.name).filter((x,i,all)=>all.indexOf(x)===i).join('、')+' · 配音共 '+audio.reduce((n,a)=>n+(a.seconds||0),0).toFixed(1)+' 秒':'无配音 · 环境画面'}</small><small>{segment?.kind==='mixed'?'视频＋互动':'视频'} · {segment?.next}</small></div><div className="vc-shot-buttons">{!readOnly&&<button className="vc-btn edit" onClick={()=>setEditing(shot)}><PencilLine size={13}/>编辑</button>}<button className="vc-text-btn" aria-expanded={open} onClick={()=>setExpanded(open?null:shot.id)}>{open?'收起':'展开'}<ChevronDown size={13}/></button></div></div>
   {errors.map(x=><p key={x} className="vc-error">{x}</p>)}
   {open&&<div className="vc-shot-details"><h4>视频配音</h4>{audio.map(a=><div className="vc-shot-audio-row" key={a.id}><p><b>{project.speakers.find(s=>s.id===a.speakerId)?.name}</b> · {a.text}<small>{a.seconds?.toFixed(1)} 秒</small></p><AudioPreview url={a.url}/></div>)}{!audio.length&&<p>本段没有对白。</p>}<h4>结束画面与互动衔接</h4><p>{shot.ending}</p>{shot.lastFrameId&&<img className="vc-tail-frame" src={project.assets.find(a=>a.id===shot.lastFrameId)?.url} alt="结束参考画面"/>}<details className="vc-details"><summary>查看视频生成描述</summary><pre>{shot.prompt}</pre></details></div>}
   </article>;
  })}</div>}
  {!readOnly&&!planning&&<footer className="vc-actions"><button className="vc-btn" onClick={()=>{useVideoCoursewareStore.getState().update(project.id,{phase:'plan',job:undefined,approvedPlanKey:undefined});requestAnimationFrame(()=>document.querySelector('[data-video-plan="'+project.id+'"]')?.scrollIntoView({behavior:'smooth',block:'start'}));}}><ArrowLeft size={14}/>返回修改方案</button>{issues.length>0&&<button className="vc-btn" onClick={()=>beginVideoPlanReview(project.id)}>更新视频方案</button>}<button className="vc-btn primary" disabled={Boolean(issues.length)} onClick={()=>confirmVideoPlan(project.id)}>确认方案，生成视频</button></footer>}
  {editing&&<ShotEditor project={project} shot={editing} onClose={()=>setEditing(null)}/>}
 </section>;
}
