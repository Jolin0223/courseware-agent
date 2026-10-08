import type { PlaybackSettings, SceneRevision, VideoProject, WorkflowSnapshot } from './model';
import { prepareSceneEdit } from './sceneEditing';
import { shotSourceKey } from './planning';

const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
function applyDelta<T extends object>(current:T,before:T|undefined,after:T):T {
 const keys=new Set([...Object.keys(before||{}),...Object.keys(after)]) as Set<keyof T>;
 return {...current,...Object.fromEntries([...keys].filter(key=>!same(before?.[key],after[key])).map(key=>[key,after[key]]))};
}
export function sceneSnapshot(p:VideoProject):WorkflowSnapshot {
 return structuredClone({assets:p.assets,segments:p.segments,speakers:p.speakers,shots:p.shots,readyAssetIds:p.readyAssetIds,chapters:p.chapters,readySceneIds:p.readySceneIds,readyPageIds:p.readyPageIds});
}
export function revisionProject(project:VideoProject,snapshot:WorkflowSnapshot,composition:PlaybackSettings):VideoProject {
 return {...project,...structuredClone(snapshot),composition:structuredClone(composition)};
}
// Historical edits copy one scene into today's course, never replace its neighbours.
export function seedHistoricalScene(current:VideoProject,old:VideoProject,sceneId:string):VideoProject {
 const next=structuredClone(current),scene=old.segments.find(s=>s.id===sceneId),today=current.segments.find(s=>s.id===sceneId);
 if(!scene||!today)return next;
 next.segments=next.segments.map(s=>s.id===sceneId?{...scene,chapterId:today.chapterId,chapter:today.chapter}:s);
 next.shots=[...(next.shots||[]).filter(s=>s.segmentId!==sceneId),...(old.shots||[]).filter(s=>s.segmentId===sceneId)];
 const historical=old.assets.filter(a=>a.segmentIds.includes(sceneId));
 next.assets=next.assets.map(a=>{const prior=historical.find(v=>v.id===a.id);return prior?{...prior,segmentIds:[...new Set([...a.segmentIds,sceneId])]}:a.segmentIds.includes(sceneId)?{...a,segmentIds:a.segmentIds.filter(id=>id!==sceneId)}:a;});
 next.assets.push(...historical.filter(a=>!next.assets.some(v=>v.id===a.id)));
 const speakerIds=historical.map(a=>a.speakerId);next.speakers=next.speakers.map(s=>speakerIds.includes(s.id)?old.speakers.find(v=>v.id===s.id)||s:s);
 next.composition.assetOverrides={...next.composition.assetOverrides,...Object.fromEntries(historical.flatMap(a=>old.composition.assetOverrides[a.id]?[[a.id,old.composition.assetOverrides[a.id]]]:[]))};
 return next;
}
export function buildSceneCandidate(base:VideoProject,raw:VideoProject,sceneId:string,scope:'scene'|'shared',token:string){
 let draft=structuredClone(raw);
 const changedMedia=draft.assets.filter(a=>!same({...a,segmentIds:[]},{...base.assets.find(v=>v.id===a.id),segmentIds:[]}));
 const sharedIds=new Set(changedMedia.flatMap(a=>a.segmentIds.filter(id=>id!==sceneId)));
 const voiceIds=draft.speakers.filter(s=>!same(s,base.speakers.find(v=>v.id===s.id))).map(s=>s.id);
 base.assets.filter(a=>a.speakerId&&voiceIds.includes(a.speakerId)).forEach(a=>a.segmentIds.filter(id=>id!==sceneId).forEach(id=>sharedIds.add(id)));
 if(scope==='scene'){
  const speakerMap=new Map(voiceIds.map(id=>[id,id+'--'+token]));
  draft.speakers=[...base.speakers,...draft.speakers.filter(s=>voiceIds.includes(s.id)).map(s=>({...s,id:speakerMap.get(s.id)!}))];
  draft.assets=draft.assets.map(a=>a.segmentIds.includes(sceneId)&&a.speakerId&&speakerMap.has(a.speakerId)?{...a,speakerId:speakerMap.get(a.speakerId)}:a);
  const map=new Map<string,string>();const additions:typeof draft.assets=[];
  draft.assets=draft.assets.map(a=>{
   const prior=base.assets.find(v=>v.id===a.id);
   const changed=prior&&!same({...a,segmentIds:[]},{...prior,segmentIds:[]});
   if(!changed||!a.segmentIds.includes(sceneId)||!prior.segmentIds.some(id=>id!==sceneId))return a;
   const id=a.id+'--'+token;map.set(a.id,id);additions.push({...a,id,originAssetId:a.originAssetId||a.id,segmentIds:[sceneId]});
   const override=draft.composition.assetOverrides[a.id];
   if(override)draft.composition.assetOverrides[id]=override;
   if(base.composition.assetOverrides[a.id])draft.composition.assetOverrides[a.id]=base.composition.assetOverrides[a.id];else delete draft.composition.assetOverrides[a.id];
   return {...prior,segmentIds:prior.segmentIds.filter(id=>id!==sceneId)};
  });
  draft.assets.push(...additions);draft.readyAssetIds.push(...additions.filter(a=>a.url).map(a=>a.id));
  draft.segments=draft.segments.map(s=>s.id===sceneId?{...s,speakerId:speakerMap.get(s.speakerId)||s.speakerId}:s);
  draft.shots=draft.shots?.map(s=>s.segmentId===sceneId?{...s,videoAssetId:map.get(s.videoAssetId)||s.videoAssetId,firstFrameId:map.get(s.firstFrameId||'')||s.firstFrameId,lastFrameId:map.get(s.lastFrameId||'')||s.lastFrameId,references:s.references?.map(r=>({...r,assetId:map.get(r.assetId)||r.assetId})),audioIds:s.audioIds.map(id=>map.get(id)||id),audioCues:s.audioCues?.map(c=>({...c,assetId:map.get(c.assetId)||c.assetId}))}:s);
 }
 // Ignore title-only differences when deciding which expensive media jobs to rerun.
 const comparable={...draft,segments:draft.segments.map(s=>({...s,title:base.segments.find(v=>v.id===s.id)?.title||s.title}))};
 const videoIds=draft.assets.filter(a=>a.kind==='video').filter(a=>{
  const before=base.assets.find(v=>v.id===a.id),shot=draft.shots?.find(s=>s.videoAssetId===a.id),old=base.shots?.find(s=>s.videoAssetId===a.id);
  return !before||!shot||!old||!same({...shot,sourceKey:''},{...old,sourceKey:''})||shotSourceKey(comparable,a,shot)!==shotSourceKey(base,before,old);
 }).map(a=>a.id);
 const changedScenes=new Set<string>();
 draft.segments.forEach(s=>{if(!same(s,base.segments.find(v=>v.id===s.id)))changedScenes.add(s.id);});
 draft.assets.filter(a=>!same(a,base.assets.find(v=>v.id===a.id))).forEach(a=>a.segmentIds.forEach(id=>changedScenes.add(id)));
 videoIds.forEach(id=>draft.assets.find(a=>a.id===id)?.segmentIds.forEach(s=>changedScenes.add(s)));
 if(scope==='scene'){changedScenes.clear();changedScenes.add(sceneId);}else sharedIds.forEach(id=>changedScenes.add(id));
 const metadataOnly=!videoIds.length&&same(draft.assets,base.assets)&&same(draft.speakers,base.speakers)&&same(draft.composition,base.composition)&&draft.segments.every(s=>same({...s,title:''},{...base.segments.find(v=>v.id===s.id),title:''}));
 const patch=prepareSceneEdit(base,draft,sceneId);draft={...draft,...patch};
 const affected=[...changedScenes];
 draft.readyAssetIds=draft.readyAssetIds.filter(id=>!videoIds.includes(id));
 draft.readySceneIds=base.readySceneIds?.filter(id=>!affected.includes(id));
 draft.readyPageIds=base.segments.filter(s=>s.kind!=='video'&&!affected.includes(s.id)).map(s=>s.id);
 if(metadataOnly){draft.readySceneIds=draft.segments.map(s=>s.id);draft.readyPageIds=draft.segments.filter(s=>s.kind!=='video').map(s=>s.id);draft.readyAssetIds=[...base.readyAssetIds];}
 return {project:draft,affectedSceneIds:affected,videoIds,metadataOnly,sharedSceneIds:[...sharedIds]};
}
// Replay the saved edit delta onto a newer base; unrelated adopted changes are retained.
export function rebaseSceneDraft(current:VideoProject,revision:SceneRevision):VideoProject {
 const next=structuredClone(current);
 const old=revision.base,edited=revision.draft;
 next.segments=next.segments.map(s=>{const change=edited.segments.find(v=>v.id===s.id),before=old.segments.find(v=>v.id===s.id);if(!change||s.id!==revision.sceneId)return s;return applyDelta(s,before,change);});
 const removedAssets=new Set(old.assets.filter(a=>!edited.assets.some(v=>v.id===a.id)).map(a=>a.id));
 next.assets=next.assets.map(a=>removedAssets.has(a.id)?{...a,segmentIds:a.segmentIds.filter(id=>id!==revision.sceneId)}:a).filter(a=>a.segmentIds.length>0);
 for(const a of edited.assets.filter(a=>!same(a,old.assets.find(v=>v.id===a.id)))){const at=next.assets.findIndex(v=>v.id===a.id);if(at<0)next.assets.push(a);else {
  const before=old.assets.find(v=>v.id===a.id),currentAsset=next.assets[at];
  const removed=before?.segmentIds.filter(id=>!a.segmentIds.includes(id))||[],added=a.segmentIds.filter(id=>!before?.segmentIds.includes(id));
  next.assets[at]={...applyDelta(currentAsset,before,a),segmentIds:[...new Set([...currentAsset.segmentIds.filter(id=>!removed.includes(id)),...added])]};
 }
 }
 // Locally uploaded assets are already ready. Merge only added readiness;
 // never restore old readiness over a newer generation state.
 next.readyAssetIds=[...new Set([...next.readyAssetIds,...edited.readyAssetIds.filter(id=>!old.readyAssetIds.includes(id)&&next.assets.some(a=>a.id===id&&a.url))])];
 next.speakers=next.speakers.map(s=>{const changed=edited.speakers.find(v=>v.id===s.id);return changed?applyDelta(s,old.speakers.find(v=>v.id===s.id),changed):s;});
 // Reconcile additions/removals too, so a scene type change survives rebase.
 const editedShots=edited.shots||[],oldShots=old.shots||[];
 const removed=new Set(oldShots.filter(s=>s.segmentId===revision.sceneId&&!editedShots.some(v=>v.id===s.id)).map(s=>s.id));
 next.shots=(next.shots||[]).filter(s=>!removed.has(s.id)).map(s=>{const changed=editedShots.find(v=>v.id===s.id);return changed?applyDelta(s,oldShots.find(v=>v.id===s.id),changed):s;});
 next.shots.push(...editedShots.filter(s=>!oldShots.some(v=>v.id===s.id)&&!next.shots!.some(v=>v.id===s.id)));
 for(const id of new Set([...Object.keys(revision.baseComposition.assetOverrides),...Object.keys(revision.composition.assetOverrides)])){
  const before=revision.baseComposition.assetOverrides[id],after=revision.composition.assetOverrides[id];
  if(before===after)continue;
  if(after)next.composition.assetOverrides[id]=after;else delete next.composition.assetOverrides[id];
 }
 return next;
}
