// 课件类型
export interface Courseware {
  id: number;
  title: string;
  subject: string;
  grade: string;
  type: string;
  author: string;
  publishTime: string;
  views: number;
  favorites: number;
  likes: number;
  thumbnail?: string;
  htmlContent?: string;
  isOwn?: boolean;
  isPublished?: boolean;
  showConversation?: boolean;
}

// 对话消息类型
export type MessageRole = 'user' | 'assistant';

export type MessageType = 
  | 'text'
  | 'requirement-framework'
  | 'generation-progress'
  | 'courseware-result'
  | 'analyzing';

export interface RequirementFramework {
  userRequirement: string;
  featureDesign: string;
  designStyle: string;
}

export interface GenerationStage {
  name: string;
  status: 'pending' | 'in-progress' | 'completed';
  progress: number;
  detail?: string;
}

export interface GeneratedImage {
  id: string;
  purpose: string;
  url?: string;
}

export interface GenerationProgress {
  stages: GenerationStage[];
  images?: GeneratedImage[];
}

export interface CoursewareResult {
  title: string;
  version: string;
  thumbnail?: string;
  htmlContent?: string;
}

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  content: string | RequirementFramework | GenerationProgress | CoursewareResult;
  type?: MessageType;
  timestamp: Date;
}

// 会话类型
export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  messages: ConversationMessage[];
  isPinned: boolean;
  isGenerating: boolean;
  coursewareId?: number;
  versions?: CoursewareVersion[];
}

// 课件版本
export interface CoursewareVersion {
  version: string;
  description: string;
  htmlContent?: string;
  isPublished: boolean;
  createdAt: string;
}

// 模板类型
export interface Template {
  id: number;
  name: string;
  subject: string;
  description: string;
  usageCount: number;
  rating: number;
  promptTemplate: string;
  thumbnail?: string;
}
