# Voice References - VC-005

This directory contains voice reference audio files and metadata for voice cloning.

## Directory Structure

```
voices/
├── library.json          # Voice library metadata
├── README.md            # This file
└── [voice-id]/          # Each voice has its own directory
    ├── reference-1.mp3  # Primary reference audio
    ├── reference-2.mp3  # Additional reference samples
    └── ...
```

## Voice Library

The `library.json` file contains metadata for all voice references:
- Voice ID and name
- Category (male, female, child, neutral)
- Characteristics (age, accent, tone, pitch)
- Source information (ElevenLabs ID, attribution)
- Audio file references
- Usage statistics
- Tags for organization

## Managing Voice References

Use the CLI tool to manage voice references:

```bash
# List all voices
ts-node scripts/manage-voices.ts list

# Add a new voice
ts-node scripts/manage-voices.ts add \
  --id my-voice \
  --name "My Voice" \
  --category male \
  --source elevenlabs

# View voice details
ts-node scripts/manage-voices.ts info my-voice

# Search for voices
ts-node scripts/manage-voices.ts search --category female

# Delete a voice
ts-node scripts/manage-voices.ts delete my-voice --delete-files
```

## Creating Voice References

### Method 1: Using ElevenLabs

Generate reference audio using ElevenLabs TTS:

```bash
ts-node scripts/generate-voice-with-elevenlabs.ts generate-reference \
  --voice rachel \
  --output-dir public/assets/voices/rachel
```

Then add to library:

```bash
ts-node scripts/manage-voices.ts add \
  --id rachel \
  --name "Rachel - Professional Female" \
  --category female \
  --source elevenlabs \
  --description "Clear, professional female voice with American accent"
```

### Method 2: Recording Your Own

1. Record audio samples (10-30 seconds each)
2. Save as WAV or MP3 in a voice directory
3. Add to library with the CLI tool

### Method 3: Using the Full Pipeline

Generate and clone voices in one step:

```bash
ts-node scripts/generate-voice-with-elevenlabs.ts clone \
  --text "Your target text" \
  --voice rachel \
  --output cloned.wav
```

## Voice Characteristics

When adding voices, consider documenting:

- **Age**: young, middle-aged, senior
- **Accent**: american, british, australian, etc.
- **Tone**: professional, casual, energetic, calm, etc.
- **Pitch**: low, medium, high

## Best Practices

1. **Reference Quality**: Use clear, high-quality audio without background noise
2. **Duration**: 10-30 seconds of audio works best for most models
3. **Variety**: Multiple reference samples capture voice nuances better
4. **Naming**: Use descriptive IDs like "josh-energetic" or "rachel-calm"
5. **Metadata**: Fill in characteristics to make voices easier to find
6. **Organization**: Use tags like "commercial", "narration", "character"

## Usage in Projects

```typescript
import { VoiceReferenceManager } from '../src/services/voiceReference';

const manager = new VoiceReferenceManager();

// Get a voice
const voice = manager.getVoiceReference('rachel');

// Search for voices
const professionalVoices = manager.searchVoiceReferences({
  tags: ['professional'],
  category: 'female'
});

// Record usage
manager.recordUsage('rachel');
```

## Integration with Voice Cloning

Voice references can be used with the voice cloning pipeline:

```typescript
import { VoiceCloneClient } from '../src/services/voiceClone';
import { VoiceReferenceManager } from '../src/services/voiceReference';

const voiceManager = new VoiceReferenceManager();
const cloneClient = new VoiceCloneClient();

// Get reference audio
const voice = voiceManager.getVoiceReference('rachel');
const referencePath = voice.audioFiles[0].path;

// Clone voice
await cloneClient.cloneVoiceToFile({
  text: "Your text here",
  referenceAudio: referencePath,
  speakerName: voice.id
}, 'output.wav');

// Record usage
voiceManager.recordUsage('rachel');
```
