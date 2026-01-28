/**
 * Feature Usage Tracking Service
 *
 * Tracks which features users engage with to understand feature adoption
 * and usage patterns. This helps identify popular features and underutilized
 * features that may need promotion or improvement.
 *
 * Events tracked:
 * - template_used: When a user selects/applies a template
 * - voice_cloned: When a user creates a voice clone
 * - ad_generated: When a user generates an ad creative
 * - campaign_created: When a user creates a campaign
 * - batch_import: When a user imports a CSV for batch processing
 * - brand_kit_used: When a user applies a brand kit
 *
 * @module featureUsageTracking
 */

import { tracking } from './tracking';

/**
 * Template types available in the system
 */
export type TemplateType =
  | 'hero_heading'
  | 'product_focus'
  | 'testimonial'
  | 'feature_showcase'
  | 'app_screenshot'
  | 'event_promo'
  | 'sale_announcement'
  | 'social_proof'
  | 'comparison'
  | 'before_after';

/**
 * Voice model types for voice cloning
 */
export type VoiceModel =
  | 'elevenlabs'
  | 'openai_tts'
  | 'index_tts'
  | 'custom';

/**
 * Ad generation methods
 */
export type AdGenerationMethod =
  | 'manual'
  | 'template'
  | 'ai_variant'
  | 'csv_import';

/**
 * Track when a user selects and applies a template
 *
 * @param templateId - Unique identifier for the template
 * @param templateType - Category of the template
 * @param templateName - Display name of the template
 * @param customizationLevel - How much the template was customized (0-1)
 */
export function trackTemplateUsed(
  templateId: string,
  templateType: TemplateType,
  templateName: string,
  customizationLevel: number = 0
): void {
  tracking.track('template_used', {
    templateId,
    templateType,
    templateName,
    customizationLevel,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track when a user creates a voice clone
 *
 * @param voiceId - Unique identifier for the voice
 * @param voiceModel - AI model used for cloning
 * @param referenceAudioDuration - Length of reference audio in seconds
 * @param success - Whether the cloning was successful
 */
export function trackVoiceCloned(
  voiceId: string,
  voiceModel: VoiceModel,
  referenceAudioDuration: number,
  success: boolean
): void {
  tracking.track('voice_cloned', {
    voiceId,
    voiceModel,
    referenceAudioDuration,
    success,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track when a user generates an ad creative
 *
 * @param adId - Unique identifier for the ad
 * @param templateId - Template used (if any)
 * @param method - How the ad was generated
 * @param variantCount - Number of variants created
 * @param sizeCount - Number of sizes rendered
 */
export function trackAdGenerated(
  adId: string,
  templateId: string | null,
  method: AdGenerationMethod,
  variantCount: number = 1,
  sizeCount: number = 1
): void {
  tracking.track('ad_generated', {
    adId,
    templateId,
    method,
    variantCount,
    sizeCount,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track when a user creates a campaign
 *
 * @param campaignId - Unique identifier for the campaign
 * @param campaignName - User-provided campaign name
 * @param variantCount - Number of copy variants
 * @param sizeCount - Number of ad sizes
 * @param totalAds - Total ads in campaign (variants × sizes)
 */
export function trackCampaignCreated(
  campaignId: string,
  campaignName: string,
  variantCount: number,
  sizeCount: number,
  totalAds: number
): void {
  tracking.track('campaign_created', {
    campaignId,
    campaignName,
    variantCount,
    sizeCount,
    totalAds,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track when a user imports a CSV for batch processing
 *
 * @param importId - Unique identifier for the import
 * @param rowCount - Number of rows in the CSV
 * @param columnCount - Number of columns in the CSV
 * @param mappedFields - Fields that were mapped to template
 * @param previewGenerated - Whether user generated previews
 */
export function trackBatchImport(
  importId: string,
  rowCount: number,
  columnCount: number,
  mappedFields: string[],
  previewGenerated: boolean
): void {
  tracking.track('batch_import', {
    importId,
    rowCount,
    columnCount,
    mappedFields,
    fieldCount: mappedFields.length,
    previewGenerated,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track when a user applies a brand kit to their creative
 *
 * @param brandKitId - Unique identifier for the brand kit
 * @param brandKitName - Display name of the brand kit
 * @param elementsApplied - Which brand elements were applied
 * @param adId - ID of the ad the brand kit was applied to
 */
export function trackBrandKitUsed(
  brandKitId: string,
  brandKitName: string,
  elementsApplied: Array<'logo' | 'colors' | 'fonts' | 'spacing'>,
  adId: string
): void {
  tracking.track('brand_kit_used', {
    brandKitId,
    brandKitName,
    elementsApplied,
    elementCount: elementsApplied.length,
    adId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Get feature usage statistics for a user
 * Aggregates usage data from localStorage
 *
 * @returns Object with usage counts per feature
 */
export function getFeatureUsageStats(): {
  templatesUsed: number;
  voicesCloned: number;
  adsGenerated: number;
  campaignsCreated: number;
  batchImports: number;
  brandKitsUsed: number;
  totalFeatureUsage: number;
} {
  if (typeof window === 'undefined') {
    return {
      templatesUsed: 0,
      voicesCloned: 0,
      adsGenerated: 0,
      campaignsCreated: 0,
      batchImports: 0,
      brandKitsUsed: 0,
      totalFeatureUsage: 0,
    };
  }

  const stats = {
    templatesUsed: parseInt(localStorage.getItem('feature_usage:templates_used') || '0'),
    voicesCloned: parseInt(localStorage.getItem('feature_usage:voices_cloned') || '0'),
    adsGenerated: parseInt(localStorage.getItem('feature_usage:ads_generated') || '0'),
    campaignsCreated: parseInt(localStorage.getItem('feature_usage:campaigns_created') || '0'),
    batchImports: parseInt(localStorage.getItem('feature_usage:batch_imports') || '0'),
    brandKitsUsed: parseInt(localStorage.getItem('feature_usage:brand_kits_used') || '0'),
    totalFeatureUsage: 0,
  };

  stats.totalFeatureUsage =
    stats.templatesUsed +
    stats.voicesCloned +
    stats.adsGenerated +
    stats.campaignsCreated +
    stats.batchImports +
    stats.brandKitsUsed;

  return stats;
}

/**
 * Increment feature usage counter in localStorage
 *
 * @param feature - Feature name to increment
 */
export function incrementFeatureUsage(feature: string): void {
  if (typeof window === 'undefined') return;

  const key = `feature_usage:${feature}`;
  const current = parseInt(localStorage.getItem(key) || '0');
  localStorage.setItem(key, (current + 1).toString());
}

/**
 * Reset feature usage statistics
 * Useful for testing or user data export/deletion
 */
export function resetFeatureUsageStats(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('feature_usage:templates_used');
  localStorage.removeItem('feature_usage:voices_cloned');
  localStorage.removeItem('feature_usage:ads_generated');
  localStorage.removeItem('feature_usage:campaigns_created');
  localStorage.removeItem('feature_usage:batch_imports');
  localStorage.removeItem('feature_usage:brand_kits_used');
}
