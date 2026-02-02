/**
 * Canva Apps SDK Client
 *
 * Client for interacting with Canva's Design Editing API and Export API
 * Reference: https://www.canva.dev/docs/apps/
 */

import type {
  CanvaConfig,
  CanvaDesign,
  CanvaDesignSession,
  CanvaElement,
  CanvaExportFormat,
  CanvaExportJob,
  CanvaExportJobRequest,
  CanvaPage,
} from './canva-types';

/**
 * Canva Apps SDK Client
 *
 * Provides methods to:
 * - Read design structure via Design Editing API
 * - Export designs to PNG/JPG/PDF via Export API
 * - Manage design sessions
 */
export class CanvaClient {
  private config: Required<CanvaConfig>;

  constructor(config: CanvaConfig = {}) {
    this.config = {
      clientId: config.clientId || process.env.CANVA_CLIENT_ID || '',
      clientSecret: config.clientSecret || process.env.CANVA_CLIENT_SECRET || '',
      accessToken: config.accessToken || process.env.CANVA_ACCESS_TOKEN || '',
      apiBaseUrl: config.apiBaseUrl || 'https://api.canva.com/v1',
    };

    if (!this.config.accessToken) {
      console.warn(
        'Canva access token not provided. Set CANVA_ACCESS_TOKEN environment variable or pass accessToken to CanvaClient constructor.'
      );
    }
  }

  /**
   * Open a design session
   *
   * NOTE: This is a mock implementation. In a real Canva App, you would use:
   * ```ts
   * import { openDesign } from '@canva/design';
   * const session = await openDesign({ designId });
   * ```
   *
   * For server-side access, use the Canva Connect API instead.
   */
  async openDesign(designId: string): Promise<CanvaDesignSession> {
    // Mock implementation for demonstration
    // In production, this would call Canva's Design Editing API
    console.log(`[CanvaClient] Opening design session for design ${designId}`);

    const mockSession: CanvaDesignSession = {
      designId,
      page: {
        id: 'page_1',
        width: 1080,
        height: 1080,
        background: {
          color: '#0b0f1a',
        },
        elements: [],
      },
      async getElements() {
        return this.page.elements;
      },
      async updateElement(elementId: string, updates: Partial<CanvaElement>) {
        const elementIndex = this.page.elements.findIndex((el) => el.id === elementId);
        if (elementIndex !== -1) {
          this.page.elements[elementIndex] = {
            ...this.page.elements[elementIndex],
            ...updates,
          };
        }
      },
      async addElement(element: Partial<CanvaElement>) {
        const newElement = {
          id: `element_${Date.now()}`,
          ...element,
        } as CanvaElement;
        this.page.elements.push(newElement);
        return newElement.id;
      },
      async removeElement(elementId: string) {
        this.page.elements = this.page.elements.filter((el) => el.id !== elementId);
      },
    };

    return mockSession;
  }

  /**
   * Get design metadata (server-side via Canva Connect API)
   */
  async getDesign(designId: string): Promise<CanvaDesign> {
    const url = `${this.config.apiBaseUrl}/designs/${designId}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch design: ${response.statusText}`);
      }

      const data = await response.json();
      return data as CanvaDesign;
    } catch (error) {
      console.error(`[CanvaClient] Error fetching design ${designId}:`, error);
      throw error;
    }
  }

  /**
   * Create an export job for a design
   *
   * Reference: https://www.canva.dev/docs/connect/api-reference/exports/create-export-job/
   */
  async createExportJob(request: CanvaExportJobRequest): Promise<CanvaExportJob> {
    const url = `${this.config.apiBaseUrl}/exports`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          design_id: request.design_id,
          format: {
            type: request.format,
            quality: request.quality || 'high',
          },
          pages: request.pages,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create export job: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        id: data.job.id,
        status: data.job.status,
      };
    } catch (error) {
      console.error(`[CanvaClient] Error creating export job:`, error);
      throw error;
    }
  }

  /**
   * Get export job status
   *
   * Poll this endpoint until status is 'success' or 'failed'
   */
  async getExportJob(jobId: string): Promise<CanvaExportJob> {
    const url = `${this.config.apiBaseUrl}/exports/${jobId}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch export job: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        id: data.job.id,
        status: data.job.status,
        urls: data.job.urls,
        error: data.job.error,
      };
    } catch (error) {
      console.error(`[CanvaClient] Error fetching export job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Wait for export job to complete
   *
   * Polls the export job status until it's complete or fails
   */
  async waitForExportJob(
    jobId: string,
    options: {
      maxAttempts?: number;
      pollInterval?: number;
    } = {}
  ): Promise<CanvaExportJob> {
    const { maxAttempts = 60, pollInterval = 2000 } = options;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const job = await this.getExportJob(jobId);

      if (job.status === 'success') {
        return job;
      }

      if (job.status === 'failed') {
        throw new Error(`Export job failed: ${job.error?.message || 'Unknown error'}`);
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Export job ${jobId} timed out after ${maxAttempts} attempts`);
  }

  /**
   * Export design and download files
   *
   * Convenience method that creates export job, waits for completion,
   * and returns download URLs
   */
  async exportDesign(
    designId: string,
    format: CanvaExportFormat,
    options: {
      quality?: 'low' | 'medium' | 'high';
      pages?: number[];
    } = {}
  ): Promise<string[]> {
    console.log(`[CanvaClient] Exporting design ${designId} as ${format}...`);

    // Create export job
    const job = await this.createExportJob({
      design_id: designId,
      format,
      quality: options.quality,
      pages: options.pages,
    });

    console.log(`[CanvaClient] Export job created: ${job.id}`);

    // Wait for completion
    const completedJob = await this.waitForExportJob(job.id);

    console.log(`[CanvaClient] Export job completed successfully`);

    return completedJob.urls || [];
  }

  /**
   * Download exported file to local path
   */
  async downloadExport(url: string, outputPath: string): Promise<void> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to download export: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      const fs = await import('fs/promises');
      await fs.writeFile(outputPath, Buffer.from(buffer));

      console.log(`[CanvaClient] Downloaded export to ${outputPath}`);
    } catch (error) {
      console.error(`[CanvaClient] Error downloading export:`, error);
      throw error;
    }
  }
}

/**
 * Create a Canva client instance
 */
export function createCanvaClient(config?: CanvaConfig): CanvaClient {
  return new CanvaClient(config);
}
