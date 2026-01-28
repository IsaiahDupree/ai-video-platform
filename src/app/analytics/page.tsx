'use client';

/**
 * APP-024: CPP Analytics Dashboard
 *
 * Interactive dashboard for Custom Product Page performance tracking
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './analytics.module.css';
import type {
  CPPMetrics,
  CPPPerformanceTimeSeries,
  CPPAnalyticsBreakdown,
  CPPComparisonResults,
  CPPConversionFunnel,
  AppAnalyticsSummary,
  AnalyticsPeriod,
  MetricType,
} from '@/types/cppAnalytics';

// For demonstration, import mock functions
// In production, these would call the actual API
import {
  getCPPMetrics,
  getCPPPerformanceTimeSeries,
  getCPPAnalyticsBreakdown,
  compareCPPs,
  getCPPConversionFunnel,
  getAppAnalyticsSummary,
} from '@/services/cppAnalytics';

// Mock CPP list for selection
const MOCK_CPPS = [
  { id: 'cpp-1', name: 'Holiday Campaign 2026', appId: 'app-1' },
  { id: 'cpp-2', name: 'Summer Sale Campaign', appId: 'app-1' },
  { id: 'cpp-3', name: 'Back to School', appId: 'app-1' },
  { id: 'cpp-4', name: 'Black Friday Special', appId: 'app-1' },
];

export default function AnalyticsDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cppIdParam = searchParams.get('cppId');

  // State
  const [selectedCppId, setSelectedCppId] = useState<string>(cppIdParam || 'cpp-1');
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>('30d');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'performance' | 'breakdown' | 'comparison' | 'funnel'>('overview');
  const [loading, setLoading] = useState(false);

  // Data state
  const [metrics, setMetrics] = useState<CPPMetrics | null>(null);
  const [timeSeries, setTimeSeries] = useState<CPPPerformanceTimeSeries[]>([]);
  const [breakdown, setBreakdown] = useState<CPPAnalyticsBreakdown | null>(null);
  const [comparison, setComparison] = useState<CPPComparisonResults | null>(null);
  const [funnel, setFunnel] = useState<CPPConversionFunnel | null>(null);
  const [summary, setSummary] = useState<AppAnalyticsSummary | null>(null);

  // Load data
  useEffect(() => {
    loadAnalytics();
  }, [selectedCppId, selectedPeriod]);

  async function loadAnalytics() {
    setLoading(true);
    try {
      const appId = MOCK_CPPS.find(cpp => cpp.id === selectedCppId)?.appId || 'app-1';

      // Load all data in parallel
      const [metricsData, breakdownData, comparisonData, funnelData, summaryData] = await Promise.all([
        getCPPMetrics(selectedCppId, { period: selectedPeriod }),
        getCPPAnalyticsBreakdown(selectedCppId, { period: selectedPeriod }),
        compareCPPs(appId, undefined, { period: selectedPeriod }),
        getCPPConversionFunnel(selectedCppId, { period: selectedPeriod }),
        getAppAnalyticsSummary(appId, { period: selectedPeriod }),
      ]);

      setMetrics(metricsData);
      setBreakdown(breakdownData);
      setComparison(comparisonData);
      setFunnel(funnelData);
      setSummary(summaryData);

      // Load time series for key metrics
      const timeSeriesData = await Promise.all([
        getCPPPerformanceTimeSeries(selectedCppId, 'impressions', { period: selectedPeriod }),
        getCPPPerformanceTimeSeries(selectedCppId, 'conversions', { period: selectedPeriod }),
        getCPPPerformanceTimeSeries(selectedCppId, 'conversionRate', { period: selectedPeriod }),
      ]);
      setTimeSeries(timeSeriesData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  }

  function formatPercent(num: number): string {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  }

  function renderOverviewTab() {
    if (!metrics) return <div className={styles.loading}>Loading...</div>;

    return (
      <div className={styles.overviewTab}>
        {/* Summary Cards */}
        <div className={styles.summaryCards}>
          <div className={styles.card}>
            <div className={styles.cardIcon}>👁️</div>
            <div className={styles.cardContent}>
              <div className={styles.cardLabel}>Impressions</div>
              <div className={styles.cardValue}>{formatNumber(metrics.impressions)}</div>
              <div className={`${styles.cardChange} ${metrics.change.impressions >= 0 ? styles.positive : styles.negative}`}>
                {formatPercent(metrics.change.impressions)}
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcon}>⬇️</div>
            <div className={styles.cardContent}>
              <div className={styles.cardLabel}>Conversions</div>
              <div className={styles.cardValue}>{formatNumber(metrics.conversions)}</div>
              <div className={`${styles.cardChange} ${metrics.change.conversions >= 0 ? styles.positive : styles.negative}`}>
                {formatPercent(metrics.change.conversions)}
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcon}>📊</div>
            <div className={styles.cardContent}>
              <div className={styles.cardLabel}>Conversion Rate</div>
              <div className={styles.cardValue}>{metrics.conversionRate.toFixed(2)}%</div>
              <div className={`${styles.cardChange} ${metrics.change.conversionRate >= 0 ? styles.positive : styles.negative}`}>
                {formatPercent(metrics.change.conversionRate)}
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcon}>💰</div>
            <div className={styles.cardContent}>
              <div className={styles.cardLabel}>Revenue</div>
              <div className={styles.cardValue}>${formatNumber(metrics.proceeds)}</div>
              <div className={styles.cardInfo}>From {formatNumber(metrics.units)} units</div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className={styles.quickStats}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Bounce Rate:</span>
            <span className={styles.statValue}>{metrics.bounceRate}%</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Avg Session:</span>
            <span className={styles.statValue}>{Math.floor(metrics.avgSessionDuration / 60)}m {metrics.avgSessionDuration % 60}s</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Product Views:</span>
            <span className={styles.statValue}>{formatNumber(metrics.productViews)}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>App Clips:</span>
            <span className={styles.statValue}>{formatNumber(metrics.appClips)}</span>
          </div>
        </div>

        {/* App Summary */}
        {summary && (
          <div className={styles.appSummary}>
            <h3>App Overview</h3>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <div className={styles.summaryLabel}>Total CPPs</div>
                <div className={styles.summaryValue}>{summary.totalCpps}</div>
              </div>
              <div className={styles.summaryItem}>
                <div className={styles.summaryLabel}>Best Performer</div>
                <div className={styles.summaryValue}>{summary.bestPerformer.cppName}</div>
                <div className={styles.summarySubtext}>{summary.bestPerformer.conversionRate.toFixed(2)}% CR</div>
              </div>
              <div className={styles.summaryItem}>
                <div className={styles.summaryLabel}>Total Impressions</div>
                <div className={styles.summaryValue}>{formatNumber(summary.overall.impressions)}</div>
              </div>
              <div className={styles.summaryItem}>
                <div className={styles.summaryLabel}>Total Revenue</div>
                <div className={styles.summaryValue}>${formatNumber(summary.overall.proceeds)}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderPerformanceTab() {
    if (timeSeries.length === 0) return <div className={styles.loading}>Loading...</div>;

    return (
      <div className={styles.performanceTab}>
        <h3>Performance Over Time</h3>
        <p className={styles.notice}>📊 Chart visualizations coming soon. Time series data is being collected.</p>

        {timeSeries.map((series) => (
          <div key={series.metric} className={styles.chartSection}>
            <h4>{series.metric.charAt(0).toUpperCase() + series.metric.slice(1)}</h4>
            <div className={styles.miniChart}>
              <div className={styles.chartPlaceholder}>
                {series.data.slice(-7).map((point, i) => (
                  <div key={i} className={styles.dataPoint}>
                    <div className={styles.pointDate}>{point.date.split('-')[2]}</div>
                    <div className={styles.pointValue}>{formatNumber(point.value)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderBreakdownTab() {
    if (!breakdown) return <div className={styles.loading}>Loading...</div>;

    return (
      <div className={styles.breakdownTab}>
        {/* Device Breakdown */}
        <div className={styles.breakdownSection}>
          <h3>By Device</h3>
          <div className={styles.breakdownTable}>
            {breakdown.byDevice.map((device) => (
              <div key={device.device} className={styles.breakdownRow}>
                <div className={styles.breakdownLabel}>
                  {device.device.charAt(0).toUpperCase() + device.device.slice(1)}
                </div>
                <div className={styles.breakdownBar}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${device.percentage}%` }}
                  />
                </div>
                <div className={styles.breakdownStats}>
                  <span>{formatNumber(device.impressions)} impressions</span>
                  <span>{device.conversionRate.toFixed(2)}% CR</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Locale Breakdown */}
        <div className={styles.breakdownSection}>
          <h3>By Locale</h3>
          <div className={styles.breakdownTable}>
            {breakdown.byLocale.map((locale) => (
              <div key={locale.locale} className={styles.breakdownRow}>
                <div className={styles.breakdownLabel}>{locale.localeName}</div>
                <div className={styles.breakdownBar}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${locale.percentage}%` }}
                  />
                </div>
                <div className={styles.breakdownStats}>
                  <span>{formatNumber(locale.impressions)} impressions</span>
                  <span>{locale.conversionRate.toFixed(2)}% CR</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Source Breakdown */}
        <div className={styles.breakdownSection}>
          <h3>By Source</h3>
          <div className={styles.breakdownTable}>
            {breakdown.bySource.map((source, i) => (
              <div key={i} className={styles.breakdownRow}>
                <div className={styles.breakdownLabel}>
                  {source.source.charAt(0).toUpperCase() + source.source.slice(1)}
                  {source.campaign && <span className={styles.campaign}> - {source.campaign}</span>}
                </div>
                <div className={styles.breakdownStats}>
                  <span>{formatNumber(source.impressions)} impressions</span>
                  <span>{source.conversionRate.toFixed(2)}% CR</span>
                  {source.cpa && <span>${source.cpa.toFixed(2)} CPA</span>}
                  {source.roas && <span>{source.roas.toFixed(1)}x ROAS</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderComparisonTab() {
    if (!comparison) return <div className={styles.loading}>Loading...</div>;

    return (
      <div className={styles.comparisonTab}>
        <h3>CPP Comparison</h3>
        <div className={styles.comparisonSummary}>
          <div className={styles.summaryCard}>
            <div className={styles.label}>Total Impressions</div>
            <div className={styles.value}>{formatNumber(comparison.totalImpressions)}</div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.label}>Total Conversions</div>
            <div className={styles.value}>{formatNumber(comparison.totalConversions)}</div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.label}>Overall CR</div>
            <div className={styles.value}>{comparison.overallConversionRate.toFixed(2)}%</div>
          </div>
        </div>

        <div className={styles.comparisonTable}>
          <div className={styles.tableHeader}>
            <div className={styles.col1}>CPP Name</div>
            <div className={styles.col2}>Impressions</div>
            <div className={styles.col3}>Conversions</div>
            <div className={styles.col4}>CR</div>
            <div className={styles.col5}>Performance</div>
          </div>
          {comparison.comparisons.map((comp) => (
            <div
              key={comp.cppId}
              className={`${styles.tableRow} ${comp.isBest ? styles.winner : ''}`}
            >
              <div className={styles.col1}>
                {comp.isBest && <span className={styles.trophy}>🏆</span>}
                {comp.cppName}
                {comp.isDefault && <span className={styles.badge}>Default</span>}
              </div>
              <div className={styles.col2}>{formatNumber(comp.impressions)}</div>
              <div className={styles.col3}>{formatNumber(comp.conversions)}</div>
              <div className={styles.col4}>{comp.conversionRate.toFixed(2)}%</div>
              <div className={styles.col5}>
                <div className={styles.performanceBar}>
                  <div
                    className={styles.performanceFill}
                    style={{ width: `${comp.relativePerformance}%` }}
                  />
                </div>
                <span className={styles.performanceText}>{comp.relativePerformance.toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderFunnelTab() {
    if (!funnel) return <div className={styles.loading}>Loading...</div>;

    return (
      <div className={styles.funnelTab}>
        <h3>Conversion Funnel</h3>
        <div className={styles.funnelStats}>
          <div className={styles.statCard}>
            <div className={styles.label}>Overall Conversion Rate</div>
            <div className={styles.value}>{funnel.overallConversionRate.toFixed(2)}%</div>
          </div>
        </div>

        <div className={styles.funnelChart}>
          {funnel.stages.map((stage, i) => (
            <div key={i} className={styles.funnelStage}>
              <div className={styles.stageName}>{stage.stage}</div>
              <div
                className={styles.stageBar}
                style={{ width: `${stage.percentage}%` }}
              >
                <div className={styles.stageCount}>{formatNumber(stage.count)}</div>
                <div className={styles.stagePercent}>{stage.percentage.toFixed(1)}%</div>
              </div>
              {stage.dropOff !== undefined && (
                <div className={styles.dropOff}>
                  ↓ {stage.dropOff.toFixed(1)}% drop-off
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>📊 CPP Analytics</h1>
          <p>Custom Product Page Performance Dashboard</p>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.backButton} onClick={() => router.push('/cpp')}>
            ← Back to CPP List
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label>Custom Product Page:</label>
          <select
            value={selectedCppId}
            onChange={(e) => setSelectedCppId(e.target.value)}
            className={styles.select}
          >
            {MOCK_CPPS.map((cpp) => (
              <option key={cpp.id} value={cpp.id}>{cpp.name}</option>
            ))}
          </select>
        </div>

        <div className={styles.controlGroup}>
          <label>Time Period:</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as AnalyticsPeriod)}
            className={styles.select}
          >
            <option value="7d">Last 7 Days</option>
            <option value="14d">Last 14 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>

        <button className={styles.refreshButton} onClick={loadAnalytics} disabled={loading}>
          {loading ? '⏳ Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${selectedTab === 'overview' ? styles.active : ''}`}
          onClick={() => setSelectedTab('overview')}
        >
          Overview
        </button>
        <button
          className={`${styles.tab} ${selectedTab === 'performance' ? styles.active : ''}`}
          onClick={() => setSelectedTab('performance')}
        >
          Performance
        </button>
        <button
          className={`${styles.tab} ${selectedTab === 'breakdown' ? styles.active : ''}`}
          onClick={() => setSelectedTab('breakdown')}
        >
          Breakdown
        </button>
        <button
          className={`${styles.tab} ${selectedTab === 'comparison' ? styles.active : ''}`}
          onClick={() => setSelectedTab('comparison')}
        >
          Comparison
        </button>
        <button
          className={`${styles.tab} ${selectedTab === 'funnel' ? styles.active : ''}`}
          onClick={() => setSelectedTab('funnel')}
        >
          Funnel
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.content}>
        {selectedTab === 'overview' && renderOverviewTab()}
        {selectedTab === 'performance' && renderPerformanceTab()}
        {selectedTab === 'breakdown' && renderBreakdownTab()}
        {selectedTab === 'comparison' && renderComparisonTab()}
        {selectedTab === 'funnel' && renderFunnelTab()}
      </div>
    </div>
  );
}
