#!/usr/bin/env npx tsx
/**
 * Generate talking avatar video using LongCat-Video-Avatar on Modal
 * 
 * Usage:
 *   npx tsx scripts/generate-avatar-modal.ts --audio voice.wav --prompt "Professional presenter" --output avatar.mp4
 *   npx tsx scripts/generate-avatar-modal.ts --help
 * 
 * Full pipeline (voice clone → avatar):
 *   npx tsx scripts/generate-avatar-modal.ts --text "Hello world" --voice-ref isaiah.wav --output avatar.mp4
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

// Modal endpoints
const AVATAR_ENDPOINT = process.env.MODAL_AVATAR_ENDPOINT || 
  'isaiahdupree33--avatar-generation-api-generate.modal.run';

const VOICE_CLONE_ENDPOINT = process.env.MODAL_VOICE_CLONE_ENDPOINT || 
  'isaiahdupree33--voice-clone-indextts2-api-clone-voice.modal.run';

interface AvatarOptions {
  audioPath?: string;
  audioBase64?: string;
  prompt: string;
  referenceImagePath?: string;
  resolution?: '480P' | '720P';
  audioCfg?: number;
  outputPath: string;
}

interface VoiceCloneOptions {
  text: string;
  voiceRefPath: string;
}

interface AvatarResponse {
  video: string;  // base64
  duration_seconds: number;
  generation_time_seconds: number;
  resolution: string;
  error?: string;
}

interface VoiceCloneResponse {
  audio: string;  // base64
  error?: string;
}

async function cloneVoice(options: VoiceCloneOptions): Promise<string | null> {
  const voiceRefBytes = fs.readFileSync(options.voiceRefPath);
  
  const body = JSON.stringify({
    voice_ref: voiceRefBytes.toString('base64'),
    text: options.text,
    emotion_method: 'Same as the voice reference',
    emotion_weight: 0.8,
  });

  console.log(`\n🎙️ Cloning voice with IndexTTS...`);
  console.log(`   Voice reference: ${options.voiceRefPath}`);
  console.log(`   Text: "${options.text.substring(0, 50)}..."`);

  return new Promise((resolve) => {
    const req = https.request({
      hostname: VOICE_CLONE_ENDPOINT,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 300000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response: VoiceCloneResponse = JSON.parse(data);
          if (response.error) {
            console.error(`❌ Voice clone error: ${response.error}`);
            resolve(null);
            return;
          }
          console.log(`✅ Voice cloned successfully`);
          resolve(response.audio);
        } catch (e) {
          console.error(`❌ Parse error: ${e}`);
          resolve(null);
        }
      });
    });
    
    req.on('error', (err) => {
      console.error(`❌ Voice clone request error: ${err.message}`);
      resolve(null);
    });
    
    req.write(body);
    req.end();
  });
}

async function generateAvatar(options: AvatarOptions): Promise<AvatarResponse | null> {
  let audioBase64 = options.audioBase64;
  
  if (!audioBase64 && options.audioPath) {
    const audioBytes = fs.readFileSync(options.audioPath);
    audioBase64 = audioBytes.toString('base64');
  }
  
  if (!audioBase64) {
    console.error('❌ No audio provided');
    return null;
  }

  const body: any = {
    audio: audioBase64,
    prompt: options.prompt,
    resolution: options.resolution || '480P',
    audio_cfg: options.audioCfg || 4.0,
    num_inference_steps: 50,
  };

  if (options.referenceImagePath) {
    const imageBytes = fs.readFileSync(options.referenceImagePath);
    body.reference_image = imageBytes.toString('base64');
  }

  console.log(`\n🎭 Generating talking avatar with LongCat...`);
  console.log(`   Prompt: "${options.prompt.substring(0, 50)}..."`);
  console.log(`   Resolution: ${body.resolution}`);
  console.log(`   Reference image: ${options.referenceImagePath || 'None (generating)'}`);
  console.log(`   Endpoint: ${AVATAR_ENDPOINT}`);
  console.log(`\n⏳ This may take 2-5 minutes (includes cold start)...\n`);

  const bodyStr = JSON.stringify(body);

  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const req = https.request({
      hostname: AVATAR_ENDPOINT,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
      },
      timeout: 1800000,  // 30 minute timeout
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        
        try {
          const response: AvatarResponse = JSON.parse(data);
          
          if (response.error) {
            console.error(`❌ Error: ${response.error}`);
            resolve(null);
            return;
          }
          
          // Save video
          const videoBuffer = Buffer.from(response.video, 'base64');
          const dir = path.dirname(options.outputPath);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(options.outputPath, videoBuffer);
          
          console.log(`✅ Avatar video saved: ${options.outputPath}`);
          console.log(`   Duration: ${response.duration_seconds.toFixed(1)}s`);
          console.log(`   Size: ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`);
          console.log(`   Generation time: ${response.generation_time_seconds.toFixed(1)}s`);
          console.log(`   Total time: ${elapsed}s`);
          
          resolve(response);
        } catch (e) {
          console.error(`❌ Parse error: ${e}`);
          console.error(`   Response: ${data.substring(0, 200)}`);
          resolve(null);
        }
      });
    });
    
    req.on('error', (err) => {
      console.error(`❌ Request error: ${err.message}`);
      resolve(null);
    });
    
    req.on('timeout', () => {
      console.error('❌ Request timed out');
      req.destroy();
      resolve(null);
    });
    
    req.write(bodyStr);
    req.end();
  });
}

function printUsage() {
  console.log(`
LongCat Talking Avatar Generation on Modal

Usage:
  # Generate avatar from existing audio
  npx tsx scripts/generate-avatar-modal.ts \\
    --audio path/to/voice.wav \\
    --prompt "Professional presenter in a studio" \\
    --output avatar.mp4

  # Generate avatar from text (uses voice cloning first)
  npx tsx scripts/generate-avatar-modal.ts \\
    --text "Hello, welcome to our product demo!" \\
    --voice-ref public/assets/voices/isaiah.wav \\
    --prompt "Tech entrepreneur presenting" \\
    --output avatar.mp4

  # Generate avatar with reference image
  npx tsx scripts/generate-avatar-modal.ts \\
    --audio voice.wav \\
    --image reference.png \\
    --prompt "Professional speaker" \\
    --output avatar.mp4

Options:
  --audio, -a       Path to audio file (WAV/MP3)
  --text, -t        Text to speak (requires --voice-ref)
  --voice-ref, -v   Voice reference for cloning
  --image, -i       Reference image for avatar appearance (optional)
  --prompt, -p      Text prompt describing avatar/scene
  --output, -o      Output video path (default: output_avatar.mp4)
  --resolution, -r  480P or 720P (default: 480P)
  --audio-cfg       Audio guidance scale 3-5 (default: 4.0)
  --help            Show this help

Pipeline Modes:
  1. Audio → Avatar:     Provide --audio
  2. Text → Voice → Avatar: Provide --text + --voice-ref
  3. With Reference:     Add --image for consistent appearance

Note: First request after idle takes 2-5 minutes for cold start.
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.length === 0) {
    printUsage();
    return;
  }

  // Parse arguments
  const audioIdx = args.findIndex(a => a === '--audio' || a === '-a');
  const textIdx = args.findIndex(a => a === '--text' || a === '-t');
  const voiceRefIdx = args.findIndex(a => a === '--voice-ref' || a === '-v');
  const imageIdx = args.findIndex(a => a === '--image' || a === '-i');
  const promptIdx = args.findIndex(a => a === '--prompt' || a === '-p');
  const outputIdx = args.findIndex(a => a === '--output' || a === '-o');
  const resolutionIdx = args.findIndex(a => a === '--resolution' || a === '-r');
  const audioCfgIdx = args.findIndex(a => a === '--audio-cfg');

  const audioPath = audioIdx !== -1 ? args[audioIdx + 1] : undefined;
  const text = textIdx !== -1 ? args[textIdx + 1] : undefined;
  const voiceRefPath = voiceRefIdx !== -1 ? args[voiceRefIdx + 1] : undefined;
  const imagePath = imageIdx !== -1 ? args[imageIdx + 1] : undefined;
  const prompt = promptIdx !== -1 ? args[promptIdx + 1] : 'A professional presenter speaking naturally';
  const outputPath = outputIdx !== -1 ? args[outputIdx + 1] : 'output_avatar.mp4';
  const resolution = resolutionIdx !== -1 ? args[resolutionIdx + 1] as '480P' | '720P' : '480P';
  const audioCfg = audioCfgIdx !== -1 ? parseFloat(args[audioCfgIdx + 1]) : 4.0;

  let audioBase64: string | undefined;

  // Mode 1: Direct audio file
  if (audioPath) {
    console.log(`📁 Using audio file: ${audioPath}`);
  }
  // Mode 2: Text → Voice Clone → Avatar
  else if (text && voiceRefPath) {
    console.log(`📝 Full pipeline: Text → Voice Clone → Avatar`);
    
    const clonedAudio = await cloneVoice({
      text,
      voiceRefPath,
    });
    
    if (!clonedAudio) {
      console.error('❌ Voice cloning failed');
      process.exit(1);
    }
    
    audioBase64 = clonedAudio;
  }
  else {
    console.error('❌ Either --audio or (--text + --voice-ref) is required');
    process.exit(1);
  }

  // Generate avatar
  await generateAvatar({
    audioPath,
    audioBase64,
    prompt,
    referenceImagePath: imagePath,
    resolution,
    audioCfg,
    outputPath,
  });
}

main().catch(console.error);
