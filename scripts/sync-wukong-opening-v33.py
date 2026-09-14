"""Sync only the approved V33 opening and prompt; leave historical media intact."""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess
import sys

repo = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1]).resolve()
package = source / '开场重制_V33_动作表演版'
manifest = json.loads((source / 'assets/video/v33/manifest.json').read_text())
files = []
for original, destination in [
    (source / 'assets/video/v33/opening.mp4', repo / 'public/wukong/assets/video/v33/opening.mp4'),
    (source / 'assets/video/v33/opening-poster.jpg', repo / 'public/wukong/assets/video/v33/opening-poster.jpg'),
    (package / '05-生视频提示词.txt', repo / 'public/wukong/prompts/opening-v33.txt'),
]:
    digest = hashlib.sha256(original.read_bytes()).hexdigest()
    if original.name == 'opening.mp4' and digest != manifest['deliverySha256']:
        raise SystemExit('Source opening does not match the approved V33 manifest')
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(original, destination)
    assert hashlib.sha256(destination.read_bytes()).hexdigest() == digest
    files.append({'source': str(original.relative_to(source)), 'file': str(destination.relative_to(repo)), 'sha256': digest})

# V33 deliberately reuses the original first frame, character, fan and narration.
for original, destination in [
    ('01-首帧.png', 'production-references/opening-first.png'),
    ('02-角色参考.png', 'assets/images/v3/C00_wukong_master.png'),
    ('03-扇子造型参考.png', 'production-references/opening-fan.png'),
]:
    assert hashlib.sha256((package / original).read_bytes()).digest() == hashlib.sha256((repo / 'public/wukong' / destination).read_bytes()).digest(), original

prompts_path = repo / 'src/data/wukong/prompts.json'
prompts = json.loads(prompts_path.read_text())
prompts['opening'] = (package / '05-生视频提示词.txt').read_text()
prompts_path.write_text(json.dumps(prompts, ensure_ascii=False, indent=2) + '\n')
probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=codec_type,codec_name,width,height,duration', '-of', 'json', str(repo / 'public/wukong/assets/video/v33/opening.mp4')]))
metadata_path = repo / 'src/data/wukong/media.json'
metadata = json.loads(metadata_path.read_text())
metadata['opening'] = {'file': 'assets/video/v33/opening.mp4', **probe}
metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n')
record = {'version': 'V33', 'sourceVideo': manifest['source'], 'files': files, 'probe': probe, 'cues': manifest['cues'], 'processing': manifest['processing'], 'preserved': 'V27 media, V32 index, lesson-v4, original prompt archive, other scene media and original source files'}
(repo / 'docs/wukong-opening-v33-sync.json').write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n')
print('V33 opening, poster and exact prompt synced; reference hashes match.')
