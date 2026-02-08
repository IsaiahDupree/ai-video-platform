'use client';

/**
 * APP-021: Multi-user Approval Workflow
 * Review page for Apple App Store assets (screenshots, CPPs, previews, etc.)
 */

import React, { useState, useEffect } from 'react';
import {
  ApprovalStatus,
  getStatusColor,
  getStatusDisplayName,
} from '@/types/approval';
import {
  AppleApprovableResourceType,
  AppleApprovableResource,
  AppleApprovalStatistics,
  AppleApprovalFilter,
  getAppleResourceTypeDisplayName,
} from '@/types/appleApproval';
import { ReviewItemCard } from './components/ReviewItemCard';
import { ReviewFilters } from './components/ReviewFilters';
import { AppleApprovalStats } from './components/AppleApprovalStats';
import styles from './review.module.css';

export default function AppleReviewPage() {
  const [items, setItems] = useState<AppleApprovableResource[]>([]);
  const [stats, setStats] = useState<AppleApprovalStatistics | null>(null);
  const [filter, setFilter] = useState<AppleApprovalFilter>({
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

      const response = await fetch('/api/review/apple?' + new URLSearchParams({
        workspaceId: filter.workspaceId || '',
        ...(filter.status && { status: Array.isArray(filter.status) ? filter.status.join(',') : filter.status }),
        ...(filter.resourceType && { resourceType: Array.isArray(filter.resourceType) ? filter.resourceType.join(',') : filter.resourceType }),
        ...(filter.appId && { appId: filter.appId }),
        ...(filter.locale && { locale: filter.locale }),
        ...(filter.searchQuery && { search: filter.searchQuery }),
      }));

      if (!response.ok) {
        throw new Error('Failed to load approval items');
      }

      const data = await response.json();
      setItems(data.items || []);
      setStats(data.stats || null);
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

  function handleFilterChange(newFilter: Partial<AppleApprovalFilter>) {
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
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={loadData} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Apple Asset Review</h1>
        <p className={styles.subtitle}>
          Review and approve screenshots, custom product pages, and other Apple App Store assets
        </p>
      </header>

      {stats && <AppleApprovalStats stats={stats} />}

      <div className={styles.content}>
        <aside className={styles.sidebar}>
          <ReviewFilters
            filter={filter}
            onFilterChange={handleFilterChange}
            resourceTypes={Object.values(AppleApprovableResourceType)}
            getResourceTypeDisplayName={(type: string) => getAppleResourceTypeDisplayName(type as AppleApprovableResourceType)}
          />
        </aside>

        <main className={styles.main}>
          {items.length === 0 ? (
            <div className={styles.empty}>
              <p>No items found matching your filters</p>
              <button
                onClick={() => handleFilterChange({ status: undefined, resourceType: undefined, searchQuery: '' })}
                className={styles.clearButton}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className={styles.grid}>
              {items.map((item) => (
                <ReviewItemCard
                  key={item.id}
                  item={item}
                  onUpdate={handleItemUpdated}
                />
              ))}
            </div>
          )}

          {items.length > 0 && (
            <div className={styles.footer}>
              Showing {items.length} item{items.length !== 1 ? 's' : ''}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
