import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, Code2, Image, Info, X } from 'lucide-react';
import type { GenerationPreferences } from '../../types';
import { htmlModelOptions, imageModelOptions } from '../../data/augustDemoData';
import './augustDemo.css';

interface ModelPreferenceModalProps {
  open: boolean;
  value: GenerationPreferences;
  onChange: (value: GenerationPreferences) => void;
  onClose: () => void;
}

export default function ModelPreferenceModal({ open, value, onChange, onClose }: ModelPreferenceModalProps) {
  const htmlModelId = value.htmlModelId || 'smart-html';
  const imageModelId = value.imageModelId || 'smart-image';
  const slowerModelSelected = htmlModelId === 'gpt-5.5' || imageModelId === 'jimeng-5.0' || imageModelId === 'image-2';

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const selectModel = (kind: 'html' | 'image', id: string) => {
    const nextHtmlModelId = kind === 'html' ? id : htmlModelId;
    const nextImageModelId = kind === 'image' ? id : imageModelId;
    onChange({
      ...value,
      htmlModelId: nextHtmlModelId,
      imageModelId: nextImageModelId,
      estimatedMinutes: undefined,
    });
  };

  return createPortal(
    <div className="aug-modal-mask" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="aug-model-picker-modal" role="dialog" aria-modal="true" aria-label="选择生成模型">
        <header className="aug-modal-header">
          <div>
            <h2>选择生成模型</h2>
            <p>不熟悉模型时保持智能选择即可；指定后会按所选模型生成</p>
          </div>
          <button type="button" className="aug-icon-button" onClick={onClose} aria-label="关闭"><X size={19} /></button>
        </header>

        <div className="aug-model-picker-body">
          <ModelColumn
            icon={Code2}
            title="HTML 生成模型"
            description="决定互动逻辑、页面结构和代码质量"
            options={htmlModelOptions}
            selectedId={htmlModelId}
            onSelect={id => selectModel('html', id)}
          />
          <ModelColumn
            icon={Image}
            title="图片生成模型"
            description="决定场景、角色和图片素材的表现"
            options={imageModelOptions}
            selectedId={imageModelId}
            onSelect={id => selectModel('image', id)}
          />
        </div>

        <footer className="aug-model-picker-footer">
          <div className={`aug-model-notice ${slowerModelSelected ? 'is-slow' : ''}`}>
            <Info size={16} />
            <span>{slowerModelSelected ? '所选模型生成时间较长，完成后可在「我的创作」查看' : '生成期间可以离开页面，完成后可在「我的创作」查看'}</span>
          </div>
          <button type="button" className="aug-button-primary aug-model-confirm" onClick={onClose}>确定</button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}

function ModelColumn({
  icon: Icon,
  title,
  description,
  options,
  selectedId,
  onSelect,
}: {
  icon: typeof Code2;
  title: string;
  description: string;
  options: typeof htmlModelOptions;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="aug-model-picker-column">
      <header>
        <span><Icon size={18} /></span>
        <div><h3>{title}</h3><p>{description}</p></div>
      </header>
      <div className="aug-model-picker-options">
        {options.map(option => {
          const selected = selectedId === option.id;
          return (
            <button key={option.id} type="button" className={selected ? 'is-selected' : ''} onClick={() => onSelect(option.id)}>
              <span className="aug-model-radio">{selected && <Check size={13} />}</span>
              <span className="aug-model-option-copy">
                <span><b>{option.name}</b><em>{option.speedLabel}</em></span>
                <small>{option.description}</small>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
