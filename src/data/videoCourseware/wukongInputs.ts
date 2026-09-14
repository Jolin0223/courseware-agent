import type { MediaAsset } from './model';

// These are references from the accepted production packages, not all lesson artwork.
export const productionFrames: MediaAsset[] = [
  {id:'frame-opening',name:'火焰山 · 起始画面',file:'opening-first.png',segments:['opening']},
  {id:'frame-mission',name:'云上悟空 · 起始画面',file:'mission-first.png',segments:['mission','arrival']},
  {id:'frame-move',name:'洞口悟空 · 衔接画面',file:'move-first.png',segments:['move','arrival']},
  {id:'frame-outro',name:'获得线索 · 起始画面',file:'outro-first.png',segments:['outro']},
  {id:'opening-fan',name:'芭蕉扇造型',file:'opening-fan.png',segments:['opening']},
].map(a=>({id:a.id,name:a.name,kind:'image',url:'/wukong/production-references/'+a.file,prompt:a.name,segmentIds:a.segments,role:a.id==='opening-fan'?'道具参考':'镜头画面'}));

export const productionInputs: Record<string, NonNullable<MediaAsset['videoInputs']>> = {
  'video-opening': {firstFrameId:'frame-opening',references:[
    {assetId:'character',purpose:'保持悟空的外观、服装和五官一致',range:'整段视频'},
    {assetId:'opening-fan',purpose:'作为想象中的目标出现，不拿在手里',range:'约 6.8—9.7 秒'},
  ],audioStarts:[.2,4.95,9.9],audioDescriptions:['悟空站在火焰山脚下，望着火焰发愁。','悟空想到借扇；想象中的芭蕉扇作为目标出现。','悟空振作起来，准备去闯汉字关。']},
  'video-mission': {firstFrameId:'frame-mission',references:[],audioStarts:[.2],audioDescriptions:['悟空面对学生发出邀请，介绍认字、写字和闯关任务。']},
  'video-arrival': {firstFrameId:'frame-mission',lastFrameId:'frame-move',references:[],audioStarts:[7.3,12.5],audioDescriptions:['腾云后来到洞口，悟空发现入口被石头挡住。','镜头停在洞口，悟空注意到石头上的光。']},
  'video-move': {firstFrameId:'frame-move',references:[],audioStarts:[.6],audioDescriptions:['悟空邀请学生搬开石头；说完后停留，等待学生操作。']},
  'video-outro': {firstFrameId:'frame-outro',references:[],audioStarts:[.2],audioDescriptions:['悟空回应闯关成果，雨字徽章出现并展示。']},
  'video-cave': {firstFrameId:'cave',references:[],audioStarts:[]},
};
