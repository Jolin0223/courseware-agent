import { useEffect, useRef, useState } from 'react';
import { Film, Image as ImageIcon, Volume2, Upload, RefreshCw, Loader2, ArrowLeft, Check, Settings2 } from 'lucide-react';
import { useVideoCoursewareStore, copyPlayback } from '../../store/videoCoursewareStore';
import type { MediaAsset, PlaybackSettings } from '../../data/videoCourseware/model';
import { runtimeURL, sendRuntimeSettings } from './runtime';
import { finishVideoProject, beginVideoPlanReview } from './workflow';
import { VideoModal, AssetPreview } from './Shared';
import toast from '../../utils/toast';
import { changedVideoIds } from '../../data/videoCourseware/planning';

export default function VideoResourceEditor({projectId,onClose}:{projectId:string;onClose:()=>void}){
 const project=useVideoCoursewareStore(s=>s.projects[projectId]);
 const [tab,setTab]=useState<'image'|'audio'|'video'|'playback'>('image');
 const [selectedId,setSelectedId]=useState(project?.assets.find(a=>a.kind==='image')?.id||'');
 const [assets,setAssets]=useState(()=>project?.assets.map(a=>({...a}))||[]);
 const [composition,setComposition]=useState<PlaybackSettings>(()=>copyPlayback(project.composition));
 const [candidate,setCandidate]=useState<MediaAsset|null>(null),[generating,setGenerating]=useState(false),[changed,setChanged]=useState(false);
 const [prompt,setPrompt]=useState(()=>project.assets.find(a=>a.kind==='image')?.prompt||'');
 const [changedAssetIds,setChangedAssetIds]=useState<string[]>([]);const fileRef=useRef<HTMLInputElement>(null);const timer=useRef<ReturnType<typeof setTimeout>|null>(null);const frame=useRef<HTMLIFrameElement>(null);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
 const selected=assets.find(a=>a.id===selectedId)||assets.find(a=>a.kind===tab);
 const hasVideo=project.assets.some(a=>a.kind==='video'&&project.readyAssetIds.includes(a.id));
 function close(){if(timer.current)clearTimeout(timer.current);onClose();}
 function pick(a:MediaAsset){if(timer.current)clearTimeout(timer.current);setGenerating(false);setCandidate(null);setSelectedId(a.id);setPrompt(a.kind==='audio'?a.text||a.prompt:a.prompt);}
 function switchTab(next:typeof tab){setTab(next);const first=assets.find(a=>a.kind===next);if(first)pick(first);}
 function editPlayback(patch:Partial<PlaybackSettings>){const next={...composition,...patch};setComposition(next);setChanged(true);sendRuntimeSettings(frame.current?.contentWindow,project,next);}
 function generate(){if(!selected?.url)return;setCandidate(null);setGenerating(true);timer.current=setTimeout(()=>{setGenerating(false);setCandidate({...selected,prompt,text:selected.kind==='audio'?prompt:selected.text,revision:(selected.revision||0)+1});},4800);}
 function fileSelected(file?:File){if(!file||!selected)return;const expected=selected.kind==='image'?'image/':selected.kind==='audio'?'audio/':'video/';if(!file.type.startsWith(expected)){toast('文件类型不匹配，请选择对应的图片、音频或视频');return;}if(file.size>2*1024*1024){toast('当前上传文件不能超过 2 MB');return;}const reader=new FileReader();reader.onload=()=>{
 const url=String(reader.result);
 if(selected.kind==='image'){setCandidate({...selected,url,prompt,revision:(selected.revision||0)+1});return;}
 const media=document.createElement(selected.kind==='audio'?'audio':'video');
 media.preload='metadata';media.src=url;
 media.onloadedmetadata=()=>{if(Number.isFinite(media.duration)&&media.duration>0)setCandidate({...selected,url,prompt,text:selected.kind==='audio'?prompt:selected.text,seconds:media.duration,revision:(selected.revision||0)+1});else toast('无法读取文件时长，请换一个文件');media.removeAttribute('src');media.load();};
 media.onerror=()=>{toast('无法读取此文件，请使用可播放的音频或视频');media.removeAttribute('src');media.load();};
};reader.readAsDataURL(file);}
 function useCandidate(){if(!candidate||!selected)return;setAssets(assets.map(a=>a.id===selected.id?candidate:a));if(selected.url&&candidate.url)setComposition({...composition,assetOverrides:{...composition.assetOverrides,[selected.id]:candidate.url}});setChangedAssetIds(ids=>[...new Set([...ids,selected.id])]);setChanged(true);setCandidate(null);}
 const uses=(selected?.segmentIds||[]).map(id=>project.segments.find(s=>s.id===id)?.title).filter(Boolean);
 const complete=project.phase==='ready';
 const overlay=assets.find(a=>a.overlay);
 const overlaySettings=composition.overlays[overlay?.id||'']||{offsetY:0,scale:1};
 function editOverlay(patch:Partial<typeof overlaySettings>){if(overlay)editPlayback({overlays:{...composition.overlays,[overlay.id]:{...overlaySettings,...patch}}});}
 const dependentVideoIds=project.shots?changedVideoIds({...project,assets}):assets.filter(a=>a.kind==='video'&&assets.some(changedAsset=>changedAsset.kind!=='video'&&changedAsset.videoDependency!==false&&!changedAsset.overlay&&changedAsset.audioUse!=='interaction'&&changedAssetIds.includes(changedAsset.id)&&changedAsset.segmentIds.some(id=>a.segmentIds.includes(id)))).map(a=>a.id);
 return <VideoModal title="编辑资源" onClose={close}><p className="vc-hint vc-edit-scope">替换图片、配音或视频，只更新使用该素材的环节。教学内容、题目和环节顺序请通过对话或方案修改。</p><div className="vc-tabs" role="tablist" aria-label="资源类型">{(['image','audio',...(hasVideo?['video','playback']:[])] as Array<typeof tab>).map(kind=><button key={kind} role="tab" aria-selected={tab===kind} className={tab===kind?'active':''} onClick={()=>switchTab(kind)}>{kind==='image'?<ImageIcon size={16}/>:kind==='audio'?<Volume2 size={16}/>:kind==='video'?<Film size={16}/>:<Settings2 size={16}/ >}{kind==='image'?'图片':kind==='audio'?'旁白与角色配音':kind==='video'?'视频':'播放设置'}</button>)}</div>{tab==='playback'?<div className="vc-edit-layout"><div><iframe className="vc-lesson" ref={frame} title="播放设置预览" src={runtimeURL(project,project.composition,overlay?.overlay?.sceneId||project.segments.find(s=>s.kind!=='h5')?.id||'cover',true)} onLoad={()=>sendRuntimeSettings(frame.current?.contentWindow,project,composition)} allow="autoplay"/><p className="vc-hint">播放设置直接应用于课件，无需重新生成视频。</p></div><div className="vc-form"><label className="vc-checkbox"><input type="checkbox" checked={composition.subtitles} onChange={e=>editPlayback({subtitles:e.target.checked})}/>显示故事字幕</label><label className="vc-checkbox"><input type="checkbox" checked={composition.soundEffects} onChange={e=>editPlayback({soundEffects:e.target.checked})}/>播放点击与奖励音效</label>{overlay&&<><h3>{overlay.name}的位置</h3><label>上下位置<input aria-label="道具上下位置" type="range" min={-100} max={80} value={overlaySettings.offsetY} onChange={e=>editOverlay({offsetY:Number(e.target.value)})}/></label><label>显示大小<input aria-label="道具大小" type="range" min={70} max={120} value={overlaySettings.scale*100} onChange={e=>editOverlay({scale:Number(e.target.value)/100})}/></label></>}</div></div>:<div className="vc-editor-columns"><aside className="vc-resource-list">{assets.filter(a=>a.kind===tab).map(a=><button key={a.id} disabled={!project.readyAssetIds.includes(a.id)} className={selected?.id===a.id?'active':''} onClick={()=>pick(a)}>{a.kind==='audio'?<Volume2 size={19}/>:project.readyAssetIds.includes(a.id)?<img src={a.poster||a.url} alt=""/>:<Loader2 size={19} className="vc-spin"/>}<span><b>{a.name}</b><small>{a.kind==='audio'?project.speakers.find(s=>s.id===a.speakerId)?.name:a.kind==='video'?`${a.seconds} 秒`:a.role}</small></span></button>)}</aside><main>{selected&&<><h3>{selected.name}</h3><AssetPreview asset={candidate||selected} ready={project.readyAssetIds.includes(selected.id)}/><p className="vc-hint">使用位置：{uses.join('、')}</p>{selected.kind==='audio'&&<p className="vc-hint">说话人：{project.speakers.find(s=>s.id===selected.speakerId)?.name} · {project.speakers.find(s=>s.id===selected.speakerId)?.voiceName}</p>}<div className="vc-form"><label>{selected.kind==='audio'?'配音文本':'生成描述'}<textarea aria-label="资源生成描述" value={prompt} onChange={e=>setPrompt(e.target.value)}/></label></div><div className="vc-resource-actions"><input hidden ref={fileRef} type="file" accept={selected.kind==='image'?'image/*':selected.kind==='audio'?'audio/*':'video/*'} onChange={e=>fileSelected(e.target.files?.[0])}/><button className="vc-btn" disabled={generating||!project.readyAssetIds.includes(selected.id)} onClick={()=>fileRef.current?.click()}><Upload size={14}/>上传替换</button><button className="vc-btn primary" disabled={generating||!prompt.trim()||!project.readyAssetIds.includes(selected.id)} onClick={generate}>{generating?<Loader2 className="vc-spin" size={14}/>:<RefreshCw size={14}/ >}{generating?'正在生成候选…':'重新生成'}</button></div>{candidate&&<div className="vc-candidate"><p><Check size={15}/>候选已生成。采用后更新 {uses.length} 个环节，其他素材保留。</p><div className="vc-actions"><button className="vc-btn" onClick={()=>setCandidate(null)}>取消候选</button><button className="vc-btn primary" onClick={useCandidate}>采用候选</button></div></div>}</>}</main></div>}<footer className="vc-editor-footer"><button className="vc-btn" onClick={close}><ArrowLeft size={14}/>取消</button><span>{changed?(dependentVideoIds.length?`将更新 ${dependentVideoIds.length} 段视频方案，确认后再生成视频`:'修改尚未保存'):complete?'保存修改后会生成新版本，旧版本保留':'确认素材后再生成视频'}</span><button className="vc-btn primary" disabled={!changed||generating||Boolean(candidate)} onClick={()=>{
 const store=useVideoCoursewareStore.getState();
 store.update(project.id,{assets,composition});
 if(dependentVideoIds.length){
  store.update(project.id,{readyAssetIds:project.readyAssetIds.filter(id=>!dependentVideoIds.includes(id)),approvedPlanKey:undefined,pendingEdit:'更新相关视频方案'});
  beginVideoPlanReview(project.id);
 }else if(complete)finishVideoProject(project.id,composition,'更新选中的素材与播放设置，其他内容保留。');
 onClose();toast(dependentVideoIds.length?'素材已保存，正在更新相关视频方案，请确认后生成视频':complete?'新版本已生成，请预览后发布':'素材修改已保存');
}}>{dependentVideoIds.length?'保存并更新视频方案':complete?'保存修改，生成新版本':'保存素材修改'}</button></footer></VideoModal>;
}
