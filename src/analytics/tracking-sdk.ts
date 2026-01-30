/**
 * Remotion VideoStudio - Event Tracking SDK
 *
 * Captures user actions across the entire funnel and batches them for transmission.
 * Supports offline queuing, retry logic, and platform integrations (Meta Pixel, etc.)
 */

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// =============================================================================
// Schema
// =============================================================================

export const EventSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.string(),
  category: z.enum(['acquisition', 'activation', 'core_value', 'monetization', 'retention', 'referral']),
  timestamp: z.date(),

  personId: z.string().optional(),
  anonymousId: z.string().optional(),
  sessionId: z.string().optional(),

  deviceId: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),

  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmContent: z.string().optional(),
  utmTerm: z.string().optional(),

  properties: z.record(z.any()),
  revenue: z.number().optional(),
  currency: z.string().default('USD'),

  source: z.string().default('app'),
  sourceId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type Event = z.infer<typeof EventSchema>;

// =============================================================================
// Configuration
// =============================================================================

export interface TrackerConfig {
  appId: string;
  apiUrl: string;
  batchSize?: number;
  flushInterval?: number;
  debug?: boolean;
  platformIntegrations?: {
    metaPixel?: {
      pixelId: string;
      enabled: boolean;
    };
  };
}

// =============================================================================
// Tracking SDK
// =============================================================================

class TrackingSDK {
  private config: TrackerConfig | null = null;
  private queue: Event[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private batchSize: number = 10;
  private flushInterval: number = 5000;
  private personId: string | null = null;
  private anonymousId: string = '';
  private sessionId: string = '';
  private userProperties: Record<string, any> = {};
  private failedEvents: Event[] = [];
  private maxRetries = 3;
  private retryAttempts: Map<string, number> = new Map();

  /**
   * Initialize the tracking SDK
   */
  initialize(config: TrackerConfig): void {
    this.config = config;
    this.batchSize = config.batchSize || 10;
    this.flushInterval = config.flushInterval || 5000;

    // Generate session ID
    this.sessionId = this.generateSessionId();

    // Generate anonymous ID if not logged in
    this.anonymousId = this.getOrCreateAnonymousId();

    // Start auto-flush timer
    this.startAutoFlush();

    // Setup beforeunload to flush on page close
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush().catch(err => console.error('Final flush failed:', err));
      });
    }

    if (config.debug) {
      console.log('[Tracker] Initialized', { sessionId: this.sessionId, anonymousId: this.anonymousId });
    }
  }

  /**
   * Identify a user
   */
  identify(personId: string, properties?: Record<string, any>): void {
    this.personId = personId;
    if (properties) {
      this.userProperties = { ...this.userProperties, ...properties };
    }

    // Track identify event
    this.track('identify', {
      personId,
      ...properties
    }, { category: 'activation' });
  }

  /**
   * Set user properties
   */
  setUserProperty(key: string, value: any): void {
    this.userProperties[key] = value;
  }

  /**
   * Track an event
   */
  track(
    eventType: string,
    properties: Record<string, any> = {},
    overrides?: Partial<Event>
  ): string {
    if (!this.config) {
      console.warn('[Tracker] Not initialized. Call initialize() first.');
      return '';
    }

    const eventId = uuidv4();
    const event: Event = {
      eventId,
      eventType,
      category: overrides?.category || 'core_value',
      timestamp: new Date(),
      personId: this.personId || undefined,
      anonymousId: this.anonymousId,
      sessionId: this.sessionId,

      deviceId: this.getDeviceId(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',

      properties: { ...this.userProperties, ...properties },

      source: 'app',

      ...overrides
    };

    // Validate event
    try {
      EventSchema.parse(event);
    } catch (err) {
      console.error('[Tracker] Invalid event:', err, event);
      return '';
    }

    this.queue.push(event);

    if (this.config.debug) {
      console.log('[Tracker] Event queued:', eventType, properties);
    }

    // Auto-flush if batch size reached
    if (this.queue.length >= this.batchSize) {
      this.flush().catch(err => console.error('Auto-flush failed:', err));
    }

    // Fire platform integrations
    this.firePlatformEvents(event);

    return eventId;
  }

  /**
   * Record signup
   */
  recordSignup(email: string, properties?: Record<string, any>): void {
    this.track('signup_completed', {
      email,
      ...properties
    }, { category: 'acquisition' });
  }

  /**
   * Record login
   */
  recordLogin(email: string): void {
    this.identify(email);
    this.track('login_completed', { email }, { category: 'acquisition' });
  }

  /**
   * Record first video created
   */
  recordFirstVideo(briefId: string, template: string): void {
    this.track('first_video_created', {
      brief_id: briefId,
      template
    }, { category: 'activation' });
  }

  /**
   * Record first render
   */
  recordFirstRender(duration_ms: number, format: string): void {
    this.track('first_render_completed', {
      duration_ms,
      format
    }, { category: 'activation' });
  }

  /**
   * Record video rendered
   */
  recordVideoRendered(briefId: string, renderId: string, properties?: Record<string, any>): void {
    this.track('video_rendered', {
      brief_id: briefId,
      render_id: renderId,
      ...properties
    }, { category: 'core_value' });
  }

  /**
   * Record batch render started
   */
  recordBatchRenderStarted(jobId: string, videoCount: number): void {
    this.track('batch_render_started', {
      job_id: jobId,
      video_count: videoCount
    }, { category: 'core_value' });
  }

  /**
   * Record batch render completed
   */
  recordBatchRenderCompleted(jobId: string, videoCount: number, duration_ms: number): void {
    this.track('batch_render_completed', {
      job_id: jobId,
      video_count: videoCount,
      duration_ms
    }, { category: 'core_value' });
  }

  /**
   * Record checkout started
   */
  recordCheckoutStarted(planId: string, amount: number): void {
    this.track('checkout_started', {
      plan_id: planId,
      amount,
      currency: 'USD'
    }, { category: 'monetization', revenue: amount });
  }

  /**
   * Record purchase
   */
  recordPurchase(orderId: string, amount: number, plan: string): void {
    this.track('purchase_completed', {
      order_id: orderId,
      amount,
      plan,
      currency: 'USD'
    }, { category: 'monetization', revenue: amount });
  }

  /**
   * Record subscription renewal
   */
  recordSubscriptionRenewal(subscriptionId: string, amount: number): void {
    this.track('subscription_renewal', {
      subscription_id: subscriptionId,
      amount,
      currency: 'USD'
    }, { category: 'monetization', revenue: amount });
  }

  /**
   * Manually flush the event queue
   */
  async flush(): Promise<void> {
    if (!this.config || this.queue.length === 0) {
      return;
    }

    const batch = this.queue.splice(0, this.batchSize);

    if (this.config.debug) {
      console.log(`[Tracker] Flushing ${batch.length} events`);
    }

    try {
      const response = await this.sendBatch(batch);
      if (this.config.debug) {
        console.log('[Tracker] Batch sent successfully:', response);
      }
    } catch (err) {
      console.error('[Tracker] Failed to send batch:', err);

      // Add to failed events for retry
      this.failedEvents.push(...batch);

      // Retry failed events
      await this.retryFailedEvents();
    }
  }

  /**
   * Send batch of events to server
   */
  private async sendBatch(events: Event[]): Promise<any> {
    const response = await fetch(`${this.config!.apiUrl}/api/v1/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-ID': this.config!.appId
      },
      body: JSON.stringify({ events })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Retry failed events with exponential backoff
   */
  private async retryFailedEvents(): Promise<void> {
    if (this.failedEvents.length === 0) {
      return;
    }

    for (const event of this.failedEvents) {
      const attempts = this.retryAttempts.get(event.eventId) || 0;

      if (attempts >= this.maxRetries) {
        console.warn('[Tracker] Max retries exceeded for event:', event.eventId);
        this.failedEvents = this.failedEvents.filter(e => e.eventId !== event.eventId);
        continue;
      }

      // Exponential backoff: 1s, 4s, 16s
      const delay = Math.pow(2, attempts * 2) * 1000;

      setTimeout(async () => {
        try {
          await this.sendBatch([event]);
          this.retryAttempts.delete(event.eventId);
          this.failedEvents = this.failedEvents.filter(e => e.eventId !== event.eventId);
          if (this.config!.debug) {
            console.log('[Tracker] Retry successful for event:', event.eventId);
          }
        } catch (err) {
          this.retryAttempts.set(event.eventId, attempts + 1);
        }
      }, delay);
    }
  }

  /**
   * Fire platform-specific event handlers
   */
  private firePlatformEvents(event: Event): void {
    if (!this.config?.platformIntegrations?.metaPixel?.enabled) {
      return;
    }

    // Meta Pixel integration (client-side)
    if (typeof window !== 'undefined' && (window as any).fbq) {
      const fbq = (window as any).fbq;

      // Map events to Meta standard events
      switch (event.eventType) {
        case 'signup_completed':
          fbq('track', 'Lead', {
            value: 0,
            currency: 'USD'
          });
          break;
        case 'purchase_completed':
          fbq('track', 'Purchase', {
            value: event.revenue || event.properties.amount,
            currency: event.currency || 'USD',
            content_type: 'product'
          }, { eventID: event.eventId });
          break;
        case 'video_created':
          fbq('track', 'ViewContent', {
            content_name: event.properties.template,
            content_type: 'template'
          });
          break;
      }
    }
  }

  /**
   * Start auto-flush timer
   */
  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      if (this.queue.length > 0) {
        this.flush().catch(err => console.error('Auto-flush failed:', err));
      }
    }, this.flushInterval);
  }

  /**
   * Stop auto-flush timer
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    const sessionKey = 'remotion_session_id';
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(sessionKey);
      if (stored) {
        return stored;
      }
      const id = uuidv4();
      sessionStorage.setItem(sessionKey, id);
      return id;
    }
    return uuidv4();
  }

  /**
   * Get or create anonymous ID
   */
  private getOrCreateAnonymousId(): string {
    const anonKey = 'remotion_anon_id';
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(anonKey);
      if (stored) {
        return stored;
      }
      const id = uuidv4();
      localStorage.setItem(anonKey, id);
      return id;
    }
    return uuidv4();
  }

  /**
   * Get device ID (fingerprint)
   */
  private getDeviceId(): string {
    const deviceKey = 'remotion_device_id';
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(deviceKey);
      if (stored) {
        return stored;
      }
      // Simple device ID: User-Agent hash (in production, use a better fingerprinting library)
      const ua = window.navigator.userAgent;
      const id = `dev_${this.hashString(ua)}`;
      localStorage.setItem(deviceKey, id);
      return id;
    }
    return '';
  }

  /**
   * Simple hash function
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Get queued events (for testing)
   */
  getQueuedEvents(): Event[] {
    return [...this.queue];
  }

  /**
   * Get current session info (for debugging)
   */
  getSessionInfo(): any {
    return {
      sessionId: this.sessionId,
      anonymousId: this.anonymousId,
      personId: this.personId,
      userProperties: this.userProperties,
      queuedEvents: this.queue.length,
      failedEvents: this.failedEvents.length
    };
  }
}

// =============================================================================
// Global Singleton
// =============================================================================

let instance: TrackingSDK | null = null;

export function initializeTracker(config: TrackerConfig): TrackingSDK {
  if (!instance) {
    instance = new TrackingSDK();
  }
  instance.initialize(config);
  return instance;
}

export function getTracker(): TrackingSDK {
  if (!instance) {
    instance = new TrackingSDK();
  }
  return instance;
}

// Convenience export as 'tracker'
export const tracker = {
  get track() {
    return getTracker().track.bind(getTracker());
  },
  get identify() {
    return getTracker().identify.bind(getTracker());
  },
  get setUserProperty() {
    return getTracker().setUserProperty.bind(getTracker());
  },
  get recordSignup() {
    return getTracker().recordSignup.bind(getTracker());
  },
  get recordLogin() {
    return getTracker().recordLogin.bind(getTracker());
  },
  get recordFirstVideo() {
    return getTracker().recordFirstVideo.bind(getTracker());
  },
  get recordFirstRender() {
    return getTracker().recordFirstRender.bind(getTracker());
  },
  get recordVideoRendered() {
    return getTracker().recordVideoRendered.bind(getTracker());
  },
  get recordBatchRenderStarted() {
    return getTracker().recordBatchRenderStarted.bind(getTracker());
  },
  get recordBatchRenderCompleted() {
    return getTracker().recordBatchRenderCompleted.bind(getTracker());
  },
  get recordCheckoutStarted() {
    return getTracker().recordCheckoutStarted.bind(getTracker());
  },
  get recordPurchase() {
    return getTracker().recordPurchase.bind(getTracker());
  },
  get recordSubscriptionRenewal() {
    return getTracker().recordSubscriptionRenewal.bind(getTracker());
  },
  get flush() {
    return getTracker().flush.bind(getTracker());
  },
  get getSessionInfo() {
    return getTracker().getSessionInfo.bind(getTracker());
  }
};

// =============================================================================
// Testing Utilities
// =============================================================================

export function createMockTracker(): any {
  const trackedEvents: Event[] = [];

  return {
    track: (eventType: string, properties?: Record<string, any>) => {
      const event = {
        eventId: uuidv4(),
        eventType,
        timestamp: new Date(),
        properties: properties || {},
        category: 'core_value',
        source: 'app'
      } as Event;
      trackedEvents.push(event);
      return event.eventId;
    },
    getTrackedEvents: () => trackedEvents,
    getEventsByType: (type: string) => trackedEvents.filter(e => e.eventType === type),
    clear: () => {
      trackedEvents.length = 0;
    }
  };
}
