import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Wand2,
  WandSparkles,
  X,
  ZoomIn,
} from 'lucide-react';
import {
  baseVisualStylePresets,
  enhancementVisualStylePreviewImages,
  enhancementVisualStylePresets,
  getVisualStylePreviewStyle,
  getVisualStyleSelection,
  visualStylePreviewImages,
} from '../../data/visualStylePresets';
import './augustDemo.css';

interface VisualStylePickerModalProps {
  open: boolean;
  variant?: 'select' | 'adjust';
  selectedBaseStyleId?: string | null;
  selectedEnhancementStyleIds?: string[];
  smartSelected?: boolean;
  onSelectBaseStyle: (styleId: string) => void;
  onToggleEnhancementStyle: (styleId: string) => void;
  onSelectSmart?: () => void;
  onClose: () => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
  footerControls?: ReactNode;
}

type PreviewStyle = {
  id: string;
  name: string;
  desc: string;
  image: string;
  kind: 'base' | 'enhancement';
};

export default function VisualStylePickerModal({
  open,
  variant = 'select',
  selectedBaseStyleId,
  selectedEnhancementStyleIds = [],
  smartSelected = false,
  onSelectBaseStyle,
  onToggleEnhancementStyle,
  onSelectSmart,
  onClose,
  onConfirm,
  confirmDisabled = false,
  footerControls,
}: VisualStylePickerModalProps) {
  const [previewingStyle, setPreviewingStyle] = useState<PreviewStyle | null>(null);
  const selection = useMemo(
    () => getVisualStyleSelection(selectedBaseStyleId || null, selectedEnhancementStyleIds),
    [selectedBaseStyleId, selectedEnhancementStyleIds],
  );
  const hasSelection = Boolean(selection.selectedBaseStyle || selection.selectedEnhancements.length);

  const flowLabel = variant === 'adjust'
    ? selection.selectedBaseStyle
      ? selection.selectedEnhancements.length
        ? '重新生成课件，并在资产规划阶段叠加图片质感'
        : '按基础风格 UI 规范重新生成课件'
      : selection.selectedEnhancements.length
        ? '仅对现有图片资产做图生图质感叠加'
        : '请选择基础风格或叠加图片质感'
    : selection.selectedBaseStyle
      ? selection.selectedEnhancements.length
        ? '按所选基础风格生成，并叠加图片质感'
        : '按所选基础风格生成课件'
      : selection.selectedEnhancements.length
        ? '基础风格由 AI 设计，并叠加所选图片质感'
        : '不指定时，由 AI 自由设计';

  const previewStyleList = useMemo(() => previewingStyle
    ? (previewingStyle.kind === 'base' ? baseVisualStylePresets : enhancementVisualStylePresets)
      .filter(style => Boolean((previewingStyle.kind === 'base' ? visualStylePreviewImages : enhancementVisualStylePreviewImages)[style.id]))
    : [], [previewingStyle]);
  const previewStyleIndex = previewingStyle
    ? Math.max(0, previewStyleList.findIndex(style => style.id === previewingStyle.id))
    : 0;

  const openPreview = useCallback((kind: 'base' | 'enhancement', styleId: string) => {
    const styles = kind === 'base' ? baseVisualStylePresets : enhancementVisualStylePresets;
    const images = kind === 'base' ? visualStylePreviewImages : enhancementVisualStylePreviewImages;
    const style = styles.find(item => item.id === styleId);
    const image = images[styleId];
    if (style && image) setPreviewingStyle({ ...style, image, kind });
  }, []);

  const switchPreview = useCallback((direction: -1 | 1) => {
    if (!previewingStyle || previewStyleList.length < 2) return;
    const nextIndex = (previewStyleIndex + direction + previewStyleList.length) % previewStyleList.length;
    openPreview(previewingStyle.kind, previewStyleList[nextIndex].id);
  }, [openPreview, previewingStyle, previewStyleIndex, previewStyleList]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (previewingStyle) setPreviewingStyle(null);
        else onClose();
      }
      if (previewingStyle && event.key === 'ArrowLeft') switchPreview(-1);
      if (previewingStyle && event.key === 'ArrowRight') switchPreview(1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open, previewingStyle, previewStyleIndex, previewStyleList.length, switchPreview]);

  if (!open) return null;

  return createPortal(
    <>
      <div className="aug-modal-mask aug-visual-style-mask" onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}>
        <section className="aug-visual-style-modal" role="dialog" aria-modal="true" aria-label={variant === 'adjust' ? '调整画面风格' : '选择画面风格'}>
          <header className="aug-visual-style-header">
            <div>
              <h2>{variant === 'adjust' ? '调整画面风格' : '选择画面风格'}</h2>
              <p>
                {variant === 'adjust'
                  ? '基础风格会按该风格的 UI 规范重新生成课件；图片质感可单独使用，也可叠加到基础风格中一起生成'
                  : '基础风格会按该风格的 UI 规范生成课件；图片质感可单独使用，也可叠加到基础风格中一起生成'}
              </p>
            </div>
            <button type="button" className="aug-icon-button aug-visual-style-close" onClick={onClose} aria-label="关闭">
              <X size={17} />
            </button>
          </header>

          <div className="aug-visual-style-content">
            <div className="aug-visual-style-base-panel">
              <div className="aug-visual-style-section-title">
                <div>
                  <h3>1. 基础风格</h3>
                  <p>可选。选择后按该风格的 UI 规范{variant === 'adjust' ? '重新' : ''}生成课件</p>
                </div>
                <span>{baseVisualStylePresets.length} 种</span>
              </div>

              <div className="aug-visual-style-base-grid">
                {baseVisualStylePresets.map(style => {
                  const selected = selectedBaseStyleId === style.id;
                  const previewImage = visualStylePreviewImages[style.id];
                  return (
                    <button
                      key={style.id}
                      type="button"
                      className={selected ? 'is-selected' : ''}
                      onClick={() => onSelectBaseStyle(style.id)}
                    >
                      <span className="aug-visual-style-base-preview" style={getVisualStylePreviewStyle(style.id)}>
                        {previewImage && <img src={previewImage} alt={`${style.name}参考图`} loading="eager" />}
                        {previewImage && (
                          <span
                            role="button"
                            tabIndex={0}
                            className="aug-visual-style-zoom"
                            aria-label={`查看${style.name}参考图`}
                            onClick={event => {
                              event.stopPropagation();
                              openPreview('base', style.id);
                            }}
                            onKeyDown={event => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                event.stopPropagation();
                                openPreview('base', style.id);
                              }
                            }}
                          >
                            <ZoomIn size={15} />
                          </span>
                        )}
                      </span>
                      <span className="aug-visual-style-card-copy">
                        <span><b>{style.name}</b>{selected && <CheckCircle2 size={15} />}</span>
                        <small>{style.desc}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <aside className="aug-visual-style-enhancement-panel">
              <div className="aug-visual-style-section-title">
                <div>
                  <h3>2. 图片质感</h3>
                  <p>
                    {variant === 'adjust'
                      ? '可选。未选基础风格时只对现有图片做质感叠加'
                      : '可选。未选基础风格时，由 AI 设计基础风格后叠加质感'}
                  </p>
                </div>
              </div>

              <div className="aug-visual-style-enhancement-list">
                {enhancementVisualStylePresets.map(style => {
                  const selected = selectedEnhancementStyleIds.includes(style.id);
                  const previewImage = enhancementVisualStylePreviewImages[style.id];
                  return (
                    <button
                      key={style.id}
                      type="button"
                      className={selected ? 'is-selected' : ''}
                      onClick={() => onToggleEnhancementStyle(style.id)}
                    >
                      <span className="aug-visual-style-check">{selected && <CheckCircle2 size={13} />}</span>
                      <span className="aug-visual-style-texture-preview">
                        {previewImage && <img src={previewImage} alt={`${style.name}示例`} loading="eager" />}
                        {previewImage && (
                          <span
                            role="button"
                            tabIndex={0}
                            className="aug-visual-style-zoom"
                            aria-label={`查看${style.name}参考图`}
                            onClick={event => {
                              event.stopPropagation();
                              openPreview('enhancement', style.id);
                            }}
                            onKeyDown={event => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                event.stopPropagation();
                                openPreview('enhancement', style.id);
                              }
                            }}
                          >
                            <ZoomIn size={14} />
                          </span>
                        )}
                      </span>
                      <span className="aug-visual-style-card-copy">
                        <b>{style.name}</b>
                        <small>{style.desc}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>
          </div>

          <footer className="aug-visual-style-footer">
            <div className="aug-visual-style-summary">
              <small>{flowLabel}</small>
              <b>{smartSelected && !hasSelection ? '未指定，由 AI 自由设计' : selection.styleName || '暂未选择风格'}</b>
            </div>
            <div className="aug-visual-style-actions">
              {footerControls && <div className="aug-visual-style-footer-controls">{footerControls}</div>}
              {variant === 'select' && onSelectSmart && (
                <button
                  type="button"
                  className="aug-visual-style-smart"
                  onClick={() => {
                    onSelectSmart();
                    onClose();
                  }}
                >
                  <WandSparkles size={15} />
                  交给 AI 设计
                </button>
              )}
              <button
                type="button"
                className="aug-visual-style-confirm"
                onClick={onConfirm}
                disabled={confirmDisabled}
              >
                {variant === 'adjust' && <Wand2 size={16} />}
                {variant === 'adjust' ? '重新生成课件' : '确定'}
              </button>
            </div>
          </footer>
        </section>
      </div>

      {previewingStyle && (
        <div className="aug-visual-style-preview-mask" onMouseDown={event => {
          if (event.target === event.currentTarget) setPreviewingStyle(null);
        }}>
          <section className={`aug-visual-style-preview-dialog is-${previewingStyle.kind}`} role="dialog" aria-modal="true">
            <div className="aug-visual-style-preview-image">
              <img src={previewingStyle.image} alt={`${previewingStyle.name}大图参考`} />
              {previewStyleList.length > 1 && (
                <>
                  <button type="button" className="is-previous" onClick={() => switchPreview(-1)} aria-label="查看上一张风格参考图">
                    <ChevronLeft size={22} />
                  </button>
                  <button type="button" className="is-next" onClick={() => switchPreview(1)} aria-label="查看下一张风格参考图">
                    <ChevronRight size={22} />
                  </button>
                  <span className="aug-visual-style-preview-count">{previewStyleIndex + 1} / {previewStyleList.length}</span>
                </>
              )}
              <button type="button" className="is-close" onClick={() => setPreviewingStyle(null)} aria-label="关闭预览">
                <X size={17} />
              </button>
            </div>
            <footer>
              <div><b>{previewingStyle.name}</b><span>{previewingStyle.desc}</span></div>
              <button type="button" onClick={() => setPreviewingStyle(null)}>关闭预览</button>
            </footer>
          </section>
        </div>
      )}
    </>,
    document.body,
  );
}
