import type { VideoProject } from './model';
import { arrangeAudioCues, buildVideoShots, changedVideoIds, materialsKey, shotSourceKey } from './planning';

// The scene modal is a transaction: resource candidates and scene edits commit together.
export function prepareSceneEdit(original:VideoProject,draft:VideoProject,sceneId:string):Partial<VideoProject>{
 const changedAssets=draft.assets.filter(a=>JSON.stringify(a)!==JSON.stringify(original.assets.find(o=>o.id===a.id)));
 const affected=new Set([sceneId,...changedAssets.flatMap(a=>a.segmentIds)]);
 const changedSpeakers=draft.speakers.filter(s=>JSON.stringify(s)!==JSON.stringify(original.speakers.find(v=>v.id===s.id))).map(s=>s.id);
 draft.assets.filter(a=>a.kind==='audio'&&changedSpeakers.includes(a.speakerId||'')).forEach(a=>a.segmentIds.forEach(id=>affected.add(id)));
 const invalid=new Set(changedVideoIds(draft));
 draft.shots?.forEach(s=>{if(JSON.stringify(s)!==JSON.stringify(original.shots?.find(o=>o.id===s.id)))invalid.add(s.videoAssetId);});
 const shots=buildVideoShots(draft).map(shot=>{
  const cues=(shot.audioCues||[]).map(c=>{
   const before=original.assets.find(a=>a.id===c.assetId),after=draft.assets.find(a=>a.id===c.assetId);
   if(!after?.seconds||before?.seconds===after.seconds)return c;
   return {...c,trimStart:Math.min(c.trimStart,Math.max(0,after.seconds-.1)),trimEnd:Math.abs(c.trimEnd-(before?.seconds||0))<.02?after.seconds:Math.min(c.trimEnd,after.seconds)};
  });
  const changed=cues.some((c,i)=>JSON.stringify(c)!==JSON.stringify(shot.audioCues?.[i]));
  const next=changed?{...shot,...arrangeAudioCues(shot,cues)}:shot;
  return {...next,sourceKey:shotSourceKey(draft,draft.assets.find(a=>a.id===shot.videoAssetId)!,next)};
 });
 return {segments:draft.segments,assets:draft.assets,speakers:draft.speakers,composition:draft.composition,shots,
  readyAssetIds:draft.readyAssetIds.filter(id=>!invalid.has(id)),readyPageIds:draft.readyPageIds?.filter(id=>!affected.has(id)),readySceneIds:draft.readySceneIds?.filter(id=>!affected.has(id)),
  approvedMaterialsKey:materialsKey(draft),approvedPlanKey:undefined};
}
