import SceneRevisionDialog from './SceneRevisionDialog';
import { beginSceneRevision, sceneRevisionForScene } from './sceneRevisionActions';
import { useVideoCoursewareStore } from '../../store/videoCoursewareStore';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, Film, Gamepad2, Layers, Loader2, Play, PencilLine } from 'lucide-react';
import type { VideoProject } from '../../data/videoCourseware/model';
import { sceneProductionLabel } from '../../data/videoCourseware/production';
import { scenePreviewURL, sceneResourcePreviewURL } from '../../data/videoCourseware/scenePreview';
import { VideoModal } from './Shared';
import { runtimeURL, sendRuntimeSettings } from './runtime';
import { handoffNestedScroll } from './nestedScroll';

const kinds=[{kind:'video',label:'纯视频',Icon:Film},{kind:'h5',label:'纯互动页面',Icon:Gamepad2},{kind:'mixed',label:'视频＋互动',Icon:Layers}] as const;

export function SceneDeliveryList({project,complete=false,version=project.revision}:{project:VideoProject;complete?:boolean;version?:number}){
  const [selected,setSelected]=useState<string|null>(null);
  const [editing,setEditing]=useState<string|null>(null);
  const current=useVideoCoursewareStore(s=>s.projects[project.id]);
  const frame=useRef<HTMLIFrameElement>(null);
  const isReady=(id:string)=>complete||Boolean(project.readySceneIds?.includes(id));
  // A row preview always shows only that scene; the full lesson lives in the preview panel.
  const previewProject=selected?{...project,segments:project.segments.filter(s=>s.id===selected)}:project;
  const url=selected?runtimeURL(previewProject,project.composition,selected):undefined;
  return <>
    <div className="vc-delivery-types" aria-label="三种场景类型进度">{kinds.map(({kind,label,Icon})=>{
      const scenes=project.segments.filter(s=>s.kind===kind);
      return <span key={kind} className={'vc-kind vc-kind-'+kind}><Icon size={13}/>{label}<b>{scenes.filter(s=>isReady(s.id)).length} / {scenes.length}</b></span>;
    })}</div>
    <div className="vc-result-scene-list vc-delivery-list" role="region" aria-label="按教学顺序排列的场景" tabIndex={0} onWheel={handoffNestedScroll}>{project.segments.map((scene,i)=>{
      const ready=isReady(scene.id),preview=ready?scenePreviewURL(project,scene.id):undefined;
      const thumbnail=preview||(ready?sceneResourcePreviewURL(project,scene.id):undefined);
      const KindIcon=kinds.find(k=>k.kind===scene.kind)!.Icon;
      const revision=current?sceneRevisionForScene(current,scene.id):undefined;
      return <div className={"vc-result-scene"+(!ready?" vc-scene-pending":"")} data-delivery-scene={scene.id} key={scene.id}>
        <span className="vc-order">{i+1}</span>
        {thumbnail?<img src={thumbnail} alt={scene.title+(preview?' · 场景截图':' · 本场素材')}/>:<span className="vc-result-scene-placeholder"><KindIcon size={20}/></span>}
        <span className="vc-result-scene-copy"><b>{scene.title}</b><small>{complete&&<strong className="vc-scene-version">V{scene.revision||1}</strong>}{kinds.find(k=>k.kind===scene.kind)!.label}</small></span>
        <div className="vc-scene-row-actions">{ready?<button className="vc-text-btn" onClick={()=>setSelected(scene.id)}><Play size={13}/>预览</button>:<span className="vc-delivery-status">{project.phase!=='paused'&&project.phase!=='failed'&&(!project.sceneJobs||['queued','generating'].includes(project.sceneJobs[scene.id]?.status))&&<Loader2 size={13} className="vc-spin"/>}{sceneProductionLabel(project,scene)}</span>}{complete&&<button className="vc-text-btn" disabled={current?.phase!=='ready'} onClick={()=>{if(version===current?.revision)beginSceneRevision(project.id,scene.id,version);setEditing(scene.id);}}><PencilLine size={13}/>修改</button>}{complete&&version===current?.revision&&revision&&<small>{({draft:'有修改草稿',generating:'修改内容生成中',candidate:'修改后可预览',failed:'修改待重试',stale:'待合并新版本'} as const)[revision.status]}</small>}</div>
      </div>;
    })}</div>
    {editing&&<SceneRevisionDialog projectId={project.id} sceneId={editing} version={version} onClose={()=>setEditing(null)}/>}
    {selected&&<VideoModal title={'场景预览 · '+project.segments.find(s=>s.id===selected)?.title} onClose={()=>setSelected(null)}><iframe ref={frame} className="vc-lesson" title="场景课件预览" src={url+'&previewOnly=1'} onLoad={()=>sendRuntimeSettings(frame.current?.contentWindow,previewProject,project.composition)} allow="autoplay; fullscreen"/><p className="vc-hint">{complete?'仅预览这一场；完整课件可在右侧查看。':'当前预览已完成的这一场，其他场景继续制作。'}</p></VideoModal>}
  </>;
}

export default function SceneDeliveryCard({project,children}:{project:VideoProject;children?:ReactNode}){
  const done=project.segments.filter(s=>project.readySceneIds?.includes(s.id)).length;
  const percent=Math.round(done/Math.max(project.segments.length,1)*100);
  return <section className="vc-card vc-delivery-card">
    <div className="vc-card-header"><div><h3>{done===project.segments.length?<Check size={17}/>:<Layers size={17}/>}场景生成与交付</h3><p>{project.phase==='assembling'?'所有场景已就绪，正在剪辑、衔接并检查整课。':'整课生成预计约 30–60 分钟，场景会陆续完成；你可以先预览，也可以离开当前页面。'}</p></div><span className="vc-delivery-count">V{project.revision||1} · {done} / {project.segments.length} 场</span></div>
    <div className="vc-progress-track" role="progressbar" aria-label="场景生成进度" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><i style={{width:percent+'%'}}/></div>
    <SceneDeliveryList project={project}/>
    {children}
  </section>;
}
