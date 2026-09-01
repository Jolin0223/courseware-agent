import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Copy, X } from 'lucide-react';
import PageLoadingState from '../common/PageLoadingState';
import toast from '../../utils/toast';
import './coursewareResourcePreviewModal.css';

export interface CoursewareResourcePreviewData {
  id: string;
  title: string;
  previewUrl?: string;
  coverUrl?: string;
  materialId: string;
  resourceOwner: string;
  contentTags: string[];
  knowledgePoints: string[];
  uploader?: string;
  modifier?: string;
  size?: string;
}

interface CoursewareResourcePreviewModalProps {
  resource: CoursewareResourcePreviewData;
  onClose: () => void;
  onClone?: () => void;
  cloneDisabled?: boolean;
  showIteachSearch?: boolean;
}

export default function CoursewareResourcePreviewModal({
  resource,
  onClose,
  onClone,
  cloneDisabled = false,
  showIteachSearch = false,
}: CoursewareResourcePreviewModalProps) {
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [copiedMaterialId, setCopiedMaterialId] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const copyText = async (text: string) => {
    if (window.navigator.clipboard?.writeText && window.isSecureContext) {
      try {
        await window.navigator.clipboard.writeText(text);
        return;
      } catch {
        // Some embedded browsers block Clipboard API; use the user-gesture fallback below.
      }
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    textarea.setAttribute('readonly', '');
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    if (!copied) throw new Error('copy failed');
  };

  const copyMaterialId = async (showIteachToast = false) => {
    try {
      await copyText(resource.materialId);
      setCopiedMaterialId(true);
      window.setTimeout(() => setCopiedMaterialId(false), 1500);
      if (showIteachToast) toast('已复制资源ID，去ITeach资源中心搜索查询');
    } catch {
      setCopiedMaterialId(false);
      toast('资源ID复制失败，请稍后重试');
    }
  };

  const auditRows = [
    resource.uploader ? { label: '上传', value: resource.uploader } : null,
    resource.modifier ? { label: '修改', value: resource.modifier } : null,
    resource.size ? { label: '大小', value: resource.size } : null,
  ].filter((row): row is { label: string; value: string } => Boolean(row));

  return createPortal(
    <div className="courseware-resource-preview-mask" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="courseware-resource-preview-modal" role="dialog" aria-modal="true" aria-label={`${resource.title}课件预览`}>
        <header className="courseware-resource-preview-header">
          <div>
            <small>互动课件资源</small>
            <h3>{resource.title}</h3>
          </div>
          <button type="button" aria-label="关闭课件预览" onClick={onClose}><X size={18} /></button>
        </header>

        <div className="courseware-resource-preview-body">
          <div className="courseware-resource-preview-stage">
            {resource.previewUrl ? (
              <>
                <iframe
                  title={`${resource.title}试玩`}
                  sandbox="allow-scripts allow-same-origin"
                  src={resource.previewUrl}
                  onLoad={() => setPreviewLoaded(true)}
                />
                {!previewLoaded && <PageLoadingState fill variant="dots" title="正在加载中" />}
              </>
            ) : resource.coverUrl ? (
              <img src={resource.coverUrl} alt={`${resource.title}封面`} />
            ) : (
              <div className="courseware-resource-preview-empty">该课件暂未配置试玩</div>
            )}
          </div>

          <aside className="courseware-resource-preview-details">
            <div className="courseware-resource-preview-id">
              <span>素材ID</span>
              <div>
                <code>{resource.materialId}</code>
                <button type="button" aria-label="复制素材ID" onClick={() => { void copyMaterialId(); }}>
                  {copiedMaterialId ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <section>
              <small>资源归属</small>
              <strong>{resource.resourceOwner}</strong>
            </section>

            <section>
              <small>内容标签</small>
              <div className="courseware-resource-preview-tags is-content">
                {resource.contentTags.map(tag => <span key={tag}>{tag}</span>)}
              </div>
            </section>

            <section>
              <small>知识点</small>
              <div className="courseware-resource-preview-tags">
                {resource.knowledgePoints.map(point => <span key={point}>{point}</span>)}
              </div>
            </section>

            {auditRows.length > 0 && (
              <div className="courseware-resource-preview-audit">
                {auditRows.map(row => (
                  <div key={row.label}><span>{row.label}</span><b>{row.value}</b></div>
                ))}
              </div>
            )}
          </aside>
        </div>

        <footer className="courseware-resource-preview-footer">
          {showIteachSearch && (
            <button type="button" className="is-secondary is-iteach" onClick={() => { void copyMaterialId(true); }}>
              <Copy size={14} />去ITeach直接使用
            </button>
          )}
          {onClone && (
            <button type="button" className="is-primary" disabled={cloneDisabled} onClick={onClone}>
              <Copy size={14} />一键同款
            </button>
          )}
        </footer>
      </section>
    </div>,
    document.body,
  );
}
