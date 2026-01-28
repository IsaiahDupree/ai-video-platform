'use client';

/**
 * ReviewFilters Component
 * Filter controls for approval workflow items
 */

import React from 'react';
import { ApprovalStatus, ApprovalFilter, getStatusDisplayName } from '@/types/approval';
import styles from './ReviewFilters.module.css';

interface ReviewFiltersProps {
  currentFilter: ApprovalFilter;
  onFilterChange: (filter: Partial<ApprovalFilter>) => void;
}

export function ReviewFilters({ currentFilter, onFilterChange }: ReviewFiltersProps) {
  const allStatuses = Object.values(ApprovalStatus);

  function toggleStatus(status: ApprovalStatus) {
    const currentStatuses = currentFilter.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];

    onFilterChange({
      status: newStatuses.length > 0 ? newStatuses : undefined,
    });
  }

  function clearFilters() {
    onFilterChange({
      status: undefined,
      searchQuery: undefined,
      tags: undefined,
    });
  }

  const hasActiveFilters =
    (currentFilter.status && currentFilter.status.length > 0) ||
    currentFilter.searchQuery ||
    (currentFilter.tags && currentFilter.tags.length > 0);

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Filter by Status</h3>
        <div className={styles.statusFilters}>
          {allStatuses.map((status) => {
            const isActive = currentFilter.status?.includes(status);
            return (
              <button
                key={status}
                className={`${styles.statusButton} ${
                  isActive ? styles.statusButtonActive : ''
                }`}
                onClick={() => toggleStatus(status)}
              >
                {getStatusDisplayName(status)}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Search</h3>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search by name or description..."
          value={currentFilter.searchQuery || ''}
          onChange={(e) =>
            onFilterChange({ searchQuery: e.target.value || undefined })
          }
        />
      </div>

      {hasActiveFilters && (
        <div className={styles.clearSection}>
          <button className={styles.clearButton} onClick={clearFilters}>
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}
