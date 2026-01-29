# META-006: User Data Hashing

**Feature ID:** META-006
**Category:** Meta Pixel
**Priority:** P1
**Status:** ✅ Complete
**Date:** 2026-01-29

## Overview

Comprehensive user data hashing implementation for Meta Pixel and Conversions API (CAPI). Provides SHA256 hashing of PII (Personally Identifiable Information) in both browser and Node.js environments, ensuring compliance with Meta's data privacy requirements.

## Why This Matters

Meta requires all PII to be hashed with SHA256 before sending via:
- **Conversions API (CAPI)** - Server-side conversion tracking
- **Advanced Matching** - Enhanced attribution on client-side

Proper hashing enables:
- **Better attribution** - Match more conversions to ad clicks
- **Larger audiences** - Build custom audiences from customer data
- **Privacy compliance** - PII never sent in plaintext
- **Deduplication** - Match client and server events accurately

## What Was Built

### 1. Browser-Compatible Hashing Utility (`src/utils/hashUserData.ts`)

A universal hashing library that works in both browser and Node.js environments.

**Key Features:**
- ✅ SHA256 hashing (Meta's required algorithm)
- ✅ Automatic normalization (lowercase, trim whitespace)
- ✅ Browser support via SubtleCrypto API
- ✅ Node.js support via crypto module
- ✅ Field-specific hashing (email, phone, date of birth)
- ✅ Validation utilities (verify hash format, check if already hashed)

**Functions:**

```typescript
// Hash any string value
await hashValue('john doe')
// => "3c2e813b7a5e8b6d..."

// Hash email with validation
await hashEmail('user@example.com')
// => "b4c9a289323b21a0..."

// Hash phone with formatting normalization
await hashPhone('+1 (415) 555-1234')
// => "50389806e2857c36..."

// Hash date of birth (multiple formats supported)
await hashDateOfBirth('1990-01-15')
await hashDateOfBirth('19900115')
await hashDateOfBirth(new Date('1990-01-15'))
// => "4747c382bedef489..." (all return same hash)

// Hash complete user profile
await hashUserData({
  email: 'user@example.com',
  phone: '+14155551234',
  firstName: 'John',
  lastName: 'Doe',
  city: 'San Francisco',
  state: 'CA',
  zipCode: '94102',
  country: 'US',
  gender: 'm',
  dateOfBirth: '1990-01-15',
})
// Returns: { em: "...", ph: "...", fn: "...", ... }

// Validate SHA256 hash format
isValidSHA256Hash('abc123...') // => true/false

// Check if data is already hashed
isUserDataHashed({ em: "abc123...", fn: "def456..." }) // => true/false
```

### 2. Updated Meta CAPI Service

Updated `src/services/metaCapi.ts` to use the shared hashing utility instead of duplicated code.

**Changes:**
- Removed duplicate `hashValue` method
- Updated `hashUserData` to use shared utility
- Made hashing async (required for browser compatibility)
- Consistent hashing across client and server

### 3. API Endpoint for Server-Side Hashing

**Endpoint:** `POST /api/meta/hash-user-data`

Allows clients to hash user data server-side before sending to Meta. Useful when:
- Client-side crypto API is unavailable
- You want to centralize hashing logic
- You need to hash data before storing

**Request:**
```json
{
  "email": "user@example.com",
  "phone": "+14155551234",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "hashedData": {
    "em": "b4c9a289323b21a0...",
    "ph": "50389806e2857c36...",
    "fn": "96d9632f363564cc...",
    "ln": "799ef92a11af918e..."
  }
}
```

### 4. Comprehensive Test Suite

**Test Script:** `scripts/test-user-data-hashing.ts`

Tests all hashing functionality:
- ✅ Basic string value hashing
- ✅ Email normalization and validation
- ✅ Phone number formatting
- ✅ Date of birth conversion
- ✅ Complete user data hashing
- ✅ Hash validation
- ✅ API endpoint
- ✅ Known hash values

**Run Tests:**
```bash
npx tsx scripts/test-user-data-hashing.ts
```

**Test Results:**
```
Total tests: 19
✓ Passed: 19
Success rate: 100%

✓ All tests passed! ✨
```

## PII Fields That Should Be Hashed

According to Meta's documentation, these fields must be hashed:

| Field | Meta Key | Description | Example |
|-------|----------|-------------|---------|
| Email | `em` | Email address | user@example.com |
| Phone | `ph` | Phone number (E.164 format) | +14155551234 |
| First Name | `fn` | First name | John |
| Last Name | `ln` | Last name | Doe |
| City | `ct` | City name | San Francisco |
| State | `st` | State/province code | CA |
| Zip Code | `zp` | Postal code | 94102 |
| Country | `country` | 2-letter ISO country code | US |
| Gender | `ge` | Gender (m/f) | m |
| Date of Birth | `db` | Date in YYYYMMDD format | 19900115 |

## Normalization Rules

Before hashing, all values are normalized:

1. **Lowercase** - All text converted to lowercase
2. **Trim** - Whitespace removed from start/end
3. **Format-specific rules:**
   - **Email** - Must match email regex
   - **Phone** - Remove all non-digit characters (except leading +)
   - **Date of Birth** - Convert to YYYYMMDD format
   - **Country** - Use 2-letter ISO code

## Usage Examples

### Client-Side (Browser)

```typescript
import { hashUserData } from '@/utils/hashUserData';

// Hash user data before sending to server
async function trackSignup(user: { email: string; firstName: string }) {
  const hashed = await hashUserData({
    email: user.email,
    firstName: user.firstName,
  });

  // Send hashed data to Meta via Pixel
  fbq('track', 'CompleteRegistration', {}, {
    eventID: generateEventId(),
    em: hashed.em,
    fn: hashed.fn,
  });
}
```

### Server-Side (Node.js)

```typescript
import { hashUserData } from '@/utils/hashUserData';
import { metaCapiService } from '@/services/metaCapi';

// Hash and send to CAPI
async function trackPurchase(user: { email: string; phone: string }) {
  const hashed = await hashUserData({
    email: user.email,
    phone: user.phone,
  });

  await metaCapiService.trackEvent('Purchase', {
    userData: hashed,
    customData: {
      value: 99.99,
      currency: 'USD',
    },
  });
}
```

### Via API Endpoint

```typescript
// Client-side: send unhashed data to API
async function hashOnServer(userData: UserDataToHash) {
  const response = await fetch('/api/meta/hash-user-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  const { hashedData } = await response.json();
  return hashedData;
}
```

## Integration with Existing Features

### META-004: CAPI Server-Side Events

The CAPI service (`metaCapi.ts`) now uses the shared hashing utility:

```typescript
// Automatically hashes user data before sending to Meta
await metaCapiService.trackEvent('Lead', {
  userData: {
    em: 'user@example.com', // Will be hashed automatically
    fn: 'John',
  },
});
```

### META-005: Event Deduplication

Hashed user data helps Meta deduplicate events:

```typescript
const eventId = generateEventId();

// Client-side (Pixel)
const hashed = await hashUserData({ email: user.email });
fbq('track', 'Purchase', {}, { eventID: eventId, em: hashed.em });

// Server-side (CAPI) - same eventId + hashed email = deduplication
await metaCapiService.trackEvent('Purchase', {
  eventId,
  userData: { em: user.email }, // Will be hashed
});
```

## Security Considerations

1. **No Storage** - Hashed data is not stored, only computed on-demand
2. **One-Way Function** - SHA256 is cryptographically secure (can't reverse)
3. **Consistent Hashing** - Same input always produces same hash
4. **Normalization** - Ensures "User@Example.com" = "user@example.com"
5. **Validation** - Checks data format before hashing

## Performance

- **Browser:** Uses native SubtleCrypto API (fast, async)
- **Node.js:** Uses native crypto module (very fast, now async for consistency)
- **Batch Operations:** Supported via `Promise.all()`

## Documentation References

- [Meta CAPI Customer Information Parameters](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters)
- [Meta Advanced Matching](https://developers.facebook.com/docs/meta-pixel/advanced/advanced-matching)
- [SHA256 Hashing Standard](https://en.wikipedia.org/wiki/SHA-2)

## Files Modified

```
src/utils/hashUserData.ts (new)
src/services/metaCapi.ts (updated)
src/app/api/meta/hash-user-data/route.ts (new)
scripts/test-user-data-hashing.ts (new)
docs/META-006-USER-DATA-HASHING.md (new)
feature_list.json (updated)
```

## Testing

Run the test suite:

```bash
npx tsx scripts/test-user-data-hashing.ts
```

All tests should pass with 100% success rate.

## Next Steps

With user data hashing complete, you can now:

1. **META-007: Custom Audiences Setup** - Use hashed data to build custom audiences
2. **META-008: Conversion Optimization** - Improve ad performance with hashed user data
3. **Enhanced Tracking** - Add more user data fields to improve attribution

## Troubleshooting

**Issue:** "No hashing method available"
**Solution:** Ensure you're in a browser or Node.js environment

**Issue:** "Invalid email format"
**Solution:** Check that email matches format: `user@domain.com`

**Issue:** "Invalid date of birth format"
**Solution:** Use YYYYMMDD, YYYY-MM-DD, or Date object

**Issue:** Hashes don't match between client and server
**Solution:** Ensure both use the same normalization (lowercase, trim)

## Success Metrics

- ✅ All 19 tests passing
- ✅ Browser and Node.js compatibility
- ✅ Consistent hashing across environments
- ✅ API endpoint working
- ✅ Integration with CAPI service complete
