'use client';

/**
 * Screenshot Device Frames Demo
 *
 * Demonstrates device frame rendering for App Store screenshots.
 */

import { useState } from 'react';
import { DeviceFrame, DeviceModel, Orientation } from '@/components/DeviceFrame';
import { getDevicesByType } from '@/config/deviceFrames';
import styles from './screenshots.module.css';

export default function ScreenshotsPage() {
  const [selectedDevice, setSelectedDevice] = useState<DeviceModel>('iphone-16-pro-max');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [frameColor, setFrameColor] = useState('#1d1d1f');
  const [showButtons, setShowButtons] = useState(true);
  const [showNotch, setShowNotch] = useState(true);
  const [shadow, setShadow] = useState(true);

  // Sample screenshot content - will be replaced with user-uploaded image
  const sampleContent = null;

  // Get all device types
  const iPhones = getDevicesByType('iphone');
  const iPads = getDevicesByType('ipad');
  const macs = getDevicesByType('mac');
  const watches = getDevicesByType('watch');

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>📱 Screenshot Device Frames</h1>
        <p>
          Create professional App Store screenshots with device frames for iPhone, iPad, Mac, and
          Apple Watch.
        </p>
      </header>

      <div className={styles.layout}>
        {/* Controls */}
        <aside className={styles.controls}>
          <section className={styles.section}>
            <h3>Device Selection</h3>

            <div className={styles.deviceGroup}>
              <h4>iPhone</h4>
              {iPhones.map((device) => (
                <button
                  key={device.model}
                  className={`${styles.deviceButton} ${
                    selectedDevice === device.model ? styles.active : ''
                  }`}
                  onClick={() => setSelectedDevice(device.model)}
                >
                  {device.displayName}
                  <span className={styles.deviceSize}>{device.displaySize}</span>
                </button>
              ))}
            </div>

            <div className={styles.deviceGroup}>
              <h4>iPad</h4>
              {iPads.slice(0, 5).map((device) => (
                <button
                  key={device.model}
                  className={`${styles.deviceButton} ${
                    selectedDevice === device.model ? styles.active : ''
                  }`}
                  onClick={() => setSelectedDevice(device.model)}
                >
                  {device.displayName}
                  <span className={styles.deviceSize}>{device.displaySize}</span>
                </button>
              ))}
            </div>

            <div className={styles.deviceGroup}>
              <h4>Mac</h4>
              {macs.map((device) => (
                <button
                  key={device.model}
                  className={`${styles.deviceButton} ${
                    selectedDevice === device.model ? styles.active : ''
                  }`}
                  onClick={() => setSelectedDevice(device.model)}
                >
                  {device.displayName}
                  <span className={styles.deviceSize}>{device.displaySize}</span>
                </button>
              ))}
            </div>

            <div className={styles.deviceGroup}>
              <h4>Apple Watch</h4>
              {watches.slice(0, 4).map((device) => (
                <button
                  key={device.model}
                  className={`${styles.deviceButton} ${
                    selectedDevice === device.model ? styles.active : ''
                  }`}
                  onClick={() => setSelectedDevice(device.model)}
                >
                  {device.displayName}
                  <span className={styles.deviceSize}>{device.displaySize}</span>
                </button>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h3>Frame Options</h3>

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

            <div className={styles.control}>
              <label>Frame Color</label>
              <input
                type="color"
                value={frameColor}
                onChange={(e) => setFrameColor(e.target.value)}
              />
            </div>

            <div className={styles.control}>
              <label>
                <input
                  type="checkbox"
                  checked={showButtons}
                  onChange={(e) => setShowButtons(e.target.checked)}
                />
                Show Buttons
              </label>
            </div>

            <div className={styles.control}>
              <label>
                <input
                  type="checkbox"
                  checked={showNotch}
                  onChange={(e) => setShowNotch(e.target.checked)}
                />
                Show Notch/Island
              </label>
            </div>

            <div className={styles.control}>
              <label>
                <input
                  type="checkbox"
                  checked={shadow}
                  onChange={(e) => setShadow(e.target.checked)}
                />
                Shadow
              </label>
            </div>
          </section>

          <section className={styles.section}>
            <h3>Export</h3>
            <button className={styles.exportButton}>Download Frame</button>
            <button className={styles.exportButton}>Generate All Sizes</button>
          </section>
        </aside>

        {/* Preview */}
        <main className={styles.preview}>
          {sampleContent ? (
            <>
              <div className={styles.previewContainer}>
                <DeviceFrame
                  device={selectedDevice}
                  orientation={orientation}
                  content={sampleContent}
                  style={{
                    frameColor,
                    showButtons,
                    showNotch,
                    shadow,
                  }}
                  width={orientation === 'portrait' ? 400 : 600}
                />
              </div>

              <div className={styles.previewInfo}>
                <h3>Preview</h3>
                <p>
                  <strong>Device:</strong> {selectedDevice}
                </p>
                <p>
                  <strong>Orientation:</strong> {orientation}
                </p>
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              <h3>No Screenshot Loaded</h3>
              <p>Upload or select a screenshot to preview device frames</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
