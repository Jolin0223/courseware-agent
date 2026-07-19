import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, Pin, Trash2, Edit3, MoreHorizontal, Loader2, History, ChevronDown, ChevronRight } from 'lucide-react';
import { useConversationStore } from '../../store/conversationStore';
import { useUIStore } from '../../store/uiStore';
import type { Conversation } from '../../types';

type StickySection = 'pinned' | 'history';

const ChatHistory: React.FC = () => {
  const navigate = useNavigate();
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    deleteConversation,
    renameConversation,
    togglePinConversation,
  } = useConversationStore();
  const openPreview = useUIStore((s) => s.openPreview);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [pinnedCollapsed, setPinnedCollapsed] = useState(false);
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const [pendingDeleteConversation, setPendingDeleteConversation] = useState<Conversation | null>(null);
  const [activeStickySection, setActiveStickySection] = useState<StickySection>('pinned');
  const renameInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const historySectionRef = useRef<HTMLButtonElement>(null);
  const wheelSectionRef = useRef<StickySection | null>(null);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setExpandedMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinned = filtered.filter((c) => c.isPinned);
  const unpinned = filtered.filter((c) => !c.isPinned);
  const sortedConversations = [...pinned, ...unpinned];
  const topSectionIsPinned = pinned.length > 0;
  const hasSplitSections = pinned.length > 0 && unpinned.length > 0;
  const stickySection: StickySection = hasSplitSections
    ? activeStickySection
    : topSectionIsPinned
      ? 'pinned'
      : 'history';
  const stickySectionCollapsed = stickySection === 'pinned' ? pinnedCollapsed : historyCollapsed;

  const updateStickySection = useCallback(() => {
    if (!hasSplitSections) {
      setActiveStickySection(topSectionIsPinned ? 'pinned' : 'history');
      return;
    }

    const scrollNode = scrollRef.current;
    const historyNode = historySectionRef.current;
    if (!scrollNode || !historyNode) return;

    const historyBoundary = Math.max(0, historyNode.offsetTop - 1);
    const nextSection: StickySection = scrollNode.scrollTop >= historyBoundary
      ? 'history'
      : wheelSectionRef.current || 'pinned';
    setActiveStickySection(prev => prev === nextSection ? prev : nextSection);
  }, [hasSplitSections, topSectionIsPinned]);

  const handleHistoryWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    if (!hasSplitSections) return;

    const historyNode = historySectionRef.current;
    if (!historyNode) return;

    const nextSection: StickySection = event.clientY >= historyNode.getBoundingClientRect().top
      ? 'history'
      : 'pinned';
    wheelSectionRef.current = nextSection;
    setActiveStickySection(prev => prev === nextSection ? prev : nextSection);
  }, [hasSplitSections]);

  useEffect(() => {
    wheelSectionRef.current = null;
    const frame = window.requestAnimationFrame(updateStickySection);
    return () => window.cancelAnimationFrame(frame);
  }, [historyCollapsed, pinnedCollapsed, pinned.length, searchQuery, unpinned.length, updateStickySection]);

  const handleRenameSubmit = (id: string) => {
    if (renameValue.trim()) {
      renameConversation(id, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const handleConversationClick = (conversationId: string, coursewareId?: number) => {
    setActiveConversation(conversationId);
    if (coursewareId) {
      openPreview(coursewareId);
    }
    navigate('/');
  };

  const handleConfirmDelete = () => {
    if (!pendingDeleteConversation) return;
    deleteConversation(pendingDeleteConversation.id);
    setPendingDeleteConversation(null);
  };

  const renderConversation = (conv: Conversation) => {
    const isActive = conv.id === activeConversationId;
    const isMenuOpen = expandedMenuId === conv.id;
    const isRenaming = renamingId === conv.id;

    return (
      <div
        key={conv.id}
        onClick={() => handleConversationClick(conv.id, conv.coursewareId)}
        style={{
          position: 'relative',
          padding: '9px 8px',
          border: isActive ? '1px solid #FFFFFF' : '1px solid transparent',
          background: isActive ? 'rgba(255,255,255,0.92)' : 'transparent',
          cursor: 'pointer',
          transition: 'all 0.15s',
          borderRadius: 10,
          marginBottom: 4,
          boxShadow: isActive ? '0 8px 22px rgba(37, 74, 120, 0.11), 0 1px 2px rgba(15, 23, 42, 0.035)' : 'none',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.54)';
            e.currentTarget.style.borderColor = 'rgba(213, 232, 249, 0.64)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
          }
          if (!isMenuOpen) setExpandedMenuId(null);
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {isRenaming ? (
              <input
                ref={renameInputRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => handleRenameSubmit(conv.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit(conv.id);
                  if (e.key === 'Escape') {
                    setRenamingId(null);
                    setRenameValue('');
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#1E293B',
                  border: '1px solid rgba(2, 116, 252, 0.34)',
                  borderRadius: '7px',
                  padding: '1px 6px',
                  outline: 'none',
                  boxShadow: '0 0 0 2px rgba(2, 116, 252, 0.05)',
                  lineHeight: '20px',
                }}
              />
            ) : (
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#17233B',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {conv.title}
              </div>
            )}
            <div style={{ fontSize: '12px', color: '#8EA1B8', marginTop: '4px', fontWeight: 400 }}>
              {conv.createdAt}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            {conv.isGenerating && (
              <Loader2
                size={14}
                style={{ color: '#0EA5E9', animation: 'spin 1s linear infinite' }}
              />
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandedMenuId(isMenuOpen ? null : conv.id);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderRadius: '8px',
                color: '#718096',
                padding: 0,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--agent-soft)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div
            ref={menuRef}
            style={{
              position: 'absolute',
              right: '10px',
              top: '40px',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              boxShadow: '0 12px 32px rgba(37, 74, 120, 0.14)',
              zIndex: 10,
              overflow: 'hidden',
              minWidth: '120px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setRenamingId(conv.id);
                setRenameValue(conv.title);
                setExpandedMenuId(null);
              }}
              style={menuItemStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Edit3 size={14} />
              重命名
            </button>
            <button
              onClick={() => {
                togglePinConversation(conv.id);
                setExpandedMenuId(null);
              }}
              style={menuItemStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Pin size={14} />
              {conv.isPinned ? '取消置顶' : '置顶'}
            </button>
            <button
              onClick={() => {
                setExpandedMenuId(null);
                setPendingDeleteConversation(conv);
              }}
              style={{ ...menuItemStyle, color: '#EF4444' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#FEF2F2')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Trash2 size={14} />
              删除
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
    <div
      className="chat-history-shell"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'transparent',
        overflow: 'hidden',
      }}
    >
      {/* Header with title and search */}
      <div style={{ padding: topSectionIsPinned ? '12px 22px 8px' : '12px 14px 8px' }}>
        {isSearchExpanded ? (
          // Expanded search mode
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              border: '1px solid var(--agent-border)',
              borderRadius: '10px',
              background: '#FFFFFF',
              boxShadow: '0 8px 20px rgba(37, 74, 120, 0.08)',
            }}
          >
            <Search size={16} style={{ color: 'var(--agent-primary)', flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="搜索历史会话"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => {
                if (!searchQuery) setIsSearchExpanded(false);
              }}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '13px',
                color: '#1E293B',
                background: 'transparent',
              }}
              autoFocus
            />
          </div>
        ) : (
          // Normal mode - section title and search icon in one row
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: 34,
              padding: 0,
              background: 'transparent',
              border: 'none',
              borderRadius: 0,
            }}
          >
            <button
              type="button"
              onClick={() => {
                if (stickySection === 'pinned') {
                  setPinnedCollapsed(prev => !prev);
                } else {
                  setHistoryCollapsed(prev => !prev);
                }
              }}
              style={sectionToggleStyle}
            >
              {stickySection === 'pinned' ? (
                <Pin size={15} style={{ color: '#7D8FA6' }} />
              ) : (
                <History size={16} style={{ color: '#7D8FA6' }} />
              )}
              <span style={{ fontSize: '13px', fontWeight: 750, color: '#6F8199', letterSpacing: 0 }}>
                {stickySection === 'pinned' ? '置顶任务' : '历史会话'}
              </span>
              {stickySectionCollapsed ? (
                <ChevronRight size={14} style={{ color: '#94A3B8', flexShrink: 0 }} />
              ) : (
                <ChevronDown size={14} style={{ color: '#94A3B8', flexShrink: 0 }} />
              )}
            </button>
            <button
              onClick={() => setIsSearchExpanded(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 30,
                height: 30,
                background: 'rgba(255,255,255,0.42)',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                color: '#8EA1B8',
                transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
                outline: 'none',
                boxShadow: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.68)';
                e.currentTarget.style.color = 'var(--agent-primary-text)';
                e.currentTarget.style.boxShadow = '0 6px 14px rgba(37, 74, 120, 0.045)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.42)';
                e.currentTarget.style.color = '#8EA1B8';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Search size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Conversation list */}
      <div
        ref={scrollRef}
        className="chat-history-scroll"
        onScroll={updateStickySection}
        onWheelCapture={handleHistoryWheel}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '0 14px 12px',
        }}
      >
        {(!pinnedCollapsed || pinned.length === 0) && pinned.map(renderConversation)}

        {pinned.length > 0 && unpinned.length > 0 && (
          <button
            ref={historySectionRef}
            type="button"
            onClick={() => setHistoryCollapsed(prev => !prev)}
            style={{
              ...sectionToggleStyle,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              width: 'calc(100% + 28px)',
              margin: '14px -14px 10px',
              padding: '0 24px',
              minHeight: 48,
              boxSizing: 'border-box',
              background: 'var(--agent-history-divider-bg, rgba(225, 239, 252, 0.58))',
              border: 'none',
              borderRadius: 0,
              color: 'var(--agent-history-divider-text, #6F8199)',
              fontSize: 13,
              fontWeight: 750,
            }}
          >
            <History size={16} style={{ flexShrink: 0 }} />
            <span>历史会话</span>
            {historyCollapsed ? (
              <ChevronRight size={14} style={{ color: '#94A3B8', flexShrink: 0 }} />
            ) : (
              <ChevronDown size={14} style={{ color: '#94A3B8', flexShrink: 0 }} />
            )}
          </button>
        )}

        {!historyCollapsed && unpinned.map(renderConversation)}

        {sortedConversations.length === 0 && (
          <div
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              fontSize: '13px',
              color: '#94A3B8',
            }}
          >
            {searchQuery ? '没有找到匹配的会话' : '暂无会话记录'}
          </div>
        )}
      </div>

      {/* Spin keyframe */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .chat-history-shell,
        .chat-history-scroll {
          max-width: 100%;
        }
        .chat-history-scroll {
          scrollbar-width: none;
          overscroll-behavior: contain;
        }
        .chat-history-scroll::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }
      `}</style>
    </div>

    {pendingDeleteConversation && createPortal(
      <div
        style={deleteConfirmStyles.mask}
        onClick={() => setPendingDeleteConversation(null)}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-conversation-title"
          style={deleteConfirmStyles.dialog}
          onClick={(event) => event.stopPropagation()}
        >
          <div style={deleteConfirmStyles.iconWrap}>
            <Trash2 size={18} />
          </div>
          <div style={deleteConfirmStyles.content}>
            <h3 id="delete-conversation-title" style={deleteConfirmStyles.title}>删除会话</h3>
            <p style={deleteConfirmStyles.desc}>
              确认删除“{pendingDeleteConversation.title}”吗？删除后该会话记录将不可恢复。
            </p>
          </div>
          <div style={deleteConfirmStyles.actions}>
            <button
              type="button"
              style={deleteConfirmStyles.cancelBtn}
              onClick={() => setPendingDeleteConversation(null)}
            >
              取消
            </button>
            <button
              type="button"
              style={deleteConfirmStyles.deleteBtn}
              onClick={handleConfirmDelete}
            >
              删除
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
};

const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  width: '100%',
  padding: '8px 12px',
  border: 'none',
  background: 'transparent',
  fontSize: '13px',
  color: '#64748B',
  cursor: 'pointer',
  transition: 'background 0.15s',
};

const sectionToggleStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  minWidth: 0,
  border: 'none',
  background: 'transparent',
  padding: 0,
  margin: 0,
  cursor: 'pointer',
  outline: 'none',
  font: 'inherit',
  textAlign: 'left',
};

const deleteConfirmStyles: Record<string, React.CSSProperties> = {
  mask: {
    position: 'fixed',
    inset: 0,
    zIndex: 3000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background: 'rgba(15, 23, 42, 0.28)',
  },
  dialog: {
    width: 340,
    maxWidth: 'calc(100vw - 48px)',
    padding: 20,
    borderRadius: 14,
    background: '#FFFFFF',
    border: '1px solid rgba(226, 232, 240, 0.95)',
    boxShadow: '0 24px 64px rgba(15, 23, 42, 0.22)',
    display: 'grid',
    gridTemplateColumns: '40px 1fr',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: '#FEF2F2',
    color: '#EF4444',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    minWidth: 0,
  },
  title: {
    margin: 0,
    color: '#17233B',
    fontSize: 17,
    lineHeight: 1.35,
    fontWeight: 800,
  },
  desc: {
    margin: '6px 0 0',
    color: '#64748B',
    fontSize: 13,
    lineHeight: 1.55,
  },
  actions: {
    gridColumn: '1 / -1',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 4,
  },
  cancelBtn: {
    height: 34,
    padding: '0 14px',
    borderRadius: 9,
    border: '1px solid #E2E8F0',
    background: '#FFFFFF',
    color: '#475569',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  deleteBtn: {
    height: 34,
    padding: '0 14px',
    borderRadius: 9,
    border: 'none',
    background: '#EF4444',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
};

export default ChatHistory;
