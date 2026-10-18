// ElevenLabs TTS wrapper — mirrors the real, working request shape already proven in
// scripts/generate-voice-with-elevenlabs.ts (this repo). Real API call, real audio bytes,
// no mock/stub fallback: if the key or network is bad this throws, it does not fabricate
// a fake audio file.
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import type { VoiceConfig } from './types.ts';

export interface SynthesizeOptions {
  text: string;
  voice: VoiceConfig;
  outputPath: string;
}

export function synthesizeSpeech(opts: SynthesizeOptions): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY not set — cannot synthesize real narration audio.');
  }

  const body = JSON.stringify({
    text: opts.text,
    model_id: opts.voice.model_id || 'eleven_multilingual_v2',
    voice_settings: {
      stability: opts.voice.stability ?? 0.5,
      similarity_boost: opts.voice.similarity_boost ?? 0.75,
    },
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.elevenlabs.io',
        path: `/v1/text-to-speech/${opts.voice.voice_id}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
          Accept: 'audio/mpeg',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => reject(new Error(`ElevenLabs TTS error ${res.statusCode}: ${data}`)));
          return;
        }
        fs.mkdirSync(path.dirname(opts.outputPath), { recursive: true });
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          fs.writeFileSync(opts.outputPath, buf);
          resolve(opts.outputPath);
        });
        res.on('error', reject);
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}
