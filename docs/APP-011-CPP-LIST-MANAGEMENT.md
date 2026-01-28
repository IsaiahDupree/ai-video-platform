# APP-011: CPP List & Management

**Status:** ✅ Implemented
**Priority:** P1
**Effort:** 8pts
**Category:** apple-pages

## Overview

List, edit, and manage existing Custom Product Pages with filtering, search, and CRUD operations.

## Features

### 1. CPP List View
- Displays all Custom Product Pages for an app in a table format
- Shows key information: name, state, visibility, URL
- Responsive design with clean, modern styling

### 2. Filtering & Search
- **Search:** Filter by name, URL, or state
- **Visibility Filter:** Show all, visible only, or hidden only
- Real-time filtering as you type

### 3. Management Actions
- **Edit:** Navigate to detailed edit page for a CPP
- **Delete:** Remove a CPP with confirmation dialog
- **Toggle Visibility:** One-click visibility toggle directly from the list

### 4. API Routes
- `GET /api/cpp/list` - List all CPPs with filtering
- `GET /api/cpp/[id]` - Get a specific CPP (with optional complete data)
- `PATCH /api/cpp/[id]` - Update a CPP (name, visibility)
- `DELETE /api/cpp/[id]` - Delete a CPP

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── cpp/
│   │       ├── list/
│   │       │   └── route.ts              # List CPPs endpoint
│   │       └── [id]/
│   │           └── route.ts              # Get/Update/Delete CPP endpoint
│   └── cpp/
│       ├── list/
│       │   ├── page.tsx                  # CPP list page component
│       │   └── list.module.css           # Styles for list page
│       └── edit/
│           └── [id]/
│               ├── page.tsx              # CPP edit page (view-only for now)
│               └── edit.module.css       # Styles for edit page
scripts/
└── test-cpp-list-management.ts          # Test script
```

## Usage

### Viewing the List Page

Navigate to:
```
http://localhost:3000/cpp/list
```

### Using the Test Script

```bash
# Run basic test (read-only)
npm run test:cpp-list

# Create a test CPP
npm run test:cpp-list -- --create

# Create and cleanup test CPP
npm run test:cpp-list -- --create --cleanup
```

### API Examples

#### List CPPs for an App
```typescript
const response = await fetch('/api/cpp/list?appId=YOUR_APP_ID');
const data = await response.json();
console.log(data.data); // Array of CPPs
```

#### Get Complete CPP Data
```typescript
const response = await fetch('/api/cpp/YOUR_CPP_ID?complete=true');
const data = await response.json();
console.log(data.data); // { page, version, localizations }
```

#### Update CPP Visibility
```typescript
const response = await fetch('/api/cpp/YOUR_CPP_ID', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ visible: true })
});
```

#### Delete CPP
```typescript
const response = await fetch('/api/cpp/YOUR_CPP_ID', {
  method: 'DELETE'
});
```

## UI Features

### List Page Features
1. **Header with Actions**
   - Create New CPP button
   - Page title and subtitle

2. **Filters Section**
   - Search input (searches name, URL, state)
   - Visibility dropdown (all/visible/hidden)
   - Refresh button

3. **Table View**
   - Sortable columns
   - State badges with color coding
   - Clickable visibility badges
   - Action buttons (Edit/Delete)

4. **Empty States**
   - No CPPs: Shows create button
   - No matches: Friendly message

5. **Footer**
   - Shows count of filtered vs total CPPs

### State Badge Colors
- **Ready for Distribution:** Green
- **Prepare for Submission:** Orange/Warning
- **Processing for Distribution:** Blue/Info
- **Replaced with New Version:** Gray

### Edit Page (Future Enhancement)
Currently shows read-only details:
- CPP name, ID, state, visibility, URL
- Current version information
- Localizations list

Future updates will add full editing capabilities.

## Service Layer

Uses existing services from APP-010:
- `listCustomProductPages()` - List with filtering
- `getCustomProductPage()` - Get single CPP
- `getCompleteCustomProductPage()` - Get CPP with all nested data
- `updateCustomProductPage()` - Update name/visibility
- `deleteCustomProductPage()` - Delete CPP

## Error Handling

- Credential validation
- Network error handling
- User-friendly error messages
- Confirmation dialogs for destructive actions

## Success Messages

- CPP deleted successfully
- Visibility toggled
- Auto-dismiss after 3 seconds

## Dependencies

- Next.js 16+ (App Router)
- React 19+
- ASC API services (APP-006, APP-010)

## Testing

The test script validates:
- ✅ List custom product pages
- ✅ Filter by app ID
- ✅ Filter by visibility
- ✅ Get complete custom product page details
- ✅ Create custom product page (with --create flag)
- ✅ Update custom product page (with --create flag)
- ✅ Delete custom product page (with --cleanup flag)

## Future Enhancements

1. **Edit Page**
   - Edit CPP name
   - Manage localizations
   - Add/remove screenshot sets
   - Submit for review

2. **Advanced Filtering**
   - Filter by state
   - Sort by date created/modified
   - Search by localization content

3. **Batch Operations**
   - Bulk visibility toggle
   - Bulk deletion
   - Duplicate CPP

4. **Analytics**
   - View conversion rates
   - Track performance per CPP
   - A/B test results

## Notes

- Requires ASC credentials configured via `npm run asc-creds`
- The edit page is a placeholder for future implementation
- All API routes require valid ASC credentials
- Deletion is permanent and cannot be undone

## Related Features

- **APP-010:** Custom Product Page Creator (prerequisite)
- **APP-006:** App Store Connect OAuth (prerequisite)
- **APP-012:** Device Mockup Preview (future)
- **APP-014:** PPO Test Configuration (future)
