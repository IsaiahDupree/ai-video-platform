/**
 * Stripe Webhook Handler
 *
 * Implements GDP-003: Stripe Webhook Integration
 *
 * Handles subscription events and syncs them to the Growth Data Plane:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 */

import { Stripe } from 'stripe';
import { v4 as uuidv4 } from 'uuid';

// Mock Stripe import (in real usage, import actual Stripe library)
export type StripeEvent = any;
export type StripeSubscription = any;
export type StripeInvoice = any;

// =============================================================================
// Types
// =============================================================================

export interface WebhookHandlerResult {
  success: boolean;
  eventId: string;
  eventType: string;
  message: string;
  error?: string;
}

export interface SubscriptionSyncData {
  subscriptionId: string;
  personId: string;
  stripeSubscriptionId: string;
  planId: string;
  planName: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'annual';
  status: 'active' | 'past_due' | 'cancelled' | 'refunded' | 'paused';
  startDate: Date;
  renewalDate?: Date;
  cancelledAt?: Date;
  refundedAt?: Date;
  metadata?: Record<string, any>;
}

// =============================================================================
// Stripe Webhook Handler
// =============================================================================

class StripeWebhookHandler {
  private eventLog: Map<string, WebhookHandlerResult> = new Map();
  private subscriptions: Map<string, SubscriptionSyncData> = new Map();
  private debug: boolean = false;

  constructor(debug: boolean = false) {
    this.debug = debug;
  }

  /**
   * Main webhook handler - verifies signature and routes to specific handler
   */
  async handleEvent(event: StripeEvent): Promise<WebhookHandlerResult> {
    const eventId = event.id;
    const eventType = event.type;

    if (this.debug) {
      console.log(`[StripeWebhook] Handling event: ${eventType} (${eventId})`);
    }

    try {
      let result: WebhookHandlerResult;

      switch (eventType) {
        case 'customer.subscription.created':
          result = await this.handleSubscriptionCreated(event);
          break;

        case 'customer.subscription.updated':
          result = await this.handleSubscriptionUpdated(event);
          break;

        case 'customer.subscription.deleted':
          result = await this.handleSubscriptionDeleted(event);
          break;

        case 'invoice.payment_succeeded':
          result = await this.handlePaymentSucceeded(event);
          break;

        case 'invoice.payment_failed':
          result = await this.handlePaymentFailed(event);
          break;

        default:
          result = {
            success: true,
            eventId,
            eventType,
            message: `Event type not handled: ${eventType}`
          };
      }

      this.eventLog.set(eventId, result);
      return result;
    } catch (err) {
      const result: WebhookHandlerResult = {
        success: false,
        eventId,
        eventType,
        message: `Error handling event`,
        error: err instanceof Error ? err.message : String(err)
      };

      this.eventLog.set(eventId, result);
      throw err;
    }
  }

  /**
   * Handle subscription created
   */
  private async handleSubscriptionCreated(event: StripeEvent): Promise<WebhookHandlerResult> {
    const subscription = event.data.object;
    const stripeSubId = subscription.id;
    const customerId = subscription.customer;

    if (this.debug) {
      console.log(`[StripeWebhook] Subscription created: ${stripeSubId}`);
    }

    // Find or create person by Stripe customer ID
    const personId = await this.findOrCreatePersonByCustomerId(customerId, subscription);

    // Create subscription record
    const subscriptionData = this.mapStripeSubscription(subscription, personId);
    this.subscriptions.set(stripeSubId, subscriptionData);

    // Create UnifiedEvent
    const unifiedEvent = this.createUnifiedEvent('purchase_completed', personId, {
      subscription_id: stripeSubId,
      plan: subscriptionData.planName,
      amount: subscriptionData.price,
      currency: subscriptionData.currency,
      billing_cycle: subscriptionData.billingCycle,
      source: 'stripe'
    });

    // Update Person metrics
    await this.updatePersonMetrics(personId, {
      status: 'paid',
      totalSpent: subscriptionData.price,
      lastActionDate: new Date()
    });

    return {
      success: true,
      eventId: event.id,
      eventType: 'customer.subscription.created',
      message: `Subscription ${stripeSubId} created for customer ${customerId}`
    };
  }

  /**
   * Handle subscription updated (price change, pause, etc.)
   */
  private async handleSubscriptionUpdated(event: StripeEvent): Promise<WebhookHandlerResult> {
    const subscription = event.data.object;
    const stripeSubId = subscription.id;
    const customerId = subscription.customer;

    if (this.debug) {
      console.log(`[StripeWebhook] Subscription updated: ${stripeSubId}`);
    }

    // Find existing subscription
    const existingSub = this.subscriptions.get(stripeSubId);
    if (!existingSub) {
      console.warn(`[StripeWebhook] Subscription not found: ${stripeSubId}`);
      return {
        success: false,
        eventId: event.id,
        eventType: 'customer.subscription.updated',
        message: `Subscription not found: ${stripeSubId}`,
        error: 'SUBSCRIPTION_NOT_FOUND'
      };
    }

    // Map updated data
    const updated = this.mapStripeSubscription(subscription, existingSub.personId);

    // Detect changes
    const priceChanged = updated.price !== existingSub.price;
    const statusChanged = updated.status !== existingSub.status;
    const paused = updated.status === 'paused';

    // Update subscription record
    this.subscriptions.set(stripeSubId, updated);

    // Create appropriate events
    if (priceChanged) {
      this.createUnifiedEvent('subscription_price_changed', existingSub.personId, {
        subscription_id: stripeSubId,
        old_price: existingSub.price,
        new_price: updated.price,
        source: 'stripe'
      });
    }

    if (statusChanged) {
      this.createUnifiedEvent('subscription_status_changed', existingSub.personId, {
        subscription_id: stripeSubId,
        old_status: existingSub.status,
        new_status: updated.status,
        source: 'stripe'
      });
    }

    // Update Person status
    let personStatus = 'active';
    if (updated.status === 'cancelled') {
      personStatus = 'churned';
    } else if (updated.status === 'past_due') {
      personStatus = 'active'; // Still subscribed, just overdue
    } else if (updated.status === 'paused') {
      personStatus = 'inactive';
    } else {
      personStatus = 'paid';
    }

    await this.updatePersonMetrics(existingSub.personId, {
      status: personStatus,
      lastActionDate: new Date()
    });

    return {
      success: true,
      eventId: event.id,
      eventType: 'customer.subscription.updated',
      message: `Subscription ${stripeSubId} updated (price: ${priceChanged}, status: ${statusChanged})`
    };
  }

  /**
   * Handle subscription deleted
   */
  private async handleSubscriptionDeleted(event: StripeEvent): Promise<WebhookHandlerResult> {
    const subscription = event.data.object;
    const stripeSubId = subscription.id;

    if (this.debug) {
      console.log(`[StripeWebhook] Subscription deleted: ${stripeSubId}`);
    }

    const existingSub = this.subscriptions.get(stripeSubId);
    if (!existingSub) {
      return {
        success: false,
        eventId: event.id,
        eventType: 'customer.subscription.deleted',
        message: `Subscription not found: ${stripeSubId}`
      };
    }

    // Mark as cancelled
    const updated = { ...existingSub, status: 'cancelled' as const, cancelledAt: new Date() };
    this.subscriptions.set(stripeSubId, updated);

    // Create churn event
    this.createUnifiedEvent('subscription_cancelled', existingSub.personId, {
      subscription_id: stripeSubId,
      plan: existingSub.planName,
      mrr: existingSub.price,
      cancelled_at: new Date().toISOString(),
      source: 'stripe'
    });

    // Update Person
    await this.updatePersonMetrics(existingSub.personId, {
      status: 'churned',
      lastActionDate: new Date()
    });

    return {
      success: true,
      eventId: event.id,
      eventType: 'customer.subscription.deleted',
      message: `Subscription ${stripeSubId} cancelled`
    };
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(event: StripeEvent): Promise<WebhookHandlerResult> {
    const invoice = event.data.object;
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;
    const amount = invoice.amount_paid / 100; // Convert from cents

    if (this.debug) {
      console.log(`[StripeWebhook] Payment succeeded: ${invoice.id} ($${amount})`);
    }

    // Find person and subscription
    const personId = await this.findOrCreatePersonByCustomerId(customerId);
    const sub = subscriptionId ? this.subscriptions.get(subscriptionId) : null;

    // Create payment event
    this.createUnifiedEvent('subscription_renewal', personId, {
      invoice_id: invoice.id,
      subscription_id: subscriptionId,
      amount: amount,
      currency: invoice.currency.toUpperCase(),
      source: 'stripe'
    });

    // Update subscription MRR and total revenue
    if (sub && subscriptionId) {
      const updated = {
        ...sub,
        totalRevenue: (sub.totalRevenue || 0) + amount,
        mrr: amount, // Update monthly recurring
        status: 'active' as const,
        renewalDate: this.calculateNextRenewal(invoice.next_payment_attempt)
      };
      this.subscriptions.set(subscriptionId, updated);
    }

    // Update person
    await this.updatePersonMetrics(personId, {
      status: 'paid',
      totalSpent: (await this.getPersonTotalSpent(personId)) + amount,
      lastActionDate: new Date()
    });

    return {
      success: true,
      eventId: event.id,
      eventType: 'invoice.payment_succeeded',
      message: `Payment succeeded: $${amount} from customer ${customerId}`
    };
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(event: StripeEvent): Promise<WebhookHandlerResult> {
    const invoice = event.data.object;
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;

    if (this.debug) {
      console.log(`[StripeWebhook] Payment failed: ${invoice.id}`);
    }

    const personId = await this.findOrCreatePersonByCustomerId(customerId);

    // Create payment failed event
    this.createUnifiedEvent('payment_failed', personId, {
      invoice_id: invoice.id,
      subscription_id: subscriptionId,
      amount: invoice.amount_due / 100,
      currency: invoice.currency.toUpperCase(),
      source: 'stripe'
    });

    // Mark subscription as past due
    if (subscriptionId && this.subscriptions.has(subscriptionId)) {
      const sub = this.subscriptions.get(subscriptionId)!;
      this.subscriptions.set(subscriptionId, {
        ...sub,
        status: 'past_due'
      });
    }

    // Update person status
    await this.updatePersonMetrics(personId, {
      status: 'active', // Still active, just overdue
      lastActionDate: new Date()
    });

    return {
      success: true,
      eventId: event.id,
      eventType: 'invoice.payment_failed',
      message: `Payment failed for customer ${customerId}`
    };
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Map Stripe subscription to our SubscriptionSyncData
   */
  private mapStripeSubscription(
    stripeSubscription: StripeSubscription,
    personId: string
  ): SubscriptionSyncData {
    const item = stripeSubscription.items.data[0];
    const price = stripeSubscription.items.data[0].price;

    return {
      subscriptionId: `sub_${uuidv4()}`,
      personId,
      stripeSubscriptionId: stripeSubscription.id,
      planId: price.product,
      planName: price.nickname || price.product,
      price: (price.unit_amount || 0) / 100, // Convert from cents
      currency: stripeSubscription.currency.toUpperCase(),
      billingCycle:
        price.recurring?.interval === 'year' ? 'annual' : 'monthly',
      status: (stripeSubscription.status as any) || 'active',
      startDate: new Date(stripeSubscription.start_date * 1000),
      renewalDate: stripeSubscription.current_period_end
        ? new Date(stripeSubscription.current_period_end * 1000)
        : undefined,
      metadata: stripeSubscription.metadata
    };
  }

  /**
   * Find or create person by Stripe customer ID
   */
  private async findOrCreatePersonByCustomerId(
    customerId: string,
    stripeCustomer?: any
  ): Promise<string> {
    // In a real implementation, this would query a database
    // For now, return a consistent ID based on customer ID
    return `person_${customerId.replace(/[^a-z0-9]/gi, '')}`;
  }

  /**
   * Create unified event for Growth Data Plane
   */
  private createUnifiedEvent(
    eventType: string,
    personId: string,
    properties: Record<string, any>
  ): any {
    return {
      eventId: uuidv4(),
      personId,
      eventType,
      category: 'monetization',
      timestamp: new Date(),
      properties,
      source: 'stripe'
    };
  }

  /**
   * Update person metrics in Growth Data Plane
   */
  private async updatePersonMetrics(
    personId: string,
    updates: Record<string, any>
  ): Promise<void> {
    if (this.debug) {
      console.log(`[StripeWebhook] Updating person ${personId}:`, updates);
    }
    // In real implementation, would update database
  }

  /**
   * Get person's total spending so far
   */
  private async getPersonTotalSpent(personId: string): Promise<number> {
    // In real implementation, would query database
    return 0;
  }

  /**
   * Calculate next renewal date from Unix timestamp
   */
  private calculateNextRenewal(timestamp?: number): Date | undefined {
    if (!timestamp) {
      return undefined;
    }
    return new Date(timestamp * 1000);
  }

  /**
   * Verify webhook signature (HMAC)
   */
  async verifyWebhookSignature(
    body: string,
    signature: string,
    secret: string
  ): Promise<boolean> {
    // In real implementation with actual Stripe library:
    // const event = stripe.webhooks.constructEvent(body, signature, secret);
    // return true if valid, false otherwise

    // Mock implementation
    const hash = require('crypto')
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    return hash === signature;
  }

  /**
   * Get webhook logs
   */
  getEventLogs(): Map<string, WebhookHandlerResult> {
    return this.eventLog;
  }

  /**
   * Get stored subscriptions (for testing/debugging)
   */
  getSubscriptions(): Map<string, SubscriptionSyncData> {
    return this.subscriptions;
  }
}

// =============================================================================
// Global Singleton
// =============================================================================

let instance: StripeWebhookHandler | null = null;

export function initializeStripeWebhooks(debug: boolean = false): StripeWebhookHandler {
  if (!instance) {
    instance = new StripeWebhookHandler(debug);
  }
  return instance;
}

export function getStripeWebhookHandler(): StripeWebhookHandler {
  if (!instance) {
    instance = new StripeWebhookHandler();
  }
  return instance;
}

// =============================================================================
// Express/Fastify Route Handler
// =============================================================================

/**
 * Route handler for POST /api/webhooks/stripe
 * Usage: app.post('/api/webhooks/stripe', handleStripeWebhook);
 */
export async function handleStripeWebhook(
  req: any,
  res: any
): Promise<void> {
  const signature = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    res.status(400).json({ error: 'STRIPE_WEBHOOK_SECRET not configured' });
    return;
  }

  try {
    // Verify signature
    const handler = getStripeWebhookHandler();
    const isValid = await handler.verifyWebhookSignature(
      req.rawBody || req.body,
      signature,
      secret
    );

    if (!isValid) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    // Handle event
    const result = await handler.handleEvent(req.body);

    res.json({
      success: result.success,
      eventId: result.eventId,
      eventType: result.eventType,
      message: result.message
    });
  } catch (err) {
    console.error('[StripeWebhook] Error:', err);
    res.status(500).json({
      error: 'Webhook processing failed',
      message: err instanceof Error ? err.message : String(err)
    });
  }
}

// =============================================================================
// Testing Utilities
// =============================================================================

export function createMockStripeWebhookHandler() {
  const events: WebhookHandlerResult[] = [];
  const subscriptions: Map<string, SubscriptionSyncData> = new Map();

  return {
    handleEvent: async (event: StripeEvent): Promise<WebhookHandlerResult> => {
      const result: WebhookHandlerResult = {
        success: true,
        eventId: event.id,
        eventType: event.type,
        message: `Mock handled: ${event.type}`
      };
      events.push(result);
      return result;
    },
    getEvents: () => events,
    getEventsByType: (type: string) => events.filter(e => e.eventType === type),
    clear: () => {
      events.length = 0;
    }
  };
}
