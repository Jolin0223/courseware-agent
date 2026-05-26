import React, { useState, useRef } from 'react';
import { Image, Music, Upload, RotateCcw, Wand2, Scissors, Crop, ChevronDown, ChevronUp, Volume2 } from 'lucide-react';
import type { EnhancedImageItem, AudioItem, VoiceOption } from '../../types';

interface ResourceReplaceSidebarProps {
  images: EnhancedImageItem[];
  audios: AudioItem[];
  voices: VoiceOption[];
  onImageReplace?: (imageId: string, file: File) => void;
  onImageRegenerate?: (imageId: string, prompt: string) => void;
  onAudioReplace?: (audioId: string, file: File) => void;
  onAudioRegenerate?: (audioId: string, voiceId: string) => void;
}

// 图片资源卡片
const ImageResourceCard: React.FC<{
  image: EnhancedImageItem;
  onReplace?: (imageId: string, file: File) => void;
  onRegenerate?: (imageId: string, prompt: string) => void;
}> = ({ image, onReplace, onRegenerate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [promptText, setPromptText] = useState(image.prompt || '');
  const [activeTab, setActiveTab] = useState<'generate' | 'upload'>('generate');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onReplace) onReplace(image.id, file);
  };
  const handleRegenerate = () => {
    if (!promptText.trim()) return;
    setIsGenerating(true);
    onRegenerate?.(image.id, promptText);
    setTimeout(() => setIsGenerating(false), 2000);
  };
  const isUploaded = image.source === 'upload';

  return (
    <div style={{
      borderRadius: 10,
      border: '1px solid #E2E8F0',
      background: '#F8FAFC',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        cursor: 'pointer',
      }} onClick={() => setIsExpanded(!isExpanded)}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 6,
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          {image.src ? (
            <img src={image.src} alt={image.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              background: '#F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Image size={20} color="#CBD5E1" />
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#1E293B', display: 'block' }}>
            {image.label}
          </span>
          <span style={{
            fontSize: 11,
            padding: '2px 6px',
            borderRadius: 4,
            display: 'inline-block',
            marginTop: 4,
            background: isUploaded ? '#FEF3C7' : '#F0FDF9',
            color: isUploaded ? '#D97706' : '#00C9A7',
          }}>
            {isUploaded ? '本地上传' : 'AI生成'}
          </span>
        </div>
        {isExpanded ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
      </div>

      {isExpanded && (
        <div style={{ padding: '0 12px 12px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid #E2E8F0',
                background: activeTab === 'generate' ? '#F0FDF9' : '#fff',
                color: activeTab === 'generate' ? '#00C9A7' : '#64748B',
                fontSize: 12,
                cursor: 'pointer',
              }}
              onClick={() => setActiveTab('generate')}
            >
              <Wand2 size={14} /> AI生成
            </button>
            <button
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid #E2E8F0',
                background: activeTab === 'upload' ? '#F0FDF9' : '#fff',
                color: activeTab === 'upload' ? '#00C9A7' : '#64748B',
                fontSize: 12,
                cursor: 'pointer',
              }}
              onClick={() => setActiveTab('upload')}
            >
              <Upload size={14} /> 本地上传
            </button>
          </div>

          {activeTab === 'generate' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                style={{
                  width: '100%',
                  padding: 10,
                  borderRadius: 6,
                  border: '1px solid #E2E8F0',
                  fontSize: 13,
                  resize: 'none',
                  outline: 'none',
                }}
                placeholder="描述你想要的图片..."
                rows={3}
              />
              <button
                onClick={handleRegenerate}
                disabled={isGenerating || !promptText.trim()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'linear-gradient(135deg, #00C9A7, #00A8E8)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: isGenerating || !promptText.trim() ? 'not-allowed' : 'pointer',
                  opacity: isGenerating || !promptText.trim() ? 0.5 : 1,
                }}
              >
                {isGenerating ? '生成中...' : <><RotateCcw size={14} /> 重新生成</>}
              </button>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                paddingTop: 8,
                borderTop: '1px solid #E2E8F0',
              }}>
                <span style={{ fontSize: 11, color: '#94A3B8' }}>高级：</span>
                <button onClick={() => { /* 图生图 */ }} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: '1px solid #E2E8F0',
                  background: '#fff',
                  color: '#64748B',
                  fontSize: 11,
                  cursor: 'pointer',
                }}><Image size={12} /> 图生图</button>
                <button onClick={() => { /* 抠图 */ }} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: '1px solid #E2E8F0',
                  background: '#fff',
                  color: '#64748B',
                  fontSize: 11,
                  cursor: 'pointer',
                }}><Scissors size={12} /> 抠图</button>
                <button onClick={() => { /* 裁剪 */ }} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: '1px solid #E2E8F0',
                  background: '#fff',
                  color: '#64748B',
                  fontSize: 11,
                  cursor: 'pointer',
                }}><Crop size={12} /> 裁剪</button>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div style={{
              border: '2px dashed #E2E8F0',
              borderRadius: 8,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              background: '#FAFBFC',
            }} onClick={handleUploadClick}>
              <Upload size={24} color="#00C9A7" />
              <span style={{ fontSize: 13, color: '#64748B' }}>点击上传图片</span>
              <span style={{ fontSize: 11, color: '#94A3B8' }}>支持 JPG、PNG、WebP</span>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
        </div>
      )}
    </div>
  );
};

// 音频资源卡片
const AudioResourceCard: React.FC<{
  audio: AudioItem;
  voices: VoiceOption[];
  onReplace?: (audioId: string, file: File) => void;
  onRegenerate?: (audioId: string, voiceId: string) => void;
}> = ({ audio, voices, onReplace, onRegenerate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(audio.voiceId || voices.find(v => v.isDefault)?.id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUploaded = audio.source === 'upload';
  const currentVoice = voices.find(v => v.id === selectedVoice);

  const handleUploadClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onReplace) onReplace(audio.id, file);
  };
  const handleRegenerate = () => selectedVoice && onRegenerate?.(audio.id, selectedVoice);

  return (
    <div style={{
      borderRadius: 10,
      border: '1px solid #E2E8F0',
      background: '#F8FAFC',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        cursor: 'pointer',
      }} onClick={() => setIsExpanded(!isExpanded)}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 6,
          overflow: 'hidden',
          flexShrink: 0,
          background: '#F0FDF9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Music size={20} color="#00C9A7" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#1E293B', display: 'block' }}>
            {audio.label}
          </span>
          <span style={{
            fontSize: 11,
            padding: '2px 6px',
            borderRadius: 4,
            display: 'inline-block',
            marginTop: 4,
            background: isUploaded ? '#FEF3C7' : '#F0FDF9',
            color: isUploaded ? '#D97706' : '#00C9A7',
          }}>
            {isUploaded ? '本地上传' : currentVoice?.name || 'AI生成'}
          </span>
        </div>
        {isExpanded ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
      </div>

      {isExpanded && (
        <div style={{ padding: '0 12px 12px' }}>
          {audio.type === 'tts' && !isUploaded && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 10,
            }}>
              <span style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Volume2 size={14} /> 音色
              </span>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid #E2E8F0',
                  fontSize: 13,
                  outline: 'none',
                }}
              >
                {voices.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
              <button
                onClick={handleRegenerate}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#F0FDF9',
                  color: '#00C9A7',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={14} /> 重新合成
              </button>
            </div>
          )}
          <div style={{ paddingTop: 8, borderTop: '1px solid #E2E8F0' }}>
            <button
              onClick={handleUploadClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                width: '100%',
                padding: '8px 16px',
                borderRadius: 6,
                border: '1px solid #E2E8F0',
                background: '#fff',
                color: '#64748B',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <Upload size={14} /> {isUploaded ? '替换本地音频' : '上传本地音频'}
            </button>
            <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileChange} style={{ display: 'none' }} />
          </div>
          {isUploaded && audio.uploadFileName && (
            <div style={{ marginTop: 8, fontSize: 11, color: '#00C9A7' }}>
              当前文件: {audio.uploadFileName}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 主组件
const ResourceReplaceSidebar: React.FC<ResourceReplaceSidebarProps> = ({
  images,
  audios,
  voices,
  onImageReplace,
  onImageRegenerate,
  onAudioReplace,
  onAudioRegenerate,
}) => {
  const [activeSection, setActiveSection] = useState<'images' | 'audios'>('images');

  return (
    <div style={{
      width: 320,
      height: '100%',
      background: '#fff',
      borderLeft: '1px solid #E2E8F0',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1E293B', margin: 0, marginBottom: 4 }}>
          资源替换
        </h3>
        <span style={{ fontSize: 12, color: '#94A3B8' }}>替换后自动更新课件</span>
      </div>

      <div style={{
        display: 'flex',
        gap: 8,
        padding: '12px 16px',
        borderBottom: '1px solid #E2E8F0',
      }}>
        <button
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid #E2E8F0',
            background: activeSection === 'images' ? '#F0FDF9' : '#fff',
            color: activeSection === 'images' ? '#00C9A7' : '#64748B',
            fontSize: 13,
            cursor: 'pointer',
          }}
          onClick={() => setActiveSection('images')}
        >
          <Image size={16} /> 图片 ({images.length})
        </button>
        <button
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid #E2E8F0',
            background: activeSection === 'audios' ? '#F0FDF9' : '#fff',
            color: activeSection === 'audios' ? '#00C9A7' : '#64748B',
            fontSize: 13,
            cursor: 'pointer',
          }}
          onClick={() => setActiveSection('audios')}
        >
          <Music size={16} /> 音频 ({audios.length})
        </button>
      </div>

      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        {activeSection === 'images' && images.map(img => (
          <ImageResourceCard
            key={img.id}
            image={img}
            onReplace={onImageReplace}
            onRegenerate={onImageRegenerate}
          />
        ))}
        {activeSection === 'audios' && audios.map(audio => (
          <AudioResourceCard
            key={audio.id}
            audio={audio}
            voices={voices}
            onReplace={onAudioReplace}
            onRegenerate={onAudioRegenerate}
          />
        ))}
      </div>
    </div>
  );
};

export default ResourceReplaceSidebar;
