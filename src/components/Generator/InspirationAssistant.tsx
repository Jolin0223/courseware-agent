import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  FileText,
  Image,
  MessageCircle,
  Minus,
  Paperclip,
  SendHorizontal,
  Wand2,
  X,
} from 'lucide-react';
import toast from '../../utils/toast';

interface InspirationAssistantProps {
  onApplyPrompt: (prompt: string) => void;
  isHomePage?: boolean;
  preferExpandedLauncher?: boolean;
}

type FloatingPosition = {
  x: number;
  y: number;
};

interface AssistantReply {
  title: string;
  body: string;
  ideas: string[];
  finalPrompt: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  attachments?: AttachedFile[];
  reply?: AssistantReply;
}

interface AttachedFile {
  id: string;
  type: 'image' | 'document';
  name: string;
  url?: string;
  loading?: boolean;
}

const quickQuestions = [
  '颜色单词适合做什么互动？',
  '20以内口算怎么更有游戏感？',
  '古诗背诵可以怎么互动？',
  '低龄英语启蒙怎么做不枯燥？',
];

const assistantCompactIconUrl = 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/20260711012115-ZFroXnPG.gif';
const assistantLauncherIconUrl = assistantCompactIconUrl;
const assistantIconUrl = assistantLauncherIconUrl;
const viewportMargin = 16;
const launcherRightOffset = 35;
const launcherBottomOffset = 76;
const defaultPanelWidth = 492;
const defaultPanelHeight = 640;
const expandedLauncherWidth = 140;
const expandedLauncherHeight = 44;
const compactLauncherWidth = 44;
const launcherHeight = 44;
const homeFirstScreenScrollThreshold = 88;
const maxAssistantImageCount = 10;
const maxAssistantDocumentCount = 10;
const maxImageFileSizeMb = 5;
const maxDocumentFileSizeMb = 10;
const bytesPerMb = 1024 * 1024;
const supportedImageExtensions = ['png', 'jpg', 'jpeg', 'gif'];
const supportedDocumentExtensions = ['pdf', 'doc', 'docx', 'md'];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getViewportSize = () => ({
  width: typeof window === 'undefined' ? 1440 : window.innerWidth,
  height: typeof window === 'undefined' ? 900 : window.innerHeight,
});

const getDefaultPosition = (
  width: number,
  height: number,
  bottomOffset = viewportMargin,
  rightOffset = viewportMargin,
): FloatingPosition => {
  const viewport = getViewportSize();
  return {
    x: Math.max(viewportMargin, viewport.width - width - rightOffset),
    y: Math.max(viewportMargin, viewport.height - height - bottomOffset),
  };
};

const buildReply = (question: string, attachments: AttachedFile[] = []): AssistantReply => {
  const imageCount = attachments.filter(file => file.type === 'image').length;
  const documentCount = attachments.filter(file => file.type === 'document').length;
  const attachmentNote = imageCount || documentCount
    ? `我也看到了你带来的${[imageCount ? `${imageCount} 张图片` : '', documentCount ? `${documentCount} 个附件` : ''].filter(Boolean).join('、')}。这类材料更适合先说明用途：是作为课件素材、风格参考，还是用于提取题目/知识点。`
    : '';

  if (/颜色|color/i.test(question)) {
    return {
      title: '建议用“彩虹修复 + 单词图片配对”',
      body: `${attachmentNote ? `${attachmentNote}\n\n` : ''}颜色单词的难点不是讲解，而是让学生反复听、看、选、说。可以把抽象单词变成彩虹缺口修复任务，每轮只解决一个颜色，课堂上很好投屏互动。`,
      ideas: ['听音辨色', '拖拽颜色卡', '点亮彩虹进度', '答对播放英文发音'],
      finalPrompt: `做一个 5-8 岁儿童使用的颜色单词互动课件。\n\n生成设置：单关卡学练融合，练习模式，可多次尝试，采用明亮卡片风。\n课堂玩法：彩虹修复师。学生听到或看到英文颜色单词后，从颜色卡片中选择正确颜色，并拖到彩虹缺口。\n互动流程：播放颜色单词 → 选择颜色卡 → 拖到彩虹缺口 → 点亮彩虹 → 播放英文发音 → 获得星星奖励。\n题目内容：red、blue、yellow、green、orange、purple，分 3 轮递进：看词选色、听音选色、多颜色混合挑战。\n反馈方式：答对时彩虹点亮并朗读单词，答错时正确颜色边缘轻闪提示，允许再次尝试。`,
    };
  }

  if (/口算|计算|20|数学|加减/.test(question)) {
    return {
      title: '建议用“口算赛车”做熟练度练习',
      body: `${attachmentNote ? `${attachmentNote}\n\n` : ''}口算适合用轻竞技包装，但题目区域要始终清楚。赛车前进、连击加速、维修提示这些反馈能让学生愿意多做几轮。`,
      ideas: ['三关递进', '连击加速', '错题维修站', '终点通关反馈'],
      finalPrompt: `做一个小学低年级 20 以内加减法口算互动课件。\n\n生成设置：多关卡学练融合，练习模式，采用逻辑风格 + 轻竞技进度反馈。\n课堂玩法：口算赛车。学生每答对一道题，赛车向前加速；连续答对触发连击加速，答错进入维修提示。\n互动流程：出现口算题 → 选择答案 → 赛车前进 → 连击加速 → 到达终点 → 解锁下一关。\n题目内容：3 关递进，每关 6 道题：第一关 10 以内加减，第二关 20 以内不进退位，第三关 20 以内混合计算。\n反馈方式：答对赛车前进并获得星星，答错展示简单计算提示，允许重新选择。`,
    };
  }

  if (/古诗|诗句|背诵|排序|语文/.test(question)) {
    return {
      title: '建议用“诗句小路排序”承接背诵',
      body: `${attachmentNote ? `${attachmentNote}\n\n` : ''}古诗不要只做填空，可以先让学生把诗句顺序拼回来。排序完成后再完整朗读，能自然衔接理解和背诵。`,
      ideas: ['诗句拖拽排序', '关键词提示', '月光进度', '完成后整诗朗读'],
      finalPrompt: `做一个小学语文古诗背诵前的互动课件，内容以《静夜思》为例。\n\n生成设置：单关卡学练融合，练习模式，采用温和国风课堂风。\n课堂玩法：诗句小路排序。学生把打乱的诗句拖回正确顺序，每排对一句，小路或月光点亮一步。\n互动流程：展示打乱诗句 → 拖拽排序 → 自动校验 → 点亮进度 → 完整展示古诗 → 播放朗读。\n题目内容：床前明月光、疑是地上霜、举头望明月、低头思故乡；可加入关键词“明月、霜、举头、低头”作为提示。\n反馈方式：排序正确时诗句吸附并点亮，错误时提示相邻诗句关系，不直接打断学生操作。`,
    };
  }

  return {
    title: '建议先选“图片找词”或“单词图片配对”',
    body: `${attachmentNote ? `${attachmentNote}\n\n` : ''}低龄英语启蒙要减少文字压力，用图片、声音和即时反馈承接学习目标。每轮操作越短，课堂参与越稳定。`,
    ideas: ['图片大目标', '听音点击', '配对消除', '星星奖励'],
    finalPrompt: `做一个 3-6 岁儿童使用的英语启蒙互动课件。\n\n生成设置：微关卡学练融合，练习模式，采用英语启蒙风，按钮和图片要适合大屏点击。\n课堂玩法：图片找词。系统播放或展示一个英文单词，学生在图片区域找到对应目标并点击。\n互动流程：播放单词 → 观察图片 → 点击目标 → 播放发音 → 星星奖励 → 进入下一轮。\n题目内容：围绕动物、颜色或水果生成 6 个基础词，每轮只出现一个目标词。\n反馈方式：答对时目标高亮并播放发音，答错时正确目标轮廓轻闪，允许再次尝试。`,
  };
};

export default function InspirationAssistant({
  onApplyPrompt,
  isHomePage = false,
  preferExpandedLauncher = false,
}: InspirationAssistantProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [advancedMode, setAdvancedMode] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [isHomeFirstScreen, setIsHomeFirstScreen] = useState(true);
  const [dragPosition, setDragPosition] = useState<FloatingPosition | null>(null);
  const [panelPosition, setPanelPosition] = useState<FloatingPosition | null>(null);
  const [launcherPosition, setLauncherPosition] = useState<FloatingPosition | null>(null);
  const logoDoubleClickRef = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragPositionRef = useRef<FloatingPosition | null>(null);
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    width: number;
    height: number;
  } | null>(null);
  const dragMovedRef = useRef(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: '你可以把一个很粗的想法发给我，比如“颜色单词”“口算复习”“古诗背诵”。我会帮你找适合课堂的互动方式，并整理成可以复制到输入框里的生成提示词。',
    },
  ]);

  const latestReply = useMemo(() => [...messages].reverse().find(item => item.reply)?.reply, [messages]);
  const canSend = input.trim().length > 0 || attachedFiles.some(file => !file.loading);

  const compactLauncher = !(preferExpandedLauncher && isHomeFirstScreen);
  const currentLauncherWidth = compactLauncher ? compactLauncherWidth : expandedLauncherWidth;
  const currentLauncherHeight = compactLauncher ? launcherHeight : expandedLauncherHeight;
  const panelHeight = Math.min(defaultPanelHeight, getViewportSize().height - viewportMargin * 2);
  const currentLauncherPosition = dragPosition && !open
    ? dragPosition
    : launcherPosition || getDefaultPosition(currentLauncherWidth, currentLauncherHeight, launcherBottomOffset, launcherRightOffset);
  const currentPanelPosition = dragPosition && open
    ? dragPosition
    : panelPosition || getDefaultPosition(defaultPanelWidth, panelHeight);
  const launcherExpandLeft = currentLauncherPosition.x > getViewportSize().width / 2;

  useEffect(() => {
    const getHomeScrollTop = () => {
      const containers = Array.from(document.querySelectorAll<HTMLElement>('[data-app-scroll-container="true"]'));
      const containerScrollTop = containers.reduce((max, item) => Math.max(max, item.scrollTop), 0);
      return Math.max(window.scrollY, document.documentElement.scrollTop, document.body.scrollTop, containerScrollTop);
    };

    const updateHomeFirstScreen = () => {
      setIsHomeFirstScreen(isHomePage && getHomeScrollTop() <= homeFirstScreenScrollThreshold);
    };

    updateHomeFirstScreen();
    if (!isHomePage) return;

    const containers = Array.from(document.querySelectorAll<HTMLElement>('[data-app-scroll-container="true"]'));
    window.addEventListener('scroll', updateHomeFirstScreen, { passive: true });
    document.addEventListener('scroll', updateHomeFirstScreen, { passive: true, capture: true });
    containers.forEach(container => container.addEventListener('scroll', updateHomeFirstScreen, { passive: true }));
    window.addEventListener('resize', updateHomeFirstScreen);
    return () => {
      window.removeEventListener('scroll', updateHomeFirstScreen);
      document.removeEventListener('scroll', updateHomeFirstScreen, { capture: true });
      containers.forEach(container => container.removeEventListener('scroll', updateHomeFirstScreen));
      window.removeEventListener('resize', updateHomeFirstScreen);
    };
  }, [isHomePage]);

  useEffect(() => {
    const correctPosition = () => {
      const height = open
        ? panelHeight
        : currentLauncherHeight;
      const width = open ? defaultPanelWidth : currentLauncherWidth;
      const viewport = getViewportSize();
      const correct = (position: FloatingPosition | null) => {
        if (!position) return position;
        return {
          x: clamp(position.x, viewportMargin, Math.max(viewportMargin, viewport.width - width - viewportMargin)),
          y: clamp(position.y, viewportMargin, Math.max(viewportMargin, viewport.height - height - viewportMargin)),
        };
      };
      setPanelPosition(correct);
      setLauncherPosition(correct);
    };

    correctPosition();
    window.addEventListener('resize', correctPosition);
    return () => window.removeEventListener('resize', correctPosition);
  }, [open, panelHeight, currentLauncherHeight, currentLauncherWidth]);

  const startFloatingDrag = (event: React.MouseEvent, source: 'launcher' | 'panel') => {
    if (event.button !== 0) return;
    const target = event.target;
    if (target instanceof Element && target.closest('[data-assistant-no-drag="true"]')) return;

    const element = source === 'launcher' ? launcherRef.current : panelRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    dragMovedRef.current = false;
    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: rect.left,
      originY: rect.top,
      width: rect.width,
      height: rect.height,
    };

    const handleMove = (moveEvent: MouseEvent) => {
      const state = dragStateRef.current;
      if (!state) return;
      const deltaX = moveEvent.clientX - state.startX;
      const deltaY = moveEvent.clientY - state.startY;
      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) dragMovedRef.current = true;

      const viewport = getViewportSize();
      const nextPosition = {
        x: clamp(state.originX + deltaX, viewportMargin, Math.max(viewportMargin, viewport.width - state.width - viewportMargin)),
        y: clamp(state.originY + deltaY, viewportMargin, Math.max(viewportMargin, viewport.height - state.height - viewportMargin)),
      };
      dragPositionRef.current = nextPosition;
      setDragPosition(nextPosition);
    };

    const handleUp = () => {
      const state = dragStateRef.current;
      if (state) {
        const rawPosition = dragPositionRef.current || {
          x: state.originX,
          y: state.originY,
        };
        if (source === 'panel') {
          setPanelPosition(rawPosition);
        } else {
          setLauncherPosition(rawPosition);
        }
      }
      dragPositionRef.current = null;
      setDragPosition(null);
      dragStateRef.current = null;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.setTimeout(() => {
        dragMovedRef.current = false;
      }, 0);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'move';
  };

  const collapseAssistant = () => {
    setOpen(false);
    setPanelPosition(null);
    setLauncherPosition(null);
    setDragPosition(null);
    dragPositionRef.current = null;
  };

  const getFileExtension = (file: File) => file.name.split('.').pop()?.toLowerCase() || '';

  const isSupportedImage = (file: File) => {
    const ext = getFileExtension(file);
    return supportedImageExtensions.includes(ext) || ['image/png', 'image/jpeg', 'image/gif'].includes(file.type);
  };

  const isSupportedDocument = (file: File) => supportedDocumentExtensions.includes(getFileExtension(file));

  const addImageFiles = (files: File[]) => {
    const currentCount = attachedFiles.filter(file => file.type === 'image').length;
    const availableSlots = maxAssistantImageCount - currentCount;
    if (availableSlots <= 0) {
      toast(`最多可上传 ${maxAssistantImageCount} 张图片`);
      return;
    }

    const supportedFiles = files.filter(isSupportedImage);
    if (supportedFiles.length < files.length) toast('图片仅支持 PNG、JPG、JPEG 和 GIF 格式');

    const validFiles = supportedFiles.filter(file => file.size <= maxImageFileSizeMb * bytesPerMb);
    if (validFiles.length < supportedFiles.length) toast(`图片大小不能超过 ${maxImageFileSizeMb}MB`);
    if (validFiles.length > availableSlots) toast(`最多可上传 ${maxAssistantImageCount} 张图片，本次仅添加前 ${availableSlots} 张`);

    validFiles.slice(0, availableSlots).forEach(file => {
      const id = `assistant_image_${Date.now()}_${Math.random()}`;
      const url = URL.createObjectURL(file);
      setAttachedFiles(prev => [...prev, { id, type: 'image', name: file.name, url }]);
      toast(`图片 "${file.name}" 已添加`);
    });
  };

  const addDocumentFiles = (files: File[]) => {
    const currentCount = attachedFiles.filter(file => file.type === 'document').length;
    const availableSlots = maxAssistantDocumentCount - currentCount;
    if (availableSlots <= 0) {
      toast(`最多可上传 ${maxAssistantDocumentCount} 个附件`);
      return;
    }

    const supportedFiles = files.filter(isSupportedDocument);
    if (supportedFiles.length < files.length) toast('附件仅支持 PDF、Word 和 MD 格式');

    const validFiles = supportedFiles.filter(file => file.size <= maxDocumentFileSizeMb * bytesPerMb);
    if (validFiles.length < supportedFiles.length) toast(`文档大小不能超过 ${maxDocumentFileSizeMb}MB`);
    if (validFiles.length > availableSlots) toast(`最多可上传 ${maxAssistantDocumentCount} 个附件，本次仅添加前 ${availableSlots} 个`);

    validFiles.slice(0, availableSlots).forEach(file => {
      const id = `assistant_doc_${Date.now()}_${Math.random()}`;
      setAttachedFiles(prev => [...prev, { id, type: 'document', name: file.name }]);
      toast(`文件 "${file.name}" 已添加`);
    });
  };

  const handleDropUpload = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const documentFiles = files.filter(file => !file.type.startsWith('image/'));
    if (imageFiles.length) addImageFiles(imageFiles);
    if (documentFiles.length) addDocumentFiles(documentFiles);
  };

  const removeAttachedFile = (id: string) => {
    setAttachedFiles(prev => {
      const file = prev.find(item => item.id === id);
      if (file?.url) URL.revokeObjectURL(file.url);
      return prev.filter(item => item.id !== id);
    });
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    const items = Array.from(event.clipboardData.items);
    const pastedImages: File[] = [];
    const pastedDocuments: File[] = [];

    items.forEach(item => {
      if (item.kind !== 'file') return;
      const file = item.getAsFile();
      if (!file) return;
      if (file.type.startsWith('image/')) {
        const namedFile = file.name ? file : new File([file], `截图-${Date.now()}.png`, { type: file.type || 'image/png' });
        pastedImages.push(namedFile);
      } else {
        pastedDocuments.push(file);
      }
    });

    if (pastedImages.length || pastedDocuments.length) {
      event.preventDefault();
      if (pastedImages.length) addImageFiles(pastedImages);
      if (pastedDocuments.length) addDocumentFiles(pastedDocuments);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    addImageFiles(Array.from(files));
    event.target.value = '';
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    addDocumentFiles(Array.from(files));
    event.target.value = '';
  };

  const renderAttachment = (file: AttachedFile) => (
    <div key={file.id} style={styles.attachmentItem} title={file.name}>
      {file.type === 'image' && file.url ? (
        <img src={file.url} alt={file.name} style={styles.attachmentImage} />
      ) : (
        <span style={styles.attachmentDocIcon}><FileText size={13} /></span>
      )}
      <span style={styles.attachmentName}>{file.name}</span>
      <button
        type="button"
        style={styles.attachmentRemove}
        onClick={() => removeAttachedFile(file.id)}
        aria-label={`移除${file.name}`}
      >
        <X size={11} />
      </button>
    </div>
  );

  const sendQuestion = (question: string) => {
    const value = question.trim();
    const readyAttachments = attachedFiles.filter(file => !file.loading);
    if (!value && readyAttachments.length === 0) return;
    const displayText = value || '请根据我上传的材料帮我想一个互动课件方案';
    const reply = buildReply(displayText, readyAttachments);
    setMessages(prev => [
      ...prev,
      { id: `u_${Date.now()}`, role: 'user', text: displayText, attachments: readyAttachments },
      {
        id: `a_${Date.now()}`,
        role: 'assistant',
        text: reply.body,
        reply,
      },
    ]);
    setInput('');
    setAttachedFiles([]);
  };

  const applyPrompt = (prompt: string) => {
    onApplyPrompt(prompt);
    collapseAssistant();
  };

  const copyText = async (text: string) => {
    if (window.navigator.clipboard?.writeText && window.isSecureContext) {
      try {
        await window.navigator.clipboard.writeText(text);
        return;
      } catch {
        // Embedded browsers may block Clipboard API; keep a fallback below.
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
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    if (!copied) throw new Error('copy failed');
  };

  const getCopyContent = (message: ChatMessage) => {
    if (!message.reply) return message.text;
    return `${message.text}\n\n${message.reply.title}\n${message.reply.finalPrompt}`;
  };

  const handleCopyMessage = async (message: ChatMessage) => {
    try {
      await copyText(getCopyContent(message));
      setCopiedMessageId(message.id);
      toast('已复制，可粘贴到输入框继续生成');
      window.setTimeout(() => setCopiedMessageId(null), 1500);
    } catch {
      toast('复制失败，请稍后重试');
    }
  };

  const handleLogoDoubleClick = () => {
    logoDoubleClickRef.current += 1;
    if (logoDoubleClickRef.current >= 2) {
      logoDoubleClickRef.current = 0;
      setAdvancedMode(mode => !mode);
      toast(!advancedMode ? '已切换到带回输入框版本' : '已切换到复制方案版本');
      return;
    }

    const clickCount = logoDoubleClickRef.current;
    window.setTimeout(() => {
      if (logoDoubleClickRef.current === clickCount) {
        logoDoubleClickRef.current = 0;
      }
    }, 900);
  };

  return (
    <>
      <style>{`
        .inspiration-assistant-launcher:hover {
          transform: translateY(-1px);
          box-shadow: 0 18px 44px var(--agent-shadow), 0 0 0 1px rgba(255,255,255,0.72);
        }
        .inspiration-assistant-launcher-compact:hover {
          width: ${expandedLauncherWidth}px !important;
          height: ${expandedLauncherHeight}px !important;
          padding: 0 18px 0 7px !important;
          gap: 8px !important;
          background: linear-gradient(135deg, var(--agent-primary), var(--agent-secondary)) !important;
          border: 1px solid var(--agent-border) !important;
          box-shadow: 0 14px 30px rgba(14, 116, 144, 0.22), 0 0 0 3px var(--agent-focus-ring) !important;
        }
        .inspiration-assistant-launcher-compact.inspiration-assistant-expand-left:hover {
          transform: translateX(-${expandedLauncherWidth - compactLauncherWidth}px) translateY(-1px);
        }
        .inspiration-assistant-launcher-compact:hover .inspiration-assistant-label {
          max-width: 76px !important;
          min-width: 64px !important;
          opacity: 1 !important;
          margin-left: 0 !important;
        }
        .inspiration-assistant-launcher-compact:hover .inspiration-assistant-icon {
          background: #FFFFFF !important;
          box-shadow: inset 0 0 0 2px #FFFFFF, 0 0 0 2px rgba(14, 165, 233, 0.2) !important;
        }
      `}</style>
      {!open && (
        <button
          ref={launcherRef}
          type="button"
          className={`inspiration-assistant-launcher${compactLauncher ? ' inspiration-assistant-launcher-compact' : ''}${launcherExpandLeft ? ' inspiration-assistant-expand-left' : ''}`}
          style={{
            ...styles.fab,
            ...(compactLauncher ? styles.fabCompact : {}),
            left: currentLauncherPosition.x,
            top: currentLauncherPosition.y,
            right: 'auto',
            bottom: 'auto',
            transition: dragPosition ? 'none' : styles.fab.transition,
          }}
          onClick={event => {
            if (dragMovedRef.current) {
              event.preventDefault();
              return;
            }
            setOpen(true);
          }}
          aria-label="打开灵感助手"
        >
          <span
            className="inspiration-assistant-icon"
            style={{ ...styles.fabIcon, ...(compactLauncher ? styles.fabIconCompact : {}) }}
          >
            <img
              src={compactLauncher ? assistantCompactIconUrl : assistantLauncherIconUrl}
              alt=""
              style={{
                ...styles.assistantImage,
                ...(compactLauncher ? styles.assistantImageCompact : {}),
              }}
            />
          </span>
          <span
            className="inspiration-assistant-label"
            style={{ ...styles.fabLabel, ...(compactLauncher ? styles.fabLabelCompact : {}) }}
          >
            灵感助手
          </span>
        </button>
      )}

      {open && (
        <>
          <style>{`
            .assistant-scroll {
              scrollbar-width: none;
            }
            .assistant-scroll::-webkit-scrollbar {
              display: none;
            }
            .assistant-slim-scroll {
              scrollbar-width: thin;
              scrollbar-color: rgba(14, 116, 144, 0.24) transparent;
            }
            .assistant-slim-scroll::-webkit-scrollbar {
              width: 6px;
            }
            .assistant-slim-scroll::-webkit-scrollbar-thumb {
              background: rgba(14, 116, 144, 0.18);
              border-radius: 999px;
            }
          `}</style>
          <div
            ref={panelRef}
            onDragOver={event => {
              if (event.dataTransfer.types.includes('Files')) {
                event.preventDefault();
                setIsDraggingFiles(true);
              }
            }}
            onDragLeave={event => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setIsDraggingFiles(false);
              }
            }}
            onDrop={event => {
              if (event.dataTransfer.files.length === 0) return;
              event.preventDefault();
              setIsDraggingFiles(false);
              handleDropUpload(Array.from(event.dataTransfer.files));
            }}
            style={{
              ...styles.panel,
              left: currentPanelPosition.x,
              top: currentPanelPosition.y,
              transition: dragPosition ? 'none' : styles.panel.transition,
            }}
          >
            <input
              ref={imageInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.gif,image/png,image/jpeg,image/gif"
              multiple
              hidden
              onChange={handleImageSelect}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown,text/plain"
              multiple
              hidden
              onChange={handleFileSelect}
            />
            {isDraggingFiles && <div style={styles.dragUploadMask}>松开即可添加到灵感助手</div>}
            <div style={styles.header} onMouseDown={event => startFloatingDrag(event, 'panel')}>
              <div style={styles.headerLeft}>
                <button
                  type="button"
                  data-assistant-no-drag="true"
                  style={styles.logo}
                  onDoubleClick={handleLogoDoubleClick}
                  aria-label="切换灵感助手版本"
                >
                  <img src={assistantIconUrl} alt="" style={styles.logoImage} />
                </button>
                <div>
                  <div style={styles.title}>灵感助手</div>
                  <div style={styles.subtitle}>
                    {advancedMode ? '聊出玩法，再带回输入框生成课件' : '帮你一起想玩法、补提示词，也可以整理成可复制的生成方案'}
                  </div>
                </div>
              </div>
              <div style={styles.headerActions} data-assistant-no-drag="true">
                <button type="button" style={styles.closeBtn} onClick={collapseAssistant} aria-label="最小化灵感助手">
                  <Minus size={18} strokeWidth={2.2} />
                </button>
              </div>
            </div>

            <div className="assistant-scroll" style={styles.quickRow}>
              {quickQuestions.map(question => (
                <button key={question} type="button" style={styles.quickChip} onClick={() => sendQuestion(question)}>
                  {question}
                </button>
              ))}
            </div>

            <div className="assistant-slim-scroll" style={styles.messageList}>
              {messages.map(message => (
                <div
                  key={message.id}
                  style={{
                    ...styles.messageRow,
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  {message.role === 'assistant' && (
                    <span style={styles.avatar}><img src={assistantIconUrl} alt="" style={styles.avatarImage} /></span>
                  )}
                  {message.role === 'user' ? (
                    <div style={styles.userBubble}>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{message.text}</div>
                      {message.attachments && message.attachments.length > 0 && (
                        <div style={styles.sentAttachmentList}>
                          {message.attachments.map(file => (
                            <span key={file.id} style={styles.sentAttachmentChip}>
                              {file.type === 'image' ? <Image size={12} /> : <FileText size={12} />}
                              {file.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={styles.assistantMessageStack}>
                      <div style={styles.assistantBubble}>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{message.text}</div>
                        {message.reply && (
                          <div style={styles.replyCard}>
                            <div style={styles.replyTitle}>{message.reply.title}</div>
                            <div style={styles.ideaRow}>
                              {message.reply.ideas.map(idea => (
                                <span key={idea} style={styles.ideaChip}>{idea}</span>
                              ))}
                            </div>
                            <div className="assistant-slim-scroll" style={styles.promptPreview}>{message.reply.finalPrompt}</div>
                            {advancedMode && (
                              <button type="button" style={styles.applyBtn} onClick={() => applyPrompt(message.reply!.finalPrompt)}>
                                <Wand2 size={14} />
                                带回输入框
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div style={styles.assistantMessageActions}>
                        <button
                          type="button"
                          style={styles.copyMessageBtn}
                          onClick={() => handleCopyMessage(message)}
                        >
                          {copiedMessageId === message.id ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                          {copiedMessageId === message.id ? '已复制' : '复制'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {latestReply && advancedMode && (
              <div style={styles.footerHint}>
                已整理出一版可生成提示词，可以继续追问，也可以直接带回输入框。
              </div>
            )}

            <div style={styles.inputFooter}>
              {attachedFiles.length > 0 && (
                <div style={styles.attachmentTray}>
                  {attachedFiles.map(renderAttachment)}
                </div>
              )}
              <div style={styles.inputBar}>
                <MessageCircle size={17} color="var(--agent-primary-text)" />
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onPaste={handlePaste}
                  onKeyDown={e => {
                    if (e.key === 'Enter') sendQuestion(input);
                  }}
                  placeholder="例如：一年级形状认知，适合什么互动？"
                  style={styles.input}
                />
                <button
                  type="button"
                  style={styles.toolBtn}
                  onClick={() => imageInputRef.current?.click()}
                  aria-label="上传图片"
                  title="上传图片或粘贴截图"
                >
                  <Image size={16} />
                </button>
                <button
                  type="button"
                  style={styles.toolBtn}
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="上传附件"
                  title="上传 PDF、Word 或 MD"
                >
                  <Paperclip size={16} />
                </button>
                <button
                  type="button"
                  style={{
                    ...styles.sendBtn,
                    opacity: canSend ? 1 : 0.48,
                    cursor: canSend ? 'pointer' : 'not-allowed',
                  }}
                  onClick={() => sendQuestion(input)}
                  aria-label="发送"
                  disabled={!canSend}
                >
                  <SendHorizontal size={16} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  fab: {
    position: 'fixed',
    width: 140,
    height: 44,
    right: launcherRightOffset,
    bottom: launcherBottomOffset,
    zIndex: 1200,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 18px 0 7px',
    border: '1px solid var(--agent-border)',
    borderRadius: 999,
    background: 'linear-gradient(135deg, var(--agent-primary), var(--agent-secondary))',
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 900,
    boxShadow: '0 14px 30px rgba(14, 116, 144, 0.22), 0 0 0 3px var(--agent-focus-ring)',
    cursor: 'pointer',
    transition: 'left 0.18s ease, top 0.18s ease, width 0.18s ease, height 0.18s ease, padding 0.18s ease, border-radius 0.18s ease, transform 0.15s ease, box-shadow 0.15s ease',
    overflow: 'hidden',
    userSelect: 'none',
  },
  fabCompact: {
    width: 44,
    height: 44,
    padding: 4,
    borderRadius: 999,
    gap: 0,
    background: 'linear-gradient(135deg, #0EA5E9, #22D3EE 52%, #14B8A6)',
    border: '1px solid rgba(255,255,255,0.92)',
    boxShadow: '0 12px 26px rgba(14, 116, 144, 0.22), 0 0 0 4px rgba(224, 242, 254, 0.82)',
  },
  fabIcon: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#FFFFFF',
    boxShadow: '0 5px 14px rgba(2, 116, 252, 0.18), 0 0 0 2px rgba(255,255,255,0.78)',
    overflow: 'hidden',
    flexShrink: 0,
  },
  fabIconCompact: {
    width: 34,
    height: 34,
    background: '#FFFFFF',
    boxShadow: 'inset 0 0 0 2px #FFFFFF',
  },
  fabLabel: {
    whiteSpace: 'nowrap',
    lineHeight: 1,
  },
  fabLabelCompact: {
    maxWidth: 0,
    opacity: 0,
    marginLeft: -9,
    overflow: 'hidden',
    transition: 'max-width 0.18s ease, opacity 0.14s ease, margin-left 0.18s ease',
  },
  assistantImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  assistantImageCompact: {
    transform: 'scale(0.88)',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 2200,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    padding: 24,
    background: 'rgba(15, 23, 42, 0.24)',
    backdropFilter: 'blur(5px)',
  },
  panel: {
    position: 'fixed',
    zIndex: 2200,
    width: 492,
    maxWidth: 'calc(100vw - 48px)',
    height: 'min(640px, calc(100vh - 32px))',
    maxHeight: 640,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 22,
    background: 'linear-gradient(180deg, #FFFFFF, #F8FEFF 44%, var(--agent-soft))',
    border: '1px solid var(--agent-border)',
    boxShadow: '0 30px 90px rgba(15, 23, 42, 0.28), inset 0 1px 0 rgba(255,255,255,0.95)',
    overflow: 'hidden',
    transition: 'left 0.18s ease, top 0.18s ease',
    willChange: 'left, top',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 20px',
    background: 'linear-gradient(135deg, var(--agent-soft), var(--agent-soft) 58%, #EFF6FF)',
    borderBottom: '1px solid var(--agent-border)',
    cursor: 'move',
    userSelect: 'none',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  logo: {
    width: 42,
    height: 42,
    border: 'none',
    borderRadius: 999,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--agent-primary-text)',
    background: 'linear-gradient(135deg, var(--agent-soft-strong), #FFFFFF)',
    boxShadow: '0 10px 24px var(--agent-focus-ring-strong)',
    cursor: 'pointer',
    flexShrink: 0,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  title: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: 950,
  },
  subtitle: {
    marginTop: 2,
    color: '#64748B',
    fontSize: 12,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: '1px solid var(--agent-border)',
    background: '#FFFFFF',
    color: '#64748B',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  statusPill: {
    marginLeft: 'auto',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 28,
    padding: '0 12px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.72)',
    border: '1px solid var(--agent-border)',
    color: 'var(--agent-primary-text)',
    fontSize: 12,
    fontWeight: 850,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: 'var(--agent-primary)',
    boxShadow: '0 0 0 4px var(--agent-focus-ring-strong)',
  },
  quickRow: {
    display: 'flex',
    gap: 8,
    padding: '10px 16px 13px',
    overflowX: 'auto',
    borderBottom: '1px solid rgba(226, 232, 240, 0.72)',
    background: 'rgba(255,255,255,0.56)',
  },
  quickChip: {
    height: 30,
    padding: '0 10px',
    borderRadius: 999,
    border: '1px solid var(--agent-border)',
    background: 'rgba(255,255,255,0.76)',
    color: 'var(--agent-secondary-text)',
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  },
  messageList: {
    flex: 1,
    overflowY: 'auto',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    background: 'linear-gradient(180deg, rgba(248,250,252,0.92), var(--agent-soft))',
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 999,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: 'var(--agent-primary-text)',
    background: 'linear-gradient(135deg, var(--agent-soft-strong), #FFFFFF)',
    overflow: 'hidden',
    boxShadow: '0 6px 14px rgba(2, 116, 252, 0.12)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  assistantBubble: {
    position: 'relative',
    padding: '13px 14px',
    borderRadius: '15px 15px 15px 5px',
    background: 'rgba(255,255,255,0.88)',
    border: '1px solid rgba(207,250,254,0.95)',
    color: '#334155',
    fontSize: 13,
    lineHeight: 1.58,
    boxShadow: '0 10px 26px rgba(15, 23, 42, 0.05)',
  },
  assistantMessageStack: {
    maxWidth: '88%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  assistantMessageActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    paddingTop: 6,
  },
  copyMessageBtn: {
    height: 24,
    padding: '0 7px',
    borderRadius: 999,
    border: '1px solid var(--agent-border)',
    background: 'rgba(255,255,255,0.86)',
    color: 'var(--agent-primary-text)',
    fontSize: 11,
    fontWeight: 850,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    cursor: 'pointer',
  },
  userBubble: {
    maxWidth: '82%',
    padding: '10px 12px',
    borderRadius: '13px 13px 4px 13px',
    background: 'var(--agent-action-gradient)',
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 1.55,
  },
  replyCard: {
    marginTop: 10,
    padding: 11,
    borderRadius: 11,
    background: 'linear-gradient(180deg, #FFFFFF, #F8FAFC)',
    border: '1px solid var(--agent-border)',
    boxShadow: '0 8px 20px rgba(14, 165, 233, 0.06)',
  },
  replyTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: 900,
    marginBottom: 8,
  },
  ideaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 9,
  },
  ideaChip: {
    height: 22,
    padding: '0 7px',
    borderRadius: 999,
    background: 'var(--agent-soft)',
    color: 'var(--agent-secondary-text)',
    fontSize: 11,
    fontWeight: 850,
    lineHeight: '22px',
  },
  promptPreview: {
    maxHeight: 140,
    overflowY: 'auto',
    padding: 10,
    borderRadius: 9,
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    color: '#475569',
    fontSize: 12,
    lineHeight: 1.55,
    whiteSpace: 'pre-wrap',
  },
  applyBtn: {
    marginTop: 10,
    width: '100%',
    height: 34,
    border: 'none',
    borderRadius: 8,
    background: 'var(--agent-action-gradient)',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 900,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    cursor: 'pointer',
  },
  footerHint: {
    padding: '8px 16px',
    color: 'var(--agent-secondary-text)',
    background: 'var(--agent-soft)',
    borderTop: '1px solid var(--agent-border)',
    fontSize: 12,
    fontWeight: 750,
  },
  inputFooter: {
    borderTop: '1px solid #E2E8F0',
    background: 'rgba(255,255,255,0.92)',
  },
  attachmentTray: {
    display: 'flex',
    gap: 8,
    padding: '10px 14px 0',
    overflowX: 'auto',
  },
  attachmentItem: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    maxWidth: 148,
    height: 34,
    padding: '0 24px 0 6px',
    borderRadius: 10,
    border: '1px solid var(--agent-border)',
    background: '#FFFFFF',
    color: '#475569',
    fontSize: 11,
    fontWeight: 750,
    flexShrink: 0,
    overflow: 'hidden',
  },
  attachmentImage: {
    width: 24,
    height: 24,
    borderRadius: 7,
    objectFit: 'cover',
    flexShrink: 0,
  },
  attachmentDocIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--agent-soft)',
    color: 'var(--agent-primary-text)',
    flexShrink: 0,
  },
  attachmentName: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  attachmentRemove: {
    position: 'absolute',
    right: 5,
    top: 8,
    width: 18,
    height: 18,
    borderRadius: 999,
    border: 'none',
    background: 'rgba(15, 23, 42, 0.06)',
    color: '#64748B',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
  },
  sentAttachmentList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  sentAttachmentChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    maxWidth: 180,
    height: 22,
    padding: '0 7px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.18)',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 750,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  dragUploadMask: {
    position: 'absolute',
    inset: 10,
    zIndex: 3,
    borderRadius: 18,
    border: '1px dashed var(--agent-primary)',
    background: 'rgba(224, 242, 254, 0.78)',
    color: 'var(--agent-primary-text)',
    fontSize: 14,
    fontWeight: 900,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  inputBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    background: 'transparent',
  },
  input: {
    flex: 1,
    height: 36,
    border: '1px solid var(--agent-border)',
    borderRadius: 12,
    padding: '0 10px',
    outline: 'none',
    color: '#0F172A',
    fontSize: 13,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    border: 'none',
    background: 'var(--agent-action-gradient)',
    color: '#FFFFFF',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  toolBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    border: '1px solid var(--agent-border)',
    background: '#FFFFFF',
    color: '#64748B',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
};
