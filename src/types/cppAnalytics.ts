/**
 * APP-024: CPP Analytics Dashboard
 *
 * Type definitions for Custom Product Page analytics and performance tracking
 */

/**
 * Time period for analytics data
 */
export type AnalyticsPeriod =
  | '7d'   // Last 7 days
  | '14d'  // Last 14 days
  | '30d'  // Last 30 days
  | '90d'  // Last 90 days
  | 'custom'; // Custom date range

/**
 * Device type for analytics breakdown
 */
export type AnalyticsDeviceType =
  | 'iphone'
  | 'ipad'
  | 'mac'
  | 'watch'
  | 'tv'
  | 'vision'
  | 'all';

/**
 * Metric type for analytics
 */
export type MetricType =
  | 'impressions'      // Page views
  | 'conversions'      // App downloads
  | 'conversionRate'   // Download rate (%)
  | 'productViews'     // Product page views
  | 'appClips'         // App clip impressions
  | 'proceeds'         // Revenue (if available)
  | 'units';           // Units sold

/**
 * Custom Product Page analytics metrics
 */
export interface CPPMetrics {
  /** Custom product page ID */
  cppId: string;
  /** Custom product page name */
  cppName: string;
  /** Total impressions (page views) */
  impressions: number;
  /** Total conversions (downloads) */
  conversions: number;
  /** Conversion rate (percentage) */
  conversionRate: number;
  /** Product page views */
  productViews: number;
  /** App clip impressions */
  appClips: number;
  /** Total proceeds (revenue) */
  proceeds: number;
  /** Units sold */
  units: number;
  /** Bounce rate (percentage) */
  bounceRate: number;
  /** Average session duration (seconds) */
  avgSessionDuration: number;
  /** Change from previous period (percentage) */
  change: {
    impressions: number;
    conversions: number;
    conversionRate: number;
  };
}

/**
 * Time series data point
 */
export interface TimeSeriesDataPoint {
  /** Date (YYYY-MM-DD) */
  date: string;
  /** Metric value */
  value: number;
  /** Optional label */
  label?: string;
}

/**
 * CPP performance over time
 */
export interface CPPPerformanceTimeSeries {
  /** Custom product page ID */
  cppId: string;
  /** Metric type */
  metric: MetricType;
  /** Time series data */
  data: TimeSeriesDataPoint[];
  /** Period */
  period: AnalyticsPeriod;
  /** Start date */
  startDate: string;
  /** End date */
  endDate: string;
}

/**
 * Device breakdown metrics
 */
export interface DeviceMetrics {
  /** Device type */
  device: AnalyticsDeviceType;
  /** Impressions */
  impressions: number;
  /** Conversions */
  conversions: number;
  /** Conversion rate */
  conversionRate: number;
  /** Percentage of total impressions */
  percentage: number;
}

/**
 * Locale breakdown metrics
 */
export interface LocaleMetrics {
  /** Locale code (e.g., 'en-US') */
  locale: string;
  /** Locale display name */
  localeName: string;
  /** Impressions */
  impressions: number;
  /** Conversions */
  conversions: number;
  /** Conversion rate */
  conversionRate: number;
  /** Percentage of total impressions */
  percentage: number;
}

/**
 * Source/Campaign metrics
 */
export interface SourceMetrics {
  /** Source name (e.g., 'organic', 'paid', 'social') */
  source: string;
  /** Campaign name (if applicable) */
  campaign?: string;
  /** Impressions */
  impressions: number;
  /** Conversions */
  conversions: number;
  /** Conversion rate */
  conversionRate: number;
  /** Cost per acquisition (if available) */
  cpa?: number;
  /** Return on ad spend (if available) */
  roas?: number;
}

/**
 * Complete analytics breakdown
 */
export interface CPPAnalyticsBreakdown {
  /** Custom product page ID */
  cppId: string;
  /** Device breakdown */
  byDevice: DeviceMetrics[];
  /** Locale breakdown */
  byLocale: LocaleMetrics[];
  /** Source breakdown */
  bySource: SourceMetrics[];
  /** Period */
  period: AnalyticsPeriod;
  /** Start date */
  startDate: string;
  /** End date */
  endDate: string;
}

/**
 * CPP comparison entry
 */
export interface CPPComparison {
  /** Custom product page ID */
  cppId: string;
  /** Custom product page name */
  cppName: string;
  /** Is this the default product page? */
  isDefault: boolean;
  /** Impressions */
  impressions: number;
  /** Conversions */
  conversions: number;
  /** Conversion rate */
  conversionRate: number;
  /** Relative performance vs best (percentage) */
  relativePerformance: number;
  /** Is this the best performer? */
  isBest: boolean;
  /** Statistical significance (if A/B test) */
  significance?: number;
}

/**
 * Multi-CPP comparison results
 */
export interface CPPComparisonResults {
  /** App ID */
  appId: string;
  /** App name */
  appName: string;
  /** CPP comparisons */
  comparisons: CPPComparison[];
  /** Best performing CPP ID */
  bestCppId: string;
  /** Period */
  period: AnalyticsPeriod;
  /** Start date */
  startDate: string;
  /** End date */
  endDate: string;
  /** Total impressions across all CPPs */
  totalImpressions: number;
  /** Total conversions across all CPPs */
  totalConversions: number;
  /** Overall conversion rate */
  overallConversionRate: number;
}

/**
 * CPP ranking entry
 */
export interface CPPRanking {
  /** Rank position (1-based) */
  rank: number;
  /** Custom product page ID */
  cppId: string;
  /** Custom product page name */
  cppName: string;
  /** Primary metric value */
  metricValue: number;
  /** Primary metric type */
  metricType: MetricType;
  /** Change in rank from previous period */
  rankChange: number;
}

/**
 * Top performing CPPs
 */
export interface CPPTopPerformers {
  /** App ID */
  appId: string;
  /** Metric type used for ranking */
  metricType: MetricType;
  /** Rankings */
  rankings: CPPRanking[];
  /** Period */
  period: AnalyticsPeriod;
}

/**
 * Funnel stage
 */
export interface FunnelStage {
  /** Stage name */
  stage: string;
  /** Number of users at this stage */
  count: number;
  /** Percentage of initial stage */
  percentage: number;
  /** Drop-off from previous stage (percentage) */
  dropOff?: number;
}

/**
 * CPP conversion funnel
 */
export interface CPPConversionFunnel {
  /** Custom product page ID */
  cppId: string;
  /** Funnel stages */
  stages: FunnelStage[];
  /** Overall conversion rate */
  overallConversionRate: number;
  /** Period */
  period: AnalyticsPeriod;
}

/**
 * Analytics query options
 */
export interface AnalyticsQueryOptions {
  /** Custom product page ID(s) */
  cppIds: string | string[];
  /** Time period */
  period?: AnalyticsPeriod;
  /** Custom start date (YYYY-MM-DD) */
  startDate?: string;
  /** Custom end date (YYYY-MM-DD) */
  endDate?: string;
  /** Device type filter */
  device?: AnalyticsDeviceType;
  /** Locale filter */
  locale?: string;
  /** Source filter */
  source?: string;
  /** Metric types to fetch */
  metrics?: MetricType[];
  /** Include time series data */
  includeTimeSeries?: boolean;
  /** Include breakdowns */
  includeBreakdown?: boolean;
  /** Include comparison */
  includeComparison?: boolean;
}

/**
 * Complete CPP analytics report
 */
export interface CPPAnalyticsReport {
  /** App ID */
  appId: string;
  /** App name */
  appName: string;
  /** Primary metrics */
  metrics: CPPMetrics;
  /** Performance over time */
  timeSeries?: CPPPerformanceTimeSeries[];
  /** Analytics breakdown */
  breakdown?: CPPAnalyticsBreakdown;
  /** Conversion funnel */
  funnel?: CPPConversionFunnel;
  /** Period */
  period: AnalyticsPeriod;
  /** Start date */
  startDate: string;
  /** End date */
  endDate: string;
  /** Generated at timestamp */
  generatedAt: string;
}

/**
 * Analytics summary for all CPPs in an app
 */
export interface AppAnalyticsSummary {
  /** App ID */
  appId: string;
  /** App name */
  appName: string;
  /** Total CPPs */
  totalCpps: number;
  /** Active CPPs */
  activeCpps: number;
  /** Best performing CPP */
  bestPerformer: {
    cppId: string;
    cppName: string;
    conversionRate: number;
  };
  /** Overall metrics */
  overall: {
    impressions: number;
    conversions: number;
    conversionRate: number;
    proceeds: number;
  };
  /** Period */
  period: AnalyticsPeriod;
  /** Start date */
  startDate: string;
  /** End date */
  endDate: string;
}

/**
 * Chart configuration for visualizations
 */
export interface ChartConfig {
  /** Chart type */
  type: 'line' | 'bar' | 'pie' | 'funnel' | 'comparison';
  /** Chart title */
  title: string;
  /** X-axis label */
  xLabel?: string;
  /** Y-axis label */
  yLabel?: string;
  /** Color scheme */
  colors?: string[];
  /** Show legend */
  showLegend?: boolean;
  /** Show grid */
  showGrid?: boolean;
  /** Height (pixels) */
  height?: number;
}

/**
 * Export options for analytics data
 */
export interface AnalyticsExportOptions {
  /** Export format */
  format: 'json' | 'csv' | 'xlsx' | 'pdf';
  /** Include time series data */
  includeTimeSeries?: boolean;
  /** Include breakdowns */
  includeBreakdown?: boolean;
  /** Include charts */
  includeCharts?: boolean;
  /** File name */
  fileName?: string;
}

/**
 * Result of analytics export operation
 */
export interface AnalyticsExportResult {
  /** Success status */
  success: boolean;
  /** File path or URL */
  filePath?: string;
  /** File size (bytes) */
  fileSize?: number;
  /** Error message if failed */
  error?: string;
}
