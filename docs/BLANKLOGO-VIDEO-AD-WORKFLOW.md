# BlankLogo Video Ad Generation Workflow

> **Last Updated:** January 2026  
> **Project:** Remotion Video Ad Generator for BlankLogo (Watermark Removal Tool)

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Video Assets Management](#video-assets-management)
4. [Copy Matrix System](#copy-matrix-system)
5. [Aspect Ratios & Formats](#aspect-ratios--formats)
6. [Step-by-Step: Adding New Video Pairs](#step-by-step-adding-new-video-pairs)
7. [Rendering Commands](#rendering-commands)
8. [Output Structure](#output-structure)
9. [Troubleshooting](#troubleshooting)
10. [Technical Reference](#technical-reference)

---

## Overview

This project uses **Remotion** (React-based video framework) to generate before/after video ads for BlankLogo, a watermark removal tool. The ads showcase:

- **Before:** Video with watermark (the problem)
- **After:** Video with watermark removed (the solution)

### Key Features

- **12 Copy Variants:** 6 problem-aware + 6 solution-aware ad copy sets
- **3 Aspect Ratios:** 9:16 (Reels/Stories), 4:5 (Feed), 16:9 (YouTube/Facebook)
- **Multiple Video Pairs:** Easily swap video content while keeping copy consistent
- **Batch Rendering:** Render all combinations automatically

---

## Project Structure

```
Remotion/
├── public/
│   └── blanklogo/
│       ├── video1-before-web.mp4      # Video pair 1 (with watermark)
│       ├── video1-after-web.mp4       # Video pair 1 (watermark removed)
│       ├── video2-before-web.mp4
│       ├── video2-after-web.mp4
│       ├── video3-before-web.mp4
│       ├── video3-after-web.mp4
│       ├── video4-before-web.mp4
│       ├── video4-after-web.mp4
│       ├── video5-before-web.mp4
│       ├── video5-after-web.mp4
│       ├── video6-before-web.mp4
│       ├── video6-after-web.mp4
│       ├── video7-before-web.mp4
│       ├── video7-after-web.mp4
│       ├── video8-before-web.mp4
│       └── video8-after-web.mp4
│
├── src/
│   ├── Root.tsx                       # Composition registration
│   └── compositions/
│       └── blanklogo/
│           ├── index.ts               # Exports
│           ├── config.ts              # VIDEO_AD_COPY & VIDEO_PAIRS
│           └── BeforeAfterVideo.tsx   # Main video component
│
├── out/
│   └── blanklogo-ads/
│       └── video/
│           ├── video1/
│           │   ├── 9x16/
│           │   ├── 4x5/
│           │   └── 16x9/
│           ├── video2/
│           ├── video3/
│           ├── video4/
│           ├── video5/
│           ├── video6/
│           ├── video7/
│           └── video8/
│
└── docs/
    └── BLANKLOGO-VIDEO-AD-WORKFLOW.md  # This file
```

---

## Video Assets Management

### Naming Convention

Videos must follow this naming pattern:
```
video{N}-before-web.mp4   # Original video with watermark
video{N}-after-web.mp4    # Cleaned video (watermark removed)
```

Where `{N}` is the video pair number (1, 2, 3, etc.)

### Web Compatibility Requirements

**IMPORTANT:** Videos must be re-encoded for web playback in Remotion.

Original videos from external sources may have codec issues. Always re-encode using:

```bash
ffmpeg -y -i input.mp4 \
  -c:v libx264 \
  -preset fast \
  -crf 23 \
  -c:a aac \
  -b:a 128k \
  -movflags +faststart \
  output-web.mp4
```

### VIDEO_PAIRS Configuration

Located in `src/compositions/blanklogo/config.ts`:

```typescript
export const VIDEO_PAIRS = [
  {
    id: 'video1',
    name: 'Video 1',
    beforeSrc: 'blanklogo/video1-before-web.mp4',
    afterSrc: 'blanklogo/video1-after-web.mp4',
  },
  {
    id: 'video2',
    name: 'Video 2',
    beforeSrc: 'blanklogo/video2-before-web.mp4',
    afterSrc: 'blanklogo/video2-after-web.mp4',
  },
  // ... more video pairs
] as const;
```

---

## Copy Matrix System

### 12-Ad Premium Copy Matrix

The copy is defined in `VIDEO_AD_COPY` in `config.ts`:

#### Problem-Aware Ads (PA-01 to PA-06)

| ID | Badge | Headline | Focus |
|----|-------|----------|-------|
| PA-01 | READY TO POST | Post Today | Urgency to post now |
| PA-02 | GOING VIRAL? | Don't Let a Watermark Stop You | Fear of missed opportunity |
| PA-03 | WATERMARK RUINS IT | We Fixed That | Direct problem/solution |
| PA-04 | STOP SCROLLING | This Changes Everything | Pattern interrupt |
| PA-05 | CONTENT STUCK? | Free It In Seconds | Unlock potential |
| PA-06 | WATERMARK PROBLEM? | Gone In 3 Seconds | Speed promise |

#### Solution-Aware Ads (SA-01 to SA-06)

| ID | Badge | Headline | Focus |
|----|-------|----------|-------|
| SA-01 | #1 WATERMARK REMOVER | See Why Creators Switch | Social proof |
| SA-02 | AI-POWERED | Pixel-Perfect Removal | Technology angle |
| SA-03 | FREE TRIAL | Remove Your First Watermark Free | Risk reversal |
| SA-04 | TRUSTED BY 50K+ | Join Smart Creators | Community proof |
| SA-05 | WORKS ON ANYTHING | Logos, Text, Timestamps | Versatility |
| SA-06 | INSTANT RESULTS | Upload → Remove → Download | Simplicity |

### Copy Structure

Each ad copy variant includes:

```typescript
{
  id: 'PA-01',
  name: 'Post Today',
  badge: 'READY TO POST',
  headline: 'Post Today',
  subheadline: 'Remove the watermark—\nkeep the magic.',
  cta: 'TRY FREE',
  underButtonText: 'No credit card required',
  trustLine: 'Trusted by 50,000+ Creators',
  footerText: 'blanklogo.app',
  beforeSubLabel: 'Watermark ruins it',
  afterSubLabel: 'Ready to post',
}
```

---

## Aspect Ratios & Formats

### Supported Formats

| Format | Dimensions | Use Case |
|--------|------------|----------|
| **9:16** | 1080×1920 | Instagram Reels, TikTok, Stories |
| **4:5** | 1080×1350 | Instagram Feed, Facebook Feed |
| **16:9** | 1280×720 | YouTube, Facebook Video, LinkedIn |

### Composition Naming

Compositions follow this pattern:
```
BlankLogo-{videoId}-{copyId}-{aspectRatio}

Examples:
- BlankLogo-video1-PA01-9x16
- BlankLogo-video3-SA02-4x5
- BlankLogo-video5-PA01-16x9
```

---

## Step-by-Step: Adding New Video Pairs

### Step 1: Copy Videos to Public Folder

```bash
cd /Users/isaiahdupree/Documents/Software/Remotion

# Copy before video (with watermark)
cp "/path/to/original-with-watermark.mp4" public/blanklogo/video9-before.mp4

# Copy after video (watermark removed)  
cp "/path/to/cleaned-no-watermark.mp4" public/blanklogo/video9-after.mp4
```

### Step 2: Re-encode for Web Compatibility

```bash
# Re-encode before video
ffmpeg -y -i public/blanklogo/video9-before.mp4 \
  -c:v libx264 -preset fast -crf 23 \
  -c:a aac -b:a 128k -movflags +faststart \
  public/blanklogo/video9-before-web.mp4

# Re-encode after video
ffmpeg -y -i public/blanklogo/video9-after.mp4 \
  -c:v libx264 -preset fast -crf 23 \
  -c:a aac -b:a 128k -movflags +faststart \
  public/blanklogo/video9-after-web.mp4
```

### Step 3: Add to VIDEO_PAIRS Config

Edit `src/compositions/blanklogo/config.ts`:

```typescript
export const VIDEO_PAIRS = [
  // ... existing pairs
  {
    id: 'video9',
    name: 'Video 9',
    beforeSrc: 'blanklogo/video9-before-web.mp4',
    afterSrc: 'blanklogo/video9-after-web.mp4',
  },
] as const;
```

### Step 4: Create Output Directories

```bash
mkdir -p out/blanklogo-ads/video/video9/{9x16,4x5,16x9}
```

### Step 5: Render Videos

```bash
# 9:16 format (Reels/Stories)
npx remotion render BlankLogo-video9-PA01-9x16 \
  out/blanklogo-ads/video/video9/9x16/PA-01-PostToday.mp4

# 4:5 format (Feed)
npx remotion render BlankLogo-video9-PA01-4x5 \
  out/blanklogo-ads/video/video9/4x5/PA-01-PostToday.mp4

# 16:9 format (YouTube/Facebook)
npx remotion render BlankLogo-video9-PA01-16x9 \
  out/blanklogo-ads/video/video9/16x9/PA-01-PostToday.mp4
```

---

## Rendering Commands

### Single Video Render

```bash
npx remotion render {CompositionId} {OutputPath}

# Example:
npx remotion render BlankLogo-video1-PA01-9x16 \
  out/blanklogo-ads/video/video1/9x16/PA-01-PostToday.mp4
```

### Batch Render All Formats for One Video Pair

```bash
VIDEO_ID="video1"
COPY_ID="PA01"
COPY_NAME="PostToday"

npx remotion render BlankLogo-${VIDEO_ID}-${COPY_ID}-9x16 \
  out/blanklogo-ads/video/${VIDEO_ID}/9x16/${COPY_ID}-${COPY_NAME}.mp4

npx remotion render BlankLogo-${VIDEO_ID}-${COPY_ID}-4x5 \
  out/blanklogo-ads/video/${VIDEO_ID}/4x5/${COPY_ID}-${COPY_NAME}.mp4

npx remotion render BlankLogo-${VIDEO_ID}-${COPY_ID}-16x9 \
  out/blanklogo-ads/video/${VIDEO_ID}/16x9/${COPY_ID}-${COPY_NAME}.mp4
```

### Preview in Remotion Studio

```bash
npx remotion studio
```

Then open http://localhost:3000 in browser to preview compositions.

---

## Output Structure

### Current Video Inventory

As of January 2026, we have **8 video pairs** generating **24 video ads** (with PA-01 copy):

```
out/blanklogo-ads/video/
├── video1/
│   ├── 9x16/PA-01-PostToday.mp4   (4.0 MB)
│   ├── 4x5/PA-01-PostToday.mp4    (3.5 MB)
│   └── 16x9/PA-01-PostToday.mp4   (3.1 MB)
├── video2/
│   ├── 9x16/PA-01-PostToday.mp4   (4.7 MB)
│   ├── 4x5/PA-01-PostToday.mp4    (3.6 MB)
│   └── 16x9/PA-01-PostToday.mp4   (2.5 MB)
├── video3/
│   ├── 9x16/PA-01-PostToday.mp4   (8.5 MB)
│   ├── 4x5/PA-01-PostToday.mp4    (6.4 MB)
│   └── 16x9/PA-01-PostToday.mp4   (4.3 MB)
├── video4/
│   ├── 9x16/PA-01-PostToday.mp4   (7.2 MB)
│   ├── 4x5/PA-01-PostToday.mp4    (5.6 MB)
│   └── 16x9/PA-01-PostToday.mp4   (4.3 MB)
├── video5/
│   ├── 9x16/PA-01-PostToday.mp4   (6.0 MB)
│   ├── 4x5/PA-01-PostToday.mp4    (4.8 MB)
│   └── 16x9/PA-01-PostToday.mp4   (3.3 MB)
├── video6/
│   ├── 9x16/PA-01-PostToday.mp4   (7.4 MB)
│   ├── 4x5/PA-01-PostToday.mp4    (5.6 MB)
│   └── 16x9/PA-01-PostToday.mp4   (3.9 MB)
├── video7/
│   ├── 9x16/PA-01-PostToday.mp4   (6.9 MB)
│   ├── 4x5/PA-01-PostToday.mp4    (5.2 MB)
│   └── 16x9/PA-01-PostToday.mp4   (3.5 MB)
└── video8/
    ├── 9x16/PA-01-PostToday.mp4   (5.4 MB)
    ├── 4x5/PA-01-PostToday.mp4    (4.0 MB)
    └── 16x9/PA-01-PostToday.mp4   (2.9 MB)
```

### Naming Convention for Outputs

```
{COPY_ID}-{CopyName}.mp4

Examples:
- PA-01-PostToday.mp4
- PA-02-GoingViral.mp4
- SA-01-CreatorsSwitch.mp4
```

---

## Troubleshooting

### Common Issues

#### 1. MEDIA_ELEMENT_ERROR: Format error

**Cause:** Video codec incompatible with web playback.

**Solution:** Re-encode with ffmpeg:
```bash
ffmpeg -y -i input.mp4 \
  -c:v libx264 -preset fast -crf 23 \
  -c:a aac -b:a 128k -movflags +faststart \
  output-web.mp4
```

#### 2. 404 Not Found for Video Assets

**Cause:** Video file path incorrect or file doesn't exist.

**Solution:** 
1. Verify file exists in `public/blanklogo/`
2. Check `VIDEO_PAIRS` config has correct path
3. Ensure file name matches exactly (case-sensitive)

#### 3. Video Not Showing in Composition

**Cause:** `staticFile()` wrapper missing.

**Solution:** In `Root.tsx`, ensure video sources use:
```typescript
beforeVideoSrc: staticFile(video.beforeSrc),
afterVideoSrc: staticFile(video.afterSrc),
```

#### 4. Slow Renders

**Tips:**
- Render multiple videos in parallel (separate terminal windows)
- Use `--concurrency` flag: `npx remotion render --concurrency=8`
- Close other applications to free up CPU/RAM

---

## Technical Reference

### Key Files

| File | Purpose |
|------|---------|
| `src/compositions/blanklogo/config.ts` | Copy matrix & video pairs config |
| `src/compositions/blanklogo/BeforeAfterVideo.tsx` | Main video ad component |
| `src/compositions/blanklogo/index.ts` | Export aggregator |
| `src/Root.tsx` | Composition registration |

### BeforeAfterVideo Component Props

```typescript
interface BeforeAfterVideoProps {
  // Video sources
  beforeVideoSrc: string;
  afterVideoSrc: string;
  
  // Timing (in frames, 30fps)
  beforeStartFrame?: number;  // Default: 60 (2 seconds)
  afterStartFrame?: number;   // Default: 60
  beforeDuration?: number;    // Default: 90 (3 seconds)
  afterDuration?: number;     // Default: 90
  
  // Copy elements
  headline: string;
  subheadline: string;
  badge: string;
  cta: string;
  underButtonText: string;
  trustLine: string;
  footerText: string;
  beforeSubLabel: string;
  afterSubLabel: string;
  
  // Layout
  aspectRatio: '9:16' | '4:5' | '16:9';
}
```

### Composition Registration Pattern

In `Root.tsx`, compositions are dynamically generated:

```typescript
{VIDEO_PAIRS.map((video) => (
  <Composition
    key={`${video.id}-PA01-9x16`}
    id={`BlankLogo-${video.id}-PA01-9x16`}
    component={BeforeAfterVideo}
    durationInFrames={300}  // 10 seconds at 30fps
    fps={30}
    width={1080}
    height={1920}  // 9:16 aspect ratio
    defaultProps={{
      beforeVideoSrc: staticFile(video.beforeSrc),
      afterVideoSrc: staticFile(video.afterSrc),
      beforeStartFrame: 60,
      afterStartFrame: 60,
      beforeDuration: 90,
      afterDuration: 90,
      headline: VIDEO_AD_COPY.problemAware[0].headline,
      subheadline: VIDEO_AD_COPY.problemAware[0].subheadline,
      badge: VIDEO_AD_COPY.problemAware[0].badge,
      cta: VIDEO_AD_COPY.problemAware[0].cta,
      underButtonText: VIDEO_AD_COPY.problemAware[0].underButtonText,
      trustLine: VIDEO_AD_COPY.problemAware[0].trustLine,
      footerText: VIDEO_AD_COPY.problemAware[0].footerText,
      beforeSubLabel: VIDEO_AD_COPY.problemAware[0].beforeSubLabel,
      afterSubLabel: VIDEO_AD_COPY.problemAware[0].afterSubLabel,
      aspectRatio: '9:16' as const,
    }}
  />
))}
```

---

## Quick Reference Commands

### Setup New Video Pair (Complete Workflow)

```bash
# Variables - change these
VIDEO_NUM=9
BEFORE_PATH="/path/to/original-watermarked.mp4"
AFTER_PATH="/path/to/cleaned.mp4"

# Navigate to project
cd /Users/isaiahdupree/Documents/Software/Remotion

# Copy files
cp "$BEFORE_PATH" public/blanklogo/video${VIDEO_NUM}-before.mp4
cp "$AFTER_PATH" public/blanklogo/video${VIDEO_NUM}-after.mp4

# Re-encode for web
ffmpeg -y -i public/blanklogo/video${VIDEO_NUM}-before.mp4 \
  -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -movflags +faststart \
  public/blanklogo/video${VIDEO_NUM}-before-web.mp4

ffmpeg -y -i public/blanklogo/video${VIDEO_NUM}-after.mp4 \
  -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -movflags +faststart \
  public/blanklogo/video${VIDEO_NUM}-after-web.mp4

# Create output directories
mkdir -p out/blanklogo-ads/video/video${VIDEO_NUM}/{9x16,4x5,16x9}

# After updating config.ts with new video pair, render:
npx remotion render BlankLogo-video${VIDEO_NUM}-PA01-9x16 \
  out/blanklogo-ads/video/video${VIDEO_NUM}/9x16/PA-01-PostToday.mp4

npx remotion render BlankLogo-video${VIDEO_NUM}-PA01-4x5 \
  out/blanklogo-ads/video/video${VIDEO_NUM}/4x5/PA-01-PostToday.mp4

npx remotion render BlankLogo-video${VIDEO_NUM}-PA01-16x9 \
  out/blanklogo-ads/video/video${VIDEO_NUM}/16x9/PA-01-PostToday.mp4
```

### Open Output Folders

```bash
open out/blanklogo-ads/video/video1
open out/blanklogo-ads/video/video2
# ... etc
```

### List All Rendered Videos

```bash
find out/blanklogo-ads/video -name "*.mp4" -exec ls -lh {} \;
```

---

## Version History

| Date | Changes |
|------|---------|
| Jan 2026 | Initial setup with video pairs 1-4 |
| Jan 2026 | Added video pairs 5-8 |
| Jan 2026 | Created this documentation |

---

## Contact & Resources

- **Remotion Docs:** https://www.remotion.dev/docs
- **FFmpeg Docs:** https://ffmpeg.org/documentation.html
- **BlankLogo App:** https://blanklogo.app
