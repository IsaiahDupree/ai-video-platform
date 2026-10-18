/**
 * Segment Engine Tests
 *
 * Tests for GDP-004: Segment Engine
 * Validates:
 * - Segment creation and management
 * - Real-time membership evaluation
 * - Automation triggers
 * - Integration with Growth Data Plane
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { SegmentEngine, SegmentTemplates, SegmentDefinition } from '../segment-engine';
import { GrowthDataPlaneWithSegments } from '../segment-integration';
import { InMemoryGrowthDataPlane, EventBuilder } from '../growth-data-plane';

describe('SegmentEngine', () => {
  let engine: SegmentEngine;

  beforeEach(() => {
    engine = new SegmentEngine(false);
  });

  describe('Segment Management', () => {
    it('should create a segment', () => {
      const segment = engine.createSegment(
        'Test Segment',
        [
          {
            condition: 'property',
            property: 'status',
            operator: 'equals',
            value: 'paid',
          },
        ],
        'Test description'
      );

      expect(segment.name).toBe('Test Segment');
      expect(segment.rules.length).toBe(1);
      expect(segment.isActive).toBe(true);
    });

    it('should retrieve segment by ID', () => {
      const created = engine.createSegment('Test', []);
      const retrieved = engine.getSegment(created.segmentId);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.name).toBe('Test');
    });

    it('should list all segments', () => {
      engine.createSegment('Segment 1', []);
      engine.createSegment('Segment 2', []);

      const all = engine.getAllSegments();
      expect(all.length).toBe(2);
    });

    it('should update segment', () => {
      const created = engine.createSegment('Original', []);
      const updated = engine.updateSegment(created.segmentId, {
        name: 'Updated',
      });

      expect(updated.name).toBe('Updated');
    });

    it('should delete segment', () => {
      const created = engine.createSegment('To Delete', []);
      engine.deleteSegment(created.segmentId);

      expect(engine.getSegment(created.segmentId)).toBeNull();
    });
  });

  describe('Segment Evaluation', () => {
    it('should evaluate property-based rule', async () => {
      const segment = engine.createSegment('Paid Users', [
        {
          condition: 'property',
          property: 'status',
          operator: 'equals',
          value: 'paid',
        },
      ]);

      const context = {
        person: {
          personId: 'p1',
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'paid' as const,
          totalEvents: 5,
          totalSpent: 100,
        },
        events: [],
        subscriptions: [],
        currentDate: new Date(),
      };

      const matches = await engine.evaluateSegment(segment.segmentId, context);
      expect(matches).toBe(true);
    });

    it('should evaluate event-based rule', async () => {
      const segment = engine.createSegment('Active Users', [
        {
          condition: 'event',
          eventType: 'video_rendered',
          eventCount: { gte: 1 },
          eventWindow: '30d',
        },
      ]);

      const now = new Date();
      const context = {
        person: {
          personId: 'p1',
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'active' as const,
          totalEvents: 5,
          totalSpent: 0,
        },
        events: [
          {
            eventId: 'e1',
            personId: 'p1',
            timestamp: now,
            eventType: 'video_rendered',
            category: 'core_value' as const,
            properties: {},
            source: 'app' as const,
          },
        ],
        subscriptions: [],
        currentDate: now,
      };

      const matches = await engine.evaluateSegment(segment.segmentId, context);
      expect(matches).toBe(true);
    });

    it('should not match when conditions not met', async () => {
      const segment = engine.createSegment('Paid Users', [
        {
          condition: 'property',
          property: 'status',
          operator: 'equals',
          value: 'paid',
        },
      ]);

      const context = {
        person: {
          personId: 'p1',
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'trial' as const,
          totalEvents: 0,
          totalSpent: 0,
        },
        events: [],
        subscriptions: [],
        currentDate: new Date(),
      };

      const matches = await engine.evaluateSegment(segment.segmentId, context);
      expect(matches).toBe(false);
    });
  });

  describe('Membership Management', () => {
    it('should add membership', async () => {
      const segment = engine.createSegment('Test', []);
      const membership = await engine.addMembership('person1', segment.segmentId);

      expect(membership.personId).toBe('person1');
      expect(membership.segmentId).toBe(segment.segmentId);
      expect(membership.isActive).toBe(true);
    });

    it('should check membership', async () => {
      const segment = engine.createSegment('Test', []);
      await engine.addMembership('person1', segment.segmentId);

      const isMember = await engine.isInSegment('person1', segment.segmentId);
      expect(isMember).toBe(true);
    });

    it('should remove membership', async () => {
      const segment = engine.createSegment('Test', []);
      await engine.addMembership('person1', segment.segmentId);
      await engine.removeMembership('person1', segment.segmentId);

      const isMember = await engine.isInSegment('person1', segment.segmentId);
      expect(isMember).toBe(false);
    });

    it('should get segment members', async () => {
      const segment = engine.createSegment('Test', []);
      await engine.addMembership('person1', segment.segmentId);
      await engine.addMembership('person2', segment.segmentId);

      const members = engine.getSegmentMembers(segment.segmentId);
      expect(members.length).toBe(2);
    });
  });

  describe('Segment Templates', () => {
    it('should create power users segment', () => {
      const rules = SegmentTemplates.powerUsers(10, '30d');
      expect(rules.length).toBe(2);
      expect(rules[0].condition).toBe('event');
      expect(rules[1].condition).toBe('property');
    });

    it('should create churn risk segment', () => {
      const rules = SegmentTemplates.churnRisk(30);
      expect(rules.length).toBe(2);
    });

    it('should create trial to paid segment', () => {
      const rules = SegmentTemplates.trialToPaidConverters('7d');
      expect(rules.length).toBe(2);
    });
  });

  describe('Automations', () => {
    it('should create automation', () => {
      const segment = engine.createSegment('Test', []);
      const automation = engine.createAutomation({
        segmentId: segment.segmentId,
        trigger: 'enter',
        action: 'email',
        actionConfig: {
          email: { templateId: 'welcome' },
        },
        isActive: true,
      });

      expect(automation.action).toBe('email');
      expect(automation.trigger).toBe('enter');
    });

    it('should get segment automations', () => {
      const segment = engine.createSegment('Test', []);
      engine.createAutomation({
        segmentId: segment.segmentId,
        trigger: 'enter',
        action: 'email',
        actionConfig: { email: { templateId: 'welcome' } },
        isActive: true,
      });

      const automations = engine.getSegmentAutomations(segment.segmentId);
      expect(automations.length).toBe(1);
    });
  });

  describe('Statistics', () => {
    it('should get segment statistics', async () => {
      const segment = engine.createSegment('Test', []);
      await engine.addMembership('p1', segment.segmentId);
      await engine.addMembership('p2', segment.segmentId);

      const stats = engine.getSegmentStats(segment.segmentId);
      expect(stats?.totalMembers).toBe(2);
      expect(stats?.activeMembers).toBe(2);
    });
  });
});

describe('GrowthDataPlaneWithSegments', () => {
  let gdp: GrowthDataPlaneWithSegments;

  beforeEach(() => {
    gdp = new GrowthDataPlaneWithSegments(false);
  });

  describe('Integration', () => {
    it('should create segment through integrated API', () => {
      const segment = gdp.createSegment('Test', [
        {
          condition: 'property',
          property: 'status',
          operator: 'equals',
          value: 'paid',
        },
      ]);

      expect(segment.name).toBe('Test');
    });

    it('should list segments', () => {
      gdp.createSegment('Segment 1', []);
      gdp.createSegment('Segment 2', []);

      const segments = gdp.listSegments();
      expect(segments.length).toBe(2);
    });

    it('should get segment members', async () => {
      const segment = gdp.createSegment('Test', []);
      const engine = gdp.getSegmentEngine();

      await engine.addMembership('p1', segment.segmentId);
      await engine.addMembership('p2', segment.segmentId);

      const members = gdp.getSegmentMembers(segment.segmentId);
      expect(members.length).toBe(2);
    });

    it('should get segment statistics', async () => {
      const segment = gdp.createSegment('Test', []);
      const engine = gdp.getSegmentEngine();

      await engine.addMembership('p1', segment.segmentId);

      const stats = gdp.getSegmentStats(segment.segmentId);
      expect(stats?.activeMembers).toBe(1);
    });

    it('should get segment overlap', async () => {
      const s1 = gdp.createSegment('Segment 1', []);
      const s2 = gdp.createSegment('Segment 2', []);
      const engine = gdp.getSegmentEngine();

      await engine.addMembership('p1', s1.segmentId);
      await engine.addMembership('p1', s2.segmentId);
      await engine.addMembership('p2', s1.segmentId);

      const overlap = gdp.getSegmentOverlap([s1.segmentId, s2.segmentId]);
      expect(overlap.count).toBe(1);
      expect(overlap.personIds).toContain('p1');
    });
  });

  describe('Convenience Methods', () => {
    it('should get power users', async () => {
      const result = await gdp.getPowerUsers(10);
      expect(result.segmentId).toBeDefined();
      expect(Array.isArray(result.members)).toBe(true);
    });

    it('should get churn risk users', async () => {
      const result = await gdp.getChurnRiskUsers(30);
      expect(result.segmentId).toBeDefined();
      expect(Array.isArray(result.members)).toBe(true);
    });

    it('should get trial to paid converters', async () => {
      const result = await gdp.getTrialToPaidConverters();
      expect(result.segmentId).toBeDefined();
      expect(Array.isArray(result.members)).toBe(true);
    });
  });
});
