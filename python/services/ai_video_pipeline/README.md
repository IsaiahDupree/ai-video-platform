# AI Video Recreation Pipeline

## Overview
Automated pipeline to recreate @pensacola_bigfoot style content with your face using AI video generation (Sora/Veo3), then stitch and auto-post.

## Format Summary (from analysis)
- **Style**: Humorous character exploring Florida locations with sarcastic narration
- **Camera**: Selfie-style, wide-angle shots, eye-level
- **Pacing**: Quick cuts (2-4 seconds per scene)
- **Text**: Bold white text, pink/red highlights at bottom
- **Duration**: 15-45 seconds total
- **Hook**: Immediate humorous observation in first 3 seconds

---

## Pipeline Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  1. IDEATION    │────▶│  2. SCRIPTING   │────▶│  3. GENERATION  │
│  (GPT-4)        │     │  (GPT-4)        │     │  (Sora/Veo3)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
┌─────────────────┐     ┌─────────────────┐            ▼
│  6. POSTING     │◀────│  5. STITCHING   │◀────┌─────────────────┐
│  (Blotato)      │     │  (FFmpeg)       │     │  4. TTS/VOICE   │
└─────────────────┘     └─────────────────┘     │  (ElevenLabs)   │
                                                └─────────────────┘
```

---

## Stage 1: Content Ideation

**Input**: Theme category, target location
**Output**: Video concept with hook, scenes, punchlines

### Themes that work:
1. Florida city roasts (Pensacola, Tampa, Orlando suburbs)
2. Tourist vs locals observations  
3. College town stereotypes
4. Small town quirks
5. Beach town culture clashes

### GPT-4 Ideation Prompt:
```
Generate a TikTok video concept in the @pensacola_bigfoot style.
Location: {location}
Theme: {theme}

Output:
- Hook (first 3 seconds - must be immediately engaging)
- 4-6 scene descriptions with locations
- Punchline observations for each scene
- Callback/ending that ties back to hook
```

---

## Stage 2: Script Generation

**Input**: Video concept
**Output**: Full script with timing, text overlays, scene directions

### Script Format:
```json
{
  "title": "Welcome to {Location}",
  "total_duration": 30,
  "scenes": [
    {
      "scene_num": 1,
      "duration": 4,
      "location": "Downtown street",
      "narration": "Welcome to Pensacola where...",
      "text_overlay": "WELCOME TO PENSACOLA",
      "highlight_words": ["PENSACOLA"],
      "camera": "selfie walk",
      "mood": "sarcastic intro"
    }
  ]
}
```

---

## Stage 3: AI Video Generation

### Option A: Sora (OpenAI)
- Best for: Consistent character, smooth motion
- Use @character reference for your face
- Generate 4-second clips per scene

### Sora Scene Prompt Template:
```
A man with [YOUR DESCRIPTION] walks through [LOCATION], 
selfie-style camera angle, natural daylight, 
vibrant colors, casual attire with [ACCESSORIES].
The man has an expressive, humorous demeanor.
4 seconds, 9:16 vertical format.
```

### Option B: Veo3 (Google)
- Best for: Realistic environments, longer clips
- Better at maintaining scene consistency

### Veo3 Scene Prompt Template:
```
Generate a vertical video (9:16) of a man exploring [LOCATION].
Camera: Handheld selfie style, eye level
Lighting: Natural daylight, vibrant colors
Subject: Expressive man in casual attire, engaging with surroundings
Duration: 4 seconds
Style: TikTok travel content, dynamic and engaging
```

---

## Stage 4: Voice/TTS Generation

### Option A: Your Voice (Preferred)
- Record narration separately
- Use script with timing markers
- ElevenLabs voice clone for consistency

### Option B: AI Voice
- ElevenLabs with custom voice model
- Match energy and sarcasm of original creator

### Audio Processing:
- Add subtle background music (royalty-free)
- Normalize audio levels
- Add slight reverb for outdoor feel

---

## Stage 5: Video Stitching

### FFmpeg Pipeline:
```bash
# 1. Concatenate AI-generated clips
ffmpeg -f concat -i clips.txt -c copy combined.mp4

# 2. Add text overlays
ffmpeg -i combined.mp4 -vf "drawtext=text='WELCOME TO PENSACOLA':
  fontsize=48:fontcolor=white:borderw=3:bordercolor=black:
  x=(w-text_w)/2:y=h-100" with_text.mp4

# 3. Add audio track
ffmpeg -i with_text.mp4 -i narration.mp3 -c:v copy -map 0:v -map 1:a final.mp4
```

### Text Overlay Style:
- Font: Impact or Bebas Neue
- Color: White with black outline
- Highlight color: #FF69B4 (pink) or #FF0000 (red)
- Position: Bottom 20% of frame
- Animation: Pop-in effect

---

## Stage 6: Auto-Posting

### Blotato Integration:
```python
# Post to multiple platforms
platforms = ["tiktok", "instagram", "youtube_shorts"]
for platform in platforms:
    blotato.post(
        video_path=final_video,
        caption=generated_caption,
        platform=platform,
        account_id=ACCOUNT_IDS[platform]
    )
```

### Optimal Posting Times:
- TikTok: 7-9 PM EST
- Instagram Reels: 11 AM, 7 PM EST
- YouTube Shorts: 2-4 PM EST

---

## Implementation Modules

### Required Files:
```
Backend/services/ai_video_pipeline/
├── __init__.py
├── ideation.py          # GPT-4 concept generation
├── script_generator.py  # Full script with timing
├── sora_generator.py    # Sora API integration
├── veo3_generator.py    # Veo3 API integration  
├── voice_generator.py   # ElevenLabs TTS
├── stitcher.py          # FFmpeg video assembly
├── text_overlay.py      # Dynamic text rendering
├── auto_poster.py       # Blotato multi-platform posting
└── pipeline.py          # Main orchestrator
```

---

## Quick Start

```python
from ai_video_pipeline import VideoPipeline

pipeline = VideoPipeline(
    style="pensacola_bigfoot",
    your_face_reference="path/to/your_photo.jpg",
    voice_model="your_elevenlabs_voice_id"
)

# Generate a video
video = await pipeline.create(
    location="Tampa, FL",
    theme="tourist_traps",
    duration=30
)

# Auto-post
await pipeline.post(video, platforms=["tiktok", "instagram"])
```

---

## Cost Estimates (per video)

| Service | Cost |
|---------|------|
| GPT-4 (ideation + script) | ~$0.10 |
| Sora (6 clips × 4 sec) | ~$2.40 |
| ElevenLabs (30 sec) | ~$0.30 |
| **Total** | **~$2.80/video** |

---

## Next Steps

1. [ ] Create character reference images for Sora @character
2. [ ] Set up ElevenLabs voice clone
3. [ ] Implement pipeline modules
4. [ ] Test with single video generation
5. [ ] Scale to batch generation (5-10 videos/day)
