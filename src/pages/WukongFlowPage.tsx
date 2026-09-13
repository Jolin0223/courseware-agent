import { useLayoutEffect } from 'react';
import GeneratorPage from './GeneratorPage';
import { useConversationStore } from '../store/conversationStore';
import { useUIStore } from '../store/uiStore';
import { WUKONG_ID } from '../data/wukong/course';
export default function WukongFlowPage(){
  useLayoutEffect(()=>{useConversationStore.getState().setActiveConversation(WUKONG_ID);useUIStore.getState().closePreview();useUIStore.getState().setSidebarCollapsed(true);},[]);
  return <GeneratorPage/>;
}
