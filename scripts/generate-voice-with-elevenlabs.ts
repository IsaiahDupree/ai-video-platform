#!/usr/bin/env npx tsx
/**
 * Generate voice reference using ElevenLabs, then use it to train IndexTTS on Modal
 * 
 * Workflow:
 * 1. Generate high-quality audio with ElevenLabs TTS
 * 2. Use that audio as voice reference for IndexTTS on Modal
 * 3. Generate new speech with the cloned voice
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { execSync } from 'child_process';

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && !key.startsWith('#')) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'assets', 'voices');

// ElevenLabs voices - https://api.elevenlabs.io/v1/voices
const ELEVENLABS_VOICES = {
  // Premade voices
  'adam': '29vD33N1CtxCmqQRPOHJ',      // Deep male
  'antoni': 'ErXwobaYiN019PkySvjV',     // Well-rounded male
  'arnold': 'VR6AewLTigWG4xSOukaG',    // Crisp male
  'bella': 'EXAVITQu4vr4xnSDxMaL',      // Soft female
  'callum': 'N2lVS1w4EtoT3dr4eOWO',    // Hoarse male
  'charlie': 'IKne3meq5aSn9XLyUdCD',   // Casual male
  'charlotte': 'XB0fDUnXU5powFXDhCwa', // Seductive female
  'clyde': '2EiwWnXFnvU5JabPnv8n',     // War veteran male
  'daniel': 'onwK4e9ZLuTAKqWW03F9',    // Deep news male
  'dave': 'CYw3kZ02Hs0563khs1Fj',      // Conversational male
  'domi': 'AZnzlk1XvdvUeBnXmlld',      // Strong female
  'dorothy': 'ThT5KcBeYPX3keUQqHPh',   // Pleasant female
  'drew': 'SOYHLrjzK2X1ezoPC6cr',      // Well-rounded male
  'emily': 'LcfcDJNUP1GQjkzn1xUU',     // Calm female
  'ethan': 'g5CIjZEefAph4nQFvHAz',     // Narrator male
  'fin': 'D38z5RcWu1voky8WS1ja',       // Sailor male
  'freya': 'jsCqWAovK2LkecY7zXl4',     // Overly dramatic female
  'gigi': 'jBpfuIE2acCO8z3wKNLl',      // Childlish female
  'giovanni': 'zcAOhNBS3c14rBihAFp1',  // Italian male
  'glinda': 'z9fAnlkpzviPz146aGWa',    // Witch female
  'grace': 'oWAxZDx7w5VEj9dCyTzz',     // Southern female
  'harry': 'SOYHLrjzK2X1ezoPC6cr',     // Anxious male
  'james': 'ZQe5CZNOzWyzPSCn5a3c',     // Calm male
  'jeremy': 'bVMeCyTHy58xNoL34h3p',    // Excited male
  'jessie': 't0jbNlBVZ17f02VDIeMI',    // Raspy male
  'joseph': 'Zlb1dXrM653N07WRdFW3',    // British male
  'josh': 'TxGEqnHWrfWFTfGW9XjX',      // Deep male
  'liam': 'TX3LPaxmHKxFdv7VOQHJ',      // Articulate male
  'matilda': 'XrExE9yKIg1WjnnlVkGX',   // Warm female
  'matthew': 'Yko7PKHZNXotIFUBG7I9',   // Audiobook male
  'michael': 'flq6f7yk4E4fJM5XTYuZ',   // Informative male
  'mimi': 'zrHiDhphv9ZnVXBqCLjz',      // Childish female
  'nicole': 'piTKgcLEGmPE4e6mEKli',    // Whisper female
  'patrick': 'ODq5zmih8GrVes37Dizd',   // Shouty male
  'rachel': '21m00Tcm4TlvDq8ikWAM',    // Calm female
  'ryan': 'wViXBPUzp2ZZixB1xQuM',      // Soldier male
  'sam': 'yoZ06aMxZJJ28mfd3POQ',       // Raspy male
  'serena': 'pMsXgVXv3BLzUgSXRplE',    // Pleasant female
  'thomas': 'GBv7mTt0atIp3Br8iCZE',    // Calm male
};

interface ElevenLabsConfig {
  text: string;
  voiceId: string;
  outputPath: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

async function generateElevenLabsTTS(config: ElevenLabsConfig): Promise<boolean> {
  if (!ELEVENLABS_API_KEY) {
    console.error('❌ ELEVENLABS_API_KEY not set in .env.local');
    return false;
  }

  console.log(`🎙️ Generating ElevenLabs TTS...`);
  console.log(`   Voice ID: ${config.voiceId}`);
  console.log(`   Text: "${config.text.substring(0, 60)}..."`);

  return new Promise((resolve) => {
    const postData = JSON.stringify({
      text: config.text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: config.stability ?? 0.5,
        similarity_boost: config.similarityBoost ?? 0.75,
        style: config.style ?? 0.5,
        use_speaker_boost: config.useSpeakerBoost ?? true,
      },
    });

    const options = {
      hostname: 'api.elevenlabs.io',
      path: `/v1/text-to-speech/${config.voiceId}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
        'Accept': 'audio/mpeg',
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.error(`❌ ElevenLabs error: ${res.statusCode} - ${data}`);
          resolve(false);
        });
        return;
      }

      const dir = path.dirname(config.outputPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const file = fs.createWriteStream(config.outputPath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        const stats = fs.statSync(config.outputPath);
        console.log(`✅ Saved: ${config.outputPath} (${(stats.size / 1024).toFixed(1)} KB)`);
        resolve(true);
      });
    });

    req.on('error', (err) => {
      console.error(`❌ Request error: ${err.message}`);
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

async function listElevenLabsVoices(): Promise<void> {
  if (!ELEVENLABS_API_KEY) {
    console.error('❌ ELEVENLABS_API_KEY not set');
    return;
  }

  return new Promise((resolve) => {
    https.get({
      hostname: 'api.elevenlabs.io',
      path: '/v1/voices',
      headers: { 'xi-api-key': ELEVENLABS_API_KEY },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const voices = JSON.parse(data);
        console.log('\n📋 Available ElevenLabs Voices:\n');
        voices.voices?.forEach((v: any) => {
          console.log(`  ${v.name.padEnd(20)} ${v.voice_id}  ${v.labels?.accent || ''}`);
        });
        resolve();
      });
    });
  });
}

async function callModalVoiceClone(voiceRefPath: string, text: string): Promise<Buffer | null> {
  const voiceRefBytes = fs.readFileSync(voiceRefPath);
  
  const body = JSON.stringify({
    voice_ref: voiceRefBytes.toString('base64'),
    text: text,
    emotion_method: 'Same as the voice reference',
    emotion_weight: 0.8,
  });

  const modalEndpoint = process.env.MODAL_VOICE_CLONE_ENDPOINT || 
    'isaiahdupree33--voice-clone-indextts2-api-clone-voice.modal.run';

  console.log(`🔄 Calling Modal IndexTTS...`);
  console.log(`   Voice ref: ${voiceRefPath}`);
  console.log(`   Text: "${text.substring(0, 60)}..."`);

  return new Promise((resolve) => {
    const req = https.request({
      hostname: modalEndpoint,
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
        try {
          const response = JSON.parse(data);
          if (response.error) {
            console.error(`❌ Modal error: ${response.error}`);
            resolve(null);
            return;
          }
          const audioBuffer = Buffer.from(response.audio, 'base64');
          console.log(`✅ Generated ${(audioBuffer.length / 1024).toFixed(1)} KB audio`);
          resolve(audioBuffer);
        } catch (e) {
          console.error(`❌ Parse error: ${e}`);
          resolve(null);
        }
      });
    });
    
    req.on('error', (err) => {
      console.error(`❌ Request error: ${err.message}`);
      resolve(null);
    });
    
    req.write(body);
    req.end();
  });
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.length === 0) {
    console.log(`
ElevenLabs + Modal IndexTTS Voice Generation

Usage:
  # List available ElevenLabs voices
  npx tsx scripts/generate-voice-with-elevenlabs.ts --list-voices

  # Generate voice reference with ElevenLabs (step 1)
  npx tsx scripts/generate-voice-with-elevenlabs.ts --generate-ref \\
    --voice adam \\
    --text "This is a sample of my voice for training purposes." \\
    --output voices/elevenlabs_adam.mp3

  # Clone voice with Modal IndexTTS using ElevenLabs audio as reference (step 2)
  npx tsx scripts/generate-voice-with-elevenlabs.ts --clone \\
    --voice-ref voices/elevenlabs_adam.mp3 \\
    --text "Hello, this is my cloned voice speaking!" \\
    --output output_cloned.wav

  # Full pipeline: generate reference + clone in one command
  npx tsx scripts/generate-voice-with-elevenlabs.ts --full-pipeline \\
    --voice daniel \\
    --ref-text "Hi, I'm Daniel. This is a training sample for voice cloning. I speak clearly and naturally." \\
    --clone-text "Now I can say anything with this cloned voice!" \\
    --output-dir public/assets/audio/daniel_clone

Options:
  --list-voices     List all available ElevenLabs voices
  --generate-ref    Generate voice reference with ElevenLabs
  --clone           Clone voice using Modal IndexTTS
  --full-pipeline   Run complete pipeline (generate ref + clone)
  --voice           ElevenLabs voice name (e.g., adam, daniel, rachel)
  --voice-ref       Path to voice reference audio file
  --text            Text to synthesize
  --ref-text        Text for reference generation (full pipeline)
  --clone-text      Text for cloned voice (full pipeline)
  --output          Output file path
  --output-dir      Output directory (full pipeline)

Available voices: ${Object.keys(ELEVENLABS_VOICES).join(', ')}
`);
    return;
  }

  // List voices
  if (args.includes('--list-voices')) {
    await listElevenLabsVoices();
    return;
  }

  // Generate voice reference with ElevenLabs
  if (args.includes('--generate-ref')) {
    const voiceIdx = args.indexOf('--voice');
    const textIdx = args.indexOf('--text');
    const outputIdx = args.indexOf('--output');

    const voiceName = voiceIdx !== -1 ? args[voiceIdx + 1] : 'adam';
    const text = textIdx !== -1 ? args[textIdx + 1] : 'This is a sample of my voice.';
    const output = outputIdx !== -1 ? args[outputIdx + 1] : 
      path.join(OUTPUT_DIR, `elevenlabs_${voiceName}.mp3`);

    const voiceId = ELEVENLABS_VOICES[voiceName as keyof typeof ELEVENLABS_VOICES] || voiceName;

    await generateElevenLabsTTS({
      text,
      voiceId,
      outputPath: output,
    });
    return;
  }

  // Clone voice with Modal
  if (args.includes('--clone')) {
    const voiceRefIdx = args.indexOf('--voice-ref');
    const textIdx = args.indexOf('--text');
    const outputIdx = args.indexOf('--output');

    if (voiceRefIdx === -1) {
      console.error('❌ --voice-ref is required');
      process.exit(1);
    }

    const voiceRef = args[voiceRefIdx + 1];
    const text = textIdx !== -1 ? args[textIdx + 1] : 'Hello, this is my cloned voice.';
    const output = outputIdx !== -1 ? args[outputIdx + 1] : 'output_cloned.wav';

    // First, ensure Modal is deployed
    console.log('\n📡 Ensuring Modal voice clone is deployed...');
    try {
      execSync('modal app list | grep voice-clone-indextts2', { stdio: 'pipe' });
    } catch {
      console.log('   Deploying Modal app...');
      execSync('modal deploy scripts/modal_voice_clone.py', { stdio: 'inherit' });
    }

    const audioBuffer = await callModalVoiceClone(voiceRef, text);
    if (audioBuffer) {
      fs.writeFileSync(output, audioBuffer);
      console.log(`\n✅ Cloned voice saved: ${output}`);
    }
    return;
  }

  // Full pipeline
  if (args.includes('--full-pipeline')) {
    const voiceIdx = args.indexOf('--voice');
    const refTextIdx = args.indexOf('--ref-text');
    const cloneTextIdx = args.indexOf('--clone-text');
    const outputDirIdx = args.indexOf('--output-dir');

    const voiceName = voiceIdx !== -1 ? args[voiceIdx + 1] : 'daniel';
    const refText = refTextIdx !== -1 ? args[refTextIdx + 1] : 
      `Hi, I'm speaking naturally for voice cloning training. I'll use varied intonation, some questions, and different emotions. This helps create a better voice model.`;
    const cloneText = cloneTextIdx !== -1 ? args[cloneTextIdx + 1] :
      'This is my cloned voice speaking! The quality should be excellent.';
    const outputDir = outputDirIdx !== -1 ? args[outputDirIdx + 1] : 
      path.join(process.cwd(), 'public', 'assets', 'audio', `${voiceName}_clone`);

    const voiceId = ELEVENLABS_VOICES[voiceName as keyof typeof ELEVENLABS_VOICES] || voiceName;

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    console.log(`\n🚀 Full Pipeline: ElevenLabs → Modal IndexTTS\n`);
    console.log(`   Voice: ${voiceName}`);
    console.log(`   Output: ${outputDir}\n`);

    // Step 1: Generate reference with ElevenLabs
    console.log('━━━ Step 1: Generate Reference with ElevenLabs ━━━\n');
    const refPath = path.join(outputDir, 'reference.mp3');
    const refSuccess = await generateElevenLabsTTS({
      text: refText,
      voiceId,
      outputPath: refPath,
      stability: 0.5,
      similarityBoost: 0.8,
    });

    if (!refSuccess) {
      console.error('❌ Failed to generate reference audio');
      process.exit(1);
    }

    // Step 2: Deploy Modal if needed
    console.log('\n━━━ Step 2: Ensure Modal is Running ━━━\n');
    try {
      execSync('modal deploy scripts/modal_voice_clone.py', { 
        stdio: 'inherit',
        cwd: process.cwd(),
      });
    } catch (err) {
      console.log('   Modal deployment issue, continuing anyway...');
    }

    // Wait a moment for cold start
    console.log('   Waiting for Modal cold start (30s)...');
    await new Promise(r => setTimeout(r, 5000));

    // Step 3: Clone voice with Modal
    console.log('\n━━━ Step 3: Clone Voice with Modal IndexTTS ━━━\n');
    const clonedPath = path.join(outputDir, 'cloned_output.wav');
    const audioBuffer = await callModalVoiceClone(refPath, cloneText);
    
    if (audioBuffer) {
      fs.writeFileSync(clonedPath, audioBuffer);
      console.log(`\n✅ Cloned voice saved: ${clonedPath}`);

      // Convert to MP3 for better compatibility
      const mp3Path = clonedPath.replace('.wav', '.mp3');
      try {
        execSync(`ffmpeg -y -i "${clonedPath}" -codec:a libmp3lame -b:a 192k "${mp3Path}"`, {
          stdio: 'pipe',
        });
        console.log(`✅ MP3 version: ${mp3Path}`);
      } catch {
        console.log('   (ffmpeg not available for MP3 conversion)');
      }
    } else {
      console.error('❌ Failed to clone voice');
    }

    console.log('\n━━━ Pipeline Complete ━━━\n');
    console.log(`📁 Output files in: ${outputDir}`);
    console.log(`   - reference.mp3     (ElevenLabs original)`);
    console.log(`   - cloned_output.wav (IndexTTS cloned)`);
    console.log(`   - cloned_output.mp3 (MP3 version)`);
    return;
  }

  console.error('❌ Unknown command. Use --help for usage.');
}

main().catch(console.error);
