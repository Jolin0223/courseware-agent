import { useVideoCoursewareStore, videoProjectForCourseware } from '../../store/videoCoursewareStore';
import { buildVideoLessonHTML, finishVideoProject } from '../VideoCourseware/workflow';
import { VideoModal } from '../VideoCourseware/Shared';
import VideoResourceEditor from '../VideoCourseware/VideoResourceEditor';
import { useEffect, useMemo, useState, useRef } from 'react';
import { Maximize2, X, Edit3, RefreshCw, Send, Download, Square, Globe, Monitor, Tablet, Users, GraduationCap, MessageSquarePlus, CheckCircle2, AlertCircle, Loader2, Copy, Trash2, Settings2 } from 'lucide-react';
import { useCoursewareStore } from '../../store/coursewareStore';
import { useUIStore } from '../../store/uiStore';
import { useConversationStore } from '../../store/conversationStore';
import { mockCoursewares } from '../../data/mockCoursewares';
import { demoPublishedTargets, demoSessionVersions } from '../../data/demoCoursewareVersions';
import type { CoursewareResult } from '../../types';
import type { PreviewAnnotation, PreviewAnnotationBatch } from '../../types/previewAnnotation';
import PublishModal from '../Library/PublishModal';
import toast from '../../utils/toast';

interface PreviewPanelProps {
  coursewareId: number | null;
  initialVersion?: string | null;
  onClose: () => void;
  onSubmitAnnotations?: (batch: PreviewAnnotationBatch) => void;
}

const PLACEHOLDER_HTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#94A3B8;font-size:16px;">课件预览区域</div>';

type PreviewDevice = 'default' | 'web' | 'bigscreen' | 'tablet' | 'cloud-teacher' | 'cloud-student';

const previewDevices: Array<{ id: PreviewDevice; label: string; icon: React.ReactNode }> = [
  { id: 'default', label: '默认预览', icon: <Square size={15} /> },
  { id: 'web', label: 'iTeach 网页', icon: <Globe size={15} /> },
  { id: 'bigscreen', label: '大屏老师好课', icon: <Monitor size={15} /> },
  { id: 'tablet', label: '学生小屏', icon: <Tablet size={15} /> },
  { id: 'cloud-teacher', label: '云教室老师端', icon: <Users size={15} /> },
  { id: 'cloud-student', label: '云教室学生端', icon: <GraduationCap size={15} /> },
];

type PublishMode = 'publish' | 'update' | 'new-game';

interface SessionHtmlVersion {
  version: string;
  sessionNumber: number;
  title: string;
  htmlContent?: string;
  createdAt: string;
  visualStylePrompt?: string;
  publishTargetId?: string;
  isCurrentPublished?: boolean;
  isHistoricalPublished?: boolean;
  isRemoved?: boolean;
}

interface PublishedGameTarget {
  id: string;
  name: string;
  currentVersion: string;
  urlLabel: string;
  resourceScope?: 'group' | 'school' | 'personal';
  schoolName?: string;
  subject?: string;
}

type ResourceUpdateResult = 'success' | 'failure';
type ResourceUpdateStatus = 'updating' | 'success' | 'failed';

interface PublishSuccessPayload {
  mode: PublishMode;
  result?: ResourceUpdateResult;
  scopeLabel: string;
  jobId?: string;
  resourceVersion?: string;
}

interface ResourceUpdateTask {
  jobId: string;
  resourceVersion: string;
  targetId: string;
  targetName: string;
  version: string;
  sessionNumber: number;
  title: string;
  scopeLabel: string;
  result: ResourceUpdateResult;
  status: ResourceUpdateStatus;
  remainingSeconds: number;
}

const REAL_CASE_TITLES = [
  '近义词大挑战',
  '单词神枪手',
  '比绳子长短',
  '孙悟空换装搭配挑战',
  '战舰逻辑挑战-行列推理',
  '转一转找答案-时钟认读',
  '分数披萨店-分数配餐',
  '对话连连看-问答连线',
  'Make-a-Word果冻拼词',
  '汉字拼图Rush-部件拼字',
];

const isRealCaseCourseware = (title?: string) => {
  return REAL_CASE_TITLES.some(caseTitle => title?.includes(caseTitle));
};

const buildSessionVersions = (courseware?: { id?: number; title?: string; htmlContent?: string; videoProjectId?: string; isPublished?: boolean } | null): SessionHtmlVersion[] => {
  if (!courseware) return [];
  if (courseware.title?.includes('水果单词互动乐园')) {
    return demoSessionVersions.map(version => ({ ...version }));
  }
  const videoProject = courseware.id ? videoProjectForCourseware(courseware.id) : undefined;
  if (videoProject) return videoProject.resultMessages.map(r => ({ version: `v${r.version}`, sessionNumber: r.version, title: videoProject.title, htmlContent: videoProject.workflowVersion === 5 ? buildVideoLessonHTML({ ...videoProject, ...(r.snapshot || {}) }, r.composition || videoProject.composition) : r.html, createdAt: r.time, ...videoProject.publishedVersions?.[`v${r.version}`] }));
  const baseHtml = courseware.htmlContent || '';
  const baseTitle = courseware.title || '互动课件';
  if (isRealCaseCourseware(baseTitle) || baseTitle.endsWith('-同款版')) {
    return [
      {
        version: 'v1',
        sessionNumber: 1,
        title: baseTitle,
        htmlContent: baseHtml,
        createdAt: '2026-06-15 10:00',
      },
    ];
  }
  return [
    {
      version: 'v1',
      sessionNumber: 1,
      title: baseTitle,
      htmlContent: baseHtml,
      publishTargetId: 'game-a',
      isHistoricalPublished: true,
      createdAt: '2026-05-14 18:27',
    },
    {
      version: 'v2',
      sessionNumber: 2,
      title: `${baseTitle}优化版`,
      htmlContent: baseHtml,
      publishTargetId: 'game-b',
      isCurrentPublished: true,
      createdAt: '2026-05-15 10:30',
    },
    {
      version: 'v3',
      sessionNumber: 3,
      title: baseTitle,
      htmlContent: baseHtml,
      publishTargetId: 'game-a',
      isCurrentPublished: true,
      createdAt: '2026-05-16 14:20',
    },
    {
      version: 'v4',
      sessionNumber: 4,
      title: `${baseTitle}当前版`,
      htmlContent: baseHtml,
      createdAt: '2026-06-01 17:10',
    },
  ];
};

const buildPublishedTargets = (courseware?: { id?:number; title?: string; subject?: string } | null): PublishedGameTarget[] => {
  if (courseware?.id && videoProjectForCourseware(courseware.id)) return videoProjectForCourseware(courseware.id)?.publishedTargets || [];
  if (courseware?.title?.includes('水果单词互动乐园')) {
    return demoPublishedTargets.map(target => ({ ...target }));
  }
  if (isRealCaseCourseware(courseware?.title)) {
    return [];
  }
  const baseTitle = courseware?.title || '互动课件';
  return [
    {
      id: 'game-a',
      name: baseTitle,
      currentVersion: 'v3',
      urlLabel: '固定链接 A',
      resourceScope: 'group' as const,
      subject: courseware?.subject || '英语',
    },
    {
      id: 'game-b',
      name: `${baseTitle}优化版`,
      currentVersion: 'v2',
      urlLabel: '固定链接 B',
      resourceScope: 'school' as const,
      schoolName: '广州学校',
      subject: courseware?.subject || '英语',
    },
  ];
};

export default function PreviewPanel({ coursewareId, initialVersion, onClose, onSubmitAnnotations }: PreviewPanelProps) {
  const { coursewares, updateCourseware } = useCoursewareStore();
  const conversations = useConversationStore((s) => s.conversations);
  const { appMode, insertCourseware } = useUIStore();
  const isEmbedded = appMode === 'embedded';

  const generatedCourseware = useMemo(() => {
    if (!coursewareId) return undefined;
    for (const conversation of conversations) {
      for (const message of conversation.messages) {
        if (message.type !== 'courseware-result') continue;
        const result = message.content as CoursewareResult;
        if (result.coursewareId !== coursewareId) continue;
        return {
          id: coursewareId,
          title: result.title,
          subject: '英语',
          grade: '一年级',
          type: '互动课件',
          author: '陈佳玲',
          publishTime: new Date(message.timestamp).toISOString().split('T')[0],
          views: 0,
          favorites: 0,
          likes: 0,
          htmlContent: result.htmlContent,
          thumbnail: result.thumbnail,
          isOwn: true,
          learningDataRecovery: result.learningDataRecovery,
          learningDataReportCapability: result.learningDataReportCapability,
        };
      }
    }
    return undefined;
  }, [conversations, coursewareId]);

  const courseware = useMemo(() => {
    const resolved = coursewares.find(c => c.id === coursewareId)
      || mockCoursewares.find(c => c.id === coursewareId)
      || generatedCourseware;
    if (!resolved) return resolved;
    if (resolved.title.includes('动物单词拼写') || resolved.htmlContent?.includes('动物单词拼写')) {
      return { ...mockCoursewares[0], id: resolved.id };
    }
    return resolved;
  }, [coursewareId, coursewares, generatedCourseware]);

  const versionSourceCourseware = useMemo(() => {
    if (coursewareId === 1 && courseware) {
      return { ...courseware, title: '水果单词互动乐园' };
    }
    return courseware;
  }, [courseware, coursewareId]);

  const [versions, setVersions] = useState<SessionHtmlVersion[]>(() => buildSessionVersions(versionSourceCourseware));

  const [publishedTargets, setPublishedTargets] = useState<PublishedGameTarget[]>(() => buildPublishedTargets(versionSourceCourseware));

  const [selectedVersion, setSelectedVersion] = useState(() => {
    const initialVersions = buildSessionVersions(versionSourceCourseware);
    return (initialVersion && initialVersions.some(version => version.version === initialVersion))
      ? initialVersion
      : initialVersions.at(-1)?.version || 'v1';
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [selectedUpdateTargetId, setSelectedUpdateTargetId] = useState<string | null>('game-b');
  const [publishMode, setPublishMode] = useState<PublishMode | null>(null);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('default');
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [videoResourcesOpen, setVideoResourcesOpen] = useState(false);
  const [coursewareSettingsOpen, setCoursewareSettingsOpen] = useState(false);
  const [showSceneNavigation, setShowSceneNavigation] = useState(true);
  const videoProject = coursewareId ? videoProjectForCourseware(coursewareId) : undefined;
  const [annotationModeOpen, setAnnotationModeOpen] = useState(false);
  const [annotations, setAnnotations] = useState<PreviewAnnotation[]>([]);
  const [draftAnnotation, setDraftAnnotation] = useState<Omit<PreviewAnnotation, 'id'> | null>(null);
  const [activeAnnotationId, setActiveAnnotationId] = useState<number | null>(null);
  const [annotationPageLabel, setAnnotationPageLabel] = useState('当前页面');
  const [isCapturingAnnotation, setIsCapturingAnnotation] = useState(false);
  const [hoveredHeaderButton, setHoveredHeaderButton] = useState<string | null>(null);
  const [resourceUpdateTask, setResourceUpdateTask] = useState<ResourceUpdateTask | null>(null);
  const publishBtnRef = useRef<HTMLDivElement>(null);
  const versionScrollRef = useRef<HTMLDivElement>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const resourceUpdateTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const resourceUpdateCountdownRef = useRef<ReturnType<typeof window.setInterval> | null>(null);

  const clearResourceUpdateTimers = () => {
    if (resourceUpdateTimerRef.current) {
      window.clearTimeout(resourceUpdateTimerRef.current);
      resourceUpdateTimerRef.current = null;
    }
    if (resourceUpdateCountdownRef.current) {
      window.clearInterval(resourceUpdateCountdownRef.current);
      resourceUpdateCountdownRef.current = null;
    }
  };

  useEffect(() => clearResourceUpdateTimers, []);

  useEffect(() => {
    const nextVersions = buildSessionVersions(versionSourceCourseware);
    clearResourceUpdateTimers();
    setResourceUpdateTask(null);
    setVersions(nextVersions);
    setPublishedTargets(buildPublishedTargets(versionSourceCourseware));
    setSelectedVersion(
      (initialVersion && nextVersions.some(version => version.version === initialVersion))
        ? initialVersion
        : nextVersions.at(-1)?.version || 'v1'
    );
    setSelectedUpdateTargetId('game-b');
    setIsEditing(false);
    setEditContent('');
    setFullscreenOpen(false);
    setAnnotationModeOpen(false);
    setAnnotations([]);
    setDraftAnnotation(null);
    setActiveAnnotationId(null);
    setAnnotationPageLabel('当前页面');
  }, [coursewareId, initialVersion, versionSourceCourseware?.htmlContent, versionSourceCourseware?.title]);

  useEffect(() => {
    if (!fullscreenOpen && !annotationModeOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFullscreenOpen(false);
        setAnnotationModeOpen(false);
        setDraftAnnotation(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenOpen, annotationModeOpen]);

  const currentVersion = versions.find(v => v.version === selectedVersion);
  const latestVersion = versions[versions.length - 1];
  const selectedUpdateTarget = publishedTargets.find(target => target.id === selectedUpdateTargetId) || publishedTargets[0];
  const hasPublishedTargets = publishedTargets.length > 0;
  const hasMultiplePublishedGames = publishedTargets.length > 1;
  const isRemovedVersion = !!currentVersion?.isRemoved;
  const isUnpublishedVersion = !!currentVersion && !currentVersion.isCurrentPublished && !currentVersion.isHistoricalPublished && !currentVersion.isRemoved;
  const canUpdateCurrentDraft = hasPublishedTargets && latestVersion && selectedVersion === latestVersion.version && isUnpublishedVersion;

  const srcDoc = currentVersion?.htmlContent || PLACEHOLDER_HTML;
  const currentTitle = currentVersion?.title || courseware?.title || '互动课件';
  const currentResourceId = currentVersion?.publishTargetId;
  const canCopyResourceId = Boolean(currentResourceId && (currentVersion?.isCurrentPublished || currentVersion?.isHistoricalPublished));

  const handleFullscreen = () => {
    setFullscreenOpen(true);
  };

  const resolveDeepPreviewPoint = (xPercent: number, yPercent: number) => {
    let frameWindow = previewIframeRef.current?.contentWindow || null;
    let frameDocument = previewIframeRef.current?.contentDocument || null;
    if (!frameWindow || !frameDocument) return null;
    let pointX = (xPercent / 100) * frameWindow.innerWidth;
    let pointY = (yPercent / 100) * frameWindow.innerHeight;

    for (let depth = 0; depth < 4; depth += 1) {
      const target = frameDocument.elementFromPoint(pointX, pointY) as HTMLElement | null;
      if (target?.tagName !== 'IFRAME') {
        return { frameWindow, frameDocument, pointX, pointY, target };
      }
      const nestedFrame = target as HTMLIFrameElement;
      const nestedWindow = nestedFrame.contentWindow;
      const nestedDocument = nestedFrame.contentDocument;
      if (!nestedWindow || !nestedDocument) {
        return { frameWindow, frameDocument, pointX, pointY, target };
      }
      const nestedRect = nestedFrame.getBoundingClientRect();
      if (!nestedRect.width || !nestedRect.height) {
        return { frameWindow, frameDocument, pointX, pointY, target };
      }
      pointX = ((pointX - nestedRect.left) / nestedRect.width) * nestedWindow.innerWidth;
      pointY = ((pointY - nestedRect.top) / nestedRect.height) * nestedWindow.innerHeight;
      frameWindow = nestedWindow;
      frameDocument = nestedDocument;
    }

    return {
      frameWindow,
      frameDocument,
      pointX,
      pointY,
      target: frameDocument.elementFromPoint(pointX, pointY) as HTMLElement | null,
    };
  };

  const resolveFramePageLabel = (
    target?: HTMLElement | null,
    sourceDocument?: Document | null,
    sourceWindow?: Window | null,
  ) => {
    const frameDocument = sourceDocument || previewIframeRef.current?.contentDocument;
    const frameWindow = sourceWindow || previewIframeRef.current?.contentWindow;
    const visiblePage = Array.from(frameDocument?.querySelectorAll<HTMLElement>('[data-scene-title], [data-scene], [data-page], [data-slide], [aria-current="page"], .scene, .page, .slide') || []).find(node => {
      const nodeRect = node.getBoundingClientRect();
      const style = frameWindow?.getComputedStyle(node);
      return nodeRect.width > 0 && nodeRect.height > 0 && style?.display !== 'none' && style?.visibility !== 'hidden' && style?.opacity !== '0';
    });
    const pageNode = target?.closest<HTMLElement>('[data-scene-title], [data-scene], [data-page], [data-slide], [aria-current="page"]') || visiblePage;
    const pageValue = pageNode?.dataset.sceneTitle
      || pageNode?.dataset.scene
      || pageNode?.dataset.page
      || pageNode?.dataset.slide
      || pageNode?.getAttribute('aria-label')
      || pageNode?.id;
    const hash = frameWindow?.location.hash.replace(/^#/, '').trim();
    return pageValue || hash || frameDocument?.title?.trim() || '当前页面';
  };

  const handleEdit = () => {
    if (isRemovedVersion) return;
    setFullscreenOpen(false);
    setPreviewDevice('default');
    if (!annotationModeOpen) setAnnotationPageLabel(resolveFramePageLabel());
    setAnnotationModeOpen(previous => !previous);
    setDraftAnnotation(null);
  };

  const handleSaveEdit = () => {
    const newVersionNum = versions.length + 1;
    const newVersion: SessionHtmlVersion = {
      version: `v${newVersionNum}`,
      sessionNumber: newVersionNum,
      title: currentVersion?.title || courseware?.title || '未命名互动课件',
      htmlContent: editContent,
      createdAt: new Date().toISOString(),
    };
    setVersions(prev => [...prev, newVersion]);
    setSelectedVersion(newVersion.version);
    setIsEditing(false);
    if (coursewareId) {
      updateCourseware(coursewareId, { htmlContent: editContent });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent('');
  };

  const handleCopyResourceId = async () => {
    if (!currentResourceId) return;
    try {
      await navigator.clipboard.writeText(currentResourceId);
      toast('资源ID已复制');
    } catch {
      toast('资源ID复制失败，请稍后重试');
    }
  };

  const handlePublish = () => {
    setPublishMode('publish');
  };

  const handleUpdatePublishClick = () => {
    setSelectedUpdateTargetId(selectedUpdateTargetId || publishedTargets[publishedTargets.length - 1]?.id || null);
    setPublishMode('update');
  };

  const saveVideoPublication = (nextVersions: SessionHtmlVersion[], nextTargets: PublishedGameTarget[]) => {
    if (!videoProject) return;
    useVideoCoursewareStore.getState().update(videoProject.id, {
      publishedTargets: nextTargets,
      publishedVersions: Object.fromEntries(nextVersions.map(v => [v.version, {
        publishTargetId: v.publishTargetId, isCurrentPublished: v.isCurrentPublished,
        isHistoricalPublished: v.isHistoricalPublished, isRemoved: v.isRemoved,
      }])),
    });
  };

  const applyReplacementSuccess = (task: ResourceUpdateTask) => {
    const nextVersions = versions.map(v => {
      if (v.version === task.version) return { ...v, publishTargetId: task.targetId, isCurrentPublished: true, isHistoricalPublished: false };
      if (v.publishTargetId === task.targetId && v.isCurrentPublished) return { ...v, isCurrentPublished: false, isHistoricalPublished: true };
      return v;
    });
    const nextTargets = publishedTargets.map(target => target.id === task.targetId
      ? { ...target, currentVersion: task.version, name: task.title } : target);
    setVersions(nextVersions);
    setPublishedTargets(nextTargets);
    saveVideoPublication(nextVersions, nextTargets);
  };

  const startResourceUpdateSimulation = (task: Omit<ResourceUpdateTask, 'status' | 'remainingSeconds'>, durationSeconds?: number) => {
    const totalSeconds = durationSeconds ?? (task.result === 'success' ? 8 : 7);
    clearResourceUpdateTimers();
    setResourceUpdateTask({
      ...task,
      status: 'updating',
      remainingSeconds: totalSeconds,
    });
    resourceUpdateCountdownRef.current = window.setInterval(() => {
      setResourceUpdateTask(prev => {
        if (!prev || prev.jobId !== task.jobId || prev.status !== 'updating') return prev;
        return { ...prev, remainingSeconds: Math.max(0, prev.remainingSeconds - 1) };
      });
    }, 1000);
    resourceUpdateTimerRef.current = window.setTimeout(() => {
      clearResourceUpdateTimers();
      if (task.result === 'success') {
        const completedTask = { ...task, status: 'success' as const, remainingSeconds: 0 };
        applyReplacementSuccess(completedTask);
        setResourceUpdateTask(null);
        toast(`已替换并同步到${task.scopeLabel}中~`);
        return;
      }
      setResourceUpdateTask({
        ...task,
        status: 'failed',
        remainingSeconds: 0,
      });
      toast('更新替换失败，请再试一次~');
    }, totalSeconds * 1000);
  };

  const handleRetryResourceUpdate = () => {
    if (!resourceUpdateTask || resourceUpdateTask.status !== 'failed') return;
    startResourceUpdateSimulation({
      ...resourceUpdateTask,
      jobId: `${resourceUpdateTask.jobId}-R`,
      result: 'success',
    }, 6);
    toast('更新替换已提交，预计 30 秒内生效~');
  };

  const handlePublishSuccess = (payload?: PublishSuccessPayload) => {
    if (publishMode === 'update' && selectedUpdateTarget && currentVersion) {
      startResourceUpdateSimulation({
        jobId: payload?.jobId || `UPDATE-${Date.now().toString().slice(-6)}`,
        resourceVersion: payload?.resourceVersion || `rv-${selectedVersion}-${Date.now().toString().slice(-5)}`,
        targetId: selectedUpdateTarget.id,
        targetName: selectedUpdateTarget.name,
        version: selectedVersion,
        sessionNumber: currentVersion.sessionNumber,
        title: currentTitle,
        scopeLabel: payload?.scopeLabel || '资源库',
        result: payload?.result || 'success',
      });
      setPublishMode(null);
      setSelectedUpdateTargetId(null);
      return;
    }
    if (publishMode === 'publish' || publishMode === 'new-game') {
      const nextId = `game-${publishedTargets.length + 1}`;
      const targetName = currentTitle;
      const nextTargets: PublishedGameTarget[] = [...publishedTargets, {
        id: nextId, name: targetName, currentVersion: selectedVersion,
        urlLabel: `固定链接 ${publishedTargets.length + 1}`, resourceScope: 'school',
        schoolName: '广州学校', subject: courseware?.subject || '英语',
      }];
      const nextVersions = versions.map(v => v.version === selectedVersion
        ? { ...v, publishTargetId: nextId, isCurrentPublished: true, isHistoricalPublished: false } : v);
      setPublishedTargets(nextTargets);
      setVersions(nextVersions);
      saveVideoPublication(nextVersions, nextTargets);
    }
    setPublishMode(null);
    setSelectedUpdateTargetId(null);
  };

  if (!courseware) return null;

  const getVersionPublishLabel = (version: SessionHtmlVersion) => {
    if (version.isRemoved) return '已下架';
    if (version.isCurrentPublished) return '当前发布';
    if (version.isHistoricalPublished) return '已发布(历史版本)';
    return '未发布草稿';
  };

  const getVersionMainLabel = (version: SessionHtmlVersion) => {
    const prefix = `第${version.sessionNumber}版`;
    return hasMultiplePublishedGames ? `${prefix} · ${version.title}` : prefix;
  };

  const updateTargetOptions = publishedTargets.map(target => {
    const linkedVersion = versions.find(v => v.version === target.currentVersion);
    return {
      id: target.id,
      name: target.name,
      currentSessionNumber: linkedVersion?.sessionNumber,
      nextSessionNumber: currentVersion?.sessionNumber,
      urlLabel: target.urlLabel,
      resourceScope: target.resourceScope,
      schoolName: target.schoolName,
      subject: target.subject,
    };
  });

  const isResourceUpdateInProgress = resourceUpdateTask?.status === 'updating';
  const publishBtnText = canUpdateCurrentDraft
    ? '替换'
    : currentVersion?.isRemoved
      ? '已下架'
      : currentVersion?.isCurrentPublished
      ? '已发布'
      : currentVersion?.isHistoricalPublished
        ? '已发布(历史版本)'
        : '发布';
  const publishBtnDisabled = isResourceUpdateInProgress || ((currentVersion?.isCurrentPublished || currentVersion?.isHistoricalPublished || currentVersion?.isRemoved) && !canUpdateCurrentDraft);
  const getActionButtonStyle = (
    key: string,
    variant: 'primary' | 'warning' | 'disabled',
  ): React.CSSProperties => ({
    ...panelStyle.actionBtn,
    ...(variant === 'primary' ? panelStyle.actionBtnPrimary : {}),
    ...(variant === 'warning' ? panelStyle.actionBtnWarning : {}),
    ...(variant === 'disabled' ? panelStyle.actionBtnDisabled : {}),
    ...(hoveredHeaderButton === key && variant !== 'disabled' ? panelStyle.actionBtnHover : {}),
  });
  const getIconButtonStyle = (key: string, disabled = false): React.CSSProperties => ({
    ...panelStyle.iconBtn,
    ...(hoveredHeaderButton === key && !disabled ? panelStyle.iconBtnHover : {}),
    ...(disabled ? panelStyle.iconBtnDisabled : {}),
  });
  const renderHeaderTooltip = (key: string, text: string) => (
    hoveredHeaderButton === key ? (
      <div style={panelStyle.headerTooltip}>
        {text}
        <span style={panelStyle.headerTooltipArrow} />
      </div>
    ) : null
  );
  const renderPublishActions = (options?: { exitFullscreenFirst?: boolean; exitAnnotationFirst?: boolean }) => {
    const exitFullscreenFirst = options?.exitFullscreenFirst;
    const exitAnnotationFirst = options?.exitAnnotationFirst;
    const runOutsideFullscreen = (action: () => void) => {
      if (exitFullscreenFirst) setFullscreenOpen(false);
      if (exitAnnotationFirst) setAnnotationModeOpen(false);
      action();
    };

    if (isResourceUpdateInProgress) {
      return (
        <div ref={exitFullscreenFirst ? undefined : publishBtnRef} style={{ position: 'relative', display: 'flex', gap: 6 }}>
          <button type="button" disabled style={getActionButtonStyle('updating', 'disabled')} title="更新替换中">
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            更新替换中
          </button>
        </div>
      );
    }

    if (publishBtnDisabled) {
      return (
        <div ref={exitFullscreenFirst ? undefined : publishBtnRef} style={{ position: 'relative', display: 'flex', gap: 6 }}>
          <button type="button" disabled style={getActionButtonStyle('published-disabled', 'disabled')} title={publishBtnText}>
            <CheckCircle2 size={14} />
            {publishBtnText}
          </button>
        </div>
      );
    }

    return (
      <div ref={exitFullscreenFirst ? undefined : publishBtnRef} style={{ position: 'relative', display: 'flex', gap: 6 }}>
        {canUpdateCurrentDraft ? (
          <>
            <button
              onClick={() => runOutsideFullscreen(resourceUpdateTask?.status === 'failed' ? handleRetryResourceUpdate : handleUpdatePublishClick)}
              onMouseEnter={() => setHoveredHeaderButton(resourceUpdateTask?.status === 'failed' ? 'retry-replace' : 'replace')}
              onMouseLeave={() => setHoveredHeaderButton(prev => (prev === 'replace' || prev === 'retry-replace') ? null : prev)}
              style={getActionButtonStyle(resourceUpdateTask?.status === 'failed' ? 'retry-replace' : 'replace', 'warning')}
              title={resourceUpdateTask?.status === 'failed' ? '再试一次' : '替换'}
            >
              {resourceUpdateTask?.status === 'failed' ? <AlertCircle size={14} /> : <RefreshCw size={14} />}
              {resourceUpdateTask?.status === 'failed' ? '再试一次' : '替换'}
            </button>
            <button
              onClick={() => runOutsideFullscreen(() => setPublishMode('new-game'))}
              onMouseEnter={() => setHoveredHeaderButton('new-game')}
              onMouseLeave={() => setHoveredHeaderButton(prev => prev === 'new-game' ? null : prev)}
              style={getActionButtonStyle('new-game', 'primary')}
              title="发布"
            >
              <Send size={14} />
              发布
            </button>
          </>
        ) : (
            <button
              onClick={() => runOutsideFullscreen(handlePublish)}
              onMouseEnter={() => setHoveredHeaderButton('publish')}
              onMouseLeave={() => setHoveredHeaderButton(prev => prev === 'publish' ? null : prev)}
              style={getActionButtonStyle('publish', 'primary')}
              title={publishBtnText}
            >
              <Send size={14} />
            {publishBtnText}
          </button>
        )}
      </div>
    );
  };

  const handleFullscreenEdit = () => {
    setFullscreenOpen(false);
    if (videoProject) { setVideoResourcesOpen(true); return; }
    handleEdit();
  };

  const handleAnnotationSurfaceClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const deepPoint = resolveDeepPreviewPoint(x, y);
    const frameWindow = deepPoint?.frameWindow;
    const frameDocument = deepPoint?.frameDocument;
    let pageLabel = resolveFramePageLabel();
    let targetText: string | undefined;
    let targetTag: string | undefined;
    let videoTimeSeconds: number | undefined;

    try {
      const target = deepPoint?.target || null;
      pageLabel = resolveFramePageLabel(target, frameDocument, frameWindow);

      const rawTargetText = target?.getAttribute('aria-label')
        || target?.getAttribute('title')
        || target?.innerText
        || target?.textContent
        || '';
      const normalizedTargetText = rawTargetText.replace(/\s+/g, ' ').trim();
      if (normalizedTargetText) targetText = normalizedTargetText.slice(0, 48);
      if (target?.tagName) targetTag = target.tagName.toLowerCase();

      const visibleVideo = Array.from(frameDocument?.querySelectorAll('video') || []).find(video => {
        const videoRect = video.getBoundingClientRect();
        return videoRect.width > 0 && videoRect.height > 0;
      });
      if (visibleVideo && Number.isFinite(visibleVideo.currentTime)) videoTimeSeconds = visibleVideo.currentTime;
    } catch {
      // srcDoc is same-origin in this demo; coordinates remain a reliable fallback.
    }

    setDraftAnnotation({
      x: Math.max(3, Math.min(97, x)),
      y: Math.max(3, Math.min(97, y)),
      text: '',
      pageLabel,
      deviceLabel: previewDevices.find(device => device.id === previewDevice)?.label || '默认预览',
      targetText,
      targetTag,
      videoTimeSeconds,
      viewportWidth: Math.round(frameWindow?.innerWidth || rect.width),
      viewportHeight: Math.round(frameWindow?.innerHeight || rect.height),
    });
    setAnnotationPageLabel(pageLabel);
    setActiveAnnotationId(null);
  };

  const captureAnnotationScreenshot = async (annotation: Omit<PreviewAnnotation, 'id'>, id: number) => {
    const deepPoint = resolveDeepPreviewPoint(annotation.x, annotation.y);
    const frameWindow = deepPoint?.frameWindow;
    const frameDocument = deepPoint?.frameDocument;
    if (!deepPoint || !frameWindow || !frameDocument?.documentElement) return undefined;
    const captureElement = (frameDocument.querySelector('#stage') as HTMLElement | null) || frameDocument.documentElement;
    const captureRect = captureElement.getBoundingClientRect();

    const isVisibleMedia = (node: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) => {
      const nodeRect = node.getBoundingClientRect();
      const style = frameWindow.getComputedStyle(node);
      if (!nodeRect.width || !nodeRect.height || style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
      if (node.tagName === 'IMG') return (node as HTMLImageElement).complete && Boolean((node as HTMLImageElement).naturalWidth);
      if (node.tagName === 'VIDEO') return (node as HTMLVideoElement).readyState >= 2;
      return true;
    };

    const drawMarkerAndCrop = (source: HTMLCanvasElement) => {
      const sourcePointX = ((deepPoint.pointX - captureRect.left) / captureRect.width) * source.width;
      const sourcePointY = ((deepPoint.pointY - captureRect.top) / captureRect.height) * source.height;
      const cropWidth = Math.min(560, source.width);
      const cropHeight = Math.min(315, source.height);
      const cropX = Math.max(0, Math.min(source.width - cropWidth, sourcePointX - cropWidth / 2));
      const cropY = Math.max(0, Math.min(source.height - cropHeight, sourcePointY - cropHeight / 2));
      const output = document.createElement('canvas');
      output.width = cropWidth;
      output.height = cropHeight;
      const context = output.getContext('2d');
      if (!context) return undefined;
      context.drawImage(source, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      const markerX = sourcePointX - cropX;
      const markerY = sourcePointY - cropY;
      context.beginPath();
      context.arc(markerX, markerY, 15, 0, Math.PI * 2);
      context.fillStyle = '#0274FC';
      context.fill();
      context.lineWidth = 3;
      context.strokeStyle = '#FFFFFF';
      context.stroke();
      context.fillStyle = '#FFFFFF';
      context.font = '800 13px system-ui, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(String(id), markerX, markerY + 0.5);
      return {
        dataUrl: output.toDataURL('image/jpeg', 0.82),
        width: output.width,
        height: output.height,
      };
    };

    const visibleCover = Array.from(captureElement.querySelectorAll<HTMLImageElement>('#cover img'))
      .find(node => isVisibleMedia(node));
    if (visibleCover) {
      const source = document.createElement('canvas');
      source.width = Math.max(1, Math.round(captureElement.scrollWidth || captureRect.width));
      source.height = Math.max(1, Math.round(captureElement.scrollHeight || captureRect.height));
      const context = source.getContext('2d');
      if (context) {
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, source.width, source.height);
        try {
          context.drawImage(visibleCover, 0, 0, source.width, source.height);
          const captured = drawMarkerAndCrop(source);
          if (captured) return captured;
        } catch {
          // Continue with the bounded DOM capture below when media taints the canvas.
        }
      }
    }

    const paintVisibleMedia = (canvas: HTMLCanvasElement) => {
      const context = canvas.getContext('2d');
      if (!context || !captureRect.width || !captureRect.height) return;
      const mediaNodes = Array.from(captureElement.querySelectorAll<HTMLImageElement | HTMLVideoElement | HTMLCanvasElement>('img, video, canvas'));
      mediaNodes.forEach(node => {
        if (!isVisibleMedia(node)) return;
        const nodeRect = node.getBoundingClientRect();
        const isFullStageMedia = Boolean(node.closest('#cover'))
          || node.classList.contains('backdrop')
          || node.classList.contains('scene-video');
        if (isFullStageMedia) {
          try {
            context.drawImage(node, 0, 0, canvas.width, canvas.height);
          } catch {
            // Keep the DOM capture when a media element cannot be painted.
          }
          return;
        }
        const x = ((nodeRect.left - captureRect.left) / captureRect.width) * canvas.width;
        const y = ((nodeRect.top - captureRect.top) / captureRect.height) * canvas.height;
        const width = (nodeRect.width / captureRect.width) * canvas.width;
        const height = (nodeRect.height / captureRect.height) * canvas.height;
        try {
          context.drawImage(node, x, y, width, height);
        } catch {
          // Cross-origin media cannot be painted client-side; the DOM capture remains available.
        }
      });
    };

    const fallbackScreenshot = () => {
      const fallback = document.createElement('canvas');
      fallback.width = Math.max(1, Math.round(captureRect.width || frameWindow.innerWidth));
      fallback.height = Math.max(1, Math.round(captureRect.height || frameWindow.innerHeight));
      const context = fallback.getContext('2d');
      if (!context) return undefined;
      const background = frameWindow.getComputedStyle(captureElement).backgroundColor;
      context.fillStyle = background && background !== 'rgba(0, 0, 0, 0)' ? background : '#FFFFFF';
      context.fillRect(0, 0, fallback.width, fallback.height);
      paintVisibleMedia(fallback);
      try {
        return drawMarkerAndCrop(fallback);
      } catch {
        return undefined;
      }
    };

    // The 1920×1080 lesson stage contains large animated media. Painting its
    // visible media directly is both faithful and fast; a full DOM clone can
    // otherwise block the annotation action for tens of seconds in production.
    if (captureElement.id === 'stage') return fallbackScreenshot();

    try {
      const screenshot = await Promise.race<HTMLCanvasElement | null>([
        import('html2canvas').then(({ default: html2canvas }) => html2canvas(captureElement, {
          backgroundColor: '#FFFFFF',
          logging: false,
          useCORS: true,
          allowTaint: false,
          scale: captureElement.id === 'stage' ? 0.5 : 1,
          width: captureElement.scrollWidth || frameWindow.innerWidth,
          height: captureElement.scrollHeight || frameWindow.innerHeight,
          windowWidth: frameWindow.innerWidth,
          windowHeight: frameWindow.innerHeight,
          scrollX: -frameWindow.scrollX,
          scrollY: -frameWindow.scrollY,
        })),
        new Promise<null>(resolve => window.setTimeout(() => resolve(null), 6000)),
      ]);
      if (!screenshot) return fallbackScreenshot();
      paintVisibleMedia(screenshot);
      return drawMarkerAndCrop(screenshot);
    } catch {
      return fallbackScreenshot();
    }
  };

  const handleSaveAnnotation = async () => {
    const text = draftAnnotation?.text.trim();
    if (!draftAnnotation || !text || isCapturingAnnotation) return;
    const id = annotations.length ? Math.max(...annotations.map(item => item.id)) + 1 : 1;
    setIsCapturingAnnotation(true);
    const screenshot = await captureAnnotationScreenshot(draftAnnotation, id);
    setAnnotations(prev => [...prev, {
      ...draftAnnotation,
      id,
      text,
      screenshotDataUrl: screenshot?.dataUrl,
      screenshotWidth: screenshot?.width,
      screenshotHeight: screenshot?.height,
    }]);
    setActiveAnnotationId(null);
    setDraftAnnotation(null);
    setIsCapturingAnnotation(false);
  };

  const handleCancelAnnotationMode = () => {
    setAnnotationModeOpen(false);
    setDraftAnnotation(null);
  };

  const handleSubmitAnnotations = () => {
    if (!coursewareId || annotations.length === 0) return;
    onSubmitAnnotations?.({
      coursewareId,
      coursewareTitle: currentTitle,
      version: selectedVersion,
      versionLabel: `第${currentVersion?.sessionNumber || 1}版`,
      createdAt: new Date().toISOString(),
      annotations,
    });
    setAnnotationModeOpen(false);
    setDraftAnnotation(null);
    toast(`已将 ${annotations.length} 条标注带入修改框`);
  };

  return (
    <div style={panelStyle.container}>
      {/* Header */}
      <div style={panelStyle.header}>
        <div style={panelStyle.headerLeft}>
          <div style={panelStyle.titleStack}>
            <span style={panelStyle.title}>{currentTitle}</span>
            <div style={panelStyle.subTitleRow}>
              <span style={panelStyle.subTitle}>第{currentVersion?.sessionNumber || 1}版 · {currentVersion ? getVersionPublishLabel(currentVersion) : '未发布草稿'}</span>
              {canCopyResourceId && currentResourceId && (
                <button
                  type="button"
                  onClick={handleCopyResourceId}
                  onMouseEnter={() => setHoveredHeaderButton('resource-id')}
                  onMouseLeave={() => setHoveredHeaderButton(prev => prev === 'resource-id' ? null : prev)}
                  style={{
                    ...panelStyle.resourceIdBtn,
                    ...(hoveredHeaderButton === 'resource-id' ? panelStyle.resourceIdBtnHover : {}),
                  }}
                  aria-label="复制资源ID"
                >
                  <Copy size={11} />
                  <span style={panelStyle.resourceIdText}>资源ID</span>
                </button>
              )}
            </div>
          </div>
        </div>
        <div style={panelStyle.headerRight}>
          {renderPublishActions()}
          {isEmbedded && courseware && !isRemovedVersion && (
            <button
              onClick={() => {
                insertCourseware({
                  id: courseware.id,
                  title: courseware.title,
                  version: selectedVersion,
                  htmlContent: srcDoc,
                  slideIndex: 0,
                  hasUpdate: false,
                });
                toast(`"${courseware.title}" 已插入课件`);
                onClose();
              }}
              onMouseEnter={() => setHoveredHeaderButton('insert')}
              onMouseLeave={() => setHoveredHeaderButton(prev => prev === 'insert' ? null : prev)}
              style={getActionButtonStyle('insert', 'warning')}
              title="插入课件"
            >
              <Download size={14} />
              插入课件
            </button>
          )}
          <div style={panelStyle.headerIconWrap}>
            <button
              type="button"
              onClick={handleFullscreen}
              onMouseEnter={() => setHoveredHeaderButton('fullscreen')}
              onMouseLeave={() => setHoveredHeaderButton(prev => prev === 'fullscreen' ? null : prev)}
              style={getIconButtonStyle('fullscreen')}
              aria-label="全屏预览并测试"
            >
              <Maximize2 size={15} />
            </button>
            {renderHeaderTooltip('fullscreen', '全屏预览并测试')}
          </div>
          {videoProject?.workflowVersion === 5 && selectedVersion === latestVersion?.version && !isRemovedVersion && (
            <div style={panelStyle.headerIconWrap}>
              <button
                type="button"
                onClick={() => { setShowSceneNavigation(videoProject.composition.showSceneNavigation !== false); setCoursewareSettingsOpen(true); }}
                onMouseEnter={() => setHoveredHeaderButton('courseware-settings')}
                onMouseLeave={() => setHoveredHeaderButton(prev => prev === 'courseware-settings' ? null : prev)}
                style={getIconButtonStyle('courseware-settings')}
                aria-label="课件设置"
              >
                <Settings2 size={15} />
              </button>
              {renderHeaderTooltip('courseware-settings', '课件设置')}
            </div>
          )}
          <div style={panelStyle.headerIconWrap}>
            <button
              type="button"
              onClick={handleEdit}
              disabled={isRemovedVersion}
              onMouseEnter={() => setHoveredHeaderButton('edit')}
              onMouseLeave={() => setHoveredHeaderButton(prev => prev === 'edit' ? null : prev)}
              style={{
                ...getIconButtonStyle('edit', isRemovedVersion),
                ...(annotationModeOpen ? panelStyle.annotationEntryActive : {}),
              }}
              aria-label={isRemovedVersion ? '已下架资源不可标注' : '标注修改'}
            >
              <MessageSquarePlus size={15} />
              {annotations.length > 0 && <span style={panelStyle.annotationEntryCount}>{annotations.length}</span>}
            </button>
            {renderHeaderTooltip('edit', isRemovedVersion ? '已下架资源不可标注' : '标注修改')}
          </div>
          <div style={panelStyle.headerIconWrap}>
            <button
              type="button"
              onClick={onClose}
              onMouseEnter={() => setHoveredHeaderButton('close')}
              onMouseLeave={() => setHoveredHeaderButton(prev => prev === 'close' ? null : prev)}
              style={getIconButtonStyle('close')}
              aria-label="关闭"
            >
              <X size={15} />
            </button>
            {renderHeaderTooltip('close', '关闭')}
          </div>
        </div>
      </div>

      {publishMode && coursewareId && (
        <PublishModal
          coursewareId={coursewareId}
          mode={publishMode}
          onClose={() => setPublishMode(null)}
          onPublishSuccess={handlePublishSuccess}
          updateTargets={updateTargetOptions}
          selectedUpdateTargetId={selectedUpdateTargetId}
          onUpdateTargetChange={setSelectedUpdateTargetId}
        />
      )}

      {videoResourcesOpen && videoProject && <VideoResourceEditor projectId={videoProject.id} onClose={() => setVideoResourcesOpen(false)}/>}
      {coursewareSettingsOpen && videoProject && (
        <VideoModal title="课件设置" onClose={() => setCoursewareSettingsOpen(false)} className="vc-courseware-settings-modal">
          <label className="vc-courseware-setting-row">
            <span><strong>显示场景目录</strong><small>播放整课时，老师可通过画布左侧目录跳到指定教学环节。</small></span>
            <input type="checkbox" checked={showSceneNavigation} onChange={event => setShowSceneNavigation(event.target.checked)} />
            <span className="vc-courseware-setting-switch" aria-hidden="true" />
          </label>
          <div className="vc-actions">
            <button type="button" className="vc-btn" onClick={() => setCoursewareSettingsOpen(false)}>取消</button>
            <button type="button" className="vc-btn primary" disabled={showSceneNavigation === (videoProject.composition.showSceneNavigation !== false)} onClick={() => {
              finishVideoProject(videoProject.id, { ...videoProject.composition, showSceneNavigation });
              setCoursewareSettingsOpen(false);
              toast('课件设置已保存为新版本');
            }}>保存为新版本</button>
          </div>
        </VideoModal>
      )}

      {fullscreenOpen && (
        <div style={panelStyle.fullscreenMask}>
          <div style={panelStyle.fullscreenHeader}>
            <span style={panelStyle.fullscreenTitle}>{currentTitle}</span>
            <div style={panelStyle.fullscreenActions}>
              {renderPublishActions({ exitFullscreenFirst: true })}
              <button
                onClick={handleFullscreenEdit}
                disabled={isRemovedVersion}
                style={{
                  ...panelStyle.fullscreenActionBtn,
                  ...(isRemovedVersion ? { color: '#CBD5E1', cursor: 'default', background: '#F8FAFC' } : {}),
                }}
                title={isRemovedVersion ? '已下架资源不可编辑' : '编辑资源'}
              >
                <Edit3 size={14} />
                编辑资源
              </button>
              <button onClick={() => setFullscreenOpen(false)} style={panelStyle.fullscreenClose} title="退出全屏">
                <X size={18} />
                退出全屏
              </button>
            </div>
          </div>
          <iframe
            srcDoc={srcDoc}
            title={`${currentTitle} 全屏预览`}
            sandbox="allow-scripts allow-same-origin"
            style={panelStyle.fullscreenIframe}
          />
        </div>
      )}

      {/* Content */}
      {isEditing ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            style={panelStyle.editor}
            spellCheck={false}
          />
          <div style={panelStyle.editorActions}>
            <button onClick={handleCancelEdit} style={panelStyle.cancelBtn}>取消</button>
            <button onClick={handleSaveEdit} style={panelStyle.saveBtn}>保存为新版本</button>
          </div>
        </div>
      ) : (
        <div style={panelStyle.previewArea}>
          {/* Device Switcher */}
          <div style={panelStyle.deviceSwitcher}>
            {previewDevices.map(device => {
              return (
                <button
                  key={device.id}
                  onClick={() => setPreviewDevice(device.id)}
                  style={{
                    ...panelStyle.deviceTab,
                    background: previewDevice === device.id ? 'var(--agent-soft)' : 'transparent',
                    color: previewDevice === device.id ? 'var(--agent-primary)' : '#64748B',
                    borderBottom: previewDevice === device.id ? '2px solid var(--agent-primary)' : '2px solid transparent',
                  }}
                  title={device.label}
                >
                  {device.icon}
                  {device.label}
                </button>
              );
            })}
          </div>

          {annotationModeOpen && (
            <div style={panelStyle.annotationInlineBar}>
              <div style={panelStyle.annotationInlineGuide}>
                <span style={panelStyle.annotationInlineIcon}><MessageSquarePlus size={14} /></span>
                <span style={panelStyle.annotationInlineCopy}>
                  <strong>标注修改</strong>
                  <small>点击课件中需要调整的位置</small>
                </span>
              </div>
              <div style={panelStyle.annotationInlineActions}>
                <span style={panelStyle.annotationInlineCount}>
                  本页 {annotations.filter(annotation => annotation.pageLabel === annotationPageLabel).length} 处 · 全部 {annotations.length} 处
                </span>
                <button type="button" onClick={handleCancelAnnotationMode} style={panelStyle.annotationInlineCancel}>取消</button>
                <button
                  type="button"
                  onClick={handleSubmitAnnotations}
                  disabled={annotations.length === 0}
                  style={{
                    ...panelStyle.annotationInlineSubmit,
                    ...(annotations.length === 0 ? panelStyle.annotationInlineSubmitDisabled : {}),
                  }}
                >
                  带入修改框
                </button>
              </div>
            </div>
          )}

          {/* Preview Container */}
          <div style={panelStyle.previewContainer}>
            {currentVersion?.visualStylePrompt && (
              <div style={panelStyle.stylePromptNote}>
                <span style={panelStyle.stylePromptLabel}>画面优化说明</span>
                <span style={panelStyle.stylePromptText}>{currentVersion.visualStylePrompt}</span>
              </div>
            )}
            <div style={panelStyle.previewStageWrap}>
              {previewDevice === 'default' ? (
                <div style={panelStyle.defaultFrame}>
                  <iframe
                    ref={previewIframeRef}
                    srcDoc={srcDoc}
                    title={`${currentTitle} 默认预览`}
                    sandbox="allow-scripts allow-same-origin"
                    style={panelStyle.defaultIframe}
                  />
                  {annotationModeOpen && (
                    <div style={panelStyle.annotationLayer} onClick={handleAnnotationSurfaceClick}>
                      {annotations.filter(annotation => annotation.pageLabel === annotationPageLabel).map(annotation => {
                        const active = annotation.id === activeAnnotationId;
                        return (
                          <button
                            key={annotation.id}
                            type="button"
                            style={{
                              ...panelStyle.annotationPin,
                              left: `${annotation.x}%`,
                              top: `${annotation.y}%`,
                              ...(active ? panelStyle.annotationPinActive : {}),
                            }}
                            onClick={(event) => {
                              event.stopPropagation();
                              setActiveAnnotationId(active ? null : annotation.id);
                            }}
                            aria-label={`标注 ${annotation.id}：${annotation.text}`}
                          >
                            {annotation.id}
                          </button>
                        );
                      })}

                      {annotations.filter(annotation => annotation.pageLabel === annotationPageLabel).map(annotation => annotation.id === activeAnnotationId ? (
                        <div
                          key={`detail-${annotation.id}`}
                          style={{
                            ...panelStyle.annotationDetail,
                            left: `${annotation.x}%`,
                            top: `${annotation.y}%`,
                            transform: `translate(${annotation.x > 55 ? 'calc(-100% - 18px)' : '18px'}, ${annotation.y > 65 ? 'calc(-100% + 18px)' : '-18px'})`,
                          }}
                          onClick={event => event.stopPropagation()}
                        >
                          <div style={panelStyle.annotationDetailHeader}>
                            <span>标注 {annotation.id}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setAnnotations(previous => previous.filter(item => item.id !== annotation.id));
                                setActiveAnnotationId(null);
                              }}
                              style={panelStyle.annotationDeleteBtn}
                              aria-label={`删除标注 ${annotation.id}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                          <div style={panelStyle.annotationDetailText}>{annotation.text}</div>
                          <div style={panelStyle.annotationDetailMeta}>{annotation.pageLabel} · {annotation.deviceLabel}</div>
                        </div>
                      ) : null)}

                      {draftAnnotation && (
                        <div
                          style={{
                            ...panelStyle.annotationDraft,
                            left: `${draftAnnotation.x}%`,
                            top: `${draftAnnotation.y}%`,
                            transform: `translate(${draftAnnotation.x > 55 ? 'calc(-100% - 18px)' : '18px'}, ${draftAnnotation.y > 65 ? 'calc(-100% + 18px)' : '-18px'})`,
                          }}
                          onClick={event => event.stopPropagation()}
                        >
                          <span
                            style={panelStyle.annotationDraftBadge}
                            title={draftAnnotation.targetText ? `已识别：${draftAnnotation.targetText}` : '页面标注'}
                          >
                            {annotations.length + 1}
                          </span>
                          <textarea
                            aria-label="标注意见"
                            value={draftAnnotation.text}
                            onChange={event => setDraftAnnotation(previous => previous ? { ...previous, text: event.target.value } : previous)}
                            onKeyDown={event => {
                              if (event.key === 'Escape') {
                                event.preventDefault();
                                setDraftAnnotation(null);
                              }
                              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                                event.preventDefault();
                                void handleSaveAnnotation();
                              }
                            }}
                            placeholder="添加修改意见…"
                            style={panelStyle.annotationTextarea}
                            rows={1}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => setDraftAnnotation(null)}
                            style={panelStyle.annotationPillButton}
                            aria-label="取消标注"
                          >
                            <X size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleSaveAnnotation()}
                            disabled={!draftAnnotation.text.trim() || isCapturingAnnotation}
                            style={{
                              ...panelStyle.annotationPillButton,
                              ...panelStyle.annotationPillSubmit,
                              ...(!draftAnnotation.text.trim() || isCapturingAnnotation ? panelStyle.annotationPillSubmitDisabled : {}),
                            }}
                            aria-label="添加标注"
                          >
                            {isCapturingAnnotation ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : previewDevice === 'web' ? (
                <div style={panelStyle.webFrame}>
                  <img src="/images/iteach-web-preview.png" alt="iTeach 网页预览" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              ) : previewDevice === 'bigscreen' ? (
                <div style={panelStyle.bigscreenFrame}>
                  <img src="/images/bigscreen-preview.webp" alt="大屏授课端预览" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }} />
                </div>
              ) : previewDevice === 'tablet' ? (
                <div style={panelStyle.tabletFrame}>
                  <img src="/images/tablet-preview.webp" alt="学生小屏端预览" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }} />
                </div>
              ) : (
                <div style={panelStyle.comingSoon}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🚧</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#334155' }}>敬请期待</div>
                  <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 6 }}>
                    {previewDevice === 'cloud-teacher' ? '云教室老师端' : '云教室学生端'}预览正在开发中
                  </div>
                </div>
              )}
              <div style={panelStyle.previewTestHint}>
                <AlertCircle size={13} style={panelStyle.previewTestHintIcon} />
                <span>课件效果由AI生成，请注意效果测试，如有问题，可通过输入修改意见或编辑进行修复</span>
              </div>
            </div>
          </div>

          {/* Version History Bar */}
          <div style={panelStyle.versionBar}>
            <div style={panelStyle.versionLabel}>会话版本历史</div>
            <div ref={versionScrollRef} style={panelStyle.versionScroll}>
              {versions.map(v => (
                <button
                  key={v.version}
                  onClick={() => setSelectedVersion(v.version)}
                  style={{
                    ...panelStyle.versionItem,
                    background: v.version === selectedVersion ? 'var(--agent-soft)' : '#F8FAFC',
                    color: v.isRemoved ? '#94A3B8' : v.version === selectedVersion ? 'var(--agent-primary)' : '#64748B',
                    border: v.isRemoved ? '1px dashed #CBD5E1' : v.version === selectedVersion ? '1.5px solid var(--agent-primary)' : '1px solid #E2E8F0',
                    opacity: v.isRemoved ? 0.78 : 1,
                  }}
                >
                  <span style={panelStyle.versionMain}>{getVersionMainLabel(v)}</span>
                  <span style={{
                    ...panelStyle.versionBadge,
                    color: v.isRemoved ? '#EF4444' : v.isCurrentPublished ? 'var(--agent-primary-text)' : v.isHistoricalPublished ? '#94A3B8' : '#F59E0B',
                  }}>
                    {getVersionPublishLabel(v)}
                  </span>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              <button
                onClick={() => { if (versionScrollRef.current) versionScrollRef.current.scrollLeft -= 120; }}
                style={panelStyle.scrollArrow}
              >‹</button>
              <button
                onClick={() => { if (versionScrollRef.current) versionScrollRef.current.scrollLeft += 120; }}
                style={panelStyle.scrollArrow}
              >›</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const panelStyle: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    background: '#fff',
    borderLeft: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    padding: '10px 14px',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    alignItems: 'center',
    flexShrink: 0,
    gap: 8,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1E293B',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 200,
  },
  titleStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  },
  subTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  subTitle: {
    fontSize: 11,
    color: '#64748B',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 170,
  },
  resourceIdBtn: {
    height: 18,
    padding: 0,
    borderRadius: 4,
    border: 'none',
    background: 'transparent',
    color: '#94A3B8',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    fontSize: 11,
    fontWeight: 400,
    cursor: 'pointer',
    flexShrink: 0,
    maxWidth: 112,
  },
  resourceIdBtnHover: {
    color: '#64748B',
  },
  resourceIdText: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: 400,
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    minHeight: 30,
    padding: '0 12px',
    borderRadius: 10,
    border: 'none',
    fontSize: 13,
    fontWeight: 700,
    outline: 'none',
    cursor: 'pointer',
    transition: 'background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s, transform 0.15s',
    whiteSpace: 'nowrap',
  },
  actionBtnPrimary: {
    background: 'var(--agent-gradient)',
    color: '#FFFFFF',
  },
  actionBtnWarning: {
    background: 'var(--agent-action-gradient)',
    color: '#FFFFFF',
  },
  actionBtnDisabled: {
    background: '#F1F5F9',
    color: '#94A3B8',
    cursor: 'default',
  },
  actionBtnHover: {
    transform: 'translateY(-1px)',
    boxShadow: '0 6px 16px rgba(14, 165, 233, 0.14)',
  },
  stylePanel: {
    position: 'absolute',
    right: 0,
    bottom: 34,
    zIndex: 30,
    width: 320,
    maxHeight: 520,
    overflowY: 'auto',
    padding: 10,
    borderRadius: 12,
    border: '1px solid rgba(15, 118, 110, 0.16)',
    background: 'rgba(255,255,255,0.98)',
    boxShadow: '0 18px 46px rgba(15, 23, 42, 0.14)',
  },
  stylePanelHeader: {
    padding: '2px 2px 10px',
    borderBottom: '1px solid #E2E8F0',
    marginBottom: 8,
  },
  stylePanelTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: 850,
    marginBottom: 3,
  },
  stylePanelDesc: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 1.45,
  },
  styleOptionList: {
    display: 'grid',
    gap: 7,
  },
  styleGroupTitle: {
    margin: '10px 2px 7px',
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: 850,
  },
  styleOption: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 3,
    width: '100%',
    padding: '9px 10px',
    borderRadius: 9,
    border: '1px solid #E2E8F0',
    background: '#FFFFFF',
    cursor: 'pointer',
    textAlign: 'left',
  },
  styleOptionName: {
    color: '#0F766E',
    fontSize: 13,
    fontWeight: 850,
  },
  styleOptionDesc: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 1.35,
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    border: '1px solid #E2E8F0',
    borderColor: '#E2E8F0',
    background: '#fff',
    color: '#64748B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    outline: 'none',
    transition: 'background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s, transform 0.15s',
  },
  iconBtnHover: {
    borderColor: '#BFE9F5',
    background: '#F6FCFF',
    color: 'var(--agent-primary-text)',
    boxShadow: '0 6px 16px rgba(14, 165, 233, 0.10)',
    transform: 'translateY(-1px)',
  },
  iconBtnDisabled: {
    color: '#CBD5E1',
    cursor: 'default',
    background: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  annotationEntryActive: {
    color: '#0759C9',
    borderColor: '#8CCBFF',
    background: '#EAF6FF',
    boxShadow: '0 0 0 2px rgba(2, 116, 252, 0.10)',
  },
  annotationEntryCount: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 16,
    height: 16,
    padding: '0 4px',
    borderRadius: 999,
    border: '2px solid #FFFFFF',
    background: '#0274FC',
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 900,
    lineHeight: '12px',
    boxSizing: 'border-box',
  },
  headerIconWrap: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTooltip: {
    position: 'absolute',
    right: 0,
    top: 'calc(100% + 8px)',
    zIndex: 80,
    minWidth: 'max-content',
    height: 28,
    padding: '0 9px',
    borderRadius: 8,
    background: '#0F172A',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 700,
    lineHeight: '28px',
    whiteSpace: 'nowrap',
    boxShadow: '0 10px 24px rgba(15, 23, 42, 0.18)',
    pointerEvents: 'none',
  },
  headerTooltipArrow: {
    position: 'absolute',
    right: 10,
    top: -4,
    width: 8,
    height: 8,
    background: '#0F172A',
    transform: 'rotate(45deg)',
  },
  fullscreenMask: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: '#F8FAFC',
    display: 'flex',
    flexDirection: 'column',
  },
  fullscreenHeader: {
    height: 48,
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #E2E8F0',
    background: '#FFFFFF',
    flexShrink: 0,
  },
  fullscreenTitle: {
    flex: 1,
    minWidth: 0,
    color: '#1E293B',
    fontSize: 15,
    fontWeight: 700,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  fullscreenActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  fullscreenActionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 32,
    padding: '0 12px',
    borderRadius: 8,
    border: '1px solid #E2E8F0',
    background: '#FFFFFF',
    color: '#475569',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  fullscreenClose: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 32,
    padding: '0 12px',
    borderRadius: 8,
    border: '1px solid #E2E8F0',
    background: '#FFFFFF',
    color: '#475569',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  fullscreenIframe: {
    flex: 1,
    width: '100%',
    border: 'none',
    background: '#FFFFFF',
  },
  annotationMask: {
    position: 'fixed',
    inset: 0,
    zIndex: 10000,
    background: '#F4F8FC',
    display: 'flex',
    flexDirection: 'column',
  },
  annotationHeader: {
    height: 56,
    padding: '0 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    borderBottom: '1px solid #E2E8F0',
    background: '#FFFFFF',
    flexShrink: 0,
  },
  annotationTitleBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    minWidth: 0,
  },
  annotationTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: 850,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  annotationSubtitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: 650,
  },
  annotationHeaderActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  annotationHeaderBtn: {
    height: 34,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    padding: '0 12px',
    borderRadius: 9,
    border: '1px solid #DCE7F2',
    background: '#FFFFFF',
    color: '#475569',
    fontSize: 13,
    fontWeight: 750,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  annotationHeaderBtnMuted: {
    color: '#64748B',
    background: '#F8FAFC',
  },
  annotationWorkspace: {
    flex: 1,
    minHeight: 0,
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 320px',
    gap: 0,
  },
  annotationStage: {
    minWidth: 0,
    minHeight: 0,
    overflow: 'auto',
    padding: '28px 32px 40px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    background: '#EEF4FA',
  },
  annotationCanvas: {
    position: 'relative',
    width: 'min(100%, 1180px)',
    aspectRatio: '16 / 9',
    minHeight: 520,
    background: '#FFFFFF',
    border: '1px solid #DCE7F2',
    boxShadow: '0 18px 48px rgba(15, 23, 42, 0.12)',
    overflow: 'hidden',
  },
  annotationIframe: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    border: 'none',
    background: '#FFFFFF',
    pointerEvents: 'none',
  },
  annotationLayer: {
    position: 'absolute',
    inset: 0,
    cursor: 'crosshair',
    background: 'rgba(255,255,255,0.01)',
    zIndex: 5,
  },
  annotationPin: {
    position: 'absolute',
    width: 28,
    height: 28,
    transform: 'translate(-50%, -50%)',
    borderRadius: 999,
    border: '2px solid #FFFFFF',
    background: '#0274FC',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 900,
    cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(2, 116, 252, 0.28)',
    zIndex: 3,
  },
  annotationPinActive: {
    background: '#FF8A00',
    boxShadow: '0 8px 22px rgba(255, 138, 0, 0.30)',
  },
  annotationDraft: {
    position: 'absolute',
    width: 'min(286px, calc(100% - 28px))',
    minHeight: 48,
    transform: 'translate(14px, -18px)',
    padding: '6px 7px',
    borderRadius: 999,
    border: '1px solid #D8E1EB',
    background: '#FFFFFF',
    boxShadow: '0 10px 28px rgba(15, 23, 42, 0.16)',
    zIndex: 4,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  annotationDraftHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: 850,
    marginBottom: 8,
  },
  annotationDraftBadge: {
    width: 27,
    height: 27,
    borderRadius: 999,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0274FC',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 900,
  },
  annotationTextarea: {
    flex: 1,
    minWidth: 0,
    height: 32,
    minHeight: 32,
    maxHeight: 54,
    resize: 'none',
    padding: '6px 4px',
    borderRadius: 0,
    border: 'none',
    outline: 'none',
    color: '#0F172A',
    fontSize: 13,
    lineHeight: '20px',
    boxSizing: 'border-box',
    background: 'transparent',
  },
  annotationPillButton: {
    width: 30,
    height: 30,
    borderRadius: 999,
    border: 'none',
    background: 'transparent',
    color: '#7A8B9D',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  annotationPillSubmit: {
    background: '#0274FC',
    color: '#FFFFFF',
  },
  annotationPillSubmitDisabled: {
    background: '#D7E0E9',
    color: '#FFFFFF',
    cursor: 'not-allowed',
  },
  annotationTargetHint: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 5,
    margin: '-2px 0 8px',
    color: '#52708E',
    fontSize: 11,
    lineHeight: 1.35,
  },
  annotationDetail: {
    position: 'absolute',
    width: 'min(220px, calc(100% - 30px))',
    padding: 9,
    borderRadius: 10,
    border: '1px solid #BFE0FF',
    background: '#FFFFFF',
    boxShadow: '0 10px 26px rgba(15, 23, 42, 0.16)',
    zIndex: 4,
    boxSizing: 'border-box',
  },
  annotationDetailHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
    color: '#0759C9',
    fontSize: 12,
    fontWeight: 850,
  },
  annotationDeleteBtn: {
    width: 26,
    height: 26,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    border: 'none',
    background: '#FFF3F3',
    color: '#D64141',
    cursor: 'pointer',
  },
  annotationDetailText: {
    color: '#1E293B',
    fontSize: 13,
    lineHeight: 1.5,
  },
  annotationDetailMeta: {
    marginTop: 7,
    color: '#7B8EA3',
    fontSize: 11,
  },
  annotationDraftActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  annotationCancelBtn: {
    height: 30,
    padding: '0 12px',
    borderRadius: 8,
    border: '1px solid #E2E8F0',
    background: '#FFFFFF',
    color: '#64748B',
    fontSize: 12,
    fontWeight: 750,
    cursor: 'pointer',
  },
  annotationSaveBtn: {
    height: 30,
    padding: '0 12px',
    borderRadius: 8,
    border: 'none',
    background: 'var(--agent-action-gradient)',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 850,
    cursor: 'pointer',
  },
  annotationSaveBtnDisabled: {
    background: '#E2E8F0',
    color: '#94A3B8',
    cursor: 'default',
  },
  annotationSidePanel: {
    minWidth: 0,
    borderLeft: '1px solid #E2E8F0',
    background: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    padding: 14,
    gap: 12,
  },
  annotationToolHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  annotationPanelTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: 900,
  },
  annotationPanelDesc: {
    marginTop: 3,
    color: '#64748B',
    fontSize: 12,
    lineHeight: 1.35,
  },
  annotationCount: {
    width: 28,
    height: 28,
    borderRadius: 999,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#F0FBFF',
    color: '#0759C9',
    border: '1px solid #BFE9F5',
    fontSize: 12,
    fontWeight: 900,
  },
  annotationTools: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 6,
  },
  annotationToolBtn: {
    height: 34,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 9,
    border: '1px solid #E2E8F0',
    background: '#FFFFFF',
    color: '#64748B',
    fontSize: 12,
    fontWeight: 750,
    cursor: 'pointer',
  },
  annotationToolBtnActive: {
    background: '#F0FBFF',
    color: '#0759C9',
    borderColor: '#BFE9F5',
  },
  annotationList: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    display: 'grid',
    alignContent: 'start',
    gap: 8,
  },
  annotationEmpty: {
    minHeight: 160,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    border: '1px dashed #CBD5E1',
    background: '#F8FAFC',
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: 750,
    textAlign: 'center',
  },
  annotationListItem: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(0, 1fr)',
    gap: 8,
    alignItems: 'start',
    width: '100%',
    padding: 10,
    borderRadius: 10,
    border: '1px solid #E2E8F0',
    background: '#FFFFFF',
    color: '#334155',
    textAlign: 'left',
    cursor: 'pointer',
  },
  annotationListItemActive: {
    borderColor: '#BFE9F5',
    background: '#F0FBFF',
  },
  annotationListIndex: {
    width: 22,
    height: 22,
    borderRadius: 999,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0274FC',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 900,
  },
  annotationListText: {
    minWidth: 0,
    color: '#334155',
    fontSize: 13,
    lineHeight: 1.45,
  },
  annotationDoneBtn: {
    height: 38,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 10,
    border: 'none',
    background: 'var(--agent-gradient)',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 900,
    cursor: 'pointer',
  },
  previewArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: '#F8FAFC',
  },
  annotationInlineBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    minHeight: 48,
    padding: '7px 14px',
    borderBottom: '1px solid #BFE0FF',
    background: 'linear-gradient(90deg, #F0F8FF 0%, #F7FCFF 100%)',
    flexShrink: 0,
  },
  annotationInlineGuide: {
    minWidth: 0,
    flex: '1 1 160px',
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    color: '#0F3F72',
    fontSize: 12,
  },
  annotationInlineIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
    background: '#0274FC',
    boxShadow: '0 6px 14px rgba(2, 116, 252, 0.20)',
    flexShrink: 0,
  },
  annotationInlineCopy: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  annotationInlineActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    flexShrink: 0,
    marginLeft: 'auto',
  },
  annotationInlineCount: {
    color: '#52708E',
    fontSize: 11,
    whiteSpace: 'nowrap',
  },
  annotationInlineCancel: {
    height: 30,
    padding: '0 10px',
    borderRadius: 8,
    border: '1px solid #C7DDF3',
    background: '#FFFFFF',
    color: '#52708E',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  annotationInlineSubmit: {
    height: 30,
    padding: '0 12px',
    borderRadius: 8,
    border: 'none',
    background: 'var(--agent-hero-gradient)',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  annotationInlineSubmitDisabled: {
    background: '#C8D5E3',
    cursor: 'not-allowed',
  },
  deviceSwitcher: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 0,
    padding: '0 16px',
    borderBottom: '1px solid #E2E8F0',
    background: '#fff',
    flexShrink: 0,
    overflowX: 'auto',
    overflowY: 'hidden',
  },
  deviceTab: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 16px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
    outline: 'none',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  previewContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  previewStageWrap: {
    width: '100%',
    maxWidth: 'min(100%, 960px)',
    maxHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: 14,
  },
  previewTestHint: {
    flexShrink: 0,
    padding: '0 2px',
    color: '#64748B',
    fontSize: 12,
    fontWeight: 400,
    lineHeight: 1.45,
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  previewTestHintIcon: {
    color: '#64748B',
    flexShrink: 0,
  },
  stylePromptNote: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    borderRadius: 10,
    border: '1px solid rgba(0,201,167,0.22)',
    background: 'rgba(255,255,255,0.94)',
    boxShadow: '0 8px 22px rgba(15, 23, 42, 0.08)',
  },
  stylePromptLabel: {
    flexShrink: 0,
    color: '#0F766E',
    fontSize: 12,
    fontWeight: 850,
  },
  stylePromptText: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: '#475569',
    fontSize: 12,
  },
  defaultFrame: {
    position: 'relative',
    width: '100%',
    maxWidth: 'min(100%, 960px)',
    aspectRatio: '16/9',
    maxHeight: '100%',
    background: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
    boxShadow: '0 18px 48px rgba(15, 23, 42, 0.08)',
  },
  defaultIframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    display: 'block',
    background: '#fff',
  },
  webFrame: {
    width: '100%',
    maxWidth: '100%',
    aspectRatio: '16/9',
    maxHeight: '100%',
    position: 'relative',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bigscreenFrame: {
    width: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabletFrame: {
    width: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoon: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  versionBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 16px',
    borderTop: '1px solid #E2E8F0',
    background: '#fff',
    flexShrink: 0,
  },
  versionLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#64748B',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  versionScroll: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    overflow: 'auto',
    flex: 1,
  },
  versionItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 3,
    minWidth: 168,
    height: 44,
    padding: '7px 12px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    outline: 'none',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    transition: 'all 0.15s',
  },
  versionMain: {
    maxWidth: 150,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    lineHeight: 1.2,
  },
  versionBadge: {
    fontSize: 10,
    fontWeight: 600,
    maxWidth: 150,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    lineHeight: 1.2,
  },
  scrollArrow: {
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    border: '1px solid #E2E8F0',
    background: '#fff',
    color: '#64748B',
    fontSize: 16,
    cursor: 'pointer',
    outline: 'none',
    flexShrink: 0,
  },
  versionStyleBtn: {
    height: 24,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: '0 9px',
    borderRadius: 6,
    border: '1px solid #D8F3EF',
    borderColor: '#D8F3EF',
    background: '#FFFFFF',
    color: '#0F766E',
    fontSize: 12,
    fontWeight: 750,
    cursor: 'pointer',
    outline: 'none',
    whiteSpace: 'nowrap',
  },
  versionStyleBtnActive: {
    borderColor: 'rgba(0,201,167,0.38)',
    background: 'var(--agent-soft-strong)',
    color: 'var(--agent-primary-text)',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    background: '#fff',
  },
  editor: {
    flex: 1,
    margin: '10px 10px 0',
    padding: 14,
    fontFamily: "'Fira Code', 'Consolas', monospace",
    fontSize: 12,
    lineHeight: 1.7,
    background: '#1E293B',
    color: '#E2E8F0',
    border: 'none',
    borderRadius: 8,
    resize: 'none',
    outline: 'none',
  },
  editorActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    padding: '10px 10px',
  },
  cancelBtn: {
    padding: '7px 16px',
    borderRadius: 6,
    border: '1px solid #E2E8F0',
    background: '#fff',
    color: '#64748B',
    fontSize: 13,
    cursor: 'pointer',
    outline: 'none',
  },
  saveBtn: {
    padding: '7px 16px',
    borderRadius: 6,
    border: 'none',
    background: 'var(--agent-gradient)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    outline: 'none',
  },
};
