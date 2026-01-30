#!/usr/bin/env npx tsx
/**
 * Batch Processing API Server
 *
 * REST API for batch video rendering with job tracking and webhooks.
 *
 * Endpoints:
 *   POST   /api/batches              - Submit a batch for processing
 *   GET    /api/batches              - List all batches
 *   GET    /api/batches/:id          - Get batch status
 *   GET    /api/batches/:id/details  - Get detailed batch status with job results
 *   DELETE /api/batches/:id          - Cancel a batch
 *   GET    /health                   - Health check
 *
 * Usage:
 *   npx tsx scripts/batch-api-server.ts --port 3000
 *
 * Example batch request:
 *   curl -X POST http://localhost:3000/api/batches \
 *     -H "Content-Type: application/json" \
 *     -d '{
 *       "videos": [
 *         {
 *           "format": "explainer_v1",
 *           "title": "AI Guide",
 *           "subtitle": "Fundamentals",
 *           "topics": ["What is AI", "How ML works"],
 *           "theme": "dark",
 *           "durationPerTopic": 5
 *         }
 *       ],
 *       "quality": "preview",
 *       "webhook": "http://example.com/webhook"
 *     }'
 */

import * as http from 'http';
import { URL } from 'url';
import { JobQueue } from '../src/api/job-queue';
import { BatchAPIHandler, BatchRequest } from '../src/api/batch-api';

// =============================================================================
// Config
// =============================================================================

const PORT = parseInt(process.env.PORT || process.argv.find((arg, i) => process.argv[i - 1] === '--port')?.toString() || '3000');

// =============================================================================
// Setup
// =============================================================================

const jobQueue = new JobQueue({
  maxConcurrent: 3,
  defaultMaxRetries: 2,
  jobTimeout: 1800000, // 30 minutes
});

const batchHandler = new BatchAPIHandler(jobQueue);

// =============================================================================
// HTTP Server
// =============================================================================

function parseRequestBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON body'));
      }
    });

    req.on('error', reject);
  });
}

function sendResponse(
  res: http.ServerResponse,
  statusCode: number,
  data: any,
  headers: Record<string, string> = {}
): void {
  const body = JSON.stringify(data, null, 2);

  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    ...headers,
  });

  res.end(body);
}

function sendError(res: http.ServerResponse, statusCode: number, message: string): void {
  sendResponse(res, statusCode, { error: message });
}

const server = http.createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const pathname = url.pathname;

  try {
    // Health check
    if (pathname === '/health' && req.method === 'GET') {
      return sendResponse(res, 200, {
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    }

    // Submit batch
    if (pathname === '/api/batches' && req.method === 'POST') {
      const body = await parseRequestBody(req);

      // Validate request
      if (!body.videos || !Array.isArray(body.videos)) {
        return sendError(res, 400, 'Missing or invalid "videos" array');
      }

      if (body.videos.length === 0) {
        return sendError(res, 400, 'At least one video is required');
      }

      const request: BatchRequest = {
        videos: body.videos,
        outputDir: body.outputDir,
        quality: body.quality || 'production',
        webhook: body.webhook,
      };

      const response = await batchHandler.submitBatch(request);
      return sendResponse(res, 202, response, { Location: `/api/batches/${response.batchId}` });
    }

    // List batches
    if (pathname === '/api/batches' && req.method === 'GET') {
      const batches = batchHandler.listBatches();
      return sendResponse(res, 200, { batches, count: batches.length });
    }

    // Get batch status
    const batchMatch = pathname.match(/^\/api\/batches\/([a-zA-Z0-9\-]+)$/);
    if (batchMatch && req.method === 'GET') {
      const batchId = batchMatch[1];
      const batch = batchHandler.getBatchStatus(batchId);

      if (!batch) {
        return sendError(res, 404, `Batch not found: ${batchId}`);
      }

      return sendResponse(res, 200, batch);
    }

    // Get batch details
    const detailsMatch = pathname.match(/^\/api\/batches\/([a-zA-Z0-9\-]+)\/details$/);
    if (detailsMatch && req.method === 'GET') {
      const batchId = detailsMatch[1];
      const details = batchHandler.getBatchDetails(batchId);

      if (!details) {
        return sendError(res, 404, `Batch not found: ${batchId}`);
      }

      return sendResponse(res, 200, details);
    }

    // Cancel batch
    const cancelMatch = pathname.match(/^\/api\/batches\/([a-zA-Z0-9\-]+)$/);
    if (cancelMatch && req.method === 'DELETE') {
      const batchId = cancelMatch[1];
      const cancelled = batchHandler.cancelBatch(batchId);

      if (!cancelled) {
        return sendError(res, 404, `Batch not found or already completed: ${batchId}`);
      }

      return sendResponse(res, 200, { message: 'Batch cancelled', batchId });
    }

    // Not found
    return sendError(res, 404, `Not found: ${pathname}`);
  } catch (error) {
    console.error('Request error:', error);
    return sendError(
      res,
      500,
      error instanceof Error ? error.message : 'Internal server error'
    );
  }
});

server.listen(PORT, () => {
  console.log('\n🎬 Batch Processing API Server');
  console.log('═══════════════════════════════════════');
  console.log(`📡 Running on http://localhost:${PORT}`);
  console.log('\n📚 Available Endpoints:');
  console.log(`   POST   /api/batches              - Submit batch`);
  console.log(`   GET    /api/batches              - List batches`);
  console.log(`   GET    /api/batches/:id          - Get status`);
  console.log(`   GET    /api/batches/:id/details  - Get details`);
  console.log(`   DELETE /api/batches/:id          - Cancel batch`);
  console.log(`   GET    /health                   - Health check`);
  console.log('\n💡 Example:');
  console.log(`   curl http://localhost:${PORT}/health`);
  console.log('\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⏹  Shutting down...');
  server.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });
});

export { server, batchHandler, jobQueue };
