/**
 * Brand Kit Service - ADS-003
 * Service for managing brand kits and applying them to ad templates
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  BrandKit,
  BrandKitSearchCriteria,
  BrandKitApplicationOptions,
  BrandLogo,
  isBrandKit,
  createBrandKit,
} from '../types/brandKit';
import { AdTemplate, AdStyle } from '../types/adTemplate';

/**
 * Brand kit storage directory
 */
const BRAND_KITS_DIR = path.join(process.cwd(), 'data', 'brand-kits');
const BRAND_LOGOS_DIR = path.join(process.cwd(), 'public', 'assets', 'brands');

/**
 * Ensure directories exist
 */
function ensureDirectories(): void {
  if (!fs.existsSync(BRAND_KITS_DIR)) {
    fs.mkdirSync(BRAND_KITS_DIR, { recursive: true });
  }
  if (!fs.existsSync(BRAND_LOGOS_DIR)) {
    fs.mkdirSync(BRAND_LOGOS_DIR, { recursive: true });
  }
}

/**
 * Brand Kit Manager
 */
export class BrandKitManager {
  private brandKitsDir: string;
  private logosDir: string;

  constructor(brandKitsDir?: string, logosDir?: string) {
    this.brandKitsDir = brandKitsDir || BRAND_KITS_DIR;
    this.logosDir = logosDir || BRAND_LOGOS_DIR;
    ensureDirectories();
  }

  /**
   * Create a new brand kit
   */
  async createBrandKit(brandKit: Omit<BrandKit, 'createdAt' | 'updatedAt' | 'version'>): Promise<BrandKit> {
    const now = new Date().toISOString();
    const newBrandKit: BrandKit = {
      ...brandKit,
      createdAt: now,
      updatedAt: now,
      version: '1.0',
    };

    await this.saveBrandKit(newBrandKit);
    return newBrandKit;
  }

  /**
   * Get a brand kit by ID
   */
  async getBrandKit(id: string): Promise<BrandKit | null> {
    const filePath = path.join(this.brandKitsDir, `${id}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const data = fs.readFileSync(filePath, 'utf-8');
    const brandKit = JSON.parse(data);

    if (!isBrandKit(brandKit)) {
      throw new Error(`Invalid brand kit format: ${id}`);
    }

    return brandKit;
  }

  /**
   * Save a brand kit
   */
  async saveBrandKit(brandKit: BrandKit): Promise<void> {
    const filePath = path.join(this.brandKitsDir, `${brandKit.id}.json`);
    brandKit.updatedAt = new Date().toISOString();
    fs.writeFileSync(filePath, JSON.stringify(brandKit, null, 2));
  }

  /**
   * Update a brand kit
   */
  async updateBrandKit(id: string, updates: Partial<BrandKit>): Promise<BrandKit> {
    const brandKit = await this.getBrandKit(id);
    if (!brandKit) {
      throw new Error(`Brand kit not found: ${id}`);
    }

    const updatedBrandKit: BrandKit = {
      ...brandKit,
      ...updates,
      id: brandKit.id, // Prevent ID change
      workspaceId: brandKit.workspaceId, // Prevent workspace change
      createdAt: brandKit.createdAt, // Preserve creation date
      updatedAt: new Date().toISOString(),
    };

    await this.saveBrandKit(updatedBrandKit);
    return updatedBrandKit;
  }

  /**
   * Delete a brand kit
   */
  async deleteBrandKit(id: string): Promise<boolean> {
    const filePath = path.join(this.brandKitsDir, `${id}.json`);
    if (!fs.existsSync(filePath)) {
      return false;
    }

    fs.unlinkSync(filePath);
    return true;
  }

  /**
   * List all brand kits
   */
  async listBrandKits(criteria?: BrandKitSearchCriteria): Promise<BrandKit[]> {
    if (!fs.existsSync(this.brandKitsDir)) {
      return [];
    }

    const files = fs.readdirSync(this.brandKitsDir).filter(f => f.endsWith('.json'));
    const brandKits: BrandKit[] = [];

    for (const file of files) {
      const data = fs.readFileSync(path.join(this.brandKitsDir, file), 'utf-8');
      const brandKit = JSON.parse(data);

      if (isBrandKit(brandKit)) {
        brandKits.push(brandKit);
      }
    }

    // Apply filters
    let filtered = brandKits;

    if (criteria?.workspaceId) {
      filtered = filtered.filter(bk => bk.workspaceId === criteria.workspaceId);
    }

    if (criteria?.name) {
      const searchName = criteria.name.toLowerCase();
      filtered = filtered.filter(bk => bk.name.toLowerCase().includes(searchName));
    }

    if (criteria?.isDefault !== undefined) {
      filtered = filtered.filter(bk => bk.isDefault === criteria.isDefault);
    }

    return filtered;
  }

  /**
   * Get default brand kit for a workspace
   */
  async getDefaultBrandKit(workspaceId: string): Promise<BrandKit | null> {
    const brandKits = await this.listBrandKits({ workspaceId, isDefault: true });
    return brandKits.length > 0 ? brandKits[0] : null;
  }

  /**
   * Set a brand kit as default for a workspace
   */
  async setDefaultBrandKit(id: string): Promise<BrandKit> {
    const brandKit = await this.getBrandKit(id);
    if (!brandKit) {
      throw new Error(`Brand kit not found: ${id}`);
    }

    // Unset all other defaults for this workspace
    const allBrandKits = await this.listBrandKits({ workspaceId: brandKit.workspaceId });
    for (const bk of allBrandKits) {
      if (bk.isDefault && bk.id !== id) {
        await this.updateBrandKit(bk.id, { isDefault: false });
      }
    }

    // Set this one as default
    return await this.updateBrandKit(id, { isDefault: true });
  }

  /**
   * Add a logo to a brand kit
   */
  async addLogo(brandKitId: string, logo: BrandLogo): Promise<BrandKit> {
    const brandKit = await this.getBrandKit(brandKitId);
    if (!brandKit) {
      throw new Error(`Brand kit not found: ${brandKitId}`);
    }

    // Check if logo already exists
    const existingIndex = brandKit.logos.findIndex(l => l.id === logo.id);
    if (existingIndex >= 0) {
      brandKit.logos[existingIndex] = logo;
    } else {
      brandKit.logos.push(logo);
    }

    // Set as primary if it's the first logo
    if (brandKit.logos.length === 1 && !brandKit.primaryLogo) {
      brandKit.primaryLogo = logo.id;
    }

    await this.saveBrandKit(brandKit);
    return brandKit;
  }

  /**
   * Remove a logo from a brand kit
   */
  async removeLogo(brandKitId: string, logoId: string): Promise<BrandKit> {
    const brandKit = await this.getBrandKit(brandKitId);
    if (!brandKit) {
      throw new Error(`Brand kit not found: ${brandKitId}`);
    }

    brandKit.logos = brandKit.logos.filter(l => l.id !== logoId);

    // Clear primary logo if it was the one removed
    if (brandKit.primaryLogo === logoId) {
      brandKit.primaryLogo = brandKit.logos.length > 0 ? brandKit.logos[0].id : undefined;
    }

    await this.saveBrandKit(brandKit);
    return brandKit;
  }

  /**
   * Set primary logo
   */
  async setPrimaryLogo(brandKitId: string, logoId: string): Promise<BrandKit> {
    const brandKit = await this.getBrandKit(brandKitId);
    if (!brandKit) {
      throw new Error(`Brand kit not found: ${brandKitId}`);
    }

    const logo = brandKit.logos.find(l => l.id === logoId);
    if (!logo) {
      throw new Error(`Logo not found: ${logoId}`);
    }

    brandKit.primaryLogo = logoId;
    await this.saveBrandKit(brandKit);
    return brandKit;
  }

  /**
   * Apply brand kit to an ad template
   */
  applyBrandKitToTemplate(
    template: AdTemplate,
    brandKit: BrandKit,
    options?: BrandKitApplicationOptions
  ): AdTemplate {
    const opts: BrandKitApplicationOptions = {
      applyColors: true,
      applyTypography: true,
      applySpacing: true,
      applyEffects: true,
      applyLogo: true,
      ...options,
    };

    const updatedTemplate: AdTemplate = JSON.parse(JSON.stringify(template));

    // Apply colors
    if (opts.applyColors) {
      const colors = { ...brandKit.colors, ...opts.overrides?.colors };
      updatedTemplate.style.primaryColor = colors.primary;
      updatedTemplate.style.secondaryColor = colors.secondary || colors.accent;
      updatedTemplate.style.textColor = colors.text;
      updatedTemplate.style.ctaBackgroundColor = colors.primary;
      updatedTemplate.style.ctaTextColor = colors.background || '#ffffff';
    }

    // Apply typography
    if (opts.applyTypography) {
      const typography = { ...brandKit.typography, ...opts.overrides?.typography };
      updatedTemplate.style.headlineFont = typography.headlineFont;
      updatedTemplate.style.bodyFont = typography.bodyFont || typography.headlineFont;

      if (typography.fontWeights) {
        updatedTemplate.style.headlineFontWeight = typography.fontWeights.bold || 700;
        updatedTemplate.style.bodyFontWeight = typography.fontWeights.regular || 400;
      }

      if (typography.fontSizes) {
        // Scale font sizes based on template dimensions
        const scale = template.dimensions.width / 1080;
        updatedTemplate.style.headlineSize = Math.round((typography.fontSizes['4xl'] || 48) * scale);
        updatedTemplate.style.bodySize = Math.round((typography.fontSizes.lg || 20) * scale);
      }
    }

    // Apply spacing
    if (opts.applySpacing && brandKit.spacing) {
      const spacing = { ...brandKit.spacing, ...opts.overrides?.spacing };
      if (spacing.padding?.lg) {
        updatedTemplate.style.padding = spacing.padding.lg;
      }
      if (spacing.gap?.md) {
        updatedTemplate.style.gap = spacing.gap.md;
      }
      if (spacing.borderRadius?.md) {
        updatedTemplate.style.borderRadius = spacing.borderRadius.md;
      }
    }

    // Apply effects
    if (opts.applyEffects && brandKit.effects) {
      if (brandKit.effects.shadows?.lg) {
        updatedTemplate.style.shadow = true;
        updatedTemplate.style.shadowColor = 'rgba(0, 0, 0, 0.2)';
        updatedTemplate.style.shadowBlur = 20;
      }
    }

    // Apply logo
    if (opts.applyLogo && brandKit.logos.length > 0) {
      let logo: BrandLogo | undefined;

      if (opts.logoVariant) {
        logo = brandKit.logos.find(l => l.variant === opts.logoVariant);
      }

      if (!logo && brandKit.primaryLogo) {
        logo = brandKit.logos.find(l => l.id === brandKit.primaryLogo);
      }

      if (!logo) {
        logo = brandKit.logos[0];
      }

      updatedTemplate.content.logo = logo.path;
      if (opts.logoPosition) {
        updatedTemplate.content.logoPosition = opts.logoPosition;
      }
      if (opts.logoSize) {
        updatedTemplate.content.logoSize = opts.logoSize;
      }
    }

    return updatedTemplate;
  }

  /**
   * Export brand kit to JSON
   */
  async exportBrandKit(id: string, outputPath: string): Promise<void> {
    const brandKit = await this.getBrandKit(id);
    if (!brandKit) {
      throw new Error(`Brand kit not found: ${id}`);
    }

    fs.writeFileSync(outputPath, JSON.stringify(brandKit, null, 2));
  }

  /**
   * Import brand kit from JSON
   */
  async importBrandKit(inputPath: string, workspaceId?: string): Promise<BrandKit> {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`File not found: ${inputPath}`);
    }

    const data = fs.readFileSync(inputPath, 'utf-8');
    const brandKit = JSON.parse(data);

    if (!isBrandKit(brandKit)) {
      throw new Error('Invalid brand kit format');
    }

    // Generate new ID and update workspace if provided
    brandKit.id = `${brandKit.workspaceId || workspaceId || 'default'}-${Date.now()}`;
    if (workspaceId) {
      brandKit.workspaceId = workspaceId;
    }
    brandKit.createdAt = new Date().toISOString();
    brandKit.updatedAt = new Date().toISOString();

    await this.saveBrandKit(brandKit);
    return brandKit;
  }
}

/**
 * Default brand kit manager instance
 */
export const brandKitManager = new BrandKitManager();

/**
 * Convenience functions
 */
export async function createBrandKitWithDefaults(
  workspaceId: string,
  name: string,
  options?: Partial<BrandKit>
): Promise<BrandKit> {
  const id = `${workspaceId}-${Date.now()}`;
  const brandKit = createBrandKit({
    id,
    workspaceId,
    name,
    ...options,
  });
  return brandKitManager.createBrandKit(brandKit);
}

export async function applyBrandKitToTemplate(
  templateId: string,
  brandKitId: string,
  options?: BrandKitApplicationOptions
): Promise<AdTemplate | null> {
  const brandKit = await brandKitManager.getBrandKit(brandKitId);
  if (!brandKit) {
    return null;
  }

  // Load template (you'll need to implement template loading)
  // For now, return null as placeholder
  return null;
}
