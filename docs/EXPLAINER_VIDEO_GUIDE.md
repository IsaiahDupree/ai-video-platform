# Explainer Video Generation Guide

Complete pipeline for creating AI-powered explainer videos with **character consistency** and **voice cloning**.

## Overview

This system combines:
- **Remotion** - React-based video rendering
- **OpenAI DALL-E 3** - AI image generation with character consistency
- **Hugging Face IndexTTS-2** - Voice cloning for narration
- **OpenAI GPT-4** - Script generation from topics

## Quick Start

### 1. From a Topic (Fully Automated)

```bash
# AI generates script, images, voiceover, and renders video
npx tsx scripts/generate-explainer.ts --topic "How Batteries Work"
```

### 2. From Your Own Script

```bash
# Create a script file
echo "Introduction to your topic here.

First main point explained clearly.

Second important concept.

Conclusion and call to action." > my_script.txt

# Generate video from script
npx tsx scripts/generate-explainer.ts --script my_script.txt --title "My Topic"
```

### 3. From a Custom Brief

```bash
# Use a pre-defined brief with full control
npx tsx scripts/generate-explainer.ts --brief data/briefs/explainer_template.json
```

## Character Consistency System

The key to professional-looking explainer videos is **consistent characters** across all scenes.

### How It Works

1. **Character Registration** - Define character traits once
2. **Reference Generation** - Create a character reference sheet
3. **Scene Generation** - Use consistent prompts with the same traits

### Defining Characters

In your brief JSON, define characters with specific, consistent traits:

```json
{
  "characters": [
    {
      "name": "host",
      "description": "friendly tech expert, short dark hair, glasses, blue polo shirt",
      "style": "flat illustration, clean lines, consistent facial features"
    }
  ]
}
```

### Consistency Tips

1. **Be Specific** - "short dark hair, round glasses" beats "nice hair, glasses"
2. **Use Art Style** - Define ONE style: "flat illustration" or "3D render"
3. **Keep It Simple** - Fewer details = more consistency
4. **Reference Images** - Provide a reference image for best results

## Voice Cloning with IndexTTS-2

### Setup

1. Place your voice reference file (5-15 seconds of clear speech):
   ```
   public/assets/voices/your_voice.wav
   ```

2. Update your brief:
   ```json
   {
     "voice": {
       "reference_path": "public/assets/voices/your_voice.wav",
       "default_emotion": "calm"
     }
   }
   ```

### Emotions

IndexTTS-2 supports emotion control:
- `happy` - Cheerful, upbeat
- `sad` - Melancholic
- `excited` - Energetic
- `calm` - Relaxed, steady
- `explaining` - Clear, educational
- `curious` - Inquisitive
- `neutral` - No specific emotion

### Fallback

If IndexTTS-2 is unavailable (GPU quota exceeded), the system falls back to OpenAI TTS.

## Brief Format

### Complete Example

```json
{
  "id": "unique_video_id",
  "title": "Video Title",
  "description": "What this video explains",
  
  "style": {
    "theme": "dark",
    "primary_color": "#ffffff",
    "accent_color": "#3b82f6",
    "art_style": "modern flat illustration, clean lines, vibrant colors"
  },
  
  "characters": [
    {
      "name": "host",
      "description": "character physical description",
      "style": "art style for this character"
    }
  ],
  
  "voice": {
    "reference_path": "public/assets/voices/reference.wav",
    "default_emotion": "explaining"
  },
  
  "scenes": [
    {
      "id": "scene_id",
      "type": "intro|topic|outro",
      "duration_sec": 10,
      "voiceover_text": "What the narrator says",
      "visual_prompt": "What the character is doing visually",
      "character": "host",
      "emotion": "happy"
    }
  ],
  
  "settings": {
    "resolution": { "width": 1080, "height": 1920 },
    "fps": 30,
    "aspect_ratio": "9:16"
  }
}
```

### Scene Types

| Type | Purpose | Visual Elements |
|------|---------|-----------------|
| `intro` | Hook & title | Character introduction, title card |
| `topic` | Main content | Character explaining with diagrams |
| `list_item` | Numbered points | Bullet points, icons |
| `comparison` | X vs Y | Side-by-side visuals |
| `outro` | CTA & wrap-up | Character waving, social handles |
| `transition` | Between scenes | Animated transitions |

## Environment Variables

```bash
# Required for image generation and script generation
export OPENAI_API_KEY="sk-..."

# Optional - for IndexTTS-2 (voice cloning)
export HF_TOKEN="hf_..."

# Optional - for ElevenLabs sound effects
export ELEVENLABS_API_KEY="..."
```

## Pipeline Stages

The generation process follows these stages:

```
1. Script Generation (if --topic)
   └── GPT-4 writes educational script

2. Brief Creation
   └── Script parsed into structured scenes

3. Character Setup
   └── Register characters for consistency
   └── Generate reference images

4. Asset Generation
   ├── Images: DALL-E 3 with consistent prompts
   └── Voiceovers: IndexTTS-2 → OpenAI TTS fallback

5. Remotion Brief
   └── Convert to Remotion-compatible format

6. Video Render
   └── Remotion renders final MP4
```

## CLI Options

```bash
npx tsx scripts/generate-explainer.ts [options]

Options:
  --topic <text>       Topic for AI to generate script
  --script <path>      Path to script text file
  --brief <path>       Path to explainer brief JSON
  --title <text>       Title (used with --script)
  --skip-images        Skip AI image generation
  --skip-voiceover     Skip voiceover generation
  --skip-render        Generate assets only, don't render
  --help               Show help
```

## Output Files

After generation, you'll find:

```
output/explainer/
├── {id}.brief.json       # Full explainer brief
├── {id}.assets.json      # Generated asset manifest
├── {id}.remotion.json    # Remotion-ready brief
└── {id}.mp4              # Final rendered video

public/assets/
├── characters/           # Character reference images
├── scenes/               # Scene images
└── audio/voiceover/      # Generated voiceovers
```

## Workflow Examples

### Example 1: Quick Educational Video

```bash
# Generate everything automatically
npx tsx scripts/generate-explainer.ts \
  --topic "Why is the Ocean Blue?"
```

### Example 2: Custom Script with Voice Clone

```bash
# 1. Write your script
cat > script.txt << 'EOF'
Have you ever wondered why leaves change color in autumn?

It's all about chlorophyll - the green pigment in leaves.

During summer, chlorophyll is constantly being produced and broken down.

But as days get shorter, trees stop making chlorophyll.

This reveals the yellow and orange pigments that were hidden all along!

Follow for more nature science!
EOF

# 2. Generate with your voice
npx tsx scripts/generate-explainer.ts \
  --script script.txt \
  --title "Why Leaves Change Color"
```

### Example 3: Assets Only (Manual Render)

```bash
# Generate images and voiceovers only
npx tsx scripts/generate-explainer.ts \
  --topic "How WiFi Works" \
  --skip-render

# Preview in Remotion Studio
npm run dev

# Render when ready
npm run render:brief output/explainer/explainer_*.remotion.json
```

## Troubleshooting

### IndexTTS-2 Not Working
- Check HF_TOKEN is set (optional but helps with rate limits)
- Free GPU quota is ~60s/day - falls back to OpenAI TTS
- Ensure voice reference is a clear WAV file, 5-15 seconds

### Images Not Consistent
- Add more specific details to character description
- Use a reference image in the character config
- Simplify the art style (fewer variations = more consistency)

### Render Fails
- Check all asset paths exist
- Run `npm run validate data/briefs/your_brief.json`
- Preview in Studio first: `npm run dev`

## Best Practices

1. **Keep scripts short** - 45-60 seconds optimal for social media
2. **One concept per scene** - Clearer for viewers
3. **Simple character designs** - More consistent across generations
4. **Use emotion strategically** - Match voice emotion to content
5. **Preview before render** - Use Remotion Studio to check timing
