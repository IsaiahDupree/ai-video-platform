import React from 'react';
import { AbsoluteFill } from 'remotion';

// =============================================================================
// Stripe Product Card - Individual product images for Stripe Dashboard
// Dimensions: 1200x630px (Stripe recommended)
// =============================================================================

export interface StripeProductCardProps {
  productName?: string;
  description?: string;
  price?: number;
  period?: string; // 'month' for subscriptions, undefined for one-time
  credits?: number;
  isPopular?: boolean;
  isBestValue?: boolean;
  priceId?: string;
}

export const stripeProductCardDefaultProps: StripeProductCardProps = {
  productName: 'BlankLogo Pro',
  description: '50 video credits per month. Ideal for content creators and small teams.',
  price: 29,
  period: 'month',
  credits: 50,
  isPopular: true,
  isBestValue: false,
  priceId: 'price_pro',
};

// Product configurations for each price ID
export const STRIPE_PRODUCTS = {
  price_starter: {
    productName: 'BlankLogo Starter',
    description: '10 video credits per month. Perfect for occasional watermark removal needs.',
    price: 9,
    period: 'month',
    credits: 10,
    isPopular: false,
    isBestValue: false,
    priceId: 'price_starter',
  },
  price_pro: {
    productName: 'BlankLogo Pro',
    description: '50 video credits per month. Ideal for content creators and small teams.',
    price: 29,
    period: 'month',
    credits: 50,
    isPopular: true,
    isBestValue: false,
    priceId: 'price_pro',
  },
  price_business: {
    productName: 'BlankLogo Business',
    description: '200 video credits per month. Built for agencies and high-volume users with API access.',
    price: 79,
    period: 'month',
    credits: 200,
    isPopular: false,
    isBestValue: false,
    priceId: 'price_business',
  },
  price_pack_10: {
    productName: '10 Video Credits',
    description: 'One-time purchase of 10 video credits. Credits never expire.',
    price: 9,
    period: undefined,
    credits: 10,
    isPopular: false,
    isBestValue: false,
    priceId: 'price_pack_10',
  },
  price_pack_25: {
    productName: '25 Video Credits',
    description: 'One-time purchase of 25 video credits. Credits never expire. Best value per credit.',
    price: 19,
    period: undefined,
    credits: 25,
    isPopular: false,
    isBestValue: true,
    priceId: 'price_pack_25',
  },
  price_pack_50: {
    productName: '50 Video Credits',
    description: 'One-time purchase of 50 video credits. Credits never expire. Great for bulk processing.',
    price: 35,
    period: undefined,
    credits: 50,
    isPopular: false,
    isBestValue: false,
    priceId: 'price_pack_50',
  },
  price_pack_100: {
    productName: '100 Video Credits',
    description: 'One-time purchase of 100 video credits. Credits never expire. Maximum savings.',
    price: 59,
    period: undefined,
    credits: 100,
    isPopular: false,
    isBestValue: false,
    priceId: 'price_pack_100',
  },
} as const;

export const StripeProductCard: React.FC<StripeProductCardProps> = ({
  productName = stripeProductCardDefaultProps.productName!,
  description = stripeProductCardDefaultProps.description!,
  price = stripeProductCardDefaultProps.price!,
  period = stripeProductCardDefaultProps.period,
  credits = stripeProductCardDefaultProps.credits!,
  isPopular = stripeProductCardDefaultProps.isPopular!,
  isBestValue = stripeProductCardDefaultProps.isBestValue!,
  priceId = stripeProductCardDefaultProps.priceId!,
}) => {
  const isSubscription = !!period;
  const primaryColor = '#635bff';

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 40%, #2d1f4e 70%, #1a1a2e 100%)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Subtle grid pattern */}
      <AbsoluteFill
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Floating orb effects */}
      <div
        style={{
          position: 'absolute',
          left: '10%',
          top: '20%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${primaryColor}25 0%, transparent 70%)`,
          filter: 'blur(40px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: '15%',
          bottom: '10%',
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #00d4ff20 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Main content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
          height: '100%',
          gap: 40,
        }}
      >
        {/* Branding & Product info */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: `linear-gradient(135deg, ${primaryColor} 0%, #00d4ff 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 700,
                color: '#fff',
              }}
            >
              B
            </div>
            <span
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: '#ffffff',
              }}
            >
              BlankLogo
            </span>
          </div>

          {/* Product Name */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <h1
              style={{
                fontSize: 48,
                fontWeight: 800,
                color: '#ffffff',
                margin: 0,
                lineHeight: 1.1,
                textAlign: 'center',
              }}
            >
              {productName}
            </h1>
            {isPopular && (
              <span
                style={{
                  background: `linear-gradient(90deg, ${primaryColor} 0%, #8b5cf6 100%)`,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  padding: '6px 14px',
                  borderRadius: 20,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Most Popular
              </span>
            )}
            {isBestValue && (
              <span
                style={{
                  background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  padding: '6px 14px',
                  borderRadius: 20,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Best Value
              </span>
            )}
          </div>

          {/* Description */}
          <p
            style={{
              fontSize: 20,
              color: '#a1a1aa',
              margin: 0,
              lineHeight: 1.5,
              maxWidth: 600,
              textAlign: 'center',
            }}
          >
            {description}
          </p>

          {/* Credits badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 20px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 12,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              width: 'fit-content',
            }}
          >
            <span style={{ fontSize: 24 }}>🎬</span>
            <span
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: '#ffffff',
              }}
            >
              {credits} video credit{credits > 1 ? 's' : ''}
              {isSubscription ? ' / month' : ''}
            </span>
          </div>
        </div>

        {/* Right side - Price card */}
        <div
          style={{
            background: isPopular
              ? `linear-gradient(135deg, ${primaryColor}15 0%, #00d4ff10 100%)`
              : 'rgba(255, 255, 255, 0.03)',
            border: isPopular
              ? `2px solid ${primaryColor}`
              : isBestValue
              ? '2px solid #10b981'
              : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 28,
            padding: '40px 50px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            minWidth: 280,
            boxShadow: isPopular
              ? `0 0 60px ${primaryColor}30`
              : isBestValue
              ? '0 0 60px #10b98120'
              : 'none',
          }}
        >
          {/* Price */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 4,
            }}
          >
            <span
              style={{
                fontSize: 72,
                fontWeight: 800,
                color: isPopular ? primaryColor : isBestValue ? '#10b981' : '#ffffff',
                lineHeight: 1,
              }}
            >
              ${price}
            </span>
            {period && (
              <span
                style={{
                  fontSize: 24,
                  color: '#71717a',
                }}
              >
                /{period}
              </span>
            )}
          </div>

          {/* One-time label */}
          {!period && (
            <span
              style={{
                fontSize: 16,
                color: '#71717a',
                fontWeight: 500,
              }}
            >
              One-time purchase
            </span>
          )}

        </div>
      </div>
    </AbsoluteFill>
  );
};
