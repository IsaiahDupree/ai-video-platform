# Voice Cloning User Guide

Clone your voice using IndexTTS-2 on Hugging Face for video voiceovers.

---

## Quick Start

```bash
# 1. Record your voice (see Recording Guide below)
# 2. Place file at: public/assets/voices/your-voice.wav

# 3. Run the test script
python scripts/test-indextts2.py
```

---

## How It Works

```
┌─────────────────────────────────────────────────────────────────────┐
│                    VOICE CLONING PIPELINE                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   YOUR VOICE          +        TEXT           =    CLONED AUDIO     │
│   REFERENCE                    SCRIPT              OUTPUT           │
│   (5-30 sec WAV)               (any text)          (WAV file)       │
│                                                                     │
│        ↓                          ↓                     ↓           │
│   ┌─────────┐              ┌───────────┐         ┌───────────┐      │
│   │  .wav   │   ────────>  │ IndexTTS-2│  ────>  │ clone.wav │      │
│   │ sample  │              │ (HF API)  │         │           │      │
│   └─────────┘              └───────────┘         └───────────┘      │
│                                                                     │
│   Captures:                 Processes:            Outputs:          │
│   - Voice timbre           - Text tokenization   - Your voice       │
│   - Speaking style         - Voice embedding     - Speaking the     │
│   - Accent/tone            - Mel spectrogram       new text         │
│   - Emotion baseline       - Vocoder synthesis                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Record Your Voice Reference

### Requirements

| Requirement | Details |
|-------------|---------|
| **Format** | WAV (preferred) or MP3 |
| **Duration** | 5-30 seconds optimal |
| **Sample Rate** | 16kHz or higher |
| **Quality** | Clear, no background noise |
| **Content** | Natural speech, varied intonation |

### Recording Tips

1. **Use a quiet room** - No echo, AC noise, or background sounds
2. **Stay consistent distance** - 6-12 inches from mic
3. **Speak naturally** - Don't perform, just talk normally
4. **Include variety** - Questions, statements, emphasis
5. **Avoid** - Coughs, breaths, filler words (um, uh)

### Example Script to Read

> "Hi, my name is [your name]. I'm recording this voice sample to create a digital clone of my voice. The weather today is beautiful, isn't it? I really enjoy working on creative projects. This should give the AI enough variety to understand how I naturally speak."

### Recording Tools

| Tool | Platform | Cost |
|------|----------|------|
| Voice Memos | iOS/Mac | Free |
| Audacity | All | Free |
| QuickTime | Mac | Free |
| Adobe Podcast | Web | Free (AI enhance) |

---

## Step 2: Prepare Your Voice File

### Save Location

Place your voice file in:
```
public/assets/voices/your-voice.wav
```

### File Naming

```
public/assets/voices/
├── isaiah.wav          # Example voice
├── your-voice.wav      # Your custom voice
└── client-voice.wav    # Client voice (optional)
```

### Convert to WAV (if needed)

```bash
# Using ffmpeg
ffmpeg -i your-recording.mp3 -ar 16000 -ac 1 public/assets/voices/your-voice.wav

# Or using sox
sox your-recording.mp3 -r 16000 -c 1 public/assets/voices/your-voice.wav
```

---

## Step 3: Set Up Environment

### Install Dependencies

```bash
pip install gradio_client
```

### Get Hugging Face Token (Optional but Recommended)

1. Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Create a new token with "Read" access
3. Add to your `.env` file:

```bash
HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Step 4: Clone Your Voice

### Option A: Use the Test Script

```bash
python scripts/test-indextts2.py
```

Modify the script to use your voice:
```python
voice_ref = project_root / "public/assets/voices/your-voice.wav"
test_text = "Your custom text here"
```

### Option B: Python API

```python
from gradio_client import Client, handle_file

def clone_voice(voice_path: str, text: str, output_path: str):
    """
    Clone a voice to speak new text.
    
    Args:
        voice_path: Path to your voice reference WAV file
        text: Text you want the cloned voice to speak
        output_path: Where to save the output audio
    """
    # Connect to IndexTTS-2 on Hugging Face
    client = Client("IndexTeam/IndexTTS-2-Demo")
    
    # Generate speech
    result = client.predict(
        emo_control_method="Same as the voice reference",
        prompt=handle_file(voice_path),           # Your voice file
        text=text,                                 # What to say
        emo_ref_path=handle_file(voice_path),     # Emotion reference
        emo_weight=0.8,
        vec1=0, vec2=0, vec3=0, vec4=0,           # Emotion vectors
        vec5=0, vec6=0, vec7=0, vec8=0,
        emo_text="",
        emo_random=False,
        max_text_tokens_per_segment=120,
        param_16=True,    # do_sample
        param_17=0.8,     # top_p
        param_18=30,      # top_k
        param_19=0.8,     # temperature
        param_20=0,       # length_penalty
        param_21=3,       # num_beams
        param_22=10,      # repetition_penalty
        param_23=1500,    # max_mel_tokens
        api_name="/gen_single"
    )
    
    # Handle response (returns dict with 'value' key)
    if isinstance(result, dict):
        audio_path = result.get("value", result)
    else:
        audio_path = result
    
    # Save output
    import shutil
    shutil.copy(audio_path, output_path)
    return output_path

# Usage
clone_voice(
    voice_path="public/assets/voices/your-voice.wav",
    text="Hello! This is my cloned voice speaking new words.",
    output_path="output/my-clone.wav"
)
```

### Option C: Generate Multiple Voiceovers

```python
scripts = [
    {"id": "intro", "text": "Welcome to our video!"},
    {"id": "point1", "text": "First, let's talk about the problem."},
    {"id": "cta", "text": "Click the link below to learn more."},
]

for script in scripts:
    clone_voice(
        voice_path="public/assets/voices/your-voice.wav",
        text=script["text"],
        output_path=f"output/voiceovers/{script['id']}.wav"
    )
```

---

## Step 5: Emotion Control (Advanced)

### Method 1: Match Voice Reference
```python
emo_control_method="Same as the voice reference"
```
Uses the emotion/tone from your reference recording.

### Method 2: Custom Emotion Vectors
```python
emo_control_method="Use emotion vectors"
# Adjust these 0-1 values:
vec1=0.7,  # happy
vec2=0.0,  # angry
vec3=0.0,  # sad
vec4=0.0,  # afraid
vec5=0.0,  # disgusted
vec6=0.0,  # melancholic
vec7=0.3,  # surprised
vec8=0.5,  # calm
```

### Emotion Presets

| Preset | Happy | Angry | Sad | Calm | Use For |
|--------|-------|-------|-----|------|---------|
| Neutral | 0 | 0 | 0 | 0.8 | Explainers |
| Excited | 0.8 | 0 | 0 | 0.2 | Promos |
| Serious | 0 | 0.2 | 0 | 0.6 | Warnings |
| Friendly | 0.5 | 0 | 0 | 0.5 | Tutorials |

---

## Limitations & Quotas

### Free Tier Limits

| Limit | Details |
|-------|---------|
| GPU Time | ~60 seconds/day on free tier |
| Queue | May wait if service is busy |
| Rate | ~10-20 generations before cooldown |

### Fallback Options

When quota is exceeded:
1. **Wait** - Quota resets daily
2. **OpenAI TTS** - Use as fallback (different voice)
3. **Local Model** - Run IndexTTS-2 locally (requires GPU)

```python
# Fallback to OpenAI TTS
import openai

def fallback_tts(text: str, output_path: str):
    response = openai.audio.speech.create(
        model="tts-1",
        voice="onyx",  # or alloy, echo, fable, nova, shimmer
        input=text
    )
    response.stream_to_file(output_path)
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "Quota exceeded" | Wait for daily reset or use fallback |
| "File not found" | Check path, use absolute path |
| "Connection error" | HF servers may be down, retry later |
| "Poor quality output" | Improve voice reference quality |
| "Wrong voice" | Re-record with clearer speech |

### Voice Reference Quality Check

```bash
# Check file properties
ffprobe -v error -show_entries format=duration,sample_rate,channels \
  -of default=noprint_wrappers=1 public/assets/voices/your-voice.wav
```

Good reference:
- Duration: 5-30 seconds
- Sample rate: 16000+ Hz
- Channels: 1 (mono) or 2 (stereo)

---

## Integration with Remotion

Once you have cloned voiceovers, use them in Remotion:

```tsx
// In your composition
import { Audio } from 'remotion';

export const MyVideo = () => {
  return (
    <>
      <Audio src={staticFile('voiceovers/intro.wav')} />
      {/* Video content */}
    </>
  );
};
```

### Generate Word Timestamps

```bash
# After generating voiceovers, get word-level timestamps
python scripts/generate-word-timestamps.py
```

This creates `timestamps.json` for syncing captions.

---

## File Locations

| Path | Purpose |
|------|---------|
| `public/assets/voices/` | Voice reference files |
| `output/voiceovers/` | Generated audio output |
| `scripts/test-indextts2.py` | Test script |
| `scripts/generate-aircraft-voiceovers.py` | Batch generation example |

---

## API Reference

### IndexTTS-2 Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | file | required | Voice reference audio |
| `text` | string | required | Text to synthesize |
| `emo_control_method` | string | "Same as reference" | Emotion control method |
| `emo_weight` | float | 0.8 | Emotion influence (0-1) |
| `temperature` | float | 0.8 | Randomness (higher = more varied) |
| `top_p` | float | 0.8 | Nucleus sampling |
| `top_k` | int | 30 | Top-k sampling |
| `max_mel_tokens` | int | 1500 | Max output length |

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────────┐
│                    VOICE CLONING CHEAT SHEET                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  RECORD VOICE:                                                      │
│    • 5-30 seconds of natural speech                                 │
│    • Quiet room, clear audio, WAV format                            │
│    • Save to: public/assets/voices/your-voice.wav                   │
│                                                                     │
│  CLONE VOICE:                                                       │
│    python scripts/test-indextts2.py                                 │
│                                                                     │
│  KEY CODE:                                                          │
│    from gradio_client import Client, handle_file                    │
│    client = Client("IndexTeam/IndexTTS-2-Demo")                     │
│    result = client.predict(                                         │
│        prompt=handle_file("your-voice.wav"),                        │
│        text="Text to speak",                                        │
│        ...                                                          │
│    )                                                                │
│    audio_path = result.get("value")  # Dict response!               │
│                                                                     │
│  LIMITS: ~60 sec free GPU/day, falls back to OpenAI TTS             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

*Last updated: January 2, 2026*
