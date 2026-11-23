import type { VideoProject } from '../../data/videoCourseware/model';
import { materialsKey, videoPlanKey } from '../../data/videoCourseware/planning';
import { useVideoCoursewareStore } from '../../store/videoCoursewareStore';
import { useConversationStore } from '../../store/conversationStore';
import { useCoursewareStore } from '../../store/coursewareStore';
import { useUIStore } from '../../store/uiStore';

// Only the latest delivered modification can be undone; intermediate versions
// may be dependencies of later work and must never be removed independently.
export function latestUndoMessage(project?:VideoProject):string|undefined {
 if(!project||project.resultMessages.length<2||project.phase!=='ready')return;
 const latest=project.resultMessages.at(-1)!,previous=project.resultMessages.at(-2)!;
 if(!previous.snapshot)return;
 if(latest.sourceMessageId)return latest.sourceMessageId;
 // Compatibility for modifications saved before result/message linking existed.
 const edit=project.submittedEdits?.at(-1);
 if(edit?.baseVersion===previous.version&&latest.version===previous.version+1)return edit.message.id;
}

export function undoCourseRevision(projectId:string,messageId:string):string|undefined {
 const store=useVideoCoursewareStore.getState(),p=store.projects[projectId];
 if(latestUndoMessage(p)!==messageId)return '当前版本已变化，请重新查看后再试';
 if(p.courseDraft||p.job||Object.values(p.sceneRevisions||{}).some(r=>r.status==='generating'))return '请先完成或放弃当前修改草稿，再撤回上一轮修改';
 const latest=p.resultMessages.at(-1)!,previous=p.resultMessages.at(-2)!;
 const publication=p.publishedVersions?.[`v${latest.version}`];
 if(publication?.isCurrentPublished||publication?.isHistoricalPublished||publication?.isRemoved||p.publishedTargets?.some(t=>t.currentVersion===`v${latest.version}`))return '已发布的版本不能撤回';
 const chat=useConversationStore.getState(),conversation=chat.conversations.find(c=>c.id===p.conversationId);
 const start=conversation?.messages.findIndex(m=>m.id===messageId)??-1;
 if(start<0)return '未找到本次修改消息，请刷新后重试';
 const removedIds=new Set(conversation!.messages.slice(start).map(m=>m.id));
 const workflowEvents=p.workflowEvents?.filter(e=>!removedIds.has(e.runId)&&!removedIds.has(e.runId+'-confirmation'));
 const next:VideoProject={...p,...structuredClone(previous.snapshot!),composition:structuredClone(previous.composition||p.composition),revision:previous.version,
  resultMessages:p.resultMessages.slice(0,-1),submittedEdits:p.submittedEdits?.filter(e=>!removedIds.has(e.message.id)),workflowEvents,
  workflowRuns:Object.fromEntries(Object.entries(p.workflowRuns||{}).filter(([,id])=>!removedIds.has(id))),
  workflowSnapshots:Object.fromEntries(Object.entries(p.workflowSnapshots||{}).filter(([id])=>!removedIds.has(id))),
  publishedVersions:Object.fromEntries(Object.entries(p.publishedVersions||{}).filter(([version])=>version!==`v${latest.version}`)),
  phase:'ready',job:undefined,error:undefined,courseDraft:undefined,pendingEdit:undefined,pendingEditAttachments:undefined,
  sceneRevisions:undefined,sceneJobs:undefined,sceneReviews:undefined,sceneAssemblyStarts:undefined,sceneVersionHistory:undefined,
 };
 next.approvedMaterialsKey=materialsKey(next);next.approvedPlanKey=videoPlanKey(next);
 store.put(next);
 useConversationStore.setState(s=>({conversations:s.conversations.map(c=>c.id===p.conversationId?{...c,messages:c.messages.slice(0,start),isGenerating:false,waitingForUserAction:false}:c)}));
 useCoursewareStore.getState().updateCourseware(p.coursewareId,{htmlContent:previous.html});
 if(chat.activeConversationId===p.conversationId)useUIStore.getState().openPreview(p.coursewareId,`v${previous.version}`);
}
