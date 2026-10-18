/**
 * Segment Engine
 *
 * Implements GDP-004: Segment Engine
 *
 * Real-time user segmentation engine with:
 * - Rules-based segment definitions
 * - Real-time membership evaluation
 * - Membership lifecycle tracking
 * - Automation triggers for segment entry/exit
 * - Event-driven architecture
 */

import { v4 as uuidv4 } from 'uuid';
import { Person, UnifiedEvent, Subscription } from './growth-data-plane';

// =============================================================================
// Types & Interfaces
// =============================================================================

/**
 * Segment Rule - Single condition in a segment definition
 */
export interface SegmentRule {
  ruleId: string;

  // Rule type and condition
  condition: 'event' | 'property' | 'cohort';

  // Event-based conditions
  eventType?: string;
  eventCount?: { gte?: number; lte?: number };
  eventWindow?: '24h' | '7d' | '30d' | '90d' | '180d' | '1y';

  // Property-based conditions
  property?: string;
  operator?: 'equals' | 'contains' | 'gte' | 'lte' | 'gt' | 'lt' | 'in' | 'between';
  value?: any;

  // Cohort-based conditions
  cohortId?: string;

  // Logical operators for combining rules
  logicalOp?: 'AND' | 'OR'; // Default: AND
}

/**
 * Segment Definition - Complete segment specification
 */
export interface SegmentDefinition {
  segmentId: string;
  name: string;
  description?: string;
  rules: SegmentRule[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
}

/**
 * Segment Membership - Track user segment participation
 */
export interface SegmentMembership {
  membershipId: string;
  personId: string;
  segmentId: string;
  enteredAt: Date;
  exitedAt?: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
}

/**
 * Segment Automation - Trigger actions on segment changes
 */
export interface SegmentAutomation {
  automationId: string;
  segmentId: string;
  trigger: 'enter' | 'exit' | 'enter_and_exit';
  action: 'email' | 'webhook' | 'tag' | 'sync' | 'custom';
  actionConfig: {
    email?: {
      templateId: string;
      recipientField?: string; // Default: 'email'
      delayMinutes?: number;
    };
    webhook?: {
      url: string;
      method?: 'POST' | 'PUT' | 'PATCH';
      headers?: Record<string, string>;
      payload?: Record<string, any>;
    };
    tag?: {
      tagName: string;
      tagValue?: string;
    };
    sync?: {
      destinationId: string;
      destinationType?: 'crm' | 'email_platform' | 'analytics' | 'custom';
    };
    custom?: {
      handlerId: string;
      config: Record<string, any>;
    };
  };
  isActive: boolean;
  createdAt: Date;
}

/**
 * Event listener function type for segment changes
 */
export type SegmentEventListener = (
  event: 'enter' | 'exit',
  personId: string,
  segmentId: string,
  data?: any
) => void | Promise<void>;

/**
 * Segment evaluation context
 */
export interface EvaluationContext {
  person: Person;
  events: UnifiedEvent[];
  subscriptions: Subscription[];
  currentDate: Date;
}

// =============================================================================
// Segment Engine
// =============================================================================

export class SegmentEngine {
  private segments: Map<string, SegmentDefinition> = new Map();
  private memberships: Map<string, SegmentMembership> = new Map();
  private automations: Map<string, SegmentAutomation> = new Map();
  private listeners: Map<string, SegmentEventListener[]> = new Map();
  private debug: boolean = false;

  constructor(debug: boolean = false) {
    this.debug = debug;
  }

  // =========================================================================
  // Segment Management
  // =========================================================================

  /**
   * Create a new segment definition
   */
  createSegment(
    name: string,
    rules: Omit<SegmentRule, 'ruleId'>[],
    description?: string,
    metadata?: Record<string, any>
  ): SegmentDefinition {
    const segmentId = uuidv4();
    const now = new Date();

    // Add rule IDs
    const rulesWithIds: SegmentRule[] = rules.map(rule => ({
      ...rule,
      ruleId: uuidv4(),
      logicalOp: rule.logicalOp || 'AND',
    }));

    const segment: SegmentDefinition = {
      segmentId,
      name,
      description,
      rules: rulesWithIds,
      createdAt: now,
      updatedAt: now,
      isActive: true,
      metadata,
    };

    this.segments.set(segmentId, segment);

    if (this.debug) {
      console.log(`[SegmentEngine] Created segment: ${name} (${segmentId})`);
    }

    return segment;
  }

  /**
   * Get segment by ID
   */
  getSegment(segmentId: string): SegmentDefinition | null {
    return this.segments.get(segmentId) || null;
  }

  /**
   * Get all segments
   */
  getAllSegments(): SegmentDefinition[] {
    return Array.from(this.segments.values());
  }

  /**
   * Update segment definition
   */
  updateSegment(
    segmentId: string,
    updates: Partial<SegmentDefinition>
  ): SegmentDefinition {
    const segment = this.getSegment(segmentId);
    if (!segment) {
      throw new Error(`Segment ${segmentId} not found`);
    }

    const updated: SegmentDefinition = {
      ...segment,
      ...updates,
      updatedAt: new Date(),
    };

    this.segments.set(segmentId, updated);

    if (this.debug) {
      console.log(`[SegmentEngine] Updated segment: ${segment.name}`);
    }

    return updated;
  }

  /**
   * Delete segment
   */
  deleteSegment(segmentId: string): void {
    this.segments.delete(segmentId);

    // Clean up memberships
    for (const [, membership] of Array.from(this.memberships.entries())) {
      if (membership.segmentId === segmentId) {
        this.memberships.delete(membership.membershipId);
      }
    }

    // Clean up automations
    for (const [, automation] of Array.from(this.automations.entries())) {
      if (automation.segmentId === segmentId) {
        this.automations.delete(automation.automationId);
      }
    }

    if (this.debug) {
      console.log(`[SegmentEngine] Deleted segment: ${segmentId}`);
    }
  }

  // =========================================================================
  // Segment Evaluation
  // =========================================================================

  /**
   * Evaluate if a person matches a segment's rules
   */
  async evaluateSegment(
    segmentId: string,
    context: EvaluationContext
  ): Promise<boolean> {
    const segment = this.getSegment(segmentId);
    if (!segment || !segment.isActive) {
      return false;
    }

    // If no rules, everyone is a member
    if (segment.rules.length === 0) {
      return true;
    }

    // Evaluate rules
    const ruleResults = await Promise.all(
      segment.rules.map(rule => this.evaluateRule(rule, context))
    );

    // Combine results based on logical operators
    // Default is AND - all rules must match
    return ruleResults.every(result => result === true);
  }

  /**
   * Evaluate a single rule
   */
  private async evaluateRule(rule: SegmentRule, context: EvaluationContext): Promise<boolean> {
    try {
      switch (rule.condition) {
        case 'event':
          return this.evaluateEventRule(rule, context);

        case 'property':
          return this.evaluatePropertyRule(rule, context);

        case 'cohort':
          return this.evaluateCohortRule(rule, context);

        default:
          return false;
      }
    } catch (err) {
      if (this.debug) {
        console.error(`[SegmentEngine] Error evaluating rule ${rule.ruleId}:`, err);
      }
      return false;
    }
  }

  /**
   * Evaluate event-based rule (count of events in time window)
   */
  private evaluateEventRule(rule: SegmentRule, context: EvaluationContext): boolean {
    if (!rule.eventType) return false;

    // Calculate time window
    const now = context.currentDate;
    const windowMs = this.getWindowMs(rule.eventWindow || '30d');
    const windowStart = new Date(now.getTime() - windowMs);

    // Count matching events
    const count = context.events.filter(
      event =>
        event.eventType === rule.eventType &&
        event.timestamp >= windowStart &&
        event.timestamp <= now
    ).length;

    // Check against eventCount constraints
    if (rule.eventCount) {
      const gte = rule.eventCount.gte ?? 0;
      const lte = rule.eventCount.lte ?? Infinity;
      return count >= gte && count <= lte;
    }

    return count > 0;
  }

  /**
   * Evaluate property-based rule
   */
  private evaluatePropertyRule(rule: SegmentRule, context: EvaluationContext): boolean {
    if (!rule.property || !rule.operator) return false;

    const person = context.person;
    const value = this.getPropertyValue(person, rule.property);

    switch (rule.operator) {
      case 'equals':
        return value === rule.value;

      case 'contains':
        return typeof value === 'string' && value.includes(String(rule.value));

      case 'gte':
        return Number(value) >= Number(rule.value);

      case 'lte':
        return Number(value) <= Number(rule.value);

      case 'gt':
        return Number(value) > Number(rule.value);

      case 'lt':
        return Number(value) < Number(rule.value);

      case 'in':
        return Array.isArray(rule.value) && rule.value.includes(value);

      case 'between':
        if (!Array.isArray(rule.value) || rule.value.length !== 2) return false;
        const numValue = Number(value);
        return numValue >= rule.value[0] && numValue <= rule.value[1];

      default:
        return false;
    }
  }

  /**
   * Evaluate cohort-based rule
   */
  private evaluateCohortRule(rule: SegmentRule, context: EvaluationContext): boolean {
    // Cohort evaluation would reference other segments
    // For now, simplified implementation
    if (!rule.cohortId) return false;
    return context.person.cohort === rule.cohortId;
  }

  /**
   * Helper: Get property value from person object
   */
  private getPropertyValue(person: Person, property: string): any {
    const parts = property.split('.');
    let value: any = person;

    for (const part of parts) {
      if (value === null || value === undefined) return null;
      value = (value as any)[part];
    }

    return value;
  }

  /**
   * Helper: Convert time window string to milliseconds
   */
  private getWindowMs(window: string): number {
    const matches = window.match(/(\d+)([a-z]+)/i);
    if (!matches) return 30 * 24 * 60 * 60 * 1000; // Default 30 days

    const [, num, unit] = matches;
    const value = parseInt(num, 10);

    const unitMs: Record<string, number> = {
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
      w: 7 * 24 * 60 * 60 * 1000,
      m: 30 * 24 * 60 * 60 * 1000,
      y: 365 * 24 * 60 * 60 * 1000,
    };

    return value * (unitMs[unit.toLowerCase()] || 1);
  }

  // =========================================================================
  // Membership Management
  // =========================================================================

  /**
   * Check if person is in segment (with caching)
   */
  async isInSegment(
    personId: string,
    segmentId: string,
    context?: EvaluationContext
  ): Promise<boolean> {
    // Check membership cache
    const memberships = this.getPersonMemberships(personId);
    const membership = memberships.find(m => m.segmentId === segmentId);

    if (membership) {
      return membership.isActive;
    }

    // If context provided, evaluate dynamically
    if (context) {
      return this.evaluateSegment(segmentId, context);
    }

    return false;
  }

  /**
   * Add person to segment
   */
  async addMembership(
    personId: string,
    segmentId: string,
    metadata?: Record<string, any>
  ): Promise<SegmentMembership> {
    const membershipId = uuidv4();
    const now = new Date();

    const membership: SegmentMembership = {
      membershipId,
      personId,
      segmentId,
      enteredAt: now,
      isActive: true,
      metadata,
    };

    this.memberships.set(membershipId, membership);

    // Trigger automation
    await this.triggerAutomations(personId, segmentId, 'enter', metadata);

    // Trigger event listeners
    await this.emitSegmentEvent('enter', personId, segmentId, metadata);

    if (this.debug) {
      console.log(
        `[SegmentEngine] Added ${personId} to segment ${segmentId}`
      );
    }

    return membership;
  }

  /**
   * Remove person from segment
   */
  async removeMembership(
    personId: string,
    segmentId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const memberships = this.getPersonMemberships(personId);
    const membership = memberships.find(m => m.segmentId === segmentId);

    if (membership) {
      const updated = {
        ...membership,
        isActive: false,
        exitedAt: new Date(),
      };
      this.memberships.set(membership.membershipId, updated);

      // Trigger automation
      await this.triggerAutomations(personId, segmentId, 'exit', metadata);

      // Trigger event listeners
      await this.emitSegmentEvent('exit', personId, segmentId, metadata);

      if (this.debug) {
        console.log(
          `[SegmentEngine] Removed ${personId} from segment ${segmentId}`
        );
      }
    }
  }

  /**
   * Get all memberships for a person
   */
  getPersonMemberships(personId: string): SegmentMembership[] {
    return Array.from(this.memberships.values()).filter(
      m => m.personId === personId
    );
  }

  /**
   * Get all members of a segment
   */
  getSegmentMembers(segmentId: string, activeOnly: boolean = true): SegmentMembership[] {
    return Array.from(this.memberships.values()).filter(
      m => m.segmentId === segmentId && (!activeOnly || m.isActive)
    );
  }

  /**
   * Batch evaluate and update memberships
   */
  async evaluateAndUpdateMemberships(
    personId: string,
    context: EvaluationContext
  ): Promise<void> {
    const segments = this.getAllSegments();

    for (const segment of segments) {
      const isEligible = await this.evaluateSegment(segment.segmentId, context);
      const currentMembership = this.getPersonMemberships(personId).find(
        m => m.segmentId === segment.segmentId && m.isActive
      );

      if (isEligible && !currentMembership) {
        // Person entered segment
        await this.addMembership(personId, segment.segmentId);
      } else if (!isEligible && currentMembership) {
        // Person exited segment
        await this.removeMembership(personId, segment.segmentId);
      }
    }
  }

  // =========================================================================
  // Automations
  // =========================================================================

  /**
   * Create automation trigger
   */
  createAutomation(automation: Omit<SegmentAutomation, 'automationId' | 'createdAt'>): SegmentAutomation {
    const automationId = uuidv4();

    const fullAutomation: SegmentAutomation = {
      ...automation,
      automationId,
      createdAt: new Date(),
    };

    this.automations.set(automationId, fullAutomation);

    if (this.debug) {
      console.log(
        `[SegmentEngine] Created automation: ${automationId} on segment ${automation.segmentId}`
      );
    }

    return fullAutomation;
  }

  /**
   * Get automations for a segment
   */
  getSegmentAutomations(segmentId: string): SegmentAutomation[] {
    return Array.from(this.automations.values()).filter(
      a => a.segmentId === segmentId && a.isActive
    );
  }

  /**
   * Trigger automations for segment change
   */
  private async triggerAutomations(
    personId: string,
    segmentId: string,
    trigger: 'enter' | 'exit',
    metadata?: Record<string, any>
  ): Promise<void> {
    const automations = this.getSegmentAutomations(segmentId).filter(a =>
      a.trigger === trigger || a.trigger === 'enter_and_exit'
    );

    for (const automation of automations) {
      try {
        await this.executeAutomation(automation, personId, metadata);
      } catch (err) {
        if (this.debug) {
          console.error(
            `[SegmentEngine] Error executing automation ${automation.automationId}:`,
            err
          );
        }
      }
    }
  }

  /**
   * Execute automation action
   */
  private async executeAutomation(
    automation: SegmentAutomation,
    personId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    switch (automation.action) {
      case 'webhook':
        await this.executeWebhookAction(automation, personId, metadata);
        break;

      case 'email':
        // Implementation would send email
        if (this.debug) {
          console.log(`[SegmentEngine] Would send email for ${personId}`);
        }
        break;

      case 'tag':
        // Implementation would add tag to person
        if (this.debug) {
          console.log(
            `[SegmentEngine] Would tag ${personId} with ${automation.actionConfig.tag?.tagName}`
          );
        }
        break;

      case 'sync':
        // Implementation would sync to external system
        if (this.debug) {
          console.log(`[SegmentEngine] Would sync ${personId} to ${automation.actionConfig.sync?.destinationId}`);
        }
        break;

      case 'custom':
        // Custom handler
        if (this.debug) {
          console.log(`[SegmentEngine] Would execute custom handler ${automation.actionConfig.custom?.handlerId}`);
        }
        break;
    }
  }

  /**
   * Execute webhook action
   */
  private async executeWebhookAction(
    automation: SegmentAutomation,
    personId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const config = automation.actionConfig.webhook;
    if (!config || !config.url) return;

    const payload = {
      ...config.payload,
      personId,
      segmentId: automation.segmentId,
      automationId: automation.automationId,
      timestamp: new Date().toISOString(),
      metadata,
    };

    try {
      const response = await fetch(config.url, {
        method: config.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok && this.debug) {
        console.warn(`[SegmentEngine] Webhook failed: ${response.status}`);
      }
    } catch (err) {
      if (this.debug) {
        console.error(`[SegmentEngine] Webhook error:`, err);
      }
    }
  }

  // =========================================================================
  // Event System
  // =========================================================================

  /**
   * Subscribe to segment events
   */
  on(
    event: `segment:enter:${string}` | `segment:exit:${string}`,
    listener: SegmentEventListener
  ): void {
    const listeners = this.listeners.get(event) || [];
    listeners.push(listener);
    this.listeners.set(event, listeners);
  }

  /**
   * Unsubscribe from segment events
   */
  off(
    event: `segment:enter:${string}` | `segment:exit:${string}`,
    listener: SegmentEventListener
  ): void {
    const listeners = this.listeners.get(event) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * Emit segment event
   */
  private async emitSegmentEvent(
    type: 'enter' | 'exit',
    personId: string,
    segmentId: string,
    data?: any
  ): Promise<void> {
    const event = `segment:${type}:${segmentId}` as const;
    const listeners = this.listeners.get(event as any) || [];

    for (const listener of listeners) {
      try {
        await listener(type, personId, segmentId, data);
      } catch (err) {
        if (this.debug) {
          console.error(`[SegmentEngine] Error in event listener:`, err);
        }
      }
    }
  }

  // =========================================================================
  // Analytics & Debugging
  // =========================================================================

  /**
   * Get segment statistics
   */
  getSegmentStats(segmentId: string): {
    segmentId: string;
    name: string;
    totalMembers: number;
    activeMembers: number;
    inactiveMembers: number;
  } | null {
    const segment = this.getSegment(segmentId);
    if (!segment) return null;

    const memberships = this.getSegmentMembers(segmentId, false);
    const activeMembers = memberships.filter(m => m.isActive).length;
    const inactiveMembers = memberships.filter(m => !m.isActive).length;

    return {
      segmentId,
      name: segment.name,
      totalMembers: memberships.length,
      activeMembers,
      inactiveMembers,
    };
  }

  /**
   * Get all segment statistics
   */
  getAllSegmentStats(): Array<{
    segmentId: string;
    name: string;
    totalMembers: number;
    activeMembers: number;
    inactiveMembers: number;
  }> {
    return this.getAllSegments()
      .map(segment => this.getSegmentStats(segment.segmentId))
      .filter((stat): stat is NonNullable<typeof stat> => stat !== null);
  }
}

// =============================================================================
// Predefined Segment Templates
// =============================================================================

/**
 * Factory for creating common segment templates
 */
export class SegmentTemplates {
  /**
   * Power Users - high engagement users
   */
  static powerUsers(
    videoRenderThreshold: number = 10,
    window: string = '30d'
  ): Omit<SegmentRule, 'ruleId'>[] {
    return [
      {
        condition: 'event',
        eventType: 'video_rendered',
        eventCount: { gte: videoRenderThreshold },
        eventWindow: window as any,
      },
      {
        condition: 'property',
        property: 'status',
        operator: 'equals',
        value: 'paid',
      },
    ];
  }

  /**
   * Churn Risk - inactive paid users
   */
  static churnRisk(inactiveDays: number = 30): Omit<SegmentRule, 'ruleId'>[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

    return [
      {
        condition: 'property',
        property: 'lastActionDate',
        operator: 'lte',
        value: cutoffDate,
      },
      {
        condition: 'property',
        property: 'status',
        operator: 'equals',
        value: 'paid',
      },
    ];
  }

  /**
   * Trial to Paid - converters
   */
  static trialToPaidConverters(window: string = '7d'): Omit<SegmentRule, 'ruleId'>[] {
    return [
      {
        condition: 'property',
        property: 'status',
        operator: 'equals',
        value: 'paid',
      },
      {
        condition: 'event',
        eventType: 'purchase_completed',
        eventCount: { gte: 1 },
        eventWindow: window as any,
      },
    ];
  }

  /**
   * Free Trial Users - trial status
   */
  static freeTrialUsers(): Omit<SegmentRule, 'ruleId'>[] {
    return [
      {
        condition: 'property',
        property: 'status',
        operator: 'equals',
        value: 'trial',
      },
    ];
  }

  /**
   * First-Time Users - created video in last N days
   */
  static firstTimeUsers(daysWindow: number = 7): Omit<SegmentRule, 'ruleId'>[] {
    const window = `${daysWindow}d`;
    return [
      {
        condition: 'event',
        eventType: 'first_video_created',
        eventCount: { gte: 1 },
        eventWindow: window as any,
      },
    ];
  }

  /**
   * High LTV Users - high spending
   */
  static highLtvUsers(minSpend: number = 500): Omit<SegmentRule, 'ruleId'>[] {
    return [
      {
        condition: 'property',
        property: 'totalSpent',
        operator: 'gte',
        value: minSpend,
      },
    ];
  }
}

export default SegmentEngine;
