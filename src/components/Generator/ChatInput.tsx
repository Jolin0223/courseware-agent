import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Image,
  Paperclip,
  Link,
  SendHorizontal,
  Square,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import type { UploadedAttachment } from '../../types';

interface ChatInputProps {
  onSend: (text: string, attachments?: UploadedAttachment[]) => void;
  disabled?: boolean;
  isGenerating?: boolean;
  onStop?: () => void;
  centered?: boolean;
  placeholder?: string;
}

const LINE_HEIGHT = 22.5;
const MAX_LINES = 5;
const MAX_HEIGHT = LINE_HEIGHT * MAX_LINES;
const MAX_IMAGE_COUNT = 10;
const MAX_DOCUMENT_COUNT = 10;
const SUPPORTED_DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'md'];

const HOVER_CSS = `
  .ci-icon-btn:hover { color: #22C55E !important; background: #F0FDF4 !important; }
`;

import toast from '../../utils/toast';

interface AttachedFile {
  id: string;
  type: 'image' | 'document';
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
  const [hoveredFileId, setHoveredFileId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<AttachedFile | null>(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const dragFileIdRef = useRef<string | null>(null);

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
    const readyFiles = attachedFiles.filter(f => !f.loading);
    if ((!trimmed && readyFiles.length === 0) || disabled) return;
    onSend(trimmed, readyFiles.map(({ id, type, name, url }) => ({ id, type, name, url })));
    setText('');
    setAttachedFiles([]);
  }, [text, attachedFiles, disabled, onSend]);

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

  const isSupportedDocument = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    return SUPPORTED_DOCUMENT_EXTENSIONS.includes(ext);
  };

  const addImageFiles = (files: File[]) => {
    const currentImageCount = attachedFiles.filter(f => f.type === 'image').length;
    const availableSlots = MAX_IMAGE_COUNT - currentImageCount;
    if (availableSlots <= 0) {
      toast(`最多可上传 ${MAX_IMAGE_COUNT} 张图片`);
      return;
    }
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    if (validFiles.length > availableSlots) {
      toast(`最多可上传 ${MAX_IMAGE_COUNT} 张图片，本次仅添加前 ${availableSlots} 张`);
    }
    validFiles.slice(0, availableSlots).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const id = Date.now().toString() + Math.random();
      setAttachedFiles(prev => [...prev, { id, type: 'image', name: file.name, loading: true }]);
      const url = URL.createObjectURL(file);
      setTimeout(() => {
        setAttachedFiles(prev => prev.map(f => f.id === id ? { ...f, url, loading: false } : f));
        toast(`图片 "${file.name}" 已添加`);
      }, 800 + Math.random() * 600);
    });
  };

  const addDocumentFiles = (files: File[]) => {
    const currentDocumentCount = attachedFiles.filter(f => f.type === 'document').length;
    const availableSlots = MAX_DOCUMENT_COUNT - currentDocumentCount;
    if (availableSlots <= 0) {
      toast(`最多可上传 ${MAX_DOCUMENT_COUNT} 个附件`);
      return;
    }
    const validFiles = files.filter(isSupportedDocument);
    if (validFiles.length < files.length) {
      toast('附件仅支持 PDF、Word 和 MD 格式');
    }
    if (validFiles.length > availableSlots) {
      toast(`最多可上传 ${MAX_DOCUMENT_COUNT} 个附件，本次仅添加前 ${availableSlots} 个`);
    }
    validFiles.slice(0, availableSlots).forEach(file => {
      const id = Date.now().toString() + Math.random();
      setAttachedFiles(prev => [...prev, { id, type: 'document', name: file.name, loading: true }]);
      setTimeout(() => {
        setAttachedFiles(prev => prev.map(f => f.id === id ? { ...f, loading: false } : f));
        toast(`文件 "${file.name}" 已添加`);
      }, 1000 + Math.random() * 800);
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    addImageFiles(Array.from(files));
    e.target.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    addDocumentFiles(Array.from(files));
    e.target.value = '';
  };

  const handleDropUpload = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const documentFiles = files.filter(file => !file.type.startsWith('image/'));
    if (imageFiles.length) addImageFiles(imageFiles);
    if (documentFiles.length) addDocumentFiles(documentFiles);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    let hasFile = false;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          if (attachedFiles.filter(f => f.type === 'image').length >= MAX_IMAGE_COUNT) {
            toast(`最多可上传 ${MAX_IMAGE_COUNT} 张图片`);
            continue;
          }
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
          const ext = file.name.split('.').pop()?.toLowerCase() || '';
          if (!SUPPORTED_DOCUMENT_EXTENSIONS.includes(ext)) {
            toast('附件仅支持 PDF、Word 和 MD 格式');
            continue;
          }
          if (attachedFiles.filter(f => f.type === 'document').length >= MAX_DOCUMENT_COUNT) {
            toast(`最多可上传 ${MAX_DOCUMENT_COUNT} 个附件`);
            continue;
          }
          hasFile = true;
          const id = Date.now().toString() + Math.random();
          setAttachedFiles(prev => [...prev, { id, type: 'document', name: file.name, loading: true }]);
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
    handleSend();
  };

  const moveAttachedFile = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    setAttachedFiles(prev => {
      const fromIndex = prev.findIndex(file => file.id === fromId);
      const toIndex = prev.findIndex(file => file.id === toId);
      if (fromIndex < 0 || toIndex < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  return (
    <>
      <style>{HOVER_CSS}</style>
      <input ref={imageInputRef} type="file" accept="image/*" multiple hidden onChange={handleImageSelect} />
      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown,text/plain" multiple hidden onChange={handleFileSelect} />
      <div style={centered ? styles.wrapperCentered : styles.wrapperBottom}>
        <div
          onDragEnter={(e) => {
            if (Array.from(e.dataTransfer.types).includes('Files')) {
              e.preventDefault();
              setIsDraggingFiles(true);
            }
          }}
          onDragOver={(e) => {
            if (Array.from(e.dataTransfer.types).includes('Files')) {
              e.preventDefault();
              setIsDraggingFiles(true);
            }
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setIsDraggingFiles(false);
            }
          }}
          onDrop={(e) => {
            if (e.dataTransfer.files.length === 0) return;
            e.preventDefault();
            setIsDraggingFiles(false);
            handleDropUpload(Array.from(e.dataTransfer.files));
          }}
          style={{
            ...styles.container,
            border: isDraggingFiles
              ? '2px dashed #00C9A7'
              : isFocused ? '2px solid #00C9A7' : '1px solid #E2E8F0',
            background: isDraggingFiles ? '#F0FDF9' : '#FFFFFF',
          }}
        >
          {isDraggingFiles && (
            <div style={styles.dragHint}>松开即可上传图片、PDF、Word 或 MD 材料</div>
          )}
          {/* 已上传文件预览区 */}
          {attachedFiles.length > 0 && (
            <div style={styles.attachmentTray}>
              {attachedFiles.map((file, index) => (
                <div
                  key={file.id}
                  draggable={!file.loading}
                  onDragStart={() => { dragFileIdRef.current = file.id; }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragFileIdRef.current) moveAttachedFile(dragFileIdRef.current, file.id);
                    dragFileIdRef.current = null;
                  }}
                  onDragEnd={() => { dragFileIdRef.current = null; }}
                  onMouseEnter={() => setHoveredFileId(file.id)}
                  onMouseLeave={() => setHoveredFileId(prev => prev === file.id ? null : prev)}
                  onClick={() => {
                    if (!file.loading && file.type === 'image' && file.url) {
                      setPreviewImage(file);
                    }
                  }}
                  title="拖动可调整材料顺序"
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: file.type === 'image' ? 'center' : 'flex-start',
                    gap: 6,
                    padding: file.type === 'image' ? 0 : '6px 10px',
                    background: '#F8FAFE',
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                    overflow: 'hidden',
                    cursor: file.loading ? 'default' : file.type === 'image' ? 'zoom-in' : 'grab',
                    ...(file.type === 'image' ? { width: 64, height: 64 } : {}),
                  }}
                >
                  {!file.loading && hoveredFileId === file.id && (
                    <span style={styles.orderBadge}>{index + 1}</span>
                  )}
                  {file.loading ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '100%', height: '100%', minWidth: file.type === 'document' ? 80 : undefined,
                    }}>
                      <div style={{
                        width: 18, height: 18, border: '2px solid #E2E8F0',
                        borderTopColor: '#00C9A7', borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }} />
                      {file.type === 'document' && (
                        <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 6 }}>上传中...</span>
                      )}
                    </div>
                  ) : file.type === 'image' && file.url ? (
                    <img src={file.url} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <>
                      <Paperclip size={14} color="#64748B" />
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontSize: 12, color: '#334155', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                        <span style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>发送后识别用途</span>
                      </div>
                    </>
                  )}
                  {!file.loading && hoveredFileId === file.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAttachedFile(file.id);
                      }}
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
                onClick={handleSendWithFiles}
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

      {previewImage?.url && (
        <div style={styles.previewMask} onClick={() => setPreviewImage(null)}>
          <div style={styles.previewDialog} onClick={e => e.stopPropagation()}>
            <img src={previewImage.url} alt={previewImage.name} style={styles.previewImage} />
            <div style={styles.previewFooter}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{previewImage.name}</span>
              <button onClick={() => setPreviewImage(null)} style={styles.previewClose}>关闭</button>
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
    padding: '18px 24px',
    minWidth: 320,
    transition: 'border 0.15s, background 0.15s',
  },
  dragHint: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    marginBottom: 10,
    borderRadius: 10,
    background: '#CCFBF1',
    color: '#047857',
    fontSize: 13,
    fontWeight: 700,
  },
  attachmentTray: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    padding: '2px 0 14px',
    marginBottom: 2,
  },
  orderBadge: {
    position: 'absolute',
    left: 3,
    top: 3,
    minWidth: 16,
    height: 16,
    padding: '0 4px',
    borderRadius: 999,
    background: 'rgba(15, 23, 42, 0.62)',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 700,
    lineHeight: '16px',
    textAlign: 'center',
    zIndex: 2,
    pointerEvents: 'none',
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
  previewMask: {
    position: 'fixed',
    inset: 0,
    zIndex: 3000,
    background: 'rgba(15, 23, 42, 0.62)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  previewDialog: {
    maxWidth: '78vw',
    maxHeight: '84vh',
    background: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 24px 80px rgba(15, 23, 42, 0.28)',
  },
  previewImage: {
    display: 'block',
    maxWidth: '78vw',
    maxHeight: '74vh',
    objectFit: 'contain',
  },
  previewFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '10px 12px',
    fontSize: 13,
    color: '#334155',
    borderTop: '1px solid #E2E8F0',
  },
  previewClose: {
    border: 'none',
    borderRadius: 6,
    padding: '6px 12px',
    background: '#00C9A7',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0,
  },
};

export default ChatInput;
