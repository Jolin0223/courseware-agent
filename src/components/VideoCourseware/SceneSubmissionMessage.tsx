import { useState } from 'react';
import type { UserMaterialMessage } from '../../types';
import { useVideoCoursewareStore } from '../../store/videoCoursewareStore';
import SceneEditor from './SceneEditor';

export default function SceneSubmissionMessage({message}:{message:UserMaterialMessage}){
 const submission=message.sceneSubmission!;
 const project=useVideoCoursewareStore(s=>s.projects[submission.projectId]);
 const [view,setView]=useState<{sceneId:string;before:boolean}|null>(null);
 if(!project)return null;
 const draft=project.courseDraft;
 const failed=draft?.status==='failed'&&project.submittedEdits?.some(e=>e.message.id===draft.messageId&&typeof e.message.content==='object'&&'sceneSubmission' in e.message.content&&JSON.stringify(e.message.content.sceneSubmission)===JSON.stringify(submission));
 const frozen={...project,...(view?.before?submission.before:submission.snapshot),composition:view?.before?submission.beforeComposition:submission.composition,revision:submission.baseVersion};
 return <div className="vc-scene-submission">
  <div className="vc-submission-heading"><strong>场景修改提交</strong>{failed&&<span role="status">生成失败，可重试</span>}</div>
  <p>{message.text}</p>
  <details><summary>查看本次修改</summary>
   {submission.scenes.map(scene=><div className="vc-submission-scene" key={scene.id}><span>场景{scene.number} · {scene.title}</span><div><button className="vc-text-btn" onClick={()=>setView({sceneId:scene.id,before:true})}>修改前</button><button className="vc-text-btn" onClick={()=>setView({sceneId:scene.id,before:false})}>提交方案</button></div></div>)}
  </details>
  {view&&<SceneEditor key={view.sceneId+String(view.before)} project={frozen} sceneId={view.sceneId} readOnly onClose={()=>setView(null)}/>}
 </div>;
}
