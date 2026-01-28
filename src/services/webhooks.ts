/**
 * Webhook Service - ADS-017
 * Webhook notification system for render job completion events
 *
 * Provides webhook registration, HTTP POST notifications with retry logic,
 * and HMAC signature verification for secure webhook delivery.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { RenderJobResult } from './renderQueue';

/**
 * Webhook event types
 */
export enum WebhookEventType {
  RENDER_COMPLETE = 'render.complete',
  RENDER_FAILED = 'render.failed',
  RENDER_STARTED = 'render.started',
  BATCH_COMPLETE = 'batch.complete',
  BATCH_FAILED = 'batch.failed',
}

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  id: string;
  url: string;
  events: WebhookEventType[];
  secret: string;
  enabled: boolean;
  metadata?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

/**
 * Webhook payload for render completion
 */
export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: number;
  jobId: string;
  data: RenderJobResult | any;
  metadata?: Record<string, any>;
}

/**
 * Webhook delivery attempt
 */
export interface WebhookDelivery {
  webhookId: string;
  payload: WebhookPayload;
  attemptNumber: number;
  maxAttempts: number;
  timestamp: number;
  url: string;
  statusCode?: number;
  success: boolean;
  error?: string;
  responseTime?: number;
}

/**
 * Webhook delivery options
 */
export interface WebhookDeliveryOptions {
  maxAttempts?: number;
  retryDelay?: number;
  timeout?: number;
  backoffMultiplier?: number;
}

/**
 * Webhook storage
 */
interface WebhookStorage {
  webhooks: WebhookConfig[];
  deliveries: WebhookDelivery[];
}

/**
 * Default delivery options
 */
const DEFAULT_DELIVERY_OPTIONS: Required<WebhookDeliveryOptions> = {
  maxAttempts: 3,
  retryDelay: 1000, // 1 second
  timeout: 30000, // 30 seconds
  backoffMultiplier: 2, // Exponential backoff: 1s, 2s, 4s
};

/**
 * WebhookService class
 */
export class WebhookService {
  private storageDir: string;
  private storageFile: string;
  private deliveryOptions: Required<WebhookDeliveryOptions>;

  constructor(
    storageDir: string = 'data/webhooks',
    deliveryOptions?: WebhookDeliveryOptions
  ) {
    this.storageDir = storageDir;
    this.storageFile = path.join(storageDir, 'webhooks.json');
    this.deliveryOptions = {
      ...DEFAULT_DELIVERY_OPTIONS,
      ...deliveryOptions,
    };
    this.ensureStorageExists();
  }

  /**
   * Ensure storage directory and file exist
   */
  private ensureStorageExists(): void {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
    if (!fs.existsSync(this.storageFile)) {
      this.saveStorage({ webhooks: [], deliveries: [] });
    }
  }

  /**
   * Load storage from disk
   */
  private loadStorage(): WebhookStorage {
    try {
      const data = fs.readFileSync(this.storageFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load webhook storage:', error);
      return { webhooks: [], deliveries: [] };
    }
  }

  /**
   * Save storage to disk
   */
  private saveStorage(storage: WebhookStorage): void {
    try {
      fs.writeFileSync(this.storageFile, JSON.stringify(storage, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save webhook storage:', error);
      throw error;
    }
  }

  /**
   * Generate a random secret for webhook signing
   */
  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Register a new webhook
   */
  registerWebhook(
    url: string,
    events: WebhookEventType[],
    metadata?: Record<string, any>
  ): WebhookConfig {
    const storage = this.loadStorage();

    const webhook: WebhookConfig = {
      id: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url,
      events,
      secret: this.generateSecret(),
      enabled: true,
      metadata,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    storage.webhooks.push(webhook);
    this.saveStorage(storage);

    return webhook;
  }

  /**
   * Get a webhook by ID
   */
  getWebhook(webhookId: string): WebhookConfig | null {
    const storage = this.loadStorage();
    return storage.webhooks.find((w) => w.id === webhookId) || null;
  }

  /**
   * Get all webhooks
   */
  getAllWebhooks(): WebhookConfig[] {
    const storage = this.loadStorage();
    return storage.webhooks;
  }

  /**
   * Get webhooks for a specific event
   */
  getWebhooksForEvent(event: WebhookEventType): WebhookConfig[] {
    const storage = this.loadStorage();
    return storage.webhooks.filter(
      (w) => w.enabled && w.events.includes(event)
    );
  }

  /**
   * Update a webhook
   */
  updateWebhook(
    webhookId: string,
    updates: Partial<Pick<WebhookConfig, 'url' | 'events' | 'enabled' | 'metadata'>>
  ): WebhookConfig | null {
    const storage = this.loadStorage();
    const webhook = storage.webhooks.find((w) => w.id === webhookId);

    if (!webhook) {
      return null;
    }

    Object.assign(webhook, updates, { updatedAt: Date.now() });
    this.saveStorage(storage);

    return webhook;
  }

  /**
   * Delete a webhook
   */
  deleteWebhook(webhookId: string): boolean {
    const storage = this.loadStorage();
    const initialLength = storage.webhooks.length;
    storage.webhooks = storage.webhooks.filter((w) => w.id !== webhookId);

    if (storage.webhooks.length < initialLength) {
      this.saveStorage(storage);
      return true;
    }

    return false;
  }

  /**
   * Rotate webhook secret
   */
  rotateSecret(webhookId: string): WebhookConfig | null {
    const storage = this.loadStorage();
    const webhook = storage.webhooks.find((w) => w.id === webhookId);

    if (!webhook) {
      return null;
    }

    webhook.secret = this.generateSecret();
    webhook.updatedAt = Date.now();
    this.saveStorage(storage);

    return webhook;
  }

  /**
   * Send webhook notification with retries
   */
  async sendWebhook(
    webhook: WebhookConfig,
    payload: WebhookPayload
  ): Promise<WebhookDelivery> {
    let lastError: string | undefined;
    let lastStatusCode: number | undefined;
    let lastResponseTime: number | undefined;

    for (let attempt = 1; attempt <= this.deliveryOptions.maxAttempts; attempt++) {
      try {
        const delivery = await this.attemptDelivery(webhook, payload, attempt);

        // Save delivery record
        this.saveDelivery(delivery);

        // If successful, return immediately
        if (delivery.success) {
          return delivery;
        }

        // Store error details for retry
        lastError = delivery.error;
        lastStatusCode = delivery.statusCode;
        lastResponseTime = delivery.responseTime;

        // If not the last attempt, wait before retrying
        if (attempt < this.deliveryOptions.maxAttempts) {
          const delay =
            this.deliveryOptions.retryDelay *
            Math.pow(this.deliveryOptions.backoffMultiplier, attempt - 1);
          await this.sleep(delay);
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
    }

    // All attempts failed
    const finalDelivery: WebhookDelivery = {
      webhookId: webhook.id,
      payload,
      attemptNumber: this.deliveryOptions.maxAttempts,
      maxAttempts: this.deliveryOptions.maxAttempts,
      timestamp: Date.now(),
      url: webhook.url,
      statusCode: lastStatusCode,
      success: false,
      error: lastError || 'All delivery attempts failed',
      responseTime: lastResponseTime,
    };

    this.saveDelivery(finalDelivery);
    return finalDelivery;
  }

  /**
   * Attempt a single webhook delivery
   */
  private async attemptDelivery(
    webhook: WebhookConfig,
    payload: WebhookPayload,
    attemptNumber: number
  ): Promise<WebhookDelivery> {
    const startTime = Date.now();
    const payloadJson = JSON.stringify(payload);
    const signature = this.generateSignature(payloadJson, webhook.secret);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.deliveryOptions.timeout
      );

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-ID': webhook.id,
          'X-Webhook-Event': payload.event,
          'User-Agent': 'AI-Video-Platform-Webhooks/1.0',
        },
        body: payloadJson,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;
      const success = response.ok; // 2xx status codes

      return {
        webhookId: webhook.id,
        payload,
        attemptNumber,
        maxAttempts: this.deliveryOptions.maxAttempts,
        timestamp: startTime,
        url: webhook.url,
        statusCode: response.status,
        success,
        error: success ? undefined : `HTTP ${response.status}: ${response.statusText}`,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        webhookId: webhook.id,
        payload,
        attemptNumber,
        maxAttempts: this.deliveryOptions.maxAttempts,
        timestamp: startTime,
        url: webhook.url,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        responseTime,
      };
    }
  }

  /**
   * Trigger webhooks for a specific event
   */
  async triggerWebhooks(
    event: WebhookEventType,
    jobId: string,
    data: any,
    metadata?: Record<string, any>
  ): Promise<WebhookDelivery[]> {
    const webhooks = this.getWebhooksForEvent(event);

    if (webhooks.length === 0) {
      return [];
    }

    const payload: WebhookPayload = {
      event,
      timestamp: Date.now(),
      jobId,
      data,
      metadata,
    };

    // Send webhooks in parallel
    const deliveries = await Promise.all(
      webhooks.map((webhook) => this.sendWebhook(webhook, payload))
    );

    return deliveries;
  }

  /**
   * Save a delivery record
   */
  private saveDelivery(delivery: WebhookDelivery): void {
    const storage = this.loadStorage();
    storage.deliveries.push(delivery);

    // Keep only the last 1000 deliveries to prevent unbounded growth
    if (storage.deliveries.length > 1000) {
      storage.deliveries = storage.deliveries.slice(-1000);
    }

    this.saveStorage(storage);
  }

  /**
   * Get delivery history for a webhook
   */
  getDeliveryHistory(webhookId: string, limit: number = 100): WebhookDelivery[] {
    const storage = this.loadStorage();
    return storage.deliveries
      .filter((d) => d.webhookId === webhookId)
      .slice(-limit);
  }

  /**
   * Get all delivery history
   */
  getAllDeliveryHistory(limit: number = 100): WebhookDelivery[] {
    const storage = this.loadStorage();
    return storage.deliveries.slice(-limit);
  }

  /**
   * Get delivery statistics for a webhook
   */
  getDeliveryStats(webhookId: string): {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    avgResponseTime: number;
  } {
    const deliveries = this.getDeliveryHistory(webhookId, 1000);
    const successful = deliveries.filter((d) => d.success).length;
    const failed = deliveries.length - successful;
    const successRate = deliveries.length > 0 ? (successful / deliveries.length) * 100 : 0;

    const totalResponseTime = deliveries
      .filter((d) => d.responseTime !== undefined)
      .reduce((sum, d) => sum + (d.responseTime || 0), 0);
    const avgResponseTime =
      deliveries.length > 0 ? totalResponseTime / deliveries.length : 0;

    return {
      total: deliveries.length,
      successful,
      failed,
      successRate: Math.round(successRate * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime),
    };
  }

  /**
   * Verify webhook signature
   */
  verifySignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const expectedSignature = this.generateSignature(payload, secret);

    // If lengths don't match, return false immediately
    if (signature.length !== expectedSignature.length) {
      return false;
    }

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Clear all delivery history
   */
  clearDeliveryHistory(): void {
    const storage = this.loadStorage();
    storage.deliveries = [];
    this.saveStorage(storage);
  }

  /**
   * Test a webhook by sending a test payload
   */
  async testWebhook(webhookId: string): Promise<WebhookDelivery> {
    const webhook = this.getWebhook(webhookId);

    if (!webhook) {
      throw new Error(`Webhook not found: ${webhookId}`);
    }

    const testPayload: WebhookPayload = {
      event: WebhookEventType.RENDER_COMPLETE,
      timestamp: Date.now(),
      jobId: 'test-job-id',
      data: {
        success: true,
        results: [],
        totalRendered: 1,
        totalFailed: 0,
        startTime: Date.now(),
        endTime: Date.now(),
        duration: 1000,
      },
      metadata: {
        test: true,
        message: 'This is a test webhook delivery',
      },
    };

    return this.sendWebhook(webhook, testPayload);
  }
}

/**
 * Create a singleton instance of the webhook service
 */
let webhookServiceInstance: WebhookService | null = null;

/**
 * Get the webhook service instance (singleton)
 */
export function getWebhookService(
  storageDir?: string,
  deliveryOptions?: WebhookDeliveryOptions
): WebhookService {
  if (!webhookServiceInstance) {
    webhookServiceInstance = new WebhookService(storageDir, deliveryOptions);
  }
  return webhookServiceInstance;
}

/**
 * Reset the webhook service instance (useful for testing)
 */
export function resetWebhookService(): void {
  webhookServiceInstance = null;
}
