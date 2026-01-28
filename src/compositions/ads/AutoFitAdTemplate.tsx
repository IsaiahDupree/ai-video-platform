/**
 * AutoFitAdTemplate - Example Remotion composition using AutoFitText
 *
 * This demonstrates how to integrate AutoFitText into Remotion compositions
 * for static ad generation with automatic text sizing.
 */

import { AbsoluteFill } from 'remotion';
import { AdTemplate } from '../../types/adTemplate';
import AutoFitText from '../../components/AutoFitText';

interface AutoFitAdTemplateProps {
  template: AdTemplate;
}

export const AutoFitAdTemplate: React.FC<AutoFitAdTemplateProps> = ({ template }) => {
  const { width, height } = template.dimensions;
  const padding = template.style?.padding || 40;
  const gap = template.style?.gap || 16;

  // Background gradient or solid color
  const background =
    template.content.gradient
      ? `linear-gradient(135deg, ${template.content.gradient.from}, ${template.content.gradient.to})`
      : template.content.backgroundColor || template.style?.primaryColor || '#3b82f6';

  return (
    <AbsoluteFill
      style={{
        background,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap,
      }}
    >
      {/* Headline with auto-fit */}
      {template.content.headline && (
        <AutoFitText
          text={template.content.headline}
          containerWidth={width}
          containerHeight={height * 0.4} // 40% of height for headline
          maxFontSize={Number(template.style?.headlineSize || 72)}
          minFontSize={24}
          fontWeight={Number(template.style?.headlineFontWeight || 700)}
          fontFamily={template.style?.headlineFont || 'Inter, sans-serif'}
          color={template.style?.textColor || '#ffffff'}
          padding={padding}
          align="center"
          verticalAlign="middle"
          maxLines={3}
          onOverflow={(isTruncated) => {
            if (isTruncated) {
              console.warn('Headline was truncated:', template.content.headline);
            }
          }}
        />
      )}

      {/* Subheadline with auto-fit */}
      {template.content.subheadline && (
        <AutoFitText
          text={template.content.subheadline}
          containerWidth={width}
          containerHeight={height * 0.25} // 25% of height for subheadline
          maxFontSize={Number(template.style?.bodySize || 32)}
          minFontSize={16}
          fontWeight={Number(template.style?.bodyFontWeight || 400)}
          fontFamily={template.style?.bodyFont || template.style?.headlineFont || 'Inter'}
          color={template.style?.textColor || '#ffffff'}
          padding={padding}
          align="center"
          verticalAlign="middle"
          maxLines={4}
        />
      )}

      {/* CTA Button */}
      {template.content.cta && (
        <div
          style={{
            background: template.style?.ctaBackgroundColor || '#ffffff',
            color: template.style?.ctaTextColor || '#3b82f6',
            padding: '16px 48px',
            borderRadius: template.style?.borderRadius || 8,
            fontFamily: template.style?.bodyFont || 'Inter',
            fontWeight: 600,
            fontSize: 18,
            cursor: 'pointer',
            boxShadow: template.style?.shadow ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
          }}
        >
          {template.content.cta}
        </div>
      )}
    </AbsoluteFill>
  );
};

/**
 * Example: Quote layout with auto-fit
 */
export const AutoFitQuoteTemplate: React.FC<AutoFitAdTemplateProps> = ({ template }) => {
  const { width, height } = template.dimensions;
  const padding = template.style?.padding || 60;

  const background =
    template.content.gradient
      ? `linear-gradient(135deg, ${template.content.gradient.from}, ${template.content.gradient.to})`
      : template.content.backgroundColor || '#1e293b';

  return (
    <AbsoluteFill
      style={{
        background,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding,
      }}
    >
      {/* Quote mark */}
      <div
        style={{
          fontSize: 120,
          color: template.style?.textColor || '#ffffff',
          opacity: 0.3,
          fontFamily: 'Georgia, serif',
          lineHeight: 1,
          marginBottom: -40,
        }}
      >
        "
      </div>

      {/* Quote text with auto-fit */}
      <AutoFitText
        text={template.content.headline || ''}
        containerWidth={width}
        containerHeight={height * 0.5}
        maxFontSize={48}
        minFontSize={20}
        fontWeight={500}
        fontFamily={template.style?.headlineFont || 'Inter, sans-serif'}
        color={template.style?.textColor || '#ffffff'}
        padding={padding}
        align="center"
        verticalAlign="middle"
        maxLines={6}
        lineHeight={1.4}
      />

      {/* Author */}
      {template.content.authorName && (
        <div
          style={{
            marginTop: 40,
            textAlign: 'center',
            color: template.style?.textColor || '#ffffff',
            fontFamily: template.style?.bodyFont || 'Inter',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 20 }}>{template.content.authorName}</div>
          {template.content.authorTitle && (
            <div style={{ fontWeight: 400, fontSize: 16, opacity: 0.8, marginTop: 8 }}>
              {template.content.authorTitle}
            </div>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};

/**
 * Example: Minimal layout with auto-fit
 */
export const AutoFitMinimalTemplate: React.FC<AutoFitAdTemplateProps> = ({ template }) => {
  const { width, height } = template.dimensions;
  const padding = template.style?.padding || 40;

  return (
    <AbsoluteFill
      style={{
        background: template.content.backgroundColor || '#000000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <AutoFitText
        text={template.content.headline || ''}
        containerWidth={width}
        containerHeight={height}
        maxFontSize={Number(template.style?.headlineSize || 96)}
        minFontSize={32}
        fontWeight={Number(template.style?.headlineFontWeight || 700)}
        fontFamily={template.style?.headlineFont || 'Inter, sans-serif'}
        color={template.style?.textColor || '#ffffff'}
        padding={padding}
        align="center"
        verticalAlign="middle"
        maxLines={2}
        lineHeight={1.1}
      />
    </AbsoluteFill>
  );
};

/**
 * Usage in Root.tsx:
 *
 * import { AutoFitAdTemplate } from './compositions/ads/AutoFitAdTemplate';
 * import exampleTemplate from './data/ads/example-hero-ad.json';
 *
 * // Register composition
 * <Composition
 *   id="autofit-hero-ad"
 *   component={AutoFitAdTemplate}
 *   durationInFrames={1}
 *   fps={1}
 *   width={1080}
 *   height={1080}
 *   defaultProps={{ template: exampleTemplate }}
 * />
 */
