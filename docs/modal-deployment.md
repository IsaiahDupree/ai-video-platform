# Modal Deployment Guide

This guide covers deploying AI models to Modal for the AI Video Platform.

## Prerequisites

1. **Modal Account**: Sign up at [modal.com](https://modal.com)
2. **Modal CLI**: Install the Modal Python package
   ```bash
   pip install modal
   ```
3. **Authentication**: Set up Modal credentials
   ```bash
   modal token new
   ```

## Available Modal Services

### 1. Voice Clone Service (VC-001)

Deploy IndexTTS voice cloning model to Modal.

**File**: `scripts/modal_voice_clone.py`

**Deploy**:
```bash
modal deploy scripts/modal_voice_clone.py
```

**Test locally**:
```bash
modal run scripts/modal_voice_clone.py --text "Hello world" --reference-audio path/to/audio.wav
```

**API Endpoint**:
After deployment, Modal will provide a web endpoint URL. Use it like:

```bash
curl -X POST https://your-username--voice-clone-endpoint.modal.run \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, this is a cloned voice",
    "reference_audio_url": "https://example.com/reference.wav",
    "speaker_name": "speaker_1",
    "speed": 1.0,
    "temperature": 0.7
  }'
```

**Features**:
- Zero-shot voice cloning with ~3-10 seconds of reference audio
- Batch processing support
- GPU acceleration (A10G)
- Auto-scaling to zero when idle
- Model weight caching via Modal volumes

**Cost Management**:
- Container idle timeout: 5 minutes
- Request timeout: 10 minutes
- GPU: A10G (cost-effective for inference)

### 2. Text-to-Video Services (Phase 4)

Coming soon:
- `modal_ltx_video.py` - LTX-Video model
- `modal_mochi.py` - Genmo Mochi 10B
- `modal_hunyuan.py` - Tencent HunyuanVideo
- `modal_wan.py` - Alibaba Wan2.2
- `modal_longcat_avatar.py` - Audio-driven talking heads

## Modal Configuration

### GPU Selection

| Model | Recommended GPU | Cost/hr | Notes |
|-------|----------------|---------|-------|
| Voice Clone (IndexTTS) | A10G | ~$1.00 | Good balance |
| LTX-Video | A100 40GB | ~$3.00 | Fast T2V |
| Mochi 10B | A100 80GB | ~$4.50 | Large model |
| HunyuanVideo | 2x A100 80GB | ~$9.00 | Very large |

### Volume Management

Model weights are cached in Modal volumes:
- `voice-clone-models` - Voice cloning models
- `t2v-models` - Text-to-video model weights
- `shared-models` - Shared dependencies

### Environment Variables

Create a `.env` file:
```bash
MODAL_TOKEN_ID=your_token_id
MODAL_TOKEN_SECRET=your_token_secret
OPENAI_API_KEY=your_openai_key
ELEVENLABS_API_KEY=your_elevenlabs_key
```

## Monitoring

View logs:
```bash
modal app logs voice-clone
```

Check running containers:
```bash
modal container list
```

Stop all containers:
```bash
modal app stop voice-clone
```

## Cost Optimization

1. **Auto-scaling**: Containers scale to zero when idle
2. **Container idle timeout**: Adjust based on usage patterns
3. **Model caching**: Use volumes to avoid re-downloading weights
4. **Batch processing**: Group requests for efficiency
5. **GPU selection**: Use smallest GPU that meets performance needs

## Troubleshooting

### Model not loading
- Check volume mounts are correct
- Verify model path in code
- Check HuggingFace authentication if needed

### Out of memory
- Increase GPU size
- Reduce batch size
- Enable gradient checkpointing for training

### Slow cold starts
- Pre-warm containers with `@modal.enter()`
- Increase container idle timeout
- Use smaller base images

## Next Steps

1. Deploy voice cloning service
2. Test API endpoints
3. Integrate with TypeScript client (`src/services/voiceClone.ts`)
4. Monitor costs and adjust GPU selection
5. Deploy additional models as needed
