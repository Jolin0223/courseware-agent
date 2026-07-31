import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Download, CheckCircle2, Edit3, MessageSquareWarning, BarChart3, Palette, X, Wand2, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Courseware, GenerationPreferences, LearningDataRecoveryItem, LearningDataRecoveryRequest, LearningDataReportCapability, VisualStyleRegenerationRequest, VoiceOption } from '../../types';
import { useUIStore } from '../../store/uiStore';
import { useConversationStore, getFrameworkForCourseware } from '../../store/conversationStore';
import toast from '../../utils/toast';
import ResourceEditModal from './ResourceEditModal';
import LearningDataRecoveryModal from './LearningDataRecoveryModal';
import HtmlTypeBadge from '../common/HtmlTypeBadge';
import { demoVoiceOptions, htmlModelOptions, imageModelOptions } from '../../data/augustDemoData';
import {
  baseVisualStylePresets,
  enhancementVisualStylePreviewImages,
  enhancementVisualStylePresets,
  getVisualStylePreviewStyle,
  getVisualStyleSelection,
  visualStylePreviewImages,
} from '../../data/visualStylePresets';

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
  const [styleHtmlModelId, setStyleHtmlModelId] = useState(generationPreferences?.htmlModelId || 'smart-html');
  const [styleImageModelId, setStyleImageModelId] = useState(generationPreferences?.imageModelId || resourceDefaults.imageModelId || 'smart-image');
  const [previewingStyle, setPreviewingStyle] = useState<{
    id: string;
    name: string;
    desc: string;
    image: string;
    aspectRatio?: string;
    kind: 'base' | 'enhancement';
  } | null>(null);
  const navigate = useNavigate();
  const { appMode, insertCourseware, closePreview } = useUIStore();
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
    createCloneConversation(courseware.title, framework, courseware.htmlContent);
    closePreview();
    setCopied(true);
    toast('已带入原课件 HTML，可补充同款需求');
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
  const selectedFlowLabel = selectedBaseStyle
    ? selectedEnhancementIds.length > 0
      ? '重新生成课件，并在资产规划阶段叠加图片质感'
      : '按基础风格 UI 规范重新生成课件'
    : selectedEnhancementIds.length > 0
      ? '仅对现有图片资产做图生图质感叠加'
      : '请选择基础风格或叠加图片质感';
  const selectedStyleHtmlModel = htmlModelOptions.find(model => model.id === styleHtmlModelId) || htmlModelOptions[0];
  const selectedStyleImageModel = imageModelOptions.find(model => model.id === styleImageModelId) || imageModelOptions[0];
  const previewStyleList = previewingStyle
    ? (previewingStyle.kind === 'base' ? baseVisualStylePresets : enhancementVisualStylePresets)
      .filter(style => Boolean((previewingStyle.kind === 'base' ? visualStylePreviewImages : enhancementVisualStylePreviewImages)[style.id]))
    : [];
  const previewStyleIndex = previewingStyle
    ? Math.max(0, previewStyleList.findIndex(style => style.id === previewingStyle.id))
    : 0;
  const hasPreviewSwitcher = previewStyleList.length > 1;

  const toggleEnhancement = (styleId: string) => {
    setSelectedEnhancementIds(prev =>
      prev.includes(styleId)
        ? prev.filter(id => id !== styleId)
        : [...prev, styleId]
    );
  };

  const getPreviewStyle = (kind: 'base' | 'enhancement', styleId: string) => {
    const styleList = kind === 'base' ? baseVisualStylePresets : enhancementVisualStylePresets;
    const imageMap = kind === 'base' ? visualStylePreviewImages : enhancementVisualStylePreviewImages;
    const style = styleList.find(item => item.id === styleId);
    const image = imageMap[styleId];
    if (!style || !image) return null;

    return {
      id: style.id,
      name: style.name,
      desc: style.desc,
      image,
      aspectRatio: kind === 'base' ? '16 / 9' : '1 / 1',
      kind,
    };
  };

  const openStylePreview = (kind: 'base' | 'enhancement', styleId: string) => {
    const nextPreview = getPreviewStyle(kind, styleId);
    if (nextPreview) {
      setPreviewingStyle(nextPreview);
    }
  };

  const switchPreviewStyle = (direction: -1 | 1) => {
    if (!previewingStyle) return;
    const styleList = previewingStyle.kind === 'base' ? baseVisualStylePresets : enhancementVisualStylePresets;
    const imageMap = previewingStyle.kind === 'base' ? visualStylePreviewImages : enhancementVisualStylePreviewImages;
    const availableStyles = styleList.filter(style => Boolean(imageMap[style.id]));
    if (availableStyles.length <= 1) return;

    const currentIndex = availableStyles.findIndex(style => style.id === previewingStyle.id);
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = (safeIndex + direction + availableStyles.length) % availableStyles.length;
    openStylePreview(previewingStyle.kind, availableStyles[nextIndex].id);
  };

  useEffect(() => {
    setLocalLearningDataItems(courseware.learningDataRecovery?.selectedItems);
  }, [courseware.id, version, courseware.learningDataRecovery?.selectedItems]);

  useEffect(() => {
    setIsLatest(isLatestProp);
  }, [courseware.id, version, isLatestProp]);

  useEffect(() => {
    if (!previewingStyle) return;

    const handlePreviewKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        switchPreviewStyle(-1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        switchPreviewStyle(1);
      }
      if (event.key === 'Escape') {
        setPreviewingStyle(null);
      }
    };

    window.addEventListener('keydown', handlePreviewKeyDown);
    return () => window.removeEventListener('keydown', handlePreviewKeyDown);
  }, [previewingStyle]);

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
        htmlModelId: selectedBaseStyle ? styleHtmlModelId : generationPreferences?.htmlModelId || 'smart-html',
        imageModelId: styleImageModelId,
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
            {copied ? '已带入' : '一键同款'}
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
              onClick={() => { if (isLatest) setShowVisualStyleModal(true); }}
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

      {showVisualStyleModal && (
        <div
          onClick={() => setShowVisualStyleModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 24000,
            background: 'rgba(15, 23, 42, 0.36)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(920px, 94vw)',
              maxHeight: 'min(760px, 90vh)',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 18,
              overflow: 'hidden',
              background: '#FFFFFF',
              boxShadow: '0 28px 80px rgba(15, 23, 42, 0.24)',
            }}
          >
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 16,
            }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 850, color: '#0F172A' }}>调整画面风格</div>
                <div style={{ marginTop: 5, fontSize: 13, lineHeight: 1.55, color: '#64748B' }}>
                  基础风格会按该风格的 UI 规范重新生成课件；图片质感可单独使用，也可叠加到基础风格中一起生成
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVisualStyleModal(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                  background: '#fff',
                  color: '#64748B',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.45fr) minmax(260px, 0.85fr)',
              gap: 0,
              minHeight: 0,
              overflow: 'hidden',
            }}>
              <div style={{ padding: 18, overflowY: 'auto', maxHeight: 'calc(90vh - 170px)' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 850, color: '#0F172A' }}>1. 基础风格</div>
                    <div style={{ marginTop: 3, fontSize: 12, color: '#64748B' }}>可选。选择后按该风格的 UI 规范重新生成课件</div>
                  </div>
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>15 种</span>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 10,
                }}>
                  {baseVisualStylePresets.map(style => {
                    const selected = style.id === selectedBaseStyleId;
                    const previewImage = visualStylePreviewImages[style.id];
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setSelectedBaseStyleId(style.id)}
                        style={{
                          minHeight: 174,
                          padding: 10,
                          borderRadius: 14,
                          border: selected ? '1px solid var(--agent-primary)' : '1px solid #E2E8F0',
                          borderColor: selected ? 'var(--agent-primary)' : '#E2E8F0',
                          background: selected ? 'var(--agent-soft)' : '#FFFFFF',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s',
                          boxShadow: selected ? '0 8px 18px var(--agent-focus-ring)' : 'none',
                          outline: 'none',
                        }}
                      >
                        <div style={{
                          position: 'relative',
                          aspectRatio: '16 / 9',
                          borderRadius: 11,
                          overflow: 'hidden',
                          ...getVisualStylePreviewStyle(style.id),
                          marginBottom: 9,
                          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.55), 0 8px 18px rgba(15, 23, 42, 0.08)',
                        }}>
                          {previewImage ? (
                            <>
                              <img
                                src={previewImage}
                                alt={`${style.name}参考图`}
                                loading="eager"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openStylePreview('base', style.id);
                                }}
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  display: 'block',
                                  cursor: 'zoom-in',
                                }}
                              />
                              <span
                                role="button"
                                tabIndex={0}
                                title="查看大图"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openStylePreview('base', style.id);
                                }}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    openStylePreview('base', style.id);
                                  }
                                }}
                                style={{
                                  position: 'absolute',
                                  top: 8,
                                  right: 8,
                                  width: 28,
                                  height: 28,
                                  borderRadius: 9,
                                  border: '1px solid rgba(255,255,255,0.72)',
                                  background: 'rgba(15, 23, 42, 0.42)',
                                  color: '#FFFFFF',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'zoom-in',
                                  backdropFilter: 'blur(8px)',
                                  boxShadow: '0 6px 14px rgba(15, 23, 42, 0.16)',
                                }}
                              >
                                <ZoomIn size={15} />
                              </span>
                            </>
                          ) : (
                            <>
                              <div style={{
                                position: 'absolute',
                                left: '7%',
                                top: '11%',
                                width: '42%',
                                height: '14%',
                                borderRadius: 999,
                                background: 'rgba(255,255,255,0.78)',
                              }} />
                              <div style={{
                                position: 'absolute',
                                left: '8%',
                                bottom: '14%',
                                width: '46%',
                                height: '38%',
                                borderRadius: 14,
                                background: 'rgba(255,255,255,0.82)',
                                boxShadow: '0 5px 14px rgba(15, 23, 42, 0.10)',
                              }} />
                              <div style={{
                                position: 'absolute',
                                right: '12%',
                                bottom: '18%',
                                width: '22%',
                                height: '42%',
                                borderRadius: '45% 45% 38% 38%',
                                background: 'rgba(255,255,255,0.68)',
                                boxShadow: '0 5px 14px rgba(15, 23, 42, 0.10)',
                              }} />
                              <div style={{
                                position: 'absolute',
                                right: '18%',
                                top: '22%',
                                width: '17%',
                                height: '17%',
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.72)',
                              }} />
                            </>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 850, color: selected ? 'var(--agent-primary)' : '#0F172A' }}>{style.name}</span>
                          {selected && <CheckCircle2 size={15} color="var(--agent-primary)" />}
                        </div>
                        <div style={{ marginTop: 5, fontSize: 12, lineHeight: 1.45, color: '#64748B' }}>{style.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{
                borderLeft: '1px solid #E2E8F0',
                background: '#F8FAFC',
                padding: 18,
                overflowY: 'auto',
                maxHeight: 'calc(90vh - 170px)',
              }}>
                <div style={{ fontSize: 14, fontWeight: 850, color: '#0F172A' }}>2. 图片质感</div>
                <div style={{ marginTop: 3, marginBottom: 14, fontSize: 12, lineHeight: 1.5, color: '#64748B' }}>
                  可选。未选基础风格时只对现有图片做质感叠加
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {enhancementVisualStylePresets.map(style => {
                    const selected = selectedEnhancementIds.includes(style.id);
                    const previewImage = enhancementVisualStylePreviewImages[style.id];
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => toggleEnhancement(style.id)}
                        style={{
                          position: 'relative',
                          display: 'grid',
                          gridTemplateColumns: '76px minmax(0, 1fr)',
                          alignItems: 'center',
                          gap: 10,
                          width: '100%',
                          minHeight: 92,
                          padding: 8,
                          borderRadius: 14,
                          border: selected ? '1px solid var(--agent-primary)' : '1px solid #E2E8F0',
                          borderColor: selected ? 'var(--agent-primary)' : '#E2E8F0',
                          background: selected ? 'var(--agent-soft)' : 'rgba(255,255,255,0.82)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          boxShadow: selected ? '0 6px 14px var(--agent-focus-ring)' : 'none',
                          outline: 'none',
                        }}
                      >
                        {previewImage && (
                          <span style={{
                            position: 'relative',
                            display: 'block',
                            width: 76,
                            height: 76,
                            aspectRatio: '1 / 1',
                            overflow: 'hidden',
                            borderRadius: 12,
                            border: selected ? '1px solid var(--agent-border)' : '1px solid rgba(203, 213, 225, 0.9)',
                            background: 'linear-gradient(45deg, #F8FAFC 25%, #EEF2F7 25%, #EEF2F7 50%, #F8FAFC 50%, #F8FAFC 75%, #EEF2F7 75%, #EEF2F7 100%)',
                            backgroundSize: '18px 18px',
                          }}>
                            <img
                              src={previewImage}
                              alt={`${style.name}示例`}
                              loading="eager"
                              onClick={(event) => {
                                event.stopPropagation();
                                openStylePreview('enhancement', style.id);
                              }}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                display: 'block',
                                cursor: 'zoom-in',
                                padding: 4,
                              }}
                            />
                            <span
                              title="查看大图"
                              onClick={(event) => {
                                event.stopPropagation();
                                openStylePreview('enhancement', style.id);
                              }}
                              style={{
                                position: 'absolute',
                                right: 6,
                                bottom: 6,
                                width: 24,
                                height: 24,
                                borderRadius: 8,
                                border: '1px solid rgba(255,255,255,0.78)',
                                background: 'rgba(15, 23, 42, 0.38)',
                                color: '#FFFFFF',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'zoom-in',
                                backdropFilter: 'blur(8px)',
                              }}
                            >
                              <ZoomIn size={14} />
                            </span>
                          </span>
                        )}
                        <span style={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          width: 20,
                          height: 20,
                          borderRadius: 7,
                          border: selected ? 'none' : '1px solid #CBD5E1',
                          background: selected ? 'var(--agent-primary)' : 'rgba(255,255,255,0.86)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 10px rgba(15, 23, 42, 0.12)',
                        }}>
                          {selected && <CheckCircle2 size={13} color="#fff" />}
                        </span>
                        <span style={{ display: 'block', minWidth: 0 }}>
                          <span style={{ display: 'block', fontSize: 13, fontWeight: 800, color: selected ? 'var(--agent-primary)' : '#1E293B' }}>{style.name}</span>
                          <span style={{
                            display: '-webkit-box',
                            marginTop: 4,
                            fontSize: 12,
                            lineHeight: 1.42,
                            color: '#64748B',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}>
                            {style.desc}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{
              borderTop: '1px solid #E2E8F0',
              padding: '14px 18px',
              display: 'grid',
              gridTemplateColumns: 'minmax(190px, 1fr) minmax(260px, 1.35fr) auto',
              alignItems: 'center',
              gap: 14,
              background: '#FFFFFF',
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>{selectedFlowLabel}</div>
                <div style={{
                  color: '#0F172A',
                  fontSize: 14,
                  fontWeight: 850,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {selectedStyleName || '暂未选择风格'}
                </div>
              </div>
              <div style={{ minWidth: 0, display: 'grid', gap: 8 }}>
                {selectedBaseStyle && (
                  <div style={{ minWidth: 0, display: 'grid', gridTemplateColumns: '58px minmax(0, 1fr)', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#64748B', fontSize: 11, fontWeight: 750 }}>课件模型</span>
                    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
                      {htmlModelOptions.map(model => {
                        const selected = model.id === styleHtmlModelId;
                        return (
                          <button
                            key={model.id}
                            type="button"
                            onClick={() => setStyleHtmlModelId(model.id)}
                            style={{
                              height: 28,
                              padding: '0 9px',
                              borderRadius: 8,
                              border: selected ? '1px solid var(--agent-primary)' : '1px solid #DCE6EF',
                              background: selected ? 'var(--agent-soft)' : '#FFFFFF',
                              color: selected ? 'var(--agent-primary-text)' : '#536273',
                              fontSize: 11,
                              fontWeight: 750,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {model.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div style={{ minWidth: 0, display: 'grid', gridTemplateColumns: '58px minmax(0, 1fr)', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#64748B', fontSize: 11, fontWeight: 750 }}>生图模型</span>
                  <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
                    {imageModelOptions.map(model => {
                      const selected = model.id === styleImageModelId;
                      return (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => setStyleImageModelId(model.id)}
                          style={{
                            height: 28,
                            padding: '0 9px',
                            borderRadius: 8,
                            border: selected ? '1px solid var(--agent-primary)' : '1px solid #DCE6EF',
                            background: selected ? 'var(--agent-soft)' : '#FFFFFF',
                            color: selected ? 'var(--agent-primary-text)' : '#536273',
                            fontSize: 11,
                            fontWeight: 750,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {model.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div style={{ color: '#94A3B8', fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  当前：{selectedBaseStyle ? `${selectedStyleHtmlModel.name} · ` : ''}{selectedStyleImageModel.name}
                </div>
              </div>
              <button
                type="button"
                onClick={handleVisualStyleRegenerate}
                disabled={!hasStyleSelection}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  minHeight: 38,
                  padding: '0 16px',
                  borderRadius: 10,
                  border: 'none',
                  background: hasStyleSelection ? 'var(--agent-gradient)' : '#E2E8F0',
                  color: hasStyleSelection ? '#fff' : '#94A3B8',
                  fontSize: 14,
                  fontWeight: 750,
                  cursor: hasStyleSelection ? 'pointer' : 'default',
                  whiteSpace: 'nowrap',
                }}
              >
                <Wand2 size={16} />
                重新生成课件
              </button>
            </div>
          </div>
        </div>
      )}

      {previewingStyle && (
        <div
          onClick={() => setPreviewingStyle(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 25000,
            background: 'rgba(15, 23, 42, 0.58)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 28,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: previewingStyle.kind === 'enhancement' ? 'min(520px, 92vw)' : 'min(960px, 94vw)',
              borderRadius: 18,
              overflow: 'hidden',
              background: '#FFFFFF',
              boxShadow: '0 30px 90px rgba(15, 23, 42, 0.32)',
            }}
          >
            <div style={{
              position: 'relative',
              aspectRatio: previewingStyle.aspectRatio || '16 / 9',
              maxHeight: previewingStyle.kind === 'enhancement' ? 'min(560px, 68vh)' : '74vh',
              background: previewingStyle.kind === 'enhancement'
                ? 'linear-gradient(45deg, #F8FAFC 25%, #EEF2F7 25%, #EEF2F7 50%, #F8FAFC 50%, #F8FAFC 75%, #EEF2F7 75%, #EEF2F7 100%)'
                : '#0F172A',
              backgroundSize: previewingStyle.kind === 'enhancement' ? '24px 24px' : undefined,
              padding: previewingStyle.kind === 'enhancement' ? 24 : 0,
              boxSizing: 'border-box',
            }}>
              <img
                src={previewingStyle.image}
                alt={`${previewingStyle.name}大图参考`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
              {hasPreviewSwitcher && (
                <>
                  <button
                    type="button"
                    aria-label="查看上一张风格参考图"
                    onClick={(event) => {
                      event.stopPropagation();
                      switchPreviewStyle(-1);
                    }}
                    style={{
                      position: 'absolute',
                      left: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 40,
                      height: 40,
                      borderRadius: 14,
                      border: '1px solid rgba(255,255,255,0.7)',
                      background: 'rgba(15, 23, 42, 0.42)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 10px 24px rgba(15, 23, 42, 0.18)',
                    }}
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    aria-label="查看下一张风格参考图"
                    onClick={(event) => {
                      event.stopPropagation();
                      switchPreviewStyle(1);
                    }}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 40,
                      height: 40,
                      borderRadius: 14,
                      border: '1px solid rgba(255,255,255,0.7)',
                      background: 'rgba(15, 23, 42, 0.42)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 10px 24px rgba(15, 23, 42, 0.18)',
                    }}
                  >
                    <ChevronRight size={22} />
                  </button>
                  <div style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: 14,
                    transform: 'translateX(-50%)',
                    minWidth: 58,
                    height: 28,
                    padding: '0 11px',
                    borderRadius: 999,
                    background: 'rgba(15, 23, 42, 0.46)',
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)',
                  }}>
                    {previewStyleIndex + 1} / {previewStyleList.length}
                  </div>
                </>
              )}
              <button
                type="button"
                onClick={() => setPreviewingStyle(null)}
                style={{
                  position: 'absolute',
                  top: 14,
                  right: 14,
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.64)',
                  background: 'rgba(15, 23, 42, 0.46)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <X size={17} />
              </button>
            </div>
            <div style={{
              padding: '15px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              borderTop: '1px solid #E2E8F0',
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: '#0F172A', fontSize: 16, fontWeight: 900 }}>{previewingStyle.name}</div>
                <div style={{ marginTop: 4, color: '#64748B', fontSize: 13, lineHeight: 1.45 }}>{previewingStyle.desc}</div>
              </div>
              {previewingStyle.kind === 'base' ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBaseStyleId(previewingStyle.id);
                    setPreviewingStyle(null);
                  }}
                  style={{
                    minHeight: 38,
                    padding: '0 16px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'var(--agent-gradient)',
                    color: '#FFFFFF',
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  选择此风格
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    toggleEnhancement(previewingStyle.id);
                    setPreviewingStyle(null);
                  }}
                  style={{
                    minHeight: 38,
                    padding: '0 16px',
                    borderRadius: 10,
                    border: 'none',
                    background: selectedEnhancementIds.includes(previewingStyle.id) ? '#E2E8F0' : 'var(--agent-gradient)',
                    color: selectedEnhancementIds.includes(previewingStyle.id) ? '#475569' : '#FFFFFF',
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {selectedEnhancementIds.includes(previewingStyle.id) ? '取消叠加' : '叠加此质感'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
