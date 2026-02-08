'use client';

import { useState, useEffect } from 'react';
import { trackFeatureDiscovery } from '../../services/retentionTracking';
import styles from './cpp.module.css';

/**
 * APP-010: Custom Product Page Creator
 *
 * UI for creating and managing Custom Product Pages
 */

// Temporary mock types until we integrate with actual API
interface App {
  id: string;
  name: string;
  bundleId?: string;
}

interface CustomProductPage {
  id: string;
  name: string;
  visible: boolean;
  state: string;
  url?: string;
  createdAt: string;
}

interface Localization {
  id: string;
  locale: string;
  promotionalText?: string;
  state: string;
}

export default function CustomProductPagesPage() {
  // State
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'edit'>('list');
  const [loading, setLoading] = useState(false);
  const [apps, setApps] = useState<App[]>([]);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [customProductPages, setCustomProductPages] = useState<CustomProductPage[]>([]);
  const [selectedCPP, setSelectedCPP] = useState<CustomProductPage | null>(null);
  const [localizations, setLocalizations] = useState<Localization[]>([]);
  const [cppName, setCppName] = useState('');
  const [cppVisible, setCppVisible] = useState(true);
  const [locale, setLocale] = useState('en-US');
  const [promotionalText, setPromotionalText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Track feature discovery
  useEffect(() => {
    trackFeatureDiscovery('custom_product_page');
  }, []);

  useEffect(() => {
    loadApps();
  }, []);

  useEffect(() => {
    if (selectedApp) {
      loadCustomProductPages();
    }
  }, [selectedApp]);

  useEffect(() => {
    if (selectedCPP) {
      loadLocalizations();
    }
  }, [selectedCPP]);

  const loadApps = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/asc/apps');
      if (!response.ok) {
        throw new Error('Failed to fetch apps');
      }
      const data = await response.json();
      const apps = data.apps || [];

      setApps(apps);
      if (apps.length > 0 && !selectedApp) {
        setSelectedApp(apps[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load apps');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomProductPages = async () => {
    if (!selectedApp) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/asc/apps/${selectedApp}/custom-product-pages`);
      if (!response.ok) {
        throw new Error('Failed to fetch custom product pages');
      }
      const data = await response.json();
      const cpps = data.customProductPages || [];

      setCustomProductPages(cpps);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load custom product pages');
    } finally {
      setLoading(false);
    }
  };

  const loadLocalizations = async () => {
    if (!selectedCPP) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/asc/custom-product-pages/${selectedCPP.id}/localizations`);
      if (!response.ok) {
        throw new Error('Failed to fetch localizations');
      }
      const data = await response.json();
      const localizations = data.localizations || [];

      setLocalizations(localizations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load localizations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCPP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedApp) {
      setError('Please select an app');
      return;
    }

    if (!cppName.trim()) {
      setError('Please enter a name for the custom product page');
      return;
    }

    if (!locale) {
      setError('Please select a locale');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/asc/custom-product-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedApp,
          name: cppName,
          visible: cppVisible,
          locale,
          promotionalText,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create custom product page');
      }
      const data = await response.json();

      setSuccess('Custom Product Page created successfully!');

      // Reset form
      setCppName('');
      setCppVisible(true);
      setLocale('en-US');
      setPromotionalText('');

      // Reload list
      await loadCustomProductPages();

      // Switch to list tab
      setTimeout(() => {
        setActiveTab('list');
        setSuccess(null);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create custom product page');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocalization = async (newLocale: string, newPromotionalText: string) => {
    if (!selectedCPP) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/asc/custom-product-pages/${selectedCPP.id}/localizations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: newLocale, promotionalText: newPromotionalText }),
      });

      if (!response.ok) {
        throw new Error('Failed to add localization');
      }
      const data = await response.json();

      setSuccess('Localization added successfully!');
      await loadLocalizations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add localization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Custom Product Pages</h1>
        <p className={styles.subtitle}>
          Create and manage Custom Product Pages for your apps
        </p>
      </div>

      {/* App Selector */}
      <div className={styles.appSelector}>
        <label htmlFor="app-select">Select App:</label>
        <select
          id="app-select"
          value={selectedApp || ''}
          onChange={(e) => setSelectedApp(e.target.value)}
          disabled={loading}
        >
          <option value="">Select an app...</option>
          {apps.map((app) => (
            <option key={app.id} value={app.id}>
              {app.name} {app.bundleId && `(${app.bundleId})`}
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={activeTab === 'list' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('list')}
        >
          Custom Product Pages
        </button>
        <button
          className={activeTab === 'create' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('create')}
          disabled={!selectedApp}
        >
          Create New
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}
      {success && (
        <div className={styles.success}>
          <strong>Success:</strong> {success}
        </div>
      )}

      {/* Content */}
      <div className={styles.content}>
        {activeTab === 'list' && (
          <div className={styles.list}>
            {!selectedApp ? (
              <p className={styles.emptyState}>Please select an app to view Custom Product Pages</p>
            ) : customProductPages.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No Custom Product Pages found for this app.</p>
                <button onClick={() => setActiveTab('create')} className={styles.buttonPrimary}>
                  Create First Custom Product Page
                </button>
              </div>
            ) : (
              <div className={styles.cppGrid}>
                {customProductPages.map((cpp) => (
                  <div key={cpp.id} className={styles.cppCard}>
                    <div className={styles.cppCardHeader}>
                      <h3>{cpp.name}</h3>
                      <span className={cpp.visible ? styles.badgeVisible : styles.badgeHidden}>
                        {cpp.visible ? 'Visible' : 'Hidden'}
                      </span>
                    </div>
                    <div className={styles.cppCardBody}>
                      <p><strong>State:</strong> {cpp.state}</p>
                      {cpp.url && (
                        <p><strong>URL:</strong> <a href={cpp.url} target="_blank" rel="noopener noreferrer">{cpp.url}</a></p>
                      )}
                      <p><strong>Created:</strong> {new Date(cpp.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className={styles.cppCardActions}>
                      <button
                        onClick={() => {
                          setSelectedCPP(cpp);
                          setActiveTab('edit');
                        }}
                        className={styles.buttonSecondary}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div className={styles.createForm}>
            <h2>Create Custom Product Page</h2>
            <form onSubmit={handleCreateCPP}>
              <div className={styles.formGroup}>
                <label htmlFor="cpp-name">
                  Page Name <span className={styles.required}>*</span>
                </label>
                <input
                  id="cpp-name"
                  type="text"
                  value={cppName}
                  onChange={(e) => setCppName(e.target.value)}
                  placeholder="e.g., Holiday Campaign 2026"
                  required
                  disabled={loading}
                />
                <small>A descriptive name for your custom product page</small>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="cpp-visible">
                  <input
                    id="cpp-visible"
                    type="checkbox"
                    checked={cppVisible}
                    onChange={(e) => setCppVisible(e.target.checked)}
                    disabled={loading}
                  />
                  {' '}Make page visible
                </label>
                <small>Hidden pages can be tested before making them public</small>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="cpp-locale">
                  Initial Locale <span className={styles.required}>*</span>
                </label>
                <select
                  id="cpp-locale"
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="es-ES">Spanish (Spain)</option>
                  <option value="es-MX">Spanish (Mexico)</option>
                  <option value="fr-FR">French (France)</option>
                  <option value="de-DE">German (Germany)</option>
                  <option value="ja-JP">Japanese (Japan)</option>
                  <option value="zh-CN">Chinese (Simplified)</option>
                  <option value="zh-TW">Chinese (Traditional)</option>
                  <option value="ko-KR">Korean (Korea)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="cpp-promo-text">
                  Promotional Text
                </label>
                <textarea
                  id="cpp-promo-text"
                  value={promotionalText}
                  onChange={(e) => setPromotionalText(e.target.value)}
                  placeholder="Describe what makes this page special... (max 170 characters)"
                  maxLength={170}
                  rows={3}
                  disabled={loading}
                />
                <small>{promotionalText.length}/170 characters</small>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className={styles.buttonSecondary}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.buttonPrimary}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Custom Product Page'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'edit' && selectedCPP && (
          <div className={styles.editForm}>
            <h2>Edit Custom Product Page</h2>
            <div className={styles.cppInfo}>
              <h3>{selectedCPP.name}</h3>
              <p><strong>State:</strong> {selectedCPP.state}</p>
              {selectedCPP.url && (
                <p><strong>URL:</strong> <a href={selectedCPP.url} target="_blank" rel="noopener noreferrer">{selectedCPP.url}</a></p>
              )}
            </div>

            <h3>Localizations</h3>
            {localizations.length === 0 ? (
              <p className={styles.emptyState}>No localizations yet. Add one to get started.</p>
            ) : (
              <div className={styles.localizationList}>
                {localizations.map((loc) => (
                  <div key={loc.id} className={styles.localizationCard}>
                    <div className={styles.localizationHeader}>
                      <strong>{loc.locale}</strong>
                      <span className={styles.badge}>{loc.state}</span>
                    </div>
                    {loc.promotionalText && (
                      <p className={styles.promotionalText}>{loc.promotionalText}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className={styles.formActions}>
              <button
                onClick={() => setActiveTab('list')}
                className={styles.buttonSecondary}
              >
                Back to List
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
