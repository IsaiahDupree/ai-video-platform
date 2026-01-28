'use client';

import { useEffect } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

interface MetaPixelProps {
  pixelId: string;
}

/**
 * Meta Pixel component for Facebook/Instagram conversion tracking
 *
 * Loads the Meta Pixel base code on all pages and provides
 * tracking functionality through the window.fbq function.
 *
 * @param pixelId - Meta Pixel ID from Facebook Ads Manager
 */
export function MetaPixel({ pixelId }: MetaPixelProps) {
  useEffect(() => {
    // Initialize fbq function if not already present
    if (typeof window !== 'undefined' && !window.fbq) {
      const fbq = function() {
        // @ts-ignore
        fbq.callMethod
          ? // @ts-ignore
            fbq.callMethod.apply(fbq, arguments)
          : // @ts-ignore
            fbq.queue.push(arguments);
      };
      if (!window.fbq) window.fbq = fbq;
      // @ts-ignore
      window.fbq.push = fbq;
      // @ts-ignore
      window.fbq.loaded = true;
      // @ts-ignore
      window.fbq.version = '2.0';
      // @ts-ignore
      window.fbq.queue = [];
      window._fbq = window.fbq;
    }

    // Track PageView when component mounts
    if (window.fbq) {
      window.fbq('init', pixelId);
      window.fbq('track', 'PageView');
    }
  }, [pixelId]);

  if (!pixelId || pixelId === 'your_meta_pixel_id_here') {
    // Don't load pixel if not configured
    console.warn('Meta Pixel ID not configured');
    return null;
  }

  return (
    <>
      {/* Meta Pixel Code */}
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `,
        }}
      />
      {/* Meta Pixel NoScript fallback */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

/**
 * Track a custom Meta Pixel event
 *
 * @param eventName - Name of the event (e.g., 'ViewContent', 'Lead', 'Purchase')
 * @param parameters - Event parameters (optional)
 */
export function trackMetaEvent(eventName: string, parameters?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, parameters);
  } else {
    console.warn('Meta Pixel not loaded, cannot track event:', eventName);
  }
}

/**
 * Track a custom Meta Pixel event (non-standard events)
 *
 * @param eventName - Name of the custom event
 * @param parameters - Event parameters (optional)
 */
export function trackMetaCustomEvent(eventName: string, parameters?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', eventName, parameters);
  } else {
    console.warn('Meta Pixel not loaded, cannot track custom event:', eventName);
  }
}

/**
 * Consent Management - Grant consent for Meta Pixel tracking
 */
export function grantMetaConsent() {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('consent', 'grant');
  }
}

/**
 * Consent Management - Revoke consent for Meta Pixel tracking
 */
export function revokeMetaConsent() {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('consent', 'revoke');
  }
}
