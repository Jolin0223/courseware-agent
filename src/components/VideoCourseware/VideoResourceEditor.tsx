import { useCallback, useEffect, useRef, useState } from 'react';
import { Film, Image as ImageIcon, Volume2, Upload, Loader2, Check, X, Globe, Wand2, ImagePlus } from 'lucide-react';
import type { ClipboardEvent } from 'react';
import { useVideoCoursewareStore } from '../../store/videoCoursewareStore';
import type { MediaAsset, Speaker, VideoProject } from '../../data/videoCourseware/model';
import { returnToMaterials } from './workflow';
import { startResourceUpdate } from './sceneRevisionActions';

import { replaceSceneResource } from '../../data/videoCourseware/resourceReplacement';
import { VideoModal, AssetPreview } from './Shared';
import ResourceAudioPlayer from './ResourceAudioPlayer';
import VideoVoicePicker from './VideoVoicePicker';
import ImageModeTip, { dismissImageModeTip } from '../Generator/ImageModeTip';
import toast from '../../utils/toast';

import { changedVideoIds } from '../../data/videoCourseware/planning';
import './videoResourceEditor.css';

type ImageMode = 'text-to-image' | 'image-to-image' | 'upload' | 'transparent';
type ResourceCardProps = {
 asset: MediaAsset; speaker?: Speaker; ready: boolean; sceneId?: string; showModeTip: boolean; onDismissModeTip:()=>void;
 onApply: (asset: MediaAsset, onlyScene?: string, voice?: Speaker) => void;
 onPending: (id: string, pending: boolean) => void;
};

// Each card owns its new input. Internal production prompts are never copied into the form.
function ResourceEditCard({asset,speaker,ready,sceneId,showModeTip,onDismissModeTip,onApply,onPending}:ResourceCardProps){
 const [mode,setMode]=useState<ImageMode>('image-to-image');
 const [inputs,setInputs]=useState({text:'',image:'',video:''});
 const [candidate,setCandidate]=useState<MediaAsset|null>(null);
 const [candidateVoice,setCandidateVoice]=useState<Speaker>();
 const [loading,setLoading]=useState(false);
 const [scope,setScope]=useState<'scene'|'all'>(sceneId?'scene':'all');
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const fileInput=useRef<HTMLInputElement>(null);
 const operation=useRef(0);
 const pending=Boolean(candidate||loading||inputs.text.trim()||inputs.image.trim()||inputs.video.trim());
 useEffect(()=>{onPending(asset.id,pending);return()=>onPending(asset.id,false);},[asset.id,pending,onPending]);
 useEffect(()=>()=>{operation.current++;if(timer.current)clearTimeout(timer.current);},[]);
 const prompt=asset.kind==='video'?inputs.video:mode==='image-to-image'?inputs.image:inputs.text;
 function reset(){operation.current++;if(timer.current)clearTimeout(timer.current);setLoading(false);setCandidate(null);setCandidateVoice(undefined);setInputs({text:'',image:'',video:''});}
 function generate(selectedVoice?: Speaker){
  if(!ready||!asset.url)return;
  if(asset.kind==='image'&&mode==='text-to-image'&&!prompt.trim())return;
  if(asset.kind==='image')dismissImageModeTip();
  const token=++operation.current;
  setLoading(true);setCandidate(null);
  timer.current=setTimeout(()=>{
   if(operation.current!==token)return;
   // Local prototype: same prepared media provider as the ordinary editor.
   setCandidate({...asset,prompt:asset.kind==='audio'?asset.prompt:mode==='transparent'?'去除当前图片背景，保留主体。':prompt.trim()||asset.prompt,
    imageGeneration:asset.kind==='image'&&mode!=='transparent'&&mode!=='upload'?{mode,referenceUrl:mode==='image-to-image'?asset.url:undefined,referenceName:mode==='image-to-image'?asset.name:undefined}:asset.imageGeneration,
    revision:(asset.revision||0)+1});
   setCandidateVoice(asset.kind==='audio'?selectedVoice:undefined);setLoading(false);
  },600);
 }
 function upload(file?:File){
  if(!file)return;
  const kind=asset.kind==='image'?'image/':asset.kind==='audio'?'audio/':'video/';
  if(!file.type.startsWith(kind)){toast('请选择对应类型的文件');return;}
  if(file.size>2*1024*1024){toast('文件大小不能超过 2 MB');return;}
  const token=++operation.current;setLoading(true);setCandidate(null);
  const reader=new FileReader();
  const fail=()=>{if(operation.current===token){setLoading(false);toast('无法读取文件，请重新选择');}};
  reader.onerror=fail;
  reader.onload=()=>{
   if(operation.current!==token)return;
   const url=String(reader.result);
   const next={...asset,url,revision:(asset.revision||0)+1};
   if(asset.kind==='image'){setCandidate(next);setLoading(false);return;}
   const media=document.createElement(asset.kind==='audio'?'audio':'video');
   const release=()=>{media.removeAttribute('src');media.load();};
   media.preload='metadata';media.onloadedmetadata=()=>{
    if(operation.current===token){if(Number.isFinite(media.duration)&&media.duration>0){setCandidate({...next,seconds:media.duration});setLoading(false);}else fail();}release();
   };media.onerror=()=>{fail();release();};media.src=url;
  };reader.readAsDataURL(file);
 }
 function paste(e:ClipboardEvent){const file=Array.from(e.clipboardData.files).find(f=>f.type.startsWith('image/'));if(asset.kind==='image'&&file){e.preventDefault();upload(file);}}
 function apply(){if(!candidate)return;onApply(candidate,new Set(asset.segmentIds).size>1&&scope==='scene'?sceneId:undefined,candidateVoice);reset();}
 const scopeChoice=sceneId&&new Set(asset.segmentIds).size>1&&<div className="vre-inline-scope">
  {sceneId?<><span>应用范围</span><button aria-pressed={scope==='scene'} className={scope==='scene'?'selected':''} onClick={()=>setScope('scene')}>当前场景</button><button aria-pressed={scope==='all'} className={scope==='all'?'selected':''} onClick={()=>setScope('all')}>全部 {new Set(asset.segmentIds).size} 个引用场景</button></>:<span>替换后同步更新 {new Set(asset.segmentIds).size} 个引用场景</span>}
 </div>;
 const preview=(value:MediaAsset)=>value.kind==='audio'?<ResourceAudioPlayer url={value.url} seconds={value.seconds}/>:<AssetPreview asset={value} ready={ready} showAudioText={false}/>;
 return <article className={'vre-card vre-'+asset.kind} aria-label={asset.name}>
  {asset.kind==='audio'&&<div className="vre-audio-heading"><Volume2 size={15}/><b>{asset.name}</b><small className="vre-usage">{sceneId?'引用于':'替换影响'} {new Set(asset.segmentIds).size} 个场景</small></div>}
  <div className="vre-card-row">
   <div className="vre-original">{preview(asset)}{asset.kind!=='audio'&&<div className="vre-asset-name">{asset.name}<small className="vre-usage">{sceneId?'引用于':'替换影响'} {new Set(asset.segmentIds).size} 个场景</small></div>}</div>
   <div className="vre-controls" onPaste={paste}>
    {loading?<div className="vre-loading" role="status"><Loader2 className="vc-spin" size={18}/>{mode==='upload'?'上传中…':'处理中…'}</div>:candidate?<>
     <div className="vre-result"><div className="vre-result-preview" aria-label={asset.kind==='audio'?'新音频':undefined}>{preview(candidate)}{asset.kind!=='audio'&&<small>{asset.kind==='image'?'新图片':'新视频'}</small>}</div><div className="vre-result-actions"><button className="vc-btn primary" onClick={apply}><Check size={13}/>{asset.kind==='image'?'使用此图':asset.kind==='audio'?'使用此音频':'使用此视频'}</button><button className="vc-btn" onClick={reset}><X size={13}/>取消</button></div></div>
     {scopeChoice}
    </>:asset.kind==='image'?<>
     <div className="vre-mode-wrap">{showModeTip&&<ImageModeTip onDismiss={onDismissModeTip}/>}<div className="vc-options vre-image-modes" role="group" aria-label="图片生成方式">
      {([['image-to-image','图生图',Wand2],['text-to-image','文生图',ImagePlus],['upload','本地上传',Upload],['transparent','图片透明化',Globe]] as const).map(([key,label,Icon])=><button key={key} className={mode===key?'selected':''} onClick={()=>setMode(key)}><Icon size={13}/>{label}</button>)}
     </div></div>
     <p className="vre-instruction">{mode==='text-to-image'?'输入文字描述生成一张全新的图':mode==='image-to-image'?'基于当前图片进行针对性优化修改':mode==='upload'?'上传本地图片（不超过 2 MB）':'去除图片背景，生成透明底图片'}</p>
     {mode==='upload'?<button className="vre-upload" onClick={()=>fileInput.current?.click()}><Upload size={20}/>点击或粘贴上传图片</button>:mode==='transparent'?<div className="vre-transparent"><span>点击下方按钮去除当前图片背景</span><button className="vc-btn primary" disabled={!ready} onClick={()=>generate()}><Globe size={13}/>开始透明化</button></div>:<><textarea className="vre-input" aria-label={mode==='image-to-image'?'图片修改要求':'新图片描述'} value={prompt} placeholder={mode==='image-to-image'?'描述要如何修改…':'描述你想要的图片…'} onChange={e=>setInputs({...inputs,[mode==='image-to-image'?'image':'text']:e.target.value})}/><button className="vc-btn primary vre-generate" disabled={!ready||(mode==='text-to-image'&&!prompt.trim())} onClick={()=>generate()}>生成</button></>}
    </>:asset.kind==='audio'?<div className="vre-audio-controls">
     <button className="vc-btn" disabled={!ready} onClick={()=>fileInput.current?.click()}><Upload size={13}/>本地上传</button>
     <VideoVoicePicker selectedVoice={speaker?.voiceId} assetName={asset.name} disabled={!ready} onRegenerate={v=>generate({...speaker,id:speaker?.id||'voice-'+asset.id,name:speaker?.name||asset.name,role:speaker?.role||'narrator',voiceId:v.id,voiceName:v.name,voiceLanguage:v.language})}/>

    </div>:<>
     <p className="vre-instruction">填写视频修改要求，或上传本地视频替换。</p><textarea className="vre-input" aria-label="视频修改要求" placeholder="描述要如何修改视频…" value={inputs.video} onChange={e=>setInputs({...inputs,video:e.target.value})}/><div className="vre-video-actions"><button className="vc-btn primary" disabled={!ready||!inputs.video.trim()} onClick={()=>generate()}>生成</button><button className="vc-btn" onClick={()=>fileInput.current?.click()}><Upload size={13}/>本地上传</button></div>
    </>}
   </div>
  </div>
  <input hidden ref={fileInput} type="file" accept={asset.kind==='image'?'image/*':asset.kind==='audio'?'audio/*':'video/*'} onChange={e=>{upload(e.target.files?.[0]);e.target.value='';}}/>
 </article>;
}

export default function VideoResourceEditor({projectId,onClose,initialTab='image',initialAssetId,sceneId,embeddedProject,onSave}:{projectId:string;onClose:()=>void;initialTab?:'image'|'audio'|'video';initialAssetId?:string;sceneId?:string;embeddedProject?:VideoProject;onSave?:(patch:Partial<VideoProject>,affectedSceneIds:string[])=>void}){
 const storedProject=useVideoCoursewareStore(s=>s.projects[projectId]);
 const project=embeddedProject||storedProject;
 const openingProject=useRef(project);
 const [draft,setDraft]=useState(()=>structuredClone(project));
 const [tab,setTab]=useState(initialTab);
 const [focusedId,setFocusedId]=useState(initialAssetId);
 const [affectedSceneIds,setAffectedSceneIds]=useState<string[]>([]);
 const [changedIds,setChangedIds]=useState<string[]>([]);
 const [pendingIds,setPendingIds]=useState<string[]>([]);
 const [discarding,setDiscarding]=useState(false);
 const [modeTipDismissed,setModeTipDismissed]=useState(false);
 const cardsRef=useRef<HTMLDivElement>(null);
 function switchTab(kind:typeof tab){cardsRef.current?.querySelectorAll<HTMLMediaElement>('audio,video').forEach(media=>media.pause());setTab(kind);}
 const focused=Boolean(embeddedProject&&initialAssetId);
 const hasVideo=project.assets.some(a=>a.kind==='video'&&project.readyAssetIds.includes(a.id));
 const onPending=useCallback((id:string,pending:boolean)=>setPendingIds(ids=>pending?ids.includes(id)?ids:[...ids,id]:ids.includes(id)?ids.filter(value=>value!==id):ids),[]);
 function apply(replacement:MediaAsset,onlyScene?:string,voice?:Speaker){
  const original=draft.assets.find(a=>a.id===replacement.id);
  if(!original)return;
  const next=replaceSceneResource(draft,replacement,onlyScene);
  const applied=onlyScene&&original.segmentIds.length>1?next.assets.find(a=>a.originAssetId===(original.originAssetId||original.id)&&a.segmentIds.length===1&&a.segmentIds[0]===onlyScene):next.assets.find(a=>a.id===original.id);
  if(!applied)return;
  // Audio cards change only the selected resource; other clips by the speaker keep their voice.
  if(voice&&(voice.voiceId!==draft.speakers.find(s=>s.id===original.speakerId)?.voiceId||voice.voiceName!==draft.speakers.find(s=>s.id===original.speakerId)?.voiceName)){
   const speakerId=`${voice.id}--${applied.id}`;
   next.speakers=[...next.speakers.filter(s=>s.id!==speakerId),{...voice,id:speakerId}];
   applied.speakerId=speakerId;
  }
  setDraft(next);if(focused)setFocusedId(applied.id);
  setAffectedSceneIds(ids=>[...new Set([...ids,...(onlyScene?[onlyScene]:original.segmentIds)])]);
  setChangedIds(ids=>[...new Set([...ids,applied.id])]);
 }
 function close(){setDiscarding(true);}
 function save(){
  const {assets,composition,speakers,shots,readyAssetIds}=draft;
  const patch={assets,composition,speakers,shots,readyAssetIds};
  if(onSave){onSave(patch,affectedSceneIds);onClose();return;}
  if(project.phase==='ready'){if(storedProject.revision!==openingProject.current.revision){toast('课件版本已变化，请重新打开资源编辑');return;}const error=startResourceUpdate(project.id,{...openingProject.current,...patch},affectedSceneIds);if(error){toast(error);return;}onClose();return;}
  useVideoCoursewareStore.getState().update(project.id,patch);
  if(changedVideoIds(draft).length)returnToMaterials(project.id);
  onClose();toast('素材修改已保存');
 }
 const body=<>
  <div className="vre-toolbar">
   {!focused&&<div className="vre-tabs" role="tablist" aria-label="资源类型">{(['image','audio',...(hasVideo?['video']:[])] as Array<typeof tab>).map(kind=><button key={kind} role="tab" aria-selected={tab===kind} className={tab===kind?'active':''} onClick={()=>switchTab(kind)}>{kind==='image'?<ImageIcon size={15}/>:kind==='audio'?<Volume2 size={15}/>:<Film size={15}/ >}{kind==='image'?'图片资源':kind==='audio'?'音频资源':'视频资源'}<small>{draft.assets.filter(a=>a.kind===kind&&(!sceneId||a.segmentIds.includes(sceneId))).length}</small></button>)}</div>}
  </div>
  <div ref={cardsRef} className={'vre-cards'+(focused?' vre-focused':'')}>
   {draft.assets.filter(a=>focused?a.id===focusedId:(!sceneId||a.segmentIds.includes(sceneId))).map(asset=><div key={`${asset.id}:${asset.revision||0}`} hidden={!focused&&asset.kind!==tab}><ResourceEditCard asset={asset} speaker={draft.speakers.find(s=>s.id===asset.speakerId)} ready={draft.readyAssetIds.includes(asset.id)} sceneId={sceneId} showModeTip={!modeTipDismissed&&(focused||asset.id===draft.assets.find(a=>a.kind==='image')?.id)} onDismissModeTip={()=>setModeTipDismissed(true)} onApply={apply} onPending={onPending}/></div>)}
  </div>
  <footer className="vc-editor-footer vre-footer">{discarding&&<div className="vre-cancel-popover" role="alertdialog" aria-label="确认取消资源修改"><p>取消后当前改动将不会生效，确认取消吗？</p><div><button className="vc-btn" onClick={()=>setDiscarding(false)}>取消</button><button className="vc-btn danger" onClick={onClose}>确认</button></div></div>}<button className="vc-btn" onClick={close}>取消</button><button className="vc-btn primary" disabled={!changedIds.length||Boolean(pendingIds.length)} onClick={save}>{embeddedProject?'确认替换，返回场景':'确认全部替换'}</button></footer>
 </>;
 return embeddedProject?<div className="se-resource-editor vre-editor">{body}</div>:<VideoModal className="vre-modal" title="编辑资源" onClose={close}>{body}</VideoModal>;
}
