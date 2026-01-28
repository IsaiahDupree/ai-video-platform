/**
 * ADS-020: Multi-language Localization
 * Type definitions for multi-language support
 */

export interface Language {
  code: string; // ISO 639-1 code (e.g., 'en', 'es', 'fr', 'de', 'ja', 'zh')
  name: string; // Display name (e.g., 'English', 'Spanish', 'French')
  nativeName: string; // Native name (e.g., 'English', 'Español', 'Français')
  direction: 'ltr' | 'rtl'; // Text direction
}

export interface TranslationField {
  fieldName: string; // Field name (e.g., 'headline', 'subheadline', 'body', 'cta')
  originalText: string; // Original text in source language
  translatedText: string; // Translated text
  notes?: string; // Optional notes about the translation
}

export interface LocalizedCreative {
  id: string; // Unique ID for the localized creative
  baseCreativeId: string; // Reference to the base creative
  language: string; // Language code (ISO 639-1)
  translations: TranslationField[]; // Array of translated fields
  metadata: {
    translatedBy?: string; // Person/service who translated
    translatedAt: string; // ISO timestamp
    method: 'manual' | 'ai' | 'professional'; // Translation method
    verified: boolean; // Whether translation has been verified
    verifiedBy?: string; // Person who verified
    verifiedAt?: string; // ISO timestamp
  };
  brandKit?: {
    // Override brand kit for locale-specific assets
    logo?: string;
    fonts?: Record<string, string>;
    colors?: Record<string, string>;
  };
}

export interface TranslationRequest {
  creativeId: string;
  sourceLanguage: string;
  targetLanguages: string[];
  fields: Record<string, string>; // Field name -> original text mapping
  method?: 'ai' | 'manual'; // Default: 'ai'
  context?: {
    // Additional context for better translations
    industry?: string;
    tone?: 'professional' | 'casual' | 'friendly' | 'urgent';
    audience?: string;
    brandVoice?: string;
  };
}

export interface TranslationResponse {
  translations: LocalizedCreative[];
  errors?: {
    language: string;
    error: string;
  }[];
}

export interface LocalizationConfig {
  defaultLanguage: string; // Default/source language
  supportedLanguages: string[]; // Array of supported language codes
  autoTranslate: boolean; // Whether to auto-translate on creative creation
  requireVerification: boolean; // Whether translations need verification
}

// Supported languages with metadata
export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', direction: 'ltr' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', direction: 'ltr' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', direction: 'ltr' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', direction: 'ltr' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', direction: 'ltr' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', direction: 'ltr' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文', direction: 'ltr' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', direction: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', direction: 'rtl' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', direction: 'ltr' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', direction: 'ltr' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', direction: 'ltr' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', direction: 'ltr' },
];

export function getLanguage(code: string): Language | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

export function getLanguageName(code: string): string {
  const lang = getLanguage(code);
  return lang ? lang.name : code;
}

export function getLanguageNativeName(code: string): string {
  const lang = getLanguage(code);
  return lang ? lang.nativeName : code;
}

export function isRTL(code: string): boolean {
  const lang = getLanguage(code);
  return lang ? lang.direction === 'rtl' : false;
}
