'use client';

/**
 * Screenshot Caption Overlay Demo
 *
 * Demonstrates caption overlay rendering on device frame screenshots.
 */

import { useState } from 'react';
import { DeviceFrame, DeviceModel, Orientation } from '@/components/DeviceFrame';
import { CaptionOverlay } from '@/components/CaptionOverlay';
import {
  CaptionConfig,
  CaptionPosition,
  captionPresets,
  createCaptionFromPreset,
} from '@/types/captionOverlay';
import { getDevicesByType } from '@/config/deviceFrames';
import styles from './captions.module.css';

export default function CaptionsPage() {
  const [selectedDevice, setSelectedDevice] = useState<DeviceModel>('iphone-16-pro-max');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [showCaption, setShowCaption] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState('hero-heading');
  const [captionText, setCaptionText] = useState('Welcome to Your App');
  const [locale, setLocale] = useState('en-US');

  // Sample screenshot content
  const sampleContent = 'https://via.placeholder.com/1260x2736/667eea/ffffff?text=Your+App+Screenshot';

  // Get all device types
  const iPhones = getDevicesByType('iphone');

  // Create caption from selected preset
  const caption: CaptionConfig | null = createCaptionFromPreset(
    selectedPreset,
    captionText,
    { visible: showCaption }
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>💬 Screenshot Captions</h1>
        <p>Add text overlays to your App Store screenshots with positioning and styling options.</p>
      </header>

      <div className={styles.layout}>
        {/* Controls */}
        <aside className={styles.controls}>
          <section className={styles.section}>
            <h3>Caption Presets</h3>

            <div className={styles.presetGrid}>
              {captionPresets.map((preset) => (
                <button
                  key={preset.id}
                  className={`${styles.presetButton} ${
                    selectedPreset === preset.id ? styles.active : ''
                  }`}
                  onClick={() => {
                    setSelectedPreset(preset.id);
                    setCaptionText(preset.exampleText);
                  }}
                >
                  <div className={styles.presetName}>{preset.name}</div>
                  <div className={styles.presetCategory}>{preset.category}</div>
                </button>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h3>Caption Text</h3>

            <div className={styles.control}>
              <label>Text</label>
              <textarea
                value={captionText}
                onChange={(e) => setCaptionText(e.target.value)}
                rows={3}
                className={styles.textarea}
                placeholder="Enter caption text..."
              />
            </div>

            <div className={styles.control}>
              <label>
                <input
                  type="checkbox"
                  checked={showCaption}
                  onChange={(e) => setShowCaption(e.target.checked)}
                />
                Show Caption
              </label>
            </div>
          </section>

          <section className={styles.section}>
            <h3>Device Options</h3>

            <div className={styles.control}>
              <label>Device</label>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value as DeviceModel)}
                className={styles.select}
              >
                <optgroup label="iPhone">
                  {iPhones.slice(0, 5).map((device) => (
                    <option key={device.model} value={device.model}>
                      {device.displayName}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className={styles.control}>
              <label>Orientation</label>
              <div className={styles.buttonGroup}>
                <button
                  className={orientation === 'portrait' ? styles.active : ''}
                  onClick={() => setOrientation('portrait')}
                >
                  Portrait
                </button>
                <button
                  className={orientation === 'landscape' ? styles.active : ''}
                  onClick={() => setOrientation('landscape')}
                >
                  Landscape
                </button>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h3>Localization</h3>

            <div className={styles.control}>
              <label>Locale</label>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                className={styles.select}
              >
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español (España)</option>
                <option value="fr-FR">Français (France)</option>
                <option value="de-DE">Deutsch (Deutschland)</option>
                <option value="ja-JP">日本語 (日本)</option>
                <option value="zh-CN">中文 (中国)</option>
                <option value="ar-SA">العربية (السعودية)</option>
              </select>
            </div>
          </section>

          <section className={styles.section}>
            <h3>Export</h3>
            <button className={styles.exportButton}>Download Screenshot</button>
            <button className={styles.exportButton}>Generate All Locales</button>
          </section>
        </aside>

        {/* Preview */}
        <main className={styles.preview}>
          <div className={styles.previewContainer}>
            <div className={styles.frameWrapper}>
              <DeviceFrame
                device={selectedDevice}
                orientation={orientation}
                content={sampleContent}
                width={orientation === 'portrait' ? 400 : 600}
              />

              {/* Caption overlay on top of device frame */}
              {caption && (
                <div className={styles.captionLayer}>
                  <CaptionOverlay
                    caption={caption}
                    locale={locale}
                    containerWidth={orientation === 'portrait' ? 400 : 600}
                    rtl={locale === 'ar-SA'}
                  />
                </div>
              )}
            </div>
          </div>

          <div className={styles.previewInfo}>
            <h3>Preview</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Device:</span>
                <span className={styles.infoValue}>{selectedDevice}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Orientation:</span>
                <span className={styles.infoValue}>{orientation}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Caption:</span>
                <span className={styles.infoValue}>{caption?.positioning.position}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Locale:</span>
                <span className={styles.infoValue}>{locale}</span>
              </div>
            </div>
          </div>

          <div className={styles.previewHelp}>
            <h4>Caption Positioning</h4>
            <p>
              Choose from preset caption styles or customize the position, font, and colors.
              Captions support multiple locales with automatic text direction (RTL) for Arabic and
              Hebrew.
            </p>

            <h4>Available Presets</h4>
            <ul>
              <li>
                <strong>Hero Heading:</strong> Large, bold heading at the top
              </li>
              <li>
                <strong>Subtitle:</strong> Medium-sized subtitle text
              </li>
              <li>
                <strong>Feature Badge:</strong> Small badge highlighting a feature
              </li>
              <li>
                <strong>Bottom Caption:</strong> Text caption at the bottom
              </li>
              <li>
                <strong>Center Callout:</strong> Large centered text overlay
              </li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
}
