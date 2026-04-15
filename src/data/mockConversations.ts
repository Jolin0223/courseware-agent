import type { Conversation, RequirementFramework, GenerationProgress, CoursewareResult } from '../types';

const generateId = () => Math.random().toString(36).substring(2, 11);

const requirementFramework: RequirementFramework = {
  userRequirement: `①核心用户：小学三年级学生\n②应用目标：通过听音辨位和趣味互动，帮助学生巩固英语身体部位词汇的听力理解，提升英语学习兴趣与专注力`,
  featureDesign: `基础功能：\n1. 听力指令播放：系统随机播放身体部位相关的英文指令，如Touch your nose，屏幕右上角设有语音重播按钮供学生反复确认。\n2. 触屏点击判定：学生在平板上点击卡通人物对应的身体部位区域，系统根据触控坐标判定点击位置是否与听力指令匹配。\n3. 互动反馈机制：答对时卡通人物做出对应动作，如摸鼻子或拍手，并播放欢呼音效；答错时人物做出疑惑表情，并轻微晃动正确的身体部位作为提示。\n\n亮点功能：\n1. 连击奖励系统：连续答对三次即可触发特殊全屏动画，如卡通人物跳一段街舞，并获得额外的星星收集奖励，增强游戏成就感。\n2. 多样化触屏交互：除了基础的点击操作，加入滑动交互指令，例如听到Rub your belly时，学生需要在人物肚子区域进行左右滑动才能判定成功。`,
  designStyle: `1. 布局：16:9横屏居中展示大尺寸卡通人物，左上角放置星星计分板，右上角放置喇叭图标的重播按钮，整体界面清爽，避免视觉干扰。\n2. 交互：点击身体部位时该区域会有轻微的缩放回弹效果，滑动操作时指尖伴随闪烁的粒子特效，确保触屏反馈即时且生动。\n3. 配色：采用明亮活泼的糖果色系，背景使用柔和的浅蓝色，卡通人物色彩鲜明且对比度高，符合儿童的视觉偏好。\n4. 文案：界面文字极简，仅在反馈时出现大号圆润字体的鼓励性英文短语，如Excellent或Try again，降低阅读负担。`,
};

const generationProgress: GenerationProgress = {
  stages: [
    { name: '图片生成', status: 'completed', progress: 100, detail: '已生成 5 张图片素材' },
    { name: '代码生成', status: 'completed', progress: 100 },
    { name: '代码审查', status: 'completed', progress: 100 },
    { name: '代码修复', status: 'completed', progress: 100 },
  ],
  images: [
    { id: '1', purpose: '动物图片-狗' },
    { id: '2', purpose: '动物图片-猫' },
    { id: '3', purpose: '动物图片-鸟' },
    { id: '4', purpose: '动物图片-鱼' },
    { id: '5', purpose: '背景装饰图' },
  ],
};

const coursewareResult: CoursewareResult = {
  title: '动物单词拼写游戏',
  version: 'v1.0',
};

export const mockConversations: Conversation[] = [
  {
    id: 'conv_1',
    title: '三年级·动物单词拼写游戏',
    createdAt: '2026-04-06 14:30',
    messages: [
      {
        id: generateId(),
        role: 'user',
        content: '生成一个三年级英语动物单词拼写游戏',
        type: 'text',
        timestamp: new Date('2026-04-06T14:30:00'),
      },
      {
        id: generateId(),
        role: 'assistant',
        content: requirementFramework,
        type: 'requirement-framework',
        timestamp: new Date('2026-04-06T14:30:30'),
      },
      {
        id: generateId(),
        role: 'user',
        content: '确认，开始生成',
        type: 'text',
        timestamp: new Date('2026-04-06T14:31:00'),
      },
      {
        id: generateId(),
        role: 'assistant',
        content: generationProgress,
        type: 'generation-progress',
        timestamp: new Date('2026-04-06T14:31:10'),
      },
      {
        id: generateId(),
        role: 'assistant',
        content: coursewareResult,
        type: 'courseware-result',
        timestamp: new Date('2026-04-06T14:35:00'),
      },
    ],
    isPinned: true,
    isGenerating: false,
    coursewareId: 1,
  },
  {
    id: 'conv_2',
    title: '一年级·加减法气球爆炸游戏',
    createdAt: '2026-04-05 10:15',
    messages: [
      {
        id: generateId(),
        role: 'user',
        content: '帮我生成一个一年级数学加减法练习游戏',
        type: 'text',
        timestamp: new Date('2026-04-05T10:15:00'),
      },
    ],
    isPinned: false,
    isGenerating: false,
    coursewareId: 2,
  },
  {
    id: 'conv_3',
    title: '三年级·古诗填空练习',
    createdAt: '2026-04-04 16:45',
    messages: [
      {
        id: generateId(),
        role: 'user',
        content: '生成一个三年级古诗填空游戏，古诗是望庐山瀑布',
        type: 'text',
        timestamp: new Date('2026-04-04T16:45:00'),
      },
    ],
    isPinned: false,
    isGenerating: false,
    coursewareId: 3,
  },
];

export function createEmptyConversation(): Conversation {
  return {
    id: generateId(),
    title: '新对话',
    createdAt: new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).replace(/\//g, '-'),
    messages: [],
    isPinned: false,
    isGenerating: false,
  };
}

export function generateRequirementFromPrompt(_prompt: string): RequirementFramework {
  return {
    userRequirement: `①核心用户：小学三年级学生\n②应用目标：通过听音辨位和趣味互动，帮助学生巩固英语身体部位词汇的听力理解，提升英语学习兴趣与专注力`,
    featureDesign: `基础功能：\n1. 听力指令播放：系统随机播放身体部位相关的英文指令，如Touch your nose，屏幕右上角设有语音重播按钮供学生反复确认。\n2. 触屏点击判定：学生在平板上点击卡通人物对应的身体部位区域，系统根据触控坐标判定点击位置是否与听力指令匹配。\n3. 互动反馈机制：答对时卡通人物做出对应动作，如摸鼻子或拍手，并播放欢呼音效；答错时人物做出疑惑表情，并轻微晃动正确的身体部位作为提示。\n\n亮点功能：\n1. 连击奖励系统：连续答对三次即可触发特殊全屏动画，如卡通人物跳一段街舞，并获得额外的星星收集奖励，增强游戏成就感。\n2. 多样化触屏交互：除了基础的点击操作，加入滑动交互指令，例如听到Rub your belly时，学生需要在人物肚子区域进行左右滑动才能判定成功。`,
    designStyle: `1. 布局：16:9横屏居中展示大尺寸卡通人物，左上角放置星星计分板，右上角放置喇叭图标的重播按钮，整体界面清爽，避免视觉干扰。\n2. 交互：点击身体部位时该区域会有轻微的缩放回弹效果，滑动操作时指尖伴随闪烁的粒子特效，确保触屏反馈即时且生动。\n3. 配色：采用明亮活泼的糖果色系，背景使用柔和的浅蓝色，卡通人物色彩鲜明且对比度高，符合儿童的视觉偏好。\n4. 文案：界面文字极简，仅在反馈时出现大号圆润字体的鼓励性英文短语，如Excellent或Try again，降低阅读负担。`,
  };
}
