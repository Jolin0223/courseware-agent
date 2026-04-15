import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Eye, Download, CheckCircle2, Sparkles } from 'lucide-react';
import type { Courseware } from '../../types';
import { useUIStore } from '../../store/uiStore';
import { useConversationStore, getFrameworkForCourseware } from '../../store/conversationStore';
import toast from '../../utils/toast';

export default function CoursewareCard({ courseware }: { courseware: Courseware }) {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const { appMode, insertCourseware } = useUIStore();
  const createCloneConversation = useConversationStore((s) => s.createCloneConversation);
  const isEmbedded = appMode === 'embedded';

  const handlePreview = () => {
    const win = window.open('', '_blank', 'width=1200,height=800');
    if (win && courseware.htmlContent) {
      win.document.write(courseware.htmlContent);
      win.document.close();
    }
  };

  const handleDownload = () => {
    if (!courseware.htmlContent) return;
    const blob = new Blob([courseware.htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${courseware.title}.html`;
    a.click();
    URL.revokeObjectURL(url);
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
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 3 }}>v1.0 · 刚刚生成</div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
          padding: '6px 12px', borderRadius: 20, fontSize: 13, color: '#fff', fontWeight: 500,
        }}>
          <Sparkles size={14} />
          生成完成
        </div>
      </div>

      <div style={{ padding: '14px 20px', display: 'flex', gap: 10, background: '#FAFBFC' }}>
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
          预览
        </button>
        <button
          onClick={handleDownload}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px',
            borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
            border: '1px solid #E2E8F0', background: '#fff', color: '#475569',
            transition: 'all 0.15s', outline: 'none',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#00C9A7'; e.currentTarget.style.color = '#00C9A7'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#475569'; }}
        >
          <Download size={15} />
          下载
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
    </div>
  );
}
