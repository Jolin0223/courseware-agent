import { runtimeSettings, runtimeURL } from './runtime';
import { useEffect } from 'react';
import type { Courseware, CoursewareResult, GenerationPreferences, UploadedAttachment, ConversationMessage } from '../../types';
import type { VideoProject, PlaybackSettings } from '../../data/videoCourseware/model';
import { defaultPlayback } from '../../data/videoCourseware/model';
import { createFixture } from '../../data/videoCourseware/fixtures';
import { useVideoCoursewareStore } from '../../store/videoCoursewareStore';
import { useConversationStore } from '../../store/conversationStore';
import { useCoursewareStore } from '../../store/coursewareStore';
import { useUIStore } from '../../store/uiStore';

export function ensureWorkflowMessage(project:VideoProject,stage:'assets'|'production'){
 const conversation=useConversationStore.getState().conversations.find(c=>c.id===project.conversationId);
 const exists=conversation?.messages.some(m=>m.type==='video-courseware-workflow'&&typeof m.content==='object'&&'videoProjectId' in m.content&&m.content.videoProjectId===project.id&&'stage' in m.content&&m.content.stage===stage);
 if(!exists)useConversationStore.getState().addAssistantMessage(project.conversationId,{videoProjectId:project.id,stage},'video-courseware-workflow');
}
export function startVideoProject(conversationId:string,request:string,attachments:UploadedAttachment[],preferences:GenerationPreferences){
 const fixture=createFixture(request,attachments,preferences),id=`video-${conversationId}`;
 const project:VideoProject={id,conversationId,coursewareId:Date.now(),fixtureId:fixture.id,title:fixture.title,request,subject:fixture.subject,grade:fixture.grade,attachments,framework:fixture.framework,preferences,videoUse:'关键环节',speakers:fixture.speakers.map(s=>({...s,voiceName:s.role==='narrator'&&preferences.voiceName?preferences.voiceName:s.voiceName,voiceId:s.role==='narrator'?preferences.voiceId:undefined,voiceLanguage:s.role==='narrator'?preferences.voiceLanguage:undefined})),segments:fixture.segments,assets:fixture.assets,phase:'planning',readyAssetIds:[],composition:{...defaultPlayback,overlays:{},assetOverrides:{}},revision:0,resultMessages:[]};
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
 const html=buildVideoLessonHTML(next);if(!html)return;
 const version=p.revision+1,time=new Date().toISOString(),messageId=`${id}-result-${version}`;
 const result:CoursewareResult={coursewareId:p.coursewareId,title:p.title,version:`v${version}`,htmlContent:html,thumbnail:p.assets.find(a=>a.id==='cover')?.url,generationPreferences:p.preferences,videoProjectId:p.id};
 store.update(id,{phase:'ready',job:undefined,composition:next.composition,revision:version,resultMessages:[...p.resultMessages,{id:messageId,html,version,time}],pendingEdit:undefined});
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
 const restored=missing.map(p=>({id:p.conversationId,title:p.title,createdAt:new Date().toLocaleString('sv-SE'),isPinned:false,isGenerating:false,waitingForUserAction:['plan','assets-review'].includes(p.phase),coursewareId:p.revision?p.coursewareId:undefined,messages:[{id:`${p.id}-user`,role:'user',type:'text',content:{text:p.request,attachments:p.attachments,generationPreferences:p.preferences},timestamp:new Date()},{id:`${p.id}-workflow`,role:'assistant',type:'video-courseware-workflow',content:{videoProjectId:p.id,stage:'plan'},timestamp:new Date()},...(p.readyAssetIds.length||p.job?.kind==='assets'?[{id:`${p.id}-assets`,role:'assistant',type:'video-courseware-workflow',content:{videoProjectId:p.id,stage:'assets'},timestamp:new Date()}]:[]),...(p.resultMessages.length||p.job?.kind==='video'||p.job?.kind==='assembly'?[{id:`${p.id}-production`,role:'assistant',type:'video-courseware-workflow',content:{videoProjectId:p.id,stage:'production'},timestamp:new Date()}]:[]),...p.resultMessages.map(r=>({id:r.id,role:'assistant',type:'courseware-result',timestamp:new Date(r.time),content:{title:p.title,coursewareId:p.coursewareId,version:`v${r.version}`,htmlContent:r.html,generationPreferences:p.preferences,videoProjectId:p.id}}))] as ConversationMessage[]}));
 useConversationStore.setState(s=>({conversations:[...restored,...s.conversations]}));
 for(const p of missing){const r=p.resultMessages.at(-1);if(r&&!useCoursewareStore.getState().coursewares.some(c=>c.id===p.coursewareId))useCoursewareStore.getState().addCourseware(coursewareFor(p,r.html));}
}
// A tick advances persisted jobs without tying them to the currently open conversation.
export function advanceVideoJobs(now=Date.now()){
   const store=useVideoCoursewareStore.getState();
   for(const p of Object.values(store.projects)){
    if(!p.job||!['planning','assets-loading','video-loading','assembling'].includes(p.phase))continue;
    const elapsed=now-p.job.start+p.job.elapsed,ratio=Math.min(1,elapsed/p.job.duration);
    if(p.job.kind==='assets'||p.job.kind==='video'){
     const relevant=p.assets.filter(a=>p.job!.kind==='video'?a.kind==='video':a.kind!=='video');
     const completed=relevant.filter(a=>{
      const group=relevant.filter(other=>other.kind===a.kind);
      const threshold=(group.findIndex(other=>other.id===a.id)+1)/(group.length+1)*(a.kind==='audio'?.72:1);
      return a.url&&ratio>=threshold;
     }).map(a=>a.id);
     const ready=[...new Set([...p.readyAssetIds,...completed])];
     if(ready.length!==p.readyAssetIds.length)store.update(p.id,{readyAssetIds:ready});
    }
    if(ratio<1)continue;
    if(p.job.kind==='plan'){store.update(p.id,{phase:'plan',job:undefined});useConversationStore.getState().setWaitingForUserAction(p.conversationId,true);}
    else if(p.job.kind==='assets'){
     if(p.assets.some(a=>a.kind!=='video'&&!a.url)){store.update(p.id,{phase:'failed',error:'图片与配音暂时无法生成，方案已保留。请稍后重试。',job:{...p.job,elapsed:p.job.duration}});continue;}
     store.update(p.id,{phase:'assets-review',job:undefined});useConversationStore.getState().setWaitingForUserAction(p.conversationId,true);
    }else if(p.job.kind==='video'){
     if(p.assets.some(a=>a.kind==='video'&&!a.url)){store.update(p.id,{phase:'failed',error:'部分视频未生成成功，其他片段已保留。请重试未完成内容。',job:{...p.job,elapsed:p.job.duration}});continue;}
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
