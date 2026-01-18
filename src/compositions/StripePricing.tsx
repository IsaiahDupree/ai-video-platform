import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from 'remotion';

// =============================================================================
// Stripe Pricing Video - BlankLogo Products & Prices
// =============================================================================

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  period?: string;
  isPopular?: boolean;
  credits: number;
  tier?: string;
  packId?: string;
}

export interface StripePricingProps {
  subscriptionPlans?: PricingPlan[];
  creditPacks?: PricingPlan[];
  brandName?: string;
  tagline?: string;
  primaryColor?: string;
  accentColor?: string;
}

// Default BlankLogo pricing data
export const stripePricingDefaultProps: StripePricingProps = {
  brandName: 'BlankLogo',
  tagline: 'Remove watermarks from any video',
  primaryColor: '#635bff', // Stripe purple
  accentColor: '#00d4ff',
  subscriptionPlans: [
    {
      id: 'price_starter',
      name: 'Starter',
      description: 'Perfect for occasional watermark removal needs.',
      price: 9,
      period: 'month',
      credits: 10,
      tier: 'starter',
    },
    {
      id: 'price_pro',
      name: 'Pro',
      description: 'Ideal for content creators and small teams.',
      price: 29,
      period: 'month',
      credits: 50,
      tier: 'pro',
      isPopular: true,
    },
    {
      id: 'price_business',
      name: 'Business',
      description: 'Built for agencies and high-volume users with API access.',
      price: 79,
      period: 'month',
      credits: 200,
      tier: 'business',
    },
  ],
  creditPacks: [
    {
      id: 'price_pack_10',
      name: '10 Credits',
      description: 'Credits never expire.',
      price: 9,
      credits: 10,
      packId: 'pack_10',
    },
    {
      id: 'price_pack_25',
      name: '25 Credits',
      description: 'Best value per credit.',
      price: 19,
      credits: 25,
      packId: 'pack_25',
    },
    {
      id: 'price_pack_50',
      name: '50 Credits',
      description: 'Great for bulk processing.',
      price: 35,
      credits: 50,
      packId: 'pack_50',
    },
    {
      id: 'price_pack_100',
      name: '100 Credits',
      description: 'Maximum savings.',
      price: 59,
      credits: 100,
      packId: 'pack_100',
    },
  ],
};

// =============================================================================
// Animated Components
// =============================================================================

const GradientBackground: React.FC<{ primaryColor: string; accentColor: string }> = ({
  primaryColor,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const gradientAngle = interpolate(frame, [0, 600], [135, 225], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${gradientAngle}deg, #0a0a0f 0%, #1a1a2e 30%, ${primaryColor}22 60%, #0f0f1a 100%)`,
      }}
    />
  );
};

const FloatingOrbs: React.FC<{ primaryColor: string; accentColor: string }> = ({
  primaryColor,
  accentColor,
}) => {
  const frame = useCurrentFrame();

  const orbs = [
    { x: 15, y: 20, size: 300, color: primaryColor, speed: 0.5 },
    { x: 80, y: 70, size: 250, color: accentColor, speed: 0.7 },
    { x: 50, y: 85, size: 200, color: primaryColor, speed: 0.4 },
  ];

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {orbs.map((orb, i) => {
        const yOffset = Math.sin(frame * 0.02 * orb.speed) * 30;
        const xOffset = Math.cos(frame * 0.015 * orb.speed) * 20;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${orb.x + xOffset * 0.1}%`,
              top: `${orb.y + yOffset * 0.1}%`,
              width: orb.size,
              height: orb.size,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${orb.color}30 0%, transparent 70%)`,
              filter: 'blur(60px)',
              transform: 'translate(-50%, -50%)',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const AnimatedTitle: React.FC<{
  brandName: string;
  tagline: string;
  primaryColor: string;
}> = ({ brandName, tagline, primaryColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  const taglineOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const taglineY = interpolate(frame, [20, 40], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div
        style={{
          fontSize: 72,
          fontWeight: 800,
          color: '#ffffff',
          fontFamily: 'Inter, system-ui, sans-serif',
          letterSpacing: '-2px',
          transform: `scale(${titleSpring})`,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: `linear-gradient(135deg, ${primaryColor} 0%, #00d4ff 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            fontWeight: 700,
          }}
        >
          B
        </div>
        {brandName}
      </div>
      <div
        style={{
          fontSize: 28,
          color: '#a1a1aa',
          fontFamily: 'Inter, system-ui, sans-serif',
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
        }}
      >
        {tagline}
      </div>
    </div>
  );
};

const SectionTitle: React.FC<{ title: string; delay: number }> = ({ title, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame - delay, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const x = interpolate(frame - delay, [0, 20], [-30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        fontSize: 42,
        fontWeight: 700,
        color: '#ffffff',
        fontFamily: 'Inter, system-ui, sans-serif',
        marginBottom: 32,
        opacity,
        transform: `translateX(${x}px)`,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 6,
          height: 36,
          borderRadius: 3,
          background: 'linear-gradient(180deg, #635bff 0%, #00d4ff 100%)',
        }}
      />
      {title}
    </div>
  );
};

const PricingCard: React.FC<{
  plan: PricingPlan;
  index: number;
  delay: number;
  isSubscription: boolean;
  primaryColor: string;
}> = ({ plan, index, delay, isSubscription, primaryColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardSpring = spring({
    frame: frame - delay - index * 8,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const scale = interpolate(cardSpring, [0, 1], [0.8, 1]);
  const opacity = interpolate(cardSpring, [0, 1], [0, 1]);

  const hoverGlow = plan.isPopular
    ? interpolate(
        Math.sin(frame * 0.08),
        [-1, 1],
        [0.5, 1],
      )
    : 0;

  return (
    <div
      style={{
        background: plan.isPopular
          ? `linear-gradient(135deg, ${primaryColor}20 0%, #00d4ff15 100%)`
          : 'rgba(255, 255, 255, 0.03)',
        border: plan.isPopular
          ? `2px solid ${primaryColor}`
          : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 24,
        padding: 32,
        minWidth: isSubscription ? 280 : 200,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        transform: `scale(${scale})`,
        opacity,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: plan.isPopular
          ? `0 0 ${40 * hoverGlow}px ${primaryColor}40`
          : 'none',
      }}
    >
      {plan.isPopular && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: -32,
            background: `linear-gradient(90deg, ${primaryColor} 0%, #00d4ff 100%)`,
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            padding: '6px 40px',
            transform: 'rotate(45deg)',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          POPULAR
        </div>
      )}

      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: '#ffffff',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {plan.name}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 4,
        }}
      >
        <span
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: plan.isPopular ? primaryColor : '#ffffff',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          ${plan.price}
        </span>
        {plan.period && (
          <span
            style={{
              fontSize: 18,
              color: '#71717a',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            /{plan.period}
          </span>
        )}
      </div>

      <div
        style={{
          fontSize: 16,
          color: '#a1a1aa',
          fontFamily: 'Inter, system-ui, sans-serif',
          lineHeight: 1.5,
        }}
      >
        {plan.description}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 8,
          padding: '12px 16px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 12,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${primaryColor}40 0%, #00d4ff30 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
          }}
        >
          🎬
        </div>
        <span
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: '#ffffff',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {plan.credits} video credits
        </span>
      </div>

      <div
        style={{
          marginTop: 'auto',
          padding: '14px 24px',
          background: plan.isPopular
            ? `linear-gradient(90deg, ${primaryColor} 0%, #8b5cf6 100%)`
            : 'rgba(255, 255, 255, 0.1)',
          borderRadius: 12,
          textAlign: 'center',
          fontSize: 16,
          fontWeight: 600,
          color: '#ffffff',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {isSubscription ? 'Subscribe' : 'Buy Now'}
      </div>
    </div>
  );
};

const CreditPackCard: React.FC<{
  pack: PricingPlan;
  index: number;
  delay: number;
  primaryColor: string;
}> = ({ pack, index, delay, primaryColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardSpring = spring({
    frame: frame - delay - index * 6,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const scale = interpolate(cardSpring, [0, 1], [0.8, 1]);
  const opacity = interpolate(cardSpring, [0, 1], [0, 1]);

  const pricePerCredit = (pack.price / pack.credits).toFixed(2);
  const isBestValue = pack.credits === 25;

  return (
    <div
      style={{
        background: isBestValue
          ? 'linear-gradient(135deg, #10b98120 0%, #059669015 100%)'
          : 'rgba(255, 255, 255, 0.03)',
        border: isBestValue
          ? '2px solid #10b981'
          : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        padding: 24,
        flex: 1,
        minWidth: 180,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        transform: `scale(${scale})`,
        opacity,
        position: 'relative',
      }}
    >
      {isBestValue && (
        <div
          style={{
            position: 'absolute',
            top: -12,
            background: '#10b981',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            padding: '4px 12px',
            borderRadius: 20,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          BEST VALUE
        </div>
      )}

      <div
        style={{
          fontSize: 36,
          fontWeight: 800,
          color: '#ffffff',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {pack.credits}
      </div>

      <div
        style={{
          fontSize: 14,
          color: '#71717a',
          fontFamily: 'Inter, system-ui, sans-serif',
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        Credits
      </div>

      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: isBestValue ? '#10b981' : primaryColor,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        ${pack.price}
      </div>

      <div
        style={{
          fontSize: 12,
          color: '#52525b',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        ${pricePerCredit}/credit
      </div>
    </div>
  );
};

// =============================================================================
// Main Composition
// =============================================================================

export const StripePricing: React.FC<StripePricingProps> = ({
  subscriptionPlans = stripePricingDefaultProps.subscriptionPlans!,
  creditPacks = stripePricingDefaultProps.creditPacks!,
  brandName = stripePricingDefaultProps.brandName!,
  tagline = stripePricingDefaultProps.tagline!,
  primaryColor = stripePricingDefaultProps.primaryColor!,
  accentColor = stripePricingDefaultProps.accentColor!,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Scene timing
  const introEnd = 60;
  const subscriptionsStart = 70;
  const subscriptionsEnd = 240;
  const creditsStart = 250;
  const creditsEnd = 400;
  const outroStart = 420;

  // Fade out at end
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 30, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        opacity: fadeOut,
      }}
    >
      <GradientBackground primaryColor={primaryColor} accentColor={accentColor} />
      <FloatingOrbs primaryColor={primaryColor} accentColor={accentColor} />

      {/* Grid pattern overlay */}
      <AbsoluteFill
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          opacity: 0.5,
        }}
      />

      {/* Content Container */}
      <AbsoluteFill
        style={{
          padding: 60,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Intro */}
        <Sequence from={0} durationInFrames={introEnd}>
          <AbsoluteFill
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AnimatedTitle
              brandName={brandName}
              tagline={tagline}
              primaryColor={primaryColor}
            />
          </AbsoluteFill>
        </Sequence>

        {/* Subscription Plans */}
        <Sequence from={subscriptionsStart} durationInFrames={subscriptionsEnd - subscriptionsStart}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
              marginTop: 40,
            }}
          >
            <SectionTitle title="Monthly Subscriptions" delay={0} />

            <div
              style={{
                display: 'flex',
                gap: 24,
                justifyContent: 'center',
              }}
            >
              {subscriptionPlans.map((plan, i) => (
                <PricingCard
                  key={plan.id}
                  plan={plan}
                  index={i}
                  delay={20}
                  isSubscription={true}
                  primaryColor={primaryColor}
                />
              ))}
            </div>
          </div>
        </Sequence>

        {/* Credit Packs */}
        <Sequence from={creditsStart} durationInFrames={creditsEnd - creditsStart}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
              marginTop: 40,
            }}
          >
            <SectionTitle title="One-Time Credit Packs" delay={0} />

            <div
              style={{
                display: 'flex',
                gap: 20,
                justifyContent: 'center',
              }}
            >
              {creditPacks.map((pack, i) => (
                <CreditPackCard
                  key={pack.id}
                  pack={pack}
                  index={i}
                  delay={20}
                  primaryColor={primaryColor}
                />
              ))}
            </div>

            <div
              style={{
                textAlign: 'center',
                marginTop: 24,
                fontSize: 18,
                color: '#71717a',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              ✨ Credits never expire • Use anytime
            </div>
          </div>
        </Sequence>

        {/* Outro - All Plans Side by Side */}
        <Sequence from={outroStart}>
          <AbsoluteFill
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 40,
            }}
          >
            <div
              style={{
                fontSize: 48,
                fontWeight: 800,
                color: '#ffffff',
                fontFamily: 'Inter, system-ui, sans-serif',
                textAlign: 'center',
              }}
            >
              Start removing watermarks today
            </div>

            <div
              style={{
                display: 'flex',
                gap: 16,
              }}
            >
              {subscriptionPlans.map((plan, i) => {
                const cardDelay = 20 + i * 10;
                const opacity = interpolate(
                  frame - outroStart - cardDelay,
                  [0, 15],
                  [0, 1],
                  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                );
                const y = interpolate(
                  frame - outroStart - cardDelay,
                  [0, 20],
                  [30, 0],
                  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                );

                return (
                  <div
                    key={plan.id}
                    style={{
                      background: plan.isPopular
                        ? `linear-gradient(135deg, ${primaryColor} 0%, #8b5cf6 100%)`
                        : 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 16,
                      padding: '20px 32px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      opacity,
                      transform: `translateY(${y}px)`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 20,
                        fontWeight: 600,
                        color: '#ffffff',
                      }}
                    >
                      {plan.name}
                    </span>
                    <span
                      style={{
                        fontSize: 24,
                        fontWeight: 800,
                        color: plan.isPopular ? '#ffffff' : primaryColor,
                      }}
                    >
                      ${plan.price}/mo
                    </span>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 20,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${primaryColor} 0%, #00d4ff 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                B
              </div>
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: '#ffffff',
                }}
              >
                blanklogo.app
              </span>
            </div>
          </AbsoluteFill>
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
