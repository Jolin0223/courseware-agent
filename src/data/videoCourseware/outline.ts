import type { OutlineChapter, VideoProject, VideoSegment } from './model';
import { legacyWukongFixture } from './fixtures';
import pack from './wukongPackage.json';

const chapterContent:Record<string,string>={
 '故事启程':'介绍悟空被火焰山挡住、需要寻找芭蕉扇的故事。说明本关要认字、描写和闯关，再跟随悟空来到洞口。',
 '搬石找字':'通过搬开发光石头发现“雨”字，让学生点击汉字进入学习。',
 '认识雨字头':'认读雨、雪、雷、霞、雾，结合天气插画理解雨字头与天气现象的联系。',
 '描写与闯关':'在田字格中描写雨、雪；用两道题分别辨认雨字头和归纳它的意义。选错后解释原因并允许重试。',
 '线索与回顾':'悟空回应闯关成功，获得“雨”字线索。回顾本关汉字，提供复习和重玩；此处尚未取得真正的芭蕉扇。',
};
const sceneContent:Record<string,string>={
 cover:'展示《雨字头的秘密》与悟空，引出“帮助悟空寻找芭蕉扇线索”的任务。点击开始进入故事。',
 opening:'连续呈现悟空在火焰山前受阻、想借芭蕉扇、需要闯过汉字关的故事。讲到借扇时出现想象中的芭蕉扇；此时还没有获得真扇。',
 mission:'悟空在画面一侧说出闯关邀请，另一侧展示“搬石识字、写字、闯关”三张任务卡。说完后安静停留，点击任务卡听说明，点击出发继续。',
 arrival:'悟空腾云出发、来到洞口，发现入口被石头堵住，其中一块在发光。保持与后续搬石页面相同的洞口和角色形象。',
 move:'悟空指向发光石头，邀请学生向左搬开。说完后等待操作；石头可拖到左侧落点，也可点击帮助。拖错回位，成功后揭晓汉字。',
 discover:'保持洞口背景，露出石头后面的“雨”字卡。悟空提示发现了雨字；学生点击字卡进入认读。',
 learn:'用字卡展示雨 yǔ、雪 xuě、雷 léi、霞 xiá、雾 wù，配天气插画、读音和含义。学生点击切换、重听，自行决定认读时间。',
 trace:'展示雨、雪两个田字格描写任务，可切换汉字、撤销一笔、擦除重写。两字留下笔迹后由老师确认；不自动判断书写正误。',
 quiz1:'展示“雷电、降水、大风”三个选项，请学生找出含雨字头的字。正确为“雷电”；选择另外两项时解释天气词语不一定有雨字头，允许重试。',
 quiz2:'展示雪、雷、霞、雾，请学生判断雨字头多与什么有关。正确为“降水、天气”；答错给出含义提示，答对后继续。',
 outro:'悟空说“太棒了，线索到手！我们继续出发！”。正式“雨”字徽章在掌心上方飞入、悬停并收集；人物视频不生成替代徽章，保留原配音。',
 finish:'展示本关完成的庆祝画面，回顾雨、雪、雷、霞、雾，提供复习与重玩入口。说明获得了找扇线索，不提前宣告已经借到真扇。',
};
export function makeOutline(segments:VideoSegment[]):OutlineChapter[]{
 if(segments.length && segments.every(s=>Boolean(s.sourceContent)))return pack.chapters.map(c=>({...c,sourceContent:c.content,segmentIds:c.segmentIds.filter(id=>segments.some(s=>s.id===id))}));
 return [...new Set(segments.map(s=>s.chapter))].map((title,i)=>({id:'chapter-'+(i+1),title,content:chapterContent[title]||segments.filter(s=>s.chapter===title).map(s=>s.purpose).join(' '),segmentIds:segments.filter(s=>s.chapter===title).map(s=>s.id)})).map(c=>({...c,sourceContent:c.content}));
}
export function initialSceneContent(segment:VideoSegment,fixtureId:string){
 return fixtureId==='wukong'?segment.sourceContent||sceneContent[segment.id]||segment.purpose:[segment.visual,segment.purpose,segment.kind==='video'?'':segment.interaction].filter(Boolean).join('\n');
}
export function outlineIssues(p:VideoProject):string[]{
 const chapters=p.chapters||[];
 if(!chapters.length)return ['请至少保留一个章节。'];
 return chapters.flatMap((c,i)=>!c.title.trim()||!c.content.trim()?[`第 ${i+1} 章需要名称和主要内容。`]:[]);
}
// Demo planner: preserve the reviewed lesson split, while added chapters receive
// a new content page. Free-form media creation still needs the production service.
export function compileOutline(p:VideoProject):Partial<VideoProject>{
 const chapters=p.chapters||[];
 const segments=chapters.flatMap(c=>{
  const existing=c.segmentIds.map(id=>p.segments.find(s=>s.id===id)).filter((s):s is VideoSegment=>Boolean(s));
  if(existing.length && (!c.sourceContent || c.content===c.sourceContent))return existing.map(s=>({...s,chapterId:c.id,chapter:c.title,content:s.content||initialSceneContent(s,p.fixtureId)}));
  return [{id:'scene-'+c.id,chapterId:c.id,chapter:c.title,title:c.title,kind:'h5' as const,content:c.content,purpose:c.content,interaction:'阅读内容后继续',next:'继续学习',seconds:0,dialogue:'',speakerId:'narrator',visual:c.content,transition:'阅读后继续'}];
 });
 const ids=new Set(segments.map(s=>s.id));
 const assets=p.assets.map(a=>({...a,segmentIds:a.segmentIds.filter(id=>ids.has(id))})).filter(a=>a.segmentIds.length);
 return {segments,chapters:chapters.map(c=>({...c,segmentIds:segments.filter(s=>s.chapterId===c.id).map(s=>s.id)})),assets,shots:undefined,readySceneIds:[],readyPageIds:[],sceneAssemblyStarts:{},outlineConfirmed:true,approvedPlanKey:undefined,approvedMaterialsKey:undefined};
}
export function scenePlanIssues(p:VideoProject):string[]{
 return p.segments.flatMap((s,i)=>!s.title.trim()||!(s.content||'').trim()?[`场景 ${i+1} 需要名称和具体内容。`]:[]);
}
export function sceneChanged(p:VideoProject,scene:VideoSegment){
 const baseline=legacyWukongFixture.segments.find(s=>s.id===scene.id);
 return !baseline||scene.kind!==baseline.kind||scene.content!==(scene.sourceContent||initialSceneContent(baseline,p.fixtureId));
}
