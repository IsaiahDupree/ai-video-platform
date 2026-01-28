/**
 * Screenshot Template Library - APP-022
 * Pre-built templates for common screenshot styles
 */

import type {
  ScreenshotTemplate,
  TemplateFilterOptions,
  TemplateStatistics,
  ScreenshotCategory,
  ScreenshotLayoutType,
  ScreenshotTheme,
} from '../../types/screenshotTemplate';
import type { DeviceType } from '../../types/deviceFrame';

// Import all template JSON files
import featureHighlightHero from './feature-highlight-hero.json';
import featureListMulti from './feature-list-multi.json';
import minimalBottom from './minimal-bottom.json';
import testimonialCenter from './testimonial-center.json';
import tutorialStep from './tutorial-step.json';
import comparisonSideBySide from './comparison-sidebyside.json';
import badgeFeature from './badge-feature.json';
import marketingGradient from './marketing-gradient.json';
import onboardingWelcome from './onboarding-welcome.json';
import technicalSpecs from './technical-specs.json';

/**
 * All available screenshot templates
 */
export const SCREENSHOT_TEMPLATES: ScreenshotTemplate[] = [
  featureHighlightHero,
  featureListMulti,
  minimalBottom,
  testimonialCenter,
  tutorialStep,
  comparisonSideBySide,
  badgeFeature,
  marketingGradient,
  onboardingWelcome,
  technicalSpecs,
] as ScreenshotTemplate[];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): ScreenshotTemplate | undefined {
  return SCREENSHOT_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(
  category: ScreenshotCategory
): ScreenshotTemplate[] {
  return SCREENSHOT_TEMPLATES.filter((t) => t.metadata?.category === category);
}

/**
 * Get templates by layout type
 */
export function getTemplatesByLayout(
  layout: ScreenshotLayoutType
): ScreenshotTemplate[] {
  return SCREENSHOT_TEMPLATES.filter((t) => t.layoutType === layout);
}

/**
 * Get templates by theme
 */
export function getTemplatesByTheme(
  theme: ScreenshotTheme
): ScreenshotTemplate[] {
  return SCREENSHOT_TEMPLATES.filter((t) =>
    t.metadata?.themes?.includes(theme)
  );
}

/**
 * Get templates by device type
 */
export function getTemplatesByDeviceType(
  deviceType: DeviceType
): ScreenshotTemplate[] {
  return SCREENSHOT_TEMPLATES.filter((t) =>
    t.metadata?.supportedDeviceTypes?.includes(deviceType)
  );
}

/**
 * Get templates by tag
 */
export function getTemplatesByTag(tag: string): ScreenshotTemplate[] {
  return SCREENSHOT_TEMPLATES.filter((t) => t.metadata?.tags?.includes(tag));
}

/**
 * Get templates by industry
 */
export function getTemplatesByIndustry(industry: string): ScreenshotTemplate[] {
  return SCREENSHOT_TEMPLATES.filter(
    (t) => t.metadata?.industry?.includes(industry)
  );
}

/**
 * Get featured templates
 */
export function getFeaturedTemplates(): ScreenshotTemplate[] {
  return SCREENSHOT_TEMPLATES.filter((t) => t.metadata?.featured === true);
}

/**
 * Get popular templates (sorted by popularity)
 */
export function getPopularTemplates(limit?: number): ScreenshotTemplate[] {
  const sorted = [...SCREENSHOT_TEMPLATES].sort(
    (a, b) => (b.metadata?.popularity || 0) - (a.metadata?.popularity || 0)
  );
  return limit ? sorted.slice(0, limit) : sorted;
}

/**
 * Search templates by text (name, description, tags, use case)
 */
export function searchTemplates(query: string): ScreenshotTemplate[] {
  const lowerQuery = query.toLowerCase();
  return SCREENSHOT_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description?.toLowerCase().includes(lowerQuery) ||
      t.metadata?.category?.toLowerCase().includes(lowerQuery) ||
      t.metadata?.useCase?.toLowerCase().includes(lowerQuery) ||
      t.metadata?.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Filter templates with multiple criteria
 */
export function filterTemplates(
  options: TemplateFilterOptions
): ScreenshotTemplate[] {
  let results = [...SCREENSHOT_TEMPLATES];

  // Filter by category
  if (options.category) {
    const categories = Array.isArray(options.category)
      ? options.category
      : [options.category];
    results = results.filter((t) => categories.includes(t.metadata.category));
  }

  // Filter by layout type
  if (options.layoutType) {
    const layouts = Array.isArray(options.layoutType)
      ? options.layoutType
      : [options.layoutType];
    results = results.filter((t) => layouts.includes(t.layoutType));
  }

  // Filter by theme
  if (options.themes) {
    const themes = Array.isArray(options.themes)
      ? options.themes
      : [options.themes];
    results = results.filter((t) =>
      themes.some((theme) => t.metadata.themes.includes(theme))
    );
  }

  // Filter by device type
  if (options.deviceTypes) {
    const deviceTypes = Array.isArray(options.deviceTypes)
      ? options.deviceTypes
      : [options.deviceTypes];
    results = results.filter((t) =>
      deviceTypes.some((dt) => t.metadata.supportedDeviceTypes.includes(dt))
    );
  }

  // Filter by tags
  if (options.tags) {
    const tags = Array.isArray(options.tags) ? options.tags : [options.tags];
    results = results.filter((t) =>
      tags.some((tag) => t.metadata.tags.includes(tag))
    );
  }

  // Filter by industry
  if (options.industry) {
    const industries = Array.isArray(options.industry)
      ? options.industry
      : [options.industry];
    results = results.filter((t) =>
      industries.some(
        (ind) => t.metadata.industry && t.metadata.industry.includes(ind)
      )
    );
  }

  // Filter by featured
  if (options.featured !== undefined) {
    results = results.filter((t) => t.metadata.featured === options.featured);
  }

  // Search query
  if (options.searchQuery) {
    results = searchTemplates(options.searchQuery).filter((t) =>
      results.includes(t)
    );
  }

  return results;
}

/**
 * Get all unique categories
 */
export function getAllCategories(): ScreenshotCategory[] {
  const categories = new Set<ScreenshotCategory>();
  SCREENSHOT_TEMPLATES.forEach((t) => {
    if (t.metadata?.category) {
      categories.add(t.metadata.category);
    }
  });
  return Array.from(categories).sort();
}

/**
 * Get all unique layout types
 */
export function getAllLayoutTypes(): ScreenshotLayoutType[] {
  const layouts = new Set<ScreenshotLayoutType>();
  SCREENSHOT_TEMPLATES.forEach((t) => {
    layouts.add(t.layoutType);
  });
  return Array.from(layouts).sort();
}

/**
 * Get all unique themes
 */
export function getAllThemes(): ScreenshotTheme[] {
  const themes = new Set<ScreenshotTheme>();
  SCREENSHOT_TEMPLATES.forEach((t) => {
    t.metadata?.themes?.forEach((theme) => themes.add(theme));
  });
  return Array.from(themes).sort();
}

/**
 * Get all unique device types
 */
export function getAllDeviceTypes(): DeviceType[] {
  const deviceTypes = new Set<DeviceType>();
  SCREENSHOT_TEMPLATES.forEach((t) => {
    t.metadata?.supportedDeviceTypes?.forEach((dt) => deviceTypes.add(dt));
  });
  return Array.from(deviceTypes).sort();
}

/**
 * Get all unique industries
 */
export function getAllIndustries(): string[] {
  const industries = new Set<string>();
  SCREENSHOT_TEMPLATES.forEach((t) => {
    t.metadata?.industry?.forEach((ind) => industries.add(ind));
  });
  return Array.from(industries).sort();
}

/**
 * Get all unique tags
 */
export function getAllTags(): string[] {
  const tags = new Set<string>();
  SCREENSHOT_TEMPLATES.forEach((t) => {
    t.metadata?.tags?.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort();
}

/**
 * Get template statistics
 */
export function getTemplateStatistics(): TemplateStatistics {
  const categories: Record<ScreenshotCategory, number> = {
    'feature-showcase': 0,
    tutorial: 0,
    testimonial: 0,
    onboarding: 0,
    marketing: 0,
    technical: 0,
    minimal: 0,
    comparison: 0,
    'social-proof': 0,
  };

  const layoutTypes: Record<ScreenshotLayoutType, number> = {
    'single-caption': 0,
    'multi-caption': 0,
    hero: 0,
    minimal: 0,
    testimonial: 0,
    comparison: 0,
    tutorial: 0,
    custom: 0,
  };

  const themes: Record<ScreenshotTheme, number> = {
    light: 0,
    dark: 0,
    auto: 0,
  };

  const deviceTypes: Record<DeviceType, number> = {
    iphone: 0,
    ipad: 0,
    mac: 0,
    watch: 0,
    tv: 0,
    vision: 0,
  };

  SCREENSHOT_TEMPLATES.forEach((t) => {
    // Count categories
    if (t.metadata.category) {
      categories[t.metadata.category] =
        (categories[t.metadata.category] || 0) + 1;
    }

    // Count layout types
    layoutTypes[t.layoutType] = (layoutTypes[t.layoutType] || 0) + 1;

    // Count themes
    t.metadata.themes?.forEach((theme) => {
      themes[theme] = (themes[theme] || 0) + 1;
    });

    // Count device types
    t.metadata.supportedDeviceTypes?.forEach((dt) => {
      deviceTypes[dt] = (deviceTypes[dt] || 0) + 1;
    });
  });

  // Get most popular and recently added
  const sortedByPopularity = [...SCREENSHOT_TEMPLATES].sort(
    (a, b) => (b.metadata?.popularity || 0) - (a.metadata?.popularity || 0)
  );
  const mostPopular = sortedByPopularity.slice(0, 5).map((t) => t.id);

  const sortedByDate = [...SCREENSHOT_TEMPLATES].sort((a, b) => {
    const dateA = a.metadata?.createdAt
      ? new Date(a.metadata.createdAt).getTime()
      : 0;
    const dateB = b.metadata?.createdAt
      ? new Date(b.metadata.createdAt).getTime()
      : 0;
    return dateB - dateA;
  });
  const recentlyAdded = sortedByDate.slice(0, 5).map((t) => t.id);

  return {
    totalTemplates: SCREENSHOT_TEMPLATES.length,
    categories,
    layoutTypes,
    themes,
    deviceTypes,
    mostPopular,
    recentlyAdded,
  };
}

/**
 * Export template statistics
 */
export const TEMPLATE_STATS = getTemplateStatistics();
