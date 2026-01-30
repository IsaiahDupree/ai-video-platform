import { PostHog } from 'posthog-node';
import {
  TrackingConfig,
  UserProperties,
  EventProperties,
  TrackingEvent,
  ITrackingService,
} from '../types/tracking';
import { metaCapiService } from './metaCapi';
import { CapiUserData } from '@/types/metaCapi';
import { generateEventId } from '@/utils/eventIdDedup';

class ServerTrackingService implements ITrackingService {
  private client: PostHog | null = null;
  private enabled = false;
  private capiEnabled = false;

  initialize(config: TrackingConfig & {
    metaPixelId?: string;
    metaAccessToken?: string;
    metaTestEventCode?: string;
  }): void {
    if (this.client) {
      console.warn('Server tracking service already initialized');
      return;
    }

    if (!config.apiKey) {
      console.warn('PostHog API key not provided. Server tracking disabled.');
      this.enabled = false;
      return;
    }

    this.enabled = config.enabled !== false;

    if (!this.enabled) {
      console.info('Server tracking is disabled');
      return;
    }

    try {
      this.client = new PostHog(config.apiKey, {
        host: config.host || 'https://us.i.posthog.com',
      });

      console.info('PostHog server tracking initialized');
    } catch (error) {
      console.error('Failed to initialize PostHog server:', error);
      this.enabled = false;
    }

    // Initialize Meta CAPI if configured
    if (config.metaPixelId && config.metaAccessToken) {
      try {
        metaCapiService.initialize({
          pixelId: config.metaPixelId,
          accessToken: config.metaAccessToken,
          testEventCode: config.metaTestEventCode,
        });
        this.capiEnabled = true;
        console.info('Meta CAPI server tracking initialized');
      } catch (error) {
        console.error('Failed to initialize Meta CAPI:', error);
        this.capiEnabled = false;
      }
    }
  }

  identify(userId: string, properties?: UserProperties): void {
    if (!this.isEnabled() || !this.client) return;

    try {
      this.client.identify({
        distinctId: userId,
        properties: properties || {},
      });
    } catch (error) {
      console.error('Failed to identify user on server:', error);
    }
  }

  track(event: TrackingEvent, properties?: EventProperties): void {
    if (!this.isEnabled() || !this.client) {
      console.debug('Server tracking disabled, skipping event:', event);
      return;
    }

    try {
      // Auto-generate event ID if not provided (GDP-010: Meta Pixel + CAPI Dedup)
      // This ensures client and server events with same ID get deduplicated by Meta
      const eventId = (properties?.eventId as string) || generateEventId();
      const enrichedProperties: EventProperties = {
        ...properties,
        eventId,
      };

      // Track with PostHog
      this.client.capture({
        distinctId: properties?.userId as string || 'anonymous',
        event,
        properties: enrichedProperties,
      });

      // Also track with Meta CAPI if enabled
      if (this.capiEnabled && metaCapiService.isInitialized()) {
        // Build user data for CAPI from properties
        const userData: CapiUserData | undefined = properties?.email
          ? {
              em: properties.email as string,
              external_id: properties.userId as string,
            }
          : undefined;

        // Track asynchronously (don't block)
        metaCapiService.trackAppEvent(event, enrichedProperties, userData).catch((error) => {
          console.error('Failed to track event with Meta CAPI:', error);
        });
      }
    } catch (error) {
      console.error('Failed to track event on server:', error);
    }
  }

  page(name?: string, properties?: EventProperties): void {
    if (!this.isEnabled() || !this.client) return;

    try {
      this.client.capture({
        distinctId: properties?.userId as string || 'anonymous',
        event: '$pageview',
        properties: {
          page_name: name,
          ...properties,
        },
      });
    } catch (error) {
      console.error('Failed to track page view on server:', error);
    }
  }

  reset(): void {
    console.debug('Server tracking reset called (no-op)');
  }

  isEnabled(): boolean {
    return this.enabled && this.client !== null;
  }

  async shutdown(): Promise<void> {
    if (this.client) {
      await this.client.shutdown();
    }
  }
}

export const serverTracking = new ServerTrackingService();

// Auto-initialize with environment variables (server-side only)
if (typeof window === 'undefined' && process.env.POSTHOG_API_KEY) {
  serverTracking.initialize({
    apiKey: process.env.POSTHOG_API_KEY,
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    enabled: process.env.NODE_ENV !== 'test',
    metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID,
    metaAccessToken: process.env.META_CAPI_ACCESS_TOKEN,
    metaTestEventCode: process.env.META_CAPI_TEST_EVENT_CODE,
  });
}
