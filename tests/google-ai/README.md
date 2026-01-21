# Google AI Testing Suite

Test scripts for Google's **Imagen** (image generation) and **Veo** (video generation) APIs.

## Overview

This testing suite allows you to:
- Generate custom notebook cover designs using **Imagen 3**
- Create product showcase videos using **Veo**
- Generate before/after transition videos with custom frames

## Prerequisites

### 1. Get Google AI API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key to your environment variables

### 2. Set up environment

Create a `.env` file in the `tests/google-ai` directory:

```bash
GOOGLE_AI_API_KEY=your-google-ai-api-key-here
```

Or add it to your root `.env.local`:

```bash
GOOGLE_AI_API_KEY=your-google-ai-api-key-here
```

### 3. Install dependencies

```bash
cd tests/google-ai
npm install
```

## Usage

### Image Generation (Imagen)

Generate custom notebook cover designs:

```bash
npm run test:image
```

This will:
- Generate 3 different notebook cover designs
- Save images to `./output/images/`
- Display generation stats (size, time, etc.)

**Customize generation:**

```typescript
import { generateImage } from './test-image-generation';

await generateImage({
  prompt: 'Your custom prompt here',
  numberOfImages: 1,
  aspectRatio: '3:4', // Options: '1:1', '16:9', '9:16', '4:3', '3:4'
  outputDir: './output/images/custom',
});
```

### Video Generation (Veo)

Generate product showcase videos:

```bash
npm run test:video
```

This will:
- Generate product showcase videos
- Create before/after transition videos (if frames exist)
- Save videos to `./output/videos/`

**Text-to-video:**

```typescript
import { generateVideo } from './test-video-generation';

await generateVideo({
  prompt: 'A cinematic pan across a notebook cover',
  duration: 5,
  outputDir: './output/videos/showcase',
});
```

**Before/after frame transition:**

```typescript
await generateVideo({
  prompt: 'Smooth transition between two designs',
  beforeFrame: './path/to/before.png',
  afterFrame: './path/to/after.png',
  duration: 3,
  outputDir: './output/videos/transition',
});
```

### Run all tests

```bash
npm run test:all
```

## Output Structure

```
tests/google-ai/
├── output/
│   ├── images/
│   │   ├── test1-notebook-cover/
│   │   │   └── generated-*.png
│   │   ├── test2-faith-journal/
│   │   │   └── generated-*.png
│   │   └── test3-teacher-planner/
│   │       └── generated-*.png
│   └── videos/
│       ├── test1-product-showcase/
│       │   └── generated-*.mp4
│       ├── test2-before-after/
│       │   └── generated-*.mp4
│       └── test3-notebook-opening/
│           └── generated-*.mp4
```

## API Models

### Imagen 3 (`imagen-3.0-generate-001`)
- High-quality image generation
- Supports multiple aspect ratios
- Best for: Product designs, covers, marketing materials

### Veo (`veo-001`)
- Video generation from text prompts
- Supports frame-to-frame transitions
- Best for: Product showcases, animations, transitions

## Pricing (as of 2024)

### Imagen 3
- **Standard quality**: ~$0.04 per image
- **HD quality**: ~$0.08 per image

### Veo
- **Video generation**: ~$0.10 per second
- 5-second video ≈ $0.50

Check [Google AI Pricing](https://ai.google.dev/pricing) for current rates.

## Use Cases for VelloPad

### 1. Automated Cover Design Generation
Generate multiple cover variations for A/B testing:
```typescript
const prompts = [
  'Minimalist geometric pattern in navy and gold',
  'Watercolor floral design with soft pastels',
  'Bold typography with abstract shapes',
];

for (const prompt of prompts) {
  await generateImage({ prompt, aspectRatio: '3:4' });
}
```

### 2. Product Showcase Videos
Create marketing videos for each notebook design:
```typescript
await generateVideo({
  prompt: `Professional product showcase of ${notebookName}, 
           rotating view with soft lighting`,
  duration: 5,
});
```

### 3. Before/After Customization Videos
Show customers how their customizations transform the product:
```typescript
await generateVideo({
  prompt: 'Smooth morphing transition showing customization',
  beforeFrame: './stock-design.png',
  afterFrame: './customized-design.png',
  duration: 3,
});
```

### 4. Template Previews
Generate preview images for template marketplace:
```typescript
await generateImage({
  prompt: 'Interior page layout for prayer journal template',
  aspectRatio: '3:4',
});
```

## Integration with VelloPad

To integrate into the main app:

1. **Add to main package.json:**
   ```bash
   npm install @google/generative-ai
   ```

2. **Create service wrapper:**
   ```typescript
   // lib/services/google-ai.ts
   import { generateImage } from '@/tests/google-ai/test-image-generation';
   import { generateVideo } from '@/tests/google-ai/test-video-generation';
   
   export { generateImage, generateVideo };
   ```

3. **Add API routes:**
   ```typescript
   // app/api/generate/image/route.ts
   // app/api/generate/video/route.ts
   ```

4. **Use in components:**
   ```typescript
   const handleGenerateCover = async () => {
     const response = await fetch('/api/generate/image', {
       method: 'POST',
       body: JSON.stringify({ prompt, aspectRatio: '3:4' }),
     });
   };
   ```

## Troubleshooting

### "Cannot find module '@google/generative-ai'"
```bash
npm install
```

### "GOOGLE_AI_API_KEY environment variable is required"
Make sure your `.env` file exists and contains the API key.

### "No images/videos generated"
Check your API key permissions and quota limits in Google AI Studio.

### TypeScript errors
```bash
npm install --save-dev @types/node typescript ts-node
```

## Best Practices

1. **Prompt Engineering**
   - Be specific and descriptive
   - Include style keywords (minimalist, professional, elegant)
   - Mention quality (high quality, 4K, professional)

2. **Aspect Ratios**
   - Notebook covers: `3:4` or `4:3`
   - Social media: `1:1` or `9:16`
   - Banners: `16:9`

3. **Cost Optimization**
   - Cache generated images
   - Use batch generation for variations
   - Generate videos only for final designs

4. **Quality Control**
   - Review generated content before using
   - Test with multiple prompts
   - A/B test different styles

## Resources

- [Google AI Studio](https://makersuite.google.com/)
- [Imagen Documentation](https://ai.google.dev/docs/imagen)
- [Veo Documentation](https://ai.google.dev/docs/veo)
- [Prompt Guide](https://ai.google.dev/docs/prompt_best_practices)

## Support

For issues or questions:
1. Check the [Google AI documentation](https://ai.google.dev/docs)
2. Review the test output logs
3. Verify API key and quota limits
