/**
 * Resend Webhook Types
 * Types for handling Resend email webhook events
 */

/**
 * Resend webhook event types
 * Docs: https://resend.com/docs/api-reference/webhooks/event-types
 */
export type ResendWebhookEventType =
  | 'email.sent'
  | 'email.delivered'
  | 'email.delivery_delayed'
  | 'email.complained'
  | 'email.bounced'
  | 'email.opened'
  | 'email.clicked';

/**
 * Resend webhook payload structure
 */
export interface ResendWebhookPayload {
  type: ResendWebhookEventType;
  created_at: string; // ISO 8601 timestamp
  data: ResendWebhookData;
}

/**
 * Resend webhook data (varies by event type)
 */
export interface ResendWebhookData {
  // Common fields (all events)
  email_id: string;
  from: string;
  to: string[];
  subject: string;
  created_at: string;

  // Click-specific fields
  click?: {
    ipAddress: string;
    link: string;
    timestamp: string;
    userAgent: string;
  };

  // Open-specific fields
  open?: {
    ipAddress: string;
    timestamp: string;
    userAgent: string;
  };

  // Bounce-specific fields
  bounce?: {
    bounceType: 'Hard' | 'Soft';
    bouncedRecipient: string;
    diagnosticCode?: string;
    timestamp: string;
  };

  // Complaint-specific fields
  complaint?: {
    complaintFeedbackType: string;
    feedbackId: string;
    timestamp: string;
    userAgent?: string;
  };

  // Delivery delay-specific fields
  delivery_delay?: {
    delayType: string;
    diagnosticCode?: string;
    timestamp: string;
  };

  // Additional metadata
  tags?: Record<string, string>;
  headers?: Record<string, string>;
}

/**
 * Webhook verification result
 */
export interface WebhookVerificationResult {
  verified: boolean;
  error?: string;
}

/**
 * Parsed webhook event for processing
 */
export interface ParsedResendEvent {
  email_id: string;
  recipient_email: string;
  event_type: ResendWebhookEventType;
  event_time: string;
  subject: string;
  from: string;

  // Optional fields
  link_url?: string;
  ip_address?: string;
  user_agent?: string;
  bounce_type?: string;
  diagnostic_code?: string;
  tags?: Record<string, string>;
}
