import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  FileCode2,
  Image,
  Paperclip,
  Link,
  SendHorizontal,
  Sparkles,
  Square,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import type { UploadedAttachment } from '../../types';
import { FRUIT_COURSEWARE_PROMPT, isFruitCoursewarePrompt } from '../../data/fruitCoursewarePrompt';

interface ChatInputProps {
  onSend: (text: string, attachments?: UploadedAttachment[]) => void;
  disabled?: boolean;
  isGenerating?: boolean;
  onStop?: () => void;
  centered?: boolean;
  placeholder?: string;
  injectedText?: string;
  injectedTextVersion?: number;
  onTextChange?: (text: string) => void;
  lockedAttachments?: UploadedAttachment[];
}

const LINE_HEIGHT = 22.5;
const MAX_LINES = 5;
const MAX_HEIGHT = LINE_HEIGHT * MAX_LINES;
const MAX_IMAGE_COUNT = 10;
const MAX_DOCUMENT_COUNT = 10;
const SUPPORTED_DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'md'];

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

const parseAppliedInspirationDraft = (value: string) => {
  const match = value.match(/^教学内容：([\s\S]*?)\n\n<已套用玩法>\n([\s\S]*?)\n<\/已套用玩法>$/);
  if (!match) return null;
  const body = match[2];
  const pick = (label: string) => body.match(new RegExp(`${label}：([^\\n]+)`))?.[1]?.trim() || '';
  const section = (label: string, nextLabel: string) => {
    const result = body.match(new RegExp(`${label}：\\n([\\s\\S]*?)\\n\\n${nextLabel}：`));
    return result?.[1]?.trim() || '';
  };
  const prompt = body.match(/玩法要求：\n([\s\S]*?)\n\n(?:本次生成要求|生成要求)：/)?.[1]?.trim() || '';
  return {
    teachingContent: match[1].trim(),
    playwayName: pick('玩法名称'),
    playwayType: pick('玩法类型'),
    ageRange: pick('适用年龄'),
    suitableFor: pick('适合内容'),
    flow: section('课堂互动流程', '可替换内容'),
    replaceable: section('可替换内容', '玩法要求'),
    prompt,
  };
};

const buildAppliedInspirationDraft = (
  currentText: string,
  nextTeachingContent: string,
) => currentText.replace(
  /^教学内容：[\s\S]*?\n\n<已套用玩法>/,
  `教学内容：${nextTeachingContent}\n\n<已套用玩法>`,
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

const getSmartCompletion = (value: string) => {
  const text = value.trim();
  if (text.length < 4) return null;
  if (
    text.length > 90
    || /已套用玩法|互动流程|答对时|答错时|整体视觉|课件分为|采用“|采用"/.test(text)
  ) {
    return null;
  }
  if (isFruitCoursewarePrompt(text)) {
    return {
      title: '可以补全成水果乐园互动课件',
      text: '补齐9页课件结构、认读练、语音评测、抓取匹配游戏和低龄视觉要求',
      finalText: FRUIT_COURSEWARE_PROMPT,
    };
  }
  if (/颜色|color|colour/i.test(text)) {
    const finalText = `${text}\n\n学习对象：5-8 岁英语启蒙或小学低段学生，适合课堂投屏、平板点击或白板互动。\n教学目标：让学生能听懂、认读并匹配常见颜色英文单词，在多轮操作中完成颜色词巩固。\n生成设置：单关卡学练融合，练习模式，允许多次尝试；默认采用明亮卡片风，保留大按钮、大色块和清晰反馈，不启用 3D 粘土质感。\n课堂玩法：彩虹修复师 + 单词图片配对。学生听到或看到颜色英文单词后，选择正确颜色卡，并拖到彩虹缺口完成修复。\n互动流程：展示任务说明 → 播放颜色单词 → 选择颜色卡 → 拖到彩虹缺口 → 自动校验 → 点亮彩虹 → 播放英文发音 → 获得星星奖励 → 进入下一轮。\n题目与关卡：围绕 red、blue、yellow、green、orange、purple 设计 3 轮递进；第 1 轮看英文选颜色，第 2 轮听发音选颜色，第 3 轮多个颜色混合挑战。\n画面与反馈：彩虹位于画面中心，颜色卡片放在底部，答对时彩虹缺口点亮并朗读单词，连续答对出现星星连击；答错时正确颜色边缘轻闪，不直接公布答案，允许再次尝试。\n生成注意事项：不要做成单纯选择题；要有拖拽、点亮和发音反馈；题目区、操作区、奖励区要清晰分层，适合老师课堂演示。`;
    return {
      title: '可以补全成颜色互动玩法',
      text: '补齐学习对象、教学目标、3轮题目、拖拽流程、发音反馈',
      finalText,
    };
  }
  if (/口算|计算|加减法|20以内|数学/.test(text)) {
    const finalText = `${text}\n\n学习对象：小学一年级到二年级学生，适合课堂练习、课前热身或单元复习。\n教学目标：帮助学生提升 20 以内加减法的计算熟练度，能在即时反馈中发现并修正计算错误。\n生成设置：多关卡学练融合，练习模式，默认采用逻辑风格 + 轻竞技进度反馈；如用于测验，可把提交方式改为严格模式。\n课堂玩法：口算赛车。学生每答对一道题，赛车向前加速；连续答对触发连击加速，答错进入维修站并获得计算提示。\n互动流程：选择关卡 → 出现口算题 → 点击答案 → 赛车前进或进入维修提示 → 显示本题计算思路 → 完成一组题目 → 到达终点解锁下一关。\n题目与关卡：设计 3 关，每关 6-8 题；第 1 关 10 以内加减，第 2 关 20 以内不进退位，第 3 关 20 以内混合计算，可加入 1-2 道易错题。\n画面与反馈：题目在中央大字号展示，答案按钮最多 4 个；答对赛车前进并获得星星，连续 3 次答对触发加速动画；答错展示拆数、数轴或简单算式提示，允许重新选择。\n生成注意事项：竞技元素不能遮挡题目；不要设置过强倒计时压力；每道题都要有明确答案和轻量解析。`;
    return {
      title: '可以补全成闯关练习',
      text: '补齐年级目标、3关递进、错题提示、赛车进度反馈',
      finalText,
    };
  }
  if (/拼音|声母|韵母|b p m f|识字/.test(text)) {
    const finalText = `${text}\n\n学习对象：幼小衔接或一年级学生，适合拼音新授后的听辨练习。\n教学目标：帮助学生听辨目标拼音，并能在多个相近拼音中找到正确卡片，减少易混读音错误。\n生成设置：微关卡学练融合，练习模式，允许多次尝试；默认采用启蒙卡通风，卡片大、读音反馈清楚。\n课堂玩法：拼音捉迷藏。系统播放目标拼音读音，学生在场景中找到对应拼音卡片，点击后由卡片角色朗读确认。\n互动流程：播放读音 → 学生观察 3-4 张拼音卡 → 点击目标卡 → 自动校验 → 角色朗读 → 易混提示或奖励反馈 → 进入下一轮。\n题目与关卡：围绕 b、p、m、f 或老师输入的拼音设计 8 轮听辨题；前 4 轮单一声母辨认，后 4 轮加入易混声母对比。\n画面与反馈：拼音卡片放在场景中但不能过度隐藏；答对时卡片跳出并朗读，答错时给出口型、发音部位或读音对比提示。\n生成注意事项：不要把拼音卡做得太小；每轮只播放一个目标读音；反馈应鼓励学生再试一次，而不是直接判失败。`;
    return {
      title: '可以补全成听音寻找玩法',
      text: '补齐听辨目标、易混提示、8轮练习、卡片反馈',
      finalText,
    };
  }
  if (/古诗|诗句|排序|静夜思|背诵/.test(text)) {
    const finalText = `${text}\n\n学习对象：小学语文学生，适合古诗学习后的排序巩固和背诵前热身。\n教学目标：让学生理解诗句顺序和诗意线索，通过拖拽排序完成结构记忆，再衔接完整朗读。\n生成设置：单关卡学练融合，练习模式，允许拖拽调整；默认采用温和国风课堂风，诗句区优先清晰。\n课堂玩法：诗句小路排序。学生把打乱的诗句拖回正确顺序，每排对一句，小路、月光或进度点亮一步。\n互动流程：展示古诗标题 → 打乱诗句 → 学生拖拽排序 → 点击校验 → 正确诗句吸附并点亮进度 → 全部完成后展示整首诗 → 播放朗读并进入背诵挑战。\n题目与关卡：先生成一关诗句排序；可增加“关键词提示”模式，如明月、霜、举头、低头；也可增加第二轮去掉提示后的背诵排序。\n画面与反馈：诗句卡片使用大字号，拖动时有吸附感；排序正确时点亮月光路径，错误时提示相邻诗句关系，不直接打断操作。\n生成注意事项：不要把国风背景做得喧宾夺主；诗句必须完整准确；反馈要帮助学生理解顺序，而不是只给对错。`;
    return {
      title: '可以补全成排序互动',
      text: '补齐诗句排序、关键词提示、朗读巩固、国风反馈',
      finalText,
    };
  }
  const finalText = `${text}\n\n学习对象：默认面向小学阶段学生；如果老师输入中包含年龄、年级或学科，请优先按老师输入处理。\n教学目标：围绕老师输入的知识点，设计一节能直接用于课堂的互动课件，让学生在操作、反馈和复盘中完成理解与巩固。\n生成设置：单关卡学练融合，练习模式，允许多次尝试；默认采用清爽课堂风，后续可扩展为多关卡递进。\n课堂玩法：根据知识点自动匹配点击、拖拽、配对、排序、闯关或推理互动，不做单纯静态讲解页。\n互动流程：展示学习任务 → 给出操作规则 → 学生完成互动题 → 系统即时反馈 → 错误时给轻提示 → 完成挑战 → 展示总结或下一步练习。\n题目与关卡：先生成一组课堂可用题目，数量控制在 6-8 题；如果知识点适合递进，则拆成“认识规则、练习巩固、挑战应用”三段。\n画面与反馈：题目区、操作区、反馈区清晰分层；答对给进度、星星或点亮反馈；答错给提示并允许重试，避免只显示红叉。\n生成注意事项：不要生成空泛介绍页；必须包含明确可交互操作、答案校验、成功反馈和错误提示；按钮尺寸要适合课堂大屏。`;
  return {
    title: '可以让需求更完整',
    text: '补齐对象目标、互动玩法、题目数量、反馈和生成注意事项',
    finalText,
  };
};

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled,
  isGenerating,
  onStop,
  centered,
  placeholder = '输入修改意见或继续追问',
  injectedText,
  injectedTextVersion,
  onTextChange,
  lockedAttachments = [],
}) => {
  const appMode = useUIStore((s) => s.appMode);
  const linkedCoursewareCount = useUIStore((s) => s.linkedCoursewareCount);
  const setLinkedCoursewareCount = useUIStore((s) => s.setLinkedCoursewareCount);
  const isEmbedded = appMode === 'embedded';
  const [text, setText] = useState('');
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [hoveredFileId, setHoveredFileId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<AttachedFile | null>(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [isDraftPromptOpen, setIsDraftPromptOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const dragFileIdRef = useRef<string | null>(null);

  const [stopTooltip, setStopTooltip] = useState(false);

  const canSend = (text.trim().length > 0 || attachedFiles.some(f => !f.loading) || lockedAttachments.length > 0) && !disabled;
  const imageFiles = attachedFiles.filter(file => file.type === 'image');
  const documentFiles = attachedFiles.filter(file => file.type === 'document');
  const smartCompletionCandidate = getSmartCompletion(text);
  const smartCompletion = centered && smartCompletionCandidate && !text.includes(smartCompletionCandidate.text)
    ? smartCompletionCandidate
    : null;
  const appliedInspirationDraft = parseAppliedInspirationDraft(text);
  const draftPromptPreview = appliedInspirationDraft
    ? appliedInspirationDraft.prompt
    : '';

  const materialUsagePlaceholder = (() => {
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
    const maxHeight = appliedInspirationDraft ? 260 : MAX_HEIGHT;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [appliedInspirationDraft]);

  useEffect(() => {
    resizeTextarea();
  }, [text, resizeTextarea]);

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
    ];
    if ((!trimmed && readyAttachments.length === 0) || disabled) return;
    onSend(trimmed, readyAttachments);
    setText('');
    onTextChange?.('');
    setAttachedFiles([]);
  }, [text, attachedFiles, lockedAttachments, disabled, onSend, onTextChange]);

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

  const isSupportedDocument = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    return SUPPORTED_DOCUMENT_EXTENSIONS.includes(ext);
  };

  const addImageFiles = (files: File[]) => {
    const currentImageCount = attachedFiles.filter(f => f.type === 'image').length;
    const availableSlots = MAX_IMAGE_COUNT - currentImageCount;
    if (availableSlots <= 0) {
      toast(`最多可上传 ${MAX_IMAGE_COUNT} 张图片`);
      return;
    }
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    if (validFiles.length > availableSlots) {
      toast(`最多可上传 ${MAX_IMAGE_COUNT} 张图片，本次仅添加前 ${availableSlots} 张`);
    }
    validFiles.slice(0, availableSlots).forEach(file => {
      if (!file.type.startsWith('image/')) return;
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
    if (validFiles.length > availableSlots) {
      toast(`最多可上传 ${MAX_DOCUMENT_COUNT} 个附件，本次仅添加前 ${availableSlots} 个`);
    }
    validFiles.slice(0, availableSlots).forEach(file => {
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
          const ext = file.name.split('.').pop()?.toLowerCase() || '';
          if (!SUPPORTED_DOCUMENT_EXTENSIONS.includes(ext)) {
            toast('附件仅支持 PDF、Word 和 MD 格式');
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

  const applySmartCompletion = () => {
    if (!smartCompletion) return;
    const current = text.trim();
    const next = current.includes(smartCompletion.finalText)
      ? current
      : smartCompletion.finalText;
    setText(next);
    onTextChange?.(next);
    requestAnimationFrame(() => {
      resizeTextarea();
      textareaRef.current?.focus();
    });
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
      <input ref={imageInputRef} type="file" accept="image/*" multiple hidden onChange={handleImageSelect} />
      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown,text/plain" multiple hidden onChange={handleFileSelect} />
      <div style={centered ? styles.wrapperCentered : styles.wrapperBottom}>
        <div
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
            border: isDraggingFiles
              ? '2px dashed var(--agent-primary)'
              : isFocused ? '2px solid transparent' : '1px solid transparent',
            background: isDraggingFiles
              ? 'linear-gradient(#FFFFFF, #FFFFFF) padding-box, var(--agent-gradient) border-box'
              : isFocused
                ? 'linear-gradient(#FFFFFF, #FFFFFF) padding-box, var(--agent-gradient) border-box'
                : 'linear-gradient(#FFFFFF, #FFFFFF) padding-box, var(--agent-gradient) border-box',
            boxShadow: isFocused
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
                  <span style={styles.lockedAttachmentIcon}><FileCode2 size={15} /></span>
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

          {appliedInspirationDraft && (
            <div style={styles.structuredDraftPanel}>
              <div style={styles.structuredDraftTop}>
                <div style={styles.structuredDraftLabel}>
                  <Sparkles size={14} />
                  基于玩法生成
                </div>
                <div style={styles.structuredDraftHint}>先补充教学内容，已选玩法会自动带入；切换其他玩法时，只替换玩法，不覆盖这里填写的内容。</div>
              </div>
              <div style={styles.structuredFieldLabel}>
                <span style={styles.structuredFieldName}>教学内容</span>
                <span style={styles.structuredRequired}>请填写</span>
              </div>
              <textarea
                ref={textareaRef}
                value={appliedInspirationDraft.teachingContent}
                onChange={(event) => {
                  const next = buildAppliedInspirationDraft(text, event.target.value);
                  setText(next);
                  onTextChange?.(next);
                }}
                placeholder="例如：小学一年级英语，常见水果单词 apple、banana、orange..."
                disabled={disabled}
                rows={3}
                style={styles.teachingContentTextarea}
              />
              <div style={styles.appliedPlaywayCard}>
                <div style={styles.appliedPlaywayHeader}>
                  <span style={styles.appliedPlaywayName}>已套用：{appliedInspirationDraft.playwayName}</span>
                  <span style={styles.appliedPlaywayMeta}>
                    {formatAppliedPlaywayMeta(appliedInspirationDraft.playwayType, appliedInspirationDraft.ageRange)}
                  </span>
                </div>
                <div style={styles.appliedPlaywayFlow}>{formatDraftFlow(appliedInspirationDraft.flow)}</div>
                <div style={styles.appliedPlaywayHint}>可替换：{appliedInspirationDraft.replaceable}</div>
              </div>
              <div style={styles.promptPreviewBox}>
                <button
                  type="button"
                  onClick={() => setIsDraftPromptOpen(prev => !prev)}
                  style={styles.promptPreviewToggle}
                >
                  <span>生成提示词预览</span>
                  <span style={styles.promptPreviewMeta}>系统会自动带入，不需要手动修改</span>
                  {isDraftPromptOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
                {isDraftPromptOpen && (
                  <MarkdownPromptPreview text={draftPromptPreview} />
                )}
              </div>
            </div>
          )}

          {!appliedInspirationDraft && (
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
              style={styles.textarea}
            />
          )}

          {smartCompletion && !disabled && (
            <div style={styles.smartCompletion}>
              <div style={styles.smartCompletionIcon}>
                <Sparkles size={14} />
              </div>
              <div style={styles.smartCompletionContent}>
                <div style={styles.smartCompletionTitle}>{smartCompletion.title}</div>
                <div style={styles.smartCompletionText}>{smartCompletion.text}</div>
                <div style={styles.smartCompletionPreview}>采用后会整理成完整课件需求：对象目标、生成设置、互动流程、题目关卡、画面反馈和注意事项。</div>
              </div>
              <button type="button" style={styles.smartCompletionBtn} onClick={applySmartCompletion}>
                采用
              </button>
            </div>
          )}

          <div style={styles.toolbar}>
            <div style={styles.toolGroup}>
              <button
                className="ci-icon-btn"
                style={styles.iconBtn}
                onClick={handleImageUpload}
                title="上传图片"
              >
                <Image size={20} />
              </button>

              <button
                className="ci-icon-btn"
                style={styles.iconBtn}
                onClick={handleFileUpload}
                title="上传附件"
              >
                <Paperclip size={20} />
              </button>

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

      {previewImage?.url && (
        <div style={styles.previewMask} onClick={() => setPreviewImage(null)}>
          <div style={styles.previewDialog} onClick={e => e.stopPropagation()}>
            <img src={previewImage.url} alt={previewImage.name} style={styles.previewImage} />
            <div style={styles.previewFooter}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{previewImage.name}</span>
              <button onClick={() => setPreviewImage(null)} style={styles.previewClose}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapperCentered: {
    width: '100%',
    maxWidth: 720,
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
    padding: '18px 24px',
    minWidth: 320,
    transition: 'border 0.15s, background 0.15s, box-shadow 0.15s',
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
    borderRadius: 16,
    border: '1px solid rgba(0, 201, 167, 0.26)',
    background: 'linear-gradient(135deg, rgba(232, 255, 249, 0.92), #FFFFFF 78%)',
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
    borderRadius: 999,
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
    borderRadius: 999,
    background: '#FFF7ED',
    color: '#EA580C',
    fontSize: 11,
    fontWeight: 850,
  },
  teachingContentTextarea: {
    width: '100%',
    minHeight: 92,
    padding: '12px 13px',
    borderRadius: 12,
    border: '1.5px solid rgba(15, 118, 110, 0.28)',
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
    borderRadius: 12,
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
  appliedPlaywayFlow: {
    color: 'var(--agent-primary-text)',
    fontSize: 12,
    fontWeight: 850,
    lineHeight: 1.5,
  },
  appliedPlaywayHint: {
    marginTop: 5,
    color: '#64748B',
    fontSize: 12,
    lineHeight: 1.45,
  },
  promptPreviewBox: {
    borderRadius: 12,
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
    maxHeight: 150,
    overflowY: 'auto' as const,
    padding: '10px 12px 12px',
    borderTop: '1px solid #E2E8F0',
    color: '#334155',
    fontSize: 12,
    lineHeight: 1.55,
    fontFamily: 'inherit',
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
  smartCompletion: {
    display: 'grid',
    gridTemplateColumns: '24px 1fr auto',
    alignItems: 'flex-start',
    gap: 9,
    padding: '10px 11px',
    marginTop: 10,
    borderRadius: 10,
    border: '1px solid var(--agent-action-border)',
    background: 'linear-gradient(135deg, var(--agent-action-soft), #FFFFFF)',
  },
  smartCompletionIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    background: 'var(--agent-action-soft)',
    color: 'var(--agent-action-text)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smartCompletionContent: {
    minWidth: 0,
  },
  smartCompletionTitle: {
    color: 'var(--agent-action-text)',
    fontSize: 12,
    fontWeight: 800,
    marginBottom: 3,
  },
  smartCompletionText: {
    color: '#334155',
    fontSize: 12,
    lineHeight: 1.45,
  },
  smartCompletionPreview: {
    display: 'inline-flex',
    marginTop: 6,
    padding: '3px 7px',
    borderRadius: 999,
    background: '#FFFFFF',
    color: '#64748B',
    fontSize: 11,
    fontWeight: 700,
  },
  smartCompletionBtn: {
    height: 28,
    padding: '0 10px',
    borderRadius: 7,
    border: 'none',
    background: 'var(--agent-action-gradient)',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
  },
  toolGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
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
    borderRadius: '50%',
    border: 'none',
    boxShadow: '0 8px 18px var(--agent-shadow)',
    transition: 'background 0.15s, transform 0.15s',
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
    flexShrink: 0,
  },
};

export default ChatInput;
