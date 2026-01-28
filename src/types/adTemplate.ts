/**
 * Ad Template Types - ADS-001
 * Type definitions for static ad templates using Remotion Still API
 */

// Import size presets from ADS-008
import { AD_SIZES_LEGACY, toAdDimensions, getSizeById } from '../config/adSizes';

/**
 * Ad dimensions (standard sizes)
 */
export interface AdDimensions {
  width: number;
  height: number;
  name: string;
  platform?: string;
}

/**
 * Common ad sizes
 * @deprecated Use AD_SIZES from ../config/adSizes for better organization
 * This is kept for backwards compatibility
 */
export const AD_SIZES: Record<string, AdDimensions> = AD_SIZES_LEGACY;

/**
 * Layout types for ad templates
 */
export type AdLayoutType =
  | 'hero-text'           // Large image with text overlay
  | 'split-horizontal'    // Left/right split
  | 'split-vertical'      // Top/bottom split
  | 'text-only'           // Text-focused with background
  | 'product-showcase'    // Product image with details
  | 'quote'               // Quote-style with attribution
  | 'minimal'             // Minimal text and logo
  | 'custom';             // Custom layout

/**
 * Text alignment options
 */
export type TextAlignment = 'left' | 'center' | 'right';

/**
 * Position options for elements
 */
export type ElementPosition = 'top-left' | 'top-center' | 'top-right' |
                               'center-left' | 'center' | 'center-right' |
                               'bottom-left' | 'bottom-center' | 'bottom-right';

/**
 * Ad content configuration
 */
export interface AdContent {
  // Text content
  headline?: string;
  subheadline?: string;
  body?: string;
  cta?: string;

  // Quote layout specific
  authorName?: string;
  authorTitle?: string;
  authorImage?: string;

  // Visual content
  backgroundImage?: string;
  backgroundColor?: string;
  gradient?: {
    from: string;
    to: string;
    direction?: 'to-right' | 'to-left' | 'to-top' | 'to-bottom' | 'to-br' | 'to-tr';
  };

  // Logo/Brand
  logo?: string;
  logoPosition?: ElementPosition;
  logoSize?: number;

  // Product/Feature image
  productImage?: string;
  productImagePosition?: ElementPosition;

  // Overlay
  overlayOpacity?: number;
  overlayColor?: string;
}

/**
 * Ad styling configuration
 */
export interface AdStyle {
  // Colors
  primaryColor?: string;
  secondaryColor?: string;
  textColor?: string;
  ctaBackgroundColor?: string;
  ctaTextColor?: string;

  // Typography
  headlineFont?: string;
  bodyFont?: string;
  headlineSize?: number;
  bodySize?: number;
  headlineFontWeight?: number | string;
  bodyFontWeight?: number | string;

  // Spacing
  padding?: number;
  gap?: number;

  // Borders
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;

  // Effects
  shadow?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
}

/**
 * Ad template configuration
 */
export interface AdTemplate {
  id: string;
  name: string;
  description?: string;
  layout: AdLayoutType;
  dimensions: AdDimensions;
  content: AdContent;
  style: AdStyle;
  metadata?: AdMetadata;
}

/**
 * Ad template metadata
 */
export interface AdMetadata {
  category?: string;
  tags?: string[];
  industry?: string;
  createdAt?: string;
  updatedAt?: string;
  author?: string;
  version?: string;
}

/**
 * Props for ad composition components
 */
export interface AdCompositionProps {
  template: AdTemplate;
}

/**
 * Text element props
 */
export interface TextElementProps {
  text: string;
  fontSize: number;
  fontWeight?: number | string;
  fontFamily?: string;
  color?: string;
  textAlign?: TextAlignment;
  lineHeight?: number;
  letterSpacing?: number;
  maxWidth?: number | string;
  marginBottom?: number;
}

/**
 * CTA Button props
 */
export interface CTAButtonProps {
  text: string;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: number | string;
  padding?: string;
  borderRadius?: number;
  shadow?: boolean;
}

/**
 * Image element props
 */
export interface ImageElementProps {
  src: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  opacity?: number;
  borderRadius?: number;
}

/**
 * Logo element props
 */
export interface LogoElementProps {
  src: string;
  alt?: string;
  size: number;
  position: ElementPosition;
  padding?: number;
}

/**
 * Type guard for AdTemplate
 */
export function isAdTemplate(obj: unknown): obj is AdTemplate {
  if (typeof obj !== 'object' || obj === null) return false;

  const template = obj as Partial<AdTemplate>;

  return (
    typeof template.id === 'string' &&
    typeof template.name === 'string' &&
    typeof template.layout === 'string' &&
    typeof template.dimensions === 'object' &&
    typeof template.content === 'object' &&
    typeof template.style === 'object'
  );
}

/**
 * Default ad style
 */
export const defaultAdStyle: AdStyle = {
  primaryColor: '#3b82f6',
  secondaryColor: '#8b5cf6',
  textColor: '#ffffff',
  ctaBackgroundColor: '#3b82f6',
  ctaTextColor: '#ffffff',
  headlineFont: 'Inter, system-ui, -apple-system, sans-serif',
  bodyFont: 'Inter, system-ui, -apple-system, sans-serif',
  headlineSize: 48,
  bodySize: 20,
  headlineFontWeight: 700,
  bodyFontWeight: 400,
  padding: 40,
  gap: 20,
  borderRadius: 8,
  shadow: true,
  shadowColor: 'rgba(0, 0, 0, 0.2)',
  shadowBlur: 20,
};

/**
 * Helper function to merge default style with custom style
 */
export function mergeAdStyle(customStyle: Partial<AdStyle> = {}): AdStyle {
  return {
    ...defaultAdStyle,
    ...customStyle,
  };
}
