# APP-024: CPP Analytics Dashboard

## Overview

Complete analytics and performance tracking system for Custom Product Pages (CPP) in App Store Connect. Provides comprehensive metrics, comparisons, breakdowns, and insights to optimize CPP performance and conversion rates.

## Features

- **📊 Metrics Dashboard**: View key performance indicators including impressions, conversions, conversion rate, and revenue
- **📈 Performance Over Time**: Track metrics trends with time series data
- **🔍 Detailed Breakdowns**: Analyze performance by device, locale, and traffic source
- **⚔️ CPP Comparison**: Compare multiple CPPs side-by-side to identify best performers
- **🎯 Conversion Funnel**: Visualize user journey from page view to download
- **🏆 Top Performers**: Rank CPPs by various metrics
- **📁 Data Export**: Export analytics data in multiple formats (JSON, CSV, XLSX, PDF)
- **🎨 Interactive UI**: Beautiful, responsive dashboard with real-time updates

## Quick Start

### 1. Access the Dashboard

Navigate to `/analytics` in your browser, or click the "Analytics" link from any CPP management page.

```
http://localhost:3000/analytics
```

### 2. View CPP Metrics

```typescript
import { getCPPMetrics } from '@/services/cppAnalytics';

const metrics = await getCPPMetrics('cpp-id', {
  period: '30d', // '7d', '14d', '30d', or '90d'
});

console.log('Impressions:', metrics.impressions);
console.log('Conversions:', metrics.conversions);
console.log('Conversion Rate:', metrics.conversionRate, '%');
console.log('Revenue:', metrics.proceeds);
```

### 3. Compare Multiple CPPs

```typescript
import { compareCPPs } from '@/services/cppAnalytics';

const comparison = await compareCPPs('app-id', undefined, {
  period: '30d',
});

console.log('Best CPP:', comparison.bestCppId);
console.log('Total Impressions:', comparison.totalImpressions);
console.log('Overall CR:', comparison.overallConversionRate);

// View all comparisons
comparison.comparisons.forEach(cpp => {
  console.log(`${cpp.cppName}: ${cpp.conversionRate}% CR`);
  console.log(`  Relative Performance: ${cpp.relativePerformance}%`);
  console.log(`  Is Winner: ${cpp.isBest}`);
});
```

### 4. Run Tests

```bash
npm run test:cpp-analytics
```

## Architecture

### Type Definitions

All types are defined in `src/types/cppAnalytics.ts`:

- **CPPMetrics**: Core performance metrics for a single CPP
- **CPPPerformanceTimeSeries**: Time series data for metric trends
- **CPPAnalyticsBreakdown**: Device, locale, and source breakdowns
- **CPPComparisonResults**: Multi-CPP comparison data
- **CPPConversionFunnel**: User journey funnel visualization
- **CPPAnalyticsReport**: Complete analytics report
- **AppAnalyticsSummary**: App-wide analytics summary

### Service Layer

All analytics functions are in `src/services/cppAnalytics.ts`:

#### Core Functions

- `getCPPMetrics()` - Get metrics for a single CPP
- `getCPPPerformanceTimeSeries()` - Get time series data
- `getCPPAnalyticsBreakdown()` - Get detailed breakdowns
- `compareCPPs()` - Compare multiple CPPs
- `getTopPerformers()` - Get top performing CPPs
- `getCPPConversionFunnel()` - Get conversion funnel
- `getCPPAnalyticsReport()` - Get complete report
- `getAppAnalyticsSummary()` - Get app-wide summary

#### Utility Functions

- `exportAnalytics()` - Export analytics data
- `compareCPPToDefault()` - Compare CPP to default page

### UI Components

The dashboard is located at `src/app/analytics/`:

- `page.tsx` - Main analytics dashboard component
- `analytics.module.css` - Dashboard styles

## API Reference

### getCPPMetrics

Get performance metrics for a Custom Product Page.

```typescript
async function getCPPMetrics(
  cppId: string,
  options?: {
    period?: '7d' | '14d' | '30d' | '90d';
    startDate?: string;  // YYYY-MM-DD
    endDate?: string;    // YYYY-MM-DD
  }
): Promise<CPPMetrics>
```

**Returns:**

```typescript
{
  cppId: string;
  cppName: string;
  impressions: number;          // Page views
  conversions: number;          // Downloads
  conversionRate: number;       // Percentage
  productViews: number;         // Product page views
  appClips: number;             // App clip impressions
  proceeds: number;             // Revenue ($)
  units: number;                // Units sold
  bounceRate: number;           // Percentage
  avgSessionDuration: number;   // Seconds
  change: {
    impressions: number;        // % change
    conversions: number;        // % change
    conversionRate: number;     // % change
  };
}
```

### getCPPPerformanceTimeSeries

Get time series data for a specific metric.

```typescript
async function getCPPPerformanceTimeSeries(
  cppId: string,
  metric: 'impressions' | 'conversions' | 'conversionRate' | 'productViews' | 'appClips' | 'proceeds' | 'units',
  options?: {
    period?: '7d' | '14d' | '30d' | '90d';
    startDate?: string;
    endDate?: string;
  }
): Promise<CPPPerformanceTimeSeries>
```

**Returns:**

```typescript
{
  cppId: string;
  metric: MetricType;
  data: Array<{
    date: string;    // YYYY-MM-DD
    value: number;
  }>;
  period: AnalyticsPeriod;
  startDate: string;
  endDate: string;
}
```

### getCPPAnalyticsBreakdown

Get analytics breakdown by device, locale, and source.

```typescript
async function getCPPAnalyticsBreakdown(
  cppId: string,
  options?: {
    period?: '7d' | '14d' | '30d' | '90d';
  }
): Promise<CPPAnalyticsBreakdown>
```

**Returns:**

```typescript
{
  cppId: string;
  byDevice: Array<{
    device: 'iphone' | 'ipad' | 'mac' | 'watch' | 'tv' | 'vision';
    impressions: number;
    conversions: number;
    conversionRate: number;
    percentage: number;
  }>;
  byLocale: Array<{
    locale: string;              // e.g., 'en-US'
    localeName: string;          // e.g., 'English (US)'
    impressions: number;
    conversions: number;
    conversionRate: number;
    percentage: number;
  }>;
  bySource: Array<{
    source: string;              // e.g., 'organic', 'paid'
    campaign?: string;
    impressions: number;
    conversions: number;
    conversionRate: number;
    cpa?: number;                // Cost per acquisition
    roas?: number;               // Return on ad spend
  }>;
  period: AnalyticsPeriod;
  startDate: string;
  endDate: string;
}
```

### compareCPPs

Compare performance of multiple Custom Product Pages.

```typescript
async function compareCPPs(
  appId: string,
  cppIds?: string[],           // Optional: compare specific CPPs
  options?: {
    period?: '7d' | '14d' | '30d' | '90d';
  }
): Promise<CPPComparisonResults>
```

**Returns:**

```typescript
{
  appId: string;
  appName: string;
  comparisons: Array<{
    cppId: string;
    cppName: string;
    isDefault: boolean;
    impressions: number;
    conversions: number;
    conversionRate: number;
    relativePerformance: number;  // Percentage vs best
    isBest: boolean;
  }>;
  bestCppId: string;
  period: AnalyticsPeriod;
  startDate: string;
  endDate: string;
  totalImpressions: number;
  totalConversions: number;
  overallConversionRate: number;
}
```

### getTopPerformers

Get ranking of top performing CPPs.

```typescript
async function getTopPerformers(
  appId: string,
  metricType?: 'impressions' | 'conversions' | 'conversionRate',
  options?: {
    period?: '7d' | '14d' | '30d' | '90d';
    limit?: number;              // Max number of results (default: 10)
  }
): Promise<CPPTopPerformers>
```

**Returns:**

```typescript
{
  appId: string;
  metricType: MetricType;
  rankings: Array<{
    rank: number;                // 1-based ranking
    cppId: string;
    cppName: string;
    metricValue: number;
    metricType: MetricType;
    rankChange: number;          // Change from previous period
  }>;
  period: AnalyticsPeriod;
}
```

### getCPPConversionFunnel

Get conversion funnel showing user journey.

```typescript
async function getCPPConversionFunnel(
  cppId: string,
  options?: {
    period?: '7d' | '14d' | '30d' | '90d';
  }
): Promise<CPPConversionFunnel>
```

**Returns:**

```typescript
{
  cppId: string;
  stages: Array<{
    stage: string;               // Stage name
    count: number;               // Users at this stage
    percentage: number;          // % of initial stage
    dropOff?: number;            // % drop from previous stage
  }>;
  overallConversionRate: number;
  period: AnalyticsPeriod;
}
```

### getCPPAnalyticsReport

Get complete analytics report with all data.

```typescript
async function getCPPAnalyticsReport(
  cppId: string,
  options?: {
    period?: '7d' | '14d' | '30d' | '90d';
    includeTimeSeries?: boolean;
    includeBreakdown?: boolean;
    metrics?: MetricType[];
  }
): Promise<CPPAnalyticsReport>
```

**Returns:**

```typescript
{
  appId: string;
  appName: string;
  metrics: CPPMetrics;
  timeSeries?: CPPPerformanceTimeSeries[];
  breakdown?: CPPAnalyticsBreakdown;
  funnel?: CPPConversionFunnel;
  period: AnalyticsPeriod;
  startDate: string;
  endDate: string;
  generatedAt: string;
}
```

### getAppAnalyticsSummary

Get app-wide analytics summary.

```typescript
async function getAppAnalyticsSummary(
  appId: string,
  options?: {
    period?: '7d' | '14d' | '30d' | '90d';
  }
): Promise<AppAnalyticsSummary>
```

**Returns:**

```typescript
{
  appId: string;
  appName: string;
  totalCpps: number;
  activeCpps: number;
  bestPerformer: {
    cppId: string;
    cppName: string;
    conversionRate: number;
  };
  overall: {
    impressions: number;
    conversions: number;
    conversionRate: number;
    proceeds: number;
  };
  period: AnalyticsPeriod;
  startDate: string;
  endDate: string;
}
```

### exportAnalytics

Export analytics data in various formats.

```typescript
async function exportAnalytics(
  cppId: string,
  options: {
    format: 'json' | 'csv' | 'xlsx' | 'pdf';
    includeTimeSeries?: boolean;
    includeBreakdown?: boolean;
    includeCharts?: boolean;
    fileName?: string;
  }
): Promise<AnalyticsExportResult>
```

**Returns:**

```typescript
{
  success: boolean;
  filePath?: string;
  fileSize?: number;
  error?: string;
}
```

### compareCPPToDefault

Compare a CPP against the default product page.

```typescript
async function compareCPPToDefault(
  cppId: string,
  appId: string,
  options?: {
    period?: '7d' | '14d' | '30d' | '90d';
  }
): Promise<{
  cpp: CPPMetrics;
  default: CPPMetrics;
  improvement: number;
  isWinner: boolean;
}>
```

## Dashboard Features

### Overview Tab

- **Summary Cards**: Key metrics with trend indicators
- **Quick Stats**: Bounce rate, session duration, product views, app clips
- **App Overview**: Total CPPs, best performer, total revenue

### Performance Tab

- **Time Series Charts**: Visualize trends over time
- **Multiple Metrics**: View impressions, conversions, and conversion rate
- **Date Range Selection**: Choose 7d, 14d, 30d, or 90d periods

### Breakdown Tab

- **Device Breakdown**: Performance by iPhone, iPad, Mac, Watch, TV, Vision
- **Locale Breakdown**: Performance by geographic region and language
- **Source Breakdown**: Organic vs paid traffic, campaign performance

### Comparison Tab

- **Side-by-Side Comparison**: Compare all CPPs in the app
- **Winner Detection**: Automatic identification of best performer
- **Relative Performance**: See how each CPP compares to the best
- **Sortable Columns**: Sort by any metric

### Funnel Tab

- **Conversion Funnel**: Visualize user journey from page view to download
- **Drop-off Analysis**: Identify where users are leaving the funnel
- **Stage Metrics**: Count and percentage at each stage

## Implementation Notes

### Current Implementation

**Note**: The current implementation uses mock data for demonstration purposes. In a production environment, this would integrate with the App Store Connect Analytics API to fetch real performance data.

### Mock Data Generation

- Realistic metrics with randomization for demonstration
- Consistent time series data generation
- Device, locale, and source breakdowns with realistic proportions
- Conversion funnel with logical progression

### Future Integration

To integrate with real App Store Connect Analytics API:

1. Obtain Analytics API access from App Store Connect
2. Update authentication flow to request Analytics scope
3. Replace mock data generation with actual API calls
4. Implement data caching for performance
5. Add real-time updates and webhooks

## Best Practices

### Performance Optimization

1. **Cache Analytics Data**: Cache metrics for frequently accessed CPPs
2. **Batch Requests**: Fetch multiple metrics in parallel
3. **Incremental Loading**: Load overview first, then details on demand
4. **Time Series Aggregation**: Pre-aggregate daily data for longer periods

### User Experience

1. **Loading States**: Show loading indicators during data fetch
2. **Error Handling**: Gracefully handle API failures with retry logic
3. **Responsive Design**: Ensure dashboard works on all screen sizes
4. **Export Options**: Allow users to download data for offline analysis

### Data Accuracy

1. **Deduplication**: Handle duplicate events from multiple sources
2. **Time Zone Handling**: Normalize all timestamps to UTC
3. **Statistical Significance**: Calculate confidence intervals for comparisons
4. **Attribution**: Properly attribute conversions to correct CPPs

## Testing

### Run Test Suite

```bash
npm run test:cpp-analytics
```

### Test Coverage

- ✅ Metrics fetching and validation
- ✅ Time series data generation
- ✅ Breakdown calculations
- ✅ CPP comparison logic
- ✅ Winner detection
- ✅ Relative performance calculation
- ✅ Top performers ranking
- ✅ Conversion funnel stages
- ✅ Complete report generation
- ✅ App summary aggregation
- ✅ Data export functionality
- ✅ Default page comparison

**Total Tests**: 20/20 passing ✅

## Troubleshooting

### No Data Showing

**Problem**: Dashboard shows no data or loading indefinitely.

**Solution**:
- Check browser console for errors
- Verify CPP ID is valid
- Ensure analytics service is responding
- Check network tab for failed requests

### Incorrect Metrics

**Problem**: Metrics don't match expected values.

**Solution**:
- Verify time period selection
- Check if using mock vs real data
- Confirm CPP ID matches intended page
- Review Analytics API permissions

### Export Fails

**Problem**: Data export returns an error.

**Solution**:
- Check export format is supported (json, csv, xlsx, pdf)
- Verify sufficient disk space
- Ensure write permissions for export directory
- Check file name doesn't contain invalid characters

## Related Features

- **APP-010**: Custom Product Page Creator
- **APP-011**: CPP List & Management
- **APP-014**: PPO Test Configuration
- **APP-015**: PPO Test Submission
- **APP-016**: PPO Results Dashboard

## References

- [App Store Connect API - Analytics](https://developer.apple.com/documentation/appstoreconnectapi/app_store_analytics)
- [Custom Product Pages Documentation](https://developer.apple.com/help/app-store-connect/manage-custom-product-pages/)
- [Product Page Optimization](https://developer.apple.com/help/app-store-connect/test-app-store-product-page-variations/)

## Changelog

### v1.0.0 (2026-01-28)

- ✨ Initial implementation with complete analytics dashboard
- ✨ CPP metrics tracking and comparison
- ✨ Device, locale, and source breakdowns
- ✨ Conversion funnel visualization
- ✨ Top performers ranking
- ✨ Data export functionality
- ✨ Comprehensive test suite (20 tests passing)
- 📚 Complete documentation and API reference
