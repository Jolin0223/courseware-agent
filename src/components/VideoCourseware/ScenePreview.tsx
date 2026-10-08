import { useRef } from 'react';
import type { VideoProject } from '../../data/videoCourseware/model';
import { VideoModal } from './Shared';
import { runtimeURL, sendRuntimeSettings } from './runtime';

export default function ScenePreview({project,sceneId,onClose}:{project:VideoProject;sceneId:string;onClose:()=>void}){
 const frame=useRef<HTMLIFrameElement>(null),isolated={...project,segments:project.segments.filter(s=>s.id===sceneId)};
 const url=runtimeURL(isolated,project.composition,sceneId);
 return <VideoModal title={'场景预览 · '+isolated.segments[0]?.title} onClose={onClose}><iframe ref={frame} className="vc-lesson" title="场景课件预览" src={url+'&previewOnly=1'} onLoad={()=>sendRuntimeSettings(frame.current?.contentWindow,isolated,project.composition)} allow="autoplay; fullscreen"/></VideoModal>;
}
