/**
 * Stripe Webhook Verification Utility
 * Verifies Stripe webhook signatures using HMAC SHA256
 *
 * @see https://stripe.com/docs/webhooks/signatures
 */

import crypto from 'crypto';

/**
 * Verify Stripe webhook signature
 *
 * Stripe signs each webhook with a secret. We need to verify the signature
 * to ensure the webhook came from Stripe and hasn't been tampered with.
 *
 * @param payload - Raw webhook payload (as string/buffer)
 * @param signature - Stripe-Signature header value
 * @param secret - Webhook signing secret from Stripe dashboard
 * @param tolerance - Time tolerance in seconds (default: 300 = 5 minutes)
 * @returns true if signature is valid, false otherwise
 */
export function verifyStripeWebhook(
  payload: string | Buffer,
  signature: string,
  secret: string,
  tolerance: number = 300
): boolean {
  try {
    // Stripe-Signature format: t=<timestamp>,v1=<signature>[,v1=<signature>...]
    const signedContent = signature.split(',');

    let timestamp: string | null = null;
    let signatures: string[] = [];

    for (const item of signedContent) {
      const [key, value] = item.split('=', 2);
      if (key === 't') {
        timestamp = value;
      } else if (key === 'v1') {
        signatures.push(value);
      }
    }

    if (!timestamp || signatures.length === 0) {
      console.warn('Invalid Stripe-Signature format');
      return false;
    }

    // Check timestamp is within tolerance
    const now = Math.floor(Date.now() / 1000);
    const ts = parseInt(timestamp, 10);

    if (isNaN(ts) || Math.abs(now - ts) > tolerance) {
      console.warn(
        `Webhook timestamp outside tolerance window. Now: ${now}, ts: ${ts}, diff: ${Math.abs(now - ts)}s`
      );
      return false;
    }

    // Reconstruct the signed content
    const payloadStr = typeof payload === 'string' ? payload : payload.toString('utf-8');
    const signedString = `${timestamp}.${payloadStr}`;

    // Compute the expected signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedString)
      .digest('hex');

    // Check if any signature matches (use timing-safe comparison)
    for (const sig of signatures) {
      try {
        if (crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSignature))) {
          return true;
        }
      } catch {
        // timingSafeEqual throws if lengths don't match
        continue;
      }
    }

    console.warn('Stripe webhook signature mismatch');
    return false;
  } catch (error) {
    console.error('Error verifying Stripe webhook signature:', error);
    return false;
  }
}

/**
 * Parse Stripe-Signature header to get timestamp
 * Useful for logging/debugging
 *
 * @param signature - Stripe-Signature header value
 * @returns parsed signature data or null if invalid
 */
export function parseStripeSignature(signature: string): {
  timestamp: number;
  signatures: string[];
} | null {
  try {
    const signedContent = signature.split(',');
    let timestamp: string | null = null;
    let signatures: string[] = [];

    for (const item of signedContent) {
      const [key, value] = item.split('=', 2);
      if (key === 't') {
        timestamp = value;
      } else if (key === 'v1') {
        signatures.push(value);
      }
    }

    if (!timestamp || signatures.length === 0) {
      return null;
    }

    return {
      timestamp: parseInt(timestamp, 10),
      signatures,
    };
  } catch (error) {
    console.error('Error parsing Stripe signature:', error);
    return null;
  }
}

/**
 * Validate webhook timestamp is recent
 * Stripe recommends checking timestamp is within 5 minutes
 *
 * @param timestamp - Unix timestamp from webhook
 * @param tolerance - Time tolerance in seconds (default: 300)
 * @returns true if timestamp is recent, false otherwise
 */
export function validateWebhookTimestamp(
  timestamp: number | string,
  tolerance: number = 300
): boolean {
  try {
    const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
    if (isNaN(ts)) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    return Math.abs(now - ts) <= tolerance;
  } catch (error) {
    console.error('Error validating webhook timestamp:', error);
    return false;
  }
}
