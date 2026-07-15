import { useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import GeneratorPage from './pages/GeneratorPage';
import LibraryPage from './pages/LibraryPage';
import EditorPage from './pages/EditorPage';
import EditorDrawer from './components/Layout/EditorDrawer';
import InspirationAssistant from './components/Generator/InspirationAssistant';
import { useUIStore } from './store/uiStore';
import { useConversationStore, getFrameworkForCourseware } from './store/conversationStore';
import { useCoursewareStore } from './store/coursewareStore';
import toast from './utils/toast';

const NO_PERMISSION_ICON = 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/0yfywsZi-2fc4cc73-45eb-4d17-9c50-89c25838bf23.png';

const isNoPermissionQuery = (search: string) => {
  const params = new URLSearchParams(search);
  if (params.has('nopermission')) return true;
  return Array.from(params.entries()).some(([key, value]) => key === 'permission' && value === 'nopermission' || value === 'nopermission');
};

function AppContent() {
  const appMode = useUIStore((s) => s.appMode);
  const closePreview = useUIStore((s) => s.closePreview);
  const openPreview = useUIStore((s) => s.openPreview);
  const setSidebarCollapsed = useUIStore((s) => s.setSidebarCollapsed);
  const setPendingAssistantPrompt = useUIStore((s) => s.setPendingAssistantPrompt);
  const navigate = useNavigate();
  const location = useLocation();
  const createCloneConversation = useConversationStore((s) => s.createCloneConversation);
  const openPublishedConversation = useConversationStore((s) => s.openPublishedConversation);
  const activeConversationId = useConversationStore((s) => s.activeConversationId);
  const coursewares = useCoursewareStore((s) => s.coursewares);
  const showNoPermissionPage = isNoPermissionQuery(location.search);

  useEffect(() => {
    const clearPointerFocus = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest('button');
      if (!button || button.dataset.keepFocus === 'true') return;
      window.requestAnimationFrame(() => button.blur());
    };

    document.addEventListener('pointerup', clearPointerFocus, true);
    return () => document.removeEventListener('pointerup', clearPointerFocus, true);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cloneCoursewareId = Number(params.get('cloneCoursewareId'));
    if (!cloneCoursewareId) return;

    const cw = coursewares.find(c => c.id === cloneCoursewareId);
    if (!cw) return;

    const handledKey = `cloneCourseware:${cloneCoursewareId}`;
    if (window.sessionStorage.getItem(handledKey)) return;
    window.sessionStorage.setItem(handledKey, '1');

    const framework = getFrameworkForCourseware(cw.id);
    createCloneConversation(cw.title, framework, cw.htmlContent);
    closePreview();
    toast('已带入原课件 HTML，可补充同款需求');
    params.delete('cloneCoursewareId');
    window.history.replaceState(null, '', `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`);
    navigate('/');
  }, [coursewares, createCloneConversation, closePreview, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') !== 'edit') return;

    const conversationId = params.get('conversationId');
    const resourceId = params.get('resourceId');
    const target = openPublishedConversation(conversationId, resourceId);
    window.sessionStorage.setItem('openPublishedConversation:scrollToBottom', '1');
    setSidebarCollapsed(true);
    openPreview(target.coursewareId);
    toast('已打开已发布作品，可继续修改并替换发布版本');
    params.delete('mode');
    params.delete('conversationId');
    params.delete('resourceId');
    window.history.replaceState(null, '', `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`);
    navigate('/');
  }, [openPublishedConversation, openPreview, setSidebarCollapsed, navigate]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'clone-courseware' && typeof e.data.coursewareId === 'number') {
        const cw = coursewares.find(c => c.id === e.data.coursewareId);
        if (!cw) return;
        const framework = getFrameworkForCourseware(cw.id);
        createCloneConversation(cw.title, framework, cw.htmlContent);
        closePreview();
        toast('已带入原课件 HTML，可补充同款需求');
        navigate('/');
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [coursewares, createCloneConversation, closePreview, navigate]);

  const handleApplyAssistantPrompt = useCallback((prompt: string) => {
    setPendingAssistantPrompt(prompt);
    if (location.pathname !== '/') {
      closePreview();
      navigate('/');
    }
    toast('已带回输入框，可继续修改后生成');
  }, [closePreview, location.pathname, navigate, setPendingAssistantPrompt]);

  const assistantNode = (
    <InspirationAssistant
      onApplyPrompt={handleApplyAssistantPrompt}
      isHomePage={location.pathname === '/'}
      preferExpandedLauncher={location.pathname === '/' && activeConversationId === null}
    />
  );

  if (showNoPermissionPage) {
    return <NoPermissionPage />;
  }

  if (appMode === 'embedded') {
    return (
      <>
        <EditorPage />
        <EditorDrawer>
          <MainLayout embedded />
        </EditorDrawer>
        {assistantNode}
      </>
    );
  }

  return (
    <>
      <MainLayout />
      {assistantNode}
    </>
  );
}

function NoPermissionPage() {
  return (
    <main style={noPermissionStyles.page}>
      <section style={noPermissionStyles.card}>
        <div style={noPermissionStyles.iconCrop}>
          <img src={NO_PERMISSION_ICON} alt="" style={noPermissionStyles.icon} />
        </div>
        <h1 style={noPermissionStyles.title}>暂无访问权限</h1>
        <p style={noPermissionStyles.desc}>
          当前账号暂未开通 AI 互动课件 Agent 使用权限，请联系管理员开通后再访问。
        </p>
      </section>
    </main>
  );
}

const noPermissionStyles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background: 'linear-gradient(180deg, #F5FBFF 0%, #EEF7FF 52%, #F8FAFC 100%)',
  },
  card: {
    width: 'min(620px, 92vw)',
    minHeight: 330,
    padding: '14px 36px 30px',
    borderRadius: 20,
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    boxShadow: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  iconCrop: {
    width: 'min(500px, 100%)',
    height: 214,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 2,
  },
  icon: {
    width: '100%',
    height: 300,
    objectFit: 'contain',
    transform: 'translateY(-42px)',
    flexShrink: 0,
  },
  title: {
    margin: 0,
    color: '#0F172A',
    fontSize: 24,
    lineHeight: 1.25,
    fontWeight: 850,
  },
  desc: {
    margin: '12px 0 0',
    color: '#64748B',
    fontSize: 14,
    lineHeight: 1.7,
    maxWidth: 320,
  },
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppContent />}>
          <Route index element={<GeneratorPage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="history" element={<GeneratorPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
