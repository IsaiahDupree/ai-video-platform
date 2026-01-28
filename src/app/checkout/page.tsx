'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { tracking } from '@/services/tracking';
import styles from './checkout.module.css';

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
}

const plans: Record<string, Plan> = {
  'free': { id: 'free', name: 'Free', price: 0, interval: 'month' },
  'pro': { id: 'pro', name: 'Pro', price: 29, interval: 'month' },
  'business': { id: 'business', name: 'Business', price: 99, interval: 'month' },
  'pro-annual': { id: 'pro-annual', name: 'Pro Annual', price: 290, interval: 'year' },
  'business-annual': { id: 'business-annual', name: 'Business Annual', price: 990, interval: 'year' },
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan') || 'pro';
  const plan = plans[planId] || plans['pro'];

  const [email, setEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsProcessing(true);

    // Validate form
    if (!email || !cardNumber || !expiry || !cvc) {
      setError('Please fill in all fields');
      setIsProcessing(false);
      return;
    }

    // Simulate payment processing
    try {
      // In a real app, this would call Stripe/payment processor
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Track purchase completed event
      tracking.track('purchase_completed', {
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
        interval: plan.interval,
        currency: 'USD',
        email: email,
        paymentMethod: 'card',
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
      });

      // Redirect to success page
      window.location.href = `/checkout/success?plan=${plan.id}&email=${encodeURIComponent(email)}`;
    } catch (err) {
      setError('Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const tax = plan.price * 0.1; // 10% tax for demo
  const total = plan.price + tax;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.leftColumn}>
          <a href="/pricing" className={styles.backLink}>
            ← Back to pricing
          </a>

          <h1 className={styles.title}>Complete Your Order</h1>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Contact Information</h2>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  className={styles.input}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Payment Information</h2>
              <div className={styles.formGroup}>
                <label htmlFor="cardNumber" className={styles.label}>
                  Card Number
                </label>
                <input
                  type="text"
                  id="cardNumber"
                  className={styles.input}
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  maxLength={19}
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="expiry" className={styles.label}>
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    id="expiry"
                    className={styles.input}
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    maxLength={5}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="cvc" className={styles.label}>
                    CVC
                  </label>
                  <input
                    type="text"
                    id="cvc"
                    className={styles.input}
                    placeholder="123"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    maxLength={4}
                    required
                  />
                </div>
              </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className={styles.spinner}></span>
                  Processing...
                </>
              ) : (
                `Pay $${total.toFixed(2)}`
              )}
            </button>

            <p className={styles.disclaimer}>
              By completing this purchase, you agree to our Terms of Service and
              Privacy Policy. You'll be charged ${plan.price}/{plan.interval === 'month' ? 'month' : 'year'} after your 14-day free trial.
            </p>
          </form>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.summary}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>

            <div className={styles.planInfo}>
              <div className={styles.planName}>{plan.name}</div>
              <div className={styles.planInterval}>
                Billed {plan.interval === 'month' ? 'monthly' : 'annually'}
              </div>
            </div>

            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>${plan.price.toFixed(2)}</span>
            </div>

            <div className={styles.summaryRow}>
              <span>Tax (10%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>

            <div className={styles.summaryDivider}></div>

            <div className={styles.summaryRow}>
              <span className={styles.totalLabel}>Total Due Today</span>
              <span className={styles.totalAmount}>${total.toFixed(2)}</span>
            </div>

            <div className={styles.trialBadge}>
              <svg className={styles.trialIcon} viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
              </svg>
              <div>
                <div className={styles.trialTitle}>14-Day Free Trial</div>
                <div className={styles.trialText}>
                  You won't be charged until your trial ends
                </div>
              </div>
            </div>

            <div className={styles.features}>
              <h3 className={styles.featuresTitle}>What's Included</h3>
              <ul className={styles.featuresList}>
                <li className={styles.featureItem}>
                  <svg className={styles.checkIcon} viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                  </svg>
                  Full access to all features
                </li>
                <li className={styles.featureItem}>
                  <svg className={styles.checkIcon} viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                  </svg>
                  Cancel anytime
                </li>
                <li className={styles.featureItem}>
                  <svg className={styles.checkIcon} viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                  </svg>
                  No long-term commitment
                </li>
              </ul>
            </div>

            <div className={styles.secure}>
              <svg className={styles.lockIcon} viewBox="0 0 20 20">
                <path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" />
              </svg>
              <span>Secure payment powered by Stripe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
