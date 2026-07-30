import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Cpu, Palette, Play, Sparkles, Volume2, X } from 'lucide-react';
import type { GenerationPreferences } from '../../types';
import {
  augustVisualStyleOptions,
  demoVoiceOptions,
  htmlModelOptions,
  imageModelOptions,
} from '../../data/augustDemoData';
import {
  getVisualStylePreviewStyle,
  visualStylePreviewImages,
} from '../../data/visualStylePresets';
import ModelPreferenceModal from './ModelPreferenceModal';
import VisualStylePickerModal from './VisualStylePickerModal';
import './augustDemo.css';

interface GenerationPreferencePickerProps {
  value: GenerationPreferences;
  onChange: (value: GenerationPreferences) => void;
  prompt?: string;
  disabled?: boolean;
  layout?: 'input' | 'settings';
}

type VoiceTab = 'recommended' | 'all' | 'dedicated';
type VoiceGender = '全部声音' | '女生' | '男生';

const languageOptions = ['全部语言', '中文', '英语', '英式英语', '法语', '日语'];

const getStylePreview = (styleId: string) => {
  const fallback = getVisualStylePreviewStyle(styleId).background as string;
  const image = visualStylePreviewImages[styleId];
  return {
    backgroundImage: image ? `url("${image}"), ${fallback}` : fallback,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
  };
};

const getRecommendedVoiceIds = (prompt: string) => (
  /英语|英文|单词|自然拼读|word|english/i.test(prompt)
    ? ['amy', 'oliver']
    : ['yunxi', 'xiaotong', 'yunhao']
);

export default function GenerationPreferencePicker({
  value,
  onChange,
  prompt = '',
  disabled,
  layout = 'input',
}: GenerationPreferencePickerProps) {
  const [styleModalOpen, setStyleModalOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [modelModalOpen, setModelModalOpen] = useState(false);
  const [voiceTab, setVoiceTab] = useState<VoiceTab>('recommended');
  const [voiceLanguage, setVoiceLanguage] = useState('全部语言');
  const [voiceGender, setVoiceGender] = useState<VoiceGender>('全部声音');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  const recommendedVoiceIds = useMemo(() => getRecommendedVoiceIds(prompt), [prompt]);
  const selectedStyle = augustVisualStyleOptions.find(style => style.id === value.visualStyleId);
  const selectedVoice = demoVoiceOptions.find(voice => voice.id === value.voiceId);
  const selectedHtmlModel = htmlModelOptions.find(model => model.id === (value.htmlModelId || 'smart-html')) || htmlModelOptions[0];
  const selectedImageModel = imageModelOptions.find(model => model.id === (value.imageModelId || 'smart-image')) || imageModelOptions[0];

  const visibleVoices = demoVoiceOptions.filter(voice => {
    const tabMatch = voiceTab === 'dedicated'
      ? voice.dedicated
      : voiceTab === 'recommended'
        ? recommendedVoiceIds.includes(voice.id)
        : !voice.dedicated;
    const languageMatch = voiceLanguage === '全部语言' || voice.language === voiceLanguage;
    const genderMatch = voiceGender === '全部声音' || voice.gender === voiceGender;
    return tabMatch && languageMatch && genderMatch;
  });

  const selectSmartStyle = () => {
    onChange({
      ...value,
      visualStyleMode: 'smart',
      visualStyleId: undefined,
      visualStyleName: undefined,
    });
  };

  const selectSmartVoice = () => {
    const smart = demoVoiceOptions.find(voice => recommendedVoiceIds.includes(voice.id));
    onChange({
      ...value,
      voiceMode: 'smart',
      voiceId: layout === 'settings' ? smart?.id : undefined,
      voiceName: layout === 'settings' ? smart?.name : undefined,
      voiceLanguage: layout === 'settings' ? smart?.language : undefined,
    });
    setVoiceModalOpen(false);
  };

  const previewVoice = (voiceId: string, language: string) => {
    window.speechSynthesis?.cancel();
    setPlayingVoiceId(voiceId);
    const sample = language.includes('英语')
      ? 'Welcome to our class. Let us start the game.'
      : '欢迎来到课堂，我们一起开始今天的挑战。';
    const utterance = new SpeechSynthesisUtterance(sample);
    utterance.lang = language.includes('英语') ? 'en-US' : 'zh-CN';
    utterance.rate = 0.95;
    utterance.onend = () => setPlayingVoiceId(null);
    utterance.onerror = () => setPlayingVoiceId(null);
    window.speechSynthesis?.speak(utterance);
  };

  const styleTrigger = (
    <button
      type="button"
      className={layout === 'settings' ? 'aug-setting-choice' : `aug-preference-trigger ${value.visualStyleMode === 'manual' ? 'is-specified' : ''}`}
      disabled={disabled}
      onClick={() => setStyleModalOpen(true)}
      aria-label={layout === 'input' ? `画面风格：${value.visualStyleMode === 'manual' ? selectedStyle?.name || value.visualStyleName || '已指定' : 'AI设计'}` : undefined}
    >
      {layout === 'settings' && selectedStyle ? (
        <span className="aug-setting-preview" style={getStylePreview(selectedStyle.id)} />
      ) : (
        <Palette size={16} />
      )}
      <span>
        {layout === 'settings' && <small>画面风格 · {value.visualStyleMode === 'manual' ? '已指定' : 'AI推荐'}</small>}
        <b>{layout === 'input'
          ? value.visualStyleMode === 'manual' ? selectedStyle?.name || value.visualStyleName || '已选风格' : '画面风格'
          : selectedStyle?.name || value.visualStyleName || 'AI设计'}</b>
      </span>
      {layout === 'settings' && <em>修改</em>}
      {layout === 'input' && <ChevronDown className="aug-preference-chevron" size={14} />}
    </button>
  );

  const voiceTrigger = (
    <button
      type="button"
      className={layout === 'settings' ? 'aug-setting-choice' : `aug-preference-trigger ${value.voiceMode === 'manual' ? 'is-specified' : ''}`}
      disabled={disabled}
      onClick={() => setVoiceModalOpen(true)}
      aria-label={layout === 'input' ? `课件音色：${value.voiceMode === 'manual' ? selectedVoice?.name || value.voiceName || '已指定' : '智能推荐'}` : undefined}
    >
      {layout === 'settings' && selectedVoice ? (
        <span className={`aug-voice-avatar aug-voice-${selectedVoice.gender === '女生' ? 'female' : 'male'}`}>{selectedVoice.name.slice(0, 1)}</span>
      ) : (
        <Volume2 size={16} />
      )}
      <span>
        {layout === 'settings' && <small>课件音色 · {value.voiceMode === 'manual' ? '已指定' : 'AI推荐'}</small>}
        <b>{layout === 'input'
          ? value.voiceMode === 'manual' ? selectedVoice?.name || value.voiceName || '已选音色' : '课件音色'
          : selectedVoice?.name || value.voiceName || '智能推荐'}</b>
      </span>
      {layout === 'settings' && <em>修改</em>}
      {layout === 'input' && <ChevronDown className="aug-preference-chevron" size={14} />}
    </button>
  );

  const modelSpecified = selectedHtmlModel.id !== 'smart-html' || selectedImageModel.id !== 'smart-image';
  const modelTrigger = layout === 'input' ? (
    <button
      type="button"
      className={`aug-preference-trigger aug-model-trigger ${modelSpecified ? 'is-specified' : ''}`}
      disabled={disabled}
      onClick={() => setModelModalOpen(true)}
      aria-label={`生成模型：${modelSpecified ? `${selectedHtmlModel.name} + ${selectedImageModel.name}` : '智能选择'}`}
    >
      <Cpu size={16} />
      <span>
        <b>{modelSpecified ? `${selectedHtmlModel.name} + ${selectedImageModel.name}` : '生成模型'}</b>
      </span>
      <ChevronDown className="aug-preference-chevron" size={14} />
    </button>
  ) : null;

  const overlay = voiceModalOpen ? createPortal(
    <>
      {voiceModalOpen && (
        <div className="aug-modal-mask" onMouseDown={event => { if (event.target === event.currentTarget) setVoiceModalOpen(false); }}>
          <section className="aug-voice-modal" role="dialog" aria-modal="true">
            <header className="aug-modal-header"><div><h2>选择课件音色</h2><p>用于讲解、发音和反馈；可试听后再选择</p></div><button className="aug-icon-button" onClick={() => setVoiceModalOpen(false)} aria-label="关闭"><X size={19} /></button></header>
            <div className="aug-voice-tabs">
              <button className={voiceTab === 'recommended' ? 'is-active' : ''} onClick={() => setVoiceTab('recommended')}>推荐</button>
              <button className={voiceTab === 'all' ? 'is-active' : ''} onClick={() => setVoiceTab('all')}>全部音色</button>
              <button className={voiceTab === 'dedicated' ? 'is-active' : ''} onClick={() => setVoiceTab('dedicated')}>我的专属</button>
            </div>
            <div className="aug-voice-body">
              <aside>{languageOptions.map(language => <button key={language} className={voiceLanguage === language ? 'is-active' : ''} onClick={() => setVoiceLanguage(language)}>{language}</button>)}</aside>
              <main>
                <button className={`aug-smart-voice ${value.voiceMode !== 'manual' ? 'is-selected' : ''}`} onClick={selectSmartVoice}><Sparkles size={16} /><span><b>智能推荐</b><small>AI根据课件语言和学生年龄选择</small></span>{value.voiceMode !== 'manual' && <Check size={15} />}</button>
                <div className="aug-gender-tabs">{(['全部声音', '女生', '男生'] as const).map(gender => <button key={gender} className={voiceGender === gender ? 'is-active' : ''} onClick={() => setVoiceGender(gender)}>{gender}</button>)}</div>
                <div className="aug-voice-grid">
                  {visibleVoices.length ? visibleVoices.map(voice => {
                    const selected = value.voiceMode === 'manual' && voice.id === value.voiceId;
                    return <button key={voice.id} className={selected ? 'is-selected' : ''} onClick={() => onChange({ ...value, voiceMode: 'manual', voiceId: voice.id, voiceName: voice.name, voiceLanguage: voice.language })}>
                      <span className={`aug-voice-avatar aug-voice-${voice.gender === '女生' ? 'female' : 'male'}`}>{voice.name.slice(0, 1)}</span>
                      <span><b>{voice.name}</b><small>{voice.language} · {voice.tag}</small></span>
                      <i onClick={event => { event.stopPropagation(); previewVoice(voice.id, voice.language); }} aria-label={`试听${voice.name}`}><Play size={13} fill="currentColor" />{playingVoiceId === voice.id && <em />}</i>
                    </button>;
                  }) : <div className="aug-voice-empty">当前筛选下暂无音色</div>}
                </div>
              </main>
            </div>
            <footer className="aug-modal-footer"><span>{value.voiceMode === 'manual' ? `已选：${value.voiceName} · ${value.voiceLanguage}` : '当前：智能推荐'}</span><div><button className="aug-button-primary" onClick={() => setVoiceModalOpen(false)}>确定</button></div></footer>
          </section>
        </div>
      )}
    </>,
    document.body,
  ) : null;

  return (
    <>
      <div className={layout === 'settings' ? 'aug-setting-preferences' : 'aug-input-preferences'}>
        {styleTrigger}
        {voiceTrigger}
        {modelTrigger}
      </div>
      <VisualStylePickerModal
        open={styleModalOpen}
        selectedStyleId={value.visualStyleId}
        smartSelected={value.visualStyleMode !== 'manual'}
        onSelect={(styleId, styleName) => onChange({
          ...value,
          visualStyleMode: 'manual',
          visualStyleId: styleId,
          visualStyleName: styleName,
        })}
        onSelectSmart={selectSmartStyle}
        onClose={() => setStyleModalOpen(false)}
      />
      <ModelPreferenceModal
        open={modelModalOpen}
        value={value}
        onChange={onChange}
        onClose={() => setModelModalOpen(false)}
      />
      {overlay}
    </>
  );
}
