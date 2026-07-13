import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useUIStore } from '../../store/uiStore';
import { useConversationStore } from '../../store/conversationStore';
import { PlusCircle, FolderOpen } from 'lucide-react';

const embeddedTabs = [
  { key: '/', label: '新建互动课件', icon: PlusCircle },
  { key: '/library', label: '我的创作', icon: FolderOpen },
];

const MainLayout = ({ embedded }: { embedded?: boolean }) => {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const closePreview = useUIStore((s) => s.closePreview);
  const setActiveConversation = useConversationStore((s) => s.setActiveConversation);
  const navigate = useNavigate();
  const location = useLocation();

  const openTab = (path: string) => {
    if (path === '/') {
      setActiveConversation(null);
      closePreview();
    }
    navigate(path);
  };

  if (embedded) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' as const, height: '100%' }}>
        <div style={{ display: 'flex', gap: 4, padding: '8px 16px', background: '#fff', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
          {embeddedTabs.map(tab => {
            const active = location.pathname === tab.key || (tab.key === '/' && location.pathname === '/');
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => openTab(tab.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 6, border: 'none',
                  background: active ? 'var(--agent-primary)' : 'transparent',
                  color: active ? '#fff' : '#64748B',
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
        <main data-app-scroll-container="true" style={{ flex: 1, overflowY: 'auto', background: 'var(--agent-page-bg)' }}>
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main
        data-app-scroll-container="true"
        style={{
          marginLeft: sidebarCollapsed ? 64 : 260,
          height: '100vh',
          overflowY: 'auto',
          background: 'var(--agent-page-bg)',
          flex: 1,
          transition: 'margin-left 0.2s ease',
          position: 'relative',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
