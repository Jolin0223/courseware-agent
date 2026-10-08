import type { SceneRevision, VideoProject } from '../../data/videoCourseware/model';
import { advanceSceneProduction } from '../../data/videoCourseware/production';
import { buildSceneCandidate, rebaseSceneDraft, revisionProject, sceneSnapshot, seedHistoricalScene } from '../../data/videoCourseware/sceneRevision';
import { videoPlanIssues } from '../../data/videoCourseware/planning';
import { useVideoCoursewareStore } from '../../store/videoCoursewareStore';
import { useConversationStore } from '../../store/conversationStore';
import { finishVideoProject } from './workflow';
import { sceneVersionsFor } from '../../data/videoCourseware/sceneVersions';

const projectFor=(id:string)=>useVideoCoursewareStore.getState().projects[id];
function retainSceneVersion(projectId:string,sceneId:string){
 const p=projectFor(projectId),r=sceneRevisionForScene(p,sceneId);
 if(!r?.candidate||r.status!=='candidate')return;
 const history={...p.sceneVersionHistory};
 for(const id of r.affectedSceneIds||[sceneId]){
  if(history[id]?.some(entry=>entry.id===r.id))continue;
  const version=Math.max(1,...sceneVersionsFor(p,id).map(entry=>entry.version))+1;
  history[id]=[...history[id]||[],{id:r.id,version,snapshot:structuredClone(r.candidate),composition:structuredClone(r.candidateComposition||r.composition),time:new Date().toISOString()}];
 }
 useVideoCoursewareStore.getState().update(projectId,{sceneVersionHistory:history});
}
export function sceneRevisionForScene(project:VideoProject,sceneId:string){
 const direct=project.sceneRevisions?.[sceneId];
 if(direct)return direct;
 return Object.values(project.sceneRevisions||{}).find(revision=>revision.affectedSceneIds?.includes(sceneId));
}
export function setSceneRevision(projectId:string,sceneId:string,patch:Partial<SceneRevision>){
 const p=projectFor(projectId),key=p.sceneRevisions?.[sceneId]?sceneId:Object.entries(p.sceneRevisions||{}).find(([,revision])=>revision.affectedSceneIds?.includes(sceneId))?.[0],existing=key?p.sceneRevisions?.[key]:undefined;if(!existing||!key)return;
 useVideoCoursewareStore.getState().update(projectId,{sceneRevisions:{...p.sceneRevisions,[key]:{...existing,...patch}},...(existing.autoAdopt&&(patch.status==='failed'||patch.status==='stale')?{workflowEvents:p.workflowEvents?.map(e=>e.runId===existing.id?{...e,status:'failed' as const,error:patch.error||'更新未完成，请重新编辑资源。'}:e)}:{})});
}
export function beginSceneRevision(projectId:string,sceneId:string,version:number){
 const p=projectFor(projectId);if(p.phase!=='ready')return;
 const existing=sceneRevisionForScene(p,sceneId);if(existing)return existing;
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
 const generationId=r.status==='failed'?r.id:crypto.randomUUID();
 const result=buildSceneCandidate(revisionProject(p,r.base,r.baseComposition),revisionProject(p,r.draft,r.composition),sceneId,r.scope,generationId);
 const issues=videoPlanIssues(result.project);
 if(issues.length){setSceneRevision(projectId,sceneId,{status:'failed',error:[...new Set(issues)].join(' ')});return false;}
 const retry=r.status==='failed'&&r.candidate;
 if(retry){result.project.readyAssetIds=[...new Set([...result.project.readyAssetIds,...r.candidate!.readyAssetIds])];result.project.readyPageIds=r.candidate!.readyPageIds;result.project.readySceneIds=r.candidate!.readySceneIds;}
 setSceneRevision(projectId,sceneId,{id:generationId,status:result.metadataOnly?'candidate':'generating',candidate:sceneSnapshot(result.project),candidateComposition:result.project.composition,affectedSceneIds:result.affectedSceneIds,videoIds:result.videoIds,metadataOnly:result.metadataOnly,startedAt:retry?now-(r.elapsed||0):now,elapsed:retry?r.elapsed:0,sceneAssemblyStarts:retry?r.sceneAssemblyStarts:{},error:undefined});if(result.metadataOnly)retainSceneVersion(projectId,sceneId);return true;
}

/** Start a chat-originated scene edit without reopening the full-course outline confirmation. */
export function startDirectSceneEdit(projectId:string,sceneId:string,instruction:string,referenceNames:string[]=[]){
 return startDirectSceneEdits(projectId,[{sceneId,instruction,referenceNames}]);
}
export function startDirectSceneEdits(projectId:string,edits:Array<{sceneId:string;instruction:string;referenceNames?:string[]}>){
 const p=projectFor(projectId),items=edits.filter(item=>p.segments.some(scene=>scene.id===item.sceneId)),ids=[...new Set(items.map(item=>item.sceneId))];
 if(p.phase!=='ready'||!ids.length)return false;
 const conflicts=Object.entries(p.sceneRevisions||{}).filter(([key,revision])=>ids.some(id=>key===id||revision.affectedSceneIds?.includes(id)));
 if(conflicts.some(([,revision])=>revision.status==='generating'))return false;
 const token=crypto.randomUUID(),draft=structuredClone(p);
 draft.segments=draft.segments.map(scene=>{
  const item=items.find(value=>value.sceneId===scene.id);if(!item)return scene;
  const reference=item.referenceNames?.length?`\n参考图片：${item.referenceNames.join('、')}`:'';
  return {...scene,content:[scene.content||scene.purpose,`本次修改要求：${item.instruction||'结合参考图片优化本场。'}${reference}`].join('\n\n')};
 });
 const result=buildSceneCandidate(p,draft,ids[0],ids.length===1?'scene':'shared',token);
 // Chat edits change only the selected scene instructions, not shared resources.
 // A shared background dependency must not mark all of its consumers as edited.
 result.affectedSceneIds=ids;
 result.project.readySceneIds=p.readySceneIds?.filter(id=>!ids.includes(id));
 result.project.readyPageIds=p.readyPageIds?.filter(id=>!ids.includes(id));
 if(result.metadataOnly){result.project.readySceneIds=p.readySceneIds;result.project.readyPageIds=p.readyPageIds;}
 const issues=videoPlanIssues(result.project);
 if(issues.length)return false;
 const revision:SceneRevision={id:token,sceneId:ids[0],baseVersion:p.revision,sourceVersion:p.revision,scope:'shared',base:sceneSnapshot(p),baseComposition:structuredClone(p.composition),draft:sceneSnapshot(draft),composition:structuredClone(draft.composition),status:result.metadataOnly?'candidate':'generating',candidate:sceneSnapshot(result.project),candidateComposition:result.project.composition,affectedSceneIds:result.affectedSceneIds,videoIds:result.videoIds,metadataOnly:result.metadataOnly,startedAt:Date.now(),elapsed:0,sceneAssemblyStarts:{}};
 // Chat submission already requests a new complete lesson. Only the dedicated
 // scene editor holds a candidate for manual comparison before adoption.
 revision.autoAdopt=true;
 const retained=Object.fromEntries(Object.entries(p.sceneRevisions||{}).filter(([key])=>!conflicts.some(([conflictKey])=>conflictKey===key)));
 useVideoCoursewareStore.getState().update(projectId,{sceneRevisions:{...retained,[ids[0]]:revision}});
 if(revision.status==='candidate')adoptSceneRevision(projectId,ids[0]);
 return true;
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
  if(ready)retainSceneVersion(projectId,sceneId);
  if(ready&&r.autoAdopt)adoptSceneRevision(projectId,sceneId);
 }
}
export function rebaseSceneRevision(projectId:string,sceneId:string){
 const p=projectFor(projectId),r=sceneRevisionForScene(p,sceneId);if(!r)return;
 const draft=rebaseSceneDraft(p,r);setSceneRevision(projectId,sceneId,{baseVersion:p.revision,base:sceneSnapshot(p),baseComposition:structuredClone(p.composition),draft:sceneSnapshot(draft),composition:draft.composition,status:'draft',candidate:undefined,error:undefined});
}
export function discardSceneRevision(projectId:string,sceneId:string){
 const p=projectFor(projectId),key=p.sceneRevisions?.[sceneId]?sceneId:Object.entries(p.sceneRevisions||{}).find(([,revision])=>revision.affectedSceneIds?.includes(sceneId))?.[0];if(!key)return;const revisions={...p.sceneRevisions};delete revisions[key];useVideoCoursewareStore.getState().update(projectId,{sceneRevisions:revisions});
}
export function adoptSceneRevision(projectId:string,sceneId:string){
 retainSceneVersion(projectId,sceneId);
 const p=projectFor(projectId),key=p.sceneRevisions?.[sceneId]?sceneId:Object.entries(p.sceneRevisions||{}).find(([,revision])=>revision.affectedSceneIds?.includes(sceneId))?.[0],r=key?p.sceneRevisions?.[key]:undefined;if(!r?.candidate||r.status!=='candidate'||p.phase!=='ready')return false;
 if(p.revision!==r.baseVersion){setSceneRevision(projectId,sceneId,{status:'stale',error:'整课已有更新，请合并当前版本后再采用。'});return false;}
 const changedIds=r.affectedSceneIds||[sceneId];
 const candidate={...r.candidate,segments:r.candidate.segments.map(scene=>changedIds.includes(scene.id)?{...scene,revision:p.sceneVersionHistory?.[scene.id]?.find(entry=>entry.id===r.id)?.version||((p.segments.find(previous=>previous.id===scene.id)?.revision||1)+1)}:scene)};
 const remaining={...p.sceneRevisions};delete remaining[key!];
 for(const id of Object.keys(remaining))remaining[id]={...remaining[id],status:'stale',error:'整课已采用其他修改，请合并到当前版本后继续。'};
 useVideoCoursewareStore.getState().update(projectId,{...candidate,composition:r.candidateComposition||r.composition,sceneRevisions:remaining,workflowEvents:p.workflowEvents?.map(e=>r.autoAdopt&&e.runId===r.id?{...e,status:'completed' as const}:e.stage==='resource-update'&&e.status==='generating'&&remaining['resource-update']?.status==='stale'?{...e,status:'failed' as const,error:'整课已有更新，请重新编辑资源后生成。'}:e)});
 const changedLabel=changedIds.map(id=>{const index=p.segments.findIndex(scene=>scene.id===id);return index>=0?`第${index+1}场景`:''}).filter(Boolean).join('、');
 finishVideoProject(projectId,undefined,r.autoAdopt?undefined:`更新${changedLabel||'指定场景'}并更新整课。`);return true;
}

export function startResourceUpdate(projectId:string,draft:VideoProject,affectedSceneIds:string[]):string|undefined {
 const p=projectFor(projectId),ids=[...new Set(affectedSceneIds)].filter(id=>p.segments.some(s=>s.id===id));
 if(p.phase!=='ready'||!ids.length)return '当前课件尚未完成，请完成生成后再更新资源。';
 if(p.sceneRevisions?.['resource-update']?.status==='generating')return '素材正在更新，请完成后再修改。';
 const token=crypto.randomUUID(),result=buildSceneCandidate(p,draft,ids[0],'shared',token);
 const candidate=result.project;
 // Membership changes caused by a fork must not rerun the untouched scenes.
 const videoIds=result.videoIds.filter(id=>candidate.assets.some(a=>a.id===id&&a.segmentIds.some(scene=>ids.includes(scene))));
 candidate.readyAssetIds=[...new Set([...candidate.readyAssetIds,...p.readyAssetIds.filter(id=>!videoIds.includes(id))])];
 candidate.readySceneIds=p.readySceneIds?.filter(id=>!ids.includes(id));
 candidate.readyPageIds=p.readyPageIds?.filter(id=>!ids.includes(id));
 const issues=videoPlanIssues(candidate);if(issues.length)return [...new Set(issues)].join(' ');
 const revision:SceneRevision={id:token,sceneId:ids[0],baseVersion:p.revision,sourceVersion:p.revision,scope:'shared',autoAdopt:true,status:'generating',base:sceneSnapshot(p),baseComposition:structuredClone(p.composition),draft:sceneSnapshot(draft),composition:draft.composition,candidate:sceneSnapshot(candidate),candidateComposition:candidate.composition,affectedSceneIds:ids,videoIds,startedAt:Date.now(),elapsed:0,sceneAssemblyStarts:{}};
 const kinds=[...new Set(draft.assets.filter(a=>JSON.stringify(a)!==JSON.stringify(p.assets.find(old=>old.id===a.id))).map(a=>a.kind))];
 const label=kinds.length===1?({image:'图片',audio:'配音',video:'视频'} as const)[kinds[0]]:'素材';
 const event={runId:token,stage:'resource-update' as const,time:new Date().toISOString(),order:(p.workflowEvents?.length||0)+p.resultMessages.length,confirmation:'更新'+label,sceneCount:ids.length,status:'generating' as const};
 useVideoCoursewareStore.getState().update(projectId,{sceneRevisions:{...p.sceneRevisions,'resource-update':revision},workflowEvents:[...p.workflowEvents||[],event]});
 const conversation=useConversationStore.getState();
 conversation.addUserMessage(p.conversationId,event.confirmation);
 conversation.addAssistantMessage(p.conversationId,{videoProjectId:projectId,stage:'resource-update',runId:token},'video-courseware-workflow');
}
