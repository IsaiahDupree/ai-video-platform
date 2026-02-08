/**
 * Meta Ads Manager CSV Exporter
 *
 * Generates a CSV file formatted for Meta Ads Manager bulk upload.
 * Each row represents one ad variant with its creative assets,
 * UTM parameters, and targeting metadata.
 */

import type { AdBatch, AdVariant } from './types';

// =============================================================================
// CSV Generation
// =============================================================================

const CSV_HEADERS = [
  'Ad Name',
  'Campaign Name',
  'Ad Set Name',
  'Headline',
  'Primary Text',
  'Call to Action',
  'Website URL',
  'Display Link',
  'Image File Path',
  'Video File Path',
  'UTM Source',
  'UTM Medium',
  'UTM Campaign',
  'UTM Content',
  'Template',
  'Hook Type',
  'Awareness Level',
  'CTA Type',
  'Color Scheme',
  'Status',
];

function escapeCSV(value: string): string {
  if (!value) return '';
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildWebsiteURL(variant: AdVariant, baseUrl: string): string {
  const params = new URLSearchParams();
  params.set('utm_source', variant.utmParams.utm_source || 'meta');
  params.set('utm_medium', variant.utmParams.utm_medium || 'paid_social');
  params.set('utm_campaign', variant.utmParams.utm_campaign);
  params.set('utm_content', variant.utmParams.utm_content);
  return `${baseUrl}?${params.toString()}`;
}

function mapCtaToMeta(ctaType: string): string {
  const mapping: Record<string, string> = {
    action: 'LEARN_MORE',
    benefit: 'SIGN_UP',
    urgency: 'GET_OFFER',
    curiosity: 'LEARN_MORE',
  };
  return mapping[ctaType] || 'LEARN_MORE';
}

/**
 * Generate a Meta Ads Manager-compatible CSV for bulk upload
 */
export function generateMetaUploadCSV(
  batch: AdBatch,
  options?: {
    baseUrl?: string;
    campaignName?: string;
    adSetPrefix?: string;
  }
): string {
  const baseUrl = options?.baseUrl || 'https://example.com';
  const campaignName = options?.campaignName || `UGC_${batch.id}`;
  const adSetPrefix = options?.adSetPrefix || 'UGC';

  const rows: string[] = [CSV_HEADERS.map(escapeCSV).join(',')];

  for (const variant of batch.variants) {
    const p = variant.parameters;
    const adSetName = `${adSetPrefix}_${p.targeting.awarenessLevel}_${p.copy.hookType}`;

    // Primary text: subheadline or fallback
    const primaryText = p.copy.subheadline || p.copy.headline;

    // Asset paths
    const imagePath = variant.assets.composedPaths?.[0]
      || variant.assets.afterImagePath
      || '';
    const videoPath = variant.assets.videoPath || '';

    const row = [
      variant.id,                              // Ad Name
      campaignName,                            // Campaign Name
      adSetName,                               // Ad Set Name
      p.copy.headline,                         // Headline
      primaryText,                             // Primary Text
      mapCtaToMeta(p.copy.ctaType),           // Call to Action
      buildWebsiteURL(variant, baseUrl),       // Website URL
      baseUrl.replace(/^https?:\/\//, ''),     // Display Link
      imagePath,                               // Image File Path
      videoPath,                               // Video File Path
      'meta',                                  // UTM Source
      'paid_social',                           // UTM Medium
      variant.utmParams.utm_campaign,          // UTM Campaign
      variant.utmParams.utm_content,           // UTM Content
      p.visual.template,                       // Template
      p.copy.hookType,                         // Hook Type
      p.targeting.awarenessLevel,              // Awareness Level
      p.copy.ctaType,                          // CTA Type
      p.visual.colorScheme,                    // Color Scheme
      variant.status === 'rendered' ? 'ACTIVE' : 'PAUSED', // Status
    ];

    rows.push(row.map(v => escapeCSV(String(v))).join(','));
  }

  return rows.join('\n');
}

/**
 * Generate a UTM tracking spreadsheet for the batch
 */
export function generateUTMTrackingCSV(batch: AdBatch): string {
  const headers = [
    'Variant ID',
    'Ad Name',
    'UTM Source',
    'UTM Medium',
    'UTM Campaign',
    'UTM Content',
    'Template',
    'Hook Type',
    'Awareness',
    'CTA Type',
    'Headline',
    'CTA Text',
  ];

  const rows: string[] = [headers.map(escapeCSV).join(',')];

  for (const variant of batch.variants) {
    const p = variant.parameters;
    const row = [
      variant.id,
      variant.id,
      variant.utmParams.utm_source || 'meta',
      variant.utmParams.utm_medium || 'paid_social',
      variant.utmParams.utm_campaign,
      variant.utmParams.utm_content,
      p.visual.template,
      p.copy.hookType,
      p.targeting.awarenessLevel,
      p.copy.ctaType,
      p.copy.headline,
      p.copy.ctaText,
    ];
    rows.push(row.map(v => escapeCSV(String(v))).join(','));
  }

  return rows.join('\n');
}
