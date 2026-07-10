import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Pin, Trash2, Edit3, MoreHorizontal, Loader2, History } from 'lucide-react';
import { useConversationStore } from '../../store/conversationStore';
import { useUIStore } from '../../store/uiStore';
import type { Conversation } from '../../types';

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
  const renameInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
          padding: '11px 10px',
          border: isActive ? '1px solid rgba(255,255,255,0.86)' : '1px solid transparent',
          background: isActive ? '#FFFFFF' : 'transparent',
          cursor: 'pointer',
          transition: 'all 0.15s',
          borderRadius: 10,
          marginBottom: 4,
          boxShadow: isActive ? '0 8px 20px rgba(37, 74, 120, 0.08)' : 'none',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.52)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.58)';
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
                  border: '2px solid var(--agent-primary)',
                  borderRadius: '8px',
                  padding: '2px 6px',
                  outline: 'none',
                }}
              />
            ) : (
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#1E293B',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {conv.title}
              </div>
            )}
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
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
                color: '#64748B',
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
                deleteConversation(conv.id);
                setExpandedMenuId(null);
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
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'transparent',
      }}
    >
      {/* Header with title and search */}
      <div style={{ padding: '16px 16px 10px' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {pinned.length > 0 ? (
                <Pin size={17} style={{ color: '#64748B' }} />
              ) : (
                <History size={18} style={{ color: '#64748B' }} />
              )}
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>
                {pinned.length > 0 ? '置顶任务' : '历史会话'}
              </span>
            </div>
            <button
              onClick={() => setIsSearchExpanded(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 34,
                height: 34,
                background: 'rgba(255,255,255,0.5)',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                color: '#64748B',
                transition: 'background 0.15s, color 0.15s',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--agent-soft)';
                e.currentTarget.style.color = 'var(--agent-primary-text)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.5)';
                e.currentTarget.style.color = '#64748B';
              }}
            >
              <Search size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Conversation list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 12px' }}>
        {pinned.map(renderConversation)}

        {pinned.length > 0 && unpinned.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '14px 6px 8px',
              color: '#64748B',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <History size={16} style={{ flexShrink: 0 }} />
            <span>历史会话</span>
          </div>
        )}

        {unpinned.map(renderConversation)}

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
      `}</style>
    </div>
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

export default ChatHistory;
