import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Loader2, ChevronDown, ChevronUp, Code, XCircle, RotateCcw } from 'lucide-react';
import type { GenerationProgress } from '../../types';
import ImageGenerationPanelV2 from './ImageGenerationPanelV2';
import AudioGenerationPanel from './AudioGenerationPanel';

interface ProgressPanelProps {
  progress: GenerationProgress;
  onStop?: () => void;
  onRetry?: (stageIndex: number) => void;
  onContinue?: (stageIndex: number) => void;
}

const CONFIRM_TEXT = '需求已明确，您需要一款面向三年级学生的英语身体部位听力互动游戏，通过听音辨位和触屏操作匹配英文指令，实现趣味动作反馈与奖励机制，提升词汇理解与学习兴趣。接下来我将根据您的需求开始开发。';

const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'completed') return <CheckCircle2 size={16} color="var(--agent-primary)" />;
  if (status === 'in-progress') return <Loader2 size={16} color="var(--agent-primary)" style={{ animation: 'spin 1s linear infinite' }} />;
  if (status === 'failed') return <XCircle size={16} color="#EF4444" />;
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
        <span style={{ display: 'inline-block', width: 2, height: 16, background: 'var(--agent-primary)', marginLeft: 2, animation: 'blink 0.8s infinite', verticalAlign: 'text-bottom' }} />
      )}
    </span>
  );
};

const CODE_INTRO_TEXT = '正在为您打造专属互动教学课件~';
const CODE_ASSETS_TEXT = '将自动完成代码生成、智能审查，若检测到问题还会进行修复优化 💪🏻💪🏻💪🏻';

const CodeGenerationPanel: React.FC<{ stages: any[]; isExpanded: boolean; onToggle: () => void; onRetry?: (stageIndex: number) => void; instant?: boolean }> = ({ stages, isExpanded, onToggle, onRetry, instant = false }) => {
  const codeStage = stages[0];
  const reviewStage = stages[1];
  const fixStage = stages[2];
  const learningDataStage = stages[3];
  const hasFailed = stages.some(s => s.status === 'failed');
  const finalStage = learningDataStage || fixStage;
  const overallStatus = hasFailed ? 'failed' : finalStage?.status === 'completed' ? 'completed' : codeStage?.status === 'pending' ? 'pending' : 'in-progress';
  const stageCount = learningDataStage ? 4 : 3;
  const overallProgress = Math.round(((codeStage?.progress || 0) + (reviewStage?.progress || 0) + (fixStage?.progress || 0) + (learningDataStage?.progress || 0)) / stageCount);
  const [introTextDone, setIntroTextDone] = useState(instant);

  return (
    <div style={panelStyles.card}>
      <div style={panelStyles.header} onClick={onToggle}>
        <div style={panelStyles.headerLeft}>
          <Code size={18} color="var(--agent-primary)" />
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
              <div style={{ ...panelStyles.progressFill, width: `${overallProgress}%`, background: overallStatus === 'completed' ? 'var(--agent-primary)' : overallStatus === 'failed' ? '#EF4444' : 'linear-gradient(90deg, var(--agent-primary), var(--agent-secondary))' }} />
            </div>
          )}

          {codeStage && codeStage.status !== 'pending' && (
            <>
              <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.7, marginTop: 12, marginBottom: 8 }}>
                {instant ? CODE_INTRO_TEXT : <StreamingText text={CODE_INTRO_TEXT} speed={20} onComplete={() => {}} />}
              </div>
              <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.7, marginBottom: 14 }}>
                {instant ? CODE_ASSETS_TEXT : <StreamingText text={CODE_ASSETS_TEXT} speed={20} onComplete={() => setIntroTextDone(true)} />}
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
                {codeStage.status === 'failed' && <span style={{ fontSize: 12, color: '#EF4444' }}>{codeStage.error || '生成失败'}</span>}
              </div>
              {codeStage.status === 'failed' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8, marginLeft: 22 }}>
                  <button onClick={() => onRetry?.(2)} style={failedBtnStyle}><RotateCcw size={12} /> 重试</button>
                </div>
              )}
            </div>
          )}

          {introTextDone && reviewStage && reviewStage.status !== 'pending' && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <StatusIcon status={reviewStage.status} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>代码审查</span>
                {reviewStage.status === 'in-progress' && <span style={{ fontSize: 12, color: '#94A3B8' }}>正在审查代码质量...</span>}
                {reviewStage.status === 'completed' && <span style={{ fontSize: 12, color: '#94A3B8' }}>代码审查完成</span>}
                {reviewStage.status === 'failed' && <span style={{ fontSize: 12, color: '#EF4444' }}>{reviewStage.error || '审查失败'}</span>}
              </div>
              {reviewStage.status === 'failed' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8, marginLeft: 22 }}>
                  <button onClick={() => onRetry?.(3)} style={failedBtnStyle}><RotateCcw size={12} /> 重试</button>
                </div>
              )}
            </div>
          )}

          {introTextDone && fixStage && fixStage.status !== 'pending' && (
            <div style={{ marginBottom: learningDataStage && learningDataStage.status !== 'pending' ? 10 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <StatusIcon status={fixStage.status} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>代码修复</span>
                {fixStage.status === 'in-progress' && <span style={{ fontSize: 12, color: '#94A3B8' }}>正在修复发现的问题...</span>}
                {fixStage.status === 'completed' && <span style={{ fontSize: 12, color: '#94A3B8' }}>代码修复完成</span>}
                {fixStage.status === 'failed' && <span style={{ fontSize: 12, color: '#EF4444' }}>{fixStage.error || '修复失败'}</span>}
              </div>
              {fixStage.status === 'failed' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8, marginLeft: 22 }}>
                  <button onClick={() => onRetry?.(4)} style={failedBtnStyle}><RotateCcw size={12} /> 重试</button>
                </div>
              )}
            </div>
          )}

          {introTextDone && learningDataStage && learningDataStage.status !== 'pending' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <StatusIcon status={learningDataStage.status} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>学情数据回收</span>
                {learningDataStage.status === 'in-progress' && <span style={{ fontSize: 12, color: '#94A3B8' }}>学情数据回收数据设计中...</span>}
                {learningDataStage.status === 'completed' && <span style={{ fontSize: 12, color: '#94A3B8' }}>学情数据回收数据设计完成</span>}
                {learningDataStage.status === 'failed' && <span style={{ fontSize: 12, color: '#EF4444' }}>{learningDataStage.error || '设计失败'}</span>}
              </div>
              {learningDataStage.status === 'failed' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8, marginLeft: 22 }}>
                  <button onClick={() => onRetry?.(5)} style={failedBtnStyle}><RotateCcw size={12} /> 重试</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ProgressPanel: React.FC<ProgressPanelProps> = ({ progress, onRetry }) => {
  const allStagesCompleted = progress.stages.length > 0 && progress.stages.every(stage => stage.status === 'completed');
  const [textDone, setTextDone] = useState(allStagesCompleted);
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
        {allStagesCompleted ? CONFIRM_TEXT : <StreamingText text={CONFIRM_TEXT} speed={25} onComplete={() => setTextDone(true)} />}
      </div>

      {textDone && imageStage && (
        <>
          <ImageGenerationPanelV2 stage={imageStage} isExpanded={imageExpanded} onToggle={() => setImageExpanded(v => !v)} onRetry={() => onRetry?.(0)} />
        </>
      )}

      {textDone && audioStage && audioStage.status !== 'pending' && (
        <>
          <AudioGenerationPanel stage={audioStage} isExpanded={audioExpanded} onToggle={() => setAudioExpanded(v => !v)} onRetry={() => onRetry?.(1)} />
        </>
      )}

      {textDone && codeStages.length > 0 && codeStages[0].status !== 'pending' && (
        <CodeGenerationPanel stages={codeStages} isExpanded={codeExpanded} onToggle={() => setCodeExpanded(v => !v)} onRetry={onRetry} instant={allStagesCompleted} />
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

const failedBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 4,
  padding: '5px 12px', borderRadius: 5, border: '1px solid #FCA5A5',
  background: '#FEF2F2', color: '#EF4444', fontSize: 11, fontWeight: 600, cursor: 'pointer',
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
    color: 'var(--agent-primary)',
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
