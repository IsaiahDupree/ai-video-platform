/**
 * APP-015: PPO Test Submission
 *
 * Test suite for PPO test submission functionality
 */

import {
  validatePPOTestForSubmission,
  startPPOTest,
  stopPPOTest,
  getPPOTestSubmissionStatus,
  validateTrafficProportions,
  calculateEvenTrafficProportions,
} from '../src/services/ascPPO';
import type { PPOTestInfo, TreatmentInfo } from '../src/types/ascPPO';

// Mock implementations for testing
const mockGetCompletePPOTest = async (experimentId: string) => {
  const mockTests: Record<string, PPOTestInfo> = {
    'test-valid': {
      id: 'test-valid',
      appId: 'app-1',
      appStoreVersionId: 'ver-1',
      name: 'Valid Test',
      state: 'PREPARE_FOR_SUBMISSION',
      trafficProportion: 0.5,
      treatments: [
        {
          id: 'tr-1',
          experimentId: 'test-valid',
          name: 'Treatment A',
          state: 'PREPARE_FOR_SUBMISSION',
          trafficProportion: 0.25,
          localizations: [
            {
              id: 'loc-1',
              treatmentId: 'tr-1',
              locale: 'en-US',
              screenshotSetIds: ['ss-1'],
              previewSetIds: [],
            },
          ],
        },
        {
          id: 'tr-2',
          experimentId: 'test-valid',
          name: 'Treatment B',
          state: 'PREPARE_FOR_SUBMISSION',
          trafficProportion: 0.25,
          localizations: [
            {
              id: 'loc-2',
              treatmentId: 'tr-2',
              locale: 'en-US',
              screenshotSetIds: ['ss-2'],
              previewSetIds: [],
            },
          ],
        },
      ],
    },
    'test-no-treatments': {
      id: 'test-no-treatments',
      appId: 'app-1',
      appStoreVersionId: 'ver-1',
      name: 'No Treatments Test',
      state: 'PREPARE_FOR_SUBMISSION',
      trafficProportion: 1.0,
      treatments: [],
    },
    'test-bad-traffic': {
      id: 'test-bad-traffic',
      appId: 'app-1',
      appStoreVersionId: 'ver-1',
      name: 'Bad Traffic Test',
      state: 'PREPARE_FOR_SUBMISSION',
      trafficProportion: 0.6,
      treatments: [
        {
          id: 'tr-3',
          experimentId: 'test-bad-traffic',
          name: 'Treatment A',
          state: 'PREPARE_FOR_SUBMISSION',
          trafficProportion: 0.3,
          localizations: [
            {
              id: 'loc-3',
              treatmentId: 'tr-3',
              locale: 'en-US',
              screenshotSetIds: ['ss-3'],
              previewSetIds: [],
            },
          ],
        },
      ],
    },
    'test-no-localizations': {
      id: 'test-no-localizations',
      appId: 'app-1',
      appStoreVersionId: 'ver-1',
      name: 'No Localizations Test',
      state: 'PREPARE_FOR_SUBMISSION',
      trafficProportion: 0.5,
      treatments: [
        {
          id: 'tr-4',
          experimentId: 'test-no-localizations',
          name: 'Treatment A',
          state: 'PREPARE_FOR_SUBMISSION',
          trafficProportion: 0.5,
          localizations: [],
        },
      ],
    },
    'test-wrong-state': {
      id: 'test-wrong-state',
      appId: 'app-1',
      appStoreVersionId: 'ver-1',
      name: 'Wrong State Test',
      state: 'APPROVED',
      trafficProportion: 0.5,
      treatments: [
        {
          id: 'tr-5',
          experimentId: 'test-wrong-state',
          name: 'Treatment A',
          state: 'APPROVED',
          trafficProportion: 0.5,
          localizations: [
            {
              id: 'loc-5',
              treatmentId: 'tr-5',
              locale: 'en-US',
              screenshotSetIds: ['ss-5'],
              previewSetIds: [],
            },
          ],
        },
      ],
    },
    'test-too-many-treatments': {
      id: 'test-too-many-treatments',
      appId: 'app-1',
      appStoreVersionId: 'ver-1',
      name: 'Too Many Treatments Test',
      state: 'PREPARE_FOR_SUBMISSION',
      trafficProportion: 0.25,
      treatments: [
        {
          id: 'tr-6',
          experimentId: 'test-too-many-treatments',
          name: 'Treatment A',
          state: 'PREPARE_FOR_SUBMISSION',
          trafficProportion: 0.25,
          localizations: [{ id: 'loc-6', treatmentId: 'tr-6', locale: 'en-US', screenshotSetIds: [], previewSetIds: [] }],
        },
        {
          id: 'tr-7',
          experimentId: 'test-too-many-treatments',
          name: 'Treatment B',
          state: 'PREPARE_FOR_SUBMISSION',
          trafficProportion: 0.25,
          localizations: [{ id: 'loc-7', treatmentId: 'tr-7', locale: 'en-US', screenshotSetIds: [], previewSetIds: [] }],
        },
        {
          id: 'tr-8',
          experimentId: 'test-too-many-treatments',
          name: 'Treatment C',
          state: 'PREPARE_FOR_SUBMISSION',
          trafficProportion: 0.25,
          localizations: [{ id: 'loc-8', treatmentId: 'tr-8', locale: 'en-US', screenshotSetIds: [], previewSetIds: [] }],
        },
        {
          id: 'tr-9',
          experimentId: 'test-too-many-treatments',
          name: 'Treatment D',
          state: 'PREPARE_FOR_SUBMISSION',
          trafficProportion: 0.0,
          localizations: [{ id: 'loc-9', treatmentId: 'tr-9', locale: 'en-US', screenshotSetIds: [], previewSetIds: [] }],
        },
      ],
    },
  };

  const test = mockTests[experimentId];
  if (!test) {
    return { success: false, error: 'Test not found' };
  }

  return { success: true, data: test };
};

// Test runner
async function runTests() {
  console.log('🧪 Testing PPO Test Submission (APP-015)\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Validate traffic proportions
  console.log('Test 1: Validate traffic proportions');
  try {
    const result1 = validateTrafficProportions(0.5, [0.25, 0.25]);
    if (result1.valid && Math.abs(result1.total - 1.0) < 0.001) {
      console.log('✅ Valid traffic proportions accepted\n');
      passed++;
    } else {
      console.log('❌ Valid traffic proportions rejected\n');
      failed++;
    }
  } catch (error) {
    console.log('❌ Error:', error, '\n');
    failed++;
  }

  // Test 2: Reject invalid traffic proportions
  console.log('Test 2: Reject invalid traffic proportions');
  try {
    const result2 = validateTrafficProportions(0.6, [0.3, 0.2]);
    if (!result2.valid) {
      console.log('✅ Invalid traffic proportions rejected\n');
      passed++;
    } else {
      console.log('❌ Invalid traffic proportions accepted\n');
      failed++;
    }
  } catch (error) {
    console.log('❌ Error:', error, '\n');
    failed++;
  }

  // Test 3: Calculate even traffic proportions for 2 treatments
  console.log('Test 3: Calculate even traffic proportions for 2 treatments');
  try {
    const result3 = calculateEvenTrafficProportions(2);
    const expected = { control: 0.3333333333333333, treatments: [0.3333333333333333, 0.3333333333333333] };
    if (
      Math.abs(result3.control - expected.control) < 0.001 &&
      result3.treatments.length === 2 &&
      Math.abs(result3.treatments[0] - expected.treatments[0]) < 0.001
    ) {
      console.log('✅ Even distribution calculated correctly\n');
      passed++;
    } else {
      console.log('❌ Even distribution incorrect:', result3, '\n');
      failed++;
    }
  } catch (error) {
    console.log('❌ Error:', error, '\n');
    failed++;
  }

  // Test 4: Calculate even traffic proportions for 3 treatments
  console.log('Test 4: Calculate even traffic proportions for 3 treatments');
  try {
    const result4 = calculateEvenTrafficProportions(3);
    const total = result4.control + result4.treatments.reduce((sum, t) => sum + t, 0);
    if (Math.abs(total - 1.0) < 0.001 && result4.treatments.length === 3) {
      console.log('✅ Even distribution for 3 treatments correct\n');
      passed++;
    } else {
      console.log('❌ Even distribution for 3 treatments incorrect:', result4, '\n');
      failed++;
    }
  } catch (error) {
    console.log('❌ Error:', error, '\n');
    failed++;
  }

  // Test 5: Reject traffic proportion out of range
  console.log('Test 5: Reject traffic proportion out of range');
  try {
    const result5 = validateTrafficProportions(1.5, [0.0]);
    if (!result5.valid) {
      console.log('✅ Out-of-range proportion rejected\n');
      passed++;
    } else {
      console.log('❌ Out-of-range proportion accepted\n');
      failed++;
    }
  } catch (error) {
    console.log('❌ Error:', error, '\n');
    failed++;
  }

  // Test 6: Reject negative traffic proportion
  console.log('Test 6: Reject negative traffic proportion');
  try {
    const result6 = validateTrafficProportions(0.5, [-0.1, 0.6]);
    if (!result6.valid) {
      console.log('✅ Negative proportion rejected\n');
      passed++;
    } else {
      console.log('❌ Negative proportion accepted\n');
      failed++;
    }
  } catch (error) {
    console.log('❌ Error:', error, '\n');
    failed++;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Total: ${passed + failed} tests`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(50));

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
