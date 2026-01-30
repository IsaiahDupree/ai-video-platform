/**
 * Stripe Webhook Handler
 * API route for handling Stripe webhook events (GDP-007)
 *
 * This endpoint receives webhook events from Stripe for:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - customer.subscription.trial_will_end
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 * - charge.succeeded
 * - charge.failed
 * - charge.refunded
 * - payment_intent.succeeded
 * - payment_intent.payment_failed
 *
 * Events are verified, parsed, and stored in the Growth Data Plane.
 * Subscriptions are created/updated to track active subscriptions.
 *
 * Setup:
 * 1. Add STRIPE_WEBHOOK_SECRET to .env (get from Stripe dashboard)
 * 2. Configure webhook in Stripe: https://dashboard.stripe.com/webhooks
 * 3. Set webhook URL: https://your-domain.com/api/webhooks/stripe
 * 4. Enable events: subscription, invoice, charge, payment_intent
 *
 * @see https://stripe.com/docs/webhooks
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyStripeWebhook } from '@/utils/stripeWebhookVerify';
import { processStripeWebhook } from '@/services/stripeWebhookProcessor';
import { StripeWebhookEvent } from '@/types/stripeWebhook';

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    // Get webhook secret from environment
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Get raw body for signature verification
    const rawBody = await request.text();

    // Get Stripe signature header
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.warn('Missing Stripe-Signature header in webhook request');
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const isValid = verifyStripeWebhook(rawBody, signature, webhookSecret);

    if (!isValid) {
      console.warn('Invalid Stripe webhook signature');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Parse webhook payload
    let payload: StripeWebhookEvent;
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
    console.log(`Received Stripe webhook: ${payload.type}`, {
      event_id: payload.id,
      created: new Date(payload.created * 1000).toISOString(),
      livemode: payload.livemode,
    });

    // Process webhook and store in Growth Data Plane
    const result = await processStripeWebhook(payload);

    if (result.eventId) {
      return NextResponse.json({
        success: true,
        event_id: result.eventId,
        subscription_id: result.subscriptionId,
        message: 'Webhook processed successfully',
      });
    } else {
      // Event was skipped (e.g., we don't track this event type)
      return NextResponse.json({
        success: true,
        message: 'Webhook received but not processed',
      });
    }
  } catch (error) {
    console.error('Error handling Stripe webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/stripe
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Stripe webhook endpoint is active',
    configured: !!process.env.STRIPE_WEBHOOK_SECRET,
  });
}
