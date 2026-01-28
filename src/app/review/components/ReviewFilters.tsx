'use client';

/**
 * ReviewFilters Component - Apple Review
 * Filter controls for Apple approval workflow
 */

import React, { useState } from 'react';
import { ApprovalStatus, getStatusDisplayName } from '@/types/approval';
import { AppleApprovalFilter } from '@/types/appleApproval';
import styles from './ReviewFilters.module.css';

interface ReviewFiltersProps {
  filter: AppleApprovalFilter;
  onFilterChange: (filter: Partial<AppleApprovalFilter>) => void;
  resourceTypes: string[];
  getResourceTypeDisplayName: (type: string) => string;
}

export function ReviewFilters({
  filter,
  onFilterChange,
  resourceTypes,
  getResourceTypeDisplayName,
}: ReviewFiltersProps) {
  const [searchQuery, setSearchQuery] = useState(filter.searchQuery || '');

  const allStatuses = Object.values(ApprovalStatus);

  function toggleStatus(status: ApprovalStatus) {
    const currentStatuses = filter.status
      ? Array.isArray(filter.status)
        ? filter.status
        : [filter.status]
      : [];

    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];

    onFilterChange({
      status: newStatuses.length > 0 ? newStatuses : undefined,
    });
  }

  function toggleResourceType(type: string) {
    const currentTypes = filter.resourceType
      ? Array.isArray(filter.resourceType)
        ? filter.resourceType
        : [filter.resourceType]
      : [];

    const newTypes = currentTypes.includes(type as any)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type as any];

    onFilterChange({
      resourceType: newTypes.length > 0 ? (newTypes as any) : undefined,
    });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    onFilterChange({ searchQuery: searchQuery.trim() || undefined });
  }

  function clearAllFilters() {
    setSearchQuery('');
    onFilterChange({
      status: undefined,
      resourceType: undefined,
      searchQuery: undefined,
      appId: undefined,
      locale: undefined,
    });
  }

  const hasActiveFilters =
    filter.status ||
    filter.resourceType ||
    filter.searchQuery ||
    filter.appId ||
    filter.locale;

  const selectedStatuses = filter.status
    ? Array.isArray(filter.status)
      ? filter.status
      : [filter.status]
    : [];

  const selectedTypes = filter.resourceType
    ? Array.isArray(filter.resourceType)
      ? filter.resourceType
      : [filter.resourceType]
    : [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Filters</h3>
        {hasActiveFilters && (
          <button onClick={clearAllFilters} className={styles.clearButton}>
            Clear All
          </button>
        )}
      </div>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className={styles.section}>
        <label className={styles.label}>Search</label>
        <div className={styles.searchBox}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name..."
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton}>
            🔍
          </button>
        </div>
      </form>

      {/* Status Filter */}
      <div className={styles.section}>
        <label className={styles.label}>Status</label>
        <div className={styles.filterGroup}>
          {allStatuses.map((status) => (
            <button
              key={status}
              className={`${styles.filterButton} ${
                selectedStatuses.includes(status) ? styles.filterButtonActive : ''
              }`}
              onClick={() => toggleStatus(status)}
            >
              {getStatusDisplayName(status)}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Type Filter */}
      <div className={styles.section}>
        <label className={styles.label}>Resource Type</label>
        <div className={styles.filterGroup}>
          {resourceTypes.map((type) => (
            <button
              key={type}
              className={`${styles.filterButton} ${
                selectedTypes.includes(type as any) ? styles.filterButtonActive : ''
              }`}
              onClick={() => toggleResourceType(type)}
            >
              {getResourceTypeDisplayName(type)}
            </button>
          ))}
        </div>
      </div>

      {/* Additional Filters */}
      <div className={styles.section}>
        <label className={styles.label}>Locale</label>
        <select
          value={filter.locale || ''}
          onChange={(e) => onFilterChange({ locale: e.target.value || undefined })}
          className={styles.select}
        >
          <option value="">All Locales</option>
          <option value="en-US">English (US)</option>
          <option value="en-GB">English (UK)</option>
          <option value="es-ES">Spanish</option>
          <option value="fr-FR">French</option>
          <option value="de-DE">German</option>
          <option value="ja-JP">Japanese</option>
          <option value="zh-CN">Chinese (Simplified)</option>
        </select>
      </div>
    </div>
  );
}
