#!/usr/bin/env tsx
/**
 * APP-006: App Store Connect OAuth - CLI Tool
 *
 * Command-line tool for managing ASC credentials
 */

import {
  saveCredentials,
  loadCredentials,
  listCredentials,
  deleteCredentials,
  testCredentials,
  getDefaultCredentials,
} from '@/services/ascAuth';
import type { ASCCredentials } from '@/types/ascAuth';
import * as fs from 'fs/promises';
import * as readline from 'readline';

// ============================================================================
// CLI Interface
// ============================================================================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function promptCredentials(): Promise<ASCCredentials> {
  console.log('\nEnter App Store Connect API Credentials:');
  console.log('(You can find these at https://appstoreconnect.apple.com/access/api)\n');

  const issuerId = await question('Issuer ID: ');
  const keyId = await question('Key ID: ');
  const privateKeyPath = await question('Path to private key (.p8 file): ');

  // Read private key file
  const privateKey = await fs.readFile(privateKeyPath.trim(), 'utf-8');

  return {
    issuerId: issuerId.trim(),
    keyId: keyId.trim(),
    privateKey: privateKey.trim(),
  };
}

// ============================================================================
// Commands
// ============================================================================

async function cmdAdd(): Promise<void> {
  console.log('\n📝 Add New Credentials\n');

  const credentials = await promptCredentials();
  const name = await question('\nDisplay name for these credentials: ');
  const setDefault = (await question('Set as default? (y/n): ')).toLowerCase() === 'y';

  // Test credentials first
  console.log('\n🔍 Testing credentials...');
  const valid = await testCredentials(credentials);

  if (!valid) {
    console.log('❌ Credentials are invalid. Please check and try again.');
    return;
  }

  console.log('✅ Credentials are valid!');

  // Save credentials
  const saved = await saveCredentials(credentials, name.trim(), setDefault);

  console.log(`\n✅ Credentials saved successfully!`);
  console.log(`   ID: ${saved.id}`);
  console.log(`   Name: ${saved.name}`);
  console.log(`   Default: ${saved.isDefault ? 'Yes' : 'No'}`);
}

async function cmdList(): Promise<void> {
  console.log('\n📋 Stored Credentials\n');

  const credentials = await listCredentials();

  if (credentials.length === 0) {
    console.log('No credentials found.');
    console.log('Use "add" command to add credentials.');
    return;
  }

  credentials.forEach((cred, index) => {
    console.log(`${index + 1}. ${cred.name} ${cred.isDefault ? '(default)' : ''}`);
    console.log(`   ID: ${cred.id}`);
    console.log(`   Issuer ID: ${cred.issuerId}`);
    console.log(`   Key ID: ${cred.keyId}`);
    console.log(`   Created: ${new Date(cred.createdAt).toLocaleString()}`);
    if (cred.lastUsedAt) {
      console.log(`   Last used: ${new Date(cred.lastUsedAt).toLocaleString()}`);
    }
    console.log();
  });
}

async function cmdTest(): Promise<void> {
  console.log('\n🔍 Test Credentials\n');

  const credentials = await listCredentials();

  if (credentials.length === 0) {
    console.log('No credentials found.');
    return;
  }

  // Show list
  credentials.forEach((cred, index) => {
    console.log(`${index + 1}. ${cred.name}`);
  });

  const choice = await question('\nSelect credentials to test (number or "default"): ');

  let selected;
  if (choice.toLowerCase() === 'default') {
    selected = await getDefaultCredentials();
    if (!selected) {
      console.log('No default credentials found.');
      return;
    }
  } else {
    const index = parseInt(choice) - 1;
    if (index < 0 || index >= credentials.length) {
      console.log('Invalid selection.');
      return;
    }
    selected = credentials[index];
  }

  console.log(`\nTesting "${selected.name}"...`);
  const valid = await testCredentials(selected);

  if (valid) {
    console.log('✅ Credentials are valid!');
  } else {
    console.log('❌ Credentials are invalid.');
  }
}

async function cmdDelete(): Promise<void> {
  console.log('\n🗑️  Delete Credentials\n');

  const credentials = await listCredentials();

  if (credentials.length === 0) {
    console.log('No credentials found.');
    return;
  }

  // Show list
  credentials.forEach((cred, index) => {
    console.log(`${index + 1}. ${cred.name} ${cred.isDefault ? '(default)' : ''}`);
  });

  const choice = await question('\nSelect credentials to delete (number): ');
  const index = parseInt(choice) - 1;

  if (index < 0 || index >= credentials.length) {
    console.log('Invalid selection.');
    return;
  }

  const selected = credentials[index];
  const confirm = await question(`Are you sure you want to delete "${selected.name}"? (y/n): `);

  if (confirm.toLowerCase() !== 'y') {
    console.log('Cancelled.');
    return;
  }

  await deleteCredentials(selected.id);
  console.log('✅ Credentials deleted successfully!');
}

async function cmdShow(): Promise<void> {
  console.log('\n👁️  Show Default Credentials\n');

  const cred = await getDefaultCredentials();

  if (!cred) {
    console.log('No default credentials found.');
    console.log('Use "add" command to add credentials.');
    return;
  }

  console.log(`Name: ${cred.name}`);
  console.log(`ID: ${cred.id}`);
  console.log(`Issuer ID: ${cred.issuerId}`);
  console.log(`Key ID: ${cred.keyId}`);
  console.log(`Created: ${new Date(cred.createdAt).toLocaleString()}`);
  if (cred.lastUsedAt) {
    console.log(`Last used: ${new Date(cred.lastUsedAt).toLocaleString()}`);
  }
}

async function showHelp(): Promise<void> {
  console.log('\nApp Store Connect Credentials Manager\n');
  console.log('Usage: npm run asc-creds <command>\n');
  console.log('Commands:');
  console.log('  add      Add new credentials');
  console.log('  list     List all stored credentials');
  console.log('  show     Show default credentials');
  console.log('  test     Test credentials validity');
  console.log('  delete   Delete credentials');
  console.log('  help     Show this help message');
  console.log();
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const command = process.argv[2] || 'help';

  try {
    switch (command) {
      case 'add':
        await cmdAdd();
        break;
      case 'list':
        await cmdList();
        break;
      case 'show':
        await cmdShow();
        break;
      case 'test':
        await cmdTest();
        break;
      case 'delete':
        await cmdDelete();
        break;
      case 'help':
        await showHelp();
        break;
      default:
        console.log(`Unknown command: ${command}`);
        await showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
