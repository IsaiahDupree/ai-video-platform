'use client';

import { useState, useEffect } from 'react';
import { useTracking } from '@/components/TrackingProvider';
import Link from 'next/link';
import posthog from 'posthog-js';

export default function LoginPage() {
  const tracking = useTracking();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    // Track landing on login page
    tracking.track('landing_view', {
      page: 'login',
      timestamp: new Date().toISOString(),
    });
  }, [tracking]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In a real app, you would authenticate the user here
    // For now, we'll use email as the user identifier
    const userId = `user_${formData.email.split('@')[0]}_${Date.now()}`;

    // Track login completion
    tracking.track('login_completed', {
      page: 'login',
      timestamp: new Date().toISOString(),
      method: 'email',
    });

    // Identify the user with PostHog
    // This enables PostHog identity stitching - linking the PostHog anonymous ID
    // to the identified user for proper funnel and retention analysis
    tracking.identify(userId, {
      email: formData.email,
      user_id: userId,
      plan: 'free', // default plan for returning users
    });

    // Also set user properties in PostHog directly for identity stitching
    posthog.setPersonProperties({
      email: formData.email,
      user_id: userId,
      login_source: 'email',
      login_time: new Date().toISOString(),
    });

    setIsSubmitting(false);
    setIsCompleted(true);
  };

  if (isCompleted) {
    return (
      <main style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <div
          style={{
            padding: '2rem',
            border: '1px solid #10b981',
            borderRadius: '8px',
            background: '#ecfdf5',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#059669' }}>
            Welcome Back!
          </h1>
          <p style={{ fontSize: '1rem', color: '#047857', marginBottom: '2rem' }}>
            You have been logged in successfully.
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: '#10b981',
              color: 'white',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: '500',
            }}
          >
            Go to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link
          href="/"
          style={{
            color: '#6b7280',
            textDecoration: 'none',
            fontSize: '0.875rem',
          }}
        >
          ← Back to Home
        </Link>
      </div>

      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
        Sign In
      </h1>
      <p style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '2rem' }}>
        Access your AI Video Platform account
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="email"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.5rem',
              color: '#374151',
            }}
          >
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem',
            }}
            placeholder="john@example.com"
          />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label
            htmlFor="password"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.5rem',
              color: '#374151',
            }}
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            minLength={8}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem',
            }}
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: isSubmitting ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
          }}
        >
          {isSubmitting ? 'Signing In...' : 'Sign In'}
        </button>

        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '1rem', textAlign: 'center' }}>
          Don't have an account?{' '}
          <Link href="/signup" style={{ color: '#3b82f6', textDecoration: 'none' }}>
            Create one
          </Link>
        </p>
      </form>
    </main>
  );
}
