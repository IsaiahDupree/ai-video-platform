// Concatenate per-section narration audio into one continuous voiceover track, in
// section order, with no gaps — so each section's start_time_sec in the final
// ContentBrief exactly matches its position in the real audio (both are derived from
// the same measured per-section durations).
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';

export function concatAudio(sectionAudioPaths: string[], outputPath: string): void {
  if (sectionAudioPaths.length === 0) throw new Error('concatAudio: no section audio paths given');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const listPath = outputPath + '.concat-list.txt';
  const listContent = sectionAudioPaths
    .map((p) => `file '${path.resolve(p).replace(/'/g, "'\\''")}'`)
    .join('\n');
  fs.writeFileSync(listPath, listContent);

  try {
    execFileSync('ffmpeg', [
      '-y',
      '-f', 'concat',
      '-safe', '0',
      '-i', listPath,
      '-ar', '44100',
      '-ac', '1',
      '-c:a', 'pcm_s16le',
      outputPath,
    ], { stdio: 'pipe' });
  } finally {
    fs.unlinkSync(listPath);
  }
}
