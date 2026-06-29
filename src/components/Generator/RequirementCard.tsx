import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { RequirementFramework } from '../../types';
import toast from '../../utils/toast';
import { demoMs } from '../../constants/demoTiming';

interface RequirementCardProps {
  framework: RequirementFramework;
  isStreaming?: boolean;
  readOnly?: boolean;
  streamDuration?: number;
  onStreamComplete?: () => void;
  onFrameworkChange?: (framework: RequirementFramework) => void;
}

const getSections = (framework: RequirementFramework) => [
  ...(framework.generationSettings
    ? [{ key: 'generationSettings' as const, icon: '⚙️', title: '生成设置' }]
    : []),
  { key: 'userRequirement' as const, icon: '🎯', title: '教学目标' },
  { key: 'featureDesign' as const, icon: '🎮', title: '课堂玩法和互动流程' },
  { key: 'designStyle' as const, icon: '✨', title: '画面和反馈' },
];

const TOTAL_DURATION_MS = demoMs(15000);
const READ_ONLY_COLLAPSED_HEIGHT = 180;

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: '#1E293B',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 10,
  paddingBottom: 8,
  borderBottom: '1px solid #F1F5F9',
};

const textareaBaseStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #E2E8F0',
  borderRadius: 8,
  padding: '12px 14px',
  fontSize: 14,
  background: '#F8FAFE',
  resize: 'none',
  outline: 'none',
  fontFamily: 'inherit',
  lineHeight: 1.7,
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  color: '#334155',
  overflow: 'hidden',
};

const readOnlyTextareaStyle: React.CSSProperties = {
  background: '#F1F5F9',
  borderColor: '#E2E8F0',
  color: '#64748B',
  cursor: 'default',
  boxShadow: 'none',
};

const renderInlineMarkdown = (value: string) => {
  const parts = value.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} style={markdownStyles.inlineCode}>{part.slice(1, -1)}</code>;
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
  if (level === 1) return <h1 key={key} style={markdownStyles.h1}>{renderInlineMarkdown(content)}</h1>;
  if (level === 2) return <h2 key={key} style={markdownStyles.h2}>{renderInlineMarkdown(content)}</h2>;
  if (level === 3) return <h3 key={key} style={markdownStyles.h3}>{renderInlineMarkdown(content)}</h3>;
  return <h4 key={key} style={markdownStyles.h4}>{renderInlineMarkdown(content)}</h4>;
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
        <pre key={`code-${index}`} style={markdownStyles.codeBlock}>
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
      blocks.push(<hr key={`hr-${index}`} style={markdownStyles.hr} />);
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
        <blockquote key={`quote-${index}`} style={markdownStyles.quote}>
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
        <div key={`table-${index}`} style={markdownStyles.tableWrap}>
          <table style={markdownStyles.table}>
            <thead>
              <tr>
                {headerCells.map((cell, cellIndex) => (
                  <th key={`${cell}-${cellIndex}`} style={markdownStyles.th}>{renderInlineMarkdown(cell)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${cell}-${cellIndex}`} style={markdownStyles.td}>{renderInlineMarkdown(cell)}</td>
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
          <ol key={`list-${index}`} style={markdownStyles.list}>
            {listItems.map((item, itemIndex) => (
              <li key={`${item}-${itemIndex}`} style={markdownStyles.listItem}>{renderInlineMarkdown(item)}</li>
            ))}
          </ol>
        ) : (
          <ul key={`list-${index}`} style={markdownStyles.list}>
            {listItems.map((item, itemIndex) => (
              <li key={`${item}-${itemIndex}`} style={markdownStyles.listItem}>{renderInlineMarkdown(item)}</li>
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
      <p key={`paragraph-${index}`} style={markdownStyles.paragraph}>
        {renderInlineLines(paragraphLines.join('\n'))}
      </p>,
    );
  }

  return <div style={markdownStyles.preview}>{blocks}</div>;
};

const RequirementCard: React.FC<RequirementCardProps> = ({ framework, isStreaming = false, readOnly = false, streamDuration, onStreamComplete, onFrameworkChange }) => {
  const [streamedTexts, setStreamedTexts] = useState<Record<string, string>>({});
  const [currentSection, setCurrentSection] = useState(0);
  const [streamComplete, setStreamComplete] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [collapsed, setCollapsed] = useState(readOnly);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const charIndexRef = useRef(0);
  const previousReadOnlyRef = useRef(readOnly);

  useEffect(() => {
    if (readOnly && !previousReadOnlyRef.current) {
      setCollapsed(true);
    }
    if (!readOnly) {
      setCollapsed(false);
    }
    previousReadOnlyRef.current = readOnly;
  }, [readOnly]);

  useEffect(() => {
    const sections = getSections(framework);
    if (!isStreaming) {
      const texts: Record<string, string> = {};
      const edits: Record<string, string> = {};
      sections.forEach(s => {
        texts[s.key] = framework[s.key] || '';
        edits[s.key] = framework[s.key] || '';
      });
      setStreamedTexts(texts);
      setEditValues(edits);
      setCurrentSection(sections.length);
      setStreamComplete(true);
      return;
    }

    setStreamedTexts({});
    setEditValues({});
    setCurrentSection(0);
    setStreamComplete(false);
    charIndexRef.current = 0;

    const duration = streamDuration || TOTAL_DURATION_MS;
    const totalChars = sections.reduce((sum, s) => sum + (framework[s.key] || '').length, 0);
    const msPerChar = duration / totalChars;
    const charsPerTick = 2;
    const tickInterval = msPerChar * charsPerTick;

    const streamSection = (sectionIdx: number) => {
      if (sectionIdx >= sections.length) {
        setStreamComplete(true);
        onStreamComplete?.();
        return;
      }

      const key = sections[sectionIdx].key;
      const fullText = framework[key] || '';
      charIndexRef.current = 0;
      setCurrentSection(sectionIdx);

      intervalRef.current = setInterval(() => {
        charIndexRef.current += charsPerTick;
        if (charIndexRef.current >= fullText.length) {
          setStreamedTexts(prev => ({ ...prev, [key]: fullText }));
          setEditValues(prev => ({ ...prev, [key]: fullText }));
          clearInterval(intervalRef.current!);
          setTimeout(() => streamSection(sectionIdx + 1), demoMs(400));
        } else {
          setStreamedTexts(prev => ({ ...prev, [key]: fullText.slice(0, charIndexRef.current) }));
        }
      }, tickInterval);
    };

    const timer = setTimeout(() => streamSection(0), demoMs(500));
    return () => {
      clearTimeout(timer);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [framework, isStreaming, onStreamComplete, streamDuration]);

  const handleTextChange = (key: string, value: string) => {
    if (readOnly) return;
    setEditValues(prev => {
      const nextValues = { ...prev, [key]: value };
      onFrameworkChange?.({ ...framework, ...nextValues });
      return nextValues;
    });
  };

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  };

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <div style={{
        background: readOnly ? '#F8FAFC' : '#fff',
        borderRadius: 12,
        border: readOnly ? '1px solid #CBD5E1' : '1px solid #E2E8F0',
        boxShadow: readOnly ? 'none' : '0 2px 8px rgba(0,0,0,0.04)',
        padding: 24,
        maxHeight: collapsed ? READ_ONLY_COLLAPSED_HEIGHT : undefined,
        overflow: 'hidden',
        position: 'relative',
        transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s, max-height 0.2s',
      }}>
        <>
          <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              paddingBottom: 16,
              marginBottom: 18,
              borderBottom: '1px solid #E2E8F0',
          }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>互动课件设计方案确认</div>
              <div style={{ fontSize: 13, color: '#64748B' }}>
                {readOnly ? '需求已确认并进入生成流程，当前方案不可再编辑。' : 'AI 已把你的想法整理成一节互动课件方案，可以直接修改后生成。'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{
                padding: '5px 10px',
                borderRadius: 999,
                background: readOnly ? '#E2E8F0' : 'var(--agent-soft-strong)',
                color: readOnly ? '#475569' : 'var(--agent-primary-text)',
                fontSize: 12,
                fontWeight: 800,
                flexShrink: 0,
              }}>
                {readOnly ? '已确认' : '可编辑'}
              </div>
              {readOnly && (
                <button
                  type="button"
                  onClick={() => setCollapsed(prev => !prev)}
                  style={{
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#475569',
                    borderRadius: 999,
                    width: 30,
                    height: 30,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  aria-label={collapsed ? '展开已确认需求' : '收起已确认需求'}
                  title={collapsed ? '展开查看' : '收起'}
                >
                  {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>
              )}
            </div>
          </div>
          {getSections(framework).map((section, idx, sections) => {
            if (isStreaming && idx > currentSection && !streamedTexts[section.key]) return null;
            const displayText = streamedTexts[section.key] || '';
            const editText = editValues[section.key] || '';
            const isSectionDone = !isStreaming || streamComplete || idx < currentSection || (idx === currentSection && displayText === (framework[section.key] || ''));

            return (
              <div key={section.key} style={{ marginBottom: idx < sections.length - 1 ? 20 : 0 }}>
                <div style={sectionTitleStyle}>
                  <span>{section.icon}</span>
                  <span>{section.title}</span>
                </div>
                {isSectionDone && section.key === 'featureDesign' && framework.featureDesignFormat === 'markdown' ? (
                  <div style={markdownStyles.panel}>
                    <div style={markdownStyles.panelHint}>已套用玩法说明模板，生成时会结合你的需求自动改写成新课件。</div>
                    <MarkdownPromptPreview text={editText} />
                  </div>
                ) : isSectionDone ? (
                  <textarea
                    value={editText}
                    onChange={e => handleTextChange(section.key, e.target.value)}
                    readOnly={readOnly}
                    aria-readonly={readOnly}
                    style={{
                      ...textareaBaseStyle,
                      ...(readOnly ? readOnlyTextareaStyle : {}),
                    }}
                    ref={el => { if (el) autoResize(el); }}
                    onInput={e => autoResize(e.target as HTMLTextAreaElement)}
                    onFocus={e => {
                      if (readOnly) return;
                      e.target.style.borderColor = 'var(--agent-primary)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(0,201,167,0.1)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = '#E2E8F0';
                      e.target.style.boxShadow = 'none';
                      if (readOnly) return;
                      toast('保存成功~');
                    }}
                    rows={1}
                  />
                ) : (
                  <div style={{ ...textareaBaseStyle, background: '#FAFBFC', minHeight: 60, whiteSpace: 'pre-wrap' }}>
                    {displayText}
                    <span style={{
                      display: 'inline-block',
                      width: 2,
                      height: 16,
                      background: 'var(--agent-primary)',
                      marginLeft: 2,
                      animation: 'blink 0.8s infinite',
                      verticalAlign: 'text-bottom',
                    }} />
                  </div>
                )}
              </div>
            );
          })}
        </>
        {collapsed && (
          <div style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 46,
            background: 'linear-gradient(180deg, rgba(248, 250, 252, 0), #F8FAFC 78%)',
            pointerEvents: 'none',
          }} />
        )}
      </div>
    </div>
  );
};

const markdownStyles: Record<string, React.CSSProperties> = {
  panel: {
    border: '1px solid #D8E5EF',
    borderRadius: 10,
    background: '#FFFFFF',
    overflow: 'hidden',
  },
  panelHint: {
    padding: '9px 12px',
    borderBottom: '1px solid #E2E8F0',
    background: '#F8FAFC',
    color: '#64748B',
    fontSize: 12,
    fontWeight: 750,
    lineHeight: 1.5,
  },
  preview: {
    maxHeight: 360,
    overflowY: 'auto',
    padding: '12px 14px 14px',
    color: '#334155',
    fontSize: 13,
    lineHeight: 1.58,
  },
  h1: {
    margin: '0 0 10px',
    color: '#0F172A',
    fontSize: 18,
    lineHeight: 1.28,
    fontWeight: 950,
  },
  h2: {
    margin: '14px 0 8px',
    color: '#0F172A',
    fontSize: 16,
    lineHeight: 1.35,
    fontWeight: 950,
  },
  h3: {
    margin: '12px 0 6px',
    color: '#0F172A',
    fontSize: 14,
    lineHeight: 1.35,
    fontWeight: 900,
  },
  h4: {
    margin: '10px 0 5px',
    color: '#0F172A',
    fontSize: 13,
    lineHeight: 1.35,
    fontWeight: 900,
  },
  paragraph: {
    margin: '0 0 9px',
    color: '#475569',
    fontSize: 13,
    lineHeight: 1.62,
  },
  quote: {
    margin: '0 0 9px',
    padding: '8px 10px',
    borderRadius: 9,
    borderLeft: '3px solid var(--agent-primary)',
    background: 'rgba(14, 165, 156, 0.08)',
    color: '#334155',
    fontSize: 12,
    lineHeight: 1.6,
  },
  list: {
    margin: '0 0 9px',
    paddingLeft: 20,
    color: '#475569',
    fontSize: 13,
    lineHeight: 1.58,
  },
  listItem: {
    margin: '3px 0',
  },
  codeBlock: {
    margin: '0 0 9px',
    padding: '10px 11px',
    borderRadius: 9,
    background: '#0F172A',
    color: '#E2E8F0',
    overflowX: 'auto',
    whiteSpace: 'pre-wrap',
    fontSize: 11,
    lineHeight: 1.55,
    fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  inlineCode: {
    padding: '1px 4px',
    borderRadius: 5,
    background: '#F1F5F9',
    color: '#0F766E',
    fontSize: 11,
    fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  hr: {
    margin: '12px 0',
    border: 'none',
    borderTop: '1px solid #E2E8F0',
  },
  tableWrap: {
    margin: '0 0 9px',
    overflowX: 'auto',
    border: '1px solid #E2E8F0',
    borderRadius: 9,
    background: '#FFFFFF',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 12,
    lineHeight: 1.45,
  },
  th: {
    padding: '7px 8px',
    background: '#F8FAFC',
    color: '#0F172A',
    fontWeight: 900,
    textAlign: 'left',
    borderBottom: '1px solid #E2E8F0',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '7px 8px',
    color: '#475569',
    borderTop: '1px solid #EEF2F7',
    verticalAlign: 'top',
  },
};

export default RequirementCard;
