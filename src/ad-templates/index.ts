/**
 * Ad Templates Module
 * 
 * AI-powered ad creative templating system with Remotion.
 * 
 * Features:
 * - Pixel-accurate template DSL
 * - Text, Image, and Shape layers
 * - Variant generation for A/B testing
 * - Remotion Still rendering
 * - AI-powered layout extraction from static ads
 */

// Schema & Types
export * from './schema/template-dsl';

// Renderer Components (renamed to avoid conflicts with types)
export { TemplateRenderer } from './renderer/TemplateRenderer';
export { TextLayer as TextLayerComponent } from './renderer/layers/TextLayer';
export { ImageLayer as ImageLayerComponent } from './renderer/layers/ImageLayer';
export { ShapeLayer as ShapeLayerComponent } from './renderer/layers/ShapeLayer';

// Renderer Utilities
export * from './renderer/utils';

// Compositions
export * from './compositions';

// Variant Generation
export * from './variants';

// AI Extraction
export * from './extraction';

// Testing
export * from './testing';
