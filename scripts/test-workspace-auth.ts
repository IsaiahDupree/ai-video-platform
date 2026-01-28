#!/usr/bin/env ts-node
/**
 * Workspace Auth Test Script - ADS-014
 * Comprehensive tests for workspace authentication and authorization
 */

import { workspaceAuthManager } from '../src/services/auth.js';
import { WorkspaceRole, ResourceType, ActionType } from '../src/types/workspace.js';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => Promise<void>) {
  return async () => {
    try {
      await fn();
      results.push({ name, passed: true });
      console.log(`✅ ${name}`);
    } catch (error: any) {
      results.push({ name, passed: false, error: error.message });
      console.error(`❌ ${name}: ${error.message}`);
    }
  };
}

async function runTests() {
  console.log('🧪 Testing Workspace Auth System - ADS-014\n');
  console.log('=' .repeat(60));

  // Test 1: Create Workspace
  await test('Create workspace', async () => {
    const workspace = await workspaceAuthManager.createWorkspace(
      'Test Workspace',
      'user-owner',
      'owner@test.com'
    );

    if (!workspace.id) throw new Error('Workspace ID not generated');
    if (workspace.name !== 'Test Workspace') throw new Error('Workspace name mismatch');
    if (workspace.ownerId !== 'user-owner') throw new Error('Owner ID mismatch');
    if (workspace.members.length !== 1) throw new Error('Owner not added as member');
  })();

  // Test 2: Get Workspace
  await test('Get workspace', async () => {
    const workspaces = await workspaceAuthManager.listWorkspaces();
    const workspace = workspaces[0];

    const retrieved = await workspaceAuthManager.getWorkspace(workspace.id);
    if (!retrieved) throw new Error('Workspace not found');
    if (retrieved.id !== workspace.id) throw new Error('Workspace ID mismatch');
  })();

  // Test 3: Add Member
  await test('Add member', async () => {
    const workspaces = await workspaceAuthManager.listWorkspaces();
    const workspace = workspaces[0];

    const updated = await workspaceAuthManager.addMember(workspace.id, {
      userId: 'user-editor',
      email: 'editor@test.com',
      role: WorkspaceRole.EDITOR,
      invitedBy: workspace.ownerId,
      acceptedAt: new Date().toISOString(),
    });

    if (updated.members.length !== 2) throw new Error('Member not added');
  })();

  // Test 4: Get Member
  await test('Get member', async () => {
    const workspaces = await workspaceAuthManager.listWorkspaces();
    const workspace = workspaces[0];

    const member = await workspaceAuthManager.getMember(workspace.id, 'user-editor');
    if (!member) throw new Error('Member not found');
    if (member.role !== WorkspaceRole.EDITOR) throw new Error('Member role mismatch');
  })();

  // Test 5: Update Member Role
  await test('Update member role', async () => {
    const workspaces = await workspaceAuthManager.listWorkspaces();
    const workspace = workspaces[0];

    await workspaceAuthManager.updateMemberRole(
      workspace.id,
      'user-editor',
      WorkspaceRole.ADMIN
    );

    const member = await workspaceAuthManager.getMember(workspace.id, 'user-editor');
    if (!member) throw new Error('Member not found');
    if (member.role !== WorkspaceRole.ADMIN) throw new Error('Role not updated');
  })();

  // Test 6: Check Permission - Owner
  await test('Check permission (owner)', async () => {
    const workspaces = await workspaceAuthManager.listWorkspaces();
    const workspace = workspaces[0];

    const result = await workspaceAuthManager.checkPermission(
      workspace.ownerId,
      workspace.id,
      ResourceType.WORKSPACE,
      ActionType.DELETE
    );

    if (!result.allowed) throw new Error('Owner should have delete permission');
  })();

  // Test 7: Check Permission - Admin
  await test('Check permission (admin)', async () => {
    const workspaces = await workspaceAuthManager.listWorkspaces();
    const workspace = workspaces[0];

    const result = await workspaceAuthManager.checkPermission(
      'user-editor',
      workspace.id,
      ResourceType.AD_TEMPLATE,
      ActionType.CREATE
    );

    if (!result.allowed) throw new Error('Admin should have create ad_template permission');
  })();

  // Test 8: Check Permission Denied
  await test('Check permission denied (viewer)', async () => {
    const workspaces = await workspaceAuthManager.listWorkspaces();
    const workspace = workspaces[0];

    // Add a viewer
    await workspaceAuthManager.addMember(workspace.id, {
      userId: 'user-viewer',
      email: 'viewer@test.com',
      role: WorkspaceRole.VIEWER,
      invitedBy: workspace.ownerId,
      acceptedAt: new Date().toISOString(),
    });

    const result = await workspaceAuthManager.checkPermission(
      'user-viewer',
      workspace.id,
      ResourceType.AD_TEMPLATE,
      ActionType.CREATE
    );

    if (result.allowed) throw new Error('Viewer should not have create permission');
  })();

  // Test 9: Create Invitation
  await test('Create invitation', async () => {
    const workspaces = await workspaceAuthManager.listWorkspaces();
    const workspace = workspaces[0];

    const invitation = await workspaceAuthManager.createInvitation(
      workspace.id,
      'newuser@test.com',
      WorkspaceRole.EDITOR,
      workspace.ownerId
    );

    if (!invitation.id) throw new Error('Invitation ID not generated');
    if (!invitation.token) throw new Error('Invitation token not generated');
    if (invitation.status !== 'pending') throw new Error('Invitation status should be pending');
  })();

  // Test 10: List Invitations
  await test('List invitations', async () => {
    const workspaces = await workspaceAuthManager.listWorkspaces();
    const workspace = workspaces[0];

    const invitations = await workspaceAuthManager.listInvitations(workspace.id);
    if (invitations.length === 0) throw new Error('No invitations found');
  })();

  // Test 11: Get Invitation by Token
  await test('Get invitation by token', async () => {
    const workspaces = await workspaceAuthManager.listWorkspaces();
    const workspace = workspaces[0];

    const invitations = await workspaceAuthManager.listInvitations(workspace.id);
    const token = invitations[0].token;

    const invitation = await workspaceAuthManager.getInvitationByToken(token);
    if (!invitation) throw new Error('Invitation not found by token');
    if (invitation.token !== token) throw new Error('Token mismatch');
  })();

  // Test 12: Accept Invitation
  await test('Accept invitation', async () => {
    const workspaces = await workspaceAuthManager.listWorkspaces();
    const workspace = workspaces[0];

    const invitations = await workspaceAuthManager.listInvitations(workspace.id);
    const token = invitations[0].token;

    const updated = await workspaceAuthManager.acceptInvitation(token, 'user-new', 'New User');

    const member = await workspaceAuthManager.getMember(workspace.id, 'user-new');
    if (!member) throw new Error('Member not added after accepting invitation');
  })();

  // Test 13: Is Workspace Owner
  await test('Check is workspace owner', async () => {
    const workspaces = await workspaceAuthManager.listWorkspaces();
    const workspace = workspaces[0];

    const isOwner = await workspaceAuthManager.isWorkspaceOwner(workspace.ownerId, workspace.id);
    if (!isOwner) throw new Error('Owner check failed');

    const isNotOwner = await workspaceAuthManager.isWorkspaceOwner('user-editor', workspace.id);
    if (isNotOwner) throw new Error('Non-owner should not be owner');
  })();

  // Test 14: Has Role or Higher
  await test('Check has role or higher', async () => {
    const workspaces = await workspaceAuthManager.listWorkspaces();
    const workspace = workspaces[0];

    const hasRole = await workspaceAuthManager.hasRoleOrHigher(
      'user-editor',
      workspace.id,
      WorkspaceRole.EDITOR
    );
    if (!hasRole) throw new Error('Admin should have editor role or higher');
  })();

  // Test 15: Get User Context
  await test('Get user context', async () => {
    const context = await workspaceAuthManager.getUserContext(
      'user-owner',
      'owner@test.com',
      'Owner User'
    );

    if (!context.userId) throw new Error('User ID missing');
    if (context.workspaces.length === 0) throw new Error('No workspaces in context');
  })();

  // Test 16: Get Workspace Stats
  await test('Get workspace stats', async () => {
    const workspaces = await workspaceAuthManager.listWorkspaces();
    const workspace = workspaces[0];

    const stats = await workspaceAuthManager.getWorkspaceStats(workspace.id);

    if (stats.totalMembers < 1) throw new Error('Invalid total members');
    if (!stats.roleDistribution) throw new Error('Role distribution missing');
  })();

  // Test 17: Remove Member
  await test('Remove member', async () => {
    const workspaces = await workspaceAuthManager.listWorkspaces();
    const workspace = workspaces[0];

    const beforeCount = workspace.members.length;
    await workspaceAuthManager.removeMember(workspace.id, 'user-viewer');

    const updated = await workspaceAuthManager.getWorkspace(workspace.id);
    if (!updated) throw new Error('Workspace not found');
    if (updated.members.length !== beforeCount - 1) throw new Error('Member not removed');
  })();

  // Test 18: Cannot Remove Owner
  await test('Cannot remove owner', async () => {
    const workspaces = await workspaceAuthManager.listWorkspaces();
    const workspace = workspaces[0];

    try {
      await workspaceAuthManager.removeMember(workspace.id, workspace.ownerId);
      throw new Error('Should not be able to remove owner');
    } catch (error: any) {
      if (!error.message.includes('Cannot remove the workspace owner')) {
        throw error;
      }
    }
  })();

  // Test 19: Transfer Ownership
  await test('Transfer ownership', async () => {
    const workspaces = await workspaceAuthManager.listWorkspaces();
    const workspace = workspaces[0];

    const updated = await workspaceAuthManager.transferOwnership(workspace.id, 'user-editor');

    if (updated.ownerId !== 'user-editor') throw new Error('Ownership not transferred');

    const newOwner = await workspaceAuthManager.getMember(workspace.id, 'user-editor');
    if (!newOwner || newOwner.role !== WorkspaceRole.OWNER) {
      throw new Error('New owner role not updated');
    }
  })();

  // Test 20: Delete Workspace
  await test('Delete workspace', async () => {
    const workspaces = await workspaceAuthManager.listWorkspaces();
    const workspace = workspaces[0];

    const deleted = await workspaceAuthManager.deleteWorkspace(workspace.id);
    if (!deleted) throw new Error('Workspace not deleted');

    const retrieved = await workspaceAuthManager.getWorkspace(workspace.id);
    if (retrieved) throw new Error('Workspace still exists after deletion');
  })();

  // Print Results
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Results\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`Total: ${total}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\nFailed Tests:');
    results
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`  ❌ ${r.name}: ${r.error}`);
      });
  }

  console.log('\n' + '='.repeat(60));

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
