/**
 * Brand Package Manager
 *
 * Manages brand templates, variants, and package deployments.
 * Handles loading, validating, and applying brand configurations across projects.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { BrandTemplate, BrandVariant, isValidBrandTemplate } from '../types/BrandTemplate';
import { BrandThemeBuilder, createThemeFromPreset } from './BrandThemeBuilder';

// =============================================================================
// Types
// =============================================================================

export interface BrandPackage {
  id: string;
  name: string;
  description?: string;
  version: string;
  author?: string;
  license?: string;
  mainTemplate: BrandTemplate;
  variants: BrandVariant[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    exportedAt?: string;
  };
}

export interface PackageManifest {
  packages: Array<{
    id: string;
    name: string;
    path: string;
    version: string;
  }>;
  active: string; // Currently active package ID
}

// =============================================================================
// Package Manager
// =============================================================================

export class BrandPackageManager {
  private packages: Map<string, BrandPackage> = new Map();
  private activePackageId: string | null = null;
  private baseDir: string;

  constructor(baseDir: string = 'public/brand-packages') {
    this.baseDir = baseDir;
  }

  /**
   * Register a brand package
   */
  registerPackage(pkg: BrandPackage): void {
    this.packages.set(pkg.id, pkg);
  }

  /**
   * Get a registered package
   */
  getPackage(packageId: string): BrandPackage | undefined {
    return this.packages.get(packageId);
  }

  /**
   * Get all registered packages
   */
  getAllPackages(): BrandPackage[] {
    return Array.from(this.packages.values());
  }

  /**
   * Set the active package
   */
  setActivePackage(packageId: string): boolean {
    if (!this.packages.has(packageId)) {
      return false;
    }
    this.activePackageId = packageId;
    return true;
  }

  /**
   * Get the active package
   */
  getActivePackage(): BrandPackage | null {
    if (!this.activePackageId) return null;
    return this.packages.get(this.activePackageId) || null;
  }

  /**
   * Get a theme builder for the active package
   */
  getThemeBuilder(packageId?: string): BrandThemeBuilder | null {
    const pkg = packageId ? this.packages.get(packageId) : this.getActivePackage();
    if (!pkg) return null;
    return new BrandThemeBuilder(pkg.mainTemplate);
  }

  /**
   * Get a variant from a package
   */
  getVariant(packageId: string, variantId: string): BrandVariant | undefined {
    const pkg = this.packages.get(packageId);
    if (!pkg) return undefined;
    return pkg.variants.find(v => v.id === variantId);
  }

  /**
   * Create a new package from a template
   */
  createPackage(
    id: string,
    name: string,
    mainTemplate: BrandTemplate,
    variants: BrandVariant[] = []
  ): BrandPackage {
    const pkg: BrandPackage = {
      id,
      name,
      version: '1.0.0',
      mainTemplate,
      variants,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    this.registerPackage(pkg);
    return pkg;
  }

  /**
   * Create a package from a preset
   */
  createFromPreset(
    id: string,
    presetKey: string,
    customizations?: Partial<BrandTemplate>
  ): BrandPackage {
    const template = createThemeFromPreset(presetKey as any, customizations);
    return this.createPackage(id, template.name, template);
  }

  /**
   * Add a variant to a package
   */
  addVariant(packageId: string, variant: BrandVariant): boolean {
    const pkg = this.packages.get(packageId);
    if (!pkg) return false;

    // Check for duplicate IDs
    if (pkg.variants.some(v => v.id === variant.id)) {
      return false;
    }

    pkg.variants.push(variant);
    pkg.metadata.updatedAt = new Date().toISOString();
    return true;
  }

  /**
   * Remove a variant from a package
   */
  removeVariant(packageId: string, variantId: string): boolean {
    const pkg = this.packages.get(packageId);
    if (!pkg) return false;

    const index = pkg.variants.findIndex(v => v.id === variantId);
    if (index === -1) return false;

    pkg.variants.splice(index, 1);
    pkg.metadata.updatedAt = new Date().toISOString();
    return true;
  }

  /**
   * Export package to JSON
   */
  exportPackage(packageId: string): string | null {
    const pkg = this.packages.get(packageId);
    if (!pkg) return null;

    const exported = {
      ...pkg,
      metadata: {
        ...pkg.metadata,
        exportedAt: new Date().toISOString(),
      },
    };

    return JSON.stringify(exported, null, 2);
  }

  /**
   * Import package from JSON
   */
  importPackage(json: string): BrandPackage | null {
    try {
      const data = JSON.parse(json);

      // Validate package structure
      if (!data.id || !data.name || !data.mainTemplate) {
        return null;
      }

      const pkg: BrandPackage = {
        id: data.id,
        name: data.name,
        description: data.description,
        version: data.version || '1.0.0',
        author: data.author,
        license: data.license,
        mainTemplate: data.mainTemplate,
        variants: data.variants || [],
        metadata: {
          createdAt: data.metadata?.createdAt || new Date().toISOString(),
          updatedAt: data.metadata?.updatedAt || new Date().toISOString(),
        },
      };

      this.registerPackage(pkg);
      return pkg;
    } catch (error) {
      console.error('Failed to import package:', error);
      return null;
    }
  }

  /**
   * Save package to filesystem
   */
  async savePackage(packageId: string, filename?: string): Promise<boolean> {
    const pkg = this.packages.get(packageId);
    if (!pkg) return false;

    const file = filename || `${packageId}.json`;
    const filepath = path.join(this.baseDir, file);

    try {
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true });
      }

      const json = this.exportPackage(packageId);
      if (!json) return false;

      fs.writeFileSync(filepath, json, 'utf-8');
      return true;
    } catch (error) {
      console.error('Failed to save package:', error);
      return false;
    }
  }

  /**
   * Load package from filesystem
   */
  async loadPackage(filename: string): Promise<BrandPackage | null> {
    const filepath = path.join(this.baseDir, filename);

    try {
      if (!fs.existsSync(filepath)) {
        return null;
      }

      const json = fs.readFileSync(filepath, 'utf-8');
      return this.importPackage(json);
    } catch (error) {
      console.error('Failed to load package:', error);
      return null;
    }
  }

  /**
   * Load all packages from directory
   */
  async loadAllPackages(): Promise<BrandPackage[]> {
    if (!fs.existsSync(this.baseDir)) {
      return [];
    }

    const files = fs.readdirSync(this.baseDir).filter(f => f.endsWith('.json'));
    const packages: BrandPackage[] = [];

    for (const file of files) {
      const pkg = await this.loadPackage(file);
      if (pkg) packages.push(pkg);
    }

    return packages;
  }

  /**
   * Generate manifest file
   */
  generateManifest(): PackageManifest {
    const packages = Array.from(this.packages.values()).map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      path: `${pkg.id}.json`,
      version: pkg.version,
    }));

    return {
      packages,
      active: this.activePackageId || packages[0]?.id || '',
    };
  }

  /**
   * Save manifest to filesystem
   */
  async saveManifest(): Promise<boolean> {
    try {
      const manifest = this.generateManifest();
      const filepath = path.join(this.baseDir, 'manifest.json');

      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true });
      }

      fs.writeFileSync(filepath, JSON.stringify(manifest, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error('Failed to save manifest:', error);
      return false;
    }
  }

  /**
   * List available packages
   */
  listPackages(): Array<{ id: string; name: string; active: boolean }> {
    return Array.from(this.packages.values()).map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      active: pkg.id === this.activePackageId,
    }));
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let managerInstance: BrandPackageManager | null = null;

export function getBrandPackageManager(): BrandPackageManager {
  if (!managerInstance) {
    managerInstance = new BrandPackageManager();
  }
  return managerInstance;
}

export function setBrandPackageManager(manager: BrandPackageManager): void {
  managerInstance = manager;
}

export default BrandPackageManager;
