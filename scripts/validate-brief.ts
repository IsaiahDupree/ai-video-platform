#!/usr/bin/env npx tsx
/**
 * Content Brief Validator
 * 
 * Usage:
 *   npx tsx scripts/validate-brief.ts <brief.json>
 */

import path from 'path';
import fs from 'fs';
import { ContentBrief, SectionType, VideoFormat } from '../src/types';
import { getFormatIds } from '../formats';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateBrief(brief: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!brief || typeof brief !== 'object') {
    return { valid: false, errors: ['Brief must be an object'], warnings: [] };
  }

  const b = brief as Record<string, unknown>;

  // Required fields
  if (!b.id || typeof b.id !== 'string') {
    errors.push('Missing or invalid "id" field');
  }

  if (!b.format || typeof b.format !== 'string') {
    errors.push('Missing or invalid "format" field');
  } else {
    const validFormats = getFormatIds();
    if (!validFormats.includes(b.format as string)) {
      errors.push(`Invalid format "${b.format}". Valid formats: ${validFormats.join(', ')}`);
    }
  }

  if (!b.version || typeof b.version !== 'string') {
    warnings.push('Missing "version" field, defaulting to "1.0"');
  }

  // Settings validation
  if (!b.settings || typeof b.settings !== 'object') {
    errors.push('Missing or invalid "settings" object');
  } else {
    const settings = b.settings as Record<string, unknown>;
    
    if (!settings.resolution || typeof settings.resolution !== 'object') {
      errors.push('Missing or invalid "settings.resolution"');
    } else {
      const res = settings.resolution as Record<string, unknown>;
      if (typeof res.width !== 'number' || res.width < 1) {
        errors.push('Invalid "settings.resolution.width"');
      }
      if (typeof res.height !== 'number' || res.height < 1) {
        errors.push('Invalid "settings.resolution.height"');
      }
    }

    if (typeof settings.fps !== 'number' || settings.fps < 1 || settings.fps > 120) {
      errors.push('Invalid "settings.fps" (must be 1-120)');
    }

    if (typeof settings.duration_sec !== 'number' || settings.duration_sec < 1) {
      errors.push('Invalid "settings.duration_sec" (must be >= 1)');
    }

    const validAspectRatios = ['9:16', '16:9', '1:1'];
    if (!validAspectRatios.includes(settings.aspect_ratio as string)) {
      warnings.push(`Unusual aspect ratio "${settings.aspect_ratio}"`);
    }
  }

  // Style validation
  if (!b.style || typeof b.style !== 'object') {
    errors.push('Missing or invalid "style" object');
  } else {
    const style = b.style as Record<string, unknown>;
    
    const validThemes = ['dark', 'light', 'neon', 'custom'];
    if (!validThemes.includes(style.theme as string)) {
      warnings.push(`Unknown theme "${style.theme}", using "dark"`);
    }

    if (!style.primary_color || !/^#[0-9a-fA-F]{6}$/.test(style.primary_color as string)) {
      warnings.push('Invalid "style.primary_color", should be hex color');
    }
  }

  // Sections validation
  if (!Array.isArray(b.sections)) {
    errors.push('Missing or invalid "sections" array');
  } else {
    if (b.sections.length === 0) {
      errors.push('At least one section is required');
    }

    const validTypes: SectionType[] = [
      'intro', 'topic', 'comparison', 'list_item', 'outro', 'transition', 'hook', 'content', 'cta'
    ];

    (b.sections as unknown[]).forEach((section, index) => {
      if (!section || typeof section !== 'object') {
        errors.push(`Section ${index} is invalid`);
        return;
      }

      const s = section as Record<string, unknown>;

      if (!s.id || typeof s.id !== 'string') {
        errors.push(`Section ${index} missing "id"`);
      }

      if (!validTypes.includes(s.type as SectionType)) {
        errors.push(`Section ${index} has invalid type "${s.type}"`);
      }

      if (typeof s.duration_sec !== 'number' || s.duration_sec < 0.1) {
        errors.push(`Section ${index} has invalid "duration_sec"`);
      }

      if (!s.content || typeof s.content !== 'object') {
        errors.push(`Section ${index} missing "content" object`);
      }
    });

    // Check total duration matches settings
    const totalSectionDuration = (b.sections as { duration_sec: number }[])
      .reduce((sum, s) => sum + (s.duration_sec || 0), 0);
    
    const settingsDuration = (b.settings as { duration_sec: number })?.duration_sec || 0;
    
    if (Math.abs(totalSectionDuration - settingsDuration) > 0.5) {
      warnings.push(
        `Total section duration (${totalSectionDuration.toFixed(1)}s) ` +
        `differs from settings.duration_sec (${settingsDuration}s)`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 1 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Content Brief Validator

Usage:
  npx tsx scripts/validate-brief.ts <brief.json>

Arguments:
  brief.json    Path to content brief JSON file

Examples:
  npx tsx scripts/validate-brief.ts data/briefs/example_explainer.json
`);
    process.exit(0);
  }

  const briefPath = path.resolve(args[0]);

  if (!fs.existsSync(briefPath)) {
    console.error(`❌ File not found: ${briefPath}`);
    process.exit(1);
  }

  try {
    const content = fs.readFileSync(briefPath, 'utf-8');
    const brief = JSON.parse(content);
    
    console.log(`\nValidating: ${briefPath}\n`);
    
    const result = validateBrief(brief);
    
    if (result.errors.length > 0) {
      console.log('❌ Errors:');
      result.errors.forEach(e => console.log(`   - ${e}`));
    }
    
    if (result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      result.warnings.forEach(w => console.log(`   - ${w}`));
    }
    
    if (result.valid) {
      console.log('\n✅ Brief is valid!');
      process.exit(0);
    } else {
      console.log('\n❌ Brief validation failed');
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌ Failed to parse brief: ${(err as Error).message}`);
    process.exit(1);
  }
}
