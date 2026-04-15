import React, { useState, useEffect, useRef } from 'react';
import type { RequirementFramework } from '../../types';
import toast from '../../utils/toast';

interface RequirementCardProps {
  framework: RequirementFramework;
  isStreaming?: boolean;
  streamDuration?: number;
  onStreamComplete?: () => void;
}

const SECTIONS = [
  { key: 'userRequirement' as const, icon: '👥', title: '用户需求' },
  { key: 'featureDesign' as const, icon: '⚙️', title: '功能设计说明' },
  { key: 'designStyle' as const, icon: '🎨', title: '设计风格' },
];

const TOTAL_DURATION_MS = 15000;

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
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
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const charIndexRef = useRef(0);

  useEffect(() => {
    if (!isStreaming) {
      if (streamComplete) return;
      const texts: Record<string, string> = {};
      const edits: Record<string, string> = {};
      SECTIONS.forEach(s => {
        texts[s.key] = framework[s.key];
        edits[s.key] = framework[s.key];
      });
      setStreamedTexts(texts);
      setEditValues(edits);
      setCurrentSection(SECTIONS.length);
      setStreamComplete(true);
      return;
    }

    setStreamedTexts({});
    setEditValues({});
    setCurrentSection(0);
    setStreamComplete(false);
    charIndexRef.current = 0;

    const duration = streamDuration || TOTAL_DURATION_MS;
    const totalChars = SECTIONS.reduce((sum, s) => sum + framework[s.key].length, 0);
    const msPerChar = duration / totalChars;
    const charsPerTick = 2;
    const tickInterval = msPerChar * charsPerTick;

    const streamSection = (sectionIdx: number) => {
      if (sectionIdx >= SECTIONS.length) {
        setStreamComplete(true);
        onStreamComplete?.();
        return;
      }

      const key = SECTIONS[sectionIdx].key;
      const fullText = framework[key];
      charIndexRef.current = 0;
      setCurrentSection(sectionIdx);

      intervalRef.current = setInterval(() => {
        charIndexRef.current += charsPerTick;
        if (charIndexRef.current >= fullText.length) {
          setStreamedTexts(prev => ({ ...prev, [key]: fullText }));
          setEditValues(prev => ({ ...prev, [key]: fullText }));
          clearInterval(intervalRef.current!);
          setTimeout(() => streamSection(sectionIdx + 1), 400);
        } else {
          setStreamedTexts(prev => ({ ...prev, [key]: fullText.slice(0, charIndexRef.current) }));
        }
      }, tickInterval);
    };

    const timer = setTimeout(() => streamSection(0), 500);
    return () => {
      clearTimeout(timer);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [framework, isStreaming, onStreamComplete]);

  const handleTextChange = (key: string, value: string) => {
    setEditValues(prev => ({ ...prev, [key]: value }));
  };

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  };

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        padding: 24,
      }}>
        {SECTIONS.map((section, idx) => {
          if (isStreaming && idx > currentSection && !streamedTexts[section.key]) return null;
          const displayText = streamedTexts[section.key] || '';
          const editText = editValues[section.key] || '';
          const isSectionDone = !isStreaming || streamComplete || idx < currentSection || (idx === currentSection && displayText === framework[section.key]);

          return (
            <div key={section.key} style={{ marginBottom: idx < SECTIONS.length - 1 ? 20 : 0 }}>
              <div style={sectionTitleStyle}>
                <span>{section.icon}</span>
                <span>{section.title}</span>
              </div>
              {isSectionDone ? (
                <textarea
                  value={editText}
                  onChange={e => handleTextChange(section.key, e.target.value)}
                  style={textareaBaseStyle}
                  ref={el => { if (el) autoResize(el); }}
                  onInput={e => autoResize(e.target as HTMLTextAreaElement)}
                  onFocus={e => {
                    e.target.style.borderColor = '#00C9A7';
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
                    background: '#00C9A7',
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

export default RequirementCard;
