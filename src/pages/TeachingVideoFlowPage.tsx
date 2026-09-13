import { useLayoutEffect } from 'react';
import GeneratorPage from './GeneratorPage';
import { useConversationStore } from '../store/conversationStore';
import { useUIStore } from '../store/uiStore';

const VIDEO_DEMO_CONVERSATION_ID = 'conv_video_demo';

const TeachingVideoFlowPage = () => {
  const setActiveConversation = useConversationStore(state => state.setActiveConversation);
  const closePreview = useUIStore(state => state.closePreview);
  const setSidebarCollapsed = useUIStore(state => state.setSidebarCollapsed);

  useLayoutEffect(() => {
    setActiveConversation(VIDEO_DEMO_CONVERSATION_ID);
    closePreview();
    setSidebarCollapsed(false);
  }, [closePreview, setActiveConversation, setSidebarCollapsed]);

  return <GeneratorPage />;
};

export default TeachingVideoFlowPage;
