#!/usr/bin/env npx tsx
import { spawn, execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';

// =============================================================================
// Motion Canvas CLI Render (Simple approach - no Playwright dependency)
// =============================================================================
// Uses: vite dev server + open browser + poll for output
// More reliable than Playwright for basic rendering

interface RenderConfig {
  port: number;
  outputDir: string;
  expectedExtensions: string[];
  serverStartupMs: number;
  renderTimeoutMs: number;
  pollIntervalMs: number;
  openBrowser: boolean;
  fps: number;
  compileWithFFmpeg: boolean;
}

const config: RenderConfig = {
  port: 9000,
  outputDir: './output',
  expectedExtensions: ['.mp4', '.webm', '.mov', '.png'],
  serverStartupMs: 10000,
  renderTimeoutMs: 300000,
  pollIntervalMs: 2000,
  openBrowser: true,
  fps: 30,
  compileWithFFmpeg: true,
};

// =============================================================================
// Utilities
// =============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function listFilesRecursive(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFilesRecursive(p));
    else out.push(p);
  }
  return out;
}

function newestFile(dir: string, exts: string[]): { path: string; mtimeMs: number } | null {
  const files = listFilesRecursive(dir).filter((f) =>
    exts.some((x) => f.toLowerCase().endsWith(x.toLowerCase()))
  );
  if (!files.length) return null;

  let best = files[0];
  let bestTime = fs.statSync(best).mtimeMs;
  for (const f of files.slice(1)) {
    const t = fs.statSync(f).mtimeMs;
    if (t > bestTime) { best = f; bestTime = t; }
  }
  return { path: best, mtimeMs: bestTime };
}

async function waitForFileStable(filePath: string, samples = 3, delayMs = 1000): Promise<boolean> {
  let last = -1;
  for (let i = 0; i < samples; i++) {
    if (!fs.existsSync(filePath)) return false;
    const size = fs.statSync(filePath).size;
    if (last !== -1 && size !== last) {
      last = size;
      await sleep(delayMs);
      continue;
    }
    last = size;
    await sleep(delayMs);
  }
  return true;
}

async function waitForServer(port: number, timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = http.get(`http://localhost:${port}/`, (res) => {
          res.resume();
          if (res.statusCode === 200) resolve();
          else reject();
        });
        req.on('error', reject);
        req.setTimeout(2000, () => { req.destroy(); reject(); });
      });
      return true;
    } catch {
      await sleep(500);
    }
  }
  return false;
}

function openUrl(url: string): void {
  const platform = process.platform;
  try {
    if (platform === 'darwin') {
      execSync(`open "${url}"`, { stdio: 'ignore' });
    } else if (platform === 'win32') {
      execSync(`start "" "${url}"`, { stdio: 'ignore' });
    } else {
      execSync(`xdg-open "${url}"`, { stdio: 'ignore' });
    }
  } catch (e) {
    console.warn('Could not open browser automatically');
  }
}

function findImageSequenceDir(outputDir: string): string | null {
  if (!fs.existsSync(outputDir)) return null;
  
  // Look for directories containing PNG sequences
  for (const entry of fs.readdirSync(outputDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const dirPath = path.join(outputDir, entry.name);
      const files = fs.readdirSync(dirPath);
      const pngFiles = files.filter(f => f.endsWith('.png'));
      if (pngFiles.length > 10) { // Likely an image sequence
        return dirPath;
      }
    }
  }
  return null;
}

function compileImageSequence(sequenceDir: string, outputPath: string, fps: number): boolean {
  console.log('🎞️  Compiling image sequence with FFmpeg...');
  console.log(`   Input: ${sequenceDir}`);
  console.log(`   Output: ${outputPath}`);
  
  try {
    // Check if ffmpeg is available
    execSync('ffmpeg -version', { stdio: 'ignore' });
  } catch {
    console.warn('   ⚠️  FFmpeg not found, skipping video compilation');
    return false;
  }
  
  try {
    const inputPattern = path.join(sequenceDir, '%06d.png');
    const cmd = `ffmpeg -y -framerate ${fps} -i "${inputPattern}" -c:v libx264 -pix_fmt yuv420p -crf 18 "${outputPath}"`;
    
    execSync(cmd, { stdio: 'pipe' });
    
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`   ✅ Video compiled: ${outputPath} (${sizeMB} MB)`);
      return true;
    }
  } catch (e) {
    console.error('   ❌ FFmpeg compilation failed:', e);
  }
  return false;
}

// =============================================================================
// Main Render Function
// =============================================================================

async function render(): Promise<{ success: boolean; outputPath?: string; error?: string }> {
  console.log('🎬 Motion Canvas CLI Render');
  console.log('═══════════════════════════════════════════════════════════════');

  const outputDir = path.resolve(process.cwd(), config.outputDir);
  fs.mkdirSync(outputDir, { recursive: true });

  // Get baseline
  const beforeNewest = newestFile(outputDir, config.expectedExtensions)?.mtimeMs ?? 0;

  // Start vite dev server
  console.log('📡 Starting Motion Canvas dev server...');
  const server = spawn('npm', ['run', 'serve'], {
    cwd: process.cwd(),
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });

  const serverLogs: string[] = [];
  server.stdout?.on('data', (d) => serverLogs.push(d.toString()));
  server.stderr?.on('data', (d) => serverLogs.push(d.toString()));

  // Wait for server
  const serverReady = await waitForServer(config.port, config.serverStartupMs);
  if (!serverReady) {
    server.kill();
    console.error('❌ Server failed to start');
    console.error('Logs:', serverLogs.slice(-10).join(''));
    return { success: false, error: 'Server startup failed' };
  }
  console.log('✅ Server ready on port', config.port);

  // Open browser with ?render to auto-start
  const renderUrl = `http://localhost:${config.port}/?render`;
  if (config.openBrowser) {
    console.log(`🌐 Opening browser: ${renderUrl}`);
    openUrl(renderUrl);
  } else {
    console.log(`📋 Open manually: ${renderUrl}`);
  }

  // Poll for new output file
  console.log('⏳ Waiting for render to complete...');
  console.log('   (Press Ctrl+C to cancel)');

  const start = Date.now();
  let found: { path: string; mtimeMs: number } | null = null;

  while (Date.now() - start < config.renderTimeoutMs) {
    const newest = newestFile(outputDir, config.expectedExtensions);

    if (newest && newest.mtimeMs > beforeNewest) {
      process.stdout.write('\n   New file detected, waiting for write to complete...\n');
      const stable = await waitForFileStable(newest.path);
      if (stable) {
        found = newest;
        break;
      }
    }

    // Progress
    const elapsed = Math.round((Date.now() - start) / 1000);
    process.stdout.write(`   ⏱ ${elapsed}s elapsed...\r`);
    await sleep(config.pollIntervalMs);
  }

  // Cleanup
  server.kill();

  if (!found) {
    // Check for image sequence instead
    const seqDir = findImageSequenceDir(outputDir);
    if (seqDir) {
      console.log(`\n📂 Found image sequence: ${seqDir}`);
      
      if (config.compileWithFFmpeg) {
        const videoPath = path.join(outputDir, 'render.mp4');
        const compiled = compileImageSequence(seqDir, videoPath, config.fps);
        if (compiled) {
          return { success: true, outputPath: videoPath };
        }
      }
      
      // Return image sequence directory as output
      return { success: true, outputPath: seqDir };
    }
    
    console.error('\n❌ Render timed out - no new output detected');
    return { success: false, error: 'Render timeout' };
  }

  // If we found a video file directly
  const stats = fs.statSync(found.path);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log(`\n✅ Render complete!`);
  console.log(`   📁 Output: ${found.path}`);
  console.log(`   📊 Size: ${sizeMB} MB`);

  return { success: true, outputPath: found.path };
}

// =============================================================================
// CLI Entry Point
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--no-browser')) {
    config.openBrowser = false;
  }
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Motion Canvas CLI Render

Usage: npx tsx scripts/mc-cli-render.ts [options]

Options:
  --no-browser    Don't auto-open browser (show URL to open manually)
  --help, -h      Show this help

How it works:
  1. Starts the Motion Canvas vite dev server
  2. Opens browser with ?render param (auto-starts render)
  3. Polls output directory for new video file
  4. Exits when render is complete

Note: You need to have a browser installed. The render happens
in the browser, this script just automates starting it.
`);
    process.exit(0);
  }

  const result = await render();
  process.exit(result.success ? 0 : 1);
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n🛑 Render cancelled by user');
  process.exit(130);
});

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
