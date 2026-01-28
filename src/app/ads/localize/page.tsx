'use client';

/**
 * ADS-020: Multi-language Localization
 * Main page for managing localized creative variants
 */

import React, { useState } from 'react';
import styles from './localize.module.css';
import { SUPPORTED_LANGUAGES } from '@/types/localization';

interface CreativeField {
  name: string;
  label: string;
  value: string;
}

const MOCK_CREATIVE_FIELDS: CreativeField[] = [
  { name: 'headline', label: 'Headline', value: 'Summer Sale - Up to 50% Off' },
  { name: 'subheadline', label: 'Subheadline', value: 'Limited Time Only' },
  { name: 'body', label: 'Body Copy', value: 'Get amazing deals on all your favorite products.' },
  { name: 'cta', label: 'Call to Action', value: 'Shop Now' },
];

interface Translation {
  language: string;
  fields: Record<string, string>;
  status: 'pending' | 'translating' | 'completed' | 'error';
  verified: boolean;
}

export default function LocalizePage() {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeTab, setActiveTab] = useState<'select' | 'translate' | 'review'>('select');

  const toggleLanguage = (code: string) => {
    setSelectedLanguages(prev =>
      prev.includes(code)
        ? prev.filter(l => l !== code)
        : [...prev, code]
    );
  };

  const startTranslation = async () => {
    setIsTranslating(true);
    setActiveTab('translate');

    // Initialize translations
    const newTranslations: Translation[] = selectedLanguages.map(lang => ({
      language: lang,
      fields: {},
      status: 'translating',
      verified: false,
    }));
    setTranslations(newTranslations);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock translations
    const completed: Translation[] = selectedLanguages.map((lang, idx) => ({
      language: lang,
      fields: {
        headline: `Translated headline in ${lang}`,
        subheadline: `Translated subheadline in ${lang}`,
        body: `Translated body copy in ${lang}`,
        cta: `Translated CTA in ${lang}`,
      },
      status: 'completed',
      verified: false,
    }));

    setTranslations(completed);
    setIsTranslating(false);
    setActiveTab('review');
  };

  const verifyTranslation = (language: string) => {
    setTranslations(prev =>
      prev.map(t =>
        t.language === language
          ? { ...t, verified: true }
          : t
      )
    );
  };

  const exportTranslations = () => {
    const exportData = translations.reduce((acc, t) => {
      acc[t.language] = t.fields;
      return acc;
    }, {} as Record<string, Record<string, string>>);

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translations-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Multi-language Localization</h1>
        <p>Create language variants for your creative</p>
      </header>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'select' ? styles.active : ''}`}
          onClick={() => setActiveTab('select')}
        >
          1. Select Languages
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'translate' ? styles.active : ''}`}
          onClick={() => setActiveTab('translate')}
          disabled={selectedLanguages.length === 0}
        >
          2. Translate
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'review' ? styles.active : ''}`}
          onClick={() => setActiveTab('review')}
          disabled={translations.length === 0}
        >
          3. Review & Export
        </button>
      </div>

      <div className={styles.content}>
        {/* Tab 1: Select Languages */}
        {activeTab === 'select' && (
          <div className={styles.selectTab}>
            <div className={styles.sourceCreative}>
              <h2>Source Creative (English)</h2>
              <div className={styles.fieldList}>
                {MOCK_CREATIVE_FIELDS.map(field => (
                  <div key={field.name} className={styles.field}>
                    <label>{field.label}</label>
                    <div className={styles.fieldValue}>{field.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.languageSelector}>
              <h2>Select Target Languages ({selectedLanguages.length})</h2>
              <div className={styles.languageGrid}>
                {SUPPORTED_LANGUAGES.filter(l => l.code !== 'en').map(lang => (
                  <button
                    key={lang.code}
                    className={`${styles.languageCard} ${
                      selectedLanguages.includes(lang.code) ? styles.selected : ''
                    }`}
                    onClick={() => toggleLanguage(lang.code)}
                  >
                    <div className={styles.languageCode}>{lang.code.toUpperCase()}</div>
                    <div className={styles.languageName}>{lang.name}</div>
                    <div className={styles.languageNative}>{lang.nativeName}</div>
                    {lang.direction === 'rtl' && (
                      <div className={styles.rtlBadge}>RTL</div>
                    )}
                  </button>
                ))}
              </div>

              <div className={styles.actions}>
                <button
                  className={styles.primaryButton}
                  onClick={startTranslation}
                  disabled={selectedLanguages.length === 0}
                >
                  Generate Translations ({selectedLanguages.length} languages)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Translate */}
        {activeTab === 'translate' && (
          <div className={styles.translateTab}>
            <h2>Generating Translations</h2>
            <p>Using AI to translate your creative into {selectedLanguages.length} languages...</p>

            <div className={styles.translationProgress}>
              {translations.map(t => (
                <div key={t.language} className={styles.translationItem}>
                  <div className={styles.languageInfo}>
                    <span className={styles.languageCode}>{t.language.toUpperCase()}</span>
                    <span className={styles.languageName}>
                      {SUPPORTED_LANGUAGES.find(l => l.code === t.language)?.name}
                    </span>
                  </div>
                  <div className={styles.status}>
                    {t.status === 'translating' && (
                      <span className={styles.statusTranslating}>Translating...</span>
                    )}
                    {t.status === 'completed' && (
                      <span className={styles.statusCompleted}>✓ Completed</span>
                    )}
                    {t.status === 'error' && (
                      <span className={styles.statusError}>✗ Error</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Review & Export */}
        {activeTab === 'review' && (
          <div className={styles.reviewTab}>
            <div className={styles.reviewHeader}>
              <h2>Review Translations</h2>
              <button className={styles.exportButton} onClick={exportTranslations}>
                Export All
              </button>
            </div>

            <div className={styles.translationsList}>
              {translations.map(t => {
                const lang = SUPPORTED_LANGUAGES.find(l => l.code === t.language);
                return (
                  <div key={t.language} className={styles.translationCard}>
                    <div className={styles.translationHeader}>
                      <div className={styles.languageInfo}>
                        <span className={styles.languageCode}>{t.language.toUpperCase()}</span>
                        <span className={styles.languageName}>{lang?.name}</span>
                        <span className={styles.languageNative}>({lang?.nativeName})</span>
                        {lang?.direction === 'rtl' && (
                          <span className={styles.rtlBadge}>RTL</span>
                        )}
                      </div>
                      <div className={styles.verifyButton}>
                        {t.verified ? (
                          <span className={styles.verified}>✓ Verified</span>
                        ) : (
                          <button
                            className={styles.verifyBtn}
                            onClick={() => verifyTranslation(t.language)}
                          >
                            Mark as Verified
                          </button>
                        )}
                      </div>
                    </div>

                    <div className={styles.fieldsComparison}>
                      {MOCK_CREATIVE_FIELDS.map(field => (
                        <div key={field.name} className={styles.fieldComparison}>
                          <div className={styles.fieldLabel}>{field.label}</div>
                          <div className={styles.originalText}>
                            <div className={styles.label}>Original (EN)</div>
                            <div className={styles.text}>{field.value}</div>
                          </div>
                          <div className={styles.translatedText}>
                            <div className={styles.label}>Translated ({t.language.toUpperCase()})</div>
                            <div className={styles.text} dir={lang?.direction}>
                              {t.fields[field.name] || 'Translation in progress...'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
