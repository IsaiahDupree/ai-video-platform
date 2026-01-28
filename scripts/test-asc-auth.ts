/**
 * APP-006: App Store Connect OAuth - Test Suite
 *
 * Comprehensive tests for ASC authentication service
 */

import {
  generateToken,
  getToken,
  validateToken,
  saveCredentials,
  loadCredentials,
  listCredentials,
  getDefaultCredentials,
  deleteCredentials,
  clearTokenCache,
  testCredentials,
} from '@/services/ascAuth';
import type { ASCCredentials } from '@/types/ascAuth';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

// ============================================================================
// Mock Data
// ============================================================================

/**
 * Generate a mock private key (for testing only)
 * This is a valid ECDSA P-256 key for testing JWT signing
 */
function generateMockPrivateKey(): string {
  // Generate a real ECDSA P-256 key for testing
  // In production, use the actual .p8 file from App Store Connect
  const { privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1', // P-256 curve
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
  });

  return privateKey;
}

const MOCK_CREDENTIALS: ASCCredentials = {
  issuerId: '12345678-1234-1234-1234-123456789012',
  keyId: 'ABC1234DEF',
  privateKey: generateMockPrivateKey(),
};

// ============================================================================
// Test Runner
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await testFn();
    results.push({ name, passed: true, duration: Date.now() - start });
    console.log(`✓ ${name}`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - start,
    });
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// ============================================================================
// Tests
// ============================================================================

async function testTokenGeneration(): Promise<void> {
  const token = generateToken(MOCK_CREDENTIALS);

  // Verify token structure
  const parts = token.token.split('.');
  if (parts.length !== 3) {
    throw new Error('Token should have 3 parts (header.payload.signature)');
  }

  // Verify token validity
  if (!token.isValid) {
    throw new Error('Token should be valid');
  }

  // Verify expiration
  const now = Math.floor(Date.now() / 1000);
  if (token.expiresAt <= now) {
    throw new Error('Token should not be expired');
  }

  if (token.expiresAt > now + 1201) {
    throw new Error('Token expiration should not exceed 20 minutes');
  }
}

async function testTokenValidation(): Promise<void> {
  const token = generateToken(MOCK_CREDENTIALS);

  // Valid token should pass validation
  if (!validateToken(token.token)) {
    throw new Error('Valid token should pass validation');
  }

  // Invalid tokens should fail
  if (validateToken('invalid.token.here')) {
    throw new Error('Invalid token should fail validation');
  }

  if (validateToken('')) {
    throw new Error('Empty token should fail validation');
  }
}

async function testTokenCaching(): Promise<void> {
  clearTokenCache();

  // First call should generate new token
  const token1 = getToken(MOCK_CREDENTIALS, 'test-cache');

  // Second call should return cached token
  const token2 = getToken(MOCK_CREDENTIALS, 'test-cache');

  if (token1.token !== token2.token) {
    throw new Error('Second call should return cached token');
  }

  clearTokenCache();
}

async function testSaveAndLoadCredentials(): Promise<void> {
  // Clean up test data
  const dataDir = path.join(process.cwd(), 'data', 'asc-credentials');
  try {
    await fs.rm(dataDir, { recursive: true });
  } catch {
    // Ignore if doesn't exist
  }

  // Save credentials
  const saved = await saveCredentials(MOCK_CREDENTIALS, 'Test Credentials', true);

  if (!saved.id) {
    throw new Error('Saved credentials should have an ID');
  }

  if (saved.name !== 'Test Credentials') {
    throw new Error('Saved credentials should preserve name');
  }

  if (!saved.isDefault) {
    throw new Error('Saved credentials should be marked as default');
  }

  // Load credentials
  const loaded = await loadCredentials(saved.id);

  if (!loaded) {
    throw new Error('Should load saved credentials');
  }

  if (loaded.issuerId !== MOCK_CREDENTIALS.issuerId) {
    throw new Error('Loaded credentials should match saved credentials');
  }

  // Clean up
  await deleteCredentials(saved.id);
}

async function testListCredentials(): Promise<void> {
  // Clean up test data
  const dataDir = path.join(process.cwd(), 'data', 'asc-credentials');
  try {
    await fs.rm(dataDir, { recursive: true });
  } catch {
    // Ignore if doesn't exist
  }

  // Should return empty array when no credentials
  let list = await listCredentials();
  if (list.length !== 0) {
    throw new Error('Should return empty array when no credentials');
  }

  // Save multiple credentials
  const cred1 = await saveCredentials(MOCK_CREDENTIALS, 'Cred 1', true);
  const cred2 = await saveCredentials(MOCK_CREDENTIALS, 'Cred 2', false);

  // List should return all credentials
  list = await listCredentials();
  if (list.length !== 2) {
    throw new Error('Should return all saved credentials');
  }

  // Default should be first
  if (list[0].id !== cred1.id) {
    throw new Error('Default credentials should be first');
  }

  // Clean up
  await deleteCredentials(cred1.id);
  await deleteCredentials(cred2.id);
}

async function testGetDefaultCredentials(): Promise<void> {
  // Clean up test data
  const dataDir = path.join(process.cwd(), 'data', 'asc-credentials');
  try {
    await fs.rm(dataDir, { recursive: true });
  } catch {
    // Ignore if doesn't exist
  }

  // Should return null when no credentials
  let defaultCred = await getDefaultCredentials();
  if (defaultCred !== null) {
    throw new Error('Should return null when no credentials');
  }

  // Save credentials
  const cred1 = await saveCredentials(MOCK_CREDENTIALS, 'Cred 1', false);
  const cred2 = await saveCredentials(MOCK_CREDENTIALS, 'Cred 2', true);

  // Should return default
  defaultCred = await getDefaultCredentials();
  if (!defaultCred || defaultCred.id !== cred2.id) {
    throw new Error('Should return credentials marked as default');
  }

  // Clean up
  await deleteCredentials(cred1.id);
  await deleteCredentials(cred2.id);
}

async function testDeleteCredentials(): Promise<void> {
  // Clean up test data
  const dataDir = path.join(process.cwd(), 'data', 'asc-credentials');
  try {
    await fs.rm(dataDir, { recursive: true });
  } catch {
    // Ignore if doesn't exist
  }

  // Save credentials
  const saved = await saveCredentials(MOCK_CREDENTIALS, 'Test Delete', false);

  // Verify it exists
  let loaded = await loadCredentials(saved.id);
  if (!loaded) {
    throw new Error('Credentials should exist before deletion');
  }

  // Delete
  await deleteCredentials(saved.id);

  // Verify it's gone
  loaded = await loadCredentials(saved.id);
  if (loaded !== null) {
    throw new Error('Credentials should not exist after deletion');
  }
}

async function testTokenExpiration(): Promise<void> {
  // Generate token with short expiration
  const token = generateToken(MOCK_CREDENTIALS, 10);

  const now = Math.floor(Date.now() / 1000);
  const expectedExpiration = now + 10;

  if (Math.abs(token.expiresAt - expectedExpiration) > 1) {
    throw new Error('Token expiration should match requested duration');
  }

  // Verify max expiration is enforced
  const longToken = generateToken(MOCK_CREDENTIALS, 2000);
  if (longToken.expiresAt > now + 1201) {
    throw new Error('Token expiration should not exceed 20 minutes');
  }
}

async function testTokenPayloadStructure(): Promise<void> {
  const token = generateToken(MOCK_CREDENTIALS);

  // Decode payload
  const parts = token.token.split('.');
  const payloadJson = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
  const payload = JSON.parse(payloadJson);

  // Verify required fields
  if (payload.iss !== MOCK_CREDENTIALS.issuerId) {
    throw new Error('Payload should include issuer ID');
  }

  if (payload.aud !== 'appstoreconnect-v1') {
    throw new Error('Payload should include correct audience');
  }

  if (!payload.iat || !payload.exp) {
    throw new Error('Payload should include iat and exp timestamps');
  }

  // Decode header
  const headerJson = Buffer.from(parts[0].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
  const header = JSON.parse(headerJson);

  if (header.alg !== 'ES256') {
    throw new Error('Header should use ES256 algorithm');
  }

  if (header.kid !== MOCK_CREDENTIALS.keyId) {
    throw new Error('Header should include key ID');
  }

  if (header.typ !== 'JWT') {
    throw new Error('Header should specify JWT type');
  }
}

async function testClearTokenCache(): Promise<void> {
  clearTokenCache();

  // Generate and cache token
  const token1 = getToken(MOCK_CREDENTIALS, 'test-clear');

  // Clear cache
  clearTokenCache();

  // Next call should generate new token
  const token2 = getToken(MOCK_CREDENTIALS, 'test-clear');

  if (token1.token === token2.token) {
    throw new Error('After clearing cache, should generate new token');
  }
}

// ============================================================================
// Run All Tests
// ============================================================================

async function runAllTests(): Promise<void> {
  console.log('Running APP-006 ASC Auth Tests...\n');

  await runTest('Token Generation', testTokenGeneration);
  await runTest('Token Validation', testTokenValidation);
  await runTest('Token Caching', testTokenCaching);
  await runTest('Save and Load Credentials', testSaveAndLoadCredentials);
  await runTest('List Credentials', testListCredentials);
  await runTest('Get Default Credentials', testGetDefaultCredentials);
  await runTest('Delete Credentials', testDeleteCredentials);
  await runTest('Token Expiration', testTokenExpiration);
  await runTest('Token Payload Structure', testTokenPayloadStructure);
  await runTest('Clear Token Cache', testClearTokenCache);

  // Print summary
  console.log('\n' + '='.repeat(60));
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed tests:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
  }

  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  console.log(`\nAverage test duration: ${avgDuration.toFixed(2)}ms`);

  console.log('='.repeat(60));

  // Clean up test data
  const dataDir = path.join(process.cwd(), 'data', 'asc-credentials');
  try {
    await fs.rm(dataDir, { recursive: true });
  } catch {
    // Ignore if doesn't exist
  }

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
