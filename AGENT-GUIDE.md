# Autonomous Agent Development Guide

This guide is for autonomous AI agents working on the Remotion VideoStudio project.

## Quick Start

1. **Read the Context**: Start with `claude-progress.txt` and `feature_list.json`
2. **Pick a Feature**: Choose the next incomplete P0 feature from the feature list
3. **Understand Requirements**: Read the relevant PRD document from `/docs`
4. **Implement**: Write code following project conventions
5. **Test**: Verify with `npm run build` and manual testing where applicable
6. **Mark Complete**: Update `feature_list.json` with `"passes": true`
7. **Commit**: Create a clear git commit with feature ID and description

## Feature Implementation Checklist

For each feature, verify:
- [ ] Feature ID exists in `feature_list.json`
- [ ] Read the relevant PRD document
- [ ] Understand dependencies and prerequisites
- [ ] Implement following TypeScript strict mode rules
- [ ] Code follows existing project conventions
- [ ] Manual testing completed (where applicable)
- [ ] Update `feature_list.json` - set `"passes": true`
- [ ] Create git commit: `feat: [ID] - Feature Name`

## Project Structure

```
src/
├── animations/          # Animation presets (fadeIn, slideUp, etc.)
├── audio/              # Audio processing and effects
├── components/         # Reusable React components
├── scenes/             # Scene templates (Intro, Topic, Outro, etc.)
├── styles/             # Theme and styling configurations
├── types/              # TypeScript type definitions
├── utils/              # Helper functions
├── compositions/       # Remotion composition entries
└── formats/            # Video format definitions

scripts/
├── render.ts           # CLI: Render video from brief
├── generate-brief.ts   # CLI: Generate brief from topic
├── generate-audio.ts   # CLI: Generate TTS and SFX
├── validate-brief.ts   # CLI: Validate brief schema
└── ...other utilities

data/
├── briefs/             # Sample content briefs (JSON)
├── scripts/            # Sample scripts for generation
└── assets/             # Static media files

docs/
├── PRD.md              # Core video generation PRD
├── PRD-Video-Generation-Platform.md
├── PRD-HeyGen-Alternative.md
├── PRD-SFX-System.md
└── ...other PRDs
```

## TypeScript Standards

All code must comply with:
- TypeScript strict mode (`strict: true` in tsconfig.json)
- ESM module syntax (import/export)
- React 18+ patterns
- Remotion API conventions
- Zod validation for runtime schemas

Example file header:
```typescript
import { Composition } from 'remotion';
import { z } from 'zod';
import type { MyComponentProps } from '../types/MyComponent';

// Implementation...
```

## Common Patterns

### 1. Component with Props Validation
```typescript
// src/components/MyComponent.tsx
import type { FC } from 'react';

interface MyComponentProps {
  title: string;
  duration: number;
}

export const MyComponent: FC<MyComponentProps> = ({ title, duration }) => {
  return <div>{title}</div>;
};
```

### 2. Animation Function
```typescript
// src/animations/myAnimation.ts
export interface AnimationOptions {
  duration: number;
  delay: number;
}

export const myAnimation = (frame: number, options: AnimationOptions) => {
  const progress = Math.min(frame / options.duration, 1);
  return {
    opacity: progress,
    scale: 0.5 + progress * 0.5,
  };
};
```

### 3. Zod Schema with Runtime Validation
```typescript
// src/types/ContentBrief.ts
import { z } from 'zod';

export const ContentBriefSchema = z.object({
  id: z.string(),
  format: z.enum(['explainer_v1', 'shorts_v1']),
  title: z.string(),
  duration_sec: z.number().positive(),
});

export type ContentBrief = z.infer<typeof ContentBriefSchema>;
```

### 4. Scene Component
```typescript
// src/scenes/MyScene.tsx
import { AbsoluteFill } from 'remotion';
import type { FC } from 'react';

interface MySceneProps {
  duration: number;
  startFrame: number;
}

export const MyScene: FC<MySceneProps> = ({ duration, startFrame }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Scene content */}
    </AbsoluteFill>
  );
};
```

## Testing

### Build Verification
```bash
npm run build
```

### Development Studio Preview
```bash
npm run dev
```

### Validate Briefs
```bash
npm run validate data/briefs/example.json
```

### Render a Video
```bash
npm run render:brief data/briefs/example.json output/test.mp4
```

## Dependencies and APIs

### External APIs (require configuration in .env.local)
- **OpenAI**: GPT-4, DALL-E, Whisper, TTS (requires OPENAI_API_KEY)
- **Pexels**: Stock videos/images (requires PEXELS_API_KEY)
- **HuggingFace**: IndexTTS-2, other models (requires HF_TOKEN)
- **ElevenLabs**: Premium TTS (requires ELEVENLABS_API_KEY)
- **Modal**: GPU compute (requires MODAL_TOKEN_ID, MODAL_TOKEN_SECRET)

### Node Packages
- `remotion`: Video rendering framework
- `react`: UI library
- `zod`: Schema validation
- `tsx`: TypeScript CLI runner

## Feature Categories

### video-core (8 features)
Core Remotion setup, scene templates, animation library, visual effects

### media-apis (5 features)
Integration with Pexels, Pixabay, NASA, Tenor, Freesound

### ai-generation (4 features)
DALL-E, character consistency, script generation, title summarization

### voice (5 features)
OpenAI TTS, IndexTTS-2, ElevenLabs, voice cloning, emotion control

### captions (5 features)
Whisper word timestamps, TikTok/YouTube/Karaoke caption styles

### formats (5 features)
Explainer, Dev Vlog, Shorts, Listicle, Static Ads

### sfx (10 features)
SFX library, manifest schema, audio events, context packs, mixing

### heygen-alt (15 features)
Talking avatar synthesis, voice cloning, REST API, batch processing

### infinitetalk (10 features)
InfiniteTalk modal deployment, quality profiles, preprocessing

### everreach-ads (14 features)
Static ad generation, awareness levels, belief targeting, templates

### pipeline (5 features)
Topic-to-video automation, batch rendering, brand templates

### cli (5 features)
CLI commands for generation, rendering, validation

### tracking (5 features)
Event tracking SDK, acquisition/activation/monetization events

### meta-pixel (4 features)
Meta Pixel, standard events, CAPI server-side tracking

### growth-data-plane (4 features)
Data warehouse schema, event normalization, segment engine

## Common Issues and Solutions

### Issue: Module not found
**Solution**: Check that TypeScript imports use correct relative paths. Use `import type` for types to avoid circular dependencies.

### Issue: Remotion rendering fails
**Solution**: Verify all props are serializable (no functions, no circular references). Check frame calculations don't go negative.

### Issue: API call failures
**Solution**: Check .env.local for API keys. Verify rate limits. Add retry logic for flaky APIs.

### Issue: TypeScript strict errors
**Solution**: Always add explicit type annotations. Use `as const` for literal unions. Avoid `any` types.

## Performance Optimization Tips

1. **Memoize Components**: Use `memo()` for expensive renders
2. **Lazy Load Assets**: Don't load all media upfront
3. **Use Intervals**: Update properties at key frames, not every frame
4. **Batch API Calls**: Combine multiple requests when possible
5. **Cache Results**: Store API responses in files/database

## Debugging

### Enable Verbose Logging
```bash
DEBUG=* npm run render:brief <file>
```

### Check Generated Files
```bash
# Briefs are in data/briefs/
# Audio is in output/audio/
# Rendered videos in output/
```

### Use TypeScript Compiler
```bash
npx tsc --noEmit
```

## Commit Message Format

```
feat: [FEATURE-ID] - Feature Name

Description of what was implemented.

- Bullet point 1
- Bullet point 2

Passes: FEATURE-ID
```

Example:
```
feat: VID-001 - Content Brief Schema

Implement JSON schema for video content briefs with validation.

- Define TypeScript types for ContentBrief structure
- Create Zod validation schema
- Add example briefs in data/briefs/
- Document schema in README

Passes: VID-001
```

## Questions?

If you encounter issues:
1. Check the relevant PRD document
2. Review existing similar implementations
3. Check git history for related features
4. Read the README.md for project overview
5. Review TypeScript strict mode rules

Good luck! 🚀
