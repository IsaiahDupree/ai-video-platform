'use client';

import { AdTemplate, AdLayoutType } from '../../../../types/adTemplate';
import SizeSelector from './SizeSelector';
import styles from '../editor.module.css';

interface AdEditorFormProps {
  template: AdTemplate;
  onUpdate: (path: string[], value: any) => void;
}

export default function AdEditorForm({ template, onUpdate }: AdEditorFormProps) {
  return (
    <div>
      {/* Layout Selection */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Layout</h2>
        <div className={styles.formGroup}>
          <label className={styles.label}>Layout Type</label>
          <select
            value={template.layout}
            onChange={(e) => onUpdate(['layout'], e.target.value as AdLayoutType)}
            className={styles.select}
          >
            <option value="hero-text">Hero Text</option>
            <option value="split-horizontal">Split Horizontal</option>
            <option value="split-vertical">Split Vertical</option>
            <option value="text-only">Text Only</option>
            <option value="product-showcase">Product Showcase</option>
            <option value="quote">Quote</option>
            <option value="minimal">Minimal</option>
          </select>
        </div>

        <SizeSelector
          currentWidth={template.dimensions.width}
          currentHeight={template.dimensions.height}
          onSizeChange={(width, height, name) => {
            onUpdate(['dimensions'], { width, height, name });
          }}
        />
      </section>

      {/* Content */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Content</h2>
        <div className={styles.formGroup}>
          <label className={styles.label}>Headline</label>
          <input
            type="text"
            value={template.content.headline || ''}
            onChange={(e) => onUpdate(['content', 'headline'], e.target.value)}
            className={styles.input}
            placeholder="Your headline"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Subheadline</label>
          <textarea
            value={template.content.subheadline || ''}
            onChange={(e) => onUpdate(['content', 'subheadline'], e.target.value)}
            className={styles.textarea}
            placeholder="Supporting text"
          />
        </div>

        {template.layout !== 'quote' && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Call to Action</label>
            <input
              type="text"
              value={template.content.cta || ''}
              onChange={(e) => onUpdate(['content', 'cta'], e.target.value)}
              className={styles.input}
              placeholder="Learn More"
            />
          </div>
        )}

        {template.layout === 'quote' && (
          <>
            <div className={styles.formGroup}>
              <label className={styles.label}>Author Name</label>
              <input
                type="text"
                value={template.content.authorName || ''}
                onChange={(e) => onUpdate(['content', 'authorName'], e.target.value)}
                className={styles.input}
                placeholder="John Doe"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Author Title</label>
              <input
                type="text"
                value={template.content.authorTitle || ''}
                onChange={(e) => onUpdate(['content', 'authorTitle'], e.target.value)}
                className={styles.input}
                placeholder="CEO, Company"
              />
            </div>
          </>
        )}
      </section>

      {/* Colors */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Colors</h2>
        <div className={styles.formGroup}>
          <label className={styles.label}>Primary Color</label>
          <input
            type="color"
            value={template.style?.primaryColor || '#3b82f6'}
            onChange={(e) => onUpdate(['style', 'primaryColor'], e.target.value)}
            className={styles.colorInput}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Secondary Color</label>
          <input
            type="color"
            value={template.style?.secondaryColor || '#8b5cf6'}
            onChange={(e) => onUpdate(['style', 'secondaryColor'], e.target.value)}
            className={styles.colorInput}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Text Color</label>
          <input
            type="color"
            value={template.style?.textColor || '#ffffff'}
            onChange={(e) => onUpdate(['style', 'textColor'], e.target.value)}
            className={styles.colorInput}
          />
        </div>

        {template.content.cta && (
          <>
            <div className={styles.formGroup}>
              <label className={styles.label}>CTA Background</label>
              <input
                type="color"
                value={template.style?.ctaBackgroundColor || '#ffffff'}
                onChange={(e) => onUpdate(['style', 'ctaBackgroundColor'], e.target.value)}
                className={styles.colorInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>CTA Text Color</label>
              <input
                type="color"
                value={template.style?.ctaTextColor || '#3b82f6'}
                onChange={(e) => onUpdate(['style', 'ctaTextColor'], e.target.value)}
                className={styles.colorInput}
              />
            </div>
          </>
        )}
      </section>

      {/* Typography */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Typography</h2>
        <div className={styles.formGroup}>
          <label className={styles.label}>Headline Font</label>
          <select
            value={template.style?.headlineFont || 'Inter, system-ui, sans-serif'}
            onChange={(e) => onUpdate(['style', 'headlineFont'], e.target.value)}
            className={styles.select}
          >
            <option value="Inter, system-ui, sans-serif">Inter</option>
            <option value="'Helvetica Neue', Helvetica, Arial, sans-serif">Helvetica</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="'Courier New', monospace">Courier New</option>
            <option value="'Times New Roman', serif">Times New Roman</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Headline Size</label>
          <input
            type="number"
            value={template.style?.headlineSize || 48}
            onChange={(e) => onUpdate(['style', 'headlineSize'], Number(e.target.value))}
            className={styles.numberInput}
            min="12"
            max="120"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Headline Weight</label>
          <select
            value={template.style?.headlineFontWeight || 700}
            onChange={(e) => onUpdate(['style', 'headlineFontWeight'], Number(e.target.value))}
            className={styles.select}
          >
            <option value="300">Light (300)</option>
            <option value="400">Regular (400)</option>
            <option value="500">Medium (500)</option>
            <option value="600">Semibold (600)</option>
            <option value="700">Bold (700)</option>
            <option value="800">Extra Bold (800)</option>
            <option value="900">Black (900)</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Body Size</label>
          <input
            type="number"
            value={template.style?.bodySize || 20}
            onChange={(e) => onUpdate(['style', 'bodySize'], Number(e.target.value))}
            className={styles.numberInput}
            min="12"
            max="48"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Body Weight</label>
          <select
            value={template.style?.bodyFontWeight || 400}
            onChange={(e) => onUpdate(['style', 'bodyFontWeight'], Number(e.target.value))}
            className={styles.select}
          >
            <option value="300">Light (300)</option>
            <option value="400">Regular (400)</option>
            <option value="500">Medium (500)</option>
            <option value="600">Semibold (600)</option>
            <option value="700">Bold (700)</option>
          </select>
        </div>
      </section>

      {/* Spacing */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Spacing</h2>
        <div className={styles.formGroup}>
          <label className={styles.label}>Padding</label>
          <input
            type="number"
            value={template.style?.padding || 40}
            onChange={(e) => onUpdate(['style', 'padding'], Number(e.target.value))}
            className={styles.numberInput}
            min="0"
            max="200"
            step="4"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Gap</label>
          <input
            type="number"
            value={template.style?.gap || 16}
            onChange={(e) => onUpdate(['style', 'gap'], Number(e.target.value))}
            className={styles.numberInput}
            min="0"
            max="100"
            step="4"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Border Radius</label>
          <input
            type="number"
            value={template.style?.borderRadius || 8}
            onChange={(e) => onUpdate(['style', 'borderRadius'], Number(e.target.value))}
            className={styles.numberInput}
            min="0"
            max="100"
          />
        </div>
      </section>

      {/* Effects */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Effects</h2>
        <div className={styles.formGroup}>
          <label className={styles.label}>
            <input
              type="checkbox"
              checked={template.style?.shadow || false}
              onChange={(e) => onUpdate(['style', 'shadow'], e.target.checked)}
              style={{ marginRight: '0.5rem' }}
            />
            Enable Shadow
          </label>
        </div>

        {template.style?.shadow && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Shadow Blur</label>
            <input
              type="number"
              value={template.style?.shadowBlur || 20}
              onChange={(e) => onUpdate(['style', 'shadowBlur'], Number(e.target.value))}
              className={styles.numberInput}
              min="0"
              max="100"
            />
          </div>
        )}
      </section>
    </div>
  );
}
