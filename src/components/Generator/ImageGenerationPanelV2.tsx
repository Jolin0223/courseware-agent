import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Upload, RotateCcw, CheckCircle2, Loader2, ChevronDown, ChevronUp, X, XCircle } from 'lucide-react';
import type { EnhancedImageItem } from '../../types';

interface ImageGenerationPanelV2Props {
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
  if (status === 'completed') return <CheckCircle2 size={16} color="#00C9A7" />;
  if (status === 'in-progress') return <Loader2 size={16} color="#00C9A7" style={{ animation: 'spin 1s linear infinite' }} />;
  if (status === 'failed') return <XCircle size={16} color="#EF4444" />;
  return null;
};

const MOCK_IMAGES: EnhancedImageItem[] = [
  { id: 'img-1', label: '主界面背景', src: '/images/background.png', prompt: '色彩鲜艳的游戏主界面背景', status: 'completed' },
  { id: 'img-2', label: '动物角色', src: '/images/animal.png', prompt: '可爱的卡通小熊角色', status: 'completed' },
  { id: 'img-3', label: '奖励星星', src: '/images/star.png', prompt: '金色五角星', status: 'completed' },
  { id: 'img-4', label: '道具图标', prompt: '游戏道具宝箱', status: 'pending' },
];

const ImageCard: React.FC<{ image: EnhancedImageItem }> = ({ image }) => {
  const [showPreview, setShowPreview] = useState(false);
  const isUploaded = image.source === 'upload';

  return (
    <>
      <div style={{
        borderRadius: 8,
        border: '1px solid #E2E8F0',
        background: '#fff',
        overflow: 'hidden',
      }}>
        <div
          style={{
            aspectRatio: '1/1',
            background: '#F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: image.src ? 'pointer' : 'default',
            position: 'relative',
          }}
          onClick={() => image.src && setShowPreview(true)}
        >
          {image.status === 'completed' && image.src ? (
            <>
              <img src={image.src} alt={image.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {isUploaded && (
                <div style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  background: 'rgba(0,201,167,0.9)',
                  color: '#fff',
                  fontSize: 10,
                  padding: '2px 6px',
                  borderRadius: 4,
                }}>
                  已上传
                </div>
              )}
            </>
          ) : image.status === 'generating' ? (
            <Loader2 size={24} color="#00C9A7" style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <ImageIcon size={24} color="#CBD5E1" />
          )}
        </div>
        <div style={{ padding: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 500 }}>{image.label}</span>
            <StatusIcon status={image.status} />
          </div>
          {image.prompt && (
            <div style={{ fontSize: 11, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {image.prompt.slice(0, 20)}...
            </div>
          )}
        </div>
      </div>

      {showPreview && image.src && (
        <div
          onClick={() => setShowPreview(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={() => setShowPreview(false)}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'rgba(255,255,255,0.9)',
              border: 'none',
              borderRadius: '50%',
              width: 36,
              height: 36,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
          <img src={image.src} alt={image.label} style={{ maxWidth: '80vw', maxHeight: '80vh', borderRadius: 8 }} />
        </div>
      )}
    </>
  );
};

const ImageGenerationPanelV2: React.FC<ImageGenerationPanelV2Props> = ({ stage, isExpanded, onToggle, onRetry }) => {
  const getVisibleCount = () => {
    if (stage.status === 'completed') return MOCK_IMAGES.length;
    if (stage.status === 'in-progress' || stage.status === 'failed') {
      const progressPerItem = 100 / MOCK_IMAGES.length;
      return Math.min(Math.floor(stage.progress / progressPerItem) + 1, MOCK_IMAGES.length);
    }
    return 0;
  };

  const visibleCount = getVisibleCount();

  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      border: '1px solid #E2E8F0',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        cursor: 'pointer',
      }} onClick={onToggle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ImageIcon size={18} color="#00C9A7" />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>图片生成</span>
          <StatusIcon status={stage.status} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {stage.status !== 'pending' && <span style={{ fontSize: 13, color: '#00C9A7', fontWeight: 600 }}>{stage.progress}%</span>}
          {isExpanded ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
        </div>
      </div>

      {isExpanded && (
        <div style={{ padding: '12px 16px' }}>
          {stage.status !== 'pending' && (
            <div style={{ height: 4, background: '#F1F5F9', borderRadius: 2, marginBottom: 12 }}>
              <div style={{
                height: '100%',
                borderRadius: 2,
                width: `${stage.progress}%`,
                background: stage.status === 'completed' ? '#00C9A7' : stage.status === 'failed' ? '#EF4444' : 'linear-gradient(90deg, #00C9A7, #00A8E8)',
                transition: 'width 0.4s ease',
              }} />
            </div>
          )}

          <p style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>
            为课件生成配套图片资源。
          </p>
          {stage.status === 'completed' && (
            <p style={{ fontSize: 12, color: '#00C9A7', marginBottom: 12 }}>
              ✅ 已完成，可在编辑阶段重新生成或上传本地图片
            </p>
          )}
          {stage.status === 'failed' && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: '#EF4444', margin: '0 0 8px' }}>
                ❌ {stage.error || '图片生成失败'}
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {MOCK_IMAGES.map((image, index) => (
              <div key={image.id}>
                {index < visibleCount ? (
                  <ImageCard image={image} />
                ) : stage.status === 'failed' ? (
                  <div style={{
                    borderRadius: 8,
                    border: '1px solid #FCA5A5',
                    overflow: 'hidden',
                    background: '#FEF2F2',
                  }}>
                    <div style={{
                      aspectRatio: '1/1',
                      position: 'relative',
                      overflow: 'hidden',
                      background: '#FEF2F2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <XCircle size={32} color="#EF4444" />
                    </div>
                    <div style={{ padding: 10 }}>
                      <div style={{ height: 12, background: '#FCA5A5', borderRadius: 4, marginBottom: 6, width: '70%' }} />
                      <div style={{ height: 10, background: '#FEE2E2', borderRadius: 4, width: '50%' }} />
                    </div>
                  </div>
                ) : (
                  <div style={{
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                    overflow: 'hidden',
                    background: '#F8FAFC',
                  }}>
                    <div style={{
                      aspectRatio: '1/1',
                      position: 'relative',
                      overflow: 'hidden',
                      background: '#F1F5F9',
                    }}>
                      {/* shimmer 动画层 */}
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(90deg, #F1F5F9 25%, #E8EDF2 37%, #F1F5F9 63%)',
                        backgroundSize: '200% 100%',
                        animation: 'imgShimmer 1.5s infinite',
                        animationDelay: `${index * 0.2}s`,
                      }} />
                      {/* 中心 loading 指示器 */}
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}>
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          border: '2.5px solid rgba(0,201,167,0.2)',
                          borderTopColor: '#00C9A7',
                          animation: 'spin 1s linear infinite',
                        }} />
                        <span style={{ fontSize: 10, color: '#94A3B8' }}>生成中</span>
                      </div>
                    </div>
                    <div style={{ padding: 10 }}>
                      <div style={{ height: 12, background: '#E2E8F0', borderRadius: 4, marginBottom: 6, width: '70%' }} />
                      <div style={{ height: 10, background: '#F1F5F9', borderRadius: 4, width: '50%' }} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes imgShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

export default ImageGenerationPanelV2;
