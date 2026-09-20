#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="${0:A:h}"
REPO_DIR="${SCRIPT_DIR:h}"
ASSET_DIR="$REPO_DIR/public/mechanical-os-ugc"
WORK_DIR="$(mktemp -d -t mechanical-os-ugc-audio.XXXXXX)"
trap 'rm -rf "$WORK_DIR"' EXIT

mix_variant() {
  local stem="$1"
  local bed="$2"
  local voice_normalized="$WORK_DIR/${stem}-voice-normalized.wav"

  ffmpeg -y -hide_banner -loglevel error \
    -i "$ASSET_DIR/${stem}-elevenlabs.mp3" \
    -af 'loudnorm=I=-16:LRA=7:TP=-1.5' \
    -ar 48000 -ac 2 "$voice_normalized"

  ffmpeg -y -hide_banner -loglevel error \
    -i "$voice_normalized" \
    -i "$ASSET_DIR/$bed" \
    -filter_complex \
      '[1:a]volume=0.22,highpass=f=55,lowpass=f=12000[music];[music][0:a]sidechaincompress=threshold=0.02:ratio=8:attack=15:release=350:makeup=1[ducked];[0:a][ducked]amix=inputs=2:duration=first:weights=1\ 0.7:normalize=0,loudnorm=I=-14:LRA=7:TP=-1.5[out]' \
    -map '[out]' -ar 48000 -ac 2 "$ASSET_DIR/${stem}-mix.wav"
}

mix_variant hero mechanical-os-suno-bed-v1.m4a
mix_variant proof mechanical-os-suno-bed-v1.m4a
mix_variant explainer mechanical-os-suno-bed-v2.m4a

for mix in "$ASSET_DIR"/*-mix.wav; do
  ffprobe -v error -show_entries format=filename,duration,size -of json "$mix"
done
