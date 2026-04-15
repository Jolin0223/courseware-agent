import { useMemo, useState, useRef, useEffect } from 'react';
import { Maximize2, X, Edit3, Upload, Download, ChevronDown, Check } from 'lucide-react';
import { useCoursewareStore } from '../../store/coursewareStore';
import { useUIStore } from '../../store/uiStore';
import { mockCoursewares } from '../../data/mockCoursewares';
import PublishModal from '../Library/PublishModal';
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
    return [{
      version: 'v1',
      description: '初始版本',
      htmlContent: courseware.htmlContent || '',
      isPublished: !!courseware.isPublished,
      createdAt: courseware.publishTime || new Date().toISOString(),
    }];
  });

  const [selectedVersion, setSelectedVersion] = useState('v1');
  const [versionDropdownOpen, setVersionDropdownOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setVersionDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
    setPublishModalOpen(true);
  };

  const handlePublishComplete = () => {
    setVersions(prev => prev.map(v =>
      v.version === selectedVersion
        ? { ...v, isPublished: true }
        : { ...v, isPublished: false }
    ));
    setPublishModalOpen(false);
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
          {/* Version Dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setVersionDropdownOpen(v => !v)}
              style={panelStyle.versionBtn}
            >
              {selectedVersion}
              <ChevronDown size={14} style={{ transform: versionDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>
            {versionDropdownOpen && (
              <div style={panelStyle.dropdown}>
                {[...versions].reverse().map(v => (
                  <div
                    key={v.version}
                    onClick={() => { setSelectedVersion(v.version); setVersionDropdownOpen(false); }}
                    style={{
                      ...panelStyle.dropdownItem,
                      background: v.version === selectedVersion ? '#F0FDF9' : 'transparent',
                    }}
                    onMouseEnter={e => { if (v.version !== selectedVersion) e.currentTarget.style.background = '#F8FAFC'; }}
                    onMouseLeave={e => { if (v.version !== selectedVersion) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ flex: 1 }}>
                      {v.version} 版本
                      {v.isPublished && <span style={{ color: '#00C9A7', fontSize: 11, marginLeft: 6 }}>已发布</span>}
                    </span>
                    {v.version === selectedVersion && <Check size={14} color="#00C9A7" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={panelStyle.headerRight}>
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
          <div style={panelStyle.iframeWrap}>
            <iframe title="课件预览" srcDoc={srcDoc} style={panelStyle.iframe} sandbox="allow-scripts allow-same-origin" />
          </div>
        </div>
      )}
      {publishModalOpen && coursewareId && (
        <PublishModal coursewareId={coursewareId} onClose={() => setPublishModalOpen(false)} onPublishSuccess={handlePublishComplete} />
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
    maxWidth: 140,
  },
  versionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 10px',
    borderRadius: 6,
    border: '1px solid #E2E8F0',
    background: '#fff',
    fontSize: 13,
    color: '#475569',
    cursor: 'pointer',
    outline: 'none',
    whiteSpace: 'nowrap',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 4,
    background: '#fff',
    borderRadius: 10,
    border: '1px solid #E2E8F0',
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
    zIndex: 100,
    minWidth: 160,
    padding: '4px 0',
    maxHeight: 240,
    overflowY: 'auto',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 14px',
    fontSize: 13,
    color: '#334155',
    cursor: 'pointer',
    transition: 'background 0.1s',
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
    padding: 10,
    overflow: 'hidden',
  },
  iframeWrap: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    border: '1px solid #E2E8F0',
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
