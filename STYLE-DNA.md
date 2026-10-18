# Isaiah Dupree (@the_isaiah_dupree) — Content Style DNA

Reverse-engineered 2026-03-24 from top-performing Instagram Reels.

---

## Videos Analyzed

| Code | Plays | Duration | Hook |
|------|-------|----------|------|
| DTo0HupAD6p | **36,601** | 20s | "Where apps code themselves" |
| DTxrEbyjk43 | **15,978** | 48s | "the friendship fade is real…" |
| DTwMxg1jsFB | 5,849 | 38s | "the goal isn't to catch up" |
| DT6UtfxgKfJ | 701 | 27s | "the longer you wait, the more awkward it feels" |
| DTzzWJdACeE | 697 | 39s | "sometimes you don't miss the person…" |

---

## Technical Specs (what to match)

```
Resolution:  720×1278  (9:16 vertical)
FPS:         30
Codec:       H.264, yuv420p, bt709
Audio:       AAC 44.1kHz stereo
Bitrate:     ~1100–1160 kbps
Color space: bt709
```

---

## Visual Style

### Color Palette
| Sample | Hex | Where |
|--------|-----|-------|
| ![#817676](https://via.placeholder.com/12/817676?text=+) | `#817676` | DTo0HupAD6p avg |
| ![#706560](https://via.placeholder.com/12/706560?text=+) | `#706560` | DTxrEbyjk43 avg |
| ![#6e5f5b](https://via.placeholder.com/12/6e5f5b?text=+) | `#6e5f5b` | DTwMxg1jsFB avg |

**Profile**: Warm muted tones. Dark backgrounds, slight warmth/sepia cast, desaturated.

### Color Grade Formula (ffmpeg)
```bash
eq=saturation=0.85:brightness=-0.04:gamma=1.05,colorchannelmixer=rr=1.02:gg=0.98:bb=0.95
```

### Typography
- Font: SF Pro Display / Inter (system sans-serif)
- Weight: 600–800 (bold to extrabold)
- Color: #ffffff on dark overlay
- Caption style: 2–4 words, centered, bottom-third, pop animation

---

## Editing Style

### Scene Cut Pattern
- DTxrEbyjk43: cuts at 8.1s, 26.7s, 31.4s, 33.1s (4 cuts in 48s)
- DTwMxg1jsFB: cuts at 2.4s, 5.4s, 18.3s, 27.8s, 29.7s (5 cuts in 38s)
- **Average**: 1 cut per 7–10 seconds

### Silence/Cut Points
Voiceover gaps between sentences: **0.3–0.75s** (these are where to cut)

```python
# ffmpeg silence detection parameters:
silencedetect=noise=-35dB:d=0.3
```

### Audio Profile
```
Mean volume: -17.6 to -18.3 dB
Max volume:  -0.6 to -0.8 dB (well normalized, no clipping)
```

---

## Content Structure

```
[0–2s]   HOOK    — short emotional/curiosity statement (lowercase, relatable)
[2–5s]   SETUP   — expand the problem or insight
[5–30s]  BODY    — 3 numbered points or framework (slide in one by one)
[last 5s] CTA    — "follow for more" or implicit
```

### Hook Formulas (by performance)
1. **Curiosity gap**: "Where apps code themselves" (36k)
2. **Relatable truth**: "the friendship fade is real… and it usually isn't drama." (16k)
3. **Reframe**: "the goal isn't to catch up on everything." (5.8k)

### Caption Style
- Lowercase conversational tone
- Short punchy lines, one thought per line
- Lists/steps numbered

---

## What Works (by engagement)

| Niche | Total Plays |
|-------|------------|
| AI/Tech | 37,090 |
| Relationships | 23,225 |
| Philosophy | 667 |
| Startup tips | 489 |

**AI + relatable emotional content = highest reach**

### Sweet Spot Duration
- 20s performed best (36k plays) — short, punchy
- 48s also works if pacing is tight
- Avoid: 60s+ without a strong hook

---

## Remotion Template

**Composition**: `IsaiahStyleReel` (720×1280, 30fps)
**File**: `src/compositions/IsaiahStyleReel.tsx`

### Quick Render

```bash
# From ~/Documents/Software/Remotion:
npm run reel:iphone -- \
  --video /path/to/iphone.mov \
  --hook "your hook line" \
  --points "step 1,step 2,step 3" \
  --cta "follow for more" \
  --output my-reel.mp4
```

### Props
```typescript
{
  hook: string;                    // Opening hook text (shown 0-3s)
  backgroundVideoPath?: string;    // iPhone video → put in public/
  audioPath?: string;              // Separate voiceover audio
  transcript?: WordTiming[];       // Word-level captions (precise sync)
  captionText?: string;            // Auto-timed captions (fallback)
  points?: string[];               // Numbered framework points
  cta?: string;                    // End CTA
  watermark?: string;              // "@handle" shown top
  grade?: 'warm'|'cool'|'moody'|'clean';
  captionAnimation?: 'pop'|'highlight'|'karaoke'|'bounce';
}
```

---

## Full Pipeline

```
iPhone (.MOV/.HEVC)
    ↓
ffmpeg crop → 720×1280, warm grade, 30fps
    ↓
audio extract (or separate voiceover)
    ↓
IsaiahStyleReel (Remotion composition)
  - hook overlay (0-3s)
  - animated captions (synced to audio)
  - numbered point cards (slide in)
  - CTA (last 5s)
  - warm color grade
    ↓
output/reel-{name}.mp4
    ↓
Blotato → Instagram + TikTok
```
