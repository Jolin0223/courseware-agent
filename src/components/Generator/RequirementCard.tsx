import React, { useState, useEffect, useRef } from 'react';
import type { RequirementFramework } from '../../types';
import toast from '../../utils/toast';
import { demoMs } from '../../constants/demoTiming';
import { visualStylePresets, type VisualStylePreset } from '../../data/visualStylePresets';

interface RequirementCardProps {
  framework: RequirementFramework;
  isStreaming?: boolean;
  streamDuration?: number;
  onStreamComplete?: () => void;
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

const visualStyleOptions = visualStylePresets;

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

const RequirementCard: React.FC<RequirementCardProps> = ({ framework, isStreaming = false, streamDuration, onStreamComplete }) => {
  const [streamedTexts, setStreamedTexts] = useState<Record<string, string>>({});
  const [currentSection, setCurrentSection] = useState(0);
  const [streamComplete, setStreamComplete] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [selectedVisualStyle, setSelectedVisualStyle] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const charIndexRef = useRef(0);

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
    setEditValues(prev => ({ ...prev, [key]: value }));
  };

  const applyVisualStyle = (option: VisualStylePreset) => {
    setSelectedVisualStyle(option.id);
    setEditValues(prev => {
      const current = prev.designStyle || framework.designStyle || '';
      const next = /请只调整画面(感觉|风格)：/.test(current)
        ? current.replace(/请只调整画面(感觉|风格)：[\s\S]*?(?=\n\n|$)/, option.prompt)
        : `${current.trim()}\n\n${option.prompt}`.trim();
      return { ...prev, designStyle: next };
    });
    toast(`已加入「${option.name}」画面风格`);
  };

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  };

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <style>{`
        .requirement-style-scroll {
          scrollbar-width: none;
        }
        .requirement-style-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        padding: 24,
      }}>
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
            <div style={{ fontSize: 13, color: '#64748B' }}>AI 已把你的想法整理成一节互动课件方案，可以直接修改后生成。</div>
          </div>
          <div style={{
            padding: '5px 10px',
            borderRadius: 999,
            background: 'var(--agent-soft-strong)',
            color: 'var(--agent-primary-text)',
            fontSize: 12,
            fontWeight: 800,
            flexShrink: 0,
          }}>
            可编辑
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
              {section.key === 'designStyle' && isSectionDone && (
                <div style={visualStyleStyles.panel}>
                  <div style={visualStyleStyles.header}>
                    <span style={visualStyleStyles.title}>调整画面风格</span>
                  </div>
                  <div className="requirement-style-scroll" style={visualStyleStyles.optionRow}>
                    {visualStyleOptions.map(option => {
                      const selected = selectedVisualStyle === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => applyVisualStyle(option)}
                          style={{
                            ...visualStyleStyles.optionBtn,
                            ...(selected ? visualStyleStyles.optionBtnSelected : {}),
                          }}
                        >
                          {option.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {isSectionDone ? (
                <textarea
                  value={editText}
                  onChange={e => handleTextChange(section.key, e.target.value)}
                  style={textareaBaseStyle}
                  ref={el => { if (el) autoResize(el); }}
                  onInput={e => autoResize(e.target as HTMLTextAreaElement)}
                  onFocus={e => {
                    e.target.style.borderColor = 'var(--agent-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(0,201,167,0.1)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#E2E8F0';
                    e.target.style.boxShadow = 'none';
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
      </div>
    </div>
  );
};

const visualStyleStyles: Record<string, React.CSSProperties> = {
  panel: {
    margin: '-2px 0 10px',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid rgba(0,201,167,0.18)',
    background: 'linear-gradient(135deg, rgba(240,253,250,0.84), rgba(255,255,255,0.96))',
  },
  header: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  title: {
    color: '#0F766E',
    fontSize: 13,
    fontWeight: 800,
  },
  desc: {
    color: '#94A3B8',
    fontSize: 12,
    whiteSpace: 'nowrap',
  },
  optionRow: {
    display: 'flex',
    flexWrap: 'nowrap',
    gap: 8,
    overflowX: 'auto',
    paddingBottom: 2,
  },
  optionBtn: {
    height: 28,
    padding: '0 11px',
    borderRadius: 999,
    border: '1px solid #D8F3EF',
    background: '#FFFFFF',
    color: '#475569',
    fontSize: 12,
    fontWeight: 750,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  optionBtnSelected: {
    borderColor: 'var(--agent-primary)',
    background: 'var(--agent-soft-strong)',
    color: 'var(--agent-primary-text)',
    boxShadow: '0 6px 16px rgba(0, 201, 167, 0.14)',
  },
};

export default RequirementCard;
