/**
 * Campaign Generator Service - ADS-011
 * Service for generating campaign packs with multiple sizes and copy variants
 */

import path from 'path';
import fs from 'fs';
import {
  Campaign,
  CampaignAsset,
  CampaignGenerationJob,
  CampaignManifest,
  applyNamingTemplate,
  getTotalAssetCount,
  validateCampaign,
} from '../types/campaign';
import { AdTemplate } from '../types/adTemplate';
import { getSizeById } from '../config/adSizes';
import { renderStill, RenderStillResult } from './renderStill';
import { createZipFromDirectory } from './exportZip';

/**
 * Generate all assets for a campaign
 */
export async function generateCampaign(
  campaign: Campaign,
  outputDir?: string
): Promise<CampaignGenerationJob> {
  // Validate campaign
  const validation = validateCampaign(campaign);
  if (!validation.valid) {
    throw new Error(`Campaign validation failed: ${validation.errors.join(', ')}`);
  }

  // Create output directory
  const baseOutputDir = outputDir || path.join(process.cwd(), 'output', 'campaigns');
  const campaignOutputDir = path.join(baseOutputDir, campaign.id);

  if (!fs.existsSync(campaignOutputDir)) {
    fs.mkdirSync(campaignOutputDir, { recursive: true });
  }

  // Initialize job
  const job: CampaignGenerationJob = {
    id: `job-${Date.now()}`,
    campaign,
    assets: [],
    status: 'queued',
    progress: 0,
    completedCount: 0,
    failedCount: 0,
    totalCount: getTotalAssetCount(campaign),
    startedAt: new Date().toISOString(),
    outputDir: campaignOutputDir,
  };

  // Generate all asset definitions
  const assets = generateAssetDefinitions(campaign);
  job.assets = assets;
  job.status = 'in-progress';

  // Render each asset
  const startTime = Date.now();
  const enabledSizes = campaign.sizes.filter((s) => s.enabled);

  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    asset.status = 'rendering';
    asset.startedAt = new Date().toISOString();

    try {
      // Create template for this variant and size
      const template = createVariantTemplate(campaign, asset);

      // Determine output path based on organization mode
      const assetOutputPath = getAssetOutputPath(
        campaignOutputDir,
        campaign,
        asset
      );

      // Ensure directory exists
      const assetDir = path.dirname(assetOutputPath);
      if (!fs.existsSync(assetDir)) {
        fs.mkdirSync(assetDir, { recursive: true });
      }

      // Render the asset
      const result = await renderStill(`AdTemplate-${template.id}`, {
        outputPath: assetOutputPath,
        format: campaign.output.format,
        quality: campaign.output.quality,
        width: asset.width,
        height: asset.height,
      });

      if (result.success) {
        asset.status = 'completed';
        asset.filePath = path.relative(campaignOutputDir, assetOutputPath);
        asset.fileSizeBytes = result.sizeInBytes;
        job.completedCount++;
      } else {
        asset.status = 'failed';
        asset.error = result.error || 'Unknown error';
        job.failedCount++;
      }
    } catch (error) {
      asset.status = 'failed';
      asset.error = error instanceof Error ? error.message : String(error);
      job.failedCount++;
    }

    asset.completedAt = new Date().toISOString();
    job.progress = Math.round(((i + 1) / assets.length) * 100);
  }

  // Generate manifest if requested
  if (campaign.output.includeManifest) {
    const manifest = generateManifest(campaign, assets, startTime);
    const manifestPath = path.join(campaignOutputDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }

  // Create ZIP
  const zipPath = path.join(baseOutputDir, `${campaign.id}.zip`);
  await createZipFromDirectory(campaignOutputDir, zipPath);
  job.zipFilePath = zipPath;

  // Update job status
  job.status = job.failedCount === 0 ? 'completed' : 'failed';
  job.completedAt = new Date().toISOString();

  return job;
}

/**
 * Generate asset definitions for all combinations
 */
function generateAssetDefinitions(campaign: Campaign): CampaignAsset[] {
  const assets: CampaignAsset[] = [];
  const enabledSizes = campaign.sizes.filter((s) => s.enabled);

  let index = 0;
  for (const variant of campaign.copyVariants) {
    for (const campaignSize of enabledSizes) {
      const size = getSizeById(campaignSize.sizeId);
      if (!size) continue;

      index++;
      const asset: CampaignAsset = {
        id: `asset-${campaign.id}-${variant.id}-${size.id}`,
        campaignId: campaign.id,
        variantId: variant.id,
        variantName: variant.name,
        sizeId: size.id,
        sizeName: campaignSize.customName || size.name,
        width: size.width,
        height: size.height,
        filePath: '',
        status: 'pending',
      };

      assets.push(asset);
    }
  }

  return assets;
}

/**
 * Create template for a specific variant and size
 */
function createVariantTemplate(
  campaign: Campaign,
  asset: CampaignAsset
): AdTemplate {
  const variant = campaign.copyVariants.find((v) => v.id === asset.variantId);
  if (!variant) {
    throw new Error(`Variant ${asset.variantId} not found`);
  }

  const size = getSizeById(asset.sizeId);
  if (!size) {
    throw new Error(`Size ${asset.sizeId} not found`);
  }

  // Clone base template
  const template: AdTemplate = {
    ...campaign.baseTemplate,
    id: `${campaign.id}-${variant.id}-${size.id}`,
    name: `${campaign.name} - ${variant.name} - ${size.name}`,
    dimensions: {
      width: size.width,
      height: size.height,
      name: size.name,
      platform: size.platform,
    },
    content: {
      ...campaign.baseTemplate.content,
      headline: variant.headline || campaign.baseTemplate.content.headline,
      subheadline: variant.subheadline || campaign.baseTemplate.content.subheadline,
      body: variant.body || campaign.baseTemplate.content.body,
      cta: variant.cta || campaign.baseTemplate.content.cta,
    },
  };

  return template;
}

/**
 * Get output path for an asset based on organization mode
 */
function getAssetOutputPath(
  campaignOutputDir: string,
  campaign: Campaign,
  asset: CampaignAsset
): string {
  const size = getSizeById(asset.sizeId);
  if (!size) {
    throw new Error(`Size ${asset.sizeId} not found`);
  }

  // Generate filename
  const filename = applyNamingTemplate(
    campaign.output.fileNamingTemplate,
    {
      campaignName: campaign.name,
      variantName: asset.variantName,
      variantId: asset.variantId,
      sizeName: asset.sizeName,
      sizeId: asset.sizeId,
      width: asset.width,
      height: asset.height,
      platform: size.platform,
      index: 0, // Will be set later if needed
      timestamp: Date.now(),
    },
    campaign.output.format
  );

  // Organize by mode
  let subdirectory = '';
  switch (campaign.output.organizationMode) {
    case 'by-variant':
      subdirectory = asset.variantName;
      break;
    case 'by-size':
      subdirectory = asset.sizeName;
      break;
    case 'flat':
    default:
      subdirectory = '';
      break;
  }

  return subdirectory
    ? path.join(campaignOutputDir, subdirectory, filename)
    : path.join(campaignOutputDir, filename);
}

/**
 * Generate campaign manifest
 */
function generateManifest(
  campaign: Campaign,
  assets: CampaignAsset[],
  startTime: number
): CampaignManifest {
  const completedAssets = assets.filter((a) => a.status === 'completed');
  const totalSizeBytes = completedAssets.reduce(
    (sum, a) => sum + (a.fileSizeBytes || 0),
    0
  );

  return {
    campaign: {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      generatedAt: new Date().toISOString(),
    },
    variants: campaign.copyVariants.map((v) => ({
      id: v.id,
      name: v.name,
      headline: v.headline,
      subheadline: v.subheadline,
      body: v.body,
      cta: v.cta,
    })),
    sizes: campaign.sizes
      .filter((s) => s.enabled)
      .map((s) => {
        const size = getSizeById(s.sizeId);
        return {
          id: s.sizeId,
          name: s.customName || size?.name || s.sizeId,
          width: size?.width || 0,
          height: size?.height || 0,
          platform: size?.platform || 'Custom',
        };
      }),
    assets: completedAssets.map((a) => ({
      variantId: a.variantId,
      variantName: a.variantName,
      sizeId: a.sizeId,
      sizeName: a.sizeName,
      width: a.width,
      height: a.height,
      filePath: a.filePath,
      fileSizeBytes: a.fileSizeBytes,
    })),
    stats: {
      totalAssets: completedAssets.length,
      totalVariants: campaign.copyVariants.length,
      totalSizes: campaign.sizes.filter((s) => s.enabled).length,
      totalSizeBytes,
      generationTimeMs: Date.now() - startTime,
    },
  };
}

/**
 * Generate campaign preview (render one asset per variant)
 */
export async function generateCampaignPreview(
  campaign: Campaign,
  outputDir?: string
): Promise<CampaignAsset[]> {
  const validation = validateCampaign(campaign);
  if (!validation.valid) {
    throw new Error(`Campaign validation failed: ${validation.errors.join(', ')}`);
  }

  const baseOutputDir = outputDir || path.join(process.cwd(), 'output', 'campaigns', 'previews');
  const previewDir = path.join(baseOutputDir, campaign.id);

  if (!fs.existsSync(previewDir)) {
    fs.mkdirSync(previewDir, { recursive: true });
  }

  const enabledSizes = campaign.sizes.filter((s) => s.enabled);
  if (enabledSizes.length === 0) {
    throw new Error('No sizes selected');
  }

  // Use the first size for preview
  const previewSize = getSizeById(enabledSizes[0].sizeId);
  if (!previewSize) {
    throw new Error('Preview size not found');
  }

  const previewAssets: CampaignAsset[] = [];

  // Generate one preview per variant
  for (const variant of campaign.copyVariants) {
    const asset: CampaignAsset = {
      id: `preview-${campaign.id}-${variant.id}`,
      campaignId: campaign.id,
      variantId: variant.id,
      variantName: variant.name,
      sizeId: previewSize.id,
      sizeName: previewSize.name,
      width: previewSize.width,
      height: previewSize.height,
      filePath: '',
      status: 'pending',
    };

    try {
      const template = createVariantTemplate(campaign, asset);
      const outputPath = path.join(
        previewDir,
        `preview-${variant.id}.${campaign.output.format}`
      );

      asset.status = 'rendering';
      const result = await renderStill(`AdTemplate-${template.id}`, {
        outputPath,
        format: campaign.output.format,
        quality: campaign.output.quality,
        width: asset.width,
        height: asset.height,
      });

      if (result.success) {
        asset.status = 'completed';
        asset.filePath = path.relative(previewDir, outputPath);
        asset.fileSizeBytes = result.sizeInBytes;
      } else {
        asset.status = 'failed';
        asset.error = result.error;
      }
    } catch (error) {
      asset.status = 'failed';
      asset.error = error instanceof Error ? error.message : String(error);
    }

    previewAssets.push(asset);
  }

  return previewAssets;
}

/**
 * Estimate campaign generation time
 */
export function estimateCampaignTime(campaign: Campaign): {
  totalAssets: number;
  estimatedTimeSeconds: number;
  estimatedSizeBytes: number;
} {
  const totalAssets = getTotalAssetCount(campaign);

  // Estimate ~2 seconds per asset for rendering
  const estimatedTimeSeconds = totalAssets * 2;

  // Estimate file size based on format and dimensions
  const avgWidth = 1080; // Average width
  const avgHeight = 1080; // Average height
  const bytesPerPixel = campaign.output.format === 'png' ? 4 : 0.5;
  const avgAssetSize = avgWidth * avgHeight * bytesPerPixel;
  const estimatedSizeBytes = totalAssets * avgAssetSize;

  return {
    totalAssets,
    estimatedTimeSeconds,
    estimatedSizeBytes,
  };
}
