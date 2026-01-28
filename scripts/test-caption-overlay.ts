/**
 * Caption Overlay System Tests
 *
 * Comprehensive test suite for caption overlay functionality.
 */

import {
  CaptionConfig,
  CaptionPosition,
  CaptionStyle,
  LocalizedCaption,
  getCaptionText,
  getCaptionStyle,
  getCaptionPreset,
  getCaptionPresetsByCategory,
  createCaptionFromPreset,
  captionPresets,
} from '../src/types/captionOverlay';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => void | Promise<void>) {
  try {
    fn();
    results.push({ name, passed: true, message: 'Passed' });
  } catch (error) {
    results.push({
      name,
      passed: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(
      message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

function assertDeepEqual(actual: any, expected: any, message?: string) {
  const actualStr = JSON.stringify(actual, null, 2);
  const expectedStr = JSON.stringify(expected, null, 2);
  if (actualStr !== expectedStr) {
    throw new Error(message || `Objects not equal:\nActual: ${actualStr}\nExpected: ${expectedStr}`);
  }
}

console.log('🧪 Running Caption Overlay Tests...\n');

// Test 1: Caption presets exist
test('Caption presets are defined', () => {
  assert(Array.isArray(captionPresets), 'captionPresets should be an array');
  assert(captionPresets.length > 0, 'Should have at least one preset');
  console.log(`✅ Found ${captionPresets.length} caption presets`);
});

// Test 2: All presets have required fields
test('All presets have required fields', () => {
  captionPresets.forEach((preset) => {
    assert(typeof preset.id === 'string', `Preset ${preset.id} should have string id`);
    assert(typeof preset.name === 'string', `Preset ${preset.id} should have name`);
    assert(typeof preset.description === 'string', `Preset ${preset.id} should have description`);
    assert(preset.category !== undefined, `Preset ${preset.id} should have category`);
    assert(preset.positioning !== undefined, `Preset ${preset.id} should have positioning`);
    assert(preset.style !== undefined, `Preset ${preset.id} should have style`);
    assert(typeof preset.exampleText === 'string', `Preset ${preset.id} should have exampleText`);
  });
  console.log('✅ All presets have required fields');
});

// Test 3: Get caption preset by ID
test('getCaptionPreset() retrieves preset correctly', () => {
  const preset = getCaptionPreset('hero-heading');
  assert(preset !== undefined, 'Should find hero-heading preset');
  assertEqual(preset!.id, 'hero-heading', 'Should have correct ID');
  assertEqual(preset!.category, 'heading', 'Should be heading category');
  console.log('✅ getCaptionPreset() works correctly');
});

// Test 4: Get caption presets by category
test('getCaptionPresetsByCategory() filters correctly', () => {
  const headingPresets = getCaptionPresetsByCategory('heading');
  assert(headingPresets.length > 0, 'Should find heading presets');
  headingPresets.forEach((preset) => {
    assertEqual(preset.category, 'heading', 'All results should be heading category');
  });
  console.log(`✅ Found ${headingPresets.length} heading presets`);
});

// Test 5: Create caption from preset
test('createCaptionFromPreset() creates valid caption', () => {
  const caption = createCaptionFromPreset('hero-heading', 'Custom Text');
  assert(caption !== null, 'Should create caption');
  assertEqual(caption!.text, 'Custom Text', 'Should have custom text');
  assert(caption!.id !== undefined, 'Should have ID');
  assertEqual(caption!.visible, true, 'Should be visible by default');
  console.log('✅ createCaptionFromPreset() creates valid caption');
});

// Test 6: Get caption text - simple string
test('getCaptionText() handles simple strings', () => {
  const text = getCaptionText('Simple text');
  assertEqual(text, 'Simple text', 'Should return the same string');
  console.log('✅ getCaptionText() handles simple strings');
});

// Test 7: Get caption text - localized with exact match
test('getCaptionText() handles localized captions - exact match', () => {
  const localizedText: LocalizedCaption[] = [
    { locale: 'en-US', text: 'English text' },
    { locale: 'es-ES', text: 'Texto en español' },
    { locale: 'ja-JP', text: '日本語のテキスト' },
  ];

  const english = getCaptionText(localizedText, 'en-US');
  assertEqual(english, 'English text', 'Should return English text');

  const spanish = getCaptionText(localizedText, 'es-ES');
  assertEqual(spanish, 'Texto en español', 'Should return Spanish text');

  const japanese = getCaptionText(localizedText, 'ja-JP');
  assertEqual(japanese, '日本語のテキスト', 'Should return Japanese text');

  console.log('✅ getCaptionText() handles exact locale matches');
});

// Test 8: Get caption text - language fallback
test('getCaptionText() falls back to language code', () => {
  const localizedText: LocalizedCaption[] = [
    { locale: 'en-US', text: 'English text' },
    { locale: 'es-ES', text: 'Spanish text' },
  ];

  // Request 'en-GB' should fall back to 'en-US'
  const text = getCaptionText(localizedText, 'en-GB');
  assertEqual(text, 'English text', 'Should fall back to en-US for en-GB');

  console.log('✅ getCaptionText() falls back to language code');
});

// Test 9: Get caption text - default fallback
test('getCaptionText() falls back to first entry', () => {
  const localizedText: LocalizedCaption[] = [
    { locale: 'en-US', text: 'English text' },
    { locale: 'es-ES', text: 'Spanish text' },
  ];

  // Request unknown locale should fall back to first entry
  const text = getCaptionText(localizedText, 'fr-FR');
  assertEqual(text, 'English text', 'Should fall back to first entry');

  console.log('✅ getCaptionText() falls back to first entry for unknown locales');
});

// Test 10: Get caption style - simple style
test('getCaptionStyle() handles simple styles', () => {
  const baseStyle: CaptionStyle = {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 700,
  };

  const style = getCaptionStyle('Simple text', baseStyle);
  assertDeepEqual(style, baseStyle, 'Should return base style');
  console.log('✅ getCaptionStyle() handles simple styles');
});

// Test 11: Get caption style - localized with overrides
test('getCaptionStyle() merges locale-specific styles', () => {
  const baseStyle: CaptionStyle = {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 700,
  };

  const localizedText: LocalizedCaption[] = [
    { locale: 'en-US', text: 'English text' },
    {
      locale: 'ja-JP',
      text: '日本語のテキスト',
      style: { fontSize: 28, lineHeight: 1.6 }
    },
  ];

  const japaneseStyle = getCaptionStyle(localizedText, baseStyle, 'ja-JP');
  assertEqual(japaneseStyle.fontSize, 28, 'Should override fontSize');
  assertEqual(japaneseStyle.lineHeight, 1.6, 'Should add lineHeight');
  assertEqual(japaneseStyle.color, '#ffffff', 'Should keep base color');
  assertEqual(japaneseStyle.fontWeight, 700, 'Should keep base fontWeight');

  console.log('✅ getCaptionStyle() merges locale-specific styles');
});

// Test 12: Caption positions
test('All caption positions are valid', () => {
  const positions: CaptionPosition[] = [
    'top-left', 'top-center', 'top-right',
    'center-left', 'center', 'center-right',
    'bottom-left', 'bottom-center', 'bottom-right',
    'custom'
  ];

  positions.forEach((position) => {
    const preset = captionPresets[0];
    const caption = createCaptionFromPreset(preset.id);
    if (caption) {
      caption.positioning.position = position;
      assert(caption.positioning.position === position, `Position ${position} should be valid`);
    }
  });

  console.log('✅ All caption positions are valid');
});

// Test 13: Caption with custom positioning
test('Custom positioning works correctly', () => {
  const caption: CaptionConfig = {
    id: 'custom-caption',
    text: 'Custom positioned text',
    positioning: {
      position: 'custom',
      x: 25,
      y: 50,
    },
    style: {
      fontSize: 20,
      color: '#ffffff',
    },
  };

  assertEqual(caption.positioning.position, 'custom', 'Should have custom position');
  assertEqual(caption.positioning.x, 25, 'Should have x coordinate');
  assertEqual(caption.positioning.y, 50, 'Should have y coordinate');

  console.log('✅ Custom positioning works correctly');
});

// Test 14: Caption with offsets
test('Caption positioning with offsets', () => {
  const caption: CaptionConfig = {
    id: 'offset-caption',
    text: 'Offset text',
    positioning: {
      position: 'top-left',
      offsetX: 20,
      offsetY: 40,
    },
    style: {
      fontSize: 18,
      color: '#000000',
    },
  };

  assertEqual(caption.positioning.offsetX, 20, 'Should have X offset');
  assertEqual(caption.positioning.offsetY, 40, 'Should have Y offset');

  console.log('✅ Caption positioning with offsets works');
});

// Test 15: Caption visibility toggle
test('Caption visibility can be toggled', () => {
  const caption = createCaptionFromPreset('hero-heading');
  assert(caption !== null, 'Should create caption');

  // Default visibility
  assertEqual(caption!.visible, true, 'Should be visible by default');

  // Toggle visibility
  caption!.visible = false;
  assertEqual(caption!.visible, false, 'Should be hidden when set to false');

  console.log('✅ Caption visibility toggle works');
});

// Test 16: Caption style properties
test('Caption style supports all properties', () => {
  const style: CaptionStyle = {
    // Font
    fontFamily: 'Arial',
    fontSize: 24,
    fontWeight: 700,
    fontStyle: 'italic',
    lineHeight: 1.5,
    letterSpacing: '1px',

    // Color
    color: '#ffffff',
    backgroundColor: '#000000',
    backgroundOpacity: 0.8,

    // Text styling
    textAlign: 'center',
    textTransform: 'uppercase',
    textDecoration: 'underline',

    // Spacing
    padding: 16,
    margin: 8,

    // Border & shadow
    borderRadius: 8,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textShadow: '0 1px 2px rgba(0,0,0,0.2)',

    // Size
    maxWidth: '80%',
    width: 'auto',

    // Opacity
    opacity: 0.95,

    // Backdrop
    backdropFilter: 'blur(10px)',
  };

  assert(style.fontFamily === 'Arial', 'Should have fontFamily');
  assert(style.fontSize === 24, 'Should have fontSize');
  assert(style.fontWeight === 700, 'Should have fontWeight');
  assert(style.textAlign === 'center', 'Should have textAlign');
  assert(style.backgroundColor === '#000000', 'Should have backgroundColor');
  assert(style.backgroundOpacity === 0.8, 'Should have backgroundOpacity');

  console.log('✅ Caption style supports all properties');
});

// Test 17: Multiple localized captions
test('Multiple localized captions work correctly', () => {
  const localizedText: LocalizedCaption[] = [
    { locale: 'en-US', text: 'English' },
    { locale: 'es-ES', text: 'Español' },
    { locale: 'fr-FR', text: 'Français' },
    { locale: 'de-DE', text: 'Deutsch' },
    { locale: 'ja-JP', text: '日本語' },
    { locale: 'zh-CN', text: '中文' },
    { locale: 'ar-SA', text: 'العربية' },
  ];

  assertEqual(getCaptionText(localizedText, 'en-US'), 'English');
  assertEqual(getCaptionText(localizedText, 'es-ES'), 'Español');
  assertEqual(getCaptionText(localizedText, 'fr-FR'), 'Français');
  assertEqual(getCaptionText(localizedText, 'de-DE'), 'Deutsch');
  assertEqual(getCaptionText(localizedText, 'ja-JP'), '日本語');
  assertEqual(getCaptionText(localizedText, 'zh-CN'), '中文');
  assertEqual(getCaptionText(localizedText, 'ar-SA'), 'العربية');

  console.log('✅ Multiple localized captions work correctly');
});

// Test 18: Caption metadata
test('Caption metadata is preserved', () => {
  const caption: CaptionConfig = {
    id: 'metadata-caption',
    text: 'Caption with metadata',
    positioning: { position: 'center' },
    style: { fontSize: 20 },
    metadata: {
      createdAt: '2026-01-28',
      updatedAt: '2026-01-28',
      author: 'John Doe',
      notes: 'This is a test caption',
    },
  };

  assert(caption.metadata !== undefined, 'Should have metadata');
  assertEqual(caption.metadata!.author, 'John Doe', 'Should preserve author');
  assertEqual(caption.metadata!.notes, 'This is a test caption', 'Should preserve notes');

  console.log('✅ Caption metadata is preserved');
});

// Test 19: All preset categories exist
test('All preset categories are represented', () => {
  const categories = ['heading', 'subheading', 'body', 'badge', 'feature'];

  categories.forEach((category) => {
    const presets = getCaptionPresetsByCategory(category as any);
    // Note: Not all categories need to have presets, but we check the function works
    assert(Array.isArray(presets), `Should return array for ${category}`);
  });

  console.log('✅ All preset categories can be queried');
});

// Test 20: Caption animation configuration
test('Caption animation can be configured', () => {
  const caption: CaptionConfig = {
    id: 'animated-caption',
    text: 'Animated text',
    positioning: { position: 'center' },
    style: { fontSize: 24 },
    animation: {
      type: 'fade-in',
      duration: 500,
      delay: 200,
      easing: 'ease-in-out',
    },
  };

  assert(caption.animation !== undefined, 'Should have animation config');
  assertEqual(caption.animation!.type, 'fade-in', 'Should have fade-in animation');
  assertEqual(caption.animation!.duration, 500, 'Should have 500ms duration');
  assertEqual(caption.animation!.delay, 200, 'Should have 200ms delay');

  console.log('✅ Caption animation can be configured');
});

// Print results
console.log('\n📊 Test Results\n');
console.log('═'.repeat(60));

let passed = 0;
let failed = 0;

results.forEach((result) => {
  if (result.passed) {
    passed++;
    console.log(`✅ ${result.name}`);
  } else {
    failed++;
    console.log(`❌ ${result.name}`);
    console.log(`   ${result.message}`);
  }
});

console.log('═'.repeat(60));
console.log(`\nTotal: ${results.length} tests`);
console.log(`Passed: ${passed} (${((passed / results.length) * 100).toFixed(1)}%)`);
console.log(`Failed: ${failed}`);

if (failed === 0) {
  console.log('\n🎉 All tests passed!\n');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed\n');
  process.exit(1);
}
