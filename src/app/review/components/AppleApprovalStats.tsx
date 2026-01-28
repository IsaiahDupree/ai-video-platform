'use client';

/**
 * AppleApprovalStats Component
 * Display statistics for Apple approval workflow
 */

import React from 'react';
import { AppleApprovalStatistics, getAppleResourceTypeDisplayName } from '@/types/appleApproval';
import styles from './AppleApprovalStats.module.css';

interface AppleApprovalStatsProps {
  stats: AppleApprovalStatistics;
}

export function AppleApprovalStats({ stats }: AppleApprovalStatsProps) {
  // Convert milliseconds to hours
  const avgHours = Math.round(stats.avgTimeToApproval / (1000 * 60 * 60));

  // Get top apps
  const topApps = Object.entries(stats.byApp)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 3);

  return (
    <div className={styles.container}>
      {/* Overview Stats */}
      <div className={styles.grid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📝</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Draft</div>
            <div className={styles.statValue}>{stats.totalDraft}</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>👀</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>In Review</div>
            <div className={styles.statValue}>{stats.totalInReview}</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Approved</div>
            <div className={styles.statValue}>{stats.totalApproved}</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>⏱️</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Avg. Approval Time</div>
            <div className={styles.statValue}>
              {avgHours}h
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>📊</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Approval Rate</div>
            <div className={styles.statValue}>
              {stats.approvalRate.toFixed(0)}%
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>🔄</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Changes Requested</div>
            <div className={styles.statValue}>{stats.totalChangesRequested}</div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      {topApps.length > 0 && (
        <div className={styles.breakdown}>
          <h3 className={styles.breakdownTitle}>Top Apps</h3>
          <div className={styles.appList}>
            {topApps.map(([appId, appData]) => (
              <div key={appId} className={styles.appItem}>
                <div className={styles.appInfo}>
                  <div className={styles.appName}>{appData.appName}</div>
                  <div className={styles.appStats}>
                    {appData.total} total • {appData.approved} approved
                  </div>
                </div>
                <div className={styles.appProgress}>
                  <div
                    className={styles.appProgressBar}
                    style={{
                      width: `${(appData.approved / appData.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
