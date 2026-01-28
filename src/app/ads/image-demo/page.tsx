/**
 * AdImage Demo Page - ADS-006
 * Demonstrates all AdImage positioning features
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function AdImageDemo() {
  const [selectedDemo, setSelectedDemo] = useState<string>('cover');

  const demos = {
    cover: {
      title: 'Cover Mode',
      description: 'Image covers the entire container, cropped to fit',
      code: `<AdImage
  src="assets/images/hero.jpg"
  objectFit="cover"
  focalPoint={{ x: 0.5, y: 0.5 }}
  width={400}
  height={300}
/>`,
    },
    contain: {
      title: 'Contain Mode',
      description: 'Entire image visible within container, no cropping',
      code: `<AdImage
  src="assets/images/logo.png"
  objectFit="contain"
  width={400}
  height={300}
/>`,
    },
    focalPoint: {
      title: 'Focal Point Positioning',
      description: 'Control which part of the image is visible when cropped',
      code: `<AdImage
  src="assets/images/portrait.jpg"
  objectFit="cover"
  focalPoint={{ x: 0.7, y: 0.3 }}
  width={400}
  height={400}
/>`,
    },
    rounded: {
      title: 'Rounded Corners',
      description: 'Apply border radius for rounded or circular images',
      code: `<AdImage
  src="assets/images/product.jpg"
  objectFit="cover"
  borderRadius={20}
  width={400}
  height={300}
/>`,
    },
    circle: {
      title: 'Circular Image',
      description: 'Perfect circle with borderRadius={999}',
      code: `<AdImage
  src="assets/images/profile.jpg"
  objectFit="cover"
  focalPoint={{ x: 0.5, y: 0.3 }}
  borderRadius={999}
  width={300}
  height={300}
/>`,
    },
    border: {
      title: 'Border & Shadow',
      description: 'Add borders and shadows for depth',
      code: `<AdImage
  src="assets/images/feature.jpg"
  objectFit="cover"
  borderRadius={16}
  borderWidth={4}
  borderColor="#3b82f6"
  shadow
  width={400}
  height={300}
/>`,
    },
    opacity: {
      title: 'Opacity Control',
      description: 'Adjust image transparency',
      code: `<AdImage
  src="assets/images/background.jpg"
  objectFit="cover"
  opacity={0.6}
  width={400}
  height={300}
/>`,
    },
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 2rem'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>
            AdImage Component Demo
          </h1>
          <Link
            href="/ads/editor"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '0.875rem'
            }}
          >
            Back to Editor
          </Link>
        </div>
      </header>

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem'
      }}>
        {/* Feature Overview */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            Image Positioning Controls (ADS-006)
          </h2>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            The AdImage component provides advanced positioning controls for static ads:
          </p>
          <ul style={{ color: '#666', paddingLeft: '1.5rem' }}>
            <li>Object fit modes: cover, contain, fill, none</li>
            <li>Focal point positioning with x/y coordinates (0-1 range)</li>
            <li>Border radius for rounded corners and circular images</li>
            <li>Border width and color customization</li>
            <li>Shadow effects with custom styles</li>
            <li>Opacity control for overlays</li>
          </ul>
        </div>

        {/* Demo Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {Object.entries(demos).map(([key, demo]) => (
            <div
              key={key}
              onClick={() => setSelectedDemo(key)}
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                border: selectedDemo === key ? '2px solid #3b82f6' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '0.5rem',
                color: selectedDemo === key ? '#3b82f6' : '#111'
              }}>
                {demo.title}
              </h3>
              <p style={{
                color: '#666',
                fontSize: '0.875rem',
                marginBottom: '1rem'
              }}>
                {demo.description}
              </p>

              {/* Visual Preview Placeholder */}
              <div style={{
                width: '100%',
                height: '150px',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  ...(key === 'rounded' && { borderRadius: '20px' }),
                  ...(key === 'circle' && { borderRadius: '50%', width: '150px', height: '150px' }),
                  ...(key === 'border' && {
                    border: '4px solid #3b82f6',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                  }),
                  ...(key === 'opacity' && { opacity: 0.6 }),
                  ...(key === 'contain' && {
                    width: '80%',
                    height: '80%',
                    margin: 'auto'
                  }),
                }}></div>
              </div>

              {/* Code Preview */}
              <pre style={{
                backgroundColor: '#1f2937',
                color: '#d1d5db',
                padding: '1rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                overflow: 'auto',
                margin: 0
              }}>
                <code>{demo.code}</code>
              </pre>
            </div>
          ))}
        </div>

        {/* Implementation Guide */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            Implementation Guide
          </h2>

          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', marginTop: '1.5rem' }}>
            Import
          </h3>
          <pre style={{
            backgroundColor: '#1f2937',
            color: '#d1d5db',
            padding: '1rem',
            borderRadius: '6px',
            fontSize: '0.875rem',
            overflow: 'auto'
          }}>
            <code>{`import { AdImage, FocalPoints } from '@/components/AdImage';`}</code>
          </pre>

          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', marginTop: '1.5rem' }}>
            Focal Point Presets
          </h3>
          <pre style={{
            backgroundColor: '#1f2937',
            color: '#d1d5db',
            padding: '1rem',
            borderRadius: '6px',
            fontSize: '0.875rem',
            overflow: 'auto'
          }}>
            <code>{`FocalPoints.CENTER        // { x: 0.5, y: 0.5 }
FocalPoints.TOP_LEFT      // { x: 0, y: 0 }
FocalPoints.TOP_CENTER    // { x: 0.5, y: 0 }
FocalPoints.TOP_RIGHT     // { x: 1, y: 0 }
FocalPoints.CENTER_LEFT   // { x: 0, y: 0.5 }
FocalPoints.CENTER_RIGHT  // { x: 1, y: 0.5 }
FocalPoints.BOTTOM_LEFT   // { x: 0, y: 1 }
FocalPoints.BOTTOM_CENTER // { x: 0.5, y: 1 }
FocalPoints.BOTTOM_RIGHT  // { x: 1, y: 1 }`}</code>
          </pre>

          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', marginTop: '1.5rem' }}>
            Helper Functions
          </h3>
          <pre style={{
            backgroundColor: '#1f2937',
            color: '#d1d5db',
            padding: '1rem',
            borderRadius: '6px',
            fontSize: '0.875rem',
            overflow: 'auto'
          }}>
            <code>{`// Create focal point from percentages
createFocalPoint(70, 30); // { x: 0.7, y: 0.3 }

// Create focal point from pixel coordinates
createFocalPointFromPixels(800, 400, 1920, 1080);`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
