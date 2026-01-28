/**
 * Retention Event Tracking
 *
 * Tracks user retention and feature discovery events:
 * - return_visit: When users return to the platform
 * - feature_discovery: When users discover/use features for the first time
 */

import { tracking } from './tracking';

const STORAGE_KEY_PREFIX = 'retention_tracking_';
const LAST_VISIT_KEY = `${STORAGE_KEY_PREFIX}last_visit`;
const DISCOVERED_FEATURES_KEY = `${STORAGE_KEY_PREFIX}discovered_features`;
const VISIT_COUNT_KEY = `${STORAGE_KEY_PREFIX}visit_count`;
const FIRST_VISIT_KEY = `${STORAGE_KEY_PREFIX}first_visit`;

// Return visit threshold: 30 minutes (if they come back after 30 min, it's a new visit)
const RETURN_VISIT_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

export type DiscoverableFeature =
  | 'ad_editor'
  | 'template_library'
  | 'brand_kit'
  | 'batch_render'
  | 'campaign_generator'
  | 'csv_import'
  | 'screenshot_editor'
  | 'device_frames'
  | 'caption_overlay'
  | 'screenshot_resize'
  | 'locale_export'
  | 'asset_library'
  | 'custom_product_page'
  | 'ppo_test'
  | 'app_preview_generator'
  | 'analytics_dashboard'
  | 'voice_clone'
  | 'text_to_video'
  | 'image_generation'
  | 'approval_workflow'
  | 'ai_variants'
  | 'localization'
  | 'creative_qa';

interface RetentionData {
  visitCount: number;
  firstVisit: string;
  lastVisit: string;
  discoveredFeatures: DiscoverableFeature[];
}

/**
 * Check if browser environment (not SSR)
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

/**
 * Get data from localStorage
 */
function getLocalStorageItem(key: string): string | null {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error('Failed to read from localStorage:', error);
    return null;
  }
}

/**
 * Set data in localStorage
 */
function setLocalStorageItem(key: string, value: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error('Failed to write to localStorage:', error);
  }
}

/**
 * Get all retention data
 */
function getRetentionData(): RetentionData {
  const visitCount = parseInt(getLocalStorageItem(VISIT_COUNT_KEY) || '0', 10);
  const firstVisit = getLocalStorageItem(FIRST_VISIT_KEY) || new Date().toISOString();
  const lastVisit = getLocalStorageItem(LAST_VISIT_KEY) || '';
  const discoveredFeaturesRaw = getLocalStorageItem(DISCOVERED_FEATURES_KEY) || '[]';

  let discoveredFeatures: DiscoverableFeature[] = [];
  try {
    discoveredFeatures = JSON.parse(discoveredFeaturesRaw);
  } catch (error) {
    console.error('Failed to parse discovered features:', error);
    discoveredFeatures = [];
  }

  return {
    visitCount,
    firstVisit,
    lastVisit,
    discoveredFeatures,
  };
}

/**
 * Calculate days since first visit
 */
function getDaysSinceFirstVisit(firstVisit: string): number {
  if (!firstVisit) return 0;
  const firstVisitDate = new Date(firstVisit);
  const now = new Date();
  const diffMs = now.getTime() - firstVisitDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Calculate hours since last visit
 */
function getHoursSinceLastVisit(lastVisit: string): number | null {
  if (!lastVisit) return null;
  const lastVisitDate = new Date(lastVisit);
  const now = new Date();
  const diffMs = now.getTime() - lastVisitDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60));
}

/**
 * Track return visit
 * Call this when the user loads the app
 */
export function trackReturnVisit(): void {
  if (!isBrowser()) return;

  const now = new Date();
  const nowISO = now.toISOString();

  const data = getRetentionData();
  const lastVisitDate = data.lastVisit ? new Date(data.lastVisit) : null;

  // Calculate if this is a new visit (based on threshold)
  const isNewVisit = !lastVisitDate ||
    (now.getTime() - lastVisitDate.getTime()) > RETURN_VISIT_THRESHOLD_MS;

  // If first visit, just record it
  if (data.visitCount === 0) {
    setLocalStorageItem(FIRST_VISIT_KEY, nowISO);
    setLocalStorageItem(LAST_VISIT_KEY, nowISO);
    setLocalStorageItem(VISIT_COUNT_KEY, '1');

    // Don't track return_visit on first visit
    return;
  }

  // If new visit (after threshold), track it
  if (isNewVisit) {
    const newVisitCount = data.visitCount + 1;
    const daysSinceFirstVisit = getDaysSinceFirstVisit(data.firstVisit);
    const hoursSinceLastVisit = getHoursSinceLastVisit(data.lastVisit);

    // Track the return visit event
    tracking.track('return_visit', {
      visitCount: newVisitCount,
      daysSinceFirstVisit,
      hoursSinceLastVisit,
      firstVisit: data.firstVisit,
      lastVisit: data.lastVisit,
      timestamp: nowISO,
    });

    // Update storage
    setLocalStorageItem(LAST_VISIT_KEY, nowISO);
    setLocalStorageItem(VISIT_COUNT_KEY, newVisitCount.toString());
  }

  // Always update last visit timestamp (even if not a "new visit")
  setLocalStorageItem(LAST_VISIT_KEY, nowISO);
}

/**
 * Track feature discovery
 * Call this when a user uses a feature for the first time
 */
export function trackFeatureDiscovery(feature: DiscoverableFeature): void {
  if (!isBrowser()) return;

  const data = getRetentionData();

  // Check if already discovered
  if (data.discoveredFeatures.includes(feature)) {
    return; // Already tracked
  }

  // Add to discovered features
  const updatedFeatures = [...data.discoveredFeatures, feature];
  setLocalStorageItem(DISCOVERED_FEATURES_KEY, JSON.stringify(updatedFeatures));

  const daysSinceFirstVisit = getDaysSinceFirstVisit(data.firstVisit);
  const totalDiscoveredCount = updatedFeatures.length;

  // Track the feature discovery event
  tracking.track('feature_discovery', {
    feature,
    totalDiscoveredCount,
    visitCount: data.visitCount,
    daysSinceFirstVisit,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Check if a feature has been discovered
 */
export function hasDiscoveredFeature(feature: DiscoverableFeature): boolean {
  if (!isBrowser()) return false;
  const data = getRetentionData();
  return data.discoveredFeatures.includes(feature);
}

/**
 * Get retention statistics
 */
export function getRetentionStats(): RetentionData & {
  daysSinceFirstVisit: number;
  hoursSinceLastVisit: number | null;
} {
  const data = getRetentionData();
  return {
    ...data,
    daysSinceFirstVisit: getDaysSinceFirstVisit(data.firstVisit),
    hoursSinceLastVisit: getHoursSinceLastVisit(data.lastVisit),
  };
}

/**
 * Reset retention tracking (for testing)
 */
export function resetRetentionTracking(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(LAST_VISIT_KEY);
    localStorage.removeItem(DISCOVERED_FEATURES_KEY);
    localStorage.removeItem(VISIT_COUNT_KEY);
    localStorage.removeItem(FIRST_VISIT_KEY);
  } catch (error) {
    console.error('Failed to reset retention tracking:', error);
  }
}
