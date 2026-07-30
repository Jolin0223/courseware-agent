import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Brain, Check, Layers3, Sparkles, Info, X } from 'lucide-react';
import type { GenerationPreferences } from '../../types';
import {
  generationModeOptions,
  getGenerationModeByModels,
} from '../../data/augustDemoData';
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
  const selectedMode = getGenerationModeByModels(htmlModelId, imageModelId);
  const slowerModeSelected = selectedMode.id !== 'smart';

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const selectMode = (modeId: string) => {
    const mode = generationModeOptions.find(item => item.id === modeId) || generationModeOptions[0];
    onChange({
      ...value,
      htmlModelId: mode.htmlModelId,
      imageModelId: mode.imageModelId,
      estimatedMinutes: undefined,
    });
  };

  return createPortal(
    <div className="aug-modal-mask" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="aug-model-picker-modal" role="dialog" aria-modal="true" aria-label="选择生成模式">
        <header className="aug-modal-header">
          <div>
            <h2>选择生成模式</h2>
            <p>不确定时保持智能生成即可；选择更高模式后，系统会投入更多生成能力</p>
          </div>
          <button type="button" className="aug-icon-button" onClick={onClose} aria-label="关闭"><X size={19} /></button>
        </header>

        <div className="aug-mode-picker-body">
          {generationModeOptions.map((mode, index) => {
            const selected = selectedMode.id === mode.id;
            const Icon = index === 0 ? Sparkles : index === 1 ? Layers3 : Brain;
            return (
              <button key={mode.id} type="button" className={`aug-mode-option ${selected ? 'is-selected' : ''}`} onClick={() => selectMode(mode.id)}>
                <span className="aug-mode-option-icon"><Icon size={20} /></span>
                <span className="aug-mode-option-copy">
                  <span><b>{mode.name}</b><em>{mode.tag}</em></span>
                  <strong>{mode.description}</strong>
                  <small>{mode.suitableFor}</small>
                </span>
                <span className="aug-mode-check">{selected && <Check size={15} />}</span>
              </button>
            );
          })}
        </div>

        <footer className="aug-model-picker-footer">
          <div className={`aug-model-notice ${slowerModeSelected ? 'is-slow' : ''}`}>
            <Info size={16} />
            <span>{slowerModeSelected ? `${selectedMode.notice} 完成后可在「我的创作」查看。` : '生成期间可以离开页面，完成后可在「我的创作」查看。'}</span>
          </div>
          <button type="button" className="aug-button-primary aug-model-confirm" onClick={onClose}>确定</button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
