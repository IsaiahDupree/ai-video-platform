'use client';

/**
 * ADS-013: Column Mapping UI
 * Upload CSV and map columns to template fields
 */

import { useState, useCallback } from 'react';
import { AdTemplate } from '../../../types/adTemplate';
import { ColumnMapping } from '../../../services/csvImport';
import styles from './batch.module.css';
import ColumnMappingForm from './components/ColumnMappingForm';
import PreviewGrid from './components/PreviewGrid';
import BatchJobStatus from './components/BatchJobStatus';

// Sample templates for selection
const STARTER_TEMPLATES = [
  'example-hero-ad',
  'example-quote-ad',
  'example-minimal-ad',
  'example-text-only-ad',
];

interface CSVUploadState {
  file: File | null;
  headers: string[];
  sampleRows: Record<string, string>[];
  error: string | null;
}

interface BatchJobState {
  jobId: string | null;
  status: 'idle' | 'mapping' | 'previewing' | 'rendering' | 'completed' | 'error';
  progress: number;
  totalAssets: number;
  completedAssets: number;
  failedAssets: number;
  error: string | null;
}

export default function BatchImportPage() {
  const [csvState, setCSVState] = useState<CSVUploadState>({
    file: null,
    headers: [],
    sampleRows: [],
    error: null,
  });

  const [selectedTemplate, setSelectedTemplate] = useState('example-hero-ad');
  const [template, setTemplate] = useState<AdTemplate | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [batchJob, setBatchJob] = useState<BatchJobState>({
    jobId: null,
    status: 'idle',
    progress: 0,
    totalAssets: 0,
    completedAssets: 0,
    failedAssets: 0,
    error: null,
  });

  // Load template
  const loadTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/data/ads/${templateId}.json`);
      const data = await response.json();
      setTemplate(data);
    } catch (error) {
      console.error('Error loading template:', error);
    }
  };

  // Handle CSV file upload
  const handleCSVUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length === 0) {
        throw new Error('CSV file is empty');
      }

      // Parse headers (first line)
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

      // Parse sample rows (next 3 rows)
      const sampleRows = lines.slice(1, 4).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((header, i) => {
          row[header] = values[i] || '';
        });
        return row;
      });

      setCSVState({
        file,
        headers,
        sampleRows,
        error: null,
      });

      setBatchJob(prev => ({ ...prev, status: 'mapping' }));
    } catch (error) {
      setCSVState({
        file: null,
        headers: [],
        sampleRows: [],
        error: error instanceof Error ? error.message : 'Failed to parse CSV',
      });
    }
  }, []);

  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    loadTemplate(templateId);
  };

  // Handle column mapping update
  const handleMappingUpdate = (mapping: ColumnMapping) => {
    setColumnMapping(mapping);
  };

  // Generate preview
  const handleGeneratePreview = async () => {
    if (!csvState.file || !template) return;

    setBatchJob(prev => ({
      ...prev,
      status: 'previewing',
      progress: 0,
    }));

    try {
      // Create FormData for API request
      const formData = new FormData();
      formData.append('csv', csvState.file);
      formData.append('template', JSON.stringify(template));
      formData.append('columnMapping', JSON.stringify(columnMapping));
      formData.append('previewCount', '3');

      const response = await fetch('/api/ads/batch/preview', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate preview');
      }

      const result = await response.json();

      setBatchJob(prev => ({
        ...prev,
        status: 'previewing',
        totalAssets: result.assets.length,
        completedAssets: result.assets.filter((a: any) => a.status === 'completed').length,
        failedAssets: result.assets.filter((a: any) => a.status === 'failed').length,
      }));
    } catch (error) {
      setBatchJob(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Preview generation failed',
      }));
    }
  };

  // Start full batch render
  const handleStartBatchRender = async () => {
    if (!csvState.file || !template) return;

    setBatchJob(prev => ({
      ...prev,
      status: 'rendering',
      progress: 0,
    }));

    try {
      // Create FormData for API request
      const formData = new FormData();
      formData.append('csv', csvState.file);
      formData.append('template', JSON.stringify(template));
      formData.append('columnMapping', JSON.stringify(columnMapping));
      formData.append('format', 'png');
      formData.append('createZip', 'true');

      const response = await fetch('/api/ads/batch/render', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to start batch render');
      }

      const result = await response.json();

      setBatchJob(prev => ({
        ...prev,
        jobId: result.jobId,
        status: 'rendering',
        totalAssets: result.totalAssets,
      }));

      // Poll for job status
      pollJobStatus(result.jobId);
    } catch (error) {
      setBatchJob(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Batch render failed',
      }));
    }
  };

  // Poll job status
  const pollJobStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/ads/batch/status/${jobId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch job status');
        }

        const job = await response.json();

        setBatchJob(prev => ({
          ...prev,
          status: job.status === 'completed' ? 'completed' : 'rendering',
          progress: job.progress,
          completedAssets: job.completedCount,
          failedAssets: job.failedCount,
        }));

        if (job.status === 'completed' || job.status === 'failed') {
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Error polling job status:', error);
        clearInterval(interval);
      }
    }, 2000);
  };

  // Reset everything
  const handleReset = () => {
    setCSVState({
      file: null,
      headers: [],
      sampleRows: [],
      error: null,
    });
    setColumnMapping({});
    setBatchJob({
      jobId: null,
      status: 'idle',
      progress: 0,
      totalAssets: 0,
      completedAssets: 0,
      failedAssets: 0,
      error: null,
    });
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Batch Ad Generator</h1>
        <p className={styles.subtitle}>Upload CSV and generate hundreds of ad creatives</p>
      </header>

      {/* Step 1: Upload CSV */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.stepNumber}>1</span>
            Upload CSV File
          </h2>
        </div>
        <div className={styles.uploadArea}>
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            className={styles.fileInput}
            id="csv-upload"
            disabled={batchJob.status === 'rendering'}
          />
          <label htmlFor="csv-upload" className={styles.uploadLabel}>
            {csvState.file ? (
              <>
                <span className={styles.fileName}>{csvState.file.name}</span>
                <span className={styles.fileSize}>
                  ({Math.round(csvState.file.size / 1024)} KB)
                </span>
              </>
            ) : (
              <>
                <span className={styles.uploadIcon}>📁</span>
                <span>Choose CSV file or drag and drop</span>
              </>
            )}
          </label>
          {csvState.error && (
            <div className={styles.error}>{csvState.error}</div>
          )}
        </div>
      </section>

      {/* Step 2: Select Template */}
      {csvState.file && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.stepNumber}>2</span>
              Select Template
            </h2>
          </div>
          <select
            value={selectedTemplate}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className={styles.select}
            disabled={batchJob.status === 'rendering'}
          >
            {STARTER_TEMPLATES.map((t) => (
              <option key={t} value={t}>
                {t.replace('example-', '').replace(/-/g, ' ')}
              </option>
            ))}
          </select>
        </section>
      )}

      {/* Step 3: Map Columns */}
      {csvState.file && template && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.stepNumber}>3</span>
              Map CSV Columns to Template Fields
            </h2>
          </div>
          <ColumnMappingForm
            headers={csvState.headers}
            sampleRows={csvState.sampleRows}
            template={template}
            columnMapping={columnMapping}
            onMappingUpdate={handleMappingUpdate}
            disabled={batchJob.status === 'rendering'}
          />
        </section>
      )}

      {/* Actions */}
      {csvState.file && template && (
        <section className={styles.actions}>
          <button
            onClick={handleGeneratePreview}
            className={styles.buttonSecondary}
            disabled={batchJob.status === 'rendering'}
          >
            Generate Preview (3 rows)
          </button>
          <button
            onClick={handleStartBatchRender}
            className={styles.buttonPrimary}
            disabled={batchJob.status === 'rendering'}
          >
            {batchJob.status === 'rendering'
              ? 'Rendering...'
              : 'Start Batch Render'}
          </button>
          <button
            onClick={handleReset}
            className={styles.buttonOutline}
            disabled={batchJob.status === 'rendering'}
          >
            Reset
          </button>
        </section>
      )}

      {/* Job Status */}
      {batchJob.status !== 'idle' && (
        <section className={styles.section}>
          <BatchJobStatus job={batchJob} />
        </section>
      )}

      {/* Preview Grid */}
      {batchJob.status === 'previewing' && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Preview</h2>
          <PreviewGrid jobId={batchJob.jobId} />
        </section>
      )}
    </div>
  );
}
