# Batch Voiceover Generation (VC-006)

## Overview

The batch voiceover generation feature allows you to automatically generate voiceovers for all sections in a content brief. This eliminates the need to manually generate voiceovers one by one.

## Features

- **Multiple Voice Providers**: Support for OpenAI TTS, ElevenLabs, and IndexTTS (voice cloning)
- **Batch Processing**: Generate all voiceovers in a brief with a single command
- **Smart Caching**: Skip already-generated files unless `--overwrite` is specified
- **Progress Tracking**: Real-time progress updates for each section
- **Error Handling**: Continue processing even if individual sections fail

## Usage

### Basic Usage with OpenAI TTS

```bash
npm run generate-batch-voiceover -- --brief data/briefs/example-video.json --voice alloy
```

### Using ElevenLabs

```bash
npm run generate-batch-voiceover -- --brief data/briefs/example-video.json --provider elevenlabs --voice rachel
```

### Using IndexTTS with Reference Audio

```bash
npm run generate-batch-voiceover -- --brief data/briefs/example-video.json --provider indexed --voice rachel --reference-audio public/assets/voices/rachel-ref.mp3
```

### Using Full Pipeline (ElevenLabs → IndexTTS)

```bash
npm run generate-batch-voiceover -- --brief data/briefs/example-video.json --provider indexed --voice rachel
```

## Command-Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--brief <path>` | Path to content brief JSON file | Required |
| `--provider <name>` | Voice provider: `openai`, `elevenlabs`, or `indexed` | `openai` |
| `--voice <name>` | Voice name or ID | `alloy` |
| `--output-dir <path>` | Output directory for audio files | `public/assets/audio/<brief-name>` |
| `--reference-audio <path>` | Reference audio file for IndexTTS | None (uses ElevenLabs pipeline) |
| `--speed <number>` | Speech speed multiplier (0.5-2.0) | `1.0` |
| `--temperature <number>` | Sampling temperature for IndexTTS (0.1-1.0) | `0.7` |
| `--overwrite` | Overwrite existing audio files | `false` |
| `--help` | Show help message | - |

## Voice Providers

### OpenAI TTS

Fast and reliable, good for prototyping and basic voiceovers.

**Available voices**: `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`

**Requirements**: `OPENAI_API_KEY` environment variable

### ElevenLabs

High-quality, natural-sounding voices with various accents and styles.

**Available voices**: `rachel`, `domi`, `bella`, `antoni`, `elli`, `josh`, `arnold`, `adam`, `sam`

**Requirements**: `ELEVENLABS_API_KEY` environment variable

### IndexTTS (Voice Cloning)

Clone any voice using reference audio. Can use either:
1. Your own reference audio file
2. Full pipeline: Generate reference with ElevenLabs, then clone with IndexTTS

**Requirements**:
- `MODAL_VOICE_CLONE_URL` environment variable
- `ELEVENLABS_API_KEY` (if using full pipeline)

## Output Structure

Generated audio files are saved with the following structure:

```
public/assets/audio/
└── <brief-name>/
    ├── intro.mp3        (or .wav for IndexTTS)
    ├── topic1.mp3
    ├── topic2.mp3
    └── outro.mp3
```

Each file is named after the section ID in the brief.

## Content Brief Format

Your content brief must have sections with `voiceover` fields:

```json
{
  "title": "My Video",
  "sections": [
    {
      "id": "intro",
      "type": "intro",
      "durationInFrames": 90,
      "heading": "Welcome",
      "voiceover": "This is the text that will be converted to speech"
    }
  ]
}
```

## Examples

### Generate for All Sections with Default Settings

```bash
npm run generate-batch-voiceover -- --brief data/briefs/my-video.json
```

This will:
- Use OpenAI TTS with the `alloy` voice
- Generate audio for all sections with voiceover text
- Save files to `public/assets/audio/my-video/`
- Skip any files that already exist

### Regenerate with Different Voice

```bash
npm run generate-batch-voiceover -- --brief data/briefs/my-video.json --voice nova --overwrite
```

### Clone a Specific Voice

```bash
# First, generate reference audio with ElevenLabs
npm run generate-voice -- generate-reference --voice rachel --output-dir public/assets/voices

# Then, use that reference for batch generation
npm run generate-batch-voiceover -- --brief data/briefs/my-video.json --provider indexed --voice rachel --reference-audio public/assets/voices/rachel-ref-1.mp3
```

### Use Full Pipeline for Voice Cloning

```bash
npm run generate-batch-voiceover -- --brief data/briefs/my-video.json --provider indexed --voice rachel --speed 1.1
```

This automatically:
1. Generates reference audio with ElevenLabs
2. Clones the voice using IndexTTS
3. Outputs the final audio

## Tips

1. **Start with OpenAI**: It's the fastest and most reliable for testing
2. **Use ElevenLabs for Quality**: When you need more natural-sounding voices
3. **Clone for Consistency**: Use IndexTTS when you need consistent voice across multiple videos
4. **Batch Processing**: The script processes sections sequentially with 1-second delays to respect rate limits
5. **Error Recovery**: If a section fails, the script continues with the next section

## Troubleshooting

### "No sections with voiceover text found"

Make sure your content brief has sections with `voiceover` fields containing text.

### API Errors

- Check that your API keys are set in `.env`
- Verify your API quotas and rate limits
- For Modal, ensure the voice clone service is deployed and running

### File Permission Errors

- Ensure the output directory is writable
- Check that parent directories exist

## Related Features

- **VC-001**: Modal Voice Clone Service
- **VC-002**: ElevenLabs Reference Generation
- **VC-003**: Voice Clone API Client
- **VC-004**: Full Voice Pipeline
- **VC-005**: Voice Reference Management
