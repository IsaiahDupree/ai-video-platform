/**
 * Screenshot Editor UI (APP-025)
 *
 * Visual editor for positioning screenshots and captions.
 * Combines device frames (APP-001) with caption overlays (APP-002).
 */

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { trackFeatureDiscovery } from '../../../services/retentionTracking';
import { DeviceFrame } from '@/components/DeviceFrame';
import { CaptionOverlay } from '@/components/CaptionOverlay';
import { DeviceModel, Orientation } from '@/types/deviceFrame';
import {
  CaptionConfig,
  CaptionPosition,
  CaptionStyle,
  createCaptionFromPreset,
  captionPresets,
} from '@/types/captionOverlay';
import { getDevicesByType } from '@/config/deviceFrames';
import styles from './editor.module.css';

interface CaptionLayer {
  id: string;
  caption: CaptionConfig;
  visible: boolean;
}

export default function ScreenshotEditorPage() {
  // Screenshot state
  const [screenshot, setScreenshot] = useState<string | null>(null);

  // Track feature discovery
  useEffect(() => {
    trackFeatureDiscovery('screenshot_editor');
  }, []);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);

  // Track feature discovery
  useEffect(() => {
    trackFeatureDiscovery('screenshot_editor');
  }, []);

  // Device state
  const [selectedDevice, setSelectedDevice] = useState<DeviceModel>('iphone-16-pro-max');

  // Track feature discovery
  useEffect(() => {
    trackFeatureDiscovery('screenshot_editor');
  }, []);
  const [orientation, setOrientation] = useState<Orientation>('portrait');

  // Track feature discovery
  useEffect(() => {
    trackFeatureDiscovery('screenshot_editor');
  }, []);

  // Caption layers
  const [captions, setCaptions] = useState<CaptionLayer[]>([]);

  // Track feature discovery
  useEffect(() => {
    trackFeatureDiscovery('screenshot_editor');
  }, []);
  const [selectedCaptionId, setSelectedCaptionId] = useState<string | null>(null);

  // Track feature discovery
  useEffect(() => {
    trackFeatureDiscovery('screenshot_editor');
  }, []);

  // Editor state
  const [zoom, setZoom] = useState(1);

  // Track feature discovery
  useEffect(() => {
    trackFeatureDiscovery('screenshot_editor');
  }, []);
  const [activeTab, setActiveTab] = useState<'device' | 'captions' | 'export'>('device');

  // Track feature discovery
  useEffect(() => {
    trackFeatureDiscovery('screenshot_editor');
  }, []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Device lists
  const iPhones = getDevicesByType('iphone');
  const iPads = getDevicesByType('ipad');
  const macs = getDevicesByType('mac');

  // Handle screenshot upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setScreenshot(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // Add new caption
  const handleAddCaption = useCallback(() => {
    const newId = `caption-${Date.now()}`;
    const newCaption: CaptionLayer = {
      id: newId,
      caption: createCaptionFromPreset('hero-heading', 'New Caption', { visible: true })!,
      visible: true,
    };
    setCaptions((prev) => [...prev, newCaption]);
    setSelectedCaptionId(newId);
  }, []);

  // Update caption
  const handleUpdateCaption = useCallback(
    (id: string, updates: Partial<CaptionConfig>) => {
      setCaptions((prev) =>
        prev.map((layer) =>
          layer.id === id
            ? { ...layer, caption: { ...layer.caption, ...updates } }
            : layer
        )
      );
    },
    []
  );

  // Delete caption
  const handleDeleteCaption = useCallback((id: string) => {
    setCaptions((prev) => prev.filter((layer) => layer.id !== id));
    if (selectedCaptionId === id) {
      setSelectedCaptionId(null);
    }
  }, [selectedCaptionId]);

  // Toggle caption visibility
  const handleToggleCaptionVisibility = useCallback((id: string) => {
    setCaptions((prev) =>
      prev.map((layer) =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer
      )
    );
  }, []);

  // Export screenshot
  const handleExport = useCallback(() => {
    // Get the preview canvas
    const previewElement = document.getElementById('screenshot-preview');
    if (!previewElement) {
      alert('Preview not found');
      return;
    }

    // Create a temporary canvas for export
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      alert('Canvas context not available');
      return;
    }

    // Use html2canvas or similar library in production
    // For now, we'll just show an alert
    alert('Export functionality coming soon! In production, this would render the preview to an image.');
  }, []);

  // Get selected caption
  const selectedCaption = captions.find((c) => c.id === selectedCaptionId);

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>📱 Screenshot Editor</h1>
          <p>Create beautiful App Store screenshots with device frames and captions</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.exportButton} onClick={handleExport}>
            Export Screenshot
          </button>
        </div>
      </header>

      <div className={styles.editorLayout}>
        {/* Left Sidebar - Controls */}
        <aside className={styles.sidebar}>
          {/* Tab Navigation */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'device' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('device')}
            >
              📱 Device
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'captions' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('captions')}
            >
              💬 Captions
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'export' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('export')}
            >
              📤 Export
            </button>
          </div>

          {/* Tab Content */}
          <div className={styles.tabContent}>
            {/* Device Tab */}
            {activeTab === 'device' && (
              <div className={styles.section}>
                <h3>Screenshot</h3>
                <div className={styles.uploadSection}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    className={styles.uploadButton}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {screenshot ? 'Change Screenshot' : 'Upload Screenshot'}
                  </button>
                  {screenshot && (
                    <div className={styles.fileInfo}>
                      <span className={styles.fileName}>
                        {screenshotFile?.name || 'Screenshot uploaded'}
                      </span>
                    </div>
                  )}
                </div>

                <h3>Device Selection</h3>
                <div className={styles.control}>
                  <label>iPhone</label>
                  <select
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value as DeviceModel)}
                    className={styles.select}
                  >
                    {iPhones.map((device) => (
                      <option key={device.model} value={device.model}>
                        {device.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <h3>Orientation</h3>
                <div className={styles.orientationButtons}>
                  <button
                    className={`${styles.orientationButton} ${
                      orientation === 'portrait' ? styles.active : ''
                    }`}
                    onClick={() => setOrientation('portrait')}
                  >
                    📱 Portrait
                  </button>
                  <button
                    className={`${styles.orientationButton} ${
                      orientation === 'landscape' ? styles.active : ''
                    }`}
                    onClick={() => setOrientation('landscape')}
                  >
                    📐 Landscape
                  </button>
                </div>
              </div>
            )}

            {/* Captions Tab */}
            {activeTab === 'captions' && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3>Caption Layers</h3>
                  <button className={styles.addButton} onClick={handleAddCaption}>
                    + Add Caption
                  </button>
                </div>

                {captions.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No captions yet. Click "Add Caption" to get started.</p>
                  </div>
                ) : (
                  <div className={styles.captionList}>
                    {captions.map((layer) => (
                      <div
                        key={layer.id}
                        className={`${styles.captionItem} ${
                          selectedCaptionId === layer.id ? styles.selectedCaptionItem : ''
                        }`}
                        onClick={() => setSelectedCaptionId(layer.id)}
                      >
                        <div className={styles.captionItemHeader}>
                          <input
                            type="checkbox"
                            checked={layer.visible}
                            onChange={() => handleToggleCaptionVisibility(layer.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className={styles.captionItemText}>
                            {typeof layer.caption.text === 'string'
                              ? layer.caption.text
                              : Array.isArray(layer.caption.text) && layer.caption.text.length > 0
                              ? layer.caption.text[0].text
                              : 'Untitled Caption'}
                          </span>
                          <button
                            className={styles.deleteButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCaption(layer.id);
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Caption Editor */}
                {selectedCaption && (
                  <div className={styles.captionEditor}>
                    <h4>Edit Caption</h4>

                    <div className={styles.control}>
                      <label>Text</label>
                      <textarea
                        value={
                          typeof selectedCaption.caption.text === 'string'
                            ? selectedCaption.caption.text
                            : ''
                        }
                        onChange={(e) =>
                          handleUpdateCaption(selectedCaption.id, {
                            text: e.target.value,
                          })
                        }
                        rows={3}
                        className={styles.textarea}
                      />
                    </div>

                    <div className={styles.control}>
                      <label>Position</label>
                      <select
                        value={selectedCaption.caption.positioning.position}
                        onChange={(e) =>
                          handleUpdateCaption(selectedCaption.id, {
                            positioning: {
                              ...selectedCaption.caption.positioning,
                              position: e.target.value as CaptionPosition,
                            },
                          })
                        }
                        className={styles.select}
                      >
                        <option value="top-left">Top Left</option>
                        <option value="top-center">Top Center</option>
                        <option value="top-right">Top Right</option>
                        <option value="center-left">Center Left</option>
                        <option value="center">Center</option>
                        <option value="center-right">Center Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-center">Bottom Center</option>
                        <option value="bottom-right">Bottom Right</option>
                      </select>
                    </div>

                    <div className={styles.controlRow}>
                      <div className={styles.control}>
                        <label>Font Size</label>
                        <input
                          type="number"
                          value={selectedCaption.caption.style?.fontSize || 48}
                          onChange={(e) =>
                            handleUpdateCaption(selectedCaption.id, {
                              style: {
                                ...selectedCaption.caption.style,
                                fontSize: parseInt(e.target.value),
                              },
                            })
                          }
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.control}>
                        <label>Font Weight</label>
                        <select
                          value={selectedCaption.caption.style?.fontWeight || 700}
                          onChange={(e) =>
                            handleUpdateCaption(selectedCaption.id, {
                              style: {
                                ...selectedCaption.caption.style,
                                fontWeight: parseInt(e.target.value) as any,
                              },
                            })
                          }
                          className={styles.select}
                        >
                          <option value="400">Normal</option>
                          <option value="600">Semibold</option>
                          <option value="700">Bold</option>
                          <option value="900">Black</option>
                        </select>
                      </div>
                    </div>

                    <div className={styles.control}>
                      <label>Color</label>
                      <input
                        type="color"
                        value={selectedCaption.caption.style?.color || '#ffffff'}
                        onChange={(e) =>
                          handleUpdateCaption(selectedCaption.id, {
                            style: {
                              ...selectedCaption.caption.style,
                              color: e.target.value,
                            },
                          })
                        }
                        className={styles.colorInput}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Export Tab */}
            {activeTab === 'export' && (
              <div className={styles.section}>
                <h3>Export Settings</h3>

                <div className={styles.control}>
                  <label>Format</label>
                  <select className={styles.select}>
                    <option value="png">PNG</option>
                    <option value="jpg">JPG</option>
                  </select>
                </div>

                <div className={styles.control}>
                  <label>Quality</label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    defaultValue="100"
                    className={styles.slider}
                  />
                </div>

                <div className={styles.control}>
                  <label>
                    <input type="checkbox" defaultChecked />
                    Include device frame
                  </label>
                </div>

                <div className={styles.control}>
                  <label>
                    <input type="checkbox" defaultChecked />
                    Include captions
                  </label>
                </div>

                <button className={styles.primaryButton} onClick={handleExport}>
                  Export Screenshot
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Center - Preview */}
        <main className={styles.preview}>
          <div className={styles.previewHeader}>
            <h3>Preview</h3>
            <div className={styles.zoomControls}>
              <button
                className={styles.zoomButton}
                onClick={() => setZoom((z) => Math.max(0.1, z - 0.1))}
              >
                −
              </button>
              <span className={styles.zoomValue}>{Math.round(zoom * 100)}%</span>
              <button
                className={styles.zoomButton}
                onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
              >
                +
              </button>
              <button className={styles.zoomButton} onClick={() => setZoom(1)}>
                Reset
              </button>
            </div>
          </div>

          <div className={styles.previewCanvas} id="screenshot-preview">
            <div
              className={styles.previewContent}
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
              }}
            >
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {screenshot ? (
                  <DeviceFrame
                    device={selectedDevice}
                    orientation={orientation}
                    content={screenshot}
                    style={{
                      shadow: true,
                      shadowBlur: 40,
                      shadowColor: 'rgba(0, 0, 0, 0.3)',
                    }}
                  />
                ) : (
                  <div className={styles.emptyFrameState}>
                    <p>📱 Upload a screenshot to see preview</p>
                  </div>
                )}

                {/* Render caption overlays */}
                {captions
                  .filter((layer) => layer.visible)
                  .map((layer) => (
                    <CaptionOverlay key={layer.id} caption={layer.caption} locale="en-US" />
                  ))}
              </div>
            </div>
          </div>

          {!screenshot && (
            <div className={styles.previewPlaceholder}>
              <div className={styles.placeholderContent}>
                <span className={styles.placeholderIcon}>📱</span>
                <h3>No Screenshot Uploaded</h3>
                <p>Upload a screenshot to get started</p>
                <button
                  className={styles.uploadButtonLarge}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload Screenshot
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar - Layers */}
        <aside className={styles.rightSidebar}>
          <h3>Layers</h3>
          <div className={styles.layersList}>
            {screenshot && (
              <div className={styles.layerItem}>
                <span className={styles.layerIcon}>🖼️</span>
                <span className={styles.layerName}>Screenshot</span>
              </div>
            )}
            {captions.map((layer) => (
              <div
                key={layer.id}
                className={`${styles.layerItem} ${
                  selectedCaptionId === layer.id ? styles.selectedLayer : ''
                }`}
                onClick={() => setSelectedCaptionId(layer.id)}
              >
                <span className={styles.layerIcon}>💬</span>
                <span className={styles.layerName}>
                  {typeof layer.caption.text === 'string'
                    ? layer.caption.text
                    : Array.isArray(layer.caption.text) && layer.caption.text.length > 0
                    ? layer.caption.text[0].text
                    : 'Untitled'}
                </span>
                {!layer.visible && <span className={styles.hiddenBadge}>Hidden</span>}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
