#!/usr/bin/env npx tsx
/**
 * API-Ready Render Endpoint
 * 
 * HTTP server that accepts JSON briefs and renders videos.
 * Designed for backend integration via HTTP or subprocess.
 * 
 * Usage:
 *   npx tsx scripts/api-render.ts --port 3001
 *   
 * API Endpoints:
 *   POST /render       - Render video from brief JSON
 *   POST /generate     - Generate brief from input variables
 *   GET  /status/:id   - Check render status
 *   GET  /health       - Health check
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync, spawn, ChildProcess } from 'child_process';
import { generateBrief, GeneratorInput } from './generate-brief';
import { validateBrief } from './validate-brief';
import { ContentBrief } from '../src/types';

interface RenderJob {
  id: string;
  status: 'pending' | 'rendering' | 'complete' | 'failed';
  brief: ContentBrief;
  outputPath?: string;
  error?: string;
  startedAt: string;
  completedAt?: string;
  progress?: number;
}

const jobs: Map<string, RenderJob> = new Map();
const PORT = parseInt(process.env.PORT || '3001', 10);

function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function sanitizeFilename(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function renderVideo(job: RenderJob): Promise<void> {
  const outputDir = './output/api';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filename = `${job.id}.mp4`;
  const outputPath = path.join(outputDir, filename);
  
  job.status = 'rendering';
  job.outputPath = outputPath;

  try {
    const propsJson = JSON.stringify({ brief: job.brief });
    
    execSync(
      `npx remotion render BriefComposition "${outputPath}" --props='${propsJson}' --crf=18`,
      {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'pipe',
      }
    );

    job.status = 'complete';
    job.completedAt = new Date().toISOString();
    job.progress = 100;

  } catch (error) {
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : String(error);
    job.completedAt = new Date().toISOString();
  }
}

function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: http.ServerResponse, status: number, data: any): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data, null, 2));
}

async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const method = req.method || 'GET';

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    // Health check
    if (url.pathname === '/health' && method === 'GET') {
      sendJson(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
      return;
    }

    // List jobs
    if (url.pathname === '/jobs' && method === 'GET') {
      const jobList = Array.from(jobs.values()).map(j => ({
        id: j.id,
        status: j.status,
        startedAt: j.startedAt,
        completedAt: j.completedAt,
      }));
      sendJson(res, 200, { jobs: jobList });
      return;
    }

    // Get job status
    if (url.pathname.startsWith('/status/') && method === 'GET') {
      const jobId = url.pathname.split('/')[2];
      const job = jobs.get(jobId);
      
      if (!job) {
        sendJson(res, 404, { error: 'Job not found' });
        return;
      }

      sendJson(res, 200, {
        id: job.id,
        status: job.status,
        outputPath: job.outputPath,
        error: job.error,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        progress: job.progress,
      });
      return;
    }

    // Download video
    if (url.pathname.startsWith('/download/') && method === 'GET') {
      const jobId = url.pathname.split('/')[2];
      const job = jobs.get(jobId);
      
      if (!job || job.status !== 'complete' || !job.outputPath) {
        sendJson(res, 404, { error: 'Video not found or not ready' });
        return;
      }

      const videoPath = path.resolve(job.outputPath);
      if (!fs.existsSync(videoPath)) {
        sendJson(res, 404, { error: 'Video file not found' });
        return;
      }

      const stat = fs.statSync(videoPath);
      res.writeHead(200, {
        'Content-Type': 'video/mp4',
        'Content-Length': stat.size,
        'Content-Disposition': `attachment; filename="${job.id}.mp4"`,
      });
      fs.createReadStream(videoPath).pipe(res);
      return;
    }

    // Generate brief from input
    if (url.pathname === '/generate' && method === 'POST') {
      const input = await parseBody(req) as GeneratorInput;
      
      if (!input.title) {
        sendJson(res, 400, { error: 'Missing required field: title' });
        return;
      }

      input.format = input.format || 'explainer_v1';
      const brief = generateBrief(input);

      sendJson(res, 200, { brief });
      return;
    }

    // Render video from brief
    if (url.pathname === '/render' && method === 'POST') {
      const body = await parseBody(req);
      
      let brief: ContentBrief;

      // Accept either a full brief or input variables
      if (body.brief) {
        brief = body.brief;
      } else if (body.title) {
        // Generate brief from input - ensure format has default
        const input: GeneratorInput = {
          ...body,
          format: body.format || 'explainer_v1',
        };
        brief = generateBrief(input);
      } else {
        sendJson(res, 400, { error: 'Missing brief or title' });
        return;
      }

      // Validate brief
      const validation = validateBrief(brief);
      if (!validation.valid) {
        sendJson(res, 400, { error: 'Invalid brief', details: validation.errors });
        return;
      }

      // Create job
      const jobId = generateJobId();
      const job: RenderJob = {
        id: jobId,
        status: 'pending',
        brief,
        startedAt: new Date().toISOString(),
        progress: 0,
      };
      jobs.set(jobId, job);

      // Start rendering asynchronously
      renderVideo(job).catch(console.error);

      sendJson(res, 202, {
        message: 'Render job started',
        jobId,
        statusUrl: `/status/${jobId}`,
        downloadUrl: `/download/${jobId}`,
      });
      return;
    }

    // Render and wait (synchronous)
    if (url.pathname === '/render-sync' && method === 'POST') {
      const body = await parseBody(req);
      
      let brief: ContentBrief;

      if (body.brief) {
        brief = body.brief;
      } else if (body.title) {
        const input: GeneratorInput = {
          ...body,
          format: body.format || 'explainer_v1',
        };
        brief = generateBrief(input);
      } else {
        sendJson(res, 400, { error: 'Missing brief or title' });
        return;
      }

      const validation = validateBrief(brief);
      if (!validation.valid) {
        sendJson(res, 400, { error: 'Invalid brief', details: validation.errors });
        return;
      }

      const jobId = generateJobId();
      const job: RenderJob = {
        id: jobId,
        status: 'pending',
        brief,
        startedAt: new Date().toISOString(),
        progress: 0,
      };
      jobs.set(jobId, job);

      // Render synchronously
      await renderVideo(job);

      if (job.status === 'complete') {
        sendJson(res, 200, {
          message: 'Render complete',
          jobId,
          outputPath: job.outputPath,
          downloadUrl: `/download/${jobId}`,
        });
      } else {
        sendJson(res, 500, {
          message: 'Render failed',
          jobId,
          error: job.error,
        });
      }
      return;
    }

    // 404 for unknown routes
    sendJson(res, 404, { error: 'Not found' });

  } catch (error) {
    console.error('Request error:', error);
    sendJson(res, 500, { error: 'Internal server error' });
  }
}

// Start server
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`
🎬 Video Studio API Server
===========================

Server running at http://localhost:${PORT}

Endpoints:
  POST /render       - Start async render (returns job ID)
  POST /render-sync  - Render and wait for completion
  POST /generate     - Generate brief from input variables
  GET  /status/:id   - Check job status
  GET  /download/:id - Download completed video
  GET  /jobs         - List all jobs
  GET  /health       - Health check

Example:
  curl -X POST http://localhost:${PORT}/render \\
    -H "Content-Type: application/json" \\
    -d '{"title":"My Video","topics":["Topic 1","Topic 2"]}'
`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  server.close();
  process.exit(0);
});
