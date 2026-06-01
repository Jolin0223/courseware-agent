import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Eye, Download, CheckCircle2, Sparkles, Edit3 } from 'lucide-react';
import type { Courseware } from '../../types';
import { useUIStore } from '../../store/uiStore';
import { useConversationStore, getFrameworkForCourseware } from '../../store/conversationStore';
import toast from '../../utils/toast';
import ResourceEditModal from './ResourceEditModal';

// 默认音色选项
const DEFAULT_VOICES = [
  { id: 'female-1', name: '温柔女声', gender: 'female' as const, description: '标准女音，适合教学场景', isDefault: true },
  { id: 'female-2', name: '活泼女童', gender: 'female' as const, description: '童声女音，适合低龄互动' },
  { id: 'male-1', name: '标准男声', gender: 'male' as const, description: '标准男音，适合正式场景' },
  { id: 'male-2', name: '活力男童', gender: 'male' as const, description: '童声男音，适合趣味教学' },
];

// 模拟资源数据
const MOCK_IMAGES: Array<{ id: string; label: string; src: string; prompt: string; status: 'completed' | 'generating' }> = [
  { id: 'img-1', label: '主界面背景', src: '/images/background.png', prompt: '色彩鲜艳的游戏主界面背景', status: 'completed' },
  { id: 'img-2', label: '动物角色', src: '/images/animal.png', prompt: '可爱的卡通小熊角色', status: 'completed' },
  { id: 'img-3', label: '奖励星星', src: '/images/star.png', prompt: '金色五角星', status: 'completed' },
];

const MOCK_AUDIOS: Array<
  | { id: string; label: string; type: 'tts'; status: 'completed' | 'generating'; voiceId: string; duration: number }
  | { id: string; label: string; type: 'bgm'; status: 'completed' | 'generating'; duration: number }
> = [
  { id: 'audio-1', label: '单词发音 - Apple', type: 'tts', status: 'completed', voiceId: 'female-1', duration: 1.2 },
  { id: 'audio-2', label: '单词发音 - Banana', type: 'tts', status: 'completed', voiceId: 'female-1', duration: 1.5 },
  { id: 'audio-3', label: '游戏背景音乐', type: 'bgm', status: 'completed', duration: 30.0 },
];

export default function CoursewareCard({ courseware, version = 'v1.0', isLatest: isLatestProp = true }: { courseware: Courseware; version?: string; isLatest?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [images, setImages] = useState(MOCK_IMAGES);
  const [audios, setAudios] = useState(MOCK_AUDIOS);
  const [editDisabledTooltip, setEditDisabledTooltip] = useState(false);
  const [isLatest, setIsLatest] = useState(isLatestProp);
  const [currentVersion, setCurrentVersion] = useState(version);
  const navigate = useNavigate();
  const { appMode, insertCourseware } = useUIStore();
  const createCloneConversation = useConversationStore((s) => s.createCloneConversation);
  const addAssistantMessage = useConversationStore((s) => s.addAssistantMessage);
  const activeConversationId = useConversationStore((s) => s.activeConversationId);
  const isEmbedded = appMode === 'embedded';

  const handlePreview = () => {
    const win = window.open('', '_blank', 'width=1200,height=800');
    if (win && courseware.htmlContent) {
      win.document.write(courseware.htmlContent);
      win.document.close();
    }
  };


  const handleClone = () => {
    const framework = getFrameworkForCourseware(courseware.id);
    createCloneConversation(courseware.title, framework);
    setCopied(true);
    toast(`已创建同款会话：同款-${courseware.title}`);
    setTimeout(() => {
      setCopied(false);
      navigate('/');
    }, 600);
  };

  const handleImageReplace = (imageId: string, file: File) => {
    setImages(prev => prev.map(img => 
      img.id === imageId 
        ? { ...img, src: URL.createObjectURL(file), source: 'upload' as const, uploadFileName: file.name }
        : img
    ));
    toast(`图片 "${file.name}" 已上传`);
  };

  const handleImageRegenerate = (imageId: string, prompt: string) => {
    setImages(prev => prev.map(img => 
      img.id === imageId 
        ? { ...img, prompt, status: 'generating' as const }
        : img
    ));
    setTimeout(() => {
      setImages(prev => prev.map(img => 
        img.id === imageId 
          ? { ...img, status: 'completed' as const }
          : img
      ));
      toast('图片重新生成完成');
    }, 2000);
  };

  const handleAudioReplace = (audioId: string, file: File) => {
    setAudios(prev => prev.map(audio => 
      audio.id === audioId 
        ? { ...audio, source: 'upload' as const, uploadFileName: file.name }
        : audio
    ));
    toast(`音频 "${file.name}" 已上传`);
  };

  const handleAudioRegenerate = (audioId: string, voiceId: string) => {
    const voice = DEFAULT_VOICES.find(v => v.id === voiceId);
    setAudios(prev => prev.map(audio => 
      audio.id === audioId 
        ? { ...audio, voiceId, status: 'generating' as const }
        : audio
    ));
    setTimeout(() => {
      setAudios(prev => prev.map(audio => 
        audio.id === audioId 
          ? { ...audio, status: 'completed' as const }
          : audio
      ));
      toast(`已使用"${voice?.name}"重新合成音频`);
    }, 1500);
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: 14,
      border: '1px solid #E2E8F0',
      overflow: 'hidden',
      width: '100%',
      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #00C9A7 0%, #00A8E8 100%)',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>📚</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{courseware.title}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 3 }}>刚刚生成</div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
          padding: '6px 12px', borderRadius: 20, fontSize: 13, color: '#fff', fontWeight: 500,
        }}>
          <Sparkles size={14} />
          {currentVersion}
        </div>
      </div>

      <div style={{ padding: '14px 20px', display: 'flex', gap: 10, background: '#FAFBFC', flexWrap: 'wrap' }}>
        <button
          onClick={handleClone}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px',
            borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
            background: 'linear-gradient(135deg, #00C9A7, #00A8E8)', color: '#fff',
            transition: 'all 0.15s', outline: 'none',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,201,167,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          {copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
          {copied ? '已复制' : '一键同款'}
        </button>
        <div style={{ position: 'relative', display: 'inline-flex' }}
          onMouseEnter={() => { if (!isLatest) setEditDisabledTooltip(true); }}
          onMouseLeave={() => setEditDisabledTooltip(false)}
        >
          <button
            onClick={() => { if (isLatest) setShowEditModal(true); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px',
              borderRadius: 8, fontSize: 13, fontWeight: 500,
              cursor: isLatest ? 'pointer' : 'not-allowed',
              border: isLatest ? '1.5px solid #00C9A7' : '1px solid #E2E8F0',
              background: '#fff',
              color: isLatest ? '#00C9A7' : '#CBD5E1',
              opacity: isLatest ? 1 : 0.7,
              transition: 'all 0.15s', outline: 'none',
            }}
            onMouseEnter={e => { if (isLatest) { e.currentTarget.style.background = '#F0FDF9'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,201,167,0.15)'; } }}
            onMouseLeave={e => { if (isLatest) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = 'none'; } }}
          >
            <Edit3 size={15} />
            编辑资源
          </button>
          {editDisabledTooltip && !isLatest && (
            <div style={{
              position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
              marginBottom: 6, padding: '6px 10px', borderRadius: 6, background: '#1E293B', color: '#fff',
              fontSize: 11, whiteSpace: 'nowrap', zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}>
              当前为旧版，不支持编辑，请在最新版互动游戏上编辑资源哦~
            </div>
          )}
        </div>
        <button
          onClick={handlePreview}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px',
            borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
            border: '1px solid #E2E8F0', background: '#fff', color: '#475569',
            transition: 'all 0.15s', outline: 'none',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#00C9A7'; e.currentTarget.style.color = '#00C9A7'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#475569'; }}
        >
          <Eye size={15} />
          全屏预览
        </button>
        {isEmbedded && (
          <button
            onClick={() => {
              insertCourseware({
                id: courseware.id,
                title: courseware.title,
                version: 'v1.0',
                htmlContent: courseware.htmlContent,
                slideIndex: 0,
                hasUpdate: false,
              });
              toast(`"${courseware.title}" 已插入课件`);
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px',
              borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
              background: '#F59E0B', color: '#fff',
              transition: 'all 0.15s', outline: 'none',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(245,158,11,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <Download size={15} />
            插入课件
          </button>
        )}
      </div>

      <ResourceEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onConfirmReplace={() => {
          setIsLatest(false);
          setCurrentVersion(currentVersion);
          if (activeConversationId) {
            setTimeout(() => {
              addAssistantMessage(activeConversationId, '好的，已根据您替换的资源重新生成互动游戏 V2.0 版本 ✨', 'text');
              setTimeout(() => {
                const v2Result: import('../../types').CoursewareResult = {
                  title: courseware.title,
                  version: 'v2.0',
                };
                addAssistantMessage(activeConversationId, v2Result, 'courseware-result');
              }, 500);
            }, 800);
          }
        }}
        images={images}
        audios={audios}
        voices={DEFAULT_VOICES}
        onImageReplace={handleImageReplace}
        onImageRegenerate={handleImageRegenerate}
        onAudioReplace={handleAudioReplace}
        onAudioRegenerate={handleAudioRegenerate}
      />
    </div>
  );
}
