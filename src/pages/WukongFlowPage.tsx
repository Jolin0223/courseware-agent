import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConversationStore } from '../store/conversationStore';
import { useUIStore } from '../store/uiStore';
import { useVideoComposer } from '../store/videoCoursewareStore';
import { hasVideoCoursewareAccess } from '../utils/videoCoursewareAccess';
export default function WukongFlowPage(){
 const navigate=useNavigate();
 useEffect(()=>{useConversationStore.getState().setActiveConversation(null);useUIStore.getState().closePreview();useUIStore.getState().setSidebarCollapsed(false);if(hasVideoCoursewareAccess())useVideoComposer.getState().loadExample();navigate('/'+window.location.search,{replace:true});},[navigate]);
 return null;
}
