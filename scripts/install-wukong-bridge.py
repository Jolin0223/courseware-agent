"""Add isolated editor controls to the copied lesson; source V32 stays unchanged."""
from pathlib import Path
p=Path('public/wukong/index.html');s=p.read_text()
if 'WUKONG_STUDIO_BRIDGE' in s:raise SystemExit('Bridge already installed')
s=s.replace("const KEY='wukong-rain-prototype-v3-focus';","const KEY='wukong-agent-lesson-isolated-v1';")
bridge=r'''
// WUKONG_STUDIO_BRIDGE: same-origin, allowlisted composition edits only.
const studioParams=new URLSearchParams(location.search);
let studioConfig={badgeOffset:Number(studioParams.get('badgeOffset')||0),badgeScale:Number(studioParams.get('badgeScale')||1),subtitles:studioParams.get('subtitles')!=='0',soundEffects:studioParams.get('soundEffects')!=='0',videoVersion:studioParams.get('videoVersion')==='v31'?'v31':'v32'};
const originalClueUpdate=updateClue;
updateClue=function(t){originalClueUpdate(t);$('outroClue').style.translate='0 '+studioConfig.badgeOffset+'px';$('outroClue').style.scale=String(studioConfig.badgeScale);};
const originalTap=playTap,originalEffect=playEffect;
playTap=function(...args){if(studioConfig.soundEffects)originalTap(...args);};
playEffect=function(...args){if(studioConfig.soundEffects)originalEffect(...args);};
const studioStyle=document.createElement('style');document.head.append(studioStyle);
function applyStudioConfig(input){
 studioConfig={badgeOffset:Math.max(-100,Math.min(80,Number(input.badgeOffset)||0)),badgeScale:Math.max(.7,Math.min(1.2,Number(input.badgeScale)||1)),subtitles:input.subtitles!==false,soundEffects:input.soundEffects!==false,videoVersion:input.videoVersion==='v31'?'v31':'v32'};
 studioStyle.textContent=studioConfig.subtitles?'':'#cinema .subtitle-line,.mission-subtitle,.move-invite-subtitle,#introSubtitle,#introCaption,#missionSubtitle,#missionCaption,#arrivalCaption,#moveInviteCaption,#moveInviteSubtitle,#outroCaption,.spoken-subtitle{visibility:hidden!important}';
 media.outro=studioConfig.videoVersion==='v31'?'assets/video/v31/E02.mp4':'assets/video/v32/E02.mp4';
 if(!studioConfig.soundEffects){stopEffect();tapAudio.pause();}
 if(state.phase==='outro')updateOutro();
}
applyStudioConfig(studioConfig);
window.addEventListener('message',e=>{
 if(e.origin!==location.origin||e.source!==parent)return;
 if(e.data?.type==='wukong-studio-pause'){document.querySelectorAll('video,audio').forEach(v=>v.pause());stopAudio();stopEffect();tapAudio.pause();return;}
 if(e.data?.type!=='wukong-studio-config')return;
 if(e.data.composition&&typeof e.data.composition==='object')applyStudioConfig(e.data.composition);
});
const studioPhaseObserver=new MutationObserver(()=>{if(parent!==window)parent.postMessage({type:'wukong-phase',phase:state.phase==='quiz'?(state.quizIndex===1?'quiz2':'quiz1'):state.phase},location.origin);});
studioPhaseObserver.observe($('stage'),{attributes:true,attributeFilter:['data-phase']});
studioPhaseObserver.observe($('lessonPanel'),{attributes:true,attributeFilter:['data-question-index']});
const studioScene=studioParams.get('scene');
const studioPhases={cover:'cover',opening:'intro',mission:'mission',arrival:'arrival',move:'cave',discover:'discover',learn:'learn',trace:'trace',quiz1:'quiz',quiz2:'quiz',outro:'outro',finish:'finish'};
if(studioParams.get('studio')==='1'&&studioPhases[studioScene]){
 saved=null;state=blank();if(studioScene==='quiz2')state.quizIndex=1;
 applyChange(studioPhases[studioScene]);
 if(studioParams.get('inspect')==='1'&&studioScene==='outro'){
  const v=$('outroVideo');v.pause();
  const ready=()=>{v.currentTime=2.6;v.pause();$('pauseOutro').textContent='播放';};
  if(v.readyState>=1)ready();else v.addEventListener('loadedmetadata',ready,{once:true});
  const freeze=()=>{v.pause();updateOutro();};v.addEventListener('seeked',freeze,{once:true});
 }
}
'''
s=s.replace('startCoverEntrance();\nplayCoverVoice(\'open\');',bridge+"\nif(state.phase==='cover'){startCoverEntrance();playCoverVoice('open');}")
p.write_text(s)
print('Installed isolated composition and scene-preview bridge')
