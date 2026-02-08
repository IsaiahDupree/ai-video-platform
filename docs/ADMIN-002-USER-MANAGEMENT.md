# ADMIN-002: User Management and Plan Assignment

**Status:** ✅ Complete
**Priority:** P2
**Category:** Admin

## Overview

Admin CRUD operations for user management, plan upgrades/downgrades, and quota overrides.

## Features

### User Management

- View all users with subscription status
- Search and filter users
- Edit user profile information
- Suspend/unsuspend accounts
- Manual user creation for special cases

### Plan Management

- View user's current plan
- Upgrade/downgrade plans
- Manual plan assignment (for special deals)
- Pro-rata billing calculation

### Quota Management

- Override monthly quota
- Grant extra API key allocations
- Reset usage counters
- View usage details

### Admin Actions

- Impersonate users for debugging
- Reset API keys
- View activity logs
- Send system messages to users

## Implementation

Page: `src/app/admin/users/page.tsx`
Service: `src/services/adminUserManagement.ts`

✅ Complete
