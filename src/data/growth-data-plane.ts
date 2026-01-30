/**
 * Growth Data Plane
 *
 * Unified data schema for growth analytics:
 * - Person (users/accounts)
 * - Identity Links (cross-platform identity tracking)
 * - Unified Events (normalized events from all sources)
 * - Subscriptions (billing and account lifecycle)
 *
 * This provides the foundation for:
 * - User segmentation
 * - Conversion funnel analysis
 * - Cohort analysis
 * - LTV calculations
 */

// =============================================================================
// Data Models
// =============================================================================

/**
 * Person - Core user/account record
 */
export interface Person {
  personId: string;
  createdAt: Date;
  updatedAt: Date;

  // Profile
  email?: string;
  name?: string;
  company?: string;
  industry?: string;

  // Lifecycle
  status: 'active' | 'inactive' | 'churned' | 'trial' | 'paid';
  signupDate?: Date;
  firstActionDate?: Date;
  lastActionDate?: Date;

  // Segmentation
  segment?: string;
  cohort?: string;
  source?: string; // utm_source
  campaign?: string; // utm_campaign
  medium?: string; // utm_medium

  // Metrics
  totalEvents: number;
  totalSpent: number;
  lastEventAt?: Date;

  // Metadata
  metadata?: Record<string, any>;
}

/**
 * IdentityLink - Maps external IDs to person records
 * Supports tracking users across platforms: email, Stripe, Google, GitHub, etc.
 */
export interface IdentityLink {
  linkId: string;
  personId: string;
  idType: 'email' | 'stripe_id' | 'google_id' | 'github_id' | 'custom';
  idValue: string;
  createdAt: Date;
  isPrimary: boolean;
}

/**
 * Event - Normalized event from any source
 * Includes app events, Stripe webhooks, Meta Pixel events, etc.
 */
export interface UnifiedEvent {
  eventId: string;
  personId: string;
  timestamp: Date;

  // Event classification
  eventType: string; // e.g., 'page_view', 'signup_started', 'video_rendered', 'purchase_completed'
  category: 'acquisition' | 'activation' | 'core_value' | 'monetization' | 'retention' | 'referral';

  // Event details
  properties: Record<string, any>;

  // Source tracking
  source: 'app' | 'stripe' | 'meta_pixel' | 'segment' | 'custom';
  sourceId?: string; // original event ID from source system

  // Session
  sessionId?: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;

  // Attribution
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;

  // Metadata
  metadata?: Record<string, any>;
}

/**
 * Subscription - Billing and account lifecycle
 */
export interface Subscription {
  subscriptionId: string;
  personId: string;
  stripeSubscriptionId?: string;

  // Plan information
  planId: string;
  planName: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'annual';

  // Dates
  startDate: Date;
  renewalDate?: Date;
  cancelledAt?: Date;
  refundedAt?: Date;

  // Status
  status: 'active' | 'past_due' | 'cancelled' | 'refunded' | 'paused';

  // Metrics
  totalRevenue: number;
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue

  // Metadata
  metadata?: Record<string, any>;
}

/**
 * Funnel Stage - For tracking conversion funnels
 */
export interface FunnelStage {
  stageId: string;
  stageName: string;
  requiredEvents: string[];
  timeWindowMs?: number; // Within X milliseconds
}

/**
 * Cohort - User cohorts for analysis
 */
export interface Cohort {
  cohortId: string;
  cohortName: string;
  createdDate: Date;
  criteria: {
    eventType?: string;
    dateRange?: { start: Date; end: Date };
    properties?: Record<string, any>;
  };
  memberCount: number;
}

// =============================================================================
// Database Interface (Implementation-agnostic)
// =============================================================================

export interface GrowthDataPlaneDB {
  // Person operations
  createPerson(person: Partial<Person>): Promise<Person>;
  getPerson(personId: string): Promise<Person | null>;
  updatePerson(personId: string, updates: Partial<Person>): Promise<Person>;
  searchPersons(criteria: Partial<Person>): Promise<Person[]>;

  // Identity link operations
  linkIdentity(personId: string, link: Omit<IdentityLink, 'linkId' | 'createdAt'>): Promise<IdentityLink>;
  getIdentityByValue(idType: string, idValue: string): Promise<IdentityLink | null>;
  getIdentityByPerson(personId: string): Promise<IdentityLink[]>;

  // Event operations
  createEvent(event: Omit<UnifiedEvent, 'eventId'>): Promise<UnifiedEvent>;
  getEvent(eventId: string): Promise<UnifiedEvent | null>;
  getEventsByPerson(personId: string, limit?: number): Promise<UnifiedEvent[]>;
  getEventsByType(eventType: string, limit?: number): Promise<UnifiedEvent[]>;
  getEventsByDateRange(start: Date, end: Date): Promise<UnifiedEvent[]>;

  // Subscription operations
  createSubscription(subscription: Omit<Subscription, 'subscriptionId'>): Promise<Subscription>;
  getSubscription(subscriptionId: string): Promise<Subscription | null>;
  getSubscriptionsByPerson(personId: string): Promise<Subscription[]>;
  updateSubscription(subscriptionId: string, updates: Partial<Subscription>): Promise<Subscription>;

  // Analytics queries
  getConversionFunnel(funnel: FunnelStage[]): Promise<{ stage: string; count: number }[]>;
  getCohortAnalysis(cohortId: string): Promise<any>;
  getLTV(personId: string): Promise<number>;
  getCAC(campaignId: string): Promise<number>;

  // Cleanup
  deleteOldEvents(beforeDate: Date): Promise<number>;
}

// =============================================================================
// In-Memory Implementation (for development/testing)
// =============================================================================

export class InMemoryGrowthDataPlane implements GrowthDataPlaneDB {
  private persons: Map<string, Person> = new Map();
  private identityLinks: Map<string, IdentityLink> = new Map();
  private events: Map<string, UnifiedEvent> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();

  async createPerson(data: Partial<Person>): Promise<Person> {
    const person: Person = {
      personId: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      totalEvents: 0,
      totalSpent: 0,
      status: 'active',
      ...data,
    };
    this.persons.set(person.personId, person);
    return person;
  }

  async getPerson(personId: string): Promise<Person | null> {
    return this.persons.get(personId) || null;
  }

  async updatePerson(personId: string, updates: Partial<Person>): Promise<Person> {
    const person = await this.getPerson(personId);
    if (!person) throw new Error(`Person ${personId} not found`);

    const updated = { ...person, ...updates, updatedAt: new Date() };
    this.persons.set(personId, updated);
    return updated;
  }

  async searchPersons(criteria: Partial<Person>): Promise<Person[]> {
    return Array.from(this.persons.values()).filter(p =>
      Object.entries(criteria).every(([key, value]) =>
        (p as any)[key] === value
      )
    );
  }

  async linkIdentity(
    personId: string,
    link: Omit<IdentityLink, 'linkId' | 'createdAt'>
  ): Promise<IdentityLink> {
    const identityLink: IdentityLink = {
      linkId: this.generateId(),
      personId,
      createdAt: new Date(),
      ...link,
    };
    this.identityLinks.set(identityLink.linkId, identityLink);
    return identityLink;
  }

  async getIdentityByValue(idType: string, idValue: string): Promise<IdentityLink | null> {
    for (const link of this.identityLinks.values()) {
      if (link.idType === idType && link.idValue === idValue) {
        return link;
      }
    }
    return null;
  }

  async getIdentityByPerson(personId: string): Promise<IdentityLink[]> {
    return Array.from(this.identityLinks.values()).filter(l => l.personId === personId);
  }

  async createEvent(data: Omit<UnifiedEvent, 'eventId'>): Promise<UnifiedEvent> {
    const event: UnifiedEvent = {
      eventId: this.generateId(),
      ...data,
    };
    this.events.set(event.eventId, event);

    // Update person metrics
    const person = await this.getPerson(event.personId);
    if (person) {
      await this.updatePerson(event.personId, {
        totalEvents: person.totalEvents + 1,
        lastEventAt: new Date(),
      });
    }

    return event;
  }

  async getEvent(eventId: string): Promise<UnifiedEvent | null> {
    return this.events.get(eventId) || null;
  }

  async getEventsByPerson(personId: string, limit?: number): Promise<UnifiedEvent[]> {
    const events = Array.from(this.events.values())
      .filter(e => e.personId === personId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return limit ? events.slice(0, limit) : events;
  }

  async getEventsByType(eventType: string, limit?: number): Promise<UnifiedEvent[]> {
    const events = Array.from(this.events.values())
      .filter(e => e.eventType === eventType)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return limit ? events.slice(0, limit) : events;
  }

  async getEventsByDateRange(start: Date, end: Date): Promise<UnifiedEvent[]> {
    return Array.from(this.events.values()).filter(
      e => e.timestamp >= start && e.timestamp <= end
    );
  }

  async createSubscription(
    data: Omit<Subscription, 'subscriptionId'>
  ): Promise<Subscription> {
    const subscription: Subscription = {
      subscriptionId: this.generateId(),
      ...data,
    };
    this.subscriptions.set(subscription.subscriptionId, subscription);
    return subscription;
  }

  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    return this.subscriptions.get(subscriptionId) || null;
  }

  async getSubscriptionsByPerson(personId: string): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values()).filter(s => s.personId === personId);
  }

  async updateSubscription(
    subscriptionId: string,
    updates: Partial<Subscription>
  ): Promise<Subscription> {
    const sub = await this.getSubscription(subscriptionId);
    if (!sub) throw new Error(`Subscription ${subscriptionId} not found`);

    const updated = { ...sub, ...updates };
    this.subscriptions.set(subscriptionId, updated);
    return updated;
  }

  async getConversionFunnel(funnel: FunnelStage[]): Promise<{ stage: string; count: number }[]> {
    const results = [];

    for (const stage of funnel) {
      const count = new Set(
        Array.from(this.events.values())
          .filter(e => stage.requiredEvents.includes(e.eventType))
          .map(e => e.personId)
      ).size;

      results.push({
        stage: stage.stageName,
        count,
      });
    }

    return results;
  }

  async getCohortAnalysis(cohortId: string): Promise<any> {
    // Simplified implementation
    return { cohortId, analysis: {} };
  }

  async getLTV(personId: string): Promise<number> {
    const subscriptions = await this.getSubscriptionsByPerson(personId);
    return subscriptions.reduce((sum, s) => sum + s.totalRevenue, 0);
  }

  async getCAC(campaignId: string): Promise<number> {
    const personsWithCampaign = await this.searchPersons({ campaign: campaignId });
    // Simplified: CAC = total acquisition spend / # of customers
    return personsWithCampaign.length > 0 ? 100 / personsWithCampaign.length : 0;
  }

  async deleteOldEvents(beforeDate: Date): Promise<number> {
    let deleted = 0;
    for (const [eventId, event] of this.events.entries()) {
      if (event.timestamp < beforeDate) {
        this.events.delete(eventId);
        deleted++;
      }
    }
    return deleted;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// =============================================================================
// Event Builder (Fluent API for creating events)
// =============================================================================

export class EventBuilder {
  private event: Omit<UnifiedEvent, 'eventId'>;

  constructor(personId: string, eventType: string) {
    this.event = {
      personId,
      eventType,
      timestamp: new Date(),
      category: 'core_value',
      properties: {},
      source: 'app',
    };
  }

  withCategory(category: UnifiedEvent['category']): this {
    this.event.category = category;
    return this;
  }

  withProperties(properties: Record<string, any>): this {
    this.event.properties = { ...this.event.properties, ...properties };
    return this;
  }

  withSource(source: UnifiedEvent['source'], sourceId?: string): this {
    this.event.source = source;
    if (sourceId) this.event.sourceId = sourceId;
    return this;
  }

  withSession(sessionId: string): this {
    this.event.sessionId = sessionId;
    return this;
  }

  withAttribution(utm: { source?: string; medium?: string; campaign?: string; content?: string }): this {
    if (utm.source) this.event.utmSource = utm.source;
    if (utm.medium) this.event.utmMedium = utm.medium;
    if (utm.campaign) this.event.utmCampaign = utm.campaign;
    if (utm.content) this.event.utmContent = utm.content;
    return this;
  }

  build(): Omit<UnifiedEvent, 'eventId'> {
    return this.event;
  }
}

export default InMemoryGrowthDataPlane;
