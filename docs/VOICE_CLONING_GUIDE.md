# Voice Cloning Guide - IndexTTS-2

This document captures our findings on using Hugging Face voice cloning for Remotion video generation.

## Working Solution: IndexTTS-2

**Space:** [IndexTeam/IndexTTS-2-Demo](https://huggingface.co/spaces/IndexTeam/IndexTTS-2-Demo)

### Key Requirements

1. **Use `handle_file()` for audio uploads** - This is critical!
2. **Handle dict response format** - The API returns `{"value": "/path/to/audio.wav"}`
3. **Voice reference quality matters** - Clean, clear audio works best

### Working Python Code

```python
from gradio_client import Client, handle_file
import shutil
import os

def clone_voice(voice_reference_path: str, text: str, output_path: str):
    """
    Clone a voice using IndexTTS-2
    
    Args:
        voice_reference_path: Path to the voice reference audio (WAV)
        text: Text to synthesize
        output_path: Where to save the generated audio
    """
    client = Client("IndexTeam/IndexTTS-2-Demo")
    
    result = client.predict(
        emo_control_method="Same as the voice reference",
        prompt=handle_file(voice_reference_path),  # MUST use handle_file()
        text=text,
        emo_ref_path=handle_file(voice_reference_path),
        emo_weight=0.8,
        vec1=0,  # Happy
        vec2=0,  # Angry
        vec3=0,  # Sad
        vec4=0,  # Afraid
        vec5=0,  # Disgusted
        vec6=0,  # Melancholic
        vec7=0,  # Surprised
        vec8=0,  # Calm
        emo_text="",
        emo_random=False,
        max_text_tokens_per_segment=120,
        param_16=True,   # do_sample
        param_17=0.8,    # top_p
        param_18=30,     # top_k
        param_19=0.8,    # temperature
        param_20=0,      # length_penalty
        param_21=3,      # num_beams
        param_22=10,     # repetition_penalty
        param_23=1500,   # max_mel_tokens
        api_name="/gen_single"
    )
    
    # Handle dict response format
    if isinstance(result, dict):
        audio_path = result.get("value")
    else:
        audio_path = result
    
    # Copy to output path
    if audio_path and os.path.exists(audio_path):
        shutil.copy(audio_path, output_path)
        return output_path
    
    return None
```

### Emotion Control Methods

IndexTTS-2 supports three emotion control methods:

1. **"Same as the voice reference"** - Uses emotion from the reference audio
2. **"Use emotion reference audio"** - Separate audio file for emotion
3. **"Use emotion vectors"** - Manual emotion sliders (happy, angry, sad, etc.)

### Emotion Vectors (0-1 scale)

| Parameter | Emotion |
|-----------|---------|
| vec1 | Happy |
| vec2 | Angry |
| vec3 | Sad |
| vec4 | Afraid |
| vec5 | Disgusted |
| vec6 | Melancholic |
| vec7 | Surprised |
| vec8 | Calm |

## Limitations

### Free GPU Quota
- Hugging Face free tier has a **~60 seconds/day** GPU limit
- After quota is exceeded, requests fail with: `"You have exceeded your free GPU quota"`
- Quota resets approximately every 24 hours

### Fallback Strategy
When IndexTTS-2 quota is exhausted, we fall back to OpenAI TTS:

```python
import urllib.request
import json

def generate_openai_tts(text: str, output_path: str, voice: str = "onyx"):
    """Fallback to OpenAI TTS when HuggingFace quota is exceeded"""
    api_key = os.environ.get('OPENAI_API_KEY')
    
    data = json.dumps({
        'model': 'tts-1-hd',
        'input': text,
        'voice': voice,  # alloy, echo, fable, onyx, nova, shimmer
        'response_format': 'wav'
    }).encode('utf-8')
    
    req = urllib.request.Request(
        'https://api.openai.com/v1/audio/speech',
        data=data,
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    )
    
    with urllib.request.urlopen(req) as response:
        with open(output_path, 'wb') as f:
            f.write(response.read())
```

## Word-Level Timestamps with OpenAI Whisper

For syncing captions to audio, use OpenAI Whisper API:

```python
import http.client
import json
import uuid

def get_word_timestamps(audio_path: str, api_key: str) -> dict:
    """Get word-level timestamps using OpenAI Whisper API"""
    
    with open(audio_path, 'rb') as f:
        audio_data = f.read()
    
    boundary = uuid.uuid4().hex
    
    body = b''
    body += f'--{boundary}\r\n'.encode()
    body += b'Content-Disposition: form-data; name="file"; filename="audio.wav"\r\n'
    body += b'Content-Type: audio/wav\r\n\r\n'
    body += audio_data
    body += b'\r\n'
    body += f'--{boundary}\r\n'.encode()
    body += b'Content-Disposition: form-data; name="model"\r\n\r\n'
    body += b'whisper-1'
    body += b'\r\n'
    body += f'--{boundary}\r\n'.encode()
    body += b'Content-Disposition: form-data; name="response_format"\r\n\r\n'
    body += b'verbose_json'
    body += b'\r\n'
    body += f'--{boundary}\r\n'.encode()
    body += b'Content-Disposition: form-data; name="timestamp_granularities[]"\r\n\r\n'
    body += b'word'
    body += b'\r\n'
    body += f'--{boundary}--\r\n'.encode()
    
    conn = http.client.HTTPSConnection("api.openai.com")
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': f'multipart/form-data; boundary={boundary}'
    }
    
    conn.request("POST", "/v1/audio/transcriptions", body, headers)
    response = conn.getresponse()
    result = json.loads(response.read().decode())
    conn.close()
    
    return result  # Contains 'words' array with start/end times
```

## Failed/Unreliable Spaces

These Hugging Face spaces were tested but failed:

| Space | Error |
|-------|-------|
| Tonic/IndexTTS2 | Space no longer available |
| mrfakename/E2-F5-TTS | Server exceptions |
| Aimoxyz/mars5-tts-voice-cloning | Server exceptions |
| coqui/xtts | Runtime error |
| tonyassi/voice-clone | Server exceptions |
| TotoZip/VibeVoiceCloning | Runtime error |
| rahul7star/Clone-Voice | Runtime error |
| fosters/xttsv2 | API fetch error |
| Gapeleon/Mira-TTS | Wrong API parameters |

## Project Files

| File | Purpose |
|------|---------|
| `scripts/test-indextts2.py` | Test script for IndexTTS-2 voice cloning |
| `scripts/generate-aircraft-voiceovers.py` | Generate all voiceovers for a video |
| `scripts/generate-word-timestamps.py` | Generate word-level timestamps for syncing |
| `public/assets/voices/isaiah.wav` | Working voice reference |
| `public/assets/audio/voiceover/aircraft/timestamps.json` | Word timestamps for all sections |

## Workflow Summary

1. **Extract voice reference** from source video using ffmpeg:
   ```bash
   ffmpeg -i source_video.mp4 -vn -acodec pcm_s16le -ar 44100 voice_ref.wav
   ```

2. **Generate voiceovers** using IndexTTS-2 (with OpenAI fallback)

3. **Get word timestamps** using OpenAI Whisper

4. **Update Remotion composition** with actual audio durations

5. **Render video** with synced audio and captions

## Environment Variables Required

```bash
# .env.local
HF_TOKEN=your_huggingface_token
OPENAI_API_KEY=your_openai_key
```

---

*Last updated: January 2, 2026*
*Based on findings from Aircraft Wings video project*
