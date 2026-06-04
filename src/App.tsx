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
  const navigate = useNavigate();
  const createCloneConversation = useConversationStore((s) => s.createCloneConversation);
  const coursewares = useCoursewareStore((s) => s.coursewares);

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
