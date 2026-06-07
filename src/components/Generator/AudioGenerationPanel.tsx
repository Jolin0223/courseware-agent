import React, { useState, useEffect, useRef } from 'react';
import { Music, Play, Pause, CheckCircle2, Loader2, ChevronDown, ChevronUp, XCircle, RotateCcw } from 'lucide-react';
import type { AudioItem } from '../../types';

interface AudioGenerationPanelProps {
  stage: {
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    progress: number;
    error?: string;
  };
  isExpanded: boolean;
  onToggle: () => void;
  onRetry?: () => void;
  onContinue?: () => void;
}

const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'completed') return <CheckCircle2 size={16} color="var(--agent-primary)" />;
  if (status === 'in-progress') return <Loader2 size={16} color="var(--agent-primary)" style={{ animation: 'spin 1s linear infinite' }} />;
  if (status === 'failed') return <XCircle size={16} color="#EF4444" />;
  return null;
};

const MOCK_AUDIOS: AudioItem[] = [
  { id: 'audio-1', label: 'Apple', type: 'tts', status: 'completed', voiceId: 'female-1', duration: 1.2 },
  { id: 'audio-2', label: 'Banana', type: 'tts', status: 'completed', voiceId: 'female-1', duration: 1.5 },
  { id: 'audio-3', label: 'Cat', type: 'tts', status: 'completed', voiceId: 'female-1', duration: 0.8 },
  { id: 'audio-4', label: 'Dog', type: 'tts', status: 'completed', voiceId: 'female-1', duration: 0.9 },
  { id: 'audio-5', label: '背景音乐', type: 'bgm', status: 'completed', duration: 30.0 },
];

const CompactAudioCard: React.FC<{ audio: AudioItem }> = ({ audio }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const circumference = 2 * Math.PI * 13;

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (progressRef.current) clearInterval(progressRef.current);
    } else {
      setIsPlaying(true);
      progressRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 1) {
            setIsPlaying(false);
            if (progressRef.current) clearInterval(progressRef.current);
            return 0;
          }
          return p + 0.02;
        });
      }, (audio.duration || 2) * 20);
    }
  };

  useEffect(() => {
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, []);

  const isBgm = audio.type === 'bgm';
  const durationText = (audio.duration || 0) >= 60
    ? `${Math.floor((audio.duration || 0) / 60)}:${Math.floor((audio.duration || 0) % 60).toString().padStart(2, '0')}`
    : `${(audio.duration || 0).toFixed(1)}s`;

  return (
    <div style={{
      background: isPlaying ? '#F0FDFA' : '#FAFBFC',
      borderRadius: 10,
      padding: '8px 10px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      border: isPlaying ? '1px solid rgba(0,201,167,0.25)' : '1px solid #EEF2F6',
      transition: 'all 0.2s ease',
      minWidth: 0,
    }}>
      {/* 圆形播放按钮 + SVG 环形进度 */}
      <div style={{ position: 'relative', width: 30, height: 30, flexShrink: 0 }}>
        <svg width="30" height="30" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
          <circle cx="15" cy="15" r="13" fill="none" stroke="#E2E8F0" strokeWidth="2" />
          <circle
            cx="15" cy="15" r="13" fill="none"
            stroke="var(--agent-primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 0.1s linear' }}
          />
        </svg>
        <button onClick={togglePlay} style={{
          position: 'absolute', inset: 0, borderRadius: '50%', border: 'none',
          background: 'transparent', color: isPlaying ? 'var(--agent-primary)' : '#64748B',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: 0,
        }}>
          {isPlaying ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" style={{ marginLeft: 1 }} />}
        </button>
      </div>

      {/* 文字信息 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 11, fontWeight: 500, color: '#1E293B',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {audio.label}
        </div>
        <div style={{ fontSize: 9, color: '#94A3B8', marginTop: 1 }}>
          {isBgm ? 'BGM · ' : ''}{durationText}
        </div>
      </div>

      {/* Mini 波形 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 1, height: 16, flexShrink: 0 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            width: 2, borderRadius: 1,
            height: isPlaying ? [8, 12, 6, 10][i] : [4, 6, 4, 5][i],
            background: isPlaying ? 'var(--agent-primary)' : '#CBD5E1',
            transition: 'height 0.3s ease',
            animation: isPlaying ? `waveAnim 0.8s ease-in-out ${i * 0.1}s infinite alternate` : 'none',
          }} />
        ))}
      </div>
    </div>
  );
};

const CompactLoadingSkeleton: React.FC<{ index: number }> = ({ index }) => (
  <div style={{
    background: '#FAFBFC',
    borderRadius: 10,
    padding: '8px 10px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    border: '1px solid #EEF2F6',
    position: 'relative',
    overflow: 'hidden',
  }}>
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(90deg, transparent, rgba(0,201,167,0.04), transparent)',
      animation: 'audioShimmer 1.8s infinite',
      animationDelay: `${index * 0.15}s`,
    }} />
    <div style={{
      width: 30, height: 30, borderRadius: '50%', border: '2px solid #E2E8F0',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        border: '1.5px solid #CBD5E1', borderTopColor: 'transparent',
        animation: 'spin 1s linear infinite',
      }} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ width: '60%', height: 8, background: '#E2E8F0', borderRadius: 3, marginBottom: 4 }} />
      <div style={{ width: '35%', height: 6, background: '#F1F5F9', borderRadius: 2 }} />
    </div>
  </div>
);

const CompactFailedSkeleton: React.FC = () => (
  <div style={{
    background: '#FEF2F2',
    borderRadius: 10,
    padding: '8px 10px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    border: '1px solid #FCA5A5',
  }}>
    <div style={{
      width: 30, height: 30, borderRadius: '50%', border: '2px solid #FCA5A5',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      background: '#FEE2E2',
    }}>
      <XCircle size={14} color="#EF4444" />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ width: '60%', height: 8, background: '#FCA5A5', borderRadius: 3, marginBottom: 4 }} />
      <div style={{ width: '35%', height: 6, background: '#FEE2E2', borderRadius: 2 }} />
    </div>
  </div>
);

const AudioGenerationPanel: React.FC<AudioGenerationPanelProps> = ({ stage, isExpanded, onToggle, onRetry }) => {
  const getVisibleCount = () => {
    if (stage.status === 'completed') return MOCK_AUDIOS.length;
    if (stage.status === 'in-progress' || stage.status === 'failed') {
      if (stage.progress >= 85) return 5;
      if (stage.progress >= 65) return 4;
      if (stage.progress >= 45) return 3;
      if (stage.progress >= 25) return 2;
      if (stage.progress >= 10) return 1;
    }
    return 0;
  };
  const visibleCount = getVisibleCount();

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', cursor: 'pointer',
      }} onClick={onToggle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Music size={18} color="var(--agent-primary)" />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>音频生成</span>
          <StatusIcon status={stage.status} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {stage.status !== 'pending' && <span style={{ fontSize: 13, color: 'var(--agent-primary)', fontWeight: 600 }}>{stage.progress}%</span>}
          {isExpanded ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
        </div>
      </div>

      {isExpanded && (
        <div style={{ padding: '0 16px 14px' }}>
          {stage.status !== 'pending' && (
            <div style={{ height: 3, background: '#F1F5F9', borderRadius: 2, marginBottom: 10 }}>
              <div style={{
                height: '100%', borderRadius: 2,
                width: `${stage.progress}%`,
                background: stage.status === 'completed' ? 'var(--agent-primary)' : stage.status === 'failed' ? '#EF4444' : 'linear-gradient(90deg, var(--agent-primary), var(--agent-secondary))',
                transition: 'width 0.4s ease',
              }} />
            </div>
          )}

          {stage.status === 'completed' && (
            <p style={{ fontSize: 11, color: 'var(--agent-primary)', margin: '0 0 10px' }}>
              ✅ 已完成，可在编辑阶段替换音色或上传本地音频
            </p>
          )}
          {stage.status === 'failed' && (
            <div style={{ margin: '0 0 10px' }}>
              <p style={{ fontSize: 11, color: '#EF4444', margin: '0 0 8px' }}>
                ❌ {stage.error || '音频生成失败'}
              </p>
              <button onClick={onRetry} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '5px 12px', borderRadius: 5, border: '1px solid #FCA5A5',
                background: '#FEF2F2', color: '#EF4444', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}>
                <RotateCcw size={12} /> 重试
              </button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {MOCK_AUDIOS.map((audio, index) => (
              index < visibleCount ? (
                <CompactAudioCard key={audio.id} audio={audio} />
              ) : stage.status === 'failed' ? (
                <CompactFailedSkeleton key={audio.id} />
              ) : (
                <CompactLoadingSkeleton key={audio.id} index={index} />
              )
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes audioShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes waveAnim {
          0% { transform: scaleY(1); }
          100% { transform: scaleY(1.6); }
        }
      `}</style>
    </div>
  );
};

export default AudioGenerationPanel;
