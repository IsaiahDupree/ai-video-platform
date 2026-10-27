import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { z } from 'zod';

export const EVERREACH_RESEARCH_CAROUSEL_CARDS = [
  'cover',
  'problem',
  'framework',
  'evidence',
  'takeaway',
] as const;

const cardSchema = z.enum(EVERREACH_RESEARCH_CAROUSEL_CARDS);

/**
 * The renderer accepts only fields from an `everreach_source_carousel_input_v1`
 * specimen. Lineage and authorization are intentionally kept with the render
 * request, rather than embedded in visible copy.
 */
export const EverReachResearchCarouselSchema = z.object({
  card: cardSchema,
  brand: z.string().min(1),
  series_label: z.string().min(1),
  cover_title: z.string().min(1),
  cover_support: z.string().min(1),
  problem_label: z.string().min(1),
  problem_title: z.string().min(1),
  problem_body: z.string().min(1),
  framework_label: z.string().min(1),
  framework_title: z.string().min(1),
  step_one: z.string().min(1),
  step_two: z.string().min(1),
  step_three: z.string().min(1),
  evidence_label: z.string().min(1),
  evidence_statement: z.string().min(1),
  evidence_source: z.string().min(1),
  takeaway_label: z.string().min(1),
  takeaway: z.string().min(1),
  closing_line: z.string().min(1),
  accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'accent must be a hex color'),
});

export type EverReachResearchCarouselProps = z.infer<
  typeof EverReachResearchCarouselSchema
>;

export const everReachResearchCarouselDefaultProps: EverReachResearchCarouselProps = {
  card: 'cover',
  brand: 'EVERREACH',
  series_label: 'RELATIONSHIP SYSTEMS',
  cover_title: 'You do not need a full CRM to remember people well.',
  cover_support: 'Opinion: three notes can make a relationship easier to re-enter.',
  problem_label: 'THE FRICTION',
  problem_title: 'Names alone do not preserve the thread of a relationship.',
  problem_body: 'The missing context is usually what happened last and what could happen next.',
  framework_label: 'THE 3-FIELD RECORD',
  framework_title: 'Use a three-field record to make the next conversation legible.',
  step_one: 'Context: why this person matters in your world.',
  step_two: 'Last touch: the latest conversation, intro, or promise.',
  step_three: 'Next step: a future date, question, or action.',
  evidence_label: 'WHAT EVERREACH SAYS',
  evidence_statement:
    'EverReach gives you one clean place to see who you know, what you talked about, and when to reach out next.',
  evidence_source: 'EverReach App Store listing',
  takeaway_label: 'THE TAKEAWAY',
  takeaway: 'Keep the thread, not just the name.',
  closing_line: 'Try this before you close the contact: save one detail that makes re-entry easier.',
  accent: '#F15A4A',
};

const CARD_NUMBER: Record<EverReachResearchCarouselProps['card'], number> = {
  cover: 1,
  problem: 2,
  framework: 3,
  evidence: 4,
  takeaway: 5,
};

const CardProgress: React.FC<{
  active: number;
  accent: string;
}> = ({ active, accent }) => {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          style={{
            width: item === active ? 42 : 12,
            height: 12,
            borderRadius: 999,
            backgroundColor: item === active ? accent : 'rgba(255,255,255,0.23)',
          }}
        />
      ))}
    </div>
  );
};

const NetworkMark: React.FC<{ accent: string; frame: number }> = ({ accent, frame }) => {
  const drift = interpolate(frame, [0, 120], [0, 12], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });

  return (
    <svg
      aria-hidden="true"
      width="196"
      height="126"
      viewBox="0 0 196 126"
      style={{ overflow: 'visible' }}
    >
      <path d="M30 89 L98 31 L166 84" fill="none" stroke={accent} strokeWidth="4" opacity="0.72" />
      <path d="M30 89 L166 84" fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="3" />
      <circle cx="30" cy="89" r="15" fill="#0F172A" stroke={accent} strokeWidth="5" />
      <circle cx="98" cy={31 + drift} r="18" fill={accent} />
      <circle cx="166" cy="84" r="15" fill="#0F172A" stroke="rgba(255,255,255,0.74)" strokeWidth="5" />
    </svg>
  );
};

const Steps: React.FC<{
  steps: readonly string[];
  accent: string;
  frame: number;
}> = ({ steps, accent, frame }) => {
  const { fps } = useVideoConfig();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {steps.map((step, index) => {
        const enter = spring({
          frame: frame - 10 - index * 8,
          fps,
          config: { damping: 200, stiffness: 130, mass: 0.8 },
        });
        const opacity = interpolate(enter, [0, 1], [0.62, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const translateY = interpolate(enter, [0, 1], [28, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        return (
          <div
            key={step}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              padding: '24px 28px',
              borderRadius: 28,
              backgroundColor: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.16)',
              opacity,
              translate: `0 ${translateY}px`,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: '0 0 auto',
                backgroundColor: accent,
                color: '#0B1325',
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              {index + 1}
            </div>
            <div
              style={{
                color: '#F8FAFC',
                fontSize: 34,
                fontWeight: 650,
                letterSpacing: '-0.02em',
                lineHeight: 1.22,
              }}
            >
              {step}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const cardCopy = (props: EverReachResearchCarouselProps) => {
  switch (props.card) {
    case 'cover':
      return {
        label: props.series_label,
        headline: props.cover_title,
        body: props.cover_support,
      };
    case 'problem':
      return {
        label: props.problem_label,
        headline: props.problem_title,
        body: props.problem_body,
      };
    case 'framework':
      return {
        label: props.framework_label,
        headline: props.framework_title,
        body: '',
      };
    case 'evidence':
      return {
        label: props.evidence_label,
        headline: props.evidence_statement,
        body: '',
      };
    case 'takeaway':
      return {
        label: props.takeaway_label,
        headline: props.takeaway,
        body: props.closing_line,
      };
  }
};

/**
 * One 4:5 animated carousel card. It deliberately contains no sourced
 * screenshots, likeness, external asset, or claim beyond the supplied props.
 */
export const EverReachResearchCarouselCard: React.FC<EverReachResearchCarouselProps> = (
  props,
) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const content = cardCopy(props);
  const cardNumber = CARD_NUMBER[props.card];

  const titleEnter = spring({
    frame: frame - 2,
    fps,
    config: { damping: 200, stiffness: 90, mass: 0.9 },
  });
  const titleOpacity = interpolate(titleEnter, [0, 1], [0.78, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleTranslateY = interpolate(titleEnter, [0, 1], [18, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const copyOpacity = interpolate(frame, [5, 16], [0.48, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const panelScale = interpolate(frame, [0, 14], [0.985, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const accentSweep = interpolate(frame, [0, 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const isFramework = props.card === 'framework';
  const isEvidence = props.card === 'evidence';
  const isCover = props.card === 'cover';
  const isTakeaway = props.card === 'takeaway';
  const evidenceTitleFontSize = props.evidence_statement.length > 96 ? 56 : 66;

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        background:
          'radial-gradient(circle at 92% 8%, rgba(241,90,74,0.22), transparent 30%), radial-gradient(circle at 6% 92%, rgba(50,190,190,0.16), transparent 32%), #0B1325',
        color: '#F8FAFC',
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.34,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '54px 54px',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${accentSweep * 100}%`,
          height: 16,
          backgroundColor: props.accent,
        }}
      />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100%',
          padding: '132px 112px 108px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div
            style={{
              color: '#D7DFEF',
              fontSize: 24,
              lineHeight: 1,
              letterSpacing: '0.14em',
              fontWeight: 800,
            }}
          >
            {props.brand}
          </div>
          <div
            style={{
              color: '#0B1325',
              backgroundColor: props.accent,
              fontSize: 20,
              lineHeight: 1,
              letterSpacing: '0.08em',
              fontWeight: 900,
              borderRadius: 999,
              padding: '12px 16px',
            }}
          >
            {cardNumber} / 5
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div
            style={{
              width: 'fit-content',
              maxWidth: '100%',
              color: props.accent,
              fontSize: 23,
              fontWeight: 850,
              letterSpacing: '0.14em',
              lineHeight: 1.2,
              marginBottom: 32,
            }}
          >
            {content.label}
          </div>

          <div
            style={{
              position: 'relative',
              padding: isFramework ? '0' : '44px 42px 42px',
              borderRadius: isFramework ? 0 : 40,
              border: isFramework ? 'none' : '1px solid rgba(255,255,255,0.18)',
              backgroundColor: isFramework ? 'transparent' : 'rgba(8,15,33,0.52)',
              boxShadow: isFramework ? 'none' : '0 28px 66px rgba(0,0,0,0.24)',
              scale: String(panelScale),
            }}
          >
            {!isFramework && (
              <div
                style={{
                  width: 64,
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: props.accent,
                  marginBottom: 32,
                }}
              />
            )}
            <div
              style={{
                color: '#FFFFFF',
                fontSize: isEvidence ? evidenceTitleFontSize : isFramework ? 74 : isCover ? 88 : isTakeaway ? 82 : 78,
                fontWeight: 850,
                letterSpacing: '-0.055em',
                lineHeight: 1.06,
                opacity: titleOpacity,
                translate: `0 ${titleTranslateY}px`,
              }}
            >
              {content.headline}
            </div>

            {isFramework ? (
              <div style={{ marginTop: 46 }}>
                <Steps
                  steps={[props.step_one, props.step_two, props.step_three]}
                  accent={props.accent}
                  frame={frame}
                />
              </div>
            ) : (
              <>
                {content.body && (
                  <div
                    style={{
                      color: isEvidence ? '#D7DFEF' : 'rgba(248,250,252,0.88)',
                      fontSize: isEvidence ? 32 : 38,
                      fontWeight: 560,
                      letterSpacing: '-0.022em',
                      lineHeight: 1.28,
                      marginTop: 28,
                      opacity: copyOpacity,
                    }}
                  >
                    {content.body}
                  </div>
                )}
                {isEvidence && (
                  <div
                    style={{
                      marginTop: content.body ? 30 : 24,
                      color: props.accent,
                      fontSize: 24,
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                    }}
                  >
                    SOURCE: {props.evidence_source}
                  </div>
                )}
              </>
            )}
          </div>

          {isCover && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: 36,
                opacity: copyOpacity,
              }}
            >
              <NetworkMark accent={props.accent} frame={frame} />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 32 }}>
          <CardProgress active={cardNumber} accent={props.accent} />
          <div
            style={{
              color: 'rgba(248,250,252,0.66)',
              fontSize: 22,
              fontWeight: 650,
              lineHeight: 1.25,
              maxWidth: 340,
              textAlign: 'right',
            }}
          >
            Source-backed carousel
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
