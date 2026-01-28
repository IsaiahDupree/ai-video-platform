#!/usr/bin/env ts-node
/**
 * Workspace Management CLI - ADS-014
 * Command-line utility for managing workspaces, members, and permissions
 */

import { workspaceAuthManager } from '../src/services/auth.js';
import { WorkspaceRole, ResourceType, ActionType } from '../src/types/workspace.js';

async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  switch (command) {
    case 'create':
      await createWorkspace(args);
      break;
    case 'list':
      await listWorkspaces();
      break;
    case 'show':
      await showWorkspace(args);
      break;
    case 'delete':
      await deleteWorkspace(args);
      break;
    case 'add-member':
      await addMember(args);
      break;
    case 'remove-member':
      await removeMember(args);
      break;
    case 'update-role':
      await updateRole(args);
      break;
    case 'invite':
      await inviteUser(args);
      break;
    case 'list-invitations':
      await listInvitations(args);
      break;
    case 'check-permission':
      await checkPermission(args);
      break;
    case 'stats':
      await showStats(args);
      break;
    case 'transfer-ownership':
      await transferOwnership(args);
      break;
    default:
      printUsage();
      process.exit(1);
  }
}

async function createWorkspace(args: string[]) {
  if (args.length < 3) {
    console.error('Usage: manage-workspaces create <name> <ownerId> <ownerEmail>');
    process.exit(1);
  }

  const [name, ownerId, ownerEmail] = args;
  const workspace = await workspaceAuthManager.createWorkspace(name, ownerId, ownerEmail);

  console.log('✅ Workspace created successfully!');
  console.log(JSON.stringify(workspace, null, 2));
}

async function listWorkspaces() {
  const workspaces = await workspaceAuthManager.listWorkspaces();

  console.log(`Found ${workspaces.length} workspace(s):\n`);

  for (const workspace of workspaces) {
    console.log(`📁 ${workspace.name} (${workspace.id})`);
    console.log(`   Owner: ${workspace.ownerId}`);
    console.log(`   Members: ${workspace.members.length}`);
    console.log(`   Active: ${workspace.isActive ? '✅' : '❌'}`);
    console.log(`   Created: ${new Date(workspace.createdAt).toLocaleString()}\n`);
  }
}

async function showWorkspace(args: string[]) {
  if (args.length < 1) {
    console.error('Usage: manage-workspaces show <workspaceId>');
    process.exit(1);
  }

  const [workspaceId] = args;
  const workspace = await workspaceAuthManager.getWorkspace(workspaceId);

  if (!workspace) {
    console.error(`Workspace not found: ${workspaceId}`);
    process.exit(1);
  }

  console.log('Workspace Details:');
  console.log(JSON.stringify(workspace, null, 2));
}

async function deleteWorkspace(args: string[]) {
  if (args.length < 1) {
    console.error('Usage: manage-workspaces delete <workspaceId>');
    process.exit(1);
  }

  const [workspaceId] = args;
  const deleted = await workspaceAuthManager.deleteWorkspace(workspaceId);

  if (deleted) {
    console.log(`✅ Workspace ${workspaceId} deleted successfully!`);
  } else {
    console.error(`Workspace not found: ${workspaceId}`);
    process.exit(1);
  }
}

async function addMember(args: string[]) {
  if (args.length < 5) {
    console.error(
      'Usage: manage-workspaces add-member <workspaceId> <userId> <email> <role> <invitedBy>'
    );
    console.error('Roles: owner, admin, editor, viewer');
    process.exit(1);
  }

  const [workspaceId, userId, email, role, invitedBy] = args;

  if (!Object.values(WorkspaceRole).includes(role as WorkspaceRole)) {
    console.error(`Invalid role: ${role}`);
    console.error('Valid roles: owner, admin, editor, viewer');
    process.exit(1);
  }

  const workspace = await workspaceAuthManager.addMember(workspaceId, {
    userId,
    email,
    role: role as WorkspaceRole,
    invitedBy,
    acceptedAt: new Date().toISOString(),
  });

  console.log(`✅ Member ${email} added to workspace!`);
  console.log(`Role: ${role}`);
}

async function removeMember(args: string[]) {
  if (args.length < 2) {
    console.error('Usage: manage-workspaces remove-member <workspaceId> <userId>');
    process.exit(1);
  }

  const [workspaceId, userId] = args;
  const workspace = await workspaceAuthManager.removeMember(workspaceId, userId);

  console.log(`✅ Member ${userId} removed from workspace!`);
}

async function updateRole(args: string[]) {
  if (args.length < 3) {
    console.error('Usage: manage-workspaces update-role <workspaceId> <userId> <newRole>');
    console.error('Roles: owner, admin, editor, viewer');
    process.exit(1);
  }

  const [workspaceId, userId, newRole] = args;

  if (!Object.values(WorkspaceRole).includes(newRole as WorkspaceRole)) {
    console.error(`Invalid role: ${newRole}`);
    console.error('Valid roles: owner, admin, editor, viewer');
    process.exit(1);
  }

  const workspace = await workspaceAuthManager.updateMemberRole(
    workspaceId,
    userId,
    newRole as WorkspaceRole
  );

  console.log(`✅ Member ${userId} role updated to ${newRole}!`);
}

async function inviteUser(args: string[]) {
  if (args.length < 4) {
    console.error('Usage: manage-workspaces invite <workspaceId> <email> <role> <invitedBy>');
    console.error('Roles: admin, editor, viewer');
    process.exit(1);
  }

  const [workspaceId, email, role, invitedBy] = args;

  if (!Object.values(WorkspaceRole).includes(role as WorkspaceRole)) {
    console.error(`Invalid role: ${role}`);
    console.error('Valid roles: admin, editor, viewer');
    process.exit(1);
  }

  const invitation = await workspaceAuthManager.createInvitation(
    workspaceId,
    email,
    role as WorkspaceRole,
    invitedBy
  );

  console.log(`✅ Invitation created for ${email}!`);
  console.log(`Token: ${invitation.token}`);
  console.log(`Expires: ${new Date(invitation.expiresAt).toLocaleString()}`);
  console.log(`\nInvitation link: https://yourdomain.com/invite/${invitation.token}`);
}

async function listInvitations(args: string[]) {
  if (args.length < 1) {
    console.error('Usage: manage-workspaces list-invitations <workspaceId>');
    process.exit(1);
  }

  const [workspaceId] = args;
  const invitations = await workspaceAuthManager.listInvitations(workspaceId);

  console.log(`Found ${invitations.length} invitation(s):\n`);

  for (const invitation of invitations) {
    console.log(`📧 ${invitation.email} - ${invitation.role}`);
    console.log(`   Status: ${invitation.status}`);
    console.log(`   Invited: ${new Date(invitation.invitedAt).toLocaleString()}`);
    console.log(`   Expires: ${new Date(invitation.expiresAt).toLocaleString()}\n`);
  }
}

async function checkPermission(args: string[]) {
  if (args.length < 4) {
    console.error('Usage: manage-workspaces check-permission <userId> <workspaceId> <resource> <action>');
    console.error('Resources: workspace, brand_kit, ad_template, campaign, render, member, settings');
    console.error('Actions: create, read, update, delete, manage, render, export, invite');
    process.exit(1);
  }

  const [userId, workspaceId, resource, action] = args;

  if (!Object.values(ResourceType).includes(resource as ResourceType)) {
    console.error(`Invalid resource: ${resource}`);
    process.exit(1);
  }

  if (!Object.values(ActionType).includes(action as ActionType)) {
    console.error(`Invalid action: ${action}`);
    process.exit(1);
  }

  const result = await workspaceAuthManager.checkPermission(
    userId,
    workspaceId,
    resource as ResourceType,
    action as ActionType
  );

  if (result.allowed) {
    console.log(`✅ Permission granted!`);
    console.log(`User ${userId} can ${action} ${resource} in workspace ${workspaceId}`);
  } else {
    console.log(`❌ Permission denied!`);
    console.log(`Reason: ${result.reason}`);
    if (result.requiredRole) {
      console.log(`Required role: ${result.requiredRole}`);
    }
  }
}

async function showStats(args: string[]) {
  if (args.length < 1) {
    console.error('Usage: manage-workspaces stats <workspaceId>');
    process.exit(1);
  }

  const [workspaceId] = args;
  const stats = await workspaceAuthManager.getWorkspaceStats(workspaceId);

  console.log('Workspace Statistics:');
  console.log(`\nTotal Members: ${stats.totalMembers}`);
  console.log(`Active Members (30 days): ${stats.activeMembers}`);
  console.log(`Pending Invitations: ${stats.pendingInvitations}`);
  console.log(`\nRole Distribution:`);
  console.log(`  Owners: ${stats.roleDistribution.owner}`);
  console.log(`  Admins: ${stats.roleDistribution.admin}`);
  console.log(`  Editors: ${stats.roleDistribution.editor}`);
  console.log(`  Viewers: ${stats.roleDistribution.viewer}`);
}

async function transferOwnership(args: string[]) {
  if (args.length < 2) {
    console.error('Usage: manage-workspaces transfer-ownership <workspaceId> <newOwnerId>');
    process.exit(1);
  }

  const [workspaceId, newOwnerId] = args;
  const workspace = await workspaceAuthManager.transferOwnership(workspaceId, newOwnerId);

  console.log(`✅ Ownership transferred!`);
  console.log(`New owner: ${newOwnerId}`);
}

function printUsage() {
  console.log(`
Workspace Management CLI - ADS-014

Usage: ts-node scripts/manage-workspaces.ts <command> [args]

Commands:
  create <name> <ownerId> <ownerEmail>
    Create a new workspace

  list
    List all workspaces

  show <workspaceId>
    Show detailed workspace information

  delete <workspaceId>
    Delete a workspace

  add-member <workspaceId> <userId> <email> <role> <invitedBy>
    Add a member to a workspace
    Roles: owner, admin, editor, viewer

  remove-member <workspaceId> <userId>
    Remove a member from a workspace

  update-role <workspaceId> <userId> <newRole>
    Update a member's role
    Roles: owner, admin, editor, viewer

  invite <workspaceId> <email> <role> <invitedBy>
    Create an invitation for a user
    Roles: admin, editor, viewer

  list-invitations <workspaceId>
    List all invitations for a workspace

  check-permission <userId> <workspaceId> <resource> <action>
    Check if a user has permission to perform an action
    Resources: workspace, brand_kit, ad_template, campaign, render, member, settings
    Actions: create, read, update, delete, manage, render, export, invite

  stats <workspaceId>
    Show workspace statistics

  transfer-ownership <workspaceId> <newOwnerId>
    Transfer workspace ownership to another member

Examples:
  # Create workspace
  ts-node scripts/manage-workspaces.ts create "Acme Corp" user-123 admin@acme.com

  # List workspaces
  ts-node scripts/manage-workspaces.ts list

  # Add member
  ts-node scripts/manage-workspaces.ts add-member workspace-123 user-456 editor@acme.com editor user-123

  # Invite user
  ts-node scripts/manage-workspaces.ts invite workspace-123 newuser@acme.com editor user-123

  # Check permission
  ts-node scripts/manage-workspaces.ts check-permission user-456 workspace-123 ad_template create

  # Show stats
  ts-node scripts/manage-workspaces.ts stats workspace-123
`);
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
