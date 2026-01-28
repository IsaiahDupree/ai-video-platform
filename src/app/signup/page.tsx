'use client';

import { useState, useEffect } from 'react';
import { useTracking } from '@/components/TrackingProvider';
import Link from 'next/link';

export default function SignupPage() {
  const tracking = useTracking();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    // Track landing on signup page
    tracking.track('landing_view', {
      page: 'signup',
      timestamp: new Date().toISOString(),
    });
  }, [tracking]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Track signup_started when user begins typing in any field
    if (!formData.name && !formData.email && !formData.password) {
      tracking.track('signup_started', {
        page: 'signup',
        timestamp: new Date().toISOString(),
      });
    }

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

    // In a real app, you would create the user account here
    const userId = `user_${Date.now()}`;

    // Track signup completion
    tracking.track('signup_completed', {
      page: 'signup',
      timestamp: new Date().toISOString(),
      method: 'email',
    });

    // Identify the user
    tracking.identify(userId, {
      email: formData.email,
      name: formData.name,
      plan: 'free',
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
            Welcome to AI Video Platform!
          </h1>
          <p style={{ fontSize: '1rem', color: '#047857', marginBottom: '2rem' }}>
            Your account has been created successfully.
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
            Get Started
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
        Create Your Account
      </h1>
      <p style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '2rem' }}>
        Get started with AI Video Platform
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="name"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.5rem',
              color: '#374151',
            }}
          >
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem',
            }}
            placeholder="John Doe"
          />
        </div>

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
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
            Must be at least 8 characters
          </p>
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
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
        </button>

        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '1rem', textAlign: 'center' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#3b82f6', textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
