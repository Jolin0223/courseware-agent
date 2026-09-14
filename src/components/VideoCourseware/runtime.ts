import type { PlaybackSettings, VideoProject } from '../../data/videoCourseware/model';
import { getRuntime, wukongFixture } from '../../data/videoCourseware/fixtures';

// Adapter for the accepted, standalone lesson. Platform settings stay independent of its HTML internals.
export function runtimeSettings(project:VideoProject, settings:PlaybackSettings) {
  if (project.fixtureId !== 'wukong') return settings;
  return {
    subtitles: settings.subtitles,
    soundEffects: settings.soundEffects,
    badgeOffset: settings.overlays.badge?.offsetY || 0,
    badgeScale: settings.overlays.badge?.scale || 1,
    videoVersion: 'v32',
    sceneOrder: project.workflowVersion===4 ? project.segments.map(s=>s.id) : undefined,
    audioPlans: project.workflowVersion===4 ? project.shots?.flatMap(shot=>{
      const video=wukongFixture.assets.find(a=>a.id===shot.videoAssetId);
      const original=video?.role==='环境视频'?[]:wukongFixture.assets.filter(a=>a.kind==='audio'&&a.audioUse!=='interaction'&&a.segmentIds.includes(shot.segmentId));
      const cues=shot.audioCues||[];
      const changed=cues.length!==original.length||cues.some((c,i)=>c.assetId!==original[i]?.id||c.start!==video?.videoInputs?.audioStarts?.[i]||c.trimStart!==0||c.trimEnd!==original[i]?.seconds||project.assets.find(a=>a.id===c.assetId)?.url!==original[i]?.url);
      return changed?[{scene:shot.segmentId,cues:cues.map(c=>({...c,url:project.assets.find(a=>a.id===c.assetId)?.url,text:project.assets.find(a=>a.id===c.assetId)?.text}))}]:[];
    }) : undefined,
    assetOverrides: Object.fromEntries(Object.entries(settings.assetOverrides).flatMap(([id,url]) => {
      const source=wukongFixture.assets.find(a=>a.id===id)?.url;
      return source ? [[source.replace(/^\/wukong\//,''),url]] : [];
    })),
  };
}
export function runtimeURL(project:VideoProject, settings:PlaybackSettings, scene=project.segments[0]?.id||'cover', inspect=false) {
  const entry=getRuntime(project.fixtureId);
  if(!entry)return undefined;
  const legacy=runtimeSettings(project,settings) as {badgeOffset?:number;badgeScale?:number};
  const params=new URLSearchParams({studio:'1',scene,subtitles:settings.subtitles?'1':'0',soundEffects:settings.soundEffects?'1':'0',badgeOffset:String(legacy.badgeOffset||0),badgeScale:String(legacy.badgeScale||1),videoVersion:'v32'});
  if(inspect)params.set('inspect','1');
  if(project.workflowVersion===4)params.set('sceneOrder',project.segments.map(s=>s.id).join(','));
  return `${location.origin}${project.workflowVersion===4?entry.replace('index.html','lesson-v4.html'):entry}?${params}`;
}
export function sendRuntimeSettings(target:Window|null|undefined,project:VideoProject,settings:PlaybackSettings) {
  if(project.fixtureId==='wukong')target?.postMessage({type:'wukong-studio-config',composition:runtimeSettings(project,settings)},location.origin);
}
