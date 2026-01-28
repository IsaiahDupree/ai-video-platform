# Sound Effects Directory

This directory stores generated sound effects using ElevenLabs Sound Generation API.

## VC-007: ElevenLabs SFX Integration

Generated sound effects can be used in:
- Video compositions
- UI interactions
- Transitions and animations
- Background audio

## Generating Sound Effects

### Single Sound Effect

```bash
npm run generate-sfx generate --preset doorbell --output public/assets/sfx/doorbell.mp3
```

### Batch Generation

```bash
npm run generate-sfx batch --prompts-file data/sample-sfx-prompts.json --output-dir public/assets/sfx/
```

### Available Presets

Run to see all presets:
```bash
npm run generate-sfx presets
```

## File Organization

Sound effects should be organized by category:
- `ui/` - UI interaction sounds (clicks, notifications, etc.)
- `transitions/` - Transition sounds (whooshes, swooshes, etc.)
- `ambient/` - Ambient sounds (rain, wind, fire, etc.)
- `effects/` - Special effects (explosions, magic, etc.)
