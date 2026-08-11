import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Download, CheckCircle2, Edit3, MessageSquareWarning, BarChart3, Palette } from 'lucide-react';
import type { Courseware, GenerationPreferences, LearningDataRecoveryItem, LearningDataRecoveryRequest, LearningDataReportCapability, VisualStyleRegenerationRequest, VoiceOption } from '../../types';
import { useUIStore } from '../../store/uiStore';
import { useConversationStore, getFrameworkForCourseware } from '../../store/conversationStore';
import { CLONE_COURSEWARE_PROMPT } from '../../constants/cloneCourseware';
import toast from '../../utils/toast';
import ResourceEditModal from './ResourceEditModal';
import LearningDataRecoveryModal from './LearningDataRecoveryModal';
import VisualStylePickerModal from './VisualStylePickerModal';
import GenerationModeDropdown from './GenerationModeDropdown';
import HtmlTypeBadge from '../common/HtmlTypeBadge';
import { demoVoiceOptions, generationModeOptions, getGenerationModeByModels, imageModelOptions } from '../../data/augustDemoData';
import { getVisualStyleSelection } from '../../data/visualStylePresets';

// 默认音色选项
const RESOURCE_VOICES: VoiceOption[] = demoVoiceOptions.map((voice, index) => ({
  id: voice.id,
  name: voice.name,
  gender: voice.gender === '女生' ? 'female' : 'male',
  description: `${voice.language} · ${voice.tag}`,
  isDefault: index === 0,
}));

// 模拟资源数据
const MOCK_IMAGES: Array<{ id: string; label: string; src: string; prompt: string; status: 'completed' | 'generating' }> = [
  { id: 'img-1', label: '主界面背景', src: '/images/background.png', prompt: '色彩鲜艳的游戏主界面背景', status: 'completed' },
  { id: 'img-2', label: '动物角色', src: '/images/animal.png', prompt: '可爱的卡通小熊角色', status: 'completed' },
  { id: 'img-3', label: '奖励星星', src: '/images/star.png', prompt: '金色五角星', status: 'completed' },
];

const MOCK_AUDIOS: Array<
  | { id: string; label: string; type: 'tts'; status: 'completed' | 'generating'; voiceId: string; duration: number }
  | { id: string; label: string; type: 'bgm'; status: 'completed' | 'generating'; duration: number }
> = [
  { id: 'audio-1', label: '单词发音 - Apple', type: 'tts', status: 'completed', voiceId: 'amy', duration: 1.2 },
  { id: 'audio-2', label: '单词发音 - Banana', type: 'tts', status: 'completed', voiceId: 'amy', duration: 1.5 },
  { id: 'audio-3', label: '游戏背景音乐', type: 'bgm', status: 'completed', duration: 30.0 },
];

const UI_RADIUS = 10;

export default function CoursewareCard({
  courseware,
  version = 'v1.0',
  isLatest: isLatestProp = true,
  onOpenPreview,
  onLearningDataRecoveryRequest,
  onVisualStyleRegenerate,
  publishBadgeLabel,
  generationPreferences,
  learningDataReportCapability,
}: {
  courseware: Courseware;
  version?: string;
  isLatest?: boolean;
  onOpenPreview?: (coursewareId: number, version?: string | null) => void;
  onLearningDataRecoveryRequest?: (request: LearningDataRecoveryRequest) => void;
  onVisualStyleRegenerate?: (request: VisualStyleRegenerationRequest) => void;
  publishBadgeLabel?: string;
  generationPreferences?: GenerationPreferences;
  learningDataReportCapability?: LearningDataReportCapability;
}) {
  const [copied, setCopied] = useState(false);
  const [feedbackCopied, setFeedbackCopied] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [images, setImages] = useState(MOCK_IMAGES);
  const [audios, setAudios] = useState(MOCK_AUDIOS);
  const [editDisabledTooltip, setEditDisabledTooltip] = useState(false);
  const [styleDisabledTooltip, setStyleDisabledTooltip] = useState(false);
  const [reportDisabledTooltip, setReportDisabledTooltip] = useState(false);
  const [isLatest, setIsLatest] = useState(isLatestProp);
  const [currentVersion, setCurrentVersion] = useState(version);
  const [showLearningDataModal, setShowLearningDataModal] = useState(false);
  const [localLearningDataItems, setLocalLearningDataItems] = useState<LearningDataRecoveryItem[] | undefined>(courseware.learningDataRecovery?.selectedItems);
  const [showVisualStyleModal, setShowVisualStyleModal] = useState(false);
  const [resourceDefaults, setResourceDefaults] = useState({
    imageModelId: generationPreferences?.imageModelId || 'jimeng-4.5',
    voiceId: generationPreferences?.voiceId || 'amy',
  });
  const [selectedBaseStyleId, setSelectedBaseStyleId] = useState<string | null>(null);
  const [selectedEnhancementIds, setSelectedEnhancementIds] = useState<string[]>([]);
  const [styleGenerationModeId, setStyleGenerationModeId] = useState(
    generationPreferences?.generationModeId
      || getGenerationModeByModels(generationPreferences?.htmlModelId, generationPreferences?.imageModelId).id,
  );
  const navigate = useNavigate();
  const { appMode, insertCourseware, openPreview, setPendingAssistantPrompt } = useUIStore();
  const createCloneConversation = useConversationStore((s) => s.createCloneConversation);
  const isEmbedded = appMode === 'embedded';
  const feedbackLocator = '2fc7b609481e45868a38a74b4490400a';
  const feedbackTime = '2026-06-05 14:30';
  const versionNumberMatch = currentVersion.match(/第(\d+)版/);
  const previewVersionKey = versionNumberMatch?.[1] ? `v${versionNumberMatch[1]}` : currentVersion;
  const metaItems = ['刚刚生成', publishBadgeLabel].filter(Boolean);
  const reportCapability = learningDataReportCapability || courseware.learningDataReportCapability || 'supported';
  const shouldUpgradeLegacyReport = reportCapability === 'requires-regeneration';
  const reportButtonLabel = shouldUpgradeLegacyReport ? '生成报告' : '预览报告';
  const reportDisabledText = shouldUpgradeLegacyReport
    ? '当前为旧版，请在最新版上生成报告'
    : '当前为旧版，请在最新版上查看报告';
  const feedbackText = `【AI互动课件问题反馈】
课件名称：${courseware.title}
当前版本：${currentVersion}
资源定位信息：${feedbackLocator}
反馈时间：${feedbackTime}
问题描述：
请在这里补充你遇到的问题，例如：打不开、有白屏、内容不符合预期等。`;

  const copyText = async (text: string) => {
    if (window.navigator.clipboard?.writeText && window.isSecureContext) {
      try {
        await window.navigator.clipboard.writeText(text);
        return;
      } catch {
        // Some embedded browsers block Clipboard API; keep a user-gesture fallback below.
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
    const copiedByFallback = document.execCommand('copy');
    document.body.removeChild(textarea);

    if (!copiedByFallback) {
      throw new Error('copy failed');
    }
  };

  const handleCopyFeedback = async () => {
    try {
      await copyText(feedbackText);
      setFeedbackCopied(true);
      toast('已复制问题反馈信息，可粘贴给开发排查');
      setTimeout(() => setFeedbackCopied(false), 1600);
    } catch {
      toast('复制失败，请稍后重试');
    }
  };


  const handleClone = () => {
    const framework = getFrameworkForCourseware(courseware.id);
    const clone = createCloneConversation(courseware.title, framework, courseware.htmlContent);
    openPreview(clone.coursewareId, 'v1');
    setPendingAssistantPrompt(CLONE_COURSEWARE_PROMPT);
    setCopied(true);
    toast('已创建同款课件第一版');
    setTimeout(() => {
      setCopied(false);
      navigate('/');
    }, 600);
  };

  const handleImageReplace = (imageId: string, file: File) => {
    setImages(prev => prev.map(img => 
      img.id === imageId 
        ? { ...img, src: URL.createObjectURL(file), source: 'upload' as const, uploadFileName: file.name }
        : img
    ));
    toast(`图片 "${file.name}" 已上传`);
  };

  const handleImageRegenerate = (imageId: string, prompt: string, imageModelId: string) => {
    const imageModel = imageModelOptions.find(model => model.id === imageModelId);
    setImages(prev => prev.map(img => 
      img.id === imageId 
        ? { ...img, prompt, status: 'generating' as const }
        : img
    ));
    setTimeout(() => {
      setImages(prev => prev.map(img => 
        img.id === imageId 
          ? { ...img, status: 'completed' as const }
          : img
      ));
      toast(`已使用“${imageModel?.name || '所选模型'}”重新生成图片`);
    }, 2000);
  };

  const handleAudioReplace = (audioId: string, file: File) => {
    setAudios(prev => prev.map(audio => 
      audio.id === audioId 
        ? { ...audio, source: 'upload' as const, uploadFileName: file.name }
        : audio
    ));
    toast(`音频 "${file.name}" 已上传`);
  };

  const handleAudioRegenerate = (audioId: string, voiceId: string) => {
    const voice = RESOURCE_VOICES.find(v => v.id === voiceId);
    setAudios(prev => prev.map(audio => 
      audio.id === audioId 
        ? { ...audio, voiceId, status: 'generating' as const }
        : audio
    ));
    setTimeout(() => {
      setAudios(prev => prev.map(audio => 
        audio.id === audioId 
          ? { ...audio, status: 'completed' as const }
          : audio
      ));
      toast(`已使用"${voice?.name}"重新合成音频`);
    }, 1500);
  };

  const visualStyleSelection = getVisualStyleSelection(selectedBaseStyleId, selectedEnhancementIds);
  const selectedBaseStyle = visualStyleSelection.selectedBaseStyle;
  const selectedStyleName = visualStyleSelection.styleName;
  const selectedStylePrompt = visualStyleSelection.stylePrompt;
  const hasStyleSelection = Boolean(selectedBaseStyle || selectedEnhancementIds.length > 0);
  const regenerationMode = selectedBaseStyle ? 'courseware-regeneration' : 'image-texture-only';
  const selectedStyleGenerationMode = generationModeOptions.find(mode => mode.id === styleGenerationModeId)
    || getGenerationModeByModels(generationPreferences?.htmlModelId, generationPreferences?.imageModelId);

  const toggleEnhancement = (styleId: string) => {
    setSelectedEnhancementIds(prev =>
      prev.includes(styleId)
        ? prev.filter(id => id !== styleId)
        : [...prev, styleId]
    );
  };

  useEffect(() => {
    setLocalLearningDataItems(courseware.learningDataRecovery?.selectedItems);
  }, [courseware.id, version, courseware.learningDataRecovery?.selectedItems]);

  useEffect(() => {
    setIsLatest(isLatestProp);
  }, [courseware.id, version, isLatestProp]);

  const handleVisualStyleRegenerate = () => {
    if (!hasStyleSelection) return;
    setIsLatest(false);
    setShowVisualStyleModal(false);
    onVisualStyleRegenerate?.({
      coursewareTitle: courseware.title,
      htmlContent: courseware.htmlContent,
      version: '下一版',
      baseStyleId: visualStyleSelection.baseStyleId,
      enhancementStyleIds: visualStyleSelection.enhancementStyleIds,
      styleName: selectedStyleName,
      stylePrompt: selectedStylePrompt,
      previewImageUrl: visualStyleSelection.previewImageUrl,
      generationPreferences: {
        visualStyleMode: 'manual',
        visualStyleId: visualStyleSelection.baseStyleId || undefined,
        visualStyleName: selectedStyleName,
        voiceMode: generationPreferences?.voiceMode,
        voiceId: generationPreferences?.voiceId,
        voiceName: generationPreferences?.voiceName,
        generationModeId: selectedStyleGenerationMode.id as GenerationPreferences['generationModeId'],
        htmlModelId: selectedStyleGenerationMode.htmlModelId,
        imageModelId: selectedStyleGenerationMode.imageModelId,
      },
      regenerationMode,
    });
  };

  const handleReportClick = () => {
    if (!isLatest) return;

    if (shouldUpgradeLegacyReport) {
      setIsLatest(false);
      onLearningDataRecoveryRequest?.({
        coursewareTitle: courseware.title,
        htmlContent: courseware.htmlContent,
        version: '下一版',
        mode: 'upgrade-legacy',
        initialItems: localLearningDataItems || courseware.learningDataRecovery?.selectedItems,
      });
      return;
    }

    setShowLearningDataModal(true);
  };

  const getActionButtonStyle = (
    variant: 'primary' | 'secondary' = 'secondary',
    enabled = true,
  ): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 34,
    padding: '0 10px',
    borderRadius: UI_RADIUS,
    border: '1px solid #DDE7EE',
    borderColor: '#DDE7EE',
    background: enabled
      ? variant === 'primary'
        ? '#F6FCFF'
        : '#FFFFFF'
      : '#F8FAFC',
    color: enabled
      ? variant === 'primary'
        ? 'var(--agent-primary-text)'
        : '#475569'
      : '#CBD5E1',
    fontSize: 12,
    fontWeight: 750,
    cursor: enabled ? 'pointer' : 'not-allowed',
    opacity: enabled ? 1 : 0.68,
    transition: 'border-color 0.15s, color 0.15s, background 0.15s',
    outline: 'none',
    whiteSpace: 'nowrap',
    boxShadow: 'none',
  });

  const handleActionEnter = (event: React.MouseEvent<HTMLButtonElement>, enabled = true) => {
    if (!enabled) return;
    event.currentTarget.style.borderColor = 'var(--agent-primary)';
    event.currentTarget.style.color = 'var(--agent-primary-text)';
    event.currentTarget.style.background = '#FFFFFF';
  };

  const handleActionLeave = (
    event: React.MouseEvent<HTMLButtonElement> | React.FocusEvent<HTMLButtonElement>,
    variant: 'primary' | 'secondary' = 'secondary',
    enabled = true,
  ) => {
    const nextStyle = getActionButtonStyle(variant, enabled);
    event.currentTarget.style.borderColor = String(nextStyle.borderColor || '');
    event.currentTarget.style.color = String(nextStyle.color || '');
    event.currentTarget.style.background = String(nextStyle.background || '');
  };

  return (
    <>
      <div style={{
        background: '#fff',
        borderRadius: UI_RADIUS,
        border: '1px solid #E2E8F0',
        overflow: 'visible',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        boxShadow: '0 3px 10px rgba(37, 74, 120, 0.04)',
        cursor: onOpenPreview ? 'pointer' : 'default',
        position: 'relative',
      }}
        onClick={() => onOpenPreview?.(courseware.id, previewVersionKey)}
      >
        <div
          onClick={() => onOpenPreview?.(courseware.id, previewVersionKey)}
          style={{
          background: 'var(--agent-courseware-header)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          cursor: onOpenPreview ? 'pointer' : 'default',
          borderRadius: `${UI_RADIUS}px ${UI_RADIUS}px 0 0`,
        }}
        >
          <HtmlTypeBadge size="large" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ fontSize: 16, fontWeight: 760, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{courseware.title}</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: '#64748B',
              marginTop: 3,
              minWidth: 0,
            }}>
              {metaItems.map((item, index) => (
                <span
                  key={item}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    minWidth: 0,
                    color: item === publishBadgeLabel ? 'var(--agent-primary-text)' : '#64748B',
                    fontWeight: item === publishBadgeLabel ? 650 : 500,
                  }}
                >
                  {index > 0 && <span style={{ width: 3, height: 3, borderRadius: 3, background: '#CBD5E1', flexShrink: 0 }} />}
                  {item === publishBadgeLabel && <CheckCircle2 size={11} strokeWidth={2.1} />}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item}</span>
                </span>
              ))}
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            height: 22,
            padding: '0 2px',
            fontSize: 12,
            color: '#64748B',
            fontWeight: 650,
            lineHeight: 1,
            flexShrink: 0,
          }}>
            {currentVersion}
          </div>
        </div>

        <div style={{ padding: '14px 20px', background: '#FAFBFC', borderRadius: `0 0 ${UI_RADIUS}px ${UI_RADIUS}px`, position: 'relative', zIndex: 2 }} onClick={(e) => e.stopPropagation()}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'nowrap',
            overflow: 'visible',
          }}>
          <button
            onClick={handleClone}
            style={getActionButtonStyle('primary')}
            onMouseDown={e => e.preventDefault()}
            onMouseEnter={e => handleActionEnter(e)}
            onMouseLeave={e => handleActionLeave(e, 'primary')}
            onBlur={e => handleActionLeave(e, 'primary')}
          >
            {copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
            {copied ? '已创建' : '一键同款'}
          </button>
          <div style={{ position: 'relative', display: 'inline-flex' }}
            onMouseEnter={() => { if (!isLatest) setEditDisabledTooltip(true); }}
            onMouseLeave={() => setEditDisabledTooltip(false)}
          >
            <button
              onClick={() => { if (isLatest) setShowEditModal(true); }}
              style={getActionButtonStyle('secondary', isLatest)}
              onMouseDown={e => e.preventDefault()}
              onMouseEnter={e => handleActionEnter(e, isLatest)}
              onMouseLeave={e => handleActionLeave(e, 'secondary', isLatest)}
              onBlur={e => handleActionLeave(e, 'secondary', isLatest)}
            >
              <Edit3 size={15} />
              编辑资源
            </button>
            {editDisabledTooltip && !isLatest && (
              <div style={{
                position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                marginBottom: 6, padding: '6px 10px', borderRadius: UI_RADIUS, background: '#1E293B', color: '#fff',
                fontSize: 11, whiteSpace: 'nowrap', zIndex: 40, boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}>
                当前为旧版，不支持编辑，请在最新版互动游戏上编辑资源哦~
              </div>
            )}
          </div>
          <div style={{ position: 'relative', display: 'inline-flex' }}
            onMouseEnter={() => { if (!isLatest) setStyleDisabledTooltip(true); }}
            onMouseLeave={() => setStyleDisabledTooltip(false)}
          >
            <button
              onClick={() => {
                if (!isLatest) return;
                const inheritedMode = generationModeOptions.find(mode => mode.id === generationPreferences?.generationModeId)
                  || getGenerationModeByModels(generationPreferences?.htmlModelId, generationPreferences?.imageModelId);
                setStyleGenerationModeId(inheritedMode.id);
                setShowVisualStyleModal(true);
              }}
              style={getActionButtonStyle('secondary', isLatest)}
              onMouseDown={e => e.preventDefault()}
              onMouseEnter={e => handleActionEnter(e, isLatest)}
              onMouseLeave={e => handleActionLeave(e, 'secondary', isLatest)}
              onBlur={e => handleActionLeave(e, 'secondary', isLatest)}
            >
              <Palette size={15} />
              调整风格
            </button>
            {styleDisabledTooltip && !isLatest && (
              <div style={{
                position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                marginBottom: 6, padding: '6px 10px', borderRadius: UI_RADIUS, background: '#1E293B', color: '#fff',
                fontSize: 11, whiteSpace: 'nowrap', zIndex: 40, boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}>
                当前为旧版，请在最新版课件上调整风格
              </div>
            )}
          </div>
          <div style={{ position: 'relative', display: 'inline-flex' }}
            onMouseEnter={() => { if (!isLatest) setReportDisabledTooltip(true); }}
            onMouseLeave={() => setReportDisabledTooltip(false)}
          >
            <button
              onClick={handleReportClick}
              style={getActionButtonStyle('secondary', isLatest)}
              onMouseDown={e => e.preventDefault()}
              onMouseEnter={e => handleActionEnter(e, isLatest)}
              onMouseLeave={e => handleActionLeave(e, 'secondary', isLatest)}
              onBlur={e => handleActionLeave(e, 'secondary', isLatest)}
            >
              <BarChart3 size={15} />
              {reportButtonLabel}
            </button>
            {reportDisabledTooltip && !isLatest && (
              <div style={{
                position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                marginBottom: 6, padding: '6px 10px', borderRadius: UI_RADIUS, background: '#1E293B', color: '#fff',
                fontSize: 11, whiteSpace: 'nowrap', zIndex: 40, boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}>
                {reportDisabledText}
              </div>
            )}
          </div>
          {isEmbedded && (
            <button
              onClick={() => {
                insertCourseware({
                  id: courseware.id,
                  title: courseware.title,
                  version: 'v1.0',
                  htmlContent: courseware.htmlContent,
                  slideIndex: 0,
                  hasUpdate: false,
                });
                toast(`"${courseware.title}" 已插入课件`);
              }}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px 13px',
                minHeight: 34,
                borderRadius: UI_RADIUS, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
                background: 'var(--agent-action-gradient)', color: '#fff',
                transition: 'all 0.15s', outline: 'none',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px var(--agent-shadow)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <Download size={15} />
              插入课件
            </button>
          )}
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginTop: 8,
        paddingLeft: 2,
        color: '#94A3B8',
        fontSize: 12,
      }}>
        <button
          onClick={handleCopyFeedback}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, padding: 0,
            border: 'none', background: 'transparent',
            color: feedbackCopied ? 'var(--agent-primary-text)' : '#94A3B8',
            cursor: 'pointer', outline: 'none', lineHeight: 1.2,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--agent-primary-text)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = feedbackCopied ? 'var(--agent-primary-text)' : '#94A3B8'; }}
        >
          {feedbackCopied ? <CheckCircle2 size={13} /> : <MessageSquareWarning size={13} />}
          <span style={{ fontWeight: 600 }}>{feedbackCopied ? '已复制反馈信息' : '反馈问题'}</span>
        </button>
      </div>

      {showEditModal && <ResourceEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onConfirmReplace={() => {
          setCurrentVersion(previous => {
            const match = previous.match(/第(\d+)版/);
            return match ? previous.replace(match[0], `第${Number(match[1]) + 1}版`) : previous;
          });
          setIsLatest(true);
        }}
        images={images}
        audios={audios}
        voices={RESOURCE_VOICES}
        creationPreferences={generationPreferences}
        resourceDefaults={resourceDefaults}
        onResourceDefaultsChange={defaults => {
          setResourceDefaults(defaults);
          const imageName = imageModelOptions.find(model => model.id === defaults.imageModelId)?.name;
          const voiceName = RESOURCE_VOICES.find(voice => voice.id === defaults.voiceId)?.name;
          toast(`已更新本课件后续默认：${imageName} · ${voiceName}`);
        }}
        onImageReplace={handleImageReplace}
        onImageRegenerate={handleImageRegenerate}
        onAudioReplace={handleAudioReplace}
        onAudioRegenerate={handleAudioRegenerate}
      />}

      <LearningDataRecoveryModal
        isOpen={showLearningDataModal}
        coursewareTitle={courseware.title}
        initialItems={localLearningDataItems}
        isLatestVersion={isLatest}
        onClose={() => setShowLearningDataModal(false)}
        onConfirm={(items) => {
          setLocalLearningDataItems(items);
          toast('已更新报告数据');
          onLearningDataRecoveryRequest?.({
            coursewareTitle: courseware.title,
            htmlContent: courseware.htmlContent,
            version: currentVersion,
            mode: 'edit',
            initialItems: items,
          });
        }}
      />

      <VisualStylePickerModal
        open={showVisualStyleModal}
        variant="adjust"
        selectedBaseStyleId={selectedBaseStyleId}
        selectedEnhancementStyleIds={selectedEnhancementIds}
        onSelectBaseStyle={setSelectedBaseStyleId}
        onToggleEnhancementStyle={toggleEnhancement}
        onClose={() => setShowVisualStyleModal(false)}
        onConfirm={handleVisualStyleRegenerate}
        confirmDisabled={!hasStyleSelection}
        footerControls={(
          <GenerationModeDropdown value={styleGenerationModeId} onChange={setStyleGenerationModeId} />
        )}
      />

    </>
  );
}
