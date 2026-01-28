# APP-014: PPO Test Configuration

## Overview

Complete system for creating and managing Product Page Optimization (PPO) tests in App Store Connect. PPO tests allow you to A/B test different versions of your App Store product page to optimize conversion rates.

## Features

- **PPO Test Management**: Create, read, update, delete PPO experiments
- **Treatment Configuration**: Manage up to 3 treatment variants per test
- **Localization Support**: Add localized treatments for different markets
- **Traffic Distribution**: Configure traffic split between control and treatments
- **High-Level Operations**: Simplified APIs for common workflows
- **Type Safety**: Full TypeScript types for all operations
- **React UI**: Visual interface for managing PPO tests
- **Test Suite**: Comprehensive test coverage

## Quick Start

### 1. Prerequisites

Ensure you have App Store Connect API credentials configured:

```bash
npm run asc-creds add
```

### 2. Create a PPO Test (CLI)

```typescript
import { createCompletePPOTest } from '@/services/ascPPO';

const result = await createCompletePPOTest({
  appId: 'your-app-id',
  appStoreVersionId: 'version-id',
  name: 'Holiday Screenshot Test 2026',
  trafficProportion: 0.5, // 50% to control
  treatments: [
    {
      name: 'Treatment A - Hero Shot',
      trafficProportion: 0.25, // 25% traffic
      locales: ['en-US', 'en-GB'],
    },
    {
      name: 'Treatment B - Feature Grid',
      trafficProportion: 0.25, // 25% traffic
      locales: ['en-US', 'en-GB'],
    },
  ],
});

if (result.success) {
  console.log('Experiment ID:', result.experiment?.id);
  console.log('Treatments:', result.treatments?.length);
} else {
  console.error('Error:', result.error);
}
```

### 3. Use the Web UI

Navigate to `/ppo` in your browser to access the visual interface.

### 4. Run Tests

```bash
npm run test:asc-ppo
```

## API Reference

### PPO Experiment Operations

#### `createPPOTest(options, credentials?)`

Create a new PPO experiment.

```typescript
import { createPPOTest } from '@/services/ascPPO';

const experiment = await createPPOTest({
  appId: 'app-id',
  appStoreVersionId: 'version-id',
  name: 'My PPO Test',
  trafficProportion: 0.5,
  platform: 'IOS',
});

console.log('Created experiment:', experiment.id);
console.log('State:', experiment.attributes?.state);
```

**Parameters:**
- `options.appId`: App ID to create the test for
- `options.appStoreVersionId`: Control version (current product page)
- `options.name`: Name of the PPO test
- `options.trafficProportion`: Traffic for control (0.0 to 1.0, default: 0.5)
- `options.platform`: Platform (IOS, MAC_OS, TV_OS, VISION_OS)
- `credentials`: Optional ASC credentials

**Returns:** `AppStoreVersionExperiment`

#### `getPPOTest(experimentId, credentials?)`

Get a PPO experiment by ID.

```typescript
const experiment = await getPPOTest('experiment-id');
```

#### `listPPOTests(options, credentials?)`

List PPO experiments.

```typescript
const experiments = await listPPOTests({
  appId: 'app-id',
  state: 'RUNNING',
  limit: 10,
});
```

#### `updatePPOTest(experimentId, updates, credentials?)`

Update a PPO experiment.

```typescript
const updated = await updatePPOTest('experiment-id', {
  name: 'Updated Test Name',
  trafficProportion: 0.6,
});
```

#### `deletePPOTest(experimentId, credentials?)`

Delete a PPO experiment.

```typescript
await deletePPOTest('experiment-id');
```

### Treatment Operations

#### `createTreatment(options, credentials?)`

Create a treatment for a PPO test.

```typescript
import { createTreatment } from '@/services/ascPPO';

const treatment = await createTreatment({
  experimentId: 'experiment-id',
  name: 'Treatment A',
  trafficProportion: 0.25,
});

console.log('Created treatment:', treatment.id);
```

**Parameters:**
- `options.experimentId`: PPO experiment ID
- `options.name`: Name of the treatment
- `options.trafficProportion`: Traffic for this treatment (0.0 to 1.0)
- `credentials`: Optional ASC credentials

**Returns:** `AppStoreVersionExperimentTreatment`

#### `getTreatment(treatmentId, credentials?)`

Get a treatment by ID.

```typescript
const treatment = await getTreatment('treatment-id');
```

#### `listTreatments(experimentId, credentials?)`

List treatments for a PPO experiment.

```typescript
const treatments = await listTreatments('experiment-id');
```

#### `updateTreatment(treatmentId, updates, credentials?)`

Update a treatment.

```typescript
const updated = await updateTreatment('treatment-id', {
  name: 'Updated Treatment Name',
  trafficProportion: 0.3,
});
```

#### `deleteTreatment(treatmentId, credentials?)`

Delete a treatment.

```typescript
await deleteTreatment('treatment-id');
```

### Treatment Localization Operations

#### `createTreatmentLocalization(options, credentials?)`

Create a localization for a treatment.

```typescript
import { createTreatmentLocalization } from '@/services/ascPPO';

const localization = await createTreatmentLocalization({
  treatmentId: 'treatment-id',
  locale: 'en-US',
});

console.log('Created localization:', localization.id);
```

**Parameters:**
- `options.treatmentId`: Treatment ID
- `options.locale`: Locale code (e.g., en-US, fr-FR)
- `credentials`: Optional ASC credentials

**Returns:** `AppStoreVersionExperimentTreatmentLocalization`

#### `getTreatmentLocalization(localizationId, credentials?)`

Get a treatment localization by ID.

```typescript
const localization = await getTreatmentLocalization('localization-id');
```

#### `listTreatmentLocalizations(treatmentId, credentials?)`

List localizations for a treatment.

```typescript
const localizations = await listTreatmentLocalizations('treatment-id');
```

#### `deleteTreatmentLocalization(localizationId, credentials?)`

Delete a treatment localization.

```typescript
await deleteTreatmentLocalization('localization-id');
```

### High-Level Helper Functions

#### `createCompletePPOTest(options, credentials?)`

Create a complete PPO test with treatments and localizations in one call.

```typescript
import { createCompletePPOTest } from '@/services/ascPPO';

const result = await createCompletePPOTest({
  appId: 'app-id',
  appStoreVersionId: 'version-id',
  name: 'Complete Test',
  trafficProportion: 0.5,
  treatments: [
    {
      name: 'Treatment A',
      trafficProportion: 0.25,
      locales: ['en-US', 'fr-FR'],
    },
    {
      name: 'Treatment B',
      trafficProportion: 0.25,
      locales: ['en-US', 'fr-FR', 'de-DE'],
    },
  ],
});
```

**Parameters:**
- `options.appId`: App ID
- `options.appStoreVersionId`: Control version ID
- `options.name`: Test name
- `options.trafficProportion`: Control traffic (default: 0.5)
- `options.treatments`: Array of treatment configurations
  - `name`: Treatment name
  - `trafficProportion`: Traffic for this treatment (default: 0.25)
  - `locales`: Array of locale codes
- `credentials`: Optional ASC credentials

**Returns:** `CompletePPOTestResult`

```typescript
interface CompletePPOTestResult {
  success: boolean;
  experiment?: AppStoreVersionExperiment;
  treatments?: AppStoreVersionExperimentTreatment[];
  error?: string;
}
```

#### `getCompletePPOTest(experimentId, credentials?)`

Get complete PPO test info with all treatments and localizations.

```typescript
const result = await getCompletePPOTest('experiment-id');

if (result.success && result.data) {
  console.log('Test:', result.data.name);
  console.log('State:', result.data.state);
  console.log('Treatments:', result.data.treatments.length);

  for (const treatment of result.data.treatments) {
    console.log(`  ${treatment.name}:`, treatment.localizations.length, 'locales');
  }
}
```

**Returns:** `PPOOperationResult<PPOTestInfo>`

#### `listPPOTestsForApp(appId, credentials?)`

List all PPO tests for an app with simplified info.

```typescript
const result = await listPPOTestsForApp('app-id');

if (result.success && result.data) {
  for (const test of result.data) {
    console.log(`${test.name} (${test.state})`);
  }
}
```

**Returns:** `PPOOperationResult<PPOTestInfo[]>`

#### `startPPOTest(experimentId, credentials?)`

Start a PPO test (submit for review).

```typescript
const result = await startPPOTest('experiment-id');
```

**Returns:** `PPOOperationResult<AppStoreVersionExperiment>`

#### `stopPPOTest(experimentId, credentials?)`

Stop a PPO test.

```typescript
const result = await stopPPOTest('experiment-id');
```

**Returns:** `PPOOperationResult<void>`

## Data Types

### PPO Test States

```typescript
type PPOTestState =
  | 'PREPARE_FOR_SUBMISSION'   // Initial state, can edit
  | 'READY_FOR_SUBMISSION'     // Ready to submit
  | 'WAITING_FOR_REVIEW'       // Submitted, waiting
  | 'IN_REVIEW'                // Being reviewed
  | 'ACCEPTED'                 // Accepted by Apple
  | 'APPROVED'                 // Approved and running
  | 'REPLACED_WITH_NEW_VERSION' // Superseded
  | 'REJECTED'                 // Rejected by Apple
  | 'STOPPED'                  // Manually stopped
  | 'COMPLETED';               // Test completed
```

### Treatment States

```typescript
type TreatmentState =
  | 'PREPARE_FOR_SUBMISSION'
  | 'READY_FOR_SUBMISSION'
  | 'WAITING_FOR_REVIEW'
  | 'IN_REVIEW'
  | 'ACCEPTED'
  | 'APPROVED'
  | 'REPLACED_WITH_NEW_VERSION'
  | 'REJECTED';
```

### Platforms

```typescript
type PPOPlatform = 'IOS' | 'MAC_OS' | 'TV_OS' | 'VISION_OS';
```

### Traffic Proportion

```typescript
type TrafficProportion = number; // 0.0 to 1.0
```

Traffic proportions must add up to 1.0:
- Control: 0.5 (50%)
- Treatment A: 0.25 (25%)
- Treatment B: 0.25 (25%)
- Total: 1.0 (100%)

### Simplified Info Types

```typescript
interface PPOTestInfo {
  id: string;
  appId: string;
  appStoreVersionId: string;
  name: string;
  state: PPOTestState;
  trafficProportion: TrafficProportion;
  platform?: PPOPlatform;
  startDate?: string;
  endDate?: string;
  treatments: TreatmentInfo[];
  results?: PPOTestResults[];
}

interface TreatmentInfo {
  id: string;
  experimentId: string;
  name: string;
  state: TreatmentState;
  trafficProportion: TrafficProportion;
  promotedDate?: string;
  localizations: TreatmentLocalizationInfo[];
}

interface TreatmentLocalizationInfo {
  id: string;
  treatmentId: string;
  locale: string;
  screenshotSetIds: string[];
  previewSetIds: string[];
}
```

## Web UI Features

### PPO Tests Page (`/ppo`)

The web interface provides:

1. **Test List View**
   - View all PPO tests for your apps
   - Filter by app and state
   - View test status and results
   - Quick actions (view details, results)

2. **Create Test Tab**
   - Select app and control version
   - Configure test name
   - Set traffic distribution (control vs treatments)
   - Add 1-3 treatments
   - Configure treatment names and traffic
   - Select locales for each treatment
   - Visual traffic validation

3. **Test Card Features**
   - State badges (RUNNING, COMPLETED, etc.)
   - App name and metadata
   - Treatment count
   - Start/end dates
   - Winner indication (for completed tests)

## Testing

### Run Test Suite

```bash
npm run test:asc-ppo
```

### Test Coverage

The test suite includes 21 tests covering:

1. **Type Validation**
   - Mock experiment structure
   - Mock treatment structure
   - Mock localization structure

2. **Conversion Functions**
   - toPPOTestInfo conversion
   - toTreatmentInfo conversion
   - toTreatmentLocalizationInfo conversion

3. **Traffic Proportions**
   - Valid decimal values (0.0 to 1.0)
   - Sum validation (must equal 1.0)

4. **State Validation**
   - All experiment states recognized
   - All treatment states recognized

5. **Platform Validation**
   - All valid platforms (IOS, MAC_OS, TV_OS, VISION_OS)

6. **Locale Validation**
   - Common locales (en-US, fr-FR, de-DE, etc.)

7. **Relationship Validation**
   - Experiment relationships
   - Treatment relationships
   - Localization relationships

8. **Data Consistency**
   - Multiple experiments coexist
   - Multiple treatments coexist
   - Multiple localizations coexist

9. **Edge Cases**
   - Empty treatment lists
   - Maximum traffic proportion (1.0)
   - Minimum traffic proportion (0.0)

## Workflow Example

### Complete PPO Test Workflow

```typescript
import {
  createCompletePPOTest,
  getCompletePPOTest,
  startPPOTest,
  stopPPOTest,
} from '@/services/ascPPO';

async function runPPOTest() {
  // 1. Create test with treatments
  const createResult = await createCompletePPOTest({
    appId: 'app-123',
    appStoreVersionId: 'version-456',
    name: 'Q1 2026 Screenshot Test',
    trafficProportion: 0.5,
    treatments: [
      {
        name: 'Treatment A - Lifestyle',
        trafficProportion: 0.25,
        locales: ['en-US', 'en-GB', 'en-CA'],
      },
      {
        name: 'Treatment B - Features',
        trafficProportion: 0.25,
        locales: ['en-US', 'en-GB', 'en-CA'],
      },
    ],
  });

  if (!createResult.success || !createResult.experiment) {
    console.error('Failed to create test:', createResult.error);
    return;
  }

  const experimentId = createResult.experiment.id;
  console.log('Created experiment:', experimentId);

  // 2. Upload treatment screenshots (use APP-008)
  // ... upload screenshots for each treatment localization ...

  // 3. Get complete test info
  const getResult = await getCompletePPOTest(experimentId);
  if (getResult.success && getResult.data) {
    console.log('Test:', getResult.data.name);
    console.log('Treatments:', getResult.data.treatments.length);
  }

  // 4. Start test (submit for review)
  const startResult = await startPPOTest(experimentId);
  if (startResult.success) {
    console.log('Test started, waiting for review');
  }

  // 5. Monitor test status
  // ... check status periodically ...

  // 6. When completed, check results
  // ... view results in App Store Connect ...

  // 7. Apply winning treatment or stop test
  // const stopResult = await stopPPOTest(experimentId);
}
```

## Integration

### With Other Features

- **APP-006 (App Store Connect OAuth)**: Required for authentication
- **APP-007 (App List Fetcher)**: Select apps for PPO tests
- **APP-008 (Screenshot Upload API)**: Upload treatment screenshots
- **APP-009 (App Preview Upload API)**: Upload treatment previews
- **APP-010 (Custom Product Page Creator)**: Can be used as treatment basis

### API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/appStoreVersionExperiments` | POST | Create experiment |
| `/v1/appStoreVersionExperiments/{id}` | GET | Get experiment |
| `/v1/appStoreVersionExperiments` | GET | List experiments |
| `/v1/appStoreVersionExperiments/{id}` | PATCH | Update experiment |
| `/v1/appStoreVersionExperiments/{id}` | DELETE | Delete experiment |
| `/v1/appStoreVersionExperimentTreatments` | POST | Create treatment |
| `/v1/appStoreVersionExperimentTreatments/{id}` | GET | Get treatment |
| `/v1/appStoreVersionExperiments/{id}/appStoreVersionExperimentTreatments` | GET | List treatments |
| `/v1/appStoreVersionExperimentTreatments/{id}` | PATCH | Update treatment |
| `/v1/appStoreVersionExperimentTreatments/{id}` | DELETE | Delete treatment |
| `/v1/appStoreVersionExperimentTreatmentLocalizations` | POST | Create localization |
| `/v1/appStoreVersionExperimentTreatmentLocalizations/{id}` | GET | Get localization |
| `/v1/appStoreVersionExperimentTreatments/{id}/appStoreVersionExperimentTreatmentLocalizations` | GET | List localizations |
| `/v1/appStoreVersionExperimentTreatmentLocalizations/{id}` | DELETE | Delete localization |

## Best Practices

### 1. Traffic Distribution

- **Control**: Allocate at least 50% to control for statistical significance
- **Treatments**: Split remaining traffic evenly (e.g., 25% each for 2 treatments)
- **Maximum**: Test up to 3 treatments simultaneously
- **Validation**: Always ensure traffic sums to 100%

### 2. Test Duration

- **Minimum**: Run tests for at least 2 weeks for significance
- **Typical**: 2-4 weeks for most tests
- **Maximum**: Apple may limit test duration

### 3. Treatment Design

- **Single Variable**: Change one thing at a time (screenshots OR icon, not both)
- **Clear Hypothesis**: Know what you're testing and why
- **Meaningful Difference**: Make changes significant enough to measure

### 4. Localization

- **Consistent**: Use same locales across all treatments
- **Relevant**: Only include locales with sufficient traffic
- **Translations**: Ensure screenshots are properly localized

### 5. Screenshot Requirements

- **Quality**: High-quality images that meet App Store requirements
- **Consistency**: Same dimensions and count across treatments
- **Relevance**: Screenshots should match the treatment hypothesis

## Limitations

### Apple Restrictions

- **Concurrent Tests**: Only 1 PPO test per app at a time
- **Treatment Count**: Maximum 3 treatments per test
- **Duration**: Tests may have maximum duration limits
- **Minimum Traffic**: Each variant needs minimum traffic for significance

### API Limitations

- **Rate Limits**: App Store Connect API rate limits apply
- **States**: Some state transitions are restricted
- **Deletion**: Cannot delete tests in certain states
- **Modification**: Limited editing once submitted

## Troubleshooting

### Common Issues

**1. Traffic doesn't add up to 100%**
```typescript
// Ensure proportions sum to 1.0
const control = 0.5;
const treatmentA = 0.25;
const treatmentB = 0.25;
console.log(control + treatmentA + treatmentB); // Should be 1.0
```

**2. Cannot create treatment**
- Verify experiment is in PREPARE_FOR_SUBMISSION state
- Check you haven't exceeded 3 treatments limit
- Ensure traffic proportions are valid

**3. Cannot start test**
- Verify all treatments have screenshots uploaded
- Check all required localizations are complete
- Ensure test is in READY_FOR_SUBMISSION state

**4. Test not showing results**
- Wait for sufficient data collection (minimum 2 weeks)
- Check test has APPROVED or COMPLETED state
- Verify App Store Connect for results

## Performance

- **Test Creation**: ~2-5 seconds for complete test with 3 treatments
- **Single Operation**: ~100-500ms per API request
- **Batch Operations**: Sequential, ~2-5 seconds per treatment
- **UI Render**: <100ms for test list display

## Files Created

```
src/
  types/
    ascPPO.ts                    # Type definitions (280 lines)
  services/
    ascPPO.ts                    # Service implementation (680 lines)
  app/
    ppo/
      page.tsx                   # UI page (290 lines)
      ppo.module.css             # Styles (540 lines)
scripts/
  test-asc-ppo.ts               # Test suite (650 lines)
docs/
  APP-014-PPO-TEST-CONFIGURATION.md  # This documentation
```

**Total:** ~2,440 lines of code

## Next Steps

### APP-015: PPO Test Submission
- Submit tests for review via API
- Handle review status updates
- Manage test lifecycle

### APP-016: PPO Results Dashboard
- Fetch test results from API
- Display conversion metrics
- Identify winning treatments
- Statistical significance visualization

### APP-017: Apply Winning Treatment
- One-click apply winner to default page
- Backup current product page
- Deploy winning treatment

---

Last Updated: Session 49 - January 28, 2026
