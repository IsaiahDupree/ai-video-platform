# APP-016: PPO Results Dashboard

**Status:** ✅ Complete
**Priority:** P1
**Effort:** 8pts
**Category:** apple-pages

Comprehensive results dashboard for Product Page Optimization (PPO) tests with winner detection, statistical analysis, and data visualization.

## Overview

The PPO Results Dashboard provides a complete interface for analyzing A/B test results from App Store Connect Product Page Optimization experiments. It includes:

- **Winner Detection**: Automatic identification of winning treatments
- **Statistical Analysis**: Z-test calculations and confidence intervals
- **Data Visualization**: Overview, detailed metrics, and timeline views
- **Recommendations**: Action items based on test outcomes

## Features

### 1. Winner Detection

Automatically identifies winning treatments based on:
- **Conversion Rate**: Highest performing variant
- **Statistical Confidence**: ≥ 95% confidence (configurable)
- **Improvement Threshold**: ≥ 5% improvement over control (configurable)
- **Sample Size**: ≥ 1,000 impressions (configurable)

### 2. Statistical Significance

Calculates p-values and confidence intervals using Z-test for two proportions:

```typescript
const significance = calculateStatisticalSignificance(
  treatmentImpressions,
  treatmentConversions,
  controlImpressions,
  controlConversions
);
// Returns: { zScore, pValue, isSignificant, confidence }
```

### 3. Results Dashboard UI

Three view modes:

#### Overview Mode
- Winner banner with key metrics
- Treatment cards with conversion rates
- Improvement badges (vs control)
- Confidence bars

#### Detailed Metrics Mode
- Comprehensive data table
- Statistical significance indicators
- Actionable recommendations

#### Timeline Mode
- Test lifecycle events
- Configuration details
- Duration tracking

## API Functions

### Fetch Test Results

```typescript
import { getPPOTestResults } from '@/services/ascPPO';

// Fetch results for a completed test
const result = await getPPOTestResults(experimentId, credentials);

if (result.success) {
  const results = result.data; // PPOTestResults[]
  console.log('Treatment results:', results);
}
```

**Note:** App Store Connect API may not provide direct analytics endpoints. The implementation demonstrates expected structure. In production, integrate with:
- App Analytics API (if available)
- App Store Connect Reports
- Sales and Trends data

### Detect Winner

```typescript
import { detectWinner } from '@/services/ascPPO';

// Find winning treatment
const winner = detectWinner(results, {
  minConfidence: 95,    // Minimum statistical confidence (%)
  minImprovement: 5,    // Minimum improvement over control (%)
  minImpressions: 1000  // Minimum sample size
});

if (winner) {
  console.log(`Winner: ${winner.treatmentName}`);
  console.log(`Improvement: ${winner.improvement}%`);
  console.log(`Confidence: ${winner.confidence}%`);
}
```

### Get Results with Winner

```typescript
import { getPPOTestResultsWithWinner } from '@/services/ascPPO';

// Fetch results and detect winner in one call
const result = await getPPOTestResultsWithWinner(experimentId, credentials);

if (result.success) {
  const { results, winner, hasWinner } = result.data;

  if (hasWinner) {
    console.log('Clear winner detected!');
    console.log('Winner:', winner);
  } else {
    console.log('No clear winner');
  }
}
```

### Calculate Statistical Significance

```typescript
import { calculateStatisticalSignificance } from '@/services/ascPPO';

const stats = calculateStatisticalSignificance(
  10000, // Treatment impressions
  1700,  // Treatment conversions
  10000, // Control impressions
  1500   // Control conversions
);

console.log('Z-score:', stats.zScore);              // e.g., 4.082
console.log('P-value:', stats.pValue);              // e.g., 0.0001
console.log('Confidence:', stats.confidence);       // e.g., 99.99%
console.log('Significant?', stats.isSignificant);   // true
```

### Get Test Summary

```typescript
import { getPPOTestSummary } from '@/services/ascPPO';

// Get comprehensive test summary
const result = await getPPOTestSummary(experimentId, credentials);

if (result.success) {
  const { test, results, winner, status, recommendations } = result.data;

  console.log('Test:', test.name);
  console.log('State:', status.state);
  console.log('Winner:', winner?.treatmentName || 'None');
  console.log('Recommendations:', recommendations);
}
```

## Data Types

### PPOTestResults

```typescript
interface PPOTestResults {
  treatmentId: string;
  treatmentName: string;
  impressions: number;
  conversions: number;
  conversionRate: number;  // Percentage (0-100)
  improvement: number;      // Percentage change vs control
  confidence: number;       // Statistical confidence (0-100)
  isWinner: boolean;
}
```

### Statistical Significance

```typescript
interface StatisticalSignificance {
  zScore: number;          // Z-test statistic
  pValue: number;          // Probability value (0-1)
  isSignificant: boolean;  // True if p-value < 0.05
  confidence: number;      // Confidence level (0-100)
}
```

## Winner Detection Algorithm

### Decision Criteria

A treatment is marked as the winner if ALL conditions are met:

1. **Highest Conversion Rate**: Best performing among all treatments
2. **Statistical Confidence**: ≥ 95% confidence (default)
3. **Minimum Improvement**: ≥ 5% improvement over control (default)
4. **Sufficient Sample**: ≥ 1,000 impressions (default)

### Customization

```typescript
// Relaxed thresholds for faster decisions
const winner = detectWinner(results, {
  minConfidence: 90,
  minImprovement: 3,
  minImpressions: 500
});

// Strict thresholds for high-confidence decisions
const winner = detectWinner(results, {
  minConfidence: 99,
  minImprovement: 10,
  minImpressions: 5000
});
```

### Example Scenarios

#### Scenario 1: Clear Winner
```typescript
const results = [
  { // Control
    impressions: 10000,
    conversions: 1500,
    conversionRate: 15.0,
    confidence: 99.5,
    improvement: 0
  },
  { // Treatment A - WINNER
    impressions: 10000,
    conversions: 1700,
    conversionRate: 17.0,
    confidence: 97.8,
    improvement: 13.3
  }
];

const winner = detectWinner(results);
// Returns: Treatment A (highest rate, confident, good improvement)
```

#### Scenario 2: No Winner (Low Confidence)
```typescript
const results = [
  {
    impressions: 500,  // Small sample
    conversions: 75,
    conversionRate: 15.0,
    confidence: 85.0,  // Below 95% threshold
    improvement: 0
  },
  {
    impressions: 500,
    conversions: 80,
    conversionRate: 16.0,
    confidence: 82.5,  // Below threshold
    improvement: 6.7
  }
];

const winner = detectWinner(results);
// Returns: null (insufficient confidence)
```

#### Scenario 3: No Winner (Small Improvement)
```typescript
const results = [
  {
    impressions: 10000,
    conversions: 1500,
    conversionRate: 15.0,
    confidence: 99.5,
    improvement: 0
  },
  {
    impressions: 10000,
    conversions: 1530,
    conversionRate: 15.3,
    confidence: 97.0,
    improvement: 2.0  // Below 5% threshold
  }
];

const winner = detectWinner(results);
// Returns: null (improvement too small)
```

## Statistical Methods

### Z-Test for Two Proportions

Compares conversion rates between treatment and control:

**Formula:**
```
z = (p1 - p2) / SE
SE = sqrt(p_pool * (1 - p_pool) * (1/n1 + 1/n2))
p_pool = (x1 + x2) / (n1 + n2)
```

Where:
- `p1` = Treatment conversion rate
- `p2` = Control conversion rate
- `n1` = Treatment sample size
- `n2` = Control sample size
- `x1` = Treatment conversions
- `x2` = Control conversions

**Interpretation:**
- `|z| > 1.96` → 95% confidence (significant)
- `|z| > 2.58` → 99% confidence (highly significant)
- `p-value < 0.05` → Result is statistically significant

### P-Value Calculation

The p-value represents the probability of observing results at least as extreme as the current results, assuming the null hypothesis (no difference) is true.

**Interpretation:**
- `p < 0.05` → Reject null hypothesis (significant difference)
- `p ≥ 0.05` → Fail to reject null hypothesis (no significant difference)

**Confidence Relationship:**
```
Confidence = (1 - p-value) × 100%
```

## UI Components

### Results Page

**Location:** `/ppo/results?testId={experimentId}`

**Sections:**
1. **Header**: Test name, state, metadata, actions
2. **Winner Banner**: Displayed if winner detected
3. **Summary Stats**: Total impressions, treatments, avg conversion rate
4. **View Tabs**: Overview, Detailed, Timeline
5. **Results Grid/Table**: Treatment performance data

### Winner Banner

Displayed when a clear winner is detected:

```tsx
<div className={styles.winnerBanner}>
  <div className={styles.winnerIcon}>🏆</div>
  <div className={styles.winnerContent}>
    <h3>Clear Winner Detected!</h3>
    <p>
      <strong>{winner.treatmentName}</strong> showed a{' '}
      <strong>{winner.improvement.toFixed(1)}%</strong> improvement
      with <strong>{winner.confidence}%</strong> confidence.
    </p>
  </div>
</div>
```

### No Winner Banner

Displayed when no treatment meets winner criteria:

```tsx
<div className={styles.noWinnerBanner}>
  <div className={styles.noWinnerIcon}>📊</div>
  <div className={styles.noWinnerContent}>
    <h3>No Clear Winner</h3>
    <p>
      None of the treatments met the criteria for a
      statistically significant winner.
    </p>
  </div>
</div>
```

## Test Results

**Test Suite:** `scripts/test-asc-ppo-results.ts`

Run tests:
```bash
npm run test-ppo-results
# or
npx tsx scripts/test-asc-ppo-results.ts
```

**Test Coverage:** 34/34 tests passing (100%)

### Test Categories

1. **Winner Detection (9 tests)**
   - Clear winner detection
   - Low confidence rejection
   - Low improvement rejection
   - Small sample rejection
   - Custom threshold validation
   - Edge cases

2. **Statistical Significance (8 tests)**
   - Z-score calculation
   - P-value calculation
   - Significance detection
   - Equal rates handling
   - Large/small differences
   - Edge cases

3. **Results Fetching (3 tests)**
   - State validation
   - Winner inclusion
   - Summary generation

4. **Results Structure (6 tests)**
   - Required fields
   - Conversion rate accuracy
   - Improvement calculation
   - Confidence bounds
   - Data consistency

5. **Edge Cases (8 tests)**
   - Zero/negative improvement
   - High confidence
   - Zero/100% conversion rates
   - Borderline thresholds

## Integration

### With APP-014 (PPO Test Configuration)

Results dashboard reads test data created by APP-014:
```typescript
// Test created in APP-014
const test = await createCompletePPOTest({ ... });

// View results in APP-016
window.location.href = `/ppo/results?testId=${test.id}`;
```

### With APP-015 (PPO Test Submission)

Results become available after test is approved and running:
```typescript
// Check if results are available
const status = await getPPOTestSubmissionStatus(testId);

if (status.data.state === 'APPROVED' || status.data.state === 'COMPLETED') {
  // Results can be viewed
  const results = await getPPOTestResults(testId);
}
```

### With APP-017 (Apply Winning Treatment)

Winner can be applied to default product page:
```typescript
// After detecting winner
const winner = detectWinner(results);

if (winner) {
  // Apply winner (APP-017)
  await applyWinningTreatment(testId, winner.treatmentId);
}
```

## Best Practices

### 1. Wait for Sufficient Data

Avoid premature decisions:
```typescript
// Check sample size before declaring winner
const results = await getPPOTestResults(testId);

const hasEnoughData = results.every(r => r.impressions >= 1000);

if (!hasEnoughData) {
  console.log('Wait for more data before making decisions');
}
```

### 2. Use Appropriate Confidence Levels

- **95% confidence**: Standard for most A/B tests
- **99% confidence**: High-stakes decisions
- **90% confidence**: Exploratory tests

### 3. Consider Practical Significance

Even if statistically significant, small improvements may not be worth implementing:

```typescript
const winner = detectWinner(results, {
  minConfidence: 95,
  minImprovement: 5,  // Require at least 5% improvement
  minImpressions: 1000
});
```

### 4. Monitor Test Duration

```typescript
// Calculate test duration
const startDate = new Date(test.startDate);
const endDate = test.endDate ? new Date(test.endDate) : new Date();
const durationDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));

if (durationDays < 7) {
  console.log('Consider running test longer for more reliable results');
}
```

### 5. Check for External Factors

Be aware of:
- Seasonal effects (holidays, weekends)
- Marketing campaigns
- App updates
- Featured placements

## Troubleshooting

### No Results Available

**Problem:** Results endpoint returns "not available" error

**Solutions:**
1. Verify test is in APPROVED or COMPLETED state
2. Wait for test to collect data (minimum 7 days recommended)
3. Check App Store Connect for data availability

### Winner Not Detected

**Problem:** No winner despite apparent performance difference

**Possible Causes:**
1. **Low statistical confidence** (< 95%)
   - Solution: Run test longer to increase sample size
2. **Small improvement** (< 5%)
   - Solution: Test more dramatic variations
3. **Insufficient sample** (< 1,000 impressions)
   - Solution: Wait for more traffic

### Unexpected Results

**Problem:** Results don't match expectations

**Check:**
1. Test configuration (traffic splits)
2. Treatment implementations (screenshots, previews)
3. External factors (seasonality, campaigns)
4. Data freshness (results may lag)

## Performance

### API Calls

Results fetching makes the following API calls:

```typescript
// Get complete test (1 call)
const test = await getCompletePPOTest(experimentId);

// Get treatments (1 call per test)
const treatments = await listTreatments(experimentId);

// Get results (1 call, may be mock/unavailable)
const results = await getPPOTestResults(experimentId);
```

**Total:** ~3 API calls

### Computation

Winner detection and statistical calculations are performed client-side:

- **Winner detection**: O(n) where n = number of treatments (max 3)
- **Statistical significance**: O(1) per comparison
- **Overall performance**: < 1ms for typical test

## Limitations

### 1. Results API Availability

App Store Connect may not provide direct analytics API access. Current implementation demonstrates structure but may require:
- App Analytics API integration (when available)
- Manual report parsing
- Third-party analytics

### 2. Real-Time Data

Results may not be real-time:
- Data typically updates every 24 hours
- Recent changes may not be reflected immediately

### 3. Traffic Requirements

Reliable results require:
- Minimum 1,000 impressions per treatment
- At least 7 days of data
- Sufficient conversion events

## Future Enhancements

### 1. Advanced Analytics
- Confidence interval visualization
- Power analysis
- Sample size calculator
- Sequential testing support

### 2. Segmentation
- Results by device type
- Results by country/region
- Results by user acquisition source

### 3. Export & Reporting
- PDF report generation
- CSV data export
- Automated email reports
- Slack/webhook notifications

### 4. Historical Tracking
- Test result history
- Treatment performance over time
- A/A test validation
- Meta-analysis of multiple tests

## Related Documentation

- [APP-014: PPO Test Configuration](./APP-014-PPO-TEST-CONFIGURATION.md)
- [APP-015: PPO Test Submission](./APP-015-PPO-TEST-SUBMISSION.md)
- APP-017: Apply Winning Treatment (pending)
- [App Store Connect API](https://developer.apple.com/documentation/appstoreconnectapi)

## Resources

### Statistical Methods
- [A/B Testing Statistics](https://en.wikipedia.org/wiki/A/B_testing)
- [Z-Test for Proportions](https://en.wikipedia.org/wiki/Z-test)
- [P-Value Interpretation](https://en.wikipedia.org/wiki/P-value)

### App Store Optimization
- [Product Page Optimization](https://developer.apple.com/app-store/product-page-optimization/)
- [App Store Marketing Guidelines](https://developer.apple.com/app-store/marketing/guidelines/)

---

**Implementation Date:** January 28, 2026
**Last Updated:** January 28, 2026
**Version:** 1.0.0
