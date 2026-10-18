import fs from 'node:fs';
import path from 'node:path';

// =============================================================================
// Output File Watcher Utilities
// =============================================================================

export function listFilesRecursive(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const out: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...listFilesRecursive(p));
    } else {
      out.push(p);
    }
  }
  return out;
}

export function newestFileWithExt(
  dir: string,
  exts: string[]
): { path: string; mtimeMs: number } | null {
  const files = listFilesRecursive(dir).filter((f) =>
    exts.some((x) => f.toLowerCase().endsWith(x.toLowerCase()))
  );

  if (!files.length) return null;

  let best = files[0];
  let bestTime = fs.statSync(best).mtimeMs;

  for (const f of files.slice(1)) {
    const t = fs.statSync(f).mtimeMs;
    if (t > bestTime) {
      best = f;
      bestTime = t;
    }
  }

  return { path: best, mtimeMs: bestTime };
}

export async function fileSizeStable(
  filePath: string,
  samples = 3,
  delayMs = 750
): Promise<boolean> {
  let last = -1;

  for (let i = 0; i < samples; i++) {
    if (!fs.existsSync(filePath)) return false;

    const size = fs.statSync(filePath).size;
    if (last !== -1 && size !== last) {
      last = size;
      await new Promise((r) => setTimeout(r, delayMs));
      continue;
    }
    last = size;
    await new Promise((r) => setTimeout(r, delayMs));
  }

  return true;
}

export function getOutputFiles(dir: string, exts: string[]): string[] {
  return listFilesRecursive(dir).filter((f) =>
    exts.some((x) => f.toLowerCase().endsWith(x.toLowerCase()))
  );
}
