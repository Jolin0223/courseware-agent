import { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  FolderOpen,
  Monitor,
  PanelRight,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useConversationStore } from '../../store/conversationStore';
import Logo from './Logo';
import ChatHistory from '../Generator/ChatHistory';
import { AGENT_THEMES, applyAgentTheme, getStoredThemeId, type AgentThemeId } from '../../theme';

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
    background: 'var(--agent-sidebar)',
    borderRight: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.2s ease',
    overflow: 'hidden',
    zIndex: 100,
  }),

  logoArea: (collapsed: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'space-between',
    padding: collapsed ? '16px 0 12px' : '16px',
    minHeight: 64,
    flexShrink: 0,
  }),

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
    width: 30,
    height: 30,
    borderRadius: 10,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: '#64748B',
    flexShrink: 0,
    transition: 'background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease',
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
    background: 'var(--agent-hero-gradient)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 10,
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
    color: active ? 'var(--agent-primary)' : '#475569',
    border: active ? '1px solid rgba(255, 255, 255, 0.82)' : '1px solid transparent',
    borderRadius: 10,
    marginRight: 0,
    boxShadow: active ? '0 8px 20px rgba(37, 74, 120, 0.08)' : 'none',
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

  themeArea: {
    flexShrink: 0,
    padding: 0,
  } as React.CSSProperties,

  themeMiniBtn: {
    height: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '0 8px',
    border: '1px solid transparent',
    borderRadius: 10,
    background: 'transparent',
    color: '#8A9AAF',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: 'none',
    outline: 'none',
    transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
  } as React.CSSProperties,

  themeMiniLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  } as React.CSSProperties,

  themeTitle: {
    margin: '8px 0 6px',
    paddingLeft: 4,
    color: '#64748B',
    fontSize: 12,
    fontWeight: 800,
  } as React.CSSProperties,

  themeMiniDot: {
    width: 8,
    height: 8,
    borderRadius: 3,
    flexShrink: 0,
    opacity: 0.72,
    border: 'none',
  } as React.CSSProperties,

  themeButtons: {
    position: 'absolute',
    left: 12,
    bottom: 54,
    width: 188,
    display: 'grid',
    gap: 6,
    padding: 8,
    borderRadius: 12,
    border: '1px solid var(--agent-border)',
    background: '#FFFFFF',
    boxShadow: '0 16px 32px rgba(37, 74, 120, 0.14)',
    zIndex: 50,
  } as React.CSSProperties,

  themeBtn: {
    height: 30,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 10px',
    borderRadius: 10,
    border: '1px solid transparent',
    borderColor: 'transparent',
    background: 'rgba(255,255,255,0.44)',
    color: '#475569',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s',
    textAlign: 'left',
  } as React.CSSProperties,

  themeBtnActive: {
    background: '#FFFFFF',
    color: 'var(--agent-primary-text)',
    borderColor: 'var(--agent-border)',
    boxShadow: '0 4px 12px var(--agent-shadow)',
  } as React.CSSProperties,

  themeDot: {
    width: 14,
    height: 14,
    borderRadius: 5,
    flexShrink: 0,
    border: '1px solid rgba(15, 23, 42, 0.08)',
  } as React.CSSProperties,

  modeSwitch: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: 4,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.72)',
    border: '1px solid rgba(148, 163, 184, 0.24)',
    boxShadow: '0 4px 12px rgba(37, 74, 120, 0.06)',
  } as React.CSSProperties,

  bottomTools: {
    position: 'relative',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: '10px 12px 14px',
    borderTop: '1px solid #E2E8F0',
    overflow: 'visible',
  } as React.CSSProperties,

  hiddenModeHotspot: {
    width: 72,
    height: 38,
    border: 'none',
    background: 'transparent',
    padding: 0,
    cursor: 'default',
  } as React.CSSProperties,

  modeIconBtn: (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
    borderRadius: 10,
    border: active ? '1px solid var(--agent-primary)' : '1px solid transparent',
    background: active ? 'var(--agent-primary)' : '#FFFFFF',
    color: active ? '#FFFFFF' : '#64748B',
    cursor: 'pointer',
    transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
    boxShadow: active ? '0 6px 14px var(--agent-shadow)' : 'none',
  }),

} as const;

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar, appMode, setAppMode, closePreview } = useUIStore();
  const { setActiveConversation } = useConversationStore();

  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [themeExpanded, setThemeExpanded] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<AgentThemeId>(() => getStoredThemeId());
  const [modeSwitchVisible, setModeSwitchVisible] = useState(false);
  const hiddenModeClickCountRef = useRef(0);
  const hiddenModeClickTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  const handleThemeChange = (themeId: AgentThemeId) => {
    setCurrentTheme(themeId);
    applyAgentTheme(themeId);
    setThemeExpanded(false);
  };

  const handleHiddenModeHotspotClick = () => {
    if (modeSwitchVisible) return;
    hiddenModeClickCountRef.current += 1;
    if (hiddenModeClickTimerRef.current) {
      window.clearTimeout(hiddenModeClickTimerRef.current);
    }
    hiddenModeClickTimerRef.current = window.setTimeout(() => {
      hiddenModeClickCountRef.current = 0;
    }, 1200);
    if (hiddenModeClickCountRef.current >= 3) {
      setModeSwitchVisible(true);
      hiddenModeClickCountRef.current = 0;
      if (hiddenModeClickTimerRef.current) {
        window.clearTimeout(hiddenModeClickTimerRef.current);
        hiddenModeClickTimerRef.current = null;
      }
    }
  };

  const handleNavClick = (item: NavItem) => {
    if (item.key === 'new') {
      setActiveConversation(null);
      closePreview();
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
      <div style={styles.logoArea(sidebarCollapsed)}>
        {!sidebarCollapsed && (
          <div style={styles.logoWrapper}>
            <Logo size={28} />
            <span style={styles.logoText}>互动课件 AI Agent</span>
          </div>
        )}
        {!sidebarCollapsed && (
          <button
            style={styles.collapseBtn}
            onClick={toggleSidebar}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.72)';
              e.currentTarget.style.color = '#475569';
              e.currentTarget.style.boxShadow = '0 6px 14px rgba(37, 74, 120, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#64748B';
              e.currentTarget.style.boxShadow = 'none';
            }}
            title="收起侧边栏"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        {sidebarCollapsed && (
          <button
            style={{
              ...styles.collapseBtn,
              background: 'rgba(255,255,255,0.54)',
              border: '1px solid rgba(148, 163, 184, 0.22)',
            }}
            onClick={toggleSidebar}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.72)';
              e.currentTarget.style.color = '#475569';
              e.currentTarget.style.boxShadow = '0 6px 14px rgba(37, 74, 120, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.54)';
              e.currentTarget.style.color = '#64748B';
              e.currentTarget.style.boxShadow = 'none';
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

      <div style={styles.bottomTools}>
        {!sidebarCollapsed && (
          <div style={styles.themeArea}>
            <button
              type="button"
              style={styles.themeMiniBtn}
              onClick={() => setThemeExpanded(prev => !prev)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.32)';
                e.currentTarget.style.color = '#64748B';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#8A9AAF';
              }}
            >
              <span style={styles.themeMiniLeft}>
                <span
                  style={{
                    ...styles.themeMiniDot,
                    background: AGENT_THEMES.find(theme => theme.id === currentTheme)?.colors.primary || 'var(--agent-primary)',
                  }}
                />
                演示配色
              </span>
            </button>

            {themeExpanded && (
              <div style={styles.themeButtons}>
                {AGENT_THEMES.map(theme => {
                  const active = currentTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      style={{
                        ...styles.themeBtn,
                        ...(active ? styles.themeBtnActive : {}),
                      }}
                      onClick={() => handleThemeChange(theme.id)}
                    >
                      <span style={{ ...styles.themeDot, background: theme.colors.primary }} />
                      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {theme.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!sidebarCollapsed && !modeSwitchVisible && (
          <button
            type="button"
            aria-label="隐藏模式入口"
            style={styles.hiddenModeHotspot}
            onClick={handleHiddenModeHotspotClick}
          />
        )}

        {!sidebarCollapsed && modeSwitchVisible && (
          <div style={styles.modeSwitch}>
            <ModeIconBtn active={appMode === 'standalone'} label="独立模式" onClick={() => setAppMode('standalone')}>
              <Monitor size={15} />
            </ModeIconBtn>
            <ModeIconBtn active={appMode === 'embedded'} label="编辑器模式" onClick={() => setAppMode('embedded')}>
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
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={styles.modeIconBtn(active)}
      onMouseEnter={(event) => {
        if (active) return;
        event.currentTarget.style.background = 'var(--agent-soft)';
        event.currentTarget.style.color = 'var(--agent-primary-text)';
        event.currentTarget.style.borderColor = 'var(--agent-border)';
      }}
      onMouseLeave={(event) => {
        if (active) return;
        event.currentTarget.style.background = '#FFFFFF';
        event.currentTarget.style.color = '#64748B';
        event.currentTarget.style.borderColor = 'transparent';
      }}
    >
      {children}
    </button>
  );
}

export default Sidebar;
