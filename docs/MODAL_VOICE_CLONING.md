# Modal Voice Cloning Service

A serverless voice cloning service deployed on Modal Labs, using IndexTTS-2 for high-quality voice synthesis. The service auto-scales to zero when idle to minimize costs.

## Overview

This service provides:
- **Voice Cloning**: Clone any voice from a reference audio file
- **Text-to-Speech**: Generate speech in the cloned voice
- **REST API**: Easy integration via HTTP endpoints
- **Cost Efficient**: Scales to zero when not in use (5-minute idle timeout)
- **GPU Accelerated**: Uses T4 GPU for fast inference

## Prerequisites

```bash
# Install Modal CLI
pip install modal

# Authenticate with Modal
modal token new
```

## Quick Start

### 1. Deploy the Service

```bash
cd /path/to/your/repo
modal deploy scripts/modal_voice_clone.py
```

After deployment, you'll see endpoints like:
```
https://YOUR_USERNAME--voice-clone-indextts2-api-clone-voice.modal.run
https://YOUR_USERNAME--voice-clone-indextts2-health.modal.run
```

### 2. Test Locally

```bash
modal run scripts/modal_voice_clone.py \
  --text "Hello, this is my cloned voice!" \
  --voice-ref path/to/voice_reference.wav
```

Output: `output_cloned.wav`

## API Reference

### Health Check

```bash
curl https://YOUR_USERNAME--voice-clone-indextts2-health.modal.run
```

Response:
```json
{"status": "healthy", "model": "IndexTTS-2"}
```

### Clone Voice

**Endpoint:** `POST /`

**URL:** `https://YOUR_USERNAME--voice-clone-indextts2-api-clone-voice.modal.run`

**Request Body:**
```json
{
  "voice_ref": "<base64-encoded audio file>",
  "text": "Text to synthesize",
  "emotion_method": "Same as the voice reference",
  "emotion_weight": 0.8
}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `voice_ref` | string | Yes | Base64-encoded audio file (WAV, MP3, etc.) |
| `text` | string | Yes | Text to synthesize in the cloned voice |
| `emotion_method` | string | No | Emotion control: "Same as the voice reference", "Neutral", "Happy", "Sad", "Angry" |
| `emotion_weight` | float | No | Emotion intensity (0.0-1.0), default 0.8 |

**Response:**
```json
{
  "audio": "<base64-encoded WAV audio>",
  "duration_seconds": 5.2
}
```

**Error Response:**
```json
{
  "error": "Error message description"
}
```

## Integration Examples

### TypeScript/Node.js

```typescript
import * as fs from 'fs';
import * as https from 'https';

const MODAL_ENDPOINT = 'YOUR_USERNAME--voice-clone-indextts2-api-clone-voice.modal.run';

async function cloneVoice(voiceRefPath: string, text: string): Promise<Buffer> {
  const voiceRefBytes = fs.readFileSync(voiceRefPath);
  
  const body = JSON.stringify({
    voice_ref: voiceRefBytes.toString('base64'),
    text: text,
    emotion_method: 'Same as the voice reference',
    emotion_weight: 0.8,
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: MODAL_ENDPOINT,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const response = JSON.parse(data);
        if (response.error) {
          reject(new Error(response.error));
          return;
        }
        resolve(Buffer.from(response.audio, 'base64'));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Usage
const audio = await cloneVoice('voice_reference.wav', 'Hello world!');
fs.writeFileSync('output.wav', audio);
```

### Python

```python
import requests
import base64

MODAL_ENDPOINT = "https://YOUR_USERNAME--voice-clone-indextts2-api-clone-voice.modal.run"

def clone_voice(voice_ref_path: str, text: str) -> bytes:
    with open(voice_ref_path, 'rb') as f:
        voice_ref_bytes = f.read()
    
    response = requests.post(MODAL_ENDPOINT, json={
        "voice_ref": base64.b64encode(voice_ref_bytes).decode('utf-8'),
        "text": text,
        "emotion_method": "Same as the voice reference",
        "emotion_weight": 0.8,
    })
    
    result = response.json()
    if "error" in result:
        raise Exception(result["error"])
    
    return base64.b64decode(result["audio"])

# Usage
audio = clone_voice("voice_reference.wav", "Hello world!")
with open("output.wav", "wb") as f:
    f.write(audio)
```

### cURL

```bash
# Encode voice reference to base64
VOICE_REF=$(base64 -i voice_reference.wav)

# Make API request
curl -X POST https://YOUR_USERNAME--voice-clone-indextts2-api-clone-voice.modal.run \
  -H "Content-Type: application/json" \
  -d "{
    \"voice_ref\": \"$VOICE_REF\",
    \"text\": \"Hello, this is my cloned voice!\",
    \"emotion_method\": \"Same as the voice reference\",
    \"emotion_weight\": 0.8
  }" | jq -r '.audio' | base64 -d > output.wav
```

## Voice Reference Best Practices

For optimal voice cloning results:

| Aspect | Recommendation |
|--------|----------------|
| **Duration** | 10-30 seconds |
| **Format** | WAV or MP3 |
| **Sample Rate** | 22050 Hz or higher |
| **Quality** | Clear, minimal background noise |
| **Content** | Natural speech with varied intonation |
| **Environment** | Quiet room, no echo |

### Tips

1. **Avoid music or background noise** - The model works best with clean speech
2. **Include varied sentences** - Mix questions, statements, and exclamations
3. **Natural pace** - Don't speak too fast or too slow
4. **Consistent volume** - Avoid sudden volume changes

## Managing the Service

### Check Status

```bash
modal app list
```

### Stop Service (saves costs)

```bash
modal app stop voice-clone-indextts2
```

### View Logs

```bash
modal app logs voice-clone-indextts2
```

### Redeploy After Changes

```bash
modal deploy scripts/modal_voice_clone.py
```

## Cost Optimization

The service is configured for cost efficiency:

| Setting | Value | Purpose |
|---------|-------|---------|
| `scaledown_window` | 300s (5 min) | Container shuts down after 5 min idle |
| `gpu` | T4 | Cost-effective GPU for inference |
| `memory` | 16384 MB | Sufficient for model loading |
| `timeout` | 600s | Max request duration |

**Estimated costs:**
- Cold start: ~30-60 seconds (first request after idle)
- Per-request: ~$0.001-0.005 (depending on text length)
- Idle: $0 (scales to zero)

## Troubleshooting

### Common Issues

**1. Cold Start Timeout**
```
Error: Request timed out
```
Solution: First request after idle may take 30-60s. Increase client timeout.

**2. Audio Format Issues**
```
Error: Could not decode audio
```
Solution: Ensure voice reference is a valid audio file (WAV, MP3, FLAC).

**3. Rate Limiting**
```
Error: Too many requests
```
Solution: The underlying HuggingFace space has rate limits. Add delays between requests.

**4. GPU Quota Exceeded**
```
Error: GPU quota exceeded
```
Solution: Check Modal dashboard for usage. Upgrade plan if needed.

### Debug Mode

Run locally with verbose output:
```bash
modal run scripts/modal_voice_clone.py \
  --text "Test" \
  --voice-ref voice.wav 2>&1 | tee debug.log
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Your Application                      │
│  (Any repo: React, Node.js, Python, etc.)                   │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS POST (JSON)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Modal Cloud (Serverless)                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              voice-clone-indextts2                     │  │
│  │  ┌─────────────┐    ┌─────────────────────────────┐   │  │
│  │  │  FastAPI    │───▶│  IndexTTS-2 (HuggingFace)   │   │  │
│  │  │  Endpoint   │    │  GPU: T4 | Memory: 16GB     │   │  │
│  │  └─────────────┘    └─────────────────────────────┘   │  │
│  │         │                        │                     │  │
│  │         │           ┌────────────▼────────────┐       │  │
│  │         │           │  Persistent Volume      │       │  │
│  │         │           │  (Model Cache)          │       │  │
│  │         │           └─────────────────────────┘       │  │
│  └─────────┼─────────────────────────────────────────────┘  │
│            │ Auto-scale to 0 after 5 min idle               │
└────────────┼────────────────────────────────────────────────┘
             ▼
      Base64 WAV Audio Response
```

## Files Reference

| File | Description |
|------|-------------|
| `scripts/modal_voice_clone.py` | Modal deployment script |
| `scripts/generate-appkit-voiceover.ts` | Batch voiceover generation example |
| `public/assets/voices/` | Voice reference files |
| `public/assets/audio/` | Generated audio output |

## Related Documentation

- [Modal Labs Docs](https://modal.com/docs)
- [IndexTTS-2 HuggingFace Space](https://huggingface.co/spaces/IndexTeam/IndexTTS-2-Demo)
- [Voice Cloning Guide](./VOICE_CLONING_GUIDE.md)

## License

This integration uses:
- Modal Labs (commercial service)
- IndexTTS-2 (Apache 2.0 license)

Ensure compliance with respective licenses for production use.
