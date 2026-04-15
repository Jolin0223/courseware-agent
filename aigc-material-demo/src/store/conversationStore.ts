import { create } from 'zustand';
import type { Conversation, ConversationMessage, GenerationProgress, GenerationStage, CoursewareResult, RequirementFramework } from '../types';
import { mockConversations, createEmptyConversation, generateRequirementFromPrompt } from '../data/mockConversations';

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
  createCloneConversation: (title: string, framework: RequirementFramework) => string;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  togglePinConversation: (id: string) => void;
  addUserMessage: (conversationId: string, content: string) => void;
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

  createCloneConversation: (title, framework) => {
    const newConv = createEmptyConversation();
    newConv.title = `同款-${title}`;
    newConv.messages = [
      {
        id: generateId(),
        role: 'user',
        content: `一键同款：${title}`,
        type: 'text',
        timestamp: new Date(),
      },
      {
        id: generateId(),
        role: 'assistant',
        content: `正在为您拉取「${title}」的需求框架，您可调整后点击 确认需求，立即生成。`,
        type: 'text',
        timestamp: new Date(),
      },
      {
        id: generateId(),
        role: 'assistant',
        content: framework,
        type: 'requirement-framework',
        timestamp: new Date(),
      },
    ];
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

// Helper function to simulate generation process
export async function simulateGeneration(
  _conversationId: string,
  onProgress: (progress: GenerationProgress) => void,
  onComplete: (result: CoursewareResult, coursewareId: number) => void,
  signal?: AbortSignal
): Promise<void> {
  const stageNames = ['图片生成', '代码生成', '代码审查', '代码修复'];

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
    stages[idx].status = 'completed';
    stages[idx].progress = 100;
    emit();
  };

  await runStage(0, 10000);
  if (signal?.aborted) return;
  await runStage(1, 2500);
  if (signal?.aborted) return;
  await runStage(2, 2500);
  if (signal?.aborted) return;
  await runStage(3, 2500);
  if (signal?.aborted) return;

  const result: CoursewareResult = {
    title: '动物单词拼写游戏',
    version: 'v1.0',
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
