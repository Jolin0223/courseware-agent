import type { VideoProject } from '../../data/videoCourseware/model';

export function isVideoChatLocked(project: VideoProject) {
  return project.courseDraft?.status === 'generating' || project.revision < 1 || project.phase !== 'ready'
    || (project.workflowVersion !== 5 && Object.values(project.sceneRevisions || {}).some(revision => revision.status === 'generating'));
}
