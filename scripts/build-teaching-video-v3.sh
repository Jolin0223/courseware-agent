#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
SOURCE_DIR="$ROOT_DIR/public/video-demo/v2"
OUTPUT_DIR="$ROOT_DIR/public/video-demo/v3"
AUDIO_DIR="$OUTPUT_DIR/audio"
WORK_DIR="$OUTPUT_DIR/work"
CAPTION_DIR="$WORK_DIR/captions"

mkdir -p "$WORK_DIR"
python3 "$ROOT_DIR/scripts/render-video-caption-overlays.py"

ffmpeg -y -v error -ss 5.2 -i "$SOURCE_DIR/S01-h3-768p-v2.mp4" -frames:v 1 "$WORK_DIR/S01-narrator-still-v3.jpg"
ffmpeg -y -v error -ss 3.0 -i "$SOURCE_DIR/S03-h3-768p-v2.mp4" -frames:v 1 "$WORK_DIR/S03-narrator-still-v3.jpg"
ffmpeg -y -v error -ss 3.2 -i "$SOURCE_DIR/S05-h3-768p-v2.mp4" -frames:v 1 "$WORK_DIR/S05-narrator-still-v3.jpg"

ffmpeg -y -v error \
  -loop 1 -framerate 24 -i "$WORK_DIR/S01-narrator-still-v3.jpg" \
  -i "$AUDIO_DIR/S01_narrator_v3.mp3" \
  -filter_complex "[0:v]scale=1344:768,zoompan=z='min(1.04,1+0.04*on/(10.655*24))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1344x768:fps=24[v];[1:a]aresample=48000,loudnorm=I=-18:TP=-2:LRA=7,aresample=48000[a]" \
  -map "[v]" -map "[a]" -t 10.655 -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart \
  "$WORK_DIR/S01-base-v3.mp4"

ffmpeg -y -v error \
  -i "$SOURCE_DIR/S02-h3-768p-v2.mp4" \
  -i "$AUDIO_DIR/S02_tiantian_v3.mp3" -i "$AUDIO_DIR/S02_tutu_v3.mp3" -i "$AUDIO_DIR/S02_keke_v3.mp3" \
  -filter_complex "[0:v]trim=start=0:end=7.199,setpts=PTS-STARTPTS,crop=560:315:20:150,scale=1344:768[v0];[0:v]trim=start=0.5:end=2.246,setpts=PTS-STARTPTS,crop=480:270:465:150,scale=1344:768[v1];[0:v]trim=start=1.2:end=3.667,setpts=PTS-STARTPTS,crop=460:259:850:150,scale=1344:768[v2];[v0][v1][v2]concat=n=3:v=1:a=0[v];[1:a]aresample=48000,loudnorm=I=-18:TP=-2:LRA=7,aresample=48000[a0];[2:a]aresample=48000,loudnorm=I=-18:TP=-2:LRA=7,aresample=48000,adelay=7399:all=1[a1];[3:a]aresample=48000,loudnorm=I=-18:TP=-2:LRA=7,aresample=48000,adelay=9145:all=1[a2];[a0][a1][a2]amix=inputs=3:duration=longest:normalize=0[a]" \
  -map "[v]" -map "[a]" -t 11.412 -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart \
  "$WORK_DIR/S02-base-v3.mp4"

ffmpeg -y -v error \
  -loop 1 -framerate 24 -i "$WORK_DIR/S03-narrator-still-v3.jpg" \
  -i "$AUDIO_DIR/S03_narrator_v3.mp3" \
  -filter_complex "[0:v]scale=1344:768,zoompan=z='min(1.035,1+0.035*on/(5.519*24))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1344x768:fps=24[v];[1:a]aresample=48000,loudnorm=I=-18:TP=-2:LRA=7,aresample=48000[a]" \
  -map "[v]" -map "[a]" -t 5.519 -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart \
  "$WORK_DIR/S03-base-v3.mp4"

ffmpeg -y -v error \
  -i "$SOURCE_DIR/S04-h3-768p-v2.mp4" \
  -i "$AUDIO_DIR/S04_tiantian_v3.mp3" -i "$AUDIO_DIR/S04_grandpa_v3.mp3" \
  -filter_complex "[0:v]trim=start=0:end=7.055,setpts=PTS-STARTPTS,crop=430:242:0:160,scale=1344:768[v0];[0:v]trim=start=4:end=6.551,setpts=PTS-STARTPTS,crop=560:315:760:110,scale=1344:768[v1];[v0][v1]concat=n=2:v=1:a=0[v];[1:a]aresample=48000,loudnorm=I=-18:TP=-2:LRA=7,aresample=48000[a0];[2:a]aresample=48000,loudnorm=I=-18:TP=-2:LRA=7,aresample=48000,adelay=7255:all=1[a1];[a0][a1]amix=inputs=2:duration=longest:normalize=0[a]" \
  -map "[v]" -map "[a]" -t 9.606 -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart \
  "$WORK_DIR/S04-base-v3.mp4"

ffmpeg -y -v error \
  -loop 1 -framerate 24 -i "$WORK_DIR/S05-narrator-still-v3.jpg" \
  -i "$SOURCE_DIR/S05-h3-768p-v2.mp4" \
  -i "$AUDIO_DIR/S05_narrator_v3.mp3" -i "$AUDIO_DIR/S05_grandpa_v3.mp3" \
  -filter_complex "[0:v]trim=duration=4.079,setpts=PTS-STARTPTS,scale=1344:768,zoompan=z='min(1.025,1+0.025*on/(4.079*24))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1344x768:fps=24[v0];[1:v]trim=start=3:end=8.407,setpts=PTS-STARTPTS,crop=650:366:650:70,scale=1344:768[v1];[v0][v1]concat=n=2:v=1:a=0[v];[2:a]aresample=48000,loudnorm=I=-18:TP=-2:LRA=7,aresample=48000[a0];[3:a]aresample=48000,loudnorm=I=-18:TP=-2:LRA=7,aresample=48000,adelay=4279:all=1[a1];[a0][a1]amix=inputs=2:duration=longest:normalize=0[a]" \
  -map "[v]" -map "[a]" -t 9.486 -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart \
  "$WORK_DIR/S05-base-v3.mp4"

ffmpeg -y -v error \
  -i "$SOURCE_DIR/S06-h3-768p-v2.mp4" \
  -i "$AUDIO_DIR/S06_tiantian_v3.mp3" -i "$AUDIO_DIR/S06_grandpa_v3.mp3" \
  -filter_complex "[0:v]trim=start=0:end=4.931,setpts=PTS-STARTPTS,crop=600:338:0:100,scale=1344:768[v0];[0:v]trim=start=0:end=4.6,setpts=PTS-STARTPTS,crop=650:366:650:70,scale=1344:768[v1];[0:v]trim=start=6:end=7.503,setpts=PTS-STARTPTS,scale=1344:768[v2];[v0][v1][v2]concat=n=3:v=1:a=0[v];[1:a]aresample=48000,loudnorm=I=-18:TP=-2:LRA=7,aresample=48000[a0];[2:a]aresample=48000,loudnorm=I=-18:TP=-2:LRA=7,aresample=48000,adelay=5131:all=1[a1];[a0][a1]amix=inputs=2:duration=longest:normalize=0[a]" \
  -map "[v]" -map "[a]" -t 11.034 -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart \
  "$WORK_DIR/S06-base-v3.mp4"

ffmpeg -y -v error -i "$WORK_DIR/S01-base-v3.mp4" -loop 1 -framerate 24 -i "$CAPTION_DIR/S01_0.png" \
  -filter_complex "[0:v][1:v]overlay=0:0:enable='between(t,0,10.655)'[v]" -map "[v]" -map 0:a -t 10.655 \
  -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a copy -movflags +faststart "$OUTPUT_DIR/S01-role-voiced-captioned-v3.mp4"

ffmpeg -y -v error -i "$WORK_DIR/S02-base-v3.mp4" -loop 1 -framerate 24 -i "$CAPTION_DIR/S02_0.png" -loop 1 -framerate 24 -i "$CAPTION_DIR/S02_1.png" -loop 1 -framerate 24 -i "$CAPTION_DIR/S02_2.png" \
  -filter_complex "[0:v][1:v]overlay=0:0:enable='between(t,0,7.20)'[v1];[v1][2:v]overlay=0:0:enable='between(t,7.40,8.95)'[v2];[v2][3:v]overlay=0:0:enable='between(t,9.15,11.412)'[v]" -map "[v]" -map 0:a -t 11.412 \
  -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a copy -movflags +faststart "$OUTPUT_DIR/S02-role-voiced-captioned-v3.mp4"

ffmpeg -y -v error -i "$WORK_DIR/S03-base-v3.mp4" -loop 1 -framerate 24 -i "$CAPTION_DIR/S03_0.png" \
  -filter_complex "[0:v][1:v]overlay=0:0:enable='between(t,0,5.519)'[v]" -map "[v]" -map 0:a -t 5.519 \
  -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a copy -movflags +faststart "$OUTPUT_DIR/S03-role-voiced-captioned-v3.mp4"

ffmpeg -y -v error -i "$WORK_DIR/S04-base-v3.mp4" -loop 1 -framerate 24 -i "$CAPTION_DIR/S04_0.png" -loop 1 -framerate 24 -i "$CAPTION_DIR/S04_1.png" \
  -filter_complex "[0:v][1:v]overlay=0:0:enable='between(t,0,7.05)'[v1];[v1][2:v]overlay=0:0:enable='between(t,7.25,9.606)'[v]" -map "[v]" -map 0:a -t 9.606 \
  -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a copy -movflags +faststart "$OUTPUT_DIR/S04-role-voiced-captioned-v3.mp4"

ffmpeg -y -v error -i "$WORK_DIR/S05-base-v3.mp4" -loop 1 -framerate 24 -i "$CAPTION_DIR/S05_0.png" -loop 1 -framerate 24 -i "$CAPTION_DIR/S05_1.png" \
  -filter_complex "[0:v][1:v]overlay=0:0:enable='between(t,0,4.08)'[v1];[v1][2:v]overlay=0:0:enable='between(t,4.28,9.486)'[v]" -map "[v]" -map 0:a -t 9.486 \
  -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a copy -movflags +faststart "$OUTPUT_DIR/S05-role-voiced-captioned-v3.mp4"

ffmpeg -y -v error -i "$WORK_DIR/S06-base-v3.mp4" -loop 1 -framerate 24 -i "$CAPTION_DIR/S06_0.png" -loop 1 -framerate 24 -i "$CAPTION_DIR/S06_1.png" \
  -filter_complex "[0:v][1:v]overlay=0:0:enable='between(t,0,4.93)'[v1];[v1][2:v]overlay=0:0:enable='between(t,5.13,11.034)'[v]" -map "[v]" -map 0:a -t 11.034 \
  -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a copy -movflags +faststart "$OUTPUT_DIR/S06-role-voiced-captioned-v3.mp4"

for shot_id in S01 S02 S03 S04 S05 S06; do
  ffmpeg -y -v error -ss 0.5 -i "$OUTPUT_DIR/${shot_id}-role-voiced-captioned-v3.mp4" -frames:v 1 "$OUTPUT_DIR/${shot_id}-poster-v3.jpg"
done

ffmpeg -y -v error \
  -i "$OUTPUT_DIR/S01-role-voiced-captioned-v3.mp4" \
  -i "$OUTPUT_DIR/S02-role-voiced-captioned-v3.mp4" \
  -i "$OUTPUT_DIR/S03-role-voiced-captioned-v3.mp4" \
  -i "$OUTPUT_DIR/S04-role-voiced-captioned-v3.mp4" \
  -i "$OUTPUT_DIR/S05-role-voiced-captioned-v3.mp4" \
  -i "$OUTPUT_DIR/S06-role-voiced-captioned-v3.mp4" \
  -filter_complex "[0:v]settb=AVTB,setpts=PTS-STARTPTS[v0];[1:v]settb=AVTB,setpts=PTS-STARTPTS[v1];[2:v]settb=AVTB,setpts=PTS-STARTPTS[v2];[3:v]settb=AVTB,setpts=PTS-STARTPTS[v3];[4:v]settb=AVTB,setpts=PTS-STARTPTS[v4];[5:v]settb=AVTB,setpts=PTS-STARTPTS[v5];[v0][v1]xfade=transition=fade:duration=0.25:offset=10.405[x1];[x1][v2]xfade=transition=fade:duration=0.25:offset=21.567[x2];[x2][v3]xfade=transition=fade:duration=0.25:offset=26.836[x3];[x3][v4]xfade=transition=fade:duration=0.25:offset=36.192[x4];[x4][v5]xfade=transition=fade:duration=0.25:offset=45.428[v];[0:a][1:a]acrossfade=d=0.25[a1];[a1][2:a]acrossfade=d=0.25[a2];[a2][3:a]acrossfade=d=0.25[a3];[a3][4:a]acrossfade=d=0.25[a4];[a4][5:a]acrossfade=d=0.25[a]" \
  -map "[v]" -map "[a]" -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart \
  "$OUTPUT_DIR/full-story-role-voiced-captioned-v3.mp4"

ffmpeg -y -v error -ss 1 -i "$OUTPUT_DIR/full-story-role-voiced-captioned-v3.mp4" -frames:v 1 "$OUTPUT_DIR/full-story-poster-v3.jpg"

echo "Built $OUTPUT_DIR/full-story-role-voiced-captioned-v3.mp4"
