#!/usr/bin/env tsx

/**
 * CLI tool for uploading reference ad images and extracting templates
 *
 * Usage:
 *   npm run upload-reference-ad -- <image-path> [options]
 *
 * Examples:
 *   npm run upload-reference-ad -- ./my-ad.png
 *   npm run upload-reference-ad -- ./my-ad.jpg --name "Product Ad" --extract
 *   npm run upload-reference-ad -- ./my-ad.png --extract --model claude-3-opus
 */

import { promises as fs } from 'fs';
import path from 'path';
import { uploadReferenceImage, listUploadedImages } from '../src/ad-templates/ingestion/image-uploader';
import { extractTemplateFromImage } from '../src/ad-templates/extraction/ai-extractor';
import { validateExtractedTemplate } from '../src/ad-templates/extraction/ai-extractor';

// =============================================================================
// CLI Argument Parsing
// =============================================================================

interface CLIArgs {
  imagePath?: string;
  name?: string;
  description?: string;
  tags?: string[];
  extract?: boolean;
  model?: 'gpt-4-vision' | 'claude-3-opus' | 'claude-3-sonnet';
  list?: boolean;
  help?: boolean;
}

function parseArgs(argv: string[]): CLIArgs {
  const args: CLIArgs = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--list' || arg === '-l') {
      args.list = true;
    } else if (arg === '--extract' || arg === '-e') {
      args.extract = true;
    } else if (arg === '--name' || arg === '-n') {
      args.name = argv[++i];
    } else if (arg === '--description' || arg === '-d') {
      args.description = argv[++i];
    } else if (arg === '--tags' || arg === '-t') {
      args.tags = argv[++i]?.split(',').map(t => t.trim());
    } else if (arg === '--model' || arg === '-m') {
      args.model = argv[++i] as CLIArgs['model'];
    } else if (!arg.startsWith('-')) {
      args.imagePath = arg;
    }
  }

  return args;
}

// =============================================================================
// Help Text
// =============================================================================

const HELP_TEXT = `
Upload Reference Ad Image

Upload a PNG/JPG reference ad for AI layout extraction and template generation.

USAGE:
  npm run upload-reference-ad -- <image-path> [options]

OPTIONS:
  -h, --help                 Show this help message
  -l, --list                 List all uploaded images
  -e, --extract              Extract template after upload
  -n, --name <name>          Name for the uploaded image
  -d, --description <desc>   Description of the ad
  -t, --tags <tags>          Comma-separated tags
  -m, --model <model>        AI model for extraction (gpt-4-vision, claude-3-opus, claude-3-sonnet)

EXAMPLES:
  # Upload an image
  npm run upload-reference-ad -- ./my-ad.png

  # Upload with metadata
  npm run upload-reference-ad -- ./my-ad.jpg --name "Product Ad" --tags "product,launch,v1"

  # Upload and extract template
  npm run upload-reference-ad -- ./my-ad.png --extract

  # Upload and extract with Claude Opus
  npm run upload-reference-ad -- ./my-ad.png --extract --model claude-3-opus

  # List all uploaded images
  npm run upload-reference-ad -- --list

SUPPORTED FORMATS:
  - PNG (.png)
  - JPEG (.jpg, .jpeg)

STANDARD AD SIZES:
  - 1080x1080 (Instagram Feed)
  - 1080x1920 (Instagram Story)
  - 1200x628  (Facebook Feed)
  - 1200x1200 (Facebook Marketplace)
  - 1080x1350 (Instagram Portrait)

ENVIRONMENT VARIABLES:
  UPLOAD_DIR         Upload directory (default: public/assets/uploads/reference-ads)
  OPENAI_API_KEY     Required for --extract with gpt-4-vision
  ANTHROPIC_API_KEY  Required for --extract with claude models
`;

// =============================================================================
// Main Functions
// =============================================================================

async function uploadImage(args: CLIArgs): Promise<void> {
  if (!args.imagePath) {
    console.error('Error: Image path required');
    console.log(HELP_TEXT);
    process.exit(1);
  }

  console.log(`📤 Uploading reference ad: ${args.imagePath}`);

  try {
    // Read file
    const absolutePath = path.resolve(args.imagePath);
    const buffer = await fs.readFile(absolutePath);
    const filename = path.basename(absolutePath);

    // Upload
    const result = await uploadReferenceImage({
      fileBuffer: buffer,
      filename,
      metadata: {
        name: args.name,
        description: args.description,
        tags: args.tags,
      },
    });

    if (!result.success) {
      console.error(`❌ Upload failed: ${result.error}`);
      process.exit(1);
    }

    console.log(`✅ Upload successful!`);
    console.log(`   Image ID: ${result.imageId}`);
    console.log(`   File Path: ${result.filePath}`);
    if (result.dimensions) {
      console.log(`   Dimensions: ${result.dimensions.width}x${result.dimensions.height}`);
    }
    console.log(`   File Size: ${(result.fileSize! / 1024).toFixed(2)} KB`);
    console.log(`   MIME Type: ${result.mimeType}`);

    if (result.warnings && result.warnings.length > 0) {
      console.log(`\n⚠️  Warnings:`);
      result.warnings.forEach(w => console.log(`   - ${w}`));
    }

    // Extract template if requested
    if (args.extract && result.imageId && result.filePath) {
      console.log(`\n🤖 Extracting template...`);
      await extractTemplate(result.imageId, result.filePath, args.model);
    }

  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

async function extractTemplate(imageId: string, imagePath: string, model?: CLIArgs['model']): Promise<void> {
  try {
    // Read image as base64
    const buffer = await fs.readFile(imagePath);
    const base64 = buffer.toString('base64');

    // Extract template
    const extractionResult = await extractTemplateFromImage({
      imageBase64: base64,
      model: model || 'gpt-4-vision',
      options: {
        detectText: true,
        detectImages: true,
        detectShapes: true,
        semanticLabeling: true,
        inferConstraints: true,
      },
    });

    if (!extractionResult.success) {
      console.error(`❌ Extraction failed: ${extractionResult.error}`);
      return;
    }

    console.log(`✅ Template extracted successfully!`);
    console.log(`   Confidence: ${(extractionResult.confidence * 100).toFixed(1)}%`);
    console.log(`   Elements: ${extractionResult.elements?.length || 0}`);

    if (extractionResult.template) {
      // Validate template
      const validation = validateExtractedTemplate(extractionResult.template);

      if (!validation.valid) {
        console.log(`\n❌ Template validation failed:`);
        validation.errors.forEach(e => console.log(`   - ${e}`));
      } else {
        console.log(`\n✅ Template validation passed`);
      }

      if (validation.warnings.length > 0) {
        console.log(`\n⚠️  Validation warnings:`);
        validation.warnings.forEach(w => console.log(`   - ${w}`));
      }

      // Save template
      const templateDir = 'data/templates';
      await fs.mkdir(templateDir, { recursive: true });
      const templatePath = path.join(templateDir, `${imageId}.template.json`);
      await fs.writeFile(templatePath, JSON.stringify(extractionResult.template, null, 2));
      console.log(`\n💾 Template saved: ${templatePath}`);

      // Show layer summary
      console.log(`\n📋 Layer Summary:`);
      extractionResult.template.layers.forEach(layer => {
        const typeEmoji = layer.type === 'text' ? '📝' : layer.type === 'image' ? '🖼️' : '🔷';
        console.log(`   ${typeEmoji} ${layer.id} (${layer.type}) @ z=${layer.z}`);
      });
    }

  } catch (error) {
    console.error(`❌ Extraction error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function listImages(): Promise<void> {
  console.log(`📋 Uploaded Reference Ads:\n`);

  try {
    const images = await listUploadedImages();

    if (images.length === 0) {
      console.log('   No images uploaded yet.');
      return;
    }

    images.forEach((img, index) => {
      console.log(`${index + 1}. ${img.metadata?.name || img.filename}`);
      console.log(`   ID: ${img.imageId}`);
      console.log(`   Dimensions: ${img.dimensions.width}x${img.dimensions.height}`);
      console.log(`   Size: ${(img.fileSize / 1024).toFixed(2)} KB`);
      console.log(`   Uploaded: ${new Date(img.uploadedAt).toLocaleString()}`);
      if (img.metadata?.tags) {
        console.log(`   Tags: ${img.metadata.tags.join(', ')}`);
      }
      console.log('');
    });

    console.log(`Total: ${images.length} image(s)`);

  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

// =============================================================================
// CLI Entry Point
// =============================================================================

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(HELP_TEXT);
    return;
  }

  if (args.list) {
    await listImages();
    return;
  }

  if (!args.imagePath) {
    console.error('Error: Image path required (or use --list to view uploaded images)');
    console.log(HELP_TEXT);
    process.exit(1);
  }

  await uploadImage(args);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
