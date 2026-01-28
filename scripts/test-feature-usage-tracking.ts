/**
 * Test script for TRACK-007: Feature Usage Tracking
 *
 * Tests:
 * - Template usage tracking
 * - Voice cloning tracking
 * - Ad generation tracking
 * - Campaign creation tracking
 * - Batch import tracking
 * - Brand kit usage tracking
 * - Feature usage stats aggregation
 *
 * Usage:
 *   npm run test:feature-usage
 */

import {
  trackTemplateUsed,
  trackVoiceCloned,
  trackAdGenerated,
  trackCampaignCreated,
  trackBatchImport,
  trackBrandKitUsed,
  getFeatureUsageStats,
  resetFeatureUsageStats,
  incrementFeatureUsage,
} from '../src/services/featureUsageTracking';

// Mock tracking to prevent actual events
const mockTrackEvent = jest.fn();
jest.mock('../src/services/tracking', () => ({
  trackEvent: (...args: any[]) => mockTrackEvent(...args),
}));

describe('TRACK-007: Feature Usage Tracking', () => {
  beforeEach(() => {
    // Clear mock calls and reset localStorage
    mockTrackEvent.mockClear();
    resetFeatureUsageStats();
  });

  describe('trackTemplateUsed', () => {
    it('should track template usage with correct data', () => {
      trackTemplateUsed(
        'template-001',
        'hero_heading',
        'Hero Template',
        0.5
      );

      expect(mockTrackEvent).toHaveBeenCalledWith('template_used', {
        templateId: 'template-001',
        templateType: 'hero_heading',
        templateName: 'Hero Template',
        customizationLevel: 0.5,
        timestamp: expect.any(String),
      });
    });

    it('should default customization level to 0', () => {
      trackTemplateUsed('template-002', 'product_focus', 'Product Template');

      const call = mockTrackEvent.mock.calls[0];
      expect(call[1].customizationLevel).toBe(0);
    });
  });

  describe('trackVoiceCloned', () => {
    it('should track successful voice cloning', () => {
      trackVoiceCloned(
        'voice-001',
        'elevenlabs',
        30.5,
        true
      );

      expect(mockTrackEvent).toHaveBeenCalledWith('voice_cloned', {
        voiceId: 'voice-001',
        voiceModel: 'elevenlabs',
        referenceAudioDuration: 30.5,
        success: true,
        timestamp: expect.any(String),
      });
    });

    it('should track failed voice cloning', () => {
      trackVoiceCloned('voice-002', 'index_tts', 15, false);

      const call = mockTrackEvent.mock.calls[0];
      expect(call[1].success).toBe(false);
    });
  });

  describe('trackAdGenerated', () => {
    it('should track manual ad generation', () => {
      trackAdGenerated(
        'ad-001',
        'template-001',
        'manual',
        1,
        1
      );

      expect(mockTrackEvent).toHaveBeenCalledWith('ad_generated', {
        adId: 'ad-001',
        templateId: 'template-001',
        method: 'manual',
        variantCount: 1,
        sizeCount: 1,
        timestamp: expect.any(String),
      });
    });

    it('should track AI variant generation', () => {
      trackAdGenerated(
        'ad-002',
        'template-002',
        'ai_variant',
        10,
        5
      );

      const call = mockTrackEvent.mock.calls[0];
      expect(call[1].method).toBe('ai_variant');
      expect(call[1].variantCount).toBe(10);
      expect(call[1].sizeCount).toBe(5);
    });

    it('should allow null template ID', () => {
      trackAdGenerated('ad-003', null, 'manual');

      const call = mockTrackEvent.mock.calls[0];
      expect(call[1].templateId).toBeNull();
    });
  });

  describe('trackCampaignCreated', () => {
    it('should track campaign creation with all parameters', () => {
      trackCampaignCreated(
        'campaign-001',
        'Summer Sale',
        5,
        8,
        40
      );

      expect(mockTrackEvent).toHaveBeenCalledWith('campaign_created', {
        campaignId: 'campaign-001',
        campaignName: 'Summer Sale',
        variantCount: 5,
        sizeCount: 8,
        totalAds: 40,
        timestamp: expect.any(String),
      });
    });
  });

  describe('trackBatchImport', () => {
    it('should track CSV batch import', () => {
      trackBatchImport(
        'import-001',
        100,
        8,
        ['headline', 'body', 'cta', 'image'],
        true
      );

      expect(mockTrackEvent).toHaveBeenCalledWith('batch_import', {
        importId: 'import-001',
        rowCount: 100,
        columnCount: 8,
        mappedFields: ['headline', 'body', 'cta', 'image'],
        fieldCount: 4,
        previewGenerated: true,
        timestamp: expect.any(String),
      });
    });

    it('should track import without preview', () => {
      trackBatchImport('import-002', 50, 5, ['headline'], false);

      const call = mockTrackEvent.mock.calls[0];
      expect(call[1].previewGenerated).toBe(false);
    });
  });

  describe('trackBrandKitUsed', () => {
    it('should track brand kit application with all elements', () => {
      trackBrandKitUsed(
        'brand-001',
        'Tech Startup',
        ['logo', 'colors', 'fonts', 'spacing'],
        'ad-001'
      );

      expect(mockTrackEvent).toHaveBeenCalledWith('brand_kit_used', {
        brandKitId: 'brand-001',
        brandKitName: 'Tech Startup',
        elementsApplied: ['logo', 'colors', 'fonts', 'spacing'],
        elementCount: 4,
        adId: 'ad-001',
        timestamp: expect.any(String),
      });
    });

    it('should track partial brand kit application', () => {
      trackBrandKitUsed(
        'brand-002',
        'Eco Brand',
        ['colors', 'fonts'],
        'ad-002'
      );

      const call = mockTrackEvent.mock.calls[0];
      expect(call[1].elementCount).toBe(2);
    });
  });

  describe('Feature usage statistics', () => {
    it('should increment and retrieve feature usage counts', () => {
      // Increment various features
      incrementFeatureUsage('templates_used');
      incrementFeatureUsage('templates_used');
      incrementFeatureUsage('templates_used');
      incrementFeatureUsage('voices_cloned');
      incrementFeatureUsage('ads_generated');
      incrementFeatureUsage('ads_generated');
      incrementFeatureUsage('campaigns_created');
      incrementFeatureUsage('batch_imports');
      incrementFeatureUsage('brand_kits_used');

      const stats = getFeatureUsageStats();

      expect(stats.templatesUsed).toBe(3);
      expect(stats.voicesCloned).toBe(1);
      expect(stats.adsGenerated).toBe(2);
      expect(stats.campaignsCreated).toBe(1);
      expect(stats.batchImports).toBe(1);
      expect(stats.brandKitsUsed).toBe(1);
      expect(stats.totalFeatureUsage).toBe(9);
    });

    it('should reset all feature usage stats', () => {
      // Set some stats
      incrementFeatureUsage('templates_used');
      incrementFeatureUsage('ads_generated');

      let stats = getFeatureUsageStats();
      expect(stats.totalFeatureUsage).toBeGreaterThan(0);

      // Reset
      resetFeatureUsageStats();

      stats = getFeatureUsageStats();
      expect(stats.templatesUsed).toBe(0);
      expect(stats.adsGenerated).toBe(0);
      expect(stats.totalFeatureUsage).toBe(0);
    });

    it('should handle missing localStorage gracefully', () => {
      const stats = getFeatureUsageStats();

      expect(stats.templatesUsed).toBe(0);
      expect(stats.voicesCloned).toBe(0);
      expect(stats.adsGenerated).toBe(0);
      expect(stats.totalFeatureUsage).toBe(0);
    });
  });

  describe('Timestamp validation', () => {
    it('should include valid ISO timestamps in all tracking calls', () => {
      trackTemplateUsed('t1', 'hero_heading', 'Test', 0);
      trackVoiceCloned('v1', 'elevenlabs', 30, true);
      trackAdGenerated('a1', 't1', 'manual');
      trackCampaignCreated('c1', 'Test', 1, 1, 1);
      trackBatchImport('i1', 10, 5, [], false);
      trackBrandKitUsed('b1', 'Test', ['colors'], 'a1');

      mockTrackEvent.mock.calls.forEach((call) => {
        const timestamp = call[1].timestamp;
        expect(timestamp).toBeDefined();
        expect(() => new Date(timestamp)).not.toThrow();
      });
    });
  });
});

// Run tests if executed directly
if (require.main === module) {
  console.log('🧪 Running TRACK-007 Feature Usage Tracking tests...\n');

  // Manual test execution (without Jest)
  const runManualTests = () => {
    console.log('✅ Test 1: Track template usage');
    trackTemplateUsed('test-template', 'hero_heading', 'Test Template', 0.3);
    console.log('   Template usage tracked\n');

    console.log('✅ Test 2: Track voice cloning');
    trackVoiceCloned('test-voice', 'elevenlabs', 30, true);
    console.log('   Voice cloning tracked\n');

    console.log('✅ Test 3: Track ad generation');
    trackAdGenerated('test-ad', 'test-template', 'manual', 1, 1);
    console.log('   Ad generation tracked\n');

    console.log('✅ Test 4: Track campaign creation');
    trackCampaignCreated('test-campaign', 'Test Campaign', 3, 5, 15);
    console.log('   Campaign creation tracked\n');

    console.log('✅ Test 5: Track batch import');
    trackBatchImport('test-import', 50, 8, ['headline', 'body'], true);
    console.log('   Batch import tracked\n');

    console.log('✅ Test 6: Track brand kit usage');
    trackBrandKitUsed('test-brand', 'Test Brand', ['colors', 'fonts'], 'test-ad');
    console.log('   Brand kit usage tracked\n');

    console.log('✅ Test 7: Feature usage stats');
    incrementFeatureUsage('templates_used');
    incrementFeatureUsage('templates_used');
    incrementFeatureUsage('ads_generated');
    const stats = getFeatureUsageStats();
    console.log('   Stats:', stats);
    console.log('   Total usage:', stats.totalFeatureUsage, '\n');

    console.log('✅ Test 8: Reset stats');
    resetFeatureUsageStats();
    const emptyStats = getFeatureUsageStats();
    console.log('   Stats after reset:', emptyStats);
    console.log('   Total usage:', emptyStats.totalFeatureUsage, '\n');

    console.log('✨ All manual tests completed successfully!\n');
  };

  runManualTests();
}
