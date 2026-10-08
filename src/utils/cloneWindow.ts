import type { Courseware, CoursewareResult } from '../types';
import type { VideoProject } from '../data/videoCourseware/model';
import { videoProjectStorage } from '../store/videoProjectStorage';
import { useVideoCoursewareStore } from '../store/videoCoursewareStore';
import { useConversationStore, getFrameworkForCourseware } from '../store/conversationStore';
import { useCoursewareStore } from '../store/coursewareStore';
import { buildVideoLessonHTML } from '../components/VideoCourseware/workflow';
import toast from './toast';

interface CloneRequest { courseware: Courseware; project?: VideoProject; }

export async function openCloneWindow(courseware: Courseware, version: string) {
  const target = window.open('about:blank', '_blank');
  if (!target) { toast('请允许打开新窗口后重试'); return; }
  target.opener = null;
  const token = crypto.randomUUID();
  try {
    const source = courseware.videoProjectId ? useVideoCoursewareStore.getState().projects[courseware.videoProjectId] : undefined;
    const result = source?.resultMessages.find(item => item.version === Number(version.match(/\d+/)?.[0]));
    const project = source ? { ...source, ...result?.snapshot, composition: result?.composition || source.composition } : undefined;
    await videoProjectStorage.setItem(`clone-request-${token}`, JSON.stringify({ courseware, project }));
    target.location.replace(`${location.origin}/?cloneRequest=${token}`);
  } catch {
    target.close();
    toast('暂时无法打开同款课件，请重试');
  }
}

export async function readCloneRequest(token: string): Promise<CloneRequest | null> {
  if (!useVideoCoursewareStore.persist.hasHydrated()) await new Promise<void>(resolve => {
    const stop = useVideoCoursewareStore.persist.onFinishHydration(() => { stop(); resolve(); });
  });
  const raw = await videoProjectStorage.getItem(`clone-request-${token}`);
  return raw ? JSON.parse(raw) : null;
}

export function createWindowClone({ courseware, project }: CloneRequest) {
  const clone = useConversationStore.getState().createCloneConversation(courseware.title, getFrameworkForCourseware(courseware.id), courseware.htmlContent);
  if (project) {
    const title = `${courseware.title.replace(/-同款版$/, '')}-同款版`;
    const fork: VideoProject = { ...structuredClone(project), ...clone, id: `video-${clone.conversationId}`, title,
      phase: 'ready', revision: 1, job: undefined, sceneRevisions: {}, sceneVersionHistory: {},
      segments: project.segments.map(scene => ({ ...structuredClone(scene), revision: 1 })), pendingEdit: undefined, pendingEditAttachments: undefined,
      publishedTargets: [], publishedVersions: {}, workflowRuns: {}, workflowEvents: [], workflowSnapshots: {}, resultMessages: [] };
    const html = buildVideoLessonHTML(fork);
    const conversation = useConversationStore.getState().conversations.find(item => item.id === clone.conversationId)!;
    const message = conversation.messages.find(item => item.type === 'courseware-result')!;
    fork.resultMessages = [{ id: message.id, version: 1, html, time: new Date().toISOString(), composition: structuredClone(fork.composition),
      snapshot: { assets: fork.assets, segments: fork.segments, speakers: fork.speakers, shots: fork.shots, chapters: fork.chapters, readyAssetIds: fork.readyAssetIds, readyPageIds: fork.readyPageIds, readySceneIds: fork.readySceneIds } }];
    useVideoCoursewareStore.getState().put(fork);
    useConversationStore.setState(state => ({ conversations: state.conversations.map(item => item.id !== clone.conversationId ? item : {
      ...item, messages: item.messages.map(entry => entry.id !== message.id ? entry : { ...entry, content: { ...(entry.content as CoursewareResult), title, htmlContent: html, videoProjectId: fork.id } }),
    }) }));
    useCoursewareStore.getState().addCourseware({ ...courseware, id: clone.coursewareId, title, htmlContent: html, videoProjectId: fork.id, isOwn: true, isPublished: false });
  }
  return clone;
}
