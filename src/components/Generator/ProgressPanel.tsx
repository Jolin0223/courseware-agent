import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Loader2, ChevronDown, ChevronUp, Code } from 'lucide-react';
import type { GenerationProgress } from '../../types';
import ImageGenerationPanelV2 from './ImageGenerationPanelV2';
import AudioGenerationPanel from './AudioGenerationPanel';

interface ProgressPanelProps {
  progress: GenerationProgress;
  onStop?: () => void;
}

const CONFIRM_TEXT = '需求已明确，您需要一款面向三年级学生的英语身体部位听力互动游戏，通过听音辨位和触屏操作匹配英文指令，实现趣味动作反馈与奖励机制，提升词汇理解与学习兴趣。接下来我将根据您的需求开始开发。';

const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'completed') return <CheckCircle2 size={16} color="#00C9A7" />;
  if (status === 'in-progress') return <Loader2 size={16} color="#00C9A7" style={{ animation: 'spin 1s linear infinite' }} />;
  return null;
};

const StreamingText: React.FC<{ text: string; speed?: number; onComplete?: () => void }> = ({ text, speed = 25, onComplete }) => {
  const [displayed, setDisplayed] = useState('');
  const idxRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    idxRef.current = 0;
    setDisplayed('');
    const timer = setInterval(() => {
      idxRef.current += 2;
      if (idxRef.current >= text.length) {
        setDisplayed(text);
        clearInterval(timer);
        onCompleteRef.current?.();
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
        <span style={{ display: 'inline-block', width: 2, height: 16, background: '#00C9A7', marginLeft: 2, animation: 'blink 0.8s infinite', verticalAlign: 'text-bottom' }} />
      )}
    </span>
  );
};

const CODE_INTRO_TEXT = '正在为您打造专属互动教学课件~';
const CODE_ASSETS_TEXT = '将自动完成代码生成、智能审查，若检测到问题还会进行修复优化 💪🏻💪🏻💪🏻';

const CodeGenerationPanel: React.FC<{ stages: any[]; isExpanded: boolean; onToggle: () => void }> = ({ stages, isExpanded, onToggle }) => {
  const codeStage = stages[0];
  const reviewStage = stages[1];
  const fixStage = stages[2];
  const overallStatus = fixStage?.status === 'completed' ? 'completed' : codeStage?.status === 'pending' ? 'pending' : 'in-progress';
  const overallProgress = Math.round(((codeStage?.progress || 0) + (reviewStage?.progress || 0) + (fixStage?.progress || 0)) / 3);
  const [introTextDone, setIntroTextDone] = useState(false);

  return (
    <div style={panelStyles.card}>
      <div style={panelStyles.header} onClick={onToggle}>
        <div style={panelStyles.headerLeft}>
          <Code size={18} color="#00C9A7" />
          <span style={panelStyles.headerTitle}>课件生成</span>
          <StatusIcon status={overallStatus} />
        </div>
        <div style={panelStyles.headerRight}>
          {overallStatus !== 'pending' && <span style={panelStyles.percentage}>{overallProgress}%</span>}
          {isExpanded ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
        </div>
      </div>
      {isExpanded && (
        <div style={{ padding: '12px 16px' }}>
          {codeStage && codeStage.status !== 'pending' && (
            <div style={panelStyles.progressBar}>
              <div style={{ ...panelStyles.progressFill, width: `${overallProgress}%`, background: overallStatus === 'completed' ? '#00C9A7' : 'linear-gradient(90deg, #00C9A7, #00A8E8)' }} />
            </div>
          )}

          {codeStage && codeStage.status !== 'pending' && (
            <>
              <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.7, marginTop: 12, marginBottom: 8 }}>
                <StreamingText text={CODE_INTRO_TEXT} speed={20} onComplete={() => {}} />
              </div>
              <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.7, marginBottom: 14 }}>
                <StreamingText text={CODE_ASSETS_TEXT} speed={20} onComplete={() => setIntroTextDone(true)} />
              </div>
            </>
          )}

          {introTextDone && codeStage && codeStage.status !== 'pending' && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <StatusIcon status={codeStage.status} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>代码生成</span>
                {codeStage.status === 'in-progress' && <span style={{ fontSize: 12, color: '#94A3B8' }}>正在为您生成课件代码...</span>}
                {codeStage.status === 'completed' && <span style={{ fontSize: 12, color: '#94A3B8' }}>代码生成完成</span>}
              </div>
            </div>
          )}

          {introTextDone && reviewStage && reviewStage.status !== 'pending' && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <StatusIcon status={reviewStage.status} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>代码审查</span>
                {reviewStage.status === 'in-progress' && <span style={{ fontSize: 12, color: '#94A3B8' }}>正在审查代码质量...</span>}
                {reviewStage.status === 'completed' && <span style={{ fontSize: 12, color: '#94A3B8' }}>代码审查完成</span>}
              </div>
            </div>
          )}

          {introTextDone && fixStage && fixStage.status !== 'pending' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <StatusIcon status={fixStage.status} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>代码修复</span>
                {fixStage.status === 'in-progress' && <span style={{ fontSize: 12, color: '#94A3B8' }}>正在修复发现的问题...</span>}
                {fixStage.status === 'completed' && <span style={{ fontSize: 12, color: '#94A3B8' }}>代码修复完成</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ProgressPanel: React.FC<ProgressPanelProps> = ({ progress }) => {
  const [textDone, setTextDone] = useState(false);
  const [imageExpanded, setImageExpanded] = useState(true);
  const [audioExpanded, setAudioExpanded] = useState(true);
  const [codeExpanded, setCodeExpanded] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const imageStage = progress.stages[0];
  const audioStage = progress.stages[1];
  const codeStages = progress.stages.slice(2);

  return (
    <div ref={containerRef} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, padding: '14px 18px', background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0' }}>
        <StreamingText text={CONFIRM_TEXT} speed={25} onComplete={() => setTextDone(true)} />
      </div>

      {textDone && imageStage && (
        <ImageGenerationPanelV2 stage={imageStage} isExpanded={imageExpanded} onToggle={() => setImageExpanded(v => !v)} />
      )}

      {textDone && audioStage && audioStage.status !== 'pending' && (
        <AudioGenerationPanel stage={audioStage} isExpanded={audioExpanded} onToggle={() => setAudioExpanded(v => !v)} />
      )}

      {textDone && codeStages.length > 0 && codeStages[0].status !== 'pending' && (
        <CodeGenerationPanel stages={codeStages} isExpanded={codeExpanded} onToggle={() => setCodeExpanded(v => !v)} />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

const panelStyles: Record<string, React.CSSProperties> = {
  card: {
    background: '#fff',
    borderRadius: 12,
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    cursor: 'pointer',
    userSelect: 'none',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1E293B',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  percentage: {
    fontSize: 13,
    color: '#00C9A7',
    fontWeight: 600,
  },
  progressBar: {
    height: 4,
    background: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.4s ease',
  },
};

export default ProgressPanel;
