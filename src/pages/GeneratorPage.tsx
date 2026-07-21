import { useState, useCallback, useRef, useEffect, type UIEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ChevronDown, ChevronUp, Headphones, Info, Mic, RotateCcw, Sparkles } from 'lucide-react';
import ChatInput from '../components/Generator/ChatInput';
// ChatHistory moved to Sidebar
import RequirementCard from '../components/Generator/RequirementCard';
import ProgressPanel from '../components/Generator/ProgressPanel';
import PreviewPanel from '../components/Generator/PreviewPanel';
import CoursewareCard from '../components/Generator/CoursewareCard';
import InspirationSection, { buildStructuredInspirationPrompt, type GameplayInspiration } from '../components/Generator/InspirationSection';
import HtmlTypeBadge from '../components/common/HtmlTypeBadge';
import { useConversationStore, simulateGeneration } from '../store/conversationStore';
import { useUIStore } from '../store/uiStore';
import { useCoursewareStore } from '../store/coursewareStore';
import type {
  ConversationMessage,
  RequirementFramework,
  GenerationProgress,
  CoursewareResult,
  Courseware,
  LearningDataRecoveryRequest,
  VisualStyleRegenerationRequest,
  UploadedAttachment,
  MaterialIntent,
  MaterialIntentConfirmation,
  MaterialIntentOption,
  MaterialIntentResolution,
  UserMaterialMessage,
  VoiceCapabilityConfirmation,
  VoiceCapabilityIntent,
  VoiceCapabilitySelection,
} from '../types';
import { generateRequirementFromPrompt } from '../data/mockConversations';
import { mockCoursewares } from '../data/mockCoursewares';
import { demoSessionVersions } from '../data/demoCoursewareVersions';
import { demoMs } from '../constants/demoTiming';
import toast from '../utils/toast';

type GenerationPhase = 'input' | 'analyzing' | 'loading-framework' | 'framework' | 'generating' | 'completed';
const GENERIC_AI_WAITING_TEXT = '已收到您的消息，正在处理中~';

type PromptFlyState = {
  id: number;
  title: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
};

const imageIntentOptions: MaterialIntentOption[] = [
  { intent: 'use-as-courseware-material', title: '作为课件素材', description: '直接用于背景、角色、道具或题目插图' },
  { intent: 'use-as-style-reference', title: '作为风格参考', description: '只参考画风、配色和构图，不直接放进课件' },
  { intent: 'extract-image-content', title: '提取图片内容', description: '识别图片中的文字、题目、知识点或版面信息' },
];

const documentIntentOptions: MaterialIntentOption[] = [
  { intent: 'generate-from-document', title: '基于资料生成课件', description: '提取教学内容、知识点和练习，生成互动课件' },
  { intent: 'use-as-requirement-doc', title: '作为需求说明', description: '读取老师写的流程、玩法、规则和设计要求' },
  { intent: 'extract-document-questions', title: '提取题目', description: '只抽取题干、选项、答案和解析，用于题目互动' },
];

const getAttachmentLabel = (attachment: UploadedAttachment) => (
  attachment.type === 'image' ? '图片' : attachment.type === 'html' ? 'HTML' : '文档'
);

const buildAttachmentSummary = (attachments: UploadedAttachment[]) => {
  const imageCount = attachments.filter(f => f.type === 'image').length;
  const documentCount = attachments.filter(f => f.type === 'document').length;
  const parts = [];
  if (imageCount) parts.push(`${imageCount} 张图片`);
  if (documentCount) parts.push(`${documentCount} 份文档`);
  return parts.join('、');
};

const parseAppliedPlaywayMessage = (value: string) => {
  const match = value.match(/^(?:教学内容|你的需求)：([\s\S]*?)\n\n<已套用玩法>\n([\s\S]*?)\n<\/已套用玩法>$/);
  if (!match) return null;

  const body = match[2];
  const pick = (label: string) => body.match(new RegExp(`${label}：([^\\n]+)`))?.[1]?.trim() || '';
  const section = (label: string, nextLabel: string) => {
    const result = body.match(new RegExp(`${label}：\\n([\\s\\S]*?)\\n\\n${nextLabel}：`));
    return result?.[1]?.trim() || '';
  };
  const flow = section('课堂互动流程', '玩法改编建议')
    .split('\n')
    .map(item => item.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean)
    .join(' → ');
  const prompt = body.match(/玩法要求：\n([\s\S]*?)\n\n(?:本次生成要求|生成要求)：/)?.[1]?.trim() || '';

  return {
    demand: match[1].trim(),
    playwayName: pick('玩法名称'),
    playwayType: pick('玩法类型'),
    ageRange: pick('适用年龄'),
    suitableFor: pick('适合内容'),
    flow,
    adaptation: section('玩法改编建议', '玩法要求'),
    prompt,
  };
};

const detectMaterialIntentForAttachment = (prompt: string, attachment: UploadedAttachment): MaterialIntentResolution | null => {
  const text = prompt.toLowerCase();
  if (attachment.type === 'image' && /(背景|角色|道具|素材|插图|放到|用这张图|用这个图|图片.*用|图.*作为|图片作为|图作为)/i.test(prompt)) {
    return {
      attachmentId: attachment.id,
      intent: 'use-as-courseware-material',
      title: '作为课件素材',
      description: '直接用于背景、角色、道具或题目插图',
      confidence: 0.88,
      reason: 'prompt 中明确提到背景、角色、道具、素材或插图等用途',
    };
  }

  if (attachment.type === 'image' && /(参考图片|参考这张图|参考这张图片|图片.*(风格|画风|配色|参考|类似|视觉)|图.*(风格|画风|配色|参考|类似|视觉)|(风格|画风|配色|视觉).*(图片|图|这张|照片)|像这张图|类似这张图)/i.test(prompt)) {
    return {
      attachmentId: attachment.id,
      intent: 'use-as-style-reference',
      title: '作为风格参考',
      description: '只参考画风、配色和构图，不直接放进课件',
      confidence: 0.86,
      reason: 'prompt 中明确提到风格、画风、配色或参考',
    };
  }

  if (attachment.type === 'image' && /((识别|提取|ocr).*(图片|图|这张|文字|题目|内容)|(图片|图|这张).*(文字|题目|内容|识别|提取))/i.test(prompt)) {
    return {
      attachmentId: attachment.id,
      intent: 'extract-image-content',
      title: '提取图片内容',
      description: '识别图片中的文字、题目、知识点或版面信息',
      confidence: 0.84,
      reason: 'prompt 中明确提到识别、提取、文字或题目',
    };
  }

  if (attachment.type === 'document' && /((文档|文件|word|pdf|讲义|教案|资料).*(题目|试题|练习|答案|解析|提取)|(题目|试题|练习|答案|解析).*(文档|文件|word|pdf|讲义|资料)|提取.*(题目|试题|练习|答案|解析))/i.test(prompt)) {
    return {
      attachmentId: attachment.id,
      intent: 'extract-document-questions',
      title: '提取题目',
      description: '只抽取题干、选项、答案和解析，用于题目互动',
      confidence: 0.9,
      reason: 'prompt 中明确提到文档中的题目、练习、答案、解析或提取',
    };
  }

  if (attachment.type === 'document' && /((文档|文件|word|pdf|需求|规则|玩法|说明|prd|流程|规范|评审反馈|修改意见).*(需求|规则|玩法|说明|prd|流程|规范|反馈|修改意见)|(pdf|word|文档|文件).*是.*(玩法|规则|需求|说明|反馈))/i.test(prompt)) {
    return {
      attachmentId: attachment.id,
      intent: 'use-as-requirement-doc',
      title: '作为需求说明',
      description: '读取老师写的流程、玩法、规则和设计要求',
      confidence: 0.86,
      reason: 'prompt 中明确提到需求、规则、玩法、流程或规范',
    };
  }

  if (attachment.type === 'document' && /((基于|根据|按照|用).*(这份|这个|文档|文件|pdf|word|讲义|教案|资料|知识点|教学内容|课程内容|课文|单词表).*(生成|做|制作|互动课件|游戏)|(讲义|教案|知识点|教学内容|课程内容|课文|单词表).*(生成|做成|制作|互动课件|游戏))/i.test(prompt)) {
    return {
      attachmentId: attachment.id,
      intent: 'generate-from-document',
      title: '基于资料生成课件',
      description: '提取教学内容、知识点和练习，生成互动课件',
      confidence: 0.88,
      reason: 'prompt 中明确表达基于文档资料、讲义、教案或知识点生成课件',
    };
  }

  if (text.trim().length === 0) return null;
  return null;
};

const analyzeMaterialIntents = (prompt: string, attachments: UploadedAttachment[]) => {
  const resolvedIntents: MaterialIntentResolution[] = [];
  const pendingAttachments: UploadedAttachment[] = [];

  attachments.forEach(attachment => {
    const detected = detectMaterialIntentForAttachment(prompt, attachment);
    if (detected) {
      resolvedIntents.push(detected);
    } else {
      pendingAttachments.push(attachment);
    }
  });

  return {
    resolvedIntents,
    pendingAttachments,
  };
};

const buildIntentPrompt = (
  prompt: string,
  attachments: UploadedAttachment[],
  resolutions: MaterialIntentResolution[],
) => {
  const intentLabels: Record<MaterialIntent, string> = {
    'use-as-courseware-material': '将上传图片作为课件素材使用',
    'use-as-style-reference': '将上传图片作为视觉风格参考',
    'extract-image-content': '先提取图片中的文字、题目和知识点',
    'generate-from-document': '基于上传文档中的教学资料生成互动课件',
    'use-as-requirement-doc': '将上传文档作为需求说明和玩法规则补充',
    'extract-document-questions': '先提取文档中的题目、答案和解析',
    'custom': '按用户补充的其他用途处理',
  };
  const attachmentNames = attachments.map(f => `${getAttachmentLabel(f)}「${f.name}」`).join('、');
  const usageLines = resolutions.map(item => {
    const attachment = attachments.find(file => file.id === item.attachmentId);
    return `${attachment ? `${getAttachmentLabel(attachment)}「${attachment.name}」` : '上传材料'}：${item.customText || intentLabels[item.intent]}`;
  }).join('\n');
  const originalPrompt = prompt.trim() || '请根据上传材料生成互动课件';
  return `${originalPrompt}\n\n上传材料：${attachmentNames}\n材料用途：\n${usageLines}`;
};

const detectVoiceCapabilityIntent = (value: string): VoiceCapabilityIntent | null => {
  const text = value.trim();
  if (!text) return null;

  const explicitNoVoice = /(不需要|无需|不要|不用|不启用|不用接入).*(录音|收音|语音|口语|朗读|评测|发音)/.test(text)
    || /(录音|收音|语音|口语|朗读|评测|发音).*(不需要|无需|不要|不用|不启用)/.test(text);
  const clearNonVoiceInteraction = /(只做|仅做|做一个|生成).*(点击|拖拽|选择|配对|排序|连线|消除|翻牌|分类|填空|判断)/.test(text)
    && !/(录音|收音|语音|口语|朗读|跟读|背诵|口述|发音|开口|说出|读出|评测)/.test(text);
  if (explicitNoVoice || clearNonVoiceInteraction) return null;

  const englishAssessmentSignal = /(英语口语|英文口语|口语评测|发音评价|发音评测|pronunciation|speaking|speak|read aloud)/i.test(text)
    || /(英语|英文|单词|短句|对话|句子).*(跟读|朗读|读一读|我来读|开口读|发音|口语|评测)/.test(text)
    || /(跟读|朗读|读一读|我来读|开口读|发音|口语|评测).*(英语|英文|单词|短句|对话|句子)/.test(text);
  if (englishAssessmentSignal) return 'english-oral';

  const recordOnlySignal = /(古诗|诗词|课文朗读|中文朗读|语文朗读|背诵|口述|看图说话|复述|朗读|录音|收音|开口作答|语音作答|说一说|读一读)/.test(text);
  if (recordOnlySignal) return 'record-only';

  return null;
};

const buildVoiceCapabilityAppendix = (selection: VoiceCapabilitySelection) => {
  if (!selection.smallScreenRecording && !selection.englishOralAssessment) return '';

  const lines = ['', '语音服务配置：'];
  if (selection.smallScreenRecording) {
    lines.push('- 启用学生小屏真实收音：学生通过学生小屏点击录音并提交真实作答。');
  }
  if (selection.englishOralAssessment) {
    lines.push('- 启用英语口语评测：仅用于英语单词、短句、简单对话等当前支持范围；需要展示真实评测结果。');
  } else if (selection.smallScreenRecording) {
    lines.push('- 不启用自动口语评测：古诗词朗读、中文朗读、背诵、开放口述等场景只做录音提交或完成反馈。');
  }
  lines.push('- 生成后需校验：不支持评测的录音题不得出现随机分数、星级评测、发音准确率等伪评测结果。');
  return lines.join('\n');
};

const CHAT_CONTENT_MAX_WITH_PREVIEW = 720;
const CHAT_CONTENT_MAX_FULL = 864;
const DEFAULT_CHAT_WIDTH_WITH_PREVIEW = 52;
const HOMEPAGE_ROBOT_URL = 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/Hnz6NTtZ-25a4e308-7fe5-47dc-a146-093190a3f378.png';

const isUserMaterialMessage = (content: ConversationMessage['content']): content is UserMaterialMessage => (
  typeof content === 'object'
  && content !== null
  && 'text' in content
);

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    height: '100vh',
    background: 'var(--agent-page-bg)',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  chatArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '28px 48px 24px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    scrollbarGutter: 'stable',
  },
  messagesContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    width: '100%',
    maxWidth: 'var(--chat-content-max, 864px)',
    margin: '0 auto',
    transition: 'padding-right 0.3s ease',
  },
  inputArea: {
    padding: '16px 48px 24px',
    width: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'center',
    transition: 'padding-right 0.3s ease',
  },
  welcomeSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '28px 30px 52px 50px',
  },
  welcomeHeroPanel: {
    position: 'relative',
    width: '100%',
    maxWidth: 1080,
    minHeight: 386,
    padding: '42px 58px 22px',
    borderRadius: 16,
    background: 'var(--agent-home-hero-bg)',
    overflow: 'hidden',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.76)',
  },
  welcomeHeroContent: {
    position: 'relative',
    zIndex: 2,
    width: '100%',
    maxWidth: 980,
  },
  welcomeHeroCopy: {
    marginBottom: 26,
  },
  welcomeRobot: {
    position: 'absolute',
    right: 76,
    top: 4,
    width: 156,
    maxWidth: '17vw',
    pointerEvents: 'none',
    userSelect: 'none',
    zIndex: 1,
  },
  backToInputButton: {
    width: 42,
    height: 42,
    padding: 0,
    borderRadius: 12,
    border: '1px solid var(--agent-border)',
    background: '#FFFFFF',
    color: 'var(--agent-primary-text)',
    boxShadow: '0 10px 28px rgba(15, 118, 110, 0.15)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
  },
  backToInputWrap: {
    position: 'fixed',
    right: 36,
    bottom: 148,
    zIndex: 80,
  },
  backToInputTooltip: {
    position: 'absolute',
    right: 0,
    bottom: 50,
    height: 28,
    padding: '0 10px',
    borderRadius: 8,
    background: '#0F172A',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 800,
    lineHeight: '28px',
    whiteSpace: 'nowrap',
    boxShadow: '0 10px 24px rgba(15, 23, 42, 0.16)',
    pointerEvents: 'none',
    opacity: 0,
    transform: 'translateY(3px)',
    transition: 'opacity 0.14s ease, transform 0.14s ease',
  },
  backToInputTooltipArrow: {
    position: 'absolute',
    right: 15,
    bottom: -4,
    width: 8,
    height: 8,
    background: '#0F172A',
    transform: 'rotate(45deg)',
  },
  welcomeTitle: {
    fontSize: 34,
    fontWeight: 950,
    color: '#1E293B',
    margin: '0 0 10px',
    textAlign: 'left',
    lineHeight: 1.16,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#697B91',
    margin: 0,
    textAlign: 'left',
    fontWeight: 400,
    lineHeight: 1.65,
  },
  promptFlyCard: {
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 21000,
    pointerEvents: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    width: 236,
    height: 44,
    padding: '0 12px',
    borderRadius: 14,
    border: '1px solid rgba(79, 209, 197, 0.48)',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(231, 255, 250, 0.94))',
    color: 'var(--agent-primary-text)',
    boxShadow: '0 18px 46px rgba(15, 118, 110, 0.22), inset 0 1px 0 rgba(255,255,255,0.92)',
    backdropFilter: 'blur(12px)',
  },
  promptFlyIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 26,
    borderRadius: 9,
    background: 'var(--agent-action-gradient)',
    color: '#FFFFFF',
    flexShrink: 0,
  },
  promptFlyText: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: 13,
    fontWeight: 900,
  },
  messageUser: {
    display: 'flex',
    justifyContent: 'flex-end',
    width: '100%',
  },
  userBubble: {
    background: '#EAF6FF',
    color: '#0F2F57',
    padding: '12px 16px',
    borderRadius: 10,
    maxWidth: '100%',
    fontSize: 15,
    lineHeight: 1.5,
    border: '1px solid #CFEAF7',
    boxShadow: '0 6px 18px rgba(37, 74, 120, 0.06)',
  },
  messageAssistant: {
    display: 'flex',
    justifyContent: 'flex-start',
    gap: 0,
    width: '100%',
  },
  assistantContent: {
    width: '100%',
    maxWidth: 'var(--chat-content-max, 864px)',
    minWidth: 0,
  },
  assistantBubble: {
    background: '#FFFFFF',
    color: '#1E293B',
    padding: '12px 16px',
    borderRadius: 10,
    maxWidth: 'var(--chat-content-max, 864px)',
    fontSize: 15,
    lineHeight: 1.5,
    border: '1px solid #E2E8F0',
  },
  waitingStack: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 9,
    maxWidth: 'var(--chat-content-max, 864px)',
  },
  waitingDots: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 12,
    padding: 0,
    height: 18,
  },
  waitingDot: {
    width: 9,
    height: 9,
    borderRadius: '50%',
    animation: 'dotBounce 1.4s infinite ease-in-out both',
  },
};

const intentCardStyles: Record<string, React.CSSProperties> = {
  card: {
    background: '#FFFFFF',
    border: '1px solid #CFFAFE',
    borderRadius: 12,
    boxShadow: '0 8px 28px rgba(14, 165, 233, 0.08)',
    padding: 16,
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: 700,
    color: '#0F172A',
    marginBottom: 4,
  },
  summary: {
    fontSize: 13,
    lineHeight: 1.5,
    color: '#64748B',
  },
  badge: {
    flexShrink: 0,
    padding: '4px 8px',
    borderRadius: 999,
    background: '#FEF3C7',
    color: '#B45309',
    fontSize: 12,
    fontWeight: 600,
  },
  pendingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  pendingItem: {
    padding: 12,
    borderRadius: 10,
    border: '1px solid #E2E8F0',
    background: '#F8FAFC',
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 8,
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    minWidth: 0,
  },
  fileThumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
    objectFit: 'cover',
    flexShrink: 0,
  },
  fileIcon: {
    width: 36,
    height: 36,
    borderRadius: 6,
    background: 'linear-gradient(135deg, #E0F2FE, var(--agent-soft-strong))',
    color: '#0284C7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
  },
  fileName: {
    fontSize: 13,
    color: '#334155',
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  fileType: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  options: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: 8,
    marginTop: 10,
  },
  optionBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid var(--agent-border)',
    background: 'var(--agent-soft)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s',
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--agent-primary-text)',
  },
  optionDesc: {
    fontSize: 12,
    lineHeight: 1.4,
    color: '#64748B',
  },
  customRow: {
    display: 'grid',
    gridTemplateColumns: '88px 1fr',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  customLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: '#334155',
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  customInput: {
    width: '100%',
    height: 34,
    borderRadius: 8,
    border: '1px solid #CBD5E1',
    padding: '0 10px',
    fontSize: 13,
    color: '#0F172A',
    outline: 'none',
    background: '#FFFFFF',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTop: '1px solid #E2E8F0',
  },
  footerHint: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 1.4,
  },
  confirmBtn: {
    border: 'none',
    borderRadius: 8,
    padding: '9px 16px',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
  },
  confirmedState: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    background: 'var(--agent-soft-strong)',
    border: '1px solid #BAE6FD',
    color: 'var(--agent-primary-text)',
    fontSize: 13,
    fontWeight: 800,
    lineHeight: 1.5,
  },
};

const voiceCardStyles: Record<string, React.CSSProperties> = {
  card: {
    background: '#FFFFFF',
    border: '1px solid #BAE6FD',
    borderRadius: 12,
    boxShadow: '0 12px 32px rgba(14, 165, 233, 0.1)',
    padding: 16,
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
    marginBottom: 14,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  titleIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: '#E0F2FE',
    color: '#0284C7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: 800,
    color: '#0F172A',
  },
  summary: {
    fontSize: 13,
    lineHeight: 1.55,
    color: '#64748B',
  },
  badge: {
    flexShrink: 0,
    padding: '4px 8px',
    borderRadius: 999,
    background: '#E0F2FE',
    color: '#0369A1',
    fontSize: 12,
    fontWeight: 700,
  },
  options: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 10,
  },
  optionBtn: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    minHeight: 86,
    padding: '12px 13px',
    borderRadius: 10,
    border: '1px solid #E2E8F0',
    background: '#F8FAFC',
    cursor: 'pointer',
    textAlign: 'left',
    outline: 'none',
    transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
  },
  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionTitle: {
    display: 'block',
    color: '#0F172A',
    fontSize: 13,
    fontWeight: 800,
    marginBottom: 4,
  },
  optionDesc: {
    display: 'block',
    color: '#64748B',
    fontSize: 12,
    lineHeight: 1.45,
  },
  note: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    padding: '10px 12px',
    borderRadius: 10,
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    color: '#475569',
    fontSize: 12,
    lineHeight: 1.5,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTop: '1px solid #E2E8F0',
  },
  countdown: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 1.5,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    flexShrink: 0,
  },
  ghostBtn: {
    border: '1px solid #CBD5E1',
    borderRadius: 8,
    padding: '9px 14px',
    background: '#FFFFFF',
    color: '#334155',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    outline: 'none',
  },
  confirmBtn: {
    border: 'none',
    borderRadius: 8,
    padding: '9px 16px',
    background: 'var(--agent-primary)',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
    outline: 'none',
  },
  confirmedState: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    background: 'var(--agent-soft-strong)',
    border: '1px solid #BAE6FD',
    color: 'var(--agent-primary-text)',
    fontSize: 13,
    fontWeight: 800,
    lineHeight: 1.5,
  },
};

const userMessageStyles: Record<string, React.CSSProperties> = {
  stack: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
    width: '100%',
    maxWidth: 'var(--chat-content-max, 864px)',
  },
  textWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    width: '100%',
  },
  fullWidthBubble: {
    width: '100%',
    boxSizing: 'border-box',
  },
  collapsibleBubble: {
    position: 'relative',
    overflow: 'hidden',
  },
  collapsedBubble: {
    maxHeight: 260,
  },
  fadeMask: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 54,
    borderRadius: '0 0 10px 10px',
    background: 'linear-gradient(180deg, rgba(234, 246, 255, 0), #EAF6FF 78%)',
    pointerEvents: 'none',
  },
  expandButton: {
    marginTop: 6,
    height: 26,
    padding: '0 10px',
    borderRadius: 10,
    border: '1px solid #CFEAF7',
    background: 'rgba(255, 255, 255, 0.92)',
    color: 'var(--agent-primary-text)',
    fontSize: 12,
    fontWeight: 850,
    cursor: 'pointer',
    boxShadow: '0 6px 16px rgba(15, 23, 42, 0.08)',
  },
  appliedPromptCard: {
    width: '100%',
    maxWidth: '100%',
    padding: 12,
    marginTop: 8,
    borderRadius: 14,
    border: '1px solid var(--agent-border)',
    background: '#FFFFFF',
    boxShadow: '0 10px 28px rgba(15, 23, 42, 0.08)',
    color: '#0F172A',
  },
  appliedPromptSection: {
    display: 'grid',
    gap: 6,
  },
  appliedPromptHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  appliedPromptLabel: {
    color: 'var(--agent-primary-text)',
    fontSize: 12,
    fontWeight: 900,
  },
  appliedPromptTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: 900,
  },
  appliedPromptBadge: {
    padding: '3px 8px',
    borderRadius: 999,
    background: 'var(--agent-soft)',
    color: 'var(--agent-primary-text)',
    fontSize: 11,
    fontWeight: 850,
    whiteSpace: 'nowrap',
  },
  appliedPromptFlow: {
    color: 'var(--agent-primary-text)',
    fontSize: 12,
    fontWeight: 850,
    lineHeight: 1.5,
  },
  appliedPromptAdvice: {
    padding: '9px 10px',
    borderRadius: 10,
    background: '#F8FAFC',
    color: '#475569',
    fontSize: 12,
    lineHeight: 1.55,
  },
  appliedPromptPreviewBox: {
    marginTop: 6,
    borderRadius: 12,
    border: '1px solid rgba(15, 118, 110, 0.14)',
    background: 'rgba(248, 250, 252, 0.72)',
    overflow: 'hidden',
  },
  appliedPromptPreviewToggle: {
    width: '100%',
    minHeight: 36,
    padding: '0 11px',
    border: 'none',
    background: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    color: 'var(--agent-primary-text)',
    fontSize: 12,
    fontWeight: 900,
    cursor: 'pointer',
  },
  appliedPromptRaw: {
    maxHeight: 180,
    margin: 0,
    padding: '10px 12px',
    overflowY: 'auto',
    color: '#334155',
    background: '#FFFFFF',
    borderTop: '1px solid #E2E8F0',
    fontSize: 12,
    lineHeight: 1.55,
    whiteSpace: 'pre-wrap',
    fontFamily: 'inherit',
  },
  imageGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
  },
  imageCard: {
    width: 108,
    height: 80,
    padding: 0,
    border: '2px solid var(--agent-border)',
    borderRadius: 10,
    background: '#FFFFFF',
    overflow: 'hidden',
    cursor: 'zoom-in',
    boxShadow: '0 6px 18px rgba(15, 23, 42, 0.08)',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  documentList: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
    width: '100%',
  },
  documentCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    maxWidth: 320,
    padding: '9px 12px',
    borderRadius: 10,
    background: '#FFFFFF',
    border: '1px solid #BAE6FD',
    boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)',
  },
  documentIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: '#E0F2FE',
    color: '#0284C7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
  },
  documentName: {
    fontSize: 13,
    fontWeight: 600,
    color: '#0F172A',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  documentMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  htmlCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    maxWidth: 340,
    padding: '10px 12px',
    borderRadius: 10,
    background: 'var(--agent-soft)',
    border: '1px solid var(--agent-border)',
    boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)',
  },
  htmlIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: 'var(--agent-action-gradient)',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 900,
    flexShrink: 0,
    boxShadow: '0 8px 16px rgba(255, 138, 0, 0.18)',
  },
  previewMask: {
    position: 'fixed',
    inset: 0,
    zIndex: 3000,
    background: 'rgba(15, 23, 42, 0.62)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  previewDialog: {
    maxWidth: '78vw',
    maxHeight: '84vh',
    background: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 24px 80px rgba(15, 23, 42, 0.28)',
  },
  previewImage: {
    display: 'block',
    maxWidth: '78vw',
    maxHeight: '74vh',
    objectFit: 'contain',
  },
  previewFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '10px 12px',
    fontSize: 13,
    color: '#334155',
    borderTop: '1px solid #E2E8F0',
  },
  previewClose: {
    border: 'none',
    borderRadius: 6,
    padding: '6px 12px',
    background: 'var(--agent-primary)',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  undoButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    height: 24,
    padding: '0 2px',
    border: 'none',
    background: 'transparent',
    color: '#64748B',
    cursor: 'pointer',
    outline: 'none',
    lineHeight: 1,
    fontSize: 12,
    fontWeight: 650,
  },
};

function UserMessage({
  content,
  onUndoNextResult,
}: {
  content: string | UserMaterialMessage;
  onUndoNextResult?: () => void;
}) {
  const [previewImage, setPreviewImage] = useState<UploadedAttachment | null>(null);
  const [longTextExpanded, setLongTextExpanded] = useState(false);
  const [playwayPromptOpen, setPlaywayPromptOpen] = useState(false);
  const message = typeof content === 'string' ? { text: content } : content;
  const images = message.attachments?.filter(file => file.type === 'image') || [];
  const documents = message.attachments?.filter(file => file.type === 'document') || [];
  const htmlAttachments = message.attachments?.filter(file => file.type === 'html') || [];
  const appliedPlaywayMessage = message.text ? parseAppliedPlaywayMessage(message.text) : null;
  const hasAttachments = images.length > 0 || documents.length > 0 || htmlAttachments.length > 0;
  const isLongText = Boolean(
    message.text
    && !appliedPlaywayMessage
    && (message.text.length > 260 || message.text.split('\n').length > 8)
  );
  const shouldUseFullWidthBubble = Boolean(isLongText || hasAttachments || appliedPlaywayMessage);

  return (
    <>
      <div style={styles.messageUser}>
        <div style={userMessageStyles.stack}>
          {images.length > 0 && (
            <div style={userMessageStyles.imageGrid}>
              {images.map(image => (
                <button
                  key={image.id}
                  onClick={() => setPreviewImage(image)}
                  style={userMessageStyles.imageCard}
                  title="点击预览图片"
                >
                  <img src={image.url} alt={image.name} style={userMessageStyles.image} />
                </button>
              ))}
            </div>
          )}

          {documents.length > 0 && (
            <div style={userMessageStyles.documentList}>
              {documents.map(doc => (
                <div key={doc.id} style={userMessageStyles.documentCard}>
                  <span style={userMessageStyles.documentIcon}>文</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={userMessageStyles.documentName}>{doc.name}</div>
                    <div style={userMessageStyles.documentMeta}>PDF / Word 附件</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {htmlAttachments.length > 0 && (
            <div style={userMessageStyles.documentList}>
              {htmlAttachments.map(file => (
                <div key={file.id} style={userMessageStyles.htmlCard}>
                  <HtmlTypeBadge size="small" />
                  <div style={{ minWidth: 0 }}>
                    <div style={userMessageStyles.documentName}>{file.name}</div>
                    <div style={userMessageStyles.documentMeta}>同款参考附件 · 不可打开 · 不可下载</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {appliedPlaywayMessage && (
            <div style={userMessageStyles.textWrap}>
              <div
                style={{
                  ...styles.userBubble,
                  ...(shouldUseFullWidthBubble ? userMessageStyles.fullWidthBubble : {}),
                  whiteSpace: 'pre-wrap',
                }}
              >
                {appliedPlaywayMessage.demand || '基于这个模板生成互动课件'}
              </div>
              <div style={userMessageStyles.appliedPromptCard}>
                <div style={userMessageStyles.appliedPromptSection}>
                  <div style={userMessageStyles.appliedPromptHeader}>
                    <span style={userMessageStyles.appliedPromptLabel}>已套用模板</span>
                    <span style={userMessageStyles.appliedPromptBadge}>
                      {[appliedPlaywayMessage.playwayType, appliedPlaywayMessage.ageRange].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                  <div style={userMessageStyles.appliedPromptTitle}>{appliedPlaywayMessage.playwayName}</div>
                  {appliedPlaywayMessage.flow && (
                    <div style={userMessageStyles.appliedPromptFlow}>{appliedPlaywayMessage.flow}</div>
                  )}
                  {appliedPlaywayMessage.adaptation && (
                    <div style={userMessageStyles.appliedPromptAdvice}>{appliedPlaywayMessage.adaptation}</div>
                  )}
                  {appliedPlaywayMessage.prompt && (
                    <div style={userMessageStyles.appliedPromptPreviewBox}>
                      <button
                        type="button"
                        style={userMessageStyles.appliedPromptPreviewToggle}
                        onClick={() => setPlaywayPromptOpen(prev => !prev)}
                      >
                        <span>模板说明</span>
                        {playwayPromptOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      {playwayPromptOpen && (
                        <pre style={userMessageStyles.appliedPromptRaw}>{appliedPlaywayMessage.prompt}</pre>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {message.text && !appliedPlaywayMessage && (
            <div style={userMessageStyles.textWrap}>
              <div
                style={{
                  ...styles.userBubble,
                  ...userMessageStyles.collapsibleBubble,
                  ...(shouldUseFullWidthBubble ? userMessageStyles.fullWidthBubble : {}),
                  ...(isLongText && !longTextExpanded ? userMessageStyles.collapsedBubble : {}),
                  whiteSpace: 'pre-wrap',
                }}
              >
                {message.text}
                {isLongText && !longTextExpanded && <div style={userMessageStyles.fadeMask} />}
              </div>
              {isLongText && (
                <button
                  type="button"
                  style={userMessageStyles.expandButton}
                  onClick={() => setLongTextExpanded(prev => !prev)}
                >
                  {longTextExpanded ? '收起内容' : '展开全部'}
                </button>
              )}
            </div>
          )}

          {onUndoNextResult && (
            <button
              type="button"
              onClick={onUndoNextResult}
              style={userMessageStyles.undoButton}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--agent-primary-text)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#64748B'; }}
            >
              <RotateCcw size={13} />
              <span>撤回</span>
            </button>
          )}
        </div>
      </div>

      {previewImage?.url && (
        <div style={userMessageStyles.previewMask} onClick={() => setPreviewImage(null)}>
          <div style={userMessageStyles.previewDialog} onClick={e => e.stopPropagation()}>
            <img src={previewImage.url} alt={previewImage.name} style={userMessageStyles.previewImage} />
            <div style={userMessageStyles.previewFooter}>
              <span>{previewImage.name}</span>
              <button onClick={() => setPreviewImage(null)} style={userMessageStyles.previewClose}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const AIAvatar: React.FC = () => null;

const SimpleStreamText: React.FC<{ text: string; speed?: number }> = ({ text, speed = 25 }) => {
  const [displayed, setDisplayed] = useState('');
  const idxRef = useRef(0);

  useEffect(() => {
    idxRef.current = 0;
    setDisplayed('');
    const timer = setInterval(() => {
      idxRef.current += 2;
      if (idxRef.current >= text.length) {
        setDisplayed(text);
        clearInterval(timer);
      } else {
        setDisplayed(text.slice(0, idxRef.current));
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && (
        <span style={{ display: 'inline-block', width: 2, height: 16, background: 'var(--agent-primary)', marginLeft: 2, animation: 'blink 0.8s infinite', verticalAlign: 'text-bottom' }} />
      )}
    </span>
  );
};

const AIWaitingMessage: React.FC = () => (
  <div style={styles.messageAssistant}>
    <AIAvatar />
    <div style={styles.waitingStack}>
      <div style={styles.assistantBubble}>
        {GENERIC_AI_WAITING_TEXT}
      </div>
      <div style={styles.waitingDots} aria-label="AI 正在处理">
        <span style={{ ...styles.waitingDot, background: '#8CB9FF', animationDelay: '0s' }} />
        <span style={{ ...styles.waitingDot, background: '#65D9E5', animationDelay: '0.16s' }} />
        <span style={{ ...styles.waitingDot, background: '#1F86FF', animationDelay: '0.32s' }} />
      </div>
    </div>
  </div>
);

function MaterialIntentCard({
  confirmation,
  onConfirm,
}: {
  confirmation: MaterialIntentConfirmation;
  onConfirm?: (resolutions: MaterialIntentResolution[]) => void;
}) {
  const [selectedIntents, setSelectedIntents] = useState<Record<string, MaterialIntent>>({});
  const [customTexts, setCustomTexts] = useState<Record<string, string>>({});
  const [confirmedResolutionsOverride, setConfirmedResolutionsOverride] = useState<MaterialIntentResolution[] | undefined>();
  const confirmedResolutions = confirmation.confirmedResolutions || confirmedResolutionsOverride;
  const confirmedRef = useRef(Boolean(confirmedResolutions));
  const isConfirmed = Boolean(confirmedResolutions);
  const allSelected = isConfirmed || confirmation.pendingAttachments.every(file => selectedIntents[file.id]);

  useEffect(() => {
    confirmedRef.current = Boolean(confirmedResolutions);
  }, [confirmedResolutions]);

  const getOptions = (file: UploadedAttachment) => (
    file.type === 'image' ? imageIntentOptions : documentIntentOptions
  );

  const handleConfirm = () => {
    if (!allSelected || confirmedRef.current) return;
    const resolutions = confirmation.pendingAttachments.map(file => {
      const intent = selectedIntents[file.id];
      const option = getOptions(file).find(item => item.intent === intent);
      const customText = customTexts[file.id]?.trim();
      return {
        attachmentId: file.id,
        intent,
        title: intent === 'custom' ? '其他用途' : option?.title || '按所选用途处理',
        description: intent === 'custom' ? customText || '按用户输入的其他用途处理' : option?.description || '',
        confidence: intent === 'custom' ? 1 : 0.96,
        customText,
        reason: '用户在用途确认卡中手动确认',
      };
    });
    confirmedRef.current = true;
    setConfirmedResolutionsOverride(resolutions);
    onConfirm?.(resolutions);
  };

  return (
    <div style={intentCardStyles.card}>
      <div style={intentCardStyles.header}>
        <div>
          <div style={intentCardStyles.title}>请确认上传材料的用途</div>
          <div style={intentCardStyles.summary}>{confirmation.summary}</div>
        </div>
        <div
          style={{
            ...intentCardStyles.badge,
            background: isConfirmed ? 'var(--agent-soft-strong)' : '#FEF3C7',
            color: isConfirmed ? 'var(--agent-primary-text)' : '#B45309',
          }}
        >
          {isConfirmed ? '已确认' : '需逐个确认'}
        </div>
      </div>

      <div style={intentCardStyles.pendingList}>
        {confirmation.pendingAttachments.map(file => {
          const confirmedResolution = confirmedResolutions?.find(item => item.attachmentId === file.id);
          const selected = confirmedResolution?.intent || selectedIntents[file.id];
          return (
            <div key={file.id} style={intentCardStyles.pendingItem}>
              <div style={intentCardStyles.fileItem}>
                {file.type === 'image' && file.url ? (
                  <img src={file.url} alt={file.name} style={intentCardStyles.fileThumb} />
                ) : (
                  <div style={intentCardStyles.fileIcon}>{file.type === 'image' ? '图' : '文'}</div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={intentCardStyles.fileName}>{file.name}</div>
                  <div style={intentCardStyles.fileType}>
                    {getAttachmentLabel(file)} · {confirmedResolution ? `已确认：${confirmedResolution.title}` : '请选择用途'}
                  </div>
                </div>
              </div>

              <div style={intentCardStyles.options}>
                {getOptions(file).map(option => (
                  <button
                    key={option.intent}
                    disabled={isConfirmed}
                    onClick={() => setSelectedIntents(prev => ({ ...prev, [file.id]: option.intent }))}
                    style={{
                      ...intentCardStyles.optionBtn,
                      borderColor: selected === option.intent ? 'var(--agent-primary)' : 'var(--agent-border)',
                      background: selected === option.intent ? 'var(--agent-soft-strong)' : 'var(--agent-soft)',
                      cursor: isConfirmed ? 'default' : 'pointer',
                      opacity: isConfirmed && selected !== option.intent ? 0.62 : 1,
                    }}
                  >
                    <span style={intentCardStyles.optionTitle}>{option.title}</span>
                    <span style={intentCardStyles.optionDesc}>{option.description}</span>
                  </button>
                ))}
              </div>

              <div style={intentCardStyles.customRow}>
                <label style={intentCardStyles.customLabel}>
                  <input
                    type="radio"
                    checked={selected === 'custom'}
                    disabled={isConfirmed}
                    onChange={() => setSelectedIntents(prev => ({ ...prev, [file.id]: 'custom' }))}
                  />
                  其他用途
                </label>
                <input
                  value={confirmedResolution?.customText || customTexts[file.id] || ''}
                  disabled={isConfirmed}
                  onChange={e => {
                    setCustomTexts(prev => ({ ...prev, [file.id]: e.target.value }));
                    setSelectedIntents(prev => ({ ...prev, [file.id]: 'custom' }));
                  }}
                  placeholder="例如：只用来补充例题语境、只参考版式，不参与生成..."
                  style={{
                    ...intentCardStyles.customInput,
                    background: isConfirmed ? '#F8FAFC' : '#FFFFFF',
                    cursor: isConfirmed ? 'default' : 'text',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div style={intentCardStyles.footer}>
        {confirmedResolutions ? (
          <div style={intentCardStyles.confirmedState}>
            已确认 {confirmedResolutions.length} 个材料用途
          </div>
        ) : (
          <>
            <span style={intentCardStyles.footerHint}>确认后，AI 会把每个材料的用途写入需求分析。</span>
            <button
              onClick={handleConfirm}
              disabled={!allSelected}
              style={{
                ...intentCardStyles.confirmBtn,
                background: allSelected ? 'var(--agent-primary)' : '#CBD5E1',
                cursor: allSelected ? 'pointer' : 'not-allowed',
              }}
            >
              确认用途并继续
            </button>
          </>
        )}
      </div>
    </div>
  );
}

type VoiceCapabilityChoice = 'record-with-assessment' | 'record-only' | 'none';

const getVoiceSelectionFromChoice = (choice: VoiceCapabilityChoice): VoiceCapabilitySelection => {
  if (choice === 'record-with-assessment') {
    return {
      smallScreenRecording: true,
      englishOralAssessment: true,
    };
  }

  if (choice === 'record-only') {
    return {
      smallScreenRecording: true,
      englishOralAssessment: false,
    };
  }

  return {
    smallScreenRecording: false,
    englishOralAssessment: false,
  };
};

const getVoiceSelectionLabel = (selection: VoiceCapabilitySelection) => {
  if (selection.englishOralAssessment) return '启用学生小屏真实收音和英语口语评测';
  if (selection.smallScreenRecording) return '启用学生小屏真实收音，不启用口语评测';
  return '不需要语音服务，继续';
};

function VoiceCapabilityCard({
  confirmation,
  onConfirm,
}: {
  confirmation: VoiceCapabilityConfirmation;
  onConfirm?: (selection: VoiceCapabilitySelection) => void;
}) {
  const AUTO_CONFIRM_SECONDS = 60;
  const defaultChoice: VoiceCapabilityChoice = confirmation.intent === 'english-oral'
    ? 'record-with-assessment'
    : 'record-only';
  const [selectedChoice, setSelectedChoice] = useState<VoiceCapabilityChoice>(defaultChoice);
  const [remainingSeconds, setRemainingSeconds] = useState(AUTO_CONFIRM_SECONDS);
  const [confirmedSelectionOverride, setConfirmedSelectionOverride] = useState<VoiceCapabilitySelection | undefined>();
  const confirmedSelection = confirmation.confirmedSelection || confirmedSelectionOverride;
  const selectedChoiceRef = useRef(selectedChoice);
  const confirmedRef = useRef(Boolean(confirmedSelection));
  const isConfirmed = Boolean(confirmedSelection);

  useEffect(() => {
    selectedChoiceRef.current = selectedChoice;
  }, [selectedChoice]);

  useEffect(() => {
    confirmedRef.current = Boolean(confirmedSelection);
  }, [confirmedSelection]);

  const confirmSelection = useCallback((choice: VoiceCapabilityChoice) => {
    if (confirmedRef.current) return;
    const nextSelection = getVoiceSelectionFromChoice(choice);
    confirmedRef.current = true;
    setConfirmedSelectionOverride(nextSelection);
    onConfirm?.(nextSelection);
  }, [onConfirm]);

  useEffect(() => {
    if (isConfirmed) return;

    const timer = window.setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          window.clearInterval(timer);
          confirmSelection(selectedChoiceRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [confirmSelection, isConfirmed]);

  const optionStyle = (selected: boolean): React.CSSProperties => ({
    ...voiceCardStyles.optionBtn,
    borderColor: selected ? 'var(--agent-primary)' : '#E2E8F0',
    background: selected ? 'var(--agent-soft-strong)' : '#F8FAFC',
    boxShadow: selected && !isConfirmed ? '0 8px 22px rgba(14, 165, 233, 0.12)' : 'none',
    cursor: isConfirmed ? 'default' : 'pointer',
    opacity: isConfirmed && !selected ? 0.62 : 1,
  });

  const iconStyle = (selected: boolean): React.CSSProperties => ({
    ...voiceCardStyles.optionIcon,
    background: selected ? '#FFFFFF' : '#E0F2FE',
    color: selected ? 'var(--agent-primary)' : '#0284C7',
  });

  return (
    <div style={voiceCardStyles.card}>
      <div style={voiceCardStyles.header}>
        <div>
          <div style={voiceCardStyles.titleRow}>
            <span style={voiceCardStyles.titleIcon}><Mic size={17} /></span>
            <div style={voiceCardStyles.title}>确认是否启用语音服务</div>
          </div>
          <div style={voiceCardStyles.summary}>
            检测到本课件可能需要学生开口作答，请确认是否需要真实收音或英语口语评测。
          </div>
        </div>
        <div style={voiceCardStyles.badge}>
          {confirmation.intent === 'english-oral' ? '疑似英语口语' : '疑似录音作答'}
        </div>
      </div>

      <div style={voiceCardStyles.options}>
        <button
          type="button"
          disabled={isConfirmed}
          onClick={() => setSelectedChoice('record-with-assessment')}
          style={optionStyle(selectedChoice === 'record-with-assessment')}
        >
          <span style={iconStyle(selectedChoice === 'record-with-assessment')}><Headphones size={17} /></span>
          <span>
            <span style={voiceCardStyles.optionTitle}>学生小屏真实收音+ 英语口语评测</span>
            <span style={voiceCardStyles.optionDesc}>学生通过学生小屏点击录音并提交真实作答，同时展示英语口语评测结果。</span>
          </span>
        </button>

        <button
          type="button"
          disabled={isConfirmed}
          onClick={() => setSelectedChoice('record-only')}
          style={optionStyle(selectedChoice === 'record-only')}
        >
          <span style={iconStyle(selectedChoice === 'record-only')}><Mic size={17} /></span>
          <span>
            <span style={voiceCardStyles.optionTitle}>仅学生小屏真实收音</span>
            <span style={voiceCardStyles.optionDesc}>学生通过学生小屏点击录音并提交真实作答，不展示英语口语评测结果。</span>
          </span>
        </button>
      </div>

      <div style={voiceCardStyles.note}>
        <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>古诗词朗读评测、中文朗读评测、背诵评测、开放口述评价暂未开放，可先使用真实收音完成录音作答。</span>
      </div>

      <div style={voiceCardStyles.footer}>
        {confirmedSelection ? (
          <div style={voiceCardStyles.confirmedState}>
            已确认：{getVoiceSelectionLabel(confirmedSelection)}
          </div>
        ) : (
          <>
            <span style={voiceCardStyles.countdown}>{remainingSeconds}s 后将自动按当前选择继续</span>
            <div style={voiceCardStyles.actions}>
              <button
                type="button"
                onClick={() => confirmSelection('none')}
                style={voiceCardStyles.ghostBtn}
              >
                不需要语音服务，继续
              </button>
              <button
                type="button"
                onClick={() => confirmSelection(selectedChoice)}
                style={voiceCardStyles.confirmBtn}
              >
                确认并继续
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AssistantMessage({
  message,
  phase,
  frameworkDone,
  onFrameworkStreamComplete,
  streamDuration,
  onRetry,
  onContinue,
  onMaterialIntentConfirm,
  onVoiceCapabilityConfirm,
  onOpenPreview,
  onLearningDataRecoveryRequest,
  onVisualStyleRegenerate,
}: { 
  message: ConversationMessage; 
  phase?: string;
  frameworkDone?: boolean;
  onFrameworkStreamComplete?: () => void;
  streamDuration?: number;
  onRetry?: (stageIndex: number) => void;
  onContinue?: (stageIndex: number) => void;
  onMaterialIntentConfirm?: (messageId: string, resolutions: MaterialIntentResolution[]) => void;
  onVoiceCapabilityConfirm?: (messageId: string, selection: VoiceCapabilitySelection) => void;
  onOpenPreview?: (coursewareId: number, version?: string | null) => void;
  onLearningDataRecoveryRequest?: (request: LearningDataRecoveryRequest) => void;
  onVisualStyleRegenerate?: (request: VisualStyleRegenerationRequest) => void;
}) {
  const conversations = useConversationStore(s => s.conversations);
  const activeConversationId = useConversationStore(s => s.activeConversationId);
  const activeConversation = conversations.find(c => c.id === activeConversationId);

  if (message.type === 'requirement-framework') {
    return (
      <div style={styles.messageAssistant}>
        <AIAvatar />
        <div style={styles.assistantContent}>
          <RequirementCard 
            framework={message.content as RequirementFramework}
            isStreaming={phase === 'framework' && !frameworkDone}
            readOnly={phase !== 'framework'}
            streamDuration={streamDuration}
            onStreamComplete={onFrameworkStreamComplete}
            onFrameworkChange={(nextFramework) => {
              if (phase !== 'framework') return;
              if (!activeConversationId) return;
              useConversationStore.setState(state => ({
                conversations: state.conversations.map(conversation => (
                  conversation.id === activeConversationId
                    ? {
                        ...conversation,
                        messages: conversation.messages.map(item => (
                          item.id === message.id
                            ? { ...item, content: nextFramework }
                            : item
                        )),
                      }
                    : conversation
                )),
              }));
            }}
          />
        </div>
      </div>
    );
  }
  
  if (message.type === 'generation-progress') {
    return (
      <div style={styles.messageAssistant}>
        <AIAvatar />
        <div style={styles.assistantContent}>
          <ProgressPanel progress={message.content as GenerationProgress} onRetry={onRetry} onContinue={onContinue} />
        </div>
      </div>
    );
  }
  
  if (message.type === 'courseware-result') {
    const result = message.content as CoursewareResult;
    const demoCourseware = mockCoursewares[0];
    const matchedMockCourseware = mockCoursewares.find(c => c.title === result.title);
    const courseware = (
      result.htmlContent && !matchedMockCourseware
        ? {
            id: result.coursewareId || Date.now(),
            title: result.title,
            subject: '英语',
            grade: '一年级',
            type: '水果单词',
            author: '张老师',
            publishTime: new Date().toISOString().split('T')[0],
            views: 0,
            favorites: 0,
            likes: 0,
            htmlContent: result.htmlContent,
            isOwn: true,
            learningDataRecovery: result.learningDataRecovery,
          }
        : matchedMockCourseware
          ? {
              ...matchedMockCourseware,
              learningDataRecovery: result.learningDataRecovery || matchedMockCourseware.learningDataRecovery,
            }
          : undefined
    ) || {
      id: Date.now(),
      title: demoCourseware.title,
      subject: '英语',
      grade: '一年级',
      type: '水果单词',
      author: '张老师',
      publishTime: new Date().toISOString().split('T')[0],
      views: 0,
      favorites: 0,
      likes: 0,
      htmlContent: demoCourseware.htmlContent,
      isOwn: true,
      learningDataRecovery: result.learningDataRecovery || demoCourseware.learningDataRecovery,
    };

    const allCoursewareMessages = activeConversation?.messages.filter(m => m.type === 'courseware-result') || [];
    const coursewareIndex = allCoursewareMessages.findIndex(m => m.id === message.id);
    const versionNum = coursewareIndex + 1;
    const stableCoursewareId = result.coursewareId || activeConversation?.coursewareId || courseware.id;
    const isLatestVersion = coursewareIndex === allCoursewareMessages.length - 1;
    const linkedDemoVersion = activeConversation?.id === 'conv_1'
      ? demoSessionVersions[coursewareIndex] as {
          isCurrentPublished?: boolean;
          isHistoricalPublished?: boolean;
          isRemoved?: boolean;
        } | undefined
      : undefined;
    const isPublishedResult = Boolean(
      courseware.isPublished
      || linkedDemoVersion?.isCurrentPublished
      || linkedDemoVersion?.isHistoricalPublished
      || linkedDemoVersion?.isRemoved
    );
    const publishBadgeLabel = isPublishedResult ? '已发布' : undefined;
    
    return (
      <div style={styles.messageAssistant}>
        <AIAvatar />
        <div style={styles.assistantContent}>
          <CoursewareCard
            courseware={{ ...courseware, id: stableCoursewareId }}
            version={`第${versionNum}版`}
            isLatest={isLatestVersion}
            onOpenPreview={onOpenPreview}
            onLearningDataRecoveryRequest={onLearningDataRecoveryRequest}
            onVisualStyleRegenerate={onVisualStyleRegenerate}
            publishBadgeLabel={publishBadgeLabel}
          />
        </div>
      </div>
    );
  }

  if (message.type === 'material-intent-confirmation') {
    return (
      <div style={styles.messageAssistant}>
        <AIAvatar />
        <div style={styles.assistantContent}>
          <MaterialIntentCard
            confirmation={message.content as MaterialIntentConfirmation}
            onConfirm={(resolutions) => onMaterialIntentConfirm?.(message.id, resolutions)}
          />
        </div>
      </div>
    );
  }

  if (message.type === 'voice-capability-confirmation') {
    return (
      <div style={styles.messageAssistant}>
        <AIAvatar />
        <div style={styles.assistantContent}>
          <VoiceCapabilityCard
            confirmation={message.content as VoiceCapabilityConfirmation}
            onConfirm={(selection) => onVoiceCapabilityConfirm?.(message.id, selection)}
          />
        </div>
      </div>
    );
  }
  
  return (
    <div style={styles.messageAssistant}>
      <AIAvatar />
      <div style={styles.assistantBubble}>
        <SimpleStreamText text={message.content as string} />
      </div>
    </div>
  );
}

export default function GeneratorPage() {
  const {
    conversations,
    activeConversationId,
    createNewConversation,
    addUserMessage,
    addAssistantMessage,
    isGenerating,
    startGeneration,
    completeGeneration,
  } = useConversationStore();
  
  const {
    previewPanelOpen,
    previewCoursewareId,
    previewInitialVersion,
    openPreview,
    closePreview,
    setSidebarCollapsed,
    pendingAssistantPrompt,
    clearPendingAssistantPrompt,
  } = useUIStore();
  const { addCourseware } = useCoursewareStore();
  
  const [phase, setPhase] = useState<GenerationPhase>('input');
  const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH_WITH_PREVIEW);
  const [isDragging, setIsDragging] = useState(false);
  const [frameworkDone, setFrameworkDone] = useState(false);
  const [draftPrompt, setDraftPrompt] = useState('');
  const [draftVersion, setDraftVersion] = useState(0);
  const [selectedInspiration, setSelectedInspiration] = useState<GameplayInspiration | null>(null);
  const [promptFly, setPromptFly] = useState<PromptFlyState | null>(null);
  const [showBackToInput, setShowBackToInput] = useState(false);
  const [welcomeHeroMinHeight, setWelcomeHeroMinHeight] = useState(386);
  const frameworkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingFrameworkRef = useRef<string | null>(null);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const forceBottomScrollRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const failAtStageRef = useRef<number | undefined>(undefined);
  const centeredInputAnchorRef = useRef<HTMLDivElement>(null);
  const bottomInputAnchorRef = useRef<HTMLDivElement>(null);
  const welcomeHeroPanelRef = useRef<HTMLDivElement>(null);
  const welcomeScrollRef = useRef<HTMLDivElement>(null);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = { startX: e.clientX, startWidth: chatWidth };

    const handleMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const container = splitContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setChatWidth(Math.min(64, Math.max(44, pct)));
    };

    const handleUp = () => {
      setIsDragging(false);
      dragRef.current = null;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [chatWidth]);
  
  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const hasMessages = activeConversation && activeConversation.messages.length > 0;
  const activeCloneDraft = !hasMessages ? activeConversation?.cloneDraft : undefined;
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const chatContentMaxWidth = previewPanelOpen ? CHAT_CONTENT_MAX_WITH_PREVIEW : CHAT_CONTENT_MAX_FULL;
  const chatContentVars = { '--chat-content-max': `${chatContentMaxWidth}px` } as React.CSSProperties;
  const chatAreaPadding = previewPanelOpen ? '28px 48px 24px 64px' : '28px 56px 24px';
  const inputAreaPadding = previewPanelOpen ? '16px 48px 24px 64px' : '16px 56px 24px';

  const getCoursewarePublishState = (message: ConversationMessage, coursewareIndex: number) => {
    const result = message.content as CoursewareResult;
    const matchedMockCourseware = mockCoursewares.find(c => c.title === result.title);
    const linkedDemoVersion = activeConversation?.id === 'conv_1'
      ? demoSessionVersions[coursewareIndex] as {
          isCurrentPublished?: boolean;
          isHistoricalPublished?: boolean;
          isRemoved?: boolean;
        } | undefined
      : undefined;

    return Boolean(
      matchedMockCourseware?.isPublished
      || linkedDemoVersion?.isCurrentPublished
      || linkedDemoVersion?.isHistoricalPublished
      || linkedDemoVersion?.isRemoved
    );
  };

  const handleUndoCoursewareResult = useCallback((
    userMessageId: string,
    resultMessageId: string,
    resultIndex: number,
    isPublished: boolean,
  ) => {
    if (isPublished) {
      toast('已发布的不能撤销，如需下架请在 iTeach 资源库操作～');
      return;
    }
    if (!activeConversationId) return;
    const fallbackPreviewCoursewareId = activeConversation?.coursewareId || previewCoursewareId;
    const previousVersion = resultIndex > 0 ? `v${resultIndex}` : null;

    useConversationStore.setState(state => ({
      conversations: state.conversations.map(conversation => (
        conversation.id === activeConversationId
          ? {
              ...conversation,
              messages: conversation.messages.filter(item => (
                item.id !== userMessageId && item.id !== resultMessageId
              )),
            }
          : conversation
      )),
    }));

    if (fallbackPreviewCoursewareId && previousVersion) {
      openPreview(fallbackPreviewCoursewareId, previousVersion);
    }
    toast('已撤销本次生成的 HTML');
  }, [activeConversation?.coursewareId, activeConversationId, openPreview, previewCoursewareId]);

  const injectPrompt = useCallback((nextText: string) => {
    setDraftPrompt(nextText);
    setDraftVersion(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (!pendingAssistantPrompt) return;
    injectPrompt(pendingAssistantPrompt.prompt);
    clearPendingAssistantPrompt(pendingAssistantPrompt.id);
  }, [clearPendingAssistantPrompt, injectPrompt, pendingAssistantPrompt]);

  const handleDraftPromptChange = useCallback((nextText: string) => {
    setDraftPrompt(nextText);
    if (!nextText.includes('<已套用玩法>')) {
      setSelectedInspiration(null);
    }
  }, []);

  const getActiveInputAnchor = useCallback(() => {
    if (!hasMessages && phase === 'input') return centeredInputAnchorRef.current;
    return bottomInputAnchorRef.current || centeredInputAnchorRef.current;
  }, [hasMessages, phase]);

  const handleWelcomeScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    const inputAnchor = centeredInputAnchorRef.current;
    if (!inputAnchor) {
      setShowBackToInput(false);
      return;
    }
    const inputRect = inputAnchor.getBoundingClientRect();
    const containerRect = event.currentTarget.getBoundingClientRect();
    setShowBackToInput(inputRect.bottom < containerRect.top + 12);
  }, []);

  const scrollToHomepageInput = useCallback(() => {
    centeredInputAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => setShowBackToInput(false), 260);
  }, []);

  useEffect(() => {
    if (hasMessages || phase !== 'input') {
      setWelcomeHeroMinHeight(386);
      return;
    }

    const inputAnchor = centeredInputAnchorRef.current;
    const panel = welcomeHeroPanelRef.current;
    if (!inputAnchor || !panel) return;

    const measureHeroHeight = () => {
      const panelRect = panel.getBoundingClientRect();
      const inputRect = inputAnchor.getBoundingClientRect();
      const nextHeight = Math.max(386, Math.ceil(inputRect.bottom - panelRect.top + 24));
      setWelcomeHeroMinHeight(prev => (Math.abs(prev - nextHeight) > 1 ? nextHeight : prev));
    };

    measureHeroHeight();
    const resizeObserver = new ResizeObserver(measureHeroHeight);
    resizeObserver.observe(inputAnchor);
    window.addEventListener('resize', measureHeroHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', measureHeroHeight);
    };
  }, [hasMessages, phase]);

  const injectPromptWithApplyMotion = useCallback((
    item: GameplayInspiration,
    nextText: string,
    sourceElement?: HTMLElement | null,
  ) => {
    const targetElement = getActiveInputAnchor();
    if (!sourceElement || !targetElement) {
      injectPrompt(nextText);
      return;
    }

    const sourceRect = sourceElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    const from = {
      x: sourceRect.left + sourceRect.width / 2,
      y: sourceRect.top + sourceRect.height / 2,
    };
    const to = {
      x: targetRect.left + targetRect.width / 2,
      y: targetRect.top + Math.min(targetRect.height * 0.55, 88),
    };

    setPromptFly({ id: Date.now(), title: item.title, from, to });
    window.setTimeout(() => {
      injectPrompt(nextText);
      window.setTimeout(() => setPromptFly(null), 120);
    }, 560);
  }, [getActiveInputAnchor, injectPrompt]);

  const handleApplyInspiration = useCallback((item: GameplayInspiration, sourceElement?: HTMLElement | null) => {
    setSelectedInspiration(item);
    const next = buildStructuredInspirationPrompt(item, draftPrompt);
    injectPromptWithApplyMotion(item, next, sourceElement);
  }, [draftPrompt, injectPromptWithApplyMotion]);

  const startRequirementFlow = useCallback((convId: string, promptForFramework: string) => {
    setPhase('analyzing');
    setFrameworkDone(false);

    setTimeout(() => {
      setPhase('loading-framework');
      
      const framework = generateRequirementFromPrompt(promptForFramework);
      pendingFrameworkRef.current = convId;

      frameworkTimerRef.current = setTimeout(() => {
        addAssistantMessage(convId, framework, 'requirement-framework');
        setPhase('framework');
        pendingFrameworkRef.current = null;
      }, demoMs(10000));
    }, demoMs(1500));
  }, [addAssistantMessage]);

  const maybeAskVoiceCapability = useCallback((
    convId: string,
    originalPrompt: string,
    promptForFramework: string,
    source: VoiceCapabilityConfirmation['source'] = 'user-prompt',
  ) => {
    const intent = detectVoiceCapabilityIntent(`${originalPrompt}\n${promptForFramework}`);
    if (!intent) {
      startRequirementFlow(convId, promptForFramework);
      return;
    }

    addAssistantMessage(convId, {
      prompt: originalPrompt,
      promptForFramework,
      intent,
      source,
    }, 'voice-capability-confirmation');
    setPhase('input');
  }, [addAssistantMessage, startRequirementFlow]);

  useEffect(() => {
    if (chatAreaRef.current) {
      requestAnimationFrame(() => {
        chatAreaRef.current!.scrollTop = chatAreaRef.current!.scrollHeight;
      });
    }
  }, [activeConversation?.messages.length, phase]);

  useEffect(() => {
    if (!activeConversationId) return;
    const shouldScrollToBottom = window.sessionStorage.getItem('openPublishedConversation:scrollToBottom') === '1';
    if (!shouldScrollToBottom) return;
    window.sessionStorage.removeItem('openPublishedConversation:scrollToBottom');
    forceBottomScrollRef.current = true;

    const scrollToBottom = () => {
      if (chatAreaRef.current) {
        chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
      }
    };
    const rafId = requestAnimationFrame(scrollToBottom);
    const timers = [120, 360, 800, 1400].map(delay => window.setTimeout(scrollToBottom, delay));

    return () => {
      cancelAnimationFrame(rafId);
      timers.forEach(window.clearTimeout);
    };
  }, [activeConversationId]);

  useEffect(() => {
    if (!forceBottomScrollRef.current) return;
    const timer = window.setTimeout(() => {
      if (chatAreaRef.current) {
        chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
      }
      forceBottomScrollRef.current = false;
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [activeConversation?.messages.length, phase, previewPanelOpen]);

  useEffect(() => {
    if (!activeConversationId) {
      setPhase('input');
      setFrameworkDone(false);
      setSelectedInspiration(null);
      setPromptFly(null);
      return;
    }

    if (!activeConversation) return;
    if (activeConversation.cloneDraft && activeConversation.messages.length === 0) {
      setDraftPrompt(activeConversation.cloneDraft.prompt);
      setDraftVersion(prev => prev + 1);
      closePreview();
    }
    const hasFramework = activeConversation.messages.some(m => m.type === 'requirement-framework');
    const hasProgress = activeConversation.messages.some(m => m.type === 'generation-progress');
    const hasResult = activeConversation.messages.some(m => m.type === 'courseware-result');
    const isClone = activeConversation.title.startsWith('同款-');
    if (hasResult) {
      setPhase('completed');
      setFrameworkDone(true);
    } else if (hasProgress) {
      setPhase('generating');
      setFrameworkDone(true);
    } else if (hasFramework && phase === 'input') {
      setPhase('framework');
      setFrameworkDone(isClone ? false : true);
    }
  }, [activeConversationId, closePreview]);
  
  const handleSend = useCallback((text: string, attachments: UploadedAttachment[] = []) => {
    let convId = activeConversationId;
    
    if (!convId) {
      convId = createNewConversation(text || '上传材料生成互动课件');
    }

    // 触发失败模拟：输入包含 "模拟失败" 或 "fail:" 关键词
    const failMatch = text.match(/(?:模拟失败|fail:?)(\d)?/);
    if (failMatch) {
      const stageIdx = failMatch[1] ? parseInt(failMatch[1]) : 2;
      failAtStageRef.current = Math.min(5, Math.max(0, stageIdx));
    } else {
      failAtStageRef.current = undefined;
    }
    
    addUserMessage(convId, {
      text: text || '请帮我看看这些上传材料',
      attachments,
    });
    setDraftPrompt('');
    setSelectedInspiration(null);

    const cloneAttachments = attachments.filter(file => file.type === 'html' && file.locked);
    const materialAttachments = attachments.filter(file => file.type !== 'html');

    if (cloneAttachments.length > 0) {
      useConversationStore.setState(state => ({
        conversations: state.conversations.map(c =>
          c.id === convId ? { ...c, cloneDraft: undefined } : c
        ),
      }));
      maybeAskVoiceCapability(
        convId,
        text,
        `${text}\n\n同款参考附件：${cloneAttachments.map(file => `HTML「${file.name}」`).join('、')}。该附件仅作为隐藏上下文，不展示、不打开、不下载。`
      );
      return;
    }

    if (materialAttachments.length > 0) {
      const { resolvedIntents, pendingAttachments } = analyzeMaterialIntents(text, materialAttachments);
      if (pendingAttachments.length > 0) {
        addAssistantMessage(convId, {
          prompt: text,
          pendingAttachments,
          resolvedIntents,
          summary: resolvedIntents.length > 0
            ? `已自动识别 ${resolvedIntents.length} 个材料用途，还有 ${pendingAttachments.length} 个材料需要你确认。`
            : `已收到${buildAttachmentSummary(attachments)}，但还需要逐个确认用途。`,
        }, 'material-intent-confirmation');
        setPhase('input');
        return;
      }

      addAssistantMessage(
        convId,
        `已识别 ${resolvedIntents.length} 个上传材料用途：\n${resolvedIntents.map(item => `- ${item.title}：${item.reason}`).join('\n')}\n接下来我会把这些用途带入需求分析。`,
        'text'
      );
      maybeAskVoiceCapability(convId, text, buildIntentPrompt(text, materialAttachments, resolvedIntents), 'material-intent');
      return;
    }

    maybeAskVoiceCapability(convId, text, text);
  }, [activeConversationId, createNewConversation, addUserMessage, addAssistantMessage, maybeAskVoiceCapability]);

  const handleConfirmFramework = useCallback((skipMessage?: string) => {
    if (!activeConversationId) return;
    
    addUserMessage(activeConversationId, skipMessage || '我已确认需求，立即生成。');
    setPhase('generating');
    
    setTimeout(() => {
      startGeneration(activeConversationId);
      
      const initialProgress: GenerationProgress = {
        stages: [
          { name: '图片生成', status: 'pending', progress: 0 },
          { name: '音频生成', status: 'pending', progress: 0 },
          { name: '代码生成', status: 'pending', progress: 0 },
          { name: '代码审查', status: 'pending', progress: 0 },
          { name: '代码修复', status: 'pending', progress: 0 },
          { name: '学情数据回收数据设计', status: 'pending', progress: 0 },
        ],
      };
      addAssistantMessage(activeConversationId, initialProgress, 'generation-progress');
      
      const controller = new AbortController();
      abortControllerRef.current = controller;

      simulateGeneration(
        activeConversationId,
        (updatedProgress) => {
          useConversationStore.setState(state => ({
            conversations: state.conversations.map(c =>
              c.id === activeConversationId
                ? {
                    ...c,
                    messages: c.messages.map(m =>
                      m.type === 'generation-progress' ? { ...m, content: updatedProgress } : m
                    ),
                  }
                : c
            ),
          }));
        },
        (result, coursewareId) => {
          const newCourseware: Courseware = {
            id: coursewareId,
            title: result.title,
            subject: '英语',
            grade: '一年级',
            type: '水果单词',
            author: '张老师',
            publishTime: new Date().toISOString().split('T')[0],
            views: 0,
            favorites: 0,
            likes: 0,
            htmlContent: mockCoursewares[0].htmlContent,
            isOwn: true,
            isPublished: false,
            learningDataRecovery: result.learningDataRecovery,
          };
          addCourseware(newCourseware);
          addAssistantMessage(activeConversationId!, result, 'courseware-result');
          completeGeneration(activeConversationId!, result, coursewareId);
          setPhase('completed');
          setSidebarCollapsed(true);
          openPreview(coursewareId);
          abortControllerRef.current = null;
        },
        controller.signal,
        failAtStageRef.current
      );
    }, demoMs(500));
  }, [activeConversationId, addUserMessage, startGeneration, addAssistantMessage, completeGeneration, addCourseware, setSidebarCollapsed, openPreview]);

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (frameworkTimerRef.current) {
      clearTimeout(frameworkTimerRef.current);
      frameworkTimerRef.current = null;
    }
    pendingFrameworkRef.current = null;
    if (activeConversationId) {
      useConversationStore.setState(state => ({
        conversations: state.conversations.map(c =>
          c.id === activeConversationId ? { ...c, isGenerating: false } : c
        ),
        isGenerating: false,
      }));
      addAssistantMessage(activeConversationId, '系统已暂停回答~', 'text');
    }
    setPhase('input');
  }, [activeConversationId, addAssistantMessage]);

  const handleRetryStage = useCallback((stageIndex: number) => {
    if (!activeConversationId) return;
    useConversationStore.setState(state => ({
      conversations: state.conversations.map(c =>
        c.id === activeConversationId
          ? {
              ...c,
              messages: c.messages.map(m => {
                if (m.type !== 'generation-progress') return m;
                const progress = m.content as GenerationProgress;
                const newStages = progress.stages.map((s, i) =>
                  i === stageIndex ? { ...s, status: 'in-progress' as const, progress: 0, error: undefined } : s
                );
                return { ...m, content: { ...progress, stages: newStages } };
              }),
            }
          : c
      ),
    }));
    const controller = new AbortController();
    abortControllerRef.current = controller;
    simulateGeneration(
      activeConversationId,
      (updatedProgress) => {
        useConversationStore.setState(state => ({
          conversations: state.conversations.map(c =>
            c.id === activeConversationId
              ? { ...c, messages: c.messages.map(m => m.type === 'generation-progress' ? { ...m, content: updatedProgress } : m) }
              : c
          ),
        }));
      },
      (result, coursewareId) => {
        const newCourseware: Courseware = {
          id: coursewareId, title: result.title, subject: '英语', grade: '一年级', type: '水果单词',
          author: '张老师', publishTime: new Date().toISOString().split('T')[0],
          views: 0, favorites: 0, likes: 0, htmlContent: mockCoursewares[0].htmlContent, isOwn: true, isPublished: false,
          learningDataRecovery: result.learningDataRecovery,
        };
        addCourseware(newCourseware);
        addAssistantMessage(activeConversationId!, result, 'courseware-result');
        completeGeneration(activeConversationId!, result, coursewareId);
        setPhase('completed');
        setSidebarCollapsed(true);
        openPreview(coursewareId);
        abortControllerRef.current = null;
      },
      controller.signal
    );
  }, [activeConversationId, addAssistantMessage, completeGeneration, addCourseware, setSidebarCollapsed, openPreview]);

  const handleContinueStage = useCallback((stageIndex: number) => {
    if (!activeConversationId) return;
    useConversationStore.setState(state => ({
      conversations: state.conversations.map(c =>
        c.id === activeConversationId
          ? {
              ...c,
              messages: c.messages.map(m => {
                if (m.type !== 'generation-progress') return m;
                const progress = m.content as GenerationProgress;
                const newStages = progress.stages.map((s, i) =>
                  i === stageIndex ? { ...s, status: 'completed' as const, progress: 100, error: undefined } : s
                );
                return { ...m, content: { ...progress, stages: newStages } };
              }),
            }
          : c
      ),
    }));
    const controller = new AbortController();
    abortControllerRef.current = controller;
    simulateGeneration(
      activeConversationId,
      (updatedProgress) => {
        useConversationStore.setState(state => ({
          conversations: state.conversations.map(c =>
            c.id === activeConversationId
              ? { ...c, messages: c.messages.map(m => m.type === 'generation-progress' ? { ...m, content: updatedProgress } : m) }
              : c
          ),
        }));
      },
      (result, coursewareId) => {
        const newCourseware: Courseware = {
          id: coursewareId, title: result.title, subject: '英语', grade: '一年级', type: '水果单词',
          author: '张老师', publishTime: new Date().toISOString().split('T')[0],
          views: 0, favorites: 0, likes: 0, htmlContent: mockCoursewares[0].htmlContent, isOwn: true, isPublished: false,
          learningDataRecovery: result.learningDataRecovery,
        };
        addCourseware(newCourseware);
        addAssistantMessage(activeConversationId!, result, 'courseware-result');
        completeGeneration(activeConversationId!, result, coursewareId);
        setPhase('completed');
        setSidebarCollapsed(true);
        openPreview(coursewareId);
        abortControllerRef.current = null;
      },
      controller.signal
    );
  }, [activeConversationId, addAssistantMessage, completeGeneration, addCourseware, setSidebarCollapsed, openPreview]);

  const handleSkipFramework = useCallback(() => {
    if (frameworkTimerRef.current) {
      clearTimeout(frameworkTimerRef.current);
      frameworkTimerRef.current = null;
    }
    pendingFrameworkRef.current = null;
    handleConfirmFramework('我已跳过确认需求，直接生成吧~');
  }, [handleConfirmFramework]);

  const handleMaterialIntentConfirm = useCallback((messageId: string, resolutions: MaterialIntentResolution[]) => {
    if (!activeConversationId) return;
    const message = activeConversation?.messages.find(m => m.id === messageId);
    if (!message || message.type !== 'material-intent-confirmation') return;

    const confirmation = message.content as MaterialIntentConfirmation;
    if (confirmation.confirmedResolutions) return;
    const allAttachments = [
      ...confirmation.pendingAttachments,
      ...confirmation.resolvedIntents
        .map(item => {
          const userMessages = activeConversation?.messages.filter(m => m.role === 'user') || [];
          for (const userMessage of userMessages) {
            if (isUserMaterialMessage(userMessage.content)) {
              const found = userMessage.content.attachments?.find((file: UploadedAttachment) => file.id === item.attachmentId);
              if (found) return found;
            }
          }
          return undefined;
        })
        .filter((item): item is UploadedAttachment => Boolean(item)),
    ];
    const allResolutions = [...confirmation.resolvedIntents, ...resolutions];
    const originalPrompt = confirmation.prompt || '请根据上传材料生成互动课件';

    useConversationStore.setState(state => ({
      conversations: state.conversations.map(conversation => (
        conversation.id === activeConversationId
          ? {
              ...conversation,
              messages: conversation.messages.map(item => (
                item.id === messageId && item.type === 'material-intent-confirmation'
                  ? {
                      ...item,
                      content: {
                        ...(item.content as MaterialIntentConfirmation),
                        confirmedResolutions: resolutions,
                        confirmedAt: new Date().toISOString(),
                      },
                    }
                  : item
              )),
            }
          : conversation
      )),
    }));

    addUserMessage(activeConversationId, {
      text: `我已确认 ${resolutions.length} 个材料用途`,
      resolvedIntents: allResolutions,
    });
    addAssistantMessage(
      activeConversationId,
      `好的，已确认全部上传材料用途：\n${allResolutions.map(item => `- ${item.title}：${item.customText || item.description}`).join('\n')}\n接下来我会把这些用途带入需求分析。`,
      'text'
    );
    maybeAskVoiceCapability(
      activeConversationId,
      originalPrompt,
      buildIntentPrompt(originalPrompt, allAttachments, allResolutions),
      'material-intent',
    );
  }, [activeConversationId, activeConversation, addUserMessage, addAssistantMessage, maybeAskVoiceCapability]);

  const handleVoiceCapabilityConfirm = useCallback((messageId: string, selection: VoiceCapabilitySelection) => {
    if (!activeConversationId) return;
    const message = activeConversation?.messages.find(m => m.id === messageId);
    if (!message || message.type !== 'voice-capability-confirmation') return;

    const confirmation = message.content as VoiceCapabilityConfirmation;
    if (confirmation.confirmedSelection) return;
    const selectedText = getVoiceSelectionLabel(selection);

    useConversationStore.setState(state => ({
      conversations: state.conversations.map(conversation => (
        conversation.id === activeConversationId
          ? {
              ...conversation,
              messages: conversation.messages.map(item => (
                item.id === messageId && item.type === 'voice-capability-confirmation'
                  ? {
                      ...item,
                      content: {
                        ...(item.content as VoiceCapabilityConfirmation),
                        confirmedSelection: selection,
                        confirmedAt: new Date().toISOString(),
                      },
                    }
                  : item
              )),
            }
          : conversation
      )),
    }));

    addUserMessage(activeConversationId, selectedText);
    startRequirementFlow(
      activeConversationId,
      `${confirmation.promptForFramework}${buildVoiceCapabilityAppendix(selection)}`,
    );
  }, [activeConversationId, activeConversation, addUserMessage, startRequirementFlow]);
  
  const renderContent = () => {
    if (!activeConversationId || (!hasMessages && phase === 'input')) {
      return (
        <div
          ref={welcomeScrollRef}
          data-welcome-scroll="true"
          data-app-scroll-container="true"
          onScroll={handleWelcomeScroll}
          style={styles.welcomeSection}
        >
          <div
            ref={welcomeHeroPanelRef}
            style={{
              ...styles.welcomeHeroPanel,
              minHeight: welcomeHeroMinHeight,
            }}
          >
            <img src={HOMEPAGE_ROBOT_URL} alt="" style={styles.welcomeRobot} />
            <div style={styles.welcomeHeroContent}>
              <div style={styles.welcomeHeroCopy}>
                <h1 style={styles.welcomeTitle}>生成一节会 <span style={{ background: 'var(--agent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>互动</span> 的课</h1>
                <p style={styles.welcomeSubtitle}>AI智能生成多种互动游戏、互动讲解与教学活动，快速插入课件，提升课堂参与度与教学效果。</p>
              </div>
              <div ref={centeredInputAnchorRef} style={{ width: '100%', maxWidth: 980 }}>
                <ChatInput
                  onSend={handleSend}
                  centered
                  disabled={isGenerating}
                  placeholder="例如：做一个颜色单词游戏，或者上传材料后描述你想怎么用"
                  injectedText={draftPrompt}
                  injectedTextVersion={draftVersion}
                  onTextChange={handleDraftPromptChange}
                  lockedAttachments={activeCloneDraft ? [activeCloneDraft.attachment] : []}
                />
              </div>
            </div>
          </div>
          <div style={{ width: '100%', marginTop: 24 }}>
            <InspirationSection
              selectedInspirationId={selectedInspiration?.id}
              onApplyInspiration={handleApplyInspiration}
            />
          </div>
          {showBackToInput && (
            <div
              className="back-to-input-wrap"
              style={styles.backToInputWrap}
            >
              <div className="back-to-input-tooltip" style={styles.backToInputTooltip}>
                回到顶部
                <span style={styles.backToInputTooltipArrow} />
              </div>
              <button
                type="button"
                aria-label="回到顶部"
                onClick={scrollToHomepageInput}
                style={styles.backToInputButton}
              >
                <ArrowUp size={15} />
              </button>
            </div>
          )}
        </div>
      );
    }
    
    return (
      <>
        <div
          ref={chatAreaRef}
          data-app-scroll-container="true"
          style={{ ...styles.chatArea, ...chatContentVars, padding: chatAreaPadding }}
        >
          <div style={styles.messagesContainer}>
            <AnimatePresence mode="popLayout">
              {(activeConversation?.messages ?? []).map((msg, index) => {
                const messages = activeConversation?.messages ?? [];
                const nextMessage = messages[index + 1];
                const nextCoursewareIndex = nextMessage?.type === 'courseware-result'
                  ? messages
                      .slice(0, index + 2)
                      .filter(item => item.type === 'courseware-result').length - 1
                  : -1;
                const canUndoNextResult = msg.role === 'user' && nextMessage?.type === 'courseware-result';
                const nextResultPublished = canUndoNextResult
                  ? getCoursewarePublishState(nextMessage, nextCoursewareIndex)
                  : false;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {msg.role === 'user' ? (
                      <UserMessage
                        content={msg.content as string}
                        onUndoNextResult={
                          canUndoNextResult && nextMessage
                            ? () => handleUndoCoursewareResult(msg.id, nextMessage.id, nextCoursewareIndex, nextResultPublished)
                            : undefined
                        }
                      />
                    ) : (
                    <>
                      <AssistantMessage 
                        message={msg} 
                        phase={phase}
                        frameworkDone={frameworkDone}
                        onFrameworkStreamComplete={() => setFrameworkDone(true)}
                        streamDuration={activeConversation?.title.startsWith('同款-') ? demoMs(2000) : undefined}
                        onRetry={handleRetryStage}
                        onContinue={handleContinueStage}
                        onMaterialIntentConfirm={handleMaterialIntentConfirm}
                        onVoiceCapabilityConfirm={handleVoiceCapabilityConfirm}
                        onOpenPreview={(coursewareId, version) => {
                          openPreview(coursewareId, version);
                        }}
                        onLearningDataRecoveryRequest={() => {}}
                        onVisualStyleRegenerate={(request) => {
                          if (!activeConversationId) return;
                          const newCoursewareId = Date.now();
                          const isTextureOnly = request.regenerationMode === 'image-texture-only';
                          const stageNames = isTextureOnly
                            ? ['图片生成']
                            : ['图片生成', '音频生成', '课件生成', '代码审查', '代码修复', '学情数据回收数据设计'];
                          const introText = isTextureOnly
                            ? `正在为「${request.styleName}」执行图片质感叠加，仅重绘课件中的图片资产，玩法、题目、音频和交互代码保持不变。`
                            : request.enhancementStyleIds?.length
                              ? `正在按「${request.styleName}」重新生成课件：先注入基础风格 UI 规范，再在资产规划阶段把图片质感写入生图提示词。`
                              : `正在按「${request.styleName}」的 UI 规范重新生成课件，包含图片生成、音频生成和课件 HTML 生成。`;

                          addUserMessage(activeConversationId, isTextureOnly ? `叠加${request.styleName}` : `使用${request.styleName}重新生成课件`);
                          addAssistantMessage(
                            activeConversationId,
                            isTextureOnly
                              ? '需求已明确，正在为您叠加图片质感，请稍后。'
                              : '需求已明确，正在为您重新生成课件，请稍后。',
                            'text'
                          );

                          setPhase('generating');
                          startGeneration(activeConversationId);

                          const initialProgress: GenerationProgress = {
                            introText,
                            instantIntro: true,
                            stages: stageNames.map((name, index) => ({
                              name,
                              status: index === 0 ? 'in-progress' : 'pending',
                              progress: 0,
                              detail: name === '图片生成'
                                ? isTextureOnly
                                  ? '基于原课件截图做图生图，只叠加图片材质、笔触和光影质感。'
                                  : request.enhancementStyleIds?.length
                                    ? '根据基础风格规划图片资产，并在生图提示词里叠加所选质感。'
                                    : '根据基础风格 UI 规范生成背景、角色、按钮和反馈素材。'
                                : name === '音频生成'
                                  ? '重新合成课件所需发音、反馈音和引导音频。'
                                  : name === '课件生成'
                                    ? '按所选基础风格的 UI 规范生成课件 HTML。'
                                    : undefined,
                            })),
                          };
                          addAssistantMessage(activeConversationId, initialProgress, 'generation-progress');

                          const controller = new AbortController();
                          abortControllerRef.current = controller;

                          const updateLatestProgress = (updatedProgress: GenerationProgress) => {
                            const progressWithStyleIntro: GenerationProgress = {
                              ...updatedProgress,
                              introText: initialProgress.introText,
                              instantIntro: true,
                              stages: updatedProgress.stages.map(stage => ({
                                ...stage,
                                detail: stage.name === '图片生成'
                                  ? isTextureOnly
                                    ? '基于原课件截图做图生图，只叠加图片材质、笔触和光影质感。'
                                    : request.enhancementStyleIds?.length
                                      ? '根据基础风格规划图片资产，并在生图提示词里叠加所选质感。'
                                      : '根据基础风格 UI 规范生成背景、角色、按钮和反馈素材。'
                                  : stage.name === '音频生成'
                                    ? '重新合成课件所需发音、反馈音和引导音频。'
                                    : stage.name === '课件生成'
                                      ? '按所选基础风格的 UI 规范生成课件 HTML。'
                                      : stage.detail,
                              })),
                            };
                            useConversationStore.setState(state => ({
                              conversations: state.conversations.map(conversation => {
                                if (conversation.id !== activeConversationId) return conversation;

                                const lastProgressIndex = conversation.messages.reduce(
                                  (latestIndex, message, index) => (
                                    message.type === 'generation-progress' ? index : latestIndex
                                  ),
                                  -1
                                );

                                return {
                                  ...conversation,
                                  messages: conversation.messages.map((message, index) => (
                                    index === lastProgressIndex
                                      ? { ...message, content: progressWithStyleIntro }
                                      : message
                                  )),
                                };
                              }),
                            }));
                          };

                          simulateGeneration(
                            activeConversationId,
                            updateLatestProgress,
                            (result) => {
                              const nextCourseware: Courseware = {
                                id: newCoursewareId,
                                title: request.coursewareTitle,
                                subject: '英语',
                                grade: '一年级',
                                type: '画面风格重生成',
                                author: '张老师',
                                publishTime: new Date().toISOString().split('T')[0],
                                views: 0,
                                favorites: 0,
                                likes: 0,
                                htmlContent: request.htmlContent,
                                isOwn: true,
                                isPublished: false,
                                learningDataRecovery: result.learningDataRecovery,
                              };
                              addCourseware(nextCourseware);
                              addAssistantMessage(activeConversationId, {
                                coursewareId: newCoursewareId,
                                title: request.coursewareTitle,
                                version: request.version || '下一版',
                                htmlContent: request.htmlContent,
                                visualStylePrompt: request.stylePrompt,
                                learningDataRecovery: result.learningDataRecovery,
                              }, 'courseware-result');
                              completeGeneration(activeConversationId, {
                                title: request.coursewareTitle,
                                version: request.version || '下一版',
                                htmlContent: request.htmlContent,
                                visualStylePrompt: request.stylePrompt,
                                learningDataRecovery: result.learningDataRecovery,
                              }, newCoursewareId);
                              setPhase('completed');
                              setSidebarCollapsed(true);
                              openPreview(newCoursewareId);
                              abortControllerRef.current = null;
                            },
                            controller.signal,
                            undefined,
                            stageNames
                          );

                          window.setTimeout(() => {
                            forceBottomScrollRef.current = true;
                          }, demoMs(100));
                        }}
                      />
                    </>
                    )}
                  </motion.div>
                );
              })}
              
              {(phase === 'analyzing' || phase === 'loading-framework') && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <AIWaitingMessage />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {(phase === 'loading-framework' || phase === 'framework') && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 24px 0' }}>
            {phase === 'loading-framework' || !frameworkDone ? (
              <button
                onClick={handleSkipFramework}
                style={{
                  padding: '10px 28px',
                  background: '#fff',
                  color: 'var(--agent-primary)',
                  border: '1px solid var(--agent-primary)',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  outline: 'none',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,201,167,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
              >
                跳过确认，直接生成
              </button>
            ) : (
              <button
                onClick={() => handleConfirmFramework()}
                style={{
                  padding: '10px 28px',
                  background: 'var(--agent-gradient)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  outline: 'none',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                确认需求，开始生成
              </button>
            )}
          </div>
        )}

        <div ref={bottomInputAnchorRef} style={{ ...styles.inputArea, ...chatContentVars, padding: inputAreaPadding }}>
          <div style={{ width: '100%', maxWidth: chatContentMaxWidth }}>
            <ChatInput 
              onSend={handleSend} 
              disabled={false} 
              isGenerating={phase !== 'input' && phase !== 'completed'}
              onStop={handleStop}
              injectedText={draftPrompt}
              injectedTextVersion={draftVersion}
              onTextChange={handleDraftPromptChange}
              lockedAttachments={activeCloneDraft ? [activeCloneDraft.attachment] : []}
            />
          </div>
        </div>
      </>
    );
  };
  
  return (
    <div style={styles.container}>
      <div ref={splitContainerRef} style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Main Content */}
        <div style={{ ...styles.mainContent, flex: previewPanelOpen ? undefined : 1, width: previewPanelOpen ? `${chatWidth}%` : '100%' }}>
          {renderContent()}
        </div>

        {/* Draggable Divider + Preview Panel */}
        {previewPanelOpen && previewCoursewareId && (
          <>
            <div
              onMouseDown={handleDragStart}
              style={{
                width: 6,
                cursor: 'col-resize',
                background: isDragging ? 'var(--agent-primary)' : '#E2E8F0',
                transition: isDragging ? 'none' : 'background 0.15s',
                flexShrink: 0,
                position: 'relative',
                zIndex: 2,
              }}
              onMouseEnter={e => { if (!isDragging) e.currentTarget.style.background = '#CBD5E1'; }}
              onMouseLeave={e => { if (!isDragging) e.currentTarget.style.background = '#E2E8F0'; }}
            >
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 2, height: 32, borderRadius: 1, background: isDragging ? '#fff' : '#94A3B8' }} />
            </div>
            <div style={{ width: `${100 - chatWidth}%`, flexShrink: 0, overflow: 'hidden' }}>
              <PreviewPanel 
                coursewareId={previewCoursewareId} 
                initialVersion={previewInitialVersion}
                onClose={closePreview} 
              />
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {promptFly && (
          <motion.div
            key={promptFly.id}
            initial={{
              x: promptFly.from.x - 118,
              y: promptFly.from.y - 22,
              scale: 0.86,
              opacity: 0,
            }}
            animate={{
              x: promptFly.to.x - 118,
              y: promptFly.to.y - 22,
              scale: [0.86, 1.04, 0.72],
              opacity: [0, 1, 1, 0],
            }}
            exit={{ opacity: 0, scale: 0.65 }}
            transition={{ duration: 0.68, ease: [0.22, 0.9, 0.22, 1] }}
            style={styles.promptFlyCard}
          >
            <span style={styles.promptFlyIcon}><Sparkles size={14} /></span>
            <span style={styles.promptFlyText}>结构化提示词 · {promptFly.title}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Global styles */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        .back-to-input-wrap:hover .back-to-input-tooltip,
        .back-to-input-wrap:focus-within .back-to-input-tooltip {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `}</style>
    </div>
  );
}
