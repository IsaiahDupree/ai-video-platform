'use client';

/**
 * ADS-016: Approval Workflow
 * Review page for viewing and managing approval workflow items
 */

import React, { useState, useEffect } from 'react';
import {
  ApprovalStatus,
  ApprovableResource,
  ApprovalStatistics,
  ApprovalFilter,
  getStatusColor,
  getStatusDisplayName,
} from '@/types/approval';
import { ReviewItemCard } from './components/ReviewItemCard';
import { ReviewFilters } from './components/ReviewFilters';
import { ApprovalStats } from './components/ApprovalStats';
import styles from './review.module.css';

export default function ReviewPage() {
  const [items, setItems] = useState<ApprovableResource[]>([]);
  const [stats, setStats] = useState<ApprovalStatistics | null>(null);
  const [filter, setFilter] = useState<ApprovalFilter>({
    workspaceId: 'default-workspace', // TODO: Get from context
    status: undefined,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load items and stats
  useEffect(() => {
    loadData();
  }, [filter]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/ads/review?' + new URLSearchParams({
        workspaceId: filter.workspaceId || '',
        ...(filter.status && { status: Array.isArray(filter.status) ? filter.status.join(',') : filter.status }),
      }));

      if (!response.ok) {
        throw new Error('Failed to load approval items');
      }

      const data = await response.json();
      const items = data.items || [];
      const stats = data.stats || null;

      setItems(items);
      setStats(stats);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load approval items. Please try again.');
      // Set empty state on error
      setItems([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(newFilter: Partial<ApprovalFilter>) {
    setFilter((prev) => ({ ...prev, ...newFilter }));
  }

  function handleItemUpdated() {
    // Reload data when an item is updated
    loadData();
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Approval Workflow</h1>
        <p className={styles.subtitle}>
          Review and manage items in the approval workflow
        </p>
      </div>

      {stats && <ApprovalStats stats={stats} />}

      <ReviewFilters
        currentFilter={filter}
        onFilterChange={handleFilterChange}
      />

      <div className={styles.itemsSection}>
        <div className={styles.itemsHeader}>
          <h2 className={styles.itemsTitle}>
            {items.length} {items.length === 1 ? 'Item' : 'Items'}
          </h2>
        </div>

        {items.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📋</div>
            <h3>No items found</h3>
            <p>There are no items matching your current filters.</p>
          </div>
        ) : (
          <div className={styles.itemsGrid}>
            {items.map((item) => (
              <ReviewItemCard
                key={item.id}
                item={item}
                onUpdate={handleItemUpdated}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
