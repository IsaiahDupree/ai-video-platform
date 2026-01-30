#!/usr/bin/env npx tsx
/**
 * Motion Canvas Integration Validation
 *
 * Checks that all components of the Motion Canvas integration are properly configured
 * and ready for two-pass rendering pipeline.
 */

import path from 'node:path';
import fs from 'node:fs';

interface ValidationResult {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
}

const results: ValidationResult[] = [];

function check(name: string, condition: boolean, message: string) {
  results.push({
    name,
    status: condition ? 'pass' : 'fail',
    message,
  });
}

function checkFile(name: string, filePath: string) {
  const exists = fs.existsSync(filePath);
  check(name, exists, exists ? `✓ ${filePath}` : `✗ Missing: ${filePath}`);
  return exists;
}

function checkDir(name: string, dirPath: string) {
  const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  check(name, exists, exists ? `✓ ${dirPath}` : `✗ Missing: ${dirPath}`);
  return exists;
}

// =============================================================================
// Validation
// =============================================================================

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║  Motion Canvas Integration Validation                          ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

const mcRoot = path.resolve(__dirname, '..');
const projectRoot = path.resolve(__dirname, '../..');
const dataDir = path.join(projectRoot, 'data');

// 1. Core Structure
console.log('📁 Core Structure');
checkDir('Motion Canvas root', mcRoot);
checkDir('Data directory', dataDir);
checkDir('Scripts directory', path.join(mcRoot, 'scripts'));
checkDir('Source directory', path.join(mcRoot, 'src'));
checkDir('Output directory', path.join(mcRoot, 'output'));

console.log('\n📜 Scripts');
checkFile('Two-pass pipeline', path.join(mcRoot, 'scripts', 'mc-two-pass.ts'));
checkFile('Playwright renderer', path.join(mcRoot, 'scripts', 'mc-render.ts'));
checkFile('CLI renderer', path.join(mcRoot, 'scripts', 'mc-cli-render.ts'));
checkFile('Server module', path.join(mcRoot, 'scripts', 'mc-server.ts'));
checkFile('Renderer config', path.join(mcRoot, 'scripts', 'mc-render.config.ts'));

console.log('\n🎬 Components');
checkFile('Reveal recorder', path.join(mcRoot, 'src', 'sfx', 'reveal-recorder.ts'));
checkFile('Reveal UI', path.join(mcRoot, 'src', 'format', 'reveal-ui.tsx'));
checkFile('Project config', path.join(mcRoot, 'src', 'project.ts'));

console.log('\n📦 Dependencies');
const packageJsonPath = path.join(mcRoot, 'package.json');
if (checkFile('package.json', packageJsonPath)) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  const hasMotionCanvasCore = !!pkg.dependencies['@motion-canvas/core'];
  const hasMotionCanvas2D = !!pkg.dependencies['@motion-canvas/2d'];
  const hasPlaywright = !!pkg.devDependencies['playwright'];

  check('Motion Canvas Core', hasMotionCanvasCore,
    hasMotionCanvasCore ? '✓ Installed' : '✗ Missing');
  check('Motion Canvas 2D', hasMotionCanvas2D,
    hasMotionCanvas2D ? '✓ Installed' : '✗ Missing');
  check('Playwright', hasPlaywright,
    hasPlaywright ? '✓ Installed' : '✗ Missing');
}

console.log('\n🔗 VideoStudio Integration');
checkFile('Main package.json', path.join(projectRoot, 'package.json'));
checkFile('Beat extractor', path.join(projectRoot, 'src', 'audio', 'beat-extractor.ts'));
checkFile('SFX context pack', path.join(projectRoot, 'src', 'audio', 'sfx-context-pack.ts'));
checkFile('Audio mixer', path.join(projectRoot, 'scripts', 'build-audio-mix.ts'));

console.log('\n✅ Validation Summary\n');

// Count results
const passed = results.filter(r => r.status === 'pass').length;
const failed = results.filter(r => r.status === 'fail').length;
const warned = results.filter(r => r.status === 'warn').length;

// Print summary
for (const result of results) {
  const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️ ' : '❌';
  console.log(`${icon} ${result.name}`);
  if (result.message && result.message !== `✓ ${result.message}`) {
    console.log(`   ${result.message}`);
  }
}

console.log(`\n────────────────────────────────────────────────────────────────`);
console.log(`Passed: ${passed} | Failed: ${failed} | Warnings: ${warned}`);
console.log(`────────────────────────────────────────────────────────────────\n`);

if (failed === 0) {
  console.log('🎉 All checks passed! Motion Canvas integration is ready.\n');
  console.log('To run the two-pass pipeline:');
  console.log('  npm run mc:two-pass\n');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please verify installation.\n');
  process.exit(1);
}
