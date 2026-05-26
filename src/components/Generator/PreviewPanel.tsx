import { useMemo, useState, useRef } from 'react';
import { Maximize2, X, Edit3, Upload, Download, Globe, Monitor, Tablet, Users, GraduationCap } from 'lucide-react';
import { useCoursewareStore } from '../../store/coursewareStore';
import { useUIStore } from '../../store/uiStore';
import { mockCoursewares } from '../../data/mockCoursewares';
import toast from '../../utils/toast';
import type { CoursewareVersion } from '../../types';

interface PreviewPanelProps {
  coursewareId: number | null;
  onClose: () => void;
}

const PLACEHOLDER_HTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#94A3B8;font-size:16px;">课件预览区域</div>';

export default function PreviewPanel({ coursewareId, onClose }: PreviewPanelProps) {
  const { coursewares, updateCourseware } = useCoursewareStore();
  const { appMode, insertCourseware } = useUIStore();
  const isEmbedded = appMode === 'embedded';

  const courseware = useMemo(() => {
    return coursewares.find(c => c.id === coursewareId)
      || mockCoursewares.find(c => c.id === coursewareId);
  }, [coursewareId, coursewares]);

  const [versions, setVersions] = useState<CoursewareVersion[]>(() => {
    if (!courseware) return [];
    return [
      {
        version: 'v1',
        description: '初始版本',
        htmlContent: courseware.htmlContent || '',
        isPublished: false,
        createdAt: '2026-05-14 18:27',
      },
      {
        version: 'v2',
        description: '优化交互',
        htmlContent: courseware.htmlContent || '',
        isPublished: false,
        createdAt: '2026-05-15 10:30',
      },
      {
        version: 'v3',
        description: '修复样式',
        htmlContent: courseware.htmlContent || '',
        isPublished: true,
        createdAt: '2026-05-16 14:20',
      },
    ];
  });

  const [selectedVersion, setSelectedVersion] = useState('v3');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'web' | 'bigscreen' | 'tablet' | 'cloud-teacher' | 'cloud-student'>('web');
  const publishBtnRef = useRef<HTMLDivElement>(null);
  const versionScrollRef = useRef<HTMLDivElement>(null);

  const currentVersion = versions.find(v => v.version === selectedVersion);
  const latestVersion = versions[versions.length - 1];
  const publishedVersion = versions.find(v => v.isPublished);
  const hasNewerUnpublished = publishedVersion && latestVersion && publishedVersion.version !== latestVersion.version && !latestVersion.isPublished;

  const srcDoc = currentVersion?.htmlContent || PLACEHOLDER_HTML;

  const handleFullscreen = () => {
    const win = window.open('', '_blank', 'width=1200,height=800');
    if (win) {
      win.document.write(srcDoc);
      win.document.close();
    }
  };

  const handleDownload = () => {
    const blob = new Blob([srcDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${courseware?.title || '课件'}_${selectedVersion}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEdit = () => {
    setEditContent(currentVersion?.htmlContent || '');
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const newVersionNum = versions.length + 1;
    const newVersion: CoursewareVersion = {
      version: `v${newVersionNum}`,
      description: `编辑版本`,
      htmlContent: editContent,
      isPublished: false,
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
    if (publishBtnText === '更新发布') {
      setShowPublishConfirm(true);
    } else {
      handlePublishConfirm();
    }
  };

  const handlePublishConfirm = () => {
    setShowPublishConfirm(false);
    setVersions(prev => prev.map(v =>
      v.version === selectedVersion
        ? { ...v, isPublished: true }
        : { ...v, isPublished: false }
    ));
    toast('发布成功');
  };

  if (!courseware) return null;

  const publishBtnText = hasNewerUnpublished && selectedVersion === latestVersion.version
    ? '更新发布'
    : currentVersion?.isPublished
      ? '已发布'
      : '发布';
  const publishBtnDisabled = currentVersion?.isPublished && !(hasNewerUnpublished && selectedVersion === latestVersion.version);

  return (
    <div style={panelStyle.container}>
      {/* Header */}
      <div style={panelStyle.header}>
        <div style={panelStyle.headerLeft}>
          <span style={panelStyle.title}>{courseware.title}</span>
        </div>
        <div style={panelStyle.headerRight}>
          <div ref={publishBtnRef} style={{ position: 'relative' }}>
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
            {showPublishConfirm && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 8, zIndex: 100,
                background: '#fff', borderRadius: 8, border: '1px solid #E2E8F0',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: '14px 16px', width: 280,
              }}>
                <div style={{ fontSize: 12, color: '#334155', fontWeight: 500, marginBottom: 12, lineHeight: 1.5 }}>
                  发布后所有引用此互动页面的课件都会同步更新，确定更新发布吗？
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowPublishConfirm(false)} style={{
                    padding: '5px 14px', borderRadius: 5, border: '1px solid #E2E8F0', background: '#fff',
                    color: '#64748B', fontSize: 11, fontWeight: 500, cursor: 'pointer',
                  }}>
                    取消
                  </button>
                  <button onClick={handlePublishConfirm} style={{
                    padding: '5px 14px', borderRadius: 5, border: 'none',
                    background: '#EF4444',
                    color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  }}>
                    确定
                  </button>
                </div>
              </div>
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
          <button onClick={handleDownload} style={panelStyle.iconBtn} title="下载">
            <Download size={15} />
          </button>
          <button onClick={onClose} style={panelStyle.iconBtn} title="关闭">
            <X size={15} />
          </button>
        </div>
      </div>

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
            {(['web', 'bigscreen', 'tablet', 'cloud-teacher', 'cloud-student'] as const).map(device => {
              const labels: Record<string, string> = {
                'web': '网页端',
                'bigscreen': '大屏授课端',
                'tablet': '学习机小屏端',
                'cloud-teacher': '云教室授课端',
                'cloud-student': '云教室学生端',
              };
              const icons: Record<string, React.ReactNode> = {
                'web': <Globe size={15} />,
                'bigscreen': <Monitor size={15} />,
                'tablet': <Tablet size={15} />,
                'cloud-teacher': <Users size={15} />,
                'cloud-student': <GraduationCap size={15} />,
              };
              return (
                <button
                  key={device}
                  onClick={() => setPreviewDevice(device)}
                  style={{
                    ...panelStyle.deviceTab,
                    background: previewDevice === device ? '#F0FDFA' : 'transparent',
                    color: previewDevice === device ? '#00C9A7' : '#64748B',
                    borderBottom: previewDevice === device ? '2px solid #00C9A7' : '2px solid transparent',
                  }}
                >
                  {icons[device]}
                  {labels[device]}
                </button>
              );
            })}
          </div>

          {/* Preview Container */}
          <div style={panelStyle.previewContainer}>
            {previewDevice === 'web' ? (
              <div style={panelStyle.webFrame}>
                <iframe title="课件预览" srcDoc={srcDoc} style={panelStyle.iframe} sandbox="allow-scripts allow-same-origin" />
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
                  {previewDevice === 'cloud-teacher' ? '云教室授课端' : '云教室学生端'}预览正在开发中
                </div>
              </div>
            )}
          </div>

          {/* Version History Bar */}
          <div style={panelStyle.versionBar}>
            <div style={panelStyle.versionLabel}>版本历史</div>
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
                  {v.version}-{courseware.title}
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
    justifyContent: 'center',
    gap: 0,
    padding: '0 16px',
    borderBottom: '1px solid #E2E8F0',
    background: '#fff',
    flexShrink: 0,
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
  },
  previewContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    overflow: 'hidden',
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
    alignItems: 'center',
    padding: '8px 16px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    outline: 'none',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    transition: 'all 0.15s',
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
