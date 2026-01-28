'use client';

/**
 * Column Mapping Form Component
 * Maps CSV columns to template fields
 */

import { useState, useEffect } from 'react';
import { AdTemplate } from '../../../../types/adTemplate';
import { ColumnMapping } from '../../../../services/csvImport';
import styles from './ColumnMappingForm.module.css';

interface ColumnMappingFormProps {
  headers: string[];
  sampleRows: Record<string, string>[];
  template: AdTemplate;
  columnMapping: ColumnMapping;
  onMappingUpdate: (mapping: ColumnMapping) => void;
  disabled?: boolean;
}

// Template field definitions with descriptions
const TEMPLATE_FIELDS = [
  {
    key: 'headline',
    label: 'Headline',
    description: 'Main headline text',
    required: false,
  },
  {
    key: 'subheadline',
    label: 'Subheadline',
    description: 'Secondary headline text',
    required: false,
  },
  {
    key: 'body',
    label: 'Body Text',
    description: 'Main body content',
    required: false,
  },
  {
    key: 'cta',
    label: 'Call-to-Action',
    description: 'CTA button text',
    required: false,
  },
  {
    key: 'backgroundImage',
    label: 'Background Image',
    description: 'URL or path to background image',
    required: false,
  },
  {
    key: 'productImage',
    label: 'Product Image',
    description: 'URL or path to product/feature image',
    required: false,
  },
  {
    key: 'logo',
    label: 'Logo',
    description: 'URL or path to logo image',
    required: false,
  },
  {
    key: 'backgroundColor',
    label: 'Background Color',
    description: 'Hex color code (e.g., #3b82f6)',
    required: false,
  },
  {
    key: 'primaryColor',
    label: 'Primary Color',
    description: 'Hex color code for primary brand color',
    required: false,
  },
  {
    key: 'uniqueId',
    label: 'Unique ID',
    description: 'Unique identifier (SKU, product ID, etc.)',
    required: false,
  },
] as const;

export default function ColumnMappingForm({
  headers,
  sampleRows,
  template,
  columnMapping,
  onMappingUpdate,
  disabled = false,
}: ColumnMappingFormProps) {
  const [localMapping, setLocalMapping] = useState<ColumnMapping>(columnMapping);
  const [showSamples, setShowSamples] = useState(true);

  // Update parent when local mapping changes
  useEffect(() => {
    onMappingUpdate(localMapping);
  }, [localMapping, onMappingUpdate]);

  // Auto-detect mappings based on column names
  const autoDetectMappings = () => {
    const newMapping: ColumnMapping = {};

    TEMPLATE_FIELDS.forEach(field => {
      // Look for exact match or similar column name
      const matchingHeader = headers.find(header => {
        const normalizedHeader = header.toLowerCase().replace(/[_\s-]/g, '');
        const normalizedField = field.key.toLowerCase().replace(/[_\s-]/g, '');
        return normalizedHeader === normalizedField ||
               normalizedHeader.includes(normalizedField) ||
               normalizedField.includes(normalizedHeader);
      });

      if (matchingHeader) {
        (newMapping as any)[field.key] = matchingHeader;
      }
    });

    setLocalMapping(newMapping);
  };

  // Handle mapping change
  const handleMappingChange = (fieldKey: string, columnName: string) => {
    setLocalMapping(prev => ({
      ...prev,
      [fieldKey]: columnName || undefined,
    }));
  };

  // Clear mapping for a field
  const handleClearMapping = (fieldKey: string) => {
    setLocalMapping(prev => {
      const updated = { ...prev };
      delete updated[fieldKey as keyof ColumnMapping];
      return updated;
    });
  };

  // Clear all mappings
  const clearAllMappings = () => {
    setLocalMapping({});
  };

  // Get sample value for a mapping
  const getSampleValue = (columnName: string | undefined): string => {
    if (!columnName || sampleRows.length === 0) return '—';
    return sampleRows[0][columnName] || '—';
  };

  // Get current template value for a field
  const getTemplateValue = (fieldKey: string): string => {
    if (fieldKey === 'primaryColor') {
      return template.style.primaryColor || '—';
    }
    return (template.content as any)[fieldKey] || '—';
  };

  return (
    <div className={styles.container}>
      {/* Actions */}
      <div className={styles.actions}>
        <button
          onClick={autoDetectMappings}
          className={styles.buttonSmall}
          disabled={disabled}
        >
          Auto-detect
        </button>
        <button
          onClick={clearAllMappings}
          className={styles.buttonSmall}
          disabled={disabled}
        >
          Clear All
        </button>
        <button
          onClick={() => setShowSamples(!showSamples)}
          className={styles.buttonSmall}
        >
          {showSamples ? 'Hide' : 'Show'} Samples
        </button>
      </div>

      {/* Mapping Table */}
      <div className={styles.table}>
        <div className={styles.tableHeader}>
          <div className={styles.tableHeaderCell}>Template Field</div>
          <div className={styles.tableHeaderCell}>CSV Column</div>
          {showSamples && (
            <>
              <div className={styles.tableHeaderCell}>Sample Value</div>
              <div className={styles.tableHeaderCell}>Current Default</div>
            </>
          )}
          <div className={styles.tableHeaderCell}>Actions</div>
        </div>

        <div className={styles.tableBody}>
          {TEMPLATE_FIELDS.map(field => {
            const currentMapping = (localMapping as any)[field.key];
            const isMapped = !!currentMapping;

            return (
              <div
                key={field.key}
                className={`${styles.tableRow} ${isMapped ? styles.tableRowMapped : ''}`}
              >
                {/* Field Name */}
                <div className={styles.tableCell}>
                  <div className={styles.fieldName}>{field.label}</div>
                  <div className={styles.fieldDescription}>{field.description}</div>
                </div>

                {/* Column Selector */}
                <div className={styles.tableCell}>
                  <select
                    value={currentMapping || ''}
                    onChange={(e) => handleMappingChange(field.key, e.target.value)}
                    className={styles.select}
                    disabled={disabled}
                  >
                    <option value="">— Not mapped —</option>
                    {headers.map(header => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sample Value */}
                {showSamples && (
                  <>
                    <div className={styles.tableCell}>
                      <div className={styles.sampleValue}>
                        {getSampleValue(currentMapping)}
                      </div>
                    </div>

                    {/* Template Default */}
                    <div className={styles.tableCell}>
                      <div className={styles.defaultValue}>
                        {getTemplateValue(field.key)}
                      </div>
                    </div>
                  </>
                )}

                {/* Actions */}
                <div className={styles.tableCell}>
                  {isMapped && (
                    <button
                      onClick={() => handleClearMapping(field.key)}
                      className={styles.clearButton}
                      disabled={disabled}
                      title="Clear mapping"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mapping Summary */}
      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <strong>CSV Columns:</strong> {headers.length}
        </div>
        <div className={styles.summaryItem}>
          <strong>Mapped Fields:</strong> {Object.keys(localMapping).length}
        </div>
        <div className={styles.summaryItem}>
          <strong>Sample Rows:</strong> {sampleRows.length}
        </div>
      </div>

      {/* Help Text */}
      <div className={styles.helpText}>
        <p>
          💡 <strong>Tip:</strong> Click "Auto-detect" to automatically match column names to template fields.
          Unmapped fields will use the template's default values.
        </p>
      </div>
    </div>
  );
}
