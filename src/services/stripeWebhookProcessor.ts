/**
 * Stripe Webhook Processor
 * Process Stripe subscription and payment events, store in Growth Data Plane
 * Feature: GDP-007
 *
 * Handles subscription lifecycle events:
 * - customer.subscription.created: New subscription
 * - customer.subscription.updated: Subscription changes
 * - customer.subscription.deleted: Subscription canceled/ended
 * - invoice.payment_succeeded: Payment received
 * - invoice.payment_failed: Payment failed
 */

import {
  StripeWebhookEvent,
  StripeWebhookEventType,
  StripeSubscription,
  StripeCustomer,
  StripeInvoice,
  StripeCharge,
  ParsedStripeEvent,
} from '@/types/stripeWebhook';
import {
  SubscriptionStatus,
  SubscriptionInterval,
  EventType as GDPEventType,
} from '@/types/growthDataPlane';
import { createEvent, findOrCreatePerson, createSubscription, updateSubscription, getSubscription } from './growthDataPlane';
import { createSnapshotFromSubscription, getLatestSubscriptionSnapshot } from './subscriptionSnapshot';

/**
 * Map Stripe subscription status to our SubscriptionStatus
 */
function mapStripeSubscriptionStatus(status: string): SubscriptionStatus {
  const mapping: Record<string, SubscriptionStatus> = {
    trialing: 'trialing',
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'unpaid',
    incomplete: 'incomplete',
    incomplete_expired: 'incomplete',
  };
  return mapping[status] || ('active' as SubscriptionStatus);
}

/**
 * Map Stripe interval to our SubscriptionInterval
 */
function mapStripeInterval(interval: string): SubscriptionInterval {
  return interval === 'year' ? 'year' : 'month';
}

/**
 * Parse Stripe webhook payload into standardized format
 */
export function parseStripeWebhook(payload: StripeWebhookEvent): ParsedStripeEvent | null {
  const { type, data, id, created } = payload;

  try {
    const object = data.object;

    // Handle subscription events
    if (type.startsWith('customer.subscription.')) {
      const subscription = object as StripeSubscription;

      return {
        event_id: id,
        event_type: type as StripeWebhookEventType,
        created_at: created,
        customer_id: subscription.customer,
        subscription_id: subscription.id,
        subscription_status: mapStripeSubscriptionStatus(subscription.status),
        currency: subscription.currency,
        plan_id: subscription.items.data[0]?.price?.product || '',
        interval: mapStripeInterval(subscription.items.data[0]?.price?.recurring?.interval || 'month'),
        amount_cents: subscription.items.data[0]?.price?.unit_amount || 0,
        trial_start: subscription.trial_start ? subscription.trial_start * 1000 : undefined,
        trial_end: subscription.trial_end ? subscription.trial_end * 1000 : undefined,
        current_period_start: subscription.current_period_start * 1000,
        current_period_end: subscription.current_period_end * 1000,
        canceled_at: subscription.canceled_at ? subscription.canceled_at * 1000 : undefined,
        ended_at: subscription.ended_at ? subscription.ended_at * 1000 : undefined,
        object_type: 'subscription',
      };
    }

    // Handle customer events
    if (type.startsWith('customer.')) {
      const customer = object as StripeCustomer;

      return {
        event_id: id,
        event_type: type as StripeWebhookEventType,
        created_at: created,
        customer_id: customer.id,
        email: customer.email || undefined,
        object_type: 'customer',
      };
    }

    // Handle invoice events
    if (type.startsWith('invoice.')) {
      const invoice = object as StripeInvoice;

      return {
        event_id: id,
        event_type: type as StripeWebhookEventType,
        created_at: created,
        customer_id: invoice.customer,
        invoice_id: invoice.id,
        invoice_status: invoice.status,
        currency: invoice.currency,
        amount_cents: invoice.amount_due,
        subscription_id: invoice.subscription || undefined,
        payment_status: invoice.paid ? 'succeeded' : 'pending',
        object_type: 'invoice',
      };
    }

    // Handle charge events
    if (type.startsWith('charge.')) {
      const charge = object as StripeCharge;

      return {
        event_id: id,
        event_type: type as StripeWebhookEventType,
        created_at: created,
        customer_id: charge.customer,
        charge_id: charge.id,
        currency: charge.currency,
        amount_cents: charge.amount,
        payment_status: charge.status,
        invoice_id: charge.invoice || undefined,
        object_type: 'charge',
      };
    }

    // Handle payment intent events
    if (type.startsWith('payment_intent.')) {
      const paymentIntent = object as any;

      return {
        event_id: id,
        event_type: type as StripeWebhookEventType,
        created_at: created,
        customer_id: paymentIntent.customer,
        currency: paymentIntent.currency,
        amount_cents: paymentIntent.amount,
        payment_status: paymentIntent.status,
        object_type: 'payment_intent',
      };
    }

    return null;
  } catch (error) {
    console.error('Error parsing Stripe webhook:', error);
    return null;
  }
}

/**
 * Map event type to GDP event type
 */
function mapEventType(eventType: StripeWebhookEventType): GDPEventType {
  if (eventType === StripeWebhookEventType.CUSTOMER_SUBSCRIPTION_CREATED) {
    return 'monetization';
  }
  if (
    eventType === StripeWebhookEventType.INVOICE_PAYMENT_SUCCEEDED ||
    eventType === StripeWebhookEventType.CHARGE_SUCCEEDED
  ) {
    return 'monetization';
  }
  if (
    eventType === StripeWebhookEventType.INVOICE_PAYMENT_FAILED ||
    eventType === StripeWebhookEventType.CHARGE_FAILED
  ) {
    return 'monetization';
  }
  return 'retention';
}

/**
 * Process Stripe webhook and store events/subscriptions in Growth Data Plane
 *
 * @param payload - Stripe webhook event
 * @returns Event ID if successful, null otherwise
 */
export async function processStripeWebhook(
  payload: StripeWebhookEvent
): Promise<{ eventId: string | null; subscriptionId?: string }> {
  try {
    // Parse webhook
    const parsed = parseStripeWebhook(payload);
    if (!parsed) {
      console.log(`Skipping Stripe event type: ${payload.type}`);
      return { eventId: null };
    }

    // Get customer email if available
    let personEmail: string | undefined;
    if (parsed.email) {
      personEmail = parsed.email;
    }

    // For subscription and invoice events, find person by customer ID
    let person = null;

    if (parsed.customer_id && personEmail) {
      person = await findOrCreatePerson({
        identity_type: 'email',
        identity_value: personEmail,
        source: 'stripe',
        email: personEmail,
      });
    } else if (parsed.customer_id) {
      // Try to find by customer ID
      person = await findOrCreatePerson({
        identity_type: 'user_id',
        identity_value: parsed.customer_id,
        source: 'stripe',
      });
    }

    if (!person) {
      console.warn(`Could not find or create person for Stripe event: ${parsed.event_type}`);
      return { eventId: null };
    }

    // Handle subscription events
    if (parsed.object_type === 'subscription' && parsed.subscription_id) {
      if (
        parsed.event_type === StripeWebhookEventType.CUSTOMER_SUBSCRIPTION_CREATED ||
        parsed.event_type === StripeWebhookEventType.CUSTOMER_SUBSCRIPTION_UPDATED
      ) {
        // Try to update existing subscription, if not found, create new
        let subscription;
        try {
          await updateSubscription(parsed.subscription_id, {
            status: parsed.subscription_status,
            amount_cents: parsed.amount_cents || 0,
            interval: parsed.interval || 'month',
            current_period_start: new Date(parsed.current_period_start!).toISOString(),
            current_period_end: new Date(parsed.current_period_end!).toISOString(),
            canceled_at: parsed.canceled_at ? new Date(parsed.canceled_at).toISOString() : undefined,
            ended_at: parsed.ended_at ? new Date(parsed.ended_at).toISOString() : undefined,
          });
          // Get updated subscription for snapshot
          subscription = await getSubscription(parsed.subscription_id);
        } catch {
          // If update fails, create new subscription
          if (parsed.event_type === StripeWebhookEventType.CUSTOMER_SUBSCRIPTION_CREATED) {
            subscription = await createSubscription({
              person_id: person.id,
              stripe_subscription_id: parsed.subscription_id,
              stripe_customer_id: parsed.customer_id!,
              plan_id: parsed.plan_id || 'unknown',
              plan_name: parsed.plan_name,
              status: parsed.subscription_status || 'active',
              amount_cents: parsed.amount_cents || 0,
              currency: parsed.currency || 'usd',
              interval: parsed.interval || 'month',
              current_period_start: new Date(parsed.current_period_start!).toISOString(),
              current_period_end: new Date(parsed.current_period_end!).toISOString(),
              trial_start: parsed.trial_start ? new Date(parsed.trial_start).toISOString() : undefined,
              trial_end: parsed.trial_end ? new Date(parsed.trial_end).toISOString() : undefined,
              canceled_at: parsed.canceled_at ? new Date(parsed.canceled_at).toISOString() : undefined,
            });
          }
        }

        // Create subscription snapshot (GDP-008)
        if (subscription) {
          try {
            const previousSnapshot = await getLatestSubscriptionSnapshot(subscription.id);
            await createSnapshotFromSubscription(subscription, previousSnapshot || undefined);
          } catch (snapshotError) {
            console.error('Failed to create subscription snapshot:', snapshotError);
            // Don't fail the webhook if snapshot creation fails
          }
        }
      } else if (parsed.event_type === StripeWebhookEventType.CUSTOMER_SUBSCRIPTION_DELETED) {
        // Mark subscription as canceled
        await updateSubscription(parsed.subscription_id, {
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          ended_at: new Date().toISOString(),
        });

        // Create snapshot for cancellation (GDP-008)
        try {
          const subscription = await getSubscription(parsed.subscription_id);
          if (subscription) {
            const previousSnapshot = await getLatestSubscriptionSnapshot(subscription.id);
            await createSnapshotFromSubscription(subscription, previousSnapshot || undefined);
          }
        } catch (snapshotError) {
          console.error('Failed to create subscription snapshot:', snapshotError);
        }
      }
    }

    // Create event record
    const event = await createEvent({
      person_id: person.id,
      event_name: `stripe.${parsed.event_type}`,
      event_type: mapEventType(parsed.event_type),
      event_source: 'stripe',
      event_id: parsed.event_id,
      event_time: new Date(parsed.created_at * 1000).toISOString(),

      // Subscription fields
      subscription_id: parsed.subscription_id,
      subscription_status: parsed.subscription_status,
      plan_id: parsed.plan_id,
      mrr_cents: parsed.amount_cents ? (parsed.interval === 'year' ? Math.round(parsed.amount_cents / 12) : parsed.amount_cents) : 0,

      // Revenue
      revenue_cents: parsed.amount_cents,
      currency: parsed.currency || 'usd',

      // Additional properties
      properties: {
        invoice_id: parsed.invoice_id,
        charge_id: parsed.charge_id,
        customer_id: parsed.customer_id,
        payment_status: parsed.payment_status,
        interval: parsed.interval,
        error_message: parsed.error_message,
      },
    });

    console.log(`Stored Stripe event: ${parsed.event_type} for customer ${parsed.customer_id}`);

    return {
      eventId: event.id,
      subscriptionId: parsed.subscription_id,
    };
  } catch (error) {
    console.error('Error processing Stripe webhook:', error);
    return { eventId: null };
  }
}

/**
 * Map Stripe webhook event type to a human-readable name
 */
export function getEventName(eventType: StripeWebhookEventType): string {
  const names: Record<StripeWebhookEventType, string> = {
    [StripeWebhookEventType.CUSTOMER_CREATED]: 'Customer Created',
    [StripeWebhookEventType.CUSTOMER_UPDATED]: 'Customer Updated',
    [StripeWebhookEventType.CUSTOMER_DELETED]: 'Customer Deleted',
    [StripeWebhookEventType.CUSTOMER_SUBSCRIPTION_CREATED]: 'Subscription Created',
    [StripeWebhookEventType.CUSTOMER_SUBSCRIPTION_UPDATED]: 'Subscription Updated',
    [StripeWebhookEventType.CUSTOMER_SUBSCRIPTION_DELETED]: 'Subscription Canceled',
    [StripeWebhookEventType.CUSTOMER_SUBSCRIPTION_TRIAL_WILL_END]: 'Subscription Trial Ending',
    [StripeWebhookEventType.INVOICE_CREATED]: 'Invoice Created',
    [StripeWebhookEventType.INVOICE_FINALIZED]: 'Invoice Finalized',
    [StripeWebhookEventType.INVOICE_PAYMENT_SUCCEEDED]: 'Payment Succeeded',
    [StripeWebhookEventType.INVOICE_PAYMENT_FAILED]: 'Payment Failed',
    [StripeWebhookEventType.INVOICE_PAYMENT_ACTION_REQUIRED]: 'Payment Action Required',
    [StripeWebhookEventType.INVOICE_UPCOMING]: 'Upcoming Invoice',
    [StripeWebhookEventType.CHARGE_SUCCEEDED]: 'Charge Succeeded',
    [StripeWebhookEventType.CHARGE_FAILED]: 'Charge Failed',
    [StripeWebhookEventType.CHARGE_REFUNDED]: 'Charge Refunded',
    [StripeWebhookEventType.CHARGE_DISPUTE_CREATED]: 'Charge Dispute',
    [StripeWebhookEventType.PAYMENT_INTENT_SUCCEEDED]: 'Payment Intent Succeeded',
    [StripeWebhookEventType.PAYMENT_INTENT_PAYMENT_FAILED]: 'Payment Intent Failed',
  };

  return names[eventType] || eventType;
}
