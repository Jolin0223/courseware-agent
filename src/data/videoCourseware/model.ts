import type { GenerationPreferences, RequirementFramework, UploadedAttachment } from '../../types';

export type SegmentKind = 'video' | 'mixed' | 'h5';
export type AssetKind = 'image' | 'audio' | 'video';
export type JobKind = 'plan' | 'assets' | 'video-plan' | 'video' | 'assembly' | 'scene-planning' | 'images' | 'audio' | 'h5' | 'scenes';
export type WorkflowPhase = 'planning' | 'plan' | 'assets-loading' | 'materials-review' | 'video-planning' | 'assets-review' | 'video-loading' | 'assembling' | 'ready' | 'paused' | 'failed' | 'scene-planning' | 'images-loading' | 'audio-loading' | 'h5-loading' | 'scenes-loading';
export type WorkflowStage = 'plan' | 'assets' | 'video-plan' | 'production' | 'assembly';
export interface ImageReference { assetId:string; purpose:string; range:string; }
export interface AudioCue { id:string; assetId:string; start:number; trimStart:number; trimEnd:number; mode:'playback'|'reference'; description:string; }
export interface OutlineChapter { id:string; title:string; content:string; sourceContent?:string; segmentIds:string[]; }
export interface VideoSegment { content?:string; chapterId?:string; id:string; chapter:string; title:string; kind:SegmentKind; purpose:string; interaction:string; next:string; seconds:number; dialogue:string; speakerId:string; visual:string; transition:string; }
export interface Speaker { id:string; name:string; role:'narrator'|'character'; voiceName:string; voiceId?:string; voiceLanguage?:string; sample?:string; }
export interface MediaAsset { imageGeneration?:{mode:'image-to-image'|'text-to-image';referenceUrl?:string;referenceName?:string}; id:string; kind:AssetKind; name:string; url?:string; poster?:string; prompt:string; segmentIds:string[]; speakerId?:string; text?:string; seconds?:number; role?:string; overlay?:{sceneId:string}; audioUse?:'video'|'interaction'; referenceFor?:string; planningOnly?:boolean; revision?:number; videoDependency?:boolean; sourcePrompt?:string; videoInputs?:{firstFrameId?:string;lastFrameId?:string;references:ImageReference[];audioStarts?:number[];audioDescriptions?:string[]}; }
export interface VideoShot {
 id:string; segmentId:string; videoAssetId:string; firstFrameId?:string; lastFrameId?:string;
 references?:ImageReference[]; audioCues?:AudioCue[];
 audioIds:string[]; seconds:number; action:string; ending:string; prompt:string; sourceKey:string;
}
export type WorkflowSnapshot = Pick<VideoProject,'assets'|'segments'|'speakers'|'shots'|'readyAssetIds'|'chapters'|'readySceneIds'|'readyPageIds'>;
export interface LessonFixture { id:string; title:string; subject:string; grade:string; request:string; attachments:UploadedAttachment[]; framework:RequirementFramework; segments:VideoSegment[]; speakers:Speaker[]; assets:MediaAsset[]; runtime?:string; }
export interface PlaybackSettings { subtitles:boolean; soundEffects:boolean; overlays:Record<string,{offsetY:number;scale:number}>; assetOverrides:Record<string,string>; }
export interface VideoPublicationTarget { id:string;name:string;currentVersion:string;urlLabel:string;resourceScope?:'group'|'school'|'personal';schoolName?:string;subject?:string; }
export interface VideoPublicationStatus { publishTargetId?:string;isCurrentPublished?:boolean;isHistoricalPublished?:boolean;isRemoved?:boolean; }
export interface VideoProject {
 id:string; conversationId:string; coursewareId:number; fixtureId:string;
 title:string; request:string; subject:string; grade:string; attachments:UploadedAttachment[];
 framework:RequirementFramework; preferences:GenerationPreferences; videoUse:string; speakers:Speaker[]; segments:VideoSegment[]; assets:MediaAsset[];
 phase:WorkflowPhase; job?:{kind:JobKind; start:number; duration:number; elapsed:number}; readyAssetIds:string[]; error?:string;
 chapters?:OutlineChapter[]; readySceneIds?:string[]; readyPageIds?:string[]; sceneAssemblyStarts?:Record<string,number>; outlineConfirmed?:boolean;
 shots?:VideoShot[]; approvedPlanKey?:string; approvedMaterialsKey?:string; workflowVersion?:number;
 workflowRuns?:Partial<Record<WorkflowStage,string>>; workflowSnapshots?:Record<string,WorkflowSnapshot>;
 workflowEvents?:Array<{runId:string;stage:WorkflowStage;time:string;order?:number;confirmation:string}>;
 publishedTargets?:VideoPublicationTarget[]; publishedVersions?:Record<string,VideoPublicationStatus>;
 composition:PlaybackSettings; revision:number; pendingEdit?:string; resultMessages:Array<{id:string;html:string;version:number;time:string;order?:number;snapshot?:WorkflowSnapshot;composition?:PlaybackSettings}>;
}
export const segmentLabels:Record<SegmentKind,string>={video:'视频',mixed:'视频＋互动',h5:'互动页面'};
export const defaultPlayback:PlaybackSettings={subtitles:true,soundEffects:true,overlays:{},assetOverrides:{}};
