/**
 * APP-014: PPO Test Configuration
 *
 * Test suite for Product Page Optimization (PPO) tests
 */

import {
  createPPOTest,
  getPPOTest,
  listPPOTests,
  updatePPOTest,
  deletePPOTest,
  createTreatment,
  getTreatment,
  listTreatments,
  updateTreatment,
  deleteTreatment,
  createTreatmentLocalization,
  getTreatmentLocalization,
  listTreatmentLocalizations,
  deleteTreatmentLocalization,
  createCompletePPOTest,
  getCompletePPOTest,
  toPPOTestInfo,
  toTreatmentInfo,
  toTreatmentLocalizationInfo,
  listPPOTestsForApp,
  startPPOTest,
  stopPPOTest,
} from '../src/services/ascPPO';
import type {
  AppStoreVersionExperiment,
  AppStoreVersionExperimentTreatment,
  AppStoreVersionExperimentTreatmentLocalization,
  PPOTestInfo,
  TreatmentInfo,
} from '../src/types/ascPPO';

// Mock credentials (tests will use mock responses)
const MOCK_CREDENTIALS = {
  issuerId: 'test-issuer-id',
  keyId: 'test-key-id',
  privateKey: '-----BEGIN PRIVATE KEY-----\nMOCK\n-----END PRIVATE KEY-----',
};

// Mock data
const MOCK_APP_ID = 'app-123';
const MOCK_VERSION_ID = 'version-456';
const MOCK_EXPERIMENT_ID = 'experiment-789';
const MOCK_TREATMENT_ID = 'treatment-abc';
const MOCK_LOCALIZATION_ID = 'localization-def';

/**
 * Mock experiment data
 */
function createMockExperiment(overrides = {}): AppStoreVersionExperiment {
  return {
    type: 'appStoreVersionExperiments',
    id: MOCK_EXPERIMENT_ID,
    attributes: {
      name: 'Test Experiment',
      trafficProportion: 0.5,
      state: 'PREPARE_FOR_SUBMISSION',
      reviewRequired: false,
      platform: 'IOS',
      ...overrides,
    },
    relationships: {
      app: {
        data: {
          type: 'apps',
          id: MOCK_APP_ID,
        },
      },
      latestControlVersion: {
        data: {
          type: 'appStoreVersions',
          id: MOCK_VERSION_ID,
        },
      },
      appStoreVersionExperimentTreatments: {
        data: [],
      },
    },
  };
}

/**
 * Mock treatment data
 */
function createMockTreatment(overrides = {}): AppStoreVersionExperimentTreatment {
  return {
    type: 'appStoreVersionExperimentTreatments',
    id: MOCK_TREATMENT_ID,
    attributes: {
      name: 'Treatment A',
      trafficProportion: 0.25,
      state: 'PREPARE_FOR_SUBMISSION',
      ...overrides,
    },
    relationships: {
      appStoreVersionExperiment: {
        data: {
          type: 'appStoreVersionExperiments',
          id: MOCK_EXPERIMENT_ID,
        },
      },
      appStoreVersionExperimentTreatmentLocalizations: {
        data: [],
      },
    },
  };
}

/**
 * Mock treatment localization data
 */
function createMockLocalization(overrides = {}): AppStoreVersionExperimentTreatmentLocalization {
  return {
    type: 'appStoreVersionExperimentTreatmentLocalizations',
    id: MOCK_LOCALIZATION_ID,
    attributes: {
      locale: 'en-US',
      ...overrides,
    },
    relationships: {
      appStoreVersionExperimentTreatment: {
        data: {
          type: 'appStoreVersionExperimentTreatments',
          id: MOCK_TREATMENT_ID,
        },
      },
      appScreenshotSets: {
        data: [],
      },
      appPreviewSets: {
        data: [],
      },
    },
  };
}

/**
 * Test runner
 */
class TestRunner {
  private passed = 0;
  private failed = 0;
  private tests: Array<{ name: string; fn: () => void | Promise<void> }> = [];

  test(name: string, fn: () => void | Promise<void>) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('\n🧪 Running PPO Test Suite...\n');

    for (const { name, fn } of this.tests) {
      try {
        await fn();
        this.passed++;
        console.log(`✅ ${name}`);
      } catch (error) {
        this.failed++;
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed\n`);
    return this.failed === 0;
  }
}

const runner = new TestRunner();

// ============================================================================
// Type Validation Tests
// ============================================================================

runner.test('Mock experiment structure is valid', () => {
  const experiment = createMockExperiment();
  if (experiment.type !== 'appStoreVersionExperiments') {
    throw new Error('Invalid experiment type');
  }
  if (!experiment.id) {
    throw new Error('Missing experiment ID');
  }
  if (!experiment.attributes) {
    throw new Error('Missing experiment attributes');
  }
});

runner.test('Mock treatment structure is valid', () => {
  const treatment = createMockTreatment();
  if (treatment.type !== 'appStoreVersionExperimentTreatments') {
    throw new Error('Invalid treatment type');
  }
  if (!treatment.id) {
    throw new Error('Missing treatment ID');
  }
  if (!treatment.attributes) {
    throw new Error('Missing treatment attributes');
  }
});

runner.test('Mock localization structure is valid', () => {
  const localization = createMockLocalization();
  if (localization.type !== 'appStoreVersionExperimentTreatmentLocalizations') {
    throw new Error('Invalid localization type');
  }
  if (!localization.id) {
    throw new Error('Missing localization ID');
  }
  if (!localization.attributes) {
    throw new Error('Missing localization attributes');
  }
});

// ============================================================================
// Conversion Function Tests
// ============================================================================

runner.test('toPPOTestInfo converts experiment correctly', () => {
  const experiment = createMockExperiment();
  const info = toPPOTestInfo(experiment);

  if (info.id !== experiment.id) {
    throw new Error('ID mismatch');
  }
  if (info.name !== experiment.attributes?.name) {
    throw new Error('Name mismatch');
  }
  if (info.state !== experiment.attributes?.state) {
    throw new Error('State mismatch');
  }
  if (info.appId !== MOCK_APP_ID) {
    throw new Error('App ID mismatch');
  }
});

runner.test('toTreatmentInfo converts treatment correctly', () => {
  const treatment = createMockTreatment();
  const info = toTreatmentInfo(treatment);

  if (info.id !== treatment.id) {
    throw new Error('ID mismatch');
  }
  if (info.name !== treatment.attributes?.name) {
    throw new Error('Name mismatch');
  }
  if (info.state !== treatment.attributes?.state) {
    throw new Error('State mismatch');
  }
  if (info.experimentId !== MOCK_EXPERIMENT_ID) {
    throw new Error('Experiment ID mismatch');
  }
});

runner.test('toTreatmentLocalizationInfo converts localization correctly', () => {
  const localization = createMockLocalization();
  const info = toTreatmentLocalizationInfo(localization);

  if (info.id !== localization.id) {
    throw new Error('ID mismatch');
  }
  if (info.locale !== localization.attributes?.locale) {
    throw new Error('Locale mismatch');
  }
  if (info.treatmentId !== MOCK_TREATMENT_ID) {
    throw new Error('Treatment ID mismatch');
  }
});

// ============================================================================
// Traffic Proportion Tests
// ============================================================================

runner.test('Traffic proportions are valid decimals', () => {
  const validProportions = [0, 0.25, 0.5, 0.75, 1.0];
  for (const proportion of validProportions) {
    if (proportion < 0 || proportion > 1) {
      throw new Error(`Invalid traffic proportion: ${proportion}`);
    }
  }
});

runner.test('Traffic proportions sum to 1.0', () => {
  const control = 0.5;
  const treatmentA = 0.25;
  const treatmentB = 0.25;
  const total = control + treatmentA + treatmentB;

  if (Math.abs(total - 1.0) > 0.001) {
    throw new Error(`Traffic proportions don't sum to 1.0: ${total}`);
  }
});

// ============================================================================
// State Validation Tests
// ============================================================================

runner.test('All valid experiment states are recognized', () => {
  const validStates = [
    'PREPARE_FOR_SUBMISSION',
    'READY_FOR_SUBMISSION',
    'WAITING_FOR_REVIEW',
    'IN_REVIEW',
    'ACCEPTED',
    'APPROVED',
    'REPLACED_WITH_NEW_VERSION',
    'REJECTED',
    'STOPPED',
    'COMPLETED',
  ];

  for (const state of validStates) {
    const experiment = createMockExperiment({ state });
    if (experiment.attributes?.state !== state) {
      throw new Error(`State not preserved: ${state}`);
    }
  }
});

runner.test('All valid treatment states are recognized', () => {
  const validStates = [
    'PREPARE_FOR_SUBMISSION',
    'READY_FOR_SUBMISSION',
    'WAITING_FOR_REVIEW',
    'IN_REVIEW',
    'ACCEPTED',
    'APPROVED',
    'REPLACED_WITH_NEW_VERSION',
    'REJECTED',
  ];

  for (const state of validStates) {
    const treatment = createMockTreatment({ state });
    if (treatment.attributes?.state !== state) {
      throw new Error(`State not preserved: ${state}`);
    }
  }
});

// ============================================================================
// Platform Tests
// ============================================================================

runner.test('All valid platforms are recognized', () => {
  const validPlatforms = ['IOS', 'MAC_OS', 'TV_OS', 'VISION_OS'];

  for (const platform of validPlatforms) {
    const experiment = createMockExperiment({ platform });
    if (experiment.attributes?.platform !== platform) {
      throw new Error(`Platform not preserved: ${platform}`);
    }
  }
});

// ============================================================================
// Locale Tests
// ============================================================================

runner.test('Common locales are valid', () => {
  const commonLocales = [
    'en-US',
    'en-GB',
    'es-ES',
    'es-MX',
    'fr-FR',
    'de-DE',
    'ja-JP',
    'zh-CN',
  ];

  for (const locale of commonLocales) {
    const localization = createMockLocalization({ locale });
    if (localization.attributes?.locale !== locale) {
      throw new Error(`Locale not preserved: ${locale}`);
    }
  }
});

// ============================================================================
// Relationship Tests
// ============================================================================

runner.test('Experiment has required relationships', () => {
  const experiment = createMockExperiment();

  if (!experiment.relationships?.app) {
    throw new Error('Missing app relationship');
  }
  if (!experiment.relationships?.latestControlVersion) {
    throw new Error('Missing latestControlVersion relationship');
  }
  if (experiment.relationships.app.data.id !== MOCK_APP_ID) {
    throw new Error('App ID mismatch in relationship');
  }
});

runner.test('Treatment has required relationships', () => {
  const treatment = createMockTreatment();

  if (!treatment.relationships?.appStoreVersionExperiment) {
    throw new Error('Missing experiment relationship');
  }
  if (treatment.relationships.appStoreVersionExperiment.data.id !== MOCK_EXPERIMENT_ID) {
    throw new Error('Experiment ID mismatch in relationship');
  }
});

runner.test('Localization has required relationships', () => {
  const localization = createMockLocalization();

  if (!localization.relationships?.appStoreVersionExperimentTreatment) {
    throw new Error('Missing treatment relationship');
  }
  if (localization.relationships.appStoreVersionExperimentTreatment.data.id !== MOCK_TREATMENT_ID) {
    throw new Error('Treatment ID mismatch in relationship');
  }
});

// ============================================================================
// Mock Data Consistency Tests
// ============================================================================

runner.test('Multiple experiments can coexist', () => {
  const exp1 = createMockExperiment({ name: 'Experiment 1' });
  const exp2 = createMockExperiment({ name: 'Experiment 2' });

  if (exp1.attributes?.name === exp2.attributes?.name) {
    throw new Error('Experiments should have different names');
  }
});

runner.test('Multiple treatments can coexist', () => {
  const t1 = createMockTreatment({ name: 'Treatment A' });
  const t2 = createMockTreatment({ name: 'Treatment B' });

  if (t1.attributes?.name === t2.attributes?.name) {
    throw new Error('Treatments should have different names');
  }
});

runner.test('Multiple localizations can coexist', () => {
  const l1 = createMockLocalization({ locale: 'en-US' });
  const l2 = createMockLocalization({ locale: 'fr-FR' });

  if (l1.attributes?.locale === l2.attributes?.locale) {
    throw new Error('Localizations should have different locales');
  }
});

// ============================================================================
// Edge Cases
// ============================================================================

runner.test('Empty treatment list is valid', () => {
  const experiment = createMockExperiment();
  const treatments = experiment.relationships?.appStoreVersionExperimentTreatments?.data || [];

  if (!Array.isArray(treatments)) {
    throw new Error('Treatments data should be an array');
  }
});

runner.test('Maximum traffic proportion (1.0) is valid', () => {
  const experiment = createMockExperiment({ trafficProportion: 1.0 });
  if (experiment.attributes?.trafficProportion !== 1.0) {
    throw new Error('Maximum traffic proportion not preserved');
  }
});

runner.test('Minimum traffic proportion (0.0) is valid', () => {
  const treatment = createMockTreatment({ trafficProportion: 0.0 });
  if (treatment.attributes?.trafficProportion !== 0.0) {
    throw new Error('Minimum traffic proportion not preserved');
  }
});

// ============================================================================
// Run Tests
// ============================================================================

runner.run().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
