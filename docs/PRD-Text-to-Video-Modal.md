# PRD: Open-Source Text-to-Video on Modal

## Overview

Deploy open-source text-to-video models on Modal as a HeyGen alternative, enabling:
- Text-to-video generation
- Talking avatar synthesis (audio-driven)
- Integration with existing Remotion video pipeline

---

## Goals

1. **Cost-effective** - Serverless GPU, pay only for compute time
2. **Fast** - Real-time or near-real-time generation
3. **Flexible** - Support multiple models for different use cases
4. **Integrated** - Works with existing voice cloning and video pipeline

---

## Model Selection

| Model | Params | License | Use Case | GPU Req | Priority |
|-------|--------|---------|----------|---------|----------|
| **LTX-Video** | 2-13B | Custom | Fast text-to-video | A10G+ | **P0** |
| **LongCat-Video-Avatar** | - | MIT | Talking avatars | H100 | **P1** |
| **Wan2.2 TI2V-5B** | 5B | Apache-2.0 | High-quality video | RTX 4090/A100 | P2 |
| **Mochi** | 10B | Apache-2.0 | Photorealistic | H100 | P3 |
| **HunyuanVideo** | 13B | Tencent | Highest quality | Datacenter | P4 |

### Phase 1: LTX-Video (Priority)
- **Why**: Fastest generation (30 FPS real-time), smallest footprint
- **Capability**: 1216×704 resolution, ~2 seconds for 20s video on warm GPU
- **Model**: `Lightricks/LTX-Video` on Hugging Face

### Phase 2: LongCat-Video-Avatar
- **Why**: Talking avatar generation (HeyGen's core feature)
- **Capability**: Audio+Text+Image → lip-synced video
- **Model**: `Meituan/LongCat-Video-Avatar` on Hugging Face

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Text-to-Video Pipeline                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Client     │    │    Modal     │    │   Storage    │       │
│  │   Request    │───▶│   GPU Pod    │───▶│   (Volume)   │       │
│  │   (API)      │    │   (A10G/H100)│    │   Output     │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                             │                   │                │
│                             ▼                   ▼                │
│                      ┌─────────────────────────────────┐        │
│                      │       Model Options              │        │
│                      ├─────────────────────────────────┤        │
│                      │  LTX-Video    │ Fast T2V        │        │
│                      │  LongCat      │ Talking Avatar  │        │
│                      │  Wan2.2       │ High Quality    │        │
│                      └─────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Design

### Text-to-Video Endpoint

```
POST /generate-video
Content-Type: application/json

{
  "prompt": "A serene mountain landscape with flowing water",
  "negative_prompt": "blurry, low quality",
  "duration_seconds": 5,
  "width": 768,
  "height": 512,
  "num_inference_steps": 50,
  "guidance_scale": 7.5
}

Response:
{
  "video": "<base64-encoded MP4>",
  "duration_ms": 5000,
  "generation_time_ms": 2340
}
```

### Talking Avatar Endpoint

```
POST /generate-avatar
Content-Type: application/json

{
  "audio": "<base64-encoded audio>",
  "reference_image": "<base64-encoded image>",  // optional
  "prompt": "Professional presenter in a modern office",
  "duration_seconds": 30
}

Response:
{
  "video": "<base64-encoded MP4>",
  "lip_sync_score": 0.95
}
```

### Health Check

```
GET /health

{
  "status": "healthy",
  "model": "LTX-Video",
  "gpu": "A10G",
  "warm": true
}
```

---

## Implementation Plan

### Phase 1: LTX-Video (Week 1)

1. **Modal Deployment Script**
   - `scripts/modal_text_to_video.py`
   - GPU: A10G (cost-effective) or H100 (fastest)
   - Volume caching for model weights (~5GB)
   - FastAPI endpoint for HTTP requests

2. **Integration Script**
   - `scripts/generate-video-modal.ts`
   - TypeScript client for API calls
   - CLI for testing

3. **Documentation**
   - API reference
   - Integration examples

### Phase 2: Talking Avatar (Week 2)

1. **LongCat-Video-Avatar Deployment**
   - Audio preprocessing pipeline
   - Reference image handling
   - Lip-sync optimization

2. **Full Pipeline Integration**
   - Text → TTS (ElevenLabs) → Avatar Video
   - Combine with existing voice cloning

### Phase 3: Advanced Features (Week 3+)

1. **Video-to-Video** - Style transfer, enhancement
2. **Image-to-Video** - Animate static images
3. **Long-form Video** - Chunk stitching for >30s videos

---

## Technical Requirements

### Dependencies

```python
# Modal Image
torch>=2.1.0
diffusers>=0.30.0
transformers>=4.40.0
accelerate>=0.25.0
imageio[ffmpeg]
huggingface_hub
safetensors
```

### GPU Requirements

| Model | Min GPU | Recommended | VRAM |
|-------|---------|-------------|------|
| LTX-Video 2B | A10G | A100 | 16GB |
| LTX-Video 13B | A100 | H100 | 40GB |
| LongCat-Avatar | A100 | H100 | 40GB |
| Wan2.2 5B | A10G | A100 | 24GB |

### Cost Estimates (Modal)

| Operation | GPU | Time | Cost |
|-----------|-----|------|------|
| 5s video (LTX-2B) | A10G | ~10s | ~$0.01 |
| 20s video (LTX-2B) | A10G | ~30s | ~$0.03 |
| 30s avatar | H100 | ~60s | ~$0.15 |

---

## Success Metrics

1. **Generation Speed**: <10s for 5s video on warm container
2. **Quality**: Comparable to HeyGen for talking avatars
3. **Reliability**: 99% success rate on API calls
4. **Cost**: <$0.05 per 10s of generated video

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Cold start latency (30-60s) | Keep containers warm with periodic pings |
| High GPU costs | Use A10G for dev, H100 only for production |
| Model quality variance | Test multiple models, provide fallbacks |
| Large model downloads | Cache in Modal volumes, use FP8 variants |

---

## References

- [LTX-Video on Hugging Face](https://huggingface.co/Lightricks/LTX-Video)
- [LongCat-Video-Avatar](https://huggingface.co/Meituan/LongCat-Video-Avatar)
- [Modal Text-to-Video Examples](https://modal.com/docs/examples)
- [Diffusers Video Pipeline](https://huggingface.co/docs/diffusers/using-diffusers/text-to-video)

---

## Appendix: Model Details

### LTX-Video
- First DiT-based video diffusion model
- Real-time generation capability
- Multiple model sizes (2B distilled → 13B full)
- FP8 quantized variants available

### LongCat-Video-Avatar
- Audio-driven talking head generation
- Supports: AT2V, ATI2V (with reference image)
- Long video support via cross-chunk latent stitching
- Natural expressions and body motion

### Wan2.2
- Mixture-of-Experts architecture
- 720p 24FPS output
- Visual text rendering (English/Chinese)
- Apache-2.0 license
