'use client';

/**
 * Batch Job Status Component
 * Display batch rendering job status and progress
 */

import styles from './BatchJobStatus.module.css';

interface BatchJobStatusProps {
  job: {
    jobId: string | null;
    status: 'idle' | 'mapping' | 'previewing' | 'rendering' | 'completed' | 'error';
    progress: number;
    totalAssets: number;
    completedAssets: number;
    failedAssets: number;
    error: string | null;
  };
}

export default function BatchJobStatus({ job }: BatchJobStatusProps) {
  const getStatusColor = () => {
    switch (job.status) {
      case 'completed':
        return styles.statusSuccess;
      case 'error':
        return styles.statusError;
      case 'rendering':
        return styles.statusProcessing;
      default:
        return styles.statusDefault;
    }
  };

  const getStatusIcon = () => {
    switch (job.status) {
      case 'completed':
        return '✓';
      case 'error':
        return '✕';
      case 'rendering':
        return '⟳';
      case 'previewing':
        return '👁';
      case 'mapping':
        return '🗺';
      default:
        return '○';
    }
  };

  const getStatusText = () => {
    switch (job.status) {
      case 'mapping':
        return 'Mapping columns...';
      case 'previewing':
        return 'Generating preview...';
      case 'rendering':
        return 'Rendering ads...';
      case 'completed':
        return 'Batch complete!';
      case 'error':
        return 'Error occurred';
      default:
        return 'Ready';
    }
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.statusBadge} ${getStatusColor()}`}>
        <span className={styles.statusIcon}>{getStatusIcon()}</span>
        <span className={styles.statusText}>{getStatusText()}</span>
      </div>

      {job.status === 'rendering' && (
        <div className={styles.progress}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${job.progress}%` }}
            />
          </div>
          <div className={styles.progressText}>
            {job.progress}% ({job.completedAssets} / {job.totalAssets})
          </div>
        </div>
      )}

      {(job.status === 'completed' || job.status === 'previewing') && (
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{job.totalAssets}</div>
            <div className={styles.statLabel}>Total Assets</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{job.completedAssets}</div>
            <div className={styles.statLabel}>Completed</div>
          </div>
          {job.failedAssets > 0 && (
            <div className={styles.statItem}>
              <div className={`${styles.statValue} ${styles.statError}`}>
                {job.failedAssets}
              </div>
              <div className={styles.statLabel}>Failed</div>
            </div>
          )}
        </div>
      )}

      {job.error && (
        <div className={styles.error}>
          <strong>Error:</strong> {job.error}
        </div>
      )}

      {job.jobId && job.status === 'completed' && (
        <div className={styles.actions}>
          <a
            href={`/api/ads/batch/download/${job.jobId}`}
            className={styles.downloadButton}
            download
          >
            📦 Download ZIP
          </a>
          <a
            href={`/api/ads/batch/manifest/${job.jobId}`}
            className={styles.manifestButton}
            target="_blank"
            rel="noopener noreferrer"
          >
            📄 View Manifest
          </a>
        </div>
      )}
    </div>
  );
}
