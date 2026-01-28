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

      // TODO: Replace with actual API calls
      const mockItems: ApprovableResource[] = [
        {
          id: 'ad-001',
          workspaceId: 'default-workspace',
          resourceType: 'ad' as any,
          name: 'Summer Sale Instagram Story',
          description: 'Promotional ad for summer sale campaign',
          approvalStatus: ApprovalStatus.IN_REVIEW,
          approvalHistory: [],
          comments: [],
          createdBy: 'user-1',
          createdByName: 'John Doe',
          createdByEmail: 'john@example.com',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          submittedForReviewAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          submittedForReviewBy: 'user-1',
          thumbnailUrl: '/placeholder-ad.png',
          tags: ['instagram', 'sale', 'summer'],
        },
        {
          id: 'ad-002',
          workspaceId: 'default-workspace',
          resourceType: 'ad' as any,
          name: 'Product Launch Facebook Ad',
          description: 'New product launch announcement',
          approvalStatus: ApprovalStatus.DRAFT,
          approvalHistory: [],
          comments: [],
          createdBy: 'user-2',
          createdByName: 'Jane Smith',
          createdByEmail: 'jane@example.com',
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          thumbnailUrl: '/placeholder-ad.png',
          tags: ['facebook', 'product', 'launch'],
        },
        {
          id: 'ad-003',
          workspaceId: 'default-workspace',
          resourceType: 'ad' as any,
          name: 'Holiday Campaign Banner',
          description: 'Holiday season promotional banner',
          approvalStatus: ApprovalStatus.APPROVED,
          approvalHistory: [],
          comments: [],
          createdBy: 'user-1',
          createdByName: 'John Doe',
          createdByEmail: 'john@example.com',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
          submittedForReviewAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
          submittedForReviewBy: 'user-1',
          approvedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
          approvedBy: 'admin-1',
          thumbnailUrl: '/placeholder-ad.png',
          tags: ['banner', 'holiday', 'campaign'],
        },
      ];

      const mockStats: ApprovalStatistics = {
        totalDraft: 1,
        totalInReview: 1,
        totalApproved: 1,
        totalRejected: 0,
        totalChangesRequested: 0,
        avgTimeToApproval: 2 * 60 * 60 * 1000, // 2 hours
        approvalRate: 100,
      };

      // Apply filters
      let filteredItems = mockItems;
      if (filter.status && filter.status.length > 0) {
        filteredItems = mockItems.filter((item) =>
          filter.status!.includes(item.approvalStatus)
        );
      }

      setItems(filteredItems);
      setStats(mockStats);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load approval items. Please try again.');
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
