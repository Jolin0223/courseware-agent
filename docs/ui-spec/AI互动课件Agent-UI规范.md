# AI互动课件 Agent UI 规范

版本：2026-07-10  
适用：产品 Demo、开发一比一还原、后续 AI Agent 修改页面

## 0. 这份规范怎么用

这不是品牌视觉手册，而是当前 Web Demo 的还原规范。开发或 AI Agent 修改页面前，必须先读本文件，再对照两张 SVG：

- [默认绿色 UI 规范图](./ui-spec-green.svg)
- [蓝青橙 UI 规范图](./ui-spec-iteach.svg)

当前 Demo 的真实前端工程位置：

`Obsidian Vault/02-产品demo源代码/aigc-material-demo`

关键源码参考：

| 模块 | 文件 |
| --- | --- |
| 全局主题 token | `src/index.css`, `src/theme.ts` |
| 首页/会话主页面 | `src/pages/GeneratorPage.tsx` |
| 输入框 | `src/components/Generator/ChatInput.tsx` |
| 首页灵感推荐区 | `src/components/Generator/InspirationSection.tsx` |
| 课件结果卡片 | `src/components/Generator/CoursewareCard.tsx` |
| 右侧预览区 | `src/components/Generator/PreviewPanel.tsx` |
| 侧边栏 | `src/components/Layout/Sidebar.tsx` |
| 我的作品 | `src/pages/LibraryPage.tsx` |
| 资源库筛选项 | `src/components/Library/FilterBar.tsx` |
| 发布/替换弹窗 | `src/components/Library/PublishModal.tsx` |

## 1. 产品 UI 定位

这个产品不是营销官网，也不是儿童课件本体。它是教师使用的 Web 端生产工具 Demo。

所以页面要保持：

- 工作台气质：克制、清楚、可扫读，不做大面积炫技装饰。
- 演示可讲：重点行为入口要能被看见，例如输入、灵感推荐、一键同款、发布、预览。
- 状态稳定：hover、点击、选中、禁用必须准确，不允许残留黑边或“曾经点过就像选中”。
- 布局对齐：1920x1080 和 13/14 寸电脑都要成立，不能只在当前窗口看着顺眼。

## 2. 主题系统

### 2.1 当前主题事实

工程里存在多套演示主题。当前用户重点维护两套：

| 主题 | 用途 | 说明 |
| --- | --- | --- |
| 默认绿色 `green` | 早期 Demo/清新智能感 | 青绿主色，蓝色辅助，整体更轻快 |
| 蓝青橙 `iteach` | 平台化主推演示 | 蓝青承接工作台和智能感，橙色只强调高意图动作 |

注意：`src/theme.ts` 里当前 `DEFAULT_THEME_ID` 是 `iteach`。如果后续产品口径说“默认绿色”，需要同时确认产品默认展示主题和 Demo 默认加载主题，不能只改文档。

### 2.2 默认绿色 token

| Token | 值 | 用途 |
| --- | --- | --- |
| `--agent-primary` | `#00C9A7` | 主按钮、主图标、强调线 |
| `--agent-secondary` | `#00A8E8` | 渐变终点、科技辅助 |
| `--agent-accent` | `#22C55E` | 成功/生成辅助 |
| `--agent-primary-text` | `#047857` | 绿色主题文字 |
| `--agent-secondary-text` | `#075985` | 蓝色辅助文字 |
| `--agent-soft` | `#F0FDF9` | 浅主题底 |
| `--agent-soft-strong` | `#CCFBF1` | 选中浅底/重点浅底 |
| `--agent-border` | `#A7F3D0` | 主题边框 |
| `--agent-sidebar` | `#DFF6FF` | 侧边栏底色 |
| `--agent-page-bg` | `#F8FAFE` | 页面背景 |
| `--agent-gradient` | `linear-gradient(135deg, #00C9A7, #00A8E8)` | HTML 图标/主视觉 |
| `--agent-action-gradient` | `linear-gradient(135deg, #00C9A7, #22C55E)` | 生成、套用等动作 |

### 2.3 蓝青橙 token

| Token | 值 | 用途 |
| --- | --- | --- |
| `--agent-primary` | `#0274FC` | 平台主色、导航/选择、HTML 图标起点 |
| `--agent-secondary` | `#35DDE7` | 智能感辅助、HTML 图标终点 |
| `--agent-accent` | `#FF8A00` | 高意图动作 |
| `--agent-primary-text` | `#0759C9` | 蓝色主题文字 |
| `--agent-secondary-text` | `#047C89` | 青色辅助文字 |
| `--agent-soft` | `#F0FBFF` | 浅主题底 |
| `--agent-soft-strong` | `#DFF9FF` | 选中浅底/重点浅底 |
| `--agent-border` | `#BFE9F5` | 主题边框 |
| `--agent-sidebar` | `#EAF8FF` | 侧边栏底色 |
| `--agent-page-bg` | `#F6FBFF` | 页面背景 |
| `--agent-gradient` | `linear-gradient(135deg, #0274FC, #35DDE7)` | HTML 图标/品牌渐变 |
| `--agent-action-gradient` | `linear-gradient(135deg, #FF8A00, #FFB347)` | 生成、发布、套用等高意图动作 |

### 2.4 颜色使用边界

| 元素 | 颜色规则 |
| --- | --- |
| `HTML` 类型标识 | 永远使用 `--agent-gradient`。蓝青橙主题下就是蓝青渐变，不用橙色。 |
| `已发布` | 蓝色状态，表达资源状态，不用橙色。 |
| `未发布` | 低饱和提示色，可用灰/轻橙文案，但不要做成强动作按钮。 |
| 生成/发送/套用 | 使用 `--agent-action-gradient` 或对应 action token。 |
| 发布/替换弹窗主按钮 | 当前真实 Demo 使用 `--agent-gradient`，也就是主题主渐变；蓝青橙主题下仍是蓝青渐变，不是橙色。 |
| 筛选项选中 | 使用浅主题底 + 主题文字，不用实心主色块。 |
| 警告/替换说明 | 黄色/橙色提示底，仅用于风险说明，不作为主色大面积出现。 |

## 3. 字体与文本层级

字体栈：

```css
-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
"Hiragino Sans GB", "Microsoft YaHei", sans-serif
```

| 场景 | 真实/推荐规格 | 说明 |
| --- | --- | --- |
| 首页 H1 | 34px / 约 44px，700 | 当前为 34px、700，不要做成营销大标题 |
| 我的作品 H1 | 28px，700 | 页面标题 |
| 灵感推荐区标题 | 18px，900 | 需要有模块识别度 |
| 课件卡片标题 | 16px，760 | 单行省略 |
| 普通正文 | 14-15px，line-height 1.5 | 表单、说明、聊天正文 |
| 筛选项/按钮 | 12-14px，600-950 | 高频小控件，字重偏重 |
| 元信息 | 11-12px，500-700 | 时间、版本、辅助说明 |

禁止：

- 用 `vw` 字号解决宽屏问题。
- 在紧凑按钮内用 16px 以上字号。
- 让按钮文字因字号过大换行。

## 4. 全局布局

### 4.1 侧边栏

真实值：

| 状态 | 宽度 |
| --- | --- |
| 展开 | 280px |
| 收起 | 64px |

侧边栏样式：

- `position: fixed`
- `height: 100vh`
- `background: var(--agent-sidebar)`
- `border-right: 1px solid #E2E8F0`，蓝青橙主题下可变为 `#CFEAF7`
- 展开时 logo 区高度 64px，左右 padding 16px
- 导航区 padding `8px 12px`，gap 8px

侧边栏文案：

| 位置 | 文案 |
| --- | --- |
| 浏览器页签 | `互动课件 AI Agent 产品演示DEMO` |
| 侧边栏 Logo | `互动课件 AI Agent` |
| 底部配色入口 | `演示配色` |

不要把页签文案完整塞进侧边栏 Logo，侧边栏会过长。

### 4.2 首页布局

真实结构：

- 主内容在侧边栏右侧。
- 首页欢迎区 `padding: 36px 24px 48px`。
- 首页输入区和灵感推荐区最大宽度都是 1080px。
- 输入区上方标题居中。
- 灵感推荐区位于输入区下方，和输入区等宽对齐。

### 4.3 会话布局

真实结构：

| 状态 | 内容列 |
| --- | --- |
| 无右侧预览 | `--chat-content-max: 864px` |
| 有右侧预览 | `--chat-content-max: 720px` |

主会话区：

- chat area 默认 padding：`28px 56px 24px`
- 有预览时 padding：`28px 48px 24px 64px`
- 输入区默认 padding：`16px 56px 24px`
- 有预览时输入区 padding：`16px 48px 24px 64px`
- 右侧预览开启时，左右分屏比例默认 52% / 48%，拖拽范围 44%-64%。
- 分割线宽 6px，默认 `#E2E8F0`，hover `#CBD5E1`，拖动中 `--agent-primary`。

设计判断：

- HTML 课件结果卡片不要再单独设置 720px 最大宽；它应该跟随会话内容列。
- 1920x1080 下如果右侧预览关闭，会话列仍保持 864px，避免内容被拉得太宽。
- 有右侧预览时，聊天列 720px 是合理上限，右侧承担预览空间。

### 4.4 我的作品布局

真实值：

- 页面容器：`max-width: 1400px`
- padding：`32px 40px`
- 标题区 margin-bottom：24px
- tabs 与搜索行 gap：16px，margin-bottom 24px
- 卡片网格：`repeat(auto-fill, minmax(280px, 1fr))`，gap 20px

## 5. 圆角与阴影

这是当前 Demo 的真实圆角系统，不要随意发散。

| 类型 | 圆角 |
| --- | --- |
| 小输入/小关闭按钮 | 6-8px |
| 图标按钮 | 8-10px |
| 筛选项、导航、常规按钮 | 10px |
| 普通卡片、弹窗内部块 | 10-12px |
| 首页输入框、灵感推荐区外壳 | 16px |
| 胶囊标签 | 999px，仅用于状态 pill、小标签、计数徽标，不用于普通按钮或卡片 |

阴影：

| 类型 | 阴影 |
| --- | --- |
| 普通卡片默认 | `0 1px 2px rgba(15,23,42,0.03)` |
| 普通卡片 hover | `0 10px 26px var(--agent-shadow)` |
| 灵感推荐外壳 | `0 14px 36px var(--agent-shadow), inset 0 1px 0 rgba(255,255,255,0.9)` |
| 课件结果卡片 | `0 8px 24px rgba(37,74,120,0.08)` |
| 弹窗 | `0 24px 80px rgba(15,23,42,0.22)` |
| 下拉浮层 | `0 12px 28px rgba(15,23,42,0.14)` |

## 6. 可点击状态统一规范

### 6.1 筛选项范本

首页灵感推荐区和资源库筛选项是平台范本。

真实默认态：

```css
height: 32px;
padding: 0 12px;
border-radius: 10px;
border: 1px solid #CBD5E1;
background: #F8FAFC;
color: #475569;
font-size: 13px;
font-weight: 850;
```

真实 hover 态：

```css
background: #F6FCFF;
border-color: #BFE9F5;
color: var(--agent-primary-text);
box-shadow: 0 4px 10px rgba(14,165,233,0.08);
```

真实选中态：

```css
background: #F1FAFF;
border-color: #BFE9F5;
color: var(--agent-primary-text);
font-weight: 700;
box-shadow: none;
```

### 6.2 状态残留规则

必须满足：

- `hover` 只由当前鼠标位置控制。
- `selected` 只由业务状态控制。
- `focus-visible` 只给键盘用户，不给鼠标点击残留。
- 鼠标点过、hover 过、切走后，未选中项必须回到默认态。

禁止：

- 黑色/深灰描边残留。
- `:focus` 直接加描边。
- 用 `transform: translateY(-1px)` 导致按钮被父容器裁切。

## 7. 首页输入区

真实结构：

- 外层最大宽：1080px。
- 输入容器：
  - `background: #FFFFFF`
  - `border-radius: 16px`
  - `border: 1px solid #E2E8F0`
  - `box-shadow: 0 2px 8px rgba(0,0,0,0.06)`
  - `padding: 18px 24px`
  - `min-width: 320px`
- textarea：
  - `font-size: 15px`
  - `line-height: 1.5`
  - `border: none`
  - `background: transparent`
  - `resize: none`
- 左侧工具按钮：
  - 图片、附件、关联课件按钮都是 32 x 32。
  - radius 8px。
  - 默认无背景、无边框，图标色 `#64748B`。
  - hover 只允许浅底和图标变主题色，不做实心按钮。
- 右侧发送/停止按钮：
  - 36 x 36
  - radius 10px
  - 无边框
  - 有 `var(--agent-shadow)` 阴影
  - 可发送/停止时背景为 `var(--agent-hero-gradient)`，不可发送时背景为 `#CBD5E1`。

首页示例 placeholder：

- 每条高度 24px。
- 每 2 秒正向循环。
- 第 3 条之后回到第 1 条，不能反向滚回。

顶部说明文案：

`输入你的课件需求，或先从灵感推荐区套用一个课堂互动模板，或跟灵感助手聊聊看。`

## 8. 灵感推荐区

真实外壳：

```css
max-width: 1080px;
padding: 16px;
border-radius: 16px;
background: var(--agent-panel-gradient);
border: 1px solid var(--agent-border);
box-shadow: 0 14px 36px var(--agent-shadow), inset 0 1px 0 rgba(255,255,255,0.9);
```

结构：

- 标题区：左侧标题 `18px / 900`，右侧 hint `13px`。
- 一级筛选：32px 高，gap 8px。
- 二级筛选：28px 高，外层浅白底，padding 4px。
- 卡片网格：4 列，gap 12px。
- 卡片：
  - min-height 244px
  - radius 14px
  - border `1px solid var(--agent-border)`
  - white background
  - shadow `0 10px 24px rgba(37,74,120,0.07)`
  - 封面 16:9，min-height 104px
  - body padding 12px
- 卡片标题：16px，900，单行省略。
- 描述：12px，line-height 1.4，最多 2 行。
- “套用”按钮：30px 高，radius 10px，使用 `--agent-action-gradient`。

## 9. 会话消息与课件结果卡片

### 9.1 用户消息

真实值：

- 背景：`#EAF6FF`
- 文字：`#0F2F57`
- padding：`12px 16px`
- radius：10px
- border：`1px solid #CFEAF7`
- shadow：`0 6px 18px rgba(37,74,120,0.06)`
- font：15px，line-height 1.5

### 9.2 助手普通消息

- 背景：白色
- border：`1px solid #E2E8F0`
- padding：`12px 16px`
- radius：10px
- font：15px，line-height 1.5

### 9.3 课件结果卡片

真实外层：

```css
width: 100%;
max-width: 100%;
border-radius: 10px;
border: 1px solid #E2E8F0;
box-shadow: 0 8px 24px rgba(37,74,120,0.08);
background: #FFFFFF;
overflow: visible;
```

头部：

- background：`var(--agent-courseware-header)`
- padding：`20px 24px`
- gap：14px
- radius：`10px 10px 0 0`
- 点击头部/卡片应打开右侧预览。

HTML 图标：

- 44 x 44
- radius：10px
- background：`var(--agent-gradient)`
- icon：FileCode2 21px
- “HTML” 小字 8px / 900
- shadow：`0 10px 22px var(--agent-shadow), inset 0 1px 0 rgba(255,255,255,0.28)`

标题与 meta：

- 标题 16px / 760，单行省略。
- meta 12px，gap 6px，小圆点分隔。
- meta 固定从左到右显示：`刚刚生成`、分隔小圆点、CheckCircle2 11px、`已发布`。
- `已发布` 在 meta 内显示，不是独立 pill；文字用 `var(--agent-primary-text)`，前面必须有对钩。
- `第 N 版` 在右侧显示，12px / 650，颜色 `#64748B`，不要做成重徽章。

底部操作区：

- padding：`14px 20px`
- background：`#FAFBFC`
- radius：`0 0 10px 10px`
- 按钮横排，gap 6px。
- 按钮最小高度约 34px。
- hover 只改边框/文字/背景，不上移，避免被容器裁切。
- 禁用按钮保留 tooltip。

操作优先级：

1. 一键同款
2. 编辑资源
3. 调整风格
4. 预览报告

预览报告低频，但保留在同一操作组内，不单独放到右侧造成割裂。

## 10. 右侧预览区

右侧预览是会话结果的直接反馈区，不是独立新页面。

必须满足：

- 点击课件卡片能打开预览，不出现空白。
- 撤回未发布结果后，仍留在当前会话页，不自动收起右侧预览。
- 预览关闭后，聊天内容列回到 864px 上限。
- 分割线可拖拽，但拖拽范围控制在 44%-64%。

## 11. 我的作品与资源库筛选

### 11.1 页面结构

- 页面 max-width：1400px。
- padding：32px 40px。
- 标题：28px / 700。
- 副标题：14px。
- 顶部 tab：34px 高，min-width 88px，radius 10px。
- 搜索框：300 x 38，radius 8px。

### 11.2 我的作品 tab

真实默认：

```css
height: 34px;
min-width: 88px;
padding: 0 16px;
border-radius: 10px;
border: 1px solid #CBD5E1;
background: #F8FAFC;
color: #475569;
font-size: 14px;
font-weight: 700;
```

hover/active 对齐筛选项三态。

### 11.3 作品卡片

- 网格：`repeat(auto-fill, minmax(280px, 1fr))`
- gap：20px
- 卡片 radius：10px
- 默认 border：`#E2E8F0`
- hover border：`var(--agent-border)`
- hover shadow：`0 10px 26px var(--agent-shadow)`
- hover transform：`translateY(-1px)`，仅作品网格卡可用；紧凑按钮不要用上移。
- 封面：16:9 iframe 缩放预览。
- 状态标签：左上角 26px 高，radius 10px，白底轻阴影。

## 12. 发布/替换弹窗

弹窗真实结构：

- 遮罩：`rgba(15,23,42,0.38)`
- 弹窗 max-width：1040px
- max-height：92vh
- radius：12px
- shadow：`0 24px 80px rgba(15,23,42,0.22)`
- header padding：`18px 22px 12px`
- content padding：`8px 22px 20px`

表单：

- label：14px / 600。
- field margin-bottom：18px。
- 普通 input wrap：radius 6px，border `#E2E8F0`。
- 下拉选择：height 42px，radius 8px。
- 发布范围卡片：min-height 68px，radius 10px，padding `12px 14px`。
- 标签选择器：min-height 40px，radius 8px。
- 已选标签：line-height 22px，radius 8px。
- footer：padding `14px 22px 18px`，右对齐，gap 12px。
- footer 按钮：height 38px，padding `0 18px`，radius 10px，font-size 14px，font-weight 700。
- 取消按钮：白底灰字，border `#E2E8F0`。
- 主按钮：background `var(--agent-gradient)`，白字；蓝青橙主题下也是蓝青渐变，不是橙色。

发布弹窗里的按钮/选项状态必须复用第 6 章，不允许另起一套。

## 13. 侧边栏详细规范

### 13.1 Logo 区

- logo icon：28px。
- 文案：17px / 600。
- 收起/展开按钮：30 x 30，radius 10px。
- hover：白色半透明底 + 轻阴影。
- 收起态展开按钮完整显示，不只露一半。

### 13.2 主导航

新建任务：

- 高度由 padding `10px 14px` 决定。
- radius 10px。
- background `var(--agent-hero-gradient)`。
- 字号 14px / 600。

我的作品：

- active：白底、主题文字、轻阴影。
- hover 非 active：`rgba(255,255,255,0.5)`。

### 13.3 历史会话

- “置顶任务”和“历史会话”必须都有图标。
- 从“我的作品”页点击左侧历史会话，应回到会话页并打开对应会话。
- 历史列表多时必须可滚动，底部工具不能遮挡最后一条会话。

### 13.4 底部演示配色

真实入口：

- height 30px
- radius 10px
- background transparent
- color `#8A9AAF`
- font-size 12px
- font-weight 600
- hover 仅浅白底和文字加深

展开面板：

- 宽 188px
- padding 8px
- radius 12px
- border `1px solid var(--agent-border)`
- white background
- shadow `0 16px 32px rgba(37,74,120,0.14)`
- 选择主题后自动收起。

隐藏模式按钮：

- 默认不可见。
- 只有底部指定区域连续点击 3 次以上才显示。
- 功能保留，不作为公开入口。

## 14. 输入、下拉、tooltip、toast

### 输入

- 小输入框用 6-8px 圆角。
- 大输入容器用 16px 圆角。
- focus 不出现黑边，使用主题边框/轻阴影。

### 下拉

- 自绘，不用原生 `<select>`。
- radius 10px。
- border `#D8E5EF` 或 `#E2E8F0`。
- shadow `0 12px 28-30px rgba(15,23,42,0.14)`。

### Tooltip

- 禁用功能的 tooltip 必须保留。
- 样式：深色底 `#1E293B`，白字，radius 10px，padding `6px 10px`，font-size 11px。
- 不使用原生 title tooltip 作为正式交互。

### Toast

- 轻提示，不阻塞。
- 不用浏览器原生 `alert/confirm/prompt` 做正式 Demo 交互。当前个别删除 confirm 如果后续产品化要替换成自绘确认框。

## 15. 适配检查清单

### 1920x1080

必须检查：

- 首页输入区和灵感推荐区都为 1080px 宽，并居中。
- 侧边栏 280px 后，主内容视觉居中，不左窄右宽。
- 会话无预览时内容列 864px，不被拉满。
- 会话有预览时聊天列 720px，右侧预览不挤压。
- HTML 课件卡片跟随会话列对齐。

### 13/14 寸电脑

必须检查：

- 侧边栏展开后主内容不横向溢出。
- 筛选项可横向滚动或换行，但按钮高度/状态不变。
- 灵感卡片列数可减少，但卡片内部按钮不挤压。
- 发布弹窗高度不超出视口，内容区可滚动。

## 16. AI Agent 修改页面时的硬约束

1. 任何新增按钮、筛选项、选择卡片，默认/hover/选中必须对齐第 6 章。
2. 不要新增黑色描边状态。
3. 不要让 hover 后状态残留。
4. 不要给紧凑按钮添加上移 transform。
5. 不要把课件卡片单独限制成固定最大宽；跟随会话内容列。
6. 不要把 `已发布` 改成橙色。
7. 不要把 `第 N 版` 做成强标签。
8. 不要把右侧预览按钮挪成独立右侧孤岛。
9. 不要把页签标题和侧边栏 Logo 文案混用。
10. 不要删除禁用态 tooltip。
11. 不要用浏览器原生控件替代当前自绘控件。
12. 修改后至少检查首页、会话页、我的作品页、发布弹窗四个场景。

## 17. 历史课件 HTML 影响判断

本规范主要约束平台外壳 UI，不直接改变已生成课件 HTML。

如果后续改动涉及：

- 课件预览 iframe 容器
- 课件 HTML 注入方式
- 课件卡片点击打开预览
- 历史会话加载课件版本
- 学情数据回收报告入口

必须额外判断是否影响历史课件运行。默认策略是不批量改旧 HTML，只保证外壳能正确打开、预览和管理旧资源。
