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
  gender: '女生' | '男生' | '女孩' | '男孩' | '本人';
  accent: string;
  tag: string;
  scene: string;
  avatarUrl: string;
  avatarPrompt: string;
  platformVoiceId?: string;
  dedicated?: boolean;
}

export const voiceLanguageOptions = ['英语-英音', '英语-美音', '中英双语', '中文'] as const;
export type DemoVoiceLanguage = typeof voiceLanguageOptions[number];
export const DEFAULT_VOICE_LANGUAGE: DemoVoiceLanguage = '英语-英音';

export function getDemoVoiceDisplayName(voice: DemoVoiceOption) {
  if (voice.dedicated) return voice.name;
  const audience = voice.gender === '女孩' || voice.gender === '男孩' ? '儿童' : '成人';
  const gender = voice.gender === '女生'
    ? '女声'
    : voice.gender === '男生'
      ? '男声'
      : voice.gender;
  return `${audience} · ${gender} · ${voice.name}`;
}

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
    name: '标准生成',
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
    gender: '男生', accent: '英式英语', tag: '清亮有张力', scene: '互动讲解、闯关旁白', avatarUrl: '/voice-avatars/british-explorer.webp', platformVoiceId: 'English_expressive_narrator', avatarPrompt: '1:1方形AI课件音色头像，青年男性英式英语探索讲述者，湖蓝教师夹克，柔和3D黏土插画，无文字无水印。',
  },
  {
    id: 'british-storyteller', name: '英伦故事家', sourceName: 'Compelling Lady', language: '英语-英音',
    gender: '女生', accent: '英式英语', tag: '温暖有感染力', scene: '绘本、故事叙述', avatarUrl: '/voice-avatars/british-storyteller.webp', platformVoiceId: 'English_compelling_lady1', avatarPrompt: '1:1方形AI课件音色头像，青年女性英伦故事老师，手持绘本，柔和3D黏土插画，无文字无水印。',
  },
  {
    id: 'british-star', name: '英伦小星星', sourceName: 'Lovely Girl', language: '英语-英音',
    gender: '女生', accent: '英式英语', tag: '甜美亲切', scene: '低龄启蒙、单词跟读', avatarUrl: '/voice-avatars/british-star.webp', platformVoiceId: 'English_LovelyGirl', avatarPrompt: '1:1方形AI课件音色头像，英式英语启蒙伙伴，星星发夹，柔和3D黏土插画，无文字无水印。',
  },
  {
    id: 'british-guide', name: '知性引导者', sourceName: 'Wise Lady', language: '英语-英音',
    gender: '女生', accent: '英式英语', tag: '沉稳清晰', scene: '知识讲解、课堂总结', avatarUrl: '/voice-avatars/british-guide.webp', platformVoiceId: 'English_Wiselady', avatarPrompt: '1:1方形AI课件音色头像，知性女性英式英语导师，青绿色衬衫，柔和3D黏土插画，无文字无水印。',
  },
  {
    id: 'british-comedian', name: '欢乐戏剧家', sourceName: 'Comedian', language: '英语-英音',
    gender: '男生', accent: '英式英语', tag: '夸张有节奏', scene: '游戏角色、趣味反馈', avatarUrl: '/voice-avatars/british-comedian.webp', platformVoiceId: 'English_Comedian', avatarPrompt: '1:1方形AI课件音色头像，青年男性英伦戏剧老师，橙色领结，柔和3D黏土插画，无文字无水印。',
  },
  {
    id: 'british-nature', name: '自然科学家', sourceName: 'Nature Show Host', language: '英语-英音',
    gender: '男生', accent: '英式英语', tag: '磁性自然', scene: '科学观察、知识旁白', avatarUrl: '/voice-avatars/british-nature.webp', platformVoiceId: 'English_Magnetic_Male_12', avatarPrompt: '1:1方形AI课件音色头像，自然科学讲解员，野外夹克，柔和3D黏土插画，无文字无水印。',
  },
  {
    id: 'british-bubbly-girl', name: '泡泡女孩', sourceName: 'Bubbly Kid', language: '英语-英音',
    gender: '女孩', accent: '英式英语', tag: '活泼跳脱', scene: '趣味互动、即时反馈', avatarUrl: '/voice-avatars/chinese-fun.webp', platformVoiceId: 'BritishChild_female_1_v1', avatarPrompt: '1:1方形AI课件音色头像，活泼的英式英语小女孩，薄荷绿连帽衫，柔和3D黏土插画，无文字无水印。',
  },
  {
    id: 'british-teen-boy', name: '机灵少年', sourceName: 'Teen Boy', language: '英语-英音',
    gender: '男孩', accent: '英式英语', tag: '清亮有张力', scene: '闯关旁白、角色对话', avatarUrl: '/voice-avatars/british-comedian.webp', platformVoiceId: 'English_SadTeen', avatarPrompt: '1:1方形AI课件音色头像，机灵自信的英式英语男孩，湖蓝运动夹克，柔和3D黏土插画，无文字无水印。',
  },
  {
    id: 'british-kindergarten-boy', name: '元气小骑士', sourceName: 'Kindergarten Boy', language: '英语-英音',
    gender: '男孩', accent: '英式英语', tag: '清脆有奶气', scene: '低龄游戏、任务反馈', avatarUrl: '/voice-avatars/british-explorer.webp', platformVoiceId: 'BritishChild_male_1_v1', avatarPrompt: '1:1方形AI课件音色头像，天真有活力的英式英语小男孩，黄蓝运动衫，柔和3D黏土插画，无文字无水印。',
  },

  { id: 'american-sunshine', name: '阳光学姐', sourceName: 'Radiant Girl', language: '英语-美音', gender: '女生', accent: '美式英语', tag: '明亮利落', scene: '单词教学、课堂反馈', avatarUrl: '/voice-avatars/american-sunshine.webp', platformVoiceId: 'English_radiant_girl', avatarPrompt: '1:1方形AI课件音色头像，美式英语阳光课堂学姐，柔和3D黏土插画，无文字无水印。' },
  { id: 'american-captivating', name: '知识领航员', sourceName: 'Captivating Female', language: '英语-美音', gender: '女生', accent: '美式英语', tag: '清晰有感染力', scene: '知识讲解、任务引导', avatarUrl: '/voice-avatars/american-captivating.webp', platformVoiceId: 'English_captivating_female1', avatarPrompt: '1:1方形AI课件音色头像，美式英语知识领航员，柔和3D黏土插画，无文字无水印。' },
  { id: 'american-coach', name: '活力教练', sourceName: 'Upbeat Woman', language: '英语-美音', gender: '女生', accent: '美式英语', tag: '活泼有节奏', scene: '闯关、课堂竞赛', avatarUrl: '/voice-avatars/american-coach.webp', platformVoiceId: 'English_Upbeat_Woman', avatarPrompt: '1:1方形AI课件音色头像，美式英语活力教练，柔和3D黏土插画，无文字无水印。' },
  { id: 'american-calm', name: '沉静导师', sourceName: 'Calm Woman', language: '英语-美音', gender: '女生', accent: '美式英语', tag: '舒缓稳定', scene: '阅读、长文本讲解', avatarUrl: '/voice-avatars/american-calm.webp', platformVoiceId: 'English_CalmWoman', avatarPrompt: '1:1方形AI课件音色头像，美式英语沉静阅读导师，柔和3D黏土插画，无文字无水印。' },
  { id: 'american-gentle', name: '温和老师', sourceName: 'Gentle Teacher', language: '英语-美音', gender: '女生', accent: '美式英语', tag: '亲切耐听', scene: '低龄引导、练习讲评', avatarUrl: '/voice-avatars/american-gentle.webp', platformVoiceId: 'English_GentleTeacher', avatarPrompt: '1:1方形AI课件音色头像，美式英语温和老师，柔和3D黏土插画，无文字无水印。' },
  { id: 'american-steady', name: '稳健讲解员', sourceName: 'Magnetic-voiced Male', language: '英语-美音', gender: '男生', accent: '美式英语', tag: '低沉清晰', scene: '科学、知识旁白', avatarUrl: '/voice-avatars/american-steady.webp', platformVoiceId: 'English_magnetic_voiced_man', avatarPrompt: '1:1方形AI课件音色头像，美式英语稳健男讲解员，柔和3D黏土插画，无文字无水印。' },

  { id: 'bilingual-storyteller', name: '双语故事家', sourceName: '臻之萌', language: '中英双语', gender: '女生', accent: '中英双语', tag: '自然有叙事感', scene: '双语故事、阅读引导', avatarUrl: '/voice-avatars/bilingual-wise.webp', platformVoiceId: '008CB6D451AD99A9', avatarPrompt: '1:1方形AI课件音色头像，青年女性中英双语故事老师，手持绘本，柔和3D黏土插画，半身居中，单人，无文字无水印。' },
  { id: 'bilingual-warm-guide', name: '暖心引导者', sourceName: '臻之鸿', language: '中英双语', gender: '女生', accent: '中英双语', tag: '甜美亲切', scene: '低龄启蒙、鼓励反馈', avatarUrl: '/voice-avatars/bilingual-dawn.webp', platformVoiceId: '65F53B62F879AAFC', avatarPrompt: '1:1方形AI课件音色头像，青年女性中英双语课堂引导者，暖黄色针织衫，亲切微笑，柔和3D黏土插画，半身居中，单人，无文字无水印。' },
  { id: 'bilingual-host', name: '双语主持人', sourceName: '臻之萱', language: '中英双语', gender: '女生', accent: '中英双语', tag: '清晰大方', scene: '课堂开场、规则播报', avatarUrl: '/voice-avatars/bilingual-vitality.webp', platformVoiceId: 'DE4AED2AAFAEAFA1', avatarPrompt: '1:1方形AI课件音色头像，青年女性中英双语课堂主持人，湖蓝西装，清晰自信，柔和3D黏土插画，半身居中，单人，无文字无水印。' },
  { id: 'bilingual-navigator', name: '双语领航员', sourceName: '臻之林', language: '中英双语', gender: '男生', accent: '中英双语', tag: '稳健清楚', scene: '任务引导、知识讲解', avatarUrl: '/voice-avatars/bilingual-dawn.webp', platformVoiceId: '0423377F66C704AB', avatarPrompt: '1:1方形AI课件音色头像，青年男性中英双语课堂领航员，深青教师夹克，稳健亲和，柔和3D黏土插画，半身居中，单人，无文字无水印。' },
  { id: 'bilingual-narrator', name: '双语讲述者', sourceName: '臻之宁', language: '中英双语', gender: '男生', accent: '中英双语', tag: '沉稳有故事感', scene: '知识旁白、长文本讲解', avatarUrl: '/voice-avatars/bilingual-wise.webp', platformVoiceId: '9B738A5354535FC9', avatarPrompt: '1:1方形AI课件音色头像，青年男性中英双语知识讲述者，灰蓝衬衫，沉稳温和，柔和3D黏土插画，半身居中，单人，无文字无水印。' },
  { id: 'bilingual-senior', name: '活力学长', sourceName: '臻之辉', language: '中英双语', gender: '男生', accent: '中英双语', tag: '年轻明快', scene: '互动闯关、即时反馈', avatarUrl: '/voice-avatars/bilingual-vitality.webp', platformVoiceId: '3017A4D76F5663F5', avatarPrompt: '1:1方形AI课件音色头像，年轻男性中英双语课堂学长，白色运动外套，阳光有活力，柔和3D黏土插画，半身居中，单人，无文字无水印。' },
  { id: 'bilingual-star-girl', name: '星光女孩', sourceName: '可爱女孩', language: '中英双语', gender: '女孩', accent: '中英双语', tag: '可爱清甜', scene: '双语启蒙、绘本跟读', avatarUrl: '/voice-avatars/british-star.webp', platformVoiceId: 'HVGO1CG2VDX7CEOH', avatarPrompt: '1:1方形AI课件音色头像，约8岁中英双语小女孩，星星发夹，甜美亲切，柔和3D黏土插画，半身居中，无文字无水印。' },
  { id: 'bilingual-vitality-girl', name: '活力女孩', sourceName: '卡通女孩01', language: '中英双语', gender: '女孩', accent: '中英双语', tag: '活泼灵动', scene: '双语互动、游戏反馈', avatarUrl: '/voice-avatars/chinese-fun.webp', platformVoiceId: 'WQYN6M5BD3NKXKHP', avatarPrompt: '1:1方形AI课件音色头像，约9岁中英双语小女孩，薄荷绿连帽衫，活泼灵动，柔和3D黏土插画，半身居中，无文字无水印。' },
  { id: 'bilingual-clever-boy', name: '聪慧男孩', sourceName: '聪明男孩', language: '中英双语', gender: '男孩', accent: '中英双语', tag: '清亮机灵', scene: '知识问答、闯关旁白', avatarUrl: '/voice-avatars/british-comedian.webp', platformVoiceId: 'P3PFHB1M0JZEU5GQ', avatarPrompt: '1:1方形AI课件音色头像，约10岁中英双语小男孩，湖蓝运动夹克，聪明自信，柔和3D黏土插画，半身居中，无文字无水印。' },
  { id: 'bilingual-energy-boy', name: '元气男孩', sourceName: '可爱男孩', language: '中英双语', gender: '男孩', accent: '中英双语', tag: '可爱有朝气', scene: '低龄游戏、任务反馈', avatarUrl: '/voice-avatars/british-explorer.webp', platformVoiceId: 'J7EFBHZ0SP1FLDGJ', avatarPrompt: '1:1方形AI课件音色头像，约7岁中英双语小男孩，黄蓝运动衫，天真有朝气，柔和3D黏土插画，半身居中，无文字无水印。' },

  { id: 'chinese-instructor', name: '活力讲师', sourceName: '活力讲师', language: '中文', gender: '女生', accent: '普通话', tag: '自然有节奏', scene: '课堂讲解、任务引导', avatarUrl: '/voice-avatars/chinese-instructor.webp', platformVoiceId: 'Chinese_casual_instructor_vv2', avatarPrompt: '1:1方形AI课件音色头像，中文活力讲师，柔和3D黏土插画，无文字无水印。' },
  { id: 'chinese-neighbor', name: '邻家老师', sourceName: '播报男声', language: '中文', gender: '男生', accent: '普通话', tag: '清楚可靠', scene: '知识播报、规则说明', avatarUrl: '/voice-avatars/chinese-neighbor.webp', platformVoiceId: 'Chinese (Mandarin)_Male_Announcer', avatarPrompt: '1:1方形AI课件音色头像，中文邻家男老师，柔和3D黏土插画，无文字无水印。' },
  { id: 'chinese-senior', name: '温柔学姐', sourceName: '温柔学姐', language: '中文', gender: '女生', accent: '普通话', tag: '温柔陪伴', scene: '低龄引导、故事旁白', avatarUrl: '/voice-avatars/chinese-senior.webp', platformVoiceId: 'Chinese (Mandarin)_Gentle_Senior', avatarPrompt: '1:1方形AI课件音色头像，中文温柔课堂学姐，柔和3D黏土插画，无文字无水印。' },
  { id: 'chinese-intellectual', name: '智性学姐', sourceName: '智性少女', language: '中文', gender: '女生', accent: '普通话', tag: '清晰知性', scene: '知识讲解、阅读总结', avatarUrl: '/voice-avatars/chinese-intellectual.webp', platformVoiceId: 'Chinese (Mandarin)_IntellectualGirl', avatarPrompt: '1:1方形AI课件音色头像，中文智性课堂学姐，柔和3D黏土插画，无文字无水印。' },
  { id: 'chinese-warm', name: '暖心少女', sourceName: '温暖少女', language: '中文', gender: '女生', accent: '普通话', tag: '明亮温暖', scene: '鼓励反馈、课堂陪伴', avatarUrl: '/voice-avatars/chinese-warm.webp', platformVoiceId: 'Chinese (Mandarin)_Warm_Girl', avatarPrompt: '1:1方形AI课件音色头像，中文暖心课堂伙伴，柔和3D黏土插画，无文字无水印。' },
  { id: 'chinese-fun', name: '萌趣伙伴', sourceName: '憨憨萌兽', language: '中文', gender: '女生', accent: '普通话', tag: '萌趣活泼', scene: '低龄游戏、角色反馈', avatarUrl: '/voice-avatars/chinese-fun.webp', platformVoiceId: 'Chinese (Mandarin)_Cute_Spirit', avatarPrompt: '1:1方形AI课件音色头像，中文萌趣课堂伙伴，柔和3D黏土插画，无文字无水印。' },
  { id: 'chinese-child-girl-1', name: '漫游女孩', sourceName: '漫游少女', language: '中文', gender: '女孩', accent: '普通话', tag: '好奇灵动', scene: '故事探索、任务引导', avatarUrl: '/voice-avatars/chinese-warm.webp', platformVoiceId: 'Chinese (Mandarin)_ExplorativeGirl', avatarPrompt: '1:1方形AI课件音色头像，约9岁中文小女孩，旅行小挎包，柔和3D黏土插画，无文字无水印。' },
  { id: 'chinese-child-girl-2', name: '含笑女孩', sourceName: '腼腆女孩', language: '中文', gender: '女孩', accent: '普通话', tag: '柔和腼腆', scene: '绘本跟读、温柔反馈', avatarUrl: '/voice-avatars/chinese-senior.webp', platformVoiceId: 'Chinese (Mandarin)_BashfulGirl', avatarPrompt: '1:1方形AI课件音色头像，约8岁中文小女孩，淡粉针织衫，柔和3D黏土插画，无文字无水印。' },
];

export function getDefaultVoiceForLanguage(language: DemoVoiceLanguage) {
  return demoVoiceOptions.find(voice => voice.language === language && !voice.dedicated);
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
    id: 'rec-word-shooter', sourceType: 'courseware', title: '单词神枪手',
    subject: '英语', grade: '三年级', author: '张老师',
    previewUrl: '/case-games/word-shooter/index.html',
    thumbnail: '/case-games/word-shooter/images/bg.webp',
    sameCount: 186, usageCount: 324,
  },
  {
    id: 'rec-make-word', sourceType: 'courseware', title: 'Make-a-Word 果冻拼词',
    subject: '英语', grade: '二年级', author: 'Jolin',
    previewUrl: '/demo-history/make-a-word-jelly/index.html',
    thumbnail: '/demo-history/make-a-word-jelly/assets/04_make_word_cover.webp',
    sameCount: 132, usageCount: 276,
  },
  {
    id: 'rec-dialogue', sourceType: 'template', title: '对话连连看',
    subject: '英语', grade: '二年级',
    previewUrl: '/demo-history/dialogue-linking/index.html',
    thumbnail: '/demo-history/dialogue-linking/assets/dialog_connect_cover.webp',
    sameCount: 98, usageCount: 241,
  },
  {
    id: 'rec-animal-forest', sourceType: 'courseware', title: '动物森林单词配对',
    subject: '英语', grade: '二年级', author: '陈老师',
    previewUrl: '/demo-history/animal-forest/index.html',
    thumbnail: 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/mdRmM1fT-2600008999-AigcImage-eb845ecb04b64fb1bb55438818678e86_0.png',
    sameCount: 92, usageCount: 218,
  },
  {
    id: 'rec-fruit-garden', sourceType: 'courseware', title: '水果单词互动乐园',
    subject: '英语', grade: '一年级', author: '张老师',
    previewUrl: '/demo-history/fruit-garden.html',
    thumbnail: 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/twVU397h-2600008999-AigcImage-507e80e381b5422aaf06d8e26c15290c_0.png',
    sameCount: 88, usageCount: 205,
  },
  {
    id: 'rec-fruit-read', sourceType: 'courseware', title: '水果单词跟读卡',
    subject: '英语', grade: '一年级', author: '李老师',
    previewUrl: '/demo-history/fruit-read-aloud.html',
    thumbnail: 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/twVU397h-2600008999-AigcImage-507e80e381b5422aaf06d8e26c15290c_0.png',
    sameCount: 74, usageCount: 181,
  },
];

const mathRecommendations: CoursewareRecommendation[] = [
  {
    id: 'rec-fraction', sourceType: 'courseware', title: '分数披萨店',
    subject: '数学', grade: '三年级', author: 'Jolin',
    previewUrl: '/demo-history/fraction-pizza.html',
    thumbnail: 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/tKaqXQLA-2600008999-AigcImage-dfa186ad6f7d49b1b8383397bdaa4ed6_0.png',
    sameCount: 164, usageCount: 308,
  },
  {
    id: 'rec-battleship', sourceType: 'courseware', title: '战舰逻辑挑战',
    subject: '数学', grade: '三年级', author: 'Jolin',
    previewUrl: '/demo-history/battleship-logic/index.html',
    thumbnail: '/demo-history/battleship-logic/assets/battleships_cover.webp',
    sameCount: 121, usageCount: 265,
  },
  {
    id: 'rec-clock', sourceType: 'template', title: '转一转找答案',
    subject: '数学', grade: '一年级',
    previewUrl: '/demo-history/clock-reading.html',
    thumbnail: 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/TMvevMXM-2600008999-AigcImage-3f6a6afce0544326859d3c8e807c82c6_0.png',
    sameCount: 87, usageCount: 219,
  },
];

const chineseRecommendations: CoursewareRecommendation[] = [
  {
    id: 'rec-hanzi', sourceType: 'courseware', title: '汉字拼图 Rush',
    subject: '语文', grade: '二年级', author: 'Jolin',
    previewUrl: '/demo-history/hanzi-rush/index.html',
    thumbnail: '/demo-history/hanzi-rush/assets/07_hanzi_cover.webp',
    sameCount: 148, usageCount: 287,
  },
  {
    id: 'rec-synonym', sourceType: 'courseware', title: '近义词大挑战',
    subject: '语文', grade: '三年级', author: '王老师',
    previewUrl: '/case-games/synonym/index.html',
    thumbnail: '/case-games/synonym/images/bg_default.webp',
    sameCount: 116, usageCount: 252,
  },
  {
    id: 'rec-story-sort', sourceType: 'template', title: '课文情节排序',
    subject: '语文', grade: '三年级',
    previewUrl: '/demo-history/sun-wukong-dressup/index.html',
    thumbnail: '/demo-history/sun-wukong-dressup/assets/images/cover-bg.webp',
    sameCount: 81, usageCount: 198,
  },
];

interface RecommendationProfile {
  knowledgePoints: string[];
  questionTypes: string[];
  interactions: string[];
  playMechanisms: string[];
  interactiveCapabilities: string[];
}

const recommendationProfiles: Record<string, RecommendationProfile> = {
  'rec-word-shooter': {
    knowledgePoints: ['word', 'vocabulary', 'color-word'],
    questionTypes: ['choice'],
    interactions: ['click'],
    playMechanisms: ['challenge'],
    interactiveCapabilities: ['auto-check', 'reward'],
  },
  'rec-make-word': {
    knowledgePoints: ['word', 'spelling', 'phonics'],
    questionTypes: ['spelling'],
    interactions: ['drag'],
    playMechanisms: ['word-building'],
    interactiveCapabilities: ['auto-check', 'pronunciation-feedback'],
  },
  'rec-dialogue': {
    knowledgePoints: ['word', 'dialogue'],
    questionTypes: ['matching'],
    interactions: ['connect'],
    playMechanisms: ['matching'],
    interactiveCapabilities: ['auto-check'],
  },
  'rec-animal-forest': {
    knowledgePoints: ['word', 'vocabulary', 'phonics'],
    questionTypes: ['matching'],
    interactions: ['click', 'record'],
    playMechanisms: ['matching', 'challenge'],
    interactiveCapabilities: ['auto-check', 'pronunciation-feedback', 'reward'],
  },
  'rec-fruit-garden': {
    knowledgePoints: ['word', 'vocabulary'],
    questionTypes: ['matching'],
    interactions: ['click', 'record'],
    playMechanisms: ['matching', 'challenge'],
    interactiveCapabilities: ['auto-check', 'pronunciation-feedback', 'reward'],
  },
  'rec-fruit-read': {
    knowledgePoints: ['word', 'vocabulary', 'phonics'],
    questionTypes: ['qa'],
    interactions: ['click', 'record'],
    playMechanisms: ['exploration'],
    interactiveCapabilities: ['pronunciation-feedback', 'reward'],
  },
  'rec-fraction': {
    knowledgePoints: ['fraction'],
    questionTypes: ['application'],
    interactions: ['drag'],
    playMechanisms: ['challenge'],
    interactiveCapabilities: ['auto-check', 'error-feedback', 'reward'],
  },
  'rec-battleship': {
    knowledgePoints: ['logic'],
    questionTypes: ['reasoning'],
    interactions: ['click'],
    playMechanisms: ['challenge'],
    interactiveCapabilities: ['auto-check', 'error-feedback'],
  },
  'rec-clock': {
    knowledgePoints: ['clock', 'mental-math'],
    questionTypes: ['choice'],
    interactions: ['click'],
    playMechanisms: ['spinner'],
    interactiveCapabilities: ['auto-check', 'score'],
  },
  'rec-hanzi': {
    knowledgePoints: ['hanzi', 'radical'],
    questionTypes: ['word-building'],
    interactions: ['click'],
    playMechanisms: ['puzzle'],
    interactiveCapabilities: ['auto-check', 'explanation'],
  },
  'rec-synonym': {
    knowledgePoints: ['synonym'],
    questionTypes: ['choice'],
    interactions: ['click'],
    playMechanisms: ['challenge'],
    interactiveCapabilities: ['auto-check', 'explanation'],
  },
  'rec-story-sort': {
    knowledgePoints: ['text', 'plot', 'paragraph'],
    questionTypes: ['sorting'],
    interactions: ['drag'],
    playMechanisms: ['sorting'],
    interactiveCapabilities: ['auto-check', 'error-feedback'],
  },
};

const knowledgePointRules = [
  { tag: 'fraction', pattern: /分数/ },
  { tag: 'within-20', pattern: /20以内|二十以内/ },
  { tag: 'within-10', pattern: /10以内|十以内/ },
  { tag: 'addition', pattern: /加法/ },
  { tag: 'subtraction', pattern: /减法/ },
  { tag: 'multiplication', pattern: /乘法/ },
  { tag: 'division', pattern: /除法/ },
  { tag: 'clock', pattern: /时钟|钟表/ },
  { tag: 'mental-math', pattern: /口算/ },
  { tag: 'hanzi', pattern: /汉字/ },
  { tag: 'pinyin', pattern: /拼音/ },
  { tag: 'poem', pattern: /古诗/ },
  { tag: 'synonym', pattern: /近义词/ },
  { tag: 'antonym', pattern: /反义词/ },
  { tag: 'radical', pattern: /偏旁|部首/ },
  { tag: 'text', pattern: /课文/ },
  { tag: 'plot', pattern: /情节/ },
  { tag: 'paragraph', pattern: /段落/ },
  { tag: 'word', pattern: /单词|word/i },
  { tag: 'vocabulary', pattern: /词汇|vocabulary/i },
  { tag: 'spelling', pattern: /拼写/ },
  { tag: 'phonics', pattern: /自然拼读|phonics/i },
  { tag: 'color-word', pattern: /颜色词|颜色单词/ },
];

const structureRules = {
  questionTypes: [
    { tag: 'choice', pattern: /选择题|选答案|看图选/ },
    { tag: 'fill', pattern: /填空题/ },
    { tag: 'matching', pattern: /连线题|匹配题/ },
    { tag: 'sorting', pattern: /排序题/ },
    { tag: 'judgement', pattern: /判断题/ },
    { tag: 'qa', pattern: /问答题/ },
    { tag: 'mental-math', pattern: /口算题/ },
  ],
  interactions: [
    { tag: 'click', pattern: /点击/ },
    { tag: 'drag', pattern: /拖拽/ },
    { tag: 'connect', pattern: /连线/ },
    { tag: 'record', pattern: /录音/ },
    { tag: 'spelling', pattern: /拼写/ },
    { tag: 'swipe', pattern: /滑动/ },
    { tag: 'choice', pattern: /选择/ },
  ],
  playMechanisms: [
    { tag: 'challenge', pattern: /闯关/ },
    { tag: 'matching', pattern: /配对/ },
    { tag: 'elimination', pattern: /消除/ },
    { tag: 'race', pattern: /竞速/ },
    { tag: 'exploration', pattern: /探索/ },
    { tag: 'spinner', pattern: /转盘/ },
    { tag: 'puzzle', pattern: /拼图/ },
    { tag: 'quiz', pattern: /抢答/ },
    { tag: 'sorting', pattern: /排序/ },
  ],
  interactiveCapabilities: [
    { tag: 'auto-check', pattern: /自动判题/ },
    { tag: 'explanation', pattern: /错题解析|解析/ },
    { tag: 'error-feedback', pattern: /答错/ },
    { tag: 'pronunciation-feedback', pattern: /发音反馈/ },
    { tag: 'reward', pattern: /星级奖励|奖励/ },
    { tag: 'score', pattern: /计分/ },
    { tag: 'countdown', pattern: /倒计时/ },
  ],
};

const recommendationTagLabels: Record<string, string> = {
  fraction: '分数',
  'within-20': '20以内',
  'within-10': '10以内',
  addition: '加法',
  subtraction: '减法',
  multiplication: '乘法',
  division: '除法',
  clock: '时钟认读',
  'mental-math': '口算',
  logic: '逻辑推理',
  hanzi: '汉字',
  pinyin: '拼音',
  poem: '古诗',
  synonym: '近义词',
  antonym: '反义词',
  radical: '偏旁部首',
  text: '课文',
  plot: '课文情节',
  paragraph: '段落',
  word: '单词认读',
  vocabulary: '词汇',
  spelling: '单词拼写',
  phonics: '自然拼读',
  'color-word': '颜色单词',
  dialogue: '英语问答',
  choice: '选择题',
  fill: '填空题',
  matching: '匹配题',
  sorting: '排序题',
  judgement: '判断题',
  qa: '问答题',
  application: '应用题',
  reasoning: '推理题',
  'word-building': '拼词',
  click: '点击',
  drag: '拖拽',
  connect: '连线',
  record: '录音',
  swipe: '滑动',
  challenge: '闯关',
  elimination: '消除',
  race: '竞速',
  exploration: '探索',
  spinner: '转盘',
  puzzle: '拼图',
  quiz: '抢答',
  'auto-check': '自动判题',
  explanation: '解析',
  'error-feedback': '答错反馈',
  'pronunciation-feedback': '发音反馈',
  reward: '奖励反馈',
  score: '计分',
  countdown: '倒计时',
};

function extractTags(content: string, rules: { tag: string; pattern: RegExp }[]) {
  return rules.filter(rule => rule.pattern.test(content)).map(rule => rule.tag);
}

function hasSharedTag(queryTags: string[], candidateTags: string[]) {
  return queryTags.some(tag => candidateTags.includes(tag));
}

function getSharedTags(queryTags: string[], candidateTags: string[]) {
  return queryTags.filter(tag => candidateTags.includes(tag));
}

function getTagLabels(tags: string[]) {
  return tags.map(tag => recommendationTagLabels[tag] || tag);
}

function getQuerySubject(content: string) {
  if (/数学|口算|计算|分数|几何|加法|减法|乘法|除法|时钟|钟表/.test(content)) return '数学';
  if (/语文|汉字|拼音|古诗|课文|近义词|反义词|偏旁|部首/.test(content)) return '语文';
  if (/英语|英文|单词|词汇|字母|自然拼读|phonics|vocabulary|word/i.test(content)) return '英语';
  return undefined;
}

function getGradeNumber(content: string) {
  if (/幼儿园/.test(content)) return 0;
  const match = content.match(/([一二三四五六1-6])年级/);
  if (!match) return null;
  const gradeMap: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6 };
  return gradeMap[match[1]] || Number(match[1]);
}

function getEligibleRecommendations(content: string) {
  const subject = getQuerySubject(content);
  const queryGrade = getGradeNumber(content);
  const queryKnowledgePoints = extractTags(content, knowledgePointRules);
  const queryStructureTags = {
    questionTypes: extractTags(content, structureRules.questionTypes),
    interactions: extractTags(content, structureRules.interactions),
    playMechanisms: extractTags(content, structureRules.playMechanisms),
    interactiveCapabilities: extractTags(content, structureRules.interactiveCapabilities),
  };
  const hasEnoughStructureEvidence = Object.values(queryStructureTags).filter(tags => tags.length > 0).length >= 2;
  if (queryKnowledgePoints.length === 0 && !hasEnoughStructureEvidence) return [];

  return [...mathRecommendations, ...chineseRecommendations, ...englishRecommendations]
    .filter(recommendation => {
      if (recommendation.isAccessible === false) return false;
      if (recommendation.isDeleted === true) return false;
      if (recommendation.supportsClone === false) return false;
      if (subject && recommendation.subject !== subject) return false;
      const profile = recommendationProfiles[recommendation.id];
      if (!profile) return false;

      const candidateGrade = getGradeNumber(recommendation.grade || '');
      const knowledgePointMatched = hasSharedTag(queryKnowledgePoints, profile.knowledgePoints);
      if (queryGrade !== null) {
        if (candidateGrade === null || Math.abs(queryGrade - candidateGrade) >= 2) return false;
        if (Math.abs(queryGrade - candidateGrade) === 1 && !knowledgePointMatched) return false;
      }

      if (queryKnowledgePoints.length > 0) return knowledgePointMatched;
      const matchedDimensions = (Object.keys(queryStructureTags) as (keyof typeof queryStructureTags)[])
        .filter(dimension => hasSharedTag(queryStructureTags[dimension], profile[dimension]))
        .length;
      return matchedDimensions >= 2;
    })
    .map(recommendation => {
      const profile = recommendationProfiles[recommendation.id];
      const matchPoints: NonNullable<CoursewareRecommendation['matchPoints']> = [];
      const knowledgePointMatches = getSharedTags(queryKnowledgePoints, profile.knowledgePoints);
      if (knowledgePointMatches.length > 0) {
        matchPoints.push({ dimension: '知识点', label: getTagLabels(knowledgePointMatches).join('、') });
      }
      if (subject && recommendation.subject === subject) {
        matchPoints.push({ dimension: '学科', label: recommendation.subject });
      }
      const candidateGrade = getGradeNumber(recommendation.grade || '');
      if (queryGrade !== null && candidateGrade !== null) {
        matchPoints.push({ dimension: '年级', label: queryGrade === candidateGrade ? recommendation.grade : `相邻年级：${recommendation.grade}` });
      }

      const structureDimensions: Array<{
        key: keyof typeof queryStructureTags;
        dimension: NonNullable<CoursewareRecommendation['matchPoints']>[number]['dimension'];
      }> = [
        { key: 'questionTypes', dimension: '题型' },
        { key: 'interactions', dimension: '交互机制' },
        { key: 'playMechanisms', dimension: '玩法机制' },
        { key: 'interactiveCapabilities', dimension: '互动能力' },
      ];
      structureDimensions.forEach(({ key, dimension }) => {
        const matches = getSharedTags(queryStructureTags[key], profile[key]);
        if (matches.length > 0) matchPoints.push({ dimension, label: getTagLabels(matches).join('、') });
      });

      const contentTags = getTagLabels([
        ...profile.questionTypes,
        ...profile.interactions,
        ...profile.playMechanisms,
        ...profile.interactiveCapabilities,
      ]).filter((tag, index, tags) => tags.indexOf(tag) === index);

      return {
        ...recommendation,
        matchPoints,
        materialId: recommendation.id,
        resourceOwner: recommendation.sourceType === 'template' ? '集团资源库' : '当前账号可见资源',
        knowledgePoints: getTagLabels(profile.knowledgePoints),
        contentTags,
      };
    })
    .slice(0, 6);
}

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
  const evidenceContent = [
    prompt,
    ...teachingSources.flatMap(source => [source.name, source.sourceLabel, source.summary, ...(source.items || [])]),
  ].join('\n');
  const recommendations = getEligibleRecommendations(evidenceContent);
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
  const smartVoice = getDefaultVoiceForLanguage(preferredVoiceLanguage) || demoVoiceOptions[0];
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
    voiceName: manualVoice ? preferences.voiceName || '已选音色' : getDemoVoiceDisplayName(smartVoice),
    voiceLanguage: manualVoice ? preferences.voiceLanguage || preferredVoiceLanguage : smartVoice.language,
    voiceMode: manualVoice ? 'manual' : 'smart',
    htmlModelId,
    imageModelId,
    generationModeId: generationMode.id,
    generationArchitecture: generationMode.generationArchitecture,
    advancedOpen: false,
    estimatedMinutes: calculateEstimate(htmlModelId, imageModelId),
  };
}
