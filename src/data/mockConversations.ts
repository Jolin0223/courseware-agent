import type { Conversation, RequirementFramework, GenerationProgress, CoursewareResult } from '../types';
import { demoVersionResults } from './demoCoursewareVersions';
import { isFruitCoursewarePrompt } from './fruitCoursewarePrompt';
import { createLearningDataRecoverySummary, defaultRecoveryItems } from '../utils/learningDataRecovery';

const generateId = () => Math.random().toString(36).substring(2, 11);

const requirementFramework: RequirementFramework = {
  generationSettings: `课件结构：单关卡学练融合\n提交方式：练习模式，支持多次尝试\n默认风格：明亮课堂风`,
  userRequirement: `①核心用户：小学三年级学生\n②应用目标：通过听音辨位和趣味互动，帮助学生巩固英语身体部位词汇的听力理解，提升英语学习兴趣与专注力`,
  featureDesign: `基础功能：\n1. 听力指令播放：系统随机播放身体部位相关的英文指令，如Touch your nose，屏幕右上角设有语音重播按钮供学生反复确认。\n2. 触屏点击判定：学生在平板上点击卡通人物对应的身体部位区域，系统根据触控坐标判定点击位置是否与听力指令匹配。\n3. 互动反馈机制：答对时卡通人物做出对应动作，如摸鼻子或拍手，并播放欢呼音效；答错时人物做出疑惑表情，并轻微晃动正确的身体部位作为提示。\n\n亮点功能：\n1. 连击奖励系统：连续答对三次即可触发特殊全屏动画，如卡通人物跳一段街舞，并获得额外的星星收集奖励，增强游戏成就感。\n2. 多样化触屏交互：除了基础的点击操作，加入滑动交互指令，例如听到Rub your belly时，学生需要在人物肚子区域进行左右滑动才能判定成功。`,
  designStyle: `1. 布局：16:9横屏居中展示大尺寸卡通人物，左上角放置星星计分板，右上角放置喇叭图标的重播按钮，整体界面清爽，避免视觉干扰。\n2. 交互：点击身体部位时该区域会有轻微的缩放回弹效果，滑动操作时指尖伴随闪烁的粒子特效，确保触屏反馈即时且生动。\n3. 配色：采用明亮活泼的糖果色系，背景使用柔和的浅蓝色，卡通人物色彩鲜明且对比度高，符合儿童的视觉偏好。\n4. 文案：界面文字极简，仅在反馈时出现大号圆润字体的鼓励性英文短语，如Excellent或Try again，降低阅读负担。`,
};

const generationProgress: GenerationProgress = {
  stages: [
    { name: '图片生成', status: 'completed', progress: 100, detail: '已生成 5 张图片素材' },
    { name: '音频生成', status: 'completed', progress: 100, detail: '已生成 5 条音频素材' },
    { name: '代码生成', status: 'completed', progress: 100 },
    { name: '代码审查', status: 'completed', progress: 100 },
    { name: '代码修复', status: 'completed', progress: 100 },
    { name: '学情数据回收数据设计', status: 'completed', progress: 100 },
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
  title: '水果单词互动乐园',
  version: 'v1.0',
  htmlContent: demoVersionResults[0].htmlContent,
  learningDataRecovery: createLearningDataRecoverySummary(defaultRecoveryItems),
};

export const mockConversations: Conversation[] = [
  {
    id: 'conv_1',
    title: '一年级·水果单词互动乐园',
    createdAt: '2026-04-06 14:30',
    messages: [
      {
        id: generateId(),
        role: 'user',
        content: '生成一个一年级英语水果单词互动课件',
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
      {
        id: generateId(),
        role: 'user',
        content: '帮我把这个换成讲动物单词的',
        type: 'text',
        timestamp: new Date('2026-04-06T14:42:00'),
      },
      {
        id: generateId(),
        role: 'assistant',
        content: demoVersionResults[1],
        type: 'courseware-result',
        timestamp: new Date('2026-04-06T14:46:00'),
      },
      {
        id: generateId(),
        role: 'user',
        content: '帮我把第一版的拆成只有第二关 读一读的',
        type: 'text',
        timestamp: new Date('2026-04-06T14:53:00'),
      },
      {
        id: generateId(),
        role: 'assistant',
        content: demoVersionResults[2],
        type: 'courseware-result',
        timestamp: new Date('2026-04-06T14:58:00'),
      },
      {
        id: generateId(),
        role: 'user',
        content: '再帮我新做一个颜色单词认一认',
        type: 'text',
        timestamp: new Date('2026-04-06T15:00:00'),
      },
      {
        id: generateId(),
        role: 'assistant',
        content: demoVersionResults[3],
        type: 'courseware-result',
        timestamp: new Date('2026-04-06T15:04:00'),
      },
      {
        id: generateId(),
        role: 'user',
        content: '帮我把会话第二版最后一关玩一玩拆出来',
        type: 'text',
        timestamp: new Date('2026-04-06T15:06:00'),
      },
      {
        id: generateId(),
        role: 'assistant',
        content: demoVersionResults[4],
        type: 'courseware-result',
        timestamp: new Date('2026-04-06T15:10:00'),
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

export function generateRequirementFromPrompt(prompt: string): RequirementFramework {
  const materialLine = prompt.includes('上传材料：')
    ? `\n③上传材料：${prompt.split('上传材料：')[1]?.split('\n')[0] || '已上传材料'}`
    : '';
  const intentLine = prompt.includes('材料用途：')
    ? `\n④材料用途：${prompt.split('材料用途：')[1]?.split('\n')[0] || '用于辅助生成课件'}`
    : '';
  const materialDesign = intentLine
    ? `\n4. 上传材料处理：先根据上传材料完成信息提取与用途校验，再将有效内容写入课件结构；若材料作为素材，则进入图片资源位，若作为资料，则进入知识点和题目生成链路。`
    : '';
  const materialStyle = prompt.includes('视觉风格参考')
    ? `\n5. 上传图片仅作为视觉参考，提取配色、构图和画风，不直接使用原图，避免误把参考图当作课件素材。`
    : '';

  if (isFruitCoursewarePrompt(prompt)) {
    return {
      generationSettings: `课件结构：9 页横版 16:9 互动课件，包含封面、认一认、读一读、玩一玩和课堂总结。\n提交方式：练习模式，所有环节允许重试，语音评测用 1-3 颗星鼓励反馈。\n默认风格：可爱水果花园风，主色 #6CCB5F，辅助色 #FFD166，强调色 #FF7A7A，按钮大而圆润，避免成人化网页表单。`,
      userRequirement: `学习对象：小学一年级英语学习儿童\n课件主题：《Fruit Garden 水果乐园大冒险》\n课程目标：认识 apple、banana、orange、pear、grape、watermelon、strawberry、peach 8 个常见水果单词；完成听音、看图、跟读、语音评测和游戏巩固。${materialLine}${intentLine}`,
      featureDesign: `整体结构：\n1. 课程封面：水果花园场景，小朋友进入花园，水果角色从树和篮子里探出头，点击“开始学习”。\n2. 认一认：第 2-4 页展示水果插画、英文单词、中文含义、小喇叭和“我认识了”按钮，点击水果可放大查看单词并获得星星。\n3. 读一读：第 5-6 页支持“听一听”“我来读”，录音 3 秒后用 1-3 颗星反馈发音，不显示复杂分数。\n4. 玩一玩：第 7-8 页设计《Fruit Catch 水果抓抓乐》，参考抓取目标物、堆叠物件、收集槽和轮次递进的节奏，不复刻任何现成品牌或界面。\n5. 课堂总结：第 9 页展示 8 个水果徽章，点击可再次播放发音，并提供“再玩一次”“完成学习”。${materialDesign}`,
      designStyle: `视觉方向：精品儿童学习 App / 课堂绘本质感，水果花园全屏沉浸式布局，阳光、草地、小篮子、果树和软萌水果角色构成主画面。\n互动反馈：水果角色轻轻漂浮、眨眼；正确反馈用绿色星星粒子、轻快音效和开心表情；错误反馈只做轻微晃动和橙色提示光圈，不使用强惩罚。\n关键要求：所有按钮大而圆润，字体大且清晰，少文字、多图像、多语音、多动画；不要出现密集表格、复杂菜单、后台页面或题库列表。${materialStyle}`,
    };
  }

  if (/颜色|颜色单词|color|colour/i.test(prompt)) {
    return {
      generationSettings: `课件结构：单关卡学练融合，适合 3-5 分钟课堂互动。\n提交方式：练习模式，允许学生多次尝试。\n默认风格：明亮卡片风，保留大按钮和清晰图片区；不默认开启 3D 粘土质感。`,
      userRequirement: `学习对象：5-8 岁儿童\n学习目标：听到或看到颜色英文单词后，能匹配正确颜色，并在多轮互动中巩固颜色词认读。${materialLine}${intentLine}`,
      featureDesign: `推荐玩法：彩虹修复师\n互动流程：\n1. 系统播放或展示颜色单词，如 red、blue、yellow。\n2. 学生从颜色块中选择正确颜色，并拖拽到彩虹缺口。\n3. 答对时彩虹对应区域点亮，播放英文发音和鼓励反馈。\n4. 答错时给出轻提示，例如轻微闪烁正确颜色边缘。\n\n课堂节奏：建议设计 3 关，从常见颜色识别，到听音辨色，再到多颜色混合挑战。${materialDesign}`,
      designStyle: `画面方向：明亮课堂风，彩虹作为主视觉，颜色块要大且清晰，适合大屏操作。\n反馈方式：答对点亮彩虹、获得星星；连续答对可触发彩虹完整闪光。答错反馈保持轻柔，不打断课堂节奏。${materialStyle}`,
    };
  }

  if (/单词图片配对|Matching|配对消除|翻开卡片/.test(prompt)) {
    return {
      generationSettings: `课件结构：单关卡学练融合，可扩展为多组词汇关卡。\n提交方式：练习模式，配错允许回到原位再次尝试。\n默认风格：明亮卡片风，适合英语启蒙投屏和触屏操作。`,
      userRequirement: `学习对象：3-8 岁英语启蒙或小学低段学生\n学习目标：识别主题单词，并能将英文单词与对应图片进行匹配。${materialLine}${intentLine}`,
      featureDesign: `推荐玩法：单词图片配对\n互动流程：\n1. 屏幕展示若干英文单词卡和图片卡。\n2. 学生翻开或拖拽卡片，寻找英文单词和对应图片。\n3. 配对成功后卡片消除，并播放英文发音。\n4. 完成一组后进入下一组词汇，可按主题批量生成关卡。\n\n可复用能力：支持换词库、批量生成多组词汇、替换视觉主题。${materialDesign}`,
      designStyle: `画面方向：明亮卡片风，卡片间距清楚，适合课堂投屏和低龄点击。\n反馈方式：配对成功时卡片轻微弹起并消除，播放发音；配错时卡片回到原位并给出轻提示。${materialStyle}`,
    };
  }

  if (/图片找词|Picture Find|听到单词|点击目标/.test(prompt)) {
    return {
      generationSettings: `课件结构：微关卡学练融合，每轮只解决一个词。\n提交方式：练习模式，答错只给轻提示。\n默认风格：英语启蒙风，图片目标大而清楚。`,
      userRequirement: `学习对象：3-6 岁英语启蒙学生\n学习目标：听到或看到英文单词后，能在图片中找到对应目标。${materialLine}${intentLine}`,
      featureDesign: `推荐玩法：图片找词\n互动流程：\n1. 系统播放或展示一个英文单词。\n2. 学生观察图片区域中的多个目标。\n3. 点击正确图片后播放发音并给出鼓励。\n4. 多轮完成后进入下一组主题词汇。\n\n可复用能力：支持换主题词库、批量生成题目、替换成低龄视觉风格。${materialDesign}`,
      designStyle: `画面方向：英语启蒙风，图片目标大而清楚，减少阅读压力。\n反馈方式：答对时目标高亮并播放单词发音，答错时轻微提示正确目标轮廓。${materialStyle}`,
    };
  }

  if (/字母组词|Make-a-Word|拖拽组词|拼写/.test(prompt)) {
    return {
      generationSettings: `课件结构：单关卡学练融合，可批量生成 3 组单词。\n提交方式：练习模式，字母放错可拖回重试。\n默认风格：明亮字母卡片风，适合自然拼读练习。`,
      userRequirement: `学习对象：5-8 岁英语学习学生\n学习目标：通过拖拽字母完成单词拼写，巩固自然拼读和单词结构。${materialLine}${intentLine}`,
      featureDesign: `推荐玩法：字母组词\n互动流程：\n1. 系统播放或展示目标单词。\n2. 学生从字母卡片中选择正确字母。\n3. 按顺序拖拽组成目标单词。\n4. 完成后播放整词发音并校验拼写。\n\n可复用能力：支持换词库、批量关卡、答案验证。${materialDesign}`,
      designStyle: `画面方向：明亮字母卡片风，字母卡片大而易拖拽。\n反馈方式：字母放对时吸附到单词槽位，拼写完成后播放发音和鼓励动画。${materialStyle}`,
    };
  }

  if (/口算|计算|加减法|20以内|数学/.test(prompt)) {
    return {
      generationSettings: `课件结构：多关卡学练融合，建议 3 关递进。\n提交方式：练习模式，答错展示计算提示；如用于测验可切换为严格模式。\n默认风格：逻辑风格 + 轻竞技进度反馈，保证题目高可读。`,
      userRequirement: `学习对象：小学低年级学生\n学习目标：通过闯关练习巩固计算熟练度，尤其适合 20 以内加减法或口算复习。${materialLine}${intentLine}`,
      featureDesign: `推荐玩法：口算赛车\n互动流程：\n1. 屏幕出现一道口算题和多个答案选项。\n2. 学生选择正确答案后，赛车向前加速。\n3. 连续答对触发连击加速，答错时进入短暂维修提示。\n4. 每关完成一组题目，到达终点后进入下一关。\n\n课堂节奏：建议三关递进，从基础计算到混合计算，再到限时挑战。${materialDesign}`,
      designStyle: `画面方向：沿用清爽课堂界面，加入轻竞技氛围和进度轨道，但题目和答案始终保持高可读性。\n反馈方式：答对赛车前进、连击加速；答错展示计算思路提示，避免只有对错反馈。${materialStyle}`,
    };
  }

  if (/错题生存战|错题|生存|能量/.test(prompt)) {
    return {
      generationSettings: `课件结构：多关卡学练融合，支持错题复现。\n提交方式：练习模式，答错进入回顾站后可再次练习。\n默认风格：轻挑战课堂风，保留能量条但不制造强压力。`,
      userRequirement: `学习对象：小学中高年级或复习阶段学生\n学习目标：通过多轮答题复现错题，帮助学生巩固薄弱知识点。${materialLine}${intentLine}`,
      featureDesign: `推荐玩法：错题生存战\n互动流程：\n1. 学生依次回答复习题。\n2. 答对补充能量，答错减少能量并进入错题回顾站。\n3. 错题会在后续关卡再次出现。\n4. 完成阶段挑战后展示复习成果。\n\n可复用能力：支持换题面、批量关卡、难度递进。${materialDesign}`,
      designStyle: `画面方向：轻挑战课堂风，有能量条和阶段进度，但不制造过强压力。\n反馈方式：答对补能量并获得徽章，答错给解析提示和再次练习机会。${materialStyle}`,
    };
  }

  if (/拼音|声母|韵母|b p m f|识字/.test(prompt)) {
    return {
      generationSettings: `课件结构：微关卡学练融合，适合听辨高频轮次。\n提交方式：练习模式，答错给读音或口型提示。\n默认风格：启蒙卡通风，卡片大、反馈轻。`,
      userRequirement: `学习对象：幼小衔接或一年级学生\n学习目标：听辨拼音读音，并能在场景中找到对应的拼音卡片。${materialLine}${intentLine}`,
      featureDesign: `推荐玩法：拼音捉迷藏\n互动流程：\n1. 系统播放一个拼音读音。\n2. 学生在场景中观察多个拼音卡片。\n3. 点击正确卡片后，卡片角色跳出并朗读。\n4. 答错时给出口型、读音或易混提示。\n\n课堂节奏：可围绕 b、p、m、f 等易混声母设计多轮辨音。${materialDesign}`,
      designStyle: `画面方向：低龄趣味课堂风，场景可用教室、森林或游乐园，但拼音卡片要足够醒目。\n反馈方式：答对角色出现并朗读，答错轻提示正确发音，不制造挫败感。${materialStyle}`,
    };
  }

  if (/古诗|诗句|排序|静夜思|背诵/.test(prompt)) {
    return {
      generationSettings: `课件结构：单关卡学练融合，先排序再朗读巩固。\n提交方式：练习模式，排序错误给位置关系提示。\n默认风格：温和国风课堂风，诗句区域优先清晰。`,
      userRequirement: `学习对象：小学语文学生\n学习目标：理解古诗诗句顺序，通过拖拽整理完成背诵前的结构巩固。${materialLine}${intentLine}`,
      featureDesign: `推荐玩法：诗句小路排序\n互动流程：\n1. 古诗诗句被打乱展示。\n2. 学生将诗句拖拽到正确顺序。\n3. 每排对一句，小路或月光逐步点亮。\n4. 全部完成后展示完整古诗，并播放朗读。\n\n课堂节奏：可先给关键词提示，再进入无提示排序挑战。${materialDesign}`,
      designStyle: `画面方向：温和国风课堂风，背景有月光或小路氛围，但诗句区域保持清晰。\n反馈方式：排序正确时逐步点亮，完成后完整朗读；错误时只提示位置关系，不直接打断。${materialStyle}`,
    };
  }

  if (/六宫格数独|数独|答案验证|推理填空/.test(prompt)) {
    return {
      generationSettings: `课件结构：多关卡学练融合，按难度递进。\n提交方式：严格模式或练习模式均可，默认练习模式展示冲突提示。\n默认风格：逻辑风格，减少装饰，突出网格和规则。`,
      userRequirement: `学习对象：8-12 岁学生\n学习目标：通过数独规则完成逻辑推理，训练数感、观察和规则应用能力。${materialLine}${intentLine}`,
      featureDesign: `推荐玩法：六宫格数独\n互动流程：\n1. 学生观察已知数字和空格位置。\n2. 根据行、列、宫格规则推理答案。\n3. 填入数字后系统自动校验。\n4. 完成一关后解锁更高难度。\n\n可复用能力：支持批量关卡、答案验证、难度递进。${materialDesign}`,
      designStyle: `画面方向：益智网格风，数字和格线清晰，避免过多装饰。\n反馈方式：填对时格子轻亮，填错时提示冲突位置，帮助学生理解规则。${materialStyle}`,
    };
  }

  if (/推箱子|路径规划|推动元素/.test(prompt)) {
    return {
      generationSettings: `课件结构：多关卡学练融合，支持逐步增加障碍。\n提交方式：练习模式，允许撤回或重试。\n默认风格：积木/逻辑关卡风，目标格和路径清晰。`,
      userRequirement: `学习对象：8-12 岁学生\n学习目标：通过路径规划和步骤执行，完成分类、流程或空间任务。${materialLine}${intentLine}`,
      featureDesign: `推荐玩法：推箱子闯关\n互动流程：\n1. 学生观察目标位置和可移动元素。\n2. 规划移动路径。\n3. 推动元素到正确位置。\n4. 完成后进入下一关。\n\n可复用能力：支持批量关卡、难度递进、换视觉主题。${materialDesign}`,
      designStyle: `画面方向：益智关卡风，地图简洁，目标位置明确。\n反馈方式：移动成功有吸附反馈，路径错误时允许撤回或重试。${materialStyle}`,
    };
  }

  return {
    generationSettings: `课件结构：单关卡学练融合，后续可扩展为多关卡。\n提交方式：练习模式，支持多次尝试。\n默认风格：清爽课堂风，优先保证题目、按钮和反馈清晰。`,
    userRequirement: `学习对象：小学阶段学生\n学习目标：围绕老师输入的知识点，设计一节能在课堂中直接使用的互动练习，帮助学生在操作和反馈中完成理解、练习和巩固。${materialLine}${intentLine}`,
    featureDesign: `推荐玩法：互动闯关练习\n互动流程：\n1. 先展示本节课的学习任务。\n2. 学生通过点击、拖拽、匹配或排序完成题目。\n3. 系统根据答案给出即时反馈。\n4. 多轮练习后进入总结或挑战环节。\n\n课堂节奏：建议分为“认识规则 - 练习巩固 - 挑战应用”三步。${materialDesign}`,
    designStyle: `画面方向：保持清爽、明亮、适合课堂投屏，题目和操作区域优先清晰。\n反馈方式：答对给鼓励和进度反馈，答错给轻提示和再次尝试机会。${materialStyle}`,
  };
}
