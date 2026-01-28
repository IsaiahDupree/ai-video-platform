/**
 * Error & Performance Tracking Service
 *
 * Tracks errors and performance issues to help identify and resolve problems
 * in the rendering pipeline and API calls.
 *
 * Events tracked:
 * - render_failed: When a render operation fails
 * - api_error: When an API call fails
 * - slow_render: When a render takes longer than expected
 *
 * @module errorPerformanceTracking
 */

import { tracking } from './tracking';

/**
 * Error categories for classification
 */
export type ErrorCategory =
  | 'render_error'
  | 'network_error'
  | 'validation_error'
  | 'permission_error'
  | 'timeout_error'
  | 'unknown_error';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Render failure reasons
 */
export type RenderFailureReason =
  | 'memory_exceeded'
  | 'timeout'
  | 'invalid_composition'
  | 'missing_asset'
  | 'codec_error'
  | 'unknown';

/**
 * API endpoint types for error tracking
 */
export type APIEndpoint =
  | '/api/render'
  | '/api/ads/generate-variants'
  | '/api/campaign/generate'
  | '/api/csv/import'
  | '/api/brand-kit'
  | '/api/export/zip'
  | 'modal_ltx_video'
  | 'modal_voice_clone'
  | 'openai_api'
  | 'elevenlabs_api'
  | 'other';

/**
 * Performance thresholds in milliseconds
 */
export const PERFORMANCE_THRESHOLDS = {
  render_still: 5000,      // 5 seconds
  render_video: 30000,     // 30 seconds
  api_call: 3000,          // 3 seconds
  image_generation: 10000, // 10 seconds
  voice_generation: 15000, // 15 seconds
} as const;

/**
 * Track when a render operation fails
 *
 * @param renderId - Unique identifier for the render
 * @param reason - Why the render failed
 * @param errorMessage - Detailed error message
 * @param templateId - Template being rendered (if applicable)
 * @param duration - Time spent before failure (ms)
 * @param retryAttempt - Which retry attempt this was (0 for first attempt)
 */
export function trackRenderFailed(
  renderId: string,
  reason: RenderFailureReason,
  errorMessage: string,
  templateId?: string | null,
  duration?: number,
  retryAttempt: number = 0
): void {
  tracking.track('render_failed', {
    renderId,
    reason,
    errorMessage,
    templateId,
    duration,
    retryAttempt,
    timestamp: new Date().toISOString(),
  });

  // Increment error counter in localStorage for quick stats
  incrementErrorCounter('render_failed');
}

/**
 * Track when an API call fails
 *
 * @param endpoint - API endpoint that failed
 * @param statusCode - HTTP status code (if applicable)
 * @param errorMessage - Error message from API
 * @param requestId - Unique identifier for the request
 * @param duration - Time spent before failure (ms)
 * @param retryAttempt - Which retry attempt this was (0 for first attempt)
 */
export function trackAPIError(
  endpoint: APIEndpoint,
  statusCode: number | null,
  errorMessage: string,
  requestId: string,
  duration?: number,
  retryAttempt: number = 0
): void {
  tracking.track('api_error', {
    endpoint,
    statusCode,
    errorMessage,
    requestId,
    duration,
    retryAttempt,
    timestamp: new Date().toISOString(),
  });

  // Increment error counter in localStorage for quick stats
  incrementErrorCounter('api_error');
}

/**
 * Track when a render takes longer than expected
 *
 * @param renderId - Unique identifier for the render
 * @param renderType - Type of render operation
 * @param duration - Actual duration in milliseconds
 * @param expectedDuration - Expected duration threshold
 * @param templateId - Template being rendered (if applicable)
 * @param dimensions - Width x height of the render
 */
export function trackSlowRender(
  renderId: string,
  renderType: 'still' | 'video' | 'batch',
  duration: number,
  expectedDuration: number,
  templateId?: string | null,
  dimensions?: { width: number; height: number }
): void {
  const slownessFactor = duration / expectedDuration;

  tracking.track('slow_render', {
    renderId,
    renderType,
    duration,
    expectedDuration,
    slownessFactor,
    templateId,
    dimensions,
    timestamp: new Date().toISOString(),
  });

  // Increment performance counter in localStorage for quick stats
  incrementPerformanceCounter('slow_render');
}

/**
 * Helper to measure and track render performance
 * Returns a function to call when the render completes
 *
 * @param renderId - Unique identifier for the render
 * @param renderType - Type of render operation
 * @param templateId - Template being rendered (if applicable)
 * @returns Function to call on completion with success status
 */
export function measureRenderPerformance(
  renderId: string,
  renderType: 'still' | 'video' | 'batch',
  templateId?: string | null
): (success: boolean, errorReason?: RenderFailureReason, errorMessage?: string) => void {
  const startTime = Date.now();
  const threshold = renderType === 'video'
    ? PERFORMANCE_THRESHOLDS.render_video
    : PERFORMANCE_THRESHOLDS.render_still;

  return (success: boolean, errorReason?: RenderFailureReason, errorMessage?: string) => {
    const duration = Date.now() - startTime;

    if (!success && errorReason && errorMessage) {
      // Track render failure
      trackRenderFailed(renderId, errorReason, errorMessage, templateId, duration);
    } else if (success && duration > threshold) {
      // Track slow render
      trackSlowRender(renderId, renderType, duration, threshold, templateId);
    }
  };
}

/**
 * Helper to measure and track API call performance
 * Returns a function to call when the API call completes
 *
 * @param endpoint - API endpoint being called
 * @param requestId - Unique identifier for the request
 * @returns Function to call on completion with success status
 */
export function measureAPIPerformance(
  endpoint: APIEndpoint,
  requestId: string
): (success: boolean, statusCode?: number | null, errorMessage?: string) => void {
  const startTime = Date.now();
  const threshold = PERFORMANCE_THRESHOLDS.api_call;

  return (success: boolean, statusCode?: number | null, errorMessage?: string) => {
    const duration = Date.now() - startTime;

    if (!success && errorMessage) {
      // Track API error
      trackAPIError(endpoint, statusCode || null, errorMessage, requestId, duration);
    }
  };
}

/**
 * Get error and performance statistics
 * Aggregates data from localStorage
 *
 * @returns Object with error and performance counts
 */
export function getErrorPerformanceStats(): {
  rendersFailed: number;
  apiErrors: number;
  slowRenders: number;
  totalErrors: number;
  totalPerformanceIssues: number;
} {
  if (typeof window === 'undefined') {
    return {
      rendersFailed: 0,
      apiErrors: 0,
      slowRenders: 0,
      totalErrors: 0,
      totalPerformanceIssues: 0,
    };
  }

  const stats = {
    rendersFailed: parseInt(localStorage.getItem('error_count:render_failed') || '0'),
    apiErrors: parseInt(localStorage.getItem('error_count:api_error') || '0'),
    slowRenders: parseInt(localStorage.getItem('performance_count:slow_render') || '0'),
    totalErrors: 0,
    totalPerformanceIssues: 0,
  };

  stats.totalErrors = stats.rendersFailed + stats.apiErrors;
  stats.totalPerformanceIssues = stats.slowRenders;

  return stats;
}

/**
 * Increment error counter in localStorage
 *
 * @param errorType - Type of error to increment
 */
function incrementErrorCounter(errorType: 'render_failed' | 'api_error'): void {
  if (typeof window === 'undefined') return;

  const key = `error_count:${errorType}`;
  const current = parseInt(localStorage.getItem(key) || '0');
  localStorage.setItem(key, (current + 1).toString());
}

/**
 * Increment performance counter in localStorage
 *
 * @param metricType - Type of performance metric to increment
 */
function incrementPerformanceCounter(metricType: 'slow_render'): void {
  if (typeof window === 'undefined') return;

  const key = `performance_count:${metricType}`;
  const current = parseInt(localStorage.getItem(key) || '0');
  localStorage.setItem(key, (current + 1).toString());
}

/**
 * Reset error and performance statistics
 * Useful for testing or user data export/deletion
 */
export function resetErrorPerformanceStats(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('error_count:render_failed');
  localStorage.removeItem('error_count:api_error');
  localStorage.removeItem('performance_count:slow_render');
}

/**
 * Get error rate as a percentage
 *
 * @param totalAttempts - Total number of attempts
 * @param failures - Number of failures
 * @returns Error rate as percentage (0-100)
 */
export function calculateErrorRate(totalAttempts: number, failures: number): number {
  if (totalAttempts === 0) return 0;
  return (failures / totalAttempts) * 100;
}

/**
 * Check if a duration exceeds the threshold for a given operation
 *
 * @param operation - Type of operation
 * @param duration - Actual duration in milliseconds
 * @returns True if duration exceeds threshold
 */
export function isSlow(
  operation: keyof typeof PERFORMANCE_THRESHOLDS,
  duration: number
): boolean {
  return duration > PERFORMANCE_THRESHOLDS[operation];
}
