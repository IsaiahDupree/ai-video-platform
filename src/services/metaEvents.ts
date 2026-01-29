/**
 * Meta Standard Events Mapping Service
 *
 * Maps application events to Meta (Facebook) standard events for conversion tracking.
 * This enables proper attribution, audience building, and ad optimization in Meta Ads Manager.
 *
 * Meta Standard Events Documentation:
 * https://developers.facebook.com/docs/meta-pixel/reference
 */

import { trackMetaEvent, trackMetaCustomEvent } from '@/components/MetaPixel';
import { TrackingEvent, EventProperties } from '@/types/tracking';

/**
 * Meta Standard Events
 *
 * These are predefined events that Meta understands and optimizes for:
 * - Lead: User submits lead form (email, signup, etc)
 * - CompleteRegistration: User completes registration
 * - ViewContent: User views content/product
 * - AddToCart: User adds item to cart
 * - InitiateCheckout: User begins checkout process
 * - AddPaymentInfo: User adds payment information
 * - Purchase: User completes purchase
 * - Subscribe: User subscribes to service
 * - StartTrial: User starts trial
 * - Search: User performs search
 */

/**
 * Event mapping configuration
 * Maps internal TrackingEvent types to Meta Standard Events
 */
const EVENT_MAPPING: Record<TrackingEvent, {
  metaEvent: string;
  isStandard: boolean;
  getValue?: (properties?: EventProperties) => number;
}> = {
  // Acquisition Events
  'landing_view': {
    metaEvent: 'ViewContent',
    isStandard: true,
    getValue: () => 0,
  },
  'signup_started': {
    metaEvent: 'Lead',
    isStandard: true,
    getValue: () => 5, // Estimated value of a lead
  },
  'signup_completed': {
    metaEvent: 'CompleteRegistration',
    isStandard: true,
    getValue: () => 10, // Estimated value of a registration
  },

  // Activation Events
  'first_video_created': {
    metaEvent: 'ViewContent',
    isStandard: true,
    getValue: () => 15,
  },
  'first_render_completed': {
    metaEvent: 'CompleteRegistration', // Maps to registration because it's an activation milestone
    isStandard: true,
    getValue: () => 20,
  },

  // Core Value Events
  'video_rendered': {
    metaEvent: 'Purchase', // Treat renders as micro-conversions
    isStandard: true,
    getValue: (props) => {
      // If we have render count, calculate value
      const renderCount = props?.renderCount as number || 1;
      return renderCount * 2; // $2 per render
    },
  },
  'batch_completed': {
    metaEvent: 'Purchase',
    isStandard: true,
    getValue: (props) => {
      const batchSize = props?.batchSize as number || 10;
      return batchSize * 2; // $2 per render
    },
  },
  'export_downloaded': {
    metaEvent: 'Purchase',
    isStandard: true,
    getValue: () => 5,
  },

  // Monetization Events
  'checkout_started': {
    metaEvent: 'InitiateCheckout',
    isStandard: true,
    getValue: (props) => props?.price as number || 0,
  },
  'purchase_completed': {
    metaEvent: 'Purchase',
    isStandard: true,
    getValue: (props) => props?.price as number || 0,
  },

  // Retention Events (Custom)
  'return_visit': {
    metaEvent: 'ReturnVisit',
    isStandard: false,
    getValue: () => 5,
  },
  'feature_discovery': {
    metaEvent: 'FeatureDiscovery',
    isStandard: false,
    getValue: () => 3,
  },

  // Feature Usage Events (Custom)
  'template_used': {
    metaEvent: 'TemplateUsed',
    isStandard: false,
    getValue: () => 2,
  },
  'voice_cloned': {
    metaEvent: 'VoiceCloned',
    isStandard: false,
    getValue: () => 10,
  },
  'ad_generated': {
    metaEvent: 'AdGenerated',
    isStandard: false,
    getValue: () => 5,
  },

  // Error & Performance Events (Custom)
  'render_failed': {
    metaEvent: 'RenderFailed',
    isStandard: false,
  },
  'api_error': {
    metaEvent: 'ApiError',
    isStandard: false,
  },
  'slow_render': {
    metaEvent: 'SlowRender',
    isStandard: false,
  },
};

/**
 * Track an application event with Meta Pixel
 *
 * Automatically maps internal events to Meta Standard Events
 * and sends them to Facebook for conversion tracking.
 *
 * @param event - Internal event name
 * @param properties - Event properties
 *
 * @example
 * trackMetaAppEvent('signup_completed', {
 *   method: 'email',
 *   timestamp: new Date().toISOString(),
 * });
 */
export function trackMetaAppEvent(
  event: TrackingEvent,
  properties?: EventProperties
): void {
  const mapping = EVENT_MAPPING[event];

  if (!mapping) {
    console.warn(`No Meta event mapping found for: ${event}`);
    return;
  }

  const { metaEvent, isStandard, getValue } = mapping;

  // Build Meta event parameters
  const metaParams: Record<string, any> = {
    // Include original event name for debugging
    original_event: event,

    // Include timestamp
    timestamp: properties?.timestamp || new Date().toISOString(),
  };

  // Add value if available
  if (getValue) {
    const value = getValue(properties);
    if (value > 0) {
      metaParams.value = value;
      metaParams.currency = 'USD';
    }
  }

  // Add event-specific parameters based on event type
  switch (event) {
    case 'landing_view':
      metaParams.content_type = 'landing_page';
      metaParams.content_name = properties?.page as string || 'unknown';
      break;

    case 'signup_started':
    case 'signup_completed':
      metaParams.content_category = 'signup';
      metaParams.content_name = 'user_registration';
      break;

    case 'first_video_created':
    case 'first_render_completed':
      metaParams.content_category = 'activation';
      metaParams.content_name = 'first_render';
      break;

    case 'video_rendered':
      metaParams.content_type = 'video';
      metaParams.content_ids = properties?.videoId ? [properties.videoId] : [];
      metaParams.num_items = properties?.renderCount || 1;
      break;

    case 'batch_completed':
      metaParams.content_type = 'batch';
      metaParams.num_items = properties?.batchSize || 0;
      break;

    case 'export_downloaded':
      metaParams.content_type = 'export';
      metaParams.content_name = properties?.format as string || 'unknown';
      break;

    case 'checkout_started':
      metaParams.content_ids = [properties?.planId as string];
      metaParams.content_name = properties?.planName as string;
      metaParams.content_type = 'product';
      metaParams.value = properties?.price as number || 0;
      metaParams.currency = 'USD';
      break;

    case 'purchase_completed':
      metaParams.content_ids = [properties?.planId as string];
      metaParams.content_name = properties?.planName as string;
      metaParams.content_type = 'product';
      metaParams.value = properties?.price as number || 0;
      metaParams.currency = 'USD';
      // Add transaction ID for deduplication
      if (properties?.transactionId) {
        metaParams.transaction_id = properties.transactionId;
      }
      break;

    case 'template_used':
      metaParams.content_ids = [properties?.templateId as string];
      metaParams.content_name = properties?.templateName as string;
      break;

    case 'voice_cloned':
      metaParams.content_type = 'voice_clone';
      metaParams.content_name = properties?.voiceId as string;
      break;

    case 'ad_generated':
      metaParams.content_type = 'ad';
      metaParams.content_ids = [properties?.adId as string];
      break;
  }

  // Merge in any additional properties
  const finalParams = {
    ...metaParams,
    ...properties,
  };

  // Track with Meta Pixel
  if (isStandard) {
    trackMetaEvent(metaEvent, finalParams);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Meta Standard Event] ${metaEvent}:`, finalParams);
    }
  } else {
    trackMetaCustomEvent(metaEvent, finalParams);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Meta Custom Event] ${metaEvent}:`, finalParams);
    }
  }
}

/**
 * Get the Meta event mapping for an internal event
 * Useful for debugging and testing
 */
export function getMetaEventMapping(event: TrackingEvent): {
  metaEvent: string;
  isStandard: boolean;
} | null {
  const mapping = EVENT_MAPPING[event];
  if (!mapping) return null;

  return {
    metaEvent: mapping.metaEvent,
    isStandard: mapping.isStandard,
  };
}

/**
 * Get all event mappings
 * Useful for documentation and debugging
 */
export function getAllEventMappings(): Record<TrackingEvent, {
  metaEvent: string;
  isStandard: boolean;
}> {
  const result = {} as Record<TrackingEvent, {
    metaEvent: string;
    isStandard: boolean;
  }>;

  for (const [event, mapping] of Object.entries(EVENT_MAPPING)) {
    result[event as TrackingEvent] = {
      metaEvent: mapping.metaEvent,
      isStandard: mapping.isStandard,
    };
  }

  return result;
}
