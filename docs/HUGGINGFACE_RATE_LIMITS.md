# Hugging Face Rate Limits & Troubleshooting

Documentation of rate limit testing and troubleshooting for ZeroGPU Spaces.

---

## Quick Reference

| Tier | ZeroGPU Quota | Cost | Videos/Day (10-min) |
|------|---------------|------|---------------------|
| **Free** | 4 min/day | $0 | ~1 |
| **PRO** | 32 min/day (8×) | $9/month | ~10 |
| **Credits** | Pay-as-you-go | $0.10/min | Unlimited |

---

## Test Results (Jan 2, 2026)

### Test 1: Rate Limit Discovery

**Command:**
```bash
source .venv/bin/activate && python scripts/test-hf-rate-limit.py
```

**Result:**
```
🚫 RATE LIMIT DETECTED at request #1
Error: "You have exceeded your free GPU quota (60s requested vs. 55s left)"
```

**Analysis:**
- Error message showed "60s requested" - this is the model's **estimate**, not actual usage
- User had 3.4 min remaining quota (verified via HF dashboard)
- The model conservatively estimates GPU time before running

### Test 2: Space Availability

**Command:**
```bash
curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://indexteam-indextts-2-demo.hf.space/
```

**Result:**
```
Exit code: 28 (timeout)
HTTP code: 000 (no response)
```

**Analysis:**
- The Space was **sleeping/unavailable**, not rate limited
- ZeroGPU Spaces go idle after inactivity to save resources
- Connection timeout ≠ rate limit

---

## Common Errors & Fixes

### Error 1: "ZeroGPU quota exceeded"

```
ZeroGPU quota exceeded
You have exceeded your free GPU quota (60s requested vs. 55s left).
Try again in 8:54:56
```

**Possible Causes:**
1. ✅ Actually exceeded quota → Wait for reset
2. ⚠️ Model overestimated GPU time → Try shorter text
3. ⚠️ Space is waking up and rejecting requests → Wake manually first

**Fix:**
1. Check actual quota at [huggingface.co/settings/billing](https://huggingface.co/settings/billing)
2. If quota shows available, wake the Space manually in browser
3. Retry with shorter text first

### Error 2: "httpx.ReadTimeout"

```
httpx.ReadTimeout: The read operation timed out
```

**Cause:** Space is sleeping or server is overloaded

**Fix:**
1. Open Space in browser: [IndexTTS-2 Demo](https://huggingface.co/spaces/IndexTeam/IndexTTS-2-Demo)
2. Wait for "Running" status
3. Retry API call

### Error 3: "Connection refused" / "503 Service Unavailable"

**Cause:** Space is down or restarting

**Fix:**
1. Wait 1-2 minutes
2. Check Space status page
3. Try alternative TTS (OpenAI, ElevenLabs)

---

## Checking Your Quota

### Via Dashboard
1. Go to [huggingface.co/settings/billing](https://huggingface.co/settings/billing)
2. Look at **ZeroGPU** under Compute
3. Shows `used / total` (e.g., `2.6/4 minutes`)

### Via API (not implemented)
HuggingFace doesn't expose quota via API. You must check the dashboard.

---

## Quota Math for Video Production

### Per-Request GPU Time

| Text Length | Est. GPU Time |
|-------------|---------------|
| Short (1-10 words) | 3-5 seconds |
| Medium (10-30 words) | 5-10 seconds |
| Long (30-100 words) | 10-20 seconds |

### 10-Minute Video Estimate

```
Segments:     ~25 voiceover clips
GPU/segment:  ~8 seconds average
Total GPU:    ~3.3 minutes per video

Free tier:    1 video/day
PRO tier:     ~10 videos/day
```

---

## Test Scripts

### Rate Limit Test
```bash
# Activate venv and run test
source .venv/bin/activate
python scripts/test-hf-rate-limit.py
```

Location: `scripts/test-hf-rate-limit.py`

### Quick Connection Test
```bash
# Check if Space is responding
curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
  https://indexteam-indextts-2-demo.hf.space/
```

Expected: `200` (running) or `000` (sleeping/down)

### Single Voice Clone Test
```bash
source .venv/bin/activate
python scripts/test-indextts2.py
```

---

## Fallback Strategy

When HuggingFace is unavailable or quota exceeded:

### Option 1: OpenAI TTS
```python
import openai

response = openai.audio.speech.create(
    model="tts-1",
    voice="onyx",  # or alloy, echo, fable, nova, shimmer
    input="Your text here"
)
response.stream_to_file("output.mp3")
```

Cost: ~$0.015 per 1,000 characters

### Option 2: ElevenLabs
```python
from elevenlabs import generate, save

audio = generate(
    text="Your text here",
    voice="Josh",
    model="eleven_monolingual_v1"
)
save(audio, "output.mp3")
```

Cost: Free tier available, then ~$5/month

### Option 3: Local TTS (Coqui)
```python
from TTS.api import TTS

tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC")
tts.tts_to_file(text="Your text", file_path="output.wav")
```

Cost: Free (runs locally, no GPU required for basic models)

---

## Upgrading to PRO

### Benefits
- 8× ZeroGPU quota (4 min → 32 min/day)
- Priority in queues
- 20× inference credits
- H200 hardware access

### Cost
$9/month

### When to Upgrade
- Need more than 1 video/day
- Want faster/more reliable access
- Building a product with multiple users

---

## Architecture Recommendation

For production use:

```
┌─────────────────────────────────────────────────────────────┐
│                    TTS REQUEST FLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   User Request                                               │
│        │                                                     │
│        ▼                                                     │
│   ┌─────────────┐                                            │
│   │ Check quota │                                            │
│   └─────────────┘                                            │
│        │                                                     │
│        ├─── Quota OK ───► IndexTTS-2 (HuggingFace)           │
│        │                       │                             │
│        │                       ├── Success → Return audio    │
│        │                       │                             │
│        │                       └── Fail → Fallback ──┐       │
│        │                                             │       │
│        └─── Quota Low ──────────────────────────────►│       │
│                                                      │       │
│                                                      ▼       │
│                                              ┌─────────────┐ │
│                                              │ OpenAI TTS  │ │
│                                              │ (fallback)  │ │
│                                              └─────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## File Locations

| File | Purpose |
|------|---------|
| `scripts/test-hf-rate-limit.py` | Rate limit discovery test |
| `scripts/test-indextts2.py` | Voice cloning test |
| `docs/VOICE_CLONING_USER_GUIDE.md` | User guide for voice cloning |
| `docs/HUGGINGFACE_RATE_LIMITS.md` | This document |

---

*Last updated: January 2, 2026*
