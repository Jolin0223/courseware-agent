import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatInput from '../components/Generator/ChatInput';
// ChatHistory moved to Sidebar
import RequirementCard from '../components/Generator/RequirementCard';
import ProgressPanel from '../components/Generator/ProgressPanel';
import PreviewPanel from '../components/Generator/PreviewPanel';
import CoursewareCard from '../components/Generator/CoursewareCard';
import InspirationSection from '../components/Generator/InspirationSection';
import { useConversationStore, simulateGeneration } from '../store/conversationStore';
import { useUIStore } from '../store/uiStore';
import { useCoursewareStore } from '../store/coursewareStore';
import type { ConversationMessage, RequirementFramework, GenerationProgress, CoursewareResult, Courseware } from '../types';
import { generateRequirementFromPrompt } from '../data/mockConversations';
import { mockCoursewares } from '../data/mockCoursewares';

type GenerationPhase = 'input' | 'analyzing' | 'loading-framework' | 'framework' | 'generating' | 'completed';

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    height: '100vh',
    background: '#F8FAFE',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  chatArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px 24px 24px 48px',
    display: 'flex',
    flexDirection: 'column',
  },
  messagesContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    width: '100%',
    transition: 'padding-right 0.3s ease',
  },
  inputArea: {
    padding: '16px 24px 24px',
    width: '100%',
    transition: 'padding-right 0.3s ease',
  },
  welcomeSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: '40px 24px',
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 700,
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 40,
    textAlign: 'center',
  },
  analyzingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    padding: '48px 24px',
    width: '100%',
  },
  messageUser: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  userBubble: {
    background: 'linear-gradient(135deg, #00C9A7, #00D4A0)',
    color: '#FFFFFF',
    padding: '12px 16px',
    borderRadius: '16px 16px 4px 16px',
    maxWidth: '80%',
    fontSize: 15,
    lineHeight: 1.5,
  },
  messageAssistant: {
    display: 'flex',
    justifyContent: 'flex-start',
    gap: 10,
  },
  assistantBubble: {
    background: '#FFFFFF',
    color: '#1E293B',
    padding: '12px 16px',
    borderRadius: '16px 16px 16px 4px',
    maxWidth: '80%',
    fontSize: 15,
    lineHeight: 1.5,
    border: '1px solid #E2E8F0',
  },
};

function UserMessage({ content }: { content: string }) {
  return (
    <div style={styles.messageUser}>
      <div style={styles.userBubble}>{content}</div>
    </div>
  );
}

const AIAvatar: React.FC = () => (
  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #00C9A7, #00A8E8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>AI</span>
  </div>
);

const SimpleStreamText: React.FC<{ text: string; speed?: number }> = ({ text, speed = 25 }) => {
  const [displayed, setDisplayed] = useState('');
  const idxRef = useRef(0);

  useEffect(() => {
    idxRef.current = 0;
    setDisplayed('');
    const timer = setInterval(() => {
      idxRef.current += 2;
      if (idxRef.current >= text.length) {
        setDisplayed(text);
        clearInterval(timer);
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
        <span style={{ display: 'inline-block', width: 2, height: 16, background: '#00C9A7', marginLeft: 2, animation: 'blink 0.8s infinite', verticalAlign: 'text-bottom' }} />
      )}
    </span>
  );
};

function AssistantMessage({ message, phase, frameworkDone, onFrameworkStreamComplete, streamDuration }: { 
  message: ConversationMessage; 
  phase?: string;
  frameworkDone?: boolean;
  onFrameworkStreamComplete?: () => void;
  streamDuration?: number;
}) {
  if (message.type === 'requirement-framework') {
    return (
      <div style={styles.messageAssistant}>
        <AIAvatar />
        <div style={{ flex: 1, minWidth: 0 }}>
          <RequirementCard 
            framework={message.content as RequirementFramework}
            isStreaming={phase === 'framework' && !frameworkDone}
            streamDuration={streamDuration}
            onStreamComplete={onFrameworkStreamComplete}
          />
        </div>
      </div>
    );
  }
  
  if (message.type === 'generation-progress') {
    return (
      <div style={styles.messageAssistant}>
        <AIAvatar />
        <div style={{ flex: 1, minWidth: 0 }}>
          <ProgressPanel progress={message.content as GenerationProgress} />
        </div>
      </div>
    );
  }
  
  if (message.type === 'courseware-result') {
    const result = message.content as CoursewareResult;
    const courseware = mockCoursewares.find(c => c.title === result.title) || {
      id: Date.now(),
      title: result.title,
      subject: '英语',
      grade: '三年级',
      type: '单词拼写',
      author: '张老师',
      publishTime: new Date().toISOString().split('T')[0],
      views: 0,
      favorites: 0,
      likes: 0,
      htmlContent: '',
      isOwn: true,
    };
    
    return (
      <div style={styles.messageAssistant}>
        <AIAvatar />
        <div style={{ flex: 1, minWidth: 0 }}>
          <CoursewareCard courseware={courseware} />
        </div>
      </div>
    );
  }
  
  return (
    <div style={styles.messageAssistant}>
      <AIAvatar />
      <div style={styles.assistantBubble}>
        <SimpleStreamText text={message.content as string} />
      </div>
    </div>
  );
}

export default function GeneratorPage() {
  const {
    conversations,
    activeConversationId,
    createNewConversation,
    addUserMessage,
    addAssistantMessage,
    isGenerating,
    startGeneration,
    completeGeneration,
  } = useConversationStore();
  
  const { previewPanelOpen, previewCoursewareId, openPreview, closePreview, setSidebarCollapsed } = useUIStore();
  const { addCourseware } = useCoursewareStore();
  
  const [phase, setPhase] = useState<GenerationPhase>('input');
  const [chatWidth, setChatWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [frameworkDone, setFrameworkDone] = useState(false);
  const frameworkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingFrameworkRef = useRef<string | null>(null);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = { startX: e.clientX, startWidth: chatWidth };

    const handleMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const container = document.querySelector('[style*="flex: 1"]')?.parentElement;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setChatWidth(Math.min(80, Math.max(30, pct)));
    };

    const handleUp = () => {
      setIsDragging(false);
      dragRef.current = null;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [chatWidth]);
  
  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const hasMessages = activeConversation && activeConversation.messages.length > 0;
  const chatAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatAreaRef.current) {
      requestAnimationFrame(() => {
        chatAreaRef.current!.scrollTop = chatAreaRef.current!.scrollHeight;
      });
    }
  }, [activeConversation?.messages.length, phase]);

  useEffect(() => {
    if (!activeConversation) return;
    const hasFramework = activeConversation.messages.some(m => m.type === 'requirement-framework');
    const hasProgress = activeConversation.messages.some(m => m.type === 'generation-progress');
    const hasResult = activeConversation.messages.some(m => m.type === 'courseware-result');
    const isClone = activeConversation.title.startsWith('同款-');
    if (hasResult) {
      setPhase('completed');
      setFrameworkDone(true);
    } else if (hasProgress) {
      setPhase('generating');
      setFrameworkDone(true);
    } else if (hasFramework && phase === 'input') {
      setPhase('framework');
      setFrameworkDone(isClone ? false : true);
    }
  }, [activeConversationId]);
  
  const handleSend = useCallback((text: string) => {
    let convId = activeConversationId;
    
    if (!convId) {
      convId = createNewConversation(text);
    }
    
    addUserMessage(convId, text);
    setPhase('analyzing');
    setFrameworkDone(false);
    
    // 分析 loading → AI 文案 → 小圆点loading 30秒 → 需求框架（流式）
    setTimeout(() => {
      addAssistantMessage(convId!, '我已理解您的需求，正在为您生成需求确认框架。', 'text');
      setPhase('loading-framework');
      
      const framework = generateRequirementFromPrompt(text);
      pendingFrameworkRef.current = convId!;

      frameworkTimerRef.current = setTimeout(() => {
        addAssistantMessage(convId!, framework, 'requirement-framework');
        setPhase('framework');
        pendingFrameworkRef.current = null;
      }, 10000);
    }, 1500);
  }, [activeConversationId, createNewConversation, addUserMessage, addAssistantMessage]);
  
  const handleConfirmFramework = useCallback((skipMessage?: string) => {
    if (!activeConversationId) return;
    
    addUserMessage(activeConversationId, skipMessage || '我已确认需求，立即生成。');
    
    setTimeout(() => {
      setPhase('generating');
      startGeneration(activeConversationId);
      
      const initialProgress: GenerationProgress = {
        stages: [
          { name: '图片生成', status: 'pending', progress: 0 },
          { name: '代码生成', status: 'pending', progress: 0 },
          { name: '代码审查', status: 'pending', progress: 0 },
          { name: '代码修复', status: 'pending', progress: 0 },
        ],
      };
      addAssistantMessage(activeConversationId, initialProgress, 'generation-progress');
      
      const controller = new AbortController();
      abortControllerRef.current = controller;

      simulateGeneration(
        activeConversationId,
        (updatedProgress) => {
          useConversationStore.setState(state => ({
            conversations: state.conversations.map(c =>
              c.id === activeConversationId
                ? {
                    ...c,
                    messages: c.messages.map(m =>
                      m.type === 'generation-progress' ? { ...m, content: updatedProgress } : m
                    ),
                  }
                : c
            ),
          }));
        },
        (result, coursewareId) => {
          const newCourseware: Courseware = {
            id: coursewareId,
            title: result.title,
            subject: '英语',
            grade: '三年级',
            type: '单词拼写',
            author: '张老师',
            publishTime: new Date().toISOString().split('T')[0],
            views: 0,
            favorites: 0,
            likes: 0,
            htmlContent: mockCoursewares[0].htmlContent,
            isOwn: true,
            isPublished: false,
          };
          addCourseware(newCourseware);
          addAssistantMessage(activeConversationId!, result, 'courseware-result');
          completeGeneration(activeConversationId!, result, coursewareId);
          setPhase('completed');
          setSidebarCollapsed(true);
          openPreview(coursewareId);
          abortControllerRef.current = null;
        },
        controller.signal
      );
    }, 500);
  }, [activeConversationId, addUserMessage, startGeneration, addAssistantMessage, completeGeneration, addCourseware, setSidebarCollapsed, openPreview]);

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (frameworkTimerRef.current) {
      clearTimeout(frameworkTimerRef.current);
      frameworkTimerRef.current = null;
    }
    pendingFrameworkRef.current = null;
    if (activeConversationId) {
      useConversationStore.setState(state => ({
        conversations: state.conversations.map(c =>
          c.id === activeConversationId ? { ...c, isGenerating: false } : c
        ),
        isGenerating: false,
      }));
      addAssistantMessage(activeConversationId, '系统已暂停回答~', 'text');
    }
    setPhase('input');
  }, [activeConversationId, addAssistantMessage]);

  const handleSkipFramework = useCallback(() => {
    if (frameworkTimerRef.current) {
      clearTimeout(frameworkTimerRef.current);
      frameworkTimerRef.current = null;
    }
    pendingFrameworkRef.current = null;
    handleConfirmFramework('我已跳过确认需求，直接生成吧~');
  }, [handleConfirmFramework]);
  
  const renderContent = () => {
    if (!hasMessages && phase === 'input') {
      return (
        <div style={styles.welcomeSection}>
          <h1 style={styles.welcomeTitle}>欢迎使用 AIGC <span style={{ background: 'linear-gradient(135deg, #00C9A7, #00A8E8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>互动课件</span></h1>
          <p style={styles.welcomeSubtitle}>一句话生成教学互动游戏，让课堂更精彩</p>
          <div style={{ width: '100%', maxWidth: 720 }}>
            <ChatInput onSend={handleSend} centered disabled={isGenerating} placeholder="在这里输入你想要的互动游戏，比如生成一个字母大小写配对游戏" />
          </div>
          <div style={{ width: '100%', marginTop: 48 }}>
            <InspirationSection />
          </div>
        </div>
      );
    }
    
    return (
      <>
        <div ref={chatAreaRef} style={styles.chatArea}>
          <div style={styles.messagesContainer}>
            <AnimatePresence mode="popLayout">
              {activeConversation?.messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {msg.role === 'user' ? (
                    <UserMessage content={msg.content as string} />
                  ) : (
                    <AssistantMessage 
                      message={msg} 
                      phase={phase}
                      frameworkDone={frameworkDone}
                      onFrameworkStreamComplete={() => setFrameworkDone(true)}
                      streamDuration={activeConversation?.title.startsWith('同款-') ? 2000 : undefined}
                    />
                  )}
                </motion.div>
              ))}
              
              {phase === 'analyzing' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div style={styles.analyzingContainer}>
                    <div style={{ position: 'relative', width: 56, height: 56 }}>
                      <svg width="56" height="56" viewBox="0 0 56 56" style={{ animation: 'spin 1.2s linear infinite' }}>
                        <defs>
                          <linearGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#00C9A7" />
                            <stop offset="100%" stopColor="#00A8E8" />
                          </linearGradient>
                        </defs>
                        <circle cx="28" cy="28" r="24" fill="none" stroke="#F1F5F9" strokeWidth="4" />
                        <circle cx="28" cy="28" r="24" fill="none" stroke="url(#spinnerGradient)" strokeWidth="4" strokeLinecap="round" strokeDasharray="100 51" />
                      </svg>
                    </div>
                    <span style={{ color: '#475569', fontSize: 15, fontWeight: 500 }}>正在分析您的需求...</span>
                    <span style={{ color: '#94A3B8', fontSize: 13 }}>AI 正在理解您的教学目标和互动需求</span>
                  </div>
                </motion.div>
              )}

              {phase === 'loading-framework' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ padding: '8px 0 8px 44px' }}
                >
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00C9A7', animation: 'dotBounce 1.4s infinite ease-in-out both', animationDelay: '0s' }} />
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00A8E8', animation: 'dotBounce 1.4s infinite ease-in-out both', animationDelay: '0.16s' }} />
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00C9A7', animation: 'dotBounce 1.4s infinite ease-in-out both', animationDelay: '0.32s' }} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {(phase === 'loading-framework' || phase === 'framework') && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 24px 0' }}>
            {phase === 'loading-framework' || !frameworkDone ? (
              <button
                onClick={handleSkipFramework}
                style={{
                  padding: '10px 28px',
                  background: '#fff',
                  color: '#00C9A7',
                  border: '1px solid #00C9A7',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  outline: 'none',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,201,167,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
              >
                跳过确认，直接生成
              </button>
            ) : (
              <button
                onClick={() => handleConfirmFramework()}
                style={{
                  padding: '10px 28px',
                  background: 'linear-gradient(135deg, #00C9A7, #00A8E8)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  outline: 'none',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                确认需求，开始生成
              </button>
            )}
          </div>
        )}

        <div style={styles.inputArea}>
          <ChatInput 
            onSend={handleSend} 
            disabled={false} 
            isGenerating={phase !== 'input' && phase !== 'completed'}
            onStop={handleStop}
          />
        </div>
      </>
    );
  };
  
  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Main Content */}
        <div style={{ ...styles.mainContent, flex: previewPanelOpen ? undefined : 1, width: previewPanelOpen ? `${chatWidth}%` : '100%' }}>
          {renderContent()}
        </div>

        {/* Draggable Divider + Preview Panel */}
        {previewPanelOpen && previewCoursewareId && (
          <>
            <div
              onMouseDown={handleDragStart}
              style={{
                width: 6,
                cursor: 'col-resize',
                background: isDragging ? '#00C9A7' : '#E2E8F0',
                transition: isDragging ? 'none' : 'background 0.15s',
                flexShrink: 0,
                position: 'relative',
                zIndex: 2,
              }}
              onMouseEnter={e => { if (!isDragging) e.currentTarget.style.background = '#CBD5E1'; }}
              onMouseLeave={e => { if (!isDragging) e.currentTarget.style.background = '#E2E8F0'; }}
            >
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 2, height: 32, borderRadius: 1, background: isDragging ? '#fff' : '#94A3B8' }} />
            </div>
            <div style={{ width: `${100 - chatWidth}%`, flexShrink: 0, overflow: 'hidden' }}>
              <PreviewPanel 
                coursewareId={previewCoursewareId} 
                onClose={closePreview} 
              />
            </div>
          </>
        )}
      </div>
      
      {/* Global styles */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
