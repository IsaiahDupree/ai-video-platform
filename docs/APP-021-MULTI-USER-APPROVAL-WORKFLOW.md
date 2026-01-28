# APP-021: Multi-user Approval Workflow

## Overview

Multi-user approval workflow system for Apple App Store assets including screenshots, custom product pages, app preview videos, and localized metadata. This feature extends the base approval system (ADS-016) specifically for Apple product page management.

## Features

### Core Functionality

1. **Approval Status States**
   - Draft
   - In Review
   - Approved
   - Rejected
   - Changes Requested

2. **Supported Asset Types**
   - Screenshots (individual and sets)
   - Custom Product Pages (CPP)
   - App Preview Videos
   - Localized Metadata
   - PPO Treatments

3. **User Roles**
   - Owner (full access)
   - Admin (can approve)
   - Editor (can create and submit)
   - Viewer (read-only)

4. **Workflow Actions**
   - Submit for Review
   - Approve
   - Reject (requires comment)
   - Request Changes (requires comment)
   - Revert to Draft

5. **Comment System**
   - Add comments at any stage
   - Internal vs. client-facing comments
   - File attachments support
   - Author tracking

6. **Approval History**
   - Full audit trail
   - Status change tracking
   - Timestamp and user tracking
   - Reason/comment tracking

## Architecture

### Type Definitions

**Location:** `src/types/appleApproval.ts`

Key types:
- `AppleApprovableResourceType` - Enum for Apple asset types
- `AppleScreenshotResource` - Screenshot-specific fields
- `AppleCPPResource` - CPP-specific fields
- `ApplePreviewResource` - Video preview fields
- `AppleMetadataResource` - Localized metadata fields
- `ApplePPOResource` - PPO treatment fields
- `AppleApprovalFilter` - Filter options
- `AppleApprovalStatistics` - Statistics interface

### Service Layer

**Location:** `src/services/appleApprovalService.ts`

Main service class: `AppleApprovalService`

Key methods:
- `createResource()` - Create new approvable resource
- `getResource()` - Get resource by ID
- `saveResource()` - Save resource updates
- `listResources()` - List with filtering
- `performAction()` - Execute approval action
- `addComment()` - Add comment to resource
- `getComments()` - Get all comments
- `getHistory()` - Get approval history
- `getStatistics()` - Get approval stats
- `deleteResource()` - Delete resource

### UI Components

**Location:** `src/app/review/`

Main page: `page.tsx`
- Review dashboard
- Filter controls
- Statistics display
- Resource grid

Components:
- `ReviewItemCard` - Individual resource card with actions
- `ReviewFilters` - Filter sidebar
- `AppleApprovalStats` - Statistics display

### API Routes

**Location:** `src/app/api/review/apple/`

Routes:
- `GET /api/review/apple` - List resources with filtering
- `GET /api/review/apple/[id]` - Get specific resource
- `POST /api/review/apple/[id]/action` - Perform approval action

## Usage

### Creating an Approvable Resource

```typescript
import { getAppleApprovalService } from '@/services/appleApprovalService';
import { AppleApprovableResourceType } from '@/types/appleApproval';

const service = getAppleApprovalService();

const screenshot = await service.createResource({
  workspaceId: 'workspace-123',
  resourceType: AppleApprovableResourceType.SCREENSHOT,
  name: 'iPhone 15 Pro Screenshot 1',
  description: 'Main feature showcase',
  appId: 'com.example.myapp',
  locale: 'en-US',
  deviceType: 'iPhone 15 Pro',
  imageUrl: '/screenshots/iphone-1.png',
  createdBy: 'user-123',
  createdByName: 'John Doe',
  createdByEmail: 'john@example.com',
});
```

### Performing Approval Actions

```typescript
import { ApprovalAction } from '@/types/approval';
import { WorkspaceRole } from '@/types/workspace';

// Submit for review
await service.performAction(
  resourceId,
  ApprovalAction.SUBMIT_FOR_REVIEW,
  userId,
  userName,
  userEmail,
  WorkspaceRole.EDITOR
);

// Approve
await service.performAction(
  resourceId,
  ApprovalAction.APPROVE,
  adminId,
  adminName,
  adminEmail,
  WorkspaceRole.ADMIN,
  'Looks great!'
);

// Request changes
await service.performAction(
  resourceId,
  ApprovalAction.REQUEST_CHANGES,
  adminId,
  adminName,
  adminEmail,
  WorkspaceRole.ADMIN,
  'Please update the caption text'
);
```

### Listing and Filtering Resources

```typescript
import { ApprovalStatus } from '@/types/approval';

// List all resources
const allResources = await service.listResources({
  workspaceId: 'workspace-123',
});

// Filter by status
const inReview = await service.listResources({
  workspaceId: 'workspace-123',
  status: ApprovalStatus.IN_REVIEW,
});

// Filter by app and locale
const appResources = await service.listResources({
  workspaceId: 'workspace-123',
  appId: 'com.example.myapp',
  locale: 'en-US',
});

// Search
const searchResults = await service.listResources({
  workspaceId: 'workspace-123',
  searchQuery: 'summer campaign',
});
```

### Adding Comments

```typescript
await service.addComment(
  resourceId,
  userId,
  userName,
  userEmail,
  WorkspaceRole.EDITOR,
  'This looks good, but can we adjust the color?',
  false // isInternal
);
```

### Getting Statistics

```typescript
const stats = await service.getStatistics({
  workspaceId: 'workspace-123',
});

console.log('Draft:', stats.totalDraft);
console.log('In Review:', stats.totalInReview);
console.log('Approved:', stats.totalApproved);
console.log('Approval Rate:', stats.approvalRate + '%');
console.log('Avg Time:', stats.avgTimeToApproval / (1000 * 60 * 60) + 'h');
```

## Testing

### Run Test Script

```bash
npm run test:apple-approval
```

Or directly:

```bash
npx tsx scripts/test-apple-approval-workflow.ts
```

### Test Coverage

The test script covers:
1. Screenshot resource creation
2. Submit for review action
3. Comment addition
4. Request changes action
5. Revert to draft
6. Approval workflow
7. CPP resource creation
8. Resource filtering
9. Statistics calculation
10. History tracking

## Data Storage

Resources are stored in JSON files:
- **Resources:** `data/apple-approvals/resources/[id].json`
- **Comments:** `data/apple-approvals/comments/[id].json`
- **History:** `data/apple-approvals/history/[id].json`

## Workflow Diagram

```
┌─────────┐
│  DRAFT  │
└────┬────┘
     │ Submit for Review
     ↓
┌──────────────┐
│  IN REVIEW   │
└──────┬───────┘
       │
       ├─→ Approve ────→ ┌──────────┐
       │                 │ APPROVED │
       │                 └──────────┘
       │
       ├─→ Reject ─────→ ┌──────────┐
       │                 │ REJECTED │
       │                 └──────────┘
       │
       └─→ Request ────→ ┌───────────────────┐
           Changes       │ CHANGES REQUESTED │
                        └───────────────────┘
                               │
                               ↓
                        (Revert to Draft)
```

## Integration Points

### With Screenshot Editor (APP-025)
- Created screenshots can be submitted for approval
- Editors see approval status in the editor UI

### With Custom Product Page Creator (APP-010)
- CPPs require approval before publishing
- Approval status visible in CPP list

### With PPO Test System (APP-014, APP-015, APP-016)
- PPO treatments go through approval
- Winning treatments require approval to apply

### With Localization System (APP-019, APP-020)
- Localized metadata requires approval per locale
- Translation suggestions can trigger re-approval

## Role-Based Permissions

| Action | Owner | Admin | Editor | Viewer |
|--------|-------|-------|--------|--------|
| Create Resource | ✅ | ✅ | ✅ | ❌ |
| Submit for Review | ✅ | ✅ | ✅ | ❌ |
| Approve | ✅ | ✅ | ❌ | ❌ |
| Reject | ✅ | ✅ | ❌ | ❌ |
| Request Changes | ✅ | ✅ | ❌ | ❌ |
| Revert to Draft | ✅ | ✅ | Creator Only | ❌ |
| Add Comment | ✅ | ✅ | ✅ | ✅ |
| View | ✅ | ✅ | ✅ | ✅ |

## Future Enhancements

1. **Email Notifications**
   - Notify approvers when items are submitted
   - Notify creators when items are approved/rejected
   - Daily digest for pending approvals

2. **Slack Integration**
   - Post approval requests to Slack channel
   - Approve/reject from Slack

3. **Bulk Actions**
   - Approve multiple items at once
   - Bulk status updates

4. **Approval Templates**
   - Pre-defined approval workflows per asset type
   - Custom approval chains

5. **Advanced Analytics**
   - Time-to-approval trends
   - Bottleneck identification
   - Approver performance metrics

## Related Features

- **ADS-016:** Base approval workflow system
- **APP-010:** Custom Product Page Creator
- **APP-025:** Screenshot Editor UI
- **ADS-014:** Workspace Auth (role management)

## Files Created

### Types
- `src/types/appleApproval.ts`

### Services
- `src/services/appleApprovalService.ts`

### UI
- `src/app/review/page.tsx`
- `src/app/review/review.module.css`
- `src/app/review/components/ReviewItemCard.tsx`
- `src/app/review/components/ReviewItemCard.module.css`
- `src/app/review/components/ReviewFilters.tsx`
- `src/app/review/components/ReviewFilters.module.css`
- `src/app/review/components/AppleApprovalStats.tsx`
- `src/app/review/components/AppleApprovalStats.module.css`

### API
- `src/app/api/review/apple/route.ts`
- `src/app/api/review/apple/[id]/route.ts`
- `src/app/api/review/apple/[id]/action/route.ts`

### Testing & Docs
- `scripts/test-apple-approval-workflow.ts`
- `docs/APP-021-MULTI-USER-APPROVAL-WORKFLOW.md`

## Status

✅ Feature Complete
- Type definitions
- Service implementation
- UI components
- API routes
- Test script
- Documentation
