import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, WandSparkles, X, ZoomIn } from 'lucide-react';
import { augustVisualStyleOptions } from '../../data/augustDemoData';
import {
  getVisualStylePreviewStyle,
  visualStylePreviewImages,
} from '../../data/visualStylePresets';
import './augustDemo.css';

interface VisualStylePickerModalProps {
  open: boolean;
  selectedStyleId?: string;
  smartSelected: boolean;
  onSelect: (styleId: string, styleName: string) => void;
  onSelectSmart: () => void;
  onClose: () => void;
}

const getStylePreview = (styleId: string) => {
  const fallback = getVisualStylePreviewStyle(styleId).background as string;
  const image = visualStylePreviewImages[styleId];
  return {
    backgroundImage: image ? `url("${image}"), ${fallback}` : fallback,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
  };
};

export default function VisualStylePickerModal({
  open,
  selectedStyleId,
  smartSelected,
  onSelect,
  onSelectSmart,
  onClose,
}: VisualStylePickerModalProps) {
  const [previewStyleId, setPreviewStyleId] = useState<string | null>(null);
  const selectedStyle = augustVisualStyleOptions.find(style => style.id === selectedStyleId);
  const previewStyle = augustVisualStyleOptions.find(style => style.id === previewStyleId);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (previewStyleId) setPreviewStyleId(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open, previewStyleId]);

  if (!open) return null;

  return createPortal(
    <>
      <div className="aug-modal-mask aug-resource-style-mask" onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}>
        <section className="aug-resource-style-modal" role="dialog" aria-modal="true" aria-label="选择画面风格">
          <header className="aug-resource-style-header">
            <div>
              <h2>选择画面风格</h2>
              <p>有明确偏好时选择一种；不指定则由 AI 自由设计</p>
            </div>
            <button type="button" className="aug-icon-button aug-resource-style-close" onClick={onClose} aria-label="关闭">
              <X size={17} />
            </button>
          </header>

          <div className="aug-resource-style-body">
            <div className="aug-resource-style-section-title">
              <h3>可选风格</h3>
            </div>

            <div className="aug-resource-style-grid">
              {augustVisualStyleOptions.map(style => {
                const selected = !smartSelected && selectedStyleId === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    className={selected ? 'is-selected' : ''}
                    onClick={() => onSelect(style.id, style.name)}
                  >
                    <span className="aug-resource-style-preview" style={getStylePreview(style.id)}>
                      {visualStylePreviewImages[style.id] && (
                        <span
                          role="button"
                          tabIndex={0}
                          className="aug-resource-style-zoom"
                          aria-label={`查看${style.name}参考图`}
                          onClick={event => {
                            event.stopPropagation();
                            setPreviewStyleId(style.id);
                          }}
                          onKeyDown={event => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              event.stopPropagation();
                              setPreviewStyleId(style.id);
                            }
                          }}
                        >
                          <ZoomIn size={15} />
                        </span>
                      )}
                    </span>
                    <span className="aug-resource-style-copy">
                      <span><b>{style.name}</b>{selected && <CheckCircle2 size={16} />}</span>
                      <small>{style.desc}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <footer className="aug-resource-style-footer">
            <div>
              <small>当前选择</small>
              <b>{smartSelected ? '未指定，由 AI 自由设计' : selectedStyle?.name || '请选择风格'}</b>
            </div>
            <div>
              <button
                type="button"
                className="aug-resource-style-smart"
                onClick={() => {
                  onSelectSmart();
                  onClose();
                }}
              >
                <WandSparkles size={15} />
                交给 AI 设计
              </button>
              <button type="button" className="aug-resource-style-confirm" onClick={onClose}>确定</button>
            </div>
          </footer>
        </section>
      </div>

      {previewStyle && visualStylePreviewImages[previewStyle.id] && (
        <div className="aug-style-preview-mask" onMouseDown={event => {
          if (event.target === event.currentTarget) setPreviewStyleId(null);
        }}>
          <section className="aug-style-preview-dialog" role="dialog" aria-modal="true">
            <div className="aug-style-preview-image" style={{ backgroundImage: `url("${visualStylePreviewImages[previewStyle.id]}")` }} />
            <footer>
              <div><b>{previewStyle.name}</b><span>{previewStyle.desc}</span></div>
              <button type="button" onClick={() => setPreviewStyleId(null)}>关闭预览</button>
            </footer>
          </section>
        </div>
      )}
    </>,
    document.body,
  );
}
