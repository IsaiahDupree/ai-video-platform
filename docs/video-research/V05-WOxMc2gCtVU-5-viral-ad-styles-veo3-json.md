# Video Analysis: Turn Any Image into 5 Viral AI Ads with Google VEO 3 (Free JSON Prompts)

**URL:** https://www.youtube.com/watch?v=WOxMc2gCtVU  
**Topic:** 5 ad styles using Veo 3 image-to-video with JSON prompts via ChatGPT  
**Tools:** Google Veo 3 (Frames to Video) + ChatGPT (JSON prompt generation)  
**Product Types:** Smartwatch, Food/Burger, Home gadgets, Tech products

---

## The 5 Ad Styles

### Style 1: Cinematic Showcase Ad
**Best for:** Gadgets, electronics, fashion, high-end perfumes  
**Goal:** Create emotion — luxury brand commercial feel  
**Visual elements:** Dramatic slow motion, rich colors, lens flares, rain/fog, neon lights  
**Music:** Emotional, larger-than-life  

**ChatGPT Prompt:**
```
Create a JSON prompt for a cinematic slow motion ad showing [product image] 
under rain with neon lights rotating in the air with fog, lens flare, and 
emotional music. Add zooms, panning shots, and a dramatic tone.
```

**Example JSON structure:**
```json
{
  "scene": "cinematic slow motion product reveal",
  "product": "black titanium smartwatch on marble pedestal",
  "lighting": "dramatic blue glow, smoke background",
  "camera": "slow zoom in, panning shots, lens flare",
  "atmosphere": "rain, fog, neon reflections",
  "style": "4K luxury brand commercial",
  "audio": "emotional orchestral music"
}
```

---

### Style 2: Foodie Viral Ad
**Best for:** Restaurants, recipe videos, packaged snacks  
**Goal:** Make audience taste the product through the screen  
**Visual elements:** Slow zooms, sizzling sound effects, melting textures, close-up bite shots  

**ChatGPT Prompt:**
```
Create a JSON prompt for a viral food ad showing [food product]. 
Include: slow zoom, sizzling sounds, melting texture, steam rising, 
bite in slow motion. Style: TikTok/Instagram viral food content.
```

---

### Style 3: Product Demo Ad
**Best for:** Home gadgets, physical tools, e-commerce products  
**Goal:** Show product in action — no fluff, just clear real-time demo  
**Visual elements:** Clean transitions, realistic settings, product in use  

**ChatGPT Prompt:**
```
Create a JSON prompt for a product demo ad showing [product] in action.
Include: realistic setting, clean transitions, product being used step by step.
Style: trust-building, clear, informative.
```

---

### Style 4: Unboxing Ad
**Best for:** Tech gadgets, mystery boxes, beauty products  
**Goal:** Simulate realistic unboxing experience  
**Visual elements:** Packaging reveal, items pulled out one by one, close-up shots  

---

### Style 5: UGC Trend Ad (AI Twist)
**Best for:** Gen Z brands, UGC-focused stores, organic TikTok traffic  
**Goal:** Authentic user-generated vibe without hiring creators  
**Visual elements:** Casual moment, quick review, lifestyle clip that blends into social feeds  

**ChatGPT Prompt:**
```
Create a JSON prompt for a UGC-style ad for [product].
Style: authentic, casual, like a real person's TikTok review.
Include: handheld camera feel, natural lighting, conversational tone.
No text overlays, no subtitles.
```

---

## The JSON Prompt System

### Why JSON Prompts?
- Structured format forces complete specification
- ChatGPT fills in all required fields
- Consistent results across generations
- Easy to iterate (change one field at a time)

### Universal JSON Template
```json
{
  "scene_type": "[cinematic/ugc/demo/unboxing/food]",
  "product": "[exact product description]",
  "character": "[if UGC: age, gender, ethnicity, emotional state]",
  "setting": "[location, time of day, lighting]",
  "camera": "[movement type: handheld/gimbal/static/drone]",
  "action": "[what happens in the video]",
  "atmosphere": "[mood, color grade, style]",
  "format": "9:16 vertical, 8 seconds",
  "restrictions": "no text overlays, no subtitles, no captions"
}
```

### How to Use
1. Choose ad style from the 5 above
2. Copy the ChatGPT prompt for that style
3. Attach your product image
4. ChatGPT generates complete JSON prompt
5. Paste JSON into Google Veo 3 (Frames to Video)
6. Upload product image in asset section
7. Generate

---

## Key Learnings

1. **JSON prompts = consistent, repeatable results** — not random text prompts
2. **Same product image → 5 different ad styles** — no need for multiple photos
3. **ChatGPT as prompt engineer** — let it generate the full Veo 3 prompt
4. **Frames to Video** is the key Veo 3 feature for product ads (image → video)
5. **Style selection = targeting** — cinematic for premium, UGC for Gen Z, demo for trust

---

## Pipeline Implications

| Learning | Implementation |
|----------|---------------|
| JSON prompt structure | Convert our text prompts to JSON format for Veo 3 |
| 5 ad styles as templates | Add `adStyle` field to angle config: cinematic/ugc/demo/unboxing/food |
| ChatGPT as prompt engineer | Add prompt-generation step before video generation |
| Frames to Video | Use image-to-video endpoint for product-anchored ads |
