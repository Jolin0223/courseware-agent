import { useEffect, useRef, useState } from 'react';
import { Film, Image as ImageIcon, Volume2, Upload, RefreshCw, Loader2, ArrowLeft, Check, X, Plus } from 'lucide-react';
import { useVideoCoursewareStore, copyPlayback } from '../../store/videoCoursewareStore';
import type { MediaAsset, PlaybackSettings, VideoProject } from '../../data/videoCourseware/model';
import { returnToMaterials } from './workflow';
import { startResourceUpdate } from './sceneRevisionActions';
import { replaceSceneResource } from '../../data/videoCourseware/resourceReplacement';
import { VideoModal, AssetPreview } from './Shared';
import ResourceAudioPlayer from './ResourceAudioPlayer';
import { displayVoiceName } from '../../data/videoCourseware/voices';
import toast from '../../utils/toast';
import GenerationPreferencePicker from '../Generator/GenerationPreferencePicker';
import { changedVideoIds } from '../../data/videoCourseware/planning';

function editablePrompt(asset?:MediaAsset){
 if(!asset)return '';
 return asset.kind==='audio'?asset.text??asset.prompt:asset.kind==='image'?asset.prompt.replace(/^(?:输出文件|参考图)[:：].*(?:\n|$)/gm,'').trim():asset.prompt;
}

export default function VideoResourceEditor({projectId,onClose,initialTab='image',initialAssetId,sceneId,embeddedProject,onSave}:{projectId:string;onClose:()=>void;initialTab?:'image'|'audio'|'video';initialAssetId?:string;sceneId?:string;embeddedProject?:VideoProject;onSave?:(patch:Partial<VideoProject>)=>void}){
 const storedProject=useVideoCoursewareStore(s=>s.projects[projectId]);
 const project=embeddedProject||storedProject;
 const initialAsset=project.assets.find(a=>a.id===initialAssetId)||project.assets.find(a=>a.kind===initialTab);
 const [shots,setShots]=useState(()=>structuredClone(project.shots));
 const [readyAssetIds,setReadyAssetIds]=useState(()=>[...project.readyAssetIds]);
 const [affectedSceneIds,setAffectedSceneIds]=useState<string[]>([]);
 const [replacementScope,setReplacementScope]=useState<'scene'|'all'|null>(null);
 const [targetSceneId,setTargetSceneId]=useState(sceneId||'');
 const [tab,setTab]=useState<'image'|'audio'|'video'>(initialTab);
 const [selectedId,setSelectedId]=useState(initialAssetId||project?.assets.find(a=>a.kind===initialTab)?.id||'');
 const [speakers,setSpeakers]=useState(()=>project.speakers.map(s=>({...s})));
 const [assets,setAssets]=useState(()=>project?.assets.map(a=>({...a}))||[]);
 const [composition,setComposition]=useState<PlaybackSettings>(()=>copyPlayback(project.composition));
 const [candidate,setCandidate]=useState<MediaAsset|null>(null),[generating,setGenerating]=useState(false),[changed,setChanged]=useState(false);
 const [prompt,setPrompt]=useState(editablePrompt(initialAsset));
 const [imageMode,setImageMode]=useState<'image-to-image'|'text-to-image'|'upload'>(initialAsset?.imageGeneration?.mode||'image-to-image');
 const [referenceUrl,setReferenceUrl]=useState<string|undefined>(initialAsset?.imageGeneration?.referenceUrl||initialAsset?.url);
 const [referenceName,setReferenceName]=useState(initialAsset?.imageGeneration?.referenceName||'当前图片'),[referencePicker,setReferencePicker]=useState(false);
 const referenceFile=useRef<HTMLInputElement>(null);
 const [changedAssetIds,setChangedAssetIds]=useState<string[]>([]);const fileRef=useRef<HTMLInputElement>(null);const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
 const selected=assets.find(a=>a.id===selectedId)||assets.find(a=>a.kind===tab);
 const hasVideo=project.assets.some(a=>a.kind==='video'&&readyAssetIds.includes(a.id));
 function close(){if(timer.current)clearTimeout(timer.current);onClose();}
 function pick(a:MediaAsset){if(timer.current)clearTimeout(timer.current);setGenerating(false);setCandidate(null);setReplacementScope(null);setTargetSceneId(sceneId||'');setSelectedId(a.id);setPrompt(editablePrompt(a));setImageMode(a.imageGeneration?.mode||'image-to-image');setReferenceUrl(a.imageGeneration?.referenceUrl||a.url);setReferenceName(a.imageGeneration?.referenceName||'当前图片');}
 function switchTab(next:typeof tab){setTab(next);const first=assets.find(a=>a.kind===next&&(!sceneId||a.segmentIds.includes(sceneId)));if(first)pick(first);}
 function generate(){
  if(imageMode==='upload'||!selected?.url||selected.kind==='image'&&imageMode==='image-to-image'&&!referenceUrl)return;
  setCandidate(null);setGenerating(true);
  timer.current=setTimeout(()=>{setGenerating(false);setCandidate({...selected,prompt,text:selected.kind==='audio'?prompt:selected.text,imageGeneration:selected.kind==='image'?{mode:imageMode,referenceUrl:imageMode==='image-to-image'?referenceUrl:undefined,referenceName:imageMode==='image-to-image'?referenceName:undefined}:undefined,revision:(selected.revision||0)+1});},4800);
 }
 function uploadReference(file?:File){
  if(!file)return;if(!file.type.startsWith('image/')||file.size>2*1024*1024){toast('请选择 2 MB 以内的图片');return;}
  const reader=new FileReader();reader.onload=()=>{setReferenceUrl(String(reader.result));setReferenceName(file.name);setReferencePicker(false);};reader.readAsDataURL(file);
 }
 function fileSelected(file?:File){if(!file||!selected)return;const expected=selected.kind==='image'?'image/':selected.kind==='audio'?'audio/':'video/';if(!file.type.startsWith(expected)){toast('文件类型不匹配，请选择对应的图片、音频或视频');return;}if(file.size>2*1024*1024){toast('当前上传文件不能超过 2 MB');return;}const reader=new FileReader();reader.onload=()=>{
 const url=String(reader.result);
 if(selected.kind==='image'){setCandidate({...selected,url,prompt,revision:(selected.revision||0)+1});return;}
 const media=document.createElement(selected.kind==='audio'?'audio':'video');
 media.preload='metadata';media.src=url;
 media.onloadedmetadata=()=>{if(Number.isFinite(media.duration)&&media.duration>0)setCandidate({...selected,url,prompt,text:selected.kind==='audio'?prompt:selected.text,seconds:media.duration,revision:(selected.revision||0)+1});else toast('无法读取文件时长，请换一个文件');media.removeAttribute('src');media.load();};
 media.onerror=()=>{toast('无法读取此文件，请使用可播放的音频或视频');media.removeAttribute('src');media.load();};
};reader.readAsDataURL(file);}
 function useCandidate(){
  if(!candidate||!selected||(selected.segmentIds.length>1&&(!replacementScope||(replacementScope==='scene'&&!targetSceneId))))return;
  const only=selected.segmentIds.length>1&&replacementScope==='scene'?targetSceneId:undefined;
  const next=replaceSceneResource({...project,assets,composition,speakers,shots,readyAssetIds},candidate,only);
  setAssets(next.assets);if(only)setSelectedId(next.assets.find(a=>a.originAssetId===(selected.originAssetId||selected.id)&&a.segmentIds.length===1&&a.segmentIds[0]===only)?.id||selected.id);setComposition(next.composition);setShots(next.shots);setReadyAssetIds(next.readyAssetIds);
  setAffectedSceneIds(ids=>[...new Set([...ids,...(only?[only]:selected.segmentIds)])]);
  setChangedAssetIds(ids=>[...new Set([...ids,selected.id])]);setChanged(true);setCandidate(null);setReplacementScope(null);
 }

 const uses=(selected?.segmentIds||[]).map(id=>project.segments.find(s=>s.id===id)?.title).filter(Boolean);
 const complete=project.phase==='ready';
 const dependentVideoIds=project.shots?changedVideoIds({...project,assets,speakers}):assets.filter(a=>a.kind==='video'&&assets.some(changedAsset=>changedAsset.kind!=='video'&&changedAsset.videoDependency!==false&&!changedAsset.overlay&&changedAsset.audioUse!=='interaction'&&changedAssetIds.includes(changedAsset.id)&&changedAsset.segmentIds.some(id=>a.segmentIds.includes(id)))).map(a=>a.id);
 const referenceChoices=<><button className="vc-btn" onClick={()=>referenceFile.current?.click()}><Plus size={14}/>上传参考图</button><input ref={referenceFile} hidden type="file" accept="image/*" onChange={e=>uploadReference(e.target.files?.[0])}/><div className="vc-picker-grid">{assets.filter(a=>a.kind==='image'&&a.url&&readyAssetIds.includes(a.id)).map(a=><button className="vc-picker-asset" key={a.id} onClick={()=>{setReferenceUrl(a.url);setReferenceName(a.name);setReferencePicker(false);}}><img src={a.url} alt=""/><b>{a.name}</b></button>)}</div></>;
 const body=<>
  <p className="vc-hint vc-edit-scope">{embeddedProject&&complete?'选择素材，预览修改效果后应用到场景。':'选择要调整的素材，保存后自动更新相关场景并生成新版本。'}</p>
  <div className="vc-tabs" role="tablist" aria-label="资源类型">{(['image','audio',...(hasVideo?['video']:[])] as Array<typeof tab>).map(kind=><button key={kind} role="tab" aria-selected={tab===kind} className={tab===kind?'active':''} onClick={()=>switchTab(kind)}>{kind==='image'?<ImageIcon size={16}/>:kind==='audio'?<Volume2 size={16}/>:<Film size={16}/ >}{kind==='image'?'图片':kind==='audio'?'旁白与角色配音':'视频'}</button>)}</div>
  <div className="vc-editor-columns">
   <aside className="vc-resource-list">{assets.filter(a=>a.kind===tab&&(!sceneId||a.segmentIds.includes(sceneId))).map(a=><button key={a.id} disabled={!readyAssetIds.includes(a.id)} className={selected?.id===a.id?'active':''} onClick={()=>pick(a)}>{a.kind==='audio'?<Volume2 size={19}/>:readyAssetIds.includes(a.id)?<img src={a.poster||a.url} alt=""/>:<Loader2 size={19} className="vc-spin"/>}<span><b>{a.name}</b><small>{a.kind==='audio'?project.speakers.find(s=>s.id===a.speakerId)?.name:a.kind==='video'?a.seconds+' 秒':a.role}</small></span></button>)}</aside>
   <main>{selected&&<>
    <h3>{selected.name}</h3>
    <div className="vc-resource-workbench">
     <div className="vc-resource-preview"><>{selected.kind==='audio'?<ResourceAudioPlayer key={(candidate||selected).url} url={(candidate||selected).url} seconds={(candidate||selected).seconds}/>:<AssetPreview asset={candidate||selected} ready={readyAssetIds.includes(selected.id)} showAudioText={false}/>}</><p className="vc-hint">使用位置：{uses.join('、')}</p></div>
     <div className="vc-resource-compose">
      {selected.kind==='image'&&<><div className="vc-options" role="group" aria-label="图片生成方式"><button className={imageMode==='image-to-image'?'selected':''} disabled={generating} onClick={()=>setImageMode('image-to-image')}>图生图</button><button className={imageMode==='text-to-image'?'selected':''} disabled={generating} onClick={()=>setImageMode('text-to-image')}>文生图</button><button className={imageMode==='upload'?'selected':''} disabled={generating} onClick={()=>setImageMode('upload')}>本地上传</button></div><p className="vc-hint">{imageMode==='image-to-image'?'基于参考图片，描述要保留和修改的部分。':imageMode==='upload'?'上传本地图片（不超过 2 MB），预览后替换。':'根据文字描述生成一张新图片。'}</p>{imageMode==='image-to-image'&&<div className="vc-image-input">{referenceUrl?<img src={referenceUrl} alt={referenceName}/>:<ImageIcon size={26}/ >}<span>{referenceUrl?referenceName:'请选择参考图片'}</span><button className="vc-text-btn" disabled={generating} onClick={()=>setReferencePicker(true)}>{referenceUrl?'更换参考图':'选择参考图'}</button>{referenceUrl&&<button className="vc-icon" disabled={generating} aria-label="移除参考图" onClick={()=>setReferenceUrl(undefined)}><X size={14}/></button>}</div>}</>}
      {selected.kind==='audio'&&selected.speakerId&&<><p className="vc-hint">说话人：{speakers.find(s=>s.id===selected.speakerId)?.name}</p>{project.workflowVersion===5&&<GenerationPreferencePicker controls="voice" voiceLabel="说话人音色" showMode={false} value={{voiceMode:'manual',voiceName:displayVoiceName(speakers.find(s=>s.id===selected.speakerId)?.voiceName),voiceId:speakers.find(s=>s.id===selected.speakerId)?.voiceId,voiceLanguage:speakers.find(s=>s.id===selected.speakerId)?.voiceLanguage||'中文'}} onChange={v=>{setSpeakers(speakers.map(s=>s.id===selected.speakerId?{...s,voiceName:v.voiceName||'智能匹配',voiceId:v.voiceId,voiceLanguage:v.voiceLanguage}:s));setChanged(true);setAffectedSceneIds(ids=>[...new Set([...ids,...assets.filter(a=>a.kind==='audio'&&a.speakerId===selected.speakerId).flatMap(a=>a.segmentIds)])]);setChangedAssetIds(ids=>[...new Set([...ids,...assets.filter(a=>a.kind==='audio'&&a.speakerId===selected.speakerId).map(a=>a.id)])]);}}/>}<p className="vc-hint">{embeddedProject&&complete?'修改音色先应用到本场，该说话人的其他配音可在生成前选择同步。':<>修改音色会同步应用到本课该说话人的 {assets.filter(a=>a.kind==='audio'&&a.speakerId===selected.speakerId).length} 条配音。</>}</p></>}
      {selected.kind==='image'&&imageMode==='upload'?<button className="vc-local-upload" onClick={()=>fileRef.current?.click()}><Upload size={24}/><b>点击上传本地图片</b><span>支持 PNG、JPG、WebP，最大 2 MB</span></button>:<><div className="vc-form"><label>{selected.kind==='audio'?'配音文本':selected.kind==='image'&&imageMode==='image-to-image'?'修改描述':'生成描述'}<textarea aria-label="资源生成描述" value={prompt} placeholder={(selected.originAssetId||selected.id)==='cover-voice'?'原录音逐字台词未留存。保留试听；重新生成时填写新台词。':'输入新的生成描述'} onChange={e=>setPrompt(e.target.value)}/></label></div>
      <div className="vc-resource-actions"><button className="vc-btn primary" disabled={generating||!prompt.trim()||!readyAssetIds.includes(selected.id)||(selected.kind==='image'&&imageMode==='image-to-image'&&!referenceUrl)} onClick={generate}>{generating?<Loader2 className="vc-spin" size={14}/>:<RefreshCw size={14}/ >}{generating?'正在生成…':selected.kind==='image'?(imageMode==='image-to-image'?'按参考图生成':'按文字生成'):'重新生成'}</button>{selected.kind!=='image'&&<button className="vc-btn" disabled={generating} onClick={()=>fileRef.current?.click()}><Upload size={14}/>本地上传</button>}</div></>}
     </div>
    </div>
    <input hidden ref={fileRef} type="file" accept={selected.kind==='image'?'image/*':selected.kind==='audio'?'audio/*':'video/*'} onChange={e=>fileSelected(e.target.files?.[0])}/>
    {candidate&&<div className="vc-candidate">
     {uses.length>1?<><strong>这份素材用于 {uses.length} 个场景，要替换哪些？</strong>
      <div className="vc-options vc-resource-scope" role="group" aria-label="素材替换范围">
       <button className={replacementScope==='scene'?'selected':''} aria-pressed={replacementScope==='scene'} onClick={()=>setReplacementScope('scene')}>{sceneId?'仅当前场景':'只替换一个场景'}</button>
       <button className={replacementScope==='all'?'selected':''} aria-pressed={replacementScope==='all'} onClick={()=>setReplacementScope('all')}>所有使用它的场景（{uses.length}）</button>
      </div>
      {replacementScope==='scene'&&!sceneId&&<div className="vc-resource-scope-scenes" role="group" aria-label="选择替换场景">{project.segments.filter(scene=>selected.segmentIds.includes(scene.id)).map(scene=><button key={scene.id} className={targetSceneId===scene.id?'selected':''} aria-pressed={targetSceneId===scene.id} onClick={()=>setTargetSceneId(scene.id)}>{scene.title}</button>)}</div>}
     </>:<p><Check size={15}/>确认预览效果后替换。</p>}
     <div className="vc-actions"><button className="vc-btn" onClick={()=>setCandidate(null)}>放弃本次修改</button><button className="vc-btn primary" disabled={uses.length>1&&(!replacementScope||(replacementScope==='scene'&&!targetSceneId))} onClick={useCandidate}>{selected.kind==='image'?'使用这张图片':selected.kind==='audio'?'使用这段配音':'使用这段视频'}</button></div>
    </div>}

   </>}</main>
  </div>
  {referencePicker&&!embeddedProject&&<VideoModal title="选择图生图参考图片" onClose={()=>setReferencePicker(false)}>{referenceChoices}</VideoModal>}
  <footer className="vc-editor-footer"><button className="vc-btn" onClick={close}><ArrowLeft size={14}/>取消</button><span>{embeddedProject?'应用后返回场景，场景和素材修改统一保存。':complete?'保存后自动更新相关场景并生成新版本，旧版本保留。':'素材修改随场景方案一起保存。'}</span><button className="vc-btn primary" disabled={!changed||generating||Boolean(candidate)} onClick={()=>{
 const patch={assets,composition,speakers,shots,readyAssetIds};
 if(onSave){onSave(patch);onClose();return;}
 if(complete){
  const error=startResourceUpdate(project.id,{...project,...patch},affectedSceneIds);
  if(error){toast(error);return;}
  onClose();return;
 }
 const store=useVideoCoursewareStore.getState();store.update(project.id,patch);
 if(dependentVideoIds.length)returnToMaterials(project.id);
 onClose();toast('素材修改已保存');
}}>{embeddedProject?'应用到场景':complete?'保存修改，生成新版本':'保存素材修改'}</button></footer></>;

 return embeddedProject?<div className="se-resource-editor">{referencePicker?<><button className="vc-text-btn" onClick={()=>setReferencePicker(false)}><ArrowLeft size={14}/>返回资源编辑</button><h3>选择图生图参考图片</h3>{referenceChoices}</>:body}</div>:<VideoModal title="编辑资源" onClose={close}>{body}</VideoModal>;
}
