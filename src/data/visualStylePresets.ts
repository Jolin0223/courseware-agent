import type { CSSProperties } from 'react';

export type VisualStyleType = 'base' | 'enhancement';

export interface VisualStylePreset {
  id: string;
  name: string;
  type: VisualStyleType;
  desc: string;
  prompt: string;
  sourceFile: 'visual-styles.md' | 'visual-params.md';
  sourceKey: string;
}

export interface VisualStyleSelectionResult {
  baseStyleId: string | null;
  enhancementStyleIds: string[];
  styleName: string;
  stylePrompt: string;
  previewImageUrl?: string;
  selectedBaseStyle?: VisualStylePreset;
  selectedEnhancements: VisualStylePreset[];
}

export const baseVisualStylePresets: VisualStylePreset[] = [
  {
    id: 'kidslogic',
    name: '清晰逻辑风',
    type: 'base',
    desc: '彩色但不刺眼，网格清晰，适合长时间专注解题',
    sourceFile: 'visual-params.md',
    sourceKey: 'kidslogic',
    prompt: '请只调整画面风格：使用【儿童逻辑风】。调性彩色但不刺眼，适合长时间专注解题；背景使用青蓝色渐变 #87CEEB 与淡米白棋盘 #FAF0E6；UI 采用白色圆角卡片底座、浅灰分隔线和柔和阴影；主按钮使用亮蓝色 #45abff，次按钮使用深灰色 #555；预设线索/数字用深灰 #333，玩家输入和高亮用暖橙 #ff8c00，错误提示用红色 #e74c3c，成功反馈用绿色 #2ecc71；全场统一暖黄色圆角外框 #FFD700；标题使用汉仪糯米团/方正粗圆，内容使用方正准圆；音频强制静音，禁用任何音效。保留当前玩法、题目、流程和反馈逻辑。',
  },
  {
    id: 'underwater-world',
    name: '海洋探索风',
    type: 'base',
    desc: '浅蓝水波、气泡和海洋元素，适合探索类内容',
    sourceFile: 'visual-params.md',
    sourceKey: 'underwater',
    prompt: '请只调整画面风格：使用【蓝色海底世界】。调性为 C4D 渲染的沉浸式海底场景；背景使用深海蓝渐变，并加入光线折射效果；UI 组件采用半透明玻璃质感和蓝色边框；元素包含海洋生物、珊瑚、气泡等主题元素；按钮可设计为贝壳形或水滴形，整体蓝色系；动画使用轻微漂浮和气泡上升。保留当前玩法、题目、流程和反馈逻辑。',
  },
  {
    id: 'autumn-orange-tree',
    name: '果园认知风',
    type: 'base',
    desc: '温暖明亮的果园场景，适合认知、分类和采摘反馈',
    sourceFile: 'visual-params.md',
    sourceKey: 'autumn',
    prompt: '请只调整画面风格：使用【清新秋日橘子树】。调性为暖橙色秋日果园主题；背景使用秋日果园场景和暖色调渐变；UI 组件带木质质感和橙色边框；元素包含橘子、树叶、树干等自然元素；按钮可设计为橘子形或树叶形，整体橙色系；动画使用轻微摇摆和落叶飘动。保留当前玩法、题目、流程和反馈逻辑。',
  },
  {
    id: 'doubao-forest',
    name: '森林冒险风',
    type: 'base',
    desc: '自然治愈的森林场景，适合寻找、路径和闯关',
    sourceFile: 'visual-styles.md',
    sourceKey: 'style-4',
    prompt: '请只调整画面风格：使用【豆包森林风】。整体为 3D 粘土哑光质感，圆角膨胀造型，自然治愈；地面使用森林草地色，墙壁使用树墩灌木绿，道具为圆角木箱，角色可用戴黄色安全帽的小兔或小熊，终点用发光小花，光影为单一点光源、弱光弱影。适合森林场景化游戏。保留当前玩法、题目、流程和反馈逻辑。',
  },
  {
    id: 'doubao-candy',
    name: '糖果童趣风',
    type: 'base',
    desc: '马卡龙糖果色、Q弹按钮，适合低龄启蒙',
    sourceFile: 'visual-styles.md',
    sourceKey: 'style-5',
    prompt: '请只调整画面风格：使用【豆包糖果风】。整体为 3D 粘土哑光质感，像翻糖蛋糕一样甜美；圆角膨胀造型像棉花糖；地面使用奶油粉，墙壁使用粉色渐变，道具为马卡龙造型，角色为带糖果装饰的可爱小动物，终点使用发光粉色，光影像糖果灯一样温馨。保留当前玩法、题目、流程和反馈逻辑。',
  },
  {
    id: 'doubao-sea',
    name: '海底探索风',
    type: 'base',
    desc: '浅蓝水波、贝壳珊瑚和海洋角色，适合自然认知和探索任务',
    sourceFile: 'visual-styles.md',
    sourceKey: 'style-6',
    prompt: '请只调整画面风格：使用【豆包海底风】。整体为 3D 粘土哑光质感，圆角膨胀造型；地面为浅蓝沙地，墙壁为珊瑚蓝，道具包含贝壳、珊瑚和海星，角色可用小鱼、海龟、章鱼，终点为发光珍珠，光影像潜水灯一样聚焦。整体清爽护眼，有海洋探索氛围。保留当前玩法、题目、流程和反馈逻辑。',
  },
  {
    id: 'doubao-space',
    name: '太空闯关风',
    type: 'base',
    desc: '星球、火箭和深空配色，适合挑战和探索',
    sourceFile: 'visual-styles.md',
    sourceKey: 'style-7',
    prompt: '请只调整画面风格：使用【豆包太空风】。整体为 3D 粘土哑光质感，圆角膨胀造型；背景为深空黑色星空，地面为深蓝太空舱，元素包含星球、陨石、宇航员装备，角色可用 Q 版宇航员、机器人、外星人，终点为发光星星，光影像星光一样聚焦。保留当前玩法、题目、流程和反馈逻辑。',
  },
  {
    id: 'doubao-blocks',
    name: '积木搭建风',
    type: 'base',
    desc: '几何模块、积木质感，适合图形拼搭和 STEM',
    sourceFile: 'visual-styles.md',
    sourceKey: 'style-8',
    prompt: '请只调整画面风格：使用【豆包积木风】。整体为 3D 粘土哑光质感，像软积木一样安全；背景为浅色教育风，地面为浅灰积木板，墙壁为积木墙，道具为几何色块，角色可用积木小人或教育吉祥物，终点为发光积木，整体极简清晰、教育感强。保留当前玩法、题目、流程和反馈逻辑。',
  },
  {
    id: 'starfall-education',
    name: '英语启蒙卡片风',
    type: 'base',
    desc: '顶部标题角色、中央互动区和底部操作区，适合英语启蒙',
    sourceFile: 'visual-styles.md',
    sourceKey: 'style-9',
    prompt: '请只调整画面风格：使用【Starfall教育风】。所有元素圆润无尖角，按钮超大，适合儿童触控；一屏一任务，任务聚焦；使用高饱和度纯色，元音红色高亮、辅音黑色标准显示；每次点击有发音或音效反馈；可加入拟人化学习伙伴。主色可用品牌黄 #FFCC00、品牌蓝 #4FC3F7、成功绿 #66CC33、提示青 #44C4B。保留当前玩法、题目、流程和反馈逻辑。',
  },
  {
    id: 'babybus-hanzi-courseware',
    name: '幼儿识字卡通风',
    type: 'base',
    desc: '拟人角色、生活场景和大按钮，适合低龄识字',
    sourceFile: 'visual-styles.md',
    sourceKey: 'style-10',
    prompt: '请只调整画面风格：使用【宝宝巴士汉字风】。圆润无尖角，高饱和明亮视觉，正向激励丰富；屏幕比例为 16:9，内容区域占屏幕约 85%，不使用顶部导航栏，内容卡片为白色圆角柔和阴影，圆角约 24px；品牌橙 #FFB800、天空蓝 #4FC3F7、活力红 #FF6B6B、清新绿 #52C41A、温暖黄 #FFD93D；适合汉字学习、象形演变、听音辨字、笔画描红。保留当前玩法、题目、流程和反馈逻辑。',
  },
  {
    id: 'eggy-cute',
    name: '软萌闯关风',
    type: 'base',
    desc: '圆润角色、糖果色竞技场，适合6-10岁轻竞技',
    sourceFile: 'visual-styles.md',
    sourceKey: 'style-11',
    prompt: '请只调整画面风格：使用【蛋仔萌趣风】。角色为圆润蛋形身体、大眼睛、无硬棱角；暖色调、高饱和糖果色；光影柔和漫反射，无硬阴影；动效有弹性物理感，像果冻一样 Q 弹；按钮圆角 24-28px，糖果渐变和白描边；场景可有软云、彩虹桥、圆润山丘、糖果屋和甜甜圈道具。保留当前玩法、题目、流程和反馈逻辑。',
  },
  {
    id: 'ym-competition',
    name: '轻竞技闯关风',
    type: 'base',
    desc: '科技流畅、星空配色，适合较高年级挑战',
    sourceFile: 'visual-styles.md',
    sourceKey: 'style-12',
    prompt: '请只调整画面风格：使用【元梦竞技风】。角色为人形卡通 2.5 头身，动作流畅；色彩以冷色科技梦幻为主，包含电光蓝、星云紫、极光绿、星光金、烈焰红；光影使用体积光、发光边缘和动态阴影；UI 使用圆角 12-16px、科技渐变、发光边框和半透明面板。保留当前玩法、题目、流程和反馈逻辑。',
  },
  {
    id: 'milk-fog-fairy',
    name: '奶雾绘本风',
    type: 'base',
    desc: '奶雾莫兰迪色和温柔绘本质感，适合安静阅读',
    sourceFile: 'visual-styles.md',
    sourceKey: 'style-13',
    prompt: '请只调整画面风格：使用【奶雾童话风】。整体为轻 3D、低多边形弱化、软建模，无硬棱角；全局柔光、漫反射、淡淡环境光，无硬阴影；材质为哑光柔面和微奶油肌理；配色为奶雾白、奶油黄、柔粉和柔莫兰迪色；造型 Q 萌矮胖、童趣简约，像午后阳光照进房间一样温暖安静。保留当前玩法、题目、流程和反馈逻辑。',
  },
  {
    id: 'lowpoly-childlike',
    name: '低多边形童趣风',
    type: 'base',
    desc: '圆角几何、低多边形造型，适合认知和益智',
    sourceFile: 'visual-styles.md',
    sourceKey: 'style-14',
    prompt: '请只调整画面风格：使用【低多边形童趣风】。采用简约几何小块拼接，全部圆角软化；低面数温柔建模，干净分区不复杂；哑光质感，色彩干净分区，柔蓝、薄荷绿、奶油黄为主，辅以柔粉和浅紫；柔光环境光，无硬阴影；整体不复杂、不乱眼，认知性强。保留当前玩法、题目、流程和反馈逻辑。',
  },
  {
    id: 'minimal-flat-childlike',
    name: '极简扁平童趣风',
    type: 'base',
    desc: '纯平色块、全圆角、信息清晰，适合早教认知',
    sourceFile: 'visual-styles.md',
    sourceKey: 'style-15',
    prompt: '请只调整画面风格：使用【极简扁平童趣风】。纯平色块，无阴影、无复杂纹理、无渐变干扰；所有元素全圆角处理，线条圆润加粗；背景使用护眼浅配色，如奶油白、淡蓝、浅黄；元素使用高饱和纯色块，红蓝黄绿分明；按钮为大圆角矩形、纯色填充、粗边框；图标极简、易辨认，认知性强。保留当前玩法、题目、流程和反馈逻辑。',
  },
];

export const enhancementVisualStylePresets: VisualStylePreset[] = [
  {
    id: 'clay',
    name: '粘土质感',
    type: 'enhancement',
    desc: '圆润膨胀、哑光柔和，像手工捏制的粘土',
    sourceFile: 'visual-styles.md',
    sourceKey: '+clay',
    prompt: '请只调整画面风格：在当前基础风格上叠加【3D粘土增强】。画面无景深，使用大景别远景视角；造型圆润膨胀，像手工陶土捏制；材质为柔和漫反射、哑光质感，整体实心厚重、可塑。建议保留当前基础风格的主题元素，主要增强材质和造型。保留当前玩法、题目、流程和反馈逻辑。',
  },
  {
    id: 'jelly',
    name: '果冻软糖质感',
    type: 'enhancement',
    desc: 'Q弹半透明、柔和高光，像软糖一样轻盈',
    sourceFile: 'visual-styles.md',
    sourceKey: '+jelly',
    prompt: '请只调整画面风格：在当前基础风格上叠加【果冻软糖增强】。核心质感为 Q 弹软糯半透明，像果冻一样通透、像软糖一样弹润；造型胖嘟嘟、圆润无棱角；光影使用柔和高光、轻微反光和内部散射光；色彩为马卡龙浅色系、低饱和柔色和清透渐变。保留当前玩法、题目、流程和反馈逻辑。',
  },
  {
    id: 'storybook',
    name: '童话绘本质感',
    type: 'enhancement',
    desc: '柔和手绘线条、纸张肌理和治愈暖调',
    sourceFile: 'visual-styles.md',
    sourceKey: '+storybook',
    prompt: '请只调整画面风格：在当前基础风格上叠加【童话绘本增强】。线条柔和圆角，有稚拙手绘感和松弛温柔线条；光影柔光漫射、无强烈阴影、低对比度；质感带轻肌理和薄手绘纸张纹理；色调使用奶油色、莫兰迪浅调和温柔马卡龙；整体像翻开一本手工绘本。保留当前玩法、题目、流程和反馈逻辑。',
  },
  {
    id: 'felt',
    name: '毛毡布艺质感',
    type: 'enhancement',
    desc: '毛绒边缘、拼贴层次和手工缝制感',
    sourceFile: 'visual-styles.md',
    sourceKey: '+felt',
    prompt: '请只调整画面风格：在当前基础风格上叠加【毛毡布艺增强】。加入毛毡布料纹理、毛线针织纹路和毛绒肌理；构图可有拼贴式层次，边缘有柔软毛边；细节可见缝线和立体贴布效果；色彩使用温柔复古柔色，如奶白、浅棕、柔粉、燕麦色。保留当前玩法、题目、流程和反馈逻辑。',
  },
  {
    id: 'watercolor',
    name: '水彩绘本质感',
    type: 'enhancement',
    desc: '淡彩晕染、水痕边缘和自然渐变',
    sourceFile: 'visual-styles.md',
    sourceKey: '+watercolor',
    prompt: '请只调整画面风格：在当前基础风格上叠加【水彩绘本增强】。核心质感为水彩晕染、通透水痕、自然渐变和轻薄叠色；边缘柔和模糊，有水色渗透效果；线条简约手绘，笔触自然；色彩清透淡彩，如薄荷绿、浅樱粉、天空蓝。保留当前玩法、题目、流程和反馈逻辑。',
  },
  {
    id: 'thickpaint',
    name: '厚涂奶油质感',
    type: 'enhancement',
    desc: '厚实笔触、油画棒纹理和奶油肌理',
    sourceFile: 'visual-styles.md',
    sourceKey: '+thickpaint',
    prompt: '请只调整画面风格：在当前基础风格上叠加【厚涂奶油绘本增强】。笔触厚实、色块饱满，像油画棒或蜡笔涂抹；能看到温柔厚涂肌理和明显笔触纹理；边缘柔和但不模糊，有手绘随意感；色调低饱和暖调、奶油色系，温暖治愈。保留当前玩法、题目、流程和反馈逻辑。',
  },
  {
    id: 'matte',
    name: '磨砂哑光质感',
    type: 'enhancement',
    desc: '细颗粒、低反光，画面更耐看',
    sourceFile: 'visual-styles.md',
    sourceKey: '+matte',
    prompt: '请只调整画面风格：在当前基础风格上叠加【磨砂哑光增强】。材质为哑光磨砂，带细微颗粒肌理；光影低对比、无强烈反光、柔和漫射；整体介于扁平与手绘之间，高级耐看，像磨砂手机壳或高级纸张。保留当前玩法、题目、流程和反馈逻辑。',
  },
  {
    id: 'paper',
    name: '纸艺层叠质感',
    type: 'enhancement',
    desc: '剪纸、纸雕和多层轻立体效果',
    sourceFile: 'visual-styles.md',
    sourceKey: '+paper',
    prompt: '请只调整画面风格：在当前基础风格上叠加【纸艺层叠立体增强】。画面由多层纸片分层构成，通过浅阴影营造轻立体感；边缘柔和，像剪纸或纸雕；前景、中景、背景分层明显，有纸艺拼贴感，整体干净高级。保留当前玩法、题目、流程和反馈逻辑。',
  },
  {
    id: 'fairy3d',
    name: '3D童话立体质感',
    type: 'enhancement',
    desc: '软建模、立体童话书和柔光 3D',
    sourceFile: 'visual-styles.md',
    sourceKey: '+fairy3d',
    prompt: '请只调整画面风格：在当前基础风格上叠加【3D童话立体增强】。使用轻 3D 渲染和软建模圆润造型，像立体童话书里的场景活过来；光影为全局柔光和漫反射；造型 Q 萌矮胖、无硬棱角，像立体童话世界，可探索但不压迫。保留当前玩法、题目、流程和反馈逻辑。',
  },
];

export const visualStylePresets: VisualStylePreset[] = [
  ...baseVisualStylePresets,
  ...enhancementVisualStylePresets,
];

export const visualStylePreviewImages: Record<string, string> = {
  kidslogic: 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/TIwPz6tA-2600008999-AigcImage-55262a92631349d9a116e5fd173c1227_0.png',
  'underwater-world': 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/VU2j99nu-2600008999-AigcImage-d31229ec68b442538400062c05d4c416_0.png',
  'autumn-orange-tree': 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/JH94Zmu1-2600008999-AigcImage-5862a38e18ec49aebb75b01f452c3575_0.png',
  'doubao-forest': 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/2UfOSmOL-2600008999-AigcImage-d180619dd2c04256a8984cdffd8fad65_0.png',
  'doubao-candy': 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/YEoJizVJ-2600008999-AigcImage-dc5f6d6124e24680804c6521cfcfa65f_0.png',
  'doubao-sea': 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/XrPvnt2d-2600008999-AigcImage-6b1278c6971d47b7ba6d0af04ff13129_0.png',
  'doubao-space': 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/ouL8fAhd-2600008999-AigcImage-4d42f137b62340c582a8cbccfa789552_0.png',
  'doubao-blocks': 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/U2ZzXEyM-2600008999-AigcImage-377dea029b4a4832acbe4c647fd964e9_0.png',
  'starfall-education': 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/Ggdonrah-2600008999-AigcImage-f2c6a25dc8a443b586e081ab9daf1d8c_0.png',
  'babybus-hanzi-courseware': 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/xxIA5VVU-2600008999-AigcImage-62cfc336f96b4ec1881b34da854f6086_0.png',
  'eggy-cute': 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/URCTOVnW-2600008999-AigcImage-8fa195012eb14dd9a3bfcd698c990e78_0.png',
  'ym-competition': 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/F5oyxnq3-2600008999-AigcImage-c963261877394a17b7ffb7cb756e3aaf_0.png',
  'milk-fog-fairy': 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/JcLFBjRR-2600008999-AigcImage-4c909de3b83f4dbfa4915147ddb3c2b3_0.png',
  'lowpoly-childlike': 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/E2UMJSNB-2600008999-AigcImage-8a8dab76940b4dbf96373f3268c1ae08_0.png',
  'minimal-flat-childlike': 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/C0bhtRn9-2600008999-AigcImage-a2e8f7af9eb94b29aa4eaea1bb5bdaef_0.png',
};

export const enhancementVisualStylePreviewImages: Record<string, string> = {
  clay: 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/oBInQDi6-921b112a-70a0-40fb-9225-2103026af6e8.png',
  jelly: 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/lWBRiIjV-b078283f-e614-4bdb-8fc1-6c3fb5a2fcd7.png',
  storybook: 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/RdCJufOb-d27bde3a-b93e-42b6-b848-94b93324b109.png',
  felt: 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/npt8pRaF-53dd4c12-2241-41c4-b703-5168a7853fc5.png',
  watercolor: 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/RkDyhKTL-88877663-68d0-4e39-8a40-baa0174e24a2.png',
  thickpaint: 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/Tg8XiFvE-8e70b935-248a-4d9d-b94d-bf3cb1eb9d56.png',
  matte: 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/WlXkS69d-a08371fb-c406-4c08-b6d2-460edc5fe383.png',
  paper: 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/WP3LS3WH-8e453316-9956-4398-b924-3168d3ab8709.png',
  fairy3d: 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/lV7RHytk-bcc9756f-4c34-44d9-a1a0-91b9608f934e.png',
};

export const getVisualStylePreviewStyle = (styleId: string): CSSProperties => {
  const previews: Record<string, CSSProperties> = {
    kidslogic: {
      background:
        'linear-gradient(90deg, rgba(255,255,255,0.9) 0 34%, transparent 35%), repeating-linear-gradient(0deg, rgba(15,23,42,0.08) 0 1px, transparent 1px 18px), repeating-linear-gradient(90deg, rgba(15,23,42,0.08) 0 1px, transparent 1px 18px), linear-gradient(135deg, #87CEEB, #FAF0E6 62%, #FFD700)',
    },
    'underwater-world': {
      background:
        'radial-gradient(circle at 18% 22%, rgba(255,255,255,0.72) 0 5%, transparent 6%), radial-gradient(circle at 76% 24%, rgba(125,211,252,0.55) 0 7%, transparent 8%), radial-gradient(circle at 68% 76%, rgba(45,212,191,0.45) 0 13%, transparent 14%), linear-gradient(180deg, #0EA5E9 0%, #0369A1 52%, #083344 100%)',
    },
    'autumn-orange-tree': {
      background:
        'radial-gradient(circle at 76% 24%, #FDBA74 0 12%, transparent 13%), radial-gradient(circle at 18% 82%, #84CC16 0 16%, transparent 17%), linear-gradient(160deg, #FFF7ED, #FED7AA 55%, #65A30D)',
    },
    'doubao-forest': {
      background:
        'radial-gradient(circle at 25% 78%, #166534 0 15%, transparent 16%), radial-gradient(circle at 75% 72%, #22C55E 0 18%, transparent 19%), linear-gradient(160deg, #DCFCE7, #86EFAC 48%, #15803D)',
    },
    'doubao-candy': {
      background:
        'radial-gradient(circle at 22% 72%, #FDA4AF 0 16%, transparent 17%), radial-gradient(circle at 76% 30%, #FDE68A 0 15%, transparent 16%), linear-gradient(135deg, #FBCFE8, #FDE68A 45%, #A5B4FC)',
    },
    'doubao-sea': {
      background:
        'radial-gradient(circle at 26% 72%, #FDE68A 0 10%, transparent 11%), radial-gradient(circle at 76% 70%, #2DD4BF 0 16%, transparent 17%), linear-gradient(180deg, #BAE6FD, #38BDF8 52%, #0F766E)',
    },
    'doubao-space': {
      background:
        'radial-gradient(circle at 78% 22%, #FDE68A 0 7%, transparent 8%), radial-gradient(circle at 18% 34%, rgba(255,255,255,0.84) 0 2%, transparent 3%), linear-gradient(135deg, #111827, #4338CA 58%, #0EA5E9)',
    },
    'doubao-blocks': {
      background:
        'linear-gradient(135deg, #F8FAFC 0 26%, transparent 27%), linear-gradient(145deg, #FACC15 0 26%, #60A5FA 27% 54%, #34D399 55% 78%, #F87171 79%)',
    },
    'starfall-education': {
      background:
        'linear-gradient(180deg, #FFCC00 0 22%, transparent 23%), radial-gradient(circle at 18% 68%, #66CC33 0 13%, transparent 14%), linear-gradient(135deg, #FFFFFF, #4FC3F7 68%, #44C4B0)',
    },
    'babybus-hanzi-courseware': {
      background:
        'radial-gradient(circle at 22% 70%, #FFB800 0 15%, transparent 16%), radial-gradient(circle at 78% 24%, #4FC3F7 0 14%, transparent 15%), linear-gradient(135deg, #FFF7ED, #FFD93D 48%, #FF6B6B)',
    },
    'eggy-cute': {
      background:
        'radial-gradient(circle at 28% 72%, #FDE68A 0 16%, transparent 17%), radial-gradient(circle at 75% 34%, #FDA4AF 0 14%, transparent 15%), linear-gradient(135deg, #FEF3C7, #F9A8D4 48%, #93C5FD)',
    },
    'ym-competition': {
      background:
        'radial-gradient(circle at 80% 20%, #FACC15 0 7%, transparent 8%), linear-gradient(120deg, #1D4ED8, #7C3AED 50%, #22C55E)',
    },
    'milk-fog-fairy': {
      background:
        'radial-gradient(circle at 25% 75%, #FBCFE8 0 17%, transparent 18%), linear-gradient(135deg, #FFF7ED, #FDE2E4 54%, #C7D2FE)',
    },
    'lowpoly-childlike': {
      background:
        'linear-gradient(135deg, #BAE6FD 0 30%, #BBF7D0 31% 58%, #FEF3C7 59%), linear-gradient(45deg, transparent 0 49%, rgba(255,255,255,0.4) 50% 60%, transparent 61%)',
    },
    'minimal-flat-childlike': {
      background:
        'linear-gradient(135deg, #FEF3C7 0 25%, #BFDBFE 26% 50%, #FCA5A5 51% 75%, #86EFAC 76%)',
    },
  };

  return previews[styleId] || { background: 'linear-gradient(135deg, #F8FAFC, #D1FAE5)' };
};

export const getVisualStyleSelection = (
  baseStyleId: string | null,
  enhancementStyleIds: string[] = [],
): VisualStyleSelectionResult => {
  const selectedBaseStyle = baseStyleId
    ? baseVisualStylePresets.find(style => style.id === baseStyleId)
    : undefined;
  const selectedEnhancements = enhancementVisualStylePresets.filter(style => enhancementStyleIds.includes(style.id));
  const styleName = [selectedBaseStyle?.name, ...selectedEnhancements.map(style => style.name)].filter(Boolean).join(' + ');
  const stylePrompt = [selectedBaseStyle?.prompt, ...selectedEnhancements.map(style => style.prompt)].filter(Boolean).join('\n');

  return {
    baseStyleId,
    enhancementStyleIds,
    styleName,
    stylePrompt,
    previewImageUrl: selectedBaseStyle ? visualStylePreviewImages[selectedBaseStyle.id] : undefined,
    selectedBaseStyle,
    selectedEnhancements,
  };
};

const visualStyleBlockPattern = /\n{0,2}画面风格：[\s\S]*?(?=\n\n|$)/;

export const mergeVisualStylePrompt = (current: string, selection: VisualStyleSelectionResult) => {
  const trimmed = current.trim();
  if (!selection.stylePrompt) {
    return trimmed.replace(visualStyleBlockPattern, '').trim();
  }

  const block = `画面风格：${selection.styleName}\n${selection.stylePrompt}`;
  return visualStyleBlockPattern.test(trimmed)
    ? trimmed.replace(visualStyleBlockPattern, `\n\n${block}`).trim()
    : `${trimmed}\n\n${block}`.trim();
};
