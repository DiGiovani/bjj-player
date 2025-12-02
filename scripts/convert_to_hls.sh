#!/usr/bin/env bash
set -euo pipefail

INPUT_DIR="${1:-public/available_cameras}"
OUTPUT_DIR="${2:-$INPUT_DIR/hls}"
SEGMENT_SECONDS="${SEGMENT_SECONDS:-4}"  # override via env var if needed
GOP_SIZE="${GOP_SIZE:-48}"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is required but was not found in PATH" >&2
  exit 1
fi

if [[ ! -d "$INPUT_DIR" ]]; then
  echo "Input directory '$INPUT_DIR' does not exist" >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

# rendition format: label:width:height:video_bitrate:maxrate:bufsize:audio_bitrate
renditions=(
  "1080p:-2:1080:6000k:7500k:9000k:192k"
  "720p:-2:720:3500k:4500k:6000k:160k"
  "480p:-2:480:2000k:2500k:4000k:128k"
)

slugify() {
  local text="$1"
  text=$(echo "$text" | tr '[:upper:]' '[:lower:]')
  text=${text// /-}
  text=${text//[^a-z0-9_.-]/}
  echo "$text"
}

build_filter_complex() {
  local count=${#renditions[@]}
  local filter="[0:v]split=${count}"
  for ((i = 0; i < count; i++)); do
    filter+="[v${i}src]"
  done
  filter+=';'
  for ((i = 0; i < count; i++)); do
    IFS=':' read -r _ width height _ _ _ _ <<<"${renditions[$i]}"
    filter+="[v${i}src]scale=${width}:${height}:flags=bicubic[v${i}out];"
  done
  echo "${filter%;}"
}

build_stream_map() {
  local count=${#renditions[@]}
  local map=""
  for ((i = 0; i < count; i++)); do
    IFS=':' read -r label _ _ _ _ _ _ <<<"${renditions[$i]}"
    map+="v:${i},a:${i},name:${label}"
    map+=$' '
  done
  echo "${map% }"
}

shopt -s nullglob
inputs=("$INPUT_DIR"/*.mp4)
shopt -u nullglob

if [[ ${#inputs[@]} -eq 0 ]]; then
  echo "No .mp4 files found in '$INPUT_DIR'" >&2
  exit 0
fi

for input in "${inputs[@]}"; do
  base=$(basename "$input")
  if [[ "$base" == *.preview.mp4 ]]; then
    continue
  fi
  stem=${base%.mp4}
  slug=$(slugify "$stem")
  out_dir="$OUTPUT_DIR/$slug"
  mkdir -p "$out_dir"

  filter_complex=$(build_filter_complex)
  stream_map=$(build_stream_map)

  map_args=()
  count=${#renditions[@]}
  for ((i = 0; i < count; i++)); do
    IFS=':' read -r label _ _ vbit maxrate bufsize abit <<<"${renditions[$i]}"
    map_args+=( -map "[v${i}out]" -map 0:a:0 )
    map_args+=( -c:v:${i} libx264 -profile:v:${i} high -preset veryfast )
    map_args+=( -b:v:${i} "$vbit" -maxrate:v:${i} "$maxrate" -bufsize:v:${i} "$bufsize" )
    map_args+=( -g:v:${i} "$GOP_SIZE" -keyint_min:v:${i} "$GOP_SIZE" -sc_threshold 0 )
    map_args+=( -c:a:${i} aac -b:a:${i} "$abit" -ac 2 )
    map_args+=( -metadata:s:v:${i} "variant_bitrate=$vbit" )
  done

  echo "Transcoding $base -> $out_dir"

  ffmpeg -y -i "$input" \
    -filter_complex "$filter_complex" \
    "${map_args[@]}" \
    -f hls \
    -hls_time "$SEGMENT_SECONDS" \
    -hls_playlist_type vod \
    -hls_flags independent_segments \
    -hls_segment_filename "$out_dir/${slug}_%v_%03d.ts" \
    -master_pl_name master.m3u8 \
    -var_stream_map "$stream_map" \
    "$out_dir/${slug}_%v.m3u8"

done
