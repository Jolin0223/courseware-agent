import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, Film, Gamepad2, Layers, Loader2, Play } from 'lucide-react';
import type { VideoProject } from '../../data/videoCourseware/model';
import { sceneProductionLabel } from '../../data/videoCourseware/production';
import { scenePreviewURL } from '../../data/videoCourseware/scenePreview';
import { VideoModal } from './Shared';
import { runtimeURL, sendRuntimeSettings } from './runtime';

const kinds=[{kind:'video',label:'纯视频',Icon:Film},{kind:'h5',label:'纯互动页面',Icon:Gamepad2},{kind:'mixed',label:'视频＋互动',Icon:Layers}] as const;

export function SceneDeliveryList({project,complete=false}:{project:VideoProject;complete?:boolean}){
  const [selected,setSelected]=useState<string|null>(null);
  const frame=useRef<HTMLIFrameElement>(null);
  const isReady=(id:string)=>complete||Boolean(project.readySceneIds?.includes(id));
  // During generation preview only the chosen completed scene, never unfinished neighbours.
  const previewProject=selected&&!complete?{...project,segments:project.segments.filter(s=>s.id===selected)}:project;
  const url=selected?runtimeURL(previewProject,project.composition,selected):undefined;
  return <>
    <div className="vc-delivery-types" aria-label="三种场景类型进度">{kinds.map(({kind,label,Icon})=>{
      const scenes=project.segments.filter(s=>s.kind===kind);
      return <span key={kind} className={'vc-kind vc-kind-'+kind}><Icon size={13}/>{label}<b>{scenes.filter(s=>isReady(s.id)).length} / {scenes.length}</b></span>;
    })}</div>
    <div className="vc-result-scene-list vc-delivery-list" role="region" aria-label="按教学顺序排列的场景" tabIndex={0}>{project.segments.map((scene,i)=>{
      const ready=isReady(scene.id),preview=ready?scenePreviewURL(project,scene.id):undefined;
      const KindIcon=kinds.find(k=>k.kind===scene.kind)!.Icon;
      return <button className="vc-result-scene" data-delivery-scene={scene.id} key={scene.id} disabled={!ready} onClick={()=>setSelected(scene.id)}>
        <span className="vc-order">{i+1}</span>
        {preview?<img src={preview} alt={scene.title+' · 场景截图'}/>:<span className="vc-result-scene-placeholder"><KindIcon size={20}/></span>}
        <span className="vc-result-scene-copy"><b>{scene.title}</b><small>{kinds.find(k=>k.kind===scene.kind)!.label}</small></span>
        <span className={ready?'vc-scene-preview-link':'vc-delivery-status'}>{ready?<Play size={13}/>:project.phase!=='paused'&&project.phase!=='failed'?<Loader2 size={13} className="vc-spin"/>:null}{ready?'预览这一场':sceneProductionLabel(project,scene)}</span>
      </button>;
    })}</div>
    {selected&&<VideoModal title={'场景预览 · '+project.segments.find(s=>s.id===selected)?.title} onClose={()=>setSelected(null)}><iframe ref={frame} className="vc-lesson" title="场景课件预览" src={url+(complete?'':'&previewOnly=1')} onLoad={()=>sendRuntimeSettings(frame.current?.contentWindow,previewProject,project.composition)} allow="autoplay; fullscreen"/><p className="vc-hint">{complete?'按教学顺序体验完整课件。':project.phase==='ready'?'整课已完成，关闭本场预览后可查看完整课件。':'当前预览已完成的这一场，其他场景继续制作。'}</p></VideoModal>}
  </>;
}

export default function SceneDeliveryCard({project,children}:{project:VideoProject;children?:ReactNode}){
  const done=project.segments.filter(s=>project.readySceneIds?.includes(s.id)).length;
  const percent=Math.round(done/Math.max(project.segments.length,1)*100);
  return <section className="vc-card vc-delivery-card">
    <div className="vc-card-header"><div><h3>{done===project.segments.length?<Check size={17}/>:<Layers size={17}/>}场景生成与交付</h3><p>{project.phase==='assembling'?'所有场景已就绪，正在剪辑、衔接并检查整课。':'按教学顺序逐场完成，可先预览已就绪的场景。'}</p></div><span className="vc-delivery-count">{done} / {project.segments.length} 场</span></div>
    <div className="vc-progress-track" role="progressbar" aria-label="场景生成进度" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><i style={{width:percent+'%'}}/></div>
    <SceneDeliveryList project={project}/>
    {children}
  </section>;
}
