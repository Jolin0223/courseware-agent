import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Flag,
  Languages,
  Layers3,
  Puzzle,
  RefreshCw,
  Sparkles,
  Wand2,
} from 'lucide-react';

export interface GameplayInspiration {
  id: string;
  title: string;
  summary: string;
  subjects: string[];
  keywords: string[];
  ageRange: string;
  learningAction: string;
  interactionTags: string[];
  structure: string[];
  enhancements: string[];
  visual: string;
  promptEnhancement: string;
  sourceType: string;
}

type TemplateCategory = 'featured' | 'challenge' | 'english' | 'puzzle' | 'sort' | 'visual';
type InternalSource = 'action' | 'starfall' | 'puzzle' | 'visual-style' | 'incentive';
type ReusableAction = '换题面' | '批量关卡' | '换风格' | '答案验证' | '换词库' | '难度递进';

interface InteractionTemplate {
  id: string;
  displayName: string;
  category: Exclude<TemplateCategory, 'featured'>;
  internalSource: InternalSource;
  description: string;
  suitableFor: string[];
  ageRange: string;
  classroomFlow: string[];
  reusableActions: ReusableAction[];
  defaultVisualStyle: string;
  promptTemplate: string;
  examples: string[];
  learningAction: string;
}

interface InspirationSectionProps {
  selectedInspirationId?: string | null;
  onApplyInspiration?: (item: GameplayInspiration) => void;
  onEnhancePrompt?: (enhancement: string) => void;
}

const tabs: Array<{ key: TemplateCategory; label: string; icon: React.ElementType }> = [
  { key: 'featured', label: '精选', icon: Sparkles },
  { key: 'challenge', label: '闯关挑战', icon: Flag },
  { key: 'english', label: '英语启蒙', icon: Languages },
  { key: 'puzzle', label: '益智谜题', icon: Puzzle },
  { key: 'sort', label: '排序拼图', icon: Layers3 },
];

const templates: InteractionTemplate[] = [
  {
    id: 'math-racer',
    displayName: '口算赛车',
    category: 'challenge',
    internalSource: 'action',
    description: '答对题目让赛车前进，连续答对会加速。',
    suitableFor: ['口算', '计算', '复习'],
    ageRange: '6-9岁',
    classroomFlow: ['出题', '答题', '赛车前进', '终点闯关'],
    reusableActions: ['换题面', '批量关卡', '换风格'],
    defaultVisualStyle: '轻竞技课堂风',
    promptTemplate: '采用“口算赛车”玩法。学生每答对一道题，赛车向前加速；连续答对触发连击加速，答错进入维修提示。题目按关卡递进，适合课堂抢答和个人练习。',
    examples: ['20以内加减法', '乘法口诀', '分数比较'],
    learningAction: '计算练习与熟练度巩固',
  },
  {
    id: 'knowledge-quest',
    displayName: '知识闯关',
    category: 'challenge',
    internalSource: 'action',
    description: '每完成一组题目解锁下一关，适合全科复习。',
    suitableFor: ['全科答题', '阶段复习', '课堂检测'],
    ageRange: '7-12岁',
    classroomFlow: ['选择关卡', '完成题组', '获得星星', '解锁挑战'],
    reusableActions: ['换题面', '批量关卡', '换风格'],
    defaultVisualStyle: '明亮闯关风',
    promptTemplate: '采用“知识闯关”玩法。学生完成一组题目后获得星星并解锁下一关，题目难度逐步提高；答错时给出轻提示并允许再次尝试。',
    examples: ['单元复习', '科学常识', '语文基础题'],
    learningAction: '阶段复习与多轮巩固',
  },
  {
    id: 'pinyin-hide',
    displayName: '拼音捉迷藏',
    category: 'challenge',
    internalSource: 'action',
    description: '听到读音后，在场景中找到对应拼音卡片。',
    suitableFor: ['拼音', '识字', '字母识别'],
    ageRange: '5-7岁',
    classroomFlow: ['播放读音', '寻找卡片', '点击确认', '角色朗读'],
    reusableActions: ['换题面', '换风格'],
    defaultVisualStyle: '低龄趣味课堂风',
    promptTemplate: '采用“拼音捉迷藏”玩法。系统播放拼音读音，学生在场景中找到对应卡片；答对时角色跳出朗读，答错时给出口型或读音提示。',
    examples: ['b p m f', '声母复习', '易混拼音'],
    learningAction: '听辨与识别',
  },
  {
    id: 'review-survival',
    displayName: '错题生存战',
    category: 'challenge',
    internalSource: 'action',
    description: '答题维持能量，错题会进入回顾站。',
    suitableFor: ['错题复习', '综合测验', '课后巩固'],
    ageRange: '8-12岁',
    classroomFlow: ['答题', '能量变化', '错题回顾', '阶段通关'],
    reusableActions: ['换题面', '批量关卡', '难度递进'],
    defaultVisualStyle: '轻挑战课堂风',
    promptTemplate: '采用“错题生存战”玩法。学生通过答题维持能量，答错题目进入回顾站，并在后续关卡再次出现，帮助完成复习巩固。',
    examples: ['错题本', '期末复习', '综合测验'],
    learningAction: '错题复现与强化记忆',
  },
  {
    id: 'english-picture-match',
    displayName: '单词图片配对',
    category: 'english',
    internalSource: 'starfall',
    description: '把英文单词和图片配对，成功后消除并朗读。',
    suitableFor: ['动物单词', '颜色单词', '食物单词'],
    ageRange: '3-8岁',
    classroomFlow: ['翻开卡片', '匹配单词和图片', '配对消除', '播放发音'],
    reusableActions: ['换词库', '批量关卡', '换风格'],
    defaultVisualStyle: '明亮卡片风',
    promptTemplate: '采用“单词图片配对”玩法。学生翻开卡片，找到英文单词和对应图片的配对，配对成功后卡片消除并播放英文发音。',
    examples: ['动物单词', '颜色单词', '身体部位'],
    learningAction: '单词识别与图文匹配',
  },
  {
    id: 'picture-find',
    displayName: '图片找词',
    category: 'english',
    internalSource: 'starfall',
    description: '听到或看到单词后，从图片中找到正确目标。',
    suitableFor: ['听音选图', '单词认读', '图片识别'],
    ageRange: '3-6岁',
    classroomFlow: ['听到单词', '观察图片', '点击目标', '发音反馈'],
    reusableActions: ['换词库', '批量关卡', '换风格'],
    defaultVisualStyle: '英语启蒙风',
    promptTemplate: '采用“图片找词”玩法。系统播放或展示一个单词，学生在图片区域找到对应目标并点击确认，答对后播放发音和鼓励反馈。',
    examples: ['颜色', '动物', '水果'],
    learningAction: '听音辨认与图片识别',
  },
  {
    id: 'make-a-word',
    displayName: '字母组词',
    category: 'english',
    internalSource: 'starfall',
    description: '拖动字母拼成目标单词，适合自然拼读。',
    suitableFor: ['字母组合', '自然拼读', '单词拼写'],
    ageRange: '5-8岁',
    classroomFlow: ['听目标词', '选择字母', '拖拽组词', '朗读验证'],
    reusableActions: ['换词库', '批量关卡', '答案验证'],
    defaultVisualStyle: '明亮字母卡片风',
    promptTemplate: '采用“字母组词”玩法。学生听到目标单词后，从字母卡片中选择并拖拽组成单词，完成后播放朗读并校验拼写。',
    examples: ['CVC 单词', '颜色单词', '动物单词'],
    learningAction: '拼读与拼写',
  },
  {
    id: 'word-sort',
    displayName: '单词分类',
    category: 'english',
    internalSource: 'starfall',
    description: '把单词拖到对应类别，适合主题词汇整理。',
    suitableFor: ['词汇分类', '主题单词', '语义归类'],
    ageRange: '6-10岁',
    classroomFlow: ['出现单词', '判断类别', '拖到分组', '完成归类'],
    reusableActions: ['换词库', '批量关卡', '换风格'],
    defaultVisualStyle: '清晰分组卡片风',
    promptTemplate: '采用“单词分类”玩法。学生将单词拖拽到正确类别中，完成一组后展示分类结果并播放重点词汇发音。',
    examples: ['动物/食物', '颜色/形状', '名词/动词'],
    learningAction: '分类理解与词汇整理',
  },
  {
    id: 'six-sudoku',
    displayName: '六宫格数独',
    category: 'puzzle',
    internalSource: 'puzzle',
    description: '观察已知数字，填入空格并自动校验。',
    suitableFor: ['数感', '逻辑推理', '规律观察'],
    ageRange: '8-12岁',
    classroomFlow: ['观察数字', '推理填空', '自动校验', '解锁下一关'],
    reusableActions: ['批量关卡', '答案验证', '难度递进'],
    defaultVisualStyle: '益智网格风',
    promptTemplate: '采用“六宫格数独”玩法。学生根据已知数字推理空格答案，系统提供自动校验和难度递进关卡，适合逻辑与数感训练。',
    examples: ['六宫格数独', '数学逻辑', '规律训练'],
    learningAction: '逻辑推理与规则应用',
  },
  {
    id: 'minesweeper-reasoning',
    displayName: '扫雷式推理',
    category: 'puzzle',
    internalSource: 'puzzle',
    description: '根据数字线索推断安全区域，训练逻辑判断。',
    suitableFor: ['逻辑推理', '科学线索', '条件判断'],
    ageRange: '9-12岁',
    classroomFlow: ['阅读线索', '推断位置', '点击验证', '完成挑战'],
    reusableActions: ['批量关卡', '答案验证', '难度递进'],
    defaultVisualStyle: '益智逻辑风',
    promptTemplate: '采用“扫雷式推理”玩法。学生根据数字或文字线索判断安全区域并点击验证，逐步完成逻辑挑战。',
    examples: ['逻辑推理', '科学分类', '条件判断'],
    learningAction: '线索推断与验证',
  },
  {
    id: 'poem-slider',
    displayName: '古诗滑块排序',
    category: 'sort',
    internalSource: 'puzzle',
    description: '把打乱的诗句拖回正确顺序，完成后朗读整首诗。',
    suitableFor: ['古诗', '课文片段', '流程排序'],
    ageRange: '7-10岁',
    classroomFlow: ['打乱顺序', '拖拽排序', '点亮进度', '完整朗读'],
    reusableActions: ['换题面', '批量关卡', '换风格'],
    defaultVisualStyle: '温和国风课堂风',
    promptTemplate: '采用“古诗滑块排序”玩法。学生将打乱的诗句拖拽到正确顺序，每排对一句点亮一次进度，完成后展示完整古诗并播放朗读。',
    examples: ['静夜思', '望庐山瀑布', '课文段落'],
    learningAction: '排序记忆与朗读巩固',
  },
  {
    id: 'sokoban-quest',
    displayName: '推箱子闯关',
    category: 'sort',
    internalSource: 'puzzle',
    description: '推动元素到目标位置，适合路径规划和分类任务。',
    suitableFor: ['空间路径', '分类任务', '步骤规划'],
    ageRange: '8-12岁',
    classroomFlow: ['观察目标', '规划路径', '推动元素', '完成关卡'],
    reusableActions: ['批量关卡', '难度递进', '换风格'],
    defaultVisualStyle: '益智关卡风',
    promptTemplate: '采用“推箱子闯关”玩法。学生通过移动和推动元素到指定位置完成关卡，可用于路径规划、分类或步骤理解任务。',
    examples: ['图形分类', '科学流程', '路径规划'],
    learningAction: '空间规划与步骤执行',
  },
  {
    id: 'logic-style',
    displayName: '逻辑风格',
    category: 'visual',
    internalSource: 'visual-style',
    description: '蓝白高对比、网格规整、几何线条，适合数学逻辑和推理题。',
    suitableFor: ['数学逻辑', '数独', '推理'],
    ageRange: '8-12岁',
    classroomFlow: ['网格布局', '清晰校验', '规则提示'],
    reusableActions: ['换风格'],
    defaultVisualStyle: 'logic',
    promptTemplate: '整体采用逻辑风格：蓝白高对比专业配色，网格布局规整，几何线条元素，扁平化极简设计，减少装饰，突出题目、规则和答案校验。',
    examples: ['六宫格数独', '口算推理', '规律训练'],
    learningAction: '提升规则题和推理题可读性',
  },
  {
    id: 'ocean-style',
    displayName: '海洋风格',
    category: 'visual',
    internalSource: 'visual-style',
    description: '浅蓝渐变、水泡、海浪和贝壳元素，适合拼音、语文和海洋认知。',
    suitableFor: ['拼音', '语文', '海洋认知'],
    ageRange: '5-9岁',
    classroomFlow: ['水波背景', '卡片漂浮', '轻动画反馈'],
    reusableActions: ['换风格'],
    defaultVisualStyle: 'ocean',
    promptTemplate: '整体采用海洋风格：浅蓝渐变主色调，搭配水泡、海浪、贝壳和海洋生物元素；反馈可使用气泡上浮、水波扩散和卡片漂浮动画。',
    examples: ['拼音听辨', '海洋动物识字', '词语配对'],
    learningAction: '营造轻松探索感',
  },
  {
    id: 'orchard-style',
    displayName: '果园风格',
    category: 'visual',
    internalSource: 'visual-style',
    description: '橙黄暖色、果实和绿叶元素，适合识字、幼儿认知和基础数学。',
    suitableFor: ['识字', '幼儿认知', '基础数学'],
    ageRange: '3-7岁',
    classroomFlow: ['果实题卡', '采摘反馈', '阳光动效'],
    reusableActions: ['换风格'],
    defaultVisualStyle: 'orchard',
    promptTemplate: '整体采用果园风格：橙黄暖色调，以果实、果园、阳光和绿叶为核心元素；答对时可出现果实掉落、篮子收集和光影闪烁动画。',
    examples: ['汉字采摘', '数数练习', '水果分类'],
    learningAction: '增强低龄认知亲和力',
  },
  {
    id: 'forest-style',
    displayName: '森林风格',
    category: 'visual',
    internalSource: 'visual-style',
    description: '深绿大地色、树木蘑菇和自然探索氛围，适合冒险类内容。',
    suitableFor: ['自然探索', '动植物', '迷宫冒险'],
    ageRange: '5-10岁',
    classroomFlow: ['森林场景', '路径探索', '落叶反馈'],
    reusableActions: ['换风格'],
    defaultVisualStyle: 'forest',
    promptTemplate: '整体采用森林风格：深绿大地色系，包含树木、蘑菇和自然探索元素；反馈可使用落叶飘动、路径点亮和光影穿透效果。',
    examples: ['动物分类', '自然常识', '森林迷宫'],
    learningAction: '提升探索和任务感',
  },
  {
    id: 'candy-style',
    displayName: '糖果风格',
    category: 'visual',
    internalSource: 'visual-style',
    description: '马卡龙甜系配色、Q弹光泽和弹跳动画，适合 3-6 岁启蒙。',
    suitableFor: ['低龄启蒙', '颜色形状', '配对'],
    ageRange: '3-6岁',
    classroomFlow: ['糖果按钮', 'Q弹反馈', '星星奖励'],
    reusableActions: ['换风格'],
    defaultVisualStyle: 'candy',
    promptTemplate: '整体采用糖果风格：马卡龙粉紫甜系配色，搭配糖果、蛋糕和甜点元素；按钮和卡片有 Q 弹光泽质感，答对时使用弹性弹跳动画。',
    examples: ['颜色认知', '形状配对', '低龄英语'],
    learningAction: '提升低龄学生参与感',
  },
  {
    id: 'underwater-style',
    displayName: '水下风格',
    category: 'visual',
    internalSource: 'visual-style',
    description: '深蓝青色、珊瑚和荧光生物元素，适合深海探索主题。',
    suitableFor: ['深海主题', '科学探索', '神秘关卡'],
    ageRange: '6-10岁',
    classroomFlow: ['深海背景', '漂浮卡片', '荧光反馈'],
    reusableActions: ['换风格'],
    defaultVisualStyle: 'underwater',
    promptTemplate: '整体采用水下风格：深蓝青色调，搭配深海珊瑚、沉船和荧光生物元素；动画节奏偏静谧，可使用缓慢漂浮和光点游动反馈。',
    examples: ['海底分类', '科学认知', '深海寻宝'],
    learningAction: '营造沉浸式探索氛围',
  },
  {
    id: 'space-style',
    displayName: '太空风格',
    category: 'visual',
    internalSource: 'visual-style',
    description: '深空配色、星星行星和火箭元素，适合科学认知和闯关。',
    suitableFor: ['宇宙探索', '科学认知', '闯关挑战'],
    ageRange: '6-12岁',
    classroomFlow: ['星球关卡', '火箭进度', '星光反馈'],
    reusableActions: ['换风格'],
    defaultVisualStyle: 'space',
    promptTemplate: '整体采用太空风格：黑蓝紫深空配色，搭配星星、行星、火箭和星云元素；反馈可使用星光闪烁、火箭推进和悬浮旋转动画。',
    examples: ['科学常识', '星球闯关', '口算飞船'],
    learningAction: '增强闯关和探索目标',
  },
  {
    id: 'blocks-style',
    displayName: '积木风格',
    category: 'visual',
    internalSource: 'visual-style',
    description: '红黄蓝绿积木模块、塑料质感，适合图形拼搭和 STEM。',
    suitableFor: ['图形拼搭', 'STEM', '建构认知'],
    ageRange: '5-10岁',
    classroomFlow: ['模块卡片', '拼搭反馈', '结构完成'],
    reusableActions: ['换风格'],
    defaultVisualStyle: 'blocks',
    promptTemplate: '整体采用积木风格：红黄蓝绿经典积木配色，几何模块化堆叠结构，光滑塑料质感；拖拽或拼搭成功时产生吸附和堆叠反馈。',
    examples: ['图形分类', '推箱子', '空间路径'],
    learningAction: '强化建构和空间操作感',
  },
  {
    id: 'starfall-style',
    displayName: '启蒙卡片风',
    category: 'visual',
    internalSource: 'visual-style',
    description: '明亮高饱和、顶部标题角色、中央游戏区和底部操作区。',
    suitableFor: ['英语', '拼音', '字母'],
    ageRange: '3-8岁',
    classroomFlow: ['标题角色', '中央互动', '星星奖励'],
    reusableActions: ['换风格'],
    defaultVisualStyle: 'starfall',
    promptTemplate: '整体采用英语启蒙卡片风：明亮高饱和配色，顶部放标题和角色，中央为游戏区，底部为操作区；反馈使用星星奖励、角色鼓励和发音确认。',
    examples: ['单词配对', '字母组词', '拼音识别'],
    learningAction: '提升英语和拼音启蒙可读性',
  },
  {
    id: 'babybus-style',
    displayName: '幼儿卡通风',
    category: 'visual',
    internalSource: 'visual-style',
    description: '高饱和糖果色、拟人角色和生活化场景，适合 2-5 岁启蒙。',
    suitableFor: ['幼儿启蒙', '生活认知', '全科启蒙'],
    ageRange: '2-5岁',
    classroomFlow: ['卡通角色', '生活场景', '夸张反馈'],
    reusableActions: ['换风格'],
    defaultVisualStyle: 'babybus',
    promptTemplate: '整体采用幼儿卡通风：高饱和明亮糖果色，可爱拟人卡通角色和生活化场景；反馈要夸张、生动、鼓励性强，按钮尺寸适合低龄点击。',
    examples: ['颜色认知', '生活物品', '低龄数学'],
    learningAction: '降低低龄学习门槛',
  },
];

const featuredTemplateIds = [
  'math-racer',
  'knowledge-quest',
  'pinyin-hide',
  'english-picture-match',
  'picture-find',
  'poem-slider',
  'six-sudoku',
  'review-survival',
];

const toGameplayInspiration = (template: InteractionTemplate): GameplayInspiration => ({
  id: template.id,
  title: template.displayName,
  summary: template.description,
  subjects: template.suitableFor,
  keywords: template.examples,
  ageRange: template.ageRange,
  learningAction: template.learningAction,
  interactionTags: template.suitableFor.slice(0, 3),
  structure: template.classroomFlow,
  enhancements: template.reusableActions,
  visual: template.defaultVisualStyle,
  promptEnhancement: template.promptTemplate,
  sourceType: template.category,
});

export default function InspirationSection({
  selectedInspirationId,
  onApplyInspiration,
  onEnhancePrompt,
}: InspirationSectionProps) {
  const [activeTab, setActiveTab] = useState<TemplateCategory>('featured');
  const [batchIndex, setBatchIndex] = useState(0);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const visibleTemplates = useMemo(() => {
    if (activeTab === 'featured') {
      return featuredTemplateIds
        .map(id => templates.find(item => item.id === id))
        .filter((item): item is InteractionTemplate => Boolean(item));
    }
    return templates.filter(item => item.category === activeTab);
  }, [activeTab]);

  const batchSize = 4;
  const visibleBatchTemplates = useMemo(() => {
    if (visibleTemplates.length <= batchSize) return visibleTemplates;
    const start = (batchIndex * batchSize) % visibleTemplates.length;
    const batch = visibleTemplates.slice(start, start + batchSize);
    if (batch.length === batchSize) return batch;
    return [...batch, ...visibleTemplates.slice(0, batchSize - batch.length)];
  }, [batchIndex, visibleTemplates]);

  const visualTemplates = useMemo(() => (
    templates.filter(item => item.category === 'visual')
  ), []);

  const handleTabChange = (tab: TemplateCategory) => {
    setActiveTab(tab);
    setBatchIndex(0);
    setExpandedCardId(null);
  };

  const handleRefreshBatch = () => {
    setBatchIndex(prev => prev + 1);
    setExpandedCardId(null);
  };

  const handleApply = (template: InteractionTemplate) => {
    const inspiration = toGameplayInspiration(template);
    if (template.category === 'visual') {
      onEnhancePrompt?.(template.promptTemplate);
      return;
    }
    onApplyInspiration?.(inspiration);
  };

  return (
    <section style={styles.shell}>
      <style>{`
        .inspiration-scroll {
          scrollbar-width: none;
        }
        .inspiration-scroll::-webkit-scrollbar {
          display: none;
        }
        @media (max-width: 880px) {
          .inspiration-header {
            flex-direction: column;
            align-items: flex-start !important;
          }
          .inspiration-hint {
            text-align: left !important;
          }
          .inspiration-card-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
      <div className="inspiration-header" style={styles.header}>
        <div style={styles.eyebrow}>
          <Sparkles size={15} />
          灵感推荐区
        </div>
        <div className="inspiration-hint" style={styles.headerHint}>
          不知道怎么设计互动课件时，可以来这找找灵感
        </div>
      </div>

      <div style={styles.tabBar}>
        <div className="inspiration-scroll" style={styles.tabs}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                style={{ ...styles.tab, ...(active ? styles.tabActive : {}) }}
                onClick={() => handleTabChange(tab.key)}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
        <button style={styles.refreshBtn} onClick={handleRefreshBatch}>
          <RefreshCw size={14} />
          换一换
        </button>
      </div>

      <div className="inspiration-card-grid" style={styles.templateGrid}>
        {visibleBatchTemplates.map(template => {
          const selected = selectedInspirationId === template.id;
          const expanded = expandedCardId === template.id;
          return (
            <article key={template.id} style={{ ...styles.card, ...(selected ? styles.cardSelected : {}) }}>
              <div style={styles.cardHeader}>
                <div>
                  <div style={styles.cardKicker}>{template.ageRange} · {getSourceLabel(template.internalSource)}</div>
                  <h3 style={styles.cardTitle}>{template.displayName}</h3>
                </div>
                {selected && (
                  <span style={styles.selectedBadge}>
                    <CheckCircle2 size={12} />
                    已套用
                  </span>
                )}
              </div>

              <p style={styles.description}>{template.description}</p>

              <div style={styles.compactMeta}>
                {getTemplateSettings(template).join(' · ')}
              </div>

              <div style={styles.compactTags}>
                {template.suitableFor.map(item => <span key={item} style={styles.tag}>{item}</span>)}
              </div>

              <div style={styles.cardActions}>
                <button
                  style={{ ...styles.detailBtn, ...(expanded ? styles.detailBtnActive : {}) }}
                  onClick={() => setExpandedCardId(expanded ? null : template.id)}
                >
                  {expanded ? '收起说明' : '查看说明'}
                </button>
                <button style={styles.primaryBtn} onClick={() => handleApply(template)}>
                  套用玩法
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {expandedCardId && (
        <div style={styles.detailPanel}>
          {(() => {
            const template = visibleBatchTemplates.find(item => item.id === expandedCardId);
            if (!template) return null;
            return (
              <>
                <div style={styles.detailHeader}>
                  <div>
                    <div style={styles.detailEyebrow}>玩法说明</div>
                    <div style={styles.detailTitle}>{template.displayName}</div>
                  </div>
                  <button style={styles.detailCloseBtn} onClick={() => setExpandedCardId(null)}>收起</button>
                </div>
                <div style={styles.detailGrid}>
                  <div style={styles.detailBlock}>
                    <div style={styles.blockLabel}>适合用来做</div>
                    <div style={styles.tagRow}>
                      {template.suitableFor.map(item => <span key={item} style={styles.tag}>{item}</span>)}
                    </div>
                  </div>
                  <div style={styles.detailBlock}>
                    <div style={styles.blockLabel}>课堂流程</div>
                    <div style={styles.flow}>
                      {template.classroomFlow.map((step, index) => (
                        <span key={step} style={styles.flowStep}>
                          {step}{index < template.classroomFlow.length - 1 ? ' →' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={styles.detailBlockWide}>
                    <div style={styles.blockLabel}>可直接替换成这些内容</div>
                    <div style={styles.exampleText}>{template.examples.join('、')}</div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      <div style={styles.addonPanel}>
        <div style={styles.addonHeader}>
          <span style={styles.addonIcon}><Wand2 size={15} /></span>
          <div>
            <div style={styles.addonTitle}>可叠加画面风格</div>
            <div style={styles.addonSubtitle}>选好玩法后，再从 10 种课堂视觉风格里挑一种叠加到提示词。</div>
          </div>
        </div>
        <div className="inspiration-scroll" style={styles.addonGrid}>
          {visualTemplates.map(template => (
            <button key={template.id} style={styles.addonItem} onClick={() => handleApply(template)}>
              <span style={styles.addonItemTop}>
                <span style={styles.addonItemTitle}>{template.displayName}</span>
                <span style={styles.addonAge}>{template.ageRange}</span>
              </span>
              <span style={styles.addonItemDesc}>{template.description}</span>
              <span style={styles.addonSuit}>适合：{template.suitableFor.join('、')}</span>
              <span style={styles.addonAction}>套用风格</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

const getSourceLabel = (source: InternalSource) => {
  const labels: Record<InternalSource, string> = {
    action: '闯关玩法',
    starfall: '英语启蒙',
    puzzle: '益智题型',
    'visual-style': '画面风格',
    incentive: '奖励反馈',
  };
  return labels[source];
};

const getTemplateSettings = (template: InteractionTemplate) => {
  const structure = template.category === 'puzzle' || template.id === 'review-survival' || template.id === 'sokoban-quest'
    ? '适合分关卡练习'
    : template.id === 'picture-find' || template.id === 'pinyin-hide'
      ? '适合短时练习'
      : '适合一节课使用';
  const submitMode = template.id === 'six-sudoku'
    ? '提交后自动校验'
    : '支持反复尝试';
  const style = template.internalSource === 'starfall'
    ? '英语启蒙画面'
    : template.internalSource === 'puzzle'
      ? '益智网格画面'
      : template.defaultVisualStyle;
  return [structure, submitMode, style];
};

const styles: Record<string, React.CSSProperties> = {
  shell: {
    position: 'relative',
    width: '100%',
    maxWidth: 1080,
    margin: '0 auto',
    padding: 16,
    borderRadius: 20,
    background: 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(240,253,249,0.94) 48%, rgba(239,246,255,0.9))',
    border: '1px solid rgba(103, 232, 249, 0.58)',
    boxShadow: '0 22px 60px rgba(15, 118, 110, 0.13), inset 0 1px 0 rgba(255,255,255,0.9)',
    overflow: 'hidden',
  },
  header: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 10,
    padding: '2px 2px 0',
  },
  eyebrow: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    color: '#00A8A0',
    fontSize: 18,
    fontWeight: 900,
    marginBottom: 0,
  },
  headerHint: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 1.35,
    textAlign: 'right',
    whiteSpace: 'nowrap',
  },
  tabBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  tabs: {
    display: 'flex',
    gap: 8,
    minWidth: 0,
    overflowX: 'auto',
  },
  tab: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 32,
    padding: '0 12px',
    borderRadius: 9,
    border: '1px solid #D6F3EF',
    background: '#FFFFFF',
    color: '#475569',
    fontSize: 13,
    fontWeight: 850,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  tabActive: {
    borderColor: '#00C9A7',
    background: '#CCFBF1',
    color: '#047857',
  },
  refreshBtn: {
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 32,
    padding: '0 12px',
    borderRadius: 9,
    border: '1px solid #D6F3EF',
    background: '#FFFFFF',
    color: '#0F766E',
    fontSize: 13,
    fontWeight: 850,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  templateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 10,
  },
  card: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 198,
    padding: 13,
    borderRadius: 13,
    border: '1px solid rgba(214, 243, 239, 0.95)',
    background: 'linear-gradient(180deg, #FFFFFF, #FBFEFF)',
    boxShadow: '0 12px 28px rgba(15, 23, 42, 0.06)',
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: '#00C9A7',
    boxShadow: '0 14px 32px rgba(0, 201, 167, 0.16)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  cardKicker: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: 850,
    marginBottom: 3,
  },
  cardTitle: {
    margin: 0,
    color: '#0F172A',
    fontSize: 16,
    fontWeight: 900,
  },
  selectedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    height: 22,
    padding: '0 8px',
    borderRadius: 999,
    background: '#CCFBF1',
    color: '#047857',
    fontSize: 11,
    fontWeight: 900,
    whiteSpace: 'nowrap',
  },
  description: {
    margin: 0,
    color: '#334155',
    fontSize: 13,
    lineHeight: 1.45,
    minHeight: 38,
  },
  compactMeta: {
    marginTop: 9,
    color: '#0F766E',
    fontSize: 12,
    fontWeight: 850,
    lineHeight: 1.35,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  compactTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 9,
  },
  detailPanel: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    border: '1px solid rgba(214, 243, 239, 0.95)',
    background: 'linear-gradient(135deg, #FFFFFF, #F0FDF9)',
    boxShadow: '0 12px 28px rgba(15, 118, 110, 0.08)',
  },
  cardActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 'auto',
    paddingTop: 10,
  },
  detailBtn: {
    height: 30,
    padding: '0 10px',
    borderRadius: 8,
    border: '1px solid #D6F3EF',
    background: '#FFFFFF',
    color: '#0F766E',
    fontSize: 12,
    fontWeight: 850,
    cursor: 'pointer',
  },
  detailBtnActive: {
    borderColor: '#00C9A7',
    background: '#CCFBF1',
  },
  detailHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  detailEyebrow: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: 900,
    marginBottom: 3,
  },
  detailTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: 900,
  },
  detailCloseBtn: {
    height: 28,
    padding: '0 10px',
    borderRadius: 8,
    border: '1px solid #D6F3EF',
    background: '#FFFFFF',
    color: '#0F766E',
    fontSize: 12,
    fontWeight: 850,
    cursor: 'pointer',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: 10,
  },
  detailBlock: {
    padding: 10,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.72)',
    border: '1px solid #E0F2FE',
  },
  detailBlockWide: {
    gridColumn: '1 / -1',
    padding: 10,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.72)',
    border: '1px solid #E0F2FE',
  },
  settingsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 0,
    padding: 8,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #F0FDF9, #EFF6FF)',
    border: '1px solid #D6F3EF',
  },
  settingChip: {
    color: '#0F766E',
    fontSize: 11,
    fontWeight: 900,
    lineHeight: 1.25,
  },
  sectionBlock: {
    marginTop: 11,
  },
  blockLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: 850,
    marginBottom: 6,
  },
  tagRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    height: 23,
    padding: '0 7px',
    borderRadius: 999,
    background: '#F0FDF9',
    color: '#047857',
    fontSize: 11,
    fontWeight: 850,
    lineHeight: '23px',
  },
  flow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 5,
    padding: 9,
    borderRadius: 10,
    background: '#F8FAFC',
    color: '#475569',
    fontSize: 12,
    lineHeight: 1.45,
  },
  flowStep: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontWeight: 750,
  },
  exampleText: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 1.45,
  },
  primaryBtn: {
    height: 30,
    padding: '0 12px',
    borderRadius: 8,
    border: 'none',
    background: 'linear-gradient(135deg, #00C9A7, #00A8E8)',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 900,
    cursor: 'pointer',
  },
  addonPanel: {
    marginTop: 14,
    padding: 14,
    borderRadius: 16,
    background: 'rgba(255,255,255,0.78)',
    border: '1px solid rgba(214, 243, 239, 0.95)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.85)',
  },
  addonHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  addonIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
    borderRadius: 9,
    background: '#CCFBF1',
    color: '#047857',
    flexShrink: 0,
  },
  addonTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: 900,
    marginBottom: 2,
  },
  addonSubtitle: {
    color: '#64748B',
    fontSize: 12,
  },
  addonGrid: {
    display: 'flex',
    gap: 10,
    overflowX: 'auto',
    paddingBottom: 4,
  },
  addonItem: {
    flex: '0 0 230px',
    minHeight: 136,
    padding: 12,
    borderRadius: 12,
    border: '1px solid #D6F3EF',
    background: 'linear-gradient(180deg, #FFFFFF, #F8FAFC)',
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
  },
  addonItemTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  addonItemTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: 900,
  },
  addonAge: {
    flexShrink: 0,
    height: 21,
    padding: '0 7px',
    borderRadius: 999,
    background: '#ECFEFF',
    color: '#0E7490',
    fontSize: 11,
    fontWeight: 850,
    lineHeight: '21px',
  },
  addonItemDesc: {
    display: 'block',
    color: '#475569',
    fontSize: 12,
    lineHeight: 1.45,
  },
  addonSuit: {
    display: 'block',
    color: '#0F766E',
    fontSize: 11,
    fontWeight: 850,
    lineHeight: 1.35,
  },
  addonAction: {
    marginTop: 'auto',
    alignSelf: 'flex-start',
    height: 24,
    padding: '0 8px',
    borderRadius: 7,
    background: '#E0F2FE',
    color: '#0284C7',
    fontSize: 11,
    fontWeight: 900,
    lineHeight: '24px',
  },
};
