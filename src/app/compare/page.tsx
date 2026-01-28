'use client';

/**
 * APP-013: Locale Comparison View
 * Side-by-side comparison of screenshots across locales
 */

import { useState, useEffect } from 'react';
import type { Asset, AppInfo } from '@/types/assetLibrary';
import type { AppStoreLocale } from '@/types/localeExport';
import styles from './compare.module.css';

// Locale metadata
interface LocaleInfo {
  code: AppStoreLocale;
  name: string;
  nativeName: string;
  flag: string;
}

const LOCALE_INFO: LocaleInfo[] = [
  { code: 'en-US', name: 'English (US)', nativeName: 'English', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (UK)', nativeName: 'English', flag: '🇬🇧' },
  { code: 'en-AU', name: 'English (Australia)', nativeName: 'English', flag: '🇦🇺' },
  { code: 'en-CA', name: 'English (Canada)', nativeName: 'English', flag: '🇨🇦' },
  { code: 'es-ES', name: 'Spanish (Spain)', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'es-MX', name: 'Spanish (Mexico)', nativeName: 'Español', flag: '🇲🇽' },
  { code: 'fr-FR', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'fr-CA', name: 'French (Canada)', nativeName: 'Français', flag: '🇨🇦' },
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'zh-Hans', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'zh-Hant', name: 'Chinese (Traditional)', nativeName: '繁體中文', flag: '🇹🇼' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'ar-SA', name: 'Arabic (Saudi Arabia)', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'nl-NL', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', flag: '🇸🇰' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', flag: '🇭🇷' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català', flag: '🏴' },
];

export default function LocaleComparePage() {
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedLocales, setSelectedLocales] = useState<AppStoreLocale[]>(['en-US', 'es-ES', 'fr-FR']);
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load apps on mount (mock data for now)
  useEffect(() => {
    loadApps();
  }, []);

  // Load assets when app changes
  useEffect(() => {
    if (selectedAppId) {
      loadAssets(selectedAppId);
    }
  }, [selectedAppId]);

  const loadApps = async () => {
    setLoading(true);
    // Mock app data
    const mockApps: AppInfo[] = [
      {
        id: 'app-1',
        name: 'MyAwesomeApp',
        bundleId: 'com.example.myapp',
        platform: 'ios',
        description: 'An awesome iOS app',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    setApps(mockApps);
    if (mockApps.length > 0) {
      setSelectedAppId(mockApps[0].id);
    }
    setLoading(false);
  };

  const loadAssets = async (appId: string) => {
    setLoading(true);
    // Mock asset data with different locales
    const mockAssets: Asset[] = [];
    const locales: AppStoreLocale[] = ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'ja', 'zh-Hans'];
    const deviceTypes = ['iPhone', 'iPad'];

    locales.forEach((locale, localeIdx) => {
      deviceTypes.forEach((deviceType, deviceIdx) => {
        for (let i = 1; i <= 3; i++) {
          mockAssets.push({
            id: `asset-${locale}-${deviceType}-${i}`,
            appId,
            name: `Screenshot ${i} - ${locale}`,
            description: `${deviceType} screenshot for ${locale}`,
            type: 'screenshot',
            status: 'approved',
            filePath: `/mock/screenshots/${locale}/${deviceType}/${i}.png`,
            fileName: `screenshot-${i}.png`,
            fileSize: 1024 * 500,
            mimeType: 'image/png',
            format: 'png',
            width: 1290,
            height: 2796,
            locale,
            deviceType,
            tags: [deviceType, locale],
            version: 1,
            versionHistory: [],
            createdAt: new Date(Date.now() - localeIdx * 1000000).toISOString(),
            updatedAt: new Date(Date.now() - localeIdx * 1000000).toISOString(),
          });
        }
      });
    });

    setAssets(mockAssets);
    setLoading(false);
  };

  const toggleLocale = (locale: AppStoreLocale) => {
    if (selectedLocales.includes(locale)) {
      setSelectedLocales(selectedLocales.filter(l => l !== locale));
    } else {
      setSelectedLocales([...selectedLocales, locale]);
    }
  };

  const getLocaleName = (code: AppStoreLocale): string => {
    const info = LOCALE_INFO.find(l => l.code === code);
    return info ? `${info.flag} ${info.name}` : code;
  };

  const getAvailableLocales = (): AppStoreLocale[] => {
    const locales = new Set<AppStoreLocale>();
    assets.forEach(asset => {
      if (asset.locale) {
        locales.add(asset.locale);
      }
    });
    return Array.from(locales).sort();
  };

  const getFilteredAssets = (): Record<AppStoreLocale, Asset[]> => {
    const filtered: Record<string, Asset[]> = {};

    selectedLocales.forEach(locale => {
      filtered[locale] = assets.filter(asset => {
        if (asset.locale !== locale) return false;
        if (asset.type !== 'screenshot') return false;
        if (deviceTypeFilter !== 'all' && asset.deviceType !== deviceTypeFilter) return false;
        return true;
      }).sort((a, b) => a.name.localeCompare(b.name));
    });

    return filtered;
  };

  const getDeviceTypes = (): string[] => {
    const types = new Set<string>();
    assets.forEach(asset => {
      if (asset.deviceType) {
        types.add(asset.deviceType);
      }
    });
    return ['all', ...Array.from(types).sort()];
  };

  const filteredAssets = getFilteredAssets();
  const availableLocales = getAvailableLocales();
  const deviceTypes = getDeviceTypes();

  // Get max screenshots across all locales for navigation
  const maxScreenshots = Math.max(
    ...selectedLocales.map(locale => filteredAssets[locale]?.length || 0),
    1
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Locale Comparison</h1>
        <p>Compare screenshots across different locales side-by-side</p>
      </header>

      <div className={styles.controls}>
        {/* App Selector */}
        <div className={styles.controlGroup}>
          <label>App</label>
          <select
            value={selectedAppId}
            onChange={(e) => setSelectedAppId(e.target.value)}
            disabled={loading || apps.length === 0}
          >
            {apps.map(app => (
              <option key={app.id} value={app.id}>
                {app.name} ({app.platform})
              </option>
            ))}
          </select>
        </div>

        {/* Device Type Filter */}
        <div className={styles.controlGroup}>
          <label>Device Type</label>
          <select
            value={deviceTypeFilter}
            onChange={(e) => setDeviceTypeFilter(e.target.value)}
          >
            {deviceTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Devices' : type}
              </option>
            ))}
          </select>
        </div>

        {/* Locale Selector */}
        <div className={styles.controlGroup}>
          <label>Locales to Compare</label>
          <div className={styles.localeChips}>
            {availableLocales.map(locale => (
              <button
                key={locale}
                className={`${styles.localeChip} ${selectedLocales.includes(locale) ? styles.active : ''}`}
                onClick={() => toggleLocale(locale)}
              >
                {getLocaleName(locale)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className={styles.comparisonContainer}>
        {selectedLocales.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Select at least one locale to compare</p>
          </div>
        ) : (
          <>
            <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${selectedLocales.length}, 1fr)` }}>
              {selectedLocales.map(locale => (
                <div key={locale} className={styles.column}>
                  <div className={styles.columnHeader}>
                    <h3>{getLocaleName(locale)}</h3>
                    <span className={styles.count}>
                      {filteredAssets[locale]?.length || 0} screenshots
                    </span>
                  </div>

                  <div className={styles.screenshotContainer}>
                    {filteredAssets[locale]?.[currentIndex] ? (
                      <div className={styles.screenshot}>
                        <div className={styles.screenshotPlaceholder}>
                          <div className={styles.placeholderIcon}>📱</div>
                          <p>{filteredAssets[locale][currentIndex].name}</p>
                          <p className={styles.meta}>
                            {filteredAssets[locale][currentIndex].deviceType}
                          </p>
                          <p className={styles.meta}>
                            {filteredAssets[locale][currentIndex].width} × {filteredAssets[locale][currentIndex].height}
                          </p>
                        </div>
                        <div className={styles.screenshotInfo}>
                          <p className={styles.filename}>{filteredAssets[locale][currentIndex].fileName}</p>
                          <p className={styles.description}>{filteredAssets[locale][currentIndex].description}</p>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.noScreenshot}>
                        <p>No screenshot at position {currentIndex + 1}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation */}
            {maxScreenshots > 1 && (
              <div className={styles.navigation}>
                <button
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  className={styles.navButton}
                >
                  ← Previous
                </button>
                <span className={styles.navInfo}>
                  {currentIndex + 1} / {maxScreenshots}
                </span>
                <button
                  onClick={() => setCurrentIndex(Math.min(maxScreenshots - 1, currentIndex + 1))}
                  disabled={currentIndex >= maxScreenshots - 1}
                  className={styles.navButton}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Statistics */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{availableLocales.length}</div>
          <div className={styles.statLabel}>Available Locales</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{selectedLocales.length}</div>
          <div className={styles.statLabel}>Comparing</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{assets.filter(a => a.type === 'screenshot').length}</div>
          <div className={styles.statLabel}>Total Screenshots</div>
        </div>
      </div>
    </div>
  );
}
