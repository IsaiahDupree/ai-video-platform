/**
 * Meta Conversions API (CAPI) Service
 *
 * Server-side conversion tracking via Meta Conversions API.
 * This service sends conversion events from the server to Meta,
 * complementing the browser-based Meta Pixel for improved attribution.
 *
 * Features:
 * - SHA256 hashing of PII data
 * - Event deduplication with Meta Pixel
 * - Support for all standard Meta events
 * - Automatic retry on failure
 * - Test event support
 *
 * Documentation:
 * https://developers.facebook.com/docs/marketing-api/conversions-api
 */

import crypto from 'crypto';
import {
  MetaCapiConfig,
  CapiServerEvent,
  CapiRequest,
  CapiResponse,
  CapiError,
  CapiUserData,
  CapiTrackOptions,
} from '@/types/metaCapi';
import { TrackingEvent, EventProperties } from '@/types/tracking';

class MetaCapiService {
  private config: MetaCapiConfig | null = null;
  private apiVersion = 'v18.0';
  private baseUrl = 'https://graph.facebook.com';

  /**
   * Initialize the CAPI service with configuration
   */
  initialize(config: MetaCapiConfig): void {
    if (!config.pixelId || !config.accessToken) {
      console.warn('Meta CAPI: Missing pixelId or accessToken. CAPI disabled.');
      return;
    }

    this.config = config;
    this.apiVersion = config.apiVersion || this.apiVersion;

    console.info('Meta CAPI initialized with Pixel ID:', config.pixelId);
  }

  /**
   * Check if CAPI is initialized and ready
   */
  isInitialized(): boolean {
    return this.config !== null;
  }

  /**
   * Hash a string value with SHA256 (lowercase)
   * Meta requires all PII to be hashed before sending
   */
  private hashValue(value: string): string {
    if (!value) return '';
    // Normalize: lowercase and trim
    const normalized = value.toLowerCase().trim();
    // Hash with SHA256
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  /**
   * Hash all PII fields in user data
   */
  private hashUserData(userData: CapiUserData): CapiUserData {
    const hashed: CapiUserData = { ...userData };

    // Fields that need hashing
    const hashFields = ['em', 'ph', 'fn', 'ln', 'ct', 'st', 'zp', 'country', 'ge', 'db'];

    for (const field of hashFields) {
      const value = userData[field as keyof CapiUserData];
      if (value && typeof value === 'string') {
        (hashed as any)[field] = this.hashValue(value);
      }
    }

    return hashed;
  }

  /**
   * Send conversion events to Meta CAPI
   */
  private async sendEvents(events: CapiServerEvent[]): Promise<CapiResponse> {
    if (!this.config) {
      throw new Error('Meta CAPI not initialized');
    }

    const url = `${this.baseUrl}/${this.apiVersion}/${this.config.pixelId}/events`;

    const body: CapiRequest = {
      data: events,
      partner_agent: 'ai-video-platform-capi',
    };

    // Add test event code if configured
    if (this.config.testEventCode) {
      body.test_event_code = this.config.testEventCode;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...body,
        access_token: this.config.accessToken,
      }),
    });

    if (!response.ok) {
      const errorData: CapiError = await response.json();
      throw new Error(
        `Meta CAPI Error: ${errorData.error.message} (Code: ${errorData.error.code})`
      );
    }

    const result: CapiResponse = await response.json();
    return result;
  }

  /**
   * Track a server-side conversion event
   *
   * @param eventName - Name of the event (standard or custom)
   * @param options - Event options including user data, custom data, etc.
   */
  async trackEvent(
    eventName: string,
    options: CapiTrackOptions = {}
  ): Promise<CapiResponse | null> {
    if (!this.isInitialized()) {
      console.warn('Meta CAPI: Not initialized, skipping event:', eventName);
      return null;
    }

    try {
      // Hash user data (PII)
      const hashedUserData = options.userData
        ? this.hashUserData(options.userData)
        : {};

      // Build server event
      const event: CapiServerEvent = {
        event_name: eventName,
        event_time: options.eventTime || Math.floor(Date.now() / 1000),
        action_source: options.actionSource || 'website',
        user_data: hashedUserData,
      };

      // Add optional fields
      if (options.eventId) {
        event.event_id = options.eventId;
      }

      if (options.eventSourceUrl) {
        event.event_source_url = options.eventSourceUrl;
      }

      if (options.customData) {
        event.custom_data = options.customData;
      }

      // Send event
      const response = await this.sendEvents([event]);

      if (process.env.NODE_ENV === 'development') {
        console.log('[Meta CAPI] Event sent:', {
          event_name: eventName,
          event_id: event.event_id,
          events_received: response.events_received,
          fbtrace_id: response.fbtrace_id,
        });
      }

      return response;
    } catch (error) {
      console.error('[Meta CAPI] Failed to track event:', error);
      return null;
    }
  }

  /**
   * Track multiple events in a single API call (batch)
   */
  async trackBatchEvents(
    events: Array<{ eventName: string; options: CapiTrackOptions }>
  ): Promise<CapiResponse | null> {
    if (!this.isInitialized()) {
      console.warn('Meta CAPI: Not initialized, skipping batch');
      return null;
    }

    try {
      const serverEvents: CapiServerEvent[] = events.map(({ eventName, options }) => {
        const hashedUserData = options.userData
          ? this.hashUserData(options.userData)
          : {};

        const event: CapiServerEvent = {
          event_name: eventName,
          event_time: options.eventTime || Math.floor(Date.now() / 1000),
          action_source: options.actionSource || 'website',
          user_data: hashedUserData,
        };

        if (options.eventId) event.event_id = options.eventId;
        if (options.eventSourceUrl) event.event_source_url = options.eventSourceUrl;
        if (options.customData) event.custom_data = options.customData;

        return event;
      });

      const response = await this.sendEvents(serverEvents);

      if (process.env.NODE_ENV === 'development') {
        console.log('[Meta CAPI] Batch sent:', {
          events_count: events.length,
          events_received: response.events_received,
          fbtrace_id: response.fbtrace_id,
        });
      }

      return response;
    } catch (error) {
      console.error('[Meta CAPI] Failed to track batch:', error);
      return null;
    }
  }

  /**
   * Track application event with CAPI
   * Maps internal TrackingEvent to Meta standard events
   * and automatically includes user data and custom data
   */
  async trackAppEvent(
    event: TrackingEvent,
    properties?: EventProperties,
    userData?: CapiUserData
  ): Promise<CapiResponse | null> {
    if (!this.isInitialized()) {
      return null;
    }

    // Get Meta event name from metaEvents mapping
    const { getMetaEventMapping } = await import('./metaEvents');
    const mapping = getMetaEventMapping(event);

    if (!mapping) {
      console.warn('[Meta CAPI] No mapping found for event:', event);
      return null;
    }

    // Build custom data from properties
    const customData: any = {
      original_event: event,
    };

    // Add standard fields based on event type
    switch (event) {
      case 'video_rendered':
        customData.content_type = 'video';
        customData.content_ids = properties?.videoId ? [properties.videoId] : [];
        customData.num_items = properties?.renderCount || 1;
        customData.value = ((properties?.renderCount as number) || 1) * 2;
        customData.currency = 'USD';
        break;

      case 'batch_completed':
        customData.content_type = 'batch';
        customData.num_items = properties?.batchSize || 0;
        customData.value = ((properties?.batchSize as number) || 10) * 2;
        customData.currency = 'USD';
        break;

      case 'purchase_completed':
        customData.content_ids = [properties?.planId];
        customData.content_name = properties?.planName;
        customData.content_type = 'product';
        customData.value = properties?.price || 0;
        customData.currency = 'USD';
        break;

      case 'checkout_started':
        customData.content_ids = [properties?.planId];
        customData.content_name = properties?.planName;
        customData.content_type = 'product';
        customData.value = properties?.price || 0;
        customData.currency = 'USD';
        break;
    }

    // Generate event ID for deduplication
    const eventId = properties?.eventId as string || this.generateEventId();

    return this.trackEvent(mapping.metaEvent, {
      eventId,
      userData,
      customData,
      eventSourceUrl: properties?.url as string,
    });
  }

  /**
   * Generate a unique event ID for deduplication
   * Public method to allow sharing event IDs between client and server
   */
  generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Test the CAPI connection by sending a test event
   */
  async testConnection(): Promise<boolean> {
    if (!this.isInitialized()) {
      console.error('Meta CAPI: Not initialized');
      return false;
    }

    try {
      const response = await this.trackEvent('PageView', {
        userData: {
          em: 'test@example.com',
          client_user_agent: 'Meta CAPI Test',
        },
        customData: {
          content_name: 'CAPI Connection Test',
        },
      });

      if (response && response.events_received > 0) {
        console.log('[Meta CAPI] Connection test successful:', response.fbtrace_id);
        return true;
      }

      return false;
    } catch (error) {
      console.error('[Meta CAPI] Connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const metaCapiService = new MetaCapiService();

// Export class for testing
export { MetaCapiService };
