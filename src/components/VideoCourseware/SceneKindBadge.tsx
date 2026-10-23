import { Film, Gamepad2, Layers } from 'lucide-react';
import type { VideoSegment } from '../../data/videoCourseware/model';

export default function SceneKindBadge({kind}:{kind:VideoSegment['kind']}){
 const Icon=kind==='h5'?Gamepad2:kind==='mixed'?Layers:Film;
 return <span className={'vc-kind vc-scene-kind vc-kind-'+kind}><Icon size={13}/>{kind==='video'?'视频页面':kind==='mixed'?'视频＋互动页面':'互动页面'}</span>;
}
