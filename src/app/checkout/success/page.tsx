'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './success.module.css';

function SuccessContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const planId = searchParams.get('plan') || 'pro';

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconContainer}>
          <svg className={styles.successIcon} viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
          </svg>
        </div>

        <h1 className={styles.title}>Welcome to Your Free Trial!</h1>
        <p className={styles.subtitle}>
          Your order has been confirmed. Check your email for details.
        </p>

        <div className={styles.details}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Email:</span>
            <span className={styles.detailValue}>{email}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Plan:</span>
            <span className={styles.detailValue}>
              {planId.charAt(0).toUpperCase() + planId.slice(1).replace('-', ' ')}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Trial Period:</span>
            <span className={styles.detailValue}>14 days free</span>
          </div>
        </div>

        <div className={styles.nextSteps}>
          <h2 className={styles.nextStepsTitle}>What's Next?</h2>
          <ul className={styles.stepsList}>
            <li className={styles.step}>
              <span className={styles.stepNumber}>1</span>
              <div>
                <div className={styles.stepTitle}>Check Your Email</div>
                <div className={styles.stepDescription}>
                  We've sent you a confirmation email with your order details
                </div>
              </div>
            </li>
            <li className={styles.step}>
              <span className={styles.stepNumber}>2</span>
              <div>
                <div className={styles.stepTitle}>Start Creating</div>
                <div className={styles.stepDescription}>
                  Explore all features and create your first video
                </div>
              </div>
            </li>
            <li className={styles.step}>
              <span className={styles.stepNumber}>3</span>
              <div>
                <div className={styles.stepTitle}>Get Support</div>
                <div className={styles.stepDescription}>
                  Need help? Our support team is ready to assist you
                </div>
              </div>
            </li>
          </ul>
        </div>

        <div className={styles.actions}>
          <a href="/ads/editor" className={styles.primaryButton}>
            Start Creating
          </a>
          <a href="/" className={styles.secondaryButton}>
            Go to Dashboard
          </a>
        </div>

        <p className={styles.trialNote}>
          Your trial starts now. You won't be charged until {' '}
          {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}.
          Cancel anytime before then.
        </p>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
