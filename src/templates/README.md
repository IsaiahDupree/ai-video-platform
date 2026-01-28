# Ad Template Library

**ADS-002: Starter Template Library**

A comprehensive collection of 20+ professional ad templates for common formats, industries, and use cases.

## Overview

This library provides pre-built, production-ready ad templates that can be customized for various industries and platforms. Each template is carefully designed with attention to typography, color theory, and conversion-focused layouts.

## Template Count: 20

### By Layout Type
- **Hero Text** (6): Bold headlines with text overlays
- **Split Horizontal** (4): Left/right split layouts
- **Split Vertical** (2): Top/bottom split layouts
- **Text Only** (3): Text-focused designs
- **Product Showcase** (3): Product image with details
- **Quote** (2): Testimonial and quote styles
- **Minimal** (4): Clean, minimalist designs

### By Platform
- **Instagram**: 9 templates (Square, Story)
- **Facebook**: 5 templates (Feed, Square)
- **LinkedIn**: 4 templates (Square, Horizontal)
- **Twitter**: 2 templates (Post)
- **Pinterest**: 2 templates (Standard, Square)

### By Industry
- Technology (App Launch, SaaS)
- E-commerce (Sale, Fashion, Beauty)
- Health & Fitness (Workout, Healthcare)
- Real Estate (Property Listings, Coworking)
- Food & Beverage (Delivery, Restaurant)
- Education (Courses, Training)
- Media (Podcast, Gaming)
- Finance (Investment, Insurance)
- Travel & Hospitality (Destinations)
- Nonprofit (Cause Awareness)
- Automotive (Vehicle Sales)
- Human Resources (Job Recruitment)

## Template Categories

### 1. App Launch (`app-launch.json`)
- **Layout**: Hero Text
- **Platform**: Instagram Square (1080x1080)
- **Best For**: Mobile app launches, product announcements
- **Style**: Bold gradient with high-impact typography

### 2. E-commerce Sale (`e-commerce-sale.json`)
- **Layout**: Split Horizontal
- **Platform**: Facebook Feed (1200x628)
- **Best For**: Product sales, discounts, promotions
- **Style**: Product showcase with pricing

### 3. SaaS Pricing (`saas-pricing.json`)
- **Layout**: Minimal
- **Platform**: LinkedIn Square (1200x1200)
- **Best For**: B2B software, subscription services
- **Style**: Clean, professional, trust-building

### 4. Testimonial Quote (`testimonial-quote.json`)
- **Layout**: Quote
- **Platform**: Instagram Square (1080x1080)
- **Best For**: Social proof, customer reviews
- **Style**: Quote-focused with attribution

### 5. Event Announcement (`event-announcement.json`)
- **Layout**: Text Only
- **Platform**: Instagram Story (1080x1920)
- **Best For**: Webinars, launches, live events
- **Style**: Eye-catching with date/time

### 6. Fitness Motivation (`fitness-motivation.json`)
- **Layout**: Hero Text
- **Platform**: Instagram Story (1080x1920)
- **Best For**: Gym memberships, fitness programs
- **Style**: Energetic, high-intensity

### 7. Real Estate Listing (`real-estate-listing.json`)
- **Layout**: Product Showcase
- **Platform**: Facebook Feed (1200x628)
- **Best For**: Property listings, open houses
- **Style**: Professional with property details

### 8. Food Delivery (`food-delivery.json`)
- **Layout**: Split Vertical
- **Platform**: Instagram Square (1080x1080)
- **Best For**: Restaurant delivery, food apps
- **Style**: Appetizing with special offers

### 9. Education Course (`education-course.json`)
- **Layout**: Split Horizontal
- **Platform**: LinkedIn Horizontal (1200x627)
- **Best For**: Online courses, training programs
- **Style**: Educational, professional

### 10. Podcast Promotion (`podcast-promotion.json`)
- **Layout**: Minimal
- **Platform**: Instagram Square (1080x1080)
- **Best For**: Podcast episodes, audio content
- **Style**: Modern, content-focused

### 11. Finance App (`finance-app.json`)
- **Layout**: Text Only
- **Platform**: LinkedIn Square (1200x1200)
- **Best For**: Fintech, investment services
- **Style**: Trust-building, security-focused

### 12. Travel Destination (`travel-destination.json`)
- **Layout**: Hero Text
- **Platform**: Pinterest Standard (1000x1500)
- **Best For**: Travel packages, destinations
- **Style**: Inspiring, wanderlust-inducing

### 13. Fashion Collection (`fashion-collection.json`)
- **Layout**: Product Showcase
- **Platform**: Instagram Square (1080x1080)
- **Best For**: Clothing, boutiques, accessories
- **Style**: Elegant, style-forward

### 14. Nonprofit Cause (`nonprofit-cause.json`)
- **Layout**: Quote
- **Platform**: Twitter Post (1200x675)
- **Best For**: Charity campaigns, donations
- **Style**: Impactful, mission-driven

### 15. Gaming Launch (`gaming-launch.json`)
- **Layout**: Hero Text
- **Platform**: Twitter Post (1200x675)
- **Best For**: Game releases, esports
- **Style**: High-energy, epic

### 16. Healthcare Service (`healthcare-service.json`)
- **Layout**: Minimal
- **Platform**: Facebook Feed (1200x628)
- **Best For**: Telemedicine, medical services
- **Style**: Professional, trustworthy

### 17. Automotive Deal (`automotive-deal.json`)
- **Layout**: Split Horizontal
- **Platform**: Facebook Feed (1200x628)
- **Best For**: Car sales, dealership offers
- **Style**: Premium with financing details

### 18. Beauty Product (`beauty-product.json`)
- **Layout**: Product Showcase
- **Platform**: Pinterest Square (1000x1000)
- **Best For**: Cosmetics, skincare
- **Style**: Luxurious, elegant

### 19. Coworking Space (`coworking-space.json`)
- **Layout**: Split Vertical
- **Platform**: Instagram Square (1080x1080)
- **Best For**: Office spaces, remote work
- **Style**: Modern, professional

### 20. Job Hiring (`job-hiring.json`)
- **Layout**: Text Only
- **Platform**: LinkedIn Square (1200x1200)
- **Best For**: Job postings, recruitment
- **Style**: Professional, benefits-focused

### 21. Insurance Quote (`insurance-quote.json`)
- **Layout**: Minimal
- **Platform**: Facebook Feed (1200x628)
- **Best For**: Insurance services, quotes
- **Style**: Trustworthy, service-focused

## Usage

### Import Templates

```typescript
import {
  STARTER_TEMPLATES,
  getTemplateById,
  getTemplatesByCategory,
  getTemplatesByIndustry,
  searchTemplates
} from './src/templates/ads';

// Get all templates
const allTemplates = STARTER_TEMPLATES;

// Get specific template
const template = getTemplateById('app-launch-001');

// Filter by category
const ecommerceTemplates = getTemplatesByCategory('e-commerce');

// Search templates
const fitnessTemplates = searchTemplates('fitness');
```

### Customize Template

```typescript
import { getTemplateById } from './src/templates/ads';

const template = getTemplateById('app-launch-001');

// Customize content
const customized = {
  ...template,
  content: {
    ...template.content,
    headline: 'Your Custom Headline',
    subheadline: 'Your custom message',
    cta: 'Your CTA',
  },
  style: {
    ...template.style,
    primaryColor: '#yourcolor',
  }
};
```

## Template Features

### Typography
- System fonts for fast loading
- Multiple font weights for hierarchy
- Optimized sizes for readability
- Serif and sans-serif options

### Colors
- Carefully selected color palettes
- High contrast for readability
- Gradient support
- Platform-appropriate styling

### Layouts
- Conversion-focused designs
- Mobile-optimized layouts
- Clear visual hierarchy
- CTA prominence

### Metadata
- Industry categorization
- Searchable tags
- Version control
- Platform targeting

## Best Practices

### Choosing a Template
1. Match your industry and use case
2. Consider your target platform
3. Align with your brand style
4. Think about conversion goals

### Customizing Templates
1. Replace placeholder images with brand assets
2. Update colors to match brand guidelines
3. Adjust typography for brand consistency
4. Modify CTA text for specific campaigns

### Testing
1. Preview on target platform sizes
2. Check readability on mobile
3. Verify CTA visibility
4. Test different color variations

## Adding New Templates

To add new templates to the library:

1. Create JSON file in `src/templates/ads/`
2. Follow the `AdTemplate` type structure
3. Include metadata (category, tags, industry)
4. Import in `index.ts`
5. Add to `STARTER_TEMPLATES` array
6. Update this README

## Integration

Templates integrate seamlessly with:
- **ADS-001**: Static Ad Template System
- **ADS-003**: Brand Kit System (coming soon)
- **ADS-004**: Ad Editor UI (coming soon)
- **ADS-007**: renderStill Service (coming soon)

## Next Steps

Future enhancements:
- Template preview thumbnails
- Template variations (A/B testing)
- Industry-specific collections
- Seasonal template packs
- Custom template builder

## Support

For questions or template requests, see the project documentation or create an issue.
