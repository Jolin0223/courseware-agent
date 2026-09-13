#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
V3_DIR="$ROOT_DIR/public/video-demo/v3"
OUTPUT_DIR="$ROOT_DIR/public/video-demo/v4"
AUDIO_DIR="$V3_DIR/audio"
WORK_DIR="$OUTPUT_DIR/work"
CAPTION_DIR="$WORK_DIR/captions"

mkdir -p "$WORK_DIR"
VIDEO_CAPTION_VERSION=v4 python3 "$ROOT_DIR/scripts/render-video-caption-overlays.py"

# The two narration-only shots remain deterministic motion shots: no character
# is allowed to move their mouth while the off-screen explanation is playing.
cp "$V3_DIR/S01-role-voiced-captioned-v3.mp4" "$OUTPUT_DIR/S01-role-voiced-captioned-v4.mp4"
cp "$V3_DIR/S03-role-voiced-captioned-v3.mp4" "$OUTPUT_DIR/S03-role-voiced-captioned-v4.mp4"

# S02: preserve the full three-person composition. Each line comes from a
# separately generated one-speaker action clip; a frozen 0.2 s beat separates
# the turns without making another character appear to speak.
ffmpeg -y -v error \
  -i "$OUTPUT_DIR/S02A_tiantian-h3-768p-v4.mp4" \
  -i "$OUTPUT_DIR/S02B_tutu-h3-768p-v4.mp4" \
  -i "$OUTPUT_DIR/S02C_keke-h3-768p-v4.mp4" \
  -i "$AUDIO_DIR/S02_tiantian_v3.mp3" -i "$AUDIO_DIR/S02_tutu_v3.mp3" -i "$AUDIO_DIR/S02_keke_v3.mp3" \
  -filter_complex "[0:v]trim=start=0.15:duration=7.199,setpts=PTS-STARTPTS,fps=24,scale=1344:768,tpad=stop_mode=clone:stop_duration=0.2[v0];[1:v]trim=start=1.1:duration=1.546,setpts=PTS-STARTPTS,fps=24,scale=1344:768,tpad=stop_mode=clone:stop_duration=0.2[v1];[2:v]trim=start=1.8:duration=2.267,setpts=PTS-STARTPTS,fps=24,scale=1344:768[v2];[v0][v1][v2]concat=n=3:v=1:a=0[v];[3:a]aresample=48000,loudnorm=I=-18:TP=-2:LRA=7,aresample=48000[a0];[4:a]aresample=48000,loudnorm=I=-18:TP=-2:LRA=7,aresample=48000,adelay=7399:all=1[a1];[5:a]aresample=48000,loudnorm=I=-18:TP=-2:LRA=7,aresample=48000,adelay=9145:all=1[a2];[a0][a1][a2]amix=inputs=3:duration=longest:normalize=0[a]" \
  -map "[v]" -map "[a]" -t 11.412 -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart \
  "$WORK_DIR/S02-base-v4.mp4"

# S04: retain all four characters in frame. Tiantian and Grandpa are generated
# separately so only the current speaker has mouth motion.
ffmpeg -y -v error \
  -i "$OUTPUT_DIR/S04A_tiantian-h3-768p-v4.mp4" \
  -i "$OUTPUT_DIR/S04B_grandpa-h3-768p-v4.mp4" \
  -i "$AUDIO_DIR/S04_tiantian_v3.mp3" -i "$AUDIO_DIR/S04_grandpa_v3.mp3" \
  -filter_complex "[0:v]trim=start=0.15:duration=7.055,setpts=PTS-STARTPTS,fps=24,scale=1344:768,tpad=stop_mode=clone:stop_duration=0.2[v0];[1:v]trim=start=0.25:duration=2.351,setpts=PTS-STARTPTS,fps=24,scale=1344:768[v1];[v0][v1]concat=n=2:v=1:a=0[v];[2:a]aresample=48000,loudnorm=I=-18:TP=-2:LRA=7,aresample=48000[a0];[3:a]aresample=48000,loudnorm=I=-18:TP=-2:LRA=7,aresample=48000,adelay=7255:all=1[a1];[a0][a1]amix=inputs=2:duration=longest:normalize=0[a]" \
  -map "[v]" -map "[a]" -t 9.606 -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart \
  "$WORK_DIR/S04-base-v4.mp4"

# S05 begins with off-screen narration on a still image. The new H3 action clip
# then keeps both characters visible while Grandpa speaks and Tiantian listens.
ffmpeg -y -v error -ss 0.8 -i "$OUTPUT_DIR/S05B_grandpa-h3-768p-v4.mp4" -frames:v 1 "$WORK_DIR/S05-narrator-still-v4.jpg"
ffmpeg -y -v error \
  -loop 1 -framerate 24 -i "$WORK_DIR/S05-narrator-still-v4.jpg" \
  -i "$OUTPUT_DIR/S05B_grandpa-h3-768p-v4.mp4" \
  -i "$AUDIO_DIR/S05_narrator_v3.mp3" -i "$AUDIO_DIR/S05_grandpa_v3.mp3" \
  -filter_complex "[0:v]trim=duration=4.079,setpts=PTS-STARTPTS,scale=1344:768[v0];[1:v]trim=start=0.25:duration=5.207,setpts=PTS-STARTPTS,fps=24,scale=1344:768[v1];[v0]tpad=stop_mode=clone:stop_duration=0.2[v0p];[v0p][v1]concat=n=2:v=1:a=0[v];[2:a]aresample=48000,loudnorm=I=-18:TP=-2:LRA=7,aresample=48000[a0];[3:a]aresample=48000,loudnorm=I=-18:TP=-2:LRA=7,aresample=48000,adelay=4279:all=1[a1];[a0][a1]amix=inputs=2:duration=longest:normalize=0[a]" \
  -map "[v]" -map "[a]" -t 9.486 -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart \
  "$WORK_DIR/S05-base-v4.mp4"

# S06 uses the same intact two-person composition for both turns.
ffmpeg -y -v error \
  -i "$OUTPUT_DIR/S06A_tiantian-h3-768p-v4.mp4" \
  -i "$OUTPUT_DIR/S06B_grandpa-h3-768p-v4.mp4" \
  -i "$AUDIO_DIR/S06_tiantian_v3.mp3" -i "$AUDIO_DIR/S06_grandpa_v3.mp3" \
  -filter_complex "[0:v]trim=start=0.05:duration=4.931,setpts=PTS-STARTPTS,fps=24,scale=1344:768,tpad=stop_mode=clone:stop_duration=0.2[v0];[1:v]trim=start=0.25:duration=5.903,setpts=PTS-STARTPTS,fps=24,scale=1344:768[v1];[v0][v1]concat=n=2:v=1:a=0[v];[2:a]aresample=48000,loudnorm=I=-18:TP=-2:LRA=7,aresample=48000[a0];[3:a]aresample=48000,loudnorm=I=-18:TP=-2:LRA=7,aresample=48000,adelay=5131:all=1[a1];[a0][a1]amix=inputs=2:duration=longest:normalize=0[a]" \
  -map "[v]" -map "[a]" -t 11.034 -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart \
  "$WORK_DIR/S06-base-v4.mp4"

ffmpeg -y -v error -i "$WORK_DIR/S02-base-v4.mp4" -loop 1 -framerate 24 -i "$CAPTION_DIR/S02_0.png" -loop 1 -framerate 24 -i "$CAPTION_DIR/S02_1.png" -loop 1 -framerate 24 -i "$CAPTION_DIR/S02_2.png" \
  -filter_complex "[0:v][1:v]overlay=0:0:enable='between(t,0,7.20)'[v1];[v1][2:v]overlay=0:0:enable='between(t,7.40,8.95)'[v2];[v2][3:v]overlay=0:0:enable='between(t,9.15,11.412)'[v]" -map "[v]" -map 0:a -t 11.412 \
  -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a copy -movflags +faststart "$OUTPUT_DIR/S02-role-voiced-captioned-v4.mp4"

ffmpeg -y -v error -i "$WORK_DIR/S04-base-v4.mp4" -loop 1 -framerate 24 -i "$CAPTION_DIR/S04_0.png" -loop 1 -framerate 24 -i "$CAPTION_DIR/S04_1.png" \
  -filter_complex "[0:v][1:v]overlay=0:0:enable='between(t,0,7.05)'[v1];[v1][2:v]overlay=0:0:enable='between(t,7.25,9.606)'[v]" -map "[v]" -map 0:a -t 9.606 \
  -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a copy -movflags +faststart "$OUTPUT_DIR/S04-role-voiced-captioned-v4.mp4"

ffmpeg -y -v error -i "$WORK_DIR/S05-base-v4.mp4" -loop 1 -framerate 24 -i "$CAPTION_DIR/S05_0.png" -loop 1 -framerate 24 -i "$CAPTION_DIR/S05_1.png" \
  -filter_complex "[0:v][1:v]overlay=0:0:enable='between(t,0,4.08)'[v1];[v1][2:v]overlay=0:0:enable='between(t,4.28,9.486)'[v]" -map "[v]" -map 0:a -t 9.486 \
  -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a copy -movflags +faststart "$OUTPUT_DIR/S05-role-voiced-captioned-v4.mp4"

ffmpeg -y -v error -i "$WORK_DIR/S06-base-v4.mp4" -loop 1 -framerate 24 -i "$CAPTION_DIR/S06_0.png" -loop 1 -framerate 24 -i "$CAPTION_DIR/S06_1.png" \
  -filter_complex "[0:v][1:v]overlay=0:0:enable='between(t,0,4.93)'[v1];[v1][2:v]overlay=0:0:enable='between(t,5.13,11.034)'[v]" -map "[v]" -map 0:a -t 11.034 \
  -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a copy -movflags +faststart "$OUTPUT_DIR/S06-role-voiced-captioned-v4.mp4"

for shot_id in S01 S02 S03 S04 S05 S06; do
  ffmpeg -y -v error -ss 0.5 -i "$OUTPUT_DIR/${shot_id}-role-voiced-captioned-v4.mp4" -frames:v 1 "$OUTPUT_DIR/${shot_id}-final-poster-v4.jpg"
done

ffmpeg -y -v error \
  -i "$OUTPUT_DIR/S01-role-voiced-captioned-v4.mp4" \
  -i "$OUTPUT_DIR/S02-role-voiced-captioned-v4.mp4" \
  -i "$OUTPUT_DIR/S03-role-voiced-captioned-v4.mp4" \
  -i "$OUTPUT_DIR/S04-role-voiced-captioned-v4.mp4" \
  -i "$OUTPUT_DIR/S05-role-voiced-captioned-v4.mp4" \
  -i "$OUTPUT_DIR/S06-role-voiced-captioned-v4.mp4" \
  -filter_complex "[0:v]settb=AVTB,setpts=PTS-STARTPTS[v0];[0:a]asetpts=PTS-STARTPTS[a0];[1:v]settb=AVTB,setpts=PTS-STARTPTS[v1];[1:a]asetpts=PTS-STARTPTS[a1];[2:v]settb=AVTB,setpts=PTS-STARTPTS[v2];[2:a]asetpts=PTS-STARTPTS[a2];[3:v]settb=AVTB,setpts=PTS-STARTPTS[v3];[3:a]asetpts=PTS-STARTPTS[a3];[4:v]settb=AVTB,setpts=PTS-STARTPTS[v4];[4:a]asetpts=PTS-STARTPTS[a4];[5:v]settb=AVTB,setpts=PTS-STARTPTS[v5];[5:a]asetpts=PTS-STARTPTS[a5];[v0][a0][v1][a1][v2][a2][v3][a3][v4][a4][v5][a5]concat=n=6:v=1:a=1[v][a]" \
  -map "[v]" -map "[a]" -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart \
  "$OUTPUT_DIR/full-story-role-voiced-captioned-v4.mp4"

ffmpeg -y -v error -ss 1 -i "$OUTPUT_DIR/full-story-role-voiced-captioned-v4.mp4" -frames:v 1 "$OUTPUT_DIR/full-story-poster-v4.jpg"

echo "Built $OUTPUT_DIR/full-story-role-voiced-captioned-v4.mp4"
