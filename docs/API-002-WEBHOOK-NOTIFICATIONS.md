# API-002: Webhook Notifications on Render Complete

**Status:** ✅ Complete
**Priority:** P2
**Category:** API

## Overview

Automatic webhook notifications when render jobs complete or fail, enabling real-time integrations.

## Webhook Format

When a render completes, POST to your webhook URL:

```json
{
  "event": "render.completed",
  "timestamp": "2026-02-08T12:00:00Z",
  "data": {
    "id": "req_123abc",
    "videoUrl": "https://cdn.example.com/renders/...",
    "expiresAt": "2026-02-09T12:00:00Z",
    "fileSize": 25165824
  }
}
```

On failure:

```json
{
  "event": "render.failed",
  "timestamp": "2026-02-08T12:00:00Z",
  "data": {
    "id": "req_123abc",
    "error": "Failed to render brief: Invalid composition"
  }
}
```

## Retry Policy

- 3 attempts with exponential backoff
- Initial retry: 10 seconds
- Max retry delay: 10 minutes

## Implementation

Service: `src/services/publicAPI.ts`

✅ Complete
