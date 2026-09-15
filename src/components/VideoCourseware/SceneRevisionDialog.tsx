import { useRef, useState } from 'react';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { useVideoCoursewareStore } from '../../store/videoCoursewareStore';
import { buildSceneCandidate, revisionProject } from '../../data/videoCourseware/sceneRevision';
import { adoptSceneRevision, beginSceneRevision, discardSceneRevision, rebaseSceneRevision, saveSceneRevisionDraft, setSceneRevision, startSceneRevision } from './sceneRevisionActions';
import { VideoModal } from './Shared';
import SceneEditor from './SceneEditor';
import { runtimeURL, sendRuntimeSettings } from './runtime';

export default function SceneRevisionDialog({projectId,sceneId,version,onClose}:{projectId:string;sceneId:string;version:number;onClose:()=>void}){
 const project=useVideoCoursewareStore(s=>s.projects[projectId]),revision=project.sceneRevisions?.[sceneId];
 const [view,setView]=useState<'edit'|'review'>(revision?.status==='draft'?'edit':'review');
 const [preview,setPreview]=useState<'current'|'candidate'>('current');
 const frame=useRef<HTMLIFrameElement>(null);
 const title=project.segments.find(s=>s.id===sceneId)?.title||'场景';
 if(!revision)return <VideoModal title={'修改 · '+title} onClose={onClose}><p className="vc-hint">这是第 {version} 版的场景。基于它创建草稿后，只将本场修改合入当前第 {project.revision} 版，其他场景保留。</p><div className="vc-actions"><button className="vc-btn" onClick={onClose}>取消</button><button className="vc-btn primary" onClick={()=>{beginSceneRevision(projectId,sceneId,version);setView('edit');}}>基于此版创建草稿</button></div></VideoModal>;
 const base=revisionProject(project,revision.base,revision.baseComposition),draft=revisionProject(project,revision.draft,revision.composition);
 const candidate=buildSceneCandidate(base,draft,sceneId,revision.scope,revision.id);
 const dirty=JSON.stringify(revision.base)!==JSON.stringify(revision.draft)||JSON.stringify(revision.baseComposition)!==JSON.stringify(revision.composition);
 function close(){if(!dirty&&revision?.status==='draft')discardSceneRevision(projectId,sceneId);onClose();}
 if(view==='edit'&&revision.status==='draft')return <SceneEditor project={draft} sceneId={sceneId} readOnly={false} allowSubmitUnchanged={dirty} saveLabel="查看更新范围" onSubmit={p=>{saveSceneRevisionDraft(projectId,sceneId,p);setView('review');setPreview('current');}} onClose={close}/>;
 const ready=revision.status==='candidate',busy=revision.status==='generating',stale=revision.status==='stale'||revision.baseVersion!==project.revision;
 const shown=preview==='candidate'&&ready&&revision.candidate?revisionProject(project,revision.candidate,revision.candidateComposition||revision.composition):base;
 const isolated={...shown,segments:shown.segments.filter(s=>s.id===sceneId)};
 const url=runtimeURL(isolated,shown.composition,sceneId);
 const affected=revision.affectedSceneIds||candidate.affectedSceneIds,finished=affected.filter(id=>revision.candidate?.readySceneIds?.includes(id)).length;
 return <VideoModal className="vc-revision-modal" title={'修改 · '+title} onClose={close}>
  <div className="sr-summary"><div><b>{busy?'正在制作新候选':ready?'新候选已就绪':stale?'整课版本有更新':'确认更新范围'}</b><p>当前整课第 {project.revision} 版保持可用，采用候选后生成下一版。</p></div>{busy&&<span><Loader2 className="vc-spin" size={15}/>{finished} / {affected.length} 场</span>}{ready&&<Check size={20}/>}</div>
  <section className="sr-scope"><div className="vc-field-heading"><b>本次更新</b><span>{candidate.metadataOnly?'仅更新名称，无需重新生成媒体':candidate.videoIds.length+' 段视频 · '+candidate.affectedSceneIds.length+' 个场景'}</span></div>
   <p>{candidate.affectedSceneIds.map(id=>project.segments.find(s=>s.id===id)?.title).join('、')}</p>
   {draft.segments.find(s=>s.id===sceneId)?.title!==base.segments.find(s=>s.id===sceneId)?.title&&<p>场景名称：{base.segments.find(s=>s.id===sceneId)?.title} → {draft.segments.find(s=>s.id===sceneId)?.title}</p>}
   {candidate.sharedSceneIds.length>0&&<><p className="vc-hint">修改的共享素材还用于：{candidate.sharedSceneIds.map(id=>project.segments.find(s=>s.id===id)?.title).join('、')}。</p><div className="vc-options" role="group" aria-label="共享素材修改范围"><button disabled={busy||ready||stale} className={revision.scope==='scene'?'selected':''} onClick={()=>setSceneRevision(projectId,sceneId,{scope:'scene'})}>仅本场</button><button disabled={busy||ready||stale} className={revision.scope==='shared'?'selected':''} onClick={()=>setSceneRevision(projectId,sceneId,{scope:'shared'})}>同步更新引用场景</button></div></>}
  </section>
  <div className="vc-tabs" role="tablist" aria-label="候选对比"><button role="tab" aria-selected={preview==='current'} className={preview==='current'?'active':''} onClick={()=>setPreview('current')}>当前版本</button><button role="tab" aria-selected={preview==='candidate'} disabled={!ready} className={preview==='candidate'?'active':''} onClick={()=>setPreview('candidate')}>新候选</button></div>
  <iframe key={preview+revision.status} ref={frame} className="vc-lesson" title="场景版本对比" src={url+'&previewOnly=1'} onLoad={()=>sendRuntimeSettings(frame.current?.contentWindow,isolated,shown.composition)} allow="autoplay; fullscreen"/>
  {revision.error&&<p className="vc-error" role="alert">{revision.error}</p>}
  <footer className="vc-actions sr-actions"><button className="vc-text-btn" onClick={()=>{discardSceneRevision(projectId,sceneId);onClose();}}>放弃修改</button><span/>{stale?<button className="vc-btn primary" onClick={()=>{rebaseSceneRevision(projectId,sceneId);setView('edit');}}>合并当前版本并继续修改</button>:busy?<button className="vc-btn" onClick={onClose}>关闭，继续制作</button>:<><button className="vc-btn" onClick={()=>{setSceneRevision(projectId,sceneId,{status:'draft',candidate:undefined,error:undefined});setView('edit');}}><ArrowLeft size={14}/>继续修改</button>{ready?<button className="vc-btn primary" onClick={()=>{if(adoptSceneRevision(projectId,sceneId))onClose();}}>采用并更新整课</button>:<button className="vc-btn primary" onClick={()=>startSceneRevision(projectId,sceneId)}>{revision.status==='failed'?'重试候选':candidate.metadataOnly?'准备更新':'生成本场新版本'}</button>}</>}</footer>
 </VideoModal>;
}
