import { create } from 'zustand';
import type { Conversation, ConversationMessage, GenerationProgress, GenerationStage, CoursewareResult, RequirementFramework, UserMaterialMessage } from '../types';
import { mockConversations, createEmptyConversation, generateRequirementFromPrompt } from '../data/mockConversations';
import { demoMs } from '../constants/demoTiming';
import fruitGardenHTML from '../assets/courseware/fruit_garden_adventure.html?raw';

const generateId = () => Math.random().toString(36).substring(2, 11);

interface ConversationState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isGenerating: boolean;
  currentStageIndex: number;
  stageProgress: number;
  
  // Actions
  setActiveConversation: (id: string | null) => void;
  createNewConversation: (initialPrompt?: string) => string;
  createCloneConversation: (title: string, framework: RequirementFramework, htmlContent?: string) => string;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  togglePinConversation: (id: string) => void;
  addUserMessage: (conversationId: string, content: string | UserMaterialMessage) => void;
  addAssistantMessage: (conversationId: string, content: ConversationMessage['content'], type: ConversationMessage['type']) => void;
  startGeneration: (conversationId: string) => void;
  stopGeneration: () => void;
  updateProgress: (stageIndex: number, progress: number) => void;
  completeGeneration: (conversationId: string, result: CoursewareResult, coursewareId: number) => void;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: mockConversations,
  activeConversationId: null,
  isGenerating: false,
  currentStageIndex: 0,
  stageProgress: 0,

  setActiveConversation: (id) => set({ activeConversationId: id }),

  createNewConversation: (initialPrompt) => {
    const newConv = createEmptyConversation();
    if (initialPrompt) {
      newConv.title = initialPrompt.substring(0, 20) + (initialPrompt.length > 20 ? '...' : '');
    }
    set((state) => ({
      conversations: [newConv, ...state.conversations],
      activeConversationId: newConv.id,
    }));
    return newConv.id;
  },

  createCloneConversation: (title, framework, htmlContent) => {
    const newConv = createEmptyConversation();
    newConv.title = `同款-${title}`;
    newConv.messages = [];
    newConv.cloneDraft = {
      prompt: buildClonePrompt(title, framework),
      attachment: {
        id: `clone_html_${Date.now()}`,
        type: 'html',
        name: `${title}.html`,
        locked: true,
        hiddenContent: htmlContent,
        sourceTitle: title,
      },
    };
    set((state) => ({
      conversations: [newConv, ...state.conversations],
      activeConversationId: newConv.id,
    }));
    return newConv.id;
  },

  deleteConversation: (id) => set((state) => ({
    conversations: state.conversations.filter((c) => c.id !== id),
    activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
  })),

  renameConversation: (id, title) => set((state) => ({
    conversations: state.conversations.map((c) =>
      c.id === id ? { ...c, title } : c
    ),
  })),

  togglePinConversation: (id) => set((state) => ({
    conversations: state.conversations.map((c) =>
      c.id === id ? { ...c, isPinned: !c.isPinned } : c
    ),
  })),

  addUserMessage: (conversationId, content) => set((state) => ({
    conversations: state.conversations.map((c) =>
      c.id === conversationId
        ? {
            ...c,
            messages: [
              ...c.messages,
              {
                id: generateId(),
                role: 'user',
                content,
                type: 'text',
                timestamp: new Date(),
              },
            ],
          }
        : c
    ),
  })),

  addAssistantMessage: (conversationId, content, type) => set((state) => ({
    conversations: state.conversations.map((c) =>
      c.id === conversationId
        ? {
            ...c,
            messages: [
              ...c.messages,
              {
                id: generateId(),
                role: 'assistant',
                content,
                type,
                timestamp: new Date(),
              },
            ],
          }
        : c
    ),
  })),

  startGeneration: (conversationId) => {
    set({ isGenerating: true, currentStageIndex: 0, stageProgress: 0 });
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, isGenerating: true } : c
      ),
    }));
  },

  stopGeneration: () => {
    const { activeConversationId } = get();
    set({ isGenerating: false, currentStageIndex: 0, stageProgress: 0 });
    if (activeConversationId) {
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === activeConversationId ? { ...c, isGenerating: false } : c
        ),
      }));
    }
  },

  updateProgress: (stageIndex, progress) => set({
    currentStageIndex: stageIndex,
    stageProgress: progress,
  }),

  completeGeneration: (conversationId, result, coursewareId) => {
    set({ isGenerating: false, currentStageIndex: 0, stageProgress: 0 });
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              isGenerating: false,
              coursewareId,
              title: result.title,
            }
          : c
      ),
    }));
  },
}));

const buildClonePrompt = (title: string, framework: RequirementFramework) => {
  void framework;

  return `制作一个同款教学互动课件，具体需求包括：
1. 参考附件中的原始 HTML 课件「${title}」，只复用其玩法结构、交互逻辑、反馈节奏和适合课堂演示的视觉方向。
2. 请根据我接下来补充的新主题或新知识点，生成一份同款但内容不同的互动课件。`;
};

// Helper function to simulate generation process
export async function simulateGeneration(
  _conversationId: string,
  onProgress: (progress: GenerationProgress) => void,
  onComplete: (result: CoursewareResult, coursewareId: number) => void,
  signal?: AbortSignal,
  failAtStage?: number
): Promise<void> {
  const stageNames = ['图片生成', '音频生成', '代码生成', '代码审查', '代码修复'];
  const stageErrors: Record<number, string> = {
    0: '图片生成超时，服务响应时间过长',
    1: '音频合成服务异常，连接中断',
    2: '代码生成失败，模型推理超时',
    3: '代码审查服务不可用',
    4: '代码修复过程中发生未知错误',
  };

  const stages: GenerationStage[] = stageNames.map((name) => ({
    name,
    status: 'pending' as const,
    progress: 0,
  }));

  const emit = () => {
    onProgress({
      stages: stages.map(s => ({ ...s })),
    });
  };

  const runStage = async (idx: number, durationMs: number) => {
    stages[idx].status = 'in-progress';
    const tickMs = 500;
    const ticks = durationMs / tickMs;
    for (let t = 0; t <= ticks; t++) {
      if (signal?.aborted) return;
      stages[idx].progress = Math.min(100, Math.round((t / ticks) * 100));
      emit();
      if (t < ticks) await new Promise(r => setTimeout(r, tickMs));
    }
    if (signal?.aborted) return;

    if (failAtStage === idx) {
      stages[idx].status = 'failed';
      stages[idx].error = stageErrors[idx];
      stages[idx].progress = stages[idx].progress;
      emit();
      return 'failed';
    }

    stages[idx].status = 'completed';
    stages[idx].progress = 100;
    emit();
    return 'completed';
  };

  const durations = [8000, 6000, 2500, 2500, 2500].map(demoMs);
  for (let i = 0; i < durations.length; i++) {
    const result = await runStage(i, durations[i]);
    if (signal?.aborted) return;
    if (result === 'failed') return;
  }

  const result: CoursewareResult = {
    title: '水果单词互动乐园',
    version: 'v1.0',
    htmlContent: fruitGardenHTML,
  };

  onComplete(result, Date.now());
}

export function getFrameworkForCourseware(coursewareId: number): RequirementFramework {
  const { conversations } = useConversationStore.getState();
  const conv = conversations.find(c => c.coursewareId === coursewareId);
  if (conv) {
    const msg = conv.messages.find(m => m.type === 'requirement-framework');
    if (msg) return msg.content as RequirementFramework;
  }
  return generateRequirementFromPrompt('');
}
