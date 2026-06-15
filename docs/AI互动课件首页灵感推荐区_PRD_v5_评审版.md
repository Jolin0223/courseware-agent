# 【PRD】AI互动课件首页灵感推荐区改版（评审版）

# 修订记录

| 版本 | 日期 | 修改人 | 修改内容 |
| --- | --- | --- | --- |
| v5.0 | 2026-06-16 | Codex | 基于当前 demo 与 creative-shrimp-suite-v1.0 真实数据重写评审版；明确 41 条玩法推荐池、4 个只读示例、结构化套用玩法、画面风格入口迁移、数据来源和验收口径。 |

# 一、项目背景

## 1.1 项目背景

AI互动课件首页是老师生成互动课件的主入口。老师常见输入是“水果单词”“20以内口算”“拼音听辨”这类短需求，但短需求无法稳定表达互动玩法、课堂流程、反馈规则和视觉要求，导致生成结果过度依赖老师提示词能力。

桌面已有本地能力包：`/Users/jolin/Desktop/creative-shrimp-suite-v1.0`。该能力包里沉淀了可用于课堂互动课件生成的玩法模板、示例结构和视觉风格。6月25日版本需要把这部分能力产品化为首页「灵感推荐区」，让老师先看到可套用玩法，再把玩法带回输入框生成自己的课件。

用户侧不展示“创意虾”“templates-ready”“sourceRefs”等内部来源，只展示老师能理解的玩法名、适用内容、课堂流程和示例效果。

## 1.2 现状/问题

| 问题 | 当前表现 | 对用户影响 |
| --- | --- | --- |
| 老师不知道怎么把知识点变成互动 | 只能靠自己输入玩法描述 | 生成质量不稳定，老师容易只写知识点 |
| 只给提示词模板不够直观 | 看文字仍要想象课堂效果 | 不确定是否好用，套用意愿弱 |
| 首页卡片信息过多会压缩首屏 | 1440×780 下容易看不完整 | 页面拥挤，首屏没有呼吸感 |
| 示例如果做成资源库会跑偏 | 老师可能以为是在找成品课件 | 与“生成自己的课件”主链路冲突 |
| 卡片字段来源不清楚 | 短描述、标签、流程像前端临时编写 | 研发和测试难判断数据口径 |

## 1.3 解决方案

本期采用“玩法卡片 + 只读示例 + 结构化套用”的方案：

1. 首页展示「灵感推荐区」，帮助老师挑选互动玩法。
2. 每张卡片展示轻量信息：年龄/类型、玩法名、短说明、课堂流程、标签、看玩法示例、套用玩法。
3. 点击「看玩法示例」打开全局弹层，展示真实 HTML 只读示例，帮助老师理解课堂效果。
4. 点击「套用玩法」后，输入框进入结构化草稿状态：上方突出“教学内容”待填写区，下方展示已套用玩法摘要，真实生成提示词折叠展示。
5. 切换其他玩法时，保留老师填写的教学内容，只替换玩法块。
6. 首页不再展示「可叠加画面风格」模块；画面风格入口放到“互动课件设计方案确认”和生成后的课件卡片中。

## 1.4 本期范围

| 范围 | 本期是否做 | 说明 |
| --- | --- | --- |
| 首页灵感推荐区 | 是 | 7个tab、年龄筛选、换一换、每屏8张卡 |
| 看玩法示例 | 是 | 4个真实HTML示例覆盖41条玩法，弹层只读 |
| 套用玩法结构化输入框 | 是 | 教学内容高亮输入，真实模板prompt折叠预览 |
| 真实玩法模板入库 | 是 | 41条玩法，`templatePrompt` 来自真实 markdown，版本取最高 |
| 画面风格入口迁移 | 是 | 首页移除，确认卡和生成后课件卡保留 |
| 15个基础风格 + 9个增强质感 | 是 | 用于调整画面风格弹层和确认卡快捷选择 |
| 每条玩法都做独立真实HTML示例 | 否 | P0 用4个代表性示例覆盖，后续逐步补齐 |
| 个性化推荐算法 | 否 | P0 用priority排序和筛选，不做复杂推荐 |
| 成品课件资源库 | 否 | 示例仅用于理解玩法，不作为可下载资源 |

# 二、需求概览

## 2.1 UI稿地址

产品demo地址：[http://127.0.0.1:5173/](http://127.0.0.1:5173/)

UI稿地址：待提供

## 2.2 产品流程一览

```mermaid
flowchart LR
  A["进入首页"] --> B["查看灵感推荐区"]
  B --> C["按分类或年龄筛选玩法"]
  C --> D{"是否先看效果"}
  D -->|是| E["点击看玩法示例"]
  E --> F["全局弹层展示只读HTML示例"]
  F --> G["点击套用这个玩法"]
  D -->|否| H["点击套用玩法"]
  G --> I["输入框变为结构化草稿"]
  H --> I
  I --> J["老师填写教学内容"]
  J --> K{"是否切换玩法"}
  K -->|是| L["保留教学内容，只替换玩法块"]
  L --> I
  K -->|否| M["发送需求"]
  M --> N["进入需求确认和正常生成流程"]
```

# 三、需求列表

| 需求编号 | 需求名称 | 优先级 | 说明 |
| --- | --- | --- | --- |
| 1-1 | 首页灵感推荐区模块 | P0 | 标题、一行说明、分类、年龄筛选、换一换、玩法卡 |
| 1-2 | 玩法卡片展示 | P0 | 每屏8张，卡片信息轻量但保留核心判断信息 |
| 1-3 | 看玩法示例弹层 | P0 | 全局弹层，真实HTML只读预览，侧边栏和灵感助手在下层 |
| 1-4 | 套用玩法结构化输入框 | P0 | 教学内容输入区、已套用玩法摘要、真实prompt折叠预览 |
| 1-5 | 切换玩法保留用户内容 | P0 | 保留教学内容，只覆盖玩法块 |
| 1-6 | 画面风格入口迁移 | P0 | 首页移除风格模块，确认卡/课件卡提供调整入口 |
| 2-1 | 灵感推荐区数据入库 | P0 | 41条玩法、4条示例、7个tab、4个年龄段 |
| 2-2 | 视觉风格数据入库 | P0 | 15个基础风格、9个增强质感、15张16:9参考图 |
| 3-1 | 异常与降级 | P1 | 空态、示例加载失败、prompt缺失兜底 |

# 四、需求方案

| 产品原型 | 具体功能说明 |
| --- | --- |
| 当前demo：首页灵感推荐区首屏 | **1-1 首页灵感推荐区模块**<br>* 模块标题：灵感推荐区。<br>* 标题右侧只展示一行说明：不知道怎么设计互动课件时，可以来这找找灵感。<br>* 不展示玩法总数，不展示能力库来源，不展示多行介绍。<br>* 分类第一行：精选、闯关挑战、英语启蒙、语文识字、数学思维、益智谜题、排序拼图。<br>* 年龄第二行：全部年龄、低龄启蒙、1-2年级、3-4年级、5-6年级。<br>* 分类和年龄筛选样式保持一致；点击后只有选中底色变化，不出现黑色描边。<br>* 右侧展示“换一换”按钮；当当前筛选结果少于等于8条时，点击后仍保持当前列表，不报错。<br>* 首页不展示“可叠加画面风格”模块，避免玩法和风格逻辑混在一起。 |
| 当前demo：玩法卡片 | **1-2 玩法卡片展示**<br>* 每屏展示8张卡片，桌面端为4列×2行。<br>* 卡片展示：年龄+玩法类型、玩法名、一句话说明、课堂流程前4步、最多3个标签、看玩法示例、套用玩法。<br>* 卡片不展示：`+1`、换题面、批量关卡、换风格、内部来源、长prompt。<br>* 卡片上的短说明、课堂流程、标签来自入库表中的产品加工字段，用于帮助老师快速判断，不作为最终生成prompt。<br>* 点击“套用玩法”后，不直接发送消息，只把玩法带回输入框。 |
| 当前demo：玩法效果示例弹层 | **1-3 看玩法示例弹层**<br>* 弹层为全局弹层，层级高于侧边栏和灵感助手。<br>* 左侧为真实HTML只读iframe预览；只用于看互动节奏，不提供打开、下载、编辑、一键同款。<br>* 右侧展示用户能理解的信息：示例说明、这个玩法适合、课堂流程、你可以换成自己的内容、套用这个玩法。<br>* 文案使用老师视角，不出现“复用、兜底映射、同类示例、替换字段”等产研表达。<br>* 点击遮罩或关闭按钮：关闭弹层，不改变输入框。<br>* 点击“套用这个玩法”：关闭弹层，并执行同“套用玩法”的结构化回填逻辑。 |
| 当前demo：结构化输入框 | **1-4 套用玩法结构化输入框**<br>* 套用后，普通输入框切换为结构化草稿。<br>* 顶部提示：先补充教学内容，已选玩法会自动带入；切换其他玩法时，只替换玩法，不覆盖这里填写的内容。<br>* “教学内容”是主要可编辑区域，展示“请填写”标识和示例placeholder。<br>* 教学内容区域必须可点击、可输入、可换行。<br>* 下方展示已套用玩法摘要：玩法名、玩法类型、适用年龄、课堂流程、可替换内容。<br>* “生成提示词预览”默认折叠，展开后展示真实 `templatePrompt`，提示“系统会自动带入，不需要手动修改”。<br>* 用户点击发送时，发送教学内容 + 已套用玩法块，后续走正常需求确认/生成流程。 |
| 当前demo：切换玩法 | **1-5 切换玩法保留用户内容**<br>* 若老师已经填写“教学内容”，再点击其他玩法卡片的“套用玩法”，必须保留教学内容。<br>* 只替换 `<已套用玩法>` 内的玩法名称、类型、适用年龄、流程、可替换内容、真实 `templatePrompt`。<br>* 已套用状态只显示在当前玩法卡片上。<br>* 不重复叠加多个玩法块，不把旧玩法残留在输入框中。 |
| 当前demo：画面风格入口 | **1-6 画面风格入口迁移**<br>* 首页不放“可叠加画面风格”。<br>* 在“互动课件设计方案确认”中的“画面和反馈”模块上方提供“调整画面风格”快捷选择，点击后把风格要求写入该模块文本。<br>* 在生成后的课件卡片按钮区提供“调整画面风格”。<br>* 生成后点击“调整画面风格”只允许最新版课件操作；旧版点击时提示“当前为旧版，请在最新版课件上调整画面风格”。<br>* 选择基础风格和增强质感后，点击“使用该风格重新生成”，会话中先出现用户消息“使用xx风格重新生成课件”，再出现AI消息“需求已明确，正在为您重新生成课件，请稍后。”，随后出现新的课件卡片。 |
| 当前demo：风格弹窗 | **2-2 视觉风格选择弹窗**<br>* 基础风格区展示15种基础风格，每个风格包含16:9参考图、用户展示名、用户侧描述。<br>* 增强质感区展示9个增强标签，可不选，也可多选。<br>* 基础风格和增强质感不是平铺同一层级：基础风格决定主画面方向，增强质感只做材质/笔触/立体感叠加。<br>* 用户侧不展示内部来源名和竞品名；内部来源只在数据文档中用于追溯。<br>* 风格参考图支持查看大图，便于老师判断画面感觉。 |
| 当前demo：异常态 | **3-1 异常与降级**<br>* 当前筛选无数据时，展示“当前分类下暂无匹配玩法，可以切换年龄段或点击其他分类看看。”<br>* 示例HTML加载失败时，弹层仍保留右侧说明和“套用这个玩法”，不阻断套用。<br>* 若某条玩法缺少 `templatePrompt`，允许临时使用 `promptSnippet` 兜底，但数据检查需记录缺失问题。<br>* 灵感推荐区加载失败不影响首页输入框和正常生成链路。 |

# 五、数据口径需求

## 5.1 数据文件

| 文件 | 路径 | 用途 |
| --- | --- | --- |
| 种子JSON | `/Users/jolin/Documents/互动课件AI Agent/outputs/灵感推荐区_研发可直接入库种子数据_v1.json` | 研发直接入库或转为前端静态数据 |
| 数据说明 | `/Users/jolin/Documents/互动课件AI Agent/outputs/灵感推荐区_研发可直接入库种子数据说明_v1.md` | 产品/研发/测试核对字段来源和展示口径 |
| 原始能力包 | `/Users/jolin/Desktop/creative-shrimp-suite-v1.0` | 内部追溯真实模板，不在用户侧展示 |

## 5.2 首页玩法数据口径

| 字段类型 | 字段 | 来源 | 用途 |
| --- | --- | --- | --- |
| 原始追溯字段 | `sourceRefs` | creative-shrimp-suite-v1.0 真实文件路径 | 研发追溯，不展示给用户 |
| 原始模板字段 | `templatePrompt` | `sourceRefs[0]` 对应markdown全文；同目录同名文件取最高 `_v数字` 版本 | 套用玩法后的真实生成提示词 |
| 半原始字段 | `title`、`ageText`、`typeLabel`、`subjectTags` | 索引、模板头部、文件名、正文 | 筛选和卡片展示 |
| 产品加工字段 | `category`、`shortDesc`、`cardTags`、`classFlow`、`replaceableContent`、`priority` | 产品基于真实模板整理 | 帮老师快速理解卡片 |

关键规则：真正喂给生成链路的玩法提示词必须使用 `templatePrompt`，不能用卡片短说明、标签或流程替代。`promptSnippet` 只作为兜底。

## 5.3 分类和数量

| 数据项 | 数量 | 当前口径 |
| --- | ---: | --- |
| 分类tab | 7 | 精选 + 6个真实分类 |
| 年龄段 | 4 | 低龄启蒙、1-2年级、3-4年级、5-6年级；前端额外提供“全部年龄” |
| 玩法卡片 | 41 | P0首页推荐池，不代表能力库总量 |
| 只读示例 | 4 | 4个真实HTML示例覆盖41条玩法 |
| 基础风格 | 15 | 用于确认卡和生成后风格重生成 |
| 增强质感 | 9 | 可叠加到基础风格上 |

当前分类分布：challenge 8条, chinese 6条, english 11条, math 5条, puzzle 8条, sort 3条。

## 5.4 精选逻辑

1. `featured` 不是真实内容分类，是首页默认推荐池。
2. 从41条玩法中按 `priority` 从高到低排序，取前16条进入精选池。
3. 首页每屏展示8条，点击“换一换”循环切换下一批。
4. 年龄筛选仍然生效：先取精选池，再按年龄段过滤。

## 5.5 玩法卡片入库表

| id | 玩法名 | 分类 | 学科 | 年龄 | 类型 | 卡片说明 | 标签 | 示例ID | 来源 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| wisdom-jump-pinyin | 智慧跳跃-拼音启蒙 | challenge | chinese | 6-10岁 | 跳跃闯关 | 跳到正确拼音平台，跳错会触发温和提示。 | 拼音、声母韵母、听辨 | None | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/templates-ready/action/01-jump-obstacle/egg-party/001_障碍跳跳跳_拼音启蒙_蛋仔风_6-10岁_v4.md |
| wisdom-jump-literacy | 智慧跳跃-识字闯关 | challenge | chinese | 6-10岁 | 跳跃闯关 | 根据读音或含义跳到正确汉字平台。 | 识字、汉字、词语 | None | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/templates-ready/action/01-jump-obstacle/egg-party/002_障碍跳跳跳_识字闯关_蛋仔风_6-10岁_v4.md |
| math-racing | 口算赛车 | challenge | math | 6-10岁 | 竞速玩法 | 答对题目让赛车前进，连续答对会加速。 | 口算、计算、复习 | animals_play_only | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/templates-ready/action/02-race-speed/egg-party/001_糖果赛车_口算加速_蛋仔风_6-10岁.md |
| word-racing | 单词赛跑 | english | english | 6-10岁 | 竞速玩法 | 边跑边选正确单词，答对加速冲向终点。 | 单词认读、颜色单词、动物单词 | fruit_garden_full | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/templates-ready/action/02-race-speed/egg-party/002_彩虹跑道_单词赛跑_蛋仔风_6-10岁.md |
| phonics-racing | 拼音竞速 | challenge | chinese | 6-10岁 | 竞速玩法 | 按顺序收集声母和韵母，组成目标音节。 | 拼音、音节、拼读 | fruit_read_aloud | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/templates-ready/action/02-race-speed/egg-party/003_甜甜圈滑道_拼音竞速_蛋仔风_6-10岁.md |
| phonics-hide-seek | 拼音捉迷藏 | challenge | chinese | 6-10岁 | 寻找玩法 | 听到读音后，在场景中找到对应拼音卡片。 | 拼音、字母识别、听辨 | fruit_read_aloud | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/templates-ready/action/03-hide-seek/egg-party/001_字母捉迷藏_拼音伪装者_蛋仔风_6-10岁.md |
| character-hide-seek | 汉字躲猫猫 | chinese | chinese | 6-10岁 | 寻找玩法 | 根据提示在场景里找出正确汉字或偏旁。 | 汉字、偏旁、识字 | None | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/templates-ready/action/03-hide-seek/egg-party/002_图形躲猫猫_汉字寻找_蛋仔风_6-10岁.md |
| word-hide-seek | 单词伪装者 | english | english | 6-10岁 | 寻找玩法 | 从场景物品里找到目标英文单词。 | 单词识别、拼写、主题词汇 | fruit_garden_full | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/templates-ready/action/03-hide-seek/egg-party/003_单词伪装者_英语捉迷藏_蛋仔风_6-10岁.md |
| quiz-survival | 知识生存岛 | challenge | general | 6-10岁 | 生存闯关 | 答对进入安全区，答错进入复习提示。 | 全科复习、课堂检测、抢答 | animals_play_only | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/templates-ready/action/05-survival-arena/egg-party/001_知识生存岛_综合版_蛋仔风_6-10岁.md |
| wrong-question-survival | 错题大逃杀 | challenge | general | 6-10岁 | 复习闯关 | 错题会反复出现，答对才能恢复能量。 | 错题复习、阶段复习、综合测验 | animals_play_only | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/templates-ready/action/05-survival-arena/egg-party/002_错题大逃杀_复习版_蛋仔风_6-10岁.md |
| math-detective | 数学小侦探 | math | math | 6-10岁 | 推理玩法 | 根据数字或条件线索推理正确答案。 | 逻辑推理、数学线索、条件判断 | animals_play_only | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/templates-ready/action/06-battle-reasoning/egg-party/001_数学小侦探_推理版_蛋仔风_6-10岁.md |
| idiom-battle | 成语大作战 | chinese | chinese | 6-10岁 | 对战玩法 | 根据含义或语境选出正确成语，完成对战。 | 成语、语文复习、词义理解 | None | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/templates-ready/action/06-battle-reasoning/egg-party/002_成语大作战_对战版_蛋仔风_6-10岁.md |
| character-puzzle-rush | 汉字拼图Rush | sort | chinese | 6-10岁 | 拼装玩法 | 把偏旁部件拼成正确汉字。 | 汉字结构、偏旁、识字 | None | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/templates-ready/action/07-puzzle-rush/egg-party/001_汉字拼图Rush_汉字结构_蛋仔风_6-10岁.md |
| word-assembly-rush | 单词拼装赛 | english | english | 6-10岁 | 拼装玩法 | 拖动字母或词块拼成目标单词。 | 单词拼写、自然拼读、字母组合 | animals_spelling | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/templates-ready/action/07-puzzle-rush/egg-party/002_单词拼装赛_单词拼装_蛋仔风_6-10岁.md |
| formula-rush | 算式急先锋 | math | math | 6-10岁 | 拼装玩法 | 把数字和符号拼成正确算式。 | 口算、算式、运算 | animals_play_only | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/templates-ready/action/07-puzzle-rush/egg-party/003_算式急先锋_数学运算_蛋仔风_6-10岁.md |
| pinyin-elimination | 拼音淘汰赛 | challenge | chinese | 6-10岁 | 淘汰玩法 | 多轮拼音选择，答对晋级下一轮。 | 拼音复习、听辨、综合练习 | None | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/templates-ready/action/08-elimination/egg-party/001_拼音淘汰赛_拼音综合_蛋仔风_6-10岁.md |
| word-elimination | 单词晋级赛 | english | english | 6-10岁 | 淘汰玩法 | 通过多轮单词识别和拼写挑战晋级。 | 单词复习、拼写、听音选词 | fruit_garden_full | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/templates-ready/action/08-elimination/egg-party/002_单词晋级赛_单词综合_蛋仔风_6-10岁.md |
| make-a-word | 字母组词 | english | english | 4-8岁 | 英语启蒙 | 拖动字母拼成目标单词，适合自然拼读。 | CVC单词、颜色单词、动物单词 | animals_spelling | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/10-INVENTORY/classroom/english/starfall/templates/make-a-word.md |
| word-picture-matching | 单词图片配对 | english | english | 3-8岁 | 英语启蒙 | 把英文单词和图片配对，成功后消除并朗读。 | 动物单词、颜色单词、食物单词 | fruit_garden_full | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/10-INVENTORY/classroom/english/starfall/templates/matching.md |
| picture-find | 图片找词 | english | english | 3-6岁 | 英语启蒙 | 听到或看到单词后，从图片中找到正确目标。 | 听音选图、单词认读、图片识别 | fruit_garden_full | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/10-INVENTORY/classroom/english/starfall/templates/picture-find.md |
| word-sort | 单词分类 | english | english | 6-10岁 | 英语启蒙 | 把单词拖到对应类别，适合主题词汇整理。 | 词汇分类、主题单词、语义归类 | fruit_garden_full | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/10-INVENTORY/classroom/english/starfall/templates/word-sort.md |
| flashcard-challenge | 单词闪卡挑战 | english | english | 6-9岁 | 英语启蒙 | 快速闪现单词或图片，学生完成听说认读。 | 闪卡、单词复习、课堂热身 | fruit_garden_full | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/templates-ready/english/flashcard-challenge.md |
| sentence-blocks | 句子积木 | english | english | 7-10岁 | 排序玩法 | 把单词块拖成正确英文句子。 | 句型、造句、语序 | None | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/templates-ready/english/sentence-blocks.md |
| dialog-connect | 对话连线 | english | english | 7-10岁 | 连线玩法 | 把问句和答句连起来，完成简单对话。 | 对话、句型、口语 | None | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/templates-ready/english/dialog-connect.md |
| listen-identify | 听音辨字 | chinese | chinese | 6-9岁 | 语文识字 | 听到读音后选择对应汉字或拼音。 | 拼音、识字、听辨 | fruit_read_aloud | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/10-INVENTORY/classroom/chinese/listen-identify-forest.md |
| character-split | 汉字拆解拼拼乐 | chinese | chinese | 7-9岁 | 语文识字 | 拆解汉字结构，拖拽或点击部件完成拼字。 | 汉字结构、偏旁、识字 | None | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/10-INVENTORY/classroom/chinese/003_汉字拆解.md |
| radical-match | 偏旁速配 | chinese | chinese | 6-9岁 | 语文识字 | 把偏旁和汉字快速配对，理解字形关系。 | 偏旁、汉字、识字 | None | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/10-INVENTORY/classroom/chinese/004_偏旁速配.md |
| poem-order | 古诗滑块排序 | sort | chinese | 7-10岁 | 排序玩法 | 把打乱的诗句拖回正确顺序，完成后朗读整首诗。 | 古诗、背诵、排序 | None | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/10-INVENTORY/classroom/chinese/poem-scroll.md |
| idiom-chain | 成语接龙 | chinese | chinese | 8-12岁 | 语文复习 | 根据上一个成语的尾字接出新成语。 | 成语、词汇积累、复习 | None | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/10-INVENTORY/classroom/chinese/002_成语接龙.md |
| decompose-10-friends | 10的分解好朋友 | math | math | 5-7岁 | 数感训练 | 帮数字找到能凑成10的好朋友。 | 10的分解、凑十法、数对记忆 | None | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/templates-ready/junior/math/decompose-10-friends.md |
| number-line-jump | 数轴跳跃 | math | math | 6-8岁 | 数感训练 | 在数轴上跳到正确位置，理解加减变化。 | 数轴、加减法、数感 | None | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/templates-ready/junior/math/number-line-jump.md |
| shape-detective | 形状规律侦探 | math | math | 6-8岁 | 逻辑益智 | 观察形状规律，找出下一项。 | 规律、图形、逻辑 | None | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/templates-ready/junior/logic/shape-detective.md |
| maze-basic | 基础迷宫探险 | puzzle | math、logic | 6-8岁 | 益智谜题 | 规划路线走出迷宫，适合路径和空间训练。 | 迷宫、路径规划、空间认知 | None | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/templates-ready/junior/logic/maze-basic.md |
| tangram | 七巧板拼图 | puzzle | math、logic | 6-8岁 | 图形拼搭 | 拖动七巧板拼出指定图形。 | 七巧板、图形、空间 | None | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/templates-ready/junior/shape/tangram-square.md |
| sudoku | 六宫格数独 | puzzle | math、logic | 8-12岁 | 益智谜题 | 观察已知数字，填入空格并自动校验。 | 数独、逻辑推理、规则应用 | animals_play_only | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/templates-ready/sudoku/6x6-game.md |
| nonogram | 数织 | puzzle | math、logic | 8-12岁 | 益智谜题 | 根据行列数字线索涂格，逐步显现图案。 | 数织、逻辑、图形 | None | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/templates-ready/nonogram/10x10-game.md |
| masyu | 珍珠连线 | puzzle | math、logic | 8-12岁 | 益智谜题 | 根据黑白珍珠规则画出闭合路线。 | 连线、推理、规则 | None | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/templates-ready/masyu/6x6-game.md |
| euler-path | 一笔画 | puzzle | math、logic | 6-10岁 | 益智谜题 | 一笔连接所有线段，训练路径规划。 | 一笔画、路径、空间 | None | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/templates-ready/euler-path/game.md |
| sliding-puzzle | 滑块拼图 | sort | logic | 7-12岁 | 排序拼图 | 移动拼图块还原图片或顺序。 | 拼图、排序、空间 | None | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/templates-ready/sliding-puzzle/game.md |
| sokoban | 推箱子闯关 | puzzle | logic | 8-12岁 | 益智谜题 | 推动元素到目标位置，适合路径规划和分类任务。 | 空间路径、分类任务、步骤规划 | None | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/templates-ready/sokoban/game.md |
| minesweeper-reasoning | 扫雷式推理 | puzzle | math、logic | 9-12岁 | 益智谜题 | 根据数字线索推断安全区域，训练逻辑判断。 | 逻辑推理、科学线索、条件判断 | animals_play_only | creative-shrimp-suite-v1.0/workspace/GAME-VAULT/10-INVENTORY/classroom/math/puzzle/扫雷/022_扫雷_智能批量复刻.md |

## 5.6 只读示例入库表

| id | 示例名 | HTML路径 | 说明 | 只读 |
| --- | --- | --- | --- | --- |
| fruit_garden_full | 英语图文互动示例 | src/assets/courseware/fruit_garden_adventure.html | 你可以先看它怎么把单词、图片、发音和小游戏串成一节课。套用后，会换成你填写的词库、图片和主题内容。 | True |
| fruit_read_aloud | 听音跟读互动示例 | src/assets/courseware/fruit_garden_read_aloud_only.html | 你可以先看学生怎么听一遍、跟着读，再获得星星和鼓励反馈。套用后，会换成你填写的单词、拼音或朗读内容。 | True |
| animals_spelling | 单词拼写互动示例 | src/assets/courseware/animals_adventure.html | 你可以先看学生怎么选字母、拼单词、得到即时反馈。套用后，会换成你自己的词库和题目。 | True |
| animals_play_only | 闯关答题节奏示例 | src/assets/courseware/animals_play_only.html | 你可以先看题目怎么一轮轮推进、答对答错怎么反馈。套用后，会换成你自己的数学、语文或逻辑题目。 | True |

## 5.7 视觉风格入库表

| id | 用户展示名 | 类型 | 用户侧描述 | 适合内容 | 内部来源 |
| --- | --- | --- | --- | --- | --- |
| clear-logic | 清晰逻辑风 | 基础风格 | 彩色但不刺眼，网格清晰，适合长时间专注解题。 | 数学逻辑、数独、推理 | 儿童逻辑风 |
| ocean-explore | 海洋探索风 | 基础风格 | 浅蓝水波、气泡和海洋元素，适合探索类内容。 | 海洋主题、自然认知、低龄英语 | 蓝色海底世界/豆包海底风 |
| orchard-cognition | 果园认知风 | 基础风格 | 温暖明亮的果园场景，适合认知、分类和采摘反馈。 | 识字、水果单词、数数练习 | 清新秋日橘子树 |
| forest-adventure | 森林冒险风 | 基础风格 | 自然治愈的森林场景，适合寻找、路径和闯关。 | 拼音、动物认知、迷宫 | 豆包森林风 |
| candy-childlike | 糖果童趣风 | 基础风格 | 马卡龙糖果色、Q弹按钮，适合低龄启蒙。 | 颜色形状、低龄英语、配对 | 豆包糖果风 |
| space-challenge | 太空闯关风 | 基础风格 | 星球、火箭和深空配色，适合挑战和探索。 | 科学认知、口算闯关、知识竞赛 | 豆包太空风 |
| blocks-building | 积木搭建风 | 基础风格 | 几何模块、积木质感，适合图形拼搭和STEM。 | 图形拼搭、空间规划、分类 | 豆包积木风 |
| english-card | 英语启蒙卡片风 | 基础风格 | 顶部标题角色、中央互动区和底部操作区，适合英语启蒙。 | 单词配对、字母组词、自然拼读 | Starfall教育风 |
| cartoon-literacy | 幼儿识字卡通风 | 基础风格 | 拟人角色、生活场景和大按钮，适合低龄识字。 | 汉字、拼音、生活认知 | 宝宝巴士汉字风 |
| soft-racing | 软萌闯关风 | 基础风格 | 圆润角色、糖果色竞技场，适合6-10岁轻竞技。 | 口算赛车、拼音淘汰赛、知识生存岛 | 蛋仔萌趣风 |
| light-arena | 轻竞技闯关风 | 基础风格 | 科技流畅、星空配色，适合较高年级挑战。 | 公式竞速、推理对战、综合竞赛 | 元梦竞技风 |
| misty-storybook | 奶雾绘本风 | 基础风格 | 奶雾莫兰迪色和温柔绘本质感，适合安静阅读。 | 古诗、故事、自然科普 | 奶雾童话风 |
| low-poly-soft | 低多边形童趣风 | 基础风格 | 圆角几何、低多边形造型，适合认知和益智。 | 图形认知、规律观察、低龄数学 | 低多边形童趣风 |
| flat-early | 极简扁平童趣风 | 基础风格 | 纯平色块、全圆角、信息清晰，适合早教认知。 | 颜色形状、数数、基础认知 | 极简扁平童趣风 |
| fairy-3d | 3D童话立体风 | 基础风格 | 软建模、立体童话场景，适合展示型互动。 | 故事场景、角色互动、探索任务 | +fairy3d |
| clay | 粘土质感 | 增强质感 | 圆润膨胀、哑光柔和，像手工捏制的粘土。 |  | 增强标签 |
| jelly | 果冻软糖质感 | 增强质感 | Q弹半透明、柔和高光，像软糖一样轻盈。 |  | 增强标签 |
| storybook | 童话绘本质感 | 增强质感 | 柔和手绘线条、纸张肌理和治愈暖调。 |  | 增强标签 |
| felt | 毛毡布艺质感 | 增强质感 | 毛绒边缘、拼贴层次和手工缝制感。 |  | 增强标签 |
| watercolor | 水彩绘本质感 | 增强质感 | 淡彩晕染、水痕边缘和自然渐变。 |  | 增强标签 |
| thickpaint | 厚涂奶油质感 | 增强质感 | 油画棒笔触、奶油色块和温暖厚涂感。 |  | 增强标签 |
| matte | 磨砂哑光质感 | 增强质感 | 低反光、细颗粒、高级耐看。 |  | 增强标签 |
| paper | 纸艺层叠质感 | 增强质感 | 剪纸层叠、轻立体和柔和投影。 |  | 增强标签 |
| fairy3d | 3D童话立体质感 | 增强质感 | 软建模、立体童话场景和柔和光影。 |  | 增强标签 |

# 六、待确认问题/本期不做范围

| 项目 | 结论 |
| --- | --- |
| 是否首页保留画面风格模块 | 不保留，避免玩法和风格逻辑混在一起 |
| 是否每条玩法都制作独立HTML示例 | 本期不做，先用4个代表性示例覆盖，后续按使用数据补齐 |
| 是否做学科/年级更细筛选 | 本期使用7个tab+4个年龄段；更细筛选等数据进一步沉淀后再做 |
| 是否暴露创意虾或内部来源 | 不暴露，只在研发文档中追溯 |
| 是否做复杂推荐算法 | 不做，使用priority排序、分类过滤、年龄过滤和换一换 |
| 是否允许老师编辑真实模板prompt | 不直接编辑；只折叠预览，老师主要填写教学内容 |
