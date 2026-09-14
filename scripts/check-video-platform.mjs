import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Exercise the real application stores and React rendering in Node. No browser is controlled here.
const storage = new Map();
globalThis.localStorage = { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) };
globalThis.location = new URL('http://127.0.0.1:4186/');
globalThis.window = { localStorage: globalThis.localStorage, location: globalThis.location };
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const checks = [];
const check = (name, test) => { test(); checks.push({ name, passed: true }); };
try {
  const { createFixture, wukongFixture, exampleAttachments } = await server.ssrLoadModule('/src/data/videoCourseware/fixtures.ts');
  const { useVideoCoursewareStore: store, durations } = await server.ssrLoadModule('/src/store/videoCoursewareStore.ts');
  const { useConversationStore: conversations } = await server.ssrLoadModule('/src/store/conversationStore.ts');
  const { useCoursewareStore: library } = await server.ssrLoadModule('/src/store/coursewareStore.ts');
  const { startVideoProject, advanceVideoJobs, finishVideoProject, restoreVideoConversations, confirmVideoPlan, beginVideoPlanReview, ensureWorkflowMessage } = await server.ssrLoadModule('/src/components/VideoCourseware/workflow.ts');
  const { videoPlanIssues, synchronizeSegment, changedVideoIds, shotIssues } = await server.ssrLoadModule('/src/data/videoCourseware/planning.ts');
  const { default: Card } = await server.ssrLoadModule('/src/components/VideoCourseware/VideoWorkflowCard.tsx');
  const preferences = { contentFormat: 'video', voiceLanguage: '中文' };
  const convId = conversations.getState().createNewConversation('视频互动课件');
  conversations.getState().setActiveConversation(null);
  startVideoProject(convId, wukongFixture.request, exampleAttachments, preferences);
  const id = `video-${convId}`;
  const project = () => store.getState().projects[id];
  const advance = ratio => { const j = project().job; advanceVideoJobs(j.start + j.duration * ratio); };
  const render = stage => {
    // React SSR reads Zustand's hydration snapshot; align it with this test's current state.
    store.getInitialState().projects = store.getState().projects;
    return renderToStaticMarkup(React.createElement(Card, { projectId: id, stage, runId: project().workflowRuns?.[stage] }));
  };

  check('exactly-nine-uploaded-teaching-pages', () => {
    assert.equal(project().attachments.length, 9);
    assert.equal(project().attachments[0].name, '识字教学材料-01.png');
    assert.ok(project().attachments.every(a => !/32|第.*页/.test(a.name)));
  });
  check('planning-has-no-generated-media', () => { assert.equal(project().phase, 'planning'); assert.deepEqual(project().readyAssetIds, []); assert.doesNotMatch(render('plan'), /<img|<video|<audio/); });
  advance(1);
  check('editable-plan-only-before-confirmation', () => {
    assert.equal(project().phase, 'plan'); const html = render('plan');
    assert.match(html, /确认需求，开始生成/); assert.match(html, /旁白和角色配音/); assert.match(html, /编辑/);
    assert.doesNotMatch(html, /<img|<video|<audio|本课效果方向|已有真实产物|本课检查与采用/);
    assert.equal(render('assets'), '');
  });
  ensureWorkflowMessage(project(), 'assets');
  store.getState().start(id, 'assets');
  check('asset-loading-does-not-claim-completion', () => {
    const html = render('assets'); assert.match(html, /正在生成图片和配音/); assert.doesNotMatch(html, /图片和配音已生成|<img|<video/);
  });
  advance(.35);
  check('images-and-per-speaker-audio-progress-together', () => {
    const ready = project().assets.filter(a => project().readyAssetIds.includes(a.id));
    assert.ok(ready.some(a => a.kind === 'image')); assert.ok(ready.some(a => a.kind === 'audio')); assert.ok(ready.every(a => a.kind !== 'video'));
  });
  const beforePause = [...project().readyAssetIds]; store.getState().pause(id); advanceVideoJobs(Date.now() + 120000);
  check('pause-preserves-completed-work', () => { assert.equal(project().phase, 'paused'); assert.deepEqual(project().readyAssetIds, beforePause); });
  store.getState().resume(id); advance(1);
  check('assets-automatically-prepare-video-plan', () => { assert.equal(project().phase, 'video-planning'); assert.equal(store.getState().start(id, 'video'), false); assert.match(render('assets'), /正在整理视频方案/); assert.ok(project().assets.filter(a => a.planningOnly).every(a => !project().readyAssetIds.includes(a.id))); });
  advance(1);
  check('assets-require-user-confirmation-before-video', () => {
    assert.equal(project().phase, 'assets-review'); assert.equal(project().job, undefined);
    assert.ok(project().assets.filter(a => a.kind !== 'video').every(a => project().readyAssetIds.includes(a.id)));
    assert.ok(project().assets.filter(a => a.kind === 'video').every(a => !project().readyAssetIds.includes(a.id)));
    assert.match(render('assets'), /返回修改方案/); assert.match(render('assets'), /确认方案，生成视频/);
  });
  check('shot-plan-uses-real-audio-and-optional-tail-frames', () => { assert.equal(project().shots.length, 6); assert.equal(videoPlanIssues(project()).length, 0); const mission=project().shots.find(s=>s.segmentId==='mission'); assert.deepEqual(mission.audioIds,['mission-voice']); assert.equal(mission.seconds,6); assert.equal(mission.lastFrameId,undefined); assert.ok(project().assets.filter(a=>a.kind==='audio').every(a=>a.seconds>0)); assert.ok(shotIssues(project(),{...mission,seconds:1}).some(x=>x.includes('短于配音'))); });
  assert.equal(confirmVideoPlan(id), true); advance(.4);
  check('video-shots-complete-in-stages', () => { const ready = project().assets.filter(a => a.kind === 'video' && project().readyAssetIds.includes(a.id)); assert.ok(ready.length > 0 && ready.length < 6); });
  advance(1);
  check('assembly-follows-video-production', () => { assert.equal(project().phase, 'assembling'); assert.equal(project().revision, 0); });
  advance(1);
  check('completion-uses-original-result-and-library', () => {
    assert.equal(project().phase, 'ready'); assert.equal(project().revision, 1);
    const conv = conversations.getState().conversations.find(c => c.id === convId);
    assert.equal(conv.messages.at(-1).type, 'courseware-result');
    const cw = library.getState().coursewares.find(c => c.id === project().coursewareId);
    assert.equal(cw.subject, '语文'); assert.equal(cw.isPublished, false); assert.equal(cw.videoProjectId, id);
    assert.match(cw.htmlContent, /wukong\/index.html/);
  });
  const oldHTML = project().resultMessages[0].html;
  store.getState().update(id, { publishedTargets: [{ id: 'resource-1', name: project().title, currentVersion: 'v1', urlLabel: '固定链接 1' }], publishedVersions: { v1: { publishTargetId: 'resource-1', isCurrentPublished: true } } });
  finishVideoProject(id, { ...project().composition, overlays: { badge: { offsetY: -35, scale: 1 } }, subtitles: false }, '调整播放设置');
  check('editing-creates-version-without-changing-published-version', () => {
    assert.equal(project().revision, 2); assert.equal(project().resultMessages[0].html, oldHTML);
    assert.match(project().resultMessages[1].html, /badgeOffset=-35/);
    assert.equal(project().publishedTargets[0].currentVersion, 'v1');
    assert.equal(project().publishedVersions.v1.isCurrentPublished, true);
    assert.equal(project().publishedVersions.v2, undefined);
  });
  conversations.setState(s => ({ conversations: s.conversations.filter(c => c.id !== convId) })); restoreVideoConversations();
  check('persisted-project-restores-conversation-and-results', () => {
    const conv = conversations.getState().conversations.find(c => c.id === convId);
    assert.equal(conv.messages.filter(m => m.type === 'courseware-result').length, 2);
    assert.equal(conv.messages.filter(m => m.type === 'video-courseware-workflow').length, 3);
  });
  const generic = createFixture('为三年级制作餐厅点餐英语视频互动课件', [], preferences);
  check('other-topic-builds-topic-plan-without-wukong-assets', () => {
    assert.equal(generic.subject, '英语'); assert.equal(generic.grade, '三年级');
    assert.equal(generic.id, 'generic'); assert.doesNotMatch(JSON.stringify(generic), /悟空|芭蕉扇|雨字头|wukong/);
    assert.ok(generic.speakers.some(s => s.name === '服务员')); assert.ok(generic.assets.every(a => !a.url));
  });
  const { runtimeSettings } = await server.ssrLoadModule('/src/components/VideoCourseware/runtime.ts');
  check('no-character-demand-does-not-insert-a-mascot', () => {
    const simple=createFixture('三年级天气讲解，只有旁白，不需要角色',[],preferences);
    assert.equal(simple.speakers.length,1);assert.equal(simple.speakers[0].role,'narrator');
    assert.ok(simple.segments.every(s=>s.speakerId==='narrator'));
    assert.ok(simple.assets.every(a=>a.id!=='character'));
  });
  check('resource-replacement-keeps-stable-asset-identity', () => {
    const adapted=runtimeSettings(project(),{...project().composition,assetOverrides:{character:'data:image/png;base64,YQ=='}});
    assert.equal(adapted.assetOverrides['assets/images/v3/C00_wukong_master.png'],'data:image/png;base64,YQ==');
    assert.equal(adapted.badgeOffset,-35);
  });
  const badVideo = project().assets.find(a => a.kind === 'video');
  store.getState().update(id, { assets: project().assets.map(a => a.id === badVideo.id ? { ...a, url: undefined } : a), readyAssetIds: project().readyAssetIds.filter(x => x !== badVideo.id) });
  store.getState().start(id, 'video'); advance(1);
  check('missing-media-fails-without-publishing-fake-success', () => { assert.equal(project().phase, 'failed'); assert.equal(project().revision, 2); assert.ok(project().readyAssetIds.length > 0); });
  store.getState().update(id, { assets: project().assets.map(a => a.id === badVideo.id ? badVideo : a) });
  store.getState().resume(id); advance(1); advance(1);
  check('retry-retains-completed-assets-and-finishes', () => { assert.equal(project().phase, 'ready'); assert.equal(project().revision, 3); });
  const preservedResult=project().resultMessages[0].html;
  const oldShot=project().shots.find(s=>s.segmentId==='opening');
  const voice=project().assets.find(a=>a.id==='outro-voice');
  store.getState().update(id,{assets:project().assets.map(a=>a.id===voice.id?{...a,seconds:8,text:'新的结束对白',revision:1}:a)});
  check('changed-voice-blocks-stale-video-job',()=>{assert.deepEqual(changedVideoIds(project()),['video-outro']);assert.equal(store.getState().start(id,'video'),false);});
  beginVideoPlanReview(id);
  check('old-video-message-does-not-show-new-planning-progress',()=>{assert.doesNotMatch(render('production'),/正在生成视频|正在整理视频方案|暂停生成/);});
  advance(1);
  check('only-dependent-shot-is-replanned',()=>{assert.deepEqual(project().shots.find(s=>s.id===oldShot.id),oldShot);const outro=project().shots.find(s=>s.segmentId==='outro');assert.equal(outro.seconds,8.6);assert.match(outro.prompt,/新的结束对白/);assert.equal(project().resultMessages[0].html,preservedResult);});
  check('interactive-overlay-does-not-invalidate-video',()=>{assert.deepEqual(changedVideoIds({...project(),assets:project().assets.map(a=>a.overlay?{...a,revision:99}:a)}),[]);});
  const oldRun=project().workflowRuns.production;
  assert.equal(confirmVideoPlan(id),true);
  check('new-production-message-follows-confirmation',()=>{const messages=conversations.getState().conversations.find(c=>c.id===convId).messages;const last=messages.at(-1);assert.equal(last.content.stage,'production');assert.notEqual(last.content.runId,oldRun);assert.match(messages.at(-2).content,/视频方案已确认/);});
  advance(1);advance(1);
  check('refresh-preserves-generation-chronology',()=>{const expected=conversations.getState().conversations.find(c=>c.id===convId).messages.filter(m=>m.type==='video-courseware-workflow'||m.type==='courseware-result').map(m=>m.type==='video-courseware-workflow'?m.content.stage:m.content.version);conversations.setState(s=>({conversations:s.conversations.filter(c=>c.id!==convId)}));restoreVideoConversations();const actual=conversations.getState().conversations.find(c=>c.id===convId).messages.filter(m=>m.type==='video-courseware-workflow'||m.type==='courseware-result').map(m=>m.type==='video-courseware-workflow'?m.content.stage:m.content.version);assert.deepEqual(actual,expected);});
  const segment=project().segments.find(s=>s.id==='mission');
  store.getState().update(id,synchronizeSegment(project(),{...segment,visual:'挥手后停留右侧',seconds:9,dialogue:'小朋友，我们出发吧。'}));
  check('segment-edit-propagates-to-prompt-duration-and-dialogue',()=>{const video=project().assets.find(a=>a.id==='video-mission');assert.equal(video.seconds,9);assert.equal(video.prompt,'挥手后停留右侧');assert.equal(project().assets.find(a=>a.id==='mission-voice').text,'小朋友，我们出发吧。');assert.equal(store.getState().start(id,'video'),false);});
  const {default: Images}=await server.ssrLoadModule('/src/components/Generator/ImageGenerationPanelV2.tsx');
  const {default: Audio}=await server.ssrLoadModule('/src/components/Generator/AudioGenerationPanel.tsx');
  check('shared-cards-preserve-ordinary-h5-defaults',()=>{const props={stage:{status:'completed',progress:100},isExpanded:true,onToggle:()=>{}};const imageHTML=renderToStaticMarkup(React.createElement(Images,props)),audioHTML=renderToStaticMarkup(React.createElement(Audio,props));assert.match(imageHTML,/主界面背景/);assert.match(audioHTML,/Apple/);assert.doesNotMatch(imageHTML+audioHTML,/悟空|视频方案/);});
  const allUrls = new Set([...wukongFixture.assets.flatMap(a => [a.url, a.poster]), ...exampleAttachments.map(a => a.url)].filter(Boolean));
  for (const url of allUrls) {
    assert.ok(existsSync(`public${url}`), url);
    const response = await fetch(`http://127.0.0.1:4186${url}`, { method: 'HEAD' });
    assert.equal(response.status, 200, url); assert.doesNotMatch(response.headers.get('content-type'), /text\/html/, url);
  }
  checks.push({ name: 'all-fixture-assets-serve-as-media', passed: true, files: allUrls.size });
  check('slow-work-has-bounded-demo-durations', () => { assert.ok(durations.assets >= 8000 && durations.video >= 12000); assert.ok(durations.assets + durations['video-plan'] + durations.video + durations.assembly < 45000); });
  check('obsolete-workbench-is-unreachable', () => {
    const source = readFileSync('src/pages/GeneratorPage.tsx', 'utf8');
    assert.doesNotMatch(source, /wk-home-entry|<WukongStudio/); assert.ok(!existsSync('src/components/WukongStudio/WukongStudio.tsx'));
  });
  writeFileSync('docs/video-platform-check.json', JSON.stringify({ environment: 'Node + Vite SSR (not browser acceptance)', checks }, null, 2));
  console.log(JSON.stringify({ passed: checks.length, checks: checks.map(c => c.name) }, null, 2));
} finally { await server.close(); }
