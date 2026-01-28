'use client';

/**
 * Preview Grid Component
 * Display preview images from batch render
 */

import { useState, useEffect } from 'react';
import styles from './PreviewGrid.module.css';

interface PreviewAsset {
  id: string;
  rowIndex: number;
  filePath: string;
  status: 'completed' | 'failed';
  error?: string;
}

interface PreviewGridProps {
  jobId: string | null;
}

export default function PreviewGrid({ jobId }: PreviewGridProps) {
  const [assets, setAssets] = useState<PreviewAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) {
      setLoading(false);
      return;
    }

    // Fetch preview assets
    fetch(`/api/ads/batch/preview-assets/${jobId}`)
      .then(res => res.json())
      .then(data => {
        setAssets(data.assets || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading preview assets:', err);
        setLoading(false);
      });
  }, [jobId]);

  if (loading) {
    return <div className={styles.loading}>Loading previews...</div>;
  }

  if (assets.length === 0) {
    return (
      <div className={styles.empty}>
        No preview assets available. Generate a preview to see results.
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {assets.map(asset => (
        <div key={asset.id} className={styles.card}>
          {asset.status === 'completed' ? (
            <>
              <div className={styles.imageContainer}>
                <img
                  src={`/api/ads/batch/asset/${jobId}/${asset.filePath}`}
                  alt={`Preview ${asset.rowIndex}`}
                  className={styles.image}
                />
              </div>
              <div className={styles.cardFooter}>
                <span className={styles.rowLabel}>Row {asset.rowIndex}</span>
              </div>
            </>
          ) : (
            <div className={styles.error}>
              <div className={styles.errorIcon}>✕</div>
              <div className={styles.errorText}>
                Failed to render row {asset.rowIndex}
              </div>
              {asset.error && (
                <div className={styles.errorDetails}>{asset.error}</div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
