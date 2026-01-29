/**
 * Resend Webhook Processor
 * Process Resend email events and store them in the Growth Data Plane
 */

import {
  ResendWebhookPayload,
  ResendWebhookEventType,
  ParsedResendEvent,
} from '@/types/resendWebhook';
import { EmailEventType } from '@/types/growthDataPlane';
import { createEvent, findOrCreatePerson } from './growthDataPlane';

/**
 * Map Resend event types to our EmailEventType
 */
function mapResendEventType(
  resendType: ResendWebhookEventType
): EmailEventType | null {
  const mapping: Record<ResendWebhookEventType, EmailEventType | null> = {
    'email.sent': null, // We don't track 'sent' events, only delivery
    'email.delivered': 'delivered',
    'email.delivery_delayed': null, // We don't track delays
    'email.complained': 'complained',
    'email.bounced': 'bounced',
    'email.opened': 'opened',
    'email.clicked': 'clicked',
  };

  return mapping[resendType];
}

/**
 * Parse Resend webhook payload into standardized format
 */
export function parseResendWebhook(
  payload: ResendWebhookPayload
): ParsedResendEvent | null {
  const { type, data } = payload;

  // Get the first recipient (Resend sends individual webhooks per recipient)
  const recipientEmail = data.to[0];

  if (!recipientEmail) {
    console.warn('No recipient email in Resend webhook');
    return null;
  }

  // Determine event time based on event type
  let eventTime = data.created_at;

  if (type === 'email.clicked' && data.click) {
    eventTime = data.click.timestamp;
  } else if (type === 'email.opened' && data.open) {
    eventTime = data.open.timestamp;
  } else if (type === 'email.bounced' && data.bounce) {
    eventTime = data.bounce.timestamp;
  } else if (type === 'email.complained' && data.complaint) {
    eventTime = data.complaint.timestamp;
  }

  const parsed: ParsedResendEvent = {
    email_id: data.email_id,
    recipient_email: recipientEmail,
    event_type: type,
    event_time: eventTime,
    subject: data.subject,
    from: data.from,
    tags: data.tags,
  };

  // Add click-specific fields
  if (type === 'email.clicked' && data.click) {
    parsed.link_url = data.click.link;
    parsed.ip_address = data.click.ipAddress;
    parsed.user_agent = data.click.userAgent;
  }

  // Add open-specific fields
  if (type === 'email.opened' && data.open) {
    parsed.ip_address = data.open.ipAddress;
    parsed.user_agent = data.open.userAgent;
  }

  // Add bounce-specific fields
  if (type === 'email.bounced' && data.bounce) {
    parsed.bounce_type = data.bounce.bounceType;
    parsed.diagnostic_code = data.bounce.diagnosticCode;
  }

  return parsed;
}

/**
 * Process Resend webhook and store event in Growth Data Plane
 *
 * @param payload - Parsed Resend webhook payload
 * @returns Event ID if successful, null otherwise
 */
export async function processResendWebhook(
  payload: ResendWebhookPayload
): Promise<string | null> {
  try {
    // Parse webhook
    const parsed = parseResendWebhook(payload);
    if (!parsed) {
      return null;
    }

    // Map to our email event type
    const emailType = mapResendEventType(parsed.event_type);
    if (!emailType) {
      // We don't track this event type
      console.log(`Skipping Resend event type: ${parsed.event_type}`);
      return null;
    }

    // Find or create person by email
    const person = await findOrCreatePerson({
      identity_type: 'email',
      identity_value: parsed.recipient_email,
      source: 'email',
      email: parsed.recipient_email,
    });

    // Create event in Growth Data Plane
    const event = await createEvent({
      person_id: person.id,
      event_name: `email.${emailType}`,
      event_type: 'retention', // Email engagement is a retention signal
      event_source: 'email',
      event_id: `${parsed.email_id}_${emailType}`, // Dedupe key
      event_time: parsed.event_time,

      // Email-specific fields
      email_id: parsed.email_id,
      email_subject: parsed.subject,
      email_type: emailType,
      email_link_url: parsed.link_url,

      // Device/browser context
      user_agent: parsed.user_agent,
      ip_address: parsed.ip_address,

      // Additional properties
      properties: {
        from: parsed.from,
        tags: parsed.tags || {},
        bounce_type: parsed.bounce_type,
        diagnostic_code: parsed.diagnostic_code,
      },
    });

    console.log(
      `Stored email event: ${emailType} for ${parsed.recipient_email}`
    );

    return event.id;
  } catch (error) {
    console.error('Error processing Resend webhook:', error);
    return null;
  }
}
