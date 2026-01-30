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

      // TODO: Replace with actual API calls
      // For now, using mock data
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

      // Fallback to mock data
      const mockItems: AppleApprovableResource[] = [
        {
          id: 'screenshot-001',
          workspaceId: 'default-workspace',
          resourceType: AppleApprovableResourceType.SCREENSHOT,
          name: 'iPhone 15 Pro Screenshot 1',
          description: 'Main feature showcase screenshot',
          appId: 'com.example.myapp',
          locale: 'en-US',
          deviceType: 'iPhone 15 Pro',
          displayType: '6.7-inch',
          imageUrl: '/placeholder-screenshot.png',
          captionText: 'Discover amazing features',
          captionPosition: 'bottom',
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
          thumbnailUrl: '/placeholder-screenshot.png',
          tags: ['main-feature', 'en-US'],
        },
        {
          id: 'cpp-001',
          workspaceId: 'default-workspace',
          resourceType: AppleApprovableResourceType.CUSTOM_PRODUCT_PAGE,
          name: 'Summer Campaign CPP',
          description: 'Custom product page for summer campaign',
          appId: 'com.example.myapp',
          cppName: 'Summer2024',
          locale: 'en-US',
          promotionalText: 'Experience the best summer features',
          screenshotSetIds: ['set-001', 'set-002'],
          isPublished: false,
          approvalStatus: ApprovalStatus.DRAFT,
          approvalHistory: [],
          comments: [],
          createdBy: 'user-2',
          createdByName: 'Jane Smith',
          createdByEmail: 'jane@example.com',
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          thumbnailUrl: '/placeholder-cpp.png',
          tags: ['summer', 'campaign'],
        },
        {
          id: 'screenshot-set-001',
          workspaceId: 'default-workspace',
          resourceType: AppleApprovableResourceType.SCREENSHOT_SET,
          name: 'iPad Pro Screenshot Set',
          description: 'Complete set of iPad screenshots',
          appId: 'com.example.myapp',
          locale: 'en-US',
          deviceType: 'iPad Pro 12.9',
          screenshotCount: 5,
          screenshotIds: ['ss-1', 'ss-2', 'ss-3', 'ss-4', 'ss-5'],
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
          thumbnailUrl: '/placeholder-ipad.png',
          tags: ['ipad', 'complete-set'],
        },
      ];

      const mockStats: AppleApprovalStatistics = {
        totalDraft: 1,
        totalInReview: 1,
        totalApproved: 1,
        totalRejected: 0,
        totalChangesRequested: 0,
        byResourceType: {
          [AppleApprovableResourceType.SCREENSHOT]: { draft: 0, inReview: 1, approved: 0, rejected: 0 },
          [AppleApprovableResourceType.SCREENSHOT_SET]: { draft: 0, inReview: 0, approved: 1, rejected: 0 },
          [AppleApprovableResourceType.CUSTOM_PRODUCT_PAGE]: { draft: 1, inReview: 0, approved: 0, rejected: 0 },
          [AppleApprovableResourceType.APP_PREVIEW_VIDEO]: { draft: 0, inReview: 0, approved: 0, rejected: 0 },
          [AppleApprovableResourceType.LOCALIZED_METADATA]: { draft: 0, inReview: 0, approved: 0, rejected: 0 },
          [AppleApprovableResourceType.PPO_TREATMENT]: { draft: 0, inReview: 0, approved: 0, rejected: 0 },
        },
        byApp: {
          'com.example.myapp': {
            appName: 'My Example App',
            total: 3,
            approved: 1,
          },
        },
        avgTimeToApproval: 2 * 60 * 60 * 1000, // 2 hours
        approvalRate: 100,
      };

      // Apply filters
      let filteredItems = mockItems;
      if (filter.status && filter.status.length > 0) {
        const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
        filteredItems = mockItems.filter((item) =>
          statuses.includes(item.approvalStatus)
        );
      }

      setItems(filteredItems);
      setStats(mockStats);
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
