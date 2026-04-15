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
  const navigate = useNavigate();
  const createCloneConversation = useConversationStore((s) => s.createCloneConversation);
  const coursewares = useCoursewareStore((s) => s.coursewares);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'clone-courseware' && typeof e.data.coursewareId === 'number') {
        const cw = coursewares.find(c => c.id === e.data.coursewareId);
        if (!cw) return;
        const framework = getFrameworkForCourseware(cw.id);
        createCloneConversation(cw.title, framework);
        toast(`已创建同款会话：同款-${cw.title}`);
        navigate('/');
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [coursewares, createCloneConversation, navigate]);

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
