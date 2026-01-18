#!/usr/bin/env npx tsx
/**
 * Audio Generation Script
 * 
 * Integrates:
 * - ElevenLabs Sound Effects (free tier available)
 * - Hugging Face IndexTTS2 (voice cloning with emotions)
 * - Freesound (CC sound effects)
 * 
 * Usage:
 *   npx tsx scripts/generate-audio.ts --sfx "whoosh" --provider elevenlabs
 *   npx tsx scripts/generate-audio.ts --tts "Hello world" --voice ./voices/isaiah.wav
 *   npx tsx scripts/generate-audio.ts --resolve briefs/my_brief.json
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

// =============================================================================
// Types
// =============================================================================

interface AudioAsset {
  id: string;
  provider: string;
  type: 'sfx' | 'voiceover' | 'music';
  local_path: string;
  duration_sec?: number;
  text?: string;
  emotion?: string;
}

interface TTSConfig {
  text: string;
  voice_reference: string;
  emotion_method?: 'Same as the voice reference' | 'Use emotion vectors' | 'Neutral';
  emotions?: {
    happy?: number;
    sad?: number;
    angry?: number;
    surprised?: number;
    fearful?: number;
    disgusted?: number;
    calm?: number;
  };
  output_path: string;
}

interface SFXConfig {
  prompt: string;
  duration_sec?: number;
  output_path: string;
}

// =============================================================================
// Config
// =============================================================================

const ASSETS_DIR = path.join(process.cwd(), 'public', 'assets');
const AUDIO_DIR = path.join(ASSETS_DIR, 'audio');
const VOICES_DIR = path.join(ASSETS_DIR, 'voices');

const API_KEYS = {
  elevenlabs: process.env.ELEVENLABS_API_KEY || '',
  huggingface: process.env.HF_TOKEN || '',
};

// =============================================================================
// HTTP Helpers
// =============================================================================

function fetchJSON(url: string, options: {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
} = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    
    const reqOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'VideoStudio/1.0',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = protocol.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data); // Return raw if not JSON
        }
      });
    });

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

function downloadAudio(url: string, destPath: string, headers: Record<string, string> = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const file = fs.createWriteStream(destPath);
    
    const request = (urlToFetch: string) => {
      const parsed = new URL(urlToFetch);
      const proto = parsed.protocol === 'https:' ? https : http;
      
      proto.get(urlToFetch, { headers: { 'User-Agent': 'VideoStudio/1.0', ...headers } }, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            request(redirectUrl);
            return;
          }
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Download failed: ${response.statusCode}`));
          return;
        }

        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    };

    request(url);
  });
}

// =============================================================================
// ElevenLabs Sound Effects API
// =============================================================================

async function generateElevenLabsSFX(config: SFXConfig): Promise<AudioAsset | null> {
  if (!API_KEYS.elevenlabs) {
    console.log('  ⚠ ElevenLabs API key not set (ELEVENLABS_API_KEY)');
    console.log('  → Get free API key at: https://elevenlabs.io');
    return null;
  }

  console.log(`  🔊 Generating SFX: "${config.prompt}"`);

  try {
    // ElevenLabs Sound Effects API endpoint
    const response = await new Promise<{ audio_url?: string; error?: string }>((resolve, reject) => {
      const postData = JSON.stringify({
        text: config.prompt,
        duration_seconds: config.duration_sec || 2,
      });

      const options = {
        hostname: 'api.elevenlabs.io',
        path: '/v1/sound-generation',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': API_KEYS.elevenlabs,
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        // For audio response, save directly
        if (res.headers['content-type']?.includes('audio')) {
          const dir = path.dirname(config.output_path);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          
          const file = fs.createWriteStream(config.output_path);
          res.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve({ audio_url: config.output_path });
          });
        } else {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch {
              reject(new Error(data));
            }
          });
        }
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    if (response.error) {
      console.log(`  ✗ ElevenLabs error: ${response.error}`);
      return null;
    }

    console.log(`  ✓ SFX saved: ${config.output_path}`);

    return {
      id: `elevenlabs_sfx_${Date.now()}`,
      provider: 'elevenlabs',
      type: 'sfx',
      local_path: config.output_path,
      duration_sec: config.duration_sec,
    };
  } catch (err) {
    console.log(`  ✗ ElevenLabs SFX generation failed: ${err}`);
    return null;
  }
}

// =============================================================================
// OpenAI TTS API
// =============================================================================

async function generateOpenAITTS(config: TTSConfig): Promise<AudioAsset | null> {
  const openaiKey = process.env.OPENAI_API_KEY || '';
  if (!openaiKey) {
    console.log('  ⚠ OpenAI API key not set');
    return null;
  }

  console.log(`  🎙 Generating TTS: "${config.text.substring(0, 50)}..."`);
  
  // OpenAI voices: alloy, echo, fable, onyx, nova, shimmer
  const voice = 'onyx'; // Deep male voice, good for explainers
  console.log(`    Using voice: ${voice} (OpenAI)`);

  try {
    const result = await new Promise<boolean>((resolve, reject) => {
      const postData = JSON.stringify({
        model: 'tts-1',
        input: config.text,
        voice: voice,
        response_format: 'mp3'
      });

      const options = {
        hostname: 'api.openai.com',
        path: '/v1/audio/speech',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        if (res.statusCode !== 200) {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            console.log(`  ✗ OpenAI TTS error: ${res.statusCode} - ${data.substring(0, 200)}`);
            resolve(false);
          });
          return;
        }

        const dir = path.dirname(config.output_path);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        const file = fs.createWriteStream(config.output_path);
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(true);
        });
      });

      req.on('error', (err) => {
        console.log(`  ✗ Request error: ${err}`);
        resolve(false);
      });
      req.write(postData);
      req.end();
    });

    if (result && fs.existsSync(config.output_path)) {
      console.log(`  ✓ TTS saved: ${config.output_path}`);
      return {
        id: `openai_tts_${Date.now()}`,
        provider: 'openai',
        type: 'voiceover',
        local_path: config.output_path,
        text: config.text,
      };
    }
    return null;
  } catch (err: any) {
    console.log(`  ✗ OpenAI TTS failed: ${err.message || err}`);
    return null;
  }
}

// =============================================================================
// IndexTTS2 Python API Wrapper
// =============================================================================

async function ensureIndexTTS2Script(): Promise<void> {
  const scriptPath = path.join(process.cwd(), 'scripts', 'call_indextts2_api.py');
  
  if (fs.existsSync(scriptPath)) {
    return;
  }

  console.log('  📝 Creating IndexTTS2 API script...');

  const pythonScript = `#!/usr/bin/env python3
"""
IndexTTS2 Hugging Face API Client
Voice cloning with emotion control
"""

import argparse
import os
import sys

def main():
    parser = argparse.ArgumentParser(description='IndexTTS2 Voice Cloning')
    parser.add_argument('--voice', required=True, help='Path to voice reference audio')
    parser.add_argument('--text', required=True, help='Text to synthesize')
    parser.add_argument('--output', required=True, help='Output audio path')
    parser.add_argument('--emotion-method', default='Same as the voice reference',
                       help='Emotion control method')
    parser.add_argument('--happy', type=float, default=0.0)
    parser.add_argument('--sad', type=float, default=0.0)
    parser.add_argument('--angry', type=float, default=0.0)
    parser.add_argument('--calm', type=float, default=0.0)
    parser.add_argument('--surprised', type=float, default=0.0)
    parser.add_argument('--fearful', type=float, default=0.0)
    parser.add_argument('--disgusted', type=float, default=0.0)
    
    args = parser.parse_args()
    
    try:
        from gradio_client import Client, handle_file
    except ImportError:
        print("Installing gradio_client...")
        os.system(f"{sys.executable} -m pip install gradio_client -q")
        from gradio_client import Client, handle_file
    
    hf_token = os.environ.get('HF_TOKEN', '')
    
    print(f"Connecting to IndexTTS2 API...")
    client = Client("Tonic/IndexTTS2", hf_token=hf_token if hf_token else None)
    
    # Build emotion vector if using emotion control
    emotion_values = [
        args.happy, args.sad, args.angry, args.surprised,
        args.fearful, args.disgusted, args.calm
    ]
    
    print(f"Generating speech...")
    result = client.predict(
        prompt=args.voice,
        text=args.text,
        emotion_control_method=args.emotion_method,
        happy=args.happy,
        sad=args.sad,
        angry=args.angry,
        surprised=args.surprised,
        fearful=args.fearful,
        disgusted=args.disgusted,
        calm=args.calm,
        api_name="/generate_speech"
    )
    
    # Result is path to generated audio
    if result and os.path.exists(result):
        import shutil
        os.makedirs(os.path.dirname(args.output), exist_ok=True)
        shutil.copy(result, args.output)
        print(f"✓ Saved to {args.output}")
    else:
        print(f"✗ Generation failed")
        sys.exit(1)

if __name__ == '__main__':
    main()
`;

  fs.writeFileSync(scriptPath, pythonScript);
  fs.chmodSync(scriptPath, '755');
  console.log(`  ✓ Created: ${scriptPath}`);
}

// =============================================================================
// Brief Resolver (Audio)
// =============================================================================

interface BriefSection {
  id: string;
  content?: {
    body_text?: string;
    hook_text?: string;
    title?: string;
  };
  audio?: {
    voiceover?: {
      text?: string;
      emotion?: string;
    };
    sfx?: {
      prompts: string[];
    };
  };
}

interface Brief {
  sections: BriefSection[];
  audio_settings?: {
    voice_reference?: string;
    default_emotion?: string;
  };
}

async function resolveBriefAudio(briefPath: string, voiceRef?: string): Promise<void> {
  console.log(`\n🎵 Resolving audio for brief: ${briefPath}`);
  
  await ensureIndexTTS2Script();
  
  const brief: Brief = JSON.parse(fs.readFileSync(briefPath, 'utf-8'));
  const resolvedAudio: Record<string, AudioAsset[]> = {};

  const voiceReference = voiceRef || brief.audio_settings?.voice_reference || 
    path.join(VOICES_DIR, 'default.wav');

  for (const section of brief.sections) {
    resolvedAudio[section.id] = [];

    // Generate voiceover if text exists
    const voText = section.audio?.voiceover?.text || 
                   section.content?.body_text || 
                   section.content?.hook_text;

    if (voText) {
      console.log(`\n[${section.id}] Generating voiceover...`);
      
      const outputPath = path.join(AUDIO_DIR, 'voiceover', `${section.id}_vo.wav`);
      const asset = await generateOpenAITTS({
        text: voText,
        voice_reference: voiceReference,
        emotion_method: section.audio?.voiceover?.emotion as any || 'Same as the voice reference',
        output_path: outputPath,
      });

      if (asset) {
        resolvedAudio[section.id].push(asset);
      }
    }

    // Generate SFX
    if (section.audio?.sfx?.prompts) {
      console.log(`\n[${section.id}] Generating SFX...`);
      
      for (let i = 0; i < section.audio.sfx.prompts.length; i++) {
        const prompt = section.audio.sfx.prompts[i];
        const outputPath = path.join(AUDIO_DIR, 'sfx', `${section.id}_sfx_${i}.mp3`);
        
        const asset = await generateElevenLabsSFX({
          prompt,
          duration_sec: 2,
          output_path: outputPath,
        });

        if (asset) {
          resolvedAudio[section.id].push(asset);
        }
      }
    }
  }

  // Save resolved audio manifest
  const resolvedPath = briefPath.replace('.json', '.audio.json');
  fs.writeFileSync(resolvedPath, JSON.stringify(resolvedAudio, null, 2));
  console.log(`\n✓ Audio manifest saved: ${resolvedPath}`);
}

// =============================================================================
// CLI
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.length === 0) {
    console.log(`
Audio Generation for VideoStudio

Usage:
  # Generate sound effect with ElevenLabs
  npx tsx scripts/generate-audio.ts --sfx "epic whoosh" --output sfx.mp3

  # Generate voiceover with Hugging Face TTS
  npx tsx scripts/generate-audio.ts --tts "Hello world" --voice voices/isaiah.wav --output vo.wav

  # Resolve all audio in a brief
  npx tsx scripts/generate-audio.ts --resolve briefs/my_brief.json --voice voices/isaiah.wav

Options:
  --sfx         Sound effect prompt (uses ElevenLabs)
  --tts         Text to synthesize (uses Hugging Face IndexTTS2)
  --voice       Path to voice reference WAV file
  --output      Output file path
  --emotion     Emotion method: neutral, happy, sad, angry, calm
  --resolve     Resolve all audio slots in a brief JSON file

Environment Variables:
  ELEVENLABS_API_KEY  - API key for ElevenLabs (get free at elevenlabs.io)
  HF_TOKEN            - Hugging Face token (optional, for private models)
`);
    return;
  }

  // Ensure directories exist
  [AUDIO_DIR, path.join(AUDIO_DIR, 'sfx'), path.join(AUDIO_DIR, 'voiceover'), VOICES_DIR]
    .forEach(dir => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); });

  // Resolve brief mode
  const resolveIdx = args.indexOf('--resolve');
  if (resolveIdx !== -1) {
    const briefPath = args[resolveIdx + 1];
    const voiceIdx = args.indexOf('--voice');
    const voiceRef = voiceIdx !== -1 ? args[voiceIdx + 1] : undefined;
    
    if (!briefPath) {
      console.error('Error: --resolve requires a brief path');
      process.exit(1);
    }
    
    await resolveBriefAudio(briefPath, voiceRef);
    return;
  }

  // SFX generation mode
  const sfxIdx = args.indexOf('--sfx');
  if (sfxIdx !== -1) {
    const prompt = args[sfxIdx + 1];
    const outputIdx = args.indexOf('--output');
    const output = outputIdx !== -1 ? args[outputIdx + 1] : path.join(AUDIO_DIR, 'sfx', `sfx_${Date.now()}.mp3`);

    await generateElevenLabsSFX({ prompt, output_path: output });
    return;
  }

  // TTS generation mode
  const ttsIdx = args.indexOf('--tts');
  if (ttsIdx !== -1) {
    const text = args[ttsIdx + 1];
    const voiceIdx = args.indexOf('--voice');
    const outputIdx = args.indexOf('--output');
    const emotionIdx = args.indexOf('--emotion');

    const voice = voiceIdx !== -1 ? args[voiceIdx + 1] : path.join(VOICES_DIR, 'default.wav');
    const output = outputIdx !== -1 ? args[outputIdx + 1] : path.join(AUDIO_DIR, 'voiceover', `vo_${Date.now()}.wav`);
    const emotion = emotionIdx !== -1 ? args[emotionIdx + 1] : 'Same as the voice reference';

    await generateOpenAITTS({
      text,
      voice_reference: voice,
      emotion_method: emotion as any,
      output_path: output,
    });
    return;
  }

  console.error('Error: Specify --sfx, --tts, or --resolve');
  process.exit(1);
}

main().catch(console.error);
