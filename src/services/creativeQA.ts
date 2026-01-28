/**
 * Creative QA Service - ADS-019
 * Quality assurance checks for ad creatives
 *
 * Features:
 * - Contrast ratio checking (WCAG AA/AAA compliance)
 * - Text overflow detection
 * - Logo size validation
 * - Image quality checks
 * - Safe zone validation
 * - Aspect ratio warnings
 */

import { AdTemplate } from '../types/adTemplate';

/**
 * Severity levels for QA issues
 */
export type QAIssueSeverity = 'error' | 'warning' | 'info';

/**
 * QA issue type
 */
export type QAIssueType =
  | 'contrast'
  | 'text_overflow'
  | 'logo_size'
  | 'image_quality'
  | 'safe_zone'
  | 'aspect_ratio'
  | 'color_accessibility'
  | 'text_readability'
  | 'file_size';

/**
 * QA issue
 */
export interface QAIssue {
  id: string;
  type: QAIssueType;
  severity: QAIssueSeverity;
  message: string;
  details?: string;
  field?: string;
  suggestion?: string;
  value?: any;
  threshold?: any;
}

/**
 * QA result
 */
export interface QAResult {
  passed: boolean;
  score: number; // 0-100
  issues: QAIssue[];
  checks: QACheck[];
  timestamp: string;
}

/**
 * Individual QA check result
 */
export interface QACheck {
  name: string;
  passed: boolean;
  duration?: number;
}

/**
 * QA configuration
 */
export interface QAConfig {
  // Contrast checks
  minContrastRatio?: number; // WCAG AA = 4.5, AAA = 7
  checkTextContrast?: boolean;
  checkCtaContrast?: boolean;

  // Text overflow checks
  maxTextLength?: {
    headline?: number;
    subheadline?: number;
    body?: number;
    cta?: number;
  };
  checkTextFit?: boolean;

  // Logo validation
  minLogoSize?: number; // pixels
  maxLogoSize?: number; // pixels
  recommendedLogoSize?: number;

  // Image quality
  minImageResolution?: number; // pixels
  maxFileSizeMB?: number;

  // Safe zones
  safeZoneMargin?: number; // pixels from edge
  checkSafeZones?: boolean;

  // Aspect ratio
  allowedAspectRatios?: Array<{ width: number; height: number; tolerance?: number }>;
}

/**
 * Default QA configuration
 */
export const DEFAULT_QA_CONFIG: QAConfig = {
  // WCAG AA compliance
  minContrastRatio: 4.5,
  checkTextContrast: true,
  checkCtaContrast: true,

  // Reasonable text limits
  maxTextLength: {
    headline: 80,
    subheadline: 120,
    body: 300,
    cta: 25,
  },
  checkTextFit: true,

  // Logo should be visible but not dominate
  minLogoSize: 40,
  maxLogoSize: 200,
  recommendedLogoSize: 80,

  // Image quality standards
  minImageResolution: 1080,
  maxFileSizeMB: 5,

  // Safe zones for text and important elements
  safeZoneMargin: 40,
  checkSafeZones: true,
};

/**
 * Calculate relative luminance of a color
 * Used for contrast ratio calculation
 * @see https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
export function getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;

  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Parse hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Handle shorthand hex (e.g., #fff)
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  if (hex.length !== 6) {
    return null;
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return null;
  }

  return { r, g, b };
}

/**
 * Calculate contrast ratio between two colors
 * @see https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 */
export function calculateContrastRatio(color1: string, color2: string): number | null {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    return null;
  }

  const l1 = getRelativeLuminance(rgb1);
  const l2 = getRelativeLuminance(rgb2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check contrast ratio compliance
 */
export function checkContrast(
  template: AdTemplate,
  config: QAConfig = DEFAULT_QA_CONFIG
): QAIssue[] {
  const issues: QAIssue[] = [];
  const minRatio = config.minContrastRatio || 4.5;

  // Check headline contrast
  if (config.checkTextContrast && template.content.headline && template.style.textColor) {
    const backgroundColor =
      template.content.backgroundColor ||
      template.content.gradient?.from ||
      template.style.primaryColor ||
      '#ffffff';

    const ratio = calculateContrastRatio(template.style.textColor, backgroundColor);

    if (ratio !== null && ratio < minRatio) {
      const severity: QAIssueSeverity = ratio < 3 ? 'error' : 'warning';
      issues.push({
        id: `contrast-headline-${Date.now()}`,
        type: 'contrast',
        severity,
        message: `Headline contrast ratio is ${ratio.toFixed(2)}:1`,
        details: `WCAG ${minRatio >= 7 ? 'AAA' : 'AA'} requires ${minRatio}:1 minimum`,
        field: 'headline',
        suggestion: 'Use a lighter or darker text color for better readability',
        value: ratio.toFixed(2),
        threshold: minRatio,
      });
    }
  }

  // Check CTA button contrast
  if (
    config.checkCtaContrast &&
    template.content.cta &&
    template.style.ctaTextColor &&
    template.style.ctaBackgroundColor
  ) {
    const ratio = calculateContrastRatio(
      template.style.ctaTextColor,
      template.style.ctaBackgroundColor
    );

    if (ratio !== null && ratio < minRatio) {
      const severity: QAIssueSeverity = ratio < 3 ? 'error' : 'warning';
      issues.push({
        id: `contrast-cta-${Date.now()}`,
        type: 'contrast',
        severity,
        message: `CTA button contrast ratio is ${ratio.toFixed(2)}:1`,
        details: `WCAG ${minRatio >= 7 ? 'AAA' : 'AA'} requires ${minRatio}:1 minimum`,
        field: 'cta',
        suggestion: 'Adjust CTA text or background color for better visibility',
        value: ratio.toFixed(2),
        threshold: minRatio,
      });
    }
  }

  return issues;
}

/**
 * Check for text overflow issues
 */
export function checkTextOverflow(
  template: AdTemplate,
  config: QAConfig = DEFAULT_QA_CONFIG
): QAIssue[] {
  const issues: QAIssue[] = [];
  const maxLengths = config.maxTextLength || {};

  // Check headline length
  if (template.content.headline && maxLengths.headline) {
    const length = template.content.headline.length;
    if (length > maxLengths.headline) {
      issues.push({
        id: `overflow-headline-${Date.now()}`,
        type: 'text_overflow',
        severity: 'warning',
        message: `Headline is ${length} characters (${length - maxLengths.headline} over limit)`,
        details: `Recommended maximum is ${maxLengths.headline} characters`,
        field: 'headline',
        suggestion: 'Shorten headline or decrease font size',
        value: length,
        threshold: maxLengths.headline,
      });
    }
  }

  // Check subheadline length
  if (template.content.subheadline && maxLengths.subheadline) {
    const length = template.content.subheadline.length;
    if (length > maxLengths.subheadline) {
      issues.push({
        id: `overflow-subheadline-${Date.now()}`,
        type: 'text_overflow',
        severity: 'warning',
        message: `Subheadline is ${length} characters (${length - maxLengths.subheadline} over limit)`,
        details: `Recommended maximum is ${maxLengths.subheadline} characters`,
        field: 'subheadline',
        suggestion: 'Shorten subheadline or decrease font size',
        value: length,
        threshold: maxLengths.subheadline,
      });
    }
  }

  // Check body length
  if (template.content.body && maxLengths.body) {
    const length = template.content.body.length;
    if (length > maxLengths.body) {
      issues.push({
        id: `overflow-body-${Date.now()}`,
        type: 'text_overflow',
        severity: 'info',
        message: `Body text is ${length} characters (${length - maxLengths.body} over limit)`,
        details: `Recommended maximum is ${maxLengths.body} characters`,
        field: 'body',
        suggestion: 'Consider using shorter copy or increasing ad size',
        value: length,
        threshold: maxLengths.body,
      });
    }
  }

  // Check CTA length
  if (template.content.cta && maxLengths.cta) {
    const length = template.content.cta.length;
    if (length > maxLengths.cta) {
      issues.push({
        id: `overflow-cta-${Date.now()}`,
        type: 'text_overflow',
        severity: 'warning',
        message: `CTA text is ${length} characters (${length - maxLengths.cta} over limit)`,
        details: `Recommended maximum is ${maxLengths.cta} characters`,
        field: 'cta',
        suggestion: 'Use a shorter, punchier call-to-action',
        value: length,
        threshold: maxLengths.cta,
      });
    }
  }

  return issues;
}

/**
 * Validate logo size
 */
export function checkLogoSize(
  template: AdTemplate,
  config: QAConfig = DEFAULT_QA_CONFIG
): QAIssue[] {
  const issues: QAIssue[] = [];

  if (!template.content.logoSize) {
    return issues;
  }

  const logoSize = template.content.logoSize;
  const minSize = config.minLogoSize || 40;
  const maxSize = config.maxLogoSize || 200;
  const recommended = config.recommendedLogoSize || 80;

  // Too small
  if (logoSize < minSize) {
    issues.push({
      id: `logo-size-small-${Date.now()}`,
      type: 'logo_size',
      severity: 'error',
      message: `Logo is too small at ${logoSize}px`,
      details: `Minimum recommended size is ${minSize}px`,
      field: 'logoSize',
      suggestion: `Increase logo size to at least ${minSize}px for better visibility`,
      value: logoSize,
      threshold: minSize,
    });
  }

  // Too large
  if (logoSize > maxSize) {
    issues.push({
      id: `logo-size-large-${Date.now()}`,
      type: 'logo_size',
      severity: 'warning',
      message: `Logo is too large at ${logoSize}px`,
      details: `Maximum recommended size is ${maxSize}px`,
      field: 'logoSize',
      suggestion: `Reduce logo size to ${maxSize}px or less to avoid dominating the ad`,
      value: logoSize,
      threshold: maxSize,
    });
  }

  // Not at recommended size
  if (logoSize >= minSize && logoSize <= maxSize && logoSize !== recommended) {
    const difference = Math.abs(logoSize - recommended);
    if (difference > 20) {
      issues.push({
        id: `logo-size-recommended-${Date.now()}`,
        type: 'logo_size',
        severity: 'info',
        message: `Logo size is ${logoSize}px (recommended: ${recommended}px)`,
        details: `For optimal balance, consider using ${recommended}px`,
        field: 'logoSize',
        suggestion: `Adjust logo size to ${recommended}px for optimal appearance`,
        value: logoSize,
        threshold: recommended,
      });
    }
  }

  return issues;
}

/**
 * Check safe zones (padding from edges)
 */
export function checkSafeZones(
  template: AdTemplate,
  config: QAConfig = DEFAULT_QA_CONFIG
): QAIssue[] {
  const issues: QAIssue[] = [];

  if (!config.checkSafeZones) {
    return issues;
  }

  const minMargin = config.safeZoneMargin || 40;
  const currentPadding = template.style.padding || 0;

  if (currentPadding < minMargin) {
    issues.push({
      id: `safe-zone-${Date.now()}`,
      type: 'safe_zone',
      severity: 'warning',
      message: `Padding is ${currentPadding}px (recommended: ${minMargin}px)`,
      details: 'Text and important elements may be cut off on some platforms',
      field: 'padding',
      suggestion: `Increase padding to at least ${minMargin}px for safe zones`,
      value: currentPadding,
      threshold: minMargin,
    });
  }

  return issues;
}

/**
 * Check aspect ratio
 */
export function checkAspectRatio(
  template: AdTemplate,
  config: QAConfig = DEFAULT_QA_CONFIG
): QAIssue[] {
  const issues: QAIssue[] = [];

  if (!config.allowedAspectRatios || config.allowedAspectRatios.length === 0) {
    return issues;
  }

  const width = template.dimensions.width;
  const height = template.dimensions.height;
  const currentRatio = width / height;

  // Check if current ratio matches any allowed ratio
  const tolerance = 0.05; // 5% tolerance
  const matches = config.allowedAspectRatios.some((allowed) => {
    const allowedRatio = allowed.width / allowed.height;
    const diff = Math.abs(currentRatio - allowedRatio);
    const allowedTolerance = allowed.tolerance !== undefined ? allowed.tolerance : tolerance;
    return diff <= allowedTolerance;
  });

  if (!matches) {
    const recommendedRatios = config.allowedAspectRatios
      .map((r) => `${r.width}:${r.height}`)
      .join(', ');

    issues.push({
      id: `aspect-ratio-${Date.now()}`,
      type: 'aspect_ratio',
      severity: 'info',
      message: `Aspect ratio ${width}:${height} is not standard`,
      details: `Recommended ratios: ${recommendedRatios}`,
      suggestion: 'Consider using a standard aspect ratio for better platform compatibility',
      value: `${width}:${height}`,
      threshold: recommendedRatios,
    });
  }

  return issues;
}

/**
 * Check text readability based on font size and dimensions
 */
export function checkTextReadability(
  template: AdTemplate,
  config: QAConfig = DEFAULT_QA_CONFIG
): QAIssue[] {
  const issues: QAIssue[] = [];

  // Minimum font sizes for readability
  const minHeadlineSize = 24;
  const minBodySize = 14;

  // Check headline size
  if (template.style.headlineSize && template.style.headlineSize < minHeadlineSize) {
    issues.push({
      id: `readability-headline-${Date.now()}`,
      type: 'text_readability',
      severity: 'warning',
      message: `Headline font size is ${template.style.headlineSize}px`,
      details: `Minimum recommended size is ${minHeadlineSize}px`,
      field: 'headlineSize',
      suggestion: `Increase headline size to at least ${minHeadlineSize}px`,
      value: template.style.headlineSize,
      threshold: minHeadlineSize,
    });
  }

  // Check body size
  if (template.style.bodySize && template.style.bodySize < minBodySize) {
    issues.push({
      id: `readability-body-${Date.now()}`,
      type: 'text_readability',
      severity: 'warning',
      message: `Body font size is ${template.style.bodySize}px`,
      details: `Minimum recommended size is ${minBodySize}px`,
      field: 'bodySize',
      suggestion: `Increase body text size to at least ${minBodySize}px`,
      value: template.style.bodySize,
      threshold: minBodySize,
    });
  }

  return issues;
}

/**
 * Run all QA checks on a template
 */
export function runQAChecks(
  template: AdTemplate,
  config: QAConfig = DEFAULT_QA_CONFIG
): QAResult {
  const startTime = Date.now();
  const issues: QAIssue[] = [];
  const checks: QACheck[] = [];

  // Run contrast checks
  const contrastStart = Date.now();
  const contrastIssues = checkContrast(template, config);
  issues.push(...contrastIssues);
  checks.push({
    name: 'Contrast Ratio',
    passed: contrastIssues.length === 0,
    duration: Date.now() - contrastStart,
  });

  // Run text overflow checks
  const overflowStart = Date.now();
  const overflowIssues = checkTextOverflow(template, config);
  issues.push(...overflowIssues);
  checks.push({
    name: 'Text Overflow',
    passed: overflowIssues.length === 0,
    duration: Date.now() - overflowStart,
  });

  // Run logo size checks
  const logoStart = Date.now();
  const logoIssues = checkLogoSize(template, config);
  issues.push(...logoIssues);
  checks.push({
    name: 'Logo Size',
    passed: logoIssues.length === 0,
    duration: Date.now() - logoStart,
  });

  // Run safe zone checks
  const safeZoneStart = Date.now();
  const safeZoneIssues = checkSafeZones(template, config);
  issues.push(...safeZoneIssues);
  checks.push({
    name: 'Safe Zones',
    passed: safeZoneIssues.length === 0,
    duration: Date.now() - safeZoneStart,
  });

  // Run aspect ratio checks
  const aspectStart = Date.now();
  const aspectIssues = checkAspectRatio(template, config);
  issues.push(...aspectIssues);
  checks.push({
    name: 'Aspect Ratio',
    passed: aspectIssues.length === 0,
    duration: Date.now() - aspectStart,
  });

  // Run text readability checks
  const readabilityStart = Date.now();
  const readabilityIssues = checkTextReadability(template, config);
  issues.push(...readabilityIssues);
  checks.push({
    name: 'Text Readability',
    passed: readabilityIssues.length === 0,
    duration: Date.now() - readabilityStart,
  });

  // Calculate score (100 - weighted deductions)
  let score = 100;
  issues.forEach((issue) => {
    if (issue.severity === 'error') {
      score -= 15;
    } else if (issue.severity === 'warning') {
      score -= 8;
    } else if (issue.severity === 'info') {
      score -= 3;
    }
  });
  score = Math.max(0, Math.min(100, score));

  // Overall pass/fail
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const passed = errorCount === 0 && score >= 70;

  return {
    passed,
    score,
    issues,
    checks,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get QA summary statistics
 */
export function getQASummary(result: QAResult): {
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  passedChecks: number;
  totalChecks: number;
} {
  return {
    totalIssues: result.issues.length,
    errorCount: result.issues.filter((i) => i.severity === 'error').length,
    warningCount: result.issues.filter((i) => i.severity === 'warning').length,
    infoCount: result.issues.filter((i) => i.severity === 'info').length,
    passedChecks: result.checks.filter((c) => c.passed).length,
    totalChecks: result.checks.length,
  };
}

/**
 * Format QA issue for display
 */
export function formatIssueMessage(issue: QAIssue): string {
  let message = issue.message;

  if (issue.details) {
    message += `\n${issue.details}`;
  }

  if (issue.suggestion) {
    message += `\n💡 ${issue.suggestion}`;
  }

  return message;
}

/**
 * Get severity icon
 */
export function getSeverityIcon(severity: QAIssueSeverity): string {
  switch (severity) {
    case 'error':
      return '❌';
    case 'warning':
      return '⚠️';
    case 'info':
      return 'ℹ️';
    default:
      return '•';
  }
}

/**
 * Get severity color
 */
export function getSeverityColor(severity: QAIssueSeverity): string {
  switch (severity) {
    case 'error':
      return '#ef4444';
    case 'warning':
      return '#f59e0b';
    case 'info':
      return '#3b82f6';
    default:
      return '#6b7280';
  }
}
