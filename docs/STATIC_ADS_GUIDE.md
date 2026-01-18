# Static Ads Guide - Remotion

Generate static image ads for social media, display advertising, and more using Remotion.

## Quick Start

```bash
# Render a single ad
npx remotion still StaticAd-Instagram-Post output/my-ad.png

# Render with custom props
npx remotion still StaticAd-Instagram-Post output/my-ad.png --props='{"headline":"50% Off Today!"}'

# Render all ads at once
npx tsx scripts/render-static-ads.ts --all
```

## Available Ad Templates

### Basic Static Ad
Generic template for any use case.

| Composition ID | Size | Use Case |
|----------------|------|----------|
| `StaticAd-Instagram-Post` | 1080x1080 | Instagram feed |
| `StaticAd-Instagram-Story` | 1080x1920 | Instagram/TikTok stories |
| `StaticAd-Facebook-Post` | 1200x630 | Facebook feed |
| `StaticAd-Twitter-Post` | 1200x675 | Twitter/X posts |
| `StaticAd-LinkedIn-Post` | 1200x627 | LinkedIn feed |
| `StaticAd-Medium-Rectangle` | 300x250 | Display ads |
| `StaticAd-Leaderboard` | 728x90 | Website banners |

### Specialized Templates

| Composition ID | Purpose |
|----------------|---------|
| `SaleAd-Instagram-Post` | Sales/promotions with big percentage |
| `ProductAd-Instagram-Post` | Product showcase with price |
| `TestimonialAd-Instagram-Post` | Customer quotes/reviews |
| `EventAd-Instagram-Story` | Events and announcements |

## Customizable Props

### Basic Ad Props

```typescript
interface StaticAdProps {
  // Content
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  logoSrc?: string;
  backgroundImageSrc?: string;
  productImageSrc?: string;
  
  // Styling
  theme?: 'dark' | 'light' | 'gradient' | 'custom';
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  
  // Layout
  layout?: 'centered' | 'left' | 'right' | 'top' | 'bottom' | 'overlay';
  
  // Typography
  headlineSize?: number;
  subheadlineSize?: number;
  fontFamily?: string;
}
```

### Sale Ad Props
```typescript
{
  salePercentage: '50%',
  saleText: 'OFF',
  validUntil: 'December 31, 2026',
  headline: 'Holiday Sale',
  ctaText: 'Shop Now'
}
```

### Product Ad Props
```typescript
{
  productName: 'Premium Headphones',
  price: '$299.99',
  discount: '$399.99',  // Original price (strikethrough)
  productImageSrc: 'path/to/image.png',
  ctaText: 'Buy Now'
}
```

### Testimonial Ad Props
```typescript
{
  quote: 'This product changed my workflow completely!',
  authorName: 'Jane Smith',
  authorTitle: 'CEO, TechCorp',
  authorImageSrc: 'path/to/avatar.png',
  rating: 5  // Shows star rating
}
```

### Event Ad Props
```typescript
{
  headline: 'Product Launch 2026',
  eventDate: 'January 15, 2026',
  eventTime: '7:00 PM EST',
  eventLocation: 'Virtual Event',
  ctaText: 'Register Now'
}
```

## Rendering Examples

### Basic Render
```bash
npx remotion still StaticAd-Instagram-Post output/ad.png
```

### Custom Headline & CTA
```bash
npx remotion still StaticAd-Instagram-Post output/ad.png \
  --props='{"headline":"Launch Your Business","subheadline":"Start today with our tools","ctaText":"Get Started"}'
```

### Sale Ad with Custom Percentage
```bash
npx remotion still SaleAd-Instagram-Post output/sale.png \
  --props='{"salePercentage":"75%","headline":"Black Friday Sale","validUntil":"November 30"}'
```

### With Background Image
```bash
npx remotion still StaticAd-Instagram-Post output/ad.png \
  --props='{"backgroundImageSrc":"public/assets/images/hero.jpg","layout":"overlay","headline":"New Collection"}'
```

### Different Format (JPEG, WebP, PDF)
```bash
npx remotion still StaticAd-Instagram-Post output/ad.jpg --image-format=jpeg
npx remotion still StaticAd-Instagram-Post output/ad.webp --image-format=webp
npx remotion still StaticAd-Instagram-Post output/ad.pdf --image-format=pdf
```

## Batch Rendering

Use the custom script to render multiple ads:

```bash
# Render all static ads
npx tsx scripts/render-static-ads.ts --all

# Render specific ad with custom props
npx tsx scripts/render-static-ads.ts --id StaticAd-Instagram-Post --props '{"headline":"Custom"}'
```

## Ad Sizes Reference

### Social Media
| Platform | Size | Aspect Ratio |
|----------|------|--------------|
| Instagram Post | 1080x1080 | 1:1 |
| Instagram Story | 1080x1920 | 9:16 |
| Facebook Post | 1200x630 | 1.91:1 |
| Facebook Cover | 820x312 | 2.63:1 |
| Twitter Post | 1200x675 | 16:9 |
| LinkedIn Post | 1200x627 | 1.91:1 |
| Pinterest Pin | 1000x1500 | 2:3 |

### Display Ads (IAB Standard)
| Name | Size |
|------|------|
| Leaderboard | 728x90 |
| Medium Rectangle | 300x250 |
| Large Rectangle | 336x280 |
| Wide Skyscraper | 160x600 |
| Half Page | 300x600 |
| Billboard | 970x250 |

### Mobile
| Name | Size |
|------|------|
| Mobile Banner | 320x50 |
| Mobile Leaderboard | 320x100 |
| Mobile Interstitial | 320x480 |

## Creating Custom Ad Sizes

Add new sizes in `src/compositions/StaticAds.tsx`:

```typescript
// In AD_SIZES constant
custom_size: { width: 800, height: 600, name: 'Custom Size' },
```

Then register in `src/Root.tsx`:

```typescript
<Still
  id="StaticAd-Custom-Size"
  component={StaticAd}
  width={AD_SIZES.custom_size.width}
  height={AD_SIZES.custom_size.height}
  defaultProps={staticAdDefaultProps}
/>
```

## Programmatic Rendering (Node.js)

```typescript
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';

const bundleLocation = await bundle({
  entryPoint: './src/index.ts',
});

const composition = await selectComposition({
  serveUrl: bundleLocation,
  id: 'StaticAd-Instagram-Post',
  inputProps: {
    headline: 'Dynamic Headline',
    ctaText: 'Click Here',
  },
});

await renderStill({
  composition,
  serveUrl: bundleLocation,
  output: './output/dynamic-ad.png',
  inputProps: {
    headline: 'Dynamic Headline',
    ctaText: 'Click Here',
  },
});
```

## File Locations

| File | Purpose |
|------|---------|
| `src/compositions/StaticAds.tsx` | Ad components and templates |
| `src/Root.tsx` | Still composition registration |
| `scripts/render-static-ads.ts` | Batch rendering script |
| `output/static-ads/` | Default output directory |

---

*Last updated: January 2, 2026*
