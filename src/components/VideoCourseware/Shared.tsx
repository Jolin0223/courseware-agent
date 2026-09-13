import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, Volume2, Pause, Image as ImageIcon, Film, Loader2 } from 'lucide-react';
import type { MediaAsset } from '../../data/videoCourseware/model';
import toast from '../../utils/toast';
import './videoCourseware.css';

export function VideoModal({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}){
 const ref=useRef<HTMLElement>(null);const closeRef=useRef(onClose);
 useEffect(()=>{closeRef.current=onClose;},[onClose]);
 useEffect(()=>{const previous=document.activeElement as HTMLElement;ref.current?.focus();document.querySelectorAll<HTMLMediaElement>('video,audio').forEach(x=>x.pause());document.querySelectorAll('iframe').forEach(f=>f.contentWindow?.postMessage({type:'pause-video-courseware'},location.origin));const key=(e:KeyboardEvent)=>{if(e.key==='Escape')closeRef.current();if(e.key==='Tab'){const list=ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,textarea,a[href],[tabindex="0"]');if(!list?.length)return;const first=list[0],last=list[list.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===ref.current)){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);previous?.focus();};},[]);
 return createPortal(<div className="vc-modal-mask" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><section className="vc-modal" role="dialog" aria-modal="true" aria-label={title} ref={ref} tabIndex={-1}><header><h2>{title}</h2><button className="vc-icon" aria-label="关闭弹窗" onClick={onClose}><X size={19}/></button></header><div className="vc-modal-body">{children}</div></section></div>,document.body);
}
export function AudioPreview({url,label='试听'}:{url?:string;label?:string}){
 const ref=useRef<HTMLAudioElement>(null);const [playing,setPlaying]=useState(false);
 return <button className="vc-btn" disabled={!url} onClick={()=>{if(playing)ref.current?.pause();else {document.querySelectorAll<HTMLMediaElement>('audio,video').forEach(x=>{if(x!==ref.current)x.pause();});ref.current?.play().catch(()=>toast('音频暂未加载，请重试'));}}}><audio ref={ref} src={url} preload="none" onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>setPlaying(false)}/>{playing?<Pause size={14}/>:<Volume2 size={14}/ >}{playing?'暂停':label}</button>;
}
export function AssetPreview({asset,ready=true}:{asset:MediaAsset;ready?:boolean}){
 if(!ready||!asset.url)return <div className="vc-media-placeholder">{ready?<ImageIcon size={23}/>:<Loader2 size={23} className="vc-spin"/>}<span>{ready?'等待生成':asset.kind==='image'?'图片生成中':asset.kind==='audio'?'配音生成中':'视频生成中'}</span></div>;
 if(asset.kind==='image')return <img className="vc-image" src={asset.url} alt={asset.name}/>;
 if(asset.kind==='audio')return <div className="vc-audio-surface"><Volume2 size={26}/><p>{asset.text||asset.name}</p><AudioPreview url={asset.url}/></div>;
 return <video className="vc-video" key={asset.url} src={asset.url} poster={asset.poster} controls playsInline preload="metadata" onPlay={e=>{document.querySelectorAll<HTMLMediaElement>('video,audio').forEach(x=>{if(x!==e.currentTarget)x.pause();});}}/>;
}
export function KindIcon({kind}:{kind:MediaAsset['kind']}){return kind==='image'?<ImageIcon size={17}/>:kind==='audio'?<Volume2 size={17}/>:<Film size={17}/>;}
