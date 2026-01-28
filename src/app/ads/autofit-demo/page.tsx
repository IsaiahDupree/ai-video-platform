'use client';

import { useState } from 'react';
import AutoFitText from '../../../components/AutoFitText';

export default function AutoFitDemoPage() {
  const [text, setText] = useState(
    'Transform Your Workflow with AI-Powered Video Generation'
  );
  const [maxFontSize, setMaxFontSize] = useState(64);
  const [minFontSize, setMinFontSize] = useState(12);
  const [containerWidth, setContainerWidth] = useState(800);
  const [containerHeight, setContainerHeight] = useState(400);
  const [padding, setPadding] = useState(40);
  const [maxLines, setMaxLines] = useState<number | undefined>(undefined);
  const [fontWeight, setFontWeight] = useState(700);
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('center');
  const [verticalAlign, setVerticalAlign] = useState<'top' | 'middle' | 'bottom'>('middle');
  const [color, setColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('#3b82f6');
  const [isOverflowing, setIsOverflowing] = useState(false);

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem', fontSize: '2rem', fontWeight: 'bold' }}>
        AutoFitText Component Demo
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Preview */}
        <div>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
            Preview
          </h2>
          <div
            style={{
              background: bgColor,
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          >
            <AutoFitText
              text={text}
              maxFontSize={maxFontSize}
              minFontSize={minFontSize}
              containerWidth={containerWidth}
              containerHeight={containerHeight}
              padding={padding}
              maxLines={maxLines}
              fontWeight={fontWeight}
              align={align}
              verticalAlign={verticalAlign}
              color={color}
              onOverflow={setIsOverflowing}
            />
          </div>

          {isOverflowing && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: '#fef3c7',
                border: '1px solid #fbbf24',
                borderRadius: '8px',
                color: '#92400e',
                fontSize: '0.875rem',
              }}
            >
              ⚠️ Text is truncated. Consider increasing container size or reducing text length.
            </div>
          )}

          <div
            style={{
              marginTop: '1rem',
              fontSize: '0.875rem',
              color: '#6b7280',
            }}
          >
            Container: {containerWidth}px × {containerHeight}px (padding: {padding}px)
          </div>
        </div>

        {/* Controls */}
        <div>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
            Controls
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Text Content */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Text Content
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontFamily: 'inherit',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            {/* Font Sizes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Max Font Size: {maxFontSize}px
                </label>
                <input
                  type="range"
                  min="16"
                  max="120"
                  value={maxFontSize}
                  onChange={(e) => setMaxFontSize(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Min Font Size: {minFontSize}px
                </label>
                <input
                  type="range"
                  min="8"
                  max="48"
                  value={minFontSize}
                  onChange={(e) => setMinFontSize(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Container Dimensions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Width: {containerWidth}px
                </label>
                <input
                  type="range"
                  min="200"
                  max="1200"
                  value={containerWidth}
                  onChange={(e) => setContainerWidth(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Height: {containerHeight}px
                </label>
                <input
                  type="range"
                  min="100"
                  max="800"
                  value={containerHeight}
                  onChange={(e) => setContainerHeight(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Padding */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Padding: {padding}px
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={padding}
                onChange={(e) => setPadding(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            {/* Max Lines */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Max Lines: {maxLines || 'Unlimited'}
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={maxLines || 0}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMaxLines(val === 0 ? undefined : val);
                  }}
                  style={{ flex: 1 }}
                />
                <button
                  onClick={() => setMaxLines(undefined)}
                  style={{
                    padding: '0.25rem 0.75rem',
                    background: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Font Weight */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Font Weight: {fontWeight}
              </label>
              <select
                value={fontWeight}
                onChange={(e) => setFontWeight(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                }}
              >
                <option value="300">Light (300)</option>
                <option value="400">Regular (400)</option>
                <option value="500">Medium (500)</option>
                <option value="600">Semi-bold (600)</option>
                <option value="700">Bold (700)</option>
                <option value="800">Extra-bold (800)</option>
                <option value="900">Black (900)</option>
              </select>
            </div>

            {/* Alignment */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Horizontal Align
                </label>
                <select
                  value={align}
                  onChange={(e) => setAlign(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                  }}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Vertical Align
                </label>
                <select
                  value={verticalAlign}
                  onChange={(e) => setVerticalAlign(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                  }}
                >
                  <option value="top">Top</option>
                  <option value="middle">Middle</option>
                  <option value="bottom">Bottom</option>
                </select>
              </div>
            </div>

            {/* Colors */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Text Color
                </label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  style={{ width: '100%', height: '40px', cursor: 'pointer' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Background Color
                </label>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  style={{ width: '100%', height: '40px', cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* Preset Buttons */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Quick Presets
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    setText('Short text');
                    setContainerWidth(800);
                    setContainerHeight(400);
                  }}
                  style={{
                    padding: '0.5rem',
                    background: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Short Text
                </button>
                <button
                  onClick={() => {
                    setText(
                      'This is a much longer text that will demonstrate the text wrapping and auto-sizing capabilities of the AutoFitText component'
                    );
                    setContainerWidth(600);
                    setContainerHeight(300);
                  }}
                  style={{
                    padding: '0.5rem',
                    background: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Long Text
                </button>
                <button
                  onClick={() => {
                    setContainerWidth(1080);
                    setContainerHeight(1080);
                    setPadding(60);
                    setText('Instagram Square Ad');
                  }}
                  style={{
                    padding: '0.5rem',
                    background: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Instagram Square
                </button>
                <button
                  onClick={() => {
                    setContainerWidth(1080);
                    setContainerHeight(1920);
                    setPadding(80);
                    setText('Instagram Story Format');
                  }}
                  style={{
                    padding: '0.5rem',
                    background: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Instagram Story
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Documentation */}
      <div style={{ marginTop: '3rem', padding: '1.5rem', background: '#f9fafb', borderRadius: '12px' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
          Features
        </h2>
        <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
          <li>
            <strong>Shrink-to-fit:</strong> Automatically reduces font size to fit text within
            container
          </li>
          <li>
            <strong>Line wrapping:</strong> Breaks text into multiple lines when needed
          </li>
          <li>
            <strong>Line clamping:</strong> Limits maximum number of lines with ellipsis (...)
          </li>
          <li>
            <strong>Safe-area handling:</strong> Respects padding and container boundaries
          </li>
          <li>
            <strong>Alignment:</strong> Supports horizontal (left, center, right) and vertical (top,
            middle, bottom) alignment
          </li>
          <li>
            <strong>Overflow detection:</strong> Callback when text is truncated
          </li>
          <li>
            <strong>Customizable:</strong> Font size range, weight, family, colors, and more
          </li>
        </ul>
      </div>
    </div>
  );
}
