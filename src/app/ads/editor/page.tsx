'use client';

import { useState, useEffect, useRef } from 'react';
import { AdTemplate, AD_SIZES, AdLayoutType } from '../../../types/adTemplate';
import { BrandKit } from '../../../types/brandKit';
import AdEditorForm from './components/AdEditorForm';
import AdPreview from './components/AdPreview';
import QAPanel from './components/QAPanel';
import { useTracking } from '../../../components/TrackingProvider';
import styles from './editor.module.css';

// Sample templates for selection
const STARTER_TEMPLATES = [
  'example-hero-ad',
  'example-quote-ad',
  'example-minimal-ad',
  'example-text-only-ad',
];

// Brand kits for selection
const BRAND_KITS = ['tech-startup-001', 'eco-brand-002'];

export default function AdEditorPage() {
  const [template, setTemplate] = useState<AdTemplate | null>(null);
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState('example-hero-ad');
  const [selectedBrandKit, setSelectedBrandKit] = useState('tech-startup-001');
  const tracking = useTracking();
  const hasTrackedFirstCreation = useRef(false);

  // Load initial template
  useEffect(() => {
    loadTemplate(selectedTemplate);
  }, [selectedTemplate]);

  // Load template from JSON
  const loadTemplate = async (templateId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/data/ads/${templateId}.json`);
      const data = await response.json();
      setTemplate(data);

      // Track first_video_created when user first loads/modifies a template
      if (!hasTrackedFirstCreation.current) {
        tracking.track('first_video_created', {
          templateId: data.id,
          templateType: 'starter',
          layout: data.layout,
          timestamp: new Date().toISOString(),
        });
        hasTrackedFirstCreation.current = true;
      }
    } catch (error) {
      console.error('Error loading template:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load brand kit
  const loadBrandKit = async (brandKitId: string) => {
    try {
      const response = await fetch(`/data/brand-kits/${brandKitId}.json`);
      const data = await response.json();
      setBrandKit(data);
    } catch (error) {
      console.error('Error loading brand kit:', error);
    }
  };

  // Apply brand kit to template
  const applyBrandKit = () => {
    if (!template || !brandKit) return;

    const updatedTemplate: AdTemplate = {
      ...template,
      style: {
        ...template.style,
        primaryColor: brandKit.colors.primary,
        secondaryColor: brandKit.colors.secondary || brandKit.colors.primary,
        textColor: brandKit.colors.text,
        headlineFont: brandKit.typography.headlineFont,
        bodyFont: brandKit.typography.bodyFont || brandKit.typography.headlineFont,
      },
    };

    setTemplate(updatedTemplate);
  };

  // Update template field
  const updateTemplate = (path: string[], value: any) => {
    if (!template) return;

    const newTemplate = { ...template };
    let current: any = newTemplate;

    // Navigate to the target field
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        current[path[i]] = {};
      }
      current = current[path[i]];
    }

    // Set the value
    current[path[path.length - 1]] = value;
    setTemplate(newTemplate);
  };

  // Create new template
  const createNewTemplate = () => {
    const newTemplate: AdTemplate = {
      id: `custom-ad-${Date.now()}`,
      name: 'Custom Ad',
      description: 'Custom ad template',
      layout: 'hero-text',
      dimensions: AD_SIZES.INSTAGRAM_SQUARE,
      content: {
        headline: 'Your Headline Here',
        subheadline: 'Your subheadline text',
        cta: 'Learn More',
      },
      style: {
        primaryColor: '#3b82f6',
        secondaryColor: '#8b5cf6',
        textColor: '#ffffff',
        ctaBackgroundColor: '#ffffff',
        ctaTextColor: '#3b82f6',
        headlineFont: 'Inter, system-ui, sans-serif',
        bodyFont: 'Inter, system-ui, sans-serif',
        headlineSize: 48,
        bodySize: 20,
        padding: 40,
      },
      metadata: {
        category: 'custom',
        tags: ['custom'],
        version: '1.0',
      },
    };

    setTemplate(newTemplate);

    // Track first_video_created event (only once per session)
    if (!hasTrackedFirstCreation.current) {
      tracking.track('first_video_created', {
        templateId: newTemplate.id,
        templateType: 'custom',
        layout: newTemplate.layout,
        timestamp: new Date().toISOString(),
      });
      hasTrackedFirstCreation.current = true;
    }
  };

  // Export template as JSON
  const exportTemplate = () => {
    if (!template) return;

    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !template) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Ad Editor</h1>
          <div className={styles.actions}>
            <button onClick={createNewTemplate} className={styles.button}>
              New Template
            </button>
            <button onClick={exportTemplate} className={styles.button}>
              Export JSON
            </button>
          </div>
        </div>
      </header>

      {/* Main Editor */}
      <div className={styles.editor}>
        {/* Sidebar - Form */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarContent}>
            {/* Template Selection */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Template</h2>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className={styles.select}
              >
                {STARTER_TEMPLATES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace('example-', '').replace(/-/g, ' ')}
                  </option>
                ))}
              </select>
            </section>

            {/* Brand Kit */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Brand Kit</h2>
              <select
                value={selectedBrandKit}
                onChange={(e) => {
                  setSelectedBrandKit(e.target.value);
                  loadBrandKit(e.target.value);
                }}
                className={styles.select}
              >
                <option value="">None</option>
                {BRAND_KITS.map((b) => (
                  <option key={b} value={b}>
                    {b.replace(/-\d+$/, '').replace(/-/g, ' ')}
                  </option>
                ))}
              </select>
              {brandKit && (
                <button onClick={applyBrandKit} className={styles.buttonSmall}>
                  Apply Brand
                </button>
              )}
            </section>

            {/* Editor Form */}
            <AdEditorForm template={template} onUpdate={updateTemplate} />

            {/* QA Panel */}
            <section className={styles.section}>
              <QAPanel template={template} autoCheck={true} />
            </section>
          </div>
        </aside>

        {/* Main - Preview */}
        <main className={styles.preview}>
          <AdPreview template={template} />
        </main>
      </div>
    </div>
  );
}
