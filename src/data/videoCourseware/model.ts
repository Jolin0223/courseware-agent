import type { GenerationPreferences, RequirementFramework, UploadedAttachment } from '../../types';

export type SegmentKind = 'video' | 'mixed' | 'h5';
export type AssetKind = 'image' | 'audio' | 'video';
export type JobKind = 'plan' | 'assets' | 'video' | 'assembly';
export type WorkflowPhase = 'planning' | 'plan' | 'assets-loading' | 'assets-review' | 'video-loading' | 'assembling' | 'ready' | 'paused' | 'failed';
export interface VideoSegment { id:string; chapter:string; title:string; kind:SegmentKind; purpose:string; interaction:string; next:string; seconds:number; dialogue:string; speakerId:string; visual:string; transition:string; }
export interface Speaker { id:string; name:string; role:'narrator'|'character'; voiceName:string; voiceId?:string; voiceLanguage?:string; sample?:string; }
export interface MediaAsset { id:string; kind:AssetKind; name:string; url?:string; poster?:string; prompt:string; segmentIds:string[]; speakerId?:string; text?:string; seconds?:number; role?:string; overlay?:{sceneId:string}; }
export interface LessonFixture { id:string; title:string; subject:string; grade:string; request:string; attachments:UploadedAttachment[]; framework:RequirementFramework; segments:VideoSegment[]; speakers:Speaker[]; assets:MediaAsset[]; runtime?:string; }
export interface PlaybackSettings { subtitles:boolean; soundEffects:boolean; overlays:Record<string,{offsetY:number;scale:number}>; assetOverrides:Record<string,string>; }
export interface VideoPublicationTarget { id:string;name:string;currentVersion:string;urlLabel:string;resourceScope?:'group'|'school'|'personal';schoolName?:string;subject?:string; }
export interface VideoPublicationStatus { publishTargetId?:string;isCurrentPublished?:boolean;isHistoricalPublished?:boolean;isRemoved?:boolean; }
export interface VideoProject {
 id:string; conversationId:string; coursewareId:number; fixtureId:string;
 title:string; request:string; subject:string; grade:string; attachments:UploadedAttachment[];
 framework:RequirementFramework; preferences:GenerationPreferences; videoUse:string; speakers:Speaker[]; segments:VideoSegment[]; assets:MediaAsset[];
 phase:WorkflowPhase; job?:{kind:JobKind; start:number; duration:number; elapsed:number}; readyAssetIds:string[]; error?:string;
 publishedTargets?:VideoPublicationTarget[]; publishedVersions?:Record<string,VideoPublicationStatus>;
 composition:PlaybackSettings; revision:number; pendingEdit?:string; resultMessages:Array<{id:string;html:string;version:number;time:string}>;
}
export const segmentLabels:Record<SegmentKind,string>={video:'视频',mixed:'视频＋互动',h5:'互动页面'};
export const defaultPlayback:PlaybackSettings={subtitles:true,soundEffects:true,overlays:{},assetOverrides:{}};
