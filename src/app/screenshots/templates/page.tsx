'use client';

/**
 * Screenshot Template Gallery - APP-022
 * Browse and select pre-built screenshot templates
 */

import React, { useState, useMemo } from 'react';
import {
  SCREENSHOT_TEMPLATES,
  filterTemplates,
  getAllCategories,
  getAllThemes,
  getAllLayoutTypes,
  getAllTags,
  TEMPLATE_STATS,
} from '@/templates/screenshots';
import type {
  ScreenshotTemplate,
  ScreenshotCategory,
  ScreenshotTheme,
  ScreenshotLayoutType,
} from '@/types/screenshotTemplate';
import styles from './templates.module.css';

export default function ScreenshotTemplatesPage() {
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ScreenshotCategory | 'all'>('all');
  const [selectedTheme, setSelectedTheme] = useState<ScreenshotTheme | 'all'>('all');
  const [selectedLayout, setSelectedLayout] = useState<ScreenshotLayoutType | 'all'>('all');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    return filterTemplates({
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      themes: selectedTheme !== 'all' ? selectedTheme : undefined,
      layoutType: selectedLayout !== 'all' ? selectedLayout : undefined,
      featured: showFeaturedOnly || undefined,
      searchQuery: searchQuery.trim() || undefined,
    });
  }, [searchQuery, selectedCategory, selectedTheme, selectedLayout, showFeaturedOnly]);

  // Get unique values for filters
  const categories = getAllCategories();
  const themes = getAllThemes();
  const layouts = getAllLayoutTypes();

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedTheme('all');
    setSelectedLayout('all');
    setShowFeaturedOnly(false);
  };

  const hasActiveFilters =
    searchQuery ||
    selectedCategory !== 'all' ||
    selectedTheme !== 'all' ||
    selectedLayout !== 'all' ||
    showFeaturedOnly;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Screenshot Templates</h1>
          <p className={styles.subtitle}>
            Browse {TEMPLATE_STATS.totalTemplates} pre-built templates for common screenshot styles
          </p>
        </div>
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{TEMPLATE_STATS.totalTemplates}</span>
            <span className={styles.statLabel}>Templates</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{Object.keys(TEMPLATE_STATS.categories).length}</span>
            <span className={styles.statLabel}>Categories</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{Object.keys(TEMPLATE_STATS.layoutTypes).length}</span>
            <span className={styles.statLabel}>Layouts</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersSection}>
        <div className={styles.filtersHeader}>
          <h2 className={styles.filtersTitle}>Filters</h2>
          {hasActiveFilters && (
            <button onClick={clearFilters} className={styles.clearButton}>
              Clear All
            </button>
          )}
        </div>

        <div className={styles.filtersGrid}>
          {/* Search */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className={styles.searchInput}
            />
          </div>

          {/* Category Filter */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className={styles.select}
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat
                    .split('-')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Theme Filter */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Theme</label>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value as any)}
              className={styles.select}
            >
              <option value="all">All Themes</option>
              {themes.map((theme) => (
                <option key={theme} value={theme}>
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Layout Filter */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Layout</label>
            <select
              value={selectedLayout}
              onChange={(e) => setSelectedLayout(e.target.value as any)}
              className={styles.select}
            >
              <option value="all">All Layouts</option>
              {layouts.map((layout) => (
                <option key={layout} value={layout}>
                  {layout
                    .split('-')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Featured Toggle */}
          <div className={styles.filterGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={showFeaturedOnly}
                onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                className={styles.checkbox}
              />
              <span>Featured Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className={styles.resultsBar}>
        <p className={styles.resultsText}>
          Showing {filteredTemplates.length} of {TEMPLATE_STATS.totalTemplates} templates
        </p>
      </div>

      {/* Template Grid */}
      {filteredTemplates.length > 0 ? (
        <div className={styles.templateGrid}>
          {filteredTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔍</div>
          <h3 className={styles.emptyTitle}>No templates found</h3>
          <p className={styles.emptyDescription}>
            Try adjusting your filters or search query
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className={styles.emptyButton}>
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Template Card Component
 */
function TemplateCard({ template }: { template: ScreenshotTemplate }) {
  const categoryDisplay = template.metadata.category
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const layoutDisplay = template.layoutType
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return (
    <div className={styles.templateCard}>
      {/* Preview placeholder */}
      <div className={styles.templatePreview}>
        <div className={styles.previewPlaceholder}>
          <div className={styles.deviceOutline}>
            <div className={styles.deviceScreen}>
              {/* Simple representation of caption layers */}
              {template.captionLayers.slice(0, 3).map((caption, index) => (
                <div
                  key={caption.id}
                  className={styles.captionPreview}
                  style={{
                    top: `${(index + 1) * 25}%`,
                  }}
                >
                  <div className={styles.captionLine} />
                </div>
              ))}
            </div>
          </div>
        </div>
        {template.metadata.featured && (
          <div className={styles.featuredBadge}>⭐ Featured</div>
        )}
      </div>

      {/* Template Info */}
      <div className={styles.templateInfo}>
        <h3 className={styles.templateName}>{template.name}</h3>
        <p className={styles.templateDescription}>{template.description}</p>

        {/* Metadata */}
        <div className={styles.templateMeta}>
          <span className={styles.metaBadge}>{categoryDisplay}</span>
          <span className={styles.metaBadge}>{layoutDisplay}</span>
          <span className={styles.metaBadge}>
            {template.captionLayers.length}{' '}
            {template.captionLayers.length === 1 ? 'Caption' : 'Captions'}
          </span>
        </div>

        {/* Tags */}
        <div className={styles.tags}>
          {template.metadata.tags.slice(0, 4).map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className={styles.cardActions}>
          <button className={styles.viewButton}>View Template</button>
          <button className={styles.useButton}>Use Template</button>
        </div>
      </div>
    </div>
  );
}
