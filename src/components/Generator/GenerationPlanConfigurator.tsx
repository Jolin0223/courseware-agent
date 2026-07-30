import { ChevronDown, ChevronUp, Info, Settings2, SlidersHorizontal } from 'lucide-react';
import type { AugustGenerationPlan, GenerationPreferences } from '../../types';
import {
  htmlModelOptions,
  imageModelOptions,
} from '../../data/augustDemoData';
import GenerationPreferencePicker from './GenerationPreferencePicker';
import './augustDemo.css';

interface GenerationPlanConfiguratorProps {
  plan: AugustGenerationPlan;
  readOnly?: boolean;
  onChange: (plan: AugustGenerationPlan) => void;
}

export default function GenerationPlanConfigurator({ plan, readOnly, onChange }: GenerationPlanConfiguratorProps) {
  const selectedHtmlModel = htmlModelOptions.find(item => item.id === plan.htmlModelId) || htmlModelOptions[0];
  const selectedImageModel = imageModelOptions.find(item => item.id === plan.imageModelId) || imageModelOptions[0];
  const preferences: GenerationPreferences = {
    visualStyleMode: plan.visualStyleMode || 'smart',
    visualStyleId: plan.visualStyleId,
    visualStyleName: plan.visualStyleName,
    voiceMode: plan.voiceMode || 'smart',
    voiceId: plan.voiceId,
    voiceName: plan.voiceName,
    voiceLanguage: plan.voiceLanguage,
  };

  const update = (changes: Partial<AugustGenerationPlan>) => onChange({ ...plan, ...changes });

  const updatePreferences = (next: GenerationPreferences) => {
    update({
      visualStyleMode: next.visualStyleMode || 'smart',
      visualStyleId: next.visualStyleId || plan.visualStyleId,
      visualStyleName: next.visualStyleName || plan.visualStyleName,
      voiceMode: next.voiceMode || 'smart',
      voiceId: next.voiceId || plan.voiceId,
      voiceName: next.voiceName || plan.voiceName,
      voiceLanguage: next.voiceLanguage || plan.voiceLanguage,
    });
  };

  const selectModel = (kind: 'html' | 'image', id: string) => {
    update(kind === 'html' ? { htmlModelId: id } : { imageModelId: id });
  };

  return (
    <div className={`aug-generation-settings ${readOnly ? 'is-readonly' : ''}`}>
      <div className="aug-generation-settings-header">
        <span><SlidersHorizontal size={18} /></span>
        <div><h3>生成设置</h3><p>已根据教学需求完成预选，有明确偏好时可以修改</p></div>
        <em>{readOnly ? '已确认' : '生成前可修改'}</em>
      </div>

      <GenerationPreferencePicker
        layout="settings"
        value={preferences}
        onChange={updatePreferences}
        prompt={plan.teachingSources.map(source => `${source.sourceLabel} ${source.summary}`).join(' ')}
        disabled={readOnly}
      />

      <section className="aug-model-section">
        <button className="aug-advanced-toggle" disabled={readOnly} onClick={() => update({ advancedOpen: !plan.advancedOpen })}>
          <span><Settings2 size={17} /><span><b>高级设置</b><small>{selectedHtmlModel.name} · {selectedImageModel.name}</small></span></span>
          {plan.advancedOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
        </button>
        {plan.advancedOpen && (
          <div className="aug-model-panels">
            <ModelGroup title="HTML 生成模型" options={htmlModelOptions} selectedId={plan.htmlModelId} disabled={readOnly} onSelect={id => selectModel('html', id)} />
            <ModelGroup title="图片生成模型" options={imageModelOptions} selectedId={plan.imageModelId} disabled={readOnly} onSelect={id => selectModel('image', id)} />
          </div>
        )}
      </section>

      <div className="aug-estimate-bar">
        <span><Info size={18} /><span><b>生成期间可以离开页面</b><small>所选模型较慢时，完成等待时间会更长</small></span></span>
        <span>完成后可在「我的创作」查看</span>
      </div>
    </div>
  );
}

function ModelGroup({
  title,
  options,
  selectedId,
  disabled,
  onSelect,
}: {
  title: string;
  options: typeof htmlModelOptions;
  selectedId: string;
  disabled?: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="aug-model-group">
      <h4>{title}</h4>
      <div>
        {options.map(option => (
          <button key={option.id} disabled={disabled} className={selectedId === option.id ? 'is-selected' : ''} onClick={() => onSelect(option.id)}>
            <span className="aug-radio-dot">{selectedId === option.id && <i />}</span>
            <span><b>{option.name}</b><small>{option.description}</small></span>
            <em>{option.speedLabel}</em>
          </button>
        ))}
      </div>
    </div>
  );
}
