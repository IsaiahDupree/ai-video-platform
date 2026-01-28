# ADS-020: Multi-language Localization

## Overview

The Multi-language Localization feature enables creating language variants for ad creatives. Users can translate their ads into multiple languages, manage translations, verify quality, and export localized content for international campaigns.

## Features

### Core Capabilities

1. **Language Support**
   - 20+ supported languages including English, Spanish, French, German, Japanese, Chinese, Arabic, and more
   - RTL (Right-to-Left) language support for Arabic and Hebrew
   - Native language names for better UX

2. **Translation Methods**
   - AI-powered translation using GPT-4
   - Manual translation input
   - Professional translation import
   - Batch translation for multiple languages

3. **Translation Management**
   - Create and store localized creative variants
   - Update and revise translations
   - Verify translations for quality assurance
   - Track translation metadata (translator, method, verification status)

4. **Brand Kit Override**
   - Override logos for specific locales
   - Customize fonts per language
   - Adjust colors for cultural preferences

5. **Export & Import**
   - Export all translations to JSON format
   - Import translations from external sources
   - Locale-organized file structure

## Architecture

### Type Definitions

```typescript
// Localized creative variant
interface LocalizedCreative {
  id: string;
  baseCreativeId: string;
  language: string; // ISO 639-1 code
  translations: TranslationField[];
  metadata: {
    translatedBy?: string;
    translatedAt: string;
    method: 'manual' | 'ai' | 'professional';
    verified: boolean;
    verifiedBy?: string;
    verifiedAt?: string;
  };
  brandKit?: {
    logo?: string;
    fonts?: Record<string, string>;
    colors?: Record<string, string>;
  };
}

// Translation field
interface TranslationField {
  fieldName: string;
  originalText: string;
  translatedText: string;
  notes?: string;
}
```

### Service Layer

The `LocalizationService` provides:

- **CRUD Operations**: Create, read, update, delete localized creatives
- **AI Translation**: Automatic translation using OpenAI GPT-4
- **Verification**: Mark translations as verified
- **Statistics**: Track translation progress and status
- **Import/Export**: Exchange translations with external systems

### Data Storage

- File-based storage in `data/localizations/`
- Each localized creative stored as JSON file
- Configuration stored in `data/localizations/config.json`

## Usage

### Basic Usage

```typescript
import { LocalizationService } from '@/services/localization';

const service = new LocalizationService();

// Create a manual translation
const localized = await service.createLocalizedCreative(
  'creative_001',
  'es',
  [
    {
      fieldName: 'headline',
      originalText: 'Summer Sale',
      translatedText: 'Venta de Verano',
    },
    {
      fieldName: 'cta',
      originalText: 'Shop Now',
      translatedText: 'Comprar Ahora',
    },
  ],
  {
    translatedBy: 'John Doe',
    translatedAt: new Date().toISOString(),
    method: 'manual',
    verified: false,
  }
);

// Get all translations for a creative
const variants = service.getLocalizedCreatives('creative_001');

// Get translation for a specific language
const spanish = service.getLocalizedCreativeByLanguage('creative_001', 'es');
```

### AI Translation

```typescript
// Translate using AI
const result = await service.translateWithAI({
  creativeId: 'creative_001',
  sourceLanguage: 'en',
  targetLanguages: ['es', 'fr', 'de', 'ja'],
  fields: {
    headline: 'Summer Sale - Up to 50% Off',
    subheadline: 'Limited Time Only',
    body: 'Get amazing deals on all your favorite products.',
    cta: 'Shop Now',
  },
  context: {
    industry: 'E-commerce',
    tone: 'urgent',
    audience: 'Fashion enthusiasts',
  },
});

// Check for errors
if (result.errors) {
  console.error('Translation errors:', result.errors);
}

// Access translations
console.log(`Translated to ${result.translations.length} languages`);
```

### Verification

```typescript
// Verify a translation
const verified = service.verifyTranslation('localized_id', 'Jane Smith');

console.log(verified.metadata.verified); // true
console.log(verified.metadata.verifiedBy); // 'Jane Smith'
```

### Statistics

```typescript
// Get translation statistics
const stats = service.getTranslationStats('creative_001');

console.log(`Total translations: ${stats.total}`);
console.log(`Verified: ${stats.verified}`);
console.log(`Unverified: ${stats.unverified}`);
console.log(`Languages: ${stats.languages.join(', ')}`);
console.log(`AI translations: ${stats.byMethod.ai}`);
console.log(`Manual translations: ${stats.byMethod.manual}`);
```

### Import/Export

```typescript
// Export all translations
const exported = service.exportTranslations('creative_001');

// Structure: { language: { fieldName: translatedText } }
console.log(exported.es.headline); // Spanish headline
console.log(exported.fr.cta); // French CTA

// Import translations
const imported = await service.importTranslations(
  'creative_002',
  {
    ja: {
      headline: '夏のセール',
      cta: '今すぐ購入',
    },
    ko: {
      headline: '여름 세일',
      cta: '지금 쇼핑하기',
    },
  },
  {
    translatedBy: 'Professional Translation Service',
    method: 'professional',
    verified: true,
  }
);
```

## UI Components

### Localize Page

Located at `/ads/localize`, the localization page provides a 3-step workflow:

#### Step 1: Select Languages

- View source creative fields
- Browse 20+ supported languages
- Select multiple target languages
- Visual language cards with native names
- RTL language indicators

#### Step 2: Translate

- Real-time translation progress
- Status indicators per language
- AI-powered translation using GPT-4
- Automatic fallback handling

#### Step 3: Review & Export

- Side-by-side comparison of original and translated text
- RTL text display for Arabic and Hebrew
- Verification controls
- Export all translations to JSON

### Component Integration

```typescript
import { SUPPORTED_LANGUAGES, getLanguage, isRTL } from '@/types/localization';

// Get language info
const spanish = getLanguage('es');
console.log(spanish.name); // 'Spanish'
console.log(spanish.nativeName); // 'Español'

// Check text direction
if (isRTL('ar')) {
  // Apply RTL styling
}

// List all languages
SUPPORTED_LANGUAGES.forEach(lang => {
  console.log(`${lang.code}: ${lang.name} (${lang.nativeName})`);
});
```

## Supported Languages

| Code | Name | Native Name | Direction |
|------|------|-------------|-----------|
| en | English | English | LTR |
| es | Spanish | Español | LTR |
| fr | French | Français | LTR |
| de | German | Deutsch | LTR |
| it | Italian | Italiano | LTR |
| pt | Portuguese | Português | LTR |
| nl | Dutch | Nederlands | LTR |
| pl | Polish | Polski | LTR |
| ru | Russian | Русский | LTR |
| ja | Japanese | 日本語 | LTR |
| ko | Korean | 한국어 | LTR |
| zh | Chinese (Simplified) | 简体中文 | LTR |
| zh-TW | Chinese (Traditional) | 繁體中文 | LTR |
| ar | Arabic | العربية | RTL |
| he | Hebrew | עברית | RTL |
| hi | Hindi | हिन्दी | LTR |
| th | Thai | ไทย | LTR |
| vi | Vietnamese | Tiếng Việt | LTR |
| id | Indonesian | Bahasa Indonesia | LTR |
| tr | Turkish | Türkçe | LTR |

## Configuration

### Environment Variables

```bash
# Required for AI translation
OPENAI_API_KEY=your_openai_api_key
```

### Localization Config

```typescript
import { getLocalizationConfig, setLocalizationConfig } from '@/services/localization';

// Get current config
const config = getLocalizationConfig();

// Update config
setLocalizationConfig({
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'es', 'fr', 'de', 'ja', 'zh'],
  autoTranslate: false,
  requireVerification: true,
});
```

## Testing

Run the comprehensive test suite:

```bash
npx ts-node scripts/test-localization.ts
```

### Test Coverage

- ✅ Language utilities (getLanguage, isRTL, etc.)
- ✅ Create localized creative
- ✅ Get localized creative by ID
- ✅ Get localized creatives by base ID
- ✅ Get by language
- ✅ Multiple language variants
- ✅ Update localized creative
- ✅ Verify translation
- ✅ Translation statistics
- ✅ Export translations
- ✅ Import translations
- ✅ Delete localized creative
- ✅ Delete all localized creatives
- ✅ RTL language support
- ✅ Brand kit override

## Best Practices

### Translation Quality

1. **Provide Context**: Include industry, tone, and audience information for better AI translations
2. **Verify Translations**: Always have translations verified by native speakers
3. **Consider Cultural Differences**: Adjust messaging for cultural appropriateness
4. **Test RTL Languages**: Ensure proper display of RTL text in your designs

### Performance

1. **Batch Translations**: Translate multiple languages in a single request
2. **Cache Results**: Store translations to avoid redundant API calls
3. **Lazy Load**: Only load translations when needed

### Data Management

1. **Regular Backups**: Export translations regularly
2. **Version Control**: Track changes to translations over time
3. **Clean Up**: Remove unused translations to save storage

## Integration with Other Features

### With Ad Editor

```typescript
// In ad editor, show language selector
const languages = service.getLocalizedCreatives(creativeId);

// Load translation for selected language
const translation = service.getLocalizedCreativeByLanguage(creativeId, selectedLanguage);

// Apply translations to template
template.headline = translation.translations.find(t => t.fieldName === 'headline')?.translatedText;
```

### With Campaign Generator

```typescript
// Generate campaign pack with multiple languages
const languages = ['en', 'es', 'fr', 'de'];

for (const language of languages) {
  const translation = service.getLocalizedCreativeByLanguage(creativeId, language);

  // Generate campaign with translated content
  await generateCampaign({
    ...campaign,
    language,
    translations: translation.translations,
  });
}
```

### With Render Queue

```typescript
// Queue render jobs for each language
const languages = service.getLocalizedCreatives(creativeId);

for (const localized of languages) {
  await renderQueue.addJob({
    creativeId,
    language: localized.language,
    translations: localized.translations,
  });
}
```

## Roadmap

### Future Enhancements

- [ ] Translation memory and glossary
- [ ] Machine translation quality scoring
- [ ] Integration with professional translation services
- [ ] Collaborative translation workflow
- [ ] Translation cost estimation
- [ ] A/B testing for translations
- [ ] Auto-detection of source language
- [ ] Translation suggestions based on similar creatives
- [ ] Character count validation per locale
- [ ] Locale-specific character restrictions

## Troubleshooting

### OpenAI API Errors

If AI translation fails:

1. Check OPENAI_API_KEY is set correctly
2. Verify API key has sufficient credits
3. Check rate limits and quota
4. Review error messages in console

### RTL Display Issues

If RTL text doesn't display correctly:

1. Ensure `dir="rtl"` is set on text elements
2. Check CSS `direction` property
3. Verify font supports RTL characters
4. Test with actual RTL content

### Storage Issues

If translations don't save:

1. Check `data/localizations/` directory exists
2. Verify write permissions
3. Check disk space
4. Review console for file system errors

## Related Features

- **ADS-015**: AI Variant Generator - Generates copy variants
- **ADS-016**: Approval Workflow - Review and approve translations
- **ADS-011**: Campaign Pack Generator - Generate campaigns for multiple languages
- **ADS-004**: Ad Editor UI - Edit and preview localized creatives

## Support

For issues or questions:

1. Check the test suite for usage examples
2. Review the type definitions for API details
3. Consult the main documentation
4. Contact the development team

---

**Status**: ✅ Complete
**Version**: 1.0
**Last Updated**: January 28, 2026
