#!/bin/bash

# Script to generate word-level captions using WhisperX
# Usage: ./scripts/generate-captions.sh input-audio.wav output.json

set -e

INPUT_AUDIO="$1"
OUTPUT_JSON="$2"

if [ -z "$INPUT_AUDIO" ] || [ -z "$OUTPUT_JSON" ]; then
  echo "Usage: $0 <input-audio.wav> <output.json>"
  exit 1
fi

echo "Generating word-level timestamps with WhisperX..."
echo "Input: $INPUT_AUDIO"
echo "Output: $OUTPUT_JSON"

# Run WhisperX with word-level alignment
whisperx "$INPUT_AUDIO" \
  --language en \
  --align_model WAV2VEC2_ASR_LARGE_LV60K_960H \
  --output_dir "$(dirname "$OUTPUT_JSON")" \
  --output_format json

# WhisperX outputs to a file named like input-audio.json
# Move it to the desired output location
INPUT_BASENAME=$(basename "$INPUT_AUDIO" .wav)
INPUT_DIR=$(dirname "$INPUT_AUDIO")
WHISPERX_OUTPUT="${INPUT_DIR}/${INPUT_BASENAME}.json"

if [ -f "$WHISPERX_OUTPUT" ]; then
  mv "$WHISPERX_OUTPUT" "$OUTPUT_JSON"
  echo "✓ Captions saved to $OUTPUT_JSON"
else
  echo "✗ Error: WhisperX output not found at $WHISPERX_OUTPUT"
  exit 1
fi






