/**
 * EverReach Ad Component with UTM Tracking Integration
 *
 * Wraps the base EverReachAds component to add UTM parameter injection
 * and tracking metadata for analysis.
 */

import React, { useMemo } from 'react';
import { EverReachAds, EverReachAdProps } from './EverReachAds';
import {
  buildUtmParams,
  buildTrackedUrl,
  buildUtmParamsFromMetadata,
  AdVariantMetadata,
  UTMParams,
} from './utm-builder';
import { AdAngle } from './angles';

// =============================================================================
// Types
// =============================================================================

export interface EverReachAdWithTrackingProps extends EverReachAdProps {
  // Tracking Configuration
  campaignId: string;
  platform: string; // 'instagram', 'facebook', 'tiktok', 'meta', etc.
  adSize: string; // e.g., '1080x1080', '1080x1920'

  // Optional: Ad Angle (if using variant angles)
  angle?: AdAngle;

  // Optional: CTAssistant Track Server
  trackingServerUrl?: string;
  testGroupId?: string;
  cohort?: string;

  // Optional: Callback when tracking URL is generated
  onTrackingUrlGenerated?: (url: string, params: UTMParams) => void;
}

// =============================================================================
// Component
// =============================================================================

/**
 * EverReachAdWithTracking
 *
 * Adds UTM parameter generation and tracking metadata to EverReach ads.
 * Useful for A/B testing different ad angles and measuring performance.
 *
 * Example:
 * ```tsx
 * <EverReachAdWithTracking
 *   campaignId="everreach_q1_2026"
 *   platform="instagram"
 *   adSize="1080x1080"
 *   angle={angle}
 *   headline="Never let a relationship go cold"
 *   awareness="problem_aware"
 *   belief="too_busy"
 *   onTrackingUrlGenerated={(url, params) => {
 *     console.log('Track URL:', url);
 *   }}
 * />
 * ```
 */
export const EverReachAdWithTracking: React.FC<EverReachAdWithTrackingProps> = ({
  // Ad content props
  headline,
  subheadline,
  ctaText,
  awareness,
  belief,

  // Tracking props
  campaignId,
  platform,
  adSize,
  angle,
  trackingServerUrl,
  testGroupId,
  cohort,
  onTrackingUrlGenerated,

  // Other ad props
  ...adProps
}) => {
  // Generate UTM parameters
  const utmParams = useMemo(() => {
    if (angle) {
      return buildUtmParams(angle, platform, campaignId, adSize, testGroupId);
    }

    if (awareness && belief) {
      const metadata: AdVariantMetadata = {
        adId: `${awareness}_${belief}_${adSize}`,
        angleId: `${awareness}_${belief}`,
        awareness,
        belief,
        platform,
        adSize,
        testGroupId,
        cohort,
      };
      return buildUtmParamsFromMetadata(metadata, campaignId);
    }

    // Fallback minimal tracking
    return {
      utm_source: platform.toLowerCase(),
      utm_medium: 'cpc',
      utm_campaign: campaignId,
      utm_content: adSize.replace('x', '_'),
    };
  }, [angle, awareness, belief, platform, campaignId, adSize, testGroupId, cohort]);

  // Generate tracking URLs
  const trackingMetadata = useMemo(() => {
    // Build a sample tracking URL (would be used for links in the ad)
    const exampleUrl = new URL('https://example.com');
    const trackedUrl = buildTrackedUrl(exampleUrl.toString(), utmParams);

    // Notify parent component
    if (onTrackingUrlGenerated) {
      onTrackingUrlGenerated(trackedUrl, utmParams);
    }

    return {
      utmParams,
      trackedUrl,
      pixelUrl: trackingServerUrl
        ? new URL(trackingServerUrl)
        : null,
    };
  }, [utmParams, trackingServerUrl, onTrackingUrlGenerated]);

  // Add UTM parameters as data attributes for tracking
  const renderAdWithTracking = (
    <div
      data-utm-source={utmParams.utm_source}
      data-utm-medium={utmParams.utm_medium}
      data-utm-campaign={utmParams.utm_campaign}
      data-utm-content={utmParams.utm_content}
      data-utm-term={utmParams.utm_term}
      data-angle-id={angle?.id}
      data-awareness={awareness}
      data-belief={belief}
      data-platform={platform}
      data-ad-size={adSize}
      style={{ width: '100%', height: '100%' }}
    >
      <EverReachAds
        headline={headline}
        subheadline={subheadline}
        ctaText={ctaText}
        awareness={awareness}
        belief={belief}
        {...adProps}
      />
    </div>
  );

  return renderAdWithTracking;
};

// =============================================================================
// Batch Ad Generator with Tracking
// =============================================================================

export interface AdVariantConfig {
  angle: AdAngle;
  platforms: string[];
  adSizes: string[];
  campaignId: string;
  testGroupId?: string;
  cohort?: string;
}

/**
 * Generate multiple ad variants with tracking for A/B testing
 */
export function generateTrackedAdVariants(
  angles: AdAngle[],
  platforms: string[],
  adSizes: string[],
  campaignId: string,
  testGroupId?: string,
  cohort?: string
): Array<{
  angle: AdAngle;
  platform: string;
  adSize: string;
  utmParams: UTMParams;
}> {
  const variants = [];

  for (const angle of angles) {
    for (const platform of platforms) {
      for (const adSize of adSizes) {
        const utmParams = buildUtmParams(angle, platform, campaignId, adSize, testGroupId);
        variants.push({
          angle,
          platform,
          adSize,
          utmParams,
        });
      }
    }
  }

  return variants;
}

/**
 * Get UTM parameters for a specific ad variant
 */
export function getAdVariantUtmParams(
  angleId: string,
  platform: string,
  adSize: string,
  campaignId: string,
  angles: AdAngle[],
  testGroupId?: string
): UTMParams | null {
  const angle = angles.find(a => a.id === angleId);
  if (!angle) return null;

  return buildUtmParams(angle, platform, campaignId, adSize, testGroupId);
}

export default EverReachAdWithTracking;
