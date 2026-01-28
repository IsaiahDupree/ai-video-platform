/**
 * ImagePositioningDemo - Demonstrates AdImage component (ADS-006)
 * Shows various image positioning techniques in static ads
 */

import React from 'react';
import { AbsoluteFill } from 'remotion';
import { AdImage, FocalPoints } from '../../components/AdImage';

/**
 * Hero Ad with Focal Point
 * Demonstrates cover mode with custom focal point
 */
export const HeroAdWithFocalPoint: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Background image with focal point */}
      <AdImage
        src="assets/images/hero-background.jpg"
        objectFit="cover"
        focalPoint={{ x: 0.6, y: 0.4 }}
        opacity={0.7}
      />

      {/* Content overlay */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '60px',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: '72px',
            fontWeight: 700,
            color: 'white',
            marginBottom: '20px',
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          }}
        >
          Premium Quality
        </h1>
        <p
          style={{
            fontSize: '28px',
            color: 'white',
            marginBottom: '40px',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
          }}
        >
          Exceptional products for exceptional people
        </p>
        <div
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '18px 48px',
            borderRadius: '8px',
            fontSize: '24px',
            fontWeight: 600,
            boxShadow: '0 8px 30px rgba(59, 130, 246, 0.4)',
          }}
        >
          Shop Now
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * Product Showcase with Rounded Images
 * Demonstrates borderRadius and contain mode
 */
export const ProductShowcase: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px',
      }}
    >
      {/* Product image with rounded corners */}
      <div style={{ marginBottom: '40px' }}>
        <AdImage
          src="assets/images/product-shot.jpg"
          objectFit="contain"
          width={600}
          height={450}
          borderRadius={20}
          shadow
          shadowStyle="0 20px 60px rgba(0, 0, 0, 0.3)"
        />
      </div>

      <h2
        style={{
          fontSize: '56px',
          fontWeight: 700,
          color: 'white',
          marginBottom: '16px',
          textAlign: 'center',
        }}
      >
        New Collection
      </h2>
      <p
        style={{
          fontSize: '24px',
          color: 'rgba(255, 255, 255, 0.9)',
          textAlign: 'center',
        }}
      >
        Available Now
      </p>
    </AbsoluteFill>
  );
};

/**
 * Profile/Testimonial Ad with Circular Image
 * Demonstrates circular image with focal point
 */
export const TestimonialAd: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#f9fafb',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px',
      }}
    >
      {/* Circular profile image */}
      <div style={{ marginBottom: '40px' }}>
        <AdImage
          src="assets/images/testimonial-photo.jpg"
          objectFit="cover"
          focalPoint={FocalPoints.TOP_CENTER}
          width={200}
          height={200}
          borderRadius={999}
          borderWidth={6}
          borderColor="white"
          shadow
          shadowStyle="0 10px 40px rgba(0, 0, 0, 0.15)"
        />
      </div>

      <div
        style={{
          fontSize: '80px',
          fontFamily: 'Georgia, serif',
          color: '#667eea',
          opacity: 0.3,
          lineHeight: 0.5,
          marginBottom: '20px',
        }}
      >
        "
      </div>

      <p
        style={{
          fontSize: '32px',
          fontWeight: 400,
          fontStyle: 'italic',
          color: '#111',
          maxWidth: '800px',
          textAlign: 'center',
          lineHeight: 1.5,
          marginBottom: '30px',
        }}
      >
        This product changed my life. Highly recommended!
      </p>

      <p
        style={{
          fontSize: '20px',
          fontWeight: 600,
          color: '#667eea',
        }}
      >
        — Sarah Johnson, CEO
      </p>
    </AbsoluteFill>
  );
};

/**
 * Split Layout with Image Positioning
 * Demonstrates split layout with focal point control
 */
export const SplitLayoutAd: React.FC = () => {
  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'row' }}>
      {/* Left side - Image with custom focal point */}
      <div style={{ flex: 1, position: 'relative' }}>
        <AdImage
          src="assets/images/lifestyle-photo.jpg"
          objectFit="cover"
          focalPoint={{ x: 0.7, y: 0.5 }}
        />
      </div>

      {/* Right side - Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px',
          backgroundColor: '#1f2937',
        }}
      >
        <h2
          style={{
            fontSize: '56px',
            fontWeight: 700,
            color: 'white',
            marginBottom: '24px',
            lineHeight: 1.2,
          }}
        >
          Live Better
        </h2>

        <p
          style={{
            fontSize: '24px',
            color: '#d1d5db',
            marginBottom: '40px',
            lineHeight: 1.6,
          }}
        >
          Discover products that make everyday life extraordinary
        </p>

        <div
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '18px 48px',
            borderRadius: '8px',
            fontSize: '24px',
            fontWeight: 600,
            display: 'inline-block',
            alignSelf: 'flex-start',
          }}
        >
          Explore
        </div>
      </div>
    </AbsoluteFill>
  );
};

/**
 * Multi-Image Grid with Various Positioning
 * Demonstrates multiple images with different settings
 */
export const MultiImageGrid: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: 'white',
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '30px',
      }}
    >
      {/* Title */}
      <h1
        style={{
          fontSize: '48px',
          fontWeight: 700,
          color: '#111',
          textAlign: 'center',
          marginBottom: '10px',
        }}
      >
        Our Collection
      </h1>

      {/* Grid of images */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          flex: 1,
        }}
      >
        {/* Image 1 - Cover with center focal point */}
        <AdImage
          src="assets/images/product1.jpg"
          objectFit="cover"
          focalPoint={FocalPoints.CENTER}
          borderRadius={12}
          shadow
        />

        {/* Image 2 - Cover with top focal point */}
        <AdImage
          src="assets/images/product2.jpg"
          objectFit="cover"
          focalPoint={FocalPoints.TOP_CENTER}
          borderRadius={12}
          shadow
        />

        {/* Image 3 - Cover with right focal point */}
        <AdImage
          src="assets/images/product3.jpg"
          objectFit="cover"
          focalPoint={FocalPoints.CENTER_RIGHT}
          borderRadius={12}
          shadow
        />

        {/* Image 4 - Cover with bottom focal point */}
        <AdImage
          src="assets/images/product4.jpg"
          objectFit="cover"
          focalPoint={FocalPoints.BOTTOM_CENTER}
          borderRadius={12}
          shadow
        />

        {/* Image 5 - Contain mode */}
        <AdImage
          src="assets/images/product5.jpg"
          objectFit="contain"
          borderRadius={12}
          shadow
        />

        {/* Image 6 - Cover with custom focal point */}
        <AdImage
          src="assets/images/product6.jpg"
          objectFit="cover"
          focalPoint={{ x: 0.8, y: 0.6 }}
          borderRadius={12}
          shadow
        />
      </div>
    </AbsoluteFill>
  );
};

/**
 * Logo Banner with Contain Mode
 * Demonstrates contain mode for logos
 */
export const LogoBanner: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '40px 80px',
      }}
    >
      {/* Logo 1 */}
      <AdImage
        src="assets/logos/logo1.png"
        objectFit="contain"
        width={200}
        height={100}
        opacity={0.8}
      />

      {/* Logo 2 */}
      <AdImage
        src="assets/logos/logo2.png"
        objectFit="contain"
        width={200}
        height={100}
        opacity={0.8}
      />

      {/* Logo 3 */}
      <AdImage
        src="assets/logos/logo3.png"
        objectFit="contain"
        width={200}
        height={100}
        opacity={0.8}
      />

      {/* Logo 4 */}
      <AdImage
        src="assets/logos/logo4.png"
        objectFit="contain"
        width={200}
        height={100}
        opacity={0.8}
      />
    </AbsoluteFill>
  );
};
