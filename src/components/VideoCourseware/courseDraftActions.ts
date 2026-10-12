import type { VideoProject } from '../../data/videoCourseware/model';
import { buildSceneCandidate, rebaseSceneDraft, revisionProject, sceneSnapshot } from '../../data/videoCourseware/sceneRevision';
import { videoPlanIssues } from '../../data/videoCourseware/planning';
import { prepareSceneEdit } from '../../data/videoCourseware/sceneEditing';
import { useVideoCoursewareStore } from '../../store/videoCoursewareStore';
import { buildVideoLessonHTML, finishVideoProject } from './workflow';

export function courseDraftProject(project:VideoProject):VideoProject {
 const draft=project.courseDraft;
 return draft?revisionProject(project,draft.snapshot,draft.composition):project;
}

// Each save updates a single shared lesson draft, never the delivered lesson.
export function saveCourseSceneDraft(original:VideoProject,edited:VideoProject,sceneId:string):boolean {
 const store=useVideoCoursewareStore.getState(),current=store.projects[original.id];
 if(current.phase!=='ready'||current.courseDraft?.status==='generating'||original.revision!==current.revision)return false;
 const base=courseDraftProject(current);
 const merged=rebaseSceneDraft(base,{id:'lesson-draft',sceneId,baseVersion:original.revision,sourceVersion:original.revision,scope:'scene',status:'draft',base:sceneSnapshot(original),draft:sceneSnapshot(edited),baseComposition:original.composition,composition:edited.composition});
 const next=buildSceneCandidate(base,merged,sceneId,'scene',crypto.randomUUID()).project;
 store.update(current.id,{courseDraft:{baseVersion:current.revision,snapshot:sceneSnapshot(next),composition:next.composition,sceneIds:[...new Set([...current.courseDraft?.sceneIds||[],sceneId])],instruction:current.courseDraft?.instruction,status:'draft'}});
 return true;
}

export function saveCourseChatDraft(projectId:string,instruction:string,edits:Array<{sceneId:string;instruction:string;referenceNames?:string[]}>=[]):boolean {
 const store=useVideoCoursewareStore.getState(),p=store.projects[projectId];
 if(p.phase!=='ready'||p.courseDraft?.status==='generating')return false;
 const base=courseDraftProject(p);
 let draft=structuredClone(base);
 for(const edit of edits){
  draft.segments=draft.segments.map(scene=>scene.id===edit.sceneId?{...scene,content:[scene.content||scene.purpose,`本次修改要求：${edit.instruction}`,edit.referenceNames?.length?`参考图片：${edit.referenceNames.join('、')}`:''].filter(Boolean).join('\n\n')}:scene);
 }
 if(edits.length)draft={...draft,...prepareSceneEdit(base,draft,edits[0].sceneId)};
 const ids=edits.length?edits.map(e=>e.sceneId):draft.segments.map(s=>s.id);
 store.update(projectId,{courseDraft:{baseVersion:p.revision,snapshot:sceneSnapshot(draft),composition:draft.composition,sceneIds:[...new Set([...p.courseDraft?.sceneIds||[],...ids])],instruction:[p.courseDraft?.instruction,instruction].filter(Boolean).join('\n'),status:'draft'}});
 return true;
}

// Resource replacements join the same saved draft as scene and chat edits.
export function saveCourseResourceDraft(original:VideoProject,edited:VideoProject,sceneIds:string[]):boolean {
 const store=useVideoCoursewareStore.getState(),current=store.projects[original.id];
 if(!current||current.phase!=='ready'||current.revision!==original.revision||current.courseDraft?.status==='generating')return false;
 const base=courseDraftProject(current);
 if(JSON.stringify(sceneSnapshot(base))!==JSON.stringify(sceneSnapshot(original))||JSON.stringify(base.composition)!==JSON.stringify(original.composition))return false;
 store.update(current.id,{courseDraft:{baseVersion:current.revision,snapshot:sceneSnapshot(edited),composition:edited.composition,sceneIds:[...new Set([...current.courseDraft?.sceneIds||[],...sceneIds])],instruction:current.courseDraft?.instruction,status:'draft'}});
 return true;
}

export function startCourseDraft(projectId:string,now=Date.now()):boolean {
 const store=useVideoCoursewareStore.getState(),p=store.projects[projectId],draft=p.courseDraft;
 if(!draft||p.phase!=='ready'||draft.status==='generating')return false;
 const issues=videoPlanIssues(courseDraftProject(p));
 const error=draft.baseVersion!==p.revision?'视频互动课件版本已变化，请重新核对修改。':issues.length?[...new Set(issues)].join(' '):undefined;
 store.update(projectId,{courseDraft:{...draft,status:error?'failed':'generating',error,startedAt:error?undefined:now}});
 return !error;
}

// Local demonstration: replay prepared media, then replace one complete HTML.
// Never publish intermediate scene pages or mutate an old result snapshot.
export function advanceCourseDraft(projectId:string,now:number){
 const store=useVideoCoursewareStore.getState(),p=store.projects[projectId],draft=p.courseDraft;
 if(!draft||draft.status!=='generating'||now-(draft.startedAt??now)<9000)return;
 const candidate=courseDraftProject(p);
 const error=draft.baseVersion!==p.revision?'视频互动课件版本已变化，修改草稿已保留。':candidate.assets.some(a=>a.segmentIds.length&&!a.url)?'部分素材尚未就绪，请补全后重新生成。':!buildVideoLessonHTML(candidate)?'当前演示未接入本课的页面生成服务，修改草稿已保留。':undefined;
 if(error){store.update(projectId,{courseDraft:{...draft,status:'failed',error}});return;}
 store.update(projectId,{...sceneSnapshot(candidate),composition:candidate.composition,readySceneIds:candidate.segments.map(s=>s.id),readyPageIds:candidate.segments.filter(s=>s.kind!=='video').map(s=>s.id),readyAssetIds:candidate.assets.filter(a=>a.url).map(a=>a.id),courseDraft:undefined});
 finishVideoProject(projectId,undefined,'全部修改已确认，生成新的视频互动课件版本。');
}

export function discardCourseDraft(projectId:string){
 const store=useVideoCoursewareStore.getState(),p=store.projects[projectId];
 if(p.courseDraft?.status!=='generating')store.update(projectId,{courseDraft:undefined,pendingEdit:undefined,pendingEditAttachments:undefined});
}
