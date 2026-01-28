/**
 * Screenshot Template Types
 *
 * Pre-built templates for common screenshot styles.
 * Templates combine device frames and caption overlays for quick screenshot creation.
 */

import { DeviceType, DeviceModel, Orientation } from './deviceFrame';
import { CaptionConfig } from './captionOverlay';
import { FrameStyle } from './deviceFrame';

/**
 * Screenshot template layout types
 */
export type ScreenshotLayoutType =
  | 'single-caption'      // Single caption layer (typical for feature highlights)
  | 'multi-caption'       // Multiple caption layers (feature lists, tutorials)
  | 'hero'                // Large hero caption with focus
  | 'minimal'             // Clean design with subtle text
  | 'testimonial'         // Centered quote or testimonial
  | 'comparison'          // Side-by-side captions (before/after, feature comparison)
  | 'tutorial'            // Sequential steps with numbered captions
  | 'custom';             // Custom layout with non-standard configurations

/**
 * Screenshot template category
 */
export type ScreenshotCategory =
  | 'feature-showcase'    // Highlight product features
  | 'tutorial'            // Step-by-step guides
  | 'testimonial'         // Customer quotes and reviews
  | 'onboarding'          // Welcome and setup screens
  | 'marketing'           // Promotional and campaign screenshots
  | 'technical'           // Technical details and specs
  | 'minimal'             // Clean, simple designs
  | 'comparison'          // Before/after, feature comparisons
  | 'social-proof';       // Reviews, ratings, badges

/**
 * Theme type for templates
 */
export type ScreenshotTheme = 'light' | 'dark' | 'auto';

/**
 * Device configuration for template
 */
export interface TemplateDeviceConfig {
  device: DeviceModel;
  orientation: Orientation;
  style?: FrameStyle;
}

/**
 * Screenshot template metadata
 */
export interface ScreenshotTemplateMetadata {
  category: ScreenshotCategory;
  tags: string[];
  supportedDeviceTypes: DeviceType[];
  themes: ScreenshotTheme[];
  useCase: string;
  industry?: string[];
  version: string;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  popularity?: number;           // Usage count or rating
  featured?: boolean;             // Highlighted in UI
}

/**
 * Screenshot template definition
 */
export interface ScreenshotTemplate {
  id: string;
  name: string;
  description: string;

  // Device and frame configuration
  deviceConfig: TemplateDeviceConfig;

  // Caption layers (0 or more)
  captionLayers: CaptionConfig[];

  // Layout type
  layoutType: ScreenshotLayoutType;

  // Background color for screenshot (if no image provided)
  backgroundColor?: string;

  // Example screenshot URL (for preview)
  previewImageUrl?: string;

  // Metadata
  metadata: ScreenshotTemplateMetadata;
}

/**
 * Template search/filter options
 */
export interface TemplateFilterOptions {
  category?: ScreenshotCategory | ScreenshotCategory[];
  tags?: string | string[];
  layoutType?: ScreenshotLayoutType | ScreenshotLayoutType[];
  deviceTypes?: DeviceType | DeviceType[];
  themes?: ScreenshotTheme | ScreenshotTheme[];
  industry?: string | string[];
  featured?: boolean;
  searchQuery?: string;
}

/**
 * Template application options
 */
export interface ApplyTemplateOptions {
  templateId: string;

  // Override caption text
  captionText?: Record<string, string>;  // Key: caption ID, Value: new text

  // Override device configuration
  device?: DeviceModel;
  orientation?: Orientation;

  // Screenshot image URL
  screenshotUrl?: string;

  // Override theme
  theme?: ScreenshotTheme;

  // Localization
  locale?: string;
}

/**
 * Template customization result
 */
export interface CustomizedTemplate {
  template: ScreenshotTemplate;
  appliedOptions: ApplyTemplateOptions;
  finalDeviceConfig: TemplateDeviceConfig;
  finalCaptionLayers: CaptionConfig[];
}

/**
 * Template statistics
 */
export interface TemplateStatistics {
  totalTemplates: number;
  categories: Record<ScreenshotCategory, number>;
  layoutTypes: Record<ScreenshotLayoutType, number>;
  themes: Record<ScreenshotTheme, number>;
  deviceTypes: Record<DeviceType, number>;
  mostPopular: string[];
  recentlyAdded: string[];
}
