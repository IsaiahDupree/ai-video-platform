// Real duration measurement via ffprobe. Per the PRD: "Duration measurement must be from
// ACTUAL synthesized audio length ... never from a word-count formula alone."
import { execFileSync } from 'child_process';

export function measureDurationSeconds(filePath: string): number {
  const out = execFileSync(
    'ffprobe',
    [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath,
    ],
    { encoding: 'utf8' }
  );
  const seconds = parseFloat(out.trim());
  if (!Number.isFinite(seconds)) {
    throw new Error(`ffprobe returned non-numeric duration for ${filePath}: "${out}"`);
  }
  return seconds;
}

export function probeStreams(filePath: string): { hasVideo: boolean; hasAudio: boolean; raw: any } {
  const out = execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'stream=codec_type', '-of', 'json', filePath],
    { encoding: 'utf8' }
  );
  const parsed = JSON.parse(out);
  const types: string[] = (parsed.streams || []).map((s: any) => s.codec_type);
  return { hasVideo: types.includes('video'), hasAudio: types.includes('audio'), raw: parsed };
}
