import { sceneChanged } from '../../data/videoCourseware/outline';
import type { PlaybackSettings, VideoProject } from '../../data/videoCourseware/model';
import { getRuntime, wukongFixture, legacyWukongFixture } from '../../data/videoCourseware/fixtures';

// Persisted examples keep their adopted opening; new fixtures use V33.
const openingVersion=(project:VideoProject)=>{
  const video=project.assets.find(a=>a.id==='video-opening');
  return video?.url==='/wukong/assets/video/v33/opening.mp4'||video?.poster==='/wukong/assets/video/v33/opening-poster.jpg'?'v33':'v27';
};

// Adapter for the accepted, standalone lesson. Platform settings stay independent of its HTML internals.
export function runtimeSettings(project:VideoProject, settings:PlaybackSettings) {
  if (project.fixtureId !== 'wukong') return settings;
  const baseline=project.segments.some(s=>s.sourceContent)?wukongFixture:legacyWukongFixture;
  return {
    subtitles: settings.subtitles,
    soundEffects: settings.soundEffects,
    badgeOffset: settings.overlays.badge?.offsetY || 0,
    badgeScale: settings.overlays.badge?.scale || 1,
    videoVersion: 'v32',
    openingVersion: openingVersion(project),
    sceneChapters:project.workflowVersion===5?project.chapters?.map(c=>({title:c.title,segmentIds:c.segmentIds})):undefined,
    scenePlans:project.workflowVersion===5?project.segments.map(s=>({id:s.id,title:s.title,kind:s.kind,content:s.content,changed:sceneChanged(project,s)})):undefined,
    sceneOrder: (project.workflowVersion||0)>=4 ? project.segments.map(s=>s.id) : undefined,
    audioPlans: (project.workflowVersion||0)>=4 ? project.shots?.flatMap(shot=>{
      const source=project.assets.find(a=>a.id===shot.videoAssetId);
      const video=baseline.assets.find(a=>a.id===(source?.originAssetId||shot.videoAssetId));
      const original=video?.role==='环境视频'?[]:baseline.assets.filter(a=>a.kind==='audio'&&a.audioUse!=='interaction'&&a.segmentIds.includes(shot.segmentId));
      const cues=shot.audioCues||[];
      const changed=cues.length!==original.length||cues.some((c,i)=>c.assetId!==original[i]?.id||c.start!==video?.videoInputs?.audioStarts?.[i]||c.trimStart!==0||c.trimEnd!==original[i]?.seconds||project.assets.find(a=>a.id===c.assetId)?.url!==original[i]?.url);
      return changed?[{scene:shot.segmentId,cues:cues.map(c=>({...c,url:project.assets.find(a=>a.id===c.assetId)?.url,text:project.assets.find(a=>a.id===c.assetId)?.text}))}]:[];
    }) : undefined,
    // A forked shared asset resolves only inside the scene that adopted it.
    sceneAssetOverrides: Object.fromEntries(project.segments.map(scene=>[scene.id,Object.fromEntries(project.assets.filter(a=>a.originAssetId&&a.segmentIds.includes(scene.id)).flatMap(a=>{
      const source=a.originAssetId==='video-opening'?`/wukong/assets/video/${openingVersion(project)}/opening.mp4`:baseline.assets.find(v=>v.id===a.originAssetId)?.url;
      const url=settings.assetOverrides[a.id]||a.url;
      return source&&url?[[source.replace(/^\/wukong\//,''),url]]:[];
    }))])),
    assetOverrides: Object.fromEntries(Object.entries(settings.assetOverrides).flatMap(([id,url]) => {
      const source=id==='video-opening'?`/wukong/assets/video/${openingVersion(project)}/opening.mp4`:baseline.assets.find(a=>a.id===id)?.url;
      return source ? [[source.replace(/^\/wukong\//,''),url]] : [];
    })),
  };
}
export function runtimeURL(project:VideoProject, settings:PlaybackSettings, scene=project.segments[0]?.id||'cover', inspect=false) {
  const entry=getRuntime(project.fixtureId);
  if(!entry)return undefined;
  const runtimeEntry=(project.workflowVersion||0)>=4?entry.replace('index.html',project.workflowVersion===5?'lesson-v5.html':'lesson-v4.html'):entry;
  const deployedEntry=/^(localhost|127\.0\.0\.1)$/.test(location.hostname)?runtimeEntry:runtimeEntry.replace(/\.html$/,'');
  const legacy=runtimeSettings(project,settings) as {badgeOffset?:number;badgeScale?:number};
  const params=new URLSearchParams({studio:'1',scene,subtitles:settings.subtitles?'1':'0',soundEffects:settings.soundEffects?'1':'0',badgeOffset:String(legacy.badgeOffset||0),badgeScale:String(legacy.badgeScale||1),videoVersion:'v32'});
  if(inspect)params.set('inspect','1');
  if(project.segments.some(s=>s.sourceContent))params.set('resourcePack','v33-20260915');
  if(project.workflowVersion===5)params.set('openingVersion',openingVersion(project));
  if((project.workflowVersion||0)>=4)params.set('sceneOrder',project.segments.map(s=>s.id).join(','));
  return `${location.origin}${deployedEntry}?${params}`;
}
export function sendRuntimeSettings(target:Window|null|undefined,project:VideoProject,settings:PlaybackSettings) {
  if(project.fixtureId==='wukong')target?.postMessage({type:'wukong-studio-config',composition:runtimeSettings(project,settings)},location.origin);
}
