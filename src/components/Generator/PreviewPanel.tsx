import { useEffect, useMemo, useState, useRef } from 'react';
import { Maximize2, X, Edit3, Upload, Download, Square, Globe, Monitor, Tablet, Users, GraduationCap } from 'lucide-react';
import { useCoursewareStore } from '../../store/coursewareStore';
import { useUIStore } from '../../store/uiStore';
import { mockCoursewares } from '../../data/mockCoursewares';
import PublishModal from '../Library/PublishModal';
import toast from '../../utils/toast';

interface PreviewPanelProps {
  coursewareId: number | null;
  onClose: () => void;
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
  publishTargetId?: string;
  isCurrentPublished?: boolean;
  isHistoricalPublished?: boolean;
}

interface PublishedGameTarget {
  id: string;
  name: string;
  currentVersion: string;
  urlLabel: string;
}

const buildSessionVersions = (courseware?: { title?: string; htmlContent?: string } | null): SessionHtmlVersion[] => {
  if (!courseware) return [];
  const baseHtml = courseware.htmlContent || '';
  const baseTitle = courseware.title || '互动课件';
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

const buildPublishedTargets = (courseware?: { title?: string } | null): PublishedGameTarget[] => {
  const baseTitle = courseware?.title || '互动课件';
  return [
    {
      id: 'game-a',
      name: baseTitle,
      currentVersion: 'v3',
      urlLabel: '固定链接 A',
    },
    {
      id: 'game-b',
      name: `${baseTitle}优化版`,
      currentVersion: 'v2',
      urlLabel: '固定链接 B',
    },
  ];
};

export default function PreviewPanel({ coursewareId, onClose }: PreviewPanelProps) {
  const { coursewares, updateCourseware } = useCoursewareStore();
  const { appMode, insertCourseware } = useUIStore();
  const isEmbedded = appMode === 'embedded';

  const courseware = useMemo(() => {
    const resolved = coursewares.find(c => c.id === coursewareId)
      || mockCoursewares.find(c => c.id === coursewareId);
    if (!resolved) return resolved;
    if (resolved.title.includes('动物单词拼写') || resolved.htmlContent?.includes('动物单词拼写')) {
      return { ...mockCoursewares[0], id: resolved.id };
    }
    return resolved;
  }, [coursewareId, coursewares]);

  const [versions, setVersions] = useState<SessionHtmlVersion[]>(() => buildSessionVersions(courseware));

  const [publishedTargets, setPublishedTargets] = useState<PublishedGameTarget[]>(() => buildPublishedTargets(courseware));

  const [selectedVersion, setSelectedVersion] = useState('v4');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [selectedUpdateTargetId, setSelectedUpdateTargetId] = useState<string | null>('game-b');
  const [publishMode, setPublishMode] = useState<PublishMode | null>(null);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('default');
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const publishBtnRef = useRef<HTMLDivElement>(null);
  const versionScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVersions(buildSessionVersions(courseware));
    setPublishedTargets(buildPublishedTargets(courseware));
    setSelectedVersion('v4');
    setSelectedUpdateTargetId('game-b');
    setIsEditing(false);
    setEditContent('');
    setFullscreenOpen(false);
  }, [coursewareId, courseware?.htmlContent, courseware?.title]);

  useEffect(() => {
    if (!fullscreenOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFullscreenOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenOpen]);

  const currentVersion = versions.find(v => v.version === selectedVersion);
  const latestVersion = versions[versions.length - 1];
  const selectedUpdateTarget = publishedTargets.find(target => target.id === selectedUpdateTargetId) || publishedTargets[0];
  const hasPublishedTargets = publishedTargets.length > 0;
  const hasMultiplePublishedGames = publishedTargets.length > 1;
  const isUnpublishedVersion = !!currentVersion && !currentVersion.isCurrentPublished && !currentVersion.isHistoricalPublished;
  const canUpdateCurrentDraft = hasPublishedTargets && latestVersion && selectedVersion === latestVersion.version && isUnpublishedVersion;

  const srcDoc = currentVersion?.htmlContent || PLACEHOLDER_HTML;
  const currentTitle = currentVersion?.title || courseware?.title || '互动游戏';

  const handleFullscreen = () => {
    setFullscreenOpen(true);
  };

  const handleEdit = () => {
    // TODO: 历史版本编辑能力后续再处理；6月11日版本仍沿用仅最新版本可编辑的产品约束。
    setEditContent(currentVersion?.htmlContent || '');
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const newVersionNum = versions.length + 1;
    const newVersion: SessionHtmlVersion = {
      version: `v${newVersionNum}`,
      sessionNumber: newVersionNum,
      title: currentVersion?.title || courseware?.title || '未命名互动游戏',
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

  const handlePublish = () => {
    setPublishMode('publish');
  };

  const handleUpdatePublishClick = () => {
    setSelectedUpdateTargetId(selectedUpdateTargetId || publishedTargets[publishedTargets.length - 1]?.id || null);
    setPublishMode('update');
  };

  const handlePublishSuccess = () => {
    if (publishMode === 'update' && selectedUpdateTarget) {
      setVersions(prev => prev.map(v => {
        if (v.version === selectedVersion) {
          return {
            ...v,
            publishTargetId: selectedUpdateTarget.id,
            isCurrentPublished: true,
            isHistoricalPublished: false,
          };
        }
        if (v.publishTargetId === selectedUpdateTarget.id && v.isCurrentPublished) {
          return { ...v, isCurrentPublished: false, isHistoricalPublished: true };
        }
        return v;
      }));
      setPublishedTargets(prev => prev.map(target =>
        target.id === selectedUpdateTarget.id
          ? { ...target, currentVersion: selectedVersion, name: currentTitle }
          : target
      ));
    }
    if (publishMode === 'publish' || publishMode === 'new-game') {
      const nextId = `game-${publishedTargets.length + 1}`;
      const targetName = currentTitle;
      setPublishedTargets(prev => [...prev, {
        id: nextId,
        name: targetName,
        currentVersion: selectedVersion,
        urlLabel: `固定链接 ${publishedTargets.length + 1}`,
      }]);
      setVersions(prev => prev.map(v =>
        v.version === selectedVersion
          ? {
              ...v,
              publishTargetId: nextId,
              isCurrentPublished: true,
              isHistoricalPublished: false,
            }
          : v
      ));
    }
    setPublishMode(null);
    setSelectedUpdateTargetId(null);
  };

  if (!courseware) return null;

  const getVersionPublishLabel = (version: SessionHtmlVersion) => {
    if (version.isCurrentPublished) return '当前发布';
    if (version.isHistoricalPublished) return '已发布(历史版本)';
    return '未发布草稿';
  };

  const getVersionMainLabel = (version: SessionHtmlVersion) => {
    const prefix = `会话第${version.sessionNumber}版`;
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
    };
  });

  const publishBtnText = canUpdateCurrentDraft
    ? '更新发布'
    : currentVersion?.isCurrentPublished
      ? '已发布'
      : currentVersion?.isHistoricalPublished
        ? '已发布(历史版本)'
        : '发布';
  const publishBtnDisabled = (currentVersion?.isCurrentPublished || currentVersion?.isHistoricalPublished) && !canUpdateCurrentDraft;

  return (
    <div style={panelStyle.container}>
      {/* Header */}
      <div style={panelStyle.header}>
        <div style={panelStyle.headerLeft}>
          <div style={panelStyle.titleStack}>
            <span style={panelStyle.title}>{currentTitle}</span>
            <span style={panelStyle.subTitle}>会话第 {currentVersion?.sessionNumber || 1} 版 · {currentVersion ? getVersionPublishLabel(currentVersion) : '未发布草稿'}</span>
          </div>
        </div>
        <div style={panelStyle.headerRight}>
          <div ref={publishBtnRef} style={{ position: 'relative', display: 'flex', gap: 6 }}>
            {canUpdateCurrentDraft ? (
              <>
                <button
                  onClick={handleUpdatePublishClick}
                  style={{ ...panelStyle.actionBtn, background: 'linear-gradient(135deg, #00C9A7, #00A8E8)', color: '#fff' }}
                  title="更新发布"
                >
                  <Upload size={14} />
                  更新发布
                </button>
                <button
                  onClick={() => setPublishMode('new-game')}
                  style={{ ...panelStyle.actionBtn, background: '#F59E0B', color: '#fff' }}
                  title="发布为新互动游戏"
                >
                  <Upload size={14} />
                  发布为新游戏
                </button>
              </>
            ) : (
              <button
                onClick={handlePublish}
                disabled={!!publishBtnDisabled}
                style={{
                  ...panelStyle.actionBtn,
                  background: publishBtnDisabled ? '#F1F5F9' : 'linear-gradient(135deg, #00C9A7, #00A8E8)',
                  color: publishBtnDisabled ? '#94A3B8' : '#fff',
                  cursor: publishBtnDisabled ? 'default' : 'pointer',
                }}
                title={publishBtnText}
              >
                <Upload size={14} />
                {publishBtnText}
              </button>
            )}
          </div>
          {isEmbedded && courseware && (
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
              style={{
                ...panelStyle.actionBtn,
                background: '#F59E0B',
                color: '#fff',
              }}
              title="插入课件"
            >
              <Download size={14} />
              插入课件
            </button>
          )}
          <button onClick={handleFullscreen} style={panelStyle.iconBtn} title="全屏">
            <Maximize2 size={15} />
          </button>
          <button onClick={handleEdit} style={panelStyle.iconBtn} title="编辑">
            <Edit3 size={15} />
          </button>
          <button onClick={onClose} style={panelStyle.iconBtn} title="关闭">
            <X size={15} />
          </button>
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

      {fullscreenOpen && (
        <div style={panelStyle.fullscreenMask}>
          <div style={panelStyle.fullscreenHeader}>
            <span style={panelStyle.fullscreenTitle}>{currentTitle}</span>
            <button onClick={() => setFullscreenOpen(false)} style={panelStyle.fullscreenClose} title="退出全屏">
              <X size={18} />
              退出全屏
            </button>
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
                    background: previewDevice === device.id ? '#F0FDFA' : 'transparent',
                    color: previewDevice === device.id ? '#00C9A7' : '#64748B',
                    borderBottom: previewDevice === device.id ? '2px solid #00C9A7' : '2px solid transparent',
                  }}
                  title={device.label}
                >
                  {device.icon}
                  {device.label}
                </button>
              );
            })}
          </div>

          {/* Preview Container */}
          <div style={panelStyle.previewContainer}>
            {previewDevice === 'default' ? (
              <div style={panelStyle.defaultFrame}>
                <iframe
                  srcDoc={srcDoc}
                  title={`${currentTitle} 默认预览`}
                  sandbox="allow-scripts allow-same-origin"
                  style={panelStyle.defaultIframe}
                />
              </div>
            ) : previewDevice === 'web' ? (
              <div style={panelStyle.webFrame}>
                <img src="/images/iteach-web-preview.png" alt="iTeach 网页预览" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            ) : previewDevice === 'bigscreen' ? (
              <div style={panelStyle.bigscreenFrame}>
                <img src="/images/bigscreen-preview.png" alt="大屏授课端预览" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }} />
              </div>
            ) : previewDevice === 'tablet' ? (
              <div style={panelStyle.tabletFrame}>
                <img src="/images/tablet-preview.png" alt="学习机小屏端预览" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }} />
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
                    background: v.version === selectedVersion ? '#F0FDFA' : '#F8FAFC',
                    color: v.version === selectedVersion ? '#00C9A7' : '#64748B',
                    border: v.version === selectedVersion ? '1.5px solid #00C9A7' : '1px solid #E2E8F0',
                  }}
                >
                  <span style={panelStyle.versionMain}>{getVersionMainLabel(v)}</span>
                  <span style={{
                    ...panelStyle.versionBadge,
                    color: v.isCurrentPublished ? '#047857' : v.isHistoricalPublished ? '#94A3B8' : '#F59E0B',
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
  subTitle: {
    fontSize: 11,
    color: '#64748B',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 260,
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '5px 12px',
    borderRadius: 6,
    border: 'none',
    fontSize: 13,
    fontWeight: 500,
    outline: 'none',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    border: '1px solid #E2E8F0',
    background: '#fff',
    color: '#64748B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.15s',
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
    color: '#1E293B',
    fontSize: 15,
    fontWeight: 700,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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
  previewArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: '#F8FAFC',
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
  },
  defaultFrame: {
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
    background: 'linear-gradient(135deg, #00C9A7, #00A8E8)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    outline: 'none',
  },
};
