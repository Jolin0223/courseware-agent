import { useRef, useState } from 'react';
import { ArrowLeft, Film, Image as ImageIcon, Plus, Volume2, X } from 'lucide-react';
import type { AudioCue, MediaAsset, VideoProject, VideoSegment, VideoShot } from '../../data/videoCourseware/model';
import { segmentLabels } from '../../data/videoCourseware/model';
import { arrangeAudioCues, buildVideoShots, synchronizeSegment, shotIssues } from '../../data/videoCourseware/planning';
import { prepareSceneEdit } from '../../data/videoCourseware/sceneEditing';
import { useVideoCoursewareStore } from '../../store/videoCoursewareStore';
import { AssetPreview, AudioPreview, VideoModal } from './Shared';
import VideoResourceEditor from './VideoResourceEditor';

type Picker={target:'content'|'reference'|'audio'|'first'|'last';shotId?:string;kind:'image'|'audio'};
export default function SceneEditor({project,sceneId,readOnly,onClose,onSubmit,saveLabel='保存本场修改',allowSubmitUnchanged=false}:{project:VideoProject;sceneId:string;readOnly:boolean;onClose:()=>void;onSubmit?:(draft:VideoProject)=>void;saveLabel?:string;allowSubmitUnchanged?:boolean}){
 const [original]=useState(()=>structuredClone(project));
 const [draft,setDraft]=useState(()=>structuredClone(project));
 const [resource,setResource]=useState<string|null>(null),[picker,setPicker]=useState<Picker|null>(null),[all,setAll]=useState(false);
 const [search,setSearch]=useState('');
 const field=useRef<HTMLTextAreaElement|null>(null);
 const insertion=useRef<{target:'content'|'shot';shotId?:string;start:number;end:number}>({target:'content',start:0,end:0});
 const scene=draft.segments.find(s=>s.id===sceneId)!;
 const shots=(draft.shots||[]).filter(s=>s.segmentId===sceneId);
 const related=draft.assets.filter(a=>a.kind!=='video'&&a.segmentIds.includes(sceneId));
 const asset=(id?:string)=>draft.assets.find(a=>a.id===id);
 const patch=prepareSceneEdit(original,draft,sceneId);
 const candidate={...draft,...patch};
 const issues=[...(!scene.title.trim()?['请填写场景名称。']:[]),...(!scene.content?.trim()?['请填写本场景内容。']:[]),...(candidate.shots||[]).filter(s=>s.segmentId===sceneId).flatMap(s=>shotIssues(candidate,s))];
 const dirty=JSON.stringify(original)!==JSON.stringify(draft);
 function editScene(values:Partial<VideoSegment>){setDraft(p=>({...p,segments:p.segments.map(s=>s.id===sceneId?{...s,...values}:s)}));}
 function changeKind(kind:VideoSegment['kind']){
  const next={...draft,...synchronizeSegment(draft,{...scene,kind,seconds:kind==='h5'?0:scene.seconds||6})};
  next.shots=buildVideoShots(next);setDraft(next);
 }
 function editShot(id:string,values:Partial<VideoShot>){setDraft(p=>({...p,shots:p.shots?.map(s=>s.id===id?{...s,...values}:s)}));}
 function remember(target:'content'|'shot',el:HTMLTextAreaElement,shotId?:string){field.current=el;insertion.current={target,shotId,start:el.selectionStart,end:el.selectionEnd};}
 function openPicker(value:Picker){setPicker(value);setAll(false);setSearch('');}
 function insert(a:MediaAsset){
  if(!picker)return;
  let next={...draft,assets:draft.assets.map(v=>v.id===a.id?{...v,segmentIds:[...new Set([...v.segmentIds,sceneId])]}:v)};
  const selected=next.shots?.find(s=>s.id===picker.shotId);
  if(selected){
   let values:Partial<VideoShot>={};
   if(picker.target==='first'||picker.target==='last')values=picker.target==='first'?{firstFrameId:a.id}:{lastFrameId:a.id};
   else if(a.kind==='image')values={references:selected.references?.some(r=>r.assetId===a.id)?selected.references:[...selected.references||[],{assetId:a.id,purpose:a.role||'画面参考',range:'整段视频'}]};
   else if(!selected.audioIds.includes(a.id)){
    const cue:AudioCue={id:crypto.randomUUID(),assetId:a.id,start:0,trimStart:0,trimEnd:a.seconds||0,mode:'playback',description:a.name};
    values=arrangeAudioCues(selected,[...selected.audioCues||[],cue]);
   }
   if(!['first','last'].includes(picker.target)){
    const pos=insertion.current.shotId===selected.id?insertion.current:{start:selected.prompt.length,end:selected.prompt.length};
    values.prompt=selected.prompt.slice(0,pos.start)+' @'+a.name+' '+selected.prompt.slice(pos.end);
   }
   next={...next,shots:next.shots?.map(s=>s.id===selected.id?{...s,...values}:s)};
  }else{
   const text=scene.content||'',pos=insertion.current.target==='content'?insertion.current:{start:text.length,end:text.length};
   next={...next,segments:next.segments.map(s=>s.id===sceneId?{...s,content:text.slice(0,pos.start)+' @'+a.name+' '+text.slice(pos.end)}:s)};
  }
  setDraft(next);setPicker(null);field.current?.focus();
 }
 function removeReference(id:string){
  const name=asset(id)?.name||'';
  setDraft(p=>({...p,assets:p.assets.map(a=>a.id===id?{...a,segmentIds:a.segmentIds.filter(s=>s!==sceneId)}:a),segments:p.segments.map(s=>s.id===sceneId?{...s,content:s.content?.replaceAll('@'+name,name)}:s),shots:p.shots?.map(s=>s.segmentId===sceneId?{...s,firstFrameId:s.firstFrameId===id?undefined:s.firstFrameId,lastFrameId:s.lastFrameId===id?undefined:s.lastFrameId,references:s.references?.filter(r=>r.assetId!==id),audioCues:s.audioCues?.filter(c=>c.assetId!==id),audioIds:s.audioIds.filter(a=>a!==id),prompt:s.prompt.replaceAll('@'+name,name)}:s)}));
 }
 const choices=draft.assets.filter(a=>a.kind===picker?.kind&&a.url&&draft.readyAssetIds.includes(a.id)&&(all||a.segmentIds.includes(sceneId))&&a.name.toLowerCase().includes(search.toLowerCase()));
 const editedResource=asset(resource||undefined);
 return <VideoModal className="vc-scene-modal" title={'场景 '+(project.segments.findIndex(s=>s.id===sceneId)+1)+' · '+scene.title} onClose={onClose}>
  {resource&&editedResource?<>
   <div className="se-resource-back"><button className="vc-text-btn" onClick={()=>setResource(null)}><ArrowLeft size={16}/>返回场景方案</button><span>{editedResource.name}</span></div>
   {readOnly?<AssetPreview asset={editedResource}/>:<VideoResourceEditor key={resource} projectId={project.id} embeddedProject={draft} initialAssetId={resource} initialTab={editedResource.kind==='audio'?'audio':'image'} sceneId={sceneId} onSave={values=>setDraft(p=>({...p,...values}))} onClose={()=>setResource(null)}/>}
  </>:<>
   <div className="se-layout">
    <main className="se-main">
     <section className="se-section"><h3>基本信息</h3><div className="vc-form"><label>场景名称<input aria-label="场景名称" readOnly={readOnly} value={scene.title} onChange={e=>editScene({title:e.target.value})}/></label><div><label className="se-label">内容形式</label><div className="vc-options" role="group" aria-label="内容形式">{(['h5','video','mixed'] as const).map(kind=><button key={kind} disabled={readOnly} className={scene.kind===kind?'selected':''} onClick={()=>changeKind(kind)}>{segmentLabels[kind]}</button>)}</div></div></div></section>
     <section className="se-section"><div className="vc-field-heading"><h3>{scene.kind==='mixed'?'场景与互动内容':'本场景内容'}</h3>{!readOnly&&<button className="vc-text-btn" onClick={()=>openPicker({target:'content',kind:'image'})}><Plus size={14}/>引用素材</button>}</div><textarea className="se-content" aria-label="本场景内容" readOnly={readOnly} value={scene.content||''} placeholder="描述希望出现的画面、讲述内容、互动任务与反馈。" onSelect={e=>remember('content',e.currentTarget)} onChange={e=>editScene({content:e.target.value})} onKeyDown={e=>{if(e.key==='@'&&!readOnly){e.preventDefault();remember('content',e.currentTarget);openPicker({target:'content',kind:'image'});}}}/><p className="vc-hint">输入 @ 引用图片或配音，素材统一显示在右侧。</p></section>
     {shots.map((shot,i)=><section className="se-section se-shot" key={shot.id} data-shot-id={shot.id}><div className="vc-field-heading"><h3><Film size={16}/>{shots.length>1?'视频 '+(i+1)+' · '+asset(shot.videoAssetId)?.name:'视频画面描述'}</h3><label className="se-duration">时长<input aria-label={'视频时长（秒） '+(i+1)} readOnly={readOnly} type="number" min={1} max={60} step={.1} value={shot.seconds} onChange={e=>editShot(shot.id,{seconds:Number(e.target.value)})}/>秒</label></div>
      <div className="se-prompt-actions"><span>动作、镜头与配音安排</span>{!readOnly&&<button className="vc-text-btn" onClick={()=>openPicker({target:'reference',kind:'image',shotId:shot.id})}><Plus size={14}/>插入素材</button>}</div>
      <textarea className="se-video-prompt" aria-label={'视频生成描述 '+(i+1)} readOnly={readOnly} value={shot.prompt} onSelect={e=>remember('shot',e.currentTarget,shot.id)} onChange={e=>editShot(shot.id,{prompt:e.target.value})} onKeyDown={e=>{if(e.key==='@'&&!readOnly){e.preventDefault();remember('shot',e.currentTarget,shot.id);openPicker({target:'reference',kind:'image',shotId:shot.id});}}}/>
      <div className="se-mentions">{shot.references?.map(r=><button className="se-mention" key={r.assetId} onClick={()=>setResource(r.assetId)}><ImageIcon size={13}/> {asset(r.assetId)?.name}</button>)}</div>
      {Boolean(shot.references?.length)&&<details className="se-reference-settings"><summary>参考素材用途</summary>{shot.references?.map((r,j)=><div className="vc-form" key={r.assetId}><b>{asset(r.assetId)?.name}</b><label>用途<input aria-label={'参考用途 '+(i+1)+'-'+(j+1)} readOnly={readOnly} value={r.purpose} onChange={e=>editShot(shot.id,{references:shot.references?.map(v=>v.assetId===r.assetId?{...v,purpose:e.target.value}:v)})}/></label><label>使用范围<input aria-label={'使用范围 '+(i+1)+'-'+(j+1)} readOnly={readOnly} value={r.range} onChange={e=>editShot(shot.id,{references:shot.references?.map(v=>v.assetId===r.assetId?{...v,range:e.target.value}:v)})}/></label></div>)}</details>}
      <div className="se-frame-row">{(['first','last'] as const).map(mode=>{const id=mode==='first'?shot.firstFrameId:shot.lastFrameId;return <div key={mode}><span>{mode==='first'?'首帧':'尾帧'} · 选填</span><button className="se-frame" disabled={readOnly} onClick={()=>openPicker({target:mode,kind:'image',shotId:shot.id})}>{id?<img src={asset(id)?.url} alt={mode==='first'?'已选首帧':'已选尾帧'}/>:<ImageIcon size={20}/>}<span>{id?asset(id)?.name:'未设置'}</span></button>{id&&!readOnly&&<button className="vc-text-btn" onClick={()=>editShot(shot.id,mode==='first'?{firstFrameId:undefined}:{lastFrameId:undefined})}>清除{mode==='first'?'首帧':'尾帧'}</button>}</div>;})}</div>
      <div className="vc-field-heading"><h4>配音与画面</h4>{!readOnly&&<button className="vc-text-btn" onClick={()=>openPicker({target:'audio',kind:'audio',shotId:shot.id})}><Plus size={14}/>添加配音</button>}</div>
      {shot.audioCues?.map((cue,j)=><div className="se-cue" key={cue.id}><div className="vc-field-heading"><button className="vc-text-btn" onClick={()=>setResource(cue.assetId)}><Volume2 size={14}/>{asset(cue.assetId)?.name}</button><AudioPreview url={asset(cue.assetId)?.url}/>{!readOnly&&<button className="vc-icon" aria-label={'移除视频配音 '+(i+1)+'-'+(j+1)} onClick={()=>editShot(shot.id,{audioCues:shot.audioCues?.filter(c=>c.id!==cue.id),audioIds:shot.audioIds.filter(id=>id!==cue.assetId)})}><X size={14}/></button>}</div><label className="vc-form">对应画面<input aria-label={'配音对应画面 '+(i+1)+'-'+(j+1)} readOnly={readOnly} value={cue.description} onChange={e=>editShot(shot.id,{audioCues:shot.audioCues?.map(c=>c.id===cue.id?{...c,description:e.target.value}:c)})}/></label></div>)}
      {!shot.audioCues?.length&&<p className="vc-hint">本段无需对白。</p>}
     </section>)}
    </main>
    <aside className="se-materials">
     {picker?<div className="se-picker"><div className="vc-field-heading"><h3>{picker.target==='first'?'选择首帧':picker.target==='last'?'选择尾帧':'引用素材'}</h3><button className="vc-icon" aria-label="关闭素材选择" onClick={()=>setPicker(null)}><X size={16}/></button></div><div className="vc-options">{!['first','last'].includes(picker.target)&&(['image','audio'] as const).map(kind=><button className={picker.kind===kind?'selected':''} key={kind} onClick={()=>setPicker({...picker,kind})}>{kind==='image'?'图片':'配音'}</button>)}</div><input className="se-search" aria-label="搜索素材" placeholder="搜索素材名称" value={search} onChange={e=>setSearch(e.target.value)}/><label className="se-all"><input type="checkbox" checked={all} onChange={e=>setAll(e.target.checked)}/>显示本课全部素材</label><div className="se-picker-list">{choices.map(a=><button className="se-picker-item" key={a.id} onClick={()=>insert(a)}>{a.kind==='image'?<img src={a.url} alt=""/>:<Volume2 size={20}/>}<span>{a.name}<small>{a.kind==='image'?a.role:(a.seconds||0).toFixed(1)+' 秒'}</small></span><Plus size={14}/></button>)}</div>{!choices.length&&<p className="vc-hint">没有匹配的素材，试试本课全部素材。</p>}</div>:<>
      <div className="vc-field-heading"><h3>引用素材</h3>{!readOnly&&<button className="vc-text-btn" onClick={()=>openPicker({target:'content',kind:'image'})}><Plus size={14}/>添加</button>}</div><p className="vc-hint">点击图片或配音可编辑资源。</p>
      <h4>图片 · {related.filter(a=>a.kind==='image').length}</h4><div className="se-image-grid">{related.filter(a=>a.kind==='image').map(a=><div className="se-image-item" key={a.id}><button className="se-image-open" aria-label={'编辑图片 '+a.name} onClick={()=>setResource(a.id)}><img src={a.url} alt={a.name}/><span>{a.name}</span></button>{!readOnly&&<button className="se-remove" aria-label={'移除本场引用 '+a.name} onClick={()=>removeReference(a.id)}><X size={12}/></button>}</div>)}</div>
      <h4>旁白与角色配音 · {related.filter(a=>a.kind==='audio').length}</h4>{related.filter(a=>a.kind==='audio').map(a=><div className="se-audio-item" key={a.id}><button className="se-audio-open" aria-label={'编辑配音 '+a.name} onClick={()=>setResource(a.id)}><b>{a.name}</b><small>{draft.speakers.find(s=>s.id===a.speakerId)?.name}</small><p>{a.text||'上传的音频'}</p></button><div className="vc-field-heading"><AudioPreview url={a.url}/>{!readOnly&&<button className="vc-icon" aria-label={'移除本场引用 '+a.name} onClick={()=>removeReference(a.id)}><X size={14}/></button>}</div></div>)}{!related.some(a=>a.kind==='audio')&&<p className="vc-hint">本场无需配音。</p>}
     </>}
    </aside>
   </div>
   <footer className="se-footer"><div>{!readOnly&&issues.length>0?<p className="vc-error" role="alert">{[...new Set(issues)].join(' ')}</p>:<span>{readOnly?'当前方案已确认':onSubmit?'修改先保存为草稿，采用新候选后更新整课。':'场景和素材修改统一保存，确认全部场景后再生成。'}</span>}</div><button className="vc-btn" onClick={onClose}>{readOnly?'关闭':'取消'}</button>{!readOnly&&<button className="vc-btn primary" disabled={(!dirty&&!allowSubmitUnchanged)||issues.length>0} onClick={()=>{if(onSubmit){onSubmit(draft);return;}useVideoCoursewareStore.getState().update(project.id,patch);onClose();}}>{saveLabel}</button>}</footer>
  </>}
 </VideoModal>;
}
