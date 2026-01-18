import React from 'react';
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  interpolate,
} from 'remotion';

// =============================================================================
// Static Ad Templates for Various Platforms
// =============================================================================

// Common ad sizes
export const AD_SIZES = {
  // Social Media
  instagram_post: { width: 1080, height: 1080, name: 'Instagram Post' },
  instagram_story: { width: 1080, height: 1920, name: 'Instagram Story' },
  facebook_post: { width: 1200, height: 630, name: 'Facebook Post' },
  facebook_cover: { width: 820, height: 312, name: 'Facebook Cover' },
  twitter_post: { width: 1200, height: 675, name: 'Twitter Post' },
  linkedin_post: { width: 1200, height: 627, name: 'LinkedIn Post' },
  pinterest_pin: { width: 1000, height: 1500, name: 'Pinterest Pin' },
  
  // Display Ads (IAB Standard)
  leaderboard: { width: 728, height: 90, name: 'Leaderboard' },
  medium_rectangle: { width: 300, height: 250, name: 'Medium Rectangle' },
  large_rectangle: { width: 336, height: 280, name: 'Large Rectangle' },
  wide_skyscraper: { width: 160, height: 600, name: 'Wide Skyscraper' },
  half_page: { width: 300, height: 600, name: 'Half Page' },
  billboard: { width: 970, height: 250, name: 'Billboard' },
  
  // Mobile
  mobile_banner: { width: 320, height: 50, name: 'Mobile Banner' },
  mobile_leaderboard: { width: 320, height: 100, name: 'Mobile Leaderboard' },
  mobile_interstitial: { width: 320, height: 480, name: 'Mobile Interstitial' },
} as const;

export type AdSize = keyof typeof AD_SIZES;

// =============================================================================
// Props Interface
// =============================================================================

export interface StaticAdProps {
  // Content
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  ctaUrl?: string;
  logoSrc?: string;
  backgroundImageSrc?: string;
  productImageSrc?: string;
  
  // Styling
  theme?: 'dark' | 'light' | 'gradient' | 'custom';
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  
  // Layout
  layout?: 'centered' | 'left' | 'right' | 'top' | 'bottom' | 'overlay';
  
  // Typography
  headlineSize?: number;
  subheadlineSize?: number;
  fontFamily?: string;
}

// =============================================================================
// Default Props
// =============================================================================

export const staticAdDefaultProps: StaticAdProps = {
  headline: 'Your Headline Here',
  subheadline: 'Supporting text that adds context',
  ctaText: 'Learn More',
  theme: 'gradient',
  primaryColor: '#6366f1',
  secondaryColor: '#8b5cf6',
  accentColor: '#f59e0b',
  textColor: '#ffffff',
  layout: 'centered',
  fontFamily: 'Inter, system-ui, sans-serif',
};

// =============================================================================
// Theme Backgrounds
// =============================================================================

const getBackgroundStyle = (props: StaticAdProps): React.CSSProperties => {
  const { theme, primaryColor, secondaryColor, backgroundColor, backgroundImageSrc } = props;
  
  if (backgroundImageSrc) {
    return {
      backgroundImage: `url(${backgroundImageSrc})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  
  switch (theme) {
    case 'dark':
      return { background: '#0a0a0a' };
    case 'light':
      return { background: '#ffffff' };
    case 'gradient':
      return {
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
      };
    case 'custom':
      return { background: backgroundColor || '#000000' };
    default:
      return { background: '#0a0a0a' };
  }
};

// =============================================================================
// CTA Button Component
// =============================================================================

const CTAButton: React.FC<{
  text: string;
  accentColor: string;
  size?: 'small' | 'medium' | 'large';
}> = ({ text, accentColor, size = 'medium' }) => {
  const sizes = {
    small: { padding: '8px 16px', fontSize: 12 },
    medium: { padding: '12px 24px', fontSize: 16 },
    large: { padding: '16px 32px', fontSize: 20 },
  };
  
  return (
    <div
      style={{
        backgroundColor: accentColor,
        color: '#000000',
        fontWeight: 700,
        borderRadius: 8,
        display: 'inline-block',
        ...sizes[size],
        fontFamily: 'Inter, system-ui, sans-serif',
        textTransform: 'uppercase',
        letterSpacing: 1,
      }}
    >
      {text}
    </div>
  );
};

// =============================================================================
// Main Static Ad Component
// =============================================================================

export const StaticAd: React.FC<StaticAdProps> = (props) => {
  const {
    headline,
    subheadline,
    ctaText,
    logoSrc,
    productImageSrc,
    primaryColor = '#6366f1',
    accentColor = '#f59e0b',
    textColor = '#ffffff',
    layout = 'centered',
    headlineSize = 48,
    subheadlineSize = 20,
    fontFamily = 'Inter, system-ui, sans-serif',
  } = { ...staticAdDefaultProps, ...props };

  const backgroundStyle = getBackgroundStyle(props);

  // Layout configurations
  const layoutStyles: Record<string, React.CSSProperties> = {
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
    },
    left: {
      justifyContent: 'center',
      alignItems: 'flex-start',
      textAlign: 'left',
      paddingLeft: 40,
    },
    right: {
      justifyContent: 'center',
      alignItems: 'flex-end',
      textAlign: 'right',
      paddingRight: 40,
    },
    top: {
      justifyContent: 'flex-start',
      alignItems: 'center',
      textAlign: 'center',
      paddingTop: 40,
    },
    bottom: {
      justifyContent: 'flex-end',
      alignItems: 'center',
      textAlign: 'center',
      paddingBottom: 40,
    },
    overlay: {
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
    },
  };

  return (
    <AbsoluteFill
      style={{
        ...backgroundStyle,
        display: 'flex',
        flexDirection: 'column',
        padding: 20,
        ...layoutStyles[layout],
      }}
    >
      {/* Overlay for background images */}
      {props.backgroundImageSrc && layout === 'overlay' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
          }}
        />
      )}

      {/* Logo */}
      {logoSrc && (
        <div style={{ marginBottom: 20, zIndex: 1 }}>
          <Img
            src={logoSrc}
            style={{ height: 40, objectFit: 'contain' }}
          />
        </div>
      )}

      {/* Product Image */}
      {productImageSrc && (
        <div style={{ marginBottom: 20, zIndex: 1 }}>
          <Img
            src={productImageSrc}
            style={{ maxHeight: 200, maxWidth: '80%', objectFit: 'contain' }}
          />
        </div>
      )}

      {/* Headline */}
      <h1
        style={{
          fontSize: headlineSize,
          fontWeight: 800,
          color: textColor,
          fontFamily,
          margin: 0,
          marginBottom: subheadline ? 12 : 20,
          lineHeight: 1.2,
          zIndex: 1,
          textShadow: props.backgroundImageSrc ? '0 2px 10px rgba(0,0,0,0.5)' : 'none',
          maxWidth: '90%',
        }}
      >
        {headline}
      </h1>

      {/* Subheadline */}
      {subheadline && (
        <p
          style={{
            fontSize: subheadlineSize,
            fontWeight: 400,
            color: textColor,
            fontFamily,
            margin: 0,
            marginBottom: 24,
            opacity: 0.9,
            lineHeight: 1.4,
            zIndex: 1,
            maxWidth: '85%',
          }}
        >
          {subheadline}
        </p>
      )}

      {/* CTA Button */}
      {ctaText && (
        <div style={{ zIndex: 1 }}>
          <CTAButton text={ctaText} accentColor={accentColor} />
        </div>
      )}
    </AbsoluteFill>
  );
};

// =============================================================================
// Specialized Ad Templates
// =============================================================================

// Product Showcase Ad
export const ProductShowcaseAd: React.FC<StaticAdProps & {
  productName?: string;
  price?: string;
  discount?: string;
}> = (props) => {
  const { productName = 'Product Name', price, discount, ...adProps } = props;
  
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${props.primaryColor || '#1a1a2e'} 0%, #0a0a1a 100%)`,
        display: 'flex',
        flexDirection: 'column',
        padding: 30,
      }}
    >
      {/* Product Image */}
      {props.productImageSrc && (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Img
            src={props.productImageSrc}
            style={{ maxHeight: '60%', maxWidth: '80%', objectFit: 'contain' }}
          />
        </div>
      )}
      
      {/* Product Info */}
      <div style={{ textAlign: 'center' }}>
        <h2
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: '#ffffff',
            fontFamily: 'Inter, system-ui, sans-serif',
            margin: 0,
            marginBottom: 8,
          }}
        >
          {productName}
        </h2>
        
        {price && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
            {discount && (
              <span
                style={{
                  fontSize: 18,
                  color: '#ff4444',
                  textDecoration: 'line-through',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                {discount}
              </span>
            )}
            <span
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: props.accentColor || '#f59e0b',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              {price}
            </span>
          </div>
        )}
        
        {props.ctaText && (
          <div style={{ marginTop: 16 }}>
            <CTAButton text={props.ctaText} accentColor={props.accentColor || '#f59e0b'} />
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// Sale/Promotion Ad
export const SaleAd: React.FC<StaticAdProps & {
  salePercentage?: string;
  saleText?: string;
  validUntil?: string;
}> = (props) => {
  const { salePercentage = '50%', saleText = 'OFF', validUntil } = props;
  
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, #ff4444 0%, #cc0000 100%)`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}
    >
      {/* Sale Badge */}
      <div
        style={{
          fontSize: 72,
          fontWeight: 900,
          color: '#ffffff',
          fontFamily: 'Inter, system-ui, sans-serif',
          lineHeight: 1,
        }}
      >
        {salePercentage}
      </div>
      <div
        style={{
          fontSize: 36,
          fontWeight: 700,
          color: '#ffffff',
          fontFamily: 'Inter, system-ui, sans-serif',
          marginTop: 4,
        }}
      >
        {saleText}
      </div>
      
      {/* Headline */}
      {props.headline && (
        <h2
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: '#ffffff',
            fontFamily: 'Inter, system-ui, sans-serif',
            marginTop: 20,
            textAlign: 'center',
          }}
        >
          {props.headline}
        </h2>
      )}
      
      {/* Valid Until */}
      {validUntil && (
        <p
          style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.8)',
            fontFamily: 'Inter, system-ui, sans-serif',
            marginTop: 12,
          }}
        >
          Valid until {validUntil}
        </p>
      )}
      
      {/* CTA */}
      {props.ctaText && (
        <div style={{ marginTop: 20 }}>
          <CTAButton text={props.ctaText} accentColor="#ffffff" />
        </div>
      )}
    </AbsoluteFill>
  );
};

// Testimonial Ad
export const TestimonialAd: React.FC<StaticAdProps & {
  quote?: string;
  authorName?: string;
  authorTitle?: string;
  authorImageSrc?: string;
  rating?: number;
}> = (props) => {
  const { quote = 'Amazing product!', authorName = 'Customer', authorTitle, authorImageSrc, rating } = props;
  
  return (
    <AbsoluteFill
      style={{
        background: props.backgroundColor || '#0a0a1a',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
      }}
    >
      {/* Rating Stars */}
      {rating && (
        <div style={{ marginBottom: 16, fontSize: 24 }}>
          {'⭐'.repeat(rating)}
        </div>
      )}
      
      {/* Quote */}
      <p
        style={{
          fontSize: 24,
          fontWeight: 500,
          color: '#ffffff',
          fontFamily: 'Inter, system-ui, sans-serif',
          textAlign: 'center',
          fontStyle: 'italic',
          lineHeight: 1.5,
          maxWidth: '90%',
          margin: 0,
        }}
      >
        "{quote}"
      </p>
      
      {/* Author */}
      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        {authorImageSrc && (
          <Img
            src={authorImageSrc}
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
        )}
        <div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: '#ffffff',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            {authorName}
          </div>
          {authorTitle && (
            <div
              style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.7)',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              {authorTitle}
            </div>
          )}
        </div>
      </div>
      
      {/* Logo */}
      {props.logoSrc && (
        <div style={{ marginTop: 24 }}>
          <Img src={props.logoSrc} style={{ height: 32, objectFit: 'contain' }} />
        </div>
      )}
    </AbsoluteFill>
  );
};

// Event/Announcement Ad
export const EventAd: React.FC<StaticAdProps & {
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
}> = (props) => {
  const { eventDate = 'Coming Soon', eventTime, eventLocation } = props;
  
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${props.primaryColor || '#6366f1'} 0%, ${props.secondaryColor || '#8b5cf6'} 100%)`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
      }}
    >
      {/* Logo */}
      {props.logoSrc && (
        <div style={{ marginBottom: 20 }}>
          <Img src={props.logoSrc} style={{ height: 40, objectFit: 'contain' }} />
        </div>
      )}
      
      {/* Event Name */}
      <h1
        style={{
          fontSize: 42,
          fontWeight: 800,
          color: '#ffffff',
          fontFamily: 'Inter, system-ui, sans-serif',
          textAlign: 'center',
          margin: 0,
          marginBottom: 16,
        }}
      >
        {props.headline}
      </h1>
      
      {/* Date/Time */}
      <div
        style={{
          background: 'rgba(255,255,255,0.2)',
          borderRadius: 12,
          padding: '12px 24px',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#ffffff',
            fontFamily: 'Inter, system-ui, sans-serif',
            textAlign: 'center',
          }}
        >
          {eventDate}
        </div>
        {eventTime && (
          <div
            style={{
              fontSize: 18,
              color: 'rgba(255,255,255,0.9)',
              fontFamily: 'Inter, system-ui, sans-serif',
              textAlign: 'center',
            }}
          >
            {eventTime}
          </div>
        )}
      </div>
      
      {/* Location */}
      {eventLocation && (
        <p
          style={{
            fontSize: 16,
            color: 'rgba(255,255,255,0.8)',
            fontFamily: 'Inter, system-ui, sans-serif',
            textAlign: 'center',
            margin: 0,
            marginBottom: 20,
          }}
        >
          📍 {eventLocation}
        </p>
      )}
      
      {/* CTA */}
      {props.ctaText && (
        <CTAButton text={props.ctaText} accentColor={props.accentColor || '#f59e0b'} />
      )}
    </AbsoluteFill>
  );
};

export default StaticAd;
