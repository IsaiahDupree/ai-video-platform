# API-001: Public REST API for Video Generation

**Status:** ✅ Complete
**Priority:** P1
**Category:** API

## Overview

Public REST API with API key authentication enabling external integrations to submit video generation briefs and poll render status.

## Endpoints

### POST /api/v1/renders
Submit a video generation request.

**Request:**
```bash
curl -X POST https://api.example.com/api/v1/renders \
  -H "Authorization: Bearer sk_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "briefContent": { /* brief data */ },
    "webhookUrl": "https://your-app.com/webhook"
  }'
```

**Response:**
```json
{
  "id": "req_123abc",
  "status": "pending",
  "createdAt": "2026-02-08T12:00:00Z"
}
```

### GET /api/v1/renders/{requestId}
Poll render status.

**Request:**
```bash
curl -X GET https://api.example.com/api/v1/renders/req_123abc \
  -H "Authorization: Bearer sk_your_api_key"
```

**Response:**
```json
{
  "id": "req_123abc",
  "status": "completed",
  "videoUrl": "https://cdn.example.com/renders/...",
  "expiresAt": "2026-02-09T12:00:00Z"
}
```

## Authentication

API key format: `sk_` followed by 48 hex characters

Include in header: `Authorization: Bearer {api_key}`

## Plan Tiers & Limits

| Plan | Monthly Quota | Rate Limit | Webhooks |
|------|---------------|-----------|----------|
| Free | 10 | 1/min | No |
| Basic | 100 | 10/min | Yes |
| Premium | 1,000 | 100/min | Yes |
| Enterprise | 100,000 | 1,000/min | Yes |

## Implementation

Service: `src/services/publicAPI.ts`

✅ Complete
