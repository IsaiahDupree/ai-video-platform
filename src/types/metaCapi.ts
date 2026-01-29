/**
 * Meta Conversions API (CAPI) Types
 *
 * The Conversions API enables server-side tracking of conversion events.
 * It complements the Meta Pixel (browser-based tracking) and improves
 * attribution accuracy and measurement reliability.
 *
 * Documentation:
 * https://developers.facebook.com/docs/marketing-api/conversions-api
 */

/**
 * CAPI Configuration
 */
export interface MetaCapiConfig {
  /** Meta Pixel ID (same as browser pixel) */
  pixelId: string;
  /** Conversions API Access Token from Meta Events Manager */
  accessToken: string;
  /** Optional API version (defaults to latest) */
  apiVersion?: string;
  /** Test event code for debugging (optional) */
  testEventCode?: string;
}

/**
 * User Data for CAPI
 *
 * Personal information must be hashed with SHA256 before sending.
 * The metaCapiService handles hashing automatically.
 */
export interface CapiUserData {
  /** Email address (will be hashed) */
  em?: string;
  /** Phone number in E.164 format (will be hashed) */
  ph?: string;
  /** First name (will be hashed) */
  fn?: string;
  /** Last name (will be hashed) */
  ln?: string;
  /** City (will be hashed) */
  ct?: string;
  /** State/region (will be hashed) */
  st?: string;
  /** 5-digit zip code (will be hashed) */
  zp?: string;
  /** 2-letter country code (will be hashed) */
  country?: string;
  /** Gender: 'm' or 'f' (will be hashed) */
  ge?: string;
  /** Date of birth in YYYYMMDD format (will be hashed) */
  db?: string;
  /** External user ID from your system */
  external_id?: string;
  /** Client IP address */
  client_ip_address?: string;
  /** Client user agent */
  client_user_agent?: string;
  /** Facebook Browser ID (fbc parameter) */
  fbc?: string;
  /** Facebook Click ID (fbp parameter) */
  fbp?: string;
  /** Subscription ID */
  subscription_id?: string;
  /** Login method */
  login_method?: string;
}

/**
 * Custom Data for specific event types
 */
export interface CapiCustomData {
  /** Purchase value (for Purchase events) */
  value?: number;
  /** Currency code (ISO 4217, e.g., 'USD') */
  currency?: string;
  /** Content IDs (product/video IDs) */
  content_ids?: string[];
  /** Content type (e.g., 'product', 'video') */
  content_type?: string;
  /** Content name */
  content_name?: string;
  /** Content category */
  content_category?: string;
  /** Number of items */
  num_items?: number;
  /** Predicted LTV (Lifetime Value) */
  predicted_ltv?: number;
  /** Status of the event */
  status?: string;
  /** Search string (for Search events) */
  search_string?: string;
  /** Custom properties specific to your business */
  [key: string]: any;
}

/**
 * Server Event for CAPI
 *
 * Represents a single conversion event to be sent to Meta.
 */
export interface CapiServerEvent {
  /** Event name (standard or custom) */
  event_name: string;
  /** Unix timestamp in seconds when event occurred */
  event_time: number;
  /** Event source URL (landing page URL) */
  event_source_url?: string;
  /** Action source: 'website', 'app', 'email', etc */
  action_source: 'website' | 'app' | 'email' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other';
  /** User data (PII will be hashed) */
  user_data: CapiUserData;
  /** Custom data specific to the event */
  custom_data?: CapiCustomData;
  /** Optional event ID for deduplication with Pixel */
  event_id?: string;
  /** Opt-out flag */
  opt_out?: boolean;
}

/**
 * CAPI Request Body
 */
export interface CapiRequest {
  /** Array of server events */
  data: CapiServerEvent[];
  /** Test event code for debugging (optional) */
  test_event_code?: string;
  /** Partner agent string */
  partner_agent?: string;
}

/**
 * CAPI Response
 */
export interface CapiResponse {
  /** Number of events received */
  events_received: number;
  /** Number of events processed successfully */
  events_processed?: number;
  /** Facebook trace ID for debugging */
  fbtrace_id: string;
  /** Messages (warnings, errors) */
  messages?: string[];
}

/**
 * CAPI Error Response
 */
export interface CapiError {
  error: {
    message: string;
    type: string;
    code: number;
    fbtrace_id: string;
  };
}

/**
 * Options for tracking CAPI events
 */
export interface CapiTrackOptions {
  /** Event ID for deduplication (should match Pixel eventID) */
  eventId?: string;
  /** User data for attribution */
  userData?: CapiUserData;
  /** Custom data for the event */
  customData?: CapiCustomData;
  /** Event source URL */
  eventSourceUrl?: string;
  /** Action source */
  actionSource?: CapiServerEvent['action_source'];
  /** Event time (defaults to now) */
  eventTime?: number;
}
