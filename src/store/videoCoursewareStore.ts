import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { videoPlanKey, videoPlanIssues, materialsKey } from '../data/videoCourseware/planning';
import type { VideoProject, JobKind, PlaybackSettings, WorkflowPhase } from '../data/videoCourseware/model';

export const useVideoComposer = create<{format:'h5'|'video';exampleRequested:number;setFormat:(v:'h5'|'video')=>void;loadExample:()=>void;consumeExample:()=>void}>((set)=>({format:'h5',exampleRequested:0,setFormat:format=>set({format}),loadExample:()=>set(s=>({format:'video',exampleRequested:s.exampleRequested+1})),consumeExample:()=>set({exampleRequested:0})}));
interface State {projects:Record<string,VideoProject>;put:(p:VideoProject)=>void;update:(id:string,patch:Partial<VideoProject>)=>void;start:(id:string,kind:JobKind)=>boolean;pause:(id:string)=>void;resume:(id:string)=>void;}
export const durations:Record<JobKind,number>={plan:2400,assets:10500,'video-plan':3600,video:16000,assembly:4500,'scene-planning':1800,images:6500,audio:6500,h5:4500,scenes:14000};
export const jobPhase:Record<JobKind,WorkflowPhase>={plan:'planning',assets:'assets-loading','video-plan':'video-planning',video:'video-loading',assembly:'assembling','scene-planning':'scene-planning',images:'images-loading',audio:'audio-loading',h5:'h5-loading',scenes:'scenes-loading'};
export const useVideoCoursewareStore=create<State>()(persist((set,get)=>({
 projects:{},put:p=>set(s=>({projects:{...s.projects,[p.id]:p}})),
 update:(id,patch)=>set(s=>({projects:{...s.projects,[id]:{...s.projects[id],...patch}}})),
 start:(id,kind)=>{const p=get().projects[id];if(['video','scenes'].includes(kind)&&(videoPlanIssues(p).length||p.approvedMaterialsKey!==materialsKey(p)||p.approvedPlanKey!==videoPlanKey(p)))return false;get().update(id,{phase:jobPhase[kind],approvedPlanKey:kind==='assets'||kind==='video-plan'?undefined:p.approvedPlanKey,error:undefined,job:{kind,start:Date.now(),duration:p.workflowVersion===5&&kind==='video'?10000:p.workflowVersion===5&&kind==='assembly'?3500:durations[kind],elapsed:0}});return true;},
 pause:id=>{const p=get().projects[id];if(p.job)get().update(id,{phase:'paused',job:{...p.job,elapsed:Math.min(p.job.duration,Date.now()-p.job.start+p.job.elapsed)}});},
 resume:id=>{const p=get().projects[id];if(p.job&&['video','scenes'].includes(p.job.kind)&&(videoPlanIssues(p).length||p.approvedMaterialsKey!==materialsKey(p)||p.approvedPlanKey!==videoPlanKey(p))){get().update(id,{phase:'assets-review',job:undefined,approvedPlanKey:undefined});return;}if(p.job)get().update(id,{phase:jobPhase[p.job.kind],error:undefined,...(p.phase==='failed'&&p.job.kind==='scenes'?{sceneAssemblyStarts:{}}:{}),job:{...p.job,start:Date.now(),elapsed:p.phase==='failed'?0:p.job.elapsed}});},
}),{name:'video-courseware-platform-v2',version:4,migrate:(persisted)=>{
 const state=persisted as {projects:Record<string,VideoProject>};
 for(const project of Object.values(state.projects||{})){
  const old=project.composition as PlaybackSettings&{badgeOffset?:number;badgeScale?:number};
  project.composition={subtitles:old.subtitles,soundEffects:old.soundEffects,overlays:old.overlays||{badge:{offsetY:old.badgeOffset||0,scale:old.badgeScale||1}},assetOverrides:Object.fromEntries(Object.entries(old.assetOverrides||{}).map(([key,value])=>[project.assets.find(a=>a.url?.endsWith(key))?.id||key,value]))};
 }
 return state;
}}));
export const videoProjectForCourseware=(id:number)=>Object.values(useVideoCoursewareStore.getState().projects).find(p=>p.coursewareId===id);
export const videoProjectForConversation=(id:string|null)=>Object.values(useVideoCoursewareStore.getState().projects).find(p=>p.conversationId===id);
export const copyPlayback=(settings:PlaybackSettings):PlaybackSettings=>({...settings,overlays:Object.fromEntries(Object.entries(settings.overlays).map(([id,value])=>[id,{...value}])),assetOverrides:{...settings.assetOverrides}});
