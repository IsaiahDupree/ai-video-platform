/**
 * Stage 3: Voiceover Generation — ElevenLabs TTS
 *
 * Generates an MP3 voiceover from the voice script.
 * Offer-agnostic: works with any voiceScript + voice ID.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import type { AngleInputs, CreativeFramework, StageResult } from './offer.schema.js';

const DEFAULT_VOICE_ID = 'IKne3meq5aSn9XLyUdCD'; // charlie — casual male UGC

export async function runStageVoice(
  inputs: AngleInputs,
  framework: CreativeFramework,
  outputDir: string
): Promise<StageResult> {
  const t0 = Date.now();
  const voicePath = path.join(outputDir, 'voiceover.mp3');
  const scriptPath = path.join(outputDir, 'script.txt');

  console.log(`\n🎙️  Stage 3: ElevenLabs TTS — Voiceover`);

  if (fs.existsSync(voicePath)) {
    console.log(`   ⏭️  voiceover.mp3 exists`);
    return { status: 'done', outputs: [voicePath, scriptPath].filter(fs.existsSync), durationMs: Date.now() - t0 };
  }

  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error('ELEVENLABS_API_KEY not set');

  const voiceId = framework.elevenLabsVoiceId ?? DEFAULT_VOICE_ID;

  const body = JSON.stringify({
    text: inputs.voiceScript,
    model_id: 'eleven_turbo_v2_5',
    voice_settings: {
      stability: 0.45,
      similarity_boost: 0.75,
      style: 0.35,
      use_speaker_boost: true,
    },
  });

  try {
    await new Promise<void>((resolve, reject) => {
      const req = https.request(
        {
          hostname: 'api.elevenlabs.io',
          path: `/v1/text-to-speech/${voiceId}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': key,
            Accept: 'audio/mpeg',
            'Content-Length': Buffer.byteLength(body),
          },
        },
        (res) => {
          if (res.statusCode !== 200) {
            let err = '';
            res.on('data', (c) => (err += c));
            res.on('end', () => reject(new Error(`ElevenLabs ${res.statusCode}: ${err.substring(0, 200)}`)));
            return;
          }
          fs.mkdirSync(path.dirname(voicePath), { recursive: true });
          const file = fs.createWriteStream(voicePath);
          res.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log(`   ✅ voiceover.mp3 (${(fs.statSync(voicePath).size / 1024).toFixed(0)}KB)`);
            resolve();
          });
          file.on('error', reject);
        }
      );
      req.on('error', reject);
      req.write(body);
      req.end();
    });

    // Write human-readable script file alongside the audio
    fs.writeFileSync(
      scriptPath,
      [
        `ANGLE:    ${inputs.angleId}`,
        `STAGE:    ${inputs.awarenessStage}`,
        `CATEGORY: ${inputs.audienceCategory}`,
        `KEYWORD:  ${inputs.commentKeyword}`,
        `HEADLINE: ${inputs.headline}`,
        `SUB:      ${inputs.subheadline}`,
        `RATIONALE: ${inputs.rationale}`,
        ``,
        `--- SCRIPT ---`,
        inputs.voiceScript,
      ].join('\n')
    );

    return {
      status: 'done',
      outputs: [voicePath, scriptPath].filter(fs.existsSync),
      durationMs: Date.now() - t0,
    };
  } catch (err: any) {
    return { status: 'failed', outputs: [], durationMs: Date.now() - t0, error: err.message };
  }
}
