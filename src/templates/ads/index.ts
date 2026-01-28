/**
 * Ad Template Library - ADS-002
 * Starter templates for common ad formats and industries
 */

import type { AdTemplate } from '../../types/adTemplate';

// Import all template JSON files
import appLaunch from './app-launch.json';
import ecommerceSale from './e-commerce-sale.json';
import saasPricing from './saas-pricing.json';
import testimonialQuote from './testimonial-quote.json';
import eventAnnouncement from './event-announcement.json';
import fitnessMotivation from './fitness-motivation.json';
import realEstateListing from './real-estate-listing.json';
import foodDelivery from './food-delivery.json';
import educationCourse from './education-course.json';
import podcastPromotion from './podcast-promotion.json';
import financeApp from './finance-app.json';
import travelDestination from './travel-destination.json';
import fashionCollection from './fashion-collection.json';
import nonprofitCause from './nonprofit-cause.json';
import gamingLaunch from './gaming-launch.json';
import healthcareService from './healthcare-service.json';
import automotiveDeal from './automotive-deal.json';
import beautyProduct from './beauty-product.json';
import coworkingSpace from './coworking-space.json';
import jobHiring from './job-hiring.json';
import insuranceQuote from './insurance-quote.json';

/**
 * All available starter templates
 */
export const STARTER_TEMPLATES: AdTemplate[] = [
  appLaunch,
  ecommerceSale,
  saasPricing,
  testimonialQuote,
  eventAnnouncement,
  fitnessMotivation,
  realEstateListing,
  foodDelivery,
  educationCourse,
  podcastPromotion,
  financeApp,
  travelDestination,
  fashionCollection,
  nonprofitCause,
  gamingLaunch,
  healthcareService,
  automotiveDeal,
  beautyProduct,
  coworkingSpace,
  jobHiring,
  insuranceQuote,
] as AdTemplate[];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): AdTemplate | undefined {
  return STARTER_TEMPLATES.find(t => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): AdTemplate[] {
  return STARTER_TEMPLATES.filter(t => t.metadata?.category === category);
}

/**
 * Get templates by industry
 */
export function getTemplatesByIndustry(industry: string): AdTemplate[] {
  return STARTER_TEMPLATES.filter(t => t.metadata?.industry === industry);
}

/**
 * Get templates by tag
 */
export function getTemplatesByTag(tag: string): AdTemplate[] {
  return STARTER_TEMPLATES.filter(t => t.metadata?.tags?.includes(tag));
}

/**
 * Get templates by layout type
 */
export function getTemplatesByLayout(layout: string): AdTemplate[] {
  return STARTER_TEMPLATES.filter(t => t.layout === layout);
}

/**
 * Get templates by platform
 */
export function getTemplatesByPlatform(platform: string): AdTemplate[] {
  return STARTER_TEMPLATES.filter(t => t.dimensions.platform === platform);
}

/**
 * Search templates by text (name, description, category)
 */
export function searchTemplates(query: string): AdTemplate[] {
  const lowerQuery = query.toLowerCase();
  return STARTER_TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description?.toLowerCase().includes(lowerQuery) ||
    t.metadata?.category?.toLowerCase().includes(lowerQuery) ||
    t.metadata?.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get all unique categories
 */
export function getAllCategories(): string[] {
  const categories = new Set<string>();
  STARTER_TEMPLATES.forEach(t => {
    if (t.metadata?.category) {
      categories.add(t.metadata.category);
    }
  });
  return Array.from(categories).sort();
}

/**
 * Get all unique industries
 */
export function getAllIndustries(): string[] {
  const industries = new Set<string>();
  STARTER_TEMPLATES.forEach(t => {
    if (t.metadata?.industry) {
      industries.add(t.metadata.industry);
    }
  });
  return Array.from(industries).sort();
}

/**
 * Get all unique tags
 */
export function getAllTags(): string[] {
  const tags = new Set<string>();
  STARTER_TEMPLATES.forEach(t => {
    t.metadata?.tags?.forEach(tag => tags.add(tag));
  });
  return Array.from(tags).sort();
}

/**
 * Template statistics
 */
export const TEMPLATE_STATS = {
  total: STARTER_TEMPLATES.length,
  byLayout: {
    'hero-text': STARTER_TEMPLATES.filter(t => t.layout === 'hero-text').length,
    'split-horizontal': STARTER_TEMPLATES.filter(t => t.layout === 'split-horizontal').length,
    'split-vertical': STARTER_TEMPLATES.filter(t => t.layout === 'split-vertical').length,
    'text-only': STARTER_TEMPLATES.filter(t => t.layout === 'text-only').length,
    'product-showcase': STARTER_TEMPLATES.filter(t => t.layout === 'product-showcase').length,
    'quote': STARTER_TEMPLATES.filter(t => t.layout === 'quote').length,
    'minimal': STARTER_TEMPLATES.filter(t => t.layout === 'minimal').length,
  },
  byPlatform: {
    'Instagram': STARTER_TEMPLATES.filter(t => t.dimensions.platform === 'Instagram').length,
    'Facebook': STARTER_TEMPLATES.filter(t => t.dimensions.platform === 'Facebook').length,
    'LinkedIn': STARTER_TEMPLATES.filter(t => t.dimensions.platform === 'LinkedIn').length,
    'Twitter': STARTER_TEMPLATES.filter(t => t.dimensions.platform === 'Twitter').length,
    'Pinterest': STARTER_TEMPLATES.filter(t => t.dimensions.platform === 'Pinterest').length,
  },
  categories: getAllCategories().length,
  industries: getAllIndustries().length,
  tags: getAllTags().length,
};
