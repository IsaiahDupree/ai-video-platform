'use client';

/**
 * APP-016: PPO Results Dashboard
 *
 * Product Page Optimization test results interface with winner detection
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './results.module.css';
import type { PPOTestResults, PPOTestInfo } from '@/types/ascPPO';

// Mock data for demonstration
const MOCK_TEST: PPOTestInfo = {
  id: 'test-1',
  appId: 'app-1',
  appStoreVersionId: 'ver-1',
  name: 'Holiday Campaign Screenshot Test',
  state: 'COMPLETED',
  trafficProportion: 0.4,
  platform: 'IOS',
  startDate: '2025-12-01',
  endDate: '2026-01-15',
  treatments: [
    {
      id: 'treatment-1',
      experimentId: 'test-1',
      name: 'Control',
      state: 'APPROVED',
      trafficProportion: 0.4,
      localizations: [],
    },
    {
      id: 'treatment-2',
      experimentId: 'test-1',
      name: 'Hero Screenshot A',
      state: 'APPROVED',
      trafficProportion: 0.3,
      localizations: [],
    },
    {
      id: 'treatment-3',
      experimentId: 'test-1',
      name: 'Hero Screenshot B',
      state: 'APPROVED',
      trafficProportion: 0.3,
      localizations: [],
    },
  ],
};

const MOCK_RESULTS: PPOTestResults[] = [
  {
    treatmentId: 'treatment-1',
    treatmentName: 'Control',
    impressions: 12500,
    conversions: 1875,
    conversionRate: 15.0,
    improvement: 0,
    confidence: 99.5,
    isWinner: false,
  },
  {
    treatmentId: 'treatment-2',
    treatmentName: 'Hero Screenshot A',
    impressions: 9400,
    conversions: 1598,
    conversionRate: 17.0,
    improvement: 13.3,
    confidence: 97.8,
    isWinner: true,
  },
  {
    treatmentId: 'treatment-3',
    treatmentName: 'Hero Screenshot B',
    impressions: 9300,
    conversions: 1488,
    conversionRate: 16.0,
    improvement: 6.7,
    confidence: 92.1,
    isWinner: false,
  },
];

export default function PPOResultsPage() {
  const searchParams = useSearchParams();
  const testId = searchParams.get('testId') || 'test-1';

  const [test, setTest] = useState<PPOTestInfo>(MOCK_TEST);
  const [results, setResults] = useState<PPOTestResults[]>(MOCK_RESULTS);
  const [loading, setLoading] = useState(false);
  const [selectedView, setSelectedView] = useState<'overview' | 'detailed' | 'timeline'>('overview');

  useEffect(() => {
    loadResults();
  }, [testId]);

  const loadResults = async () => {
    setLoading(true);

    // In a real implementation, this would fetch from the API:
    // const response = await getPPOTestResultsWithWinner(testId);
    // if (response.success) {
    //   setResults(response.data.results);
    //   setWinner(response.data.winner);
    // }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    setLoading(false);
  };

  const winner = results.find(r => r.isWinner);
  const totalImpressions = results.reduce((sum, r) => sum + r.impressions, 0);
  const avgConversionRate = results.reduce((sum, r) => sum + r.conversionRate, 0) / results.length;

  // Calculate max improvement for winner badge
  const maxImprovement = Math.max(...results.map(r => r.improvement));

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            PPO Test Results
            <span className={styles.stateBadge} data-state={test.state.toLowerCase()}>
              {test.state}
            </span>
          </h1>
          <p className={styles.subtitle}>{test.name}</p>
          <div className={styles.metadata}>
            <span>Platform: {test.platform}</span>
            <span>•</span>
            <span>Started: {test.startDate}</span>
            {test.endDate && (
              <>
                <span>•</span>
                <span>Ended: {test.endDate}</span>
              </>
            )}
          </div>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.secondaryButton}
            onClick={() => window.history.back()}
          >
            ← Back to Tests
          </button>
          {winner && (
            <button className={styles.primaryButton}>
              Apply Winner
            </button>
          )}
        </div>
      </div>

      {/* Winner Banner */}
      {winner && (
        <div className={styles.winnerBanner}>
          <div className={styles.winnerIcon}>🏆</div>
          <div className={styles.winnerContent}>
            <h3>Clear Winner Detected!</h3>
            <p>
              <strong>{winner.treatmentName}</strong> showed a{' '}
              <strong>{winner.improvement.toFixed(1)}%</strong> improvement
              in conversion rate with <strong>{winner.confidence}%</strong> confidence.
            </p>
          </div>
          <div className={styles.winnerStats}>
            <div className={styles.winnerStat}>
              <div className={styles.winnerStatValue}>
                {winner.conversionRate.toFixed(1)}%
              </div>
              <div className={styles.winnerStatLabel}>Conversion Rate</div>
            </div>
            <div className={styles.winnerStat}>
              <div className={styles.winnerStatValue}>
                +{winner.improvement.toFixed(1)}%
              </div>
              <div className={styles.winnerStatLabel}>Improvement</div>
            </div>
          </div>
        </div>
      )}

      {/* No Winner Banner */}
      {!winner && test.state === 'COMPLETED' && (
        <div className={styles.noWinnerBanner}>
          <div className={styles.noWinnerIcon}>📊</div>
          <div className={styles.noWinnerContent}>
            <h3>No Clear Winner</h3>
            <p>
              None of the treatments met the criteria for a statistically significant winner.
              Consider running a new test with different variations or extending the test duration.
            </p>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className={styles.summaryStats}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {totalImpressions.toLocaleString()}
          </div>
          <div className={styles.statLabel}>Total Impressions</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {results.length}
          </div>
          <div className={styles.statLabel}>Treatments Tested</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {avgConversionRate.toFixed(1)}%
          </div>
          <div className={styles.statLabel}>Avg Conversion Rate</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {maxImprovement > 0 ? '+' : ''}{maxImprovement.toFixed(1)}%
          </div>
          <div className={styles.statLabel}>Max Improvement</div>
        </div>
      </div>

      {/* View Tabs */}
      <div className={styles.viewTabs}>
        <button
          className={selectedView === 'overview' ? styles.viewTabActive : styles.viewTab}
          onClick={() => setSelectedView('overview')}
        >
          Overview
        </button>
        <button
          className={selectedView === 'detailed' ? styles.viewTabActive : styles.viewTab}
          onClick={() => setSelectedView('detailed')}
        >
          Detailed Metrics
        </button>
        <button
          className={selectedView === 'timeline' ? styles.viewTabActive : styles.viewTab}
          onClick={() => setSelectedView('timeline')}
        >
          Timeline
        </button>
      </div>

      {/* Results Content */}
      {selectedView === 'overview' && (
        <div className={styles.resultsGrid}>
          {results.map((result) => (
            <div
              key={result.treatmentId}
              className={`${styles.resultCard} ${result.isWinner ? styles.resultCardWinner : ''}`}
            >
              {result.isWinner && (
                <div className={styles.winnerBadge}>🏆 Winner</div>
              )}
              <h3 className={styles.resultCardTitle}>{result.treatmentName}</h3>

              {/* Main Metrics */}
              <div className={styles.mainMetric}>
                <div className={styles.mainMetricValue}>
                  {result.conversionRate.toFixed(1)}%
                </div>
                <div className={styles.mainMetricLabel}>Conversion Rate</div>
              </div>

              {/* Improvement Badge */}
              {result.improvement !== 0 && (
                <div className={`${styles.improvementBadge} ${
                  result.improvement > 0 ? styles.improvementPositive : styles.improvementNegative
                }`}>
                  {result.improvement > 0 ? '+' : ''}{result.improvement.toFixed(1)}%
                  <span className={styles.improvementLabel}>vs Control</span>
                </div>
              )}

              {/* Secondary Metrics */}
              <div className={styles.secondaryMetrics}>
                <div className={styles.metric}>
                  <div className={styles.metricLabel}>Impressions</div>
                  <div className={styles.metricValue}>
                    {result.impressions.toLocaleString()}
                  </div>
                </div>
                <div className={styles.metric}>
                  <div className={styles.metricLabel}>Conversions</div>
                  <div className={styles.metricValue}>
                    {result.conversions.toLocaleString()}
                  </div>
                </div>
                <div className={styles.metric}>
                  <div className={styles.metricLabel}>Confidence</div>
                  <div className={styles.metricValue}>
                    {result.confidence.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Confidence Bar */}
              <div className={styles.confidenceBar}>
                <div className={styles.confidenceBarLabel}>
                  Statistical Confidence
                </div>
                <div className={styles.confidenceBarTrack}>
                  <div
                    className={styles.confidenceBarFill}
                    style={{ width: `${result.confidence}%` }}
                    data-high={result.confidence >= 95}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed View */}
      {selectedView === 'detailed' && (
        <div className={styles.detailedView}>
          <div className={styles.tableContainer}>
            <table className={styles.resultsTable}>
              <thead>
                <tr>
                  <th>Treatment</th>
                  <th>Impressions</th>
                  <th>Conversions</th>
                  <th>Conversion Rate</th>
                  <th>Improvement</th>
                  <th>Confidence</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result.treatmentId} className={result.isWinner ? styles.winnerRow : ''}>
                    <td>
                      {result.isWinner && '🏆 '}
                      <strong>{result.treatmentName}</strong>
                    </td>
                    <td>{result.impressions.toLocaleString()}</td>
                    <td>{result.conversions.toLocaleString()}</td>
                    <td><strong>{result.conversionRate.toFixed(2)}%</strong></td>
                    <td>
                      <span className={result.improvement > 0 ? styles.positive : styles.negative}>
                        {result.improvement > 0 ? '+' : ''}{result.improvement.toFixed(2)}%
                      </span>
                    </td>
                    <td>
                      <span className={result.confidence >= 95 ? styles.highConfidence : ''}>
                        {result.confidence.toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${
                        result.confidence >= 95 ? styles.statusSuccess :
                        result.confidence >= 90 ? styles.statusWarning :
                        styles.statusInfo
                      }`}>
                        {result.confidence >= 95 ? 'Significant' :
                         result.confidence >= 90 ? 'Likely' :
                         'Inconclusive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recommendations */}
          <div className={styles.recommendations}>
            <h3>Recommendations</h3>
            <ul>
              {winner ? (
                <>
                  <li>
                    ✅ <strong>{winner.treatmentName}</strong> is the clear winner with{' '}
                    {winner.confidence}% confidence.
                  </li>
                  <li>
                    Consider applying this treatment to your default product page to improve
                    conversion rates by approximately {winner.improvement.toFixed(1)}%.
                  </li>
                  <li>
                    Monitor performance after applying to ensure results hold in production.
                  </li>
                </>
              ) : (
                <>
                  <li>
                    No treatment showed statistically significant improvement over the control.
                  </li>
                  <li>
                    Consider running a longer test or testing more dramatic variations.
                  </li>
                  <li>
                    Review treatment designs to ensure they're meaningfully different from control.
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Timeline View */}
      {selectedView === 'timeline' && (
        <div className={styles.timelineView}>
          <div className={styles.timelineCard}>
            <h3>Test Timeline</h3>
            <div className={styles.timeline}>
              <div className={styles.timelineItem}>
                <div className={styles.timelineIcon}>📝</div>
                <div className={styles.timelineContent}>
                  <h4>Test Created</h4>
                  <p>Test configured with {results.length} treatments</p>
                  <span className={styles.timelineDate}>{test.startDate}</span>
                </div>
              </div>
              <div className={styles.timelineItem}>
                <div className={styles.timelineIcon}>✅</div>
                <div className={styles.timelineContent}>
                  <h4>Test Approved</h4>
                  <p>Passed Apple review and started collecting data</p>
                  <span className={styles.timelineDate}>{test.startDate}</span>
                </div>
              </div>
              <div className={styles.timelineItem}>
                <div className={styles.timelineIcon}>📊</div>
                <div className={styles.timelineContent}>
                  <h4>Data Collection</h4>
                  <p>Collected {totalImpressions.toLocaleString()} impressions across all treatments</p>
                  <span className={styles.timelineDate}>45 days</span>
                </div>
              </div>
              {test.endDate && (
                <div className={styles.timelineItem}>
                  <div className={styles.timelineIcon}>🏁</div>
                  <div className={styles.timelineContent}>
                    <h4>Test Completed</h4>
                    <p>
                      {winner
                        ? `Winner detected: ${winner.treatmentName}`
                        : 'No clear winner detected'}
                    </p>
                    <span className={styles.timelineDate}>{test.endDate}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Test Details */}
          <div className={styles.testDetails}>
            <h3>Test Configuration</h3>
            <div className={styles.detailsGrid}>
              <div className={styles.detail}>
                <div className={styles.detailLabel}>App ID</div>
                <div className={styles.detailValue}>{test.appId}</div>
              </div>
              <div className={styles.detail}>
                <div className={styles.detailLabel}>Version ID</div>
                <div className={styles.detailValue}>{test.appStoreVersionId}</div>
              </div>
              <div className={styles.detail}>
                <div className={styles.detailLabel}>Platform</div>
                <div className={styles.detailValue}>{test.platform}</div>
              </div>
              <div className={styles.detail}>
                <div className={styles.detailLabel}>Control Traffic</div>
                <div className={styles.detailValue}>
                  {(test.trafficProportion * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
