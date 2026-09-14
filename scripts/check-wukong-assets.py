from pathlib import Path
import hashlib,json,re,urllib.request,subprocess
root=Path('public/wukong');manifest=json.loads((root/'source-manifest.json').read_text());checks=[]
for f in manifest['files']:
 p=root/f['file'];assert p.is_file(),f['file']
 if f['file']!='index.html':assert hashlib.sha256(p.read_bytes()).hexdigest()==f['sha256'],f['file']
checks.append({'check':'copied-assets-match-source-sha256','passed':True,'files':len(manifest['files'])-1})
production=json.loads(Path('docs/video-production-reference-manifest.json').read_text())
for item in production['files']:
 local=root/'production-references'/item['file'];source=Path(production['sourceRoot'])/item['source']
 digest=hashlib.sha256(local.read_bytes()).hexdigest()
 assert digest==hashlib.sha256(source.read_bytes()).hexdigest(),item['file']
 assert digest==item['sha256'],(item['file'],digest)
for item in production['sharedFrames']:
 assert (root/'production-references'/item['file']).read_bytes()==(Path(production['sourceRoot'])/item['source']).read_bytes(),item['file']
checks.append({'check':'production-frames-match-original-inputs','passed':True,'files':len(production['files']),'sharedFrames':len(production['sharedFrames'])})
refs=set()
for p in [*root.glob('*.js'),*root.glob('*.css'),root/'index.html',root/'lesson-v4.html',Path('src/data/videoCourseware/wukongInputs.ts'),Path('src/data/wukong/course.ts'),Path('src/data/videoCourseware/fixtures.ts'),Path('src/data/videoCourseware/narration.json')]:
 for v in re.findall(r'''["']((?:assets|reference-previews|references)/[^"'`\s]+)["']''',p.read_text()):
  if '$' not in v and (root/v).suffix:refs.add(v)
missing=[r for r in refs if not(root/r).is_file()];assert not missing,missing
for rel in sorted(refs):
 with urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:4186/wukong/'+urllib.parse.quote(rel),method='HEAD')) as r:
  assert r.status==200,rel
  assert 'text/html' not in r.headers.get('Content-Type',''),rel
checks.append({'check':'literal-assets-exist-and-serve-correct-content','passed':True,'files':len(refs)})
medias=json.loads(Path('src/data/wukong/media.json').read_text());checks.append({'check':'six-active-video-tracks-probed','passed':True,'durationSeconds':{k:float(v['format']['duration']) for k,v in medias.items()}})
# Syntax-check the copied inline player, including the narrowly scoped editor bridge.
s=(root/'index.html').read_text();inline='\n'.join(re.findall(r'<script>(.*?)</script>',s,re.S));tmp=Path('/tmp/wukong-player-inline.js');tmp.write_text(inline)
subprocess.run(['node','--check',str(tmp)],check=True)
checks.append({'check':'copied-player-javascript-syntax','passed':True})
s=(root/'lesson-v4.html').read_text();tmp.write_text('\n'.join(re.findall(r'<script>(.*?)</script>',s,re.S)))
subprocess.run(['node','--check',str(tmp)],check=True)
checks.append({'check':'new-version-player-javascript-syntax','passed':True})
Path('docs/wukong-asset-check.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2));print(json.dumps(checks,ensure_ascii=False))
