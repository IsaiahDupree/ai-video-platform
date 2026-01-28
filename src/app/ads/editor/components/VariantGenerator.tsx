'use client';

import { useState } from 'react';
import { VariantType } from '../../../../services/aiVariants';
import styles from './VariantGenerator.module.css';

export interface VariantGeneratorProps {
  originalText: string;
  type: VariantType;
  onSelectVariant: (variant: string) => void;
  onClose: () => void;
}

export default function VariantGenerator({
  originalText,
  type,
  onSelectVariant,
  onClose,
}: VariantGeneratorProps) {
  const [variants, setVariants] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  // Generate variants
  const generateVariants = async () => {
    setLoading(true);
    setError(null);
    setVariants([]);

    try {
      const response = await fetch('/api/ads/generate-variants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalText,
          type,
          count: 10,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate variants');
      }

      const data = await response.json();
      setVariants(data.variants || []);
    } catch (err) {
      console.error('Error generating variants:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate variants');
    } finally {
      setLoading(false);
    }
  };

  // Apply selected variant
  const applyVariant = () => {
    if (selectedVariant) {
      onSelectVariant(selectedVariant);
      onClose();
    }
  };

  const typeLabels: Record<VariantType, string> = {
    headline: 'Headline',
    subheadline: 'Subheadline',
    body: 'Body Copy',
    cta: 'Call-to-Action',
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>AI Variant Generator</h2>
          <button onClick={onClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Original text */}
          <div className={styles.section}>
            <label className={styles.label}>
              Original {typeLabels[type]}:
            </label>
            <div className={styles.originalText}>{originalText}</div>
          </div>

          {/* Generate button */}
          {variants.length === 0 && !loading && (
            <div className={styles.section}>
              <button
                onClick={generateVariants}
                className={styles.generateButton}
                disabled={loading}
              >
                Generate 10 AI Variants
              </button>
              <p className={styles.hint}>
                Our AI will create 10 creative variations of your {type} while
                maintaining the core message.
              </p>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Generating variants with AI...</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className={styles.error}>
              <p>{error}</p>
              <button onClick={generateVariants} className={styles.retryButton}>
                Try Again
              </button>
            </div>
          )}

          {/* Variants list */}
          {variants.length > 0 && !loading && (
            <div className={styles.section}>
              <label className={styles.label}>
                Select a variant ({variants.length} generated):
              </label>
              <div className={styles.variantsList}>
                {variants.map((variant, index) => (
                  <div
                    key={index}
                    className={`${styles.variantItem} ${
                      selectedVariant === variant ? styles.selected : ''
                    }`}
                    onClick={() => setSelectedVariant(variant)}
                  >
                    <div className={styles.variantNumber}>{index + 1}</div>
                    <div className={styles.variantText}>{variant}</div>
                    {selectedVariant === variant && (
                      <div className={styles.checkmark}>✓</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Regenerate button */}
              <button
                onClick={generateVariants}
                className={styles.regenerateButton}
                disabled={loading}
              >
                Regenerate Variants
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button onClick={onClose} className={styles.cancelButton}>
            Cancel
          </button>
          <button
            onClick={applyVariant}
            className={styles.applyButton}
            disabled={!selectedVariant}
          >
            Apply Selected Variant
          </button>
        </div>
      </div>
    </div>
  );
}
