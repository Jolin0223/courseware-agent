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
    assetOverrides: Object.fromEntries(Object.entries(settings.assetOverrides).flatMap(([id,url]) => {
      const source=wukongFixture.assets.find(a=>a.id===id)?.url;
      return source ? [[source.replace(/^\/wukong\//,''),url]] : [];
    })),
  };
}
export function runtimeURL(project:VideoProject, settings:PlaybackSettings, scene='cover', inspect=false) {
  const entry=getRuntime(project.fixtureId);
  if(!entry)return undefined;
  const legacy=runtimeSettings(project,settings) as {badgeOffset?:number;badgeScale?:number};
  const params=new URLSearchParams({studio:'1',scene,subtitles:settings.subtitles?'1':'0',soundEffects:settings.soundEffects?'1':'0',badgeOffset:String(legacy.badgeOffset||0),badgeScale:String(legacy.badgeScale||1),videoVersion:'v32'});
  if(inspect)params.set('inspect','1');
  return `${location.origin}${entry}?${params}`;
}
export function sendRuntimeSettings(target:Window|null|undefined,project:VideoProject,settings:PlaybackSettings) {
  if(project.fixtureId==='wukong')target?.postMessage({type:'wukong-studio-config',composition:runtimeSettings(project,settings)},location.origin);
}
