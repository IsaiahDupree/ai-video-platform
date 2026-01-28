# ADS-014: Workspace Auth

**Status:** ✅ Implemented
**Priority:** P0
**Effort:** 8pts

## Overview

Role-based access control (RBAC) system for workspaces with four roles: Owner, Admin, Editor, and Viewer. Provides comprehensive authentication, authorization, and permission management for the AI Video Platform.

## Features

### Core Components

1. **Workspace Management**
   - Create and manage workspaces
   - Multi-member support
   - Owner, Admin, Editor, and Viewer roles
   - Workspace settings and configuration

2. **Authentication Service**
   - User authentication
   - Session management
   - Member management
   - Permission checking

3. **Authorization Middleware**
   - Next.js API route protection
   - Role-based access control
   - Resource-level permissions
   - Action-level permissions

4. **Invitation System**
   - Email invitations
   - Token-based acceptance
   - Expiration management
   - Invitation revocation

## Role Permissions

### Owner
- **Full control** over workspace
- Can manage all resources
- Can invite/remove members
- Can transfer ownership
- Can delete workspace

### Admin
- Can manage brand kits, templates, campaigns
- Can invite members (except Owners)
- Can update workspace settings
- Cannot delete workspace

### Editor
- Can create and edit content
- Can render and export assets
- Can view members
- Cannot manage brand kits or settings

### Viewer
- Read-only access
- Can view all resources
- Cannot create or modify anything

## Resource & Action Types

### Resources
- `workspace` - Workspace configuration
- `brand_kit` - Brand kit management
- `ad_template` - Ad template management
- `campaign` - Campaign management
- `render` - Render operations
- `member` - Member management
- `settings` - Workspace settings

### Actions
- `create` - Create new resources
- `read` - View resources
- `update` - Modify existing resources
- `delete` - Remove resources
- `manage` - Full control (all actions)
- `render` - Render operations
- `export` - Export operations
- `invite` - Invite members

## Architecture

### Type Definitions
```typescript
// src/types/workspace.ts
- Workspace
- WorkspaceMember
- WorkspaceRole (enum)
- WorkspaceInvitation
- Permission
- ResourceType (enum)
- ActionType (enum)
```

### Services
```typescript
// src/services/auth.ts
- WorkspaceAuthManager
  - createWorkspace()
  - addMember()
  - removeMember()
  - updateMemberRole()
  - checkPermission()
  - createInvitation()
  - acceptInvitation()
  - transferOwnership()
```

### Middleware
```typescript
// src/middleware/authMiddleware.ts
- requireAuth()
- requireWorkspaceAccess()
- requirePermission()
- requireRole()
- requireWorkspaceOwner()
- withAuth() // Helper wrapper
- withPermission() // Helper wrapper
```

## Usage Examples

### Creating a Workspace
```typescript
import { workspaceAuthManager } from '@/services/auth';

const workspace = await workspaceAuthManager.createWorkspace(
  'Acme Corp',
  'user-123',
  'admin@acme.com'
);
```

### Adding a Member
```typescript
await workspaceAuthManager.addMember(workspace.id, {
  userId: 'user-456',
  email: 'editor@acme.com',
  role: WorkspaceRole.EDITOR,
  invitedBy: 'user-123',
  acceptedAt: new Date().toISOString(),
});
```

### Checking Permissions
```typescript
const result = await workspaceAuthManager.checkPermission(
  'user-456',
  workspace.id,
  ResourceType.AD_TEMPLATE,
  ActionType.CREATE
);

if (result.allowed) {
  // Proceed with action
}
```

### Protecting API Routes
```typescript
// app/api/workspaces/[workspaceId]/templates/route.ts
import { withPermission } from '@/middleware/authMiddleware';
import { ResourceType, ActionType } from '@/types/workspace';

export async function POST(request: NextRequest) {
  const workspaceId = getWorkspaceIdFromUrl(request);

  return withPermission(
    request,
    workspaceId!,
    ResourceType.AD_TEMPLATE,
    ActionType.CREATE,
    async (req, session) => {
      // Create template
      return NextResponse.json({ success: true });
    }
  );
}
```

### Inviting Users
```typescript
const invitation = await workspaceAuthManager.createInvitation(
  workspace.id,
  'newuser@acme.com',
  WorkspaceRole.EDITOR,
  'user-123',
  7 // expires in 7 days
);

console.log(`Invite link: https://app.com/invite/${invitation.token}`);
```

### Accepting Invitations
```typescript
const workspace = await workspaceAuthManager.acceptInvitation(
  invitationToken,
  'user-789',
  'John Doe'
);
```

## CLI Management

### Commands
```bash
# Create workspace
ts-node scripts/manage-workspaces.ts create "Acme Corp" user-123 admin@acme.com

# List workspaces
ts-node scripts/manage-workspaces.ts list

# Show workspace details
ts-node scripts/manage-workspaces.ts show workspace-123

# Add member
ts-node scripts/manage-workspaces.ts add-member workspace-123 user-456 editor@acme.com editor user-123

# Update role
ts-node scripts/manage-workspaces.ts update-role workspace-123 user-456 admin

# Remove member
ts-node scripts/manage-workspaces.ts remove-member workspace-123 user-456

# Invite user
ts-node scripts/manage-workspaces.ts invite workspace-123 newuser@acme.com editor user-123

# List invitations
ts-node scripts/manage-workspaces.ts list-invitations workspace-123

# Check permission
ts-node scripts/manage-workspaces.ts check-permission user-456 workspace-123 ad_template create

# Show statistics
ts-node scripts/manage-workspaces.ts stats workspace-123

# Transfer ownership
ts-node scripts/manage-workspaces.ts transfer-ownership workspace-123 user-456

# Delete workspace
ts-node scripts/manage-workspaces.ts delete workspace-123
```

## Testing

Run comprehensive tests:
```bash
ts-node scripts/test-workspace-auth.ts
```

Tests cover:
- ✅ Workspace creation and management
- ✅ Member addition and removal
- ✅ Role updates
- ✅ Permission checking
- ✅ Invitation creation and acceptance
- ✅ Ownership transfer
- ✅ Error handling

## Data Storage

### File Structure
```
data/
├── workspaces/
│   ├── workspace-123.json
│   └── workspace-456.json
└── invitations/
    ├── invite-123.json
    └── invite-456.json
```

### Workspace JSON Schema
```json
{
  "id": "workspace-123",
  "name": "Acme Corp",
  "ownerId": "user-123",
  "members": [
    {
      "userId": "user-123",
      "email": "admin@acme.com",
      "role": "owner",
      "invitedAt": "2026-01-28T...",
      "acceptedAt": "2026-01-28T...",
      "invitedBy": "user-123"
    }
  ],
  "settings": {
    "renderQuality": "standard",
    "maxConcurrentRenders": 5
  },
  "isActive": true,
  "createdAt": "2026-01-28T...",
  "updatedAt": "2026-01-28T..."
}
```

## Integration Points

### Brand Kit System (ADS-003)
- Brand kits are workspace-scoped via `workspaceId`
- Only members with appropriate permissions can manage brand kits

### Ad Editor (ADS-004)
- Editors can create and modify ad templates
- Viewers have read-only access

### Render Queue (ADS-009)
- Editors and above can initiate renders
- Render history is workspace-scoped

### Future Integration
- Will integrate with campaign system (ADS-011)
- Will integrate with approval workflows (ADS-016)
- Will integrate with analytics (APP-024)

## Security Considerations

1. **Authentication**
   - Currently uses mock authentication
   - **TODO:** Integrate with real auth provider (NextAuth, Clerk, Supabase)

2. **Token Security**
   - Invitation tokens use crypto.randomBytes(32)
   - Tokens expire after 7 days (configurable)
   - Revoked tokens cannot be reused

3. **Permission Validation**
   - All API routes should use middleware
   - Server-side validation required
   - Client-side checks for UX only

4. **Data Isolation**
   - Workspaces are fully isolated
   - Members can only access their workspaces
   - No cross-workspace data leakage

## Migration Guide

### Adding Auth to Existing Features

1. **Update Brand Kit Queries**
```typescript
// Before
const brandKits = await brandKitManager.listBrandKits();

// After
const brandKits = await brandKitManager.listBrandKits({
  workspaceId: userWorkspaceId
});
```

2. **Protect API Routes**
```typescript
// Before
export async function POST(request: NextRequest) {
  // Handle request
}

// After
export async function POST(request: NextRequest) {
  return withPermission(
    request,
    workspaceId,
    ResourceType.BRAND_KIT,
    ActionType.CREATE,
    async (req, session) => {
      // Handle request
    }
  );
}
```

## Performance Considerations

- File-based storage suitable for small-medium scale
- For production, consider migrating to database
- Cache workspace membership for frequently accessed data
- Implement rate limiting on invitation creation

## Future Enhancements

1. **Database Migration**
   - Move from file-based to PostgreSQL/Supabase
   - Add indexes on workspaceId, userId
   - Implement connection pooling

2. **Team Features**
   - Team-level permissions
   - Sub-workspaces
   - Shared resources across workspaces

3. **Audit Logging**
   - Track all permission changes
   - Log member additions/removals
   - Compliance reporting

4. **SSO Integration**
   - SAML 2.0 support
   - OAuth providers
   - Enterprise SSO

## Related Features

- **ADS-003:** Brand Kit System (uses workspaceId)
- **ADS-004:** Ad Editor UI (uses permissions)
- **ADS-015:** AI Variant Generator (role-based access)
- **ADS-016:** Approval Workflow (depends on roles)

## Files Created

- `src/types/workspace.ts` - Type definitions
- `src/services/auth.ts` - Auth service implementation
- `src/middleware/authMiddleware.ts` - API middleware
- `scripts/manage-workspaces.ts` - CLI management tool
- `scripts/test-workspace-auth.ts` - Test suite
- `docs/ADS-014-WORKSPACE-AUTH.md` - This documentation

---

**Implementation Date:** January 28, 2026
**Last Updated:** January 28, 2026
