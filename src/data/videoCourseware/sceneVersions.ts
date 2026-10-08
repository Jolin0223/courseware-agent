import type { SceneVersion, VideoProject } from './model';

/** Versions are per scene; repeated whole-course snapshots are shown only once. */
export function sceneVersionsFor(project:VideoProject,sceneId:string):SceneVersion[] {
 const versions=new Map<number,SceneVersion>();
 let priorSignature='',priorVersion=0;
 for(const result of project.resultMessages){
  const scene=result.snapshot?.segments.find(item=>item.id===sceneId);
  if(!scene||!result.snapshot)continue;
  const signature=JSON.stringify({scene:{...scene,revision:undefined},assets:result.snapshot.assets.filter(asset=>asset.segmentIds.includes(sceneId)).map(asset=>({...asset,segmentIds:[sceneId]})),shots:result.snapshot.shots?.filter(shot=>shot.segmentId===sceneId)});
  const version=scene.revision||(signature===priorSignature?priorVersion:priorVersion+1);
  priorSignature=signature;priorVersion=version;
  if(!versions.has(version))versions.set(version,{id:result.id,version,snapshot:result.snapshot,composition:result.composition||project.composition,time:result.time});
 }
 for(const entry of project.sceneVersionHistory?.[sceneId]||[])versions.set(entry.version,entry);
 return [...versions.values()].sort((a,b)=>a.version-b.version);
}
