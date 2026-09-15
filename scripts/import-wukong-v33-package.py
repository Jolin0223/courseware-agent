"""Import only product-relevant V33 assets. Existing media must be byte-identical."""
import json, hashlib, shutil, re, sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
pack=Path(sys.argv[1])
manifest=json.loads((pack/'90_说明与核验/资源清单.json').read_text())['assets']
index=json.loads((pack/'80_最终提示词/资源与提示词映射.json').read_text())
byid={a['id']:a for a in manifest}; prompts={a['resource_id']:a for a in index['assets']}; audit=[]
ids=['cover','opening','mission','arrival','move','move','discover','learn','trace','quiz1','quiz2','outro','finish']
scene=lambda name:ids[int(name[:2])-1]
def scenes(a):return list(dict.fromkeys(scene(s) for s in a['scenes']))
def copy(source,target):
 data=(pack/source).read_bytes(); sha=hashlib.sha256(data).hexdigest(); dest=root/'public/wukong'/target
 if dest.exists() and hashlib.sha256(dest.read_bytes()).hexdigest()!=sha:raise RuntimeError('Refusing overwrite: '+str(dest))
 dest.parent.mkdir(parents=True,exist_ok=True)
 if not dest.exists():dest.write_bytes(data)
 audit.append({'source':source,'target':target,'sha256':sha});return '/wukong/'+target
def prompt(a):
 entry=prompts[a['id']]; text=(pack/entry['prompt']).read_text().strip()
 if text.startswith('记录状态：'):text=text.split('\n\n',1)[1]
 return text,entry['status']
# Verify all declared delivered media, including excluded backup files; import no backups.
for a in manifest:
 if hashlib.sha256((pack/a['package_path']).read_bytes()).hexdigest()!=a['sha256']:raise RuntimeError('Bad package hash: '+a['id'])
# Existing runtime media are verified; only the new left-looking sprite needs copying.
for a in manifest:
 if a['source_path'].startswith('assets/') and '#' not in a['source_path']:copy(a['package_path'],a['source_path'])
# Classroom assets, excluding button skins, title decorations, font/sound/track backups.
imageIds={1:'cave',2:'character',3:'hero-discover',4:'hero-encourage',5:'hero-celebrate',6:'rock',7:'learning-panel',8:'badge',16:'hero-move-left',17:'cover',18:'cover-hero',19:'mission-background',21:'rain-card',22:'panel',23:'finish',24:'finish-hero',25:'weather-snow',26:'weather-thunder',27:'weather-clouds',28:'weather-fog'}
assets=[]
for num,aid in imageIds.items():
 a=byid[f'R{num:03}'];p,status=prompt(a)
 assets.append(dict(id=aid,kind='image',name=a['name'].split('_')[0],url='/wukong/'+a['source_path'],prompt=p,promptStatus=status,segmentIds=scenes(a),role='角色形象' if '悟空' in a['name'] else '场景素材',**({'overlay':{'sceneId':'outro'}} if aid=='badge' else {})))
# Genuine supplied generation inputs. Do not call fallback posters original input frames.
refs=[('frame-opening','O00/输入参考/01-首帧.png','火焰山 · 起始画面',['opening']),('opening-character','O00/输入参考/02-角色参考.png','开场悟空 · 角色参考',['opening']),('opening-fan','O00/输入参考/03-扇子造型参考.png','芭蕉扇造型',['opening']),('frame-mission','M02/输入参考/01-上传首帧.png','任务邀请 · 起始画面',['mission']),('frame-arrival','T01/输入参考/首帧.png','腾云出发 · 起始画面',['arrival']),('frame-arrival-end','T01/输入参考/尾帧.png','腾云段 · 结束画面',['arrival']),('frame-move','C05/输入参考/01-上传首帧.png','搬石邀请 · 起始画面',['move']),('frame-outro','E02/输入参考/01-上传首帧.png','线索到手 · 起始画面',['outro'])]
for aid,path,name,sids in refs:
 url=copy('80_最终提示词/03_生视频/'+path,'production-references/v33-package/'+aid+'.png')
 assets.append(dict(id=aid,kind='image',name=name,url=url,prompt='',promptStatus='已留存生成输入，无独立生图提示词',segmentIds=sids,role='视频参考图'))
videoMap={'O00':('video-opening','R029','R030','frame-opening'),'M02':('video-mission','R032','R033','frame-mission'),'T01':('video-arrival','R035','R036','frame-arrival'),'C05':('video-move','R038','R039','frame-move'),'E02':('video-outro','R041','R042','frame-outro'),'V02':('video-cave','R015','R001','cave')}
for code,(aid,rid,poster,first) in videoMap.items():
 a=byid[rid];sids=scenes(a)
 p=(pack/f'80_最终提示词/03_生视频/{code}/01_生视频提示词.txt').read_text().strip()
 if code=='T01':
  p='连续成片由 T01 腾云、S02 到达洞口、S03 发现发光石头三段剪辑衔接。以下分别是已采用源视频的提示词。S02/S03 原始 B0/B1 首尾图未完整留存，不以 T01 尾帧充当整条成片尾帧。\n\n'+'\n\n'.join(f'【{c}】\n'+(pack/f'80_最终提示词/03_生视频/{c}/01_生视频提示词.txt').read_text().strip() for c in ['T01','S02','S03'])
 assets.append(dict(id=aid,kind='video',name=a['name'].split('_')[0],url='/wukong/'+a['source_path'],poster='/wukong/'+byid[poster]['source_path'],prompt=p,sourcePrompt=p,segmentIds=sids,seconds=a['duration'],role='环境视频' if code=='V02' else '场景视频',videoInputs={'firstFrameId':first,'references':[{'assetId':'opening-character','purpose':'保持角色形象一致','range':'整段'},{'assetId':'opening-fan','purpose':'想象中的目标，不实际获得扇子','range':'约5.5—9.5秒'}] if code=='O00' else ([{'assetId':'frame-arrival-end','purpose':'T01 源视频尾帧，仅用于腾云段','range':'T01 段结束'}] if code=='T01' else []),'audioStarts':{'O00':[.2,4.95,9.9],'M02':[.2],'T01':[7.3,12.5],'C05':[.6],'E02':[.2],'V02':[]}[code]}))
voiceIds={62:'mission-voice',63:'arrival-cave',64:'arrival-glow',65:'move-voice',66:'discover-voice',67:'quiz1-voice',68:'quiz2-voice',69:'outro-voice',70:'cover-voice'}
for n in list(range(44,61))+list(range(62,71)):
 a=byid[f'R{n:03}'];aid='narration-P'+str(n-43).zfill(2) if n<=60 else voiceIds[n];p,status=prompt(a)
 v=dict(id=aid,kind='audio',name=a['name'].replace('_',' · '),url='/wukong/'+a['source_path'],text=a['text'],prompt=p,promptStatus=status,segmentIds=scenes(a),seconds=a['duration'],audioUse='video' if n in [44,45,46,62,63,64,65,69] else 'interaction')
 if n!=70:v['speakerId']='narrator' if n<=60 else 'hero'
 assets.append(v)
# Directly transcribe the six rows in the supplied outline; retain product scene grouping.
text=(pack/'01_第一关真实教学大纲.md').read_text();chapterRows=[line for line in text.splitlines() if re.match(r'\| [1-6]\. ',line)]
chapters=[]
for i,line in enumerate(chapterRows):
 cells=[c.strip() for c in line.strip('|').split('|')];nums=re.findall(r'(\d{2})',cells[2]);chapters.append({'id':'chapter-'+str(i+1),'title':re.sub(r'^\d\. ','',cells[0]),'content':cells[1],'segmentIds':list(dict.fromkeys(ids[int(n)-1] for n in nums))})
# Describe the actual screen and actions in product language; keep production IDs in prompts.
sceneContents={
 'cover':'展示《悟空借芭蕉扇》的封面、悟空和“石头里的汉字”主题。播放现有开场录音，点击“开始闯关”进入故事。',
 'opening':'用15秒连续视频讲述悟空被火焰山挡住、想借芭蕉扇、需要闯过汉字关的故事。依次播放三句原旁白并显示字幕；芭蕉扇只出现在悟空的想象中，此时尚未获得真扇。',
 'mission':'悟空站在云上发出闯关邀请，旁边展示“移石识字、点石学写、答题闯关”三张任务卡。说完后安静停留，点击任务卡可听对应说明，点击出发继续。',
 'arrival':'连续播放腾云、到达洞口、发现发光石头三个片段，共17.784秒。悟空说“终于找到洞口了！可入口又被石头挡住了。”随后发现石头发光，自然引出搬石任务。',
 'move':'先播放6秒搬石邀请，悟空请大家帮忙搬开石头。随后进入可拖动的洞口画面：悟空看向左侧石头，学生拖开石头，逐渐露出里面的“雨”字；完成后进入认字。',
 'discover':'搬开石头后，显示完整的“雨”字卡与悟空。悟空发现石头后藏着“雨”字，学生点击汉字进入学习。',
 'learn':'展示雨 yǔ、雪 xuě、雷 léi、霞 xiá、雾 wù五个字及天气图，点击字卡听读音和说明。先认识“雨”是独体字，再以“雪”示范雨字头，观察雨字头的变化，理解它多与降水、天气有关。',
 'trace':'在田字格中描写“雨、雪”，听取描写指导后，观察浅色范字并描写。由老师观察书写并确认完成，再进入答题闯关。',
 'quiz1':'题目：哪个词语里，藏着“雨字头”的字？选项：雷电／降水／大风。正确答案：雷电。点击选项后获得对应反馈，选错可以重试；区分字形偏旁与词义，不能因为“降水”和水有关就认定有雨字头。',
 'quiz2':'题目：雨字头的字，大多和什么有关？选项：降水、天气／心情、想法／金属、工具。正确答案：降水、天气。点击选项后听反馈，选错可复习雨字头说明并重试，答对后获得线索。',
 'outro':'悟空播放6秒庆祝视频并说出获得线索的台词。台词说到线索时显示“雨”字徽章，再进入本关总结。此时获得的是找扇线索，还没有拿到真正的芭蕉扇。',
 'finish':'展示本关完成的庆祝画面与悟空，回顾雪、雷、霞、雾及雨字头的含义，并提供复习与重新闯关入口。强调找到了芭蕉扇线索，不提前宣告已经借到真扇。',
}
previews={}
for i,sid in enumerate(ids):
 if i==4:continue # merged move preview shows actual draggable scene, not the invitation's poster
 f=next((pack/'90_说明与核验/场景预览').glob(f'{i+1:02}_*.png'));previews[sid]=copy(str(f.relative_to(pack)),'scene-previews/v33-package/'+sid+'.png')
goals='面向小学一年级。认识“雨”是独体字，观察“雪”等字中的雨字头；认读雨、雪、雷、霞、雾及其词义；理解雨字头多和降水、天气现象有关，区分词义与字形；在田字格描写雨、雪，由老师观察确认。'
(root/'src/data/videoCourseware/wukongPackage.json').write_text(json.dumps({'version':'V33_20260915','goals':goals,'chapters':chapters,'sceneContents':sceneContents,'assets':assets,'previews':previews},ensure_ascii=False,indent=2)+'\n')
excluded=[{'id':a['id'],'name':a['name'],'reason':'播放器美术或音效/字体，不作为独立生成任务' if '#' not in a['source_path'] and a['id']!='R061' else '剪辑拆轨/时间轴备份，不重复生成或叠加'} for a in manifest if a['id'] not in {f'R{n:03}' for n in imageIds}|set(v[1] for v in videoMap.values())|{f'R{n:03}' for n in list(range(44,61))+list(range(62,71))}]
(root/'docs/wukong-v33-package-import.json').write_text(json.dumps({'package':pack.name,'verifiedPackageAssets':len(manifest),'productAssets':len(assets),'copies':audit,'excludedFromEditor':excluded},ensure_ascii=False,indent=2)+'\n')
print(len(chapters),'chapters',len(sceneContents),'scenes',len(assets),'editor assets;',len(audit),'hash-verified files')
