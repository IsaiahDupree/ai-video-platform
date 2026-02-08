/**
 * REST API Gateway
 *
 * Provides FastAPI-like gateway with:
 * - Request authentication
 * - Rate limiting
 * - Webhook callbacks
 * - Job tracking
 *
 * This is a Node.js implementation that can be deployed as a serverless function
 * or standalone HTTP server.
 */

import * as http from 'http';
import { URL } from 'url';

// =============================================================================
// Types
// =============================================================================

export interface APIRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: any;
  timestamp: number;
  clientId?: string;
}

export interface APIResponse {
  status: number;
  body: any;
  headers?: Record<string, string>;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  burstSize: number;
}

export interface WebhookConfig {
  url: string;
  events: string[];
  secret?: string;
}

export interface GatewayConfig {
  port?: number;
  apiKey?: string;
  rateLimit?: RateLimitConfig;
  webhooks?: WebhookConfig[];
  enableCors?: boolean;
  corsOrigins?: string[];
}

// =============================================================================
// Rate Limiter
// =============================================================================

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  isAllowed(clientId: string): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    // Get or create request times for this client
    let times = this.requests.get(clientId) || [];

    // Filter old requests
    times = times.filter(t => t > oneHourAgo);

    // Check minute limit
    const recentMinute = times.filter(t => t > oneMinuteAgo).length;
    if (recentMinute >= this.config.requestsPerMinute) {
      return false;
    }

    // Check hour limit
    if (times.length >= this.config.requestsPerHour) {
      return false;
    }

    // Add current request
    times.push(now);
    this.requests.set(clientId, times);

    return true;
  }

  getRemainingRequests(clientId: string): { minute: number; hour: number } {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    let times = this.requests.get(clientId) || [];
    times = times.filter(t => t > oneHourAgo);

    const recentMinute = times.filter(t => t > oneMinuteAgo).length;
    const recentHour = times.length;

    return {
      minute: Math.max(0, this.config.requestsPerMinute - recentMinute),
      hour: Math.max(0, this.config.requestsPerHour - recentHour),
    };
  }
}

// =============================================================================
// Webhook Manager
// =============================================================================

class WebhookManager {
  private hooks: WebhookConfig[] = [];

  addHook(hook: WebhookConfig): void {
    this.hooks.push(hook);
  }

  removeHook(url: string): void {
    this.hooks = this.hooks.filter(h => h.url !== url);
  }

  async trigger(event: string, payload: any): Promise<void> {
    const promises = this.hooks
      .filter(h => h.events.includes(event))
      .map(h => this.sendWebhook(h, event, payload));

    await Promise.allSettled(promises);
  }

  private async sendWebhook(
    hook: WebhookConfig,
    event: string,
    payload: any
  ): Promise<void> {
    const body = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      payload,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body).toString(),
    };

    if (hook.secret) {
      // Add webhook signature for verification
      const crypto = require('crypto');
      const signature = crypto
        .createHmac('sha256', hook.secret)
        .update(body)
        .digest('hex');
      headers['X-Webhook-Signature'] = signature;
    }

    return new Promise((resolve, reject) => {
      try {
        const url = new URL(hook.url);
        const client = url.protocol === 'https:' ? require('https') : require('http');

        const req = client.request(
          {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: 'POST',
            headers,
            timeout: 30000,
          },
          (res: any) => {
            let data = '';
            res.on('data', (chunk: any) => (data += chunk));
            res.on('end', () => resolve());
          }
        );

        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Webhook timeout'));
        });

        req.write(body);
        req.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

// =============================================================================
// Request Router
// =============================================================================

export type RouteHandler = (
  req: APIRequest,
  res: APIResponse
) => Promise<void> | void;

interface Route {
  method: string;
  path: RegExp;
  handler: RouteHandler;
}

class Router {
  private routes: Route[] = [];

  register(method: string, path: string, handler: RouteHandler): void {
    // Convert path pattern to regex (e.g., /api/jobs/:id -> /api/jobs/[^/]+)
    const pattern = path
      .replace(/:[^/]+/g, '[^/]+')
      .replace(/\//g, '\\/')
      .replace(/\*/g, '.*');

    this.routes.push({
      method: method.toUpperCase(),
      path: new RegExp(`^${pattern}$`),
      handler,
    });
  }

  async handle(req: APIRequest): Promise<RouteHandler | undefined> {
    const route = this.routes.find(
      r => r.method === req.method.toUpperCase() && r.path.test(req.path)
    );
    return route?.handler;
  }
}

// =============================================================================
// API Gateway Server
// =============================================================================

export class APIGateway {
  private config: GatewayConfig;
  private rateLimiter: RateLimiter;
  private webhookManager: WebhookManager;
  private router: Router;
  private server?: http.Server;

  constructor(config: GatewayConfig = {}) {
    this.config = {
      port: config.port || 3000,
      rateLimit: config.rateLimit || {
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        burstSize: 10,
      },
      enableCors: config.enableCors ?? true,
      corsOrigins: config.corsOrigins || ['*'],
      ...config,
    };

    this.rateLimiter = new RateLimiter(this.config.rateLimit!);
    this.webhookManager = new WebhookManager();
    this.router = new Router();
  }

  // Register endpoints
  registerRoute(method: string, path: string, handler: RouteHandler): void {
    this.router.register(method, path, handler);
  }

  // Webhook management
  addWebhook(hook: WebhookConfig): void {
    this.webhookManager.addHook(hook);
  }

  removeWebhook(url: string): void {
    this.webhookManager.removeHook(url);
  }

  // Trigger webhook events
  async trigger(event: string, payload: any): Promise<void> {
    await this.webhookManager.trigger(event, payload);
  }

  // Public paths that don't require authentication
  private publicPaths = new Set([
    '/health',
    '/health/ready',
    '/docs',
    '/api/v1/openapi.json',
  ]);

  // Check if path is public
  private isPublicPath(path: string): boolean {
    return this.publicPaths.has(path);
  }

  // Middleware for authentication
  private authenticate(req: APIRequest): boolean {
    // Skip auth for public paths
    if (this.isPublicPath(req.path)) return true;

    if (!this.config.apiKey) return true;

    const authHeader = req.headers.authorization || req.headers['x-api-key'];
    return authHeader === `Bearer ${this.config.apiKey}` ||
           authHeader === this.config.apiKey;
  }

  // Middleware for rate limiting
  private checkRateLimit(clientId: string): { allowed: boolean; remaining: any } {
    const allowed = this.rateLimiter.isAllowed(clientId);
    const remaining = this.rateLimiter.getRemainingRequests(clientId);
    return { allowed, remaining };
  }

  // Start server
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer(async (httpReq, httpRes) => {
        try {
          // Parse URL and body
          const url = new URL(httpReq.url || '/', `http://${httpReq.headers.host}`);
          const path = url.pathname;
          const method = httpReq.method || 'GET';

          // Parse request body
          let body: any = undefined;
          if (['POST', 'PUT', 'PATCH'].includes(method)) {
            body = await this.parseBody(httpReq);
          }

          // Create API request
          const req: APIRequest = {
            method,
            path,
            headers: httpReq.headers as Record<string, string>,
            body,
            timestamp: Date.now(),
            clientId: httpReq.headers['x-client-id'] as string ||
                     httpReq.socket.remoteAddress,
          };

          // Apply CORS headers
          if (this.config.enableCors) {
            const origin = httpReq.headers.origin as string || '*';
            if (this.config.corsOrigins!.includes('*') || this.config.corsOrigins!.includes(origin)) {
              httpRes.setHeader('Access-Control-Allow-Origin', origin);
              httpRes.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
              httpRes.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Client-ID');
            }
          }

          // Handle OPTIONS (CORS preflight)
          if (method === 'OPTIONS') {
            httpRes.writeHead(200);
            httpRes.end();
            return;
          }

          // Authenticate
          if (!this.authenticate(req)) {
            this.sendResponse(httpRes, {
              status: 401,
              body: { error: 'Unauthorized' },
            });
            return;
          }

          // Rate limiting
          const clientId = req.clientId!;
          const { allowed, remaining } = this.checkRateLimit(clientId);
          if (!allowed) {
            this.sendResponse(httpRes, {
              status: 429,
              body: { error: 'Rate limit exceeded', remaining },
              headers: {
                'Retry-After': '60',
                'X-RateLimit-Remaining-Minute': remaining.minute.toString(),
                'X-RateLimit-Remaining-Hour': remaining.hour.toString(),
              },
            });
            return;
          }

          // Route request
          const handler = await this.router.handle(req);
          if (!handler) {
            this.sendResponse(httpRes, {
              status: 404,
              body: { error: 'Not found' },
            });
            return;
          }

          // Create response object
          const res: APIResponse = {
            status: 200,
            body: {},
          };

          // Execute handler
          await handler(req, res);

          // Send response
          this.sendResponse(httpRes, res);
        } catch (err) {
          console.error('Request error:', err);
          this.sendResponse(httpRes, {
            status: 500,
            body: { error: 'Internal server error' },
          });
        }
      });

      this.server.listen(this.config.port, () => {
        console.log(`API Gateway listening on port ${this.config.port}`);
        resolve();
      });

      this.server.on('error', reject);
    });
  }

  private parseBody(httpReq: http.IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      let data = '';
      httpReq.on('data', chunk => (data += chunk));
      httpReq.on('end', () => {
        try {
          resolve(data ? JSON.parse(data) : undefined);
        } catch (err) {
          reject(err);
        }
      });
      httpReq.on('error', reject);
    });
  }

  private sendResponse(
    httpRes: http.ServerResponse,
    res: APIResponse
  ): void {
    const headers = {
      'Content-Type': 'application/json',
      ...res.headers,
    };

    httpRes.writeHead(res.status, headers);

    // Handle different content types
    const ct = headers['Content-Type'];
    if (ct === 'text/html' || ct === 'text/csv' || ct === 'text/plain') {
      httpRes.end(res.body);
    } else {
      httpRes.end(JSON.stringify(res.body));
    }
  }

  // Stop server
  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }
      this.server.close(err => (err ? reject(err) : resolve()));
    });
  }
}

export default APIGateway;
