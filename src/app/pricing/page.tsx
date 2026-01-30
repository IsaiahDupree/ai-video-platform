'use client';

import React, { useState, useEffect } from 'react';
import { tracking } from '@/services/tracking';
import styles from './pricing.module.css';

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    features: [
      '10 renders per month',
      'Basic templates',
      'SD quality (720p)',
      'Community support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    interval: 'month',
    features: [
      '100 renders per month',
      'All templates',
      'HD quality (1080p)',
      'Priority support',
      'Custom branding',
      'API access',
    ],
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: 99,
    interval: 'month',
    features: [
      'Unlimited renders',
      'All templates + custom',
      '4K quality',
      'Dedicated support',
      'Custom branding',
      'API access',
      'Team collaboration',
      'Advanced analytics',
    ],
  },
  {
    id: 'pro-annual',
    name: 'Pro Annual',
    price: 290,
    interval: 'year',
    features: [
      '100 renders per month',
      'All templates',
      'HD quality (1080p)',
      'Priority support',
      'Custom branding',
      'API access',
      '2 months free',
    ],
  },
  {
    id: 'business-annual',
    name: 'Business Annual',
    price: 990,
    interval: 'year',
    features: [
      'Unlimited renders',
      'All templates + custom',
      '4K quality',
      'Dedicated support',
      'Custom branding',
      'API access',
      'Team collaboration',
      'Advanced analytics',
      '2 months free',
    ],
  },
];

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Track pricing page view (GDP-011: Person Features Computation)
  // This event contributes to the pricing_page_views feature metric
  useEffect(() => {
    tracking.track('pricing_view', {
      page: 'pricing',
      timestamp: new Date().toISOString(),
    });
  }, []);

  const handleCheckout = (plan: Plan) => {
    // Track checkout started event
    tracking.track('checkout_started', {
      planId: plan.id,
      planName: plan.name,
      price: plan.price,
      interval: plan.interval,
      currency: 'USD',
      timestamp: new Date().toISOString(),
    });

    setSelectedPlan(plan.id);

    // Redirect to checkout page after a brief delay
    setTimeout(() => {
      window.location.href = `/checkout?plan=${plan.id}`;
    }, 500);
  };

  const filteredPlans = plans.filter((plan) => {
    if (billingInterval === 'monthly') {
      return plan.interval === 'month';
    } else {
      return plan.interval === 'year';
    }
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Choose Your Plan</h1>
        <p className={styles.subtitle}>
          Start creating amazing videos today. Upgrade anytime.
        </p>

        <div className={styles.billingToggle}>
          <button
            className={`${styles.toggleButton} ${
              billingInterval === 'monthly' ? styles.active : ''
            }`}
            onClick={() => setBillingInterval('monthly')}
          >
            Monthly
          </button>
          <button
            className={`${styles.toggleButton} ${
              billingInterval === 'yearly' ? styles.active : ''
            }`}
            onClick={() => setBillingInterval('yearly')}
          >
            Yearly
            <span className={styles.saveBadge}>Save 17%</span>
          </button>
        </div>
      </div>

      <div className={styles.plansGrid}>
        {filteredPlans.map((plan) => (
          <div
            key={plan.id}
            className={`${styles.planCard} ${
              plan.popular ? styles.popular : ''
            }`}
          >
            {plan.popular && (
              <div className={styles.popularBadge}>Most Popular</div>
            )}

            <div className={styles.planHeader}>
              <h2 className={styles.planName}>{plan.name}</h2>
              <div className={styles.priceContainer}>
                <span className={styles.currency}>$</span>
                <span className={styles.price}>{plan.price}</span>
                <span className={styles.interval}>
                  /{plan.interval === 'month' ? 'mo' : 'yr'}
                </span>
              </div>
              {plan.price > 0 && plan.interval === 'year' && (
                <p className={styles.annualNote}>
                  ${Math.round(plan.price / 12)}/mo billed annually
                </p>
              )}
            </div>

            <ul className={styles.featureList}>
              {plan.features.map((feature, index) => (
                <li key={index} className={styles.feature}>
                  <svg className={styles.checkIcon} viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              className={`${styles.ctaButton} ${
                plan.popular ? styles.ctaButtonPrimary : styles.ctaButtonSecondary
              } ${selectedPlan === plan.id ? styles.loading : ''}`}
              onClick={() => handleCheckout(plan)}
              disabled={selectedPlan === plan.id}
            >
              {selectedPlan === plan.id ? (
                <>
                  <span className={styles.spinner}></span>
                  Redirecting...
                </>
              ) : plan.price === 0 ? (
                'Get Started'
              ) : (
                'Start Free Trial'
              )}
            </button>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <p className={styles.footerText}>
          All plans include a 14-day free trial. No credit card required.
        </p>
        <p className={styles.footerText}>
          Need a custom plan?{' '}
          <a href="/contact" className={styles.link}>
            Contact sales
          </a>
        </p>
      </div>
    </div>
  );
}
