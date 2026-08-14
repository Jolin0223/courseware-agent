import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Link,
  SendHorizontal,
  Sparkles,
  Square,
  RotateCw,
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Paperclip,
  X,
  Database,
  BookOpenText,
  Presentation,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import type { GenerationPreferences, UploadedAttachment } from '../../types';
import HtmlTypeBadge from '../common/HtmlTypeBadge';
import TeachingContentPicker from './TeachingContentPicker';
import GenerationPreferencePicker from './GenerationPreferencePicker';

interface ChatInputProps {
  onSend: (text: string, attachments?: UploadedAttachment[], preferences?: GenerationPreferences) => void;
  disabled?: boolean;
  isGenerating?: boolean;
  onStop?: () => void;
  centered?: boolean;
  placeholder?: string;
  injectedText?: string;
  injectedTextVersion?: number;
  onTextChange?: (text: string) => void;
  lockedAttachments?: UploadedAttachment[];
  forceHighlight?: boolean;
}

const HOMEPAGE_CONTENT_MAX_WIDTH = 1080;
const HOMEPAGE_INPUT_PLACEHOLDER = '例如：做一个颜色单词游戏，或者上传材料后描述你想怎么用';
const HOMEPAGE_PLACEHOLDER_EXAMPLES = [
  HOMEPAGE_INPUT_PLACEHOLDER,
];
const HOMEPAGE_PLACEHOLDER_LOOP = [
  ...HOMEPAGE_PLACEHOLDER_EXAMPLES,
  HOMEPAGE_PLACEHOLDER_EXAMPLES[0],
];
const HOMEPAGE_PROMPT_GROUPS = [
  [
    '做一个颜色单词卡片点击游戏',
    '做一个看图选词语游戏',
    '生成一个10以内加法选答案的互动课件',
  ],
  [
    '生成字母大小写泡泡消除配对互动游戏',
    '做一个汉字与偏旁部首连线游戏',
    '做一个数字1到10认读游戏',
  ],
  [
    '生成一个形状认识的互动讲解',
    '做一个汉字图片匹配游戏',
    '做一个分数认识的互动讲解',
  ],
  [
    '做一个数学常见形状认识的互动讲解',
    '拼音学习：听音选择正确的声母',
    '生成一个幼儿园动物单词学习翻翻卡',
  ],
];

const TEXTAREA_MAX_HEIGHT = 200;
const MAX_IMAGE_COUNT = 10;
const MAX_DOCUMENT_COUNT = 10;
const MAX_IMAGE_FILE_SIZE_MB = 5;
const MAX_DOCUMENT_FILE_SIZE_MB = 10;
const BYTES_PER_MB = 1024 * 1024;
const SUPPORTED_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif'];
const SUPPORTED_DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'md'];

interface TeachingUsageSuggestion {
  label: string;
  text: string;
}

const getTeachingUsageGuidance = (attachments: UploadedAttachment[]): {
  placeholder: string;
  suggestions: TeachingUsageSuggestion[];
} | null => {
  const sourceTypes = new Set(attachments.map(item => item.teachingSource?.type).filter(Boolean));
  const hasQuestions = sourceTypes.has('question-bank');
  const hasWords = sourceTypes.has('word-book');
  const hasCloudPages = sourceTypes.has('cloud-pages');
  const typeCount = Number(hasQuestions) + Number(hasWords) + Number(hasCloudPages);

  if (typeCount > 1) {
    if (hasQuestions && hasWords && hasCloudPages) {
      return {
        placeholder: '请说明这些内容如何组合，例如：先用课件页讲解单词，再用所选题目做闯关练习',
        suggestions: [
          { label: '讲解后闯关', text: '先用所选课件页讲解单词，再用所选题目做闯关练习' },
          { label: '沿用课件玩法', text: '参考所选课件页的玩法结构，把这些单词和题目编排成连续关卡' },
        ],
      };
    }
    if (hasQuestions && hasWords) {
      return {
        placeholder: '请说明题目和单词如何组合，例如：先学习单词，再用所选题目做闯关练习',
        suggestions: [
          { label: '先学后练', text: '先学习这些单词，再用所选题目做闯关练习' },
          { label: '单词热身', text: '先用单词认读热身，再进入题目讲评和互动练习' },
        ],
      };
    }
    if (hasQuestions && hasCloudPages) {
      return {
        placeholder: '请说明课件页面与题目如何配合，例如：先讲解所选页面，再用题目做互动练习',
        suggestions: [
          { label: '讲解后练习', text: '先讲解所选课件页面，再用这些题目做互动练习' },
          { label: '参考玩法闯关', text: '参考所选课件页的玩法结构，把这些题目做成闯关游戏' },
        ],
      };
    }
    return {
      placeholder: '请说明课件页面与单词如何配合，例如：先讲解所选页面，再做听音选词',
      suggestions: [
        { label: '讲解后练习', text: '先使用所选课件页讲解单词，再做听音选词练习' },
        { label: '参考玩法拼写', text: '参考所选课件页的玩法结构，用这些单词做拼写闯关' },
      ],
    };
  }

  if (hasQuestions) {
    return {
      placeholder: '请说明所选题目用途，如把这些题做成3关闯关练习，答错后展示解析',
      suggestions: [
        { label: '互动练习', text: '把这些题做成互动练习，答题后即时反馈' },
        { label: '闯关游戏', text: '把这些题做成3关闯关游戏，答错后展示解析' },
        { label: '题目讲评', text: '逐题讲评这些题目，先作答再展示答案和解析' },
      ],
    };
  }

  if (hasWords) {
    return {
      placeholder: '请说明所选单词用途，如用这些单词做听音选词和拼写闯关',
      suggestions: [
        { label: '单词认读', text: '用这些单词做图文认读练习' },
        { label: '听音选词', text: '用这些单词做听音选词练习' },
        { label: '拼写闯关', text: '用这些单词做拼写闯关游戏' },
        { label: '口语练习', text: '用这些单词做跟读和口语练习' },
      ],
    };
  }

  if (hasCloudPages) {
    return {
      placeholder: '请说明所选课件页用途，如提取教学内容、参考画面风格或参考玩法结构',
      suggestions: [
        { label: '使用教学内容', text: '使用所选页面的教学内容生成互动练习' },
        { label: '参考画面风格', text: '参考所选页面的画面风格生成新课件' },
        { label: '参考玩法结构', text: '参考所选页面的玩法结构生成新课件' },
      ],
    };
  }

  return null;
};

const HOVER_CSS = `
  .ci-icon-btn:hover { color: var(--agent-primary-text) !important; background: var(--agent-soft) !important; }
`;

import toast from '../../utils/toast';

interface AttachedFile {
  id: string;
  type: 'image' | 'document';
  name: string;
  url?: string;
  loading?: boolean;
}

const APPLIED_DEMAND_LABEL = '你的需求';

const parseAppliedInspirationDraft = (value: string) => {
  const match = value.match(/^(?:教学内容|你的需求)：([\s\S]*?)\n\n<已套用玩法>\n([\s\S]*?)\n<\/已套用玩法>$/);
  if (!match) return null;
  const body = match[2];
  const pick = (label: string) => body.match(new RegExp(`${label}：([^\\n]+)`))?.[1]?.trim() || '';
  const section = (label: string, nextLabel: string) => {
    const result = body.match(new RegExp(`${label}：\\n([\\s\\S]*?)\\n\\n${nextLabel}：`));
    return result?.[1]?.trim() || '';
  };
  const prompt = body.match(/玩法要求：\n([\s\S]*?)\n\n(?:本次生成要求|生成要求)：/)?.[1]?.trim() || '';
  return {
    demand: match[1].trim(),
    playwayName: pick('玩法名称'),
    playwayType: pick('玩法类型'),
    ageRange: pick('适用年龄'),
    suitableFor: pick('适合内容'),
    flow: section('课堂互动流程', '玩法改编建议'),
    adaptation: section('玩法改编建议', '玩法要求'),
    prompt,
  };
};

const buildAppliedInspirationDraft = (
  currentText: string,
  nextDemand: string,
) => currentText.replace(
  /^(?:教学内容|你的需求)：[\s\S]*?\n\n<已套用玩法>/,
  `${APPLIED_DEMAND_LABEL}：${nextDemand}\n\n<已套用玩法>`,
);

const formatDraftFlow = (flow: string) => flow
  .split('\n')
  .map(item => item.replace(/^\d+\.\s*/, '').trim())
  .filter(Boolean)
  .join(' → ');

const formatAppliedPlaywayMeta = (playwayType: string, ageRange: string) => (
  [playwayType, ageRange].filter(Boolean).join(' · ')
);

const renderInlineMarkdown = (value: string) => {
  const parts = value.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} style={styles.markdownInlineCode}>{part.slice(1, -1)}</code>;
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

const renderInlineLines = (value: string) => value.split('\n').map((line, index, lines) => (
  <React.Fragment key={`${line}-${index}`}>
    {renderInlineMarkdown(line)}
    {index < lines.length - 1 && <br />}
  </React.Fragment>
));

const isTableSeparator = (line: string) => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);

const parseTableCells = (line: string) => line
  .replace(/^\s*\|/, '')
  .replace(/\|\s*$/, '')
  .split('|')
  .map(cell => cell.trim());

const isMarkdownBlockStart = (line: string, nextLine = '') => {
  const trimmed = line.trim();
  return (
    trimmed === ''
    || trimmed.startsWith('```')
    || /^#{1,4}\s+/.test(trimmed)
    || /^>\s?/.test(trimmed)
    || /^[-*]\s+/.test(trimmed)
    || /^\d+\.\s+/.test(trimmed)
    || /^-{3,}$/.test(trimmed)
    || (trimmed.includes('|') && isTableSeparator(nextLine))
  );
};

const renderMarkdownHeading = (level: number, content: string, key: string) => {
  if (level === 1) return <h1 key={key} style={styles.markdownH1}>{renderInlineMarkdown(content)}</h1>;
  if (level === 2) return <h2 key={key} style={styles.markdownH2}>{renderInlineMarkdown(content)}</h2>;
  if (level === 3) return <h3 key={key} style={styles.markdownH3}>{renderInlineMarkdown(content)}</h3>;
  return <h4 key={key} style={styles.markdownH4}>{renderInlineMarkdown(content)}</h4>;
};

const MarkdownPromptPreview = ({ text }: { text: string }) => {
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith('```')) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push(
        <pre key={`code-${index}`} style={styles.markdownCodeBlock}>
          <code>{codeLines.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    if (/^#{1,4}\s+/.test(trimmed)) {
      const level = Math.min(trimmed.match(/^#+/)?.[0].length || 2, 4);
      const content = trimmed.replace(/^#{1,4}\s+/, '');
      blocks.push(renderMarkdownHeading(level, content, `heading-${index}`));
      index += 1;
      continue;
    }

    if (/^-{3,}$/.test(trimmed)) {
      blocks.push(<hr key={`hr-${index}`} style={styles.markdownHr} />);
      index += 1;
      continue;
    }

    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith('>')) {
        quoteLines.push(lines[index].replace(/^\s*>\s?/, ''));
        index += 1;
      }
      blocks.push(
        <blockquote key={`quote-${index}`} style={styles.markdownQuote}>
          {renderInlineLines(quoteLines.join('\n'))}
        </blockquote>,
      );
      continue;
    }

    if (trimmed.includes('|') && isTableSeparator(lines[index + 1] || '')) {
      const headerCells = parseTableCells(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        rows.push(parseTableCells(lines[index]));
        index += 1;
      }
      blocks.push(
        <div key={`table-${index}`} style={styles.markdownTableWrap}>
          <table style={styles.markdownTable}>
            <thead>
              <tr>
                {headerCells.map((cell, cellIndex) => (
                  <th key={`${cell}-${cellIndex}`} style={styles.markdownTh}>{renderInlineMarkdown(cell)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${cell}-${cellIndex}`} style={styles.markdownTd}>{renderInlineMarkdown(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (/^[-*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      const ordered = /^\d+\.\s+/.test(trimmed);
      const listItems: string[] = [];
      const itemPattern = ordered ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/;
      while (index < lines.length && itemPattern.test(lines[index])) {
        listItems.push(lines[index].replace(itemPattern, '').trim());
        index += 1;
      }
      blocks.push(
        ordered ? (
          <ol key={`list-${index}`} style={styles.markdownList}>
            {listItems.map((item, itemIndex) => (
              <li key={`${item}-${itemIndex}`} style={styles.markdownListItem}>{renderInlineMarkdown(item)}</li>
            ))}
          </ol>
        ) : (
          <ul key={`list-${index}`} style={styles.markdownList}>
            {listItems.map((item, itemIndex) => (
              <li key={`${item}-${itemIndex}`} style={styles.markdownListItem}>{renderInlineMarkdown(item)}</li>
            ))}
          </ul>
        ),
      );
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length && !isMarkdownBlockStart(lines[index], lines[index + 1] || '')) {
      paragraphLines.push(lines[index]);
      index += 1;
    }
    if (paragraphLines.length === 0) {
      paragraphLines.push(line);
      index += 1;
    }
    blocks.push(
      <p key={`paragraph-${index}`} style={styles.markdownParagraph}>
        {renderInlineLines(paragraphLines.join('\n'))}
      </p>,
    );
  }

  return <div style={styles.markdownPreviewText}>{blocks}</div>;
};

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled,
  isGenerating,
  onStop,
  centered,
  placeholder = '在这里输入你的修改意见，AI会进行修复和优化',
  injectedText,
  injectedTextVersion,
  onTextChange,
  lockedAttachments = [],
  forceHighlight = false,
}) => {
  const appMode = useUIStore((s) => s.appMode);
  const linkedCoursewareCount = useUIStore((s) => s.linkedCoursewareCount);
  const setLinkedCoursewareCount = useUIStore((s) => s.setLinkedCoursewareCount);
  const isEmbedded = appMode === 'embedded';
  const [text, setText] = useState('');
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [teachingAttachments, setTeachingAttachments] = useState<UploadedAttachment[]>([]);
  const [editingTeachingAttachment, setEditingTeachingAttachment] = useState<UploadedAttachment | null>(null);
  const [generationPreferences, setGenerationPreferences] = useState<GenerationPreferences>({
    visualStyleMode: 'smart',
    voiceMode: 'smart',
    voiceLanguage: '英语-英音',
    generationModeId: 'smart',
    htmlModelId: 'gemini-3.1-pro',
    imageModelId: 'jimeng-5.0',
  });
  const [hoveredFileId, setHoveredFileId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<AttachedFile | null>(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [isDraftPromptOpen, setIsDraftPromptOpen] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderAnimating, setPlaceholderAnimating] = useState(true);
  const [homepagePromptGroupIndex, setHomepagePromptGroupIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const dragFileIdRef = useRef<string | null>(null);

  const [stopTooltip, setStopTooltip] = useState(false);
  const isInputHighlighted = isFocused || forceHighlight;

  const canSend = (text.trim().length > 0 || attachedFiles.some(f => !f.loading) || teachingAttachments.length > 0 || lockedAttachments.length > 0) && !disabled;
  const imageFiles = attachedFiles.filter(file => file.type === 'image');
  const documentFiles = attachedFiles.filter(file => file.type === 'document');
  const appliedInspirationDraft = parseAppliedInspirationDraft(text);
  const draftPromptPreview = appliedInspirationDraft
    ? appliedInspirationDraft.prompt
    : '';
  const homepagePromptChips = HOMEPAGE_PROMPT_GROUPS[homepagePromptGroupIndex % HOMEPAGE_PROMPT_GROUPS.length];
  const shouldShowHomepageExamples = false;
  const shouldShowHomepagePromptChips = Boolean(
    centered
    && lockedAttachments.length === 0
    && teachingAttachments.length === 0
    && !appliedInspirationDraft
  );
  const teachingUsageGuidance = getTeachingUsageGuidance(teachingAttachments);

  const materialUsagePlaceholder = (() => {
    if (teachingUsageGuidance) return teachingUsageGuidance.placeholder;
    if (imageFiles.length > 0 && documentFiles.length > 0) {
      return '请分别说明图片和文档的用途，例如：图片作为角色素材，文档用于提取题目内容';
    }
    if (imageFiles.length > 0) {
      return '请描述这些图片要怎么用于互动课件，例如：作为背景、角色、道具、题目素材或参考风格';
    }
    if (documentFiles.length > 0) {
      return '请描述文档要怎么使用，例如：提取题目、作为知识内容、生成脚本或参考结构';
    }
    return placeholder;
  })();

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, TEXTAREA_MAX_HEIGHT)}px`;
    el.style.overflowY = el.scrollHeight > TEXTAREA_MAX_HEIGHT ? 'auto' : 'hidden';
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [text, resizeTextarea]);

  useEffect(() => {
    if (!shouldShowHomepageExamples) {
      setPlaceholderAnimating(false);
      setPlaceholderIndex(0);
      return;
    }
    setPlaceholderAnimating(true);
    const timer = window.setInterval(() => {
      setPlaceholderIndex(prev => prev + 1);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [shouldShowHomepageExamples]);

  useEffect(() => {
    if (!shouldShowHomepageExamples || placeholderIndex !== HOMEPAGE_PLACEHOLDER_EXAMPLES.length) return;

    const resetTimer = window.setTimeout(() => {
      setPlaceholderAnimating(false);
      setPlaceholderIndex(0);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setPlaceholderAnimating(true));
      });
    }, 380);

    return () => window.clearTimeout(resetTimer);
  }, [placeholderIndex, shouldShowHomepageExamples]);

  useEffect(() => {
    if (injectedTextVersion === undefined || injectedText === undefined) return;
    setText(injectedText);
    onTextChange?.(injectedText);
    requestAnimationFrame(() => {
      resizeTextarea();
      textareaRef.current?.focus();
    });
  }, [injectedText, injectedTextVersion, onTextChange, resizeTextarea]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    const readyFiles = attachedFiles.filter(f => !f.loading);
    const readyAttachments: UploadedAttachment[] = [
      ...lockedAttachments,
      ...readyFiles.map(({ id, type, name, url }) => ({ id, type, name, url })),
      ...teachingAttachments,
    ];
    if ((!trimmed && readyAttachments.length === 0) || disabled) return;
    onSend(trimmed, readyAttachments, generationPreferences);
    setText('');
    onTextChange?.('');
    setAttachedFiles([]);
    setTeachingAttachments([]);
    setGenerationPreferences({
      visualStyleMode: 'smart',
      visualStyleEnhancementIds: undefined,
      voiceMode: 'smart',
      voiceLanguage: '英语-英音',
      generationModeId: 'smart',
      htmlModelId: 'gemini-3.1-pro',
      imageModelId: 'jimeng-5.0',
    });
  }, [text, attachedFiles, teachingAttachments, lockedAttachments, generationPreferences, disabled, onSend, onTextChange]);

  const applyHomepagePromptChip = useCallback((value: string) => {
    setText(value);
    onTextChange?.(value);
    window.requestAnimationFrame(() => {
      resizeTextarea();
      textareaRef.current?.focus();
    });
  }, [onTextChange, resizeTextarea]);

  const updateTeachingAttachment = useCallback((nextAttachment: UploadedAttachment) => {
    setTeachingAttachments(previous => previous.map(item => item.id === nextAttachment.id ? nextAttachment : item));
  }, []);

  const removeTeachingAttachment = useCallback((attachmentId: string) => {
    setTeachingAttachments(previous => previous.filter(item => item.id !== attachmentId));
  }, []);

  const switchHomepagePromptGroup = useCallback(() => {
    setHomepagePromptGroupIndex(prev => (prev + 1) % HOMEPAGE_PROMPT_GROUPS.length);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendWithFiles();
    }
  };

  const handleImageUpload = () => {
    imageInputRef.current?.click();
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const getFileExtension = (file: File) => file.name.split('.').pop()?.toLowerCase() || '';

  const isSupportedImage = (file: File) => {
    const ext = getFileExtension(file);
    return SUPPORTED_IMAGE_EXTENSIONS.includes(ext) || ['image/png', 'image/jpeg', 'image/gif'].includes(file.type);
  };

  const isSupportedDocument = (file: File) => {
    return SUPPORTED_DOCUMENT_EXTENSIONS.includes(getFileExtension(file));
  };

  const addImageFiles = (files: File[]) => {
    const currentImageCount = attachedFiles.filter(f => f.type === 'image').length;
    const availableSlots = MAX_IMAGE_COUNT - currentImageCount;
    if (availableSlots <= 0) {
      toast(`最多可上传 ${MAX_IMAGE_COUNT} 张图片`);
      return;
    }
    const supportedFiles = files.filter(isSupportedImage);
    if (supportedFiles.length < files.length) {
      toast('图片仅支持 PNG、JPG、JPEG 和 GIF 格式');
    }
    const validFiles = supportedFiles.filter(file => file.size <= MAX_IMAGE_FILE_SIZE_MB * BYTES_PER_MB);
    if (validFiles.length < supportedFiles.length) {
      toast(`图片大小不能超过 ${MAX_IMAGE_FILE_SIZE_MB}MB`);
    }
    if (validFiles.length > availableSlots) {
      toast(`最多可上传 ${MAX_IMAGE_COUNT} 张图片，本次仅添加前 ${availableSlots} 张`);
    }
    validFiles.slice(0, availableSlots).forEach(file => {
      const id = Date.now().toString() + Math.random();
      setAttachedFiles(prev => [...prev, { id, type: 'image', name: file.name, loading: true }]);
      const url = URL.createObjectURL(file);
      setTimeout(() => {
        setAttachedFiles(prev => prev.map(f => f.id === id ? { ...f, url, loading: false } : f));
        toast(`图片 "${file.name}" 已添加`);
      }, 800 + Math.random() * 600);
    });
  };

  const addDocumentFiles = (files: File[]) => {
    const currentDocumentCount = attachedFiles.filter(f => f.type === 'document').length;
    const availableSlots = MAX_DOCUMENT_COUNT - currentDocumentCount;
    if (availableSlots <= 0) {
      toast(`最多可上传 ${MAX_DOCUMENT_COUNT} 个附件`);
      return;
    }
    const validFiles = files.filter(isSupportedDocument);
    if (validFiles.length < files.length) {
      toast('附件仅支持 PDF、Word 和 MD 格式');
    }
    const sizeValidFiles = validFiles.filter(file => file.size <= MAX_DOCUMENT_FILE_SIZE_MB * BYTES_PER_MB);
    if (sizeValidFiles.length < validFiles.length) {
      toast(`文档大小不能超过 ${MAX_DOCUMENT_FILE_SIZE_MB}MB`);
    }
    if (sizeValidFiles.length > availableSlots) {
      toast(`最多可上传 ${MAX_DOCUMENT_COUNT} 个附件，本次仅添加前 ${availableSlots} 个`);
    }
    sizeValidFiles.slice(0, availableSlots).forEach(file => {
      const id = Date.now().toString() + Math.random();
      setAttachedFiles(prev => [...prev, { id, type: 'document', name: file.name, loading: true }]);
      setTimeout(() => {
        setAttachedFiles(prev => prev.map(f => f.id === id ? { ...f, loading: false } : f));
        toast(`文件 "${file.name}" 已添加`);
      }, 1000 + Math.random() * 800);
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    addImageFiles(Array.from(files));
    e.target.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    addDocumentFiles(Array.from(files));
    e.target.value = '';
  };

  const handleDropUpload = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const documentFiles = files.filter(file => !file.type.startsWith('image/'));
    if (imageFiles.length) addImageFiles(imageFiles);
    if (documentFiles.length) addDocumentFiles(documentFiles);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    let hasFile = false;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          if (!isSupportedImage(file)) {
            toast('图片仅支持 PNG、JPG、JPEG 和 GIF 格式');
            continue;
          }
          if (file.size > MAX_IMAGE_FILE_SIZE_MB * BYTES_PER_MB) {
            toast(`图片大小不能超过 ${MAX_IMAGE_FILE_SIZE_MB}MB`);
            continue;
          }
          if (attachedFiles.filter(f => f.type === 'image').length >= MAX_IMAGE_COUNT) {
            toast(`最多可上传 ${MAX_IMAGE_COUNT} 张图片`);
            continue;
          }
          hasFile = true;
          const id = Date.now().toString() + Math.random();
          setAttachedFiles(prev => [...prev, {
            id, type: 'image',
            name: `粘贴图片 ${prev.filter(f => f.type === 'image').length + 1}`,
            loading: true,
          }]);
          const url = URL.createObjectURL(file);
          setTimeout(() => {
            setAttachedFiles(prev => prev.map(f => f.id === id ? { ...f, url, loading: false } : f));
            toast('图片已粘贴添加');
          }, 600 + Math.random() * 400);
        }
      } else if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file && !file.type.startsWith('image/')) {
          if (!isSupportedDocument(file)) {
            toast('附件仅支持 PDF、Word 和 MD 格式');
            continue;
          }
          if (file.size > MAX_DOCUMENT_FILE_SIZE_MB * BYTES_PER_MB) {
            toast(`文档大小不能超过 ${MAX_DOCUMENT_FILE_SIZE_MB}MB`);
            continue;
          }
          if (attachedFiles.filter(f => f.type === 'document').length >= MAX_DOCUMENT_COUNT) {
            toast(`最多可上传 ${MAX_DOCUMENT_COUNT} 个附件`);
            continue;
          }
          hasFile = true;
          const id = Date.now().toString() + Math.random();
          setAttachedFiles(prev => [...prev, { id, type: 'document', name: file.name, loading: true }]);
          setTimeout(() => {
            setAttachedFiles(prev => prev.map(f => f.id === id ? { ...f, loading: false } : f));
            toast(`文件 "${file.name}" 已粘贴添加`);
          }, 800 + Math.random() * 600);
        }
      }
    }

    if (hasFile) e.preventDefault();
  };

  const removeAttachedFile = (id: string) => {
    setAttachedFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.url) {
        URL.revokeObjectURL(file.url);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleSendWithFiles = () => {
    handleSend();
  };

  const moveAttachedFile = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    setAttachedFiles(prev => {
      const fromIndex = prev.findIndex(file => file.id === fromId);
      const toIndex = prev.findIndex(file => file.id === toId);
      if (fromIndex < 0 || toIndex < 0) return prev;
      if (prev[fromIndex].type !== prev[toIndex].type) {
        toast('图片和文档需分别排序');
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const getDocumentStyle = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') {
      return { label: 'PDF', color: '#DC2626', background: '#FEF2F2', border: '#FECACA' };
    }
    if (ext === 'doc' || ext === 'docx') {
      return { label: 'DOC', color: '#2563EB', background: '#EFF6FF', border: '#BFDBFE' };
    }
    if (ext === 'md') {
      return { label: 'MD', color: '#7C3AED', background: '#F5F3FF', border: '#DDD6FE' };
    }
    return { label: 'FILE', color: '#64748B', background: '#F8FAFC', border: '#E2E8F0' };
  };

  const renderAttachmentItem = (file: AttachedFile, orderIndex: number) => (
    (() => {
      const docStyle = file.type === 'document' ? getDocumentStyle(file.name) : null;
      return (
        <div
          key={file.id}
          draggable={!file.loading}
          onDragStart={() => { dragFileIdRef.current = file.id; }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (dragFileIdRef.current) moveAttachedFile(dragFileIdRef.current, file.id);
            dragFileIdRef.current = null;
          }}
          onDragEnd={() => { dragFileIdRef.current = null; }}
          onMouseEnter={() => setHoveredFileId(file.id)}
          onMouseLeave={() => setHoveredFileId(prev => prev === file.id ? null : prev)}
          onClick={() => {
            if (!file.loading && file.type === 'image' && file.url) {
              setPreviewImage(file);
            }
          }}
          title={file.type === 'image' ? '拖动可调整图片顺序，点击预览' : '拖动可调整文档顺序'}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: file.type === 'image' ? 'center' : 'flex-start',
            gap: 7,
            padding: file.type === 'image' ? 0 : '7px 8px',
            background: docStyle?.background || '#F8FAFE',
            borderRadius: 8,
            border: `1px solid ${docStyle?.border || '#E2E8F0'}`,
            overflow: 'hidden',
            cursor: file.loading ? 'default' : file.type === 'image' ? 'zoom-in' : 'grab',
            width: file.type === 'image' ? 64 : 132,
            height: 64,
            boxSizing: 'border-box',
          }}
        >
          {!file.loading && hoveredFileId === file.id && (
            <span style={styles.orderBadge}>{orderIndex + 1}</span>
          )}
          {file.loading ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '100%', height: '100%',
            }}>
              <div style={{
                width: 18, height: 18, border: '2px solid #E2E8F0',
                borderTopColor: 'var(--agent-primary)', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
            </div>
          ) : file.type === 'image' && file.url ? (
            <img src={file.url} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <>
              <span style={{
                ...styles.documentTypeBadge,
                color: docStyle?.color,
                borderColor: docStyle?.border,
                background: '#FFFFFF',
              }}>
                {docStyle?.label}
              </span>
              <span style={styles.documentName}>{file.name}</span>
            </>
          )}
          {!file.loading && hoveredFileId === file.id && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeAttachedFile(file.id);
              }}
              style={{
                position: 'absolute', top: 2, right: 2,
                width: 16, height: 16, borderRadius: '50%',
                background: 'rgba(0,0,0,0.5)', border: 'none',
                color: '#fff', fontSize: 10, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          )}
        </div>
      );
    })()
  );

  return (
    <>
      <style>{HOVER_CSS}</style>
      <input ref={imageInputRef} type="file" accept=".png,.jpg,.jpeg,.gif,image/png,image/jpeg,image/gif" multiple hidden onChange={handleImageSelect} />
      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown,text/plain" multiple hidden onChange={handleFileSelect} />
      <div className={`agent-chat-input-wrapper ${centered ? 'is-centered' : 'is-bottom'}`} style={centered ? styles.wrapperCentered : styles.wrapperBottom}>
        <div
          className="agent-chat-input-shell"
          onDragEnter={(e) => {
            if (Array.from(e.dataTransfer.types).includes('Files')) {
              e.preventDefault();
              setIsDraggingFiles(true);
            }
          }}
          onDragOver={(e) => {
            if (Array.from(e.dataTransfer.types).includes('Files')) {
              e.preventDefault();
              setIsDraggingFiles(true);
            }
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setIsDraggingFiles(false);
            }
          }}
          onDrop={(e) => {
            if (e.dataTransfer.files.length === 0) return;
            e.preventDefault();
            setIsDraggingFiles(false);
            handleDropUpload(Array.from(e.dataTransfer.files));
          }}
          style={{
            ...styles.container,
            ...(centered ? styles.containerCentered : {}),
            border: isDraggingFiles
              ? '2px dashed var(--agent-primary)'
              : isInputHighlighted ? '2px solid transparent' : '1px solid transparent',
            background: isDraggingFiles
              ? 'linear-gradient(#FFFFFF, #FFFFFF) padding-box, var(--agent-gradient) border-box'
              : isInputHighlighted
                ? 'linear-gradient(#FFFFFF, #FFFFFF) padding-box, var(--agent-gradient) border-box'
                : 'linear-gradient(#FFFFFF, #FFFFFF) padding-box, var(--agent-gradient) border-box',
            boxShadow: isInputHighlighted
              ? '0 10px 28px var(--agent-focus-ring-strong)'
              : '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          {isDraggingFiles && (
            <div style={styles.dragHint}>松开即可上传图片、PDF、Word 或 MD 材料</div>
          )}
          {lockedAttachments.length > 0 && (
            <div style={styles.lockedAttachmentList}>
              {lockedAttachments.map(file => (
                <div key={file.id} style={styles.lockedAttachmentItem} title="该 HTML 作为同款参考随需求发送，不可打开、不可下载">
                  <HtmlTypeBadge size="mini" />
                  <span style={styles.lockedAttachmentBody}>
                    <span style={styles.lockedAttachmentName}>{file.name}</span>
                    <span style={styles.lockedAttachmentMeta}>原课件 HTML 参考 · 已锁定</span>
                  </span>
                </div>
              ))}
            </div>
          )}
          {/* 已上传文件预览区 */}
          {attachedFiles.length > 0 && (
            <div style={styles.attachmentGroups}>
              {imageFiles.length > 0 && (
                <div style={styles.attachmentGroup}>
                  {documentFiles.length > 0 && (
                    <div style={styles.attachmentGroupLabel}>图片素材</div>
                  )}
                  <div style={styles.attachmentTray}>
                    {imageFiles.map((file, index) => renderAttachmentItem(file, index))}
                  </div>
                </div>
              )}
              {documentFiles.length > 0 && (
                <div style={styles.attachmentGroup}>
                  {imageFiles.length > 0 && (
                    <div style={styles.attachmentGroupLabel}>文档材料</div>
                  )}
                  <div style={styles.attachmentTray}>
                    {documentFiles.map((file, index) => renderAttachmentItem(file, index))}
                  </div>
                </div>
              )}
            </div>
          )}

          {teachingAttachments.length > 0 && (
            <div className="aug-teaching-attachment-list">
              {teachingAttachments.map(attachment => {
                const source = attachment.teachingSource!;
                const SourceIcon = source.type === 'question-bank' ? Database : source.type === 'word-book' ? BookOpenText : Presentation;
                const countLabel = source.type === 'question-bank'
                  ? `已选 ${source.itemCount} 题`
                  : source.type === 'word-book'
                    ? `已选 ${source.itemCount} 个单词`
                    : `已选 ${source.itemCount} 页`;
                const sourceMeta = source.type === 'cloud-pages'
                  ? `${source.sourceLabel} · ${source.summary}`
                  : `${source.sourceLabel} · ${source.summary.replace(/\s*·\s*已选\s*\d+\s*(?:题|个单词)\s*$/, '')}`;
                return (
                  <div
                    key={attachment.id}
                    className={`aug-teaching-attachment aug-teaching-attachment-${source.type}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setEditingTeachingAttachment(attachment)}
                    onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') setEditingTeachingAttachment(attachment); }}
                  >
                    <span className="aug-teaching-attachment-icon"><SourceIcon size={18} strokeWidth={1.9} /></span>
                    <span className="aug-teaching-attachment-body">
                      <b>{source.name}</b>
                      <small>{sourceMeta}</small>
                      <em>{countLabel}</em>
                    </span>
                    <span className="aug-teaching-attachment-actions">
                      <button type="button" onClick={event => { event.stopPropagation(); removeTeachingAttachment(attachment.id); }} aria-label={`移除${source.name}`}><X size={15} /></button>
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {appliedInspirationDraft && (
            <div style={styles.structuredDraftPanel}>
              <div style={styles.structuredDraftTop}>
                <div style={styles.structuredDraftLabel}>
                  <Sparkles size={14} />
                  基于模板生成
                </div>
                <div style={styles.structuredDraftHint}>先写清楚你的需求，已选模板会自动带入；切换或移除模板，都不会覆盖这里填写的内容和已上传材料。</div>
              </div>
              <div style={styles.structuredFieldLabel}>
                <span style={styles.structuredFieldName}>你的需求</span>
                <span style={styles.structuredRequired}>请填写</span>
              </div>
              <textarea
                ref={textareaRef}
                value={appliedInspirationDraft.demand}
                onChange={(event) => {
                  const next = buildAppliedInspirationDraft(text, event.target.value);
                  setText(next);
                  onTextChange?.(next);
                }}
                placeholder={HOMEPAGE_INPUT_PLACEHOLDER}
                disabled={disabled}
                rows={centered ? 2 : 3}
                style={styles.teachingContentTextarea}
              />
              <div style={styles.appliedPlaywayCard}>
                <div style={styles.appliedPlaywayHeader}>
                  <div style={styles.appliedPlaywayTitleGroup}>
                    <span style={styles.appliedPlaywayName}>已套用：{appliedInspirationDraft.playwayName}</span>
                    <span style={styles.appliedPlaywayMeta}>
                      {formatAppliedPlaywayMeta(appliedInspirationDraft.playwayType, appliedInspirationDraft.ageRange)}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      const next = appliedInspirationDraft.demand;
                      setText(next);
                      onTextChange?.(next);
                    }}
                    style={styles.clearAppliedPlaywayButton}
                    aria-label="移除已套用模板"
                  >
                    <X size={12} />
                    移除模板
                  </button>
                </div>
                <div style={styles.appliedPlaywayBody}>
                  <div style={styles.appliedPlaywayFlow}>{formatDraftFlow(appliedInspirationDraft.flow)}</div>
                </div>
                <div style={styles.appliedPlaywayHintRow}>
                  <div style={styles.appliedPlaywayHint}>改编建议：{appliedInspirationDraft.adaptation}</div>
                </div>
              </div>
              <div style={styles.promptPreviewBox}>
                <button
                  type="button"
                  onClick={() => setIsDraftPromptOpen(prev => !prev)}
                  style={styles.promptPreviewToggle}
                >
                  <span>模板说明</span>
                  <span style={styles.promptPreviewMeta}>这是当前模板的原始说明，生成时会结合你的需求自动改写成新课件</span>
                  {isDraftPromptOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
                {isDraftPromptOpen && (
                  <div style={styles.promptTemplateContent}>
                    <MarkdownPromptPreview text={draftPromptPreview} />
                  </div>
                )}
              </div>
            </div>
          )}

          {!appliedInspirationDraft && (
            <div className="agent-chat-input-textarea-wrap" style={styles.textareaWrap}>
              {shouldShowHomepageExamples && (
                <div style={styles.rotatingPlaceholder} aria-hidden="true">
                  <div
                    style={{
                      ...styles.rotatingPlaceholderTrack,
                      transform: `translateY(-${placeholderIndex * 24}px)`,
                      transition: placeholderAnimating ? 'transform 0.36s ease' : 'none',
                    }}
                  >
                    {HOMEPAGE_PLACEHOLDER_LOOP.map((example, index) => (
                      <div key={`${example}-${index}`} style={styles.rotatingPlaceholderItem}>{example}</div>
                    ))}
                  </div>
                </div>
              )}
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  onTextChange?.(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={materialUsagePlaceholder}
                disabled={disabled}
                rows={3}
                style={{
                  ...styles.textarea,
                  ...(centered ? styles.textareaCentered : {}),
                }}
              />
            </div>
          )}

          <div className="agent-chat-input-toolbar" style={styles.toolbar}>
            <div className="aug-chat-tool-group" style={styles.toolGroup}>
              <button
                type="button"
                className="ci-icon-btn"
                style={styles.iconBtn}
                disabled={disabled}
                onClick={handleImageUpload}
                aria-label="上传图片"
              >
                <ImagePlus size={19} />
              </button>
              <button
                type="button"
                className="ci-icon-btn"
                style={styles.iconBtn}
                disabled={disabled}
                onClick={handleFileUpload}
                aria-label="上传附件"
              >
                <Paperclip size={19} />
              </button>
              <TeachingContentPicker
                key={editingTeachingAttachment?.id || 'new-teaching-content'}
                disabled={disabled}
                hasSelection={teachingAttachments.length > 0}
                onAdd={attachment => setTeachingAttachments(previous => [...previous, attachment])}
                editAttachment={editingTeachingAttachment}
                onUpdate={updateTeachingAttachment}
                onEditEnd={() => setEditingTeachingAttachment(null)}
              />

              <span className="aug-toolbar-divider" />
              <GenerationPreferencePicker
                value={generationPreferences}
                onChange={setGenerationPreferences}
                prompt={text}
                disabled={disabled}
              />

              {isEmbedded && (
                <button
                  className="ci-icon-btn"
                  style={styles.iconBtn}
                  onClick={() => setLinkModalOpen(true)}
                  title="关联课件"
                >
                  <Link size={20} />
                </button>
              )}
            </div>

            {isGenerating ? (
              <div style={{ position: 'relative' }}
                onMouseEnter={() => setStopTooltip(true)}
                onMouseLeave={() => setStopTooltip(false)}
              >
                {stopTooltip && (
                  <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: 6,
                    padding: '5px 10px',
                    background: 'rgba(0,0,0,0.75)',
                    color: '#fff',
                    fontSize: 12,
                    borderRadius: 6,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                  }}>停止输出</div>
                )}
                <button
                  style={{
                    ...styles.sendBtn,
                    background: 'var(--agent-hero-gradient)',
                    cursor: 'pointer',
                  }}
                  onClick={onStop}
                  title="停止输出"
                  aria-label="停止输出"
                >
                  <Square size={14} color="#FFFFFF" fill="#FFFFFF" />
                </button>
              </div>
            ) : (
              <button
                style={{
                  ...styles.sendBtn,
                  background: canSend ? 'var(--agent-hero-gradient)' : '#CBD5E1',
                  cursor: canSend ? 'pointer' : 'not-allowed',
                }}
                disabled={!canSend}
                onClick={() => handleSendWithFiles()}
                title="发送"
                aria-label="发送"
              >
                <SendHorizontal size={18} color="#FFFFFF" />
              </button>
            )}
          </div>
        </div>

        {shouldShowHomepagePromptChips && (
          <div className="agent-home-prompt-row" style={styles.homepagePromptRow}>
            <span className="agent-home-prompt-label" style={styles.homepagePromptLabel}>试试这些</span>
            <div className="agent-home-prompt-chips" style={styles.homepagePromptChips}>
              {homepagePromptChips.map(item => (
                <button
                  key={item}
                  type="button"
                  disabled={disabled}
                  className="agent-home-prompt-chip"
                  style={styles.homepagePromptChip}
                  onClick={() => applyHomepagePromptChip(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={disabled}
              className="agent-home-prompt-refresh"
              style={styles.homepagePromptRefresh}
              onClick={switchHomepagePromptGroup}
            >
              <RotateCw size={16} />
              换一换
            </button>
          </div>
        )}
      </div>

      {/* 关联课件回显 */}
      {isEmbedded && linkedCoursewareCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', marginTop: 6,
          fontSize: 12, color: 'var(--agent-primary)', fontWeight: 500,
        }}>
          <Link size={13} />
          已关联 {linkedCoursewareCount} 个课件页面
        </div>
      )}

      {/* 关联课件弹窗 */}
      {linkModalOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)',
          }}
          onClick={() => setLinkModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 12, overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              maxWidth: 960, width: '95%',
              maxHeight: '90vh',
              display: 'flex', flexDirection: 'column',
            }}
          >
            <div style={{ flex: 1, overflow: 'auto' }}>
              <img
                src="/editor-assets/课件关联弹窗.png"
                alt="关联课件"
                style={{ width: '100%', display: 'block' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 16px', borderTop: '1px solid #E2E8F0' }}>
              <button
                onClick={() => setLinkModalOpen(false)}
                style={{
                  padding: '7px 20px', borderRadius: 6, border: '1px solid #E2E8F0',
                  background: '#fff', color: '#64748B', fontSize: 13, cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={() => {
                  setLinkedCoursewareCount(3);
                  setLinkModalOpen(false);
                  toast('已关联 3 个课件页面');
                }}
                style={{
                  padding: '7px 20px', borderRadius: 6, border: 'none',
                  background: 'var(--agent-action-gradient)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                确认关联
              </button>
            </div>
          </div>
        </div>
      )}

      {previewImage?.url && createPortal(
        <div style={styles.previewMask} onClick={() => setPreviewImage(null)}>
          <div style={styles.previewDialog} onClick={e => e.stopPropagation()}>
            <img src={previewImage.url} alt={previewImage.name} style={styles.previewImage} />
            <div style={styles.previewFooter}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{previewImage.name}</span>
              <button onClick={() => setPreviewImage(null)} style={styles.previewClose}>关闭</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapperCentered: {
    width: '100%',
    maxWidth: HOMEPAGE_CONTENT_MAX_WIDTH,
    margin: '0 auto',
  },
  wrapperBottom: {
    width: '100%',
  },
  container: {
    background: '#FFFFFF',
    borderRadius: 16,
    border: '1px solid #E2E8F0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    padding: '20px 24px 16px',
    minWidth: 320,
    transition: 'border 0.15s, background 0.15s, box-shadow 0.15s',
  },
  containerCentered: {
    padding: '16px 24px 13px',
  },
  homepagePromptRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginTop: 19,
  },
  homepagePromptLabel: {
    color: '#718096',
    fontSize: 14,
    fontWeight: 400,
    whiteSpace: 'nowrap',
  },
  homepagePromptChips: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
    flex: '1 1 560px',
    minWidth: 0,
  },
  homepagePromptChip: {
    height: 36,
    padding: '0 20px',
    border: 'none',
    borderRadius: 18,
    background: 'rgba(15, 23, 42, 0.035)',
    color: '#66768E',
    fontSize: 14,
    fontWeight: 400,
    boxShadow: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease',
  },
  homepagePromptRefresh: {
    height: 28,
    marginLeft: 'auto',
    padding: 0,
    borderRadius: 999,
    border: 'none',
    background: 'transparent',
    color: '#718096',
    fontSize: 13,
    fontWeight: 400,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: 'none',
    flexShrink: 0,
    transition: 'background 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease',
  },
  dragHint: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    marginBottom: 10,
    borderRadius: 10,
    background: 'var(--agent-soft-strong)',
    color: 'var(--agent-primary-text)',
    fontSize: 13,
    fontWeight: 700,
  },
  attachmentGroups: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
    padding: '2px 0 8px',
    marginBottom: 2,
  },
  lockedAttachmentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    paddingBottom: 10,
  },
  lockedAttachmentItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid var(--agent-border)',
    background: 'linear-gradient(135deg, var(--agent-soft), #EFF6FF)',
    cursor: 'default',
  },
  lockedAttachmentIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--agent-primary-text)',
    background: 'var(--agent-soft-strong)',
    flexShrink: 0,
  },
  lockedAttachmentBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
    flex: 1,
  },
  lockedAttachmentName: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: 850,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  lockedAttachmentMeta: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: 650,
  },
  lockedBadge: {
    flexShrink: 0,
    height: 24,
    padding: '0 8px',
    borderRadius: 999,
    background: '#FFFFFF',
    color: 'var(--agent-secondary-text)',
    border: '1px solid var(--agent-border)',
    fontSize: 11,
    fontWeight: 850,
    lineHeight: '24px',
  },
  attachmentGroup: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    minWidth: 0,
  },
  attachmentGroupLabel: {
    height: 22,
    padding: '0 7px',
    borderRadius: 999,
    background: '#F1F5F9',
    color: '#64748B',
    fontSize: 11,
    fontWeight: 700,
    lineHeight: '22px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    marginTop: 4,
  },
  attachmentTray: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  documentTypeBadge: {
    width: 34,
    height: 22,
    borderRadius: 5,
    border: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 0,
    flexShrink: 0,
  },
  documentName: {
    flex: 1,
    minWidth: 0,
    color: '#334155',
    fontSize: 12,
    fontWeight: 600,
    lineHeight: '16px',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    wordBreak: 'break-all',
  },
  orderBadge: {
    position: 'absolute',
    left: 3,
    top: 3,
    minWidth: 16,
    height: 16,
    padding: '0 4px',
    borderRadius: 999,
    background: 'rgba(15, 23, 42, 0.62)',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 700,
    lineHeight: '16px',
    textAlign: 'center',
    zIndex: 2,
    pointerEvents: 'none',
  },
  textareaWrap: {
    position: 'relative',
    width: '100%',
  },
  rotatingPlaceholder: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    height: 24,
    overflow: 'hidden',
    color: '#94A3B8',
    fontSize: 15,
    lineHeight: '24px',
    pointerEvents: 'none',
    zIndex: 1,
  },
  rotatingPlaceholderTrack: {
    display: 'flex',
    flexDirection: 'column',
  },
  rotatingPlaceholderItem: {
    height: 24,
    lineHeight: '24px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  textarea: {
    width: '100%',
    border: 'none',
    outline: 'none',
    fontSize: 15,
    lineHeight: 1.5,
    resize: 'none' as const,
    background: 'transparent',
    color: '#1E293B',
    overflowY: 'hidden',
  },
  textareaCentered: {
    minHeight: 56,
  },
  textareaWithStructuredDraft: {
    marginTop: 10,
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px dashed #CBD5E1',
    background: '#F8FAFC',
    color: '#64748B',
    fontSize: 13,
    lineHeight: 1.55,
  },
  structuredDraftPanel: {
    display: 'grid',
    gap: 9,
    marginBottom: 10,
    padding: 14,
    borderRadius: 12,
    border: '1px solid var(--agent-border)',
    background: 'linear-gradient(135deg, var(--agent-soft-strong), #FFFFFF 78%)',
  },
  structuredDraftTop: {
    display: 'grid',
    gap: 4,
  },
  structuredDraftLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    width: 'fit-content',
    padding: '4px 9px',
    borderRadius: 10,
    background: '#FFFFFF',
    color: 'var(--agent-primary-text)',
    border: '1px solid var(--agent-border)',
    fontSize: 13,
    fontWeight: 900,
  },
  structuredDraftHint: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 1.45,
  },
  structuredFieldLabel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 2,
  },
  structuredFieldName: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: 900,
  },
  structuredRequired: {
    padding: '2px 7px',
    borderRadius: 8,
    background: 'var(--agent-action-soft)',
    color: 'var(--agent-action-text)',
    fontSize: 11,
    fontWeight: 850,
  },
  teachingContentTextarea: {
    width: '100%',
    minHeight: 92,
    padding: '12px 13px',
    borderRadius: 10,
    border: '1px solid var(--agent-border)',
    outline: 'none',
    background: '#FFFFFF',
    color: '#0F172A',
    fontSize: 15,
    lineHeight: 1.55,
    resize: 'vertical' as const,
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.72)',
  },
  appliedPlaywayCard: {
    padding: 10,
    borderRadius: 10,
    background: '#FFFFFF',
    border: '1px solid var(--agent-border)',
  },
  appliedPlaywayHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  appliedPlaywayTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
    flex: 1,
    flexWrap: 'wrap' as const,
  },
  appliedPlaywayName: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: 900,
  },
  appliedPlaywayMeta: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: 750,
    whiteSpace: 'nowrap',
  },
  clearAppliedPlaywayButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 26,
    padding: '0 9px',
    borderRadius: 9,
    border: '1px solid #BFE9F5',
    background: '#F1FAFF',
    color: 'var(--agent-primary-text)',
    fontSize: 12,
    fontWeight: 850,
    cursor: 'pointer',
    flexShrink: 0,
    marginLeft: 'auto',
  },
  appliedPlaywayBody: {
    marginTop: 4,
  },
  appliedPlaywayFlow: {
    color: 'var(--agent-primary-text)',
    fontSize: 12,
    fontWeight: 850,
    lineHeight: 1.5,
  },
  appliedPlaywayHint: {
    minWidth: 0,
    flex: 1,
    color: '#64748B',
    fontSize: 12,
    lineHeight: 1.45,
  },
  appliedPlaywayHintRow: {
    marginTop: 5,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  promptPreviewBox: {
    borderRadius: 10,
    border: '1px solid #E2E8F0',
    background: 'rgba(255,255,255,0.78)',
    overflow: 'hidden',
  },
  promptPreviewToggle: {
    width: '100%',
    minHeight: 38,
    padding: '0 11px',
    border: 'none',
    background: 'transparent',
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
    alignItems: 'center',
    gap: 8,
    color: '#334155',
    fontSize: 12,
    fontWeight: 850,
    cursor: 'pointer',
    textAlign: 'left' as const,
  },
  promptPreviewMeta: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: 650,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  markdownPreviewText: {
    maxHeight: 'none',
    overflowY: 'visible' as const,
    padding: '10px 12px 12px',
    color: '#334155',
    fontSize: 12,
    lineHeight: 1.55,
    fontFamily: 'inherit',
  },
  promptTemplateContent: {
    borderTop: '1px solid #E2E8F0',
    maxHeight: 260,
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
  },
  markdownH1: {
    margin: '0 0 8px',
    color: '#0F172A',
    fontSize: 16,
    lineHeight: 1.3,
    fontWeight: 950,
  },
  markdownH2: {
    margin: '10px 0 6px',
    color: '#0F172A',
    fontSize: 14,
    lineHeight: 1.35,
    fontWeight: 950,
  },
  markdownH3: {
    margin: '9px 0 5px',
    color: '#0F172A',
    fontSize: 13,
    lineHeight: 1.35,
    fontWeight: 900,
  },
  markdownH4: {
    margin: '8px 0 4px',
    color: '#0F172A',
    fontSize: 12,
    lineHeight: 1.35,
    fontWeight: 900,
  },
  markdownParagraph: {
    margin: '0 0 8px',
    color: '#475569',
    fontSize: 12,
    lineHeight: 1.62,
  },
  markdownQuote: {
    margin: '0 0 8px',
    padding: '8px 10px',
    borderRadius: 9,
    borderLeft: '3px solid var(--agent-primary)',
    background: 'rgba(14, 165, 156, 0.08)',
    color: '#334155',
    fontSize: 12,
    lineHeight: 1.6,
    fontStyle: 'normal',
  },
  markdownList: {
    margin: '0 0 8px',
    paddingLeft: 18,
    color: '#475569',
    fontSize: 12,
    lineHeight: 1.58,
  },
  markdownListItem: {
    margin: '2px 0',
  },
  markdownCodeBlock: {
    margin: '0 0 8px',
    padding: '9px 10px',
    borderRadius: 9,
    background: '#0F172A',
    color: '#E2E8F0',
    overflowX: 'auto' as const,
    whiteSpace: 'pre-wrap' as const,
    fontSize: 11,
    lineHeight: 1.55,
    fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  markdownInlineCode: {
    padding: '1px 4px',
    borderRadius: 5,
    background: '#F1F5F9',
    color: '#0F766E',
    fontSize: 11,
    fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  markdownHr: {
    margin: '10px 0',
    border: 'none',
    borderTop: '1px solid #E2E8F0',
  },
  markdownTableWrap: {
    margin: '0 0 8px',
    overflowX: 'auto' as const,
    border: '1px solid #E2E8F0',
    borderRadius: 9,
    background: '#FFFFFF',
  },
  markdownTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: 11,
    lineHeight: 1.45,
  },
  markdownTh: {
    padding: '7px 8px',
    background: '#F8FAFC',
    color: '#0F172A',
    fontWeight: 900,
    textAlign: 'left' as const,
    borderBottom: '1px solid #E2E8F0',
    whiteSpace: 'nowrap' as const,
  },
  markdownTd: {
    padding: '7px 8px',
    color: '#475569',
    borderTop: '1px solid #EEF2F7',
    verticalAlign: 'top' as const,
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  toolGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  tooltipAnchor: {
    position: 'relative',
    display: 'inline-flex',
  },
  uploadTooltip: {
    position: 'absolute',
    left: 0,
    bottom: 40,
    zIndex: 30,
    width: 190,
    padding: '9px 11px',
    borderRadius: 9,
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(15, 23, 42, 0.94)',
    color: '#FFFFFF',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.18)',
    backdropFilter: 'blur(10px)',
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.7,
    pointerEvents: 'none',
    whiteSpace: 'normal',
  },
  uploadTooltipArrow: {
    position: 'absolute',
    left: 16,
    bottom: -5,
    width: 10,
    height: 10,
    background: 'rgba(15, 23, 42, 0.94)',
    transform: 'rotate(45deg)',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  iconBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 8,
    background: 'none',
    border: 'none',
    color: '#64748B',
    cursor: 'pointer',
    transition: 'color 0.15s, background 0.15s',
  },
  sendBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 10,
    border: 'none',
    boxShadow: '0 8px 18px var(--agent-shadow)',
    transition: 'background 0.15s, transform 0.15s',
  },
  previewMask: {
    position: 'fixed',
    inset: 0,
    zIndex: 24000,
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
    flexShrink: 0,
  },
};

export default ChatInput;
