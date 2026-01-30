/**
 * UTM Tracking Integration for EverReach Ad Variants
 *
 * Builds UTM parameters for each ad variant to track:
 * - utm_source: Ad platform (meta, instagram, facebook, tiktok)
 * - utm_medium: Ad medium (cpc for paid ads)
 * - utm_campaign: Campaign ID
 * - utm_content: Variant identifier (prompt_id, awareness, belief, hook, size)
 * - utm_term: Optional keyword targeting info
 *
 * Example: ?utm_source=instagram&utm_medium=cpc&utm_campaign=everreach_q1_2026
 *          &utm_content=UA_TIMING_01_unaware_too_busy
 *          &utm_term=relationship_management
 */

import { AdAngle } from './angles';
import { AwarenessLevel, BeliefCluster, adSizes } from './config';

// =============================================================================
// Types
// =============================================================================

export interface UTMParams {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term?: string;
}

export interface AdVariantMetadata {
  adId: string;
  angleId: string;
  awareness: AwarenessLevel;
  belief: BeliefCluster;
  platform: string;
  adSize: string;
  testGroupId?: string;
  cohort?: string;
  timestamp?: number;
}

// =============================================================================
// UTM Builder
// =============================================================================

/**
 * Build UTM parameters for an ad variant
 *
 * @param angle - The ad angle configuration
 * @param platform - Ad platform (instagram, facebook, tiktok, meta)
 * @param campaignId - Campaign identifier
 * @param adSize - Ad size (e.g., "1080x1080", "1080x1920")
 * @param testGroupId - Optional test group identifier
 * @returns UTM parameters ready for URL encoding
 */
export function buildUtmParams(
  angle: AdAngle,
  platform: string,
  campaignId: string,
  adSize: string,
  testGroupId?: string
): UTMParams {
  // Normalize platform name
  const normalizedPlatform = platform.toLowerCase();
  const validPlatforms = ['instagram', 'facebook', 'tiktok', 'meta', 'linkedin', 'twitter'];
  const source = validPlatforms.includes(normalizedPlatform)
    ? normalizedPlatform
    : 'social';

  // UTM content encodes all variant info for easy analysis
  // Format: {angleId}_{awareness}_{belief}_{adSize}
  const utmContent = `${angle.id}_${angle.awareness}_${angle.belief}_${adSize.replace('x', '_')}`;

  const params: UTMParams = {
    utm_source: source,
    utm_medium: 'cpc', // Assume paid ads
    utm_campaign: campaignId,
    utm_content: utmContent,
  };

  // Add test group if provided
  if (testGroupId) {
    params.utm_content += `_${testGroupId}`;
  }

  return params;
}

/**
 * Build complete tracking URL
 *
 * @param baseUrl - Base URL to append parameters to
 * @param params - UTM parameters
 * @returns Complete URL with UTM parameters
 */
export function buildTrackedUrl(baseUrl: string, params: UTMParams): string {
  const url = new URL(baseUrl);

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.append(key, value);
    }
  });

  return url.toString();
}

/**
 * Build UTM parameters from ad variant metadata
 */
export function buildUtmParamsFromMetadata(
  metadata: AdVariantMetadata,
  campaignId: string
): UTMParams {
  const utmContent = `${metadata.angleId}_${metadata.awareness}_${metadata.belief}_${metadata.adSize.replace('x', '_')}`;

  return {
    utm_source: metadata.platform.toLowerCase(),
    utm_medium: 'cpc',
    utm_campaign: campaignId,
    utm_content: metadata.cohort ? `${utmContent}_${metadata.cohort}` : utmContent,
    utm_term: metadata.testGroupId,
  };
}

// =============================================================================
// Parsing & Analysis
// =============================================================================

/**
 * Parse UTM content to extract variant information
 *
 * @param utmContent - The utm_content parameter value
 * @returns Parsed variant info or null if invalid
 */
export function parseUtmContent(utmContent: string): {
  angleId: string;
  awareness: string;
  belief: string;
  adSize: string;
  testGroup?: string;
} | null {
  const parts = utmContent.split('_');
  if (parts.length < 4) return null;

  // Extract test group if present (optional last part)
  let testGroup: string | undefined;
  if (parts.length > 4) {
    // Last part might be test group or part of ad size
    const lastPart = parts[parts.length - 1];
    if (!/^\d+$/.test(lastPart)) {
      testGroup = lastPart;
      parts.pop();
    }
  }

  // Reconstruct ad size from remaining numeric parts at the end
  const lastTwo = parts.slice(-2);
  let adSize = '';
  let angleId = '';

  if (lastTwo.every(p => /^\d+$/.test(p))) {
    adSize = `${lastTwo[0]}x${lastTwo[1]}`;
    parts.splice(-2);
    angleId = parts[0];
  } else {
    angleId = parts[0];
    // Could not parse ad size
    return null;
  }

  if (parts.length < 3) return null;

  return {
    angleId,
    awareness: parts[1],
    belief: parts[2],
    adSize,
    testGroup,
  };
}

/**
 * Generate tracking pixel URL for ad impressions
 *
 * @param trackingServerUrl - Base tracking server URL
 * @param params - UTM parameters
 * @returns Pixel URL to embed in ads
 */
export function generatePixelUrl(
  trackingServerUrl: string,
  params: UTMParams
): string {
  const url = new URL(trackingServerUrl);

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.append(key, value);
    }
  });

  return url.toString();
}

// =============================================================================
// Report Generation
// =============================================================================

export interface UTMMetrics {
  angleId: string;
  awareness: string;
  belief: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number; // Click-through rate
  cr: number; // Conversion rate
  cpc: number; // Cost per click
  roi: number; // Return on investment
}

/**
 * Generate performance report for ad variants
 */
export function generateVariantReport(
  variants: Array<{
    utmContent: string;
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
  }>
): UTMMetrics[] {
  return variants
    .map(v => {
      const parsed = parseUtmContent(v.utmContent);
      if (!parsed) return null;

      const ctr = v.impressions > 0 ? (v.clicks / v.impressions) * 100 : 0;
      const cr = v.clicks > 0 ? (v.conversions / v.clicks) * 100 : 0;
      const cpc = v.clicks > 0 ? v.spend / v.clicks : 0;
      const roi = v.conversions > 0 && v.spend > 0 ? (v.conversions / v.spend) * 100 : 0;

      return {
        angleId: parsed.angleId,
        awareness: parsed.awareness,
        belief: parsed.belief,
        impressions: v.impressions,
        clicks: v.clicks,
        conversions: v.conversions,
        ctr,
        cr,
        cpc,
        roi,
      };
    })
    .filter((x): x is UTMMetrics => x !== null)
    .sort((a, b) => b.roi - a.roi);
}

// =============================================================================
// HTML/Component Integration
// =============================================================================

/**
 * Build click tracking wrapper
 * Useful for tracking link clicks in ads
 */
export function buildClickTrackingWrapper(
  linkUrl: string,
  params: UTMParams,
  trackingServerUrl?: string
): string {
  const trackedUrl = buildTrackedUrl(linkUrl, params);

  // If tracking server provided, also ping it
  if (trackingServerUrl) {
    const pixelUrl = generatePixelUrl(trackingServerUrl, {
      ...params,
      utm_medium: 'click-tracking',
    });
    return `${trackedUrl}&pixel=${encodeURIComponent(pixelUrl)}`;
  }

  return trackedUrl;
}

/**
 * Export functions for use in video compositions
 */
export default {
  buildUtmParams,
  buildTrackedUrl,
  buildUtmParamsFromMetadata,
  parseUtmContent,
  generatePixelUrl,
  generateVariantReport,
  buildClickTrackingWrapper,
};
