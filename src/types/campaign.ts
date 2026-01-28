/**
 * Campaign Types - ADS-011
 * Type definitions for campaign pack generation with copy variants
 */

import { AdTemplate } from './adTemplate';
import { AdSize } from '../config/adSizes';

/**
 * Copy variant for a campaign
 * Each variant represents a different version of the ad copy
 */
export interface CopyVariant {
  /** Unique identifier for this variant */
  id: string;
  /** Name/label for this variant */
  name: string;
  /** Headline text */
  headline?: string;
  /** Subheadline text */
  subheadline?: string;
  /** Body copy */
  body?: string;
  /** Call-to-action text */
  cta?: string;
  /** Optional description for this variant */
  description?: string;
}

/**
 * Campaign size selection
 * Combines an AdSize with optional size-specific overrides
 */
export interface CampaignSize {
  /** Reference to the AdSize preset */
  sizeId: string;
  /** Whether this size is included in the campaign */
  enabled: boolean;
  /** Optional custom name override for this specific campaign */
  customName?: string;
}

/**
 * Campaign configuration
 */
export interface Campaign {
  /** Unique identifier */
  id: string;
  /** Campaign name */
  name: string;
  /** Campaign description */
  description?: string;
  /** Base template to use for all variants */
  baseTemplate: AdTemplate;
  /** Copy variants */
  copyVariants: CopyVariant[];
  /** Selected sizes */
  sizes: CampaignSize[];
  /** Output settings */
  output: CampaignOutputSettings;
  /** Metadata */
  metadata?: CampaignMetadata;
}

/**
 * Output settings for campaign generation
 */
export interface CampaignOutputSettings {
  /** Image format (png, jpeg, webp) */
  format: 'png' | 'jpeg' | 'webp';
  /** Quality for lossy formats (0-100) */
  quality?: number;
  /** File naming template */
  fileNamingTemplate: string;
  /** Whether to organize by variant or by size */
  organizationMode: 'by-variant' | 'by-size' | 'flat';
  /** Whether to include a manifest.json file */
  includeManifest: boolean;
}

/**
 * Campaign metadata
 */
export interface CampaignMetadata {
  /** Client/company name */
  client?: string;
  /** Brand/product name */
  brand?: string;
  /** Campaign objective */
  objective?: string;
  /** Target platforms */
  platforms?: string[];
  /** Tags for filtering/searching */
  tags?: string[];
  /** Created timestamp */
  createdAt?: string;
  /** Last modified timestamp */
  updatedAt?: string;
  /** Author */
  author?: string;
}

/**
 * Generated campaign asset
 * Represents a single rendered asset in the campaign
 */
export interface CampaignAsset {
  /** Unique identifier */
  id: string;
  /** Reference to the campaign */
  campaignId: string;
  /** Reference to the copy variant */
  variantId: string;
  /** Variant name for easy reference */
  variantName: string;
  /** Reference to the size */
  sizeId: string;
  /** Size name for easy reference */
  sizeName: string;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** File path (relative to campaign root) */
  filePath: string;
  /** File size in bytes */
  fileSizeBytes?: number;
  /** Render status */
  status: 'pending' | 'rendering' | 'completed' | 'failed';
  /** Error message if failed */
  error?: string;
  /** Timestamp when rendering started */
  startedAt?: string;
  /** Timestamp when rendering completed */
  completedAt?: string;
}

/**
 * Campaign generation job
 * Tracks the overall progress of campaign generation
 */
export interface CampaignGenerationJob {
  /** Job ID */
  id: string;
  /** Campaign being generated */
  campaign: Campaign;
  /** All assets to be generated */
  assets: CampaignAsset[];
  /** Overall job status */
  status: 'queued' | 'in-progress' | 'completed' | 'failed' | 'cancelled';
  /** Progress (0-100) */
  progress: number;
  /** Number of assets completed */
  completedCount: number;
  /** Number of assets failed */
  failedCount: number;
  /** Total number of assets */
  totalCount: number;
  /** Job started timestamp */
  startedAt?: string;
  /** Job completed timestamp */
  completedAt?: string;
  /** Output directory path */
  outputDir?: string;
  /** ZIP file path if generated */
  zipFilePath?: string;
}

/**
 * Campaign manifest file content
 * Included in the campaign ZIP for metadata
 */
export interface CampaignManifest {
  /** Campaign info */
  campaign: {
    id: string;
    name: string;
    description?: string;
    generatedAt: string;
  };
  /** Copy variants info */
  variants: Array<{
    id: string;
    name: string;
    headline?: string;
    subheadline?: string;
    body?: string;
    cta?: string;
  }>;
  /** Sizes info */
  sizes: Array<{
    id: string;
    name: string;
    width: number;
    height: number;
    platform: string;
  }>;
  /** Generated assets */
  assets: Array<{
    variantId: string;
    variantName: string;
    sizeId: string;
    sizeName: string;
    width: number;
    height: number;
    filePath: string;
    fileSizeBytes?: number;
  }>;
  /** Generation stats */
  stats: {
    totalAssets: number;
    totalVariants: number;
    totalSizes: number;
    totalSizeBytes?: number;
    generationTimeMs?: number;
  };
}

/**
 * File naming template variables
 */
export interface FileNamingVariables {
  /** Campaign name */
  campaignName: string;
  /** Variant name */
  variantName: string;
  /** Variant ID */
  variantId: string;
  /** Size name */
  sizeName: string;
  /** Size ID */
  sizeId: string;
  /** Width */
  width: number;
  /** Height */
  height: number;
  /** Platform */
  platform: string;
  /** Index (1-based) */
  index: number;
  /** Timestamp */
  timestamp: number;
}

/**
 * Default file naming templates
 */
export const FILE_NAMING_TEMPLATES = {
  /** {variantName}_{sizeName} */
  VARIANT_SIZE: '{variantName}_{sizeName}',
  /** {sizeName}_{variantName} */
  SIZE_VARIANT: '{sizeName}_{variantName}',
  /** {campaignName}_{variantName}_{width}x{height} */
  CAMPAIGN_VARIANT_DIMENSIONS: '{campaignName}_{variantName}_{width}x{height}',
  /** {variantName}_{platform}_{width}x{height} */
  VARIANT_PLATFORM_DIMENSIONS: '{variantName}_{platform}_{width}x{height}',
  /** {index}_{variantName}_{sizeName} */
  INDEX_VARIANT_SIZE: '{index}_{variantName}_{sizeName}',
} as const;

/**
 * Apply naming template to generate filename
 */
export function applyNamingTemplate(
  template: string,
  variables: FileNamingVariables,
  format: 'png' | 'jpeg' | 'webp'
): string {
  let filename = template;

  // Replace all variables
  filename = filename.replace(/{campaignName}/g, sanitizeFilename(variables.campaignName));
  filename = filename.replace(/{variantName}/g, sanitizeFilename(variables.variantName));
  filename = filename.replace(/{variantId}/g, variables.variantId);
  filename = filename.replace(/{sizeName}/g, sanitizeFilename(variables.sizeName));
  filename = filename.replace(/{sizeId}/g, variables.sizeId);
  filename = filename.replace(/{width}/g, String(variables.width));
  filename = filename.replace(/{height}/g, String(variables.height));
  filename = filename.replace(/{platform}/g, sanitizeFilename(variables.platform));
  filename = filename.replace(/{index}/g, String(variables.index).padStart(3, '0'));
  filename = filename.replace(/{timestamp}/g, String(variables.timestamp));

  // Add extension
  filename += `.${format}`;

  return filename;
}

/**
 * Sanitize filename by removing invalid characters
 */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9_-]/g, '_')  // Replace invalid chars with underscore
    .replace(/_+/g, '_')                // Collapse multiple underscores
    .replace(/^_|_$/g, '');             // Remove leading/trailing underscores
}

/**
 * Get total asset count for a campaign
 */
export function getTotalAssetCount(campaign: Campaign): number {
  const variantCount = campaign.copyVariants.length;
  const sizeCount = campaign.sizes.filter((s) => s.enabled).length;
  return variantCount * sizeCount;
}

/**
 * Validate campaign before generation
 */
export function validateCampaign(campaign: Campaign): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!campaign.name || campaign.name.trim() === '') {
    errors.push('Campaign name is required');
  }

  if (!campaign.baseTemplate) {
    errors.push('Base template is required');
  }

  if (campaign.copyVariants.length === 0) {
    errors.push('At least one copy variant is required');
  }

  const enabledSizes = campaign.sizes.filter((s) => s.enabled);
  if (enabledSizes.length === 0) {
    errors.push('At least one size must be selected');
  }

  // Check for duplicate variant IDs
  const variantIds = campaign.copyVariants.map((v) => v.id);
  const uniqueVariantIds = new Set(variantIds);
  if (variantIds.length !== uniqueVariantIds.size) {
    errors.push('Duplicate variant IDs found');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create default campaign
 */
export function createDefaultCampaign(baseTemplate: AdTemplate): Campaign {
  return {
    id: `campaign-${Date.now()}`,
    name: 'New Campaign',
    description: '',
    baseTemplate,
    copyVariants: [
      {
        id: 'variant-1',
        name: 'Variant 1',
        headline: baseTemplate.content.headline,
        subheadline: baseTemplate.content.subheadline,
        body: baseTemplate.content.body,
        cta: baseTemplate.content.cta,
      },
    ],
    sizes: [],
    output: {
      format: 'png',
      quality: 90,
      fileNamingTemplate: FILE_NAMING_TEMPLATES.VARIANT_SIZE,
      organizationMode: 'by-variant',
      includeManifest: true,
    },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}
