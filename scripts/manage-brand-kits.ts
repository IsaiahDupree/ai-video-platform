#!/usr/bin/env tsx

/**
 * Brand Kit Management CLI - ADS-003
 * Command-line tool for managing brand kits
 */

import { BrandKitManager, brandKitManager } from '../src/services/brandKit';
import { BrandKit, BrandLogo, createBrandKit } from '../src/types/brandKit';
import { AdTemplate } from '../src/types/adTemplate';
import * as fs from 'fs';
import * as path from 'path';

const TEMPLATES_DIR = path.join(process.cwd(), 'src', 'templates', 'ads');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message: string, color?: keyof typeof colors) {
  const colorCode = color ? colors[color] : '';
  console.log(`${colorCode}${message}${colors.reset}`);
}

function printBrandKit(brandKit: BrandKit) {
  log(`\n${'='.repeat(60)}`, 'bright');
  log(`Brand Kit: ${brandKit.name}`, 'bright');
  log(`${'='.repeat(60)}`, 'bright');
  log(`ID: ${brandKit.id}`);
  log(`Workspace: ${brandKit.workspaceId}`);
  log(`Default: ${brandKit.isDefault ? 'Yes' : 'No'}`, brandKit.isDefault ? 'green' : 'reset');
  if (brandKit.description) {
    log(`Description: ${brandKit.description}`);
  }

  log(`\nColors:`, 'bright');
  log(`  Primary: ${brandKit.colors.primary}`, 'blue');
  log(`  Secondary: ${brandKit.colors.secondary}`, 'blue');
  log(`  Text: ${brandKit.colors.text}`);
  log(`  Background: ${brandKit.colors.background}`);

  log(`\nTypography:`, 'bright');
  log(`  Headline Font: ${brandKit.typography.headlineFont}`);
  log(`  Body Font: ${brandKit.typography.bodyFont || brandKit.typography.headlineFont}`);

  log(`\nLogos: ${brandKit.logos.length}`, 'bright');
  brandKit.logos.forEach((logo, i) => {
    const isPrimary = logo.id === brandKit.primaryLogo;
    log(`  ${i + 1}. ${logo.name}${isPrimary ? ' (Primary)' : ''}`, isPrimary ? 'green' : 'reset');
    log(`     ID: ${logo.id}`);
    log(`     Path: ${logo.path}`);
    log(`     Size: ${logo.width}x${logo.height}`);
    log(`     Format: ${logo.format}`);
    if (logo.variant) {
      log(`     Variant: ${logo.variant}`);
    }
  });

  log(`\nCreated: ${new Date(brandKit.createdAt).toLocaleString()}`);
  log(`Updated: ${new Date(brandKit.updatedAt).toLocaleString()}`);
  log(`Version: ${brandKit.version}\n`);
}

async function listCommand(workspaceId?: string) {
  log('\nListing Brand Kits...', 'bright');
  const brandKits = await brandKitManager.listBrandKits(
    workspaceId ? { workspaceId } : undefined
  );

  if (brandKits.length === 0) {
    log('No brand kits found.', 'yellow');
    return;
  }

  log(`\nFound ${brandKits.length} brand kit(s):\n`, 'green');
  brandKits.forEach((bk, i) => {
    const defaultLabel = bk.isDefault ? ' (Default)' : '';
    log(`${i + 1}. ${bk.name}${defaultLabel}`, bk.isDefault ? 'green' : 'reset');
    log(`   ID: ${bk.id}`);
    log(`   Workspace: ${bk.workspaceId}`);
    log(`   Logos: ${bk.logos.length}`);
    log(`   Colors: ${bk.colors.primary}, ${bk.colors.secondary}`);
  });
  log('');
}

async function infoCommand(id: string) {
  log(`\nGetting brand kit: ${id}`, 'bright');
  const brandKit = await brandKitManager.getBrandKit(id);

  if (!brandKit) {
    log(`Brand kit not found: ${id}`, 'red');
    return;
  }

  printBrandKit(brandKit);
}

async function createCommand(
  workspaceId: string,
  name: string,
  description?: string
) {
  log('\nCreating new brand kit...', 'bright');

  const id = `${workspaceId}-${Date.now()}`;
  const brandKit = createBrandKit({
    id,
    workspaceId,
    name,
    description,
  });

  await brandKitManager.createBrandKit(brandKit);
  log(`Brand kit created: ${id}`, 'green');
  printBrandKit(brandKit);
}

async function deleteCommand(id: string) {
  log(`\nDeleting brand kit: ${id}`, 'bright');
  const success = await brandKitManager.deleteBrandKit(id);

  if (success) {
    log(`Brand kit deleted: ${id}`, 'green');
  } else {
    log(`Brand kit not found: ${id}`, 'red');
  }
}

async function setDefaultCommand(id: string) {
  log(`\nSetting default brand kit: ${id}`, 'bright');
  const brandKit = await brandKitManager.setDefaultBrandKit(id);
  log(`Brand kit set as default: ${brandKit.name}`, 'green');
}

async function addLogoCommand(
  brandKitId: string,
  logoPath: string,
  logoName: string,
  variant?: string
) {
  log(`\nAdding logo to brand kit: ${brandKitId}`, 'bright');

  if (!fs.existsSync(logoPath)) {
    log(`Logo file not found: ${logoPath}`, 'red');
    return;
  }

  // Get image dimensions (simplified - in real app use image library)
  const logo: BrandLogo = {
    id: `logo-${Date.now()}`,
    name: logoName,
    path: logoPath,
    width: 200,
    height: 60,
    format: path.extname(logoPath).slice(1) as any,
    variant: variant as any,
  };

  const brandKit = await brandKitManager.addLogo(brandKitId, logo);
  log(`Logo added: ${logo.name}`, 'green');
  log(`Logo ID: ${logo.id}`);
}

async function removeLogoCommand(brandKitId: string, logoId: string) {
  log(`\nRemoving logo from brand kit: ${brandKitId}`, 'bright');
  const brandKit = await brandKitManager.removeLogo(brandKitId, logoId);
  log(`Logo removed: ${logoId}`, 'green');
}

async function applyCommand(
  templatePath: string,
  brandKitId: string,
  outputPath: string
) {
  log(`\nApplying brand kit to template...`, 'bright');

  // Load template
  if (!fs.existsSync(templatePath)) {
    log(`Template not found: ${templatePath}`, 'red');
    return;
  }

  const templateData = fs.readFileSync(templatePath, 'utf-8');
  const template: AdTemplate = JSON.parse(templateData);

  // Load brand kit
  const brandKit = await brandKitManager.getBrandKit(brandKitId);
  if (!brandKit) {
    log(`Brand kit not found: ${brandKitId}`, 'red');
    return;
  }

  // Apply brand kit
  const updatedTemplate = brandKitManager.applyBrandKitToTemplate(template, brandKit);

  // Save updated template
  fs.writeFileSync(outputPath, JSON.stringify(updatedTemplate, null, 2));
  log(`Template updated and saved to: ${outputPath}`, 'green');
  log(`\nBrand kit applied:`, 'bright');
  log(`  Colors: ${brandKit.colors.primary}, ${brandKit.colors.secondary}`);
  log(`  Fonts: ${brandKit.typography.headlineFont}`);
  log(`  Logo: ${brandKit.primaryLogo ? 'Yes' : 'No'}`);
}

async function exportCommand(id: string, outputPath: string) {
  log(`\nExporting brand kit: ${id}`, 'bright');
  await brandKitManager.exportBrandKit(id, outputPath);
  log(`Brand kit exported to: ${outputPath}`, 'green');
}

async function importCommand(inputPath: string, workspaceId: string) {
  log(`\nImporting brand kit from: ${inputPath}`, 'bright');
  const brandKit = await brandKitManager.importBrandKit(inputPath, workspaceId);
  log(`Brand kit imported: ${brandKit.id}`, 'green');
  printBrandKit(brandKit);
}

async function testApplyCommand(brandKitId: string) {
  log(`\nTesting brand kit application: ${brandKitId}`, 'bright');

  // Load brand kit
  const brandKit = await brandKitManager.getBrandKit(brandKitId);
  if (!brandKit) {
    log(`Brand kit not found: ${brandKitId}`, 'red');
    return;
  }

  // Find a template to test with
  const templates = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.json'));
  if (templates.length === 0) {
    log('No templates found to test with', 'yellow');
    return;
  }

  const templatePath = path.join(TEMPLATES_DIR, templates[0]);
  const templateData = fs.readFileSync(templatePath, 'utf-8');
  const template: AdTemplate = JSON.parse(templateData);

  log(`\nOriginal template: ${template.name}`, 'bright');
  log(`  Primary Color: ${template.style.primaryColor}`);
  log(`  Headline Font: ${template.style.headlineFont}`);
  log(`  Logo: ${template.content.logo || 'None'}`);

  // Apply brand kit
  const updatedTemplate = brandKitManager.applyBrandKitToTemplate(template, brandKit);

  log(`\nAfter applying brand kit:`, 'bright');
  log(`  Primary Color: ${updatedTemplate.style.primaryColor}`, 'green');
  log(`  Headline Font: ${updatedTemplate.style.headlineFont}`, 'green');
  log(`  Logo: ${updatedTemplate.content.logo || 'None'}`, 'green');

  log(`\nBrand kit application successful!`, 'green');
}

function showHelp() {
  log('\nBrand Kit Management CLI', 'bright');
  log('========================\n', 'bright');
  log('Usage: npm run manage-brand-kits <command> [options]\n');
  log('Commands:', 'bright');
  log('  list [workspaceId]              List all brand kits (optionally filtered by workspace)');
  log('  info <id>                       Show detailed info for a brand kit');
  log('  create <workspace> <name> [desc] Create a new brand kit');
  log('  delete <id>                     Delete a brand kit');
  log('  set-default <id>                Set a brand kit as default for its workspace');
  log('  add-logo <id> <path> <name> [variant] Add a logo to a brand kit');
  log('  remove-logo <id> <logoId>       Remove a logo from a brand kit');
  log('  apply <template> <brandKitId> <output> Apply brand kit to template');
  log('  test-apply <id>                 Test applying brand kit to a sample template');
  log('  export <id> <output>            Export brand kit to JSON file');
  log('  import <input> <workspaceId>    Import brand kit from JSON file');
  log('  help                            Show this help message');
  log('\nExamples:', 'bright');
  log('  npm run manage-brand-kits list');
  log('  npm run manage-brand-kits info tech-startup-001');
  log('  npm run manage-brand-kits create workspace-001 "My Brand" "Company brand guidelines"');
  log('  npm run manage-brand-kits test-apply tech-startup-001');
  log('  npm run manage-brand-kits apply src/templates/ads/app-launch.json tech-startup-001 output.json\n');
}

// Main CLI handler
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'list':
        await listCommand(args[1]);
        break;
      case 'info':
        if (!args[1]) {
          log('Error: Missing brand kit ID', 'red');
          showHelp();
          return;
        }
        await infoCommand(args[1]);
        break;
      case 'create':
        if (!args[1] || !args[2]) {
          log('Error: Missing workspace ID or name', 'red');
          showHelp();
          return;
        }
        await createCommand(args[1], args[2], args[3]);
        break;
      case 'delete':
        if (!args[1]) {
          log('Error: Missing brand kit ID', 'red');
          showHelp();
          return;
        }
        await deleteCommand(args[1]);
        break;
      case 'set-default':
        if (!args[1]) {
          log('Error: Missing brand kit ID', 'red');
          showHelp();
          return;
        }
        await setDefaultCommand(args[1]);
        break;
      case 'add-logo':
        if (!args[1] || !args[2] || !args[3]) {
          log('Error: Missing required arguments', 'red');
          showHelp();
          return;
        }
        await addLogoCommand(args[1], args[2], args[3], args[4]);
        break;
      case 'remove-logo':
        if (!args[1] || !args[2]) {
          log('Error: Missing brand kit ID or logo ID', 'red');
          showHelp();
          return;
        }
        await removeLogoCommand(args[1], args[2]);
        break;
      case 'apply':
        if (!args[1] || !args[2] || !args[3]) {
          log('Error: Missing required arguments', 'red');
          showHelp();
          return;
        }
        await applyCommand(args[1], args[2], args[3]);
        break;
      case 'test-apply':
        if (!args[1]) {
          log('Error: Missing brand kit ID', 'red');
          showHelp();
          return;
        }
        await testApplyCommand(args[1]);
        break;
      case 'export':
        if (!args[1] || !args[2]) {
          log('Error: Missing brand kit ID or output path', 'red');
          showHelp();
          return;
        }
        await exportCommand(args[1], args[2]);
        break;
      case 'import':
        if (!args[1] || !args[2]) {
          log('Error: Missing input path or workspace ID', 'red');
          showHelp();
          return;
        }
        await importCommand(args[1], args[2]);
        break;
      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    log(`Error: ${error instanceof Error ? error.message : String(error)}`, 'red');
    process.exit(1);
  }
}

main();
