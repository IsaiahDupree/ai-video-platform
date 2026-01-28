import posthog from 'posthog-js';
import {
  TrackingConfig,
  UserProperties,
  EventProperties,
  TrackingEvent,
  ITrackingService,
} from '../types/tracking';

class ClientTrackingService implements ITrackingService {
  private initialized = false;
  private enabled = false;

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }
  }

  initialize(config: TrackingConfig): void {
    if (this.initialized) {
      console.warn('Tracking service already initialized');
      return;
    }

    if (!config.apiKey) {
      console.warn('PostHog API key not provided. Tracking disabled.');
      this.enabled = false;
      return;
    }

    this.enabled = config.enabled !== false;

    if (!this.enabled) {
      console.info('Tracking is disabled');
      return;
    }

    try {
      posthog.init(config.apiKey, {
        api_host: config.host || 'https://us.i.posthog.com',
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') {
            posthog.debug();
          }
        },
        capture_pageview: false,
        capture_pageleave: true,
        autocapture: false,
        persistence: 'localStorage+cookie',
      });

      this.initialized = true;
      console.info('PostHog tracking initialized');
    } catch (error) {
      console.error('Failed to initialize PostHog:', error);
      this.enabled = false;
    }
  }

  identify(userId: string, properties?: UserProperties): void {
    if (!this.isEnabled()) return;

    try {
      posthog.identify(userId, properties);
    } catch (error) {
      console.error('Failed to identify user:', error);
    }
  }

  track(event: TrackingEvent, properties?: EventProperties): void {
    if (!this.isEnabled()) {
      console.debug('Tracking disabled, skipping event:', event);
      return;
    }

    try {
      posthog.capture(event, properties);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  page(name?: string, properties?: EventProperties): void {
    if (!this.isEnabled()) return;

    try {
      posthog.capture('$pageview', {
        $current_url: window.location.href,
        page_name: name,
        ...properties,
      });
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }

  reset(): void {
    if (!this.isEnabled()) return;

    try {
      posthog.reset();
    } catch (error) {
      console.error('Failed to reset tracking:', error);
    }
  }

  isEnabled(): boolean {
    return this.initialized && this.enabled;
  }
}

export const tracking = new ClientTrackingService();
