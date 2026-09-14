import { useEffect, useRef, useState } from 'react';
import { Film, Gamepad2, Layers, Play } from 'lucide-react';
import { useVideoCoursewareStore } from '../../store/videoCoursewareStore';
import { scenePreviewURL } from '../../data/videoCourseware/scenePreview';
import { segmentLabels } from '../../data/videoCourseware/model';
import { VideoModal } from './Shared';
import { runtimeURL, sendRuntimeSettings } from './runtime';

export default function VideoResultScenes({projectId,version}:{projectId:string;version:number}){
 const current=useVideoCoursewareStore(s=>s.projects[projectId]);
 const [selected,setSelected]=useState<string|null>(null),[expanded,setExpanded]=useState(false);
 const [displayed,setDisplayed]=useState<string|null>(null);
 const frame=useRef<HTMLIFrameElement>(null);
 useEffect(()=>{
  const receive=(e:MessageEvent)=>{if(e.origin!==location.origin||e.source!==frame.current?.contentWindow||e.data?.type!=='wukong-phase')return;const phase=e.data.phase;setDisplayed(phase==='intro'?'opening':phase==='cave'?'move':phase);};
  window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive);
 },[]);
 const openScene=(id:string)=>{setDisplayed(id);setSelected(id);};
 if(!current)return null;
 const result=current.resultMessages.find(r=>r.version===version);
 const project=result?.snapshot?{...current,...result.snapshot,composition:result.composition||current.composition}:current;
 const shown=expanded?project.segments:project.segments.slice(0,4);
 const activeScene=displayed||selected,activeIndex=project.segments.findIndex(s=>s.id===activeScene);
 return <div className="vc-result-scenes"><div className="vc-field-heading"><b>视频互动课件 · {project.segments.length} 个场景</b><span>按场景检查内容</span></div><div className="vc-result-scene-list">{shown.map((s,i)=>{
  const preview=scenePreviewURL(project,s.id);
  return <button key={s.id} className="vc-result-scene" onClick={()=>openScene(s.id)}><span className="vc-order">{i+1}</span>{preview?<img src={preview} alt={s.title+' · 场景截图'} loading="lazy"/>:<span className="vc-result-scene-placeholder">{s.kind==='h5'?<Gamepad2 size={20}/>:<Film size={20}/ >}</span>}<span className="vc-result-scene-copy"><b>{s.title}</b><span className={'vc-kind vc-kind-'+s.kind}>{s.kind==='video'?<Film size={12}/>:s.kind==='mixed'?<Layers size={12}/>:<Gamepad2 size={12}/ >}{segmentLabels[s.kind]}</span></span><span className="vc-scene-preview-link"><Play size={13}/>预览这一场</span></button>;
 })}</div>{project.segments.length>4&&<button className="vc-text-btn" onClick={()=>setExpanded(!expanded)}>{expanded?'收起场景':'查看全部 '+project.segments.length+' 个场景'}</button>}
 {selected&&<VideoModal title={'场景预览 · '+project.segments.find(s=>s.id===activeScene)?.title} onClose={()=>setSelected(null)}><iframe ref={frame} title="场景课件预览" className="vc-lesson" src={runtimeURL(project,project.composition,selected)} onLoad={()=>sendRuntimeSettings(frame.current?.contentWindow,project,project.composition)} allow="autoplay; fullscreen"/><div className="vc-actions"><button className="vc-btn" disabled={activeIndex<=0} onClick={()=>openScene(project.segments[activeIndex-1].id)}>上一场</button><button className="vc-btn primary" disabled={activeIndex<0||activeIndex===project.segments.length-1} onClick={()=>openScene(project.segments[activeIndex+1].id)}>下一场</button></div></VideoModal>}
 </div>;
}
