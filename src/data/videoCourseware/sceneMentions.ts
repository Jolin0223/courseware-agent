import pack from './wukongPackage.json';
import type { VideoProject, VideoSegment } from './model';

// Only annotate the unchanged package copy. Never rewrite a teacher's edited text
// or invent a reference that is not actually linked to the scene.
const phrases:Record<string,Array<[string,string]>>={
 cover:[['封面、悟空','封面整幅底图'],['现有开场录音','封面开场']],
 opening:[['用15秒连续视频','火焰山 · 起始画面'],['悟空被火焰山挡住','开场悟空 · 角色参考'],['芭蕉扇只出现在悟空的想象中','芭蕉扇造型']],
 mission:[['悟空站在云上','悟空主形象'],['三张任务卡','任务页云海底图']],
 arrival:[['腾云、到达洞口、发现发光石头三个片段','腾云出发 · 起始画面']],
 move:[['可拖动的洞口画面','洞口白天背景'],['悟空看向左侧石头','搬石引导悟空'],['学生拖开石头','可拖拽石头']],
 discover:[['完整的“雨”字卡与悟空','发现雨字卡底图'],['悟空发现石头后藏着“雨”字','悟空发现姿态']],
 learn:[['五个字及天气图','学习面板'],['雪 xuě','下雪插画'],['雷 léi','雷电插画'],['霞 xiá','晚霞插画'],['雾 wù','大雾插画']],
 trace:[['在田字格中','学习面板'],['描写指导','P13 · 旁白 · 描写指导']],
 quiz1:[['题目：','答题石头底图'],['选错可以重试','P15 · 旁白 · 第一题答错提示']],
 quiz2:[['题目：','答题石头底图'],['雨字头说明','P07 · 旁白 · 雨字头讲解']],
 outro:[['获得线索的台词','W09 · 线索到手'],['“雨”字徽章','正式雨字徽章底图']],
 finish:[['本关完成的庆祝画面与悟空','成功页整幅底图']],
};
export function sceneContentWithMentions(project:VideoProject,scene:VideoSegment):string{
 let text=scene.content||'';
 if(project.fixtureId!=='wukong'||text!==pack.sceneContents[scene.id as keyof typeof pack.sceneContents])return text;
 const related=project.assets.filter(a=>a.segmentIds.includes(scene.id));
 for(const [phrase,name] of phrases[scene.id]||[]){
  if(!related.some(a=>a.name===name))continue;
  const extra=scene.id==='cover'&&name==='封面整幅底图'&&related.some(a=>a.name==='封面悟空')?'、@封面悟空':scene.id==='finish'&&related.some(a=>a.name==='成功页悟空乘云')?'、@成功页悟空乘云':'';
  text=text.replace(phrase,phrase+'（@'+name+extra+'）');
 }
 return text;
}
