/**
 * Segment Engine Integration with Growth Data Plane
 *
 * Integrates GDP-004 (Segment Engine) with the Growth Data Plane
 * providing unified API for:
 * - Creating segments
 * - Evaluating segment membership
 * - Getting segment members
 * - Triggering automations
 * - Real-time event-driven updates
 */

import { InMemoryGrowthDataPlane, Person, UnifiedEvent, Subscription } from './growth-data-plane';
import {
  SegmentEngine,
  SegmentDefinition,
  SegmentMembership,
  SegmentAutomation,
  SegmentRule,
  SegmentTemplates,
  EvaluationContext,
} from './segment-engine';

// =============================================================================
// Integrated API
// =============================================================================

export class GrowthDataPlaneWithSegments {
  private gdp: InMemoryGrowthDataPlane;
  private segmentEngine: SegmentEngine;
  private debug: boolean;

  constructor(debug: boolean = false) {
    this.gdp = new InMemoryGrowthDataPlane();
    this.segmentEngine = new SegmentEngine(debug);
    this.debug = debug;
  }

  // =========================================================================
  // Growth Data Plane Delegation
  // =========================================================================

  /**
   * Get underlying Growth Data Plane instance
   */
  getGDP(): InMemoryGrowthDataPlane {
    return this.gdp;
  }

  /**
   * Get underlying Segment Engine instance
   */
  getSegmentEngine(): SegmentEngine {
    return this.segmentEngine;
  }

  // =========================================================================
  // Segment Operations
  // =========================================================================

  /**
   * Create a new segment
   */
  createSegment(
    name: string,
    rules: Omit<SegmentRule, 'ruleId'>[],
    description?: string,
    metadata?: Record<string, any>
  ): SegmentDefinition {
    if (this.debug) {
      console.log(`[GrowthDataPlane] Creating segment: ${name}`);
    }
    return this.segmentEngine.createSegment(name, rules, description, metadata);
  }

  /**
   * Create segment from template
   */
  createSegmentFromTemplate(
    name: string,
    template: Omit<SegmentRule, 'ruleId'>[],
    description?: string
  ): SegmentDefinition {
    return this.createSegment(name, template, description);
  }

  /**
   * Get segment definition
   */
  getSegment(segmentId: string): SegmentDefinition | null {
    return this.segmentEngine.getSegment(segmentId);
  }

  /**
   * List all segments
   */
  listSegments(): SegmentDefinition[] {
    return this.segmentEngine.getAllSegments();
  }

  /**
   * Delete segment
   */
  deleteSegment(segmentId: string): void {
    if (this.debug) {
      console.log(`[GrowthDataPlane] Deleting segment: ${segmentId}`);
    }
    this.segmentEngine.deleteSegment(segmentId);
  }

  // =========================================================================
  // Membership Operations
  // =========================================================================

  /**
   * Check if person is in segment
   */
  async isInSegment(personId: string, segmentId: string): Promise<boolean> {
    return this.segmentEngine.isInSegment(personId, segmentId);
  }

  /**
   * Get person's segments
   */
  getPersonSegments(personId: string): {
    segmentId: string;
    name: string;
    status: 'active' | 'inactive';
  }[] {
    const memberships = this.segmentEngine.getPersonMemberships(personId);
    return memberships
      .filter(m => m.isActive)
      .map(m => {
        const segment = this.segmentEngine.getSegment(m.segmentId);
        return {
          segmentId: m.segmentId,
          name: segment?.name || 'Unknown',
          status: 'active' as const,
        };
      });
  }

  /**
   * Get segment members
   */
  getSegmentMembers(segmentId: string): {
    personId: string;
    enteredAt: Date;
  }[] {
    const memberships = this.segmentEngine.getSegmentMembers(segmentId, true);
    return memberships.map(m => ({
      personId: m.personId,
      enteredAt: m.enteredAt,
    }));
  }

  /**
   * Evaluate and update all segments for a person
   */
  async evaluatePersonSegments(personId: string): Promise<void> {
    const person = await this.gdp.getPerson(personId);
    if (!person) {
      if (this.debug) {
        console.warn(`[GrowthDataPlane] Person not found: ${personId}`);
      }
      return;
    }

    const events = await this.gdp.getEventsByPerson(personId);
    const subscriptions = await this.gdp.getSubscriptionsByPerson(personId);

    const context: EvaluationContext = {
      person,
      events,
      subscriptions,
      currentDate: new Date(),
    };

    if (this.debug) {
      console.log(
        `[GrowthDataPlane] Evaluating segments for ${personId} (${events.length} events)`
      );
    }

    await this.segmentEngine.evaluateAndUpdateMemberships(personId, context);
  }

  /**
   * Evaluate and update segments for all people
   */
  async evaluateAllPersonSegments(batchSize: number = 100): Promise<number> {
    const allPersons = await (this.gdp as any).searchPersons({});
    let processed = 0;

    for (let i = 0; i < allPersons.length; i += batchSize) {
      const batch = allPersons.slice(i, i + batchSize);
      await Promise.all(batch.map(p => this.evaluatePersonSegments(p.personId)));
      processed += batch.length;

      if (this.debug && processed % (batchSize * 5) === 0) {
        console.log(`[GrowthDataPlane] Evaluated ${processed}/${allPersons.length} persons`);
      }
    }

    return processed;
  }

  // =========================================================================
  // Automation Operations
  // =========================================================================

  /**
   * Set up automation trigger
   */
  createAutomation(automation: Omit<SegmentAutomation, 'automationId' | 'createdAt'>): SegmentAutomation {
    if (this.debug) {
      console.log(
        `[GrowthDataPlane] Creating automation on segment ${automation.segmentId}`
      );
    }
    return this.segmentEngine.createAutomation(automation);
  }

  /**
   * Subscribe to segment enter event
   */
  onSegmentEnter(segmentId: string, callback: (personId: string, data?: any) => void | Promise<void>): void {
    this.segmentEngine.on(`segment:enter:${segmentId}`, async (event, personId) => {
      await callback(personId);
    });
  }

  /**
   * Subscribe to segment exit event
   */
  onSegmentExit(segmentId: string, callback: (personId: string, data?: any) => void | Promise<void>): void {
    this.segmentEngine.on(`segment:exit:${segmentId}`, async (event, personId) => {
      await callback(personId);
    });
  }

  // =========================================================================
  // Analytics
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
    return this.segmentEngine.getSegmentStats(segmentId);
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
    return this.segmentEngine.getAllSegmentStats();
  }

  /**
   * Get segment member count
   */
  getSegmentMemberCount(segmentId: string): number {
    return this.segmentEngine.getSegmentMembers(segmentId).length;
  }

  /**
   * Get segment overlap (users in multiple segments)
   */
  getSegmentOverlap(segmentIds: string[]): {
    count: number;
    percentage: number;
    personIds: string[];
  } {
    if (segmentIds.length === 0) {
      return { count: 0, percentage: 0, personIds: [] };
    }

    // Get all members for each segment
    const membersBySegment = segmentIds.map(segmentId => {
      const memberships = this.segmentEngine.getSegmentMembers(segmentId);
      return new Set(memberships.map(m => m.personId));
    });

    // Find intersection
    const overlap = Array.from(membersBySegment[0]).filter(personId =>
      membersBySegment.every(set => set.has(personId))
    );

    // Calculate percentage relative to largest segment
    const maxSegmentSize = Math.max(
      ...membersBySegment.map(set => set.size)
    );

    return {
      count: overlap.length,
      percentage: maxSegmentSize > 0 ? overlap.length / maxSegmentSize : 0,
      personIds: overlap,
    };
  }

  // =========================================================================
  // Convenience Methods
  // =========================================================================

  /**
   * Get Power Users segment
   */
  async getPowerUsers(videoRenderThreshold: number = 10): Promise<{
    segmentId: string;
    members: string[];
  }> {
    // Check if segment exists
    const existing = this.listSegments().find(s => s.name === 'Power Users');
    let segmentId = existing?.segmentId;

    if (!segmentId) {
      const segment = this.createSegmentFromTemplate(
        'Power Users',
        SegmentTemplates.powerUsers(videoRenderThreshold)
      );
      segmentId = segment.segmentId;
    }

    const memberships = this.segmentEngine.getSegmentMembers(segmentId);
    return {
      segmentId,
      members: memberships.map(m => m.personId),
    };
  }

  /**
   * Get Churn Risk segment
   */
  async getChurnRiskUsers(inactiveDays: number = 30): Promise<{
    segmentId: string;
    members: string[];
  }> {
    const existing = this.listSegments().find(s => s.name === 'Churn Risk');
    let segmentId = existing?.segmentId;

    if (!segmentId) {
      const segment = this.createSegmentFromTemplate(
        'Churn Risk',
        SegmentTemplates.churnRisk(inactiveDays),
        `Users inactive for ${inactiveDays}+ days`
      );
      segmentId = segment.segmentId;
    }

    const memberships = this.segmentEngine.getSegmentMembers(segmentId);
    return {
      segmentId,
      members: memberships.map(m => m.personId),
    };
  }

  /**
   * Get Trial to Paid Converters segment
   */
  async getTrialToPaidConverters(): Promise<{
    segmentId: string;
    members: string[];
  }> {
    const existing = this.listSegments().find(s => s.name === 'Trial to Paid Converters');
    let segmentId = existing?.segmentId;

    if (!segmentId) {
      const segment = this.createSegmentFromTemplate(
        'Trial to Paid Converters',
        SegmentTemplates.trialToPaidConverters(),
        'Users who converted from trial to paid in last 7 days'
      );
      segmentId = segment.segmentId;
    }

    const memberships = this.segmentEngine.getSegmentMembers(segmentId);
    return {
      segmentId,
      members: memberships.map(m => m.personId),
    };
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let instance: GrowthDataPlaneWithSegments | null = null;

/**
 * Get or create singleton instance
 */
export function getGrowthDataPlane(debug: boolean = false): GrowthDataPlaneWithSegments {
  if (!instance) {
    instance = new GrowthDataPlaneWithSegments(debug);
  }
  return instance;
}

/**
 * Reset singleton (for testing)
 */
export function resetGrowthDataPlane(): void {
  instance = null;
}

export default GrowthDataPlaneWithSegments;
