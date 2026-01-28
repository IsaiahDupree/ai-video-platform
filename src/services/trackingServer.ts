import { PostHog } from 'posthog-node';
import {
  TrackingConfig,
  UserProperties,
  EventProperties,
  TrackingEvent,
  ITrackingService,
} from '../types/tracking';

class ServerTrackingService implements ITrackingService {
  private client: PostHog | null = null;
  private enabled = false;

  initialize(config: TrackingConfig): void {
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
      this.client.capture({
        distinctId: properties?.userId as string || 'anonymous',
        event,
        properties: properties || {},
      });
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
