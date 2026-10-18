/**
 * Canva Design Ingestion Workflow
 *
 * Complete pipeline for ingesting Canva designs:
 * 1. Fetch design structure via Canva Apps SDK
 * 2. Convert to TemplateDSL
 * 3. Export reference PNG via Canva Export API
 * 4. Store template + reference + metadata
 */

import type { CanvaClient } from './canva-client';
import { canvaPageToTemplate, type SemanticDetectionConfig } from './canva-to-template';
import { TemplateStorage, type TemplateMetadata } from './template-storage';
import type { TemplateDSL } from '../schema/template-dsl';

/**
 * Canva ingestion options
 */
export interface CanvaIngestionOptions {
  /** Canva design ID to ingest */
  designId: string;
  /** Optional: specific page index (default: 0 = first page) */
  pageIndex?: number;
  /** Optional: custom template title */
  title?: string;
  /** Semantic detection configuration */
  semanticConfig?: SemanticDetectionConfig;
  /** Export quality for reference image */
  exportQuality?: 'low' | 'medium' | 'high';
}

/**
 * Canva ingestion result
 */
export interface CanvaIngestionResult {
  success: boolean;
  templateId: string;
  template: TemplateDSL;
  metadata: TemplateMetadata;
  referencePath: string;
  error?: string;
}

/**
 * Canva Ingestion Pipeline
 *
 * Orchestrates the complete flow:
 * - Read Canva design structure
 * - Convert to TemplateDSL
 * - Export reference PNG
 * - Store everything
 */
export class CanvaIngestionPipeline {
  constructor(
    private canvaClient: CanvaClient,
    private storage: TemplateStorage
  ) {}

  /**
   * Ingest a Canva design
   */
  async ingestDesign(options: CanvaIngestionOptions): Promise<CanvaIngestionResult> {
    const {
      designId,
      pageIndex = 0,
      title,
      semanticConfig = {},
      exportQuality = 'high',
    } = options;

    try {
      console.log(`[CanvaIngestion] Starting ingestion for design ${designId}...`);

      // Step 1: Open design session and get page
      console.log(`[CanvaIngestion] Step 1/4: Opening design session...`);
      const session = await this.canvaClient.openDesign(designId);
      const page = session.page;

      console.log(
        `[CanvaIngestion] Design opened: ${page.width}x${page.height}, ${page.elements.length} elements`
      );

      // Step 2: Convert Canva page to TemplateDSL
      console.log(`[CanvaIngestion] Step 2/4: Converting to TemplateDSL...`);
      const template = canvaPageToTemplate(page, semanticConfig);

      console.log(`[CanvaIngestion] Template created: ${template.layers.length} layers`);

      // Step 3: Export reference PNG
      console.log(`[CanvaIngestion] Step 3/4: Exporting reference PNG...`);
      const exportUrls = await this.canvaClient.exportDesign(designId, 'PNG', {
        quality: exportQuality,
        pages: [pageIndex],
      });

      if (!exportUrls || exportUrls.length === 0) {
        throw new Error('No export URLs returned from Canva');
      }

      const referenceUrl = exportUrls[0];
      console.log(`[CanvaIngestion] Reference PNG exported: ${referenceUrl}`);

      // Step 4: Store template + reference + metadata
      console.log(`[CanvaIngestion] Step 4/4: Storing template...`);

      // Build metadata
      const metadata: Omit<TemplateMetadata, 'createdAt' | 'updatedAt'> = {
        templateId: template.templateId,
        title: title || `Canva Design ${designId}`,
        source: {
          type: 'canva_design',
          canvaDesignId: designId,
          canvaPageId: page.id,
          extractedAt: new Date().toISOString(),
        },
        extraction: {
          confidence: template.meta?.extraction?.confidence || 0.95,
          method: 'canva_design_api',
          version: '1.0',
        },
        canvas: {
          width: template.canvas.width,
          height: template.canvas.height,
        },
      };

      // Save template
      await this.storage.saveTemplate(template, metadata);

      // Download and save reference image
      await this.storage.saveReferenceImageFromUrl(template.templateId, referenceUrl);

      const storedTemplate = await this.storage.loadTemplate(template.templateId);
      if (!storedTemplate) {
        throw new Error('Failed to load stored template');
      }

      console.log(`[CanvaIngestion] ✅ Ingestion complete! Template ID: ${template.templateId}`);

      return {
        success: true,
        templateId: template.templateId,
        template,
        metadata: storedTemplate.metadata,
        referencePath: storedTemplate.referencePath || '',
      };
    } catch (error) {
      console.error(`[CanvaIngestion] ❌ Ingestion failed:`, error);

      return {
        success: false,
        templateId: '',
        template: {} as TemplateDSL,
        metadata: {} as TemplateMetadata,
        referencePath: '',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Ingest multiple pages from a Canva design
   */
  async ingestMultiplePages(
    designId: string,
    options: {
      pageIndices?: number[];
      titlePrefix?: string;
      semanticConfig?: SemanticDetectionConfig;
      exportQuality?: 'low' | 'medium' | 'high';
    } = {}
  ): Promise<CanvaIngestionResult[]> {
    const { pageIndices = [0], titlePrefix = 'Page', semanticConfig, exportQuality } = options;

    const results: CanvaIngestionResult[] = [];

    for (const pageIndex of pageIndices) {
      const result = await this.ingestDesign({
        designId,
        pageIndex,
        title: `${titlePrefix} ${pageIndex + 1}`,
        semanticConfig,
        exportQuality,
      });

      results.push(result);
    }

    return results;
  }

  /**
   * Re-export reference image for existing template
   *
   * Useful for refreshing golden references after Canva design updates
   */
  async updateReferenceImage(
    templateId: string,
    options: {
      exportQuality?: 'low' | 'medium' | 'high';
    } = {}
  ): Promise<void> {
    const { exportQuality = 'high' } = options;

    // Load template to get source design ID
    const storedTemplate = await this.storage.loadTemplate(templateId);
    if (!storedTemplate) {
      throw new Error(`Template ${templateId} not found`);
    }

    const { canvaDesignId } = storedTemplate.metadata.source;
    if (!canvaDesignId) {
      throw new Error(`Template ${templateId} does not have a Canva design ID`);
    }

    console.log(`[CanvaIngestion] Updating reference image for template ${templateId}...`);

    // Export fresh reference PNG
    const exportUrls = await this.canvaClient.exportDesign(canvaDesignId, 'PNG', {
      quality: exportQuality,
    });

    if (!exportUrls || exportUrls.length === 0) {
      throw new Error('No export URLs returned from Canva');
    }

    // Download and save
    await this.storage.saveReferenceImageFromUrl(templateId, exportUrls[0]);

    console.log(`[CanvaIngestion] ✅ Reference image updated for template ${templateId}`);
  }
}

/**
 * Create Canva ingestion pipeline
 */
export function createCanvaIngestionPipeline(
  canvaClient: CanvaClient,
  storage: TemplateStorage
): CanvaIngestionPipeline {
  return new CanvaIngestionPipeline(canvaClient, storage);
}
