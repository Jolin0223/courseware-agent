import type { MediaAsset } from '../../data/videoCourseware/model';

export async function readLocalSceneAsset(file:File,kind:'image'|'audio',sceneId:string):Promise<MediaAsset>{
 if(!file.type.startsWith(kind+'/'))throw new Error(kind==='image'?'请选择图片文件':'请选择音频文件');
 if(file.size>2*1024*1024)throw new Error('当前上传文件不能超过 2 MB');
 const url=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('文件读取失败，请重试'));reader.readAsDataURL(file);});
 const seconds=await new Promise<number|undefined>((resolve,reject)=>{
  const media=kind==='image'?new Image():document.createElement('audio');
  const timer=window.setTimeout(()=>finish(false),10000);
  function finish(ok:boolean){clearTimeout(timer);media.onload=null;media.onerror=null;if(media instanceof HTMLAudioElement){media.onloadedmetadata=null;const duration=media.duration;media.removeAttribute('src');media.load();if(ok&&Number.isFinite(duration)&&duration>0){resolve(duration);return;}}else if(ok){resolve(undefined);return;}reject(new Error(kind==='image'?'无法读取此图片，请换一个文件':'无法读取此音频，请换一个可播放的文件'));}
  media.onerror=()=>finish(false);
  if(media instanceof HTMLAudioElement){media.preload='metadata';media.onloadedmetadata=()=>finish(true);}else media.onload=()=>finish(true);
  media.src=url;
 });
 return {id:'local-'+crypto.randomUUID(),kind,name:file.name.replace(/\.[^.]+$/,'')||file.name,url,prompt:'',segmentIds:[sceneId],role:kind==='image'?'本地图片':'本地配音',seconds,revision:1};
}
