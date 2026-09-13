import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { initialComposition, initialPreferences, initialRequest } from '../data/wukong/course';
import type { Composition, Preferences, SceneEdit, Snapshot } from '../data/wukong/course';

interface WukongState {
  step:number; request:string; preferences:Preferences; composition:Composition;
  edits:Record<string,SceneEdit>; production:'idle'|'loading'|'ready'|'failed';
  approved:boolean; versions:Snapshot[]; activeVersion:string; notes:string[];
  update:(patch:Partial<Omit<WukongState,'update'|'saveVersion'|'restore'>>) => void;
  saveVersion:(note:string,composition?:Composition)=>void;
  restore:(id:string)=>void;
}
export const useWukongStore = create<WukongState>()(persist((set,get)=>({
  step:0, request:initialRequest, preferences:initialPreferences, composition:initialComposition,
  edits:{}, production:'idle',approved:false,
  versions:[{id:'v1',label:'V1',time:'共创验收基线',composition:initialComposition,note:'复用用户确认的 V32 第一关；原视频、配音与雨字徽章。'}],
  activeVersion:'v1',notes:[],
  update:patch=>set(patch),
  saveVersion:(note,composition)=>{
    const s=get(),next=composition||s.composition;
    const id=`v${s.versions.length+1}`;
    set({composition:next,preferences:{...s.preferences,subtitles:next.subtitles,soundEffects:next.soundEffects},activeVersion:id,approved:false,versions:[...s.versions,{id,label:id.toUpperCase(),time:new Date().toLocaleString('zh-CN'),composition:{...next},note}],notes:[...s.notes,note]});
  },
  restore:id=>{const v=get().versions.find(v=>v.id===id);if(v)set({composition:{...v.composition},preferences:{...get().preferences,subtitles:v.composition.subtitles,soundEffects:v.composition.soundEffects},activeVersion:id,approved:false});},
}),{name:'wukong-agent-studio-v1',version:1,partialize:s=>({step:s.step,request:s.request,preferences:s.preferences,composition:s.composition,edits:s.edits,production:s.production,approved:s.approved,versions:s.versions,activeVersion:s.activeVersion,notes:s.notes})}));
