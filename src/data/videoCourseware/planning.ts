import type { MediaAsset, VideoProject, VideoSegment, VideoShot, AudioCue } from './model';

function key(value: unknown): string {
  let hash = 2166136261;
  for (const c of JSON.stringify(value)) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
  return (hash >>> 0).toString(36);
}
export function materialsKey(project: VideoProject): string {
  return key({assets:project.assets.filter(a=>a.kind!=='video').map(a=>[a.id,a.url,a.text,a.prompt,a.seconds,a.revision]),speakers:project.speakers});
}
export function shotSourceKey(project: VideoProject, video: MediaAsset, selectedShot = project.shots?.find(s=>s.videoAssetId===video.id)): string {
  const input=selectedShot || video.videoInputs;
  const ids=[input?.firstFrameId,input?.lastFrameId,...(input?.references||[]).map(r=>r.assetId),
    ...(selectedShot?.audioCues?.map(c=>c.assetId)||selectedShot?.audioIds||project.assets.filter(a=>a.kind==='audio'&&a.audioUse!=='interaction'&&video.role!=='环境视频'&&a.segmentIds.some(id=>video.segmentIds.includes(id))).map(a=>a.id))];
  const related=project.assets.filter(a=>ids.includes(a.id));
  return key({segments:project.segments.filter(s=>video.segmentIds.includes(s.id)),
    assets:related.map(a=>[a.id,a.url,a.prompt,a.text,a.seconds,a.revision]),
    voices:project.speakers.filter(s=>related.some(a=>a.speakerId===s.id)),style:project.framework.designStyle});
}
export function videoPlanKey(project:VideoProject):string {
  return key({shots:project.shots,sources:project.assets.filter(a=>a.kind==='video').map(a=>[a.id,shotSourceKey(project,a)])});
}
export function shotPrompt(project:VideoProject,shot:VideoShot):string {
  const segment=project.segments.find(s=>s.id===shot.segmentId);
  return project.assets.find(a=>a.id===shot.videoAssetId)?.sourcePrompt || segment?.visual || shot.action;
}
export function cueDuration(cue:AudioCue):number { return cue.trimEnd-cue.trimStart; }
// Preserve accepted timing. When a clip changes, move following clips only as
// needed and extend the shot; teachers describe the picture instead of editing timecodes.
export function arrangeAudioCues(shot:VideoShot,cues:AudioCue[]):Partial<VideoShot> {
  let end=0;
  const audioCues=cues.map(c=>{
    const start=Math.max(Number.isFinite(c.start)?c.start:0,end);
    const next={...c,start,mode:'playback' as const};
    end=start+cueDuration(next)+.2;
    return next;
  });
  return {audioCues,audioIds:audioCues.map(c=>c.assetId),seconds:Math.max(shot.seconds,Math.ceil(end*10)/10)};
}
export function buildVideoShots(project:VideoProject):VideoShot[] {
  return project.assets.filter(a=>a.kind==='video').sort((a,b)=>project.segments.findIndex(s=>s.id===a.segmentIds[0])-project.segments.findIndex(s=>s.id===b.segmentIds[0])).map(video=>{
    const prior=project.shots?.find(s=>s.videoAssetId===video.id);
    if(prior?.audioCues&&prior.sourceKey===shotSourceKey(project,video))return prior;
    const segment=project.segments.find(s=>video.segmentIds.includes(s.id))!;
    const audio=video.role==='环境视频'?[]:project.assets.filter(a=>a.kind==='audio'&&a.audioUse!=='interaction'&&a.segmentIds.includes(segment.id));
    let nextStart=.2;
    const audioCues:AudioCue[]=prior?.audioCues
      ? prior.audioCues.filter(c=>project.assets.some(a=>a.id===c.assetId)).map(c=>({...c}))
      : audio.map((a,i)=>{
        const start=video.videoInputs?.audioStarts?.[i]??nextStart;
        nextStart=start+(a.seconds||0)+.3;
        return {id:video.id+'-cue-'+i,assetId:a.id,start,trimStart:0,trimEnd:a.seconds||0,mode:'playback',description:video.videoInputs?.audioDescriptions?.[i]||segment.purpose};
      });
    const shot:VideoShot={id:video.id,videoAssetId:video.id,segmentId:segment.id,
      firstFrameId:prior?prior.firstFrameId:video.videoInputs?.firstFrameId,
      lastFrameId:prior?prior.lastFrameId:video.videoInputs?.lastFrameId,
      references:prior?.references||video.videoInputs?.references||[],
      audioCues,audioIds:audioCues.map(c=>c.assetId),
      seconds:Math.max(prior?.seconds||video.seconds||segment.seconds,...audioCues.map(c=>Math.ceil((c.start+cueDuration(c)+.2)*10)/10)),
      action:segment.visual,ending:segment.transition,prompt:prior?.prompt||'',sourceKey:''};
    if(!shot.prompt)shot.prompt=shotPrompt(project,shot);
    shot.sourceKey=shotSourceKey(project,video,shot);
    return shot;
  });
}
export function shotIssues(project:VideoProject,shot:VideoShot):string[] {
  const issues:string[]=[];
  const video=project.assets.find(a=>a.id===shot.videoAssetId);
  if(!video||shot.sourceKey!==shotSourceKey(project,video,shot))issues.push('素材或教学方案有变化，请更新本段方案。');
  const imageIds=[shot.firstFrameId,shot.lastFrameId,...(shot.references||[]).map(r=>r.assetId)].filter(Boolean);
  for(const id of imageIds){const a=project.assets.find(a=>a.id===id&&a.kind==='image');if(!a?.url||!project.readyAssetIds.includes(a.id))issues.push('所选参考图片还未准备好。');}
  if(!Number.isFinite(shot.seconds)||shot.seconds<1||shot.seconds>60)issues.push('请填写 1—60 秒的视频时长。');
  const cues=shot.audioCues||[];
  for(const c of cues){
    const a=project.assets.find(a=>a.id===c.assetId&&a.kind==='audio');
    if(!a?.url||!a.seconds||!project.readyAssetIds.includes(a.id)){issues.push('请先完成所选配音。');continue;}
    if(![c.start,c.trimStart,c.trimEnd].every(Number.isFinite)||c.start<0||c.trimStart<0||c.trimEnd> a.seconds+.02||cueDuration(c)<=0)issues.push('配音截取范围或开始时间不正确。');
    if(c.start+cueDuration(c)>shot.seconds+.02)issues.push('当前视频时长不足以播完配音，请延长视频或减少配音。');
  }
  const spoken=cues.filter(c=>c.mode==='playback').sort((a,b)=>a.start-b.start);
  if(spoken.some((c,i)=>i>0&&c.start<spoken[i-1].start+cueDuration(spoken[i-1])-.02))issues.push('两段配音时间重叠，请调整播放位置。');
  if(!shot.prompt.trim())issues.push('请填写视频生成描述。');
  if((shot.references||[]).some(r=>!r.purpose.trim()||!r.range.trim()))issues.push('请说明参考图片的用途和使用范围。');
  return [...new Set(issues)];
}
export function videoPlanIssues(project:VideoProject):string[] {
  if(!project.shots?.length)return ['请先生成视频方案。'];
  const issues=project.assets.filter(a=>a.kind==='video'&&!project.shots?.some(s=>s.videoAssetId===a.id)).map(a=>'缺少视频方案：'+a.name);
  return [...issues,...project.shots.flatMap(s=>shotIssues(project,s))];
}
export function changedVideoIds(project:VideoProject):string[] {
  return project.assets.filter(a=>a.kind==='video'&&project.shots?.find(s=>s.videoAssetId===a.id)?.sourceKey!==shotSourceKey(project,a)).map(a=>a.id);
}
export function reorderSegments(project:VideoProject,from:string,to:string):Partial<VideoProject> {
  const segments=[...project.segments],a=segments.findIndex(s=>s.id===from),b=segments.findIndex(s=>s.id===to);
  if(a<0||b<0||a===b)return {};
  segments.splice(b,0,segments.splice(a,1)[0]);
  return {segments,approvedPlanKey:undefined,pendingEdit:'调整场景顺序'};
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
