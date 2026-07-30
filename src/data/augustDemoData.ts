import type {
  AugustGenerationPlan,
  CoursewareRecommendation,
  GenerationPreferences,
  RequirementFramework,
  TeachingContentSource,
} from '../types';
import type { VisualStylePreset } from './visualStylePresets';
import { baseVisualStylePresets } from './visualStylePresets';

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
  notice: string;
}

export interface DemoVoiceOption {
  id: string;
  name: string;
  language: string;
  gender: '女生' | '男生';
  tag: string;
  dedicated?: boolean;
}

export const htmlModelOptions: DemoModelOption[] = [
  { id: 'smart-html', name: '智能选择', description: '根据内容复杂度自动匹配', speedLabel: '推荐', duration: [5, 9], recommended: true },
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
    id: 'smart',
    name: '智能生成',
    tag: '默认',
    description: '系统根据课件内容自动平衡效果和等待时间。',
    suitableFor: '适合大多数课堂互动、练习和讲评课件。',
    htmlModelId: 'smart-html',
    imageModelId: 'smart-image',
    notice: '不确定时选择这一档即可。',
  },
  {
    id: 'refined',
    name: '精细生成',
    tag: '画面更细',
    description: '更重视画面细节、角色一致性和素材表现。',
    suitableFor: '适合低龄启蒙、故事化、视觉要求高的课件。',
    htmlModelId: 'gemini-3.1-pro',
    imageModelId: 'jimeng-5.0',
    notice: '等待时间通常会比智能生成更长。',
  },
  {
    id: 'deep',
    name: '深度生成',
    tag: '逻辑更强',
    description: '更重视复杂互动逻辑、多关卡结构和题目讲评。',
    suitableFor: '适合规则复杂、题量多、要求更高的课件。',
    htmlModelId: 'gpt-5.5',
    imageModelId: 'image-2',
    notice: '适合高要求任务，等待时间可能明显更长。',
  },
];

export function getGenerationModeByModels(htmlModelId = 'smart-html', imageModelId = 'smart-image') {
  const exact = generationModeOptions.find(mode => mode.htmlModelId === htmlModelId && mode.imageModelId === imageModelId);
  if (exact) return exact;
  if (htmlModelId === 'gpt-5.5' || imageModelId === 'image-2') return generationModeOptions.find(mode => mode.id === 'deep') || generationModeOptions[0];
  if (imageModelId === 'jimeng-5.0') return generationModeOptions.find(mode => mode.id === 'refined') || generationModeOptions[0];
  return generationModeOptions[0];
}

export const demoVoiceOptions: DemoVoiceOption[] = [
  { id: 'yunhao', name: '云皓', language: '中文', gender: '男生', tag: '通用' },
  { id: 'yunye', name: '云野', language: '中文', gender: '男生', tag: '成熟稳重' },
  { id: 'yuntang', name: '云堂', language: '中文', gender: '男生', tag: '中原口音' },
  { id: 'yunjian', name: '云健', language: '中文', gender: '男生', tag: '解说' },
  { id: 'yunze', name: '云泽', language: '中文', gender: '男生', tag: '通用' },
  { id: 'yunyang', name: '云扬', language: '中文', gender: '男生', tag: '专业播音' },
  { id: 'yunyi', name: '云翊', language: '中文', gender: '男生', tag: '童趣' },
  { id: 'yunsong', name: '云松', language: '中文', gender: '男生', tag: '粤语' },
  { id: 'yunfeng', name: '云枫', language: '中文', gender: '男生', tag: '自然' },
  { id: 'trust', name: 'Trust', language: '中文', gender: '男生', tag: '值得信赖' },
  { id: 'reliable', name: 'Reliable', language: '中文', gender: '男生', tag: '沉稳可靠' },
  { id: 'smart-boy', name: '聪明伶俐', language: '中文', gender: '男生', tag: '儿童' },
  { id: 'yunxi', name: '云希', language: '中文', gender: '男生', tag: '活泼清亮' },
  { id: 'yunxia', name: '云夏', language: '中文', gender: '女生', tag: '温柔通用' },
  { id: 'xiaotong', name: '晓童', language: '中文', gender: '女生', tag: '儿童' },
  { id: 'amy', name: 'Amy', language: '英语', gender: '女生', tag: '自然美式' },
  { id: 'oliver', name: 'Oliver', language: '英式英语', gender: '男生', tag: '清晰英式' },
  { id: 'claire', name: 'Claire', language: '法语', gender: '女生', tag: '自然' },
  { id: 'mio', name: 'Mio', language: '日语', gender: '女生', tag: '亲和' },
  { id: 'my-class-voice', name: '我的课堂音色', language: '中文', gender: '女生', tag: '我的专属', dedicated: true },
];

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
  const manualVoice = preferences.voiceMode === 'manual' && preferences.voiceId;
  const htmlModelId = preferences.htmlModelId || 'smart-html';
  const imageModelId = preferences.imageModelId || 'smart-image';

  return {
    teachingSources,
    recommendations,
    selectedRecommendationId: selectedRecommendationId || '',
    visualStyleId: manualStyle ? preferences.visualStyleId! : smartVisualStyleId,
    visualStyleName: manualStyle ? preferences.visualStyleName || smartVisualStyleName : smartVisualStyleName,
    visualStyleMode: manualStyle ? 'manual' : 'smart',
    voiceId: manualVoice ? preferences.voiceId! : isEnglish ? 'amy' : 'yunxi',
    voiceName: manualVoice ? preferences.voiceName || '已选音色' : isEnglish ? 'Amy' : '云希',
    voiceLanguage: manualVoice ? preferences.voiceLanguage || '中文' : isEnglish ? '英语' : '中文',
    voiceMode: manualVoice ? 'manual' : 'smart',
    htmlModelId,
    imageModelId,
    advancedOpen: false,
    estimatedMinutes: calculateEstimate(htmlModelId, imageModelId),
  };
}
