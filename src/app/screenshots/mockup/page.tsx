/**
 * Device Mockup Preview Page
 *
 * Interactive demo of the DeviceMockup component (APP-012).
 * Allows users to preview screenshots in device mockups with full controls.
 */

'use client';

import React, { useState } from 'react';
import { DeviceMockup } from '@/components/DeviceMockup';
import { DeviceModel } from '@/types/deviceFrame';
import styles from './mockup.module.css';

export default function DeviceMockupPage() {
  const [selectedDevice, setSelectedDevice] = useState<DeviceModel>('iphone-16-pro-max');
  const [screenshot, setScreenshot] = useState<string | undefined>(undefined);

  // Sample screenshots for demo
  const sampleScreenshots = [
    {
      name: 'App Store Screenshot 1',
      url: '/assets/samples/screenshot-1.png',
    },
    {
      name: 'App Store Screenshot 2',
      url: '/assets/samples/screenshot-2.png',
    },
    {
      name: 'App Store Screenshot 3',
      url: '/assets/samples/screenshot-3.png',
    },
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Device Mockup Preview</h1>
        <p className={styles.subtitle}>
          Preview your App Store screenshots in realistic device mockups
        </p>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {/* Device Mockup */}
        <div className={styles.mockupSection}>
          <DeviceMockup
            screenshot={screenshot}
            defaultDevice={selectedDevice}
            defaultOrientation="portrait"
            enableControls={true}
            initialZoom={1}
            background="gradient"
            backgroundGradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            enableDeviceSwitch={true}
            enableColorSelection={true}
            width={900}
            height={700}
            onScreenshotChange={setScreenshot}
            onDeviceChange={setSelectedDevice}
          />
        </div>

        {/* Sample Screenshots */}
        <div className={styles.samplesSection}>
          <h2 className={styles.sectionTitle}>Sample Screenshots</h2>
          <p className={styles.sectionSubtitle}>
            Click to load a sample screenshot (or upload your own above)
          </p>
          <div className={styles.sampleGrid}>
            {sampleScreenshots.map((sample, index) => (
              <div
                key={index}
                className={styles.sampleCard}
                onClick={() => setScreenshot(sample.url)}
              >
                <div className={styles.samplePlaceholder}>
                  <span className={styles.sampleIcon}>📱</span>
                  <span className={styles.sampleName}>{sample.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className={styles.featuresSection}>
          <h2 className={styles.sectionTitle}>Features</h2>
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🔍</div>
              <h3 className={styles.featureTitle}>Zoom & Pan</h3>
              <p className={styles.featureDescription}>
                Use Cmd/Ctrl + Scroll to zoom in/out. Click and drag to pan around.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📱</div>
              <h3 className={styles.featureTitle}>Device Selection</h3>
              <p className={styles.featureDescription}>
                Choose from 25+ Apple devices including iPhone, iPad, Mac, Watch, and more.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🎨</div>
              <h3 className={styles.featureTitle}>Device Colors</h3>
              <p className={styles.featureDescription}>
                Select from available device colors to match your brand.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🔄</div>
              <h3 className={styles.featureTitle}>Orientation</h3>
              <p className={styles.featureDescription}>
                Toggle between portrait and landscape orientations instantly.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📤</div>
              <h3 className={styles.featureTitle}>Upload & Paste</h3>
              <p className={styles.featureDescription}>
                Upload screenshots or paste directly from your clipboard (Cmd/Ctrl + V).
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🎭</div>
              <h3 className={styles.featureTitle}>Backgrounds</h3>
              <p className={styles.featureDescription}>
                Choose from gradient, solid, or transparent backgrounds for your mockup.
              </p>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className={styles.useCasesSection}>
          <h2 className={styles.sectionTitle}>Use Cases</h2>
          <div className={styles.useCaseList}>
            <div className={styles.useCaseItem}>
              <div className={styles.useCaseNumber}>1</div>
              <div className={styles.useCaseContent}>
                <h3 className={styles.useCaseTitle}>App Store Marketing</h3>
                <p className={styles.useCaseDescription}>
                  Create stunning App Store preview images with your screenshots in realistic device frames.
                </p>
              </div>
            </div>
            <div className={styles.useCaseItem}>
              <div className={styles.useCaseNumber}>2</div>
              <div className={styles.useCaseContent}>
                <h3 className={styles.useCaseTitle}>Website & Landing Pages</h3>
                <p className={styles.useCaseDescription}>
                  Generate high-quality mockups for your website, landing pages, and marketing materials.
                </p>
              </div>
            </div>
            <div className={styles.useCaseItem}>
              <div className={styles.useCaseNumber}>3</div>
              <div className={styles.useCaseContent}>
                <h3 className={styles.useCaseTitle}>Social Media Posts</h3>
                <p className={styles.useCaseDescription}>
                  Create eye-catching social media graphics with professional device mockups.
                </p>
              </div>
            </div>
            <div className={styles.useCaseItem}>
              <div className={styles.useCaseNumber}>4</div>
              <div className={styles.useCaseContent}>
                <h3 className={styles.useCaseTitle}>Presentations & Pitches</h3>
                <p className={styles.useCaseDescription}>
                  Showcase your app in investor presentations and pitch decks with polished mockups.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Code Example */}
        <div className={styles.codeSection}>
          <h2 className={styles.sectionTitle}>Usage Example</h2>
          <pre className={styles.codeBlock}>
            <code>{`import { DeviceMockup } from '@/components/DeviceMockup';

export default function MyPage() {
  return (
    <DeviceMockup
      screenshot="/path/to/screenshot.png"
      defaultDevice="iphone-16-pro-max"
      defaultOrientation="portrait"
      enableControls={true}
      initialZoom={1}
      background="gradient"
      enableDeviceSwitch={true}
      enableColorSelection={true}
      width={900}
      height={700}
    />
  );
}`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
