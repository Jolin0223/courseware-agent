import type { VideoProject } from './model';
import { shotIssues } from './planning';
import { sceneVideos } from './production';

// This scheduler replays local demo assets. A production worker must persist the
// confirmed input snapshot and use job.id + key to reject obsolete callbacks.
export function sceneGenerationKey(p:VideoProject,id:string){
 const assets=p.assets.filter(a=>a.segmentIds.includes(id));
 const inputs={scene:p.segments.find(s=>s.id===id),assets:assets.map(a=>({...a,segmentIds:undefined})),shots:p.shots?.filter(s=>assets.some(a=>a.id===s.videoAssetId)).map(s=>({...s,sourceKey:undefined})),voices:p.speakers.filter(s=>assets.some(a=>a.speakerId===s.id)),style:p.framework.designStyle,composition:{...p.composition,assetOverrides:Object.fromEntries(assets.map(a=>[a.id,p.composition.assetOverrides[a.id]])),overlays:{[id]:p.composition.overlays[id]}}};
 let hash=2166136261;for(const c of JSON.stringify(inputs))hash=Math.imul(hash^c.charCodeAt(0),16777619);return (hash>>>0).toString(36);
}
export function sceneGenerationIssues(p:VideoProject,id:string){
 const scene=p.segments.find(s=>s.id===id);if(!scene)return ['场景不存在。'];
 const issues:string[]=[];
 if(!scene.title.trim()||!scene.content?.trim())issues.push('请填写场景名称与内容。');
 if(p.assets.some(a=>a.kind!=='video'&&a.segmentIds.includes(id)&&(!a.url||!p.readyAssetIds.includes(a.id))))issues.push('本场图片或配音尚未准备好。');
 if(scene.kind!=='h5'){
  const videos=sceneVideos(p,scene);if(!videos.length)issues.push('本场缺少视频方案。');
  for(const video of videos){const shot=p.shots?.find(s=>s.videoAssetId===video.id);issues.push(...(shot?shotIssues(p,shot):['本场缺少视频方案。']));}
 }
 return [...new Set(issues)];
}
export function enqueueScene(p:VideoProject,id:string,now:number):Partial<VideoProject>{
 if(sceneGenerationIssues(p,id).length)return {};
 const key=sceneGenerationKey(p,id),prior=p.sceneJobs?.[id];
 if(prior?.key===key&&['queued','generating','ready'].includes(prior.status))return {};
 return {sceneJobs:{...p.sceneJobs,[id]:{id:crypto.randomUUID(),key,status:'queued',confirmedAt:now}},readySceneIds:(p.readySceneIds||[]).filter(v=>v!==id),readyPageIds:(p.readyPageIds||[]).filter(v=>v!==id)};
}
export function advanceConfirmedScenes(p:VideoProject,now:number):Partial<VideoProject>{
 const jobs=structuredClone(p.sceneJobs||{}),readyScenes=new Set(p.readySceneIds||[]),readyPages=new Set(p.readyPageIds||[]),readyAssets=new Set(p.readyAssetIds);
 for(const scene of p.segments){const job=jobs[scene.id];if(!job)continue;
  if(job.key!==sceneGenerationKey(p,scene.id)){
   job.status='needs-confirmation';job.error='本场方案或引用素材有变化，请重新确认。';readyScenes.delete(scene.id);readyPages.delete(scene.id);
  }
 }
 // Bounded concurrency; reviewing and queued work remain independent.
 let running=Object.values(jobs).filter(j=>j.status==='generating').length;
 for(const scene of p.segments){const job=jobs[scene.id];if(job?.status==='queued'&&running<3){job.status='generating';job.startedAt=now;running++;}}
 for(const scene of p.segments){const job=jobs[scene.id];if(job?.status!=='generating')continue;
  const elapsed=now-(job.startedAt??now),videos=sceneVideos(p,scene);
  if(scene.kind!=='video'&&elapsed>=1800)readyPages.add(scene.id);
  if(scene.kind!=='h5'&&elapsed>=6000){
   if(!videos.length||videos.some(a=>!a.url)){job.status='failed';job.error='本场视频缺失，当前演示未接入在线生成。请补齐视频后重试；其他场景继续制作。';continue;}
   videos.forEach(a=>readyAssets.add(a.id));
  }
  const videoReady=scene.kind==='h5'||elapsed>=6000&&videos.length>0&&videos.every(a=>a.url&&readyAssets.has(a.id));
  const pageReady=scene.kind==='video'||readyPages.has(scene.id);
  if(videoReady&&pageReady&&(scene.kind!=='mixed'||elapsed>=7200)){job.status='ready';job.error=undefined;readyScenes.add(scene.id);}
 }
 return {sceneJobs:jobs,readySceneIds:[...readyScenes],readyPageIds:[...readyPages],readyAssetIds:[...readyAssets]};
}
