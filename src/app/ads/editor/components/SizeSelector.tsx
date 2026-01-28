'use client';

import { useState } from 'react';
import {
  getAllPlatforms,
  getSizesByPlatform,
  getRecommendedSizes,
  type AdSize,
} from '../../../../config/adSizes';
import styles from '../editor.module.css';

interface SizeSelectorProps {
  currentWidth: number;
  currentHeight: number;
  onSizeChange: (width: number, height: number, name: string) => void;
}

export default function SizeSelector({
  currentWidth,
  currentHeight,
  onSizeChange,
}: SizeSelectorProps) {
  const [filterMode, setFilterMode] = useState<'recommended' | 'platform'>('recommended');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('Instagram');

  const platforms = getAllPlatforms();

  // Get sizes based on filter mode
  const sizes = filterMode === 'recommended'
    ? getRecommendedSizes()
    : getSizesByPlatform(selectedPlatform as any);

  // Find if current size matches any preset
  const currentSizeId = sizes.find(
    (size) => size.width === currentWidth && size.height === currentHeight
  )?.id;

  return (
    <div className={styles.sizeSelector}>
      <div className={styles.formGroup}>
        <label className={styles.label}>Filter</label>
        <div className={styles.radioGroup}>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              value="recommended"
              checked={filterMode === 'recommended'}
              onChange={(e) => setFilterMode(e.target.value as any)}
            />
            Recommended
          </label>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              value="platform"
              checked={filterMode === 'platform'}
              onChange={(e) => setFilterMode(e.target.value as any)}
            />
            By Platform
          </label>
        </div>
      </div>

      {filterMode === 'platform' && (
        <div className={styles.formGroup}>
          <label className={styles.label}>Platform</label>
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className={styles.select}
          >
            {platforms.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={styles.formGroup}>
        <label className={styles.label}>Size Preset</label>
        <select
          value={currentSizeId || ''}
          onChange={(e) => {
            const size = sizes.find((s) => s.id === e.target.value);
            if (size) {
              onSizeChange(size.width, size.height, size.name);
            }
          }}
          className={styles.select}
        >
          <option value="">Select a size...</option>
          {sizes.map((size) => (
            <option key={size.id} value={size.id}>
              {size.name} - {size.width}x{size.height} ({size.aspectRatio})
            </option>
          ))}
        </select>
      </div>

      {/* Size Grid View */}
      <div className={styles.sizeGrid}>
        {sizes.slice(0, 6).map((size) => {
          const isSelected = size.width === currentWidth && size.height === currentHeight;
          return (
            <button
              key={size.id}
              className={`${styles.sizeCard} ${isSelected ? styles.sizeCardSelected : ''}`}
              onClick={() => onSizeChange(size.width, size.height, size.name)}
              title={size.description}
            >
              <div className={styles.sizeCardAspect}>
                <div
                  className={styles.sizeCardBox}
                  style={{
                    width: `${Math.min(100, (size.width / Math.max(size.width, size.height)) * 100)}%`,
                    height: `${Math.min(100, (size.height / Math.max(size.width, size.height)) * 100)}%`,
                  }}
                />
              </div>
              <div className={styles.sizeCardInfo}>
                <div className={styles.sizeCardName}>{size.name}</div>
                <div className={styles.sizeCardDimensions}>
                  {size.width}×{size.height}
                </div>
                <div className={styles.sizeCardRatio}>{size.aspectRatio}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Current size display */}
      <div className={styles.currentSize}>
        <div className={styles.currentSizeLabel}>Current Size:</div>
        <div className={styles.currentSizeValue}>
          {currentWidth} × {currentHeight}
        </div>
      </div>
    </div>
  );
}
