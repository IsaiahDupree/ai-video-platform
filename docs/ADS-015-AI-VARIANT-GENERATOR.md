# ADS-015: AI Variant Generator

## Overview

The AI Variant Generator uses OpenAI's GPT models to automatically generate creative variations of ad copy (headlines, subheadlines, CTAs, and body text). This feature helps marketers quickly explore different messaging options for A/B testing and campaign optimization.

## Features

- **AI-Powered Generation**: Uses GPT-4o-mini by default for fast, cost-effective generation
- **Multiple Variant Types**: Supports headlines, subheadlines, CTAs, and body copy
- **Customizable Tone**: Choose from professional, casual, urgent, friendly, or persuasive tones
- **Brand Context**: Optionally provide brand voice, industry, and target audience for more relevant variants
- **Ranking System**: Automatically scores and ranks variants by quality
- **Batch Generation**: Generate variants for multiple fields in parallel
- **UI Integration**: Seamless integration with the Ad Editor via "✨ AI" buttons

## Usage

### From the Ad Editor UI

1. Navigate to `/ads/editor`
2. Enter your original text in any text field (headline, subheadline, CTA)
3. Click the "✨ AI" button next to the field
4. Click "Generate 10 AI Variants"
5. Review the generated variants
6. Select your favorite variant
7. Click "Apply Selected Variant"

### From the API

```typescript
// POST /api/ads/generate-variants
const response = await fetch('/api/ads/generate-variants', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    originalText: 'Transform Your Business with AI',
    type: 'headline',
    count: 10,
    tone: 'professional',
    brandVoice: 'innovative, trustworthy, forward-thinking',
    industry: 'Technology',
    targetAudience: 'Business executives',
  }),
});

const data = await response.json();
console.log(data.variants); // Array of 10 variants
```

### From Code

```typescript
import { generateVariants } from '../services/aiVariants';

const result = await generateVariants({
  originalText: 'Shop the Summer Sale',
  type: 'headline',
  count: 10,
  tone: 'casual',
});

console.log(result.variants); // Array of generated variants
console.log(result.usage.totalTokens); // Token usage
```

### CLI Testing

```bash
npx tsx scripts/test-ai-variants.ts
```

This runs a comprehensive test suite covering:
- Single variant generation
- Multiple fields in parallel
- Generation with brand context
- All variant types

## API Reference

### `generateVariants(options)`

Generate AI-powered text variants.

**Parameters:**

```typescript
interface VariantGenerationOptions {
  originalText: string;          // The text to generate variants for
  type: VariantType;              // 'headline' | 'subheadline' | 'body' | 'cta'
  count?: number;                 // Number of variants (default: 10)
  tone?: string;                  // 'professional' | 'casual' | 'urgent' | 'friendly' | 'persuasive'
  brandVoice?: string;            // Optional brand voice description
  industry?: string;              // Optional industry context
  targetAudience?: string;        // Optional target audience
  model?: string;                 // 'gpt-4o' | 'gpt-4o-mini' | 'gpt-3.5-turbo' (default: gpt-4o-mini)
}
```

**Returns:**

```typescript
interface VariantGenerationResult {
  originalText: string;
  type: VariantType;
  variants: string[];            // Array of generated variants
  model: string;                 // Model used
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

### `generateMultipleVariants(fields)`

Generate variants for multiple text fields in parallel.

**Parameters:**

```typescript
const results = await generateMultipleVariants([
  { text: 'Headline 1', type: 'headline', options: { tone: 'professional' } },
  { text: 'Subheadline 1', type: 'subheadline' },
  { text: 'Call to Action', type: 'cta', options: { tone: 'urgent' } },
]);
```

### `rankVariants(original, variants)`

Score and rank variants by quality (0-100).

```typescript
import { rankVariants } from '../services/aiVariants';

const ranked = rankVariants('Original text', ['Variant 1', 'Variant 2']);
// Returns: [{ variant: 'Variant 2', score: 85 }, { variant: 'Variant 1', score: 72 }]
```

## Configuration

### Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...

# Optional (defaults to gpt-4o-mini)
OPENAI_MODEL=gpt-4o-mini
```

### Model Selection

- **gpt-4o-mini** (default): Fast and cost-effective, great for most use cases
- **gpt-4o**: More creative and nuanced, higher quality but more expensive
- **gpt-3.5-turbo**: Fastest and cheapest, good for simple variations

## Best Practices

### Writing Effective Original Text

1. **Be specific**: "Increase productivity by 50%" is better than "Be more productive"
2. **Include key benefits**: The AI will maintain your core message
3. **Use active voice**: "Transform your workflow" vs "Your workflow will be transformed"

### Choosing the Right Tone

- **Professional**: B2B, enterprise, formal communications
- **Casual**: DTC, lifestyle brands, social media
- **Urgent**: Limited-time offers, flash sales, FOMO
- **Friendly**: Community-focused, welcoming, approachable
- **Persuasive**: High-conversion landing pages, sales copy

### Using Brand Context

Provide context for better results:

```typescript
{
  brandVoice: "innovative, trustworthy, empowering",
  industry: "Financial Technology",
  targetAudience: "Small business owners aged 30-45"
}
```

### Variant Selection

- Review all 10 variants before choosing
- Consider A/B testing multiple top-ranked variants
- Mix and match elements from different variants
- Regenerate if none feel quite right

## Examples

### Example 1: E-commerce Headline

```typescript
const result = await generateVariants({
  originalText: 'Summer Sale - Up to 50% Off Everything',
  type: 'headline',
  count: 10,
  tone: 'casual',
  industry: 'Fashion & Apparel',
});

// Possible variants:
// - "Your Summer Wardrobe Refresh Starts Here - 50% Off"
// - "Half Off, Full Style: Summer Sale Now On"
// - "Hot Deals for Hot Days - Save 50% Sitewide"
```

### Example 2: SaaS CTA

```typescript
const result = await generateVariants({
  originalText: 'Start Free Trial',
  type: 'cta',
  count: 10,
  tone: 'urgent',
  brandVoice: 'innovative, results-driven',
});

// Possible variants:
// - "Try It Free Today"
// - "Start Your Free Trial Now"
// - "Get Started Free"
```

### Example 3: B2B Subheadline

```typescript
const result = await generateVariants({
  originalText: 'Automate workflows, boost productivity, scale faster',
  type: 'subheadline',
  count: 10,
  tone: 'professional',
  targetAudience: 'Enterprise decision makers',
});

// Possible variants:
// - "Streamline operations and accelerate growth with intelligent automation"
// - "Drive efficiency, productivity, and scalable growth across your organization"
// - "Transform manual processes into automated workflows that scale"
```

## Cost Estimation

Approximate costs per generation (using gpt-4o-mini):

- **Headline** (10 variants): ~$0.001 - $0.002
- **Subheadline** (10 variants): ~$0.002 - $0.003
- **CTA** (10 variants): ~$0.001 - $0.002
- **Body** (10 variants): ~$0.003 - $0.005

For 100 campaigns with 3 fields each = ~$1.00 total

## Performance

- **Single generation**: 2-4 seconds
- **Parallel generation** (3 fields): 3-5 seconds
- **Model latency**:
  - gpt-4o-mini: 1-3 seconds
  - gpt-4o: 3-6 seconds
  - gpt-3.5-turbo: 1-2 seconds

## Troubleshooting

### "OpenAI API key not configured"

Ensure `OPENAI_API_KEY` is set in your `.env` file:

```bash
echo "OPENAI_API_KEY=sk-your-key" >> .env
```

### Variants are too similar to original

Try:
- Using a different tone
- Adding brand voice and target audience context
- Regenerating with a different model (gpt-4o instead of gpt-4o-mini)

### Variants are off-brand

Provide more specific brand context:

```typescript
{
  brandVoice: "Specific adjectives about your brand",
  industry: "Your specific industry",
  targetAudience: "Detailed demographic description"
}
```

### Generation is slow

- gpt-4o-mini is fastest and cheapest
- Use parallel generation for multiple fields
- Consider caching frequently used variants

### Rate limit errors

OpenAI has rate limits based on your plan:
- Free tier: 3 requests/minute
- Pay-as-you-go: 3,500 requests/minute

Implement exponential backoff or request queuing if needed.

## Technical Architecture

### Components

```
src/services/aiVariants.ts          # Core variant generation service
src/app/api/ads/generate-variants/  # Next.js API route
src/app/ads/editor/components/
  ├── VariantGenerator.tsx          # Modal UI component
  └── VariantGenerator.module.css   # Styles
src/app/ads/editor/components/
  └── AdEditorForm.tsx              # Integration with editor
scripts/test-ai-variants.ts         # CLI test script
```

### Data Flow

```
User clicks "✨ AI" button
  ↓
VariantGenerator modal opens
  ↓
User clicks "Generate 10 AI Variants"
  ↓
POST /api/ads/generate-variants
  ↓
generateVariants() service
  ↓
OpenAI API (gpt-4o-mini)
  ↓
Parse and validate response
  ↓
Return variants to UI
  ↓
User selects and applies variant
```

## Files Created

- `src/services/aiVariants.ts` - Core service (296 lines)
- `src/app/api/ads/generate-variants/route.ts` - API endpoint (55 lines)
- `src/app/ads/editor/components/VariantGenerator.tsx` - UI component (144 lines)
- `src/app/ads/editor/components/VariantGenerator.module.css` - Styles (269 lines)
- `scripts/test-ai-variants.ts` - Test suite (344 lines)
- `docs/ADS-015-AI-VARIANT-GENERATOR.md` - This documentation

**Total**: 1,108 lines of code

## Dependencies

- `openai` ^4.0.0 (already installed)
- `next` ^16.1.6 (already installed)
- `dotenv` ^16.0.3 (already installed)

## Testing

### Manual Testing Checklist

- [ ] Generate headline variants
- [ ] Generate subheadline variants
- [ ] Generate CTA variants
- [ ] Apply selected variant
- [ ] Regenerate variants
- [ ] Test with different tones
- [ ] Test with brand context
- [ ] Test error handling (no API key)
- [ ] Test empty text validation

### Automated Testing

```bash
# Run the test suite
npx tsx scripts/test-ai-variants.ts

# Expected output:
# ✓ All tests passed!
# Passed: 4/4 tests
```

## Future Enhancements

1. **Variant History**: Save and revisit previously generated variants
2. **Favorites**: Mark and save favorite variants
3. **A/B Test Integration**: Automatically create A/B test variants
4. **Batch Mode**: Generate variants for entire campaigns at once
5. **Custom Models**: Support for custom fine-tuned models
6. **Variant Analytics**: Track which variants perform best
7. **Multi-language**: Generate variants in different languages
8. **Tone Presets**: Save custom tone configurations per brand
9. **Smart Suggestions**: ML-powered variant recommendations based on past performance
10. **Export/Import**: Share variant sets between team members

## Related Features

- **ADS-004**: Ad Editor UI - The base editor interface
- **ADS-011**: Campaign Pack Generator - Bulk ad generation
- **ADS-012**: CSV/Feed Batch Import - Bulk variant generation
- **ADS-016**: Approval Workflow - Variant approval process

## License

Proprietary - AI Video Platform

## Support

For issues or questions:
- Check the troubleshooting section above
- Review the test script for usage examples
- Consult OpenAI documentation for API details

---

**Last Updated**: January 28, 2026
**Version**: 1.0
**Status**: ✅ Complete
