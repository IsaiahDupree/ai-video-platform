#!/usr/bin/env tsx
/**
 * Transcribe a voiceover audio file with OpenAI Whisper and return
 * word-level timestamps compatible with wordTimingsToSegments().
 *
 * Usage:
 *   tsx scripts/whisper-transcribe.ts <audio-file> [--output <json-file>]
 *
 * Output format matches WordTimingInput / WordTiming:
 *   [{ word, start, end }, ...]
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

function loadEnv() {
  for (const name of ['.env.local', '.env']) {
    if (!fs.existsSync(name)) continue;
    for (const line of fs.readFileSync(name, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const eq = trimmed.indexOf('=');
      const key = trimmed.slice(0, eq);
      const val = trimmed.slice(eq + 1);
      if (!(key in process.env)) process.env[key] = val;
    }
    break;
  }
}

interface WordTiming {
  word: string;
  start: number;
  end: number;
}

interface WhisperWord {
  word: string;
  start: number;
  end: number;
}

interface WhisperResponse {
  text: string;
  duration: number;
  words?: WhisperWord[];
}

async function transcribeWithWhisper(audioPath: string, apiKey: string): Promise<WhisperResponse> {
  const audioData = fs.readFileSync(audioPath);
  const ext = path.extname(audioPath).slice(1).toLowerCase() || 'mp3';
  const mimeType =
    ext === 'wav' ? 'audio/wav' :
    ext === 'm4a' ? 'audio/mp4' :
    ext === 'ogg' ? 'audio/ogg' :
    'audio/mpeg';

  const boundary = `----FormBoundary${Date.now().toString(16)}`;

  const parts: Buffer[] = [];
  const addField = (name: string, value: string) => {
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`
    ));
  };

  addField('model', 'whisper-1');
  addField('response_format', 'verbose_json');
  addField('timestamp_granularities[]', 'word');

  parts.push(Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${path.basename(audioPath)}"\r\nContent-Type: ${mimeType}\r\n\r\n`
  ));
  parts.push(audioData);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

  const body = Buffer.concat(parts);

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/audio/transcriptions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode !== 200) {
          reject(new Error(`Whisper API error ${res.statusCode}: ${raw}`));
          return;
        }
        resolve(JSON.parse(raw));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  loadEnv();

  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === '--help') {
    console.log('Usage: tsx scripts/whisper-transcribe.ts <audio-file> [--output <json-file>]');
    process.exit(args[0] === '--help' ? 0 : 1);
  }

  const audioPath = args[0];
  const outputIdx = args.indexOf('--output');
  const outputPath = outputIdx !== -1 ? args[outputIdx + 1] : null;

  if (!fs.existsSync(audioPath)) {
    console.error(`File not found: ${audioPath}`);
    process.exit(1);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY is not set');
    process.exit(1);
  }

  console.error(`Transcribing: ${audioPath}`);

  const result = await transcribeWithWhisper(audioPath, apiKey);

  const wordTimings: WordTiming[] = (result.words ?? []).map((w) => ({
    word: w.word,
    start: w.start,
    end: w.end,
  }));

  const output = JSON.stringify(wordTimings, null, 2);

  if (outputPath) {
    fs.writeFileSync(outputPath, output);
    console.error(`Saved ${wordTimings.length} word timings to ${outputPath}`);
  } else {
    process.stdout.write(output);
  }

  console.error(`Duration: ${result.duration?.toFixed(2)}s — ${wordTimings.length} words`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
