import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Image,
  Paperclip,
  Link,
  SendHorizontal,
  Square,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  isGenerating?: boolean;
  onStop?: () => void;
  centered?: boolean;
  placeholder?: string;
}

const LINE_HEIGHT = 22.5;
const MAX_LINES = 5;
const MAX_HEIGHT = LINE_HEIGHT * MAX_LINES;

const HOVER_CSS = `
  .ci-icon-btn:hover { color: #22C55E !important; background: #F0FDF4 !important; }
`;

import toast from '../../utils/toast';

interface AttachedFile {
  id: string;
  type: 'image' | 'file';
  name: string;
  url?: string;
  loading?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled, isGenerating, onStop, centered, placeholder = '输入修改意见或继续追问' }) => {
  const appMode = useUIStore((s) => s.appMode);
  const linkedCoursewareCount = useUIStore((s) => s.linkedCoursewareCount);
  const setLinkedCoursewareCount = useUIStore((s) => s.setLinkedCoursewareCount);
  const isEmbedded = appMode === 'embedded';
  const [text, setText] = useState('');
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [stopTooltip, setStopTooltip] = useState(false);

  const canSend = (text.trim().length > 0 || attachedFiles.some(f => !f.loading)) && !disabled;

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden';
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [text, resizeTextarea]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  }, [text, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendWithFiles();
    }
  };

  const handleImageUpload = () => {
    imageInputRef.current?.click();
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const id = Date.now().toString() + Math.random();
      setAttachedFiles(prev => [...prev, { id, type: 'image', name: file.name, loading: true }]);
      const url = URL.createObjectURL(file);
      setTimeout(() => {
        setAttachedFiles(prev => prev.map(f => f.id === id ? { ...f, url, loading: false } : f));
        toast(`图片 "${file.name}" 已添加`);
      }, 800 + Math.random() * 600);
    });
    e.target.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const id = Date.now().toString() + Math.random();
      setAttachedFiles(prev => [...prev, { id, type: 'file', name: file.name, loading: true }]);
      setTimeout(() => {
        setAttachedFiles(prev => prev.map(f => f.id === id ? { ...f, loading: false } : f));
        toast(`文件 "${file.name}" 已添加`);
      }, 1000 + Math.random() * 800);
    });
    e.target.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    let hasFile = false;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          hasFile = true;
          const id = Date.now().toString() + Math.random();
          setAttachedFiles(prev => [...prev, {
            id, type: 'image',
            name: `粘贴图片 ${prev.filter(f => f.type === 'image').length + 1}`,
            loading: true,
          }]);
          const url = URL.createObjectURL(file);
          setTimeout(() => {
            setAttachedFiles(prev => prev.map(f => f.id === id ? { ...f, url, loading: false } : f));
            toast('图片已粘贴添加');
          }, 600 + Math.random() * 400);
        }
      } else if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file && !file.type.startsWith('image/')) {
          hasFile = true;
          const id = Date.now().toString() + Math.random();
          setAttachedFiles(prev => [...prev, { id, type: 'file', name: file.name, loading: true }]);
          setTimeout(() => {
            setAttachedFiles(prev => prev.map(f => f.id === id ? { ...f, loading: false } : f));
            toast(`文件 "${file.name}" 已粘贴添加`);
          }, 800 + Math.random() * 600);
        }
      }
    }

    if (hasFile) e.preventDefault();
  };

  const removeAttachedFile = (id: string) => {
    setAttachedFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.url) {
        URL.revokeObjectURL(file.url);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleSendWithFiles = () => {
    if (attachedFiles.length > 0) {
      const fileNames = attachedFiles.map(f => f.name).join(', ');
      toast(`发送消息（包含 ${attachedFiles.length} 个附件：${fileNames}）`);
      // 清理附件
      attachedFiles.forEach(f => {
        if (f.url) URL.revokeObjectURL(f.url);
      });
      setAttachedFiles([]);
    }
    handleSend();
  };

  return (
    <>
      <style>{HOVER_CSS}</style>
      <input ref={imageInputRef} type="file" accept="image/*" multiple hidden onChange={handleImageSelect} />
      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt" multiple hidden onChange={handleFileSelect} />
      <div style={centered ? styles.wrapperCentered : styles.wrapperBottom}>
        <div
          style={{
            ...styles.container,
            border: isFocused ? '2px solid #00C9A7' : '1px solid #E2E8F0',
          }}
        >
          {/* 已上传文件预览区 */}
          {attachedFiles.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '4px 14px 4px' }}>
              {attachedFiles.map(file => (
                <div key={file.id} style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: file.type === 'image' ? 0 : '6px 10px',
                  background: '#F8FAFE',
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                  overflow: 'hidden',
                  ...(file.type === 'image' ? { width: 64, height: 64 } : {}),
                }}>
                  {file.loading ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '100%', height: '100%', minWidth: file.type === 'file' ? 80 : undefined,
                    }}>
                      <div style={{
                        width: 18, height: 18, border: '2px solid #E2E8F0',
                        borderTopColor: '#00C9A7', borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }} />
                      {file.type === 'file' && (
                        <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 6 }}>上传中...</span>
                      )}
                    </div>
                  ) : file.type === 'image' && file.url ? (
                    <img src={file.url} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <>
                      <Paperclip size={14} color="#64748B" />
                      <span style={{ fontSize: 12, color: '#334155', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                    </>
                  )}
                  {!file.loading && (
                    <button
                      onClick={() => removeAttachedFile(file.id)}
                      style={{
                        position: 'absolute', top: 2, right: 2,
                        width: 16, height: 16, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.5)', border: 'none',
                        color: '#fff', fontSize: 10, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            rows={3}
            style={styles.textarea}
          />

          <div style={styles.toolbar}>
            <div style={styles.toolGroup}>
              <button
                className="ci-icon-btn"
                style={styles.iconBtn}
                onClick={handleImageUpload}
                title="上传图片"
              >
                <Image size={20} />
              </button>

              <button
                className="ci-icon-btn"
                style={styles.iconBtn}
                onClick={handleFileUpload}
                title="上传附件"
              >
                <Paperclip size={20} />
              </button>

              {isEmbedded && (
                <button
                  className="ci-icon-btn"
                  style={styles.iconBtn}
                  onClick={() => setLinkModalOpen(true)}
                  title="关联课件"
                >
                  <Link size={20} />
                </button>
              )}
            </div>

            {isGenerating ? (
              <div style={{ position: 'relative' }}
                onMouseEnter={() => setStopTooltip(true)}
                onMouseLeave={() => setStopTooltip(false)}
              >
                {stopTooltip && (
                  <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: 6,
                    padding: '5px 10px',
                    background: 'rgba(0,0,0,0.75)',
                    color: '#fff',
                    fontSize: 12,
                    borderRadius: 6,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                  }}>停止输出</div>
                )}
                <button
                  style={{
                    ...styles.sendBtn,
                    background: '#00C9A7',
                    cursor: 'pointer',
                  }}
                  onClick={onStop}
                >
                  <Square size={14} color="#FFFFFF" fill="#FFFFFF" />
                </button>
              </div>
            ) : (
              <button
                style={{
                  ...styles.sendBtn,
                  background: canSend ? '#00C9A7' : '#CBD5E1',
                  cursor: canSend ? 'pointer' : 'not-allowed',
                }}
                disabled={!canSend}
                onClick={handleSend}
              >
                <SendHorizontal size={18} color="#FFFFFF" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 关联课件回显 */}
      {isEmbedded && linkedCoursewareCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', marginTop: 6,
          fontSize: 12, color: '#00C9A7', fontWeight: 500,
        }}>
          <Link size={13} />
          已关联 {linkedCoursewareCount} 个课件页面
        </div>
      )}

      {/* 关联课件弹窗 */}
      {linkModalOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)',
          }}
          onClick={() => setLinkModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 12, overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              maxWidth: 960, width: '95%',
              maxHeight: '90vh',
              display: 'flex', flexDirection: 'column',
            }}
          >
            <div style={{ flex: 1, overflow: 'auto' }}>
              <img
                src="/editor-assets/课件关联弹窗.png"
                alt="关联课件"
                style={{ width: '100%', display: 'block' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 16px', borderTop: '1px solid #E2E8F0' }}>
              <button
                onClick={() => setLinkModalOpen(false)}
                style={{
                  padding: '7px 20px', borderRadius: 6, border: '1px solid #E2E8F0',
                  background: '#fff', color: '#64748B', fontSize: 13, cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={() => {
                  setLinkedCoursewareCount(3);
                  setLinkModalOpen(false);
                  toast('已关联 3 个课件页面');
                }}
                style={{
                  padding: '7px 20px', borderRadius: 6, border: 'none',
                  background: '#00C9A7', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                确认关联
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapperCentered: {
    width: '100%',
    maxWidth: 720,
    margin: '0 auto',
  },
  wrapperBottom: {
    width: '100%',
  },
  container: {
    background: '#FFFFFF',
    borderRadius: 16,
    border: '1px solid #E2E8F0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    padding: '20px 24px',
    minWidth: 320,
  },
  textarea: {
    width: '100%',
    border: 'none',
    outline: 'none',
    fontSize: 15,
    lineHeight: 1.5,
    resize: 'none' as const,
    background: 'transparent',
    color: '#1E293B',
    overflowY: 'hidden',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  toolGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 8,
    background: 'none',
    border: 'none',
    color: '#64748B',
    cursor: 'pointer',
    transition: 'color 0.15s, background 0.15s',
  },
  sendBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: 'none',
    transition: 'background 0.15s',
  },
};

export default ChatInput;
