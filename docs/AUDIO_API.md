# Audio Processing API

The Remotion VideoStudio microservice provides three audio processing endpoints for searching, mixing, and generating audio content.

## Endpoints

### 1. Search Music

Search for music tracks from stock audio libraries.

**Endpoint:** `POST /api/v1/audio/search-music`

**Request Body:**
```json
{
  "query": "upbeat electronic music",
  "provider": "freesound",
  "limit": 10,
  "webhookUrl": "https://example.com/webhook"
}
```

**Parameters:**
- `query` (required): Search query string
- `provider` (optional): Audio provider (`freesound`, default: `freesound`)
- `limit` (optional): Maximum number of results (default: 10)
- `webhookUrl` (optional): Webhook URL for job completion notification

**Response:**
```json
{
  "jobId": "job_abc123",
  "status": "queued",
  "pollUrl": "/api/v1/jobs/job_abc123"
}
```

**Job Result:**
```json
{
  "results": [
    {
      "id": "12345",
      "provider": "freesound",
      "type": "audio",
      "download_url": "https://...",
      "duration": 120,
      "license": "CC BY 4.0",
      "creator": "Artist Name",
      "tags": ["electronic", "upbeat"]
    }
  ],
  "total": 25,
  "provider": "freesound",
  "query": "upbeat electronic music"
}
```

---

### 2. Mix Audio

Combine voiceover, music, and sound effects into a single mixed audio file using FFmpeg.

**Endpoint:** `POST /api/v1/audio/mix`

**Request Body:**
```json
{
  "manifestPath": "public/assets/sfx/manifest.json",
  "eventsPath": "data/audio_events.json",
  "sfxRoot": "public/assets/sfx",
  "outputPath": "output/audio_mix.wav",
  "webhookUrl": "https://example.com/webhook"
}
```

**Parameters:**
- `manifestPath` (required): Path to SFX manifest JSON file
- `eventsPath` (required): Path to audio events JSON file
- `sfxRoot` (optional): Root directory for SFX files (default: `public/assets/sfx`)
- `outputPath` (optional): Output file path (default: auto-generated)
- `webhookUrl` (optional): Webhook URL for job completion notification

**Audio Events Format:**
```json
{
  "fps": 30,
  "events": [
    {
      "type": "voiceover",
      "src": "audio/voiceover.mp3",
      "volume": 1.0
    },
    {
      "type": "music",
      "src": "audio/background.mp3",
      "volume": 0.25
    },
    {
      "type": "sfx",
      "sfxId": "ui_click_01",
      "frame": 90,
      "volume": 0.8
    }
  ]
}
```

**Response:**
```json
{
  "jobId": "job_def456",
  "status": "queued",
  "pollUrl": "/api/v1/jobs/job_def456"
}
```

**Job Result:**
```json
{
  "audioPath": "output/audio_mix_1707154123456.wav",
  "fileSize": 2048576,
  "format": "wav",
  "sampleRate": 48000,
  "channels": 2
}
```

---

### 3. Generate/Search Sound Effects

Generate sound effects using AI (ElevenLabs) or search existing SFX libraries.

**Endpoint:** `POST /api/v1/audio/sfx`

**Request Body (Search):**
```json
{
  "prompt": "epic whoosh transition",
  "provider": "freesound",
  "generate": false,
  "webhookUrl": "https://example.com/webhook"
}
```

**Request Body (Generate):**
```json
{
  "prompt": "epic whoosh transition",
  "provider": "elevenlabs",
  "generate": true,
  "duration": 3,
  "webhookUrl": "https://example.com/webhook"
}
```

**Parameters:**
- `prompt` (required): SFX description or search query
- `provider` (optional): Provider (`freesound`, `elevenlabs`, default: `freesound`)
- `generate` (optional): Generate new SFX with AI (default: `false`)
- `duration` (optional): Duration in seconds for generated SFX (default: 3)
- `webhookUrl` (optional): Webhook URL for job completion notification

**Response:**
```json
{
  "jobId": "job_ghi789",
  "status": "queued",
  "pollUrl": "/api/v1/jobs/job_ghi789"
}
```

**Job Result (Search):**
```json
{
  "results": [
    {
      "id": "whoosh_001",
      "provider": "freesound",
      "type": "audio",
      "download_url": "https://...",
      "duration": 2.5,
      "license": "CC0",
      "tags": ["whoosh", "transition"]
    }
  ],
  "total": 15,
  "provider": "freesound",
  "query": "epic whoosh transition"
}
```

**Job Result (Generate):**
```json
{
  "audioPath": "output/sfx_1707154123456.mp3",
  "fileSize": 98304,
  "provider": "elevenlabs",
  "generated": true
}
```

---

## Job Polling

All audio endpoints return a job ID. Poll the job status endpoint to get results:

**Endpoint:** `GET /api/v1/jobs/{jobId}`

**Response:**
```json
{
  "id": "job_abc123",
  "type": "audio-search-music",
  "status": "completed",
  "input": { "query": "upbeat", "provider": "freesound" },
  "result": { "results": [...], "total": 25 },
  "createdAt": "2026-02-02T12:00:00Z",
  "startedAt": "2026-02-02T12:00:01Z",
  "completedAt": "2026-02-02T12:00:05Z",
  "retries": 0
}
```

**Job Status Values:**
- `queued` - Job is waiting to be processed
- `processing` - Job is currently running
- `completed` - Job finished successfully
- `failed` - Job failed with error

---

## Error Handling

All endpoints return standard error responses:

```json
{
  "error": "Missing required field: query"
}
```

**HTTP Status Codes:**
- `202 Accepted` - Job successfully queued
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing or invalid API key
- `404 Not Found` - Job or resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## Rate Limits

Default rate limits:
- 60 requests per minute
- 1000 requests per hour

Configure via environment variables:
```bash
RATE_LIMIT_REQUESTS_PER_MINUTE=60
RATE_LIMIT_REQUESTS_PER_HOUR=1000
```

---

## Authentication

Include API key in request headers:

```http
Authorization: Bearer YOUR_API_KEY
```

Or set via environment:
```bash
REMOTION_SERVICE_API_KEY=your-secret-key
```

---

## Example Usage

### cURL

```bash
# Search for music
curl -X POST http://localhost:3100/api/v1/audio/search-music \
  -H "Authorization: Bearer dev-api-key" \
  -H "Content-Type: application/json" \
  -d '{"query": "cinematic orchestral", "limit": 5}'

# Mix audio files
curl -X POST http://localhost:3100/api/v1/audio/mix \
  -H "Authorization: Bearer dev-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "manifestPath": "public/assets/sfx/manifest.json",
    "eventsPath": "data/audio_events.json"
  }'

# Generate SFX
curl -X POST http://localhost:3100/api/v1/audio/sfx \
  -H "Authorization: Bearer dev-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "dramatic explosion",
    "provider": "elevenlabs",
    "generate": true,
    "duration": 2
  }'
```

### TypeScript (using RemotionClient)

```typescript
import { RemotionClient } from './src/service/client';

const client = new RemotionClient({
  baseUrl: 'http://localhost:3100',
  apiKey: 'dev-api-key',
});

// Search music
const musicJob = await client.submitJob('audio-search-music', {
  query: 'cinematic orchestral',
  limit: 5,
});

// Wait for completion
const musicResult = await client.waitForJob(musicJob.jobId);
console.log('Found tracks:', musicResult.results);

// Mix audio
const mixJob = await client.submitJob('audio-mix', {
  manifestPath: 'public/assets/sfx/manifest.json',
  eventsPath: 'data/audio_events.json',
});

const mixResult = await client.waitForJob(mixJob.jobId);
console.log('Mixed audio saved to:', mixResult.audioPath);
```

---

## Related Documentation

- [SFX System PRD](./PRD-SFX-System.md)
- [Audio Video System v2](./PRD-Audio-Video-System-v2.md)
- [Microservice Guide](./MICROSERVICE_GUIDE.md)
