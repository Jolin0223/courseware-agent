import { useRef, useState } from 'react';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { useVideoCoursewareStore } from '../../store/videoCoursewareStore';
import { buildSceneCandidate, revisionProject } from '../../data/videoCourseware/sceneRevision';
import { adoptSceneRevision, beginSceneRevision, discardSceneRevision, rebaseSceneRevision, saveSceneRevisionDraft, sceneRevisionForScene, setSceneRevision, startSceneRevision } from './sceneRevisionActions';
import { VideoModal } from './Shared';
import SceneEditor from './SceneEditor';
import { runtimeURL, sendRuntimeSettings } from './runtime';
import { sceneVersionsFor } from '../../data/videoCourseware/sceneVersions';

export default function SceneRevisionDialog({projectId,sceneId,version,onClose}:{projectId:string;sceneId:string;version:number;onClose:()=>void}){
 const project=useVideoCoursewareStore(s=>s.projects[projectId]),revision=sceneRevisionForScene(project,sceneId);
 const [view,setView]=useState<'edit'|'review'>(revision?.status==='draft'?'edit':'review');
 const [preview,setPreview]=useState<number|null>(null);
 const frame=useRef<HTMLIFrameElement>(null);
 const title=project.segments.find(s=>s.id===sceneId)?.title||'场景';
 if(!revision)return <VideoModal title={'修改 · '+title} onClose={onClose}><p className="vc-hint">这是第 {version} 版的场景。基于它创建草稿后，只将本场修改合入当前第 {project.revision} 版，其他场景保留。</p><div className="vc-actions"><button className="vc-btn" onClick={onClose}>取消</button><button className="vc-btn primary" onClick={()=>{beginSceneRevision(projectId,sceneId,version);setView('edit');}}>基于此版创建草稿</button></div></VideoModal>;
 const base=revisionProject(project,revision.base,revision.baseComposition),draft=revisionProject(project,revision.draft,revision.composition);
 const candidate=buildSceneCandidate(base,draft,sceneId,revision.scope,revision.id);
 const dirty=JSON.stringify(revision.base)!==JSON.stringify(revision.draft)||JSON.stringify(revision.baseComposition)!==JSON.stringify(revision.composition);
 function close(){if(!dirty&&revision?.status==='draft')discardSceneRevision(projectId,sceneId);onClose();}
 if(view==='edit'&&revision.status==='draft')return <SceneEditor project={draft} sceneId={sceneId} readOnly={false} allowSubmitUnchanged={dirty} revisionScope={revision.scope} onScopeChange={scope=>setSceneRevision(projectId,sceneId,{scope})} onSaveDraft={p=>{saveSceneRevisionDraft(projectId,sceneId,p);onClose();}} onSubmit={p=>{saveSceneRevisionDraft(projectId,sceneId,p);startSceneRevision(projectId,sceneId);setView('review');setPreview(null);}} onClose={close}/>;
 const ready=revision.status==='candidate',busy=revision.status==='generating',stale=revision.status==='stale'||revision.baseVersion!==project.revision;
 const versions=sceneVersionsFor(project,sceneId);
 const adoptedVersion=project.segments.find(scene=>scene.id===sceneId)?.revision||sceneVersionsFor({...project,sceneVersionHistory:undefined},sceneId).at(-1)?.version||1;
 const selected=versions.find(entry=>entry.version===preview)||versions.at(-1);
 const shown=selected?revisionProject(project,selected.snapshot,selected.composition):base;
 const isolated={...shown,segments:shown.segments.filter(s=>s.id===sceneId)};
 const url=runtimeURL(isolated,shown.composition,sceneId);
 const affected=revision.affectedSceneIds||candidate.affectedSceneIds,finished=affected.filter(id=>revision.candidate?.readySceneIds?.includes(id)).length;
 return <VideoModal className="vc-revision-modal" title={'修改 · '+title} onClose={close}>
  <div className="sr-summary"><div><b>{busy?'正在生成修改后的场景':ready?'修改后的场景已生成':stale?'整课已有其他修改':'本场修改尚未生成'}</b><p>原课件保持可用。选择版本查看历史效果；“更新整课”采用本次新生成版本，切换历史预览不会替换当前课件。</p></div>{busy&&<span><Loader2 className="vc-spin" size={15}/>{finished} / {affected.length} 场</span>}{ready&&<Check size={20}/>}</div>
  <section className="sr-scope"><div className="vc-field-heading"><b>本次更新</b><span>{candidate.metadataOnly?'仅更新名称，无需重新生成媒体':candidate.videoIds.length+' 段视频 · '+candidate.affectedSceneIds.length+' 个场景'}</span></div>
   <p>{candidate.affectedSceneIds.map(id=>project.segments.find(s=>s.id===id)?.title).join('、')}</p>
   {draft.segments.find(s=>s.id===sceneId)?.title!==base.segments.find(s=>s.id===sceneId)?.title&&<p>场景名称：{base.segments.find(s=>s.id===sceneId)?.title} → {draft.segments.find(s=>s.id===sceneId)?.title}</p>}

  </section>
  {versions.length>0&&<><div className="vc-tabs sr-version-tabs" role="tablist" aria-label="场景历史版本">{versions.map(entry=><button key={entry.version} role="tab" aria-selected={selected?.version===entry.version} className={selected?.version===entry.version?'active':''} onClick={()=>setPreview(entry.version)}>V{entry.version}{entry.version===adoptedVersion?' · 当前采用':ready&&entry.id===revision.id?' · 待采用':''}</button>)}</div><iframe key={String(selected?.version)+revision.status} ref={frame} className="vc-lesson" title="场景版本预览" src={url+'&previewOnly=1'} onLoad={()=>sendRuntimeSettings(frame.current?.contentWindow,isolated,shown.composition)} allow="autoplay; fullscreen"/></>}
  {busy&&<div className="sr-generating" role="status"><Loader2 className="vc-spin" size={28}/><b>正在生成修改后的场景…</b><span>完成后新增一个场景版本，已有版本仍可查看。</span></div>}
  {revision.error&&<p className="vc-error" role="alert">{revision.error}</p>}
  <footer className="vc-actions sr-actions"><button className="vc-text-btn" onClick={()=>{discardSceneRevision(projectId,sceneId);onClose();}}>放弃修改</button><span/>{stale?<button className="vc-btn primary" onClick={()=>{rebaseSceneRevision(projectId,sceneId);setView('edit');}}>合并当前版本并继续修改</button>:busy?<button className="vc-btn" onClick={onClose}>关闭，继续制作</button>:<><button className="vc-btn" onClick={()=>{setSceneRevision(projectId,sceneId,{status:'draft',candidate:undefined,error:undefined});setView('edit');}}><ArrowLeft size={14}/>继续修改</button>{ready?<button className="vc-btn primary" onClick={()=>{if(adoptSceneRevision(projectId,sceneId))onClose();}}>更新整课</button>:<button className="vc-btn primary" onClick={()=>{setPreview(null);startSceneRevision(projectId,sceneId);}}>{revision.status==='failed'?'重新生成':candidate.metadataOnly?'生成修改后的场景':'生成修改后的场景'}</button>}</>}</footer>
 </VideoModal>;
}
