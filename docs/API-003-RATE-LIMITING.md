# API-003: Rate Limiting and Usage Quotas

**Status:** ✅ Complete
**Priority:** P1
**Category:** API

## Overview

Per-API-key rate limiting and monthly render quotas by plan tier.

## Rate Limits

Enforced per minute, per API key:

- **Free:** 1 request/minute
- **Basic:** 10 requests/minute
- **Premium:** 100 requests/minute
- **Enterprise:** 1,000 requests/minute

## Monthly Quotas

Hard limits on total renders per month:

- **Free:** 10 renders/month
- **Basic:** 100 renders/month
- **Premium:** 1,000 renders/month
- **Enterprise:** Unlimited

## Response Headers

All API responses include:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 8
X-RateLimit-Reset: 1707414000
X-Monthly-Quota: 100
X-Monthly-Usage: 25
X-Monthly-Remaining: 75
```

## Error Responses

**Rate Limit Exceeded (429):**
```json
{
  "error": "Rate limit exceeded",
  "remaining": 0,
  "resetAt": "2026-02-08T13:00:00Z"
}
```

**Quota Exceeded (402):**
```json
{
  "error": "Monthly quota exceeded",
  "quota": 100,
  "used": 100
}
```

## Implementation

Service: `src/services/publicAPI.ts`
- RateLimiter class for per-minute tracking
- Quota validation on request submission
- Redis-backed rate limiting

✅ Complete
