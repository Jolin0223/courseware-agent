import { compileOutline, makeOutline, outlineIssues, initialSceneContent } from '../../data/videoCourseware/outline';
import { runtimeSettings, runtimeURL } from './runtime';
import { useEffect } from 'react';
import type { Courseware, CoursewareResult, GenerationPreferences, UploadedAttachment, ConversationMessage } from '../../types';
import type { VideoProject, PlaybackSettings, MediaAsset, WorkflowStage } from '../../data/videoCourseware/model';
import { buildVideoShots, changedVideoIds, videoPlanIssues, videoPlanKey, materialsKey } from '../../data/videoCourseware/planning';
import audioDurations from '../../data/videoCourseware/audioDurations.json';
import { wukongFixture } from '../../data/videoCourseware/fixtures';
import { defaultPlayback } from '../../data/videoCourseware/model';
import { createFixture } from '../../data/videoCourseware/fixtures';
import { useVideoCoursewareStore } from '../../store/videoCoursewareStore';
import { useConversationStore } from '../../store/conversationStore';
import { useCoursewareStore } from '../../store/coursewareStore';
import { useUIStore } from '../../store/uiStore';

export function ensureWorkflowMessage(project:VideoProject,stage:Exclude<WorkflowStage,'plan'>){
 const store=useVideoCoursewareStore.getState(),current=store.projects[project.id];
 const runId=crypto.randomUUID();
 const confirmation=current.workflowVersion===5?(stage==='production'?'全部场景方案已确认，开始生成视频和互动页面。':stage==='assets'?'教学大纲已确认，开始规划场景并准备图片和音频。':''):stage==='production'?'视频方案已确认，开始生成视频。':stage==='video-plan'?'画面与配音已确认，生成视频方案。':stage==='assembly'?'':current.revision?'素材已修改，请确认画面与配音。':'确认需求，开始生成图片和配音。';
 store.update(project.id,{
  workflowRuns:{...current.workflowRuns,[stage]:runId},
  workflowEvents:[...current.workflowEvents||[],{runId,stage,time:new Date().toISOString(),order:(current.workflowEvents?.length||0)+current.resultMessages.length,confirmation}],
  workflowSnapshots:{...current.workflowSnapshots,[runId]:{assets:current.assets,segments:current.segments,speakers:current.speakers,shots:current.shots,readyAssetIds:current.readyAssetIds,chapters:current.chapters,readySceneIds:current.readySceneIds}},
 });
 useConversationStore.getState().addAssistantMessage(project.conversationId,{videoProjectId:project.id,stage,runId},'video-courseware-workflow');
}
export function returnToMaterials(id:string){
 const store=useVideoCoursewareStore.getState(),p=store.projects[id];
 if(p.workflowVersion===5){
  store.update(id,{shots:buildVideoShots(p),phase:'assets-review',job:undefined,approvedMaterialsKey:materialsKey(p),approvedPlanKey:undefined,readyAssetIds:p.readyAssetIds.filter(a=>!changedVideoIds(p).includes(a))});
  if(p.revision)ensureWorkflowMessage(store.projects[id],'video-plan');
  useConversationStore.getState().setWaitingForUserAction(p.conversationId,true);
  if(useConversationStore.getState().activeConversationId===p.conversationId)useUIStore.getState().closePreview();
  return;
 }
 if(p.phase!=='materials-review'&&p.phase!=='assets-loading'){
  useConversationStore.getState().addUserMessage(p.conversationId,'返回查看和确认画面与配音。');
  ensureWorkflowMessage(p,'assets');
 }
 store.update(id,{phase:'materials-review',job:undefined,approvedMaterialsKey:undefined,approvedPlanKey:undefined,readyAssetIds:p.readyAssetIds.filter(a=>!changedVideoIds(p).includes(a))});
 useConversationStore.getState().setWaitingForUserAction(p.conversationId,true);
 if(useConversationStore.getState().activeConversationId===p.conversationId)useUIStore.getState().closePreview();
}
export function beginVideoPlanReview(id:string):boolean{
 const store=useVideoCoursewareStore.getState(),p=store.projects[id];
 if(!['materials-review','assets-review'].includes(p.phase))return false;
 if(p.assets.some(a=>a.kind!=='video'&&(!a.url||!p.readyAssetIds.includes(a.id))))return false;
 const invalid=changedVideoIds(p);
 const run=p.workflowRuns?.assets;
 if(run)store.update(id,{workflowSnapshots:{...p.workflowSnapshots,[run]:{assets:p.assets,segments:p.segments,speakers:p.speakers,shots:p.shots,readyAssetIds:p.readyAssetIds,chapters:p.chapters,readySceneIds:p.readySceneIds}}});
 store.update(id,{workflowVersion:4,approvedMaterialsKey:materialsKey(p),approvedPlanKey:undefined,readyAssetIds:p.readyAssetIds.filter(a=>!invalid.includes(a))});
 useConversationStore.getState().addUserMessage(p.conversationId,'画面与配音已确认，生成视频方案。');
 ensureWorkflowMessage(store.projects[id],'video-plan');
 store.start(id,'video-plan');
 useConversationStore.getState().setWaitingForUserAction(p.conversationId,false);
 return true;
}
export function confirmVideoPlan(id:string):boolean{
 const store=useVideoCoursewareStore.getState(),p=store.projects[id];
 if(p.phase!=='assets-review'||(p.workflowVersion!==5&&p.approvedMaterialsKey!==materialsKey(p))||videoPlanIssues(p).length)return false;
 const signature=videoPlanKey(p);
 store.update(id,{approvedMaterialsKey:materialsKey(p),approvedPlanKey:signature,assets:p.assets.map(a=>{
  const shot=p.shots?.find(s=>s.videoAssetId===a.id);
  return shot?{...a,prompt:shot.prompt,seconds:shot.seconds}:a;
 })});
 if(p.workflowRuns?.['video-plan'])store.update(id,{workflowSnapshots:{...p.workflowSnapshots,[p.workflowRuns['video-plan']]:{assets:p.assets,segments:p.segments,speakers:p.speakers,shots:p.shots,readyAssetIds:p.readyAssetIds,chapters:p.chapters,readySceneIds:p.readySceneIds}}});
 if(!store.start(id,'video'))return false;
 useConversationStore.getState().addUserMessage(p.conversationId,p.workflowVersion===5?'全部场景方案已确认，开始生成视频和互动页面。':'视频方案已确认，开始生成视频。');
 ensureWorkflowMessage(store.projects[id],'production');
 useConversationStore.getState().setWaitingForUserAction(p.conversationId,false);
 return true;
}
export function startVideoProject(conversationId:string,request:string,attachments:UploadedAttachment[],preferences:GenerationPreferences){
 const fixture=createFixture(request,attachments,preferences),id=`video-${conversationId}`;
 const project:VideoProject={id,conversationId,coursewareId:Date.now(),fixtureId:fixture.id,title:fixture.title,request,subject:fixture.subject,grade:fixture.grade,attachments,framework:fixture.framework,preferences,videoUse:'关键环节',speakers:fixture.speakers.map(s=>({...s,voiceName:s.role==='narrator'&&preferences.voiceName?preferences.voiceName:s.voiceName,voiceId:s.role==='narrator'?preferences.voiceId:undefined,voiceLanguage:s.role==='narrator'?preferences.voiceLanguage:undefined})),chapters:makeOutline(fixture.segments),segments:fixture.segments.map(s=>({...s,content:initialSceneContent(s,fixture.id)})),assets:fixture.assets,phase:'planning',workflowVersion:5,readyAssetIds:[],composition:{...defaultPlayback,overlays:{},assetOverrides:{}},revision:0,resultMessages:[]};
 useVideoCoursewareStore.getState().put(project);
 useConversationStore.getState().addUserMessage(conversationId,{text:request,attachments,generationPreferences:preferences});
 useConversationStore.getState().addAssistantMessage(conversationId,{videoProjectId:id,stage:'plan'},'video-courseware-workflow');
 useConversationStore.getState().setWaitingForUserAction(conversationId,false);
 useVideoCoursewareStore.getState().start(id,'plan');
}
export function buildVideoLessonHTML(project:VideoProject,composition:PlaybackSettings=project.composition){
 const url=runtimeURL(project,composition);if(!url)return '';
 const serialized=JSON.stringify(runtimeSettings(project,composition)).replace(/</g,'\\u003c');
 const root=JSON.stringify(location.origin);

 return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#fff"><iframe id="lesson" title="互动课件" src="${url}" style="width:100vw;height:100vh;border:0" allow="autoplay; fullscreen"></iframe><script>const frame=document.getElementById('lesson');frame.addEventListener('load',()=>frame.contentWindow.postMessage({type:'wukong-studio-config',composition:${serialized}},${root}));window.addEventListener('message',e=>{if(e.origin!==${root}||e.source!==parent)return;if(e.data?.type==='pause-video-courseware')frame.contentWindow.postMessage({type:'wukong-studio-pause'},${root});});</script></body></html>`;
}
function coursewareFor(p:VideoProject,html:string):Courseware{return {id:p.coursewareId,title:p.title,subject:p.subject,grade:p.grade,type:'视频互动课件',author:'我',publishTime:new Date().toLocaleString('sv-SE'),views:0,favorites:0,likes:0,isOwn:true,isPublished:false,resourceScope:'personal',videoProjectId:p.id,thumbnail:p.assets.find(a=>a.id==='cover')?.url,htmlContent:html};}
export function finishVideoProject(id:string,composition?:PlaybackSettings,note?:string){
 const store=useVideoCoursewareStore.getState(),p=store.projects[id],next={...p,composition:composition||p.composition};
 const html=buildVideoLessonHTML(next);if(!html){store.update(id,{phase:'failed',error:'场景方案已保存。当前演示尚未接入本课的页面生成服务，无法交付完整课件。'});return;}
 const version=p.revision+1,time=new Date().toISOString(),messageId=`${id}-result-${version}`;
 const result:CoursewareResult={coursewareId:p.coursewareId,title:p.title,version:`v${version}`,htmlContent:html,thumbnail:p.assets.find(a=>a.id==='cover')?.url,generationPreferences:p.preferences,videoProjectId:p.id};
 store.update(id,{phase:'ready',job:undefined,composition:next.composition,revision:version,resultMessages:[...p.resultMessages,{id:messageId,html,version,time,snapshot:{assets:p.assets,segments:p.segments,speakers:p.speakers,shots:p.shots,readyAssetIds:p.readyAssetIds,chapters:p.chapters,readySceneIds:p.readySceneIds},composition:next.composition,order:(p.workflowEvents?.length||0)+p.resultMessages.length}],pendingEdit:undefined});
 if(note)useConversationStore.getState().addUserMessage(p.conversationId,note);
 const cw=useCoursewareStore.getState();if(cw.coursewares.some(c=>c.id===p.coursewareId))cw.updateCourseware(p.coursewareId,coursewareFor(p,html));else cw.addCourseware(coursewareFor(p,html));
 useConversationStore.getState().addAssistantMessage(p.conversationId,result,'courseware-result');
 useConversationStore.getState().completeGeneration(p.conversationId,result,p.coursewareId);
 if(useConversationStore.getState().activeConversationId===p.conversationId){useUIStore.getState().setSidebarCollapsed(true);useUIStore.getState().openPreview(p.coursewareId,`v${version}`);}
}
export function restoreVideoConversations(){
 const projects=Object.values(useVideoCoursewareStore.getState().projects);
 const conv=useConversationStore.getState();
 const missing=projects.filter(p=>!conv.conversations.some(c=>c.id===p.conversationId));
 if(!missing.length)return;
 const restored=missing.map(p=>({id:p.conversationId,title:p.title,createdAt:new Date().toLocaleString('sv-SE'),isPinned:false,isGenerating:false,waitingForUserAction:['plan','materials-review','assets-review'].includes(p.phase),coursewareId:p.revision?p.coursewareId:undefined,messages:[{id:`${p.id}-user`,role:'user',type:'text',content:{text:p.request,attachments:p.attachments,generationPreferences:p.preferences},timestamp:new Date()},{id:`${p.id}-workflow`,role:'assistant',type:'video-courseware-workflow',content:{videoProjectId:p.id,stage:'plan'},timestamp:new Date()},...(p.readyAssetIds.length||p.job?.kind==='assets'||p.job?.kind==='video-plan'?[{id:`${p.id}-assets`,role:'assistant',type:'video-courseware-workflow',content:{videoProjectId:p.id,stage:'assets',runId:p.workflowRuns?.assets},timestamp:new Date()}]:[]),...(p.resultMessages.length||p.job?.kind==='video'||p.job?.kind==='assembly'?[{id:`${p.id}-production`,role:'assistant',type:'video-courseware-workflow',content:{videoProjectId:p.id,stage:'production',runId:p.workflowRuns?.production},timestamp:new Date()}]:[]),...p.resultMessages.map(r=>({id:r.id,role:'assistant',type:'courseware-result',timestamp:new Date(r.time),content:{title:p.title,coursewareId:p.coursewareId,version:`v${r.version}`,htmlContent:r.html,generationPreferences:p.preferences,videoProjectId:p.id}}))] as ConversationMessage[]}));
 for(const conversation of restored){
  const p=projects.find(p=>p.conversationId===conversation.id)!;
  if(!p.workflowEvents?.length)continue;
  const timeline:ConversationMessage[]=[
   ...p.workflowEvents.flatMap(event=>[
    ...(event.confirmation?[{id:event.runId+'-confirmation',role:'user' as const,type:'text' as const,content:event.confirmation,timestamp:new Date(event.time)}]:[]),
    {id:event.runId,role:'assistant' as const,type:'video-courseware-workflow' as const,content:{videoProjectId:p.id,stage:event.stage,runId:event.runId},timestamp:new Date(event.time)},
   ]),
   ...p.resultMessages.map(r=>({id:r.id,role:'assistant' as const,type:'courseware-result' as const,timestamp:new Date(r.time),content:{title:p.title,coursewareId:p.coursewareId,version:'v'+r.version,htmlContent:r.html,generationPreferences:p.preferences,videoProjectId:p.id}})),
  ];
  const sequence=new Map<string,number|undefined>([...p.workflowEvents.flatMap(event=>[[event.runId,event.order],[event.runId+'-confirmation',event.order]] as Array<[string,number|undefined]>),...p.resultMessages.map(r=>[r.id,r.order] as [string,number|undefined])]);
  timeline.sort((a,b)=>{const x=sequence.get(a.id),y=sequence.get(b.id);return x!==undefined&&y!==undefined?x-y:a.timestamp.getTime()-b.timestamp.getTime();});
  conversation.messages=[...conversation.messages.slice(0,2),...timeline];
 }
 useConversationStore.setState(s=>({conversations:[...restored,...s.conversations]}));
 for(const p of missing){const r=p.resultMessages.at(-1);if(r&&!useCoursewareStore.getState().coursewares.some(c=>c.id===p.coursewareId))useCoursewareStore.getState().addCourseware(coursewareFor(p,r.html));}
}
// A tick advances persisted jobs without tying them to the currently open conversation.
export function advanceVideoJobs(now=Date.now()){
 const store=useVideoCoursewareStore.getState();
 for(const original of Object.values(store.projects)){
  // Resume v2 drafts with measured audio and missing reference frames. Finished HTML is untouched.
  let p=original;
  if(p.fixtureId==='wukong'&&p.assets.some(a=>a.kind==='audio'&&!a.seconds)){
   const assets:MediaAsset[]=p.assets.map(a=>({...wukongFixture.assets.find(f=>f.id===a.id),...a,seconds:a.seconds||(a.url?(audioDurations as Record<string,number>)[a.url]:undefined)}));
   for(const a of wukongFixture.assets.filter(a=>a.planningOnly))if(!assets.some(x=>x.id===a.id))assets.push(a);
   store.update(p.id,{assets});p=useVideoCoursewareStore.getState().projects[p.id];
  }
  if(p.workflowVersion===5){advanceOutlineFlow(p,now);continue;}
  if(p.workflowVersion!==4&&p.phase!=='ready'){
   const fixtures=p.fixtureId==='wukong'?wukongFixture.assets:[];
   const assets:MediaAsset[]=p.assets.filter(a=>!a.id.startsWith('frame-')).map(a=>({...a,videoInputs:fixtures.find(f=>f.id===a.id)?.videoInputs}));
   for(const a of fixtures.filter(a=>a.id.startsWith('frame-')||a.id==='opening-fan'))assets.push(a);
   const reviewed=p.phase==='assets-review';
   store.update(p.id,{assets,workflowVersion:4,shots:undefined,...(reviewed?{phase:'materials-review' as const,job:undefined,readyAssetIds:assets.filter(a=>a.kind!=='video'&&a.url).map(a=>a.id)}:{})});
   p=store.projects[p.id];
  }
  if(!p.job||!['planning','assets-loading','video-planning','video-loading','assembling'].includes(p.phase))continue;
  let ratio=Math.min(1,(now-p.job.start+p.job.elapsed)/p.job.duration);
  const job=p.job;
  const relevant=p.assets.filter(a=>job.kind==='video'?a.kind==='video':job.kind==='video-plan'?a.kind==='image'&&a.planningOnly:a.kind!=='video'&&!a.planningOnly);
  if(['assets','video','video-plan'].includes(job.kind)){
   const completed=relevant.filter(a=>{
    const group=relevant.filter(other=>other.kind===a.kind);
    const threshold=(group.findIndex(other=>other.id===a.id)+1)/group.length*(a.kind==='audio'?.72:1);
    return a.url&&ratio>=threshold;
   }).map(a=>a.id);
   const ready=[...new Set([...p.readyAssetIds,...completed])];
   if(ready.length!==p.readyAssetIds.length)store.update(p.id,{readyAssetIds:ready});
   p=store.projects[p.id];
   if(job.kind!=='video-plan'&&relevant.every(a=>ready.includes(a.id)))ratio=1;
  }
  if(ratio<1)continue;
  if(job.kind==='plan'){
   store.update(p.id,{phase:'plan',job:undefined});useConversationStore.getState().setWaitingForUserAction(p.conversationId,true);
  }else if(job.kind==='assets'){
   if(relevant.some(a=>!a.url)){store.update(p.id,{phase:'failed',error:'图片与配音暂时无法生成，方案已保留。请稍后重试。',job:{...job,elapsed:job.duration}});continue;}
   store.update(p.id,{phase:'materials-review',job:undefined,approvedMaterialsKey:undefined});
   useConversationStore.getState().setWaitingForUserAction(p.conversationId,true);
  }else if(job.kind==='video-plan'){
   store.update(p.id,{shots:buildVideoShots(p),phase:'assets-review',job:undefined});
   useConversationStore.getState().setWaitingForUserAction(p.conversationId,true);
  }else if(job.kind==='video'){
   if(relevant.some(a=>!a.url)){store.update(p.id,{phase:'failed',error:'部分视频未生成成功，其他片段已保留。请重试未完成内容。',job:{...job,elapsed:job.duration}});continue;}
   ensureWorkflowMessage(p,'assembly');
   store.start(p.id,'assembly');
  }else finishVideoProject(p.id);
 }
}
export function useVideoJobs(){
 useEffect(()=>{
  restoreVideoConversations();
  advanceVideoJobs();const timer=setInterval(()=>advanceVideoJobs(),160);return()=>clearInterval(timer);
 },[]);
}


export function confirmOutline(id:string):boolean {
 const store=useVideoCoursewareStore.getState(),p=store.projects[id];
 if(p.phase!=='plan'||outlineIssues(p).length)return false;
 store.update(id,compileOutline(p));
 useConversationStore.getState().addUserMessage(p.conversationId,'教学大纲已确认，开始规划场景并准备图片和音频。');
 ensureWorkflowMessage(store.projects[id],'assets');
 store.start(id,'scene-planning');
 useConversationStore.getState().setWaitingForUserAction(p.conversationId,false);
 return true;
}
// The demo replays prepared assets. No production generation request is sent.
// Each phase is persisted, and scene plans remain hidden until images AND audio finish.
function advanceOutlineFlow(p:VideoProject,now:number){
 const store=useVideoCoursewareStore.getState(),job=p.job;
 if(!job||['paused','failed','ready','plan','assets-review'].includes(p.phase))return;
 let ratio=Math.min(1,(now-job.start+job.elapsed)/job.duration);
 const kind=job.kind==='images'?'image':job.kind==='audio'?'audio':job.kind==='video'?'video':undefined;
 if(kind){
  const items=p.assets.filter(a=>a.kind===kind);
  const completed=items.filter((a,i)=>a.url&&ratio>=(i+1)/Math.max(items.length,1)).map(a=>a.id);
  const ready=[...new Set([...p.readyAssetIds,...completed])];
  if(ready.length!==p.readyAssetIds.length)store.update(p.id,{readyAssetIds:ready});
  p=store.projects[p.id];
  if(items.every(a=>ready.includes(a.id)))ratio=1;
  if(ratio>=1&&items.some(a=>!a.url)){
   store.update(p.id,{phase:'failed',error:`${kind==='image'?'图片':kind==='audio'?'配音':'视频'}方案已保存。当前演示未接入生成服务；可返回大纲保留或调整方案。`,job:{...job,elapsed:job.duration}});
   return;
  }
 }
 if(job.kind==='h5'){
  const ready=p.segments.filter((_,i)=>ratio>=(i+1)/p.segments.length).map(s=>s.id);
  if(ready.length!==(p.readySceneIds||[]).length)store.update(p.id,{readySceneIds:ready});
 }
 if(ratio<1)return;
 if(job.kind==='plan'){store.update(p.id,{phase:'plan',job:undefined});useConversationStore.getState().setWaitingForUserAction(p.conversationId,true);}
 else if(job.kind==='scene-planning')store.start(p.id,'images');
 else if(job.kind==='images')store.start(p.id,'audio');
 else if(job.kind==='audio'){
  store.update(p.id,{shots:buildVideoShots(p),approvedMaterialsKey:materialsKey(p),phase:'assets-review',job:undefined});
  ensureWorkflowMessage(store.projects[p.id],'video-plan');
  useConversationStore.getState().setWaitingForUserAction(p.conversationId,true);
 }else if(job.kind==='video')store.start(p.id,'h5');
 else if(job.kind==='h5'){ensureWorkflowMessage(store.projects[p.id],'assembly');store.start(p.id,'assembly');}
 else if(job.kind==='assembly')finishVideoProject(p.id);
}
