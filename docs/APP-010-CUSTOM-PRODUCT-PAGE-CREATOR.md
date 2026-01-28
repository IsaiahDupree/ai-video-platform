# APP-010: Custom Product Page Creator

## Overview

Complete system for creating and managing Custom Product Pages (CPP) in App Store Connect. Provides TypeScript service layer, React UI, and CLI tools for managing custom product pages with screenshots and promotional text.

## Features

- **Custom Product Page Management**: Create, read, update, delete CPPs
- **Version Control**: Manage multiple versions of custom product pages
- **Localization Support**: Add localizations with promotional text
- **Screenshot Integration**: Link screenshots to custom product page localizations
- **High-Level Operations**: Simplified APIs for common workflows
- **Type Safety**: Full TypeScript types for all operations
- **React UI**: Visual interface for managing CPPs
- **CLI Testing**: Comprehensive test suite

## Quick Start

### 1. Prerequisites

Ensure you have App Store Connect API credentials configured:

```bash
npm run asc-creds add
```

### 2. Create a Custom Product Page (CLI)

```typescript
import { createCompleteCustomProductPage } from '@/services/ascCustomProductPages';

const result = await createCompleteCustomProductPage({
  appId: 'your-app-id',
  name: 'Holiday Campaign 2026',
  visible: true,
  locale: 'en-US',
  promotionalText: 'Special holiday features and offers!',
});

if (result.success) {
  console.log('CPP ID:', result.customProductPage?.id);
  console.log('Version ID:', result.version?.id);
} else {
  console.error('Error:', result.error);
}
```

### 3. Use the Web UI

Navigate to `/cpp` in your browser to access the visual interface.

### 4. Run Tests

```bash
npm run test:asc-cpp
```

## API Reference

### Custom Product Page Operations

#### `createCustomProductPage(options, credentials?)`

Create a new custom product page.

```typescript
import { createCustomProductPage } from '@/services/ascCustomProductPages';

const page = await createCustomProductPage({
  appId: 'app-id',
  name: 'My Custom Page',
  visible: true,
});

console.log('Created CPP:', page.id);
console.log('Name:', page.attributes?.name);
console.log('State:', page.attributes?.state);
```

**Parameters:**
- `options.appId`: App ID to create the page for
- `options.name`: Name of the custom product page
- `options.visible`: Whether the page should be visible (default: true)
- `credentials`: Optional ASC credentials

**Returns:** `AppCustomProductPage`

#### `getCustomProductPage(customProductPageId, credentials?)`

Get a custom product page by ID.

```typescript
const page = await getCustomProductPage('cpp-id');
```

#### `listCustomProductPages(options, credentials?)`

List custom product pages.

```typescript
const response = await listCustomProductPages({
  filterAppId: 'app-id',
  filterVisible: true,
  include: ['appCustomProductPageVersions'],
  limit: 10,
});

console.log('Found', response.data.length, 'pages');
```

**Parameters:**
- `options.filterAppId`: Filter by app ID
- `options.filterVisible`: Filter by visibility
- `options.include`: Include related resources
- `options.limit`: Results per page

#### `updateCustomProductPage(options, credentials?)`

Update a custom product page.

```typescript
const page = await updateCustomProductPage({
  customProductPageId: 'cpp-id',
  name: 'Updated Name',
  visible: false,
});
```

#### `deleteCustomProductPage(options, credentials?)`

Delete a custom product page.

```typescript
await deleteCustomProductPage({ customProductPageId: 'cpp-id' });
```

### Custom Product Page Version Operations

#### `createCustomProductPageVersion(options, credentials?)`

Create a new version of a custom product page.

```typescript
const version = await createCustomProductPageVersion({
  customProductPageId: 'cpp-id',
});

console.log('Version ID:', version.id);
console.log('State:', version.attributes?.state);
```

#### `getCustomProductPageVersion(versionId, credentials?)`

Get a version by ID.

```typescript
const version = await getCustomProductPageVersion('version-id');
```

#### `listCustomProductPageVersions(options, credentials?)`

List versions for a custom product page.

```typescript
const response = await listCustomProductPageVersions({
  filterCustomProductPageId: 'cpp-id',
  filterState: 'PREPARE_FOR_SUBMISSION',
  include: ['appCustomProductPageLocalizations'],
});
```

#### `updateCustomProductPageVersion(options, credentials?)`

Update a version.

```typescript
const version = await updateCustomProductPageVersion({
  versionId: 'version-id',
  name: 'Version 2.0',
});
```

#### `deleteCustomProductPageVersion(options, credentials?)`

Delete a version.

```typescript
await deleteCustomProductPageVersion({ versionId: 'version-id' });
```

### Custom Product Page Localization Operations

#### `createCustomProductPageLocalization(options, credentials?)`

Create a localization for a custom product page version.

```typescript
const localization = await createCustomProductPageLocalization({
  customProductPageVersionId: 'version-id',
  locale: 'en-US',
  promotionalText: 'Check out our new features!',
});

console.log('Localization ID:', localization.id);
console.log('Locale:', localization.attributes?.locale);
```

**Parameters:**
- `options.customProductPageVersionId`: Version ID
- `options.locale`: Locale code (e.g., 'en-US', 'fr-FR')
- `options.promotionalText`: Promotional text (max 170 characters)

#### `getCustomProductPageLocalization(localizationId, credentials?)`

Get a localization by ID.

```typescript
const localization = await getCustomProductPageLocalization('loc-id');
```

#### `listCustomProductPageLocalizations(options, credentials?)`

List localizations for a version.

```typescript
const response = await listCustomProductPageLocalizations({
  filterCustomProductPageVersionId: 'version-id',
  filterLocale: 'en-US',
  include: ['appScreenshotSets', 'appPreviewSets'],
});
```

#### `updateCustomProductPageLocalization(options, credentials?)`

Update a localization.

```typescript
const localization = await updateCustomProductPageLocalization({
  localizationId: 'loc-id',
  promotionalText: 'Updated promotional text!',
});
```

#### `deleteCustomProductPageLocalization(options, credentials?)`

Delete a localization.

```typescript
await deleteCustomProductPageLocalization({ localizationId: 'loc-id' });
```

### High-Level Operations

#### `createCompleteCustomProductPage(options, credentials?)`

Create a complete custom product page with version and localization in one operation.

```typescript
const result = await createCompleteCustomProductPage({
  appId: 'app-id',
  name: 'Summer Campaign',
  visible: true,
  locale: 'en-US',
  promotionalText: 'Summer sale now on!',
});

if (result.success) {
  console.log('CPP:', result.customProductPage);
  console.log('Version:', result.version);
} else {
  console.error('Error:', result.error);
}
```

**Parameters:**
- `options.appId`: App ID
- `options.name`: CPP name
- `options.visible`: Visibility (default: true)
- `options.locale`: Initial locale
- `options.promotionalText`: Promotional text (optional)

**Returns:** `CreateCustomProductPageResult` with success flag and created resources

#### `getCompleteCustomProductPage(customProductPageId, credentials?)`

Get a custom product page with all nested data.

```typescript
const complete = await getCompleteCustomProductPage('cpp-id');

console.log('Page:', complete.page);
console.log('Current version:', complete.version);
console.log('Localizations:', complete.localizations);
```

**Returns:** `CompleteCustomProductPage` with page, version, and localizations

#### `addLocalizationToCustomProductPage(options, credentials?)`

Add a new localization to an existing custom product page.

```typescript
const result = await addLocalizationToCustomProductPage({
  customProductPageId: 'cpp-id',
  locale: 'es-ES',
  promotionalText: 'Texto promocional en español',
});

if (result.success) {
  console.log('Localization:', result.localization);
}
```

#### `listCustomProductPagesForApp(appId, credentials?)`

List all custom product pages for an app.

```typescript
const pages = await listCustomProductPagesForApp('app-id');

pages.forEach(page => {
  console.log(`- ${page.attributes?.name} (${page.id})`);
});
```

## Type Reference

### States

#### `CustomProductPageState`

```typescript
type CustomProductPageState =
  | 'PREPARE_FOR_SUBMISSION'      // Initial state, being edited
  | 'READY_FOR_DISTRIBUTION'      // Approved and ready to use
  | 'PROCESSING_FOR_DISTRIBUTION' // Being processed by Apple
  | 'REPLACED_WITH_NEW_VERSION';  // Superseded by newer version
```

#### `CustomProductPageVersionState`

```typescript
type CustomProductPageVersionState =
  | 'PREPARE_FOR_SUBMISSION'  // Being edited
  | 'WAITING_FOR_REVIEW'      // Submitted to Apple
  | 'IN_REVIEW'               // Under review by Apple
  | 'ACCEPTED'                // Accepted but not yet live
  | 'APPROVED'                // Approved and live
  | 'REPLACED_WITH_NEW_VERSION' // Superseded
  | 'REJECTED';               // Rejected by Apple
```

#### `CustomProductPageLocalizationState`

```typescript
type CustomProductPageLocalizationState =
  | 'PREPARE_FOR_SUBMISSION'
  | 'WAITING_FOR_REVIEW'
  | 'IN_REVIEW'
  | 'ACCEPTED'
  | 'APPROVED'
  | 'REPLACED_WITH_NEW_VERSION'
  | 'REJECTED';
```

### Resources

#### `AppCustomProductPage`

```typescript
interface AppCustomProductPage {
  type: 'appCustomProductPages';
  id: string;
  attributes?: {
    name?: string;
    url?: string;
    visible?: boolean;
    state?: CustomProductPageState;
  };
  relationships?: {
    app?: { /* ... */ };
    appCustomProductPageVersions?: { /* ... */ };
  };
  links?: {
    self?: string;
  };
}
```

#### `AppCustomProductPageVersion`

```typescript
interface AppCustomProductPageVersion {
  type: 'appCustomProductPageVersions';
  id: string;
  attributes?: {
    name?: string;
    state?: CustomProductPageVersionState;
    deepLink?: string;
  };
  relationships?: {
    appCustomProductPage?: { /* ... */ };
    appCustomProductPageLocalizations?: { /* ... */ };
  };
}
```

#### `AppCustomProductPageLocalization`

```typescript
interface AppCustomProductPageLocalization {
  type: 'appCustomProductPageLocalizations';
  id: string;
  attributes?: {
    locale?: string;
    promotionalText?: string;
    state?: CustomProductPageLocalizationState;
  };
  relationships?: {
    appCustomProductPageVersion?: { /* ... */ };
    appScreenshotSets?: { /* ... */ };
    appPreviewSets?: { /* ... */ };
  };
}
```

## Web UI

### Accessing the UI

Navigate to `/cpp` in your browser to access the Custom Product Pages UI.

### Features

1. **App Selection**: Select which app to manage
2. **List View**: See all custom product pages for the selected app
3. **Create New**: Create a new custom product page with initial localization
4. **Edit**: View and manage localizations for a custom product page
5. **State Management**: Visual indicators for page state and visibility

### Creating a Custom Product Page

1. Select your app from the dropdown
2. Click "Create New" tab
3. Fill in the form:
   - Page Name (required)
   - Visibility (checkbox)
   - Initial Locale (required)
   - Promotional Text (optional, max 170 characters)
4. Click "Create Custom Product Page"

### Managing Localizations

1. Click "Edit" on a custom product page
2. View existing localizations
3. Add new localizations with locale-specific promotional text

## CLI Testing

### Run Full Test Suite

```bash
npm run test:asc-cpp
```

### Test Coverage

The test suite covers:

1. **Custom Product Page Operations**
   - Create
   - Get
   - List
   - Update
   - Delete

2. **Version Operations**
   - Create version
   - Get version
   - List versions

3. **Localization Operations**
   - Create localization
   - Get localization
   - List localizations
   - Update localization

4. **High-Level Operations**
   - Create complete CPP
   - Get complete CPP
   - Add localization

### Interactive Testing

The test script is interactive and will:
- Load your ASC credentials
- Let you select which app to test with
- Run all tests
- Optionally clean up test data

## Integration with Screenshots

Custom product page localizations can have screenshot sets attached. To add screenshots:

```typescript
import { uploadScreenshots } from '@/services/ascScreenshots';
import { findOrCreateScreenshotSet } from '@/services/ascScreenshots';

// Get localization
const localization = await getCustomProductPageLocalization('loc-id');

// Create or find screenshot set
const screenshotSet = await findOrCreateScreenshotSet(
  localization.id,
  'APP_IPHONE_67'
);

// Upload screenshots
await uploadScreenshots(screenshotSet.id, screenshots);
```

See [APP-008: Screenshot Upload API](./APP-008-SCREENSHOT-UPLOAD-API.md) for more details.

## Workflow Example

### Complete Campaign Setup

```typescript
import {
  createCompleteCustomProductPage,
  addLocalizationToCustomProductPage,
} from '@/services/ascCustomProductPages';
import { uploadScreenshots } from '@/services/ascScreenshots';

// 1. Create custom product page with English localization
const result = await createCompleteCustomProductPage({
  appId: 'app-id',
  name: 'Holiday Campaign 2026',
  visible: false, // Keep hidden until ready
  locale: 'en-US',
  promotionalText: 'Special holiday features and exclusive offers!',
});

if (!result.success) {
  throw new Error(result.error);
}

const cppId = result.customProductPage!.id;

// 2. Add Spanish localization
await addLocalizationToCustomProductPage({
  customProductPageId: cppId,
  locale: 'es-ES',
  promotionalText: '¡Funciones especiales de vacaciones y ofertas exclusivas!',
});

// 3. Add French localization
await addLocalizationToCustomProductPage({
  customProductPageId: cppId,
  locale: 'fr-FR',
  promotionalText: 'Fonctionnalités spéciales de vacances et offres exclusives!',
});

// 4. Upload screenshots (see APP-008 for details)
// ...

// 5. Make visible when ready
await updateCustomProductPage({
  customProductPageId: cppId,
  visible: true,
});

console.log('Campaign setup complete!');
console.log('Custom Product Page ID:', cppId);
```

## Best Practices

### Naming

- Use descriptive names for custom product pages (e.g., "Holiday Campaign 2026", "Gaming Feature Spotlight")
- Include campaign dates or version numbers if relevant

### Visibility

- Start with `visible: false` while setting up
- Test thoroughly before making visible
- Use the deep link to preview before making public

### Promotional Text

- Keep under 170 characters (enforced by API)
- Make it compelling and specific to the campaign
- Localize appropriately for each language
- Test readability on mobile devices

### Localization

- Add all required locales for your app
- Ensure promotional text is properly translated
- Consider cultural differences in messaging
- Upload localized screenshots for each locale

### State Management

- Check states before making changes
- Don't modify versions in review
- Wait for "APPROVED" state before promoting

## Troubleshooting

### "No version found for custom product page"

Make sure a version has been created. Every CPP needs at least one version.

```typescript
const version = await createCustomProductPageVersion({
  customProductPageId: 'cpp-id',
});
```

### "Promotional text exceeds 170 characters"

The promotional text field has a maximum length of 170 characters. Trim your text:

```typescript
const text = 'Your promotional text...';
if (text.length > 170) {
  console.error('Text too long:', text.length);
}
```

### "Cannot modify resource in review"

You cannot modify a version that is currently in review. Wait for it to be approved or rejected, or create a new version.

### "Invalid locale"

Use proper locale codes like 'en-US', 'fr-FR', 'es-ES'. See App Store Connect documentation for supported locales.

## Dependencies

- **APP-006**: App Store Connect OAuth (authentication)
- **APP-008**: Screenshot Upload API (for attaching screenshots)

## Limitations

- Maximum 35 custom product pages per app (Apple's limit)
- Promotional text limited to 170 characters
- Cannot modify versions in review
- Deep links only available after approval

## Future Enhancements

- Duplicate existing CPP as template
- Bulk localization import from CSV
- A/B testing integration (see APP-014: PPO Test Configuration)
- Analytics and conversion tracking
- Template library for common campaigns

## Files

### Types
- `src/types/ascCustomProductPages.ts` (520 lines) - Type definitions

### Services
- `src/services/ascCustomProductPages.ts` (650 lines) - Service implementation

### UI
- `src/app/cpp/page.tsx` (450 lines) - React UI
- `src/app/cpp/cpp.module.css` (350 lines) - Styles

### Testing
- `scripts/test-asc-custom-product-pages.ts` (780 lines) - Test suite

### Documentation
- `docs/APP-010-CUSTOM-PRODUCT-PAGE-CREATOR.md` (this file)

**Total:** ~2,750 lines of code

## References

- [App Store Connect API Documentation](https://developer.apple.com/documentation/appstoreconnectapi)
- [Custom Product Pages Guide](https://developer.apple.com/app-store/custom-product-pages/)
- [Product Page Optimization](https://developer.apple.com/app-store/product-page-optimization/)
- [APP-006: App Store Connect OAuth](./APP-006-APP-STORE-CONNECT-OAUTH.md)
- [APP-008: Screenshot Upload API](./APP-008-SCREENSHOT-UPLOAD-API.md)
