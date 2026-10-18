/**
 * Template Storage System
 *
 * Manages storage and retrieval of:
 * - template.dsl.json (TemplateDSL)
 * - reference.png (golden reference)
 * - source.canva.designId (source metadata)
 * - extraction metadata (confidence, method, etc.)
 */

import path from 'path';
import fs from 'fs/promises';
import type { TemplateDSL } from '../schema/template-dsl';

/**
 * Template storage metadata
 */
export interface TemplateMetadata {
  templateId: string;
  title: string;
  source: {
    type: 'canva_design' | 'reference_image' | 'manual';
    canvaDesignId?: string;
    canvaPageId?: string;
    referenceImagePath?: string;
    extractedAt: string;
  };
  extraction: {
    confidence: number;
    method: 'canva_design_api' | 'ai_vision' | 'manual';
    version: string;
  };
  canvas: {
    width: number;
    height: number;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Stored template with all associated files
 */
export interface StoredTemplate {
  metadata: TemplateMetadata;
  template: TemplateDSL;
  referencePath?: string; // Path to reference.png
}

/**
 * Template storage configuration
 */
export interface TemplateStorageConfig {
  /** Base directory for template storage */
  storageDir?: string;
}

/**
 * Template Storage Manager
 *
 * Handles CRUD operations for templates and their associated files
 */
export class TemplateStorage {
  private storageDir: string;

  constructor(config: TemplateStorageConfig = {}) {
    this.storageDir = config.storageDir || path.join(process.cwd(), 'data', 'templates');
  }

  /**
   * Initialize storage directory
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
      console.log(`[TemplateStorage] Initialized storage at ${this.storageDir}`);
    } catch (error) {
      console.error('[TemplateStorage] Failed to initialize storage:', error);
      throw error;
    }
  }

  /**
   * Get template directory path
   */
  private getTemplateDir(templateId: string): string {
    return path.join(this.storageDir, templateId);
  }

  /**
   * Get template file paths
   */
  private getTemplatePaths(templateId: string) {
    const dir = this.getTemplateDir(templateId);
    return {
      dir,
      metadata: path.join(dir, 'metadata.json'),
      template: path.join(dir, 'template.dsl.json'),
      reference: path.join(dir, 'reference.png'),
    };
  }

  /**
   * Save template and metadata
   */
  async saveTemplate(
    template: TemplateDSL,
    metadata: Omit<TemplateMetadata, 'createdAt' | 'updatedAt'>
  ): Promise<void> {
    const templateId = template.templateId;
    const paths = this.getTemplatePaths(templateId);

    try {
      // Create template directory
      await fs.mkdir(paths.dir, { recursive: true });

      // Add timestamps
      const now = new Date().toISOString();
      const fullMetadata: TemplateMetadata = {
        ...metadata,
        createdAt: now,
        updatedAt: now,
      };

      // Save metadata
      await fs.writeFile(paths.metadata, JSON.stringify(fullMetadata, null, 2));

      // Save template DSL
      await fs.writeFile(paths.template, JSON.stringify(template, null, 2));

      console.log(`[TemplateStorage] Saved template ${templateId}`);
    } catch (error) {
      console.error(`[TemplateStorage] Failed to save template ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Save reference image for template
   */
  async saveReferenceImage(templateId: string, imageBuffer: Buffer): Promise<void> {
    const paths = this.getTemplatePaths(templateId);

    try {
      await fs.writeFile(paths.reference, imageBuffer);
      console.log(`[TemplateStorage] Saved reference image for template ${templateId}`);
    } catch (error) {
      console.error(`[TemplateStorage] Failed to save reference image for ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Save reference image from URL
   */
  async saveReferenceImageFromUrl(templateId: string, imageUrl: string): Promise<void> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      await this.saveReferenceImage(templateId, Buffer.from(buffer));
    } catch (error) {
      console.error(`[TemplateStorage] Failed to save reference image from URL:`, error);
      throw error;
    }
  }

  /**
   * Load template by ID
   */
  async loadTemplate(templateId: string): Promise<StoredTemplate | null> {
    const paths = this.getTemplatePaths(templateId);

    try {
      // Check if template exists
      const exists = await this.templateExists(templateId);
      if (!exists) {
        return null;
      }

      // Load metadata
      const metadataContent = await fs.readFile(paths.metadata, 'utf-8');
      const metadata = JSON.parse(metadataContent) as TemplateMetadata;

      // Load template DSL
      const templateContent = await fs.readFile(paths.template, 'utf-8');
      const template = JSON.parse(templateContent) as TemplateDSL;

      // Check if reference image exists
      let referencePath: string | undefined;
      try {
        await fs.access(paths.reference);
        referencePath = paths.reference;
      } catch {
        // Reference image doesn't exist, that's okay
      }

      return {
        metadata,
        template,
        referencePath,
      };
    } catch (error) {
      console.error(`[TemplateStorage] Failed to load template ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Check if template exists
   */
  async templateExists(templateId: string): Promise<boolean> {
    const paths = this.getTemplatePaths(templateId);
    try {
      await fs.access(paths.template);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List all templates
   */
  async listTemplates(): Promise<TemplateMetadata[]> {
    try {
      const entries = await fs.readdir(this.storageDir, { withFileTypes: true });
      const templates: TemplateMetadata[] = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const metadataPath = path.join(this.storageDir, entry.name, 'metadata.json');
          try {
            const content = await fs.readFile(metadataPath, 'utf-8');
            const metadata = JSON.parse(content) as TemplateMetadata;
            templates.push(metadata);
          } catch {
            // Skip invalid templates
            console.warn(`[TemplateStorage] Skipping invalid template: ${entry.name}`);
          }
        }
      }

      return templates.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (error) {
      console.error('[TemplateStorage] Failed to list templates:', error);
      return [];
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    const paths = this.getTemplatePaths(templateId);

    try {
      await fs.rm(paths.dir, { recursive: true, force: true });
      console.log(`[TemplateStorage] Deleted template ${templateId}`);
    } catch (error) {
      console.error(`[TemplateStorage] Failed to delete template ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Update template
   */
  async updateTemplate(templateId: string, template: TemplateDSL): Promise<void> {
    const exists = await this.templateExists(templateId);
    if (!exists) {
      throw new Error(`Template ${templateId} does not exist`);
    }

    const paths = this.getTemplatePaths(templateId);

    try {
      // Load existing metadata
      const metadataContent = await fs.readFile(paths.metadata, 'utf-8');
      const metadata = JSON.parse(metadataContent) as TemplateMetadata;

      // Update template DSL
      await fs.writeFile(paths.template, JSON.stringify(template, null, 2));

      // Update metadata timestamp
      metadata.updatedAt = new Date().toISOString();
      await fs.writeFile(paths.metadata, JSON.stringify(metadata, null, 2));

      console.log(`[TemplateStorage] Updated template ${templateId}`);
    } catch (error) {
      console.error(`[TemplateStorage] Failed to update template ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Search templates by criteria
   */
  async searchTemplates(criteria: {
    sourceType?: 'canva_design' | 'reference_image' | 'manual';
    canvaDesignId?: string;
    minConfidence?: number;
  }): Promise<TemplateMetadata[]> {
    const allTemplates = await this.listTemplates();

    return allTemplates.filter((template) => {
      if (criteria.sourceType && template.source.type !== criteria.sourceType) {
        return false;
      }

      if (criteria.canvaDesignId && template.source.canvaDesignId !== criteria.canvaDesignId) {
        return false;
      }

      if (
        criteria.minConfidence !== undefined &&
        template.extraction.confidence < criteria.minConfidence
      ) {
        return false;
      }

      return true;
    });
  }
}

/**
 * Create template storage instance
 */
export function createTemplateStorage(config?: TemplateStorageConfig): TemplateStorage {
  return new TemplateStorage(config);
}
