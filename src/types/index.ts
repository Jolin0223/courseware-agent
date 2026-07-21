// 课件类型
export interface Courseware {
  id: number;
  title: string;
  subject: string;
  grade: string;
  resourceScope?: 'group' | 'school' | 'personal';
  schoolName?: string;
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
  learningDataRecovery?: LearningDataRecoverySummary;
}

// 对话消息类型
export type MessageRole = 'user' | 'assistant';

export type MessageType = 
  | 'text'
  | 'requirement-framework'
  | 'generation-progress'
  | 'courseware-result'
  | 'material-intent-confirmation'
  | 'voice-capability-confirmation'
  | 'analyzing';

export interface RequirementFramework {
  generationSettings?: string;
  userRequirement: string;
  featureDesign: string;
  designStyle: string;
  featureDesignFormat?: 'text' | 'markdown';
  visualStyleSelection?: {
    baseStyleId: string | null;
    enhancementStyleIds: string[];
    styleName: string;
    stylePrompt: string;
    previewImageUrl?: string;
  };
}

export interface GenerationStage {
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  progress: number;
  detail?: string;
  error?: string;
}

export interface GeneratedImage {
  id: string;
  purpose: string;
  url?: string;
}

export interface GenerationProgress {
  stages: GenerationStage[];
  images?: GeneratedImage[];
  introText?: string;
  instantIntro?: boolean;
}

export interface CoursewareResult {
  coursewareId?: number;
  title: string;
  version: string;
  thumbnail?: string;
  htmlContent?: string;
  visualStylePrompt?: string;
  learningDataRecovery?: LearningDataRecoverySummary;
}

export type LearningDataRecoveryStatus = 'not-started' | 'configured';

export interface LearningDataRecoveryItem {
  id: string;
  label: string;
  description: string;
  checked: boolean;
}

export interface LearningDataRecoverySummary {
  status: LearningDataRecoveryStatus;
  selectedItems: LearningDataRecoveryItem[];
}

export interface LearningDataRecoveryRequest {
  coursewareTitle: string;
  htmlContent?: string;
  version?: string;
  mode?: 'create' | 'edit';
  initialItems?: LearningDataRecoveryItem[];
}

export interface VisualStyleRegenerationRequest {
  coursewareTitle: string;
  htmlContent?: string;
  version?: string;
  baseStyleId?: string | null;
  enhancementStyleIds?: string[];
  styleName: string;
  stylePrompt: string;
  previewImageUrl?: string;
  regenerationMode?: 'courseware-regeneration' | 'image-texture-only';
}

export type UploadedAttachmentType = 'image' | 'document' | 'html';

export interface UploadedAttachment {
  id: string;
  type: UploadedAttachmentType;
  name: string;
  url?: string;
  locked?: boolean;
  hiddenContent?: string;
  sourceTitle?: string;
}

export type MaterialIntent =
  | 'use-as-courseware-material'
  | 'use-as-style-reference'
  | 'extract-image-content'
  | 'generate-from-document'
  | 'use-as-requirement-doc'
  | 'extract-document-questions'
  | 'custom';

export interface MaterialIntentOption {
  intent: MaterialIntent;
  title: string;
  description: string;
}

export interface MaterialIntentResolution {
  attachmentId: string;
  intent: MaterialIntent;
  title: string;
  description: string;
  confidence: number;
  reason?: string;
  customText?: string;
}

export interface MaterialIntentConfirmation {
  prompt: string;
  pendingAttachments: UploadedAttachment[];
  resolvedIntents: MaterialIntentResolution[];
  summary: string;
}

export type VoiceCapabilityIntent = 'english-oral' | 'record-only';

export interface VoiceCapabilityConfirmation {
  prompt: string;
  promptForFramework: string;
  intent: VoiceCapabilityIntent;
  source: 'user-prompt' | 'material-intent';
  confirmedSelection?: VoiceCapabilitySelection;
  confirmedAt?: string;
}

export interface VoiceCapabilitySelection {
  smallScreenRecording: boolean;
  englishOralAssessment: boolean;
}

export interface UserMaterialMessage {
  text: string;
  attachments?: UploadedAttachment[];
  resolvedIntents?: MaterialIntentResolution[];
}

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  content: string | UserMaterialMessage | RequirementFramework | GenerationProgress | CoursewareResult | MaterialIntentConfirmation | VoiceCapabilityConfirmation;
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
  cloneDraft?: {
    prompt: string;
    attachment: UploadedAttachment;
  };
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

// 音色选项
export interface VoiceOption {
  id: string;
  name: string;
  gender: 'male' | 'female';
  description: string;
  isDefault?: boolean;
  previewUrl?: string;
}

// 音频项
export interface AudioItem {
  id: string;
  label: string;
  type: 'tts' | 'bgm';
  status: 'pending' | 'generating' | 'completed' | 'error';
  voiceId?: string;
  url?: string;
  duration?: number;
  prompt?: string;
  source?: 'ai' | 'upload';
  uploadFileName?: string;
}

// 图片项（增强版）
export interface EnhancedImageItem {
  id: string;
  label: string;
  src?: string;
  prompt: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  source?: 'ai' | 'upload';
  uploadFileName?: string;
}
