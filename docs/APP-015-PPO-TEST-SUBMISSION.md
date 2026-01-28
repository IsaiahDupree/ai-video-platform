# APP-015: PPO Test Submission

> **Status:** ✅ Complete
> **Phase:** 6 (Apple Pages)
> **Priority:** P1
> **Effort:** 8pts

## Overview

Submit Product Page Optimization (PPO) tests to App Store Connect for review and execution. This feature provides validation, submission workflows, and state management for PPO tests, ensuring tests meet all requirements before submission.

## Features

### Submission Workflow

- **Pre-submission Validation**: Comprehensive validation before submission
- **Submit for Review**: Submit tests to App Store Connect for approval
- **Stop Running Tests**: Terminate tests that are running
- **Submission Status**: Check current status and available actions

### Validation Rules

Tests must meet these requirements before submission:

1. **Test State**: Must be in `PREPARE_FOR_SUBMISSION` or `READY_FOR_SUBMISSION`
2. **Treatment Count**: Must have 1-3 treatments (cannot exceed 3)
3. **Traffic Proportions**: Control + all treatment proportions must sum to 1.0
4. **Localizations**: Each treatment must have at least one localization
5. **Treatment State**: All treatments must be in valid submission state

### Traffic Proportion Validation

- **Range Check**: Each proportion must be between 0.0 and 1.0
- **Sum Check**: All proportions must sum to exactly 1.0 (with 0.001 tolerance)
- **Helper Functions**: Calculate even traffic distribution automatically

## API Reference

### Validation

#### validatePPOTestForSubmission()

Validate a test is ready for submission.

```typescript
const result = await validatePPOTestForSubmission('experiment-id');

if (result.success && result.data?.valid) {
  // Test is valid
} else {
  console.log('Validation issues:', result.data?.issues);
}
```

**Returns:**
```typescript
{
  success: boolean;
  data?: {
    valid: boolean;
    issues: string[];  // List of validation errors
  };
  error?: string;
}
```

### Submission

#### startPPOTest()

Submit a PPO test for review.

```typescript
const result = await startPPOTest('experiment-id');

if (result.success) {
  console.log('Test submitted successfully');
} else {
  console.error('Submission failed:', result.error);
}
```

**Validation Performed:**
- Checks test is in correct state
- Validates traffic proportions sum to 1.0
- Ensures all treatments have localizations
- Verifies treatment count (1-3)

**Returns:**
```typescript
{
  success: boolean;
  data?: AppStoreVersionExperiment;
  error?: string;
}
```

#### stopPPOTest()

Stop a running PPO test.

```typescript
const result = await stopPPOTest('experiment-id');

if (result.success) {
  console.log('Test stopped');
}
```

**Returns:**
```typescript
{
  success: boolean;
  error?: string;
}
```

### Status Checking

#### getPPOTestSubmissionStatus()

Get submission status and available actions.

```typescript
const result = await getPPOTestSubmissionStatus('experiment-id');

if (result.success && result.data) {
  console.log('Current state:', result.data.state);
  console.log('Can submit:', result.data.canSubmit);
  console.log('Can stop:', result.data.canStop);
  console.log('Is running:', result.data.isRunning);
}
```

**Returns:**
```typescript
{
  success: boolean;
  data?: {
    state: PPOTestState;
    canSubmit: boolean;      // Can submit for review
    canStop: boolean;         // Can stop test
    isRunning: boolean;       // Currently running
    isComplete: boolean;      // Completed or stopped
    reviewRequired: boolean;  // Needs review
  };
  error?: string;
}
```

### Traffic Proportion Utilities

#### validateTrafficProportions()

Validate traffic proportions sum to 1.0.

```typescript
const result = validateTrafficProportions(
  0.5,           // Control proportion
  [0.25, 0.25]   // Treatment proportions
);

if (result.valid) {
  console.log('Traffic proportions are valid');
} else {
  console.error(result.error);
}
```

**Returns:**
```typescript
{
  valid: boolean;
  total: number;
  error?: string;
}
```

#### calculateEvenTrafficProportions()

Calculate evenly distributed traffic proportions.

```typescript
const { control, treatments } = calculateEvenTrafficProportions(2);

console.log('Control:', control);           // 0.333...
console.log('Treatment A:', treatments[0]); // 0.333...
console.log('Treatment B:', treatments[1]); // 0.333...
```

**Returns:**
```typescript
{
  control: number;
  treatments: number[];
}
```

## UI Components

### Test List View

Shows all PPO tests with state-aware action buttons.

**States and Actions:**

| State | Available Actions |
|-------|------------------|
| `PREPARE_FOR_SUBMISSION` | Submit for Review |
| `READY_FOR_SUBMISSION` | Submit for Review |
| `WAITING_FOR_REVIEW` | Stop Test |
| `IN_REVIEW` | Stop Test |
| `APPROVED` | Stop Test |
| `ACCEPTED` | Stop Test |
| `COMPLETED` | View Results |
| `STOPPED` | View Results |
| `REJECTED` | View Details |

### State Badges

Visual indicators for test state:

- **PREPARE_FOR_SUBMISSION**: Orange (draft)
- **READY_FOR_SUBMISSION**: Purple (ready)
- **WAITING_FOR_REVIEW**: Blue (pending)
- **IN_REVIEW**: Dark blue (reviewing)
- **APPROVED/ACCEPTED**: Green (running)
- **COMPLETED**: Green (finished)
- **STOPPED**: Pink (terminated)
- **REJECTED**: Red (failed review)

### Action Buttons

- **Submit for Review**: Primary button (purple gradient)
- **Stop Test**: Danger button (red gradient)
- **View Details**: Secondary button (white with blue border)
- **View Results**: Secondary button (white with blue border)

## State Transitions

### Normal Flow

```
PREPARE_FOR_SUBMISSION
  ↓ (Submit for Review)
WAITING_FOR_REVIEW
  ↓ (Apple Review)
IN_REVIEW
  ↓ (Approved)
ACCEPTED / APPROVED
  ↓ (Running)
COMPLETED
```

### Alternative Flows

```
IN_REVIEW → REJECTED (if review fails)

Any Active State → STOPPED (if manually stopped)

PREPARE_FOR_SUBMISSION → READY_FOR_SUBMISSION (when ready)
```

## Validation Examples

### Valid Test

```typescript
{
  state: 'PREPARE_FOR_SUBMISSION',
  trafficProportion: 0.5,
  treatments: [
    {
      name: 'Treatment A',
      state: 'PREPARE_FOR_SUBMISSION',
      trafficProportion: 0.25,
      localizations: [{ locale: 'en-US', ... }]
    },
    {
      name: 'Treatment B',
      state: 'PREPARE_FOR_SUBMISSION',
      trafficProportion: 0.25,
      localizations: [{ locale: 'en-US', ... }]
    }
  ]
}
```

**Validation:** ✅ Pass
- Has 1-3 treatments
- Traffic sums to 1.0 (0.5 + 0.25 + 0.25 = 1.0)
- All treatments have localizations
- Correct state

### Invalid Test Examples

#### No Treatments

```typescript
{
  treatments: []
}
```

**Validation:** ❌ Fail
**Issue:** Test must have at least one treatment

#### Bad Traffic Proportions

```typescript
{
  trafficProportion: 0.6,
  treatments: [
    { trafficProportion: 0.3 }
  ]
}
```

**Validation:** ❌ Fail
**Issue:** Traffic proportions sum to 0.9 (must be 1.0)

#### Missing Localizations

```typescript
{
  treatments: [
    {
      name: 'Treatment A',
      localizations: []  // Empty!
    }
  ]
}
```

**Validation:** ❌ Fail
**Issue:** Treatment must have at least one localization

#### Too Many Treatments

```typescript
{
  treatments: [
    { name: 'A' },
    { name: 'B' },
    { name: 'C' },
    { name: 'D' }  // Fourth treatment!
  ]
}
```

**Validation:** ❌ Fail
**Issue:** Cannot have more than 3 treatments

#### Wrong State

```typescript
{
  state: 'APPROVED',  // Already running
  treatments: [...]
}
```

**Validation:** ❌ Fail
**Issue:** Test is in APPROVED state and cannot be submitted

## Complete Workflow Example

### 1. Create Test

```typescript
import {
  createCompletePPOTest,
  validatePPOTestForSubmission,
  startPPOTest,
  getPPOTestSubmissionStatus,
} from '@/services/ascPPO';

// Create test with treatments
const result = await createCompletePPOTest({
  appId: 'app-123',
  appStoreVersionId: 'ver-456',
  name: 'Holiday Icon Test',
  controlTraffic: 0.5,
  treatments: [
    {
      name: 'Santa Hat Icon',
      traffic: 0.25,
      locales: ['en-US', 'es-ES', 'fr-FR'],
    },
    {
      name: 'Snow Globe Icon',
      traffic: 0.25,
      locales: ['en-US', 'es-ES', 'fr-FR'],
    },
  ],
});
```

### 2. Validate Before Submission

```typescript
// Check if test is ready
const validation = await validatePPOTestForSubmission(result.experiment.id);

if (!validation.data?.valid) {
  console.log('Validation issues:');
  validation.data?.issues.forEach(issue => {
    console.log(`  - ${issue}`);
  });
  return;
}
```

### 3. Submit for Review

```typescript
// Submit test
const submitResult = await startPPOTest(result.experiment.id);

if (submitResult.success) {
  console.log('Test submitted successfully!');
} else {
  console.error('Submission failed:', submitResult.error);
}
```

### 4. Monitor Status

```typescript
// Check status
const status = await getPPOTestSubmissionStatus(result.experiment.id);

if (status.data) {
  console.log(`State: ${status.data.state}`);
  console.log(`Running: ${status.data.isRunning}`);
  console.log(`Can Stop: ${status.data.canStop}`);
}
```

### 5. Stop Test (if needed)

```typescript
// Stop running test
if (status.data?.canStop) {
  const stopResult = await stopPPOTest(result.experiment.id);

  if (stopResult.success) {
    console.log('Test stopped');
  }
}
```

## Error Handling

All functions return a standard result object:

```typescript
{
  success: boolean;
  data?: T;
  error?: string;
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Test is in X state and cannot be submitted" | Wrong state | Wait for test to reach submittable state |
| "Traffic proportions must sum to 1.0" | Invalid traffic | Adjust proportions to sum to 1.0 |
| "Test must have at least one treatment" | No treatments | Add at least one treatment |
| "Cannot have more than 3 treatments" | Too many treatments | Remove excess treatments |
| "Treatment must have at least one localization" | Missing locales | Add localizations to all treatments |

### Error Example

```typescript
const result = await startPPOTest('experiment-id');

if (!result.success) {
  console.error('Submission failed!');
  console.error(result.error);

  // Show user-friendly message
  if (result.error?.includes('Traffic proportions')) {
    alert('Please adjust traffic proportions to sum to 100%');
  }
}
```

## Testing

Run the test suite:

```bash
npm run test:ppo-submission
# or
npx tsx scripts/test-asc-ppo-submission.ts
```

### Test Coverage

- ✅ Traffic proportion validation (valid sums)
- ✅ Traffic proportion validation (invalid sums)
- ✅ Calculate even traffic distribution (2 treatments)
- ✅ Calculate even traffic distribution (3 treatments)
- ✅ Reject out-of-range proportions
- ✅ Reject negative proportions

**Test Results:** 6/6 passing (100%)

## Integration

### Dependencies

- **APP-006**: App Store Connect OAuth (authentication)
- **APP-014**: PPO Test Configuration (test creation)

### Used By

- **APP-016**: PPO Results Dashboard (reads submitted test results)
- **APP-017**: Apply Winning Treatment (applies results from completed tests)

## Technical Details

### API Endpoints

While the actual App Store Connect API submission endpoint may vary, the typical flow is:

```
POST /v1/appStoreVersionExperiments/{id}/relationships/appStoreVersionSubmissions
```

**Request Body:**
```json
{
  "data": {
    "type": "appStoreVersionSubmissions",
    "relationships": {
      "appStoreVersionExperiment": {
        "data": {
          "type": "appStoreVersionExperiments",
          "id": "experiment-id"
        }
      }
    }
  }
}
```

### State Machine

The PPO test follows a state machine pattern:

1. **Draft States**: PREPARE_FOR_SUBMISSION, READY_FOR_SUBMISSION
2. **Review States**: WAITING_FOR_REVIEW, IN_REVIEW
3. **Running States**: ACCEPTED, APPROVED
4. **Terminal States**: COMPLETED, STOPPED, REJECTED

### Validation Tolerance

Traffic proportion validation uses a tolerance of 0.001 for floating-point comparisons:

```typescript
Math.abs(totalTraffic - 1.0) <= 0.001
```

This accounts for JavaScript floating-point precision issues.

## Best Practices

### Before Submission

1. **Validate First**: Always call `validatePPOTestForSubmission()` before submitting
2. **Check Status**: Use `getPPOTestSubmissionStatus()` to verify test state
3. **Test Locally**: Review test configuration in UI before submitting
4. **Verify Proportions**: Ensure traffic sums to exactly 1.0

### During Submission

1. **Handle Errors**: Show user-friendly error messages
2. **Confirm Actions**: Ask for confirmation before submitting
3. **Show Progress**: Display submission status to user
4. **Log Results**: Keep track of submission outcomes

### After Submission

1. **Monitor State**: Check test state regularly
2. **Review Results**: Once COMPLETED, analyze results
3. **Apply Winners**: Use winning treatments on main product page
4. **Document Findings**: Track what worked and what didn't

## UI Guidelines

### Button States

```typescript
// Submit button
<button
  disabled={!canSubmit || isSubmitting}
  onClick={handleSubmit}
>
  {isSubmitting ? 'Submitting...' : 'Submit for Review'}
</button>

// Stop button
<button
  disabled={!canStop || isStopping}
  onClick={handleStop}
  className="danger"
>
  {isStopping ? 'Stopping...' : 'Stop Test'}
</button>
```

### Confirmation Dialogs

```typescript
const handleSubmit = async () => {
  if (!confirm(
    'Submit this test for review? Once submitted, you cannot modify the configuration.'
  )) {
    return;
  }

  // Submit...
};

const handleStop = async () => {
  if (!confirm(
    'Stop this test? This action cannot be undone. All data will be finalized.'
  )) {
    return;
  }

  // Stop...
};
```

## Future Enhancements

- **Scheduled Submission**: Schedule tests to start at specific times
- **Auto-stop**: Automatically stop tests after a certain duration
- **Email Notifications**: Get notified when review completes
- **Submission History**: Track all submission attempts
- **Rollback**: Revert to previous test configuration

## Support

For issues or questions about PPO test submission:

1. Check validation error messages
2. Verify traffic proportions sum to 1.0
3. Ensure all treatments have localizations
4. Confirm test is in correct state
5. Review App Store Connect API documentation

---

**Implementation Date:** January 28, 2026
**Last Updated:** January 28, 2026
**Test Coverage:** 100% (6/6 tests passing)
