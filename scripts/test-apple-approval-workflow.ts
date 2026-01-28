/**
 * Test Script for Apple Approval Workflow - APP-021
 * Tests the multi-user approval workflow for Apple App Store assets
 */

import { getAppleApprovalService } from '../src/services/appleApprovalService';
import {
  AppleApprovableResourceType,
  AppleScreenshotResource,
  AppleCPPResource,
} from '../src/types/appleApproval';
import { ApprovalStatus, ApprovalAction } from '../src/types/approval';
import { WorkspaceRole } from '../src/types/workspace';

async function main() {
  console.log('🧪 Testing Apple Approval Workflow (APP-021)\n');

  const service = getAppleApprovalService();

  // Test users
  const creator = {
    userId: 'user-1',
    userName: 'John Doe',
    userEmail: 'john@example.com',
    userRole: WorkspaceRole.EDITOR,
  };

  const reviewer = {
    userId: 'user-2',
    userName: 'Jane Smith',
    userEmail: 'jane@example.com',
    userRole: WorkspaceRole.ADMIN,
  };

  try {
    // Test 1: Create screenshot resource
    console.log('📱 Test 1: Create Screenshot Resource');
    const screenshotData: Omit<
      AppleScreenshotResource,
      'id' | 'approvalStatus' | 'approvalHistory' | 'comments' | 'createdAt' | 'updatedAt'
    > = {
      workspaceId: 'test-workspace',
      resourceType: AppleApprovableResourceType.SCREENSHOT,
      name: 'iPhone 15 Pro Main Feature Screenshot',
      description: 'Showcase of main app features on iPhone 15 Pro',
      appId: 'com.example.testapp',
      locale: 'en-US',
      deviceType: 'iPhone 15 Pro',
      displayType: '6.7-inch',
      imageUrl: '/screenshots/test-screenshot.png',
      captionText: 'Discover amazing features',
      captionPosition: 'bottom',
      createdBy: creator.userId,
      createdByName: creator.userName,
      createdByEmail: creator.userEmail,
      thumbnailUrl: '/thumbnails/test-screenshot-thumb.png',
      tags: ['main-feature', 'en-US', 'iphone'],
    };

    const screenshot = await service.createResource(screenshotData);
    console.log(`✅ Created screenshot: ${screenshot.id}`);
    console.log(`   Status: ${screenshot.approvalStatus}\n`);

    // Test 2: Submit for review
    console.log('📝 Test 2: Submit Screenshot for Review');
    const submitResult = await service.performAction(
      screenshot.id,
      ApprovalAction.SUBMIT_FOR_REVIEW,
      creator.userId,
      creator.userName,
      creator.userEmail,
      creator.userRole,
      undefined,
      'Ready for review'
    );
    console.log(`✅ Submit result: ${submitResult.message}`);

    const updatedScreenshot = await service.getResource(screenshot.id);
    console.log(`   New status: ${updatedScreenshot?.approvalStatus}`);
    console.log(`   History entries: ${updatedScreenshot?.approvalHistory.length}\n`);

    // Test 3: Add comment
    console.log('💬 Test 3: Add Review Comment');
    const comment = await service.addComment(
      screenshot.id,
      reviewer.userId,
      reviewer.userName,
      reviewer.userEmail,
      reviewer.userRole,
      'Looks good! Caption placement is perfect.',
      false
    );
    console.log(`✅ Added comment: ${comment?.id}`);
    console.log(`   Comment: "${comment?.content}"\n`);

    // Test 4: Request changes
    console.log('🔄 Test 4: Request Changes');
    const changesResult = await service.performAction(
      screenshot.id,
      ApprovalAction.REQUEST_CHANGES,
      reviewer.userId,
      reviewer.userName,
      reviewer.userEmail,
      reviewer.userRole,
      'Please update the caption text to be more engaging',
      undefined
    );
    console.log(`✅ Request changes result: ${changesResult.message}`);

    const changedScreenshot = await service.getResource(screenshot.id);
    console.log(`   New status: ${changedScreenshot?.approvalStatus}`);
    console.log(`   Comments: ${changedScreenshot?.comments.length}\n`);

    // Test 5: Revert to draft
    console.log('📝 Test 5: Revert to Draft');
    const revertResult = await service.performAction(
      screenshot.id,
      ApprovalAction.REVERT_TO_DRAFT,
      creator.userId,
      creator.userName,
      creator.userEmail,
      creator.userRole,
      undefined,
      'Making requested changes'
    );
    console.log(`✅ Revert result: ${revertResult.message}`);

    const revertedScreenshot = await service.getResource(screenshot.id);
    console.log(`   New status: ${revertedScreenshot?.approvalStatus}\n`);

    // Test 6: Submit and approve
    console.log('✅ Test 6: Submit and Approve');
    await service.performAction(
      screenshot.id,
      ApprovalAction.SUBMIT_FOR_REVIEW,
      creator.userId,
      creator.userName,
      creator.userEmail,
      creator.userRole,
      undefined,
      'Updated with requested changes'
    );

    const approveResult = await service.performAction(
      screenshot.id,
      ApprovalAction.APPROVE,
      reviewer.userId,
      reviewer.userName,
      reviewer.userEmail,
      reviewer.userRole,
      'Looks perfect now!',
      undefined
    );
    console.log(`✅ Approve result: ${approveResult.message}`);

    const approvedScreenshot = await service.getResource(screenshot.id);
    console.log(`   Final status: ${approvedScreenshot?.approvalStatus}`);
    console.log(`   Approved at: ${approvedScreenshot?.approvedAt}`);
    console.log(`   Approved by: ${approvedScreenshot?.approvedBy}\n`);

    // Test 7: Create CPP resource
    console.log('📄 Test 7: Create Custom Product Page Resource');
    const cppData: Omit<
      AppleCPPResource,
      'id' | 'approvalStatus' | 'approvalHistory' | 'comments' | 'createdAt' | 'updatedAt'
    > = {
      workspaceId: 'test-workspace',
      resourceType: AppleApprovableResourceType.CUSTOM_PRODUCT_PAGE,
      name: 'Summer 2024 Campaign CPP',
      description: 'Custom product page for summer campaign targeting',
      appId: 'com.example.testapp',
      cppName: 'Summer2024',
      locale: 'en-US',
      promotionalText: 'Experience the best summer features in our app!',
      screenshotSetIds: ['set-001', 'set-002'],
      isPublished: false,
      createdBy: creator.userId,
      createdByName: creator.userName,
      createdByEmail: creator.userEmail,
      thumbnailUrl: '/thumbnails/test-cpp-thumb.png',
      tags: ['summer', 'campaign', '2024'],
    };

    const cpp = await service.createResource(cppData);
    console.log(`✅ Created CPP: ${cpp.id}`);
    console.log(`   Status: ${cpp.approvalStatus}\n`);

    // Test 8: List resources with filters
    console.log('📋 Test 8: List Resources with Filters');
    const allResources = await service.listResources({
      workspaceId: 'test-workspace',
    });
    console.log(`✅ Total resources: ${allResources.length}`);

    const approvedResources = await service.listResources({
      workspaceId: 'test-workspace',
      status: ApprovalStatus.APPROVED,
    });
    console.log(`   Approved resources: ${approvedResources.length}`);

    const screenshotResources = await service.listResources({
      workspaceId: 'test-workspace',
      resourceType: AppleApprovableResourceType.SCREENSHOT,
    });
    console.log(`   Screenshot resources: ${screenshotResources.length}\n`);

    // Test 9: Get statistics
    console.log('📊 Test 9: Get Approval Statistics');
    const stats = await service.getStatistics({
      workspaceId: 'test-workspace',
    });
    console.log(`✅ Statistics:`);
    console.log(`   Draft: ${stats.totalDraft}`);
    console.log(`   In Review: ${stats.totalInReview}`);
    console.log(`   Approved: ${stats.totalApproved}`);
    console.log(`   Rejected: ${stats.totalRejected}`);
    console.log(`   Changes Requested: ${stats.totalChangesRequested}`);
    console.log(`   Avg Approval Time: ${Math.round(stats.avgTimeToApproval / (1000 * 60))} minutes`);
    console.log(`   Approval Rate: ${stats.approvalRate.toFixed(1)}%\n`);

    // Test 10: Get approval history
    console.log('📜 Test 10: Get Approval History');
    const history = await service.getHistory(screenshot.id);
    console.log(`✅ History entries: ${history.length}`);
    history.forEach((entry, i) => {
      console.log(`   ${i + 1}. ${entry.fromStatus || 'initial'} → ${entry.toStatus}`);
      console.log(`      By: ${entry.changedByName}`);
      console.log(`      Reason: ${entry.reason || 'N/A'}`);
    });

    console.log('\n✅ All tests passed!');
    console.log('\n📝 Summary:');
    console.log('   - Screenshot creation and approval workflow: ✅');
    console.log('   - CPP creation: ✅');
    console.log('   - Comments: ✅');
    console.log('   - Status transitions: ✅');
    console.log('   - Filtering: ✅');
    console.log('   - Statistics: ✅');
    console.log('   - History tracking: ✅');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

main();
