export interface TrackingConfig {
  apiKey: string;
  host?: string;
  enabled?: boolean;
}

export interface UserProperties {
  userId?: string;
  email?: string;
  name?: string;
  plan?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface EventProperties {
  [key: string]: string | number | boolean | object | undefined;
}

export type TrackingEvent =
  | 'landing_view'
  | 'signup_started'
  | 'signup_completed'
  | 'login_completed'
  | 'first_video_created'
  | 'first_render_completed'
  | 'video_rendered'
  | 'batch_completed'
  | 'export_downloaded'
  | 'checkout_started'
  | 'purchase_completed'
  | 'return_visit'
  | 'feature_discovery'
  | 'template_used'
  | 'voice_cloned'
  | 'ad_generated'
  | 'render_failed'
  | 'api_error'
  | 'slow_render'
  | 'pricing_view';

export interface ITrackingService {
  identify(userId: string, properties?: UserProperties): void;
  track(event: TrackingEvent, properties?: EventProperties): void;
  page(name?: string, properties?: EventProperties): void;
  reset(): void;
  isEnabled(): boolean;
}
