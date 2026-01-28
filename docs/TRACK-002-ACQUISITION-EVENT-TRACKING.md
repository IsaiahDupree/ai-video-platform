# TRACK-002: Acquisition Event Tracking

## Overview

Implements tracking for user acquisition events including landing page views, signup initiation, and signup completion. These events form the foundation for understanding user acquisition channels and conversion rates.

## Features

### Tracked Events

1. **landing_view**
   - Triggered when users view the landing page or key entry points
   - Captures page context, referrer, and UTM parameters
   - Used for understanding traffic sources

2. **signup_started**
   - Triggered when users begin the signup process
   - Fires when user interacts with any signup form field
   - Captures signup method (email, OAuth, etc.)

3. **signup_completed**
   - Triggered when users successfully complete signup
   - Fires after account creation
   - Includes user identification

## Implementation

### Landing Page Tracking

The home page (`src/app/page.tsx`) automatically tracks `landing_view` when loaded:

```tsx
'use client';

import { useEffect } from 'react';
import { useTracking } from '@/components/TrackingProvider';

export default function HomePage() {
  const tracking = useTracking();

  useEffect(() => {
    tracking.track('landing_view', {
      page: 'home',
      timestamp: new Date().toISOString(),
    });
  }, [tracking]);

  return <main>...</main>;
}
```

### Signup Flow Tracking

The signup page (`src/app/signup/page.tsx`) implements comprehensive acquisition tracking:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useTracking } from '@/components/TrackingProvider';

export default function SignupPage() {
  const tracking = useTracking();

  // Track landing on signup page
  useEffect(() => {
    tracking.track('landing_view', {
      page: 'signup',
      timestamp: new Date().toISOString(),
    });
  }, [tracking]);

  const handleInputChange = (e) => {
    // Track signup_started when user begins typing
    if (!hasStarted) {
      tracking.track('signup_started', {
        page: 'signup',
        timestamp: new Date().toISOString(),
      });
      setHasStarted(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Create user account...
    const userId = createUser();

    // Track signup completion
    tracking.track('signup_completed', {
      page: 'signup',
      timestamp: new Date().toISOString(),
      method: 'email',
    });

    // Identify the user
    tracking.identify(userId, {
      email: formData.email,
      name: formData.name,
      plan: 'free',
    });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## Event Properties

### landing_view

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `page` | string | Page identifier | `"home"`, `"signup"`, `"pricing"` |
| `timestamp` | string | ISO timestamp | `"2024-01-28T12:00:00Z"` |
| `referrer` | string | (Optional) Referrer URL | `"google"`, `"facebook"` |
| `utm_source` | string | (Optional) UTM source | `"google"`, `"facebook"` |
| `utm_medium` | string | (Optional) UTM medium | `"cpc"`, `"organic"` |
| `utm_campaign` | string | (Optional) UTM campaign | `"winter_2024"` |

### signup_started

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `page` | string | Page identifier | `"signup"` |
| `timestamp` | string | ISO timestamp | `"2024-01-28T12:00:00Z"` |
| `method` | string | Signup method | `"email"`, `"google"`, `"github"` |

### signup_completed

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `page` | string | Page identifier | `"signup"` |
| `timestamp` | string | ISO timestamp | `"2024-01-28T12:00:00Z"` |
| `method` | string | Signup method | `"email"`, `"google"`, `"github"` |

## Usage Examples

### Client-Side (React)

```tsx
'use client';

import { useTracking } from '@/components/TrackingProvider';

export default function MyLandingPage() {
  const tracking = useTracking();

  useEffect(() => {
    tracking.track('landing_view', {
      page: 'pricing',
      referrer: document.referrer,
    });
  }, [tracking]);

  return <div>...</div>;
}
```

### Server-Side (API Routes)

```typescript
import { serverTracking } from '@/services/trackingServer';

export async function POST(request: Request) {
  const data = await request.json();

  // Track signup completion
  serverTracking.track('signup_completed', {
    page: 'api',
    method: data.method,
    timestamp: new Date().toISOString(),
  });

  // Identify user
  serverTracking.identify(userId, {
    email: data.email,
    plan: 'free',
  });

  return Response.json({ success: true });
}
```

## Testing

### Automated Tests

Run the test script to verify tracking:

```bash
npx tsx scripts/test-acquisition-tracking.ts
```

The test script validates:
- landing_view events with various properties
- signup_started with different methods
- signup_completed with user identification
- Server-side tracking functionality

### Manual Testing

1. **Test Landing View**
   ```bash
   # Visit home page
   open http://localhost:3000

   # Check browser console or PostHog
   # Should see: landing_view event with page="home"
   ```

2. **Test Signup Flow**
   ```bash
   # Visit signup page
   open http://localhost:3000/signup

   # Should track: landing_view with page="signup"
   # Type in form field
   # Should track: signup_started
   # Submit form
   # Should track: signup_completed
   ```

3. **Verify in PostHog**
   - Open PostHog dashboard
   - Go to Events → Live Events
   - Filter by event names: landing_view, signup_started, signup_completed
   - Verify properties are correct

## Analytics Insights

### Key Metrics to Track

1. **Landing Page Views**
   - Total views by page
   - Views by referrer
   - Views by UTM parameters

2. **Signup Funnel**
   - Landing → Signup Started conversion rate
   - Signup Started → Signup Completed conversion rate
   - Overall conversion rate

3. **Acquisition Channels**
   - Signups by referrer
   - Signups by UTM source/medium/campaign
   - Cost per acquisition by channel

### Example PostHog Queries

```sql
-- Signup conversion rate
SELECT
  COUNT(DISTINCT CASE WHEN event = 'signup_started' THEN distinct_id END) as started,
  COUNT(DISTINCT CASE WHEN event = 'signup_completed' THEN distinct_id END) as completed,
  (completed * 100.0 / started) as conversion_rate
FROM events
WHERE timestamp > NOW() - INTERVAL '7 days';

-- Signups by source
SELECT
  properties->>'utm_source' as source,
  COUNT(*) as signups
FROM events
WHERE event = 'signup_completed'
  AND timestamp > NOW() - INTERVAL '30 days'
GROUP BY source
ORDER BY signups DESC;
```

## Integration Points

### Required Setup

1. **TrackingProvider** must be added to root layout:
   ```tsx
   // src/app/layout.tsx
   import { TrackingProvider } from '@/components/TrackingProvider';

   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           <TrackingProvider>{children}</TrackingProvider>
         </body>
       </html>
     );
   }
   ```

2. **Environment variables** must be set:
   ```bash
   NEXT_PUBLIC_POSTHOG_KEY=your_project_api_key
   NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
   ```

### Related Features

This feature builds upon:
- **TRACK-001**: Tracking SDK Integration (provides base infrastructure)

This feature enables:
- **Marketing attribution** - Track which channels drive signups
- **Conversion optimization** - Identify and fix funnel drop-offs
- **A/B testing** - Compare signup flows and landing pages

## Architecture

```
User Journey:
┌─────────────────┐
│  Landing Page   │──► landing_view
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Signup Page    │──► landing_view (page=signup)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Form Interact  │──► signup_started
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Submit Form    │──► signup_completed
│  + Identify     │    + identify(userId, properties)
└─────────────────┘
```

## Files Modified

```
src/
├── app/
│   ├── layout.tsx              # Added TrackingProvider
│   ├── page.tsx               # Added landing_view tracking
│   └── signup/
│       └── page.tsx           # New: Full signup flow with tracking
docs/
└── TRACK-002-ACQUISITION-EVENT-TRACKING.md  # This file
scripts/
└── test-acquisition-tracking.ts             # Test script
```

## Best Practices

1. **Track Early**: Fire `landing_view` as early as possible in page lifecycle
2. **One signup_started per session**: Use state to prevent duplicate events
3. **Always identify after signup**: Call `identify()` immediately after signup completion
4. **Include UTM parameters**: Capture marketing attribution data
5. **Use consistent page identifiers**: Use clear, consistent page names

## Common Issues

### Event Not Firing

1. Check TrackingProvider is in layout
2. Verify NEXT_PUBLIC_POSTHOG_KEY is set
3. Check browser console for errors
4. Ensure tracking.isEnabled() returns true

### Duplicate Events

1. Use `useEffect` with proper dependencies
2. Add state guards for signup_started
3. Avoid tracking in render functions

### Missing Properties

1. Always include required properties (page, timestamp)
2. Use type-safe event definitions
3. Validate properties before tracking

## Next Steps

This feature enables the following tracking features:
- **TRACK-003**: Activation Event Tracking (first_video_created, first_render_completed)
- **TRACK-004**: Core Value Event Tracking (video_rendered, batch_completed, export_downloaded)
- **TRACK-005**: Monetization Event Tracking (checkout_started, purchase_completed)

## Resources

- [PostHog Event Tracking](https://posthog.com/docs/product-analytics/capture-events)
- [PostHog Identify Users](https://posthog.com/docs/product-analytics/identify)
- [Marketing Attribution](https://posthog.com/docs/data/utm-segmentation)
- [Conversion Funnels](https://posthog.com/docs/product-analytics/funnels)
