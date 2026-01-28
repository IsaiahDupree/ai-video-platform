/**
 * Test Suite for Creative QA Service - ADS-019
 * Comprehensive tests for quality assurance checks
 */

import {
  runQAChecks,
  checkContrast,
  checkTextOverflow,
  checkLogoSize,
  checkSafeZones,
  checkAspectRatio,
  checkTextReadability,
  calculateContrastRatio,
  hexToRgb,
  getRelativeLuminance,
  getQASummary,
  formatIssueMessage,
  getSeverityIcon,
  getSeverityColor,
  DEFAULT_QA_CONFIG,
  QAConfig,
} from '../src/services/creativeQA';
import { AdTemplate, AD_SIZES } from '../src/types/adTemplate';

// Test counter
let testsPassed = 0;
let testsFailed = 0;

/**
 * Test helper
 */
function test(name: string, fn: () => void | Promise<void>) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result
        .then(() => {
          testsPassed++;
          console.log(`✅ ${name}`);
        })
        .catch((error) => {
          testsFailed++;
          console.error(`❌ ${name}`);
          console.error(`   Error: ${error.message}`);
        });
    } else {
      testsPassed++;
      console.log(`✅ ${name}`);
    }
  } catch (error: any) {
    testsFailed++;
    console.error(`❌ ${name}`);
    console.error(`   Error: ${error.message}`);
  }
}

/**
 * Assert helper
 */
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Create sample template for testing
 */
function createSampleTemplate(overrides: Partial<AdTemplate> = {}): AdTemplate {
  const baseTemplate: AdTemplate = {
    id: 'test-template',
    name: 'Test Template',
    layout: 'hero-text',
    dimensions: AD_SIZES.INSTAGRAM_SQUARE,
    content: {
      headline: 'Test Headline',
      subheadline: 'Test subheadline text',
      body: 'This is body text',
      cta: 'Learn More',
      backgroundColor: '#3b82f6',
      logoSize: 80,
    },
    style: {
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      textColor: '#ffffff',
      ctaBackgroundColor: '#ffffff',
      ctaTextColor: '#3b82f6',
      headlineFont: 'Inter',
      bodyFont: 'Inter',
      headlineSize: 48,
      bodySize: 20,
      padding: 40,
    },
  };

  return {
    ...baseTemplate,
    ...overrides,
    content: { ...baseTemplate.content, ...overrides.content },
    style: { ...baseTemplate.style, ...overrides.style },
  };
}

/**
 * Test color conversion utilities
 */
async function testColorUtils() {
  console.log('\n🧪 Testing Color Utilities...\n');

  test('hexToRgb converts hex to RGB', () => {
    const rgb = hexToRgb('#3b82f6');
    assert(rgb !== null, 'RGB should not be null');
    assert(rgb!.r === 59, `Expected r=59, got ${rgb!.r}`);
    assert(rgb!.g === 130, `Expected g=130, got ${rgb!.g}`);
    assert(rgb!.b === 246, `Expected b=246, got ${rgb!.b}`);
  });

  test('hexToRgb handles shorthand hex', () => {
    const rgb = hexToRgb('#fff');
    assert(rgb !== null, 'RGB should not be null');
    assert(rgb!.r === 255, `Expected r=255, got ${rgb!.r}`);
    assert(rgb!.g === 255, `Expected g=255, got ${rgb!.g}`);
    assert(rgb!.b === 255, `Expected b=255, got ${rgb!.b}`);
  });

  test('hexToRgb handles hex without #', () => {
    const rgb = hexToRgb('000000');
    assert(rgb !== null, 'RGB should not be null');
    assert(rgb!.r === 0, `Expected r=0, got ${rgb!.r}`);
    assert(rgb!.g === 0, `Expected g=0, got ${rgb!.g}`);
    assert(rgb!.b === 0, `Expected b=0, got ${rgb!.b}`);
  });

  test('getRelativeLuminance calculates correctly for white', () => {
    const luminance = getRelativeLuminance({ r: 255, g: 255, b: 255 });
    assert(luminance === 1, `Expected luminance=1, got ${luminance}`);
  });

  test('getRelativeLuminance calculates correctly for black', () => {
    const luminance = getRelativeLuminance({ r: 0, g: 0, b: 0 });
    assert(luminance === 0, `Expected luminance=0, got ${luminance}`);
  });

  test('calculateContrastRatio for black on white', () => {
    const ratio = calculateContrastRatio('#000000', '#ffffff');
    assert(ratio !== null, 'Ratio should not be null');
    assert(ratio! === 21, `Expected ratio=21, got ${ratio}`);
  });

  test('calculateContrastRatio for similar colors is low', () => {
    const ratio = calculateContrastRatio('#cccccc', '#dddddd');
    assert(ratio !== null, 'Ratio should not be null');
    assert(ratio! < 2, `Expected ratio < 2, got ${ratio}`);
  });
}

/**
 * Test contrast checking
 */
async function testContrastChecks() {
  console.log('\n🧪 Testing Contrast Checks...\n');

  test('Good contrast passes check', () => {
    const template = createSampleTemplate({
      style: {
        textColor: '#ffffff',
        ctaTextColor: '#000000',
        ctaBackgroundColor: '#ffffff',
      },
      content: {
        backgroundColor: '#000000',
      },
    });

    const issues = checkContrast(template);
    assert(issues.length === 0, `Expected 0 issues, got ${issues.length}`);
  });

  test('Poor contrast fails check', () => {
    const template = createSampleTemplate({
      style: {
        textColor: '#cccccc',
      },
      content: {
        backgroundColor: '#dddddd',
      },
    });

    const issues = checkContrast(template);
    assert(issues.length > 0, `Expected issues, got ${issues.length}`);
    assert(issues[0].type === 'contrast', `Expected type=contrast, got ${issues[0].type}`);
    assert(
      issues[0].severity === 'error' || issues[0].severity === 'warning',
      `Expected error or warning, got ${issues[0].severity}`
    );
  });

  test('CTA contrast is checked', () => {
    const template = createSampleTemplate({
      style: {
        ctaTextColor: '#f0f0f0',
        ctaBackgroundColor: '#ffffff',
      },
    });

    const issues = checkContrast(template);
    const ctaIssue = issues.find((i) => i.field === 'cta');
    assert(ctaIssue !== undefined, 'Expected CTA contrast issue');
  });
}

/**
 * Test text overflow detection
 */
async function testTextOverflow() {
  console.log('\n🧪 Testing Text Overflow Detection...\n');

  test('Short text passes check', () => {
    const template = createSampleTemplate({
      content: {
        headline: 'Short',
        subheadline: 'Also short',
        cta: 'Click',
      },
    });

    const issues = checkTextOverflow(template);
    assert(issues.length === 0, `Expected 0 issues, got ${issues.length}`);
  });

  test('Long headline fails check', () => {
    const template = createSampleTemplate({
      content: {
        headline: 'A'.repeat(100), // 100 characters
      },
    });

    const issues = checkTextOverflow(template);
    const headlineIssue = issues.find((i) => i.field === 'headline');
    assert(headlineIssue !== undefined, 'Expected headline overflow issue');
    assert(
      headlineIssue!.type === 'text_overflow',
      `Expected type=text_overflow, got ${headlineIssue!.type}`
    );
  });

  test('Long CTA fails check', () => {
    const template = createSampleTemplate({
      content: {
        cta: 'Click here to learn more about our amazing product',
      },
    });

    const issues = checkTextOverflow(template);
    const ctaIssue = issues.find((i) => i.field === 'cta');
    assert(ctaIssue !== undefined, 'Expected CTA overflow issue');
  });

  test('Custom max length configuration works', () => {
    const template = createSampleTemplate({
      content: {
        headline: 'A'.repeat(50),
      },
    });

    const config: QAConfig = {
      maxTextLength: {
        headline: 40,
      },
    };

    const issues = checkTextOverflow(template, config);
    assert(issues.length > 0, 'Expected overflow issue with custom config');
  });
}

/**
 * Test logo size validation
 */
async function testLogoSize() {
  console.log('\n🧪 Testing Logo Size Validation...\n');

  test('Optimal logo size passes', () => {
    const template = createSampleTemplate({
      content: {
        logoSize: 80,
      },
    });

    const issues = checkLogoSize(template);
    const errorIssues = issues.filter((i) => i.severity === 'error');
    assert(errorIssues.length === 0, `Expected 0 errors, got ${errorIssues.length}`);
  });

  test('Too small logo fails', () => {
    const template = createSampleTemplate({
      content: {
        logoSize: 20,
      },
    });

    const issues = checkLogoSize(template);
    const errorIssue = issues.find((i) => i.severity === 'error');
    assert(errorIssue !== undefined, 'Expected error for small logo');
    assert(errorIssue!.type === 'logo_size', `Expected type=logo_size, got ${errorIssue!.type}`);
  });

  test('Too large logo triggers warning', () => {
    const template = createSampleTemplate({
      content: {
        logoSize: 250,
      },
    });

    const issues = checkLogoSize(template);
    const warningIssue = issues.find((i) => i.severity === 'warning');
    assert(warningIssue !== undefined, 'Expected warning for large logo');
  });

  test('No logo returns no issues', () => {
    const template = createSampleTemplate({
      content: {
        logoSize: undefined,
      },
    });

    const issues = checkLogoSize(template);
    assert(issues.length === 0, `Expected 0 issues when no logo, got ${issues.length}`);
  });
}

/**
 * Test safe zone validation
 */
async function testSafeZones() {
  console.log('\n🧪 Testing Safe Zone Validation...\n');

  test('Adequate padding passes', () => {
    const template = createSampleTemplate({
      style: {
        padding: 50,
      },
    });

    const issues = checkSafeZones(template);
    assert(issues.length === 0, `Expected 0 issues, got ${issues.length}`);
  });

  test('Insufficient padding fails', () => {
    const template = createSampleTemplate({
      style: {
        padding: 10,
      },
    });

    const issues = checkSafeZones(template);
    assert(issues.length > 0, `Expected issues, got ${issues.length}`);
    assert(issues[0].type === 'safe_zone', `Expected type=safe_zone, got ${issues[0].type}`);
  });

  test('Custom margin configuration works', () => {
    const template = createSampleTemplate({
      style: {
        padding: 30,
      },
    });

    const config: QAConfig = {
      checkSafeZones: true,
      safeZoneMargin: 20,
    };

    const issues = checkSafeZones(template, config);
    assert(issues.length === 0, 'Expected 0 issues with custom margin');
  });
}

/**
 * Test aspect ratio validation
 */
async function testAspectRatio() {
  console.log('\n🧪 Testing Aspect Ratio Validation...\n');

  test('Standard aspect ratio passes', () => {
    const template = createSampleTemplate({
      dimensions: {
        width: 1080,
        height: 1080,
        name: 'Square',
      },
    });

    const config: QAConfig = {
      allowedAspectRatios: [{ width: 1, height: 1 }],
    };

    const issues = checkAspectRatio(template, config);
    assert(issues.length === 0, `Expected 0 issues, got ${issues.length}`);
  });

  test('Non-standard aspect ratio triggers info', () => {
    const template = createSampleTemplate({
      dimensions: {
        width: 1234,
        height: 567,
        name: 'Weird',
      },
    });

    const config: QAConfig = {
      allowedAspectRatios: [
        { width: 1, height: 1 },
        { width: 16, height: 9 },
      ],
    };

    const issues = checkAspectRatio(template, config);
    assert(issues.length > 0, `Expected issues, got ${issues.length}`);
    assert(issues[0].type === 'aspect_ratio', `Expected type=aspect_ratio, got ${issues[0].type}`);
  });

  test('No allowed ratios configured returns no issues', () => {
    const template = createSampleTemplate();
    const config: QAConfig = {
      allowedAspectRatios: [],
    };

    const issues = checkAspectRatio(template, config);
    assert(issues.length === 0, 'Expected 0 issues when no ratios configured');
  });
}

/**
 * Test text readability checks
 */
async function testTextReadability() {
  console.log('\n🧪 Testing Text Readability...\n');

  test('Readable font sizes pass', () => {
    const template = createSampleTemplate({
      style: {
        headlineSize: 48,
        bodySize: 20,
      },
    });

    const issues = checkTextReadability(template);
    assert(issues.length === 0, `Expected 0 issues, got ${issues.length}`);
  });

  test('Too small headline triggers warning', () => {
    const template = createSampleTemplate({
      style: {
        headlineSize: 16,
      },
    });

    const issues = checkTextReadability(template);
    const headlineIssue = issues.find((i) => i.field === 'headlineSize');
    assert(headlineIssue !== undefined, 'Expected headline readability issue');
  });

  test('Too small body text triggers warning', () => {
    const template = createSampleTemplate({
      style: {
        bodySize: 10,
      },
    });

    const issues = checkTextReadability(template);
    const bodyIssue = issues.find((i) => i.field === 'bodySize');
    assert(bodyIssue !== undefined, 'Expected body readability issue');
  });
}

/**
 * Test full QA run
 */
async function testFullQARun() {
  console.log('\n🧪 Testing Full QA Run...\n');

  test('Perfect template passes all checks', () => {
    const template = createSampleTemplate({
      content: {
        headline: 'Great Headline',
        subheadline: 'Supporting text',
        cta: 'Buy Now',
        backgroundColor: '#000000',
        logoSize: 80,
      },
      style: {
        textColor: '#ffffff',
        ctaBackgroundColor: '#ffffff',
        ctaTextColor: '#000000',
        headlineSize: 48,
        bodySize: 20,
        padding: 50,
      },
    });

    const result = runQAChecks(template);
    assert(result.passed === true, 'Expected template to pass');
    assert(result.score >= 70, `Expected score >= 70, got ${result.score}`);
    assert(result.checks.length > 0, 'Expected checks to be run');
  });

  test('Problematic template fails checks', () => {
    const template = createSampleTemplate({
      content: {
        headline: 'A'.repeat(120), // Too long
        backgroundColor: '#cccccc',
        logoSize: 300, // Too large
      },
      style: {
        textColor: '#dddddd', // Poor contrast
        headlineSize: 12, // Too small
        padding: 5, // Insufficient
      },
    });

    const result = runQAChecks(template);
    assert(result.issues.length > 0, 'Expected issues to be found');
    assert(result.score < 100, `Expected score < 100, got ${result.score}`);

    const summary = getQASummary(result);
    assert(summary.totalIssues > 0, 'Expected total issues > 0');
  });

  test('QA result includes timestamp', () => {
    const template = createSampleTemplate();
    const result = runQAChecks(template);

    assert(result.timestamp !== undefined, 'Expected timestamp');
    const timestamp = new Date(result.timestamp);
    assert(!isNaN(timestamp.getTime()), 'Expected valid timestamp');
  });

  test('QA result includes check durations', () => {
    const template = createSampleTemplate();
    const result = runQAChecks(template);

    const checksWithDuration = result.checks.filter((c) => c.duration !== undefined);
    assert(checksWithDuration.length > 0, 'Expected checks to have duration');
  });
}

/**
 * Test utility functions
 */
async function testUtilities() {
  console.log('\n🧪 Testing Utility Functions...\n');

  test('getQASummary calculates correctly', () => {
    const template = createSampleTemplate({
      content: {
        headline: 'A'.repeat(100),
        logoSize: 300,
      },
      style: {
        padding: 10,
      },
    });

    const result = runQAChecks(template);
    const summary = getQASummary(result);

    assert(summary.totalIssues === result.issues.length, 'Total issues should match');
    assert(summary.totalChecks === result.checks.length, 'Total checks should match');
    assert(
      summary.errorCount + summary.warningCount + summary.infoCount === summary.totalIssues,
      'Issue counts should sum to total'
    );
  });

  test('formatIssueMessage includes all parts', () => {
    const template = createSampleTemplate({
      content: {
        headline: 'A'.repeat(100),
      },
    });

    const issues = checkTextOverflow(template);
    const formatted = formatIssueMessage(issues[0]);

    assert(formatted.includes(issues[0].message), 'Should include message');
    assert(formatted.includes('💡'), 'Should include suggestion icon');
  });

  test('getSeverityIcon returns correct icons', () => {
    assert(getSeverityIcon('error') === '❌', 'Error icon should be ❌');
    assert(getSeverityIcon('warning') === '⚠️', 'Warning icon should be ⚠️');
    assert(getSeverityIcon('info') === 'ℹ️', 'Info icon should be ℹ️');
  });

  test('getSeverityColor returns hex colors', () => {
    const errorColor = getSeverityColor('error');
    const warningColor = getSeverityColor('warning');
    const infoColor = getSeverityColor('info');

    assert(errorColor.startsWith('#'), 'Error color should be hex');
    assert(warningColor.startsWith('#'), 'Warning color should be hex');
    assert(infoColor.startsWith('#'), 'Info color should be hex');
  });
}

/**
 * Test custom configurations
 */
async function testCustomConfigurations() {
  console.log('\n🧪 Testing Custom Configurations...\n');

  test('Custom QA config overrides defaults', () => {
    const template = createSampleTemplate({
      content: {
        headline: 'A'.repeat(60),
      },
    });

    const customConfig: QAConfig = {
      maxTextLength: {
        headline: 50,
      },
    };

    const defaultIssues = checkTextOverflow(template, DEFAULT_QA_CONFIG);
    const customIssues = checkTextOverflow(template, customConfig);

    // With default config (80 chars), 60 chars should pass
    assert(defaultIssues.length === 0, 'Should pass with default config');

    // With custom config (50 chars), 60 chars should fail
    assert(customIssues.length > 0, 'Should fail with custom config');
  });

  test('Can disable specific checks', () => {
    const template = createSampleTemplate({
      style: {
        padding: 10, // Would normally fail
      },
    });

    const config: QAConfig = {
      checkSafeZones: false,
    };

    const issues = checkSafeZones(template, config);
    assert(issues.length === 0, 'Should not check when disabled');
  });

  test('Can customize WCAG level', () => {
    const template = createSampleTemplate({
      style: {
        textColor: '#757575',
      },
      content: {
        backgroundColor: '#ffffff',
      },
    });

    // WCAG AA (4.5:1)
    const aaConfig: QAConfig = {
      minContrastRatio: 4.5,
    };

    // WCAG AAA (7:1)
    const aaaConfig: QAConfig = {
      minContrastRatio: 7,
    };

    const aaIssues = checkContrast(template, aaConfig);
    const aaaIssues = checkContrast(template, aaaConfig);

    // Gray on white is ~4.6:1, should pass AA but might not pass AAA
    assert(aaIssues.length <= aaaIssues.length, 'AAA should be stricter than AA');
  });
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Creative QA Service Test Suite\n');
  console.log('='.repeat(50));

  await testColorUtils();
  await testContrastChecks();
  await testTextOverflow();
  await testLogoSize();
  await testSafeZones();
  await testAspectRatio();
  await testTextReadability();
  await testFullQARun();
  await testUtilities();
  await testCustomConfigurations();

  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Test Results:\n');
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📈 Total:  ${testsPassed + testsFailed}`);

  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed!\n');
    process.exit(0);
  } else {
    console.log('\n💥 Some tests failed.\n');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
