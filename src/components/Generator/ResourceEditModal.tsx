import React, { useState, useRef, useEffect } from 'react';
import { X, Image as ImageIcon, Music, Upload, RotateCcw, Play, Pause, Globe, ChevronDown, Wand2, ImagePlus, Check } from 'lucide-react';
import type { EnhancedImageItem, AudioItem, VoiceOption } from '../../types';
import toast from '../../utils/toast';
import { useConversationStore } from '../../store/conversationStore';

interface ResourceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReplace?: () => void;
  images: EnhancedImageItem[];
  audios: AudioItem[];
  voices: VoiceOption[];
  onImageReplace?: (imageId: string, file: File) => void;
  onImageRegenerate?: (imageId: string, prompt: string) => void;
  onAudioReplace?: (audioId: string, file: File) => void;
  onAudioRegenerate?: (audioId: string, voiceId: string) => void;
}

// 迷你播放器（内联）
const InlinePlayer: React.FC<{ label: string; duration?: number }> = ({ duration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const toggle = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      setIsPlaying(true);
      timerRef.current = setInterval(() => {
        setProgress(p => { if (p >= 1) { setIsPlaying(false); if (timerRef.current) clearInterval(timerRef.current); return 0; } return p + 0.025; });
      }, (duration || 2) * 25);
    }
  };

  useEffect(() => { return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, []);

  const durationText = (duration || 0) >= 60
    ? `${Math.floor((duration || 0) / 60)}:${Math.floor((duration || 0) % 60).toString().padStart(2, '0')}`
    : `${(duration || 0).toFixed(1)}s`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button onClick={toggle} style={{
        width: 22, height: 22, borderRadius: '50%', border: 'none', flexShrink: 0,
        background: isPlaying ? '#00C9A7' : '#F1F5F9', color: isPlaying ? '#fff' : '#64748B',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      }}>
        {isPlaying ? <Pause size={8} /> : <Play size={8} style={{ marginLeft: 1 }} />}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ height: 3, background: '#EEF2F6', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress * 100}%`, background: '#00C9A7', borderRadius: 2, transition: 'width 0.1s linear' }} />
        </div>
      </div>
      <span style={{ fontSize: 9, color: '#94A3B8', flexShrink: 0 }}>{durationText}</span>
    </div>
  );
};

// 图片编辑卡片 - 新设计
const ImageEditCard: React.FC<{
  image: EnhancedImageItem;
  onReplace?: (imageId: string, file: File) => void;
  onRegenerate?: (imageId: string, prompt: string) => void;
}> = ({ image, onRegenerate }) => {
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'upload' | 'transparent'>('text');
  const [promptText, setPromptText] = useState('');
  const [img2imgPrompt, setImg2imgPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAreaRef = useRef<HTMLDivElement>(null);

  const handleGenerate = (type: 'text' | 'image') => {
    const prompt = type === 'text' ? promptText : img2imgPrompt;
    if (!prompt.trim() && type === 'text') return;
    setIsGenerating(true);
    setGeneratedPreview(null);
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedPreview(image.src || '/images/background.png');
      if (type === 'text') onRegenerate?.(image.id, prompt);
    }, 2500);
  };

  const handleTransparent = () => {
    setIsGenerating(true);
    setGeneratedPreview(null);
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedPreview(image.src || '/images/background.png');
    }, 2000);
  };

  const handleFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) { toast('文件大小不能超过 2MB'); return; }
    if (!file.type.startsWith('image/')) { toast('请上传图片文件'); return; }
    const url = URL.createObjectURL(file);
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setUploadedPreview(url);
    }, 1500);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) handleFile(file);
        break;
      }
    }
  };

  const confirmUse = () => {
    toast(`已选用新图片: ${image.label}`);
    setGeneratedPreview(null);
    setUploadedPreview(null);
    setPromptText('');
    setImg2imgPrompt('');
  };

  const cancelUse = () => {
    setGeneratedPreview(null);
    setUploadedPreview(null);
    setPromptText('');
    setImg2imgPrompt('');
  };

  const newImage = generatedPreview || uploadedPreview;

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', marginBottom: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 12, padding: 12 }}>
        {/* 左侧：原图 */}
        <div style={{ width: 180, flexShrink: 0 }}>
          <div style={{
            width: 180, height: 180, borderRadius: 8, overflow: 'hidden',
            border: '1px solid #E2E8F0', marginBottom: 6,
          }}>
            <img src={image.src || '/images/background.png'} alt={image.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#334155', textAlign: 'center' }}>{image.label}</div>
        </div>

        {/* 右侧：操作区 + 新图预览 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 180 }} onPaste={handlePaste}>
          {!isGenerating && !isUploading && !newImage && (
            <>
              {/* Tab 切换 */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                {([['text', '文生图', ImagePlus], ['image', '图生图', Wand2], ['upload', '本地上传', Upload], ['transparent', '图片透明化', Globe]] as const).map(([key, label, Icon]) => (
                  <button key={key} onClick={() => setActiveTab(key as 'text' | 'image' | 'upload' | 'transparent')} style={{
                    padding: '6px 14px', borderRadius: 6, border: '1px solid ' + (activeTab === key ? '#00C9A7' : '#E2E8F0'),
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    background: activeTab === key ? '#F0FDF9' : '#fff',
                    color: activeTab === key ? '#00C9A7' : '#94A3B8',
                    transition: '0.15s', display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <Icon size={13} /> {label}
                  </button>
                ))}
              </div>

              {/* 提示文案 */}
              <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 6, minHeight: 14 }}>
                {activeTab === 'text' && '输入文字描述生成一张全新的图'}
                {activeTab === 'image' && '基于当前图片进行针对性优化修改'}
                {activeTab === 'upload' && '上传本地图片（不超过2MB）'}
                {activeTab === 'transparent' && '去除图片背景，生成透明底图片'}
              </div>

              {/* 输入区 */}
              {activeTab === 'text' && (
                <>
                  <textarea value={promptText} onChange={e => setPromptText(e.target.value)} placeholder="描述你想要的图片..." style={{
                    flex: 1, padding: '8px 10px', paddingTop: 8, borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 11, outline: 'none', marginBottom: 6,
                    resize: 'none', minHeight: 60, lineHeight: '1.4',
                  }} />
                  <button onClick={() => handleGenerate('text')} disabled={!promptText.trim()} style={{
                    width: '100%', padding: '8px 14px', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    background: !promptText.trim() ? '#F1F5F9' : '#00C9A7', color: !promptText.trim() ? '#CBD5E1' : '#fff',
                  }}>
                    生成
                  </button>
                </>
              )}
              {activeTab === 'image' && (
                <>
                  <textarea value={img2imgPrompt} onChange={e => setImg2imgPrompt(e.target.value)} placeholder="描述要如何修改..." style={{
                    flex: 1, padding: '8px 10px', paddingTop: 8, borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 11, outline: 'none', marginBottom: 6,
                    resize: 'none', minHeight: 60, lineHeight: '1.4',
                  }} />
                  <button onClick={() => handleGenerate('image')} style={{
                    width: '100%', padding: '8px 14px', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    background: '#00C9A7', color: '#fff',
                  }}>
                    生成
                  </button>
                </>
              )}
              {activeTab === 'upload' && (
                <div ref={uploadAreaRef} onClick={() => fileInputRef.current?.click()} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 6, border: '1.5px dashed #E2E8F0', textAlign: 'center', cursor: 'pointer',
                  fontSize: 11, color: '#94A3B8',
                }}>
                  点击或粘贴上传图片
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
                </div>
              )}
              {activeTab === 'transparent' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <div style={{ fontSize: 11, color: '#64748B', textAlign: 'center' }}>点击下方按钮去除当前图片背景</div>
                  <button onClick={handleTransparent} style={{
                    padding: '8px 24px', borderRadius: 6, border: 'none', background: '#00C9A7', color: '#fff',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <Globe size={13} /> 开始透明化
                  </button>
                </div>
              )}
            </>
          )}

          {/* 上传中 / 生成中 / 透明化中 / 生成后 */}
          {(isUploading || isGenerating || newImage) && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {(isUploading || isGenerating) ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #00C9A7', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ fontSize: 11, color: '#64748B' }}>
                    {isUploading ? '上传中...' : activeTab === 'transparent' ? '图片透明化中...' : '生成中...'}
                  </span>
                </div>
              ) : newImage ? (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  {/* 新图片 + 名称 */}
                  <div style={{ width: 180, flexShrink: 0 }}>
                    <div style={{ width: 180, height: 180, borderRadius: 8, overflow: 'hidden', border: '1px solid #E2E8F0', marginBottom: 6 }}>
                      <img src={newImage} alt="新图" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#334155', textAlign: 'center' }}>新图片</div>
                  </div>
                  {/* 按钮 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 65 }}>
                    <button onClick={confirmUse} style={{
                      padding: '8px 20px', borderRadius: 6, border: 'none', background: '#00C9A7', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                    }}>
                      <Check size={14} /> 使用此图
                    </button>
                    <button onClick={cancelUse} style={{
                      padding: '8px 20px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                    }}>
                      <X size={14} /> 取消
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 音频编辑卡片 - 新设计
const AudioEditCard: React.FC<{
  audio: AudioItem;
  voices: VoiceOption[];
  selected?: boolean;
  onToggleSelect?: (audioId: string) => void;
  onReplace?: (audioId: string, file: File) => void;
  onRegenerate?: (audioId: string, voiceId: string) => void;
  batchRegenerating?: boolean;
  batchReady?: boolean;
  onBatchUse?: (audioId: string) => void;
  onBatchCancel?: (audioId: string) => void;
}> = ({ audio, voices, selected, onToggleSelect, onReplace, onRegenerate, batchRegenerating, batchReady, onBatchUse, onBatchCancel }) => {
  const [selectedVoice, setSelectedVoice] = useState(audio.voiceId || voices[0]?.id || '');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newAudioReady, setNewAudioReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLoading = isRegenerating || isUploading || !!batchRegenerating;
  const hasNewAudio = newAudioReady || !!batchReady;
  const isDefault = !isLoading && !hasNewAudio;

  const handleRegenerateClick = (voiceId: string) => {
    setSelectedVoice(voiceId);
    setIsRegenerating(true);
    setNewAudioReady(false);
    setTimeout(() => {
      setIsRegenerating(false);
      setNewAudioReady(true);
      onRegenerate?.(audio.id, voiceId);
    }, 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setNewAudioReady(false);
    setTimeout(() => {
      setIsUploading(false);
      setNewAudioReady(true);
      if (onReplace) onReplace(audio.id, file);
    }, 1500);
  };

  const handleUseThis = () => {
    if (batchReady) {
      onBatchUse?.(audio.id);
    } else {
      toast(`已替换: ${audio.label}`);
      setNewAudioReady(false);
    }
  };

  const handleCancel = () => {
    if (batchReady) {
      onBatchCancel?.(audio.id);
    } else {
      setNewAudioReady(false);
    }
  };

  return (
    <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #EEF2F6', marginBottom: 8, padding: '12px 14px' }}>
      {/* 音频名称 + checkbox */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {audio.type === 'tts' && (
          <input
            type="checkbox"
            className="custom-checkbox"
            checked={!!selected}
            onChange={() => onToggleSelect?.(audio.id)}
          />
        )}
        <div style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{audio.label}</div>
      </div>

      {/* 默认状态：原始音频条 + 按钮 */}
      {isDefault && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 220, flexShrink: 0 }}>
            <InlinePlayer label={audio.label} duration={audio.duration} />
          </div>

          <button onClick={() => fileInputRef.current?.click()} style={{
            padding: '6px 12px', borderRadius: 5, border: '1px solid #EEF2F6', background: '#fff', color: '#64748B', fontSize: 11, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', fontWeight: 500,
          }}>
            <Upload size={11} /> 本地上传
          </button>
          <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileChange} style={{ display: 'none' }} />

          {audio.type === 'tts' && (
            <VoiceRegenerateDropdown 
              voices={voices} 
              selectedVoice={selectedVoice}
              onRegenerate={handleRegenerateClick}
            />
          )}
        </div>
      )}

      {/* Loading 状态：原始音频 + loading */}
      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 220, flexShrink: 0 }}>
            <InlinePlayer label={audio.label} duration={audio.duration} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0' }}>
            <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #00C9A7', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: 11, color: '#64748B' }}>{isUploading ? '上传中...' : '合成中...'}</span>
          </div>
        </div>
      )}

      {/* 新音频就绪：原始音频 + 新音频 + 按钮 */}
      {hasNewAudio && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 220, flexShrink: 0 }}>
            <InlinePlayer label={audio.label} duration={audio.duration} />
          </div>

          <div style={{ width: 220, flexShrink: 0, padding: '6px 8px', background: '#F0FDF9', borderRadius: 6, border: '1px solid rgba(0,201,167,0.15)' }}>
            <InlinePlayer label="新音频" duration={audio.duration} />
          </div>

          <button onClick={handleUseThis} style={{
            padding: '6px 12px', borderRadius: 5, border: 'none', background: '#00C9A7', color: '#fff', fontSize: 11, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', fontWeight: 600,
          }}>
            <Check size={11} /> 使用此音频
          </button>

          <button onClick={handleCancel} style={{
            padding: '6px 12px', borderRadius: 5, border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', fontSize: 11, cursor: 'pointer',
            whiteSpace: 'nowrap', fontWeight: 500,
          }}>
            取消
          </button>
        </div>
      )}
    </div>
  );
};

// 重新合成下拉组件
const VoiceRegenerateDropdown: React.FC<{
  voices: VoiceOption[];
  selectedVoice: string;
  onRegenerate: (voiceId: string) => void;
}> = ({ voices, selectedVoice, onRegenerate }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      <button onClick={() => setOpen(!open)} style={{
        padding: '6px 12px', borderRadius: 5, border: 'none', background: '#F0FDF9', color: '#00C9A7', fontSize: 11, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, whiteSpace: 'nowrap', fontWeight: 500, width: '100%',
      }}>
        <RotateCcw size={11} /> 重新合成 <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 10,
          background: '#fff', borderRadius: 6, border: '1px solid #E2E8F0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)', overflow: 'hidden', minWidth: 160,
        }}>
          {voices.map(v => (
            <div key={v.id} onClick={() => { onRegenerate(v.id); setOpen(false); }} style={{
              padding: '7px 10px', fontSize: 11, cursor: 'pointer',
              background: v.id === selectedVoice ? '#F0FDF9' : '#fff',
              color: v.id === selectedVoice ? '#00C9A7' : '#334155',
            }}
              onMouseEnter={e => { if (v.id !== selectedVoice) e.currentTarget.style.background = '#F8FAFC'; }}
              onMouseLeave={e => { if (v.id !== selectedVoice) e.currentTarget.style.background = '#fff'; }}
            >
              <div style={{ fontWeight: 500 }}>{v.name}</div>
              <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 1 }}>{v.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 主弹窗组件
const ResourceEditModal: React.FC<ResourceEditModalProps> = ({
  isOpen, onClose, onConfirmReplace, images, audios, voices,
  onImageReplace, onImageRegenerate, onAudioReplace, onAudioRegenerate,
}) => {
  const [activeTab, setActiveTab] = useState<'images' | 'audios'>('images');
  const [selectedAudioIds, setSelectedAudioIds] = useState<Set<string>>(new Set());
  const [batchVoiceId, setBatchVoiceId] = useState(voices[0]?.id || '');
  const [showBatchVoiceDropdown, setShowBatchVoiceDropdown] = useState(false);
  const [batchRegeneratingIds, setBatchRegeneratingIds] = useState<Set<string>>(new Set());
  const [batchReadyIds, setBatchReadyIds] = useState<Set<string>>(new Set());
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const batchVoiceRef = useRef<HTMLDivElement>(null);
  const addUserMessage = useConversationStore(s => s.addUserMessage);
  const activeConversationId = useConversationStore(s => s.activeConversationId);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (batchVoiceRef.current && !batchVoiceRef.current.contains(e.target as Node)) {
        setShowBatchVoiceDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!isOpen) return null;

  const ttsAudios = audios.filter(a => a.type === 'tts');
  const allTtsSelected = ttsAudios.length > 0 && ttsAudios.every(a => selectedAudioIds.has(a.id));
  const hasBatchReady = batchReadyIds.size > 0;

  const handleToggleSelect = (audioId: string) => {
    setSelectedAudioIds(prev => {
      const next = new Set(prev);
      if (next.has(audioId)) next.delete(audioId);
      else next.add(audioId);
      return next;
    });
  };

  const handleToggleAll = () => {
    if (allTtsSelected) {
      setSelectedAudioIds(new Set());
    } else {
      setSelectedAudioIds(new Set(ttsAudios.map(a => a.id)));
    }
  };

  const handleBatchRegenerate = () => {
    if (selectedAudioIds.size === 0 || !batchVoiceId) return;
    const ids = new Set(selectedAudioIds);
    setBatchRegeneratingIds(ids);
    setBatchReadyIds(new Set());
    const voiceName = voices.find(v => v.id === batchVoiceId)?.name || '';
    toast(`正在为 ${ids.size} 条音频使用"${voiceName}"合成...`);

    setTimeout(() => {
      setBatchRegeneratingIds(new Set());
      setBatchReadyIds(ids);
      ids.forEach(id => {
        onAudioRegenerate?.(id, batchVoiceId);
      });
    }, 2000);
    setSelectedAudioIds(new Set());
  };

  const handleBatchUse = (audioId: string) => {
    toast(`已替换: ${audios.find(a => a.id === audioId)?.label || ''}`);
    setBatchReadyIds(prev => {
      const next = new Set(prev);
      next.delete(audioId);
      return next;
    });
  };

  const handleBatchCancel = (audioId: string) => {
    setBatchReadyIds(prev => {
      const next = new Set(prev);
      next.delete(audioId);
      return next;
    });
  };

  const handleBatchUseAll = () => {
    batchReadyIds.forEach(id => {
      const label = audios.find(a => a.id === id)?.label || '';
      toast(`已替换: ${label}`);
    });
    setBatchReadyIds(new Set());
  };

  const handleBatchCancelAll = () => {
    setBatchReadyIds(new Set());
  };

  const handleConfirm = () => {
    if (activeConversationId) {
      addUserMessage(activeConversationId, '替换图片和音频资源~');
    }
    onConfirmReplace?.();
    toast('资源已替换');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '92%', maxWidth: 680, maxHeight: '88vh',
        background: '#fff', borderRadius: 14, display: 'flex', flexDirection: 'column',
        boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
        overflow: 'hidden',
      }}>
        {/* 头部 */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1E293B' }}>编辑资源</h3>
          <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>修改后自动更新到互动游戏中</p>
        </div>

        {/* Tab - 精致胶囊风格（绿色主题） */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #F1F5F9', flexShrink: 0, display: 'flex', gap: 10 }}>
          <button onClick={() => setActiveTab('images')} style={{
            flex: 1, padding: '9px 14px', borderRadius: 10, border: '1px solid ' + (activeTab === 'images' ? '#00C9A7' : '#E2E8F0'),
            cursor: 'pointer', fontSize: 12, fontWeight: 600, background: activeTab === 'images' ? '#F0FDF9' : '#fff',
            color: activeTab === 'images' ? '#00C9A7' : '#64748B',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.2s ease',
          }}>
            <ImageIcon size={14} /> 图片资源
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9,
              background: activeTab === 'images' ? '#00C9A7' : '#F1F5F9',
              fontSize: 10, fontWeight: 700, color: activeTab === 'images' ? '#fff' : '#94A3B8',
            }}>{images.length}</span>
          </button>
          <button onClick={() => setActiveTab('audios')} style={{
            flex: 1, padding: '9px 14px', borderRadius: 10, border: '1px solid ' + (activeTab === 'audios' ? '#00C9A7' : '#E2E8F0'),
            cursor: 'pointer', fontSize: 12, fontWeight: 600, background: activeTab === 'audios' ? '#F0FDF9' : '#fff',
            color: activeTab === 'audios' ? '#00C9A7' : '#64748B',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.2s ease',
          }}>
            <Music size={14} /> 音频资源
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9,
              background: activeTab === 'audios' ? '#00C9A7' : '#F1F5F9',
              fontSize: 10, fontWeight: 700, color: activeTab === 'audios' ? '#fff' : '#94A3B8',
            }}>{audios.length}</span>
          </button>
        </div>

        {/* 内容 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {activeTab === 'images' && images.map(img => (
            <ImageEditCard key={img.id} image={img} onReplace={onImageReplace} onRegenerate={onImageRegenerate} />
          ))}
          {activeTab === 'audios' && (
            <>
              {/* 批量操作栏 */}
              {ttsAudios.length > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                  background: '#F8FAFC', borderRadius: 8, marginBottom: 10, border: '1px solid #EEF2F6',
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11, color: '#334155', fontWeight: 500 }}>
                    <input
                      type="checkbox"
                      className="custom-checkbox"
                      checked={allTtsSelected}
                      onChange={handleToggleAll}
                    />
                    全选
                  </label>
                  <span style={{ fontSize: 10, color: '#94A3B8' }}>
                    已选 {selectedAudioIds.size}/{ttsAudios.length}
                  </span>
                  <div style={{ flex: 1 }} />
                  {/* 音色选择下拉 */}
                  <div ref={batchVoiceRef} style={{ position: 'relative' }}>
                    <button onClick={() => setShowBatchVoiceDropdown(!showBatchVoiceDropdown)} style={{
                      padding: '5px 10px', borderRadius: 5, border: '1px solid #E2E8F0', background: '#fff',
                      fontSize: 11, color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                      whiteSpace: 'nowrap', fontWeight: 500,
                    }}>
                      {voices.find(v => v.id === batchVoiceId)?.name || '选择音色'}
                      <ChevronDown size={12} style={{ color: '#94A3B8', transform: showBatchVoiceDropdown ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                    </button>
                    {showBatchVoiceDropdown && (
                      <div style={{
                        position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 10,
                        background: '#fff', borderRadius: 6, border: '1px solid #E2E8F0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)', overflow: 'hidden', minWidth: 160, maxHeight: 200, overflowY: 'auto',
                      }}>
                        {voices.map(v => (
                          <div key={v.id} onClick={() => { setBatchVoiceId(v.id); setShowBatchVoiceDropdown(false); }} style={{
                            padding: '8px 12px', fontSize: 11, cursor: 'pointer',
                            color: v.id === batchVoiceId ? '#00C9A7' : '#334155',
                            background: v.id === batchVoiceId ? '#F0FDF9' : '#fff',
                            fontWeight: v.id === batchVoiceId ? 600 : 400,
                          }}
                            onMouseEnter={e => { if (v.id !== batchVoiceId) e.currentTarget.style.background = '#F8FAFC'; }}
                            onMouseLeave={e => { if (v.id !== batchVoiceId) e.currentTarget.style.background = '#fff'; }}
                          >
                            {v.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* 批量合成按钮 */}
                  <button onClick={handleBatchRegenerate} disabled={selectedAudioIds.size === 0} style={{
                    padding: '5px 12px', borderRadius: 5, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    background: selectedAudioIds.size === 0 ? '#F1F5F9' : '#00C9A7',
                    color: selectedAudioIds.size === 0 ? '#CBD5E1' : '#fff',
                    display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                  }}>
                    <RotateCcw size={11} /> 批量合成
                  </button>
                  {/* 批量使用 / 取消按钮 */}
                  {hasBatchReady && (
                    <>
                      <button onClick={handleBatchUseAll} style={{
                        padding: '5px 12px', borderRadius: 5, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        background: '#00C9A7', color: '#fff',
                        display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                      }}>
                        <Check size={11} /> 全部使用
                      </button>
                      <button onClick={handleBatchCancelAll} style={{
                        padding: '5px 12px', borderRadius: 5, border: '1px solid #E2E8F0', fontSize: 11, fontWeight: 500, cursor: 'pointer',
                        background: '#fff', color: '#64748B', whiteSpace: 'nowrap',
                      }}>
                        全部取消
                      </button>
                    </>
                  )}
                </div>
              )}
              {audios.map(audio => (
                <AudioEditCard
                  key={audio.id}
                  audio={audio}
                  voices={voices}
                  selected={selectedAudioIds.has(audio.id)}
                  onToggleSelect={handleToggleSelect}
                  onReplace={onAudioReplace}
                  onRegenerate={onAudioRegenerate}
                  batchRegenerating={batchRegeneratingIds.has(audio.id)}
                  batchReady={batchReadyIds.has(audio.id)}
                  onBatchUse={handleBatchUse}
                  onBatchCancel={handleBatchCancel}
                />
              ))}
            </>
          )}
        </div>

        {/* 吸底操作 */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #F1F5F9', flexShrink: 0, position: 'relative' }}>
          {/* 二次确认弹窗 */}
          {showCancelConfirm && (
            <div style={{
              position: 'absolute', bottom: '100%', left: 20, marginBottom: 8,
              background: '#fff', borderRadius: 8, border: '1px solid #E2E8F0',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)', padding: '14px 16px', width: 280, zIndex: 5,
            }}>
              <div style={{ fontSize: 12, color: '#334155', fontWeight: 500, marginBottom: 12, lineHeight: 1.5 }}>
                取消后当前改动将不会生效，确认取消吗？
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowCancelConfirm(false)} style={{
                  padding: '5px 14px', borderRadius: 5, border: '1px solid #E2E8F0', background: '#fff',
                  color: '#64748B', fontSize: 11, fontWeight: 500, cursor: 'pointer',
                }}>
                  取消
                </button>
                <button onClick={() => { setShowCancelConfirm(false); onClose(); }} style={{
                  padding: '5px 14px', borderRadius: 5, border: 'none', background: '#EF4444',
                  color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                }}>
                  确认
                </button>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowCancelConfirm(true)} style={{
              flex: 1, padding: '10px 20px', borderRadius: 8, border: '1px solid #E2E8F0',
              background: '#fff', color: '#64748B',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              取消
            </button>
            <button onClick={handleConfirm} style={{
              flex: 2, padding: '10px 20px', borderRadius: 8, border: 'none',
              background: 'linear-gradient(135deg, #00C9A7, #00A8E8)', color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,201,167,0.2)',
            }}>
              确认全部替换
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .custom-checkbox {
          appearance: none;
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border: 1.5px solid #CBD5E1;
          border-radius: 3px;
          cursor: pointer;
          position: relative;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }
        .custom-checkbox:checked {
          background: #00C9A7;
          border-color: #00C9A7;
        }
        .custom-checkbox:checked::after {
          content: '';
          position: absolute;
          left: 3.5px;
          top: 0.5px;
          width: 4px;
          height: 7px;
          border: solid #fff;
          border-width: 0 1.5px 1.5px 0;
          transform: rotate(45deg);
        }
      `}</style>
    </div>
  );
};

export default ResourceEditModal;