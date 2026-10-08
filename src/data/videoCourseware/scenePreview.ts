import { sceneChanged } from './outline';
import type { VideoProject } from './model';
import { wukongFixture,legacyWukongFixture } from './fixtures';
import pack from './wukongPackage.json';

// Captures of the completed lesson, never raw props or generation references.
// A changed or unsupported scene uses its type icon until a new render is captured.
export function scenePreviewURL(project:VideoProject,sceneId:string):string|undefined {
  if(project.fixtureId!=='wukong')return;
  const isPackage=project.segments.some(s=>s.sourceContent),fixture=isPackage?wukongFixture:legacyWukongFixture;
 const scene=project.segments.find(s=>s.id===sceneId),baseline=fixture.segments.find(s=>s.id===sceneId);
  if(scene&&project.workflowVersion===5&&sceneChanged(project,scene))return;
  if(!scene||!baseline||scene.kind!==baseline.kind||scene.purpose!==baseline.purpose||scene.visual!==baseline.visual)return;
  if(project.framework.designStyle!==fixture.framework.designStyle||!project.composition.subtitles)return;
  if(Object.keys(project.composition.overlays).length)return;
  if(project.assets.some(a=>a.kind!=='audio'&&a.segmentIds.includes(sceneId)&&project.composition.assetOverrides[a.id]))return;
  const visual=project.assets.filter(a=>a.kind!=='audio'&&a.segmentIds.includes(sceneId));
  if(visual.some(a=>{const original=fixture.assets.find(v=>v.id===a.id);return !original||a.url!==original.url||a.revision!==original.revision;}))return;
  if(isPackage)return pack.previews[sceneId as keyof typeof pack.previews];
  return '/wukong/scene-previews/'+(sceneId==='opening'?'opening-v33':sceneId)+'.jpg';
}

// When no current scene capture exists, show a relevant visual resource instead
// of replacing every thumbnail with a generic type icon.
export function sceneResourcePreviewURL(project:VideoProject,sceneId:string):string|undefined{
 const assets=project.assets.filter(a=>a.segmentIds.includes(sceneId));
 const shot=project.shots?.find(s=>s.segmentId===sceneId);
 const firstFrame=assets.find(a=>a.id===shot?.firstFrameId);
 const image=firstFrame||assets.find(a=>a.kind==='image'&&/封面|场景画面|起始画面/.test(a.role||a.name))||assets.find(a=>a.kind==='image'&&/背景/.test(a.role||a.name))||assets.find(a=>a.kind==='image');
 if(image)return project.composition.assetOverrides[image.id]||image.url;
 return assets.find(a=>a.kind==='video'&&a.poster)?.poster;
}
