import { useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import toast from '../../utils/toast';

export default function ResourceAudioPlayer({url,seconds=0}:{url?:string;seconds?:number}){
 const ref=useRef<HTMLAudioElement>(null),[playing,setPlaying]=useState(false),[time,setTime]=useState(0),[duration,setDuration]=useState(seconds);
 return <div className="vc-inline-audio"><audio key={url} ref={ref} src={url} preload="metadata" onLoadedMetadata={e=>{setDuration(e.currentTarget.duration);setTime(0);setPlaying(false);}} onTimeUpdate={e=>setTime(e.currentTarget.currentTime)} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>setPlaying(false)}/><button className={playing?'is-playing':''} disabled={!url} aria-label={playing?'暂停音频':'播放音频'} onClick={()=>{const audio=ref.current;if(!audio)return;if(playing)audio.pause();else{document.querySelectorAll<HTMLMediaElement>('audio,video').forEach(v=>{if(v!==audio)v.pause();});audio.play().catch(()=>toast('音频暂未加载，请重试'));}}}>{playing?<Pause size={10}/>:<Play size={10}/>}</button><input style={{background:`linear-gradient(to right, var(--agent-primary) ${duration?Math.min(100,time/duration*100):0}%, #EEF2F6 0)`}} aria-label="音频播放进度" type="range" min={0} max={Number.isFinite(duration)?duration:seconds} step={.01} value={time} disabled={!url} onChange={e=>{if(ref.current){ref.current.currentTime=Number(e.target.value);setTime(Number(e.target.value));}}}/><span>{time.toFixed(1)} / {(Number.isFinite(duration)?duration:seconds).toFixed(1)}s</span></div>;
}
