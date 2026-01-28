'use client';

/**
 * APP-014: PPO Test Configuration
 *
 * Product Page Optimization test configuration interface
 */

import { useState, useEffect } from 'react';
import styles from './ppo.module.css';

// Mock data for demonstration
const MOCK_APPS = [
  { id: 'app-1', name: 'My Awesome App', bundleId: 'com.example.awesome' },
  { id: 'app-2', name: 'Super Game Pro', bundleId: 'com.example.game' },
  { id: 'app-3', name: 'Productivity Master', bundleId: 'com.example.productivity' },
];

const MOCK_VERSIONS = [
  { id: 'ver-1', versionString: '2.0.0', state: 'READY_FOR_DISTRIBUTION' },
  { id: 'ver-2', versionString: '1.9.5', state: 'READY_FOR_DISTRIBUTION' },
];

const LOCALES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'es-ES', name: 'Spanish (Spain)' },
  { code: 'fr-FR', name: 'French (France)' },
  { code: 'de-DE', name: 'German (Germany)' },
  { code: 'ja-JP', name: 'Japanese (Japan)' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
];

interface Treatment {
  name: string;
  trafficProportion: number;
  locales: string[];
}

export default function PPOPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'configure'>('list');
  const [selectedApp, setSelectedApp] = useState('');
  const [selectedVersion, setSelectedVersion] = useState('');
  const [testName, setTestName] = useState('');
  const [controlTraffic, setControlTraffic] = useState(50);
  const [treatments, setTreatments] = useState<Treatment[]>([
    { name: 'Treatment A', trafficProportion: 25, locales: ['en-US'] },
    { name: 'Treatment B', trafficProportion: 25, locales: ['en-US'] },
  ]);
  const [mockTests, setMockTests] = useState([
    {
      id: 'test-1',
      name: 'Holiday Campaign Test',
      app: 'My Awesome App',
      state: 'RUNNING',
      startDate: '2026-01-15',
      treatments: 3,
    },
    {
      id: 'test-2',
      name: 'Screenshot Variant Test',
      app: 'Super Game Pro',
      state: 'COMPLETED',
      startDate: '2025-12-01',
      endDate: '2026-01-10',
      treatments: 2,
      winner: 'Treatment A',
    },
  ]);

  const addTreatment = () => {
    if (treatments.length < 3) {
      const newTreatment: Treatment = {
        name: `Treatment ${String.fromCharCode(65 + treatments.length)}`,
        trafficProportion: 0,
        locales: ['en-US'],
      };
      setTreatments([...treatments, newTreatment]);

      // Redistribute traffic evenly
      const newCount = treatments.length + 1;
      const trafficPerTreatment = Math.floor((100 - controlTraffic) / newCount);
      const updatedTreatments = [...treatments, newTreatment].map(t => ({
        ...t,
        trafficProportion: trafficPerTreatment,
      }));
      setTreatments(updatedTreatments);
    }
  };

  const removeTreatment = (index: number) => {
    const newTreatments = treatments.filter((_, i) => i !== index);
    setTreatments(newTreatments);

    // Redistribute traffic
    if (newTreatments.length > 0) {
      const trafficPerTreatment = Math.floor((100 - controlTraffic) / newTreatments.length);
      const updatedTreatments = newTreatments.map(t => ({
        ...t,
        trafficProportion: trafficPerTreatment,
      }));
      setTreatments(updatedTreatments);
    }
  };

  const updateTreatment = (index: number, updates: Partial<Treatment>) => {
    const newTreatments = [...treatments];
    newTreatments[index] = { ...newTreatments[index], ...updates };
    setTreatments(newTreatments);
  };

  const toggleLocale = (treatmentIndex: number, locale: string) => {
    const treatment = treatments[treatmentIndex];
    const newLocales = treatment.locales.includes(locale)
      ? treatment.locales.filter(l => l !== locale)
      : [...treatment.locales, locale];
    updateTreatment(treatmentIndex, { locales: newLocales });
  };

  const totalTraffic = controlTraffic + treatments.reduce((sum, t) => sum + t.trafficProportion, 0);
  const trafficValid = Math.abs(totalTraffic - 100) < 0.01;

  const handleCreate = () => {
    if (!selectedApp || !selectedVersion || !testName || !trafficValid) {
      alert('Please fill in all required fields and ensure traffic adds up to 100%');
      return;
    }

    const newTest = {
      id: `test-${Date.now()}`,
      name: testName,
      app: MOCK_APPS.find(a => a.id === selectedApp)?.name || '',
      state: 'PREPARE_FOR_SUBMISSION',
      startDate: new Date().toISOString().split('T')[0],
      treatments: treatments.length,
    };

    setMockTests([newTest, ...mockTests]);
    alert('PPO test created successfully!');
    setActiveTab('list');

    // Reset form
    setSelectedApp('');
    setSelectedVersion('');
    setTestName('');
    setControlTraffic(50);
    setTreatments([
      { name: 'Treatment A', trafficProportion: 25, locales: ['en-US'] },
      { name: 'Treatment B', trafficProportion: 25, locales: ['en-US'] },
    ]);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Product Page Optimization</h1>
          <p className={styles.subtitle}>
            A/B test your App Store product page with up to 3 treatments
          </p>
        </div>
      </header>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'list' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('list')}
        >
          PPO Tests
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'create' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create Test
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'list' && (
          <div className={styles.listView}>
            <div className={styles.listHeader}>
              <h2>Your PPO Tests</h2>
              <button
                className={styles.primaryButton}
                onClick={() => setActiveTab('create')}
              >
                + New Test
              </button>
            </div>

            {mockTests.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🧪</div>
                <h3>No PPO tests yet</h3>
                <p>Create your first Product Page Optimization test to start A/B testing</p>
                <button
                  className={styles.primaryButton}
                  onClick={() => setActiveTab('create')}
                >
                  Create Your First Test
                </button>
              </div>
            ) : (
              <div className={styles.testGrid}>
                {mockTests.map(test => (
                  <div key={test.id} className={styles.testCard}>
                    <div className={styles.testCardHeader}>
                      <h3>{test.name}</h3>
                      <span className={`${styles.stateBadge} ${styles[`state${test.state}`]}`}>
                        {test.state}
                      </span>
                    </div>
                    <div className={styles.testCardBody}>
                      <div className={styles.testInfo}>
                        <span className={styles.label}>App:</span>
                        <span>{test.app}</span>
                      </div>
                      <div className={styles.testInfo}>
                        <span className={styles.label}>Treatments:</span>
                        <span>{test.treatments}</span>
                      </div>
                      <div className={styles.testInfo}>
                        <span className={styles.label}>Start Date:</span>
                        <span>{test.startDate}</span>
                      </div>
                      {test.endDate && (
                        <div className={styles.testInfo}>
                          <span className={styles.label}>End Date:</span>
                          <span>{test.endDate}</span>
                        </div>
                      )}
                      {test.winner && (
                        <div className={styles.testInfo}>
                          <span className={styles.label}>Winner:</span>
                          <span className={styles.winner}>🏆 {test.winner}</span>
                        </div>
                      )}
                    </div>
                    <div className={styles.testCardFooter}>
                      <button className={styles.secondaryButton}>View Details</button>
                      <button className={styles.secondaryButton}>View Results</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div className={styles.createView}>
            <h2>Create PPO Test</h2>
            <p className={styles.description}>
              Configure your Product Page Optimization test to compare different versions of your product page
            </p>

            <div className={styles.form}>
              <div className={styles.formSection}>
                <h3>Basic Information</h3>

                <div className={styles.formGroup}>
                  <label htmlFor="app">Select App *</label>
                  <select
                    id="app"
                    value={selectedApp}
                    onChange={(e) => setSelectedApp(e.target.value)}
                    className={styles.select}
                  >
                    <option value="">Choose an app...</option>
                    {MOCK_APPS.map(app => (
                      <option key={app.id} value={app.id}>
                        {app.name} ({app.bundleId})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="version">Control Version *</label>
                  <select
                    id="version"
                    value={selectedVersion}
                    onChange={(e) => setSelectedVersion(e.target.value)}
                    className={styles.select}
                    disabled={!selectedApp}
                  >
                    <option value="">Choose a version...</option>
                    {MOCK_VERSIONS.map(ver => (
                      <option key={ver.id} value={ver.id}>
                        {ver.versionString} ({ver.state})
                      </option>
                    ))}
                  </select>
                  <small>This is your current product page (control group)</small>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="testName">Test Name *</label>
                  <input
                    id="testName"
                    type="text"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="e.g., Holiday Campaign Screenshot Test"
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <h3>Traffic Distribution</h3>
                  <span className={`${styles.trafficTotal} ${trafficValid ? styles.valid : styles.invalid}`}>
                    Total: {totalTraffic.toFixed(0)}%
                  </span>
                </div>

                <div className={styles.trafficControl}>
                  <label htmlFor="controlTraffic">Control (Original)</label>
                  <div className={styles.rangeGroup}>
                    <input
                      id="controlTraffic"
                      type="range"
                      min="10"
                      max="90"
                      value={controlTraffic}
                      onChange={(e) => setControlTraffic(Number(e.target.value))}
                      className={styles.range}
                    />
                    <span className={styles.rangeValue}>{controlTraffic}%</span>
                  </div>
                </div>
              </div>

              <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <h3>Treatments</h3>
                  <button
                    onClick={addTreatment}
                    className={styles.secondaryButton}
                    disabled={treatments.length >= 3}
                  >
                    + Add Treatment
                  </button>
                </div>
                <p className={styles.description}>
                  Create 1-3 treatments to test against your control version
                </p>

                {treatments.map((treatment, index) => (
                  <div key={index} className={styles.treatmentCard}>
                    <div className={styles.treatmentHeader}>
                      <input
                        type="text"
                        value={treatment.name}
                        onChange={(e) => updateTreatment(index, { name: e.target.value })}
                        className={styles.treatmentNameInput}
                      />
                      {treatments.length > 1 && (
                        <button
                          onClick={() => removeTreatment(index)}
                          className={styles.removeButton}
                          title="Remove treatment"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label>Traffic Share</label>
                      <div className={styles.rangeGroup}>
                        <input
                          type="range"
                          min="0"
                          max={100 - controlTraffic}
                          value={treatment.trafficProportion}
                          onChange={(e) => updateTreatment(index, { trafficProportion: Number(e.target.value) })}
                          className={styles.range}
                        />
                        <span className={styles.rangeValue}>{treatment.trafficProportion}%</span>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Locales</label>
                      <div className={styles.localeGrid}>
                        {LOCALES.map(locale => (
                          <label key={locale.code} className={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={treatment.locales.includes(locale.code)}
                              onChange={() => toggleLocale(index, locale.code)}
                            />
                            <span>{locale.name}</span>
                          </label>
                        ))}
                      </div>
                      <small>{treatment.locales.length} locale(s) selected</small>
                    </div>
                  </div>
                ))}

                {!trafficValid && (
                  <div className={styles.warning}>
                    ⚠️ Traffic must add up to 100%. Current total: {totalTraffic.toFixed(0)}%
                  </div>
                )}
              </div>

              <div className={styles.formActions}>
                <button
                  onClick={() => setActiveTab('list')}
                  className={styles.secondaryButton}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className={styles.primaryButton}
                  disabled={!selectedApp || !selectedVersion || !testName || !trafficValid}
                >
                  Create PPO Test
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
