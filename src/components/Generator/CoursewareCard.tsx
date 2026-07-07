import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Download, CheckCircle2, Sparkles, Edit3, MessageSquareWarning, FileCode2, BarChart3, Palette, X, Wand2, ZoomIn, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import type { Courseware, LearningDataRecoveryRequest, VisualStyleRegenerationRequest } from '../../types';
import { useUIStore } from '../../store/uiStore';
import { useConversationStore, getFrameworkForCourseware } from '../../store/conversationStore';
import toast from '../../utils/toast';
import ResourceEditModal from './ResourceEditModal';
import LearningDataRecoveryModal from './LearningDataRecoveryModal';
import {
  baseVisualStylePresets,
  enhancementVisualStylePreviewImages,
  enhancementVisualStylePresets,
  getVisualStylePreviewStyle,
  getVisualStyleSelection,
  visualStylePreviewImages,
} from '../../data/visualStylePresets';

// 默认音色选项
const DEFAULT_VOICES = [
  { id: 'female-1', name: '温柔女声', gender: 'female' as const, description: '标准女音，适合教学场景', isDefault: true },
  { id: 'female-2', name: '活泼女童', gender: 'female' as const, description: '童声女音，适合低龄互动' },
  { id: 'male-1', name: '标准男声', gender: 'male' as const, description: '标准男音，适合正式场景' },
  { id: 'male-2', name: '活力男童', gender: 'male' as const, description: '童声男音，适合趣味教学' },
];

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
  { id: 'audio-1', label: '单词发音 - Apple', type: 'tts', status: 'completed', voiceId: 'female-1', duration: 1.2 },
  { id: 'audio-2', label: '单词发音 - Banana', type: 'tts', status: 'completed', voiceId: 'female-1', duration: 1.5 },
  { id: 'audio-3', label: '游戏背景音乐', type: 'bgm', status: 'completed', duration: 30.0 },
];

export default function CoursewareCard({
  courseware,
  version = 'v1.0',
  isLatest: isLatestProp = true,
  onOpenPreview,
  onLearningDataRecoveryRequest,
  onVisualStyleRegenerate,
  onUndoResult,
  publishBadgeLabel,
}: {
  courseware: Courseware;
  version?: string;
  isLatest?: boolean;
  onOpenPreview?: (coursewareId: number) => void;
  onLearningDataRecoveryRequest?: (request: LearningDataRecoveryRequest) => void;
  onVisualStyleRegenerate?: (request: VisualStyleRegenerationRequest) => void;
  onUndoResult?: () => void;
  publishBadgeLabel?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [feedbackCopied, setFeedbackCopied] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [images, setImages] = useState(MOCK_IMAGES);
  const [audios, setAudios] = useState(MOCK_AUDIOS);
  const [editDisabledTooltip, setEditDisabledTooltip] = useState(false);
  const [styleDisabledTooltip, setStyleDisabledTooltip] = useState(false);
  const [isLatest, setIsLatest] = useState(isLatestProp);
  const [currentVersion, setCurrentVersion] = useState(version);
  const [showLearningDataModal, setShowLearningDataModal] = useState(false);
  const [showVisualStyleModal, setShowVisualStyleModal] = useState(false);
  const [selectedBaseStyleId, setSelectedBaseStyleId] = useState<string | null>(null);
  const [selectedEnhancementIds, setSelectedEnhancementIds] = useState<string[]>([]);
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

  const handleImageRegenerate = (imageId: string, prompt: string) => {
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
      toast('图片重新生成完成');
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
    const voice = DEFAULT_VOICES.find(v => v.id === voiceId);
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
      regenerationMode,
    });
  };

  const getActionButtonStyle = (
    variant: 'primary' | 'secondary' = 'secondary',
    enabled = true,
  ): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 34,
    padding: '0 12px',
    borderRadius: 9,
    border: variant === 'primary'
      ? '1px solid rgba(15, 118, 110, 0.22)'
      : '1px solid #DDE7EE',
    background: enabled
      ? variant === 'primary'
        ? 'linear-gradient(180deg, #FFFFFF 0%, var(--agent-soft) 100%)'
        : '#FFFFFF'
      : '#F8FAFC',
    color: enabled
      ? variant === 'primary'
        ? 'var(--agent-primary-text)'
        : '#475569'
      : '#CBD5E1',
    fontSize: 13,
    fontWeight: 750,
    cursor: enabled ? 'pointer' : 'not-allowed',
    opacity: enabled ? 1 : 0.68,
    transition: 'border-color 0.15s, color 0.15s, background 0.15s, box-shadow 0.15s, transform 0.15s',
    outline: 'none',
    whiteSpace: 'nowrap',
  });

  const handleActionEnter = (event: React.MouseEvent<HTMLButtonElement>, enabled = true) => {
    if (!enabled) return;
    event.currentTarget.style.borderColor = 'rgba(15, 118, 110, 0.36)';
    event.currentTarget.style.color = 'var(--agent-primary-text)';
    event.currentTarget.style.background = 'var(--agent-soft)';
    event.currentTarget.style.boxShadow = '0 6px 16px rgba(15, 118, 110, 0.10)';
    event.currentTarget.style.transform = 'translateY(-1px)';
  };

  const handleActionLeave = (
    event: React.MouseEvent<HTMLButtonElement>,
    variant: 'primary' | 'secondary' = 'secondary',
    enabled = true,
  ) => {
    const nextStyle = getActionButtonStyle(variant, enabled);
    event.currentTarget.style.borderColor = String(nextStyle.borderColor || '');
    event.currentTarget.style.color = String(nextStyle.color || '');
    event.currentTarget.style.background = String(nextStyle.background || '');
    event.currentTarget.style.boxShadow = 'none';
    event.currentTarget.style.transform = 'none';
  };

  return (
    <>
      <div style={{
        background: '#fff',
        borderRadius: 14,
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        width: '100%',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        cursor: onOpenPreview ? 'pointer' : 'default',
      }}
        onClick={() => onOpenPreview?.(courseware.id)}
      >
        <div
          onClick={() => onOpenPreview?.(courseware.id)}
          style={{
          background: 'var(--agent-surface-gradient, var(--agent-gradient))',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          cursor: onOpenPreview ? 'pointer' : 'default',
        }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(6, 72, 150, 0.22)', backdropFilter: 'blur(8px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: '#FFFFFF', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.34), 0 8px 18px rgba(7, 89, 201, 0.12)',
          }}>
            <FileCode2 size={21} strokeWidth={2.2} />
            <span style={{ fontSize: 8, fontWeight: 900, lineHeight: 1, marginTop: 1 }}>HTML</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', textShadow: '0 1px 2px rgba(5, 35, 86, 0.18)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{courseware.title}</span>
              {publishBadgeLabel && (
                <span style={{
                  flexShrink: 0,
                  padding: '2px 7px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.22)',
                  border: '1px solid rgba(255,255,255,0.34)',
                  color: '#FFFFFF',
                  fontSize: 11,
                  fontWeight: 800,
                  lineHeight: 1.4,
                }}>
                  {publishBadgeLabel}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.86)', marginTop: 3, textShadow: '0 1px 2px rgba(5, 35, 86, 0.14)' }}>刚刚生成</div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(255,255,255,0.26)', backdropFilter: 'blur(8px)',
            padding: '6px 12px', borderRadius: 20, fontSize: 13, color: '#fff', fontWeight: 600,
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.24)',
          }}>
            <Sparkles size={14} />
            {currentVersion}
          </div>
        </div>

        <div style={{ padding: '14px 20px', background: '#FAFBFC' }} onClick={(e) => e.stopPropagation()}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}>
          <button
            onClick={handleClone}
            style={getActionButtonStyle('primary')}
            onMouseEnter={e => handleActionEnter(e)}
            onMouseLeave={e => handleActionLeave(e, 'primary')}
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
              onMouseEnter={e => handleActionEnter(e, isLatest)}
              onMouseLeave={e => handleActionLeave(e, 'secondary', isLatest)}
            >
              <Edit3 size={15} />
              编辑资源
            </button>
            {editDisabledTooltip && !isLatest && (
              <div style={{
                position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                marginBottom: 6, padding: '6px 10px', borderRadius: 6, background: '#1E293B', color: '#fff',
                fontSize: 11, whiteSpace: 'nowrap', zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
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
              onMouseEnter={e => handleActionEnter(e, isLatest)}
              onMouseLeave={e => handleActionLeave(e, 'secondary', isLatest)}
            >
              <Palette size={15} />
              调整画面风格
            </button>
            {styleDisabledTooltip && !isLatest && (
              <div style={{
                position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                marginBottom: 6, padding: '6px 10px', borderRadius: 6, background: '#1E293B', color: '#fff',
                fontSize: 11, whiteSpace: 'nowrap', zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}>
                当前为旧版，请在最新版课件上调整画面风格
              </div>
            )}
          </div>
          <button
            onClick={() => setShowLearningDataModal(true)}
            style={getActionButtonStyle('secondary')}
            onMouseEnter={e => handleActionEnter(e)}
            onMouseLeave={e => handleActionLeave(e)}
          >
            <BarChart3 size={15} />
            预览报告展示
          </button>
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
                borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
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
        {onUndoResult && (
          <button
            onClick={onUndoResult}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, padding: 0,
              border: 'none', background: 'transparent',
              color: '#64748B',
              cursor: 'pointer', outline: 'none', lineHeight: 1.2,
              fontSize: 12, fontWeight: 650,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--agent-primary-text)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#64748B'; }}
            title="撤回本次生成"
          >
            <RotateCcw size={13} />
            <span>撤回</span>
          </button>
        )}
      </div>

      <ResourceEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onConfirmReplace={() => {
          setIsLatest(false);
          setCurrentVersion(currentVersion);
        }}
        images={images}
        audios={audios}
        voices={DEFAULT_VOICES}
        onImageReplace={handleImageReplace}
        onImageRegenerate={handleImageRegenerate}
        onAudioReplace={handleAudioReplace}
        onAudioRegenerate={handleAudioRegenerate}
      />

      <LearningDataRecoveryModal
        isOpen={showLearningDataModal}
        coursewareTitle={courseware.title}
        initialItems={courseware.learningDataRecovery?.selectedItems}
        isLatestVersion={isLatest}
        onClose={() => setShowLearningDataModal(false)}
        onRegenerate={(items) => {
          setIsLatest(false);
          onLearningDataRecoveryRequest?.({
            coursewareTitle: courseware.title,
            htmlContent: courseware.htmlContent,
            version: '下一版',
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
            zIndex: 1200,
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
                          border: selected ? '2px solid var(--agent-primary)' : '1px solid #E2E8F0',
                          background: selected ? 'var(--agent-soft)' : '#FFFFFF',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s',
                          boxShadow: selected ? '0 10px 28px rgba(15, 118, 110, 0.12)' : 'none',
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
                          <span style={{ fontSize: 13, fontWeight: 850, color: selected ? '#0F766E' : '#0F172A' }}>{style.name}</span>
                          {selected && <CheckCircle2 size={15} color="#0F766E" />}
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
                          border: selected ? '1.5px solid rgba(15, 118, 110, 0.78)' : '1px solid #E2E8F0',
                          background: selected ? '#FFFFFF' : 'rgba(255,255,255,0.82)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          boxShadow: selected ? '0 8px 18px rgba(15, 118, 110, 0.10)' : 'none',
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
                            border: selected ? '1px solid rgba(15, 118, 110, 0.24)' : '1px solid rgba(203, 213, 225, 0.9)',
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
                          background: selected ? 'var(--agent-gradient)' : 'rgba(255,255,255,0.86)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 10px rgba(15, 23, 42, 0.12)',
                        }}>
                          {selected && <CheckCircle2 size={13} color="#fff" />}
                        </span>
                        <span style={{ display: 'block', minWidth: 0 }}>
                          <span style={{ display: 'block', fontSize: 13, fontWeight: 800, color: selected ? '#0F766E' : '#1E293B' }}>{style.name}</span>
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
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
            zIndex: 1300,
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
