# PRD: InfiniteTalk Video Generation System

## Overview

**Product**: AI-powered talking head video generation using InfiniteTalk 14B model  
**Platform**: Modal serverless GPU infrastructure  
**Status**: MVP Complete ✅  
**Last Updated**: January 2026

---

## 1. Problem Statement

Creating realistic talking head videos from a single image and audio is complex, requiring:
- Large AI models (14B+ parameters)
- Expensive GPU infrastructure (A100-80GB)
- Complex dependency management (PyTorch, Flash Attention, xformers)
- Long generation times (15-45 minutes per video)

**Solution**: A serverless API that handles all complexity, allowing users to submit an image + audio and receive a lip-synced video.

---

## 2. User Stories

| As a... | I want to... | So that... |
|---------|--------------|------------|
| Developer | Call an API with image + audio | I can integrate talking head videos into my app |
| Content Creator | Upload a face photo and voiceover | I can create AI avatar videos without recording |
| Enterprise User | Generate videos at scale | I can produce training/marketing content efficiently |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Modal Cloud                               │
│  ┌─────────────────┐    ┌─────────────────────────────────────┐ │
│  │   FastAPI App   │    │     InfiniteTalkService             │ │
│  │   /generate     │───▶│     - A100-80GB GPU                 │ │
│  │   /health       │    │     - 14B Wan Model                 │ │
│  └─────────────────┘    │     - wav2vec2 audio encoder        │ │
│                         │     - TeaCache acceleration         │ │
│  ┌─────────────────┐    └─────────────────────────────────────┘ │
│  │  Modal Volumes  │                                            │
│  │  /weights (26GB)│◀── Persistent model storage               │
│  │  /data          │◀── Job working directories                │
│  └─────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Input Requirements

### 4.1 Image Requirements

| Requirement | Specification | Why |
|-------------|---------------|-----|
| **Resolution** | 512x512+ recommended | Higher res = better face details |
| **Aspect Ratio** | Any (auto-resized to 832x480) | Model expects 480p widescreen |
| **Face Position** | Centered, front-facing | Best lip-sync accuracy |
| **Lighting** | Even, no harsh shadows | Reduces artifacts |
| **Background** | Simple/neutral preferred | Less distraction |
| **Format** | PNG, JPG, WebP | Base64 encoded for API |

**Best Practice**: Use a professional headshot or passport-style photo with good lighting.

### 4.2 Audio Requirements

| Requirement | Specification | Why |
|-------------|---------------|-----|
| **Sample Rate** | Any (auto-resampled to 16kHz) | Model expects 16kHz |
| **Channels** | Any (auto-converted to mono) | Model expects mono |
| **Duration** | 5-10 seconds recommended | Longer = more VRAM/time |
| **Quality** | Clear speech, minimal background noise | Better lip-sync |
| **Format** | WAV, MP3 | Base64 encoded for API |

**Best Practice**: Record in a quiet environment, or use high-quality TTS.

---

## 5. Quality Profiles

| Profile | Steps | Mode | TeaCache | Resolution | Est. Time | Use Case |
|---------|-------|------|----------|------------|-----------|----------|
| `fast` | 8 | clip | ✅ | 480p | ~15 min | Quick previews, testing |
| `low_vram` | 8 | clip | ✅ | 480p | ~15 min | Memory-constrained |
| `balanced` | 20 | streaming | ✅ | 480p | ~25 min | Good quality/speed balance |
| `quality` | 40 | streaming | ❌ | 720p | ~45 min | Final production |

---

## 6. API Specification

### 6.1 Endpoint

```
POST https://isaiahdupree33--video-lab-fastapi-app.modal.run/generate
```

### 6.2 Request Body

```json
{
  "model": "infinitetalk",
  "image_b64": "<base64-encoded-image>",
  "audio_b64": "<base64-encoded-audio>",
  "prompt": "a person talking, natural head movement",
  "profile": "fast",
  "max_duration_sec": 5.0
}
```

### 6.3 Response

```json
{
  "video_b64": "<base64-encoded-mp4>",
  "metadata": {
    "job_id": "abc123",
    "frame_num": 80,
    "audio_duration": 5.0,
    "profile": "fast"
  }
}
```

### 6.4 Error Responses

| Code | Meaning |
|------|---------|
| 400 | Invalid input (missing image/audio, bad format) |
| 500 | Generation failed (OOM, model error) |
| 504 | Timeout (generation took too long) |

---

## 7. Setup & Deployment

### 7.1 Prerequisites

- Modal account with GPU access (A100-80GB)
- HuggingFace account with token (for model downloads)
- ~30GB storage for model weights

### 7.2 Initial Setup

```bash
# 1. Install Modal CLI
pip install modal

# 2. Authenticate
modal setup

# 3. Create HuggingFace secret
modal secret create HF_SECRET HF_TOKEN=hf_your_token_here

# 4. Download model weights (one-time, ~26GB)
modal run scripts/modal_video_lab.py --download-weights

# 5. Deploy the service
modal deploy scripts/modal_video_lab.py
```

### 7.3 Testing

```bash
# Local test with CLI
modal run scripts/modal_video_lab.py \
  --model infinitetalk \
  --image path/to/face.jpg \
  --audio path/to/audio.wav \
  --profile fast

# API test
python scripts/test_video_lab.py
```

---

## 8. Enhancement Roadmap

### 8.1 FusioniX LoRA Support (Priority: High)

**What**: Speed LoRA that improves 8-step generation quality  
**Why**: Better quality at same speed as `fast` profile  
**How**:
1. Download FusioniX weights from HuggingFace
2. Add `--lora_dir` parameter to generation command
3. Create `fast_lora` profile

**Implementation**:
```python
# Add to download_weights()
subprocess.run([
    "huggingface-cli", "download",
    "MeiGen-AI/InfiniteTalk",
    "--include", "lora/*",
    "--local-dir", "/weights/InfiniteTalk"
])

# Add to INFINITETALK_PROFILES
"fast_lora": {
    "size": "infinitetalk-480",
    "sample_steps": 8,
    "sample_shift": 2,
    "num_persistent_param_in_dit": 0,
    "use_teacache": True,
    "mode": "clip",
    "lora_dir": "/weights/InfiniteTalk/lora/fusionix",
    "lora_scale": 1.2,
}
```

### 8.2 Lightx2v LoRA (Priority: Medium)

**What**: 4-step generation LoRA  
**Why**: 2x faster than 8-step  
**Tradeoff**: Slightly lower quality

### 8.3 FP8 Quantization (Priority: Medium)

**What**: 8-bit floating point model weights  
**Why**: Reduce VRAM usage, potentially faster  
**How**: Add `--quant fp8` flag

### 8.4 Multi-GPU Support (Priority: Low)

**What**: Distribute model across multiple GPUs  
**Why**: Handle longer videos, faster generation  
**How**: Use `torchrun --nproc_per_node=N`

---

## 9. Cost Analysis

### 9.1 Modal Pricing (A100-80GB)

| Resource | Rate |
|----------|------|
| A100-80GB | ~$3.50/hour |
| Storage | ~$0.10/GB/month |

### 9.2 Per-Video Cost

| Profile | Time | Est. Cost |
|---------|------|-----------|
| fast | 15 min | ~$0.88 |
| balanced | 25 min | ~$1.46 |
| quality | 45 min | ~$2.63 |

### 9.3 Optimization Tips

- Use `fast` profile for testing
- Keep warm containers (`min_containers=1`) to avoid cold start model loading (~5 min)
- Batch similar-length videos to maximize GPU utilization

---

## 10. Monitoring & Debugging

### 10.1 Logs

```bash
# View recent logs
modal app logs video-lab

# View specific run
modal app logs <app-id>
```

### 10.2 Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Timeout | Video too long | Reduce `max_duration_sec` or use `fast` profile |
| OOM | Too many frames | Reduce duration, use `low_vram` profile |
| Shape mismatch | Wrong image size | Ensure preprocessing resizes to 832x480 |
| Audio assertion | Audio too short | Minimum 5 seconds for clip mode |

### 10.3 Health Check

```bash
curl https://isaiahdupree33--video-lab-fastapi-app.modal.run/health
# Returns: {"status": "healthy", "models": ["infinitetalk", "longcat"]}
```

---

## 11. Security Considerations

- API is publicly accessible (add auth for production)
- HuggingFace token stored in Modal secrets (not in code)
- Input validation prevents arbitrary code execution
- Base64 encoding for data transfer (consider size limits)

---

## 12. Future Considerations

1. **Authentication**: Add API keys or OAuth
2. **Rate Limiting**: Prevent abuse
3. **Webhook Callbacks**: For async long-running jobs
4. **Video-to-Video**: Use existing video as input (dubbing)
5. **Multi-person**: Support multiple speakers in one video
6. **Streaming Output**: Progressive video delivery

---

## Appendix A: File Structure

```
scripts/
├── modal_video_lab.py      # Main Modal application
├── test_video_lab.py       # API test script
docs/
├── PRD_InfiniteTalk_Video_Generation.md  # This document
```

## Appendix B: Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| torch | 2.6.0+cu124 | Deep learning framework |
| torchvision | 0.21.0+cu124 | Image processing |
| flash-attn | 2.7.4 | Efficient attention |
| xformers | 0.0.29.post3 | Memory-efficient ops |
| transformers | latest | HuggingFace models |
| diffusers | latest | Diffusion pipelines |
| librosa | latest | Audio processing |

## Appendix C: Model Weights

| Model | Size | Path |
|-------|------|------|
| Wan2.1-I2V-14B-480P | ~20GB | /weights/Wan2.1-I2V-14B-480P |
| chinese-wav2vec2-base | ~1GB | /weights/chinese-wav2vec2-base |
| InfiniteTalk | ~5GB | /weights/InfiniteTalk |
