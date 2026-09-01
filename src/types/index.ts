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
  publishedAt?: string;
  deletedAt?: string;
  editedAt?: string;
  views: number;
  favorites: number;
  likes: number;
  thumbnail?: string;
  htmlContent?: string;
  isOwn?: boolean;
  isPublished?: boolean;
  isDeleted?: boolean;
  draftStage?: 'new' | 'revision';
  draftGroupId?: string;
  draftVersionCount?: number;
  showConversation?: boolean;
  learningDataRecovery?: LearningDataRecoverySummary;
  learningDataReportCapability?: LearningDataReportCapability;
}

// 对话消息类型
export type MessageRole = 'user' | 'assistant';

export type MessageType = 
  | 'text'
  | 'courseware-recommendation'
  | 'requirement-framework'
  | 'generation-settings'
  | 'generation-progress'
  | 'courseware-result'
  | 'material-intent-confirmation'
  | 'voice-capability-confirmation'
  | 'analyzing';

export type TeachingContentSourceType = 'question-bank' | 'word-book' | 'cloud-pages';

export interface TeachingQuestionItem {
  id: string;
  subject: '数学' | '语文' | '英语';
  type: string;
  level: string;
  knowledge: string;
  source?: string;
  content: string;
  options?: string[];
  answer?: string;
  analysis?: string;
  knowledgeGraph?: string;
  analysisVideoUrl?: string;
  analysisVideoTitle?: string;
  analysisVideoDuration?: string;
}

export interface TeachingWordItem {
  id: string;
  word: string;
  phonetic?: string;
  meaning?: string;
  audioAvailable?: boolean;
}

export interface TeachingCloudPageItem {
  pageNumber: number;
  title: string;
  subtitle?: string;
}

export interface TeachingContentSource {
  id: string;
  type: TeachingContentSourceType;
  name: string;
  sourceLabel: string;
  summary: string;
  itemCount: number;
  items?: string[];
  questionItems?: TeachingQuestionItem[];
  wordItems?: TeachingWordItem[];
  pageNumbers?: number[];
  pageItems?: TeachingCloudPageItem[];
  cloudScope?: 'group' | 'school' | 'personal';
  cloudFileId?: string;
  unit?: string;
}

export type CarriedMaterialType = 'image' | 'document' | TeachingContentSourceType;

export interface CarriedMaterial {
  id: string;
  type: CarriedMaterialType;
  name: string;
  purpose: string;
  thumbnailUrl?: string;
}

export interface CoursewareRecommendation {
  id: string;
  sourceType: 'courseware' | 'template' | 'custom';
  title: string;
  subject: string;
  grade: string;
  author?: string;
  matchPoints?: Array<{
    dimension: '知识点' | '学科' | '年级' | '题型' | '交互机制' | '玩法机制' | '互动能力' | '视觉风格';
    label: string;
  }>;
  contentTags?: string[];
  knowledgePoints?: string[];
  materialId?: string;
  resourceOwner?: string;
  isAccessible?: boolean;
  isDeleted?: boolean;
  supportsClone?: boolean;
  previewUrl?: string;
  thumbnail?: string;
  sameCount?: number;
  usageCount?: number;
}

export interface GenerationPreferences {
  visualStyleMode?: 'smart' | 'manual';
  visualStyleId?: string;
  visualStyleEnhancementIds?: string[];
  visualStyleName?: string;
  voiceMode?: 'smart' | 'manual';
  voiceId?: string;
  voiceName?: string;
  voiceLanguage?: string;
  htmlModelId?: string;
  imageModelId?: string;
  generationModeId?: 'fast' | 'smart' | 'deep';
  estimatedMinutes?: string;
}

export interface CoursewareRecommendationMessage {
  promptForFramework: string;
  originalUserRequirement?: string;
  teachingSources: TeachingContentSource[];
  carriedMaterials?: CarriedMaterial[];
  generationPreferences?: GenerationPreferences;
  recommendations: CoursewareRecommendation[];
  previewedRecommendationIds?: string[];
  selectedRecommendationId?: string;
  action?: 'clone' | 'new' | 'iteach' | 'used';
}

export interface AugustGenerationPlan {
  teachingSources: TeachingContentSource[];
  recommendations: CoursewareRecommendation[];
  selectedRecommendationId: string;
  visualStyleId: string;
  visualStyleEnhancementIds?: string[];
  visualStyleName: string;
  visualStyleMode?: 'smart' | 'manual';
  voiceId: string;
  voiceName: string;
  voiceLanguage: string;
  voiceMode?: 'smart' | 'manual';
  htmlModelId: string;
  imageModelId: string;
  generationModeId: string;
  generationArchitecture: 'accelerated' | 'standard';
  advancedOpen?: boolean;
  estimatedMinutes: string;
}

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
  augustPlan?: AugustGenerationPlan;
  cloneReference?: {
    id: string;
    title: string;
    subject: string;
    grade: string;
    author?: string;
    thumbnail?: string;
    matchSummary?: string;
    carriedMaterials?: CarriedMaterial[];
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
  generationPreferences?: GenerationPreferences;
  learningDataRecovery?: LearningDataRecoverySummary;
  learningDataReportCapability?: LearningDataReportCapability;
}

export type LearningDataRecoveryStatus = 'not-started' | 'configured';
export type LearningDataReportCapability = 'supported' | 'requires-regeneration';

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
  mode?: 'create' | 'edit' | 'upgrade-legacy';
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
  generationPreferences?: GenerationPreferences;
  regenerationMode?: 'courseware-regeneration' | 'image-texture-only';
}

export type UploadedAttachmentType = 'image' | 'document' | 'html' | TeachingContentSourceType;

export interface UploadedAttachment {
  id: string;
  type: UploadedAttachmentType;
  name: string;
  url?: string;
  locked?: boolean;
  hiddenContent?: string;
  sourceTitle?: string;
  teachingSource?: TeachingContentSource;
}

export type MaterialIntent =
  | 'use-as-courseware-material'
  | 'use-as-style-reference'
  | 'extract-image-content'
  | 'generate-from-document'
  | 'use-as-requirement-doc'
  | 'extract-document-questions'
  | 'use-cloud-content'
  | 'use-cloud-style'
  | 'use-cloud-structure'
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
  confirmedResolutions?: MaterialIntentResolution[];
  confirmedAt?: string;
  teachingSources?: TeachingContentSource[];
  carriedMaterials?: CarriedMaterial[];
  generationPreferences?: GenerationPreferences;
}

export type VoiceCapabilityIntent = 'english-oral' | 'record-only';

export interface VoiceCapabilityConfirmation {
  prompt: string;
  promptForFramework: string;
  intent: VoiceCapabilityIntent;
  source: 'user-prompt' | 'material-intent';
  confirmedSelection?: VoiceCapabilitySelection;
  confirmedAt?: string;
  teachingSources?: TeachingContentSource[];
  carriedMaterials?: CarriedMaterial[];
  generationPreferences?: GenerationPreferences;
}

export interface VoiceCapabilitySelection {
  smallScreenRecording: boolean;
  englishOralAssessment: boolean;
}

export interface UserMaterialMessage {
  text: string;
  attachments?: UploadedAttachment[];
  resolvedIntents?: MaterialIntentResolution[];
  generationPreferences?: GenerationPreferences;
}

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  content: string | UserMaterialMessage | CoursewareRecommendationMessage | RequirementFramework | AugustGenerationPlan | GenerationProgress | CoursewareResult | MaterialIntentConfirmation | VoiceCapabilityConfirmation;
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
  waitingForUserAction: boolean;
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
