# TRACK-005: Monetization Event Tracking

## Overview

Implements tracking for monetization events that measure the conversion funnel from interest to payment. These events track user progression through the checkout flow and completed purchases.

## Features

### Tracked Events

1. **checkout_started**
   - Triggered when a user initiates the checkout process
   - Fires when user clicks "Start Free Trial" or "Get Started" on pricing page
   - Indicates intent to purchase
   - Tracks plan selection and pricing information

2. **purchase_completed**
   - Triggered when a purchase is successfully completed
   - Fires after payment is processed
   - Indicates successful conversion
   - Tracks transaction details and revenue

## Implementation

### Pricing Page - checkout_started

The pricing page (`src/app/pricing/page.tsx`) tracks when users initiate checkout:

```typescript
import { tracking } from '@/services/tracking';

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

  // Redirect to checkout page
  window.location.href = `/checkout?plan=${plan.id}`;
};
```

**Event Properties:**
- `planId` (string): Unique identifier for the plan (e.g., "pro", "business-annual")
- `planName` (string): Display name of the plan (e.g., "Pro", "Business Annual")
- `price` (number): Plan price in dollars
- `interval` ('month' | 'year'): Billing interval
- `currency` (string): Currency code (e.g., "USD")
- `timestamp` (string): ISO 8601 timestamp

### Checkout Page - purchase_completed

The checkout page (`src/app/checkout/page.tsx`) tracks successful purchases:

```typescript
import { tracking } from '@/services/tracking';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsProcessing(true);

  // Process payment (Stripe, etc.)
  await processPayment();

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
  window.location.href = `/checkout/success`;
};
```

**Event Properties:**
- `planId` (string): Unique identifier for the purchased plan
- `planName` (string): Display name of the plan
- `price` (number): Amount paid in dollars
- `interval` ('month' | 'year'): Billing interval
- `currency` (string): Currency code
- `email` (string): Customer email address
- `paymentMethod` (string): Payment method used (e.g., "card", "paypal")
- `transactionId` (string): Unique transaction identifier
- `timestamp` (string): ISO 8601 timestamp

## Pages Created

### 1. Pricing Page (`/pricing`)
**File:** `src/app/pricing/page.tsx`

Features:
- Monthly/yearly billing toggle
- 5 plan options (Free, Pro, Business, Pro Annual, Business Annual)
- Feature lists for each plan
- Popular plan badge
- "Save 17%" indicator for annual plans
- Responsive grid layout
- checkout_started event tracking on CTA button click

**Styling:** `src/app/pricing/pricing.module.css`
- Modern gradient background (#667eea → #764ba2)
- Glassmorphic billing toggle
- Card hover effects
- Mobile-responsive design

### 2. Checkout Page (`/checkout`)
**File:** `src/app/checkout/page.tsx`

Features:
- Contact information form (email)
- Payment information form (card number, expiry, CVC)
- Order summary sidebar
- Plan details display
- Tax calculation (10% for demo)
- 14-day free trial badge
- Secure payment indicator
- purchase_completed event tracking on form submit
- Loading state during payment processing

**Styling:** `src/app/checkout/checkout.module.css`
- Two-column layout (form + summary)
- Sticky sidebar on desktop
- Form validation states
- Loading spinner animation
- Mobile-responsive stacking

### 3. Success Page (`/checkout/success`)
**File:** `src/app/checkout/success/page.tsx`

Features:
- Success confirmation message
- Order details display
- Next steps guide (3 steps)
- Call-to-action buttons
- Trial reminder note

**Styling:** `src/app/checkout/success/success.module.css`
- Centered card layout
- Animated success icon
- Step-by-step guide
- Gradient CTA buttons

## Plans Configuration

### Free Plan
- **Price:** $0/month
- **Features:** 10 renders/month, basic templates, SD quality, community support

### Pro Plan
- **Monthly:** $29/month
- **Annual:** $290/year (2 months free)
- **Features:** 100 renders/month, all templates, HD quality, priority support, custom branding, API access

### Business Plan
- **Monthly:** $99/month
- **Annual:** $990/year (2 months free)
- **Features:** Unlimited renders, all templates + custom, 4K quality, dedicated support, custom branding, API access, team collaboration, advanced analytics

## Testing

Run the test suite:

```bash
npx tsx scripts/test-monetization-tracking.ts
```

### Test Coverage

The test suite validates:

1. **Event Structure**
   - ✅ checkout_started has all required properties
   - ✅ purchase_completed has all required properties
   - ✅ Property types are correct (string, number, boolean)

2. **Tracking Calls**
   - ✅ checkout_started events are tracked correctly
   - ✅ purchase_completed events are tracked correctly
   - ✅ Annual plans are tracked with correct interval
   - ✅ Business plans are tracked with correct pricing

3. **Transaction Details**
   - ✅ Transaction IDs are unique
   - ✅ Transaction IDs have proper format (txn_* prefix)
   - ✅ Payment methods are tracked correctly

4. **Data Validation**
   - ✅ Timestamps are in ISO 8601 format
   - ✅ Currency codes are valid
   - ✅ Prices are positive numbers
   - ✅ Intervals are valid values (month/year)
   - ✅ Email addresses are validated

5. **Edge Cases**
   - ✅ Free plan (price $0) is tracked correctly
   - ✅ Multiple purchases can be tracked sequentially
   - ✅ Different payment methods are supported

### Test Results

```
📊 Test Summary

Total Tests: 15
✅ Passed: 15
❌ Failed: 0
```

## Event Flow

### Checkout Flow

1. **User Visits Pricing Page** (`/pricing`)
   - Views available plans
   - Compares features
   - Selects monthly or yearly billing

2. **User Clicks "Start Free Trial"**
   - → `checkout_started` event tracked
   - Redirect to checkout page with plan parameter

3. **User Completes Checkout Form** (`/checkout`)
   - Enters email address
   - Enters payment information
   - Reviews order summary

4. **User Submits Payment**
   - Payment is processed
   - → `purchase_completed` event tracked
   - Redirect to success page

5. **User Sees Confirmation** (`/checkout/success`)
   - Confirmation message displayed
   - Order details shown
   - Next steps provided

## Analytics Use Cases

### 1. Conversion Funnel Analysis

Track users through the purchase funnel:

```
Landing Page View → Pricing Page View → Checkout Started → Purchase Completed
```

Calculate conversion rates at each step:
- Pricing to Checkout: `checkout_started / pricing_views`
- Checkout to Purchase: `purchase_completed / checkout_started`
- Overall CVR: `purchase_completed / pricing_views`

### 2. Plan Popularity Analysis

Analyze which plans convert best:

```sql
SELECT
  planId,
  COUNT(*) as checkouts,
  SUM(CASE WHEN converted THEN 1 ELSE 0 END) as purchases,
  AVG(price) as avg_revenue
FROM checkout_events
GROUP BY planId
ORDER BY purchases DESC
```

### 3. Revenue Tracking

Calculate total revenue by plan and interval:

```sql
SELECT
  planId,
  interval,
  COUNT(*) as purchases,
  SUM(price) as total_revenue,
  AVG(price) as avg_order_value
FROM purchase_completed_events
GROUP BY planId, interval
ORDER BY total_revenue DESC
```

### 4. Monthly vs Annual Analysis

Compare monthly and annual plan preferences:

```sql
SELECT
  interval,
  COUNT(*) as purchases,
  SUM(price) as total_revenue,
  AVG(price) as avg_order_value
FROM purchase_completed_events
GROUP BY interval
```

### 5. Checkout Abandonment

Identify users who started checkout but didn't complete:

```sql
SELECT
  userId,
  email,
  planId,
  checkout_timestamp,
  DATEDIFF(NOW(), checkout_timestamp) as days_since_checkout
FROM checkout_started_events cs
LEFT JOIN purchase_completed_events pc ON cs.userId = pc.userId
WHERE pc.transactionId IS NULL
ORDER BY checkout_timestamp DESC
```

## Integration

### Payment Processors

The checkout page is designed to integrate with:

1. **Stripe**
   - Use Stripe Elements for card input
   - Process payment with Stripe API
   - Track purchase_completed on successful charge

2. **PayPal**
   - Use PayPal Smart Buttons
   - Process payment with PayPal SDK
   - Track purchase_completed on approved payment

3. **Other Processors**
   - Implement payment form
   - Process payment with provider API
   - Track purchase_completed on success

### Customer Portal

After purchase, users should be able to:
- View subscription details
- Update payment method
- Cancel subscription
- View billing history

## Security Considerations

### 1. Payment Information

- Never store credit card numbers in your database
- Use PCI-compliant payment processors (Stripe, PayPal)
- Implement 3D Secure for card payments
- Use HTTPS for all payment pages

### 2. Email Privacy

- Hash email addresses in tracking events if required by privacy policy
- Provide opt-out mechanism for tracking
- Comply with GDPR/CCPA requirements

### 3. Transaction IDs

- Generate unique transaction IDs for each purchase
- Use cryptographically secure random generation
- Store transaction IDs for reconciliation

## Performance Considerations

### 1. Tracking Performance

- Tracking calls are non-blocking
- Events are queued and sent asynchronously
- No impact on checkout flow performance

### 2. Page Load Performance

- Pricing page optimized for fast loading
- Checkout page uses code splitting
- Success page is lightweight

## Future Enhancements

### 1. Coupon Codes
- Add coupon code input to checkout
- Track applied coupons in events
- Calculate discounted prices

### 2. Multiple Payment Methods
- Support PayPal, Apple Pay, Google Pay
- Track payment method preference
- Optimize checkout for each method

### 3. Subscription Management
- Allow plan upgrades/downgrades
- Track subscription changes
- Handle prorated billing

### 4. Team/Enterprise Plans
- Add custom quote request
- Track enterprise inquiries
- Implement team billing

### 5. Referral Program
- Track referral source in checkout
- Apply referral discounts
- Track referral conversion rates

### 6. Trial Extensions
- Allow trial period extensions
- Track trial extension events
- Measure impact on conversion

### 7. Abandoned Cart Recovery
- Send email reminders for abandoned checkouts
- Track recovery email effectiveness
- Measure recovered revenue

## Related Features

- **TRACK-001**: Tracking SDK Integration (base tracking system)
- **TRACK-002**: Acquisition Event Tracking (landing_view, signup_started)
- **TRACK-003**: Activation Event Tracking (first_video_created, first_render_completed)
- **TRACK-004**: Core Value Event Tracking (video_rendered, batch_completed, export_downloaded)

## Changelog

### Version 1.0.0 (2026-01-28)
- Initial implementation of monetization event tracking
- Created pricing page with 5 plan options
- Implemented checkout flow with payment form
- Added success confirmation page
- Implemented checkout_started event tracking
- Implemented purchase_completed event tracking
- Created comprehensive test suite (15 tests)
- Added full documentation
