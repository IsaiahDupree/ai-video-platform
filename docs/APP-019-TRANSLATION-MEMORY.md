# APP-019: Translation Memory

## Overview

Translation Memory is a service that stores and reuses translations across locales, helping maintain consistency and reduce translation costs.

## Features

### Core Functionality

1. **Translation Storage**
   - Store source text and translated text pairs
   - Support multiple language pairs
   - Track usage statistics and quality metrics

2. **Exact Matching**
   - Find exact matches for previously translated text
   - Automatic reuse of existing translations
   - Usage count tracking

3. **Fuzzy Matching**
   - Find similar translations using Levenshtein distance
   - Configurable similarity threshold (default: 0.7)
   - Return multiple match suggestions

4. **Context Awareness**
   - Store context metadata (domain, field type, industry, tone)
   - Context-based match scoring
   - Improve match quality with context matching

5. **Quality Management**
   - Track translation quality (verified, unverified, machine, professional)
   - Track translation source (ai, manual, professional, import)
   - Support verification workflow

## API Reference

### TranslationMemoryService

```typescript
import { getTranslationMemoryService } from '../services/translations';

const tm = getTranslationMemoryService();
```

#### Add Translation

```typescript
const unit = await tm.addTranslation(
  'Get started today',
  'Empieza hoy',
  'en',
  'es',
  {
    context: {
      domain: 'marketing',
      fieldType: 'cta',
      tone: 'friendly',
    },
    metadata: {
      createdBy: 'user-123',
      quality: 'verified',
      source: 'professional',
    },
  }
);
```

#### Search for Matches

```typescript
const matches = await tm.search({
  sourceText: 'Get started now',
  sourceLanguage: 'en',
  targetLanguage: 'es',
  context: {
    domain: 'marketing',
    fieldType: 'cta',
  },
  minSimilarity: 0.7,
  maxResults: 5,
});

for (const match of matches) {
  console.log(`${match.matchType}: ${match.suggestion} (${match.similarity * 100}%)`);
}
```

#### Find Exact Match

```typescript
const exactMatch = await tm.findExactMatch('Get started today', 'en', 'es');
if (exactMatch) {
  console.log(`Found: ${exactMatch.targetText}`);
}
```

#### Update Translation

```typescript
const updated = await tm.updateTranslationUnit(unitId, {
  metadata: {
    ...unit.metadata,
    quality: 'professional',
  },
});
```

#### Bulk Import

```typescript
const result = await tm.importTranslations([
  {
    sourceText: 'Sign up free',
    targetText: 'Regístrate gratis',
    sourceLanguage: 'en',
    targetLanguage: 'es',
    context: { domain: 'marketing' },
    metadata: { createdBy: 'import', quality: 'verified', source: 'professional' },
  },
  // ... more translations
]);

console.log(`Imported: ${result.imported}, Skipped: ${result.skipped}`);
```

#### Export Translations

```typescript
const translations = await tm.exportTranslations('en', 'es');
console.log(`Exported ${translations.length} translations`);
```

#### Get Statistics

```typescript
const stats = await tm.getStats();
console.log(`Total units: ${stats.totalUnits}`);
console.log(`Total usage: ${stats.totalUsageCount}`);
console.log('By language pair:', stats.byLanguagePair);
console.log('By domain:', stats.byDomain);
console.log('Most used:', stats.mostUsedTranslations);
```

## Data Structure

### Translation Unit

```typescript
interface TranslationUnit {
  id: string;
  sourceText: string;
  targetText: string;
  sourceLanguage: string;
  targetLanguage: string;
  context?: {
    domain?: string;
    fieldType?: string;
    industry?: string;
    tone?: string;
  };
  metadata: {
    createdAt: string;
    createdBy: string;
    lastUsed?: string;
    usageCount: number;
    quality?: 'verified' | 'unverified' | 'machine' | 'professional';
    source?: 'ai' | 'manual' | 'professional' | 'import';
  };
  fingerprint?: string;
}
```

### Translation Match

```typescript
interface TranslationMatch {
  unit: TranslationUnit;
  matchType: 'exact' | 'fuzzy' | 'partial';
  similarity: number; // 0-1
  suggestion: string;
}
```

## Storage

Translation units are stored as JSON files in `data/translation-memory/`:

```
data/translation-memory/
  tu_1234567890_abc123.json
  tu_1234567891_def456.json
  ...
```

Each file contains a single translation unit with metadata.

## Similarity Matching

The service uses Levenshtein distance to calculate similarity between strings:

- **Exact match**: 100% similarity (source text identical)
- **Fuzzy match**: 90%+ similarity (minor differences)
- **Partial match**: 70-89% similarity (some differences)

Context matching provides bonus points:
- Domain match: +10%
- Field type match: +10%
- Industry match: +5%
- Tone match: +5%

## Usage Examples

### Example 1: Add and Reuse Translations

```typescript
// Add translation first time
const unit1 = await tm.addTranslation(
  'Buy now',
  'Comprar ahora',
  'en',
  'es'
);
console.log(`Usage count: ${unit1.metadata.usageCount}`); // 1

// Add same translation again - it will be reused
const unit2 = await tm.addTranslation(
  'Buy now',
  'Comprar ahora',
  'en',
  'es'
);
console.log(`Usage count: ${unit2.metadata.usageCount}`); // 2
console.log(`Same unit: ${unit1.id === unit2.id}`); // true
```

### Example 2: Find Similar Translations

```typescript
// Add base translations
await tm.addTranslation('Sign up today', 'Regístrate hoy', 'en', 'es');
await tm.addTranslation('Sign up now', 'Regístrate ahora', 'en', 'es');

// Search for similar text
const matches = await tm.search({
  sourceText: 'Sign up free',
  sourceLanguage: 'en',
  targetLanguage: 'es',
  minSimilarity: 0.6,
});

// Will find both similar translations with high similarity scores
```

### Example 3: Context-Aware Matching

```typescript
// Add translations with context
await tm.addTranslation(
  'Start',
  'Comenzar',
  'en',
  'es',
  { context: { domain: 'marketing', fieldType: 'cta' } }
);

await tm.addTranslation(
  'Start',
  'Iniciar',
  'en',
  'es',
  { context: { domain: 'technical', fieldType: 'button' } }
);

// Search with marketing context - will prefer "Comenzar"
const marketingMatches = await tm.search({
  sourceText: 'Start',
  sourceLanguage: 'en',
  targetLanguage: 'es',
  context: { domain: 'marketing' },
});

// Search with technical context - will prefer "Iniciar"
const technicalMatches = await tm.search({
  sourceText: 'Start',
  sourceLanguage: 'en',
  targetLanguage: 'es',
  context: { domain: 'technical' },
});
```

## Integration with Localization Service

Translation Memory complements the existing Localization Service (ADS-020):

```typescript
import { getLocalizationService } from '../services/localization';
import { getTranslationMemoryService } from '../services/translations';

const locService = getLocalizationService();
const tm = getTranslationMemoryService();

// When translating with AI, store results in translation memory
async function translateAndStore(request: TranslationRequest) {
  // Use localization service to translate
  const result = await locService.translateWithAI(request);

  // Store translations in memory for future reuse
  for (const translation of result.translations) {
    for (const field of translation.translations) {
      await tm.addTranslation(
        field.originalText,
        field.translatedText,
        request.sourceLanguage,
        translation.language,
        {
          context: {
            domain: request.context?.industry,
            tone: request.context?.tone,
          },
          metadata: {
            createdBy: 'ai-translation',
            quality: 'unverified',
            source: 'ai',
          },
        }
      );
    }
  }

  return result;
}

// When translating, check memory first
async function translateWithMemory(
  text: string,
  sourceLang: string,
  targetLang: string
) {
  // Check for exact match
  const exactMatch = await tm.findExactMatch(text, sourceLang, targetLang);
  if (exactMatch) {
    console.log('Using translation from memory');
    return exactMatch.targetText;
  }

  // Check for fuzzy matches
  const matches = await tm.search({
    sourceText: text,
    sourceLanguage: sourceLang,
    targetLanguage: targetLang,
    minSimilarity: 0.9,
    maxResults: 1,
  });

  if (matches.length > 0 && matches[0].similarity >= 0.95) {
    console.log('Using fuzzy match from memory');
    return matches[0].suggestion;
  }

  // No good match - translate with AI
  console.log('Translating with AI');
  // ... translate with AI and store result
}
```

## Testing

Run the test script:

```bash
npx tsx scripts/test-translation-memory.ts
```

The test script covers:
- Adding translations
- Finding exact matches
- Searching for similar translations
- Context-aware matching
- Updating translations
- Bulk importing
- Exporting translations
- Statistics
- Reusing translations
- Fuzzy matching

## Benefits

1. **Cost Reduction**: Reuse existing translations instead of retranslating
2. **Consistency**: Maintain consistent terminology across all content
3. **Speed**: Instant retrieval of previously translated text
4. **Quality**: Track and improve translation quality over time
5. **Context**: Better translations through context awareness
6. **Analytics**: Usage statistics to identify common translations

## Future Enhancements

- Machine learning-based similarity matching
- Translation glossary integration
- Multi-user collaboration
- Translation approval workflow
- Integration with professional translation services
- Real-time translation suggestions in UI
- Translation memory sharing across workspaces
- Support for translation variants (formal/informal, regional)
