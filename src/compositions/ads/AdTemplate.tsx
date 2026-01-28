/**
 * AdTemplate - Main ad composition component
 * ADS-001: Static Ad Template System
 *
 * This component renders static ad templates using Remotion's Still API
 */

import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import type { AdTemplate as AdTemplateType, ElementPosition } from '../../types/adTemplate';
import { mergeAdStyle } from '../../types/adTemplate';

export interface AdTemplateProps {
  template: AdTemplateType;
}

/**
 * Get position styles for absolute positioning
 */
function getPositionStyles(position: ElementPosition, padding: number = 40): React.CSSProperties {
  const positions: Record<ElementPosition, React.CSSProperties> = {
    'top-left': { top: padding, left: padding },
    'top-center': { top: padding, left: '50%', transform: 'translateX(-50%)' },
    'top-right': { top: padding, right: padding },
    'center-left': { top: '50%', left: padding, transform: 'translateY(-50%)' },
    'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    'center-right': { top: '50%', right: padding, transform: 'translateY(-50%)' },
    'bottom-left': { bottom: padding, left: padding },
    'bottom-center': { bottom: padding, left: '50%', transform: 'translateX(-50%)' },
    'bottom-right': { bottom: padding, right: padding },
  };

  return positions[position];
}

/**
 * Get gradient background style
 */
function getGradientBackground(from: string, to: string, direction: string = 'to-right'): string {
  const directionMap: Record<string, string> = {
    'to-right': 'to right',
    'to-left': 'to left',
    'to-top': 'to top',
    'to-bottom': 'to bottom',
    'to-br': 'to bottom right',
    'to-tr': 'to top right',
  };

  return `linear-gradient(${directionMap[direction] || 'to right'}, ${from}, ${to})`;
}

/**
 * Main AdTemplate component
 */
export const AdTemplate: React.FC<AdTemplateProps> = ({ template }) => {
  const { dimensions, content, layout } = template;
  const style = mergeAdStyle(template.style);

  // Background styles
  const backgroundStyles: React.CSSProperties = {
    width: dimensions.width,
    height: dimensions.height,
  };

  if (content.gradient) {
    backgroundStyles.background = getGradientBackground(
      content.gradient.from,
      content.gradient.to,
      content.gradient.direction
    );
  } else if (content.backgroundColor) {
    backgroundStyles.backgroundColor = content.backgroundColor;
  } else {
    backgroundStyles.backgroundColor = '#000000';
  }

  // Render based on layout type
  return (
    <AbsoluteFill style={backgroundStyles}>
      {/* Background Image */}
      {content.backgroundImage && (
        <AbsoluteFill>
          <Img
            src={staticFile(content.backgroundImage)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          {/* Overlay */}
          {content.overlayOpacity !== undefined && content.overlayOpacity > 0 && (
            <AbsoluteFill
              style={{
                backgroundColor: content.overlayColor || 'rgba(0, 0, 0, 0.5)',
                opacity: content.overlayOpacity,
              }}
            />
          )}
        </AbsoluteFill>
      )}

      {/* Layout-specific rendering */}
      {layout === 'hero-text' && <HeroTextLayout template={template} style={style} />}
      {layout === 'split-horizontal' && <SplitHorizontalLayout template={template} style={style} />}
      {layout === 'split-vertical' && <SplitVerticalLayout template={template} style={style} />}
      {layout === 'text-only' && <TextOnlyLayout template={template} style={style} />}
      {layout === 'product-showcase' && <ProductShowcaseLayout template={template} style={style} />}
      {layout === 'quote' && <QuoteLayout template={template} style={style} />}
      {layout === 'minimal' && <MinimalLayout template={template} style={style} />}

      {/* Logo (positioned absolutely) */}
      {content.logo && content.logoPosition && (
        <div
          style={{
            position: 'absolute',
            ...getPositionStyles(content.logoPosition, style.padding),
            zIndex: 10,
          }}
        >
          <Img
            src={staticFile(content.logo)}
            style={{
              width: content.logoSize || 80,
              height: content.logoSize || 80,
              objectFit: 'contain',
            }}
          />
        </div>
      )}
    </AbsoluteFill>
  );
};

/**
 * Hero Text Layout - Large headline with text overlay
 */
const HeroTextLayout: React.FC<{ template: AdTemplateType; style: any }> = ({ template, style }) => {
  const { content } = template;

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: style.padding,
        textAlign: 'center',
      }}
    >
      {content.headline && (
        <h1
          style={{
            fontSize: style.headlineSize,
            fontFamily: style.headlineFont,
            fontWeight: style.headlineFontWeight,
            color: style.textColor,
            marginBottom: style.gap,
            lineHeight: 1.2,
            maxWidth: '90%',
            textShadow: style.shadow ? `0 2px ${style.shadowBlur}px ${style.shadowColor}` : 'none',
          }}
        >
          {content.headline}
        </h1>
      )}

      {content.subheadline && (
        <p
          style={{
            fontSize: style.bodySize * 1.2,
            fontFamily: style.bodyFont,
            fontWeight: style.bodyFontWeight,
            color: style.textColor,
            marginBottom: style.gap,
            lineHeight: 1.4,
            maxWidth: '80%',
          }}
        >
          {content.subheadline}
        </p>
      )}

      {content.cta && (
        <div
          style={{
            backgroundColor: style.ctaBackgroundColor,
            color: style.ctaTextColor,
            padding: `${style.gap * 0.75}px ${style.gap * 2}px`,
            borderRadius: style.borderRadius,
            fontSize: style.bodySize,
            fontFamily: style.bodyFont,
            fontWeight: 600,
            marginTop: style.gap,
            boxShadow: style.shadow ? `0 4px ${style.shadowBlur}px ${style.shadowColor}` : 'none',
          }}
        >
          {content.cta}
        </div>
      )}
    </AbsoluteFill>
  );
};

/**
 * Split Horizontal Layout - Left/right split
 */
const SplitHorizontalLayout: React.FC<{ template: AdTemplateType; style: any }> = ({ template, style }) => {
  const { content } = template;

  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'row' }}>
      {/* Left side - Image */}
      <div style={{ flex: 1, position: 'relative' }}>
        {content.productImage && (
          <Img
            src={staticFile(content.productImage)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
      </div>

      {/* Right side - Text */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: style.padding,
          backgroundColor: style.primaryColor,
        }}
      >
        {content.headline && (
          <h1
            style={{
              fontSize: style.headlineSize,
              fontFamily: style.headlineFont,
              fontWeight: style.headlineFontWeight,
              color: style.textColor,
              marginBottom: style.gap,
              lineHeight: 1.2,
            }}
          >
            {content.headline}
          </h1>
        )}

        {content.body && (
          <p
            style={{
              fontSize: style.bodySize,
              fontFamily: style.bodyFont,
              fontWeight: style.bodyFontWeight,
              color: style.textColor,
              marginBottom: style.gap,
              lineHeight: 1.6,
            }}
          >
            {content.body}
          </p>
        )}

        {content.cta && (
          <div
            style={{
              backgroundColor: style.ctaBackgroundColor,
              color: style.ctaTextColor,
              padding: `${style.gap * 0.75}px ${style.gap * 2}px`,
              borderRadius: style.borderRadius,
              fontSize: style.bodySize,
              fontFamily: style.bodyFont,
              fontWeight: 600,
              marginTop: style.gap,
              display: 'inline-block',
              alignSelf: 'flex-start',
            }}
          >
            {content.cta}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

/**
 * Split Vertical Layout - Top/bottom split
 */
const SplitVerticalLayout: React.FC<{ template: AdTemplateType; style: any }> = ({ template, style }) => {
  const { content } = template;

  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Top - Image */}
      <div style={{ flex: 1, position: 'relative' }}>
        {content.productImage && (
          <Img
            src={staticFile(content.productImage)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
      </div>

      {/* Bottom - Text */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: style.padding,
          backgroundColor: style.primaryColor,
          textAlign: 'center',
        }}
      >
        {content.headline && (
          <h1
            style={{
              fontSize: style.headlineSize,
              fontFamily: style.headlineFont,
              fontWeight: style.headlineFontWeight,
              color: style.textColor,
              marginBottom: style.gap,
              lineHeight: 1.2,
            }}
          >
            {content.headline}
          </h1>
        )}

        {content.subheadline && (
          <p
            style={{
              fontSize: style.bodySize,
              fontFamily: style.bodyFont,
              fontWeight: style.bodyFontWeight,
              color: style.textColor,
              lineHeight: 1.4,
            }}
          >
            {content.subheadline}
          </p>
        )}
      </div>
    </AbsoluteFill>
  );
};

/**
 * Text Only Layout - Text-focused with background
 */
const TextOnlyLayout: React.FC<{ template: AdTemplateType; style: any }> = ({ template, style }) => {
  const { content } = template;

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: style.padding * 2,
        textAlign: 'center',
      }}
    >
      {content.headline && (
        <h1
          style={{
            fontSize: style.headlineSize * 1.2,
            fontFamily: style.headlineFont,
            fontWeight: style.headlineFontWeight,
            color: style.textColor,
            marginBottom: style.gap * 1.5,
            lineHeight: 1.1,
            maxWidth: '90%',
          }}
        >
          {content.headline}
        </h1>
      )}

      {content.body && (
        <p
          style={{
            fontSize: style.bodySize * 1.1,
            fontFamily: style.bodyFont,
            fontWeight: style.bodyFontWeight,
            color: style.textColor,
            lineHeight: 1.6,
            maxWidth: '80%',
          }}
        >
          {content.body}
        </p>
      )}
    </AbsoluteFill>
  );
};

/**
 * Product Showcase Layout - Product image with details
 */
const ProductShowcaseLayout: React.FC<{ template: AdTemplateType; style: any }> = ({ template, style }) => {
  const { content } = template;

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: style.padding,
        gap: style.gap * 2,
      }}
    >
      {/* Product Image */}
      {content.productImage && (
        <div style={{ maxWidth: '60%', maxHeight: '50%' }}>
          <Img
            src={staticFile(content.productImage)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: style.borderRadius,
              boxShadow: style.shadow ? `0 8px ${style.shadowBlur * 2}px ${style.shadowColor}` : 'none',
            }}
          />
        </div>
      )}

      {/* Product Details */}
      <div style={{ textAlign: 'center', maxWidth: '80%' }}>
        {content.headline && (
          <h1
            style={{
              fontSize: style.headlineSize,
              fontFamily: style.headlineFont,
              fontWeight: style.headlineFontWeight,
              color: style.textColor,
              marginBottom: style.gap,
              lineHeight: 1.2,
            }}
          >
            {content.headline}
          </h1>
        )}

        {content.body && (
          <p
            style={{
              fontSize: style.bodySize,
              fontFamily: style.bodyFont,
              fontWeight: style.bodyFontWeight,
              color: style.textColor,
              marginBottom: style.gap,
              lineHeight: 1.6,
            }}
          >
            {content.body}
          </p>
        )}

        {content.cta && (
          <div
            style={{
              backgroundColor: style.ctaBackgroundColor,
              color: style.ctaTextColor,
              padding: `${style.gap * 0.75}px ${style.gap * 2}px`,
              borderRadius: style.borderRadius,
              fontSize: style.bodySize,
              fontFamily: style.bodyFont,
              fontWeight: 600,
              marginTop: style.gap,
              display: 'inline-block',
            }}
          >
            {content.cta}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

/**
 * Quote Layout - Quote-style with attribution
 */
const QuoteLayout: React.FC<{ template: AdTemplateType; style: any }> = ({ template, style }) => {
  const { content } = template;

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: style.padding * 2,
        textAlign: 'center',
      }}
    >
      {/* Quote symbol */}
      <div
        style={{
          fontSize: style.headlineSize * 2,
          fontFamily: 'Georgia, serif',
          color: style.secondaryColor,
          opacity: 0.3,
          lineHeight: 0.5,
          marginBottom: style.gap,
        }}
      >
        "
      </div>

      {content.headline && (
        <h1
          style={{
            fontSize: style.headlineSize * 0.9,
            fontFamily: style.headlineFont,
            fontWeight: style.headlineFontWeight,
            fontStyle: 'italic',
            color: style.textColor,
            marginBottom: style.gap * 2,
            lineHeight: 1.4,
            maxWidth: '85%',
          }}
        >
          {content.headline}
        </h1>
      )}

      {content.subheadline && (
        <p
          style={{
            fontSize: style.bodySize,
            fontFamily: style.bodyFont,
            fontWeight: 600,
            color: style.secondaryColor,
            lineHeight: 1.4,
          }}
        >
          — {content.subheadline}
        </p>
      )}
    </AbsoluteFill>
  );
};

/**
 * Minimal Layout - Minimal text and logo
 */
const MinimalLayout: React.FC<{ template: AdTemplateType; style: any }> = ({ template, style }) => {
  const { content } = template;

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: style.padding * 2,
      }}
    >
      {content.headline && (
        <h1
          style={{
            fontSize: style.headlineSize * 0.8,
            fontFamily: style.headlineFont,
            fontWeight: style.headlineFontWeight,
            color: style.textColor,
            textAlign: 'center',
            lineHeight: 1.3,
            maxWidth: '70%',
          }}
        >
          {content.headline}
        </h1>
      )}
    </AbsoluteFill>
  );
};
