import path from 'node:path';
import fs from 'node:fs';
import { chromium, Browser, Page } from 'playwright';
import { mcRenderConfig as cfg } from './mc-render.config';
import { startMcDevServer, McServerHandle } from './mc-server';
import { newestFileWithExt, fileSizeStable } from './mc-output-watch';

// =============================================================================
// Motion Canvas Playwright Renderer
// =============================================================================

interface RenderResult {
  success: boolean;
  outputPath?: string;
  reveals?: Array<{ t: number; kind: string; key?: string }>;
  durationSec?: number;
  error?: string;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function captureReveals(page: Page): Promise<any[]> {
  try {
    // Inject reveal capture into the page context
    const reveals = await page.evaluate(() => {
      // @ts-ignore - window.__MC_REVEALS__ is set by reveal-recorder
      return window.__MC_REVEALS__ ?? [];
    });
    return reveals;
  } catch {
    return [];
  }
}

async function renderWithPlaywright(options?: {
  headless?: boolean;
  captureReveals?: boolean;
  server?: McServerHandle;
}): Promise<RenderResult> {
  const headless = options?.headless ?? cfg.headless;
  const shouldCapture = options?.captureReveals ?? cfg.captureReveals;
  let server = options?.server;
  let ownServer = false;

  console.log('🎬 Motion Canvas Playwright Render');
  console.log(`   Headless: ${headless}`);
  console.log(`   Capture reveals: ${shouldCapture}`);

  // Start server if not provided
  if (!server) {
    console.log('📡 Starting Motion Canvas dev server...');
    server = startMcDevServer();
    ownServer = true;

    const ready = await server.waitForReady(cfg.serverStartupMs);
    if (!ready) {
      console.error('❌ Server did not start in time');
      console.error('Last logs:', server.logs.slice(-20).join(''));
      server.stop();
      return { success: false, error: 'Server startup timeout' };
    }
    console.log('✅ Server ready');
  }

  const outputDir = path.resolve(process.cwd(), cfg.outputDir);
  fs.mkdirSync(outputDir, { recursive: true });

  // Get baseline for detecting new output
  const beforeNewest = newestFileWithExt(outputDir, cfg.expectedExtensions)?.mtimeMs ?? 0;

  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    console.log('🌐 Launching browser...');
    browser = await chromium.launch({ headless });
    page = await browser.newPage();

    // Set up console logging from page
    page.on('console', (msg: { type: () => string; text: () => string }) => {
      if (process.env.MC_DEBUG) {
        console.log(`[Page] ${msg.type()}: ${msg.text()}`);
      }
    });

    // Inject reveal capture script before navigation
    if (shouldCapture) {
      await page.addInitScript(() => {
        // @ts-ignore
        window.__MC_REVEALS__ = [];
        // @ts-ignore
        window.__MC_REVEAL__ = (kind: string, key?: string) => {
          const t = performance.now() / 1000;
          // @ts-ignore
          window.__MC_REVEALS__.push({ t: Number(t.toFixed(3)), kind, key });
        };
      });
    }

    // Navigate to editor with ?render to auto-start
    console.log(`🔗 Navigating to ${cfg.editorUrl}`);
    await page.goto(cfg.editorUrl, { waitUntil: 'domcontentloaded' });

    // Wait for render to complete by polling for new output file
    console.log('⏳ Waiting for render to complete...');
    const start = Date.now();
    let found: { path: string; mtimeMs: number } | null = null;

    while (Date.now() - start < cfg.renderTimeoutMs) {
      const newest = newestFileWithExt(outputDir, cfg.expectedExtensions);

      if (newest && newest.mtimeMs > beforeNewest) {
        // Wait for file to finish writing
        const stable = await fileSizeStable(newest.path);
        if (stable) {
          found = newest;
          break;
        }
      }

      await sleep(cfg.pollIntervalMs);

      // Progress indicator
      const elapsed = Math.round((Date.now() - start) / 1000);
      if (elapsed % 10 === 0) {
        process.stdout.write(`   ${elapsed}s elapsed...\r`);
      }
    }

    if (!found) {
      console.error('\n❌ Render timed out - no new output detected');
      return { success: false, error: 'Render timeout' };
    }

    console.log(`\n✅ Render complete: ${found.path}`);

    // Capture reveals if enabled
    let reveals: any[] = [];
    if (shouldCapture && page) {
      reveals = await captureReveals(page);
      if (reveals.length > 0) {
        const revealsPath = path.resolve(process.cwd(), cfg.revealsOutputPath);
        fs.mkdirSync(path.dirname(revealsPath), { recursive: true });
        fs.writeFileSync(
          revealsPath,
          JSON.stringify({ version: '1.0.0', reveals }, null, 2)
        );
        console.log(`📝 Captured ${reveals.length} reveals → ${revealsPath}`);
      }
    }

    // Get video duration (estimate from file size or metadata)
    const stats = fs.statSync(found.path);
    const estimatedDuration = stats.size / (1024 * 1024) * 10; // rough estimate

    return {
      success: true,
      outputPath: found.path,
      reveals,
      durationSec: estimatedDuration,
    };
  } catch (err) {
    console.error('❌ Render error:', err);
    return { success: false, error: String(err) };
  } finally {
    if (browser) await browser.close();
    if (ownServer && server) server.stop();
  }
}

// =============================================================================
// CLI
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const headless = !args.includes('--headed');
  const captureReveals = !args.includes('--no-capture');

  const result = await renderWithPlaywright({ headless, captureReveals });

  if (result.success) {
    console.log('\n🎉 Render successful!');
    console.log(`   Output: ${result.outputPath}`);
    if (result.reveals?.length) {
      console.log(`   Reveals: ${result.reveals.length}`);
    }
    process.exit(0);
  } else {
    console.error('\n💥 Render failed:', result.error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

export { renderWithPlaywright, RenderResult };
