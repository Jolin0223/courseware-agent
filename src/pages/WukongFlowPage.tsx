import { useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConversationStore } from '../store/conversationStore';
import { useUIStore } from '../store/uiStore';
import { useVideoComposer } from '../store/videoCoursewareStore';
export default function WukongFlowPage(){
 const navigate=useNavigate();
 useLayoutEffect(()=>{useConversationStore.getState().setActiveConversation(null);useUIStore.getState().closePreview();useUIStore.getState().setSidebarCollapsed(false);useVideoComposer.getState().loadExample();navigate('/',{replace:true});},[navigate]);
 return null;
}
