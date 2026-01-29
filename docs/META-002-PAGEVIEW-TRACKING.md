# META-002: PageView Tracking

**Status:** ✅ Complete
**Category:** Meta Pixel
**Priority:** P1
**Effort:** 5pts
**Dependencies:** META-001 (Meta Pixel Installation)

## Overview

Implements automatic PageView tracking for all pages in the application using Meta Pixel. PageView events are the foundation of Meta's conversion tracking and allow Facebook to understand user navigation patterns, build audiences, and optimize ad delivery.

## Implementation

### How It Works

PageView tracking is implemented directly in the `MetaPixel` component (`src/components/MetaPixel.tsx`) using Next.js navigation hooks to detect both initial page loads and client-side route changes.

### Key Features

1. **Initial Page Load Tracking**
   - Automatically tracks PageView when the user first lands on any page
   - Fires on both server-side and client-side navigation

2. **Client-Side Navigation Tracking**
   - Detects route changes using `usePathname` and `useSearchParams` hooks
   - Tracks PageView on every route change in the SPA
   - Tracks query parameter changes (e.g., UTM parameters)

3. **Development Logging**
   - Console logging in development mode for debugging
   - Shows the full URL being tracked

### Implementation Details

The PageView tracking is implemented in `src/components/MetaPixel.tsx` lines 65-78:

```typescript
// Track PageView on pathname or search params change
useEffect(() => {
  if (window.fbq && pixelId && pixelId !== 'your_meta_pixel_id_here') {
    // Build full URL for tracking
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');

    // Track PageView with current URL
    window.fbq('track', 'PageView');

    if (process.env.NODE_ENV === 'development') {
      console.log('Meta Pixel PageView tracked:', url);
    }
  }
}, [pathname, searchParams, pixelId]);
```

### What Gets Tracked

Every PageView event includes:

- **URL** - Current page path and query parameters
- **Referrer** - Previous page URL
- **User Agent** - Browser and device information
- **Timestamp** - When the PageView occurred
- **First-party Cookies** - `_fbp` and `_fbc` for user identification
- **Facebook Click ID** - `fbclid` parameter if present

## Usage

No additional code required! PageView tracking is automatically enabled when you:

1. Set `NEXT_PUBLIC_META_PIXEL_ID` in `.env.local`
2. Include `<MetaPixel pixelId={metaPixelId} />` in your layout (already done)

PageView will be tracked automatically on:
- Initial page load
- Next.js router navigation
- Browser back/forward buttons
- Link clicks
- Query parameter changes

### Manual PageView Tracking

If you need to manually trigger a PageView (e.g., for virtual pageviews):

```typescript
import { trackMetaEvent } from '@/components/MetaPixel';

// Track a virtual pageview
trackMetaEvent('PageView');
```

## Testing

### Browser Testing

1. **Open Browser DevTools:**
   ```javascript
   // Check if Meta Pixel is loaded
   window.fbq
   // Should output: function fbq() {...}
   ```

2. **Navigate through pages:**
   - Go to homepage: `http://localhost:3000`
   - Click to `/ads/editor`
   - Click to `/screenshots`
   - Check console for PageView logs (in development)

3. **Check with Meta Pixel Helper:**
   - Install [Meta Pixel Helper Extension](https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)
   - Navigate your site
   - Extension shows green badge with number of events
   - Click extension to see PageView events

4. **Facebook Events Manager:**
   - Go to [Events Manager](https://business.facebook.com/events_manager)
   - Click "Test Events" tab
   - Enter your website URL
   - See PageView events appear in real-time

### Automated Testing

Run the test suite (requires Playwright):

```bash
npx ts-node scripts/test-meta-pageview.ts
```

The test suite verifies:
- Initial page load tracking
- Client-side navigation tracking
- Query parameter tracking
- Browser back/forward navigation
- Multiple consecutive page views
- Event data integrity
- Development logging

## Architecture

### Next.js Integration

**Why this works with Next.js App Router:**

1. **Client Component** - `MetaPixel` uses `'use client'` directive
2. **Navigation Hooks** - Uses `usePathname()` and `useSearchParams()`
3. **useEffect Dependency** - Re-runs when pathname or searchParams change
4. **Layout Integration** - Mounted in root layout, persists across pages

**Why not in middleware:**
- Meta Pixel must run client-side to set cookies
- `window.fbq` only exists in browser context
- Navigation hooks only work in client components

### Event Flow

```
User Action → Next.js Router → usePathname/useSearchParams change
  → useEffect fires → window.fbq('track', 'PageView')
  → Meta Pixel sends event to Facebook → Facebook processes event
```

### Deduplication

Meta Pixel handles deduplication automatically:
- Same page multiple rapid views → deduplicated
- Back button → tracked (considered new pageview)
- Refresh → tracked (considered new pageview)
- Query param changes → tracked (different URL)

## Meta Pixel Events Manager

### Viewing PageView Events

1. **Real-time Events:**
   - Go to Events Manager → Test Events
   - Enter your website URL
   - See events appear within seconds

2. **Event History:**
   - Go to Events Manager → Data Sources → Your Pixel
   - Click "Activity" tab
   - See historical PageView count

3. **Event Details:**
   - Each PageView shows:
     - URL visited
     - Timestamp
     - Device type
     - Browser
     - Source (Pixel or CAPI)

### PageView Metrics

PageView events power these metrics in Meta:

- **Reach** - Unique users who viewed pages
- **Frequency** - Average pageviews per user
- **Engagement** - Time spent on site
- **Conversion Windows** - Time from view to action
- **Funnel Analysis** - Page progression

## Use Cases

### 1. Audience Building

Create custom audiences based on PageView:

```
Audience: Users who viewed /ads/editor
  → Retarget with "Start Creating Ads" campaign
```

### 2. Conversion Attribution

Track conversion paths:

```
PageView /ads/editor → PageView /pricing → Purchase
  → Facebook attributes conversion to original ad
```

### 3. Lookalike Audiences

Build lookalikes from engaged users:

```
Audience: Users with 5+ PageViews
  → Create lookalike for prospecting
```

### 4. Exclusion Audiences

Exclude users who haven't engaged:

```
Audience: Users with 0 PageViews in 30 days
  → Exclude from retargeting
```

## Privacy & Compliance

### GDPR Compliance

1. **Consent Management:**
   - PageView tracking starts immediately when component mounts
   - For GDPR compliance, implement consent check:

   ```typescript
   // In MetaPixel component
   useEffect(() => {
     if (!hasUserConsent) return; // Don't track without consent
     
     if (window.fbq && pixelId) {
       window.fbq('track', 'PageView');
     }
   }, [pathname, searchParams, pixelId, hasUserConsent]);
   ```

2. **Cookie Notice:**
   - Inform users about Meta Pixel cookies
   - Provide opt-out mechanism
   - Document in privacy policy

3. **Data Minimization:**
   - PageView only sends URL and basic browser info
   - No PII collected by default
   - User identifiers are hashed/anonymous

### Ad Blockers

- Users with ad blockers won't trigger PageView events
- Meta Pixel script may be blocked
- Consider server-side tracking (CAPI) for complete coverage

## Debugging

### Common Issues

**No PageView events appearing:**

1. Check Pixel ID is set:
   ```bash
   echo $NEXT_PUBLIC_META_PIXEL_ID
   ```

2. Check console for errors:
   ```javascript
   // Should see: "Meta Pixel PageView tracked: /path"
   ```

3. Check fbq exists:
   ```javascript
   window.fbq
   // Should output function, not undefined
   ```

4. Check for ad blockers:
   - Disable ad blocker
   - Try incognito mode

**PageView tracked multiple times:**

- This is expected behavior
- Each route change triggers a new PageView
- Meta handles deduplication automatically

**PageView not tracked on navigation:**

- Check useEffect dependencies include pathname
- Verify MetaPixel is in root layout (persists across pages)
- Check for errors in browser console

### Debug Mode

Enable verbose logging:

```typescript
// Add to MetaPixel component
useEffect(() => {
  if (window.fbq && pixelId) {
    console.log('[Meta Pixel] PageView tracked:', {
      pathname,
      searchParams: searchParams?.toString(),
      url: pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : ''),
      timestamp: new Date().toISOString(),
    });
    
    window.fbq('track', 'PageView');
  }
}, [pathname, searchParams, pixelId]);
```

## Performance Impact

### Script Load Time

- Meta Pixel script: ~30KB gzipped
- Loads asynchronously after page interactive
- No blocking of initial render

### PageView Request

- Per PageView: 1-2KB network request
- Minimal performance impact
- Batched with other events when possible

### Best Practices

- ✅ Load in root layout (already implemented)
- ✅ Use `strategy="afterInteractive"` (already implemented)
- ✅ Check for Pixel ID before tracking (already implemented)
- ✅ Log only in development (already implemented)

## Next Steps

After implementing META-002:

1. **META-003: Standard Events Mapping**
   - Map app events to Meta standard events
   - Lead, Purchase, ViewContent, etc.

2. **META-004: CAPI Server-Side Events**
   - Implement Conversions API
   - Server-side PageView tracking
   - Better iOS 14+ tracking

3. **META-005: Event Deduplication**
   - Match Pixel and CAPI events with event_id
   - Prevent double counting
   - Improve attribution accuracy

## Resources

- [Meta Pixel PageView Documentation](https://developers.facebook.com/docs/meta-pixel/reference#page-view)
- [Facebook Events Manager](https://business.facebook.com/events_manager)
- [Meta Pixel Helper Chrome Extension](https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)
- [Next.js usePathname Hook](https://nextjs.org/docs/app/api-reference/functions/use-pathname)
- [Next.js useSearchParams Hook](https://nextjs.org/docs/app/api-reference/functions/use-search-params)

## Files Changed

- ✅ `src/components/MetaPixel.tsx` - PageView tracking implementation (lines 65-78)
- ✅ `scripts/test-meta-pageview.ts` - Comprehensive test suite (242 lines)
- ✅ `docs/META-002-PAGEVIEW-TRACKING.md` - This documentation

**Note:** PageView tracking was implemented as part of META-001 (Meta Pixel Installation). META-002 documents and validates this functionality as a separate feature.

## Success Criteria

- ✅ PageView tracked on initial page load
- ✅ PageView tracked on client-side navigation  
- ✅ PageView tracked on query parameter changes
- ✅ Development logging works
- ✅ No errors in browser console
- ✅ Events appear in Meta Events Manager
- ✅ Meta Pixel Helper shows PageView events
- ✅ Test suite passes
