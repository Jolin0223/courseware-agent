import type { SceneRevision, VideoProject } from '../../data/videoCourseware/model';
import { advanceSceneProduction } from '../../data/videoCourseware/production';
import { buildSceneCandidate, rebaseSceneDraft, revisionProject, sceneSnapshot, seedHistoricalScene } from '../../data/videoCourseware/sceneRevision';
import { videoPlanIssues } from '../../data/videoCourseware/planning';
import { useVideoCoursewareStore } from '../../store/videoCoursewareStore';
import { finishVideoProject } from './workflow';

const projectFor=(id:string)=>useVideoCoursewareStore.getState().projects[id];
export function setSceneRevision(projectId:string,sceneId:string,patch:Partial<SceneRevision>){
 const p=projectFor(projectId),existing=p.sceneRevisions?.[sceneId];if(!existing)return;
 useVideoCoursewareStore.getState().update(projectId,{sceneRevisions:{...p.sceneRevisions,[sceneId]:{...existing,...patch}}});
}
export function beginSceneRevision(projectId:string,sceneId:string,version:number){
 const p=projectFor(projectId);if(p.phase!=='ready')return;
 if(p.sceneRevisions?.[sceneId])return p.sceneRevisions[sceneId];
 const source=p.resultMessages.find(r=>r.version===version),old=source?.snapshot?revisionProject(p,source.snapshot,source.composition||p.composition):p;
 const draft=version===p.revision?p:seedHistoricalScene(p,old,sceneId);
 const revision:SceneRevision={id:crypto.randomUUID(),sceneId,baseVersion:p.revision,sourceVersion:version,scope:'scene',base:sceneSnapshot(p),baseComposition:structuredClone(p.composition),draft:sceneSnapshot(draft),composition:structuredClone(draft.composition),status:'draft'};
 useVideoCoursewareStore.getState().update(projectId,{sceneRevisions:{...p.sceneRevisions,[sceneId]:revision}});return revision;
}
export function saveSceneRevisionDraft(projectId:string,sceneId:string,draft:VideoProject){
 setSceneRevision(projectId,sceneId,{draft:sceneSnapshot(draft),composition:structuredClone(draft.composition),status:'draft',candidate:undefined,candidateComposition:undefined,error:undefined});
}
export function startSceneRevision(projectId:string,sceneId:string,now=Date.now()){
 const p=projectFor(projectId),r=p.sceneRevisions?.[sceneId];if(!r||r.status==='generating'||p.phase!=='ready')return false;
 if(p.revision!==r.baseVersion){setSceneRevision(projectId,sceneId,{status:'stale',error:'整课已有更新，请先合并到当前版本再生成。'});return false;}
 const result=buildSceneCandidate(revisionProject(p,r.base,r.baseComposition),revisionProject(p,r.draft,r.composition),sceneId,r.scope,r.id);
 const issues=videoPlanIssues(result.project);
 if(issues.length){setSceneRevision(projectId,sceneId,{status:'failed',error:[...new Set(issues)].join(' ')});return false;}
 const retry=r.status==='failed'&&r.candidate;
 if(retry){result.project.readyAssetIds=[...new Set([...result.project.readyAssetIds,...r.candidate!.readyAssetIds])];result.project.readyPageIds=r.candidate!.readyPageIds;result.project.readySceneIds=r.candidate!.readySceneIds;}
 setSceneRevision(projectId,sceneId,{status:result.metadataOnly?'candidate':'generating',candidate:sceneSnapshot(result.project),candidateComposition:result.project.composition,affectedSceneIds:result.affectedSceneIds,videoIds:result.videoIds,metadataOnly:result.metadataOnly,startedAt:retry?now-(r.elapsed||0):now,elapsed:retry?r.elapsed:0,sceneAssemblyStarts:retry?r.sceneAssemblyStarts:{},error:undefined});return true;
}
export function advanceSceneRevisions(projectId:string,now:number){
 const p=projectFor(projectId);
 for(const [sceneId,r] of Object.entries(p.sceneRevisions||{})){
  if(r.status!=='generating'||!r.candidate)continue;
  if(p.revision!==r.baseVersion){setSceneRevision(projectId,sceneId,{status:'stale',error:'整课已更新，候选暂未采用。请合并当前版本后继续。'});continue;}
  const elapsed=now-(r.startedAt??now),draft=revisionProject(p,r.candidate,r.candidateComposition||r.composition);
  const progress=advanceSceneProduction({...draft,sceneAssemblyStarts:r.sceneAssemblyStarts},elapsed);
  const candidate={...draft,...progress},ids=r.affectedSceneIds||[sceneId];
  const ready=ids.every(id=>candidate.readySceneIds?.includes(id));
  const missing=ids.some(id=>candidate.segments.find(s=>s.id===id)?.kind!=='h5'&&!candidate.assets.some(a=>a.kind==='video'&&a.url&&a.segmentIds.includes(id)))||candidate.assets.some(a=>a.kind==='video'&&a.segmentIds.some(id=>ids.includes(id))&&!a.url);
  setSceneRevision(projectId,sceneId,{candidate:sceneSnapshot(candidate),sceneAssemblyStarts:progress.sceneAssemblyStarts,elapsed,status:ready?'candidate':elapsed>=14000&&missing?'failed':'generating',error:elapsed>=14000&&missing?'部分视频未完成，原整课仍可预览。请修改或重试候选。':undefined});
 }
}
export function rebaseSceneRevision(projectId:string,sceneId:string){
 const p=projectFor(projectId),r=p.sceneRevisions?.[sceneId];if(!r)return;
 const draft=rebaseSceneDraft(p,r);setSceneRevision(projectId,sceneId,{baseVersion:p.revision,base:sceneSnapshot(p),baseComposition:structuredClone(p.composition),draft:sceneSnapshot(draft),composition:draft.composition,status:'draft',candidate:undefined,error:undefined});
}
export function discardSceneRevision(projectId:string,sceneId:string){
 const p=projectFor(projectId),revisions={...p.sceneRevisions};delete revisions[sceneId];useVideoCoursewareStore.getState().update(projectId,{sceneRevisions:revisions});
}
export function adoptSceneRevision(projectId:string,sceneId:string){
 const p=projectFor(projectId),r=p.sceneRevisions?.[sceneId];if(!r?.candidate||r.status!=='candidate'||p.phase!=='ready')return false;
 if(p.revision!==r.baseVersion){setSceneRevision(projectId,sceneId,{status:'stale',error:'整课已有更新，请合并当前版本后再采用。'});return false;}
 const remaining={...p.sceneRevisions};delete remaining[sceneId];
 for(const id of Object.keys(remaining))remaining[id]={...remaining[id],status:'stale',error:'整课已采用其他修改，请合并到当前版本后继续。'};
 useVideoCoursewareStore.getState().update(projectId,{...r.candidate,composition:r.candidateComposition||r.composition,sceneRevisions:remaining});
 finishVideoProject(projectId,undefined,'采用“'+p.segments.find(s=>s.id===sceneId)?.title+'”的新版本，更新整课。');return true;
}
