#!/usr/bin/env tsx
/**
 * Ingest Canva Design CLI
 *
 * Ingests a Canva design and creates a template.
 *
 * Usage:
 *   npm run ingest:canva -- --design-id <designId> [options]
 *
 * Options:
 *   --design-id <id>       Canva design ID (required)
 *   --title <title>        Template title (optional)
 *   --page <index>         Page index to ingest (default: 0)
 *   --quality <quality>    Export quality: low, medium, high (default: high)
 *   --confidence <num>     Confidence threshold (0-1, default: 0.8)
 *
 * Examples:
 *   npm run ingest:canva -- --design-id DAFxxxxxx --title "Product Ad Template"
 *   npm run ingest:canva -- --design-id DAFxxxxxx --page 1 --quality medium
 */

import { createCanvaClient } from '../src/ad-templates/ingestion/canva-client';
import { createTemplateStorage } from '../src/ad-templates/ingestion/template-storage';
import { createCanvaIngestionPipeline } from '../src/ad-templates/ingestion/canva-ingestion';

interface CLIArgs {
  designId?: string;
  title?: string;
  page?: number;
  quality?: 'low' | 'medium' | 'high';
  confidence?: number;
  help?: boolean;
}

function parseArgs(): CLIArgs {
  const args: CLIArgs = {};
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    switch (arg) {
      case '--design-id':
        args.designId = argv[++i];
        break;
      case '--title':
        args.title = argv[++i];
        break;
      case '--page':
        args.page = parseInt(argv[++i], 10);
        break;
      case '--quality':
        args.quality = argv[++i] as 'low' | 'medium' | 'high';
        break;
      case '--confidence':
        args.confidence = parseFloat(argv[++i]);
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
    }
  }

  return args;
}

function printHelp() {
  console.log(`
Ingest Canva Design CLI

Usage:
  npm run ingest:canva -- --design-id <designId> [options]

Options:
  --design-id <id>       Canva design ID (required)
  --title <title>        Template title (optional)
  --page <index>         Page index to ingest (default: 0)
  --quality <quality>    Export quality: low, medium, high (default: high)
  --confidence <num>     Confidence threshold (0-1, default: 0.8)
  --help, -h             Show this help message

Examples:
  npm run ingest:canva -- --design-id DAFxxxxxx --title "Product Ad Template"
  npm run ingest:canva -- --design-id DAFxxxxxx --page 1 --quality medium

Environment Variables:
  CANVA_ACCESS_TOKEN     Canva API access token (required)
  CANVA_CLIENT_ID        Canva client ID (optional)
  CANVA_CLIENT_SECRET    Canva client secret (optional)
`);
}

async function main() {
  const args = parseArgs();

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (!args.designId) {
    console.error('❌ Error: --design-id is required');
    printHelp();
    process.exit(1);
  }

  console.log('🎨 Canva Design Ingestion\n');
  console.log(`Design ID: ${args.designId}`);
  console.log(`Page Index: ${args.page || 0}`);
  console.log(`Export Quality: ${args.quality || 'high'}`);
  console.log(`Confidence Threshold: ${args.confidence || 0.8}\n`);

  try {
    // Initialize clients
    const canvaClient = createCanvaClient();
    const storage = createTemplateStorage();
    await storage.initialize();

    // Create ingestion pipeline
    const pipeline = createCanvaIngestionPipeline(canvaClient, storage);

    // Ingest design
    const result = await pipeline.ingestDesign({
      designId: args.designId,
      pageIndex: args.page,
      title: args.title,
      exportQuality: args.quality,
      semanticConfig: {
        confidenceThreshold: args.confidence,
        inferRoles: true,
        inferConstraints: true,
      },
    });

    if (result.success) {
      console.log('\n✅ Ingestion successful!\n');
      console.log(`Template ID: ${result.templateId}`);
      console.log(`Layers: ${result.template.layers.length}`);
      console.log(`Canvas: ${result.template.canvas.width}x${result.template.canvas.height}`);
      console.log(`Reference: ${result.referencePath}`);
      console.log(`Confidence: ${result.metadata.extraction.confidence}\n`);

      // Print layer summary
      console.log('Layers:');
      result.template.layers.forEach((layer) => {
        const bindInfo =
          layer.bind?.textKey || layer.bind?.assetKey
            ? ` → ${layer.bind.textKey || layer.bind.assetKey}`
            : '';
        console.log(`  - ${layer.type} [${layer.id}]${bindInfo}`);
      });

      console.log(`\nTemplate saved to data/templates/${result.templateId}/`);
    } else {
      console.error('\n❌ Ingestion failed:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
