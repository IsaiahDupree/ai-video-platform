/**
 * Public API Service - API-001, API-002, API-003
 * Public REST API for video generation with authentication, webhooks, and rate limiting
 */

import { createHash, randomBytes } from 'crypto';
import Redis from 'ioredis';

/**
 * API Key and plan information
 */
export interface APIKey {
  id: string;
  userId: string;
  key: string;
  name: string;
  planTier: 'free' | 'basic' | 'premium' | 'enterprise';
  monthlyQuota: number;
  currentUsage: number;
  rateLimitPerMinute: number;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
}

/**
 * Render job status
 */
export type RenderJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Public API Request
 */
export interface PublicAPIRequest {
  id: string;
  userId: string;
  apiKeyId: string;
  briefContent: any;
  status: RenderJobStatus;
  videoUrl?: string;
  errorMessage?: string;
  webhookUrl?: string;
  createdAt: string;
  completedAt?: string;
}

/**
 * Rate limiter using Redis
 */
class RateLimiter {
  private redis: Redis;
  private keyPrefix = 'rate_limit:';

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
    });
  }

  /**
   * Check if request is within rate limit
   */
  async checkLimit(apiKeyId: string, limitPerMinute: number): Promise<boolean> {
    const key = `${this.keyPrefix}${apiKeyId}`;
    const current = await this.redis.incr(key);

    if (current === 1) {
      await this.redis.expire(key, 60); // Reset every minute
    }

    return current <= limitPerMinute;
  }

  /**
   * Get remaining quota for this minute
   */
  async getRemaining(apiKeyId: string, limitPerMinute: number): Promise<number> {
    const key = `${this.keyPrefix}${apiKeyId}`;
    const current = parseInt((await this.redis.get(key)) || '0', 10);
    return Math.max(0, limitPerMinute - current);
  }
}

/**
 * Public API Service
 */
class PublicAPIService {
  private rateLimiter: RateLimiter;

  constructor() {
    this.rateLimiter = new RateLimiter();
  }

  /**
   * Generate API key
   */
  generateAPIKey(): string {
    return `sk_${randomBytes(24).toString('hex')}`;
  }

  /**
   * Hash API key for storage
   */
  hashAPIKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  /**
   * Verify API key
   */
  async verifyAPIKey(apiKey: string): Promise<APIKey | null> {
    // In production, lookup from Supabase
    // For now, return mock implementation
    const keyHash = this.hashAPIKey(apiKey);

    // Placeholder: would query Supabase for matching key
    return null;
  }

  /**
   * Check rate limit
   */
  async checkRateLimit(apiKey: APIKey): Promise<{ allowed: boolean; remaining: number }> {
    const allowed = await this.rateLimiter.checkLimit(apiKey.id, apiKey.rateLimitPerMinute);
    const remaining = await this.rateLimiter.getRemaining(apiKey.id, apiKey.rateLimitPerMinute);

    return { allowed, remaining };
  }

  /**
   * Submit video generation request
   */
  async submitRenderRequest(
    apiKey: APIKey,
    briefContent: any,
    webhookUrl?: string
  ): Promise<PublicAPIRequest> {
    // Check rate limit
    const { allowed } = await this.checkRateLimit(apiKey);
    if (!allowed) {
      throw new Error('Rate limit exceeded');
    }

    // Check quota
    if (apiKey.currentUsage >= apiKey.monthlyQuota) {
      throw new Error('Monthly quota exceeded');
    }

    // Create request record
    const request: PublicAPIRequest = {
      id: randomBytes(8).toString('hex'),
      userId: apiKey.userId,
      apiKeyId: apiKey.id,
      briefContent,
      status: 'pending',
      webhookUrl,
      createdAt: new Date().toISOString(),
    };

    // In production: save to Supabase and queue render job

    return request;
  }

  /**
   * Poll for render status
   */
  async getRenderStatus(apiKey: APIKey, requestId: string): Promise<PublicAPIRequest | null> {
    // In production: lookup from Supabase
    return null;
  }

  /**
   * Send webhook notification
   */
  async sendWebhookNotification(
    webhookUrl: string,
    event: 'render.completed' | 'render.failed',
    data: any
  ): Promise<void> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          data,
        }),
      });

      if (!response.ok) {
        console.error(`Webhook failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending webhook:', error);
    }
  }
}

// Singleton instance
let apiServiceInstance: PublicAPIService | null = null;

/**
 * Get public API service
 */
export function getPublicAPIService(): PublicAPIService {
  if (!apiServiceInstance) {
    apiServiceInstance = new PublicAPIService();
  }
  return apiServiceInstance;
}

/**
 * API endpoint helpers
 */
export async function verifyAndGetAPIKey(authHeader?: string): Promise<APIKey | null> {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const apiKey = authHeader.substring(7);
  const service = getPublicAPIService();
  return service.verifyAPIKey(apiKey);
}

export async function checkRateLimit(apiKey: APIKey) {
  const service = getPublicAPIService();
  return service.checkRateLimit(apiKey);
}

export async function submitRenderRequest(
  apiKey: APIKey,
  briefContent: any,
  webhookUrl?: string
) {
  const service = getPublicAPIService();
  return service.submitRenderRequest(apiKey, briefContent, webhookUrl);
}

/**
 * Plan limits configuration
 */
export const PLAN_LIMITS = {
  free: {
    monthlyQuota: 10,
    rateLimitPerMinute: 1,
    webhooks: false,
  },
  basic: {
    monthlyQuota: 100,
    rateLimitPerMinute: 10,
    webhooks: true,
  },
  premium: {
    monthlyQuota: 1000,
    rateLimitPerMinute: 100,
    webhooks: true,
  },
  enterprise: {
    monthlyQuota: 100000,
    rateLimitPerMinute: 1000,
    webhooks: true,
  },
};
