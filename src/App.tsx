import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import GeneratorPage from './pages/GeneratorPage';
import LibraryPage from './pages/LibraryPage';
import EditorPage from './pages/EditorPage';
import EditorDrawer from './components/Layout/EditorDrawer';
import { useUIStore } from './store/uiStore';
import { useConversationStore, getFrameworkForCourseware } from './store/conversationStore';
import { useCoursewareStore } from './store/coursewareStore';
import toast from './utils/toast';

function AppContent() {
  const appMode = useUIStore((s) => s.appMode);
  const closePreview = useUIStore((s) => s.closePreview);
  const openPreview = useUIStore((s) => s.openPreview);
  const setSidebarCollapsed = useUIStore((s) => s.setSidebarCollapsed);
  const navigate = useNavigate();
  const createCloneConversation = useConversationStore((s) => s.createCloneConversation);
  const openPublishedConversation = useConversationStore((s) => s.openPublishedConversation);
  const coursewares = useCoursewareStore((s) => s.coursewares);

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

  if (appMode === 'embedded') {
    return (
      <>
        <EditorPage />
        <EditorDrawer>
          <MainLayout embedded />
        </EditorDrawer>
      </>
    );
  }

  return <MainLayout />;
}

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
