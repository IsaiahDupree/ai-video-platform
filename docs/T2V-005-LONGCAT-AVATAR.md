# T2V-005: LongCat Avatar Integration

Audio-driven talking head video generation for creating animated avatars from portrait images and audio narration.

## Overview

LongCat Avatar enables the creation of realistic talking head videos by animating a static portrait image using audio input. The system synchronizes lip movements, generates natural facial expressions, and adds subtle head movements to create lifelike avatar videos.

## Features

### Core Capabilities
- **Audio-Driven Animation**: Lip sync and facial movements synchronized with audio
- **Natural Expressions**: Realistic facial expressions and micro-movements
- **Identity Preservation**: Consistent character appearance across all frames
- **Multiple Portrait Styles**: Works with photos, illustrations, and various art styles
- **Long-Form Support**: Process audio up to 60 seconds in length
- **High Quality**: 512x512 resolution at configurable frame rates

### Use Cases
1. **Virtual Presenters**: Animated narrators for educational content
2. **Video Messaging**: Personalized talking head videos
3. **Character Animation**: Bring characters to life for storytelling
4. **Marketing Content**: Spokesperson videos for products/services
5. **Training Materials**: Consistent presenter for corporate training
6. **Social Media**: Engaging content with animated avatars

## Architecture

### Model Components

1. **Audio Encoder (Wav2Vec2)**
   - Extracts audio features for animation
   - 16kHz sample rate processing
   - Frame-by-frame audio analysis

2. **VAE (Variational Autoencoder)**
   - Encodes reference portrait to latent space
   - Decodes animated frames back to images
   - Uses StabilityAI's SD-VAE-FT-MSE

3. **Animation Pipeline**
   - Audio-driven motion generation
   - Lip sync coordination
   - Natural head pose variations
   - Expression blending

### Technical Specifications

| Specification | Value |
|---------------|-------|
| **Input Resolution** | 512x512 (auto-resized) |
| **Output Resolution** | 512x512 |
| **Frame Rate** | 25 fps (configurable) |
| **Max Duration** | 60 seconds |
| **Audio Format** | WAV, MP3, or other common formats |
| **Video Format** | MP4 (H.264 codec) |
| **GPU** | A100 40GB |
| **VRAM** | ~16GB |
| **Processing Time** | ~2-4 min per 10 seconds |

## Setup

### 1. Deploy to Modal

```bash
# Deploy the avatar service
modal deploy scripts/modal_longcat_avatar.py

# Get the endpoint URL
modal app list
# Look for: longcat-avatar--generate-avatar-api
```

### 2. Configure Environment

Add to your `.env` file:

```bash
# Modal Avatar API URL
MODAL_AVATAR_URL=https://your-workspace--longcat-avatar-generate-avatar-api.modal.run
```

### 3. Prepare Assets

Create a reference portrait:
- **Format**: JPG or PNG
- **Size**: 512x512 or higher (will be auto-resized)
- **Composition**: Face-forward portrait, centered
- **Quality**: High resolution, well-lit
- **Style**: Any style works (photo, illustration, etc.)

Tips for best results:
- Clear facial features
- Neutral expression in reference image
- Good lighting and contrast
- Avoid heavy shadows or occlusions
- Centered face position

## Usage

### Basic Generation

```bash
# Generate avatar video
npm run generate-avatar -- \\
  --image public/assets/scenes/portrait.jpg \\
  --audio public/assets/audio/narration.wav \\
  --output public/assets/videos/avatar.mp4
```

### Advanced Parameters

```bash
npm run generate-avatar -- \\
  --image portrait.png \\
  --audio speech.mp3 \\
  --output talking_avatar.mp4 \\
  --steps 30 \\              # More steps = higher quality
  --guidance 3.5 \\          # Higher = more adherence to audio
  --fps 30 \\                # Higher frame rate
  --seed 42                  # For reproducible results
```

### Parameter Guide

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| `--steps` | 25 | 20-50 | Inference steps (higher = better quality) |
| `--guidance` | 3.0 | 1.5-5.0 | Audio adherence (higher = tighter sync) |
| `--fps` | 25 | 15-30 | Output frame rate |
| `--seed` | random | any | Random seed for reproducibility |

### Batch Generation

Create a batch config file:

```bash
npm run generate-avatar -- create-config --output avatar-batch.json
```

Edit `avatar-batch.json`:

```json
[
  {
    "referenceImage": "public/assets/scenes/presenter1.jpg",
    "audio": "public/assets/audio/intro.wav",
    "output": "public/assets/videos/intro_avatar.mp4",
    "numInferenceSteps": 25,
    "guidanceScale": 3.0,
    "fps": 25
  },
  {
    "referenceImage": "public/assets/scenes/presenter2.jpg",
    "audio": "public/assets/audio/outro.wav",
    "output": "public/assets/videos/outro_avatar.mp4",
    "numInferenceSteps": 30,
    "guidanceScale": 3.5,
    "fps": 25,
    "seed": 42
  }
]
```

Run batch generation:

```bash
npm run generate-avatar -- batch --config avatar-batch.json
```

## Integration with Voice Pipeline

Combine with voice cloning for end-to-end avatar creation:

```bash
# Step 1: Generate voice narration
npm run generate-voice -- clone \\
  --text "Welcome to our platform! Let me show you around." \\
  --voice rachel \\
  --output narration.wav

# Step 2: Create avatar video
npm run generate-avatar -- \\
  --image presenter.jpg \\
  --audio narration.wav \\
  --output welcome_video.mp4
```

## Direct Modal Usage

For advanced users who want to use Modal directly:

```bash
# Test locally with Modal
modal run scripts/modal_longcat_avatar.py \\
  --image portrait.jpg \\
  --audio narration.wav \\
  --output avatar.mp4 \\
  --steps 30 \\
  --guidance 3.5 \\
  --fps 25
```

## API Usage

### HTTP API

```bash
# Prepare base64 encoded inputs
IMAGE_B64=$(base64 -i portrait.jpg)
AUDIO_B64=$(base64 -i narration.wav)

# Make API request
curl -X POST $MODAL_AVATAR_URL \\
  -H "Content-Type: application/json" \\
  -d '{
    "reference_image": "'$IMAGE_B64'",
    "audio": "'$AUDIO_B64'",
    "num_inference_steps": 25,
    "guidance_scale": 3.0,
    "fps": 25,
    "seed": null
  }' > response.json

# Extract and decode video
cat response.json | jq -r '.video' | base64 -d > output.mp4
```

### TypeScript API

```typescript
import { AvatarGenerator } from './scripts/generate-avatar';

const generator = new AvatarGenerator();

await generator.generateAvatar({
  referenceImage: 'portrait.jpg',
  audio: 'narration.wav',
  output: 'avatar.mp4',
  numInferenceSteps: 25,
  guidanceScale: 3.0,
  fps: 25,
});
```

## Best Practices

### Portrait Images

1. **Composition**
   - Centered face, looking forward
   - Neutral or slightly positive expression
   - Clear facial features
   - Avoid extreme angles or occlusions

2. **Technical**
   - Resolution: 512x512 or higher
   - Format: JPG or PNG
   - Well-lit with good contrast
   - Sharp focus on face

3. **Style Considerations**
   - Works with photos, illustrations, 3D renders
   - Consistent lighting helps quality
   - Higher quality input = better output

### Audio Files

1. **Quality**
   - Clear speech without background noise
   - Good audio levels (not too quiet/loud)
   - Professional recording quality preferred

2. **Format**
   - WAV: Best quality, lossless
   - MP3: Good for compressed files
   - Sample rate: 16kHz+ recommended

3. **Content**
   - Clear pronunciation
   - Appropriate pacing
   - Natural speech patterns work best

### Parameter Tuning

1. **For Speed** (faster generation)
   ```bash
   --steps 20 --guidance 2.5 --fps 24
   ```

2. **For Quality** (better results)
   ```bash
   --steps 30 --guidance 3.5 --fps 25
   ```

3. **For Experimentation** (exploration)
   ```bash
   --steps 25 --guidance 3.0 --fps 25 --seed 42
   ```

## Cost Optimization

### GPU Usage
- **Model**: A100 40GB (~$3.00/hour)
- **Processing**: ~2-4 minutes per 10 seconds of video
- **Auto-scaling**: Scales to zero when idle

### Cost Per Video
- 10-second video: ~$0.20-0.40
- 30-second video: ~$0.60-1.20
- 60-second video: ~$1.20-2.40

### Optimization Tips
1. **Batch Processing**: Generate multiple videos in one session
2. **Optimal Parameters**: Use `--steps 25` for good quality/speed balance
3. **Pre-testing**: Test with short clips before full generation
4. **Asset Reuse**: Use same portrait for multiple narrations

## Troubleshooting

### Common Issues

**1. Endpoint Not Found**
```
Error: connect ECONNREFUSED
```
Solution: Deploy the Modal service first:
```bash
modal deploy scripts/modal_longcat_avatar.py
```

**2. Poor Lip Sync**
- Increase `--guidance` (try 3.5-4.0)
- Use clearer audio with less background noise
- Ensure audio is properly normalized

**3. Unnatural Movements**
- Reduce `--guidance` (try 2.5-3.0)
- Use higher `--steps` (30-40)
- Check reference image quality

**4. Blurry Output**
- Use higher resolution reference image
- Increase `--steps` to 30+
- Ensure good lighting in reference

**5. Timeout Errors**
- Reduce video duration
- Lower `--steps` parameter
- Check Modal service status

### Debug Mode

```bash
# Check Modal service status
modal app list

# View Modal logs
modal app logs longcat-avatar

# Test with minimal parameters
npm run generate-avatar -- \\
  --image test.jpg \\
  --audio test.wav \\
  --output test.mp4 \\
  --steps 20
```

## Performance Benchmarks

| Duration | Steps | FPS | Time | Cost | Quality |
|----------|-------|-----|------|------|---------|
| 5s | 20 | 25 | ~1 min | $0.10 | Good |
| 10s | 25 | 25 | ~2 min | $0.30 | Very Good |
| 30s | 25 | 25 | ~6 min | $0.90 | Very Good |
| 60s | 30 | 25 | ~15 min | $2.40 | Excellent |

## Examples

### Use Case 1: Educational Content

```bash
# Create virtual instructor
npm run generate-avatar -- \\
  --image instructor_portrait.jpg \\
  --audio lesson_01.wav \\
  --output lessons/lesson_01_video.mp4 \\
  --steps 25 \\
  --fps 25
```

### Use Case 2: Marketing Video

```bash
# Generate spokesperson video
npm run generate-avatar -- \\
  --image spokesperson.jpg \\
  --audio product_pitch.wav \\
  --output marketing/promo.mp4 \\
  --steps 30 \\
  --guidance 3.5
```

### Use Case 3: Personalized Messages

```bash
# Create custom greeting
npm run generate-avatar -- \\
  --image your_photo.jpg \\
  --audio birthday_message.wav \\
  --output messages/birthday.mp4 \\
  --seed 42
```

## Advanced Features

### Custom Portrait Preprocessing

For best results, preprocess portraits:

1. **Face Detection & Cropping**
2. **Background Removal**
3. **Lighting Normalization**
4. **Resolution Enhancement**

### Integration with Other Services

Combine with platform features:

```bash
# Full pipeline: Text → Voice → Avatar
VOICE_FILE="temp_voice.wav"
VIDEO_FILE="final_avatar.mp4"

# 1. Generate voice
npm run generate-voice -- clone \\
  --text "Your narration text here" \\
  --voice rachel \\
  --output $VOICE_FILE

# 2. Generate avatar
npm run generate-avatar -- \\
  --image portrait.jpg \\
  --audio $VOICE_FILE \\
  --output $VIDEO_FILE

# 3. Cleanup
rm $VOICE_FILE
```

## Future Enhancements

Planned improvements:
- [ ] Multi-speaker support
- [ ] Emotion control
- [ ] Custom head pose control
- [ ] Background customization
- [ ] Real-time streaming
- [ ] Expression presets

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review Modal logs: `modal app logs longcat-avatar`
3. Verify environment configuration
4. Test with minimal example first

## References

- Modal Documentation: https://modal.com/docs
- Wav2Vec2 Model: https://huggingface.co/facebook/wav2vec2-base-960h
- StabilityAI VAE: https://huggingface.co/stabilityai/sd-vae-ft-mse
