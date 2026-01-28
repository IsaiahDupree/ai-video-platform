# META-001: Meta Pixel Installation

**Status:** ✅ Complete
**Category:** Meta Pixel
**Priority:** P1
**Effort:** 5pts

## Overview

Installs the Meta Pixel (Facebook Pixel) base code on all pages of the application. The Meta Pixel is a JavaScript snippet that tracks user interactions and sends data to Facebook for conversion tracking, audience building, and ad optimization.

## Implementation

### Components Created

#### 1. MetaPixel Component (`src/components/MetaPixel.tsx`)

A client-side React component that loads the Meta Pixel script and initializes tracking.

```typescript
import { MetaPixel } from '@/components/MetaPixel';

// In layout or page
<MetaPixel pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID || ''} />
```

**Features:**
- Loads Meta Pixel asynchronously using Next.js Script component
- Automatically tracks PageView on mount
- Initializes `window.fbq` function for custom tracking
- Includes noscript fallback for users with JavaScript disabled
- Gracefully handles missing or invalid Pixel IDs

**Helper Functions:**
- `trackMetaEvent(eventName, parameters)` - Track standard Meta events
- `trackMetaCustomEvent(eventName, parameters)` - Track custom events
- `grantMetaConsent()` - Grant tracking consent
- `revokeMetaConsent()` - Revoke tracking consent

#### 2. Layout Integration (`src/app/layout.tsx`)

The Meta Pixel is loaded in the root layout to track all pages:

```typescript
import { MetaPixel } from '@/components/MetaPixel';

export default function RootLayout({ children }) {
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';

  return (
    <html lang="en">
      <head>
        <MetaPixel pixelId={metaPixelId} />
      </head>
      <body>
        <TrackingProvider>{children}</TrackingProvider>
      </body>
    </html>
  );
}
```

### Environment Configuration

Added `NEXT_PUBLIC_META_PIXEL_ID` to `.env.example`:

```bash
# Meta Pixel Configuration (Facebook/Instagram Ads)
# Get your Pixel ID from: https://business.facebook.com/events_manager
NEXT_PUBLIC_META_PIXEL_ID=your_meta_pixel_id_here
```

## Usage

### Setup

1. **Get your Meta Pixel ID:**
   - Go to [Facebook Events Manager](https://business.facebook.com/events_manager)
   - Select your pixel or create a new one
   - Copy the Pixel ID (15-16 digit number)

2. **Configure environment variable:**
   ```bash
   # .env.local
   NEXT_PUBLIC_META_PIXEL_ID=1234567890123456
   ```

3. **Verify installation:**
   ```javascript
   // In browser console
   window.fbq
   // Should output: function fbq() {...}
   ```

### Tracking Events

#### Standard Events

Track standard Meta events using `trackMetaEvent`:

```typescript
import { trackMetaEvent } from '@/components/MetaPixel';

// Track a lead
trackMetaEvent('Lead', {
  content_name: 'Newsletter Signup',
  value: 10.0,
  currency: 'USD',
});

// Track a purchase
trackMetaEvent('Purchase', {
  value: 99.0,
  currency: 'USD',
  content_type: 'product',
  contents: [{ id: 'pro-plan', quantity: 1 }],
});

// Track content view
trackMetaEvent('ViewContent', {
  content_name: 'Ad Template',
  content_ids: ['hero-banner'],
  content_type: 'product',
});
```

#### Custom Events

Track custom events using `trackMetaCustomEvent`:

```typescript
import { trackMetaCustomEvent } from '@/components/MetaPixel';

// Track video render
trackMetaCustomEvent('VideoRendered', {
  template_id: 'hero-banner',
  render_time: 2.5,
  output_format: 'mp4',
});

// Track feature usage
trackMetaCustomEvent('FeatureUsed', {
  feature_name: 'voice_clone',
  success: true,
});
```

### Consent Management

Implement GDPR/privacy compliance:

```typescript
import { grantMetaConsent, revokeMetaConsent } from '@/components/MetaPixel';

// User accepts cookies
function acceptCookies() {
  grantMetaConsent();
}

// User rejects cookies
function rejectCookies() {
  revokeMetaConsent();
}
```

## Standard Meta Events

The Meta Pixel supports these standard events:

### E-commerce Events
- **ViewContent** - User views a product/page
- **AddToCart** - User adds item to cart
- **InitiateCheckout** - User begins checkout
- **AddPaymentInfo** - User adds payment method
- **Purchase** - User completes purchase

### Lead Generation Events
- **Lead** - User submits lead form
- **CompleteRegistration** - User completes registration
- **Contact** - User contacts business

### Engagement Events
- **Search** - User performs search
- **ViewPage** - Generic page view (auto-tracked)
- **Subscribe** - User subscribes to service

### Custom Events
- Use `trackCustom` for non-standard events
- Custom events are less optimized for conversion tracking
- Use for internal tracking and custom audiences

## Meta Pixel Architecture

### How It Works

1. **Base Code Load:**
   - Script loads asynchronously via Next.js Script component
   - Creates `window.fbq` function
   - Initializes event queue

2. **PageView Tracking:**
   - Automatically tracks when component mounts
   - Fires on initial page load and client-side navigation
   - Includes URL, referrer, and user agent

3. **Event Tracking:**
   - Events sent to Facebook via `fbq('track', eventName, params)`
   - Data includes event parameters, timestamp, and user context
   - Facebook matches events to users via cookies and browser fingerprinting

4. **Data Collection:**
   - First-party cookies (`_fbp`, `_fbc`)
   - Button click information
   - URL parameters (fbclid)
   - Browser/device info

### Next.js Integration

**Why `NEXT_PUBLIC_` prefix?**
- Next.js only exposes env vars with `NEXT_PUBLIC_` to the browser
- Meta Pixel runs client-side and needs access to the Pixel ID
- Server-side env vars are not accessible in browser code

**Script Strategy:**
- Uses `strategy="afterInteractive"` for optimal loading
- Loads after page becomes interactive
- Doesn't block initial page render

## Testing

### Development Testing

```bash
# Run test suite
npm test -- scripts/test-meta-pixel.ts

# Run manual test
npm run test:meta-pixel
```

### Browser Testing

1. **Open browser DevTools:**
   ```javascript
   // Check if fbq is loaded
   window.fbq

   // Enable debug mode
   window.fbq('track', 'PageView', {}, { eventID: 'test-123' })
   ```

2. **Use Meta Pixel Helper:**
   - Install [Meta Pixel Helper Chrome Extension](https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)
   - Visit your site
   - Click the extension icon to see tracked events

3. **Facebook Events Manager:**
   - Go to [Events Manager](https://business.facebook.com/events_manager)
   - Click "Test Events" tab
   - Enter your website URL
   - Interact with your site and see events appear in real-time

### Test Events

```javascript
// Test Lead event
trackMetaEvent('Lead', {
  content_name: 'Test Form',
  value: 10.0,
  currency: 'USD',
});

// Test Purchase event
trackMetaEvent('Purchase', {
  value: 99.0,
  currency: 'USD',
  transaction_id: 'test-' + Date.now(),
  content_type: 'product',
  contents: [{ id: 'test-product', quantity: 1 }],
});

// Test custom event
trackMetaCustomEvent('TestEvent', {
  test_parameter: 'test_value',
  timestamp: Date.now(),
});
```

## Security & Privacy

### GDPR Compliance

1. **Consent Management:**
   - Use `grantMetaConsent()` / `revokeMetaConsent()`
   - Integrate with cookie consent banner
   - Don't load pixel until consent granted

2. **Data Minimization:**
   - Only track necessary events
   - Avoid tracking PII (email, phone, etc.)
   - Use hashed identifiers when needed

3. **User Rights:**
   - Provide opt-out mechanism
   - Document data collection in privacy policy
   - Honor data deletion requests

### Data Hashing

For PII (email, phone), use SHA256 hashing:

```typescript
import { createHash } from 'crypto';

function hashData(data: string): string {
  return createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
}

// Track with hashed email
trackMetaEvent('Lead', {
  em: hashData('user@example.com'),
  ph: hashData('+1234567890'),
});
```

## Debugging

### Common Issues

**Pixel not loading:**
- Check `NEXT_PUBLIC_META_PIXEL_ID` is set
- Verify Pixel ID is correct (15-16 digits)
- Check browser console for errors
- Disable ad blockers

**Events not appearing:**
- Check Meta Pixel Helper extension
- Verify Test Events in Events Manager
- Check browser console for warnings
- Ensure `window.fbq` exists

**Invalid Pixel ID:**
- Pixel ID should be numeric only
- Get from Events Manager, not Business Manager ID
- Don't confuse with Ad Account ID

### Debug Mode

Enable debug logging:

```typescript
// Add this after pixel initialization
if (process.env.NODE_ENV === 'development') {
  window.fbq('track', 'PageView', {}, {
    eventID: 'dev-' + Date.now(),
    debug: true,
  });
}
```

### Console Logging

```javascript
// Log all fbq calls
const originalFbq = window.fbq;
window.fbq = function(...args) {
  console.log('Meta Pixel:', args);
  return originalFbq.apply(this, args);
};
```

## Performance Impact

### Script Size
- Base script: ~30KB (gzipped)
- Loads asynchronously, doesn't block rendering
- Cached after first load

### Network Requests
- Initial script load: 1 request
- Per event: 1-2 requests
- Average payload: 1-5KB per event

### Best Practices
- Load after interactive (✓ implemented)
- Batch events when possible
- Use custom events sparingly
- Avoid tracking on every render

## Next Steps

After implementing META-001:

1. **META-002: PageView Tracking**
   - Track client-side navigation
   - Track route changes in SPA
   - Track virtual pageviews

2. **META-003: Standard Events Mapping**
   - Map app events to Meta standard events
   - Lead → signup_completed
   - Purchase → purchase_completed
   - ViewContent → pricing_page_view

3. **META-004: CAPI Server-Side Events**
   - Implement Conversions API
   - Server-side event tracking
   - Better iOS 14+ tracking

4. **META-005: Event Deduplication**
   - Use matching event_id for Pixel + CAPI
   - Prevent double counting
   - Improve attribution accuracy

## Resources

- [Meta Pixel Documentation](https://developers.facebook.com/docs/meta-pixel)
- [Standard Events Reference](https://developers.facebook.com/docs/meta-pixel/reference)
- [Events Manager](https://business.facebook.com/events_manager)
- [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)
- [Conversions API](https://developers.facebook.com/docs/marketing-api/conversions-api)

## Files Changed

- ✅ `src/components/MetaPixel.tsx` - Meta Pixel component (150 lines)
- ✅ `src/app/layout.tsx` - Layout integration (4 lines added)
- ✅ `.env.example` - Environment variable (3 lines added)
- ✅ `scripts/test-meta-pixel.ts` - Test suite (350 lines)
- ✅ `docs/META-001-META-PIXEL-INSTALLATION.md` - Documentation (600 lines)

**Total:** ~1,107 lines of code + documentation
