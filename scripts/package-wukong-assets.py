"""Copy the accepted V32 runtime without touching the source. Run with source dir argument."""
from pathlib import Path
import sys,re,shutil,hashlib,json,subprocess
src=Path(sys.argv[1]).resolve(); out=Path('public/wukong'); out.mkdir(parents=True,exist_ok=True)
queue=['index.html']; found=set();missing=[]
while queue:
 rel=queue.pop(0)
 if rel in found:continue
 p=src/rel
 if not p.is_file():missing.append(rel);continue
 found.add(rel)
 if p.suffix in ['.html','.js','.css']:
  s=p.read_text()
  vals=re.findall(r'''(?:src|href)=["']([^"']+)|url\(["']?([^\)'"\s]+)|["'](assets/[^"'`\s]+)''',s)
  for row in vals:
   name=next((v for v in row if v),'').split('?')[0]
   if not name or name.startswith(('http','data:','#')):continue
   if '$' in name or name.endswith('/'):
    parent=name.split('${')[0];base=src/parent
    if not base.is_dir():base=base.parent
    if base.is_dir():queue += [str(f.relative_to(src)) for f in base.iterdir() if f.is_file() and f.suffix in ['.png','.jpg','.webp','.woff','.ttf']]
   elif (src/name).is_file():queue.append(name)
# Preserve all V3 role/prop/weather variants referenced through string concatenation.
queue=[]
for d in ['assets/images/v3','assets/fonts']:
 found.update(str(p.relative_to(src)) for p in (src/d).iterdir() if p.suffix in ['.png','.jpg','.woff','.ttf'])
found.update(str(p.relative_to(src)) for p in (src/'assets/images').glob('page-*.png'))
# A previous E02 candidate is retained only for version comparison.
for rel in ['assets/audio/v9/W03_cave.mp3','assets/audio/v9/W04_glow.mp3','assets/audio/v16/P01.mp3','assets/audio/v16/P02.mp3','assets/audio/v16/P03.mp3','assets/video/v31/E02.mp4','assets/video/v31/E02-poster.jpg','assets/video/v32/E02-poster.jpg','assets/images/v21/finish-background.png']:
 if (src/rel).exists():found.add(rel)
manifest=[]
for rel in sorted(found):
 p=src/rel;t=out/rel;t.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,t)
 manifest.append({'file':rel,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
# Exact prompt text is reused, with clear stable names for the workbench.
prompts={
 'opening':'开场整段15秒_V22/05-生视频提示词.txt',
 'mission':'悟空说话镜头重生成_V30/M02_任务邀请/02-复制生视频提示词.txt',
 'move':'悟空说话镜头重生成_V30/C05_搬石邀请/02-复制生视频提示词.txt',
 'outro':'悟空说话镜头重生成_V30/E02_线索到手/02-复制生视频提示词.txt',
 'character':'视觉升级V3/逐条复制/C00_wukong_master.txt',
 'badge':'视觉升级V3/逐条复制/U05_rain_reward.txt',
 'cave':'视觉升级V3/逐条复制/G01_cave_daylight.txt',
 'rock':'视觉升级V3/逐条复制/P01_draggable_rock.txt',
 'audio':'旁白统一音色_完整重录文本_V14.md',
 'flight':'视频融合升级_V17/T01_点击出发_腾云到洞口/生视频提示词.txt',
 'panel':'四页精修与生图提示词_V18.md',
 'finish':'assets/images/v21/生成提示词.md',
}
texts={}
for key,rel in prompts.items():
 p=src/rel
 if p.exists():
  texts[key]=p.read_text(); t=out/'prompts'/f'{key}.txt';t.parent.mkdir(exist_ok=True);t.write_text(texts[key])
Path('src/data/wukong/prompts.json').write_text(json.dumps(texts,ensure_ascii=False,indent=2))
# Production reference frames and accepted screenshots.
for key,folder in [('mission','M02_任务邀请'),('move','C05_搬石邀请'),('outro','E02_线索到手')]:
 p=src/'悟空说话镜头重生成_V30'/folder/'01-上传首帧.png';t=out/'references'/f'{key}.png';t.parent.mkdir(exist_ok=True);shutil.copy2(p,t)
for name in ['成品-任务邀请.png','成品-识字.png','成品-说话与徽章.png','成品-成果.png']:
 p=src.parents[2]/'01-需求文档/AI教学视频生成需求/20260913-悟空共创复盘/配图'/name
 if p.exists():
  t=out/'reference-previews'/name;t.parent.mkdir(exist_ok=True);shutil.copy2(p,t)
(out/'source-manifest.json').write_text(json.dumps({'sourceVersion':'accepted-v32','originalsUnchanged':True,'files':manifest},ensure_ascii=False,indent=2))
print('Copied',len(manifest),'runtime/source files;',round(sum(v['bytes'] for v in manifest)/1024**2,1),'MiB;',len(texts),'exact prompts')
# The graph contains baseline fallback assets too; actual active video metadata is probed below.
metas={}
for key,rel in {'opening':'assets/video/v27/opening.mp4','mission':'assets/video/v31/M02.mp4','arrival':'assets/video/v19/flight-arrival.mp4','move':'assets/video/v31/C05.mp4','cave':'assets/video/v3/V02_cave_idle_v3.mp4','outro':'assets/video/v32/E02.mp4'}.items():
 if not (out/rel).exists():raise SystemExit('Missing active media '+rel)
 raw=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:stream=codec_type,width,height,duration','-of','json',str(out/rel)]))
 metas[key]={'file':rel,**raw}
Path('src/data/wukong/media.json').write_text(json.dumps(metas,ensure_ascii=False,indent=2))
print({k:float(v['format']['duration']) for k,v in metas.items()})
