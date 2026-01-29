/**
 * Resend Webhook Handler
 * API route for handling Resend email webhooks (GDP-004)
 *
 * This endpoint receives webhook events from Resend for:
 * - email.delivered
 * - email.opened
 * - email.clicked
 * - email.bounced
 * - email.complained
 *
 * Events are verified, parsed, and stored in the Growth Data Plane.
 *
 * Setup:
 * 1. Add RESEND_WEBHOOK_SECRET to .env (get from Resend dashboard)
 * 2. Configure webhook in Resend: https://resend.com/webhooks
 * 3. Set webhook URL: https://your-domain.com/api/webhooks/resend
 *
 * @see https://resend.com/docs/api-reference/webhooks
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  verifyResendWebhook,
  validateWebhookTimestamp,
} from '@/utils/resendWebhookVerify';
import { processResendWebhook } from '@/services/resendWebhookProcessor';
import { ResendWebhookPayload } from '@/types/resendWebhook';

/**
 * POST /api/webhooks/resend
 * Handle Resend webhook events
 */
export async function POST(request: NextRequest) {
  try {
    // Get webhook secret from environment
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('RESEND_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Get raw body for signature verification
    const rawBody = await request.text();

    // Get Svix headers for verification
    const signature = request.headers.get('svix-signature');
    const timestamp = request.headers.get('svix-timestamp');
    const id = request.headers.get('svix-id');

    if (!signature || !timestamp || !id) {
      console.warn('Missing Svix headers in webhook request');
      return NextResponse.json(
        { error: 'Missing webhook headers' },
        { status: 400 }
      );
    }

    // Validate timestamp to prevent replay attacks
    if (!validateWebhookTimestamp(timestamp)) {
      console.warn('Webhook timestamp is too old (replay attack?)');
      return NextResponse.json(
        { error: 'Webhook timestamp is invalid' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const isValid = verifyResendWebhook(
      rawBody,
      signature,
      timestamp,
      webhookSecret
    );

    if (!isValid) {
      console.warn('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Parse webhook payload
    let payload: ResendWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      console.error('Failed to parse webhook payload:', error);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Log webhook event
    console.log(`Received Resend webhook: ${payload.type}`, {
      email_id: payload.data.email_id,
      to: payload.data.to[0],
    });

    // Process webhook and store in Growth Data Plane
    const eventId = await processResendWebhook(payload);

    if (eventId) {
      return NextResponse.json({
        success: true,
        event_id: eventId,
        message: 'Webhook processed successfully',
      });
    } else {
      // Event was skipped (e.g., email.sent event we don't track)
      return NextResponse.json({
        success: true,
        message: 'Webhook received but not processed',
      });
    }
  } catch (error) {
    console.error('Error handling Resend webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/resend
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Resend webhook endpoint is active',
    configured: !!process.env.RESEND_WEBHOOK_SECRET,
  });
}
