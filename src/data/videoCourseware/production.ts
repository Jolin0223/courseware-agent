import type { VideoProject, VideoSegment } from './model';

export function sceneVideos(project:VideoProject,scene:VideoSegment){
  return project.assets.filter(a=>a.kind==='video'&&a.segmentIds.includes(scene.id));
}

// Local demo timings represent independent jobs, not production latency promises.
// A mixed scene can be previewed only after its page AND all referenced videos finish.
export function advanceSceneProduction(project:VideoProject,elapsed:number):Partial<VideoProject>{
  const videos=project.assets.filter(a=>a.kind==='video');
  const pages=project.segments.filter(s=>s.kind!=='video');
  const readyAssets=new Set(project.readyAssetIds);
  const readyPages=new Set(project.readyPageIds||[]);
  videos.forEach((a,i)=>{if(a.url&&elapsed>=(i+1)/videos.length*10000)readyAssets.add(a.id);});
  pages.forEach((s,i)=>{if(elapsed>=(i+1)/pages.length*6000)readyPages.add(s.id);});
  const starts={...project.sceneAssemblyStarts};
  const readyScenes=project.segments.filter(scene=>{
    const dependencies=sceneVideos(project,scene);
    const videoReady=scene.kind==='h5'||(dependencies.length>0&&dependencies.every(a=>Boolean(a.url)&&readyAssets.has(a.id)));
    const pageReady=scene.kind==='video'||readyPages.has(scene.id);
    if(!videoReady||!pageReady){delete starts[scene.id];return false;}
    if(scene.kind!=='mixed')return true;
    if(project.readySceneIds?.includes(scene.id))return true;
    starts[scene.id]??=elapsed;
    return elapsed-starts[scene.id]>=1200;
  }).map(s=>s.id);
  return {readyAssetIds:[...readyAssets],readyPageIds:[...readyPages],readySceneIds:readyScenes,sceneAssemblyStarts:starts};
}

export function sceneProductionLabel(project:VideoProject,scene:VideoSegment){
  if(project.readySceneIds?.includes(scene.id))return '预览这一场';
  if(project.phase==='paused')return '已暂停';
  if(project.phase==='failed')return '等待重试';
  if(scene.kind==='h5')return '制作互动页面';
  if(scene.kind==='video')return '生成视频';
  if(!project.readyPageIds?.includes(scene.id))return '制作互动部分';
  const videos=sceneVideos(project,scene);
  if(!videos.length||videos.some(a=>!a.url||!project.readyAssetIds.includes(a.id)))return '等待本场视频';
  return '合成视频与互动';
}
