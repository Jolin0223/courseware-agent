import type { VideoProject } from '../../data/videoCourseware/model';
import { rebaseSceneDraft, sceneSnapshot } from '../../data/videoCourseware/sceneRevision';
import { prepareSceneEdit } from '../../data/videoCourseware/sceneEditing';
import { advanceConfirmedScenes } from '../../data/videoCourseware/sceneJobs';
import { useVideoCoursewareStore } from '../../store/videoCoursewareStore';
import { useConversationStore } from '../../store/conversationStore';
import { beginSceneRevision, saveSceneRevisionDraft } from './sceneRevisionActions';

export function saveScenePlanDraft(original:VideoProject,draft:VideoProject,sceneId:string):'plan'|'revision'{
 const store=useVideoCoursewareStore.getState(),latest=store.projects[original.id];
 const rebased=rebaseSceneDraft(latest,{id:'edit',sceneId,baseVersion:original.revision,sourceVersion:original.revision,scope:'shared',status:'draft',base:sceneSnapshot(original),draft:sceneSnapshot(draft),baseComposition:original.composition,composition:draft.composition});
 // Generation may have finished while the teacher was editing. Never mutate the
 // newly delivered version or sneak unconfirmed edits into its assembly.
 if(latest.phase==='ready'){
  beginSceneRevision(latest.id,sceneId,latest.revision);
  saveSceneRevisionDraft(latest.id,sceneId,rebased);
  return 'revision';
 }
 const next={...latest,...prepareSceneEdit(latest,rebased,sceneId)};
 const progress=next.sceneJobs?advanceConfirmedScenes(next,Date.now()):{};
 store.update(latest.id,{...next,...progress,phase:'assets-review',job:undefined,approvedPlanKey:undefined});
 useConversationStore.getState().setWaitingForUserAction(latest.conversationId,true);
 return 'plan';
}
