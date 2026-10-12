import { useVideoCoursewareStore } from '../../store/videoCoursewareStore';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Film, Gamepad2, Layers, Loader2, Play, PencilLine } from 'lucide-react';
import type { VideoProject } from '../../data/videoCourseware/model';
import { VideoModal } from './Shared';
import { runtimeURL, sendRuntimeSettings } from './runtime';
import { handoffNestedScroll } from './nestedScroll';
import SceneEditor from './SceneEditor';
import { courseDraftProject, discardCourseDraft, saveCourseSceneDraft, startCourseDraft } from './courseDraftActions';
import toast from '../../utils/toast';

const kinds=[{kind:'video',label:'纯视频',Icon:Film},{kind:'h5',label:'纯互动页面',Icon:Gamepad2},{kind:'mixed',label:'视频＋互动',Icon:Layers}] as const;

function CourseDraftBar({project}:{project:VideoProject}){
 const [discarding,setDiscarding]=useState(false);
 const draft=project.courseDraft;
 const busy=draft?.status==='generating';
 if(!draft)return null;
 return <section className="vc-course-draft" aria-label="整课修改草稿">
  <div className="vc-course-draft-heading"><strong>{busy?'正在生成新的整课版本':`${draft.sceneIds.length} 个场景有待生成修改`}</strong><span>基于第 {draft.baseVersion} 版</span></div>
  <p>{busy?'整课生成预计约 30–60 分钟，可离开当前会话，完成后回来查看。':'可继续逐场景修改；全部生成后，更新为一个新的整课版本。'}</p>
  <div className="vc-draft-scenes">{draft.sceneIds.map(id=><span key={id}>{draft.snapshot.segments.find(s=>s.id===id)?.title}</span>)}</div>
  {draft.instruction&&<details className="vc-draft-instruction"><summary>查看修改意见</summary><p>{draft.instruction}</p></details>}
  {draft.error&&<p className="vc-error" role="alert">{draft.error} 上一版仍可预览。</p>}
  <div className="vc-course-draft-actions">
   <span role="status">{busy?'完成后可预览，当前仍可查看上一版':'草稿已保存，当前预览为上一版'}</span>
   <button className="vc-text-btn" disabled={busy} onClick={()=>setDiscarding(true)}>放弃草稿</button>
   <button className="vc-btn primary" disabled={busy} onClick={()=>startCourseDraft(project.id)}>{busy?<><Loader2 size={14} className="vc-spin"/>生成中…</>:draft.status==='failed'?'重新生成整课':'全部生成'}</button>
  </div>
  {discarding&&<div className="vc-draft-discard" role="dialog" aria-label="放弃整课草稿"><strong>放弃这次已保存的全部修改？</strong><div><button className="vc-btn" onClick={()=>setDiscarding(false)}>取消</button><button className="vc-btn danger" onClick={()=>discardCourseDraft(project.id)}>放弃草稿</button></div></div>}
 </section>;
}

export function SceneDeliveryList({project,complete=false,version=project.revision}:{project:VideoProject;complete?:boolean;version?:number}){
 const [selected,setSelected]=useState<string|null>(null),[editing,setEditing]=useState<string|null>(null);
 const current=useVideoCoursewareStore(s=>s.projects[project.id]);
 const frame=useRef<HTMLIFrameElement>(null);
 const latest=version===current?.revision;
 const busy=current?.courseDraft?.status==='generating'||current?.phase!=='ready';
 // This previews a section of the existing complete lesson, not a separate build.
 const previewProject=selected?{...project,segments:project.segments.filter(s=>s.id===selected)}:project;
 const url=selected?runtimeURL(previewProject,project.composition,selected):undefined;
 const editorProject=current&&latest?courseDraftProject(current):project;
 return <>
  <div className="vc-delivery-types" aria-label="场景类型">{kinds.map(({kind,label,Icon})=><span key={kind} className={'vc-kind vc-kind-'+kind}><Icon size={13}/>{label}<b>{project.segments.filter(s=>s.kind===kind).length}</b></span>)}</div>
  <div className="vc-result-scene-list vc-delivery-list" role="region" aria-label="按教学顺序排列的场景" tabIndex={0} onWheel={handoffNestedScroll}>{project.segments.map((scene,i)=><div className="vc-result-scene" data-delivery-scene={scene.id} key={scene.id}>
   <span className="vc-order">{i+1}</span>
   <span className="vc-result-scene-copy"><b>{scene.title}</b><small>{kinds.find(k=>k.kind===scene.kind)!.label}</small></span>
   <div className="vc-scene-row-actions">{complete&&<><button className="vc-text-btn" onClick={()=>setSelected(scene.id)}><Play size={13}/>预览</button><button className="vc-text-btn" disabled={latest&&busy} onClick={()=>setEditing(scene.id)}><PencilLine size={13}/>{latest?'修改':'查看方案'}</button></>}{latest&&current?.courseDraft?.sceneIds.includes(scene.id)&&<small className="vc-draft-marker">已保存修改</small>}</div>
  </div>)}</div>
  {complete&&latest&&current&&<CourseDraftBar project={current}/>}
  {editing&&<SceneEditor key={editing} project={editorProject} sceneId={editing} readOnly={!latest} onClose={()=>setEditing(null)} onSaveDraft={draft=>{const saved=saveCourseSceneDraft(editorProject,draft,editing);toast(saved?'已保存到整课草稿':'当前无法保存，请重新打开场景后再试');return saved;}}/>}
  {selected&&<VideoModal title={'场景预览 · '+project.segments.find(s=>s.id===selected)?.title} onClose={()=>setSelected(null)}><iframe ref={frame} className="vc-lesson" title="场景课件预览" src={url+'&previewOnly=1'} onLoad={()=>sendRuntimeSettings(frame.current?.contentWindow,previewProject,project.composition)} allow="autoplay; fullscreen"/><p className="vc-hint">正在预览第 {version} 版中的这一场景；完整课件可在右侧查看。</p></VideoModal>}
 </>;
}

export default function SceneDeliveryCard({project,children}:{project:VideoProject;children?:ReactNode}){
 const assembling=project.phase==='assembling';
 const videos=project.assets.filter(a=>a.kind==='video'),done=videos.filter(a=>project.readyAssetIds.includes(a.id)).length;
 const percent=assembling?85:Math.round(done/Math.max(videos.length,1)*70);
 return <section className="vc-card vc-delivery-card">
  <div className="vc-card-header"><div><h3><Layers size={17}/>生成整课</h3><p>整课生成预计约 30–60 分钟，可离开当前会话，完成后回来查看。</p></div></div>
  <div className="vc-progress-track" role="progressbar" aria-label="整课生成进度" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><i style={{width:percent+'%'}}/></div>
  {children}
 </section>;
}
