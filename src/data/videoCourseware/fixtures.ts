import narration from './narration.json';
import audioDurations from './audioDurations.json';
import { asset, scenes, chapters, imageResources, prompts, initialRequest } from '../wukong/course';
import type { LessonFixture, MediaAsset, VideoSegment } from './model';
import type { GenerationPreferences, UploadedAttachment } from '../../types';
import { productionFrames, productionInputs } from './wukongInputs';

export const VIDEO_EXAMPLE_PROMPT='跟着孙悟空认识雨字头，边看故事边闯关';
export const exampleAttachments:UploadedAttachment[]=Array.from({length:9},(_,i)=>({id:`video-example-page-${i+1}`,type:'image',name:`识字教学材料-${String(i+1).padStart(2,'0')}.png`,url:asset(`assets/images/page-${String(i+5).padStart(2,'0')}.png`)}));
const imageAssets:MediaAsset[]=imageResources.map(x=>({id:x.id,kind:'image',name:x.name.replace('正式',''),url:asset(x.file),prompt:prompts[x.prompt as keyof typeof prompts],segmentIds:x.id==='character'?['cover','opening','mission','arrival','move','outro','finish']:x.id==='badge'?['outro']:x.id==='rock'?['move','discover']:x.id==='panel'?['learn','trace']:x.id==='finish'?['finish']:['move','discover','learn'],overlay:x.id==='badge'?{sceneId:'outro'}:undefined,videoDependency:['character','cave'].includes(x.id),referenceFor:x.id==='cave'?'video-cave':undefined,role:x.id==='character'?'角色形象':x.id==='badge'||x.id==='rock'?'互动道具':'场景画面'}));
const videoAssets:MediaAsset[]=scenes.filter(x=>x.video).map(x=>({id:`video-${x.id}`,kind:'video',name:x.title,url:asset(x.video!),poster:asset(x.thumb),prompt:prompts[x.prompt!],sourcePrompt:prompts[x.prompt!],segmentIds:[x.id],speakerId:x.id==='opening'?'narrator':'hero',text:x.dialogue,seconds:x.seconds}));
const audioAssets:MediaAsset[]=[
 ...[
  ['arrival-cave','找到洞口','W03_cave','arrival','终于找到洞口了！可入口又被石头挡住了。'],
  ['arrival-glow','发现发光的石头','W04_glow','arrival','咦，这块石头在发光！里面藏着什么秘密呢？'],
  ['discover-voice','发现雨字','W06_discover','discover','你帮我找到“雨”字啦！快点开看看！'],
  ['quiz1-voice','解题邀请','W07_quiz1','quiz1','帮我解开机关吧！'],
  ['quiz2-voice','再次解题','W08_quiz2','quiz2','再解开最后一道机关！'],
 ].map(([id,name,file,segment,text])=>({id,kind:'audio' as const,name,url:asset(`assets/audio/v9/${file}.mp3`),prompt:text,text,segmentIds:[segment],speakerId:'hero'})),
 ...narration.map(a=>({...a,kind:'audio' as const})),
 {id:'mission-voice',kind:'audio',name:'任务邀请',url:asset('assets/audio/v10/W10_mission_invite.mp3'),prompt:'小伙伴，和我一起搬石识字、写字闯关吧！',text:'小伙伴，和我一起搬石识字、写字闯关吧！',segmentIds:['mission'],speakerId:'hero'},
 {id:'move-voice',kind:'audio',name:'搬石邀请',url:asset('assets/audio/v9/W05_move.mp3'),prompt:'小伙伴，帮我把发光的石头，向左搬开吧！',text:'小伙伴，帮我把发光的石头，向左搬开吧！',segmentIds:['move'],speakerId:'hero'},
 {id:'outro-voice',kind:'audio',name:'获得线索',url:asset('assets/audio/v9/W09_finish.mp3'),prompt:'太棒了，线索到手！我们继续出发！',text:'太棒了，线索到手！我们继续出发！',segmentIds:['outro'],speakerId:'hero'},
];
const segments:VideoSegment[]=scenes.map(x=>({id:x.id,chapter:chapters[x.chapter].title,title:x.title,kind:x.kind,purpose:x.purpose,interaction:x.action,next:x.next.replace('第一关结束 · 后续关卡待制作','结束或重新学习'),seconds:x.seconds||0,dialogue:x.dialogue||'',speakerId:x.speaker?.includes('悟空')?'hero':'narrator',visual:x.kind==='video'?'连续故事画面，保持人物和场景一致。':x.kind==='mixed'?'为人物、教学文字与学生操作留出独立区域，人物说完后保持安静。':'复用场景与角色图片，突出教学内容和操作区域。',transition:x.kind==='video'?'视频结束后进入下一环节':x.kind==='mixed'?'视频结束后停留画面，等待学生操作':'完成当前操作后继续'}));
export const wukongFixture:LessonFixture={id:'wukong',title:'悟空借芭蕉扇 · 雨字头的秘密',subject:'语文',grade:'一年级',request:initialRequest.replace('先把第一关做好。',''),attachments:exampleAttachments,framework:{userRequirement:'面向小学一、二年级。认识雨、雪、雷、霞、雾，理解雨字头与天气现象的联系；描写雨和雪，再用两道练习巩固。',featureDesign:'故事引入 → 搬石发现汉字 → 认读与描写 → 两道互动练习 → 获得线索并回顾。',designStyle:'明亮、亲切的国风卡通。人物在故事与邀请时表演，学生认读、描写和答题时保持画面稳定。关键汉字、拼音和题目清晰可读。'},segments,speakers:[{id:'narrator',name:'教学旁白',role:'narrator',voiceName:'清晰女声',sample:audioAssets.find(a=>a.id==='narration-P07')?.url},{id:'hero',name:'孙悟空',role:'character',voiceName:'活泼少年',sample:audioAssets.find(a=>a.id==='outro-voice')?.url}],assets:[...imageAssets,...['mission','move','outro'].map(id=>({id:`frame-${id}`,kind:'image' as const,name:`${scenes.find(s=>s.id===id)!.title} · 参考画面`,url:asset(`references/${id}.png`),prompt:prompts[scenes.find(s=>s.id===id)!.prompt!],segmentIds:[id],role:'视频参考图',referenceFor:`video-${id}`})),{id:'cover',kind:'image',name:'课件封面',url:asset('assets/images/v10/cover.png'),prompt:'国风卡通识字故事封面，教学主题与开始按钮清晰。',segmentIds:['cover'],role:'封面'},...['opening','arrival'].map(id=>({id:`frame-${id}`,kind:'image' as const,name:`${scenes.find(s=>s.id===id)!.title} · 起始画面`,url:asset(`planning/${id}-first.jpg`),prompt:prompts[scenes.find(s=>s.id===id)!.prompt!],segmentIds:[id],role:'视频参考图',referenceFor:`video-${id}`,planningOnly:true})),...videoAssets,{id:'video-cave',kind:'video',name:'洞口环境',url:asset('assets/video/v3/V02_cave_idle_v3.mp4'),poster:asset('assets/images/v3/G01_cave_daylight.png'),prompt:'安静稳定的洞口环境，保留互动区域，进入认读时定格。',segmentIds:['move'],seconds:6.58,role:'环境视频'},...audioAssets.map(a=>({...a,seconds:(audioDurations as Record<string,number>)[a.url!],audioUse:(a.id.startsWith('narration-')&&!['narration-P01','narration-P02','narration-P03'].includes(a.id)?'interaction':'video') as 'interaction'|'video'}))],runtime:asset('index.html')};
// Replace legacy poster extractions with the actual submitted image files. Shared
// frames are one asset referenced by two videos; interactive props stay separate.
wukongFixture.assets = [
 ...wukongFixture.assets.filter(a=>!a.id.startsWith('frame-')),
 ...productionFrames,
].map(a=>a.kind==='video'?{...a,videoInputs:productionInputs[a.id]}:a);

export function createFixture(request:string,attachments:UploadedAttachment[],preferences:GenerationPreferences):LessonFixture {
 if(/悟空|雨字头/.test(request)||attachments.some(x=>x.id.startsWith('video-example-page-')))return structuredClone({...wukongFixture,request,attachments,framework:{...wukongFixture.framework,designStyle:preferences.visualStyleName ? preferences.visualStyleName + '。' + wukongFixture.framework.designStyle : wukongFixture.framework.designStyle}});
 const english=/英语|英文|点餐|restaurant/i.test(request);
 const noCharacter=/不需要角色|不要角色|无角色|只有旁白/.test(request);
 const title=english?'餐厅点餐 · 视频互动练习':request.replace(/请|帮我|制作|生成/g,'').trim().slice(0,24)||'视频互动课件';
 const genericSegments:VideoSegment[]=[
 {id:'intro',chapter:'情境引入',title:english?'走进餐厅':'认识今天的任务',kind:'video',purpose:english?'在点餐情境中理解 What would you like?':request,interaction:'观看情境，可暂停或跳过。',next:'视频结束后进入任务',seconds:12,dialogue:english?'What would you like?':'让我们一起完成今天的学习任务。',speakerId:'character',visual:english?'服务员站在菜单一侧，保留菜单和操作空间。':'根据教学主题安排场景与人物。',transition:'结束后保留画面，出现操作内容'},
 {id:'practice',chapter:'互动练习',title:english?'选择餐品并表达':'动手试一试',kind:'mixed',purpose:english?'用 I’d like… 表达想要的餐品。':'通过操作练习目标知识。',interaction:english?'选择餐品，用按钮组成 I’d like…；答错获得提示并重试。':'点击、选择或拖动完成任务，答错后获得提示。',next:'完成操作后进入巩固练习',seconds:6,dialogue:english?'I’d like a sandwich, please.':'轮到你来试一试。',speakerId:'character',visual:'角色在一侧，题目和操作区域不遮挡人物。',transition:'说完后暂停，等待学生作答'},
 {id:'review',chapter:'巩固与回顾',title:english?'换个场景再点一次':'独立完成练习',kind:'h5',purpose:'在减少提示后检查是否掌握。',interaction:'完成一道新题后查看反馈，可重新练习。',next:'完成课件',seconds:0,dialogue:'',speakerId:'narrator',visual:'清楚展示题目和反馈，复用已生成的画面。',transition:'完成作答后显示回顾'},
 ];
 if(noCharacter)genericSegments.forEach(s=>{s.speakerId='narrator';s.visual='根据教学主题安排画面，为教学文字与学生操作留出空间。';});
 const narrator=preferences.voiceName||'智能匹配';
 return {id:'generic',title,subject:english?'英语':'综合',grade:request.match(/[一二三四五六]年级/)?.[0]||'待确认',request,attachments,framework:{userRequirement:request,featureDesign:'情境引入 → 操作练习 → 独立巩固',designStyle:preferences.visualStyleName||'根据教学内容与年级智能匹配画面风格。'},segments:genericSegments,speakers:[{id:'narrator',name:'教学旁白',role:'narrator',voiceName:narrator},...(!noCharacter?[{id:'character',name:english?'服务员':'引导角色',role:'character' as const,voiceName:'智能匹配'}]:[])],assets:[...(!noCharacter?[{id:'character',kind:'image' as const,name:english?'服务员形象':'引导角色',prompt:'符合教学主题的角色形象',segmentIds:['intro','practice'],role:'角色形象'}]:[]),{id:'background',kind:'image',name:english?'餐厅场景':'教学场景',prompt:'保持场景一致，给教学内容留出空间。',segmentIds:['intro','practice','review'],role:'场景画面'},...genericSegments.filter(s=>s.dialogue).map(s=>({id:`audio-${s.id}`,kind:'audio' as const,name:`${s.title} · 配音`,speakerId:s.speakerId,prompt:s.dialogue,text:s.dialogue,segmentIds:[s.id]})),...genericSegments.filter(x=>x.kind!=='h5').map(x=>({id:`video-${x.id}`,kind:'video' as const,name:x.title,prompt:x.visual,segmentIds:[x.id],text:x.dialogue,seconds:x.seconds}))]};
}
export const getRuntime=(id:string)=>id==='wukong'?wukongFixture.runtime:undefined;
