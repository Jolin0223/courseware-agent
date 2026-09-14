import prompts from './prompts.json';

export const WUKONG_ID = 'conv_wukong_video_h5';
export const ROOT = '/wukong/';
export const asset = (path: string) => ROOT + path;
export const initialRequest = '用我提供的PPT图片，做一个小学一、二年级的情境化识字课件。跟着孙悟空闯关，先用视频引入故事，再搬开石头发现汉字，认识雨字头，描写雨、雪，完成两道互动练习。视频、人物和互动要自然衔接。先把第一关做好。';
export type SceneKind = 'video' | 'mixed' | 'h5';
export const kindLabels = { video: '纯视频', mixed: '视频 + H5', h5: 'H5 互动' };
export interface Scene {
  id: string; chapter: number; title: string; kind: SceneKind; phase: string;
  purpose: string; action: string; next: string; source: string; thumb: string;
  video?: string; seconds?: number; speaker?: string; dialogue?: string; prompt?: keyof typeof prompts;
  layers: string[];
}
export const chapters = [
  { title: '故事启程', goal: '明白为什么要闯汉字关', source: '第 5—6 页' },
  { title: '搬石找字', goal: '在自己的操作中发现“雨”', source: '第 7—9 页' },
  { title: '认识雨字头', goal: '联系字形与天气现象', source: '第 10 页' },
  { title: '描写与闯关', goal: '观察字形，应用偏旁线索', source: '第 11—12 页' },
  { title: '线索与回顾', goal: '回应学习成果，承接下一关', source: '第 13 页 + 本关回顾' },
];
export const scenes: Scene[] = [
  { id:'cover',chapter:0,title:'和悟空一起出发',kind:'h5',phase:'cover',purpose:'建立西游识字主题与开始动机。',action:'点击开始，在同一入口启动声音。',next:'点击开始 → 火焰山故事',source:'本关新增封面',thumb:'assets/images/v10/cover.png',layers:['封面美术','独立悟空','开始按钮','入场音效'] },
  { id:'opening',chapter:0,title:'火焰山挡住去路',kind:'video',phase:'intro',purpose:'火焰山受阻 → 想借扇 → 需要闯汉字关。',action:'观看连续故事，可暂停或跳过。',next:'播放结束 → 任务邀请',source:'第 5—6 页',thumb:'assets/video/v33/opening-poster.jpg',video:'assets/video/v33/opening.mp4',seconds:15,speaker:'教学旁白',dialogue:'孙悟空到火焰山脚下，发愁过不去。他想借铁扇公主的芭蕉扇，却遭刁难。只有闯过汉字关，才能找到真的芭蕉扇。',prompt:'opening',layers:['连续15秒画面','原教学旁白','独立字幕'] },
  { id:'mission',chapter:0,title:'悟空发出闯关邀请',kind:'mixed',phase:'mission',purpose:'将故事目标转成“认字、写字、闯关”三个学习任务。',action:'悟空说完后定格；任务卡可点击听解释，学生点击出发。',next:'点击出发 → 腾云到洞口',source:'第 5—12 页教学任务提炼',thumb:'assets/video/v31/M02-poster.jpg',video:'assets/video/v31/M02.mp4',seconds:6,speaker:'孙悟空 · 原配音',dialogue:'小伙伴，和我一起搬石识字、写字闯关吧！',prompt:'mission',layers:['人物说话视频','原悟空配音','三张任务卡','出发按钮'] },
  { id:'arrival',chapter:0,title:'腾云来到洞口',kind:'video',phase:'arrival',purpose:'把刚刚接受的任务自然带入洞口场景。',action:'观看出发、到达、发现发光石头。',next:'播放结束 → 搬石邀请',source:'第 7—8 页，补充出发转场',thumb:'assets/video/v19/flight-poster.jpg',video:'assets/video/v19/flight-arrival.mp4',seconds:17.78,speaker:'孙悟空 · 原配音',dialogue:'终于找到洞口了！可入口又被石头挡住了。咦，这块石头在发光！里面藏着什么秘密呢？',prompt:'flight',layers:['出发与到达视频','原配音','独立字幕'] },
  { id:'move',chapter:1,title:'邀请搬石，等待行动',kind:'mixed',phase:'cave',purpose:'让孩子通过真实操作打开学习线索。',action:'先听悟空邀请，再把发光石头拖到左侧落点；支持点击帮搬。',next:'石头进入落点 → 揭晓雨字',source:'第 7—8 页',thumb:'assets/video/v31/C05-poster.jpg',video:'assets/video/v31/C05.mp4',seconds:6,speaker:'孙悟空 · 原配音',dialogue:'小伙伴，帮我把发光的石头，向左搬开吧！',prompt:'move',layers:['6秒人物邀请','洞口背景视频 / 定格','独立石头','落点与重试反馈'] },
  { id:'discover',chapter:1,title:'石头后面的雨字',kind:'h5',phase:'discover',purpose:'操作结果成为识字内容，保持洞口画面的连续性。',action:'点击刚揭晓的“雨”字，进入学习。',next:'点击雨字 → 认识雨字头',source:'第 9 页',thumb:'assets/images/v3/G01_cave_daylight.png',layers:['原洞口底板','独立雨字卡','揭字配音与音效'] },
  { id:'learn',chapter:2,title:'雨字家族的小秘密',kind:'h5',phase:'learn',purpose:'认识雨、雪、雷、霞、雾，理解雨字头与天气现象的联系。',action:'点字看解释、听读音，认读时等待学生。',next:'点击来写一写 → 雨雪描写',source:'第 10 页 · 雾 wǔ → wù',thumb:'reference-previews/成品-识字.png',layers:['可编辑汉字和拼音','天气插画','统一教学声音','汉字切换卡'] },
  { id:'trace',chapter:3,title:'动手描一描',kind:'h5',phase:'trace',purpose:'观察“雨”和“雪”在田字格中的位置，进行自由描写。',action:'两字都留下笔迹后，由老师确认；可撤销、擦除。',next:'老师确认 → 第一道机关',source:'第 11 页',thumb:'assets/images/v20/A02.png',layers:['田字格','独立汉字','可保存笔迹','教师确认'] },
  { id:'quiz1',chapter:3,title:'第一道机关 · 看字形',kind:'h5',phase:'quiz',purpose:'区分词语的意义与汉字部件，找出含雨字头的字。',action:'选择“雷电”；选“降水”或“大风”会得到原因并可重试。',next:'答对并继续 → 第二道机关',source:'第 12 页',thumb:'assets/images/v20/A03.png',layers:['题干与选项','石头选项皮肤','原读题声音','正确 / 错误反馈'] },
  { id:'quiz2',chapter:3,title:'第二道机关 · 想字义',kind:'h5',phase:'quiz',purpose:'从雪、雷、霞、雾归纳雨字头的意义线索。',action:'选择“降水、天气”；答错不跳题、不扣分。',next:'答对并继续 → 线索到手',source:'第 10—12 页延伸练习',thumb:'assets/images/v20/A03.png',layers:['题干与选项','石头选项皮肤','原读题声音','正确 / 错误反馈'] },
  { id:'outro',chapter:4,title:'线索到手！',kind:'mixed',phase:'outro',purpose:'用角色回应与雨字徽章奖励，把学习结果带回故事。',action:'悟空说话时徽章飞入、悬停、收集；暂停时画面与徽章一起停。',next:'播放结束 → 本关成果回顾',source:'第 13 页 + 本关奖励',thumb:'assets/video/v32/E02-last.jpg',video:'assets/video/v32/E02.mp4',seconds:6,speaker:'孙悟空 · W09原配音',dialogue:'太棒了，线索到手！我们继续出发！',prompt:'outro',layers:['V32人物说话画面','原W09配音','正式雨字徽章','徽章时间轴','独立字幕'] },
  { id:'finish',chapter:4,title:'第一关完成，回顾所学',kind:'h5',phase:'finish',purpose:'庆祝本关成功、回顾雨字家族，提示后续寻找“心”的秘密。',action:'可复习或重玩本关。',next:'第一关结束 · 后续关卡待制作',source:'本关回顾，不提前获得真扇',thumb:'reference-previews/成品-成果.png',layers:['成果页美术','核心学习字与拼音','独立悟空','单次庆祝音效'] },
];
export { prompts };
export const imageResources = [
  { id:'character',name:'悟空主形象',file:'assets/images/v3/C00_wukong_master.png',usage:'封面、人物视频、任务与反馈',prompt:'character' },
  { id:'cave',name:'明亮洞口场景',file:'assets/images/v3/G01_cave_daylight.png',usage:'搬石、揭字、识字与回到故事',prompt:'cave' },
  { id:'rock',name:'可拖动的独立石头',file:'assets/images/v3/P01_draggable_rock.png',usage:'搬石找字 · 保留透明边缘',prompt:'rock' },
  { id:'badge',name:'正式雨字徽章',file:'assets/images/v3/U05_rain_reward.png',usage:'线索到手 · 独立叠加，不在视频中生成',prompt:'badge' },
  { id:'panel',name:'识字页主面板',file:'assets/images/v20/A01.png',usage:'认识雨字头 · 可编辑教学文字',prompt:'panel' },
  { id:'finish',name:'本关成果美术',file:'assets/images/v21/finish-background.png',usage:'第一关完成 · 学习字保持独立',prompt:'finish' },
];

export interface Preferences { videoUse:string; performance:string; teachingVoice:string; titleStyle:string; subtitles:boolean; soundEffects:boolean }
export const initialPreferences:Preferences = {videoUse:'关键环节',performance:'自然活泼',teachingVoice:'沿用统一教学旁白',titleStyle:'美术表现优先',subtitles:true,soundEffects:true};
export interface Composition { badgeOffset:number; badgeScale:number; subtitles:boolean; soundEffects:boolean; videoVersion:'v32'|'v31' }
export const initialComposition:Composition = {badgeOffset:0,badgeScale:1,subtitles:true,soundEffects:true,videoVersion:'v32'};
export interface Snapshot {id:string;label:string;time:string;composition:Composition;note:string}
export interface SceneEdit { purpose:string;action:string;next:string }
export const sceneValue = (scene:Scene,edits:Record<string,SceneEdit>) => ({...scene,...edits[scene.id]});
