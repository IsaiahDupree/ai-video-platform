/**
 * Template System for HeyGen-style Video Generation
 *
 * Pre-built templates for common use cases:
 * - Product Demos: Showcase features and benefits
 * - Tutorial Videos: Step-by-step instructions
 * - Social Media Ads: Viral hooks and CTAs
 * - News-style Presentations: Formal announcements
 */

import { GeneratorInput } from '../../scripts/generate-brief';
import { ContentBrief } from '../types';

// =============================================================================
// Types
// =============================================================================

export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  category: 'product-demo' | 'tutorial' | 'social-ad' | 'news';
  defaultDuration: number; // seconds
  requireFields: string[]; // Required input fields
  optionalFields: string[];
  aspectRatio: '9:16' | '16:9' | '1:1';
  theme: string;
  examples: string[];
}

export interface TemplateInput {
  templateId: string;
  title: string;
  subtitle?: string;
  content: Record<string, any>;
  outputDir?: string;
  quality?: 'preview' | 'production';
}

export interface TemplateResult {
  templateId: string;
  generatorInput: GeneratorInput;
  brief: ContentBrief;
}

// =============================================================================
// Template Definitions
// =============================================================================

export const PRODUCT_DEMO_TEMPLATE: TemplateConfig = {
  id: 'product-demo',
  name: 'Product Demo',
  description: 'Showcase product features and benefits with engaging visuals',
  category: 'product-demo',
  defaultDuration: 60,
  requireFields: ['productName', 'features'],
  optionalFields: ['companyName', 'cta', 'uniqueAngle'],
  aspectRatio: '16:9',
  theme: 'dark',
  examples: [
    'AI productivity tool with 3 key features',
    'SaaS platform demo with use case highlights',
    'Mobile app showcase with interaction flows',
  ],
};

export const TUTORIAL_TEMPLATE: TemplateConfig = {
  id: 'tutorial',
  name: 'Tutorial Video',
  description: 'Step-by-step instructional content with code/UI examples',
  category: 'tutorial',
  defaultDuration: 180,
  requireFields: ['topic', 'steps'],
  optionalFields: ['difficulty', 'targetAudience', 'tools'],
  aspectRatio: '16:9',
  theme: 'dark',
  examples: [
    'How to build a React component (beginner)',
    'Advanced TypeScript patterns (intermediate)',
    'Deploying to AWS (step-by-step)',
  ],
};

export const SOCIAL_AD_TEMPLATE: TemplateConfig = {
  id: 'social-ad',
  name: 'Social Media Ad',
  description: 'Viral hooks, fast cuts, and compelling CTAs for social platforms',
  category: 'social-ad',
  defaultDuration: 30,
  requireFields: ['hook', 'painPoint', 'solution', 'cta'],
  optionalFields: ['targetAudience', 'testimonial'],
  aspectRatio: '9:16',
  theme: 'neon',
  examples: [
    'Awareness: Hook about common problem',
    'Interest: Solution with social proof',
    'Action: Limited-time offer with CTA',
  ],
};

export const NEWS_TEMPLATE: TemplateConfig = {
  id: 'news-presentation',
  name: 'News-style Presentation',
  description: 'Professional announcements with data visualization',
  category: 'news',
  defaultDuration: 120,
  requireFields: ['headline', 'keyPoints'],
  optionalFields: ['data', 'quotes', 'callToAction'],
  aspectRatio: '16:9',
  theme: 'light',
  examples: [
    'Product launch announcement',
    'Company milestone celebration',
    'Industry trend report',
  ],
};

// =============================================================================
// Template Processors
// =============================================================================

export function processProductDemoTemplate(input: TemplateInput): GeneratorInput {
  const { title, subtitle, content } = input;

  if (!content.productName || !content.features) {
    throw new Error('Product Demo requires: productName, features (array)');
  }

  const topics = [
    `${content.productName}: Powerful ${content.uniqueAngle || 'solution'}`,
    ...content.features.map((f: string, i: number) => {
      const [featureName, ...description] = f.split(':');
      return `Feature ${i + 1}: ${featureName.trim()}. ${description.join(':').trim() || ''}`;
    }),
    content.cta ? `Get Started: ${content.cta}` : 'Ready to transform your workflow?',
  ];

  return {
    format: 'explainer_v1',
    title: content.productName,
    subtitle: content.companyName || 'See What\'s Possible',
    topics,
    theme: 'dark',
    durationPerTopic: 5,
    ctaText: content.cta || 'Visit our website today',
  };
}

export function processTutorialTemplate(input: TemplateInput): GeneratorInput {
  const { content } = input;

  if (!content.topic || !content.steps || !Array.isArray(content.steps)) {
    throw new Error('Tutorial requires: topic (string), steps (array)');
  }

  const difficulty = content.difficulty || 'Intermediate';
  const topics = [
    `${content.topic}: ${difficulty} Level`,
    'What you\'ll learn today',
    ...content.steps.map((step: string, i: number) => `Step ${i + 1}: ${step}`),
    'Next steps: Practice and explore further',
  ];

  return {
    format: 'explainer_v1',
    title: content.topic,
    subtitle: `${difficulty} Tutorial`,
    topics,
    theme: 'dark',
    durationPerTopic: 8,
    ctaText: 'Subscribe for more tutorials',
  };
}

export function processSocialAdTemplate(input: TemplateInput): GeneratorInput {
  const { content } = input;

  if (!content.hook || !content.solution || !content.cta) {
    throw new Error('Social Ad requires: hook, painPoint, solution, cta');
  }

  const topics = [
    `💥 ${content.hook}`,
    `😩 ${content.painPoint || 'The problem?'}`,
    `✨ ${content.solution}`,
    `🚀 ${content.testimonial || 'Join thousands of happy users'}`,
    `👉 ${content.cta}`,
  ];

  return {
    format: 'shorts_v1',
    title: content.hook.substring(0, 50),
    subtitle: 'Limited time only',
    topics,
    theme: 'neon',
    durationPerTopic: 4,
    ctaText: content.cta,
  };
}

export function processNewsTemplate(input: TemplateInput): GeneratorInput {
  const { title, content } = input;

  if (!content.headline || !content.keyPoints || !Array.isArray(content.keyPoints)) {
    throw new Error('News Template requires: headline (string), keyPoints (array)');
  }

  const topics = [
    `📰 ${content.headline}`,
    'Key Highlights:',
    ...content.keyPoints.map((point: string, i: number) => `${i + 1}. ${point}`),
    content.data ? `📊 By the Numbers: ${content.data}` : 'The impact of this news',
    content.quotes ? `"${content.quotes}"` : 'Industry perspectives',
    content.callToAction || 'Learn more at our website',
  ];

  return {
    format: 'explainer_v1',
    title: content.headline.substring(0, 50),
    subtitle: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    topics,
    theme: 'light',
    durationPerTopic: 6,
    ctaText: content.callToAction || 'Read the full story',
  };
}

// =============================================================================
// Template Registry
// =============================================================================

const templateProcessors: Record<string, (input: TemplateInput) => GeneratorInput> = {
  'product-demo': processProductDemoTemplate,
  'tutorial': processTutorialTemplate,
  'social-ad': processSocialAdTemplate,
  'news-presentation': processNewsTemplate,
};

const templateConfigs: Record<string, TemplateConfig> = {
  'product-demo': PRODUCT_DEMO_TEMPLATE,
  'tutorial': TUTORIAL_TEMPLATE,
  'social-ad': SOCIAL_AD_TEMPLATE,
  'news-presentation': NEWS_TEMPLATE,
};

/**
 * Get template configuration
 */
export function getTemplateConfig(templateId: string): TemplateConfig | null {
  return templateConfigs[templateId] || null;
}

/**
 * List all available templates
 */
export function listTemplates(): TemplateConfig[] {
  return Object.values(templateConfigs);
}

/**
 * List templates by category
 */
export function listTemplatesByCategory(category: string): TemplateConfig[] {
  return Object.values(templateConfigs).filter(t => t.category === category);
}

/**
 * Generate content from template
 */
export function generateFromTemplate(input: TemplateInput): GeneratorInput {
  const { templateId } = input;

  const processor = templateProcessors[templateId];
  if (!processor) {
    throw new Error(`Unknown template: ${templateId}`);
  }

  // Validate required fields
  const config = templateConfigs[templateId];
  if (config) {
    const missingFields = config.requireFields.filter(
      field => !input.content || !input.content[field]
    );

    if (missingFields.length > 0) {
      throw new Error(
        `Template "${config.name}" requires: ${missingFields.join(', ')}`
      );
    }
  }

  return processor(input);
}

/**
 * Validate template input
 */
export function validateTemplateInput(input: TemplateInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.templateId) {
    errors.push('templateId is required');
  }

  if (!input.title) {
    errors.push('title is required');
  }

  if (!input.content || typeof input.content !== 'object') {
    errors.push('content must be an object');
  }

  const config = templateConfigs[input.templateId];
  if (config && input.content) {
    const missingFields = config.requireFields.filter(field => !input.content[field]);
    if (missingFields.length > 0) {
      errors.push(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default {
  getTemplateConfig,
  listTemplates,
  listTemplatesByCategory,
  generateFromTemplate,
  validateTemplateInput,
};
