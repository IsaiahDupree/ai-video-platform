'use client';

/**
 * ApprovalStats Component
 * Displays approval workflow statistics
 */

import React from 'react';
import { ApprovalStatistics } from '@/types/approval';
import styles from './ApprovalStats.module.css';

interface ApprovalStatsProps {
  stats: ApprovalStatistics;
}

export function ApprovalStats({ stats }: ApprovalStatsProps) {
  const totalItems =
    stats.totalDraft +
    stats.totalInReview +
    stats.totalApproved +
    stats.totalRejected +
    stats.totalChangesRequested;

  const avgTimeHours = Math.round(stats.avgTimeToApproval / (1000 * 60 * 60));

  return (
    <div className={styles.container}>
      <div className={styles.stat}>
        <div className={styles.statIcon}>📊</div>
        <div className={styles.statContent}>
          <div className={styles.statValue}>{totalItems}</div>
          <div className={styles.statLabel}>Total Items</div>
        </div>
      </div>

      <div className={styles.stat}>
        <div className={styles.statIcon}>📝</div>
        <div className={styles.statContent}>
          <div className={styles.statValue}>{stats.totalDraft}</div>
          <div className={styles.statLabel}>Draft</div>
        </div>
      </div>

      <div className={styles.stat}>
        <div className={styles.statIcon}>👀</div>
        <div className={styles.statContent}>
          <div className={styles.statValue}>{stats.totalInReview}</div>
          <div className={styles.statLabel}>In Review</div>
        </div>
      </div>

      <div className={styles.stat}>
        <div className={styles.statIcon}>✅</div>
        <div className={styles.statContent}>
          <div className={styles.statValue}>{stats.totalApproved}</div>
          <div className={styles.statLabel}>Approved</div>
        </div>
      </div>

      <div className={styles.stat}>
        <div className={styles.statIcon}>⏱️</div>
        <div className={styles.statContent}>
          <div className={styles.statValue}>
            {avgTimeHours > 0 ? `${avgTimeHours}h` : '-'}
          </div>
          <div className={styles.statLabel}>Avg. Approval Time</div>
        </div>
      </div>

      <div className={styles.stat}>
        <div className={styles.statIcon}>📈</div>
        <div className={styles.statContent}>
          <div className={styles.statValue}>
            {stats.approvalRate > 0 ? `${Math.round(stats.approvalRate)}%` : '-'}
          </div>
          <div className={styles.statLabel}>Approval Rate</div>
        </div>
      </div>
    </div>
  );
}
