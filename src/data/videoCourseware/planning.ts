import type { MediaAsset, VideoProject, VideoSegment, VideoShot } from './model';

// Change keys detect stale dependencies, not security-sensitive identity.
function key(value: unknown): string {
  let hash = 2166136261;
  for (const c of JSON.stringify(value)) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
  return (hash >>> 0).toString(36);
}
export function shotSourceKey(project: VideoProject, video: MediaAsset, selectedShot = project.shots?.find(s => s.videoAssetId === video.id)): string {
  const selectedIds = [selectedShot?.firstFrameId, selectedShot?.lastFrameId, ...(selectedShot?.audioIds || [])];
  const related = project.assets.filter(a => a.kind !== 'video' && (selectedIds.includes(a.id) || (a.videoDependency !== false && !a.overlay && a.audioUse !== 'interaction' && a.segmentIds.some(id => video.segmentIds.includes(id)))));
  return key({
    segments: project.segments.filter(s => video.segmentIds.includes(s.id)),
    imagesAndAudio: related.map(a => [a.id, a.url, a.prompt, a.text, a.seconds, a.revision]),
    voices: project.speakers.filter(s => related.some(a => a.speakerId === s.id)),
    style: project.framework.designStyle,
    teachingGoal: project.framework.userRequirement,
    sourcePrompt: video.sourcePrompt,
  });
}
export function videoPlanKey(project: VideoProject): string {
  return key({shots: project.shots, sources: project.assets.filter(a => a.kind === 'video').map(a => [a.id, shotSourceKey(project, a)])});
}
export function shotPrompt(project: VideoProject, shot: VideoShot): string {
  const segment = project.segments.find(s => s.id === shot.segmentId);
  const image = project.assets.find(a => a.id === shot.firstFrameId);
  const audio = project.assets.filter(a => shot.audioIds.includes(a.id));
  return [
    '画面风格：' + project.framework.designStyle,
    ...(project.assets.find(a => a.id === shot.videoAssetId)?.sourcePrompt ? ['画面细节参考（以本次动作、配音、时长和结束设置为准）：' + project.assets.find(a => a.id === shot.videoAssetId)?.sourcePrompt] : []),
    '起始画面：' + (image?.name || '待准备'),
    '人物与镜头：' + shot.action,
    '视频时长：' + shot.seconds + ' 秒。保持人物形象和场景一致。',
    audio.length ? '配音：' + audio.map(a => (project.speakers.find(s => s.id === a.speakerId)?.name || '旁白') + '：' + a.text).join('；') : '无对白，保持安静。',
    '结束画面：' + shot.ending,
    ...(shot.lastFrameId ? ['结束参考图：' + project.assets.find(a => a.id === shot.lastFrameId)?.name] : []),
    '衔接方式：' + segment?.next,
    segment?.kind === 'mixed' ? '为文字与操作区域留白；互动文字、按钮和可拖动道具独立叠加。' : '字幕独立叠加，保证文字清晰可读。',
  ].join('\n');
}
export function buildVideoShots(project: VideoProject): VideoShot[] {
  return project.assets.filter(a => a.kind === 'video').map(video => {
    const sourceKey = shotSourceKey(project, video);
    const prior = project.shots?.find(s => s.videoAssetId === video.id);
    if (prior?.sourceKey === sourceKey) return prior;
    const segment = project.segments.find(s => video.segmentIds.includes(s.id))!;
    const images = project.assets.filter(a => a.kind === 'image' && a.segmentIds.includes(segment.id));
    const first = images.find(a => a.referenceFor === video.id)
      || images.find(a => a.role === '视频参考图')
      || images.find(a => a.role === '场景画面');
    const audio = video.role === '环境视频' ? [] : project.assets.filter(a => a.kind === 'audio' && a.audioUse !== 'interaction' && a.segmentIds.includes(segment.id));
    const audioSeconds = audio.reduce((n, a) => n + (a.seconds || 0), 0);
    const shot: VideoShot = {
      id: video.id, videoAssetId: video.id, segmentId: segment.id, firstFrameId: first?.id || '',
      audioIds: audio.map(a => a.id), seconds: Math.max(video.role === '环境视频' ? video.seconds || 6 : segment.seconds, Math.ceil((audioSeconds + .6) * 10) / 10),
      action: video.role === '环境视频' ? video.prompt : segment.visual,
      ending: segment.kind === 'mixed' ? '人物说完后安静停留，保留操作区域。' + segment.interaction : '完成当前动作，平稳收束画面。' + segment.next,
      prompt: '', sourceKey,
    };
    shot.sourceKey = shotSourceKey(project, video, shot);
    shot.prompt = shotPrompt(project, shot);
    return shot;
  });
}
export function shotIssues(project: VideoProject, shot: VideoShot): string[] {
  const issues: string[] = [];
  const video = project.assets.find(a => a.id === shot.videoAssetId);
  if (!video || shot.sourceKey !== shotSourceKey(project, video)) issues.push('素材或教学方案有变化，请更新本段方案。');
  for (const id of [shot.firstFrameId, ...(shot.lastFrameId ? [shot.lastFrameId] : [])]) {
    const frame = project.assets.find(a => a.id === id && a.kind === 'image');
    if (!frame?.url || !project.readyAssetIds.includes(id)) issues.push('参考画面还未准备好。');
  }
  const audio = shot.audioIds.map(id => project.assets.find(a => a.id === id && a.kind === 'audio'));
  if (audio.some(a => !a?.url || !a.seconds || !project.readyAssetIds.includes(a.id))) issues.push('请先完成配音，读取实际时长。');
  const audioSeconds = audio.reduce((n, a) => n + (a?.seconds || 0), 0);
  if (!Number.isFinite(shot.seconds) || shot.seconds < 1 || shot.seconds > 60) issues.push('请设置 1–60 秒的视频时长。');
  else if (shot.seconds < audioSeconds + .3) issues.push('视频短于配音，请延长视频或缩短配音。');
  if (!shot.action.trim() || !shot.ending.trim() || !shot.prompt.trim()) issues.push('请补充画面动作、结束方式和生成描述。');
  return [...new Set(issues)];
}
export function videoPlanIssues(project: VideoProject): string[] {
  const videos = project.assets.filter(a => a.kind === 'video');
  if (!project.shots?.length || videos.length !== project.shots.length || videos.some(v => !project.shots?.some(s => s.videoAssetId === v.id))) return ['视频方案尚未准备完成。'];
  return project.shots.flatMap(s => shotIssues(project, s));
}
export function changedVideoIds(project: VideoProject): string[] {
  return project.assets.filter(a => a.kind === 'video' && project.shots?.find(s => s.videoAssetId === a.id)?.sourceKey !== shotSourceKey(project, a)).map(a => a.id);
}
export function synchronizeSegment(project: VideoProject, draft: VideoSegment): Partial<VideoProject> {
  const before = project.segments.find(s => s.id === draft.id)!;
  const dialogueChanged = before.dialogue !== draft.dialogue || before.speakerId !== draft.speakerId;
  const relatedAudio = project.assets.filter(a => a.kind === 'audio' && a.audioUse !== 'interaction' && a.segmentIds.includes(draft.id));
  let assets = project.assets.filter(a => !(a.kind === 'video' && a.segmentIds.includes(draft.id) && draft.kind === 'h5'));
  assets = assets.map(a => {
    if (!a.segmentIds.includes(draft.id)) return a;
    if (a.kind === 'video' && a.role !== '环境视频') return {...a, name: draft.title, prompt: draft.visual, text: draft.dialogue, seconds: draft.seconds};
    if (dialogueChanged && relatedAudio.includes(a)) return {...a, text: a.id === relatedAudio[0]?.id ? draft.dialogue : '', prompt: a.id === relatedAudio[0]?.id ? draft.dialogue : '', speakerId: draft.speakerId, revision: (a.revision || 0) + 1};
    return a;
  }).filter(a => !(dialogueChanged && relatedAudio.some(x => x.id === a.id) && !a.text));
  if (draft.kind !== 'h5' && !assets.some(a => a.kind === 'video' && a.segmentIds.includes(draft.id))) {
    assets.push({id: 'video-' + draft.id, kind: 'video', name: draft.title, segmentIds: [draft.id], prompt: draft.visual, text: draft.dialogue, seconds: draft.seconds});
  }
  if (draft.kind !== 'h5' && draft.dialogue && !relatedAudio.length) assets.push({id: 'audio-' + draft.id, kind: 'audio', name: draft.title + ' · 配音', segmentIds: [draft.id], prompt: draft.dialogue, text: draft.dialogue, speakerId: draft.speakerId, audioUse: 'video'});
  const segments = project.segments.map(s => s.id === draft.id ? draft : s);
  const invalid = changedVideoIds({...project, assets, segments});
  return {assets, segments, approvedPlanKey: undefined, readyAssetIds: project.readyAssetIds.filter(id => !invalid.includes(id) && !(dialogueChanged && relatedAudio.some(a => a.id === id))), pendingEdit: '调整“' + draft.title + '”'};
}
