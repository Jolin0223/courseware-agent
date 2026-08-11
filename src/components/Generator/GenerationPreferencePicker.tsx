import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  ChevronDown,
  Cpu,
  Loader2,
  Mic,
  Palette,
  Pause,
  Play,
  RotateCcw,
  Square,
  Volume2,
  Wand2,
  X,
} from 'lucide-react';
import type { GenerationPreferences } from '../../types';
import {
  DEFAULT_VOICE_LANGUAGE,
  demoVoiceOptions,
  generationModeOptions,
  getGenerationModeByModels,
  getDefaultVoiceForLanguage,
  voiceLanguageOptions,
  type DemoVoiceLanguage,
  type DemoVoiceOption,
} from '../../data/augustDemoData';
import {
  baseVisualStylePresets,
  getVisualStylePreviewStyle,
  getVisualStyleSelection,
  visualStylePreviewImages,
} from '../../data/visualStylePresets';
import VisualStylePickerModal from './VisualStylePickerModal';
import './augustDemo.css';

interface GenerationPreferencePickerProps {
  value: GenerationPreferences;
  onChange: (value: GenerationPreferences) => void;
  prompt?: string;
  disabled?: boolean;
  layout?: 'input' | 'settings';
}

type VoiceTab = 'featured' | 'dedicated';
type VoiceSelectionSource = 'featured' | 'dedicated';
type CloneStage = 'empty' | 'ready' | 'recording' | 'review' | 'generating';

const CLONE_SENTENCE = '大家好，欢迎来到我的课堂，让我们一起开始今天的学习吧。';

const getStylePreview = (styleId: string) => {
  const fallback = getVisualStylePreviewStyle(styleId).background as string;
  const image = visualStylePreviewImages[styleId];
  return {
    backgroundImage: image ? `url("${image}"), ${fallback}` : fallback,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
  };
};

const isVoiceLanguage = (language?: string): language is DemoVoiceLanguage => (
  Boolean(language && voiceLanguageOptions.includes(language as DemoVoiceLanguage))
);

export default function GenerationPreferencePicker({
  value,
  onChange,
  disabled,
  layout = 'input',
}: GenerationPreferencePickerProps) {
  const [styleModalOpen, setStyleModalOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [modePopoverOpen, setModePopoverOpen] = useState(false);
  const [voiceTab, setVoiceTab] = useState<VoiceTab>('featured');
  const [voiceLanguage, setVoiceLanguage] = useState<DemoVoiceLanguage>(DEFAULT_VOICE_LANGUAGE);
  const [draftVoiceId, setDraftVoiceId] = useState('');
  const [draftSelectionSource, setDraftSelectionSource] = useState<VoiceSelectionSource>('featured');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [clonedVoice, setClonedVoice] = useState<DemoVoiceOption | null>(null);
  const [cloneStage, setCloneStage] = useState<CloneStage>('empty');
  const [cloneConsent, setCloneConsent] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [cloneSuccess, setCloneSuccess] = useState(false);
  const modeTriggerRef = useRef<HTMLButtonElement | null>(null);
  const modePopoverRef = useRef<HTMLDivElement | null>(null);
  const [modePopoverStyle, setModePopoverStyle] = useState<CSSProperties>({});

  const voiceOptions = useMemo(
    () => clonedVoice ? [...demoVoiceOptions, clonedVoice] : demoVoiceOptions,
    [clonedVoice],
  );
  const selectedStyle = baseVisualStylePresets.find(style => style.id === value.visualStyleId);
  const selectedVoice = voiceOptions.find(voice => voice.id === value.voiceId);
  const selectedGenerationMode = generationModeOptions.find(mode => mode.id === value.generationModeId)
    || getGenerationModeByModels(value.htmlModelId, value.imageModelId);
  const draftVoice = voiceOptions.find(voice => voice.id === draftVoiceId)
    || (voiceTab === 'featured' ? getDefaultVoiceForLanguage(voiceLanguage) : undefined);

  const updateModePopoverPosition = () => {
    const trigger = modeTriggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(304, window.innerWidth - 32);
    const left = Math.min(Math.max(16, rect.right - width), Math.max(16, window.innerWidth - width - 16));
    const direction = rect.top < 330 ? 'down' : 'up';
    setModePopoverStyle({
      left,
      width,
      top: direction === 'down' ? rect.bottom + 8 : undefined,
      bottom: direction === 'up' ? window.innerHeight - rect.top + 8 : undefined,
    });
  };

  useEffect(() => {
    if (!modePopoverOpen) return undefined;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !modePopoverRef.current?.contains(target)
        && !modeTriggerRef.current?.contains(target)
      ) {
        setModePopoverOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setModePopoverOpen(false);
    };
    const handleResize = () => updateModePopoverPosition();
    updateModePopoverPosition();
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [modePopoverOpen]);

  const closeVoiceModal = useCallback(() => {
    window.speechSynthesis?.cancel();
    setPlayingVoiceId(null);
    setVoiceModalOpen(false);
  }, []);

  useEffect(() => {
    if (!voiceModalOpen) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeVoiceModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeVoiceModal, voiceModalOpen]);

  useEffect(() => {
    if (cloneStage !== 'recording') return undefined;
    const timer = window.setInterval(() => {
      setRecordingSeconds(seconds => {
        if (seconds >= 7) {
          window.clearInterval(timer);
          setCloneStage('review');
          return 8;
        }
        return seconds + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cloneStage]);

  useEffect(() => {
    if (cloneStage !== 'generating') return undefined;
    const timer = window.setTimeout(() => {
      const nextVoice: DemoVoiceOption = {
        id: 'my-cloned-voice',
        name: '我的声音',
        sourceName: '我的复刻声音',
        language: voiceLanguage,
        gender: '本人',
        accent: voiceLanguage,
        tag: '本人复刻',
        scene: '个性化讲解与反馈',
        avatarUrl: '/voice-avatars/my-voice.png',
        avatarPrompt: '1:1方形AI课件专属音色头像，根据老师本人授权照片生成友好专业的教师形象，保留本人主要面部特征，柔和3D黏土插画，清爽多色教育背景，半身居中，无文字无水印。',
        dedicated: true,
      };
      setClonedVoice(nextVoice);
      setDraftVoiceId(nextVoice.id);
      setDraftSelectionSource('dedicated');
      setCloneStage('empty');
      setCloneSuccess(true);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [cloneStage, voiceLanguage]);

  const visibleVoices = useMemo(() => {
    return voiceOptions.filter(voice => !voice.dedicated && voice.language === voiceLanguage);
  }, [voiceLanguage, voiceOptions]);

  const selectSmartStyle = () => {
    onChange({
      ...value,
      visualStyleMode: 'smart',
      visualStyleId: undefined,
      visualStyleEnhancementIds: undefined,
      visualStyleName: undefined,
    });
  };

  const selectBaseStyle = (styleId: string) => {
    const selection = getVisualStyleSelection(styleId, value.visualStyleEnhancementIds || []);
    onChange({
      ...value,
      visualStyleMode: 'manual',
      visualStyleId: styleId,
      visualStyleEnhancementIds: selection.enhancementStyleIds,
      visualStyleName: selection.styleName,
    });
  };

  const toggleEnhancementStyle = (styleId: string) => {
    const current = value.visualStyleEnhancementIds || [];
    const next = current.includes(styleId)
      ? current.filter(id => id !== styleId)
      : [...current, styleId];
    const selection = getVisualStyleSelection(value.visualStyleId || null, next);
    onChange({
      ...value,
      visualStyleMode: next.length || value.visualStyleId ? 'manual' : 'smart',
      visualStyleEnhancementIds: next.length ? next : undefined,
      visualStyleName: selection.styleName || undefined,
    });
  };

  const openVoiceModal = () => {
    const current = voiceOptions.find(voice => voice.id === value.voiceId);
    const nextLanguage = isVoiceLanguage(current?.language || value.voiceLanguage)
      ? (current?.language || value.voiceLanguage) as DemoVoiceLanguage
      : DEFAULT_VOICE_LANGUAGE;
    const currentIsCompatible = Boolean(current && current.language === nextLanguage);
    const initialVoice = currentIsCompatible ? current : getDefaultVoiceForLanguage(nextLanguage);
    const initialTab: VoiceTab = current?.dedicated ? 'dedicated' : 'featured';

    setVoiceLanguage(nextLanguage);
    setVoiceTab(initialTab);
    setDraftVoiceId(initialVoice?.id || '');
    setDraftSelectionSource(current?.dedicated ? 'dedicated' : 'featured');
    setCloneStage('empty');
    setCloneConsent(false);
    setCloneSuccess(false);
    setRecordingSeconds(0);
    setVoiceModalOpen(true);
  };

  const handleLanguageChange = (language: DemoVoiceLanguage) => {
    setVoiceLanguage(language);
    setDraftVoiceId(getDefaultVoiceForLanguage(language).id);
    setDraftSelectionSource('featured');
    setCloneStage('empty');
    setCloneSuccess(false);
  };

  const handleVoiceTabChange = (tab: VoiceTab) => {
    setVoiceTab(tab);
    setCloneStage('empty');
    setCloneSuccess(false);
    if (tab === 'dedicated') {
      setDraftVoiceId(clonedVoice?.id || '');
      setDraftSelectionSource('dedicated');
      return;
    }
    const current = voiceOptions.find(voice => voice.id === value.voiceId && !voice.dedicated && voice.language === voiceLanguage);
    setDraftVoiceId(current?.id || getDefaultVoiceForLanguage(voiceLanguage).id);
    setDraftSelectionSource('featured');
  };

  const selectVoice = (voice: DemoVoiceOption, source: VoiceSelectionSource) => {
    if (voice.language !== voiceLanguage) return;
    setDraftVoiceId(voice.id);
    setDraftSelectionSource(source);
  };

  const handleVoiceConfirm = () => {
    if (!draftVoice) return;
    onChange({
      ...value,
      voiceMode: 'manual',
      voiceId: draftVoice.id,
      voiceName: draftVoice.name,
      voiceLanguage: draftVoice.language,
    });
    closeVoiceModal();
  };

  const startRecording = () => {
    if (!cloneConsent) return;
    window.speechSynthesis?.cancel();
    setPlayingVoiceId(null);
    setRecordingSeconds(0);
    setCloneStage('recording');
  };

  const stopRecording = () => {
    setRecordingSeconds(seconds => Math.max(seconds, 4));
    setCloneStage('review');
  };

  const resetCloneRecording = () => {
    setRecordingSeconds(0);
    setCloneStage('ready');
  };

  const previewCloneRecording = () => {
    const previewId = 'clone-recording-preview';
    window.speechSynthesis?.cancel();
    if (playingVoiceId === previewId) {
      setPlayingVoiceId(null);
      return;
    }
    setPlayingVoiceId(previewId);
    const utterance = new SpeechSynthesisUtterance(CLONE_SENTENCE);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.95;
    utterance.onend = () => setPlayingVoiceId(null);
    utterance.onerror = () => setPlayingVoiceId(null);
    window.speechSynthesis?.speak(utterance);
  };

  const selectGenerationMode = (modeId: string) => {
    const mode = generationModeOptions.find(item => item.id === modeId) || generationModeOptions[0];
    onChange({
      ...value,
      generationModeId: mode.id as GenerationPreferences['generationModeId'],
      htmlModelId: mode.htmlModelId,
      imageModelId: mode.imageModelId,
      estimatedMinutes: undefined,
    });
    setModePopoverOpen(false);
  };

  const styleTrigger = (
    <button
      type="button"
      className={layout === 'settings' ? 'aug-setting-choice' : `aug-preference-trigger ${value.visualStyleMode === 'manual' ? 'is-specified' : ''}`}
      disabled={disabled}
      onClick={() => setStyleModalOpen(true)}
      aria-label={layout === 'input' ? `画面风格：${value.visualStyleMode === 'manual' ? value.visualStyleName || selectedStyle?.name || '已指定' : 'AI设计'}` : undefined}
    >
      {layout === 'settings' && selectedStyle ? (
        <span className="aug-setting-preview" style={getStylePreview(selectedStyle.id)} />
      ) : (
        <Palette size={16} />
      )}
      <span>
        {layout === 'settings' && <small>画面风格 · {value.visualStyleMode === 'manual' ? '已指定' : 'AI推荐'}</small>}
        <b>{layout === 'input'
          ? value.visualStyleMode === 'manual' ? value.visualStyleName || selectedStyle?.name || '已选风格' : '画面风格'
          : value.visualStyleName || selectedStyle?.name || 'AI设计'}</b>
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
      onClick={openVoiceModal}
      aria-label={layout === 'input' ? `课件音色：${value.voiceMode === 'manual' ? selectedVoice?.name || value.voiceName || '已指定' : `${value.voiceLanguage || DEFAULT_VOICE_LANGUAGE}默认音色`}` : undefined}
    >
      {layout === 'settings' && selectedVoice ? (
        <span className="aug-voice-avatar"><img src={selectedVoice.avatarUrl} alt="" /></span>
      ) : (
        <Volume2 size={16} />
      )}
      <span>
        {layout === 'settings' && <small>课件音色 · {value.voiceMode === 'manual' ? '已指定' : '默认音色'}</small>}
        <b>{layout === 'input'
          ? value.voiceMode === 'manual' ? selectedVoice?.name || value.voiceName || '已选音色' : '课件音色'
          : selectedVoice?.name || value.voiceName || value.voiceLanguage || DEFAULT_VOICE_LANGUAGE}</b>
      </span>
      {layout === 'settings' && <em>修改</em>}
      {layout === 'input' && <ChevronDown className="aug-preference-chevron" size={14} />}
    </button>
  );

  const modelSpecified = selectedGenerationMode.id !== 'smart';
  const modelTrigger = layout === 'input' ? (
    <div className="aug-mode-dropdown-wrap">
      <button
        ref={modeTriggerRef}
        type="button"
        className={`aug-preference-trigger aug-model-trigger ${modelSpecified ? 'is-specified' : ''}`}
        disabled={disabled}
        onClick={() => {
          if (!modePopoverOpen) updateModePopoverPosition();
          setModePopoverOpen(open => !open);
        }}
        aria-label={`生成模式：${selectedGenerationMode.name}`}
        aria-expanded={modePopoverOpen}
      >
        <Cpu size={16} />
        <span><b>{selectedGenerationMode.name}</b></span>
        <ChevronDown className="aug-preference-chevron" size={14} />
      </button>
    </div>
  ) : null;

  const modePopover = layout === 'input' && modePopoverOpen ? createPortal(
    <div className="aug-mode-popover" ref={modePopoverRef} role="menu" aria-label="选择生成模式" style={modePopoverStyle}>
      {generationModeOptions.map(mode => {
        const selected = selectedGenerationMode.id === mode.id;
        return (
          <button key={mode.id} type="button" className={selected ? 'is-selected' : ''} onClick={() => selectGenerationMode(mode.id)} role="menuitemradio" aria-checked={selected}>
            <span><b>{mode.name}</b><small>{mode.description}</small></span>
            <em>{mode.tag}</em>
            {selected && <Check size={15} />}
          </button>
        );
      })}
    </div>,
    document.body,
  ) : null;

  const renderVoiceCard = (voice: DemoVoiceOption) => {
    const isDedicated = Boolean(voice.dedicated);
    const isCompatible = voice.language === voiceLanguage;
    const selected = draftVoiceId === voice.id && isCompatible;
    const source: VoiceSelectionSource = isDedicated ? 'dedicated' : 'featured';
    const description = isDedicated
      ? `本人复刻 · ${voice.language}`
      : `${voice.gender === '女生' ? '女声' : voice.gender === '男生' ? '男声' : voice.gender} · ${voice.tag}`;

    return (
      <div key={voice.id} className={`aug-voice-card ${selected ? 'is-selected' : ''} ${!isCompatible ? 'is-disabled' : ''}`}>
        <button
          type="button"
          className="aug-voice-card-select"
          onClick={() => selectVoice(voice, source)}
          disabled={!isCompatible}
          aria-pressed={selected}
        >
          <span className="aug-voice-avatar"><img src={voice.avatarUrl} alt="" /></span>
          <span className="aug-voice-card-copy">
            <span><b>{voice.name}</b>{voice.platformVoiceIds && <em>双音色</em>}</span>
            <small>{isCompatible ? description : '暂不支持当前语言'}</small>
            {!isDedicated && <small className="aug-voice-scene">{voice.scene}</small>}
          </span>
          {selected && <span className="aug-voice-card-check"><Check size={13} /></span>}
        </button>
      </div>
    );
  };

  const dedicatedContent = (() => {
    if (clonedVoice) {
      return (
        <div className="aug-dedicated-panel">
          {cloneSuccess && <div className="aug-clone-success"><Check size={14} />专属声音已生成并选中</div>}
          <div className="aug-voice-grid aug-dedicated-grid">{renderVoiceCard(clonedVoice)}</div>
          <button type="button" className="aug-clone-again" onClick={() => { setCloneStage('ready'); setCloneConsent(false); setCloneSuccess(false); }}>
            <RotateCcw size={14} />重新复刻
          </button>
        </div>
      );
    }

    if (cloneStage === 'ready') {
      return (
        <div className="aug-clone-workspace">
          <div className="aug-clone-step-icon"><Mic size={22} /></div>
          <h3>录制一句话</h3>
          <p className="aug-clone-sentence">{CLONE_SENTENCE}</p>
          <button
            type="button"
            className={`aug-clone-consent ${cloneConsent ? 'is-checked' : ''}`}
            role="checkbox"
            aria-checked={cloneConsent}
            onClick={() => setCloneConsent(checked => !checked)}
          >
            <span>{cloneConsent && <Check size={12} />}</span>
            <em>我确认录制的是本人声音，并同意用于生成本人的课件语音</em>
          </button>
          <button type="button" className="aug-clone-primary" disabled={!cloneConsent} onClick={startRecording}>
            <Mic size={15} />开始录制
          </button>
        </div>
      );
    }

    if (cloneStage === 'recording') {
      return (
        <div className="aug-clone-workspace">
          <div className="aug-recording-status"><span /><b>正在录制</b><em>00:{String(recordingSeconds).padStart(2, '0')}</em></div>
          <div className="aug-recording-wave" aria-hidden="true">{Array.from({ length: 25 }, (_, index) => <i key={index} style={{ animationDelay: `${index * 35}ms` }} />)}</div>
          <p className="aug-clone-sentence is-recording">{CLONE_SENTENCE}</p>
          <button type="button" className="aug-clone-stop" onClick={stopRecording}><Square size={14} fill="currentColor" />结束录制</button>
        </div>
      );
    }

    if (cloneStage === 'review') {
      return (
        <div className="aug-clone-workspace">
          <div className="aug-clone-step-icon is-ready"><Check size={22} /></div>
          <h3>录音已完成</h3>
          <div className="aug-clone-review">
            <button type="button" onClick={previewCloneRecording} aria-label="试听录音">
              {playingVoiceId === 'clone-recording-preview' ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
            </button>
            <span><b>一句话录音</b><small>{recordingSeconds || 4} 秒 · 声音清晰</small></span>
          </div>
          <div className="aug-clone-review-actions">
            <button type="button" onClick={resetCloneRecording}><RotateCcw size={14} />重新录制</button>
            <button type="button" className="is-primary" onClick={() => setCloneStage('generating')}><Wand2 size={14} />生成专属声音</button>
          </div>
        </div>
      );
    }

    if (cloneStage === 'generating') {
      return (
        <div className="aug-clone-workspace aug-clone-generating">
          <span className="aug-clone-loader"><Loader2 size={26} /></span>
          <h3>正在复刻你的声音</h3>
          <p>正在处理音色特征，完成后会自动带回当前页面。</p>
        </div>
      );
    }

    return (
      <div className="aug-dedicated-empty">
        <div><Mic size={26} /></div>
        <h3>还没有你的专属声音</h3>
        <p>录制一句话，即可复刻自己的声音。</p>
        <button type="button" onClick={() => setCloneStage('ready')}><Mic size={15} />一句话复刻我的声音</button>
      </div>
    );
  })();

  const overlay = voiceModalOpen ? createPortal(
    <div className="aug-modal-mask" onMouseDown={event => { if (event.target === event.currentTarget) closeVoiceModal(); }}>
      <section className="aug-voice-modal" role="dialog" aria-modal="true" aria-labelledby="voice-modal-title">
        <header className="aug-modal-header">
          <div><h2 id="voice-modal-title">选择课件音色</h2><p>用于讲解、发音和反馈，每个语种仅保留课堂适用音色</p></div>
          <button type="button" className="aug-icon-button" onClick={closeVoiceModal} aria-label="关闭"><X size={19} /></button>
        </header>
        <div className="aug-voice-tabs" role="tablist" aria-label="音色分类">
          <button type="button" role="tab" aria-selected={voiceTab === 'featured'} className={voiceTab === 'featured' ? 'is-active' : ''} onClick={() => handleVoiceTabChange('featured')}>精选音色</button>
          <button type="button" role="tab" aria-selected={voiceTab === 'dedicated'} className={voiceTab === 'dedicated' ? 'is-active' : ''} onClick={() => handleVoiceTabChange('dedicated')}>我的专属</button>
        </div>
        <div className={`aug-voice-body ${voiceTab === 'dedicated' ? 'is-dedicated' : ''}`}>
          {voiceTab === 'featured' && (
            <aside aria-label="语言模式">
              {voiceLanguageOptions.map(language => (
                <button key={language} type="button" className={voiceLanguage === language ? 'is-active' : ''} onClick={() => handleLanguageChange(language)}>{language}</button>
              ))}
            </aside>
          )}
          <main>
            {voiceTab === 'dedicated' ? dedicatedContent : (
              <section className="aug-featured-voices">
                <div className="aug-featured-voice-heading">
                  <div><b>{voiceLanguage}</b><small>共 {visibleVoices.length} 个课堂精选音色</small></div>
                  {voiceLanguage === '中英双语' && <em>按文本语种分别调用中文、英文 VoiceID</em>}
                </div>
                <div className="aug-voice-grid">
                  {visibleVoices.length
                    ? visibleVoices.map(voice => renderVoiceCard(voice))
                    : <div className="aug-voice-empty">当前语言暂无可用音色</div>}
                </div>
              </section>
            )}
          </main>
        </div>
        <footer className="aug-modal-footer aug-voice-footer">
          <span>{draftVoice ? <>当前：<b>{draftVoice.language} · {draftVoice.name}</b><em>{draftSelectionSource === 'dedicated' ? '本人复刻' : '精选音色'}</em></> : voiceTab === 'dedicated' ? '尚未复刻专属声音' : '请选择一个可用音色'}</span>
          <div>
            <button type="button" className="aug-button-secondary" onClick={closeVoiceModal}>取消</button>
            <button type="button" className="aug-button-primary" onClick={handleVoiceConfirm} disabled={!draftVoice || cloneStage === 'generating'}>确定</button>
          </div>
        </footer>
      </section>
    </div>,
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
        variant="select"
        selectedBaseStyleId={value.visualStyleId}
        selectedEnhancementStyleIds={value.visualStyleEnhancementIds}
        smartSelected={value.visualStyleMode !== 'manual'}
        onSelectBaseStyle={selectBaseStyle}
        onToggleEnhancementStyle={toggleEnhancementStyle}
        onSelectSmart={selectSmartStyle}
        onClose={() => setStyleModalOpen(false)}
        onConfirm={() => setStyleModalOpen(false)}
      />
      {modePopover}
      {overlay}
    </>
  );
}
