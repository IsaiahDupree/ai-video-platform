'use client';

/**
 * Screenshot Resize Demo Page
 * APP-003: Screenshot Size Generator
 *
 * Interactive demo for batch resizing screenshots to App Store dimensions
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  getAllScreenshotSizes,
  getScreenshotSizesByType,
  getScreenshotSizes,
  getRecommendedSizes,
} from '@/config/screenshotSizes';
import { ScreenshotSize } from '@/types/screenshotResize';
import { DeviceType, Orientation } from '@/types/deviceFrame';
import styles from './resize.module.css';

export default function ScreenshotResizePage() {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [selectedDeviceTypes, setSelectedDeviceTypes] = useState<DeviceType[]>(['iphone']);
  const [selectedOrientations, setSelectedOrientations] = useState<Orientation[]>([
    'portrait',
  ]);
  const [resizeMode, setResizeMode] = useState<'contain' | 'cover' | 'fill'>('contain');
  const [quality, setQuality] = useState(95);
  const [format, setFormat] = useState<'png' | 'jpg' | 'webp'>('png');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<Array<{ size: ScreenshotSize; dataUrl: string }>>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSourceImage(event.target?.result as string);
        setResults([]);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Handle device type toggle
  const toggleDeviceType = (deviceType: DeviceType) => {
    setSelectedDeviceTypes((prev) =>
      prev.includes(deviceType)
        ? prev.filter((t) => t !== deviceType)
        : [...prev, deviceType]
    );
  };

  // Handle orientation toggle
  const toggleOrientation = (orientation: Orientation) => {
    setSelectedOrientations((prev) =>
      prev.includes(orientation)
        ? prev.filter((o) => o !== orientation)
        : [...prev, orientation]
    );
  };

  // Resize image using canvas
  const resizeImage = useCallback(
    async (sourceUrl: string, targetSize: ScreenshotSize): Promise<string> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          canvas.width = targetSize.width;
          canvas.height = targetSize.height;

          // Calculate dimensions based on resize mode
          let sx = 0,
            sy = 0,
            sWidth = img.width,
            sHeight = img.height;
          let dx = 0,
            dy = 0,
            dWidth = targetSize.width,
            dHeight = targetSize.height;

          const sourceRatio = img.width / img.height;
          const targetRatio = targetSize.width / targetSize.height;

          if (resizeMode === 'contain') {
            // Scale to fit within bounds, center
            if (sourceRatio > targetRatio) {
              dHeight = targetSize.width / sourceRatio;
              dy = (targetSize.height - dHeight) / 2;
            } else {
              dWidth = targetSize.height * sourceRatio;
              dx = (targetSize.width - dWidth) / 2;
            }
          } else if (resizeMode === 'cover') {
            // Scale to cover, crop if needed
            if (sourceRatio > targetRatio) {
              sWidth = img.height * targetRatio;
              sx = (img.width - sWidth) / 2;
            } else {
              sHeight = img.width / targetRatio;
              sy = (img.height - sHeight) / 2;
            }
          } else if (resizeMode === 'fill') {
            // Stretch to fill (already set)
          }

          // Clear canvas with white background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw image
          ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

          // Convert to data URL
          const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
          const dataUrl = canvas.toDataURL(mimeType, quality / 100);

          resolve(dataUrl);
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = sourceUrl;
      });
    },
    [resizeMode, quality, format]
  );

  // Process resize
  const handleResize = useCallback(async () => {
    if (!sourceImage) return;

    setProcessing(true);
    setResults([]);

    try {
      // Get target sizes
      const targetSizes = getScreenshotSizes({
        deviceTypes: selectedDeviceTypes,
        orientations: selectedOrientations,
      });

      if (targetSizes.length === 0) {
        alert('Please select at least one device type and orientation');
        setProcessing(false);
        return;
      }

      // Resize each size
      const resizePromises = targetSizes.map(async (size) => {
        const dataUrl = await resizeImage(sourceImage, size);
        return { size, dataUrl };
      });

      const resizedResults = await Promise.all(resizePromises);
      setResults(resizedResults);
    } catch (error) {
      console.error('Resize error:', error);
      alert(`Resize failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  }, [
    sourceImage,
    selectedDeviceTypes,
    selectedOrientations,
    resizeImage,
  ]);

  // Download single result
  const downloadResult = (result: { size: ScreenshotSize; dataUrl: string }) => {
    const link = document.createElement('a');
    link.href = result.dataUrl;
    link.download = `${result.size.model}_${result.size.width}x${result.size.height}_${result.size.orientation}.${format}`;
    link.click();
  };

  // Download all results as ZIP
  const downloadAllAsZip = async () => {
    if (results.length === 0) return;

    // For now, download individually
    // In production, use JSZip library
    results.forEach((result, index) => {
      setTimeout(() => downloadResult(result), index * 100);
    });
  };

  // Use recommended sizes
  const useRecommendedSizes = () => {
    setSelectedDeviceTypes(['iphone', 'ipad', 'mac', 'watch', 'tv', 'vision']);
    setSelectedOrientations(['portrait', 'landscape']);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Screenshot Size Generator</h1>
        <p>Batch resize screenshots to all required App Store dimensions</p>
      </header>

      <div className={styles.content}>
        {/* Upload Section */}
        <section className={styles.section}>
          <h2>1. Upload Screenshot</h2>
          <div className={styles.uploadArea}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className={styles.fileInput}
              id="file-upload"
            />
            <label htmlFor="file-upload" className={styles.uploadLabel}>
              {sourceImage ? (
                <img src={sourceImage} alt="Source" className={styles.previewImage} />
              ) : (
                <div className={styles.uploadPrompt}>
                  <span className={styles.uploadIcon}>📤</span>
                  <span>Click to upload screenshot</span>
                  <span className={styles.uploadHint}>PNG, JPG, or WebP</span>
                </div>
              )}
            </label>
          </div>
        </section>

        {/* Configuration Section */}
        {sourceImage && (
          <section className={styles.section}>
            <h2>2. Configure Resize</h2>

            {/* Device Types */}
            <div className={styles.configGroup}>
              <label className={styles.configLabel}>Device Types:</label>
              <div className={styles.buttonGroup}>
                {(['iphone', 'ipad', 'mac', 'watch', 'tv', 'vision'] as DeviceType[]).map(
                  (type) => (
                    <button
                      key={type}
                      className={`${styles.toggleButton} ${
                        selectedDeviceTypes.includes(type) ? styles.active : ''
                      }`}
                      onClick={() => toggleDeviceType(type)}
                    >
                      {type === 'iphone' && '📱'}
                      {type === 'ipad' && '📲'}
                      {type === 'mac' && '💻'}
                      {type === 'watch' && '⌚'}
                      {type === 'tv' && '📺'}
                      {type === 'vision' && '🥽'}
                      {' '}
                      {type.toUpperCase()}
                    </button>
                  )
                )}
                <button className={styles.actionButton} onClick={useRecommendedSizes}>
                  Use Recommended
                </button>
              </div>
            </div>

            {/* Orientations */}
            <div className={styles.configGroup}>
              <label className={styles.configLabel}>Orientations:</label>
              <div className={styles.buttonGroup}>
                {(['portrait', 'landscape'] as Orientation[]).map((orientation) => (
                  <button
                    key={orientation}
                    className={`${styles.toggleButton} ${
                      selectedOrientations.includes(orientation) ? styles.active : ''
                    }`}
                    onClick={() => toggleOrientation(orientation)}
                  >
                    {orientation === 'portrait' ? '📱' : '📱↔️'}{' '}
                    {orientation.charAt(0).toUpperCase() + orientation.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Resize Mode */}
            <div className={styles.configGroup}>
              <label className={styles.configLabel}>Resize Mode:</label>
              <div className={styles.buttonGroup}>
                <button
                  className={`${styles.toggleButton} ${
                    resizeMode === 'contain' ? styles.active : ''
                  }`}
                  onClick={() => setResizeMode('contain')}
                  title="Fit within bounds (recommended)"
                >
                  Contain
                </button>
                <button
                  className={`${styles.toggleButton} ${
                    resizeMode === 'cover' ? styles.active : ''
                  }`}
                  onClick={() => setResizeMode('cover')}
                  title="Cover entire area (may crop)"
                >
                  Cover
                </button>
                <button
                  className={`${styles.toggleButton} ${
                    resizeMode === 'fill' ? styles.active : ''
                  }`}
                  onClick={() => setResizeMode('fill')}
                  title="Stretch to fit (may distort)"
                >
                  Fill
                </button>
              </div>
            </div>

            {/* Format and Quality */}
            <div className={styles.configRow}>
              <div className={styles.configGroup}>
                <label className={styles.configLabel}>Format:</label>
                <select
                  className={styles.select}
                  value={format}
                  onChange={(e) => setFormat(e.target.value as any)}
                >
                  <option value="png">PNG</option>
                  <option value="jpg">JPG</option>
                  <option value="webp">WebP</option>
                </select>
              </div>

              <div className={styles.configGroup}>
                <label className={styles.configLabel}>
                  Quality: {quality}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value))}
                  className={styles.slider}
                />
              </div>
            </div>

            {/* Resize Button */}
            <button
              className={styles.primaryButton}
              onClick={handleResize}
              disabled={processing}
            >
              {processing ? 'Processing...' : `Generate ${getScreenshotSizes({
                deviceTypes: selectedDeviceTypes,
                orientations: selectedOrientations,
              }).length} Sizes`}
            </button>
          </section>
        )}

        {/* Results Section */}
        {results.length > 0 && (
          <section className={styles.section}>
            <div className={styles.resultsHeader}>
              <h2>3. Download Results ({results.length})</h2>
              <button className={styles.actionButton} onClick={downloadAllAsZip}>
                Download All
              </button>
            </div>

            <div className={styles.resultsGrid}>
              {results.map((result, index) => (
                <div key={index} className={styles.resultCard}>
                  <div className={styles.resultImageContainer}>
                    <img
                      src={result.dataUrl}
                      alt={result.size.name}
                      className={styles.resultImage}
                    />
                  </div>
                  <div className={styles.resultInfo}>
                    <div className={styles.resultName}>{result.size.name}</div>
                    <div className={styles.resultDimensions}>
                      {result.size.width} × {result.size.height}
                    </div>
                    <div className={styles.resultMeta}>
                      {result.size.deviceType.toUpperCase()} · {result.size.orientation}
                    </div>
                    <button
                      className={styles.downloadButton}
                      onClick={() => downloadResult(result)}
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
