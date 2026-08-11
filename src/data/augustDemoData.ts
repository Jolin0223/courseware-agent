import type {
  AugustGenerationPlan,
  CoursewareRecommendation,
  GenerationPreferences,
  RequirementFramework,
  TeachingContentSource,
} from '../types';
import type { VisualStylePreset } from './visualStylePresets';
import { baseVisualStylePresets, enhancementVisualStylePresets } from './visualStylePresets';

export interface DemoModelOption {
  id: string;
  name: string;
  description: string;
  speedLabel: string;
  duration: [number, number];
  recommended?: boolean;
}

export interface DemoGenerationModeOption {
  id: string;
  name: string;
  tag: string;
  description: string;
  suitableFor: string;
  htmlModelId: string;
  imageModelId: string;
  generationArchitecture: 'accelerated' | 'standard';
  notice: string;
}

export interface DemoVoiceOption {
  id: string;
  name: string;
  sourceName: string;
  language: DemoVoiceLanguage;
  gender: '女生' | '男生' | '组合' | '本人';
  accent: string;
  tag: string;
  scene: string;
  avatarUrl: string;
  avatarPrompt: string;
  platformVoiceId?: string;
  platformVoiceIds?: {
    chinese: string;
    english: string;
  };
  dedicated?: boolean;
}

export const voiceLanguageOptions = ['英语-英音', '英语-美音', '中英双语', '中文'] as const;
export type DemoVoiceLanguage = typeof voiceLanguageOptions[number];
export const DEFAULT_VOICE_LANGUAGE: DemoVoiceLanguage = '英语-英音';

export const htmlModelOptions: DemoModelOption[] = [
  { id: 'smart-html', name: '智能选择', description: '根据内容复杂度自动匹配', speedLabel: '推荐', duration: [5, 9], recommended: true },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', description: '适合快速生成课堂活动', speedLabel: '最快', duration: [2, 4] },
  { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro', description: '当前默认，综合表现稳定', speedLabel: '标准', duration: [6, 10] },
  { id: 'glm-5.2', name: 'GLM 5.2', description: '适合结构清晰的课堂互动', speedLabel: '较快', duration: [4, 7] },
  { id: 'kimi-2.6', name: 'Kimi 2.6', description: '适合长材料与多页内容', speedLabel: '标准', duration: [5, 9] },
  { id: 'gpt-5.5', name: 'GPT 5.5', description: '适合复杂玩法和高要求代码', speedLabel: '较慢', duration: [9, 15] },
];

export const imageModelOptions: DemoModelOption[] = [
  { id: 'smart-image', name: '智能选择', description: '根据风格与素材数量自动匹配', speedLabel: '推荐', duration: [3, 6], recommended: true },
  { id: 'jimeng-4.5', name: '即梦 4.5', description: '当前默认，儿童场景表现稳定', speedLabel: '标准', duration: [3, 5] },
  { id: 'jimeng-5.0', name: '即梦 5.0', description: '细节更丰富，生成时间更长', speedLabel: '较慢', duration: [5, 8] },
  { id: 'image-2', name: 'Image 2', description: '适合高一致性角色与场景', speedLabel: '较慢', duration: [7, 12] },
];

export const generationModeOptions: DemoGenerationModeOption[] = [
  {
    id: 'fast',
    name: '极速生成',
    tag: '速度最快',
    description: '适合逻辑简单、需要快速完成的课件。',
    suitableFor: '适合时间紧、需要尽快拿到可用课件的场景。',
    htmlModelId: 'gemini-3.5-flash',
    imageModelId: 'jimeng-5.0',
    generationArchitecture: 'accelerated',
    notice: '优先缩短等待时间。',
  },
  {
    id: 'smart',
    name: '智能生成',
    tag: '默认',
    description: '兼顾生成速度、互动效果和画面表现，适合大多数课堂需求。',
    suitableFor: '适合大多数课堂互动、练习和讲评课件。',
    htmlModelId: 'gemini-3.1-pro',
    imageModelId: 'jimeng-5.0',
    generationArchitecture: 'standard',
    notice: '不确定时选择这一档即可。',
  },
  {
    id: 'deep',
    name: '深度生成',
    tag: '耗时较长',
    description: '优先提升画面细节和素材表现，生成时间会明显更长。',
    suitableFor: '适合视觉要求高、对画面细节更重视的课件。',
    htmlModelId: 'gemini-3.1-pro',
    imageModelId: 'image-2',
    generationArchitecture: 'standard',
    notice: '生成时间会明显更长，可在完成后回来查看。',
  },
];

export function getGenerationModeByModels(htmlModelId = 'gemini-3.1-pro', imageModelId = 'jimeng-5.0') {
  const exact = generationModeOptions.find(mode => mode.htmlModelId === htmlModelId && mode.imageModelId === imageModelId);
  return exact || generationModeOptions.find(mode => mode.id === 'smart') || generationModeOptions[0];
}

export const demoVoiceOptions: DemoVoiceOption[] = [
  {
    id: 'british-explorer', name: '探索讲述者', sourceName: 'Expressive Narrator', language: '英语-英音',
    gender: '男生', accent: '英式英语', tag: '清亮有张力', scene: '互动讲解、闯关旁白',
    avatarUrl: '/voice-avatars/british-explorer.png', platformVoiceId: 'English_expressive_narrator',
    avatarPrompt: '1:1方形AI课件音色头像，青年男性英式英语探索讲述者，浅棕卷发，湖蓝教师夹克，神情清朗自信，柔和3D黏土插画，淡薄荷绿与天蓝背景，半身居中，教育产品角色系列，无文字无水印。',
  },
  {
    id: 'british-storyteller', name: '英伦故事家', sourceName: 'Compelling Lady', language: '英语-英音',
    gender: '女生', accent: '英式英语', tag: '温暖有感染力', scene: '绘本、故事叙述',
    avatarUrl: '/voice-avatars/british-storyteller.png', platformVoiceId: 'English_compelling_lady1',
    avatarPrompt: '1:1方形AI课件音色头像，青年女性英伦故事老师，栗色长发，酒红针织外套，手持一本打开的绘本，温暖有感染力，柔和3D黏土插画，淡玫瑰与雾蓝背景，半身居中，无文字无水印。',
  },
  {
    id: 'british-star', name: '英伦小星星', sourceName: 'Lovely Girl', language: '英语-英音',
    gender: '女生', accent: '英式英语', tag: '甜美亲切', scene: '低龄启蒙、单词跟读',
    avatarUrl: '/voice-avatars/british-star.png', platformVoiceId: 'English_LovelyGirl',
    avatarPrompt: '1:1方形AI课件音色头像，青春女性英式英语启蒙伙伴，短卷发与星星发夹，明黄色毛衣，笑容甜美亲切，柔和3D黏土插画，淡柠檬黄与天蓝背景，半身居中，无文字无水印。',
  },
  {
    id: 'british-guide', name: '知性引导者', sourceName: 'Wise Lady', language: '英语-英音',
    gender: '女生', accent: '英式英语', tag: '沉稳清晰', scene: '知识讲解、课堂总结',
    avatarUrl: '/voice-avatars/british-guide.png', platformVoiceId: 'English_Wiselady',
    avatarPrompt: '1:1方形AI课件音色头像，知性女性英式英语导师，深棕齐肩发，细框眼镜，青绿色衬衫，沉稳清晰，柔和3D黏土插画，浅青与米白背景，半身居中，无文字无水印。',
  },
  {
    id: 'british-comedian', name: '欢乐戏剧家', sourceName: 'Comedian', language: '英语-英音',
    gender: '男生', accent: '英式英语', tag: '夸张有节奏', scene: '游戏角色、趣味反馈',
    avatarUrl: '/voice-avatars/british-comedian.png', platformVoiceId: 'English_Comedian',
    avatarPrompt: '1:1方形AI课件音色头像，青年男性英伦戏剧老师，蓬松卷发，橙色领结与深绿外套，表情灵动幽默，柔和3D黏土插画，浅橙与薄荷绿背景，半身居中，无文字无水印。',
  },
  {
    id: 'british-nature', name: '自然科学家', sourceName: 'Nature Show Host', language: '英语-英音',
    gender: '男生', accent: '英式英语', tag: '磁性自然', scene: '科学观察、纪录式旁白',
    avatarUrl: '/voice-avatars/british-nature.png', platformVoiceId: 'English_Magnetic_Male_12',
    avatarPrompt: '1:1方形AI课件音色头像，中青年男性自然科学讲解员，卡其色野外夹克，手持放大镜，气质可靠好奇，柔和3D黏土插画，森林绿与浅天蓝背景，半身居中，无文字无水印。',
  },
  {
    id: 'american-sunshine', name: '阳光学姐', sourceName: 'Radiant Girl', language: '英语-美音',
    gender: '女生', accent: '美式英语', tag: '明亮利落', scene: '单词教学、课堂反馈',
    avatarUrl: '/voice-avatars/american-sunshine.png', platformVoiceId: 'English_radiant_girl',
    avatarPrompt: '1:1方形AI课件音色头像，青年女性美式英语课堂学姐，高马尾，亮黄色运动外套，笑容阳光利落，柔和3D黏土插画，淡黄色与湖蓝背景，半身居中，无文字无水印。',
  },
  {
    id: 'american-captivating', name: '知识领航员', sourceName: 'Captivating Female', language: '英语-美音',
    gender: '女生', accent: '美式英语', tag: '清晰有感染力', scene: '知识讲解、任务引导',
    avatarUrl: '/voice-avatars/american-captivating.png', platformVoiceId: 'English_captivating_female1',
    avatarPrompt: '1:1方形AI课件音色头像，青年女性美式英语知识领航员，利落短发，蓝色教师夹克，手持路线卡片，清晰自信，柔和3D黏土插画，天蓝与淡珊瑚背景，半身居中，无文字无水印。',
  },
  {
    id: 'american-coach', name: '活力教练', sourceName: 'Upbeat Woman', language: '英语-美音',
    gender: '女生', accent: '美式英语', tag: '活泼有节奏', scene: '闯关、课堂竞赛',
    avatarUrl: '/voice-avatars/american-coach.png', platformVoiceId: 'English_Upbeat_Woman',
    avatarPrompt: '1:1方形AI课件音色头像，青年女性美式英语活力教练，卷发马尾，珊瑚橙运动夹克，佩戴小哨子，动作有节奏，柔和3D黏土插画，浅橙与青绿背景，半身居中，无文字无水印。',
  },
  {
    id: 'american-calm', name: '沉静导师', sourceName: 'Calm Woman', language: '英语-美音',
    gender: '女生', accent: '美式英语', tag: '舒缓稳定', scene: '阅读、长文本讲解',
    avatarUrl: '/voice-avatars/american-calm.png', platformVoiceId: 'English_CalmWoman',
    avatarPrompt: '1:1方形AI课件音色头像，成熟女性美式英语阅读导师，深色长发，淡紫蓝开衫，神情专注平和，柔和3D黏土插画，雾蓝与淡绿背景，半身居中，无文字无水印。',
  },
  {
    id: 'american-gentle', name: '温和老师', sourceName: 'Gentle Teacher', language: '英语-美音',
    gender: '女生', accent: '美式英语', tag: '亲切耐听', scene: '低龄引导、练习讲评',
    avatarUrl: '/voice-avatars/american-gentle.png', platformVoiceId: 'English_GentleTeacher',
    avatarPrompt: '1:1方形AI课件音色头像，青年女性美式英语温和老师，柔顺棕发，薄荷绿针织衫，手持小卡片，亲切耐听，柔和3D黏土插画，淡薄荷与暖白背景，半身居中，无文字无水印。',
  },
  {
    id: 'american-steady', name: '稳健讲解员', sourceName: 'Magnetic-voiced Male', language: '英语-美音',
    gender: '男生', accent: '美式英语', tag: '低沉清晰', scene: '科学、知识旁白',
    avatarUrl: '/voice-avatars/american-steady.png', platformVoiceId: 'English_magnetic_voiced_man',
    avatarPrompt: '1:1方形AI课件音色头像，中青年男性美式英语讲解员，深棕短发，灰蓝衬衫，可靠稳健，声音感低沉清晰，柔和3D黏土插画，浅灰蓝与淡金背景，半身居中，无文字无水印。',
  },
  {
    id: 'bilingual-dawn', name: '晨光双语', sourceName: '活力讲师 + Expressive Narrator', language: '中英双语',
    gender: '组合', accent: '中文普通话 + 英式英语', tag: '明快有层次', scene: '双语指令、课堂讲解',
    avatarUrl: '/voice-avatars/bilingual-dawn.png',
    platformVoiceIds: { chinese: 'Chinese_casual_instructor_vv2', english: 'English_expressive_narrator' },
    avatarPrompt: '1:1方形AI课件双语音色头像，中英双语课堂搭档，一位活力中文女教师与一位清朗英音男讲述者并肩，青蓝教学服，柔和3D黏土插画，晨光黄与天蓝背景，双人半身居中，无文字无水印。',
  },
  {
    id: 'bilingual-wise', name: '知性双语', sourceName: '温柔学姐 + Compelling Lady', language: '中英双语',
    gender: '组合', accent: '中文普通话 + 英式英语', tag: '温和连贯', scene: '双语故事、阅读引导',
    avatarUrl: '/voice-avatars/bilingual-wise.png',
    platformVoiceIds: { chinese: 'Chinese (Mandarin)_Gentle_Senior', english: 'English_compelling_lady1' },
    avatarPrompt: '1:1方形AI课件双语音色头像，两位知性女性双语故事老师并肩，一位中文温柔学姐与一位英伦故事家，手持同一本绘本，柔和3D黏土插画，淡紫蓝与玫瑰粉背景，双人半身居中，无文字无水印。',
  },
  {
    id: 'bilingual-vitality', name: '活力双语', sourceName: '温暖少女 + Radiant Girl', language: '中英双语',
    gender: '组合', accent: '中文普通话 + 美式英语', tag: '活泼明亮', scene: '双语闯关、即时反馈',
    avatarUrl: '/voice-avatars/bilingual-vitality.png',
    platformVoiceIds: { chinese: 'Chinese (Mandarin)_Warm_Girl', english: 'English_radiant_girl' },
    avatarPrompt: '1:1方形AI课件双语音色头像，两位活力女性课堂伙伴并肩，一位暖心中文少女与一位阳光美音学姐，明亮运动风教学服，柔和3D黏土插画，珊瑚粉与青绿色背景，双人半身居中，无文字无水印。',
  },
  {
    id: 'chinese-instructor', name: '活力讲师', sourceName: '活力讲师', language: '中文',
    gender: '女生', accent: '中文普通话', tag: '自然有节奏', scene: '课堂讲解、任务引导',
    avatarUrl: '/voice-avatars/chinese-instructor.png', platformVoiceId: 'Chinese_casual_instructor_vv2',
    avatarPrompt: '1:1方形AI课件音色头像，青年女性中文活力讲师，利落短发，青绿色教学夹克，手持任务板，自然有节奏，柔和3D黏土插画，浅青与暖黄背景，半身居中，无文字无水印。',
  },
  {
    id: 'chinese-neighbor', name: '邻家老师', sourceName: '播报男声', language: '中文',
    gender: '男生', accent: '中文普通话', tag: '清楚可靠', scene: '知识播报、规则说明',
    avatarUrl: '/voice-avatars/chinese-neighbor.png', platformVoiceId: 'Chinese (Mandarin)_Male_Announcer',
    avatarPrompt: '1:1方形AI课件音色头像，青年男性中文邻家老师，整洁短发，浅蓝衬衫，神情可靠亲切，表达清楚，柔和3D黏土插画，天蓝与浅灰背景，半身居中，无文字无水印。',
  },
  {
    id: 'chinese-senior', name: '温柔学姐', sourceName: '温柔学姐', language: '中文',
    gender: '女生', accent: '中文普通话', tag: '温柔陪伴', scene: '低龄引导、故事旁白',
    avatarUrl: '/voice-avatars/chinese-senior.png', platformVoiceId: 'Chinese (Mandarin)_Gentle_Senior',
    avatarPrompt: '1:1方形AI课件音色头像，青年女性中文温柔学姐，栗色半长发，淡粉针织衫，手持绘本，神情耐心陪伴，柔和3D黏土插画，淡粉与薄荷绿背景，半身居中，无文字无水印。',
  },
  {
    id: 'chinese-intellectual', name: '智性学姐', sourceName: '智性少女', language: '中文',
    gender: '女生', accent: '中文普通话', tag: '清晰知性', scene: '知识讲解、阅读总结',
    avatarUrl: '/voice-avatars/chinese-intellectual.png', platformVoiceId: 'Chinese (Mandarin)_IntellectualGirl',
    avatarPrompt: '1:1方形AI课件音色头像，青年女性中文智性学姐，黑色齐肩发，圆框眼镜，淡紫蓝衬衫，清晰知性，柔和3D黏土插画，雾蓝与浅紫背景，半身居中，无文字无水印。',
  },
  {
    id: 'chinese-warm', name: '暖心少女', sourceName: '温暖少女', language: '中文',
    gender: '女生', accent: '中文普通话', tag: '明亮温暖', scene: '鼓励反馈、课堂陪伴',
    avatarUrl: '/voice-avatars/chinese-warm.png', platformVoiceId: 'Chinese (Mandarin)_Warm_Girl',
    avatarPrompt: '1:1方形AI课件音色头像，青春女性中文暖心课堂伙伴，双马尾，淡黄色卫衣，笑容明亮温暖，柔和3D黏土插画，暖黄与天空蓝背景，半身居中，无文字无水印。',
  },
  {
    id: 'chinese-fun', name: '萌趣伙伴', sourceName: '憨憨萌兽', language: '中文',
    gender: '女生', accent: '中文普通话', tag: '萌趣活泼', scene: '低龄游戏、角色反馈',
    avatarUrl: '/voice-avatars/chinese-fun.png', platformVoiceId: 'Chinese (Mandarin)_Cute_Spirit',
    avatarPrompt: '1:1方形AI课件音色头像，拟人化萌趣课堂小伙伴，圆润脸型，薄荷绿连帽衫，神情活泼友好，不使用真实动物特征，柔和3D黏土插画，浅绿与珊瑚粉背景，半身居中，无文字无水印。',
  },
];

export function getDefaultVoiceForLanguage(language: DemoVoiceLanguage) {
  return demoVoiceOptions.find(voice => voice.language === language && !voice.dedicated) || demoVoiceOptions[0];
}

const additionalAugustStyles: VisualStylePreset[] = [
  {
    id: 'telephone-switchboard', name: '电话接线风', type: 'base',
    desc: '复古电话与彩色接线元素，适合匹配和沟通主题',
    sourceFile: 'visual-styles.md', sourceKey: 'style-16',
    prompt: '使用明亮、低干扰的儿童电话交换机视觉，保留原题型与互动流程，只调整画面表现。',
  },
  {
    id: 'naval-command', name: '海图指挥台风', type: 'base',
    desc: '海图网格与指挥台元素，适合坐标和逻辑推理',
    sourceFile: 'visual-styles.md', sourceKey: 'style-17',
    prompt: '使用儿童化海图指挥台视觉，保持任务区清晰，保留原题型与互动流程。',
  },
  {
    id: 'hanzi-whiteboard', name: '汉字白板风', type: 'base',
    desc: '课堂白板与规范书写区，适合识字、部件和句子',
    sourceFile: 'visual-styles.md', sourceKey: 'style-18',
    prompt: '使用清晰的儿童汉字课堂白板视觉，保证汉字与拼音可读，保留原互动流程。',
  },
  {
    id: 'candy-taskboard', name: '糖果任务板风', type: 'base',
    desc: '明亮任务板与软糖控件，适合拖拽、拼词和奖励任务',
    sourceFile: 'visual-styles.md', sourceKey: 'style-19',
    prompt: '使用明亮的糖果任务板视觉，学习内容保持最高层级，保留原题型与互动流程。',
  },
];

export const augustVisualStyleOptions = [
  ...baseVisualStylePresets,
  ...additionalAugustStyles,
];

const englishRecommendations: CoursewareRecommendation[] = [
  {
    id: 'rec-word-shooter', sourceType: 'courseware', badge: '同款课件', title: '单词神枪手',
    subject: '英语', grade: '三年级', author: '张老师',
    reason: '同样以快速识别单词为核心，替换词书内容后即可使用。',
    flow: ['听/看目标词', '点击对应目标', '即时判断', '连对奖励'],
    previewUrl: '/case-games/word-shooter/index.html',
    thumbnail: '/case-games/word-shooter/images/bg.webp',
    sameCount: 186, usageCount: 324,
  },
  {
    id: 'rec-make-word', sourceType: 'courseware', badge: '相似课件', title: 'Make-a-Word 果冻拼词',
    subject: '英语', grade: '二年级', author: 'Jolin',
    reason: '适合把已选单词转为拖拽拼写练习，课堂操作感更强。',
    flow: ['展示目标词', '拖拽字母', '吸附校验', '播放发音'],
    previewUrl: '/demo-history/make-a-word-jelly/index.html',
    thumbnail: '/demo-history/make-a-word-jelly/assets/04_make_word_cover.webp',
    sameCount: 132, usageCount: 276,
  },
  {
    id: 'rec-dialogue', sourceType: 'template', badge: '推荐玩法', title: '对话连连看',
    subject: '英语', grade: '二年级',
    reason: '适合把词汇扩展为简单问答，兼顾认读和语境应用。',
    flow: ['查看问句', '匹配答句', '连线校验', '完成复盘'],
    previewUrl: '/demo-history/dialogue-linking/index.html',
    thumbnail: '/demo-history/dialogue-linking/assets/dialog_connect_cover.webp',
    sameCount: 98, usageCount: 241,
  },
];

const mathRecommendations: CoursewareRecommendation[] = [
  {
    id: 'rec-fraction', sourceType: 'courseware', badge: '同款课件', title: '分数披萨店',
    subject: '数学', grade: '三年级', author: 'Jolin',
    reason: '题目结构与数学应用题适配，可直接替换为题库中的本次题目。',
    flow: ['读取任务', '操作配餐', '提交答案', '获得反馈'],
    previewUrl: '/demo-history/fraction-pizza.html',
    thumbnail: 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/tKaqXQLA-2600008999-AigcImage-dfa186ad6f7d49b1b8383397bdaa4ed6_0.png',
    sameCount: 164, usageCount: 308,
  },
  {
    id: 'rec-battleship', sourceType: 'courseware', badge: '相似课件', title: '战舰逻辑挑战',
    subject: '数学', grade: '三年级', author: 'Jolin',
    reason: '适合需要观察、排除和多步推理的题目，反馈结构完整。',
    flow: ['查看线索', '标记答案', '提交校验', '修正通关'],
    previewUrl: '/demo-history/battleship-logic/index.html',
    thumbnail: '/demo-history/battleship-logic/assets/battleships_cover.webp',
    sameCount: 121, usageCount: 265,
  },
  {
    id: 'rec-clock', sourceType: 'template', badge: '推荐玩法', title: '转一转找答案',
    subject: '数学', grade: '一年级',
    reason: '适合口算和单项选择题，轮次短，课堂节奏清楚。',
    flow: ['转动指针', '显示题目', '选择答案', '累计进度'],
    previewUrl: '/demo-history/clock-reading.html',
    thumbnail: 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/TMvevMXM-2600008999-AigcImage-3f6a6afce0544326859d3c8e807c82c6_0.png',
    sameCount: 87, usageCount: 219,
  },
];

const chineseRecommendations: CoursewareRecommendation[] = [
  {
    id: 'rec-hanzi', sourceType: 'courseware', badge: '同款课件', title: '汉字拼图 Rush',
    subject: '语文', grade: '二年级', author: 'Jolin',
    reason: '适合部件、偏旁和识字内容，可把所选题目替换进关卡。',
    flow: ['查看目标字', '选择部件', '完成拼合', '即时讲解'],
    previewUrl: '/demo-history/hanzi-rush/index.html',
    thumbnail: '/demo-history/hanzi-rush/assets/07_hanzi_cover.webp',
    sameCount: 148, usageCount: 287,
  },
  {
    id: 'rec-synonym', sourceType: 'courseware', badge: '相似课件', title: '近义词大挑战',
    subject: '语文', grade: '三年级', author: '王老师',
    reason: '适合词语辨析和语境选择，能够保留题库答案与解析。',
    flow: ['阅读语境', '选择词语', '判断反馈', '查看解析'],
    previewUrl: '/case-games/synonym/index.html',
    thumbnail: '/case-games/synonym/images/bg_default.webp',
    sameCount: 116, usageCount: 252,
  },
  {
    id: 'rec-story-sort', sourceType: 'template', badge: '推荐玩法', title: '课文情节排序',
    subject: '语文', grade: '三年级',
    reason: '适合从云盘课件页面提取段落、事件和顺序关系。',
    flow: ['提取情节', '拖拽排序', '逐步校验', '完整复述'],
    previewUrl: '/demo-history/sun-wukong-dressup/index.html',
    thumbnail: '/demo-history/sun-wukong-dressup/assets/images/cover-bg.webp',
    sameCount: 81, usageCount: 198,
  },
];

export function calculateEstimate(htmlModelId: string, imageModelId: string) {
  const html = htmlModelOptions.find(item => item.id === htmlModelId) || htmlModelOptions[0];
  const image = imageModelOptions.find(item => item.id === imageModelId) || imageModelOptions[0];
  const low = Math.max(html.duration[0], image.duration[0]);
  const high = html.duration[1] + Math.ceil(image.duration[1] * 0.35);
  return `${low}-${high}分钟`;
}

export function buildAugustGenerationPlan(
  prompt: string,
  framework: RequirementFramework,
  teachingSources: TeachingContentSource[] = [],
  preferences: GenerationPreferences = {},
  selectedRecommendationId?: string,
): AugustGenerationPlan {
  const content = `${prompt}\n${framework.userRequirement}`;
  const recommendations = /数学|口算|计算|分数|几何|题库/.test(content)
    ? mathRecommendations
    : /语文|汉字|拼音|古诗|课文/.test(content)
      ? chineseRecommendations
      : englishRecommendations;
  const isEnglish = /英语|英文|单词|词书|word|english/i.test(content);
  const smartVisualStyleId = isEnglish ? 'starfall-education' : /语文|汉字|拼音|古诗/.test(content) ? 'babybus-hanzi-courseware' : 'kidslogic';
  const smartVisualStyleName = isEnglish ? '英语启蒙卡片风' : /语文|汉字|拼音|古诗/.test(content) ? '幼儿识字卡通风' : '清晰逻辑风';
  const manualStyle = preferences.visualStyleMode === 'manual' && preferences.visualStyleId;
  const enhancementStyleIds = preferences.visualStyleEnhancementIds || [];
  const enhancementStyleNames = enhancementVisualStylePresets
    .filter(style => enhancementStyleIds.includes(style.id))
    .map(style => style.name);
  const resolvedBaseStyleName = manualStyle ? preferences.visualStyleName?.split(' + ')[0] || smartVisualStyleName : smartVisualStyleName;
  const resolvedVisualStyleName = [resolvedBaseStyleName, ...enhancementStyleNames].filter(Boolean).join(' + ');
  const hasManualVisualPreference = Boolean(manualStyle || enhancementStyleIds.length);
  const manualVoice = preferences.voiceMode === 'manual' && preferences.voiceId;
  const preferredVoiceLanguage = voiceLanguageOptions.includes(preferences.voiceLanguage as DemoVoiceLanguage)
    ? preferences.voiceLanguage as DemoVoiceLanguage
    : DEFAULT_VOICE_LANGUAGE;
  const smartVoice = getDefaultVoiceForLanguage(preferredVoiceLanguage);
  const generationMode = generationModeOptions.find(mode => mode.id === preferences.generationModeId)
    || getGenerationModeByModels(preferences.htmlModelId, preferences.imageModelId);
  const htmlModelId = generationMode.htmlModelId;
  const imageModelId = generationMode.imageModelId;

  return {
    teachingSources,
    recommendations,
    selectedRecommendationId: selectedRecommendationId || '',
    visualStyleId: manualStyle ? preferences.visualStyleId! : smartVisualStyleId,
    visualStyleEnhancementIds: enhancementStyleIds,
    visualStyleName: resolvedVisualStyleName,
    visualStyleMode: hasManualVisualPreference ? 'manual' : 'smart',
    voiceId: manualVoice ? preferences.voiceId! : smartVoice.id,
    voiceName: manualVoice ? preferences.voiceName || '已选音色' : smartVoice.name,
    voiceLanguage: manualVoice ? preferences.voiceLanguage || preferredVoiceLanguage : preferredVoiceLanguage,
    voiceMode: manualVoice ? 'manual' : 'smart',
    htmlModelId,
    imageModelId,
    generationModeId: generationMode.id,
    generationArchitecture: generationMode.generationArchitecture,
    advancedOpen: false,
    estimatedMinutes: calculateEstimate(htmlModelId, imageModelId),
  };
}
