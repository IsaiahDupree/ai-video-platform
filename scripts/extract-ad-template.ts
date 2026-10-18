#!/usr/bin/env npx tsx
/**
 * Extract Ad Template Script
 * 
 * Uses AI vision to extract a template from a static ad image.
 * 
 * Usage:
 *   npx tsx scripts/extract-ad-template.ts --image <path-or-url>
 *   npx tsx scripts/extract-ad-template.ts --image https://example.com/ad.png --model gpt-4-vision
 *   npx tsx scripts/extract-ad-template.ts --image ./my-ad.png --output data/templates/extracted.json
 */

import fs from 'fs';
import path from 'path';
import {
  extractTemplateFromImage,
  validateExtractedTemplate,
  generateConfidenceReport,
  type ExtractionRequest,
} from '../src/ad-templates';

// =============================================================================
// Types
// =============================================================================

interface ExtractOptions {
  imagePath?: string;
  imageUrl?: string;
  output?: string;
  model?: 'gpt-4-vision' | 'claude-3-opus' | 'claude-3-sonnet';
  canvasWidth?: number;
  canvasHeight?: number;
  verbose?: boolean;
  validateOnly?: boolean;
}

// =============================================================================
// CLI Argument Parsing
// =============================================================================

function parseArgs(): ExtractOptions {
  const args = process.argv.slice(2);
  const options: ExtractOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--image':
      case '-i':
        if (next?.startsWith('http')) {
          options.imageUrl = next;
        } else {
          options.imagePath = next;
        }
        i++;
        break;
      case '--output':
      case '-o':
        options.output = next;
        i++;
        break;
      case '--model':
      case '-m':
        options.model = next as ExtractOptions['model'];
        i++;
        break;
      case '--width':
      case '-w':
        options.canvasWidth = parseInt(next, 10);
        i++;
        break;
      case '--height':
      case '-h':
        if (next && !next.startsWith('-')) {
          options.canvasHeight = parseInt(next, 10);
          i++;
        } else {
          printHelp();
          process.exit(0);
        }
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--validate':
        options.validateOnly = true;
        break;
      case '--help':
        printHelp();
        process.exit(0);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
Ad Template Extractor - Extract templates from static ad images using AI

Usage:
  npx tsx scripts/extract-ad-template.ts [options]

Options:
  -i, --image <path|url>    Path to local image or URL
  -o, --output <path>       Output template JSON path (default: stdout)
  -m, --model <model>       AI model: gpt-4-vision, claude-3-opus, claude-3-sonnet
  -w, --width <pixels>      Known canvas width (helps accuracy)
  -h, --height <pixels>     Known canvas height (helps accuracy)
  -v, --verbose             Show detailed extraction info
  --validate                Only validate an existing template (use with -i for template JSON)
  --help                    Show this help message

Environment Variables:
  OPENAI_API_KEY            Required for gpt-4-vision
  ANTHROPIC_API_KEY         Required for claude-3-* models

Examples:
  # Extract from URL
  npx tsx scripts/extract-ad-template.ts -i https://example.com/ad.png

  # Extract from local file with known dimensions
  npx tsx scripts/extract-ad-template.ts -i ./my-ad.png -w 1080 -h 1080

  # Save to file
  npx tsx scripts/extract-ad-template.ts -i ./my-ad.png -o data/templates/my-ad.json

  # Use Claude instead of GPT-4
  npx tsx scripts/extract-ad-template.ts -i ./my-ad.png -m claude-3-sonnet
`);
}

// =============================================================================
// Image Loading
// =============================================================================

async function loadImageAsBase64(imagePath: string): Promise<string> {
  const fullPath = path.resolve(process.cwd(), imagePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Image file not found: ${fullPath}`);
  }
  const buffer = fs.readFileSync(fullPath);
  return buffer.toString('base64');
}

// =============================================================================
// Main Extraction
// =============================================================================

async function extractTemplate(options: ExtractOptions): Promise<void> {
  console.log('🔍 Ad Template Extractor');
  console.log('─'.repeat(50));

  // Build extraction request
  const request: ExtractionRequest = {
    model: options.model || 'gpt-4-vision',
    options: {
      detectText: true,
      detectImages: true,
      detectShapes: true,
      semanticLabeling: true,
      inferConstraints: true,
    },
  };

  // Load image
  if (options.imageUrl) {
    console.log(`📷 Image URL: ${options.imageUrl}`);
    request.imageUrl = options.imageUrl;
  } else if (options.imagePath) {
    console.log(`📷 Image Path: ${options.imagePath}`);
    request.imageBase64 = await loadImageAsBase64(options.imagePath);
  } else {
    throw new Error('No image specified. Use --image <path|url>');
  }

  // Add canvas size if provided
  if (options.canvasWidth && options.canvasHeight) {
    request.canvasSize = {
      width: options.canvasWidth,
      height: options.canvasHeight,
    };
    console.log(`📐 Canvas Size: ${options.canvasWidth}x${options.canvasHeight}`);
  }

  console.log(`🤖 Model: ${request.model}`);
  console.log('─'.repeat(50));

  // Perform extraction
  console.log('⏳ Extracting template...');
  const startTime = Date.now();
  const result = await extractTemplateFromImage(request);
  const extractionTime = Date.now() - startTime;

  if (!result.success || !result.template) {
    console.error('❌ Extraction failed:', result.error);
    process.exit(1);
  }

  console.log(`✅ Extraction completed in ${extractionTime}ms`);
  console.log(`📊 Overall Confidence: ${(result.confidence * 100).toFixed(1)}%`);

  // Validate the extracted template
  console.log('─'.repeat(50));
  console.log('🔎 Validating template...');
  const validation = validateExtractedTemplate(result.template);

  if (!validation.valid) {
    console.error('❌ Validation errors:');
    validation.errors.forEach((e) => console.error(`   - ${e}`));
  } else {
    console.log('✅ Template is valid');
  }

  if (validation.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    validation.warnings.forEach((w) => console.log(`   - ${w}`));
  }

  // Generate confidence report
  if (options.verbose) {
    console.log('─'.repeat(50));
    console.log('📋 Confidence Report:');
    const report = generateConfidenceReport(result.template);
    console.log(`   Overall: ${(report.overallConfidence * 100).toFixed(1)}%`);
    console.log(`   High confidence layers: ${report.summary.highConfidence}`);
    console.log(`   Medium confidence layers: ${report.summary.mediumConfidence}`);
    console.log(`   Low confidence layers: ${report.summary.lowConfidence}`);
    console.log(`   Needs review: ${report.summary.needsReview ? 'Yes' : 'No'}`);

    if (report.recommendations.length > 0) {
      console.log('   Recommendations:');
      report.recommendations.forEach((r) => console.log(`     • ${r}`));
    }
  }

  // Output template
  console.log('─'.repeat(50));
  const templateJson = JSON.stringify(result.template, null, 2);

  if (options.output) {
    const outputPath = path.resolve(process.cwd(), options.output);
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(outputPath, templateJson);
    console.log(`📁 Template saved to: ${outputPath}`);
  } else {
    console.log('📄 Extracted Template:');
    console.log(templateJson);
  }

  console.log('─'.repeat(50));
  console.log('✨ Done!');

  // Summary
  console.log('');
  console.log('Template Summary:');
  console.log(`  ID: ${result.template.templateId}`);
  console.log(`  Canvas: ${result.template.canvas.width}x${result.template.canvas.height}`);
  console.log(`  Layers: ${result.template.layers.length}`);
  console.log(`  Text bindings: ${Object.keys(result.template.bindings.text).length}`);
  console.log(`  Asset bindings: ${Object.keys(result.template.bindings.assets).length}`);
}

// =============================================================================
// Validation Only Mode
// =============================================================================

async function validateTemplateFile(options: ExtractOptions): Promise<void> {
  if (!options.imagePath) {
    throw new Error('Specify template JSON path with --image for validation mode');
  }

  console.log('🔎 Template Validator');
  console.log('─'.repeat(50));

  const templatePath = path.resolve(process.cwd(), options.imagePath);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template file not found: ${templatePath}`);
  }

  const templateJson = fs.readFileSync(templatePath, 'utf-8');
  const template = JSON.parse(templateJson);

  console.log(`📄 Template: ${templatePath}`);
  console.log(`   ID: ${template.templateId}`);

  const validation = validateExtractedTemplate(template);
  const report = generateConfidenceReport(template);

  console.log('─'.repeat(50));

  if (!validation.valid) {
    console.error('❌ Validation FAILED');
    validation.errors.forEach((e) => console.error(`   Error: ${e}`));
  } else {
    console.log('✅ Validation PASSED');
  }

  if (validation.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    validation.warnings.forEach((w) => console.log(`   - ${w}`));
  }

  console.log('─'.repeat(50));
  console.log('📊 Confidence Report:');
  console.log(`   Overall: ${(report.overallConfidence * 100).toFixed(1)}%`);
  console.log(`   Needs Review: ${report.summary.needsReview ? 'Yes' : 'No'}`);

  if (report.recommendations.length > 0) {
    console.log('   Recommendations:');
    report.recommendations.forEach((r) => console.log(`     • ${r}`));
  }
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  try {
    const options = parseArgs();

    if (!options.imagePath && !options.imageUrl) {
      console.error('Error: No image specified');
      console.log('Use --help for usage information');
      process.exit(1);
    }

    if (options.validateOnly) {
      await validateTemplateFile(options);
    } else {
      await extractTemplate(options);
    }
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
