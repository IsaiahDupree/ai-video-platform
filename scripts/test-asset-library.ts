/**
 * APP-005: Asset Library Test Suite
 * Comprehensive tests for per-app asset management with version history
 */

import fs from 'fs/promises';
import path from 'path';
import { AssetLibraryManager } from '../src/services/assetLibrary';
import type {
  AppInfo,
  Asset,
  AssetUploadConfig,
  AssetSearchCriteria,
  VersionRollbackConfig,
  BatchUpdateConfig,
  AssetExportConfig,
} from '../src/types/assetLibrary';

// Test configuration
const TEST_DATA_DIR = path.join(process.cwd(), 'data', 'asset-library-test');
const TEST_ASSETS_DIR = path.join(process.cwd(), 'public', 'test-assets');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let testsPassed = 0;
let testsFailed = 0;

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name: string, passed: boolean, details?: string) {
  if (passed) {
    testsPassed++;
    log(`✓ ${name}`, 'green');
    if (details) log(`  ${details}`, 'cyan');
  } else {
    testsFailed++;
    log(`✗ ${name}`, 'red');
    if (details) log(`  ${details}`, 'yellow');
  }
}

// ============================================================================
// Test Utilities
// ============================================================================

async function setupTestEnvironment() {
  // Clean up test data
  try {
    await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
  } catch {}

  // Create test assets directory
  await fs.mkdir(TEST_ASSETS_DIR, { recursive: true });

  // Create mock image files
  await createMockImageFile(path.join(TEST_ASSETS_DIR, 'screenshot1.png'), 1024 * 100);
  await createMockImageFile(path.join(TEST_ASSETS_DIR, 'screenshot2.png'), 1024 * 150);
  await createMockImageFile(path.join(TEST_ASSETS_DIR, 'icon.png'), 1024 * 50);
  await createMockImageFile(path.join(TEST_ASSETS_DIR, 'logo.png'), 1024 * 75);
}

async function createMockImageFile(filePath: string, size: number) {
  const buffer = Buffer.alloc(size, 'X');
  await fs.writeFile(filePath, buffer);
}

async function cleanupTestEnvironment() {
  try {
    await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    await fs.rm(TEST_ASSETS_DIR, { recursive: true, force: true });
  } catch {}
}

// ============================================================================
// Test Cases
// ============================================================================

async function test01_InitializeManager() {
  log('\n🧪 Test 1: Initialize Asset Library Manager', 'blue');

  const manager = new AssetLibraryManager();
  await manager.initialize();

  const dataExists = await fs.stat(TEST_DATA_DIR).then(() => true).catch(() => false);
  logTest('Manager initialization', dataExists, 'Data directory created');
}

async function test02_CreateApp() {
  log('\n🧪 Test 2: Create App', 'blue');

  const manager = new AssetLibraryManager();

  const app = await manager.createApp({
    name: 'Test App',
    bundleId: 'com.test.app',
    platform: 'ios',
    description: 'A test application',
  });

  logTest('App creation', app.id !== undefined, `App ID: ${app.id}`);
  logTest('App name', app.name === 'Test App', `Name: ${app.name}`);
  logTest('App bundle ID', app.bundleId === 'com.test.app', `Bundle ID: ${app.bundleId}`);
  logTest('App platform', app.platform === 'ios', `Platform: ${app.platform}`);
  logTest('Created timestamp', app.createdAt !== undefined, `Created at: ${app.createdAt}`);

  return app;
}

async function test03_GetApp(appId: string) {
  log('\n🧪 Test 3: Get App', 'blue');

  const manager = new AssetLibraryManager();
  const app = await manager.getApp(appId);

  logTest('App retrieval', app !== null, `Retrieved app: ${app?.name}`);
  logTest('App ID matches', app?.id === appId, `ID: ${app?.id}`);

  return app;
}

async function test04_UpdateApp(appId: string) {
  log('\n🧪 Test 4: Update App', 'blue');

  const manager = new AssetLibraryManager();
  const updatedApp = await manager.updateApp(appId, {
    description: 'Updated description',
  });

  logTest('App update', updatedApp !== null, 'App updated successfully');
  logTest(
    'Description updated',
    updatedApp?.description === 'Updated description',
    `Description: ${updatedApp?.description}`
  );
  logTest(
    'Updated timestamp changed',
    updatedApp?.updatedAt !== updatedApp?.createdAt,
    `Updated at: ${updatedApp?.updatedAt}`
  );

  return updatedApp;
}

async function test05_ListApps() {
  log('\n🧪 Test 5: List Apps', 'blue');

  const manager = new AssetLibraryManager();

  // Create a second app
  await manager.createApp({
    name: 'Second App',
    bundleId: 'com.test.secondapp',
    platform: 'macos',
  });

  const apps = await manager.listApps();

  logTest('List apps', apps.length >= 2, `Found ${apps.length} apps`);
  logTest('Apps sorted by name', apps[0].name <= apps[1].name, 'Sorted correctly');

  return apps;
}

async function test06_UploadAsset(appId: string) {
  log('\n🧪 Test 6: Upload Asset', 'blue');

  const manager = new AssetLibraryManager();
  const sourceFile = path.join(TEST_ASSETS_DIR, 'screenshot1.png');

  const config: AssetUploadConfig = {
    appId,
    name: 'Home Screen Screenshot',
    description: 'Screenshot of the home screen',
    type: 'screenshot',
    status: 'draft',
    locale: 'en-US',
    deviceType: 'iPhone 17 Pro Max',
    tags: ['home', 'main'],
  };

  const asset = await manager.uploadAsset(sourceFile, config, 'user-123');

  logTest('Asset upload', asset.id !== undefined, `Asset ID: ${asset.id}`);
  logTest('Asset name', asset.name === config.name, `Name: ${asset.name}`);
  logTest('Asset type', asset.type === 'screenshot', `Type: ${asset.type}`);
  logTest('Asset status', asset.status === 'draft', `Status: ${asset.status}`);
  logTest('Asset locale', asset.locale === 'en-US', `Locale: ${asset.locale}`);
  logTest('Asset version', asset.version === 1, `Version: ${asset.version}`);
  logTest('Version history', asset.versionHistory.length === 1, 'Initial version in history');
  logTest('File size', asset.fileSize > 0, `Size: ${asset.fileSize} bytes`);

  return asset;
}

async function test07_GetAsset(assetId: string) {
  log('\n🧪 Test 7: Get Asset', 'blue');

  const manager = new AssetLibraryManager();
  const asset = await manager.getAsset(assetId);

  logTest('Asset retrieval', asset !== null, `Retrieved asset: ${asset?.name}`);
  logTest('Asset ID matches', asset?.id === assetId, `ID: ${asset?.id}`);

  return asset;
}

async function test08_UpdateAsset(assetId: string) {
  log('\n🧪 Test 8: Update Asset Metadata', 'blue');

  const manager = new AssetLibraryManager();
  const updatedAsset = await manager.updateAsset(
    assetId,
    {
      status: 'approved',
      tags: ['home', 'main', 'featured'],
    },
    'user-456'
  );

  logTest('Asset update', updatedAsset !== null, 'Asset updated successfully');
  logTest('Status updated', updatedAsset?.status === 'approved', `Status: ${updatedAsset?.status}`);
  logTest('Tags updated', updatedAsset?.tags?.length === 3, `Tags: ${updatedAsset?.tags?.join(', ')}`);
  logTest('Updated by', updatedAsset?.updatedBy === 'user-456', `Updated by: ${updatedAsset?.updatedBy}`);

  return updatedAsset;
}

async function test09_UploadNewVersion(assetId: string) {
  log('\n🧪 Test 9: Upload New Version', 'blue');

  const manager = new AssetLibraryManager();
  const sourceFile = path.join(TEST_ASSETS_DIR, 'screenshot2.png');

  const updatedAsset = await manager.uploadNewVersion(
    assetId,
    sourceFile,
    'Updated screenshot with new design',
    'user-789'
  );

  logTest('New version uploaded', updatedAsset !== null, 'Version uploaded successfully');
  logTest('Version incremented', updatedAsset?.version === 2, `Version: ${updatedAsset?.version}`);
  logTest('Version history', updatedAsset?.versionHistory.length === 2, 'Two versions in history');
  logTest('File path updated', updatedAsset?.filePath.includes('v2'), `Path: ${updatedAsset?.filePath}`);
  logTest('Changes recorded', updatedAsset?.versionHistory[1].changes !== undefined, 'Changes documented');

  return updatedAsset;
}

async function test10_SearchAssets(appId: string) {
  log('\n🧪 Test 10: Search Assets', 'blue');

  const manager = new AssetLibraryManager();

  // Upload a few more assets
  await manager.uploadAsset(
    path.join(TEST_ASSETS_DIR, 'icon.png'),
    {
      appId,
      name: 'App Icon',
      type: 'icon',
      status: 'approved',
    }
  );

  await manager.uploadAsset(
    path.join(TEST_ASSETS_DIR, 'logo.png'),
    {
      appId,
      name: 'Company Logo',
      type: 'logo',
      status: 'draft',
    }
  );

  // Search all assets
  const allAssets = await manager.searchAssets({ appId });
  logTest('Search all assets', allAssets.length === 3, `Found ${allAssets.length} assets`);

  // Search by type
  const screenshots = await manager.searchAssets({ appId, type: 'screenshot' });
  logTest('Search by type', screenshots.length === 1, `Found ${screenshots.length} screenshots`);

  // Search by status
  const approved = await manager.searchAssets({ appId, status: 'approved' });
  logTest('Search by status', approved.length === 2, `Found ${approved.length} approved assets`);

  // Search by name
  const searched = await manager.searchAssets({ appId, search: 'icon' });
  logTest('Search by name', searched.length === 1, `Found ${searched.length} matching 'icon'`);

  return allAssets;
}

async function test11_GetStatistics(appId: string) {
  log('\n🧪 Test 11: Get Statistics', 'blue');

  const manager = new AssetLibraryManager();
  const stats = await manager.getStatistics(appId);

  logTest('Statistics generated', stats !== null, 'Statistics retrieved');
  logTest('Total assets', stats.totalAssets === 3, `Total: ${stats.totalAssets}`);
  logTest('Total size', stats.totalSize > 0, `Total size: ${stats.totalSize} bytes`);
  logTest('By type', Object.keys(stats.byType).length > 0, `Types: ${Object.keys(stats.byType).length}`);
  logTest('By status', Object.keys(stats.byStatus).length > 0, `Statuses: ${Object.keys(stats.byStatus).length}`);

  return stats;
}

async function test12_RollbackVersion(assetId: string) {
  log('\n🧪 Test 12: Rollback Version', 'blue');

  const manager = new AssetLibraryManager();

  const config: VersionRollbackConfig = {
    assetId,
    targetVersion: 1,
    createNewVersion: true,
  };

  const rolledBack = await manager.rollbackVersion(config, 'user-admin');

  logTest('Version rollback', rolledBack !== null, 'Rollback successful');
  logTest('New version created', rolledBack?.version === 3, `Version: ${rolledBack?.version}`);
  logTest('Version history', rolledBack?.versionHistory.length === 3, 'Three versions in history');

  return rolledBack;
}

async function test13_BatchUpdate() {
  log('\n🧪 Test 13: Batch Update Assets', 'blue');

  const manager = new AssetLibraryManager();

  // Get all draft assets
  const draftAssets = await manager.searchAssets({ status: 'draft' });
  const assetIds = draftAssets.map((a) => a.id);

  const config: BatchUpdateConfig = {
    assetIds,
    updates: {
      status: 'review',
      tags: ['batch-updated'],
    },
  };

  const updated = await manager.batchUpdate(config, 'user-admin');

  logTest('Batch update', updated.length === draftAssets.length, `Updated ${updated.length} assets`);
  logTest('Status changed', updated.every((a) => a.status === 'review'), 'All statuses updated to review');
  logTest('Tags added', updated.every((a) => a.tags?.includes('batch-updated')), 'Tags added to all');

  return updated;
}

async function test14_ExportToDirectory() {
  log('\n🧪 Test 14: Export Assets to Directory', 'blue');

  const manager = new AssetLibraryManager();
  const assets = await manager.searchAssets({});

  const outputPath = path.join(TEST_DATA_DIR, 'export-directory');

  const config: AssetExportConfig = {
    assets,
    outputPath,
    format: 'directory',
    includeMetadata: true,
    includeVersionHistory: false,
    organizationStrategy: 'by-type',
  };

  const result = await manager.exportAssets(config);

  logTest('Export success', result.success === true, 'Export completed');
  logTest('Asset count', result.assetCount === assets.length, `Exported ${result.assetCount} assets`);
  logTest('Manifest created', result.manifest !== undefined, 'Manifest generated');

  // Check directory exists
  const dirExists = await fs.stat(outputPath).then(() => true).catch(() => false);
  logTest('Output directory created', dirExists, `Path: ${outputPath}`);

  return result;
}

async function test15_ExportToZip() {
  log('\n🧪 Test 15: Export Assets to ZIP', 'blue');

  const manager = new AssetLibraryManager();
  const assets = await manager.searchAssets({});

  const outputPath = path.join(TEST_DATA_DIR, 'export.zip');

  const config: AssetExportConfig = {
    assets,
    outputPath,
    format: 'zip',
    includeMetadata: true,
    includeVersionHistory: true,
    organizationStrategy: 'flat',
    compression: 9,
  };

  const result = await manager.exportAssets(config);

  logTest('Export success', result.success === true, 'Export completed');
  logTest('Asset count', result.assetCount === assets.length, `Exported ${result.assetCount} assets`);

  // Check ZIP exists
  const zipExists = await fs.stat(outputPath).then(() => true).catch(() => false);
  logTest('ZIP file created', zipExists, `Path: ${outputPath}`);

  return result;
}

async function test16_DeleteAsset(assetId: string) {
  log('\n🧪 Test 16: Delete Asset', 'blue');

  const manager = new AssetLibraryManager();

  const deleted = await manager.deleteAsset(assetId, false);
  logTest('Asset deleted (metadata only)', deleted === true, 'Deletion successful');

  const asset = await manager.getAsset(assetId);
  logTest('Asset not found after deletion', asset === null, 'Asset metadata removed');
}

async function test17_DeleteApp() {
  log('\n🧪 Test 17: Delete App', 'blue');

  const manager = new AssetLibraryManager();

  // Create a test app
  const app = await manager.createApp({
    name: 'Delete Test App',
    bundleId: 'com.test.delete',
    platform: 'ios',
  });

  // Upload an asset
  await manager.uploadAsset(
    path.join(TEST_ASSETS_DIR, 'icon.png'),
    {
      appId: app.id,
      name: 'Test Icon',
      type: 'icon',
    }
  );

  // Delete app with assets
  const deleted = await manager.deleteApp(app.id, true);
  logTest('App deleted with assets', deleted === true, 'Deletion successful');

  const retrievedApp = await manager.getApp(app.id);
  logTest('App not found after deletion', retrievedApp === null, 'App removed');
}

// ============================================================================
// Run All Tests
// ============================================================================

async function runAllTests() {
  log('═══════════════════════════════════════════════════', 'cyan');
  log('  APP-005: Asset Library Test Suite', 'cyan');
  log('  Per-app asset management with version history', 'cyan');
  log('═══════════════════════════════════════════════════', 'cyan');

  try {
    await setupTestEnvironment();

    // Run tests
    await test01_InitializeManager();

    const app = await test02_CreateApp();
    if (!app) throw new Error('App creation failed');

    await test03_GetApp(app.id);
    await test04_UpdateApp(app.id);
    await test05_ListApps();

    const asset = await test06_UploadAsset(app.id);
    if (!asset) throw new Error('Asset upload failed');

    await test07_GetAsset(asset.id);
    await test08_UpdateAsset(asset.id);
    await test09_UploadNewVersion(asset.id);
    await test10_SearchAssets(app.id);
    await test11_GetStatistics(app.id);
    await test12_RollbackVersion(asset.id);
    await test13_BatchUpdate();
    await test14_ExportToDirectory();
    await test15_ExportToZip();
    await test16_DeleteAsset(asset.id);
    await test17_DeleteApp();

    // Summary
    log('\n═══════════════════════════════════════════════════', 'cyan');
    log(`Tests Passed: ${testsPassed}`, 'green');
    log(`Tests Failed: ${testsFailed}`, testsFailed > 0 ? 'red' : 'green');
    log(`Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`, 'cyan');
    log('═══════════════════════════════════════════════════', 'cyan');

    if (testsFailed === 0) {
      log('\n✨ All tests passed!', 'green');
    } else {
      log(`\n⚠️  ${testsFailed} test(s) failed`, 'yellow');
    }
  } catch (error) {
    log(`\n❌ Test suite error: ${(error as Error).message}`, 'red');
    console.error(error);
  } finally {
    await cleanupTestEnvironment();
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

export { runAllTests };
