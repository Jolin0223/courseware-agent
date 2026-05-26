import { useEffect, useState } from 'react';
import { useUIStore } from '../store/uiStore';
import ModeSwitcher from '../components/Layout/ModeSwitcher';
import ResourceReplaceSidebar from '../components/Editor/ResourceReplaceSidebar';
import toast from '../utils/toast';
import type { EnhancedImageItem, AudioItem, VoiceOption } from '../types';

// 默认音色选项
const DEFAULT_VOICES: VoiceOption[] = [
  { id: 'female-1', name: '温柔女声', gender: 'female', description: '标准女音', isDefault: true },
  { id: 'female-2', name: '活泼女童', gender: 'female', description: '童声女音' },
  { id: 'male-1', name: '标准男声', gender: 'male', description: '标准男音' },
  { id: 'male-2', name: '活力男童', gender: 'male', description: '童声男音' },
];

// 模拟资源数据
const MOCK_IMAGES: EnhancedImageItem[] = [
  { id: 'img-1', label: '主界面背景', src: '/images/background.png', prompt: '色彩鲜艳的游戏主界面背景', status: 'completed' },
  { id: 'img-2', label: '动物角色', src: '/images/animal.png', prompt: '可爱的卡通小熊角色', status: 'completed' },
  { id: 'img-3', label: '奖励星星', src: '/images/star.png', prompt: '金色五角星', status: 'completed' },
];

const MOCK_AUDIOS: AudioItem[] = [
  { id: 'audio-1', label: '单词发音 - Apple', type: 'tts', status: 'completed', voiceId: 'female-1', duration: 1.2 },
  { id: 'audio-2', label: '单词发音 - Banana', type: 'tts', status: 'completed', voiceId: 'female-1', duration: 1.5 },
  { id: 'audio-3', label: '游戏背景音乐', type: 'bgm', status: 'completed', duration: 30.0 },
];

export default function EditorPage() {
  const {
    openEditorDrawer,
    insertedCoursewares,
    triggerVersionUpdate,
    updateInsertedCourseware,
    removeInsertedCourseware,
  } = useUIStore();

  const [images, setImages] = useState<EnhancedImageItem[]>(MOCK_IMAGES);
  const [audios, setAudios] = useState<AudioItem[]>(MOCK_AUDIOS);
  const [showResourcePanel, setShowResourcePanel] = useState(true);

  const hasInserted = insertedCoursewares.length > 0;
  const hasUpdate = insertedCoursewares.some(c => c.hasUpdate);
  const hasSourceDeleted = insertedCoursewares.some(c => c.isSourceDeleted);

  const bgImage = !hasInserted
    ? '/editor-assets/editor-overview.png'
    : hasUpdate
      ? '/editor-assets/inserted-style.png'
      : '/editor-assets/editor-bg.png';

  useEffect(() => {
    if (!hasInserted) return;
    const latest = insertedCoursewares[insertedCoursewares.length - 1];
    if (latest.hasUpdate || latest.isSourceDeleted) return;
    const timer = setTimeout(() => {
      triggerVersionUpdate(latest.id, 'v1.1');
      toast('互动课件有新版本可用，请查看编辑器');
    }, 8000);
    return () => clearTimeout(timer);
  }, [insertedCoursewares.length]);

  const handleSync = (e: React.MouseEvent) => {
    e.stopPropagation();
    const toUpdate = insertedCoursewares.find(c => c.hasUpdate);
    if (toUpdate) {
      updateInsertedCourseware(toUpdate.id, {
        version: toUpdate.latestVersion || toUpdate.version,
      });
      toast('课件已同步至最新版本~');
    }
  };

  // 资源替换处理函数
  const handleImageReplace = (imageId: string, file: File) => {
    setImages(prev => prev.map(img => 
      img.id === imageId 
        ? { ...img, src: URL.createObjectURL(file), source: 'upload', uploadFileName: file.name }
        : img
    ));
    toast(`图片 "${file.name}" 已上传`);
  };

  const handleImageRegenerate = (imageId: string, prompt: string) => {
    setImages(prev => prev.map(img => 
      img.id === imageId 
        ? { ...img, prompt, status: 'generating' }
        : img
    ));
    // 模拟生成完成
    setTimeout(() => {
      setImages(prev => prev.map(img => 
        img.id === imageId 
          ? { ...img, status: 'completed', src: img.src }
          : img
      ));
      toast('图片重新生成完成');
    }, 2000);
  };

  const handleAudioReplace = (audioId: string, file: File) => {
    setAudios(prev => prev.map(audio => 
      audio.id === audioId 
        ? { ...audio, source: 'upload', uploadFileName: file.name }
        : audio
    ));
    toast(`音频 "${file.name}" 已上传`);
  };

  const handleAudioRegenerate = (audioId: string, voiceId: string) => {
    const voice = DEFAULT_VOICES.find(v => v.id === voiceId);
    setAudios(prev => prev.map(audio => 
      audio.id === audioId 
        ? { ...audio, voiceId, status: 'generating' }
        : audio
    ));
    setTimeout(() => {
      setAudios(prev => prev.map(audio => 
        audio.id === audioId 
          ? { ...audio, status: 'completed' }
          : audio
      ));
      toast(`已使用"${voice?.name}"重新合成音频`);
    }, 1500);
  };

  return (
    <div
      onClick={hasUpdate ? handleSync : openEditorDrawer}
      style={{
        width: '100vw',
        height: '100vh',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
      }}
    >
      {/* 左侧：课件编辑区（占位） */}
      <div style={{ flex: 1, position: 'relative' }}>
        <img
          src={bgImage}
          alt="课件编辑器"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top left',
            display: 'block',
          }}
        />

        {/* 资源面板切换按钮 */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowResourcePanel(!showResourcePanel); }}
          style={{
            position: 'absolute',
            top: 12,
            right: showResourcePanel ? 340 : 16,
            zIndex: 10,
            padding: '8px 14px',
            borderRadius: 6,
            border: '1px solid #E2E8F0',
            background: '#fff',
            color: '#64748B',
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          {showResourcePanel ? '◀ 收起资源面板' : '▶ 打开资源面板'}
        </button>

        {/* 模式切换 */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ position: 'absolute', top: 12, right: showResourcePanel ? 500 : 140, zIndex: 10 }}
        >
          <ModeSwitcher />
        </div>
      </div>

      {/* 右侧：资源替换侧边栏 */}
      {showResourcePanel && (
        <div onClick={(e) => e.stopPropagation()} style={{ height: '100%' }}>
          <ResourceReplaceSidebar
            images={images}
            audios={audios}
            voices={DEFAULT_VOICES}
            onImageReplace={handleImageReplace}
            onImageRegenerate={handleImageRegenerate}
            onAudioReplace={handleAudioReplace}
            onAudioRegenerate={handleAudioRegenerate}
          />
        </div>
      )}

      {/* 源课件已下架提示 */}
      {hasSourceDeleted && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            background: '#FFF7ED',
            border: '1px solid #FDBA74',
            borderRadius: 12,
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            maxWidth: 520,
          }}
        >
          <span style={{ fontSize: 20 }}>⚠️</span>
          <span style={{ fontSize: 14, color: '#9A3412', flex: 1 }}>
            源互动课件已被作者下架，当前为缓存版本，无法同步更新
          </span>
          <button
            onClick={() => {
              const deleted = insertedCoursewares.find(c => c.isSourceDeleted);
              if (deleted) {
                removeInsertedCourseware(deleted.id);
                toast('已移除下架课件');
              }
            }}
            style={{
              padding: '6px 16px',
              background: '#fff',
              color: '#EA580C',
              border: '1px solid #FDBA74',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              outline: 'none',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FFF7ED'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
          >
            移除课件
          </button>
        </div>
      )}
    </div>
  );
}
