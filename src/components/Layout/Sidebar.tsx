import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  FolderOpen,
  User,
  Monitor,
  PanelRight,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useConversationStore } from '../../store/conversationStore';
import Logo from './Logo';
import ChatHistory from '../Generator/ChatHistory';

const EXPANDED_WIDTH = 280;
const COLLAPSED_WIDTH = 64;

interface NavItem {
  key: string;
  label: string;
  icon: React.ElementType;
  route?: string;
  expandable?: boolean;
  isPrimary?: boolean;
}

const navItems: NavItem[] = [
  { key: 'new', label: '新建任务', icon: PlusCircle, route: '/', isPrimary: true },
  { key: 'library', label: '我的作品', icon: FolderOpen, route: '/library' },
];

const styles = {
  sidebar: (collapsed: boolean): React.CSSProperties => ({
    position: 'fixed',
    left: 0,
    top: 0,
    height: '100vh',
    width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
    background: '#DFF6FF',
    borderRight: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.2s ease',
    overflow: 'hidden',
    zIndex: 100,
  }),

  logoArea: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    minHeight: 64,
    flexShrink: 0,
  } as React.CSSProperties,

  logoWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  } as React.CSSProperties,

  logoText: {
    fontSize: 17,
    fontWeight: 600,
    color: '#1E293B',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  } as React.CSSProperties,

  collapseBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 6,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: '#94A3B8',
    flexShrink: 0,
    transition: 'background 0.15s ease, color 0.15s ease',
  } as React.CSSProperties,

  nav: {
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '8px 12px',
  } as React.CSSProperties,

  historySection: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    borderTop: '1px solid #E2E8F0',
    marginTop: 8,
  } as React.CSSProperties,

  primaryBtn: (collapsed: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'flex-start',
    gap: 10,
    width: '100%',
    padding: collapsed ? '10px 0' : '10px 14px',
    background: 'linear-gradient(135deg, #00C9A7, #00A8E8)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    transition: 'padding 0.2s ease, justify-content 0.2s ease, opacity 0.15s ease',
  }),

  navItem: (active: boolean, collapsed: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'flex-start',
    gap: 10,
    width: '100%',
    padding: collapsed ? '10px 0' : '10px 14px',
    background: active ? '#FFFFFF' : 'transparent',
    color: active ? '#00C9A7' : '#475569',
    border: 'none',
    borderRadius: active ? '0 8px 8px 0' : 8,
    marginRight: active ? '8px' : '0',
    borderLeft: active ? '3px solid #00C9A7' : '3px solid transparent',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: active ? 600 : 400,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    transition: 'background 0.15s ease, color 0.15s ease, padding 0.2s ease',
  }),

  userArea: (collapsed: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'flex-start',
    gap: 10,
    padding: '16px',
    borderTop: '1px solid #E2E8F0',
    flexShrink: 0,
    overflow: 'hidden',
  }),

  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #22C55E, #8B5CF6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
    flexShrink: 0,
  } as React.CSSProperties,

  userName: {
    fontSize: 14,
    fontWeight: 500,
    color: '#334155',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  } as React.CSSProperties,
} as const;

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar, appMode, setAppMode } = useUIStore();
  const { setActiveConversation } = useConversationStore();

  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const handleNavClick = (item: NavItem) => {
    if (item.key === 'new') {
      setActiveConversation(null);
      navigate('/');
      return;
    }

    if (item.route) {
      navigate(item.route);
    }
  };

  const isActive = (item: NavItem) => {
    if (item.key === 'new') return location.pathname === '/';
    if (item.route) return location.pathname === item.route;
    return false;
  };

  return (
    <aside style={styles.sidebar(sidebarCollapsed)}>
      {/* Logo */}
      <div style={styles.logoArea}>
        <div style={styles.logoWrapper}>
          <Logo size={28} />
          {!sidebarCollapsed && <span style={styles.logoText}>互动课件 AI Agent</span>}
        </div>
        {!sidebarCollapsed && (
          <button
            style={styles.collapseBtn}
            onClick={toggleSidebar}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F1F5F9';
              e.currentTarget.style.color = '#475569';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#94A3B8';
            }}
            title="收起侧边栏"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        {sidebarCollapsed && (
          <button
            style={styles.collapseBtn}
            onClick={toggleSidebar}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F1F5F9';
              e.currentTarget.style.color = '#475569';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#94A3B8';
            }}
            title="展开侧边栏"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);

          if (item.isPrimary) {
            return (
              <button
                key={item.key}
                style={{
                  ...styles.primaryBtn(sidebarCollapsed),
                  opacity: hoveredKey === item.key ? 0.9 : 1,
                }}
                onClick={() => handleNavClick(item)}
                onMouseEnter={() => setHoveredKey(item.key)}
                onMouseLeave={() => setHoveredKey(null)}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon size={20} style={{ flexShrink: 0 }} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          }

          return (
            <button
              key={item.key}
              style={{
                ...styles.navItem(active, sidebarCollapsed),
                background:
                  hoveredKey === item.key && !active ? 'rgba(255,255,255,0.5)' : active ? '#FFFFFF' : 'transparent',
              }}
              onClick={() => handleNavClick(item)}
              onMouseEnter={() => setHoveredKey(item.key)}
              onMouseLeave={() => setHoveredKey(null)}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon size={20} style={{ flexShrink: 0 }} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* History Section - Only show when expanded */}
      {!sidebarCollapsed && (
        <div style={styles.historySection}>
          <ChatHistory />
        </div>
      )}

      {/* User Area */}
      <div style={{ ...styles.userArea(sidebarCollapsed), justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
          <div style={styles.avatar}>
            <User size={18} />
          </div>
          {!sidebarCollapsed && <span style={styles.userName}>张老师</span>}
        </div>
        {!sidebarCollapsed && (
          <div style={{ display: 'flex', gap: 2 }}>
            <ModeIconBtn
              active={appMode === 'standalone'}
              tooltip="独立模式"
              onClick={() => setAppMode('standalone')}
            >
              <Monitor size={15} />
            </ModeIconBtn>
            <ModeIconBtn
              active={appMode === 'embedded'}
              tooltip="编辑器模式"
              onClick={() => setAppMode('embedded')}
            >
              <PanelRight size={15} />
            </ModeIconBtn>
          </div>
        )}
      </div>
    </aside>
  );
}

function ModeIconBtn({
  active,
  tooltip,
  onClick,
  children,
}: {
  active: boolean;
  tooltip: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 28, height: 28, borderRadius: 6, border: 'none',
        background: active ? '#00C9A7' : 'transparent',
        color: active ? '#fff' : '#94A3B8',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}

export default Sidebar;
