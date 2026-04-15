import React, { useState, useRef, useEffect } from 'react';
import { Search, Pin, Trash2, Edit3, MoreHorizontal, Loader2, History } from 'lucide-react';
import { useConversationStore } from '../../store/conversationStore';

const ChatHistory: React.FC = () => {
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    deleteConversation,
    renameConversation,
    togglePinConversation,
  } = useConversationStore();

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
      <div style={{ padding: '16px 16px 12px' }}>
        {isSearchExpanded ? (
          // Expanded search mode
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              border: '2px solid #00C9A7',
              borderRadius: '8px',
              background: '#FFFFFF',
            }}
          >
            <Search size={16} style={{ color: '#00C9A7', flexShrink: 0 }} />
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
          // Normal mode - title and search icon in one row
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={18} style={{ color: '#64748B' }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>历史会话</span>
            </div>
            <button
              onClick={() => setIsSearchExpanded(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'transparent',
                border: '1px solid #A7F3D0',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                color: '#059669',
                transition: 'background 0.15s, border-color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#D1FAE5';
                e.currentTarget.style.borderColor = '#34D399';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = '#A7F3D0';
              }}
            >
              <Search size={14} />
              <span>搜索</span>
            </button>
          </div>
        )}
      </div>

      {/* Conversation list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sortedConversations.map((conv) => {
          const isActive = conv.id === activeConversationId;
          const isMenuOpen = expandedMenuId === conv.id;
          const isRenaming = renamingId === conv.id;

          return (
            <div
              key={conv.id}
              onClick={() => setActiveConversation(conv.id)}
              style={{
                position: 'relative',
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.3)',
                borderLeft: isActive ? '3px solid #00C9A7' : '3px solid transparent',
                background: isActive ? '#FFFFFF' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s',
                borderRadius: isActive ? '0 8px 8px 0' : '0',
                marginRight: isActive ? '8px' : '0',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.5)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
                if (!isMenuOpen) setExpandedMenuId(null);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Title */}
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
                        border: '2px solid #00C9A7',
                        borderRadius: '4px',
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

                {/* Status icons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  {conv.isPinned && <Pin size={14} style={{ color: '#0EA5E9' }} />}
                  {conv.isGenerating && (
                    <Loader2
                      size={14}
                      style={{ color: '#0EA5E9', animation: 'spin 1s linear infinite' }}
                    />
                  )}

                  {/* More button */}
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
                      borderRadius: '4px',
                      color: '#64748B',
                      padding: 0,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#D1FAE5')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>

              {/* Dropdown menu */}
              {isMenuOpen && (
                <div
                  ref={menuRef}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '40px',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
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
        })}

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
