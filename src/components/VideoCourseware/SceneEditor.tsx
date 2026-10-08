import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Film, Image as ImageIcon, Plus, Upload, Loader2, Volume2, X } from 'lucide-react';
import type { AudioCue, MediaAsset, VideoProject, VideoSegment, VideoShot } from '../../data/videoCourseware/model';
import { arrangeAudioCues, shotIssues } from '../../data/videoCourseware/planning';
import { sceneContentWithMentions } from '../../data/videoCourseware/sceneMentions';
import { prepareSceneEdit } from '../../data/videoCourseware/sceneEditing';
import { AssetPreview, AudioPreview, VideoModal } from './Shared';
import MentionTextArea from './MentionTextArea';
import { saveScenePlanDraft } from './scenePlanActions';
import { confirmScenePlan } from './workflow';
import { startSceneRevision } from './sceneRevisionActions';
import { useVideoCoursewareStore } from '../../store/videoCoursewareStore';
import { buildSceneCandidate } from '../../data/videoCourseware/sceneRevision';
import toast from '../../utils/toast';
import { readLocalSceneAsset } from './localSceneAsset';
import VideoResourceEditor from './VideoResourceEditor';

type Picker={target:'content'|'reference'|'audio'|'first'|'last'|'asset';shotId?:string;kind:'image'|'audio'};
export default function SceneEditor({project,sceneId,readOnly,onClose,onSubmit,onSaveDraft,saveLabel='保存并开始生成',allowSubmitUnchanged=false,revisionScope='scene',onScopeChange}:{project:VideoProject;sceneId:string;readOnly:boolean;onClose:()=>void;onSubmit?:(draft:VideoProject)=>void;onSaveDraft?:(draft:VideoProject)=>void;saveLabel?:string;allowSubmitUnchanged?:boolean;revisionScope?:'scene'|'shared';onScopeChange?:(scope:'scene'|'shared')=>void}){
 const [original]=useState(()=>structuredClone(project));
 const [draft,setDraft]=useState(()=>structuredClone(project));
 const uploadInput=useRef<HTMLInputElement|null>(null);
 const [uploading,setUploading]=useState(false);
 const [pickerPosition,setPickerPosition]=useState({top:100,left:100,width:360});
 const [resource,setResource]=useState<string|null>(null),[picker,setPicker]=useState<Picker|null>(null),[all,setAll]=useState(false);
 const [search,setSearch]=useState(''),[activeChoice,setActiveChoice]=useState(0),[inserted,setInserted]=useState('');
 const contentField=useRef<HTMLTextAreaElement|null>(null),shotFields=useRef(new Map<string,HTMLTextAreaElement>()),searchField=useRef<HTMLInputElement|null>(null);
 useEffect(()=>{if(picker){searchField.current?.focus();searchField.current?.scrollIntoView({block:'nearest'});}},[picker]);
 useEffect(()=>{searchField.current?.closest('.se-picker')?.querySelector('.is-active')?.scrollIntoView({block:'nearest'});},[activeChoice]);
 const field=useRef<HTMLTextAreaElement|null>(null);
 const insertion=useRef<{target:'content'|'shot';shotId?:string;start:number;end:number}>({target:'content',start:0,end:0});
 const current=useVideoCoursewareStore(s=>s.projects[project.id]);
 const scene=draft.segments.find(s=>s.id===sceneId)!;
 const shots=(draft.shots||[]).filter(s=>s.segmentId===sceneId);
 const related=draft.assets.filter(a=>a.kind!=='video'&&a.segmentIds.includes(sceneId));
 const asset=(id?:string)=>draft.assets.find(a=>a.id===id);
 const patch=prepareSceneEdit(original,draft,sceneId);
 const candidate={...draft,...patch};
 const issues=[...(!scene.title.trim()?['请填写场景名称。']:[]),...(!scene.content?.trim()?['请填写本场景内容。']:[]),...(candidate.shots||[]).filter(s=>s.segmentId===sceneId).flatMap(s=>shotIssues(candidate,s))];
 const dirty=JSON.stringify(original)!==JSON.stringify(draft);
 const job=current?.sceneJobs?.[sceneId],busy=!onSubmit&&!dirty&&['queued','generating'].includes(job?.status||'');
 const shared=onScopeChange?buildSceneCandidate(original,draft,sceneId,revisionScope,'scope-preview').sharedSceneIds:[];
 function save(generate:boolean){
  if(onSubmit){if(generate)onSubmit(draft);else onSaveDraft?.(draft);return;}
  const result=dirty?saveScenePlanDraft(original,draft,sceneId):'plan';
  if(generate){
   const success=result==='revision'?startSceneRevision(project.id,sceneId):confirmScenePlan(project.id,sceneId);
   if(!success){toast('请检查本场素材和方案后重试');return;}
  }else if(result==='revision')toast('本次修改已保存为本场草稿');
  onClose();
 }
 function editScene(values:Partial<VideoSegment>){setDraft(p=>({...p,segments:p.segments.map(s=>s.id===sceneId?{...s,...values}:s)}));}

 function editShot(id:string,values:Partial<VideoShot>){setDraft(p=>({...p,shots:p.shots?.map(s=>s.id===id?{...s,...values}:s)}));}
 function remember(target:'content'|'shot',el:HTMLTextAreaElement,shotId?:string){field.current=el;insertion.current={target,shotId,start:el.selectionStart,end:el.selectionEnd};}
 function openPicker(value:Picker){
  const el=value.target==='content'?contentField.current:shotFields.current.get(value.shotId||'');
  if(el){const target=value.target==='content'?'content':'shot';if(field.current!==el){field.current=el;insertion.current={target,shotId:value.shotId,start:el.value.length,end:el.value.length};}}
  if(el){const rect=el.getBoundingClientRect(),modal=el.closest('.vc-modal')!.getBoundingClientRect(),width=Math.min(380,modal.width-48);setPickerPosition({top:Math.max(modal.top+70,Math.min(rect.top-330,innerHeight-410)),left:Math.max(modal.left+16,Math.min(rect.left,modal.right-width-16)),width});}
  setPicker(value);setAll(value.target==='asset');setSearch('');setActiveChoice(0);setInserted('');
 }
 function closePicker(){setPicker(null);requestAnimationFrame(()=>field.current?.focus());}
 function insert(a:MediaAsset){
  if(!picker)return;
  if(picker.target==='asset'){setDraft(p=>({...p,assets:p.assets.map(v=>v.id===a.id?{...v,segmentIds:[...new Set([...v.segmentIds,sceneId])]}:v)}));setPicker(null);setInserted('已加入本场素材：'+a.name);return;}
  let caret:number|undefined;
  const token='@'+a.name+' ';
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
    values.prompt=selected.prompt.slice(0,pos.start)+token+selected.prompt.slice(pos.end);caret=pos.start+token.length;
   }
   next={...next,shots:next.shots?.map(s=>s.id===selected.id?{...s,...values}:s)};
  }else{
   const text=sceneContentWithMentions(draft,scene),pos=insertion.current.target==='content'?insertion.current:{start:text.length,end:text.length};
   next={...next,segments:next.segments.map(s=>s.id===sceneId?{...s,content:text.slice(0,pos.start)+token+text.slice(pos.end)}:s)};caret=pos.start+token.length;
  }
  setDraft(next);setPicker(null);setInserted('已插入 @'+a.name);requestAnimationFrame(()=>{const el=field.current;if(el&&caret!==undefined){el.focus();el.setSelectionRange(caret,caret);insertion.current={...insertion.current,start:caret,end:caret};}});
 }
 async function uploadMaterial(file?:File){
  if(!file||!picker||uploading)return;
  setUploading(true);
  try{
   const a=await readLocalSceneAsset(file,picker.kind,sceneId);
   setDraft(p=>({...p,assets:[...p.assets,a],readyAssetIds:[...p.readyAssetIds,a.id]}));
   setPicker(null);setInserted('已加入本场素材：'+a.name);
  }catch(error){toast(error instanceof Error?error.message:'上传失败，请重试');}
  finally{setUploading(false);}
 }
 function removeReference(id:string){
  const name=asset(id)?.name||'';
  setDraft(p=>({...p,assets:p.assets.map(a=>a.id===id?{...a,segmentIds:a.segmentIds.filter(s=>s!==sceneId)}:a),segments:p.segments.map(s=>s.id===sceneId?{...s,content:s.content?.replaceAll('@'+name,name)}:s),shots:p.shots?.map(s=>s.segmentId===sceneId?{...s,firstFrameId:s.firstFrameId===id?undefined:s.firstFrameId,lastFrameId:s.lastFrameId===id?undefined:s.lastFrameId,references:s.references?.filter(r=>r.assetId!==id),audioCues:s.audioCues?.filter(c=>c.assetId!==id),audioIds:s.audioIds.filter(a=>a!==id),prompt:s.prompt.replaceAll('@'+name,name)}:s)}));
 }
 const choices=draft.assets.filter(a=>a.kind===picker?.kind&&a.url&&draft.readyAssetIds.includes(a.id)&&(all||a.segmentIds.includes(sceneId))&&a.name.toLowerCase().includes(search.toLowerCase()));
 const pickerUI=picker?<div className="se-picker" aria-label="选择引用素材" onKeyDownCapture={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closePicker();}}}><div className="vc-field-heading"><h3>{picker.target==='first'?'选择首帧':picker.target==='last'?'选择尾帧':picker.target==='asset'?'添加本场素材':'引用素材'}</h3><button className="vc-icon" aria-label="关闭素材选择" onClick={closePicker}><X size={16}/></button></div><div className="vc-options">{!['first','last'].includes(picker.target)&&(['image','audio'] as const).map(kind=><button className={picker.kind===kind?'selected':''} key={kind} onClick={()=>{setPicker({...picker,kind});setActiveChoice(0);}}>{kind==='image'?'图片':'配音'}</button>)}</div>{picker.target==='asset'&&<div className="se-upload-material"><button className="vc-btn" disabled={uploading} onClick={()=>uploadInput.current?.click()}>{uploading?<Loader2 className="vc-spin" size={15}/>:<Upload size={15}/ >}{uploading?'正在读取…':picker.kind==='image'?'本地上传图片':'本地上传配音'}</button><small>{picker.kind==='image'?'PNG、JPG、WebP 等图片':'MP3、WAV、M4A 等音频'}，最大 2 MB</small><input ref={uploadInput} type="file" hidden accept={picker.kind==='image'?'image/*':'audio/*'} aria-label="上传本场素材" onChange={e=>{void uploadMaterial(e.target.files?.[0]);e.currentTarget.value='';}}/></div>}<input ref={searchField} autoFocus className="se-search" aria-label="搜索素材" placeholder="搜索素材名称" value={search} onChange={e=>{setSearch(e.target.value);setActiveChoice(0);}} onKeyDown={e=>{if(e.nativeEvent.isComposing)return;if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();setActiveChoice(n=>Math.max(0,Math.min(choices.length-1,n+(e.key==='ArrowDown'?1:-1))));}else if(e.key==='Enter'&&choices[activeChoice]){e.preventDefault();insert(choices[activeChoice]);}}}/><label className="se-all"><input type="checkbox" checked={all} onChange={e=>{setAll(e.target.checked);setActiveChoice(0);}}/>显示本课全部素材</label><div className="se-picker-list">{choices.map((a,i)=><button className={"se-picker-item"+(i===activeChoice?" is-active":"")} key={a.id} onClick={()=>insert(a)}>{a.kind==='image'?<img src={a.url} alt=""/>:<Volume2 size={20}/>}<span>{a.name}<small>{a.kind==='image'?a.role:(a.seconds||0).toFixed(1)+' 秒'}</small></span><span className="se-insert-label">{picker.target==='asset'?'添加':'插入'}</span></button>)}</div>{!choices.length&&<p className="vc-hint">没有匹配的素材，试试本课全部素材。</p>}</div>:null;
 const editedResource=asset(resource||undefined);
 return <VideoModal className="vc-scene-modal" title={'场景 '+(project.segments.findIndex(s=>s.id===sceneId)+1)+' · '+scene.title} onClose={onClose}>
  {resource&&editedResource?<>
   <div className="se-resource-back"><button className="vc-text-btn" onClick={()=>setResource(null)}><ArrowLeft size={16}/>返回场景方案</button><span>{editedResource.name}</span></div>
   {readOnly?<AssetPreview asset={editedResource}/>:<VideoResourceEditor key={resource} projectId={project.id} embeddedProject={draft} initialAssetId={resource} initialTab={editedResource.kind==='audio'?'audio':'image'} sceneId={sceneId} onSave={values=>{setDraft(p=>({...p,...values}));onScopeChange?.('shared');}} onClose={()=>setResource(null)}/>}
  </>:<>
   <div className="se-layout">
    <main className="se-main">
     <section className="se-section"><h3>基本信息</h3><div className="vc-form"><label>场景名称<input aria-label="场景名称" readOnly={readOnly} value={scene.title} onChange={e=>editScene({title:e.target.value})}/></label></div></section>
     <section className="se-section"><div className="vc-field-heading"><h3>{scene.kind==='mixed'?'场景与互动内容':'本场景内容'}</h3>{!readOnly&&<button className="vc-text-btn" onClick={()=>openPicker({target:'content',kind:'image'})}><Plus size={14}/>引用素材</button>}</div><MentionTextArea assets={related} ref={contentField} className="se-content" aria-label="本场景内容" readOnly={readOnly} value={sceneContentWithMentions(draft,scene)} placeholder="描述希望出现的画面、讲述内容、互动任务与反馈。" onSelect={e=>remember('content',e.currentTarget)} onChange={e=>editScene({content:e.target.value})} onKeyDown={e=>{if(e.key==='@'&&!readOnly){e.preventDefault();remember('content',e.currentTarget);openPicker({target:'content',kind:'image'});}}}/><p className="vc-hint">输入 @ 或点击引用素材，选择后会插入到正文光标处。</p></section>
     {shots.map((shot,i)=><section className="se-section se-shot" key={shot.id} data-shot-id={shot.id}><div className="vc-field-heading"><h3><Film size={16}/>{shots.length>1?'视频 '+(i+1)+' · '+asset(shot.videoAssetId)?.name:'视频画面描述'}</h3><label className="se-duration">时长<input aria-label={'视频时长（秒） '+(i+1)} readOnly={readOnly} type="number" min={1} max={60} step={.1} value={shot.seconds} onChange={e=>editShot(shot.id,{seconds:Number(e.target.value)})}/>秒</label></div>
      <div className="se-prompt-actions"><span>动作、镜头与配音安排</span>{!readOnly&&<button className="vc-text-btn" onClick={()=>openPicker({target:'reference',kind:'image',shotId:shot.id})}><Plus size={14}/>插入素材</button>}</div>
      <MentionTextArea assets={draft.assets} ref={el=>{if(el)shotFields.current.set(shot.id,el);else shotFields.current.delete(shot.id);}} className="se-video-prompt" aria-label={'视频生成描述 '+(i+1)} readOnly={readOnly} value={shot.prompt} onSelect={e=>remember('shot',e.currentTarget,shot.id)} onChange={e=>editShot(shot.id,{prompt:e.target.value})} onKeyDown={e=>{if(e.key==='@'&&!readOnly){e.preventDefault();remember('shot',e.currentTarget,shot.id);openPicker({target:'reference',kind:'image',shotId:shot.id});}}}/>
      <div className="se-frame-row">{(['first','last'] as const).map(mode=>{const id=mode==='first'?shot.firstFrameId:shot.lastFrameId;return <div className="se-frame-container" key={mode}><span>{mode==='first'?'首帧':'尾帧'} · 选填</span><button className="se-frame" disabled={readOnly} onClick={()=>openPicker({target:mode,kind:'image',shotId:shot.id})}>{id?<img src={asset(id)?.url} alt={mode==='first'?'已选首帧':'已选尾帧'}/>:<ImageIcon size={20}/>}<span>{id?asset(id)?.name:'未设置'}</span></button>{id&&!readOnly&&<button className="vc-icon se-frame-clear" aria-label={'清除'+(mode==='first'?'首帧':'尾帧')} onClick={()=>editShot(shot.id,mode==='first'?{firstFrameId:undefined}:{lastFrameId:undefined})}><X size={13}/></button>}</div>;})}</div>
      <div className="vc-field-heading"><h4>本段配音</h4>{!readOnly&&<button className="vc-text-btn" onClick={()=>openPicker({target:'audio',kind:'audio',shotId:shot.id})}><Plus size={14}/>添加配音</button>}</div>
      {shot.audioCues?.map(cue=><div className="se-cue" key={cue.id}><div className="vc-field-heading"><button className="vc-text-btn" onClick={()=>setResource(cue.assetId)}><Volume2 size={14}/>{asset(cue.assetId)?.name}</button><AudioPreview url={asset(cue.assetId)?.url}/></div></div>)}
      {!shot.audioCues?.length&&<p className="vc-hint">本段无需对白。</p>}
     </section>)}
     {shared.length>0&&<section className="se-section se-shared-scope"><h3>共享素材</h3><p>这些素材还用于 {shared.length} 个场景。默认只修改本场，其他场景保留。</p><div className="vc-options" role="group" aria-label="共享素材修改范围"><button className={revisionScope==='scene'?'selected':''} onClick={()=>onScopeChange?.('scene')}>仅本场</button><button className={revisionScope==='shared'?'selected':''} onClick={()=>onScopeChange?.('shared')}>同时修改引用场景</button></div></section>}
    </main>
    <aside className="se-materials">
     {picker&&!['content','reference'].includes(picker.target)?pickerUI:<>
      <div className="vc-field-heading"><h3>引用素材</h3>{!readOnly&&<button className="vc-text-btn" onClick={()=>openPicker({target:'asset',kind:'image'})}><Plus size={14}/>添加素材</button>}</div><p className="vc-hint">点击图片或配音可编辑资源。</p>
      <h4>图片 · {related.filter(a=>a.kind==='image').length}</h4><div className="se-image-grid">{related.filter(a=>a.kind==='image').map(a=><div className="se-image-item" key={a.id}><button className="se-image-open" aria-label={'编辑图片 '+a.name} onClick={()=>setResource(a.id)}><img src={a.url} alt={a.name}/><span>{a.name}</span></button>{!readOnly&&<button className="se-remove" aria-label={'移除本场引用 '+a.name} onClick={()=>removeReference(a.id)}><X size={12}/></button>}</div>)}</div>
      <h4>旁白与角色配音 · {related.filter(a=>a.kind==='audio').length}</h4>{related.filter(a=>a.kind==='audio').map(a=><div className="se-audio-item" key={a.id}><button className="se-audio-open" aria-label={'编辑配音 '+a.name} onClick={()=>setResource(a.id)}><b>{a.name}</b><small>{draft.speakers.find(s=>s.id===a.speakerId)?.name}</small><p>{a.text||'上传的音频'}</p></button><div className="vc-field-heading"><AudioPreview url={a.url}/>{!readOnly&&<button className="vc-text-btn" onClick={()=>setResource(a.id)}>编辑配音</button>}</div></div>)}{!related.some(a=>a.kind==='audio')&&<p className="vc-hint">本场无需配音。</p>}
     </>}
    </aside>
   </div>
   <footer className="se-footer"><div>{inserted&&<p className="se-insert-status" role="status">{inserted}</p>}{!readOnly&&issues.length>0?<p className="vc-error" role="alert">{[...new Set(issues)].join(' ')}</p>:<span>{readOnly?'':onSubmit?'生成后先预览修改效果，再更新整课。':'保存并生成本场，其余场景可继续检查。'}</span>}</div><button className="vc-btn" onClick={onClose}>{readOnly?'关闭':'取消'}</button>{!readOnly&&<><button className="vc-btn" disabled={uploading||!dirty||issues.length>0} onClick={()=>save(false)}>仅保存</button><button className="vc-btn primary" disabled={uploading||issues.length>0||busy||Boolean(onSubmit&&!dirty&&!allowSubmitUnchanged)||Boolean(!onSubmit&&!dirty&&job?.status==='ready')} onClick={()=>save(true)}>{busy?'生成中…':!onSubmit&&!dirty&&job?.status==='ready'?'已生成':saveLabel}</button></>}</footer>
   {picker&&['content','reference'].includes(picker.target)&&<div className="se-reference-popover" style={pickerPosition}>{pickerUI}</div>}
  </>}
 </VideoModal>;
}
