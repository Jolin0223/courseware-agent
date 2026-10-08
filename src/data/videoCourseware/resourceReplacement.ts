import type { MediaAsset, VideoProject } from './model';

/** Fork a shared resource only for the chosen scene; keep all other references intact. */
export function replaceSceneResource(project: VideoProject, replacement: MediaAsset, sceneId?: string): VideoProject {
  const next = structuredClone(project);
  const original = next.assets.find(asset => asset.id === replacement.id);
  if (!original) return next;
  const fork = sceneId && original.segmentIds.includes(sceneId) && original.segmentIds.length > 1;
  const id = fork ? `${original.id}--${crypto.randomUUID()}` : original.id;
  const asset = { ...replacement, id, segmentIds: fork ? [sceneId] : original.segmentIds,
    originAssetId: fork ? original.originAssetId || original.id : original.originAssetId };
  next.assets = next.assets.map(item => item.id !== original.id ? item : fork
    ? { ...item, segmentIds: item.segmentIds.filter(value => value !== sceneId) } : asset);
  if (fork) next.assets.push(asset);
  if (asset.url) next.composition.assetOverrides[id] = asset.url;
  next.readyAssetIds = [...new Set([...next.readyAssetIds, id])];
  if (fork) next.shots = next.shots?.map(shot => shot.segmentId !== sceneId ? shot : {
    ...shot,
    videoAssetId: shot.videoAssetId === original.id ? id : shot.videoAssetId,
    firstFrameId: shot.firstFrameId === original.id ? id : shot.firstFrameId,
    lastFrameId: shot.lastFrameId === original.id ? id : shot.lastFrameId,
    references: shot.references?.map(ref => ref.assetId === original.id ? { ...ref, assetId: id } : ref),
    audioIds: shot.audioIds.map(value => value === original.id ? id : value),
    audioCues: shot.audioCues?.map(cue => cue.assetId === original.id ? { ...cue, assetId: id } : cue),
  });
  return next;
}
