import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { RequirementFramework } from '../../types';
import toast from '../../utils/toast';
import { demoMs } from '../../constants/demoTiming';
import {
  baseVisualStylePresets,
  enhancementVisualStylePreviewImages,
  enhancementVisualStylePresets,
  getVisualStylePreviewStyle,
  getVisualStyleSelection,
  mergeVisualStylePrompt,
  visualStylePreviewImages,
} from '../../data/visualStylePresets';

interface RequirementCardProps {
  framework: RequirementFramework;
  isStreaming?: boolean;
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

const RequirementCard: React.FC<RequirementCardProps> = ({ framework, isStreaming = false, streamDuration, onStreamComplete, onFrameworkChange }) => {
  const [streamedTexts, setStreamedTexts] = useState<Record<string, string>>({});
  const [currentSection, setCurrentSection] = useState(0);
  const [streamComplete, setStreamComplete] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [selectedBaseStyleId, setSelectedBaseStyleId] = useState<string | null>(null);
  const [selectedEnhancementIds, setSelectedEnhancementIds] = useState<string[]>([]);
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
    setEditValues(prev => {
      const nextValues = { ...prev, [key]: value };
      onFrameworkChange?.({ ...framework, ...nextValues });
      return nextValues;
    });
  };

  const applyVisualStyleSelection = (baseStyleId: string | null, enhancementIds = selectedEnhancementIds) => {
    const selection = getVisualStyleSelection(baseStyleId, enhancementIds);
    setSelectedBaseStyleId(baseStyleId);
    setSelectedEnhancementIds(enhancementIds);
    setEditValues(prev => {
      const current = prev.designStyle || framework.designStyle || '';
      const next = mergeVisualStylePrompt(current, selection);
      onFrameworkChange?.({
        ...framework,
        ...prev,
        designStyle: next,
        visualStyleSelection: {
          baseStyleId: selection.baseStyleId,
          enhancementStyleIds: selection.enhancementStyleIds,
          styleName: selection.styleName,
          stylePrompt: selection.stylePrompt,
          previewImageUrl: selection.previewImageUrl,
        },
      });
      return { ...prev, designStyle: next };
    });
    toast(selection.styleName ? `已选择「${selection.styleName}」画面风格` : '已恢复 AI 默认匹配画面风格');
  };

  const toggleEnhancement = (styleId: string) => {
    const nextIds = selectedEnhancementIds.includes(styleId)
      ? selectedEnhancementIds.filter(id => id !== styleId)
      : [...selectedEnhancementIds, styleId];
    applyVisualStyleSelection(selectedBaseStyleId, nextIds);
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
                    <span style={visualStyleStyles.title}>画面风格</span>
                    <span style={visualStyleStyles.desc}>
                      {selectedBaseStyleId ? getVisualStyleSelection(selectedBaseStyleId, selectedEnhancementIds).styleName : 'AI 默认匹配'}
                    </span>
                  </div>
                  <div style={visualStyleStyles.groupTitle}>基础风格</div>
                  <div className="requirement-style-scroll" style={visualStyleStyles.baseGrid}>
                    <button
                      type="button"
                      onClick={() => applyVisualStyleSelection(null, [])}
                      style={{
                        ...visualStyleStyles.baseOption,
                        ...(selectedBaseStyleId === null ? visualStyleStyles.baseOptionSelected : {}),
                      }}
                    >
                      <div style={visualStyleStyles.defaultPreview}>
                        <span>AI</span>
                      </div>
                      <span style={visualStyleStyles.baseName}>AI 默认匹配</span>
                    </button>
                    {baseVisualStylePresets.map(option => {
                      const selected = selectedBaseStyleId === option.id;
                      const previewImage = visualStylePreviewImages[option.id];
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => applyVisualStyleSelection(option.id)}
                          style={{
                            ...visualStyleStyles.baseOption,
                            ...(selected ? visualStyleStyles.baseOptionSelected : {}),
                          }}
                        >
                          <div style={{ ...visualStyleStyles.preview, ...getVisualStylePreviewStyle(option.id) }}>
                            {previewImage && <img src={previewImage} alt={`${option.name}参考图`} style={visualStyleStyles.previewImage} />}
                            {selected && <span style={visualStyleStyles.check}><CheckCircle2 size={13} /></span>}
                          </div>
                          <span style={visualStyleStyles.baseName}>{option.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div style={visualStyleStyles.groupTitle}>增强质感</div>
                  <div style={visualStyleStyles.enhancementGrid}>
                    {enhancementVisualStylePresets.map(option => {
                      const selected = selectedEnhancementIds.includes(option.id);
                      const previewImage = enhancementVisualStylePreviewImages[option.id];
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => toggleEnhancement(option.id)}
                          disabled={!selectedBaseStyleId}
                          style={{
                            ...visualStyleStyles.enhancementOption,
                            ...(selected ? visualStyleStyles.enhancementOptionSelected : {}),
                            ...(!selectedBaseStyleId ? visualStyleStyles.enhancementDisabled : {}),
                          }}
                        >
                          {previewImage && (
                            <span style={visualStyleStyles.enhancementThumb}>
                              <img src={previewImage} alt={`${option.name}示例`} style={visualStyleStyles.enhancementThumbImage} />
                            </span>
                          )}
                          <span style={visualStyleStyles.enhancementText}>
                            <span style={visualStyleStyles.enhancementName}>{option.name}</span>
                            <span style={visualStyleStyles.enhancementDesc}>{option.desc}</span>
                          </span>
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
    padding: '12px',
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
    color: '#64748B',
    fontSize: 12,
    whiteSpace: 'nowrap',
  },
  groupTitle: {
    margin: '9px 0 7px',
    color: '#64748B',
    fontSize: 12,
    fontWeight: 800,
  },
  baseGrid: {
    display: 'flex',
    flexWrap: 'nowrap',
    gap: 9,
    overflowX: 'auto',
    paddingBottom: 3,
  },
  baseOption: {
    width: 116,
    flexShrink: 0,
    padding: 7,
    borderRadius: 10,
    border: '1px solid #D8F3EF',
    background: '#FFFFFF',
    color: '#475569',
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
    textAlign: 'left',
  },
  baseOptionSelected: {
    borderColor: 'var(--agent-primary)',
    background: 'var(--agent-soft-strong)',
    color: 'var(--agent-primary-text)',
    boxShadow: '0 6px 16px rgba(0, 201, 167, 0.14)',
  },
  preview: {
    position: 'relative',
    width: '100%',
    aspectRatio: '16 / 9',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 6,
  },
  defaultPreview: {
    width: '100%',
    aspectRatio: '16 / 9',
    borderRadius: 8,
    marginBottom: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #F8FAFC, #CCFBF1)',
    color: '#0F766E',
    fontSize: 18,
    fontWeight: 900,
  },
  previewImage: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  check: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 20,
    height: 20,
    borderRadius: 999,
    background: 'var(--agent-primary)',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseName: {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  enhancementGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
    gap: 8,
  },
  enhancementOption: {
    minHeight: 58,
    padding: 7,
    borderRadius: 10,
    border: '1px solid #D8F3EF',
    background: '#FFFFFF',
    color: '#475569',
    fontSize: 12,
    fontWeight: 750,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    textAlign: 'left',
  },
  enhancementOptionSelected: {
    borderColor: 'var(--agent-primary)',
    background: 'var(--agent-soft-strong)',
    color: 'var(--agent-primary-text)',
  },
  enhancementDisabled: {
    opacity: 0.46,
    cursor: 'not-allowed',
  },
  enhancementThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    flexShrink: 0,
    overflow: 'hidden',
    background: '#F8FAFC',
    border: '1px solid rgba(15, 118, 110, 0.10)',
  },
  enhancementThumbImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  enhancementText: {
    minWidth: 0,
    display: 'block',
  },
  enhancementName: {
    display: 'block',
    color: '#1E293B',
    fontSize: 12,
    fontWeight: 850,
    lineHeight: 1.2,
  },
  enhancementDesc: {
    display: 'block',
    marginTop: 3,
    color: '#64748B',
    fontSize: 11,
    fontWeight: 600,
    lineHeight: 1.25,
  },
};

export default RequirementCard;
