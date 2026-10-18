/**
 * Meta Pixel & Conversions API Integration
 *
 * Implements:
 * - META-001: Pixel SDK wrapper
 * - META-002: Event mapping from app to Meta standard events
 * - META-003: Conversions API for server-side tracking
 * - META-004: Event deduplication
 */

import crypto from 'crypto';

// =============================================================================
// Types
// =============================================================================

export interface MetaPixelConfig {
  pixelId: string;
  apiToken?: string;
  apiVersion?: string;
  testEventCode?: string;
  debug?: boolean;
  deduplicateWithinMs?: number;
}

export interface UserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  externalId?: string;
}

export interface CustomData {
  value?: number;
  currency?: string;
  contentName?: string;
  contentType?: string;
  contentIds?: string[];
  contents?: any[];
  numItems?: number;
  searchString?: string;
}

export interface MetaEvent {
  eventName: string;
  eventTime: number;
  eventId?: string;
  userData?: UserData;
  customData?: CustomData;
  eventSourceUrl?: string;
  userAgent?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
}

// =============================================================================
// Event Mapping
// =============================================================================

export const EVENT_MAPPING: Record<string, string> = {
  // Acquisition → Lead
  signup_completed: 'Lead',

  // Activation → ViewContent
  first_video_created: 'ViewContent',
  first_render_completed: 'ViewContent',
  feature_discovered: 'ViewContent',

  // Core value → AddToCart
  video_rendered: 'AddToCart',
  batch_render_completed: 'AddToCart',
  asset_generated: 'CustomizeProduct',
  voice_cloned: 'CustomizeProduct',

  // Monetization → Purchase
  purchase_completed: 'Purchase',
  subscription_renewal: 'Purchase',

  // Retention
  user_reengaged: 'Contact',
  help_accessed: 'FindLocation'
};

// =============================================================================
// Meta Pixel Integration
// =============================================================================

class MetaPixelClient {
  private config: MetaPixelConfig | null = null;
  private eventQueue: MetaEvent[] = [];
  private eventIds: Set<string> = new Set();
  private lastFlushTime = 0;
  private flushTimer: NodeJS.Timeout | null = null;

  /**
   * Initialize Meta Pixel
   */
  initialize(config: MetaPixelConfig): void {
    this.config = config;

    // Inject Pixel SDK into page
    this.injectPixelSdk();

    // Start auto-flush timer (every 5 seconds)
    this.startAutoFlush();

    if (config.debug) {
      console.log('[MetaPixel] Initialized with Pixel ID:', config.pixelId);
    }
  }

  /**
   * Track event via both Pixel SDK and Conversions API
   */
  trackEvent(
    appEventType: string,
    properties: Record<string, any>,
    userData?: UserData
  ): string {
    if (!this.config) {
      console.warn('[MetaPixel] Not initialized. Call initialize() first.');
      return '';
    }

    const metaEventName = EVENT_MAPPING[appEventType] || appEventType;
    const eventId = this.generateEventId(appEventType);

    // Map app properties to Meta custom data
    const customData = this.mapToCustomData(appEventType, properties);

    // Client-side tracking via Pixel
    this.trackPixel(metaEventName, customData, eventId);

    // Server-side tracking via Conversions API
    if (this.config.apiToken) {
      const metaEvent = this.buildMetaEvent(
        metaEventName,
        eventId,
        userData,
        customData,
        properties
      );
      this.eventQueue.push(metaEvent);

      // Auto-flush if queue is large
      if (this.eventQueue.length >= 10) {
        this.flush().catch(err => console.error('[MetaPixel] Flush failed:', err));
      }
    }

    return eventId;
  }

  /**
   * Track event via Pixel SDK (client-side)
   */
  private trackPixel(eventName: string, customData: CustomData, eventId: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    const fbq = (window as any).fbq;
    if (!fbq) {
      if (this.config?.debug) {
        console.warn('[MetaPixel] fbq not loaded');
      }
      return;
    }

    const params = {
      value: customData.value,
      currency: customData.currency,
      content_name: customData.contentName,
      content_type: customData.contentType,
      content_ids: customData.contentIds,
      contents: customData.contents
    };

    fbq('track', eventName, params, { eventID: eventId });

    if (this.config?.debug) {
      console.log('[MetaPixel] Pixel event tracked:', eventName, params);
    }
  }

  /**
   * Build Meta event for Conversions API
   */
  private buildMetaEvent(
    eventName: string,
    eventId: string,
    userData?: UserData,
    customData?: CustomData,
    properties?: Record<string, any>
  ): MetaEvent {
    return {
      eventName,
      eventTime: Math.floor(Date.now() / 1000),
      eventId,
      userData: userData
        ? this.hashUserData(userData)
        : this.getUserDataFromProperties(properties),
      customData,
      eventSourceUrl:
        typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent:
        typeof window !== 'undefined'
          ? window.navigator.userAgent
          : undefined,
      clientIpAddress: properties?.ip_address,
      clientUserAgent: properties?.user_agent
    };
  }

  /**
   * Hash user data for privacy (SHA-256)
   */
  private hashUserData(userData: UserData): any {
    const hashedData: any = {};

    if (userData.email) {
      hashedData.em = this.hashString(userData.email.toLowerCase().trim());
    }
    if (userData.phone) {
      const digits = userData.phone.replace(/\D/g, '');
      hashedData.ph = this.hashString(digits);
    }
    if (userData.firstName) {
      hashedData.fn = this.hashString(userData.firstName.toLowerCase().trim());
    }
    if (userData.lastName) {
      hashedData.ln = this.hashString(userData.lastName.toLowerCase().trim());
    }
    if (userData.city) {
      hashedData.ct = this.hashString(userData.city.toLowerCase().trim());
    }
    if (userData.state) {
      hashedData.st = this.hashString(userData.state.toLowerCase().trim());
    }
    if (userData.zipCode) {
      hashedData.zp = this.hashString(userData.zipCode.toLowerCase().trim());
    }
    if (userData.country) {
      hashedData.country = this.hashString(userData.country.toLowerCase().trim());
    }
    if (userData.externalId) {
      hashedData.external_id = this.hashString(userData.externalId);
    }

    return hashedData;
  }

  /**
   * Extract user data from event properties
   */
  private getUserDataFromProperties(properties?: Record<string, any>): any {
    if (!properties) {
      return {};
    }

    const userData: any = {};
    if (properties.email) {
      userData.em = this.hashString(properties.email.toLowerCase().trim());
    }
    if (properties.phone) {
      const digits = properties.phone.replace(/\D/g, '');
      userData.ph = this.hashString(digits);
    }
    return userData;
  }

  /**
   * Map app event properties to Meta custom data
   */
  private mapToCustomData(
    appEventType: string,
    properties: Record<string, any>
  ): CustomData {
    const customData: CustomData = {};

    // Revenue
    if (properties.amount) {
      customData.value = properties.amount;
      customData.currency = properties.currency || 'USD';
    } else if (properties.revenue) {
      customData.value = properties.revenue;
      customData.currency = 'USD';
    }

    // Content
    if (properties.template) {
      customData.contentName = properties.template;
      customData.contentType = 'template';
    }
    if (properties.brief_id) {
      customData.contentIds = [properties.brief_id];
      customData.contentName = `Brief ${properties.brief_id}`;
    }
    if (properties.plan) {
      customData.contentName = properties.plan;
      customData.contentType = 'product';
    }

    // Items
    if (properties.video_count) {
      customData.numItems = properties.video_count;
    }

    return customData;
  }

  /**
   * Send batch to Conversions API
   */
  async flush(): Promise<void> {
    if (!this.config?.apiToken || this.eventQueue.length === 0) {
      return;
    }

    const batch = this.eventQueue.splice(0, 100);

    if (this.config.debug) {
      console.log(`[MetaPixel] Flushing ${batch.length} events to CAPI`);
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.config.apiVersion || 'v18.0'}/${
          this.config.pixelId
        }/events`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            data: batch,
            access_token: this.config.apiToken,
            ...(this.config.testEventCode && {
              test_event_code: this.config.testEventCode
            })
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (this.config.debug) {
        console.log('[MetaPixel] CAPI response:', result);
      }

      this.lastFlushTime = Date.now();
    } catch (err) {
      console.error('[MetaPixel] Failed to send batch:', err);
      // Re-queue events
      this.eventQueue.unshift(...batch);
    }
  }

  /**
   * Inject Pixel SDK into page (META-001)
   */
  private injectPixelSdk(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Check if already injected
    if ((window as any).fbq) {
      return;
    }

    const pixelId = this.config!.pixelId;

    // Create and inject Pixel SDK script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';

    script.onload = () => {
      const fbq = (window as any).fbq;
      fbq('init', pixelId);
      fbq('track', 'PageView');
    };

    document.head.appendChild(script);

    // Create noscript fallback
    const noscript = document.createElement('noscript');
    const img = document.createElement('img');
    img.height = 1;
    img.width = 1;
    img.style.display = 'none';
    img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
    noscript.appendChild(img);
    document.body.appendChild(noscript);

    if (this.config?.debug) {
      console.log('[MetaPixel] Pixel SDK injected');
    }
  }

  /**
   * Generate event ID for deduplication (META-004)
   */
  private generateEventId(appEventType: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(16).slice(2);
    const eventId = `evt_${timestamp}_${random}`;

    // Track for deduplication window
    this.eventIds.add(eventId);

    // Clean up old IDs after deduplication window
    const deduplicateMs = this.config?.deduplicateWithinMs || 15000;
    setTimeout(() => {
      this.eventIds.delete(eventId);
    }, deduplicateMs);

    return eventId;
  }

  /**
   * Check if event ID was already tracked (for deduplication)
   */
  isDuplicate(eventId: string): boolean {
    return this.eventIds.has(eventId);
  }

  /**
   * Start auto-flush timer
   */
  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flush().catch(err => console.error('[MetaPixel] Auto-flush failed:', err));
      }
    }, 5000);
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
   * Hash string using SHA-256
   */
  private hashString(str: string): string {
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  /**
   * Get queued events (for testing)
   */
  getQueuedEvents(): MetaEvent[] {
    return [...this.eventQueue];
  }

  /**
   * Get debug info
   */
  getDebugInfo(): any {
    return {
      pixelId: this.config?.pixelId,
      queuedEvents: this.eventQueue.length,
      trackedEventIds: this.eventIds.size,
      lastFlushTime: this.lastFlushTime
    };
  }
}

// =============================================================================
// Global Singleton
// =============================================================================

let instance: MetaPixelClient | null = null;

export function initializeMetaPixel(config: MetaPixelConfig): MetaPixelClient {
  if (!instance) {
    instance = new MetaPixelClient();
  }
  instance.initialize(config);
  return instance;
}

export function getMetaPixelClient(): MetaPixelClient {
  if (!instance) {
    instance = new MetaPixelClient();
  }
  return instance;
}

// Convenience exports
export const metaPixel = {
  get initialize() {
    return initializeMetaPixel;
  },
  get trackEvent() {
    return getMetaPixelClient().trackEvent.bind(getMetaPixelClient());
  },
  get flush() {
    return getMetaPixelClient().flush.bind(getMetaPixelClient());
  },
  get getDebugInfo() {
    return getMetaPixelClient().getDebugInfo.bind(getMetaPixelClient());
  }
};

// =============================================================================
// Testing Utilities
// =============================================================================

export function createMockMetaPixel() {
  const trackedEvents: any[] = [];
  const flushedBatches: any[] = [];

  return {
    trackEvent: (eventType: string, properties?: Record<string, any>) => {
      trackedEvents.push({ eventType, properties, timestamp: new Date() });
      return `evt_${trackedEvents.length}`;
    },
    flush: async () => {
      if (trackedEvents.length > 0) {
        flushedBatches.push([...trackedEvents]);
        trackedEvents.length = 0;
      }
    },
    getTrackedEvents: () => trackedEvents,
    getFlushedBatches: () => flushedBatches,
    clear: () => {
      trackedEvents.length = 0;
      flushedBatches.length = 0;
    }
  };
}
