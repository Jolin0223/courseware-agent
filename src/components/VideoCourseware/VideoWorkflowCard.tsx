import type { WorkflowStage } from '../../data/videoCourseware/model';
import { useVideoCoursewareStore } from '../../store/videoCoursewareStore';
import LegacyVideoWorkflowCard from './LegacyVideoWorkflowCard';
import OutlineSceneFlow from './OutlineSceneFlow';
export default function VideoWorkflowCard(props:{projectId:string;stage?:WorkflowStage;runId?:string}){
 const project=useVideoCoursewareStore(s=>s.projects[props.projectId]);
 if(!project)return null;
 return project.workflowVersion===5?<OutlineSceneFlow project={project} stage={props.stage||'plan'} runId={props.runId}/>:<LegacyVideoWorkflowCard {...props}/>;
}
