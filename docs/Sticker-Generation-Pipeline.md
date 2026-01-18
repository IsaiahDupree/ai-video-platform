# Sticker Generation Pipeline

**Feature Documentation**

**Version:** 1.0  
**Created:** January 17, 2026  
**Status:** Research & Implementation

---

## Overview

This document describes the pipeline for extracting people from photos to create transparent PNG stickers that can be used in video generation. The pipeline uses Meta's Segment Anything Model (SAM) for precise person segmentation.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        INPUT: Source Photos                              │
│                     (Selfies, portraits, full-body shots)                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    SEGMENTATION LAYER                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  Option A: Meta SAM (Segment Anything Model)                            │
│    - Local: SAM via Python (transformers library)                       │
│    - API: Replicate API (segment-anything)                              │
│                                                                          │
│  Option B: rembg (Background Removal)                                   │
│    - Simpler, faster, good for portraits                                │
│    - pip install rembg                                                  │
│                                                                          │
│  Option C: remove.bg API                                                │
│    - Cloud-based, high quality                                          │
│    - Requires API key                                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    POST-PROCESSING                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  - Edge refinement (feathering)                                         │
│  - Optional: Add drop shadow                                            │
│  - Optional: Add white outline (sticker effect)                         │
│  - Resize to standard dimensions                                        │
│  - Export as transparent PNG                                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    OUTPUT: Sticker Assets                                │
│                  public/assets/stickers/{user}/                          │
│                  ├── sticker_1.png                                       │
│                  ├── sticker_2.png                                       │
│                  └── manifest.json                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Options

### 1. Meta SAM (Segment Anything Model)

**Pros:**
- State-of-the-art segmentation
- Zero-shot capability (no training needed)
- Can segment any object with point/box prompts

**Cons:**
- Large model (~2.5GB)
- Requires GPU for fast inference
- More complex setup

**Implementation:**
```python
from transformers import SamModel, SamProcessor
from PIL import Image

processor = SamProcessor.from_pretrained("facebook/sam-vit-huge")
model = SamModel.from_pretrained("facebook/sam-vit-huge")

# Process image with center point prompt for person
inputs = processor(image, input_points=[[[512, 512]]], return_tensors="pt")
outputs = model(**inputs)
masks = processor.image_processor.post_process_masks(
    outputs.pred_masks, inputs["original_sizes"], inputs["reshaped_input_sizes"]
)
```

### 2. rembg (Recommended for Quick Implementation)

**Pros:**
- Simple pip install
- Fast inference
- Optimized for portraits/people
- No API key needed

**Cons:**
- Less precise than SAM for complex scenes
- Limited to background removal (no object selection)

**Implementation:**
```python
from rembg import remove
from PIL import Image

input_image = Image.open("selfie.jpg")
output_image = remove(input_image)
output_image.save("sticker.png")
```

### 3. Replicate API (Cloud SAM)

**Pros:**
- No local GPU needed
- Latest models available
- Pay-per-use

**Implementation:**
```python
import replicate

output = replicate.run(
    "meta/sam-2:latest",
    input={"image": open("selfie.jpg", "rb")}
)
```

---

## Implementation Plan

### Phase 1: Basic Sticker Generation (rembg)
1. Install rembg: `pip install rembg[gpu]` or `pip install rembg`
2. Create script: `scripts/generate-stickers.ts`
3. Process source photos from passport drive
4. Output transparent PNGs to `public/assets/stickers/`

### Phase 2: Sticker Effects
1. Add white outline effect (sticker border)
2. Add drop shadow option
3. Create multiple sizes (thumbnail, medium, large)

### Phase 3: Video Integration
1. Update TopicScene to support sticker overlays
2. Add sticker positioning and animation
3. Create sticker manifest for brief integration

---

## Script Usage

```bash
# Generate stickers from photos
npm run generate:stickers -- --input "/path/to/photos" --output "public/assets/stickers/isaiah"

# Generate stickers with effects
npm run generate:stickers -- --input "/path/to/photos" --outline --shadow
```

---

## Brief Integration

```json
{
  "sections": [
    {
      "id": "intro",
      "type": "topic",
      "content": {
        "heading": "Welcome!",
        "sticker": {
          "path": "assets/stickers/isaiah/sticker_1.png",
          "position": "bottom-right",
          "size": "medium",
          "animation": "bounce-in"
        }
      }
    }
  ]
}
```

---

## Source Photos Location

Photos identified on passport drive:
- `/Volumes/My Passport/MediaPoster/workspace1/iphone_import/IMG_0521.JPG` - Selfie with clear face
- Additional photos to scan in same directory

---

## Dependencies

```bash
# Python (for rembg)
pip install rembg pillow

# Or via npm script that calls Python
npm install sharp  # For image processing in Node.js
```

---

## References

- [Meta SAM GitHub](https://github.com/facebookresearch/segment-anything)
- [SAM-remove-background](https://github.com/MrSyee/SAM-remove-background)
- [rembg](https://github.com/danielgatis/rembg)
- [Hugging Face SAM](https://huggingface.co/facebook/sam-vit-huge)
