import { spawn, ChildProcess } from 'node:child_process';
import path from 'node:path';

// =============================================================================
// Motion Canvas Dev Server Manager
// =============================================================================

export interface McServerHandle {
  process: ChildProcess;
  logs: string[];
  stop: () => void;
  waitForReady: (timeoutMs?: number) => Promise<boolean>;
}

export function startMcDevServer(cwd?: string): McServerHandle {
  const projectDir = cwd ?? process.cwd();
  const logs: string[] = [];

  const proc = spawn('npm', ['run', 'serve'], {
    cwd: projectDir,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '0' },
  });

  proc.stdout?.on('data', (chunk) => {
    const line = chunk.toString();
    logs.push(line);
    if (process.env.MC_DEBUG) console.log('[MC]', line.trim());
  });

  proc.stderr?.on('data', (chunk) => {
    const line = chunk.toString();
    logs.push(line);
    if (process.env.MC_DEBUG) console.error('[MC ERR]', line.trim());
  });

  const stop = () => {
    proc.kill('SIGTERM');
  };

  const waitForReady = async (timeoutMs = 15000): Promise<boolean> => {
    const start = Date.now();
    const checkUrl = 'http://localhost:9000/';

    while (Date.now() - start < timeoutMs) {
      try {
        const res = await fetch(checkUrl, { method: 'GET' });
        if (res.ok) return true;
      } catch {
        // Server not ready yet
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    return false;
  };

  return { process: proc, logs, stop, waitForReady };
}

// =============================================================================
// CLI: Start server and keep running
// =============================================================================

if (require.main === module) {
  const server = startMcDevServer();
  console.log('Starting Motion Canvas dev server...');

  server.waitForReady(20000).then((ok) => {
    if (ok) {
      console.log('✅ Server ready at http://localhost:9000/');
      console.log('Press Ctrl+C to stop.');
    } else {
      console.error('❌ Server failed to start');
      server.stop();
      process.exit(1);
    }
  });

  process.on('SIGINT', () => {
    console.log('\nStopping server...');
    server.stop();
    process.exit(0);
  });
}
