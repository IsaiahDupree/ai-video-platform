# TRACK-001: Tracking SDK Integration

## Overview

Integrates PostHog as the user event tracking SDK for comprehensive analytics across the AI Video Platform. This implementation provides both client-side and server-side tracking capabilities with a unified API.

## Features

### Core Capabilities

1. **Dual-Mode Tracking**
   - Client-side tracking via `posthog-js` for browser events
   - Server-side tracking via `posthog-node` for backend events
   - Unified API interface for consistent usage

2. **Type-Safe Events**
   - Predefined event types for all tracking scenarios
   - TypeScript interfaces for event properties
   - Compile-time validation of event names

3. **React Integration**
   - `TrackingProvider` component for easy setup
   - `useTracking` hook for accessing tracking service
   - Automatic initialization from environment variables

4. **Privacy & Performance**
   - Automatic opt-out support
   - Configurable tracking domains
   - Graceful degradation when disabled

## Installation

PostHog SDKs are already installed:
```bash
npm install posthog-js posthog-node
```

## Configuration

### Environment Variables

Add to `.env`:
```bash
# Client-side tracking (browser)
NEXT_PUBLIC_POSTHOG_KEY=phc_your_project_api_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Server-side tracking (backend)
POSTHOG_API_KEY=phc_your_project_api_key
```

### Getting PostHog API Key

1. Sign up at [posthog.com](https://posthog.com)
2. Create a new project
3. Copy your Project API Key from Settings → Project Details
4. Use the same key for both client and server tracking

## Usage

### Client-Side Tracking (React/Next.js)

#### 1. Wrap your app with TrackingProvider

```tsx
// src/app/layout.tsx
import { TrackingProvider } from '@/components/TrackingProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <TrackingProvider>
          {children}
        </TrackingProvider>
      </body>
    </html>
  );
}
```

#### 2. Use tracking in components

```tsx
'use client';
import { useTracking } from '@/components/TrackingProvider';

export default function MyComponent() {
  const tracking = useTracking();

  const handleClick = () => {
    tracking.track('video_rendered', {
      duration: 30,
      format: 'mp4',
      template: 'modern-intro',
    });
  };

  return <button onClick={handleClick}>Render Video</button>;
}
```

#### 3. Track page views

```tsx
'use client';
import { useEffect } from 'react';
import { useTracking } from '@/components/TrackingProvider';

export default function MyPage() {
  const tracking = useTracking();

  useEffect(() => {
    tracking.page('Video Editor', {
      section: 'editor',
    });
  }, [tracking]);

  return <div>My Page</div>;
}
```

#### 4. Identify users

```tsx
'use client';
import { useTracking } from '@/components/TrackingProvider';

export default function LoginPage() {
  const tracking = useTracking();

  const handleLogin = async (userId: string, email: string) => {
    // Login logic...

    tracking.identify(userId, {
      email,
      name: 'John Doe',
      plan: 'pro',
    });
  };

  return <div>Login Page</div>;
}
```

### Server-Side Tracking (API Routes, Scripts)

```typescript
import { serverTracking } from '@/services/trackingServer';

// Initialize once at startup
serverTracking.initialize({
  apiKey: process.env.POSTHOG_API_KEY!,
  enabled: process.env.NODE_ENV === 'production',
});

// Track events
serverTracking.track('video_rendered', {
  userId: 'user-123',
  duration: 30,
  format: 'mp4',
});

// Identify users
serverTracking.identify('user-123', {
  email: 'user@example.com',
  plan: 'pro',
});

// Shutdown gracefully
await serverTracking.shutdown();
```

## Event Types

All supported events are defined in `src/types/tracking.ts`:

### Acquisition Events
- `landing_view` - User views landing page
- `signup_started` - User begins signup process
- `signup_completed` - User completes signup

### Activation Events
- `first_video_created` - User creates their first video
- `first_render_completed` - User completes their first render

### Core Value Events
- `video_rendered` - Video rendering completed
- `batch_completed` - Batch job completed
- `export_downloaded` - User downloads export

### Monetization Events
- `checkout_started` - User begins checkout
- `purchase_completed` - User completes purchase

### Retention Events
- `return_visit` - User returns to platform
- `feature_discovery` - User discovers new feature

### Feature Usage Events
- `template_used` - User uses a template
- `voice_cloned` - User clones a voice
- `ad_generated` - User generates an ad

### Error & Performance Events
- `render_failed` - Render job failed
- `api_error` - API error occurred
- `slow_render` - Render job took longer than expected

## API Reference

### ITrackingService Interface

```typescript
interface ITrackingService {
  identify(userId: string, properties?: UserProperties): void;
  track(event: TrackingEvent, properties?: EventProperties): void;
  page(name?: string, properties?: EventProperties): void;
  reset(): void;
  isEnabled(): boolean;
}
```

### Methods

#### `identify(userId, properties?)`
Associate user ID with their properties.
- `userId`: Unique user identifier
- `properties`: User attributes (email, name, plan, etc.)

#### `track(event, properties?)`
Track a named event with optional properties.
- `event`: One of the predefined TrackingEvent types
- `properties`: Event-specific data

#### `page(name?, properties?)`
Track a page view.
- `name`: Page name (optional)
- `properties`: Page-specific data

#### `reset()`
Clear current user identification (on logout).

#### `isEnabled()`
Check if tracking is active.

## Testing

Run the test script:
```bash
npx tsx scripts/test-tracking.ts
```

The test script will:
1. Initialize the tracking service
2. Test user identification
3. Track sample events
4. Test page views
5. Gracefully shutdown

## Architecture

```
src/
├── types/
│   └── tracking.ts              # TypeScript types and interfaces
├── services/
│   ├── tracking.ts              # Client-side tracking (posthog-js)
│   └── trackingServer.ts        # Server-side tracking (posthog-node)
└── components/
    └── TrackingProvider.tsx     # React context provider

scripts/
└── test-tracking.ts             # Test script
```

## Privacy Considerations

1. **Opt-Out Support**: Users can disable tracking via environment variable
2. **No Autocapture**: Autocapture is disabled by default for privacy
3. **Data Control**: All tracked events are explicitly defined
4. **GDPR Compliant**: PostHog supports GDPR requirements

## Performance

1. **Async Operations**: All tracking calls are non-blocking
2. **Local Buffering**: Events are buffered and sent in batches
3. **Graceful Degradation**: Tracking errors don't affect app functionality
4. **Auto-scaling**: PostHog infrastructure scales automatically

## Next Steps

This feature enables the following tracking features:
- TRACK-002: Acquisition Event Tracking
- TRACK-003: Activation Event Tracking
- TRACK-004: Core Value Event Tracking
- TRACK-005: Monetization Event Tracking
- TRACK-006: Retention Event Tracking
- TRACK-007: Feature Usage Tracking
- TRACK-008: Error & Performance Tracking

## Resources

- [PostHog Documentation](https://posthog.com/docs)
- [PostHog React Integration](https://posthog.com/docs/libraries/react)
- [PostHog Node.js Integration](https://posthog.com/docs/libraries/node)
- [Event Naming Best Practices](https://posthog.com/docs/getting-started/send-events)
