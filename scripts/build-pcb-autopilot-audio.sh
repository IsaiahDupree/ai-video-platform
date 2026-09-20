#!/bin/zsh
set -euo pipefail

project_dir="${0:A:h:h}"
output_dir="$project_dir/public/pcb-autopilot/audio"
work_dir="$(mktemp -d /tmp/pcb-autopilot-audio.XXXXXX)"
trap 'rm -rf "$work_dir"' EXIT

mkdir -p "$output_dir"

lines=(
  "The most important feature in our AI PCB agent is not generation. It is the ability to stop."
  "This is a real KiCad fixture with two different nets crossing. It is deliberately invalid."
  "We bound three fixtures to exact source hashes and ran them through an isolated, pinned KiCad 10.0.6 verifier."
  "Every declared detector expectation conformed. Both critical mutation cases were observed—zero misses in this small declared corpus."
  "Then the system refused to call the verifier qualified."
  "The fixtures still need single-fault cleanup, a second clean baseline, and independent electrical review. Missing evidence stays missing."
  "That is the architecture: AI proposes, deterministic rules check, EDA tools execute, humans approve. Build the kill switch before the autopilot."
)

durations=(7 8 9 10 6 10 10)
inputs=()
concat_inputs=""

for index in {1..7}; do
  raw="$work_dir/raw-$index.aiff"
  segment="$work_dir/segment-$index.wav"
  /usr/bin/say -v Samantha -r 162 -o "$raw" "${lines[$index]}"
  raw_duration="$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$raw")"
  target_duration="${durations[$index]}"
  if awk "BEGIN {exit !($raw_duration > $target_duration - 0.4)}"; then
    echo "Narration segment $index is too long: ${raw_duration}s for ${target_duration}s" >&2
    exit 1
  fi
  ffmpeg -hide_banner -loglevel error -y -i "$raw" \
    -af "adelay=300,apad=whole_dur=${target_duration},atrim=0:${target_duration}" \
    -ar 48000 -ac 1 "$segment"
  inputs+=("-i" "$segment")
  concat_inputs+="[$((index - 1)):a]"
  printf 'segment %s: spoken=%0.2fs slot=%ss\n' "$index" "$raw_duration" "$target_duration"
done

ffmpeg -hide_banner -loglevel error -y "${inputs[@]}" \
  -filter_complex "${concat_inputs}concat=n=7:v=0:a=1[narration]" \
  -map "[narration]" -ar 48000 -ac 1 "$work_dir/narration.wav"

ffmpeg -hide_banner -loglevel error -y \
  -f lavfi -i "sine=frequency=55:duration=60:sample_rate=48000" \
  -f lavfi -i "sine=frequency=82.41:duration=60:sample_rate=48000" \
  -f lavfi -i "sine=frequency=110:duration=60:sample_rate=48000" \
  -filter_complex "[0:a]volume=0.030[a0];[1:a]volume=0.012[a1];[2:a]volume=0.006[a2];[a0][a1][a2]amix=inputs=3:normalize=0,lowpass=f=950,afade=t=in:st=0:d=2,afade=t=out:st=57:d=3[bed]" \
  -map "[bed]" -ar 48000 -ac 1 "$work_dir/bed.wav"

ffmpeg -hide_banner -loglevel error -y \
  -i "$work_dir/narration.wav" -i "$work_dir/bed.wav" \
  -filter_complex "[0:a]volume=1.0[voice];[1:a]volume=0.48[bed];[voice][bed]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=7[mix]" \
  -map "[mix]" -ar 48000 -ac 2 "$output_dir/pcb-autopilot-master.wav"

ffprobe -v error -show_entries format=duration:stream=codec_name,channels,sample_rate \
  -of default=nw=1 "$output_dir/pcb-autopilot-master.wav"
