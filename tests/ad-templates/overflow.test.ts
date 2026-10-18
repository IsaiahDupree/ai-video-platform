/**
 * Text Overflow Tests
 * 
 * Tests for detecting text overflow in template layers.
 */

// Note: Install vitest to run these tests: npm install -D vitest
// Run with: npx vitest run tests/ad-templates/

// @ts-ignore - vitest may not be installed
import { describe, it, expect } from 'vitest';
import {
  TemplateDSL,
  TextLayer,
  Rect,
  TextStyle,
  TextConstraints,
} from '../../src/ad-templates/schema/template-dsl';
import {
  detectOverflow,
  fitTextInBox,
  fitTextOnNLines,
  wrapText,
} from '../../src/ad-templates/renderer/utils/text-fitting';

// =============================================================================
// Test Fixtures
// =============================================================================

const defaultTextStyle: TextStyle = {
  fontFamily: 'Inter',
  fontWeight: 400,
  fontSize: 24,
  lineHeight: 1.2,
  letterSpacing: 0,
  color: '#ffffff',
  align: 'left',
  valign: 'top',
};

const defaultRect: Rect = {
  x: 0,
  y: 0,
  w: 300,
  h: 100,
};

// =============================================================================
// Text Wrapping Tests
// =============================================================================

describe('Text Wrapping', () => {
  it('should wrap long text to multiple lines', () => {
    const longText = 'This is a very long text that should wrap to multiple lines when rendered';
    const lines = wrapText(longText, 200, defaultTextStyle);
    
    expect(lines.length).toBeGreaterThan(1);
  });

  it('should keep short text on single line', () => {
    const shortText = 'Short';
    const lines = wrapText(shortText, 200, defaultTextStyle);
    
    expect(lines.length).toBe(1);
    expect(lines[0]).toBe('Short');
  });

  it('should handle empty text', () => {
    const lines = wrapText('', 200, defaultTextStyle);
    
    expect(lines.length).toBe(0);
  });

  it('should respect word boundaries', () => {
    const text = 'Word1 Word2 Word3';
    const lines = wrapText(text, 100, { ...defaultTextStyle, fontSize: 16 });
    
    // Each line should contain complete words
    lines.forEach(line => {
      expect(line).not.toMatch(/^\s|\s$/); // No leading/trailing spaces
    });
  });
});

// =============================================================================
// Overflow Detection Tests
// =============================================================================

describe('Overflow Detection', () => {
  it('should detect overflow when text exceeds height', () => {
    const tallRect: Rect = { x: 0, y: 0, w: 100, h: 30 };
    const longText = 'This is text that will definitely overflow the small container because it is very long';
    
    const result = detectOverflow(longText, tallRect, defaultTextStyle);
    
    expect(result.overflow).toBe(true);
  });

  it('should not detect overflow for short text', () => {
    const largeRect: Rect = { x: 0, y: 0, w: 500, h: 200 };
    const shortText = 'Hi';
    
    const result = detectOverflow(shortText, largeRect, defaultTextStyle);
    
    expect(result.overflow).toBe(false);
  });

  it('should return measurement details', () => {
    const text = 'Test text';
    const result = detectOverflow(text, defaultRect, defaultTextStyle);
    
    expect(result.details).toHaveProperty('width');
    expect(result.details).toHaveProperty('height');
    expect(result.details).toHaveProperty('lines');
    expect(result.details).toHaveProperty('overflow');
  });
});

// =============================================================================
// Text Fitting Tests
// =============================================================================

describe('Text Fitting', () => {
  const constraints: TextConstraints = {
    mode: 'fitText',
    minFontSize: 12,
    maxFontSize: 48,
    overflow: 'hidden',
  };

  it('should reduce font size to fit text', () => {
    const longText = 'This is a very long headline that needs to fit in a small box';
    const smallRect: Rect = { x: 0, y: 0, w: 200, h: 50 };
    
    const result = fitTextInBox(longText, smallRect, { ...defaultTextStyle, fontSize: 48 }, constraints);
    
    expect(result.fontSize).toBeLessThan(48);
    expect(result.fontSize).toBeGreaterThanOrEqual(12);
  });

  it('should not exceed maximum font size', () => {
    const shortText = 'Hi';
    const largeRect: Rect = { x: 0, y: 0, w: 500, h: 200 };
    
    const result = fitTextInBox(shortText, largeRect, { ...defaultTextStyle, fontSize: 24 }, {
      ...constraints,
      maxFontSize: 36,
    });
    
    expect(result.fontSize).toBeLessThanOrEqual(36);
  });

  it('should respect minimum font size', () => {
    const veryLongText = 'This is an extremely long text that cannot possibly fit even at the minimum font size allowed by the constraints';
    const tinyRect: Rect = { x: 0, y: 0, w: 50, h: 20 };
    
    const result = fitTextInBox(veryLongText, tinyRect, { ...defaultTextStyle, fontSize: 48 }, {
      ...constraints,
      minFontSize: 14,
    });
    
    expect(result.fontSize).toBeGreaterThanOrEqual(14);
  });
});

// =============================================================================
// Fit Text On N Lines Tests
// =============================================================================

describe('Fit Text On N Lines', () => {
  it('should fit text on specified number of lines', () => {
    const text = 'This is a headline that should fit on exactly two lines';
    const rect: Rect = { x: 0, y: 0, w: 300, h: 100 };
    
    const result = fitTextOnNLines(text, rect, defaultTextStyle, 2);
    
    expect(result.lines.length).toBeLessThanOrEqual(2);
  });

  it('should truncate if necessary', () => {
    const veryLongText = 'Word '.repeat(50);
    const rect: Rect = { x: 0, y: 0, w: 200, h: 100 };
    
    const result = fitTextOnNLines(veryLongText, rect, defaultTextStyle, 3, 12);
    
    expect(result.lines.length).toBeLessThanOrEqual(3);
  });

  it('should handle single line constraint', () => {
    const text = 'Single line headline';
    const rect: Rect = { x: 0, y: 0, w: 500, h: 50 };
    
    const result = fitTextOnNLines(text, rect, { ...defaultTextStyle, fontSize: 32 }, 1);
    
    expect(result.lines.length).toBe(1);
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('Edge Cases', () => {
  it('should handle zero-width rect', () => {
    const zeroWidthRect: Rect = { x: 0, y: 0, w: 0, h: 100 };
    const text = 'Test';
    
    // Should not throw, but may produce unusual results
    expect(() => wrapText(text, 0, defaultTextStyle)).not.toThrow();
  });

  it('should handle special characters', () => {
    const specialText = '🚀 Launch Now! ™ © ® €100';
    const rect: Rect = { x: 0, y: 0, w: 300, h: 100 };
    
    const result = detectOverflow(specialText, rect, defaultTextStyle);
    
    expect(result.details.lines).toBeGreaterThanOrEqual(1);
  });

  it('should handle newlines in text', () => {
    const multilineText = 'Line 1\nLine 2\nLine 3';
    const lines = wrapText(multilineText, 500, defaultTextStyle);
    
    // Newlines should be preserved in wrapping
    expect(lines.length).toBeGreaterThanOrEqual(1);
  });

  it('should handle very large font sizes', () => {
    const largeStyle = { ...defaultTextStyle, fontSize: 200 };
    const rect: Rect = { x: 0, y: 0, w: 1000, h: 300 };
    
    const result = detectOverflow('BIG', rect, largeStyle);
    
    expect(result.details).toBeDefined();
  });
});
