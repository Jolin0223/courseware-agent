import type { VideoProject } from '../../data/videoCourseware/model';

export function isVideoChatLocked(project: VideoProject) {
  return project.revision < 1 || project.phase !== 'ready'
    || Object.values(project.sceneRevisions || {}).some(revision => revision.status === 'generating');
}
