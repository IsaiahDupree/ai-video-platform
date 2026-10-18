#!/usr/bin/env node
/**
 * Two-Pass Template Extraction CLI
 *
 * Extracts a template from a reference ad image using the two-pass system:
 * Pass 1: Literal reconstruction (pixel-accurate layout)
 * Pass 2: Semantic templating (roles, constraints, variability)
 *
 * Usage:
 *   npx tsx scripts/extract-template-two-pass.ts --image path/to/ad.png
 *   npx tsx scripts/extract-template-two-pass.ts --url https://example.com/ad.png
 */

import * as fs from 'fs';
import * as path from 'path';
import { extractWithTwoPass, type TwoPassExtractionRequest } from '../src/ad-templates/extraction/two-pass-extractor';
import { generateConfidenceReport, shouldAutoApprove, requiresManualReview } from '../src/ad-templates/extraction/confidence-scorer';
import { validateTemplate } from '../src/ad-templates/schema/template-dsl';

// =============================================================================
// CLI Argument Parsing
// =============================================================================

interface CLIArgs {
  imageUrl?: string;
  imagePath?: string;
  output?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  model?: 'gpt-4-vision' | 'claude-3-opus' | 'claude-3-sonnet';
  semanticRoles?: string[];
  pass1Only?: boolean;
  verbose?: boolean;
}

function parseArgs(): CLIArgs {
  const args: CLIArgs = {};

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    const next = process.argv[i + 1];

    switch (arg) {
      case '--url':
        args.imageUrl = next;
        i++;
        break;
      case '--image':
      case '--path':
        args.imagePath = next;
        i++;
        break;
      case '--output':
      case '-o':
        args.output = next;
        i++;
        break;
      case '--width':
        args.canvasWidth = parseInt(next, 10);
        i++;
        break;
      case '--height':
        args.canvasHeight = parseInt(next, 10);
        i++;
        break;
      case '--model':
        args.model = next as any;
        i++;
        break;
      case '--roles':
        args.semanticRoles = next.split(',').map((r) => r.trim());
        i++;
        break;
      case '--pass1-only':
        args.pass1Only = true;
        break;
      case '--verbose':
      case '-v':
        args.verbose = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  return args;
}

function printHelp() {
  console.log(`
Two-Pass Template Extraction CLI

Usage:
  npx tsx scripts/extract-template-two-pass.ts [options]

Options:
  --url <url>           URL of the reference ad image
  --image <path>        Local path to the reference ad image
  --output, -o <path>   Output path for the template JSON (default: auto-generated)
  --width <px>          Canvas width (if not auto-detected)
  --height <px>         Canvas height (if not auto-detected)
  --model <model>       AI model to use (gpt-4-vision, claude-3-opus, claude-3-sonnet)
  --roles <roles>       Comma-separated list of expected semantic roles (e.g., "headline,cta,hero")
  --pass1-only          Run Pass 1 only (literal reconstruction, skip semantic analysis)
  --verbose, -v         Verbose output
  --help, -h            Show this help message

Examples:
  # Extract from URL
  npx tsx scripts/extract-template-two-pass.ts --url https://example.com/ad.png

  # Extract from local file
  npx tsx scripts/extract-template-two-pass.ts --image public/assets/reference-ad.png

  # With semantic hints
  npx tsx scripts/extract-template-two-pass.ts --image ad.png --roles "headline,subhead,cta,hero,logo"

  # Pass 1 only (no semantic analysis)
  npx tsx scripts/extract-template-two-pass.ts --image ad.png --pass1-only

Environment Variables:
  OPENAI_API_KEY        OpenAI API key (for GPT-4 Vision)
  ANTHROPIC_API_KEY     Anthropic API key (for Claude Vision)
`);
}

// =============================================================================
// Image Loading
// =============================================================================

async function loadImageAsBase64(imagePath: string): Promise<string> {
  const buffer = fs.readFileSync(imagePath);
  return buffer.toString('base64');
}

// =============================================================================
// Main Execution
// =============================================================================

async function main() {
  console.log('🎨 Two-Pass Template Extraction\n');

  const args = parseArgs();

  // Validate input
  if (!args.imageUrl && !args.imagePath) {
    console.error('❌ Error: Must provide --url or --image');
    console.error('Run with --help for usage information');
    process.exit(1);
  }

  // Check API key
  const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: No API key found');
    console.error('Set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable');
    process.exit(1);
  }

  // Prepare request
  const request: TwoPassExtractionRequest = {
    imageUrl: args.imageUrl,
    imageBase64: args.imagePath ? await loadImageAsBase64(args.imagePath) : undefined,
    canvasSize: args.canvasWidth && args.canvasHeight
      ? { width: args.canvasWidth, height: args.canvasHeight }
      : undefined,
    model: args.model || 'gpt-4-vision',
    twoPass: {
      enablePass2: !args.pass1Only,
      semanticGuidance: args.semanticRoles,
      identifyGroups: true,
      inferConstraints: true,
      classifyVariability: true,
    },
  };

  console.log(`📸 Source: ${args.imageUrl || args.imagePath}`);
  console.log(`🤖 Model: ${request.model}`);
  console.log(`🔄 Mode: ${args.pass1Only ? 'Pass 1 only' : 'Two-pass (full)'}`);
  if (args.semanticRoles) {
    console.log(`🏷️  Expected roles: ${args.semanticRoles.join(', ')}`);
  }
  console.log();

  // Execute extraction
  const startTime = Date.now();
  const result = await extractWithTwoPass(request);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  if (!result.success) {
    console.error(`❌ Extraction failed: ${result.error}`);
    process.exit(1);
  }

  console.log(`\n⏱️  Extraction completed in ${duration}s`);
  console.log(`📊 Overall confidence: ${(result.confidence * 100).toFixed(1)}%`);

  // Display Pass 1 results
  if (args.verbose) {
    console.log(`\n📋 Pass 1 Results:`);
    console.log(`   Canvas: ${result.pass1.canvas.width}x${result.pass1.canvas.height}`);
    console.log(`   Elements: ${result.pass1.literalElements.length}`);
    console.log(`   Confidence: ${(result.pass1.confidence * 100).toFixed(1)}%`);
  }

  // Display Pass 2 results
  if (result.pass2 && args.verbose) {
    console.log(`\n📋 Pass 2 Results:`);
    console.log(`   Semantic roles: ${Object.keys(result.pass2.semanticMapping.roles).length}`);
    console.log(`   Variable layers: ${result.pass2.semanticMapping.variableLayers.length}`);
    console.log(`   Fixed layers: ${result.pass2.semanticMapping.fixedLayers.length}`);
    console.log(`   Confidence: ${(result.pass2.confidence * 100).toFixed(1)}%`);
  }

  // Validate template
  if (result.template) {
    console.log('\n🔍 Validating template...');
    try {
      validateTemplate(result.template);
      console.log('✅ Template schema valid');
    } catch (error) {
      console.error('⚠️  Template validation failed:', error instanceof Error ? error.message : error);
    }

    // Generate confidence report
    const confidenceReport = generateConfidenceReport(result.template);
    console.log('\n📊 Confidence Report:');
    console.log(`   High confidence: ${confidenceReport.summary.highConfidence} layers`);
    console.log(`   Medium confidence: ${confidenceReport.summary.mediumConfidence} layers`);
    console.log(`   Low confidence: ${confidenceReport.summary.lowConfidence} layers`);

    if (shouldAutoApprove(result.template)) {
      console.log('   ✅ Auto-approve: YES');
    } else if (requiresManualReview(result.template)) {
      console.log('   ⚠️  Manual review: REQUIRED');
    } else {
      console.log('   ⚠️  Manual review: RECOMMENDED');
    }

    if (confidenceReport.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      confidenceReport.recommendations.forEach((rec) => {
        console.log(`   - ${rec}`);
      });
    }

    // Save template
    const outputPath = args.output || `data/templates/extracted_${Date.now()}.json`;
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(result.template, null, 2));
    console.log(`\n💾 Template saved: ${outputPath}`);

    // Save detailed report (if verbose)
    if (args.verbose) {
      const reportPath = outputPath.replace('.json', '.report.json');
      fs.writeFileSync(
        reportPath,
        JSON.stringify(
          {
            extraction: result,
            confidenceReport,
          },
          null,
          2
        )
      );
      console.log(`📄 Detailed report saved: ${reportPath}`);
    }
  }

  console.log('\n✅ Done!\n');
}

// =============================================================================
// Execute
// =============================================================================

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
