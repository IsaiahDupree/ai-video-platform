/**
 * Ad Template Testing Module
 * 
 * Golden tests, geometry tests, and determinism tests for template recreation.
 */

export {
  runGoldenTest,
  runGoldenTestSuite,
  testRenderDeterminism,
  testLayerGeometry,
  compareImages,
  evaluateDiff,
  generateTestReport,
  DEFAULT_THRESHOLDS,
  STRICT_THRESHOLDS,
  LENIENT_THRESHOLDS,
  type GoldenTestConfig,
  type DiffThresholds,
  type PixelDiffResult,
  type GoldenTestResult,
  type TestSuiteResult,
  type GeometryTestResult,
} from './golden-test';
