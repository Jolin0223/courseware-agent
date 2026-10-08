import { useRef, useState } from 'react';
import { Film, PencilLine, ArrowLeft, Loader2, Volume2, Plus, X, Image as ImageIcon, Upload } from 'lucide-react';
import type { AudioCue, MediaAsset, VideoProject, VideoShot } from '../../data/videoCourseware/model';
import { materialsKey, arrangeAudioCues, shotIssues, shotSourceKey, videoPlanIssues } from '../../data/videoCourseware/planning';
import { useVideoCoursewareStore } from '../../store/videoCoursewareStore';
import { VideoModal, AudioPreview } from './Shared';
import { confirmVideoPlan, beginVideoPlanReview, returnToMaterials } from './workflow';
import toast from '../../utils/toast';

export function ShotEditor({project,shot,onClose}:{project:VideoProject;shot:VideoShot;onClose:()=>void}){
 const [draft,setDraft]=useState<VideoShot>(()=>{const value=structuredClone(shot);return {...value,...arrangeAudioCues(value,value.audioCues||[])};});
 const [extras,setExtras]=useState<MediaAsset[]>([]);
 const [picker,setPicker]=useState<{mode:'first'|'last'|'reference'|'cue';cueId?:string;referenceId?:string}|null>(null);
 const [all,setAll]=useState(false);
 const input=useRef<HTMLInputElement>(null),promptRef=useRef<HTMLTextAreaElement>(null);
 const working={...project,assets:[...project.assets,...extras],readyAssetIds:[...project.readyAssetIds,...extras.map(a=>a.id)]};
 const asset=(id?:string)=>working.assets.find(a=>a.id===id);
 const update=(patch:Partial<VideoShot>)=>setDraft(current=>({...current,...patch}));
 const updateCue=(id:string,patch:Partial<AudioCue>)=>update({audioCues:draft.audioCues?.map(c=>c.id===id?{...c,...patch}:c)});
 const candidate={...draft,audioIds:(draft.audioCues||[]).map(c=>c.assetId),sourceKey:shotSourceKey(working,asset(shot.videoAssetId)!,draft)};
 const issues=shotIssues(working,candidate);
 const openPicker=(mode:NonNullable<typeof picker>['mode'],cueId?:string,referenceId?:string)=>{setAll(false);setPicker({mode,cueId,referenceId});};
 function insertMention(name:string){
  const field=promptRef.current,at=field?.selectionStart??draft.prompt.length;
  update({prompt:draft.prompt.slice(0,at)+' @'+name+' '+draft.prompt.slice(at)});
 }
 function select(a:MediaAsset){
  if(!picker)return;
  if(picker.mode==='first'||picker.mode==='last')update(picker.mode==='first'?{firstFrameId:a.id}:{lastFrameId:a.id});
  else if(picker.mode==='reference'){
   if(picker.referenceId){const old=asset(picker.referenceId);update({references:draft.references?.map(r=>r.assetId===picker.referenceId?{...r,assetId:a.id}:r),prompt:draft.prompt.replaceAll('@'+old?.name,'@'+a.name)});}
   else if(!draft.references?.some(r=>r.assetId===a.id))update({references:[...draft.references||[],{assetId:a.id,purpose:a.role||'画面参考',range:'整段视频'}],prompt:draft.prompt+'\n参考 @'+a.name+' 的外观。'});
  }else{
   const original=draft.audioCues?.find(c=>c.id===picker.cueId);
   const cue:AudioCue={id:original?.id||crypto.randomUUID(),assetId:a.id,start:original?.start||0,trimStart:0,trimEnd:a.seconds||0,mode:'playback',description:original?.description||a.name};
   update({...arrangeAudioCues(draft,original?(draft.audioCues||[]).map(c=>c.id===cue.id?cue:c):[...draft.audioCues||[],cue]),prompt:original?draft.prompt.replaceAll('@'+asset(original.assetId)?.name,'@'+a.name):draft.prompt+'\n配音参考 @'+a.name+'。'});
  }
  setPicker(null);
 }
 async function upload(file?:File){
  if(!file||!picker)return;
  const kind=picker.mode==='cue'?'audio':'image';
  if(!file.type.startsWith(kind+'/')||file.size>2*1024*1024){toast('请选择 2 MB 以内的'+(kind==='image'?'图片':'音频'));return;}
  const reader=new FileReader();
  reader.onload=()=>{
   const a:MediaAsset={id:crypto.randomUUID(),kind,name:file.name,url:String(reader.result),segmentIds:[shot.segmentId],role:'镜头画面',prompt:file.name};
   const accept=()=>{setExtras(v=>[...v,a]);select(a);};
   if(kind==='audio'){const el=new Audio(a.url);el.onloadedmetadata=()=>{a.seconds=el.duration;if(Number.isFinite(el.duration)&&el.duration>0)accept();else toast('音频时长无效');el.removeAttribute('src');};el.onerror=()=>toast('无法读取音频');}
   else accept();
  };reader.readAsDataURL(file);
 }
 const choices=working.assets.filter(a=>a.kind===(picker?.mode==='cue'?'audio':'image')&&working.readyAssetIds.includes(a.id)&&a.url)
  .filter(a=>all||a.segmentIds.includes(shot.segmentId))
  .filter(a=>picker?.mode!=='reference'||!draft.references?.some(r=>r.assetId===a.id&&r.assetId!==picker.referenceId))
  .filter(a=>!['first','last'].includes(picker?.mode||'')||!['角色形象','互动道具','道具参考','封面'].includes(a.role||''));
 return <VideoModal title={'编辑视频方案 · '+asset(shot.videoAssetId)?.name} onClose={onClose}>
  <div className="vc-form vc-shot-editor">
   <div className="vc-shot-basics">   <section><b>首尾帧（选填）</b><div className="vc-frame-pair">{(['first','last'] as const).map(mode=>{const id=mode==='first'?draft.firstFrameId:draft.lastFrameId;return <div className="vc-frame-slot" key={mode}><div className="vc-field-heading"><b>{mode==='first'?'首帧':'尾帧'}</b>{id&&<button className="vc-text-btn" onClick={()=>update(mode==='first'?{firstFrameId:undefined}:{lastFrameId:undefined})}>清除</button>}</div><button className="vc-frame-select" onClick={()=>openPicker(mode)}>{id?<img src={asset(id)?.url} alt={mode==='first'?'已选首帧':'已选尾帧'}/>:<span><ImageIcon size={24}/>未设置</span>}</button><button className="vc-text-btn" onClick={()=>openPicker(mode)}>{id?'更换图片':'选择图片'}</button></div>;})}</div></section><label>视频时长（秒）<input aria-label="视频时长（秒）" type="number" min={1} max={60} step={.1} value={draft.seconds} onChange={e=>update({seconds:Number(e.target.value)})}/><span className="vc-hint">配音会自动安排到对应画面。</span></label></div>
   <div><div className="vc-field-heading"><b>视频生成描述</b><button className="vc-text-btn" onClick={()=>openPicker('reference')}><Plus size={14}/>插入素材</button></div>
    <p className="vc-hint">描述这段视频里发生什么、人物怎样动作、镜头怎样变化。输入 @ 可选择素材。</p>
    <textarea ref={promptRef} aria-label="视频生成描述" className="vc-prompt-editor" value={draft.prompt} onChange={e=>update({prompt:e.target.value})} onKeyDown={e=>{if(e.key==='@'){e.preventDefault();openPicker('reference');}}}/>
   </div>
   <section><div className="vc-field-heading"><b>本段引用素材</b><button className="vc-text-btn" onClick={()=>openPicker('reference')}><Plus size={14}/>添加本段素材</button></div>
    {!draft.references?.length&&<p className="vc-hint">未单独指定参考图，可按需要引用角色、背景或道具。</p>}
    <div className="vc-reference-list">{draft.references?.map((r,i)=><div className="vc-reference-row" key={r.assetId}><img src={asset(r.assetId)?.url} alt={asset(r.assetId)?.name}/><div><button className="vc-text-btn" onClick={()=>insertMention(asset(r.assetId)?.name||'素材')}>@{asset(r.assetId)?.name}</button><input aria-label={'参考用途 '+(i+1)} value={r.purpose} onChange={e=>update({references:draft.references?.map((v,j)=>j===i?{...v,purpose:e.target.value}:v)})}/><input aria-label={'使用范围 '+(i+1)} value={r.range} onChange={e=>update({references:draft.references?.map((v,j)=>j===i?{...v,range:e.target.value}:v)})}/></div><button className="vc-btn edit" onClick={()=>openPicker('reference',undefined,r.assetId)}>更换</button><button className="vc-icon" aria-label={'移除参考 '+asset(r.assetId)?.name} onClick={()=>update({references:draft.references?.filter((_,j)=>j!==i),prompt:draft.prompt.replaceAll('@'+asset(r.assetId)?.name,asset(r.assetId)?.name||'素材')})}><X size={15}/></button></div>)}</div>
   </section>
   <section><div className="vc-field-heading"><b>配音安排</b><button className="vc-text-btn" onClick={()=>openPicker('cue')}><Plus size={14}/>添加配音</button></div>
    {!draft.audioCues?.length&&<p className="vc-hint">本段没有对白。</p>}
    {draft.audioCues?.map((c,i)=>{const a=asset(c.assetId);return <div className="vc-cue" key={c.id}>
     <div className="vc-field-heading"><button className="vc-text-btn" onClick={()=>insertMention(a?.name||'配音')}>{project.speakers.find(s=>s.id===a?.speakerId)?.name||'配音'} · @{a?.name}</button><div className="vc-inline-actions"><AudioPreview url={a?.url}/><button className="vc-btn edit" onClick={()=>openPicker('cue',c.id)}>更换</button><button className="vc-icon" aria-label={'删除配音 '+(i+1)} onClick={()=>update({...arrangeAudioCues(draft,(draft.audioCues||[]).filter(v=>v.id!==c.id)),prompt:draft.prompt.replaceAll('@'+a?.name,a?.name||'配音')})}><X size={15}/></button></div></div>
     <p>{a?.text||'上传的音频'}</p><label>对应画面<input aria-label={'配音对应画面 '+(i+1)} value={c.description} onChange={e=>updateCue(c.id,{description:e.target.value})}/></label>

    </div>;})}
   </section>

  </div>
  {issues.map(x=><p className="vc-error" key={x}>{x}</p>)}
  <footer className="vc-actions vc-modal-actions"><button className="vc-btn" onClick={onClose}>取消</button><button className="vc-btn primary" disabled={Boolean(issues.length)} onClick={()=>{useVideoCoursewareStore.getState().update(project.id,{assets:working.assets,readyAssetIds:working.readyAssetIds.filter(id=>id!==shot.videoAssetId),shots:project.shots?.map(s=>s.id===shot.id?candidate:s),approvedMaterialsKey:extras.length?materialsKey(working):project.approvedMaterialsKey,approvedPlanKey:undefined});onClose();}}>保存视频方案</button></footer>
  {picker&&<VideoModal title={picker.mode==='cue'?'选择配音':picker.mode==='reference'?'选择参考素材':'选择'+(picker.mode==='first'?'首帧':'尾帧')} onClose={()=>setPicker(null)}><div className="vc-field-heading"><div className="vc-options"><button className={!all?'selected':''} onClick={()=>setAll(false)}>本场相关</button><button className={all?'selected':''} onClick={()=>setAll(true)}>本课全部{picker.mode==='cue'?'音频':'图片'}</button></div>{!picker.referenceId&&!picker.cueId&&['reference','cue'].includes(picker.mode)&&<button className="vc-text-btn" onClick={()=>setPicker({mode:picker.mode==='cue'?'reference':'cue'})}>{picker.mode==='cue'?'选择图片素材':'选择配音素材'}</button>}<button className="vc-btn" onClick={()=>input.current?.click()}><Upload size={14}/>上传</button><input ref={input} type="file" hidden accept={picker.mode==='cue'?'audio/*':'image/*'} onChange={e=>upload(e.target.files?.[0])}/></div><div className="vc-picker-grid">{choices.map(a=><button className="vc-picker-asset" key={a.id} onClick={()=>select(a)}>{a.kind==='image'?<img src={a.url} alt=""/>:<Volume2 size={25}/>}<b>{a.name}</b><small>{a.kind==='audio'?a.text:a.role}</small></button>)}</div>{!choices.length&&<p className="vc-hint">暂无本场素材，可以查看本课全部素材或上传。</p>}</VideoModal>}
 </VideoModal>;
}
export default function VideoPlanReview({project,readOnly=false}:{project:VideoProject;readOnly?:boolean}){
 const [editing,setEditing]=useState<VideoShot|null>(null);
 const planning=project.job?.kind==='video-plan',issues=videoPlanIssues(project);
 return <section className="vc-card"><div className="vc-card-header"><div><h3><Film size={17}/>{planning?'正在整理视频方案':'视频生成方案确认'}</h3><p>{planning?'正在匹配每段视频的参考素材、配音位置与时长。':'逐段查看视频内容、引用图片和配音安排，需要调整的部分可以单独编辑。'}</p></div></div>
  {planning?<div className="vc-planning-steps"><Loader2 size={16} className="vc-spin"/>读取已确认素材 → 安排画面与配音 → 检查时长</div>:<div className="vc-shots">{project.shots?.map((shot,i)=>{
   const video=project.assets.find(a=>a.id===shot.videoAssetId),frame=project.assets.find(a=>a.id===(shot.firstFrameId||shot.references?.[0]?.assetId));
   return <article className="vc-shot" key={shot.id}><div className="vc-shot-summary"><div className="vc-shot-frame">{frame?<img src={frame.url} alt={frame.name}/>:<div className="vc-media-placeholder">按描述生成</div>}<small>{shot.firstFrameId?'首帧':frame?'参考图':'未设置首尾帧'}</small></div><div className="vc-shot-copy"><h4>{i+1}. {video?.name}<span>{shot.seconds} 秒</span></h4><p>{project.segments.find(s=>s.id===shot.segmentId)?.purpose}</p></div><div className="vc-shot-buttons">{!readOnly&&<button className="vc-btn edit" onClick={()=>setEditing(shot)}><PencilLine size={13}/>编辑</button>}</div></div>
   </article>;
  })}</div>}
  {!readOnly&&!planning&&<><p className="vc-hint">确认后开始逐段生成视频。</p>{issues.map((x,i)=><p className="vc-error" key={i}>{x}</p>)}<footer className="vc-actions"><button className="vc-btn" onClick={()=>returnToMaterials(project.id)}><ArrowLeft size={14}/>返回修改素材</button>{issues.length>0&&<button className="vc-btn" onClick={()=>beginVideoPlanReview(project.id)}>更新视频方案</button>}<button className="vc-btn primary" disabled={Boolean(issues.length)} onClick={()=>confirmVideoPlan(project.id)}>确认方案，生成视频</button></footer></>}
  {editing&&<ShotEditor project={project} shot={editing} onClose={()=>setEditing(null)}/>}
 </section>;
}
