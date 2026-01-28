/**
 * Test Script for ADS-016: Approval Workflow
 * Tests the approval workflow system
 */

import { approvalService } from '../src/services/approvalService';
import {
  ApprovalStatus,
  ApprovableResourceType,
  ApprovalAction,
} from '../src/types/approval';
import { WorkspaceRole } from '../src/types/workspace';

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, testName: string, message?: string): void {
  results.push({
    name: testName,
    passed: condition,
    message,
  });
}

async function runTests() {
  console.log('🧪 Testing Approval Workflow System...\n');

  try {
    // Test 1: Create an approvable resource
    console.log('Test 1: Creating approvable resource...');
    const resource = await approvalService.createResource({
      workspaceId: 'test-workspace',
      resourceType: ApprovableResourceType.AD,
      name: 'Test Ad Campaign',
      description: 'Test description',
      createdBy: 'user-1',
      createdByName: 'Test User',
      createdByEmail: 'test@example.com',
      tags: ['test', 'campaign'],
    });

    assert(!!resource, 'Create resource', 'Resource should be created');
    assert(
      resource.approvalStatus === ApprovalStatus.DRAFT,
      'Initial status is DRAFT',
      `Expected DRAFT, got ${resource.approvalStatus}`
    );
    console.log(`✓ Created resource: ${resource.id}\n`);

    // Test 2: Submit for review
    console.log('Test 2: Submitting for review...');
    const submitResult = await approvalService.performAction({
      resourceId: resource.id,
      resourceType: ApprovableResourceType.AD,
      action: ApprovalAction.SUBMIT_FOR_REVIEW,
      userId: 'user-1',
      userRole: WorkspaceRole.EDITOR,
    });

    assert(submitResult.success, 'Submit for review', submitResult.error);
    assert(
      submitResult.newStatus === ApprovalStatus.IN_REVIEW,
      'Status after submit',
      `Expected IN_REVIEW, got ${submitResult.newStatus}`
    );
    console.log(`✓ Status changed to: ${submitResult.newStatus}\n`);

    // Test 3: Add a comment
    console.log('Test 3: Adding comment...');
    const comment = await approvalService.addComment({
      resourceId: resource.id,
      resourceType: ApprovableResourceType.AD,
      authorId: 'admin-1',
      authorName: 'Admin User',
      authorEmail: 'admin@example.com',
      authorRole: WorkspaceRole.ADMIN,
      content: 'Looks good, but please adjust the headline.',
    });

    assert(!!comment, 'Add comment', 'Comment should be created');
    assert(!!comment.id, 'Comment has ID');
    console.log(`✓ Comment added: ${comment.id}\n`);

    // Test 4: Request changes
    console.log('Test 4: Requesting changes...');
    const changesResult = await approvalService.performAction({
      resourceId: resource.id,
      resourceType: ApprovableResourceType.AD,
      action: ApprovalAction.REQUEST_CHANGES,
      userId: 'admin-1',
      userRole: WorkspaceRole.ADMIN,
      comment: 'Please update the headline copy.',
    });

    assert(changesResult.success, 'Request changes', changesResult.error);
    assert(
      changesResult.newStatus === ApprovalStatus.CHANGES_REQUESTED,
      'Status after request changes',
      `Expected CHANGES_REQUESTED, got ${changesResult.newStatus}`
    );
    console.log(`✓ Status changed to: ${changesResult.newStatus}\n`);

    // Test 5: Revert to draft
    console.log('Test 5: Reverting to draft...');
    const revertResult = await approvalService.performAction({
      resourceId: resource.id,
      resourceType: ApprovableResourceType.AD,
      action: ApprovalAction.REVERT_TO_DRAFT,
      userId: 'user-1',
      userRole: WorkspaceRole.EDITOR,
    });

    assert(revertResult.success, 'Revert to draft', revertResult.error);
    assert(
      revertResult.newStatus === ApprovalStatus.DRAFT,
      'Status after revert',
      `Expected DRAFT, got ${revertResult.newStatus}`
    );
    console.log(`✓ Status changed to: ${revertResult.newStatus}\n`);

    // Test 6: Submit and approve
    console.log('Test 6: Submit and approve...');
    const submitResult2 = await approvalService.performAction({
      resourceId: resource.id,
      resourceType: ApprovableResourceType.AD,
      action: ApprovalAction.SUBMIT_FOR_REVIEW,
      userId: 'user-1',
      userRole: WorkspaceRole.EDITOR,
    });

    const approveResult = await approvalService.performAction({
      resourceId: resource.id,
      resourceType: ApprovableResourceType.AD,
      action: ApprovalAction.APPROVE,
      userId: 'admin-1',
      userRole: WorkspaceRole.ADMIN,
    });

    assert(approveResult.success, 'Approve', approveResult.error);
    assert(
      approveResult.newStatus === ApprovalStatus.APPROVED,
      'Status after approve',
      `Expected APPROVED, got ${approveResult.newStatus}`
    );
    console.log(`✓ Status changed to: ${approveResult.newStatus}\n`);

    // Test 7: Get resource and verify history
    console.log('Test 7: Verifying approval history...');
    const updatedResource = await approvalService.getResource(resource.id);
    assert(
      !!updatedResource,
      'Get resource',
      'Resource should be retrievable'
    );
    assert(
      updatedResource!.approvalHistory.length > 0,
      'Approval history exists',
      `Expected history, got ${updatedResource!.approvalHistory.length} entries`
    );
    console.log(
      `✓ Approval history has ${updatedResource!.approvalHistory.length} entries\n`
    );

    // Test 8: Get comments
    console.log('Test 8: Retrieving comments...');
    const comments = await approvalService.getComments(resource.id);
    assert(
      comments.length > 0,
      'Get comments',
      `Expected comments, got ${comments.length}`
    );
    console.log(`✓ Found ${comments.length} comments\n`);

    // Test 9: Query resources
    console.log('Test 9: Querying resources...');
    const resources = await approvalService.queryResources({
      workspaceId: 'test-workspace',
      status: [ApprovalStatus.APPROVED],
    });

    assert(
      resources.length > 0,
      'Query resources',
      `Expected resources, got ${resources.length}`
    );
    console.log(`✓ Found ${resources.length} approved resources\n`);

    // Test 10: Get statistics
    console.log('Test 10: Getting statistics...');
    const stats = await approvalService.getStatistics('test-workspace');
    assert(
      stats.totalApproved > 0,
      'Get statistics',
      `Expected approved count > 0, got ${stats.totalApproved}`
    );
    console.log(`✓ Statistics retrieved:`);
    console.log(`  - Total Draft: ${stats.totalDraft}`);
    console.log(`  - Total In Review: ${stats.totalInReview}`);
    console.log(`  - Total Approved: ${stats.totalApproved}`);
    console.log(`  - Approval Rate: ${stats.approvalRate.toFixed(1)}%\n`);

    // Test 11: Invalid transition (should fail)
    console.log('Test 11: Testing invalid transition...');
    const invalidResult = await approvalService.performAction({
      resourceId: resource.id,
      resourceType: ApprovableResourceType.AD,
      action: ApprovalAction.SUBMIT_FOR_REVIEW,
      userId: 'user-1',
      userRole: WorkspaceRole.EDITOR,
    });

    assert(
      !invalidResult.success,
      'Invalid transition fails',
      'Should not allow submitting an approved item'
    );
    console.log(`✓ Invalid transition correctly rejected\n`);

    // Print summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('Test Summary:');
    console.log('═══════════════════════════════════════════════════════\n');

    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    const total = results.length;

    results.forEach((result) => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.name}`);
      if (!result.passed && result.message) {
        console.log(`   ${result.message}`);
      }
    });

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
    console.log('═══════════════════════════════════════════════════════\n');

    if (failed === 0) {
      console.log('🎉 All tests passed!\n');
    } else {
      console.log(`⚠️  ${failed} test(s) failed.\n`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run tests
runTests();
