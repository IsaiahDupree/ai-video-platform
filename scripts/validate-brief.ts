/**
 * CLI tool to validate content briefs
 */

import * as fs from 'fs/promises';
import { validateBrief, formatValidationErrors } from '../src/utils/validateBrief.js';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage:
  ts-node scripts/validate-brief.ts <brief-path>

Example:
  ts-node scripts/validate-brief.ts data/briefs/example-video.json
    `);
    process.exit(1);
  }

  const briefPath = args[0];

  try {
    console.log(`Validating brief: ${briefPath}\n`);

    // Read brief
    const briefContent = await fs.readFile(briefPath, 'utf-8');
    const brief = JSON.parse(briefContent);

    // Validate
    const result = validateBrief(brief);

    if (result.valid) {
      console.log('✓ Brief is valid!');
      console.log(`\nBrief: "${brief.title}"`);
      console.log(`Sections: ${brief.sections.length}`);
      console.log(`Resolution: ${brief.settings.width}x${brief.settings.height}`);
      console.log(`FPS: ${brief.settings.fps}`);
      process.exit(0);
    } else {
      console.error('✗ Brief validation failed!\n');
      console.error(formatValidationErrors(result.errors));
      process.exit(1);
    }
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
