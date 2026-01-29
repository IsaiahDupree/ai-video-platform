/**
 * Resend Webhook Verification
 * Verify webhook signatures from Resend
 */

import crypto from 'crypto';

/**
 * Verify Resend webhook signature
 *
 * Resend signs webhooks with a secret key and includes the signature in the
 * `svix-signature` header. This function verifies that signature.
 *
 * Docs: https://resend.com/docs/api-reference/webhooks/webhook-signature-verification
 *
 * @param payload - Raw webhook payload (body as string)
 * @param signature - Signature from `svix-signature` header
 * @param timestamp - Timestamp from `svix-timestamp` header
 * @param secret - Webhook signing secret from Resend dashboard
 * @returns true if signature is valid, false otherwise
 */
export function verifyResendWebhook(
  payload: string,
  signature: string,
  timestamp: string,
  secret: string
): boolean {
  try {
    // Resend uses Svix for webhook signing
    // Signature format: "v1,{signature1} v1,{signature2}"
    // We need to verify against any of the signatures

    const signatures = signature.split(' ');

    for (const sig of signatures) {
      const [version, signatureValue] = sig.split(',');

      if (version !== 'v1') {
        continue;
      }

      // Reconstruct the signed content: timestamp.payload
      const signedContent = `${timestamp}.${payload}`;

      // Compute HMAC-SHA256
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(signedContent)
        .digest('base64');

      // Compare signatures (constant-time comparison)
      if (timingSafeEqual(signatureValue, expectedSignature)) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error verifying Resend webhook signature:', error);
    return false;
  }
}

/**
 * Timing-safe string comparison
 * Prevents timing attacks by comparing strings in constant time
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Validate webhook timestamp to prevent replay attacks
 * Reject webhooks older than 5 minutes
 */
export function validateWebhookTimestamp(timestamp: string): boolean {
  try {
    const webhookTime = parseInt(timestamp, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(currentTime - webhookTime);

    // Reject if older than 5 minutes (300 seconds)
    return timeDiff < 300;
  } catch (error) {
    console.error('Error validating webhook timestamp:', error);
    return false;
  }
}
