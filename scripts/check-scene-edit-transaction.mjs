import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {createServer} from 'vite';
const data=new Map();globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};globalThis.location=new URL('http://127.0.0.1:4186');globalThis.window={localStorage,location};
const server=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'error'}),checks=[];
const check=(name,fn)=>{fn();checks.push({name,passed:true});};
try{
 const {wukongFixture,exampleAttachments}=await server.ssrLoadModule('/src/data/videoCourseware/fixtures.ts');
 const {useVideoCoursewareStore:store}=await server.ssrLoadModule('/src/store/videoCoursewareStore.ts');
 const {useConversationStore:conv}=await server.ssrLoadModule('/src/store/conversationStore.ts');
 const {startVideoProject,advanceVideoJobs,confirmOutline}=await server.ssrLoadModule('/src/components/VideoCourseware/workflow.ts');
 const {prepareSceneEdit}=await server.ssrLoadModule('/src/data/videoCourseware/sceneEditing.ts');
 const {videoPlanIssues}=await server.ssrLoadModule('/src/data/videoCourseware/planning.ts');
 const cid=conv.getState().createNewConversation('transaction check');startVideoProject(cid,wukongFixture.request,exampleAttachments,{contentFormat:'video'});const id='video-'+cid,get=()=>store.getState().projects[id],tick=ms=>advanceVideoJobs(get().job.start+ms);
 tick(2400);confirmOutline(id);tick(1800);tick(6500);tick(6500);const original=structuredClone(get());original.readyAssetIds=original.assets.map(a=>a.id);original.readyPageIds=original.segments.filter(s=>s.kind!=='video').map(s=>s.id);original.readySceneIds=original.segments.map(s=>s.id);
 const snapshot=JSON.stringify(original),draft=structuredClone(original);draft.shots.find(s=>s.segmentId==='opening').prompt+='\n保持镜头稳定。';const patch=prepareSceneEdit(original,draft,'opening');
 check('draft and patch leave original untouched',()=>assert.equal(JSON.stringify(original),snapshot));
 check('video edit invalidates only selected video',()=>assert.deepEqual(original.readyAssetIds.filter(id=>!patch.readyAssetIds.includes(id)),['video-opening']));
 check('video edit leaves unrelated completed scenes',()=>assert.deepEqual(patch.readySceneIds,original.readySceneIds.filter(id=>id!=='opening')));
 check('edited plan retains valid source signatures',()=>assert.deepEqual(videoPlanIssues({...draft,...patch}),[]));
 const audioDraft=structuredClone(original),cue=audioDraft.shots.find(s=>s.segmentId==='opening').audioCues[0],audio=audioDraft.assets.find(a=>a.id===cue.assetId);audio.seconds=1.2;audio.revision=(audio.revision||0)+1;const audioPatch=prepareSceneEdit(original,audioDraft,'opening');
 check('replaced shorter audio updates trim duration',()=>assert.equal(audioPatch.shots.find(s=>s.segmentId==='opening').audioCues[0].trimEnd,1.2));
 check('replaced audio leaves a valid nonoverlapping plan',()=>assert.deepEqual(videoPlanIssues({...audioDraft,...audioPatch}),[]));
 const resourceDraft=structuredClone(original),shared=resourceDraft.assets.find(a=>a.name==='悟空主形象');assert.ok(shared);shared.prompt+=' 保留服装。';shared.revision=(shared.revision||0)+1;const resourcePatch=prepareSceneEdit(original,resourceDraft,'opening');
 check('shared resource invalidates dependent scenes only',()=>{for(const scene of original.segments)assert.equal(resourcePatch.readySceneIds.includes(scene.id),scene.id!=='opening'&&!shared.segmentIds.includes(scene.id));});
 writeFileSync('docs/scene-edit-transaction-check.json',JSON.stringify({checks},null,2)+'\n');console.log(checks);
}finally{await server.close();}
