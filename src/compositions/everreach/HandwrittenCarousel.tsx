import React from 'react';
import { AbsoluteFill, Img, Sequence, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

// =============================================================================
// Types
// =============================================================================

export type AnnotationStyle =
  | 'underline'
  | 'circle'
  | 'arrow_right'
  | 'arrow_down'
  | 'sticky_note'
  | 'checkmark'
  | 'star'
  | 'box'
  | 'margin_note';

export interface SlideAnnotation {
  type: AnnotationStyle;
  target: string;
  color?: string;
}

export interface HandwrittenSlideData {
  headline: string;
  subtext?: string;
  annotations: SlideAnnotation[];
  layout: 'centered' | 'left' | 'top_left' | 'bottom_right';
}

export interface HandwrittenCarouselProps {
  slides?: HandwrittenSlideData[];
  /** AI-generated background images per slide (data URLs or remote URLs) */
  slideImageUrls?: string[];
  style?: Partial<HandwrittenStyleConfig>;
  /** Output mode: still renders a single slide, carousel renders all */
  mode?: 'still' | 'carousel';
  /** Which slide to render in still mode */
  slideIndex?: number;
}

interface HandwrittenStyleConfig {
  background: string;
  textColor: string;
  accentColor: string;
  secondaryAccent: string;
  fontFamily: string;
  headlineSize: number;
  subtextSize: number;
  paperTexture: 'clean_white' | 'off_white' | 'cream' | 'lined' | 'grid';
  annotationWeight: number;
}

// =============================================================================
// Defaults
// =============================================================================

const DEFAULT_STYLE: HandwrittenStyleConfig = {
  background: '#FAFAF8',
  textColor: '#1a1a1a',
  accentColor: '#FF6B6B',
  secondaryAccent: '#4ECDC4',
  fontFamily: "'Caveat', 'Patrick Hand', cursive",
  headlineSize: 72,
  subtextSize: 36,
  paperTexture: 'off_white',
  annotationWeight: 3,
};

export const handwrittenCarouselDefaultProps: HandwrittenCarouselProps = {
  slides: [
    {
      headline: 'most friendships do not end',
      subtext: 'they fade',
      annotations: [{ type: 'underline', target: 'fade' }],
      layout: 'centered',
    },
    {
      headline: 'you meant to text them back',
      subtext: 'life just kept moving',
      annotations: [{ type: 'sticky_note', target: 'life just kept moving' }],
      layout: 'left',
    },
  ],
  mode: 'still',
  slideIndex: 0,
};

// =============================================================================
// Paper Texture Background
// =============================================================================

const PaperBackground: React.FC<{
  texture: HandwrittenStyleConfig['paperTexture'];
  background: string;
}> = ({ texture, background }) => {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background,
  };

  if (texture === 'lined') {
    return (
      <div style={baseStyle}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              'repeating-linear-gradient(transparent, transparent 59px, #e8e6e1 59px, #e8e6e1 60px)',
            opacity: 0.4,
          }}
        />
      </div>
    );
  }

  if (texture === 'grid') {
    return (
      <div style={baseStyle}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              'linear-gradient(#e8e6e1 1px, transparent 1px), linear-gradient(90deg, #e8e6e1 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            opacity: 0.3,
          }}
        />
      </div>
    );
  }

  // clean_white, off_white, cream — just the solid bg
  return <div style={baseStyle} />;
};

// =============================================================================
// Annotation SVG Overlays
// =============================================================================

const Underline: React.FC<{ width: number; color: string; weight: number; progress: number }> = ({
  width,
  color,
  weight,
  progress,
}) => {
  const dashLength = width * progress;
  // Hand-drawn wobble
  const y1 = 4 + Math.sin(0) * 2;
  const y2 = 4 + Math.sin(width * 0.02) * 2;
  const yMid = 4 + Math.sin(width * 0.01) * 3;

  return (
    <svg width={width} height={12} style={{ position: 'absolute', bottom: -6, left: 0 }}>
      <path
        d={`M 0 ${y1} Q ${width / 2} ${yMid} ${width} ${y2}`}
        stroke={color}
        strokeWidth={weight}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${dashLength} ${width}`}
      />
    </svg>
  );
};

const CircleAnnotation: React.FC<{
  width: number;
  height: number;
  color: string;
  weight: number;
  progress: number;
}> = ({ width, height, color, weight, progress }) => {
  const rx = width / 2 + 12;
  const ry = height / 2 + 8;
  const circumference = 2 * Math.PI * Math.max(rx, ry);
  const dashOffset = circumference * (1 - progress);

  return (
    <svg
      width={rx * 2 + 10}
      height={ry * 2 + 10}
      style={{
        position: 'absolute',
        top: -(ry - height / 2) - 5,
        left: -(rx - width / 2) - 5,
        pointerEvents: 'none',
      }}
    >
      <ellipse
        cx={rx + 5}
        cy={ry + 5}
        rx={rx}
        ry={ry}
        stroke={color}
        strokeWidth={weight}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform={`rotate(-3, ${rx + 5}, ${ry + 5})`}
      />
    </svg>
  );
};

const ArrowRight: React.FC<{ color: string; weight: number; progress: number }> = ({
  color,
  weight,
  progress,
}) => {
  const opacity = interpolate(progress, [0, 0.5, 1], [0, 0.8, 1]);
  return (
    <svg width={60} height={30} style={{ marginLeft: 8, opacity }}>
      <path
        d="M 5 15 L 45 15"
        stroke={color}
        strokeWidth={weight}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 38 8 L 50 15 L 38 22"
        stroke={color}
        strokeWidth={weight}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const Checkmark: React.FC<{ color: string; weight: number; progress: number }> = ({
  color,
  weight,
  progress,
}) => {
  const dashLength = 50 * progress;
  return (
    <svg width={32} height={32} style={{ marginRight: 12 }}>
      <path
        d="M 6 16 L 13 24 L 26 8"
        stroke={color}
        strokeWidth={weight + 1}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`${dashLength} 50`}
      />
    </svg>
  );
};

const StarAnnotation: React.FC<{ color: string; progress: number }> = ({ color, progress }) => {
  const scale = interpolate(progress, [0, 0.5, 1], [0, 1.2, 1]);
  return (
    <div
      style={{
        fontSize: 28,
        color,
        transform: `scale(${scale})`,
        marginRight: 8,
      }}
    >
      *
    </div>
  );
};

// =============================================================================
// Sticky Note
// =============================================================================

const StickyNote: React.FC<{
  text: string;
  color: string;
  accentColor: string;
  fontFamily: string;
  progress: number;
}> = ({ text, color, accentColor, fontFamily, progress }) => {
  const opacity = interpolate(progress, [0, 0.3, 1], [0, 1, 1]);
  const translateY = interpolate(progress, [0, 0.3, 1], [20, 0, 0]);
  const rotate = -2 + Math.sin(progress * Math.PI) * 1;

  return (
    <div
      style={{
        background: '#FFF9C4',
        padding: '16px 20px',
        borderRadius: 2,
        boxShadow: '2px 3px 8px rgba(0,0,0,0.12)',
        transform: `translateY(${translateY}px) rotate(${rotate}deg)`,
        opacity,
        maxWidth: 400,
        marginTop: 24,
      }}
    >
      <span
        style={{
          fontFamily,
          fontSize: 28,
          color: '#333',
          lineHeight: 1.4,
        }}
      >
        {text}
      </span>
    </div>
  );
};

// =============================================================================
// Single Slide Component
// =============================================================================

const HandwrittenSlide: React.FC<{
  slide: HandwrittenSlideData;
  style: HandwrittenStyleConfig;
  imageUrl?: string;
  animationProgress: number;
}> = ({ slide, style: s, imageUrl, animationProgress }) => {
  const textProgress = interpolate(animationProgress, [0, 0.4], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const annotationProgress = interpolate(animationProgress, [0.3, 0.8], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const subtextProgress = interpolate(animationProgress, [0.4, 0.7], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Layout positioning
  const layoutStyles: Record<string, React.CSSProperties> = {
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      padding: 80,
    },
    left: {
      justifyContent: 'center',
      alignItems: 'flex-start',
      textAlign: 'left',
      padding: 80,
      paddingLeft: 100,
    },
    top_left: {
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      textAlign: 'left',
      padding: 100,
    },
    bottom_right: {
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
      textAlign: 'right',
      padding: 80,
    },
  };

  // Render headline with inline annotations
  const renderAnnotatedHeadline = () => {
    const words = slide.headline.split(' ');
    const annotationMap = new Map<string, SlideAnnotation>();
    for (const ann of slide.annotations) {
      if (ann.target !== 'subtext') {
        annotationMap.set(ann.target.toLowerCase(), ann);
      }
    }

    return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: slide.layout === 'centered' ? 'center' : 'flex-start',
          gap: '0 16px',
          opacity: interpolate(textProgress, [0, 0.3, 1], [0, 1, 1]),
        }}
      >
        {words.map((word, i) => {
          const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
          const annotation = annotationMap.get(cleanWord);

          return (
            <span
              key={i}
              style={{
                position: 'relative',
                display: 'inline-block',
                fontFamily: s.fontFamily,
                fontSize: s.headlineSize,
                fontWeight: 700,
                color: s.textColor,
                lineHeight: 1.3,
              }}
            >
              {word}
              {annotation?.type === 'underline' && (
                <Underline
                  width={word.length * s.headlineSize * 0.55}
                  color={annotation.color || s.accentColor}
                  weight={s.annotationWeight}
                  progress={annotationProgress}
                />
              )}
              {annotation?.type === 'circle' && (
                <CircleAnnotation
                  width={word.length * s.headlineSize * 0.55}
                  height={s.headlineSize}
                  color={annotation.color || s.accentColor}
                  weight={s.annotationWeight}
                  progress={annotationProgress}
                />
              )}
              {annotation?.type === 'box' && (
                <div
                  style={{
                    position: 'absolute',
                    top: -4,
                    left: -8,
                    right: -8,
                    bottom: -4,
                    border: `${s.annotationWeight}px solid ${annotation.color || s.accentColor}`,
                    borderRadius: 4,
                    opacity: annotationProgress,
                    transform: `rotate(-1deg)`,
                  }}
                />
              )}
            </span>
          );
        })}
      </div>
    );
  };

  // Check for subtext-targeted annotations
  const subtextAnnotation = slide.annotations.find(
    (a) => a.target === 'subtext' || a.target === slide.subtext
  );

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        ...layoutStyles[slide.layout],
      }}
    >
      <PaperBackground texture={s.paperTexture} background={s.background} />

      {/* AI-generated background image */}
      {imageUrl && (
        <>
          <Img
            src={imageUrl}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(250, 250, 248, 0.85)',
              zIndex: 1,
            }}
          />
        </>
      )}

      {/* Content */}
      <div style={{ zIndex: 2, maxWidth: '90%' }}>
        {/* Prefix annotations */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          {slide.annotations
            .filter((a) => a.type === 'checkmark')
            .map((a, i) => (
              <Checkmark
                key={i}
                color={a.color || s.accentColor}
                weight={s.annotationWeight}
                progress={annotationProgress}
              />
            ))}
          {slide.annotations
            .filter((a) => a.type === 'star')
            .map((a, i) => (
              <StarAnnotation
                key={i}
                color={a.color || s.accentColor}
                progress={annotationProgress}
              />
            ))}
        </div>

        {/* Headline */}
        {renderAnnotatedHeadline()}

        {/* Arrow annotations */}
        {slide.annotations
          .filter((a) => a.type === 'arrow_right' || a.type === 'arrow_down')
          .map((a, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: slide.layout === 'centered' ? 'center' : 'flex-start', marginTop: 12 }}>
              <ArrowRight
                color={a.color || s.accentColor}
                weight={s.annotationWeight}
                progress={annotationProgress}
              />
            </div>
          ))}

        {/* Subtext */}
        {slide.subtext && (
          <div style={{ marginTop: 24 }}>
            {subtextAnnotation?.type === 'sticky_note' ? (
              <StickyNote
                text={slide.subtext}
                color={s.textColor}
                accentColor={s.accentColor}
                fontFamily={s.fontFamily}
                progress={subtextProgress}
              />
            ) : (
              <p
                style={{
                  fontFamily: s.fontFamily,
                  fontSize: s.subtextSize,
                  color: s.textColor,
                  opacity: interpolate(subtextProgress, [0, 1], [0, 0.8]),
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {slide.subtext}
              </p>
            )}
          </div>
        )}

        {/* Margin note */}
        {slide.annotations
          .filter((a) => a.type === 'margin_note')
          .map((a, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                right: 40,
                top: '50%',
                transform: `translateY(-50%) rotate(2deg)`,
                opacity: annotationProgress * 0.7,
                fontFamily: s.fontFamily,
                fontSize: 22,
                color: a.color || s.secondaryAccent,
                maxWidth: 160,
                textAlign: 'right',
              }}
            >
              {a.target}
            </div>
          ))}
      </div>

      {/* EverReach watermark — bottom right, subtle */}
      <div
        style={{
          position: 'absolute',
          bottom: 32,
          right: 40,
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 16,
          color: s.textColor,
          opacity: 0.25,
          letterSpacing: 2,
          zIndex: 2,
        }}
      >
        EVERREACH
      </div>
    </AbsoluteFill>
  );
};

// =============================================================================
// Main Composition — Still Mode (one slide per render)
// =============================================================================

export const HandwrittenCarousel: React.FC<HandwrittenCarouselProps> = (inputProps) => {
  const props = { ...handwrittenCarouselDefaultProps, ...inputProps };
  const { slides = handwrittenCarouselDefaultProps.slides!, slideImageUrls, mode = 'still', slideIndex = 0 } = props;
  const mergedStyle: HandwrittenStyleConfig = { ...DEFAULT_STYLE, ...props.style };

  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  if (mode === 'still' || slides.length === 1) {
    // Render single slide (for batch rendering each slide as a still image)
    const idx = Math.min(slideIndex, slides.length - 1);
    return (
      <HandwrittenSlide
        slide={slides[idx]}
        style={mergedStyle}
        imageUrl={slideImageUrls?.[idx]}
        animationProgress={1}
      />
    );
  }

  // Carousel mode — animated sequence of all slides
  const framesPerSlide = Math.floor(durationInFrames / slides.length);

  return (
    <AbsoluteFill>
      {slides.map((slide, i) => {
        const slideStart = i * framesPerSlide;
        const localFrame = frame - slideStart;
        const progress = interpolate(
          localFrame,
          [0, Math.min(framesPerSlide * 0.15, 15), framesPerSlide * 0.85, framesPerSlide],
          [0, 1, 1, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        const animProgress = interpolate(
          localFrame,
          [0, framesPerSlide * 0.6],
          [0, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        if (localFrame < 0 || localFrame >= framesPerSlide) return null;

        return (
          <AbsoluteFill key={i} style={{ opacity: progress }}>
            <HandwrittenSlide
              slide={slide}
              style={mergedStyle}
              imageUrl={slideImageUrls?.[i]}
              animationProgress={animProgress}
            />
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

// =============================================================================
// Slide count indicator (for carousel video mode)
// =============================================================================

export const SlideIndicator: React.FC<{
  total: number;
  current: number;
  color: string;
}> = ({ total, current, color }) => (
  <div
    style={{
      position: 'absolute',
      bottom: 32,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: 8,
      zIndex: 10,
    }}
  >
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        style={{
          width: i === current ? 24 : 8,
          height: 8,
          borderRadius: 4,
          background: i === current ? color : `${color}40`,
          transition: 'width 0.3s',
        }}
      />
    ))}
  </div>
);

export default HandwrittenCarousel;
