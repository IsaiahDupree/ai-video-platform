/**
 * Canva Integration Example
 *
 * Complete example demonstrating the Canva ingestion pipeline:
 * 1. Ingest Canva design
 * 2. Convert to TemplateDSL
 * 3. Export reference PNG
 * 4. Store template
 * 5. List and search templates
 * 6. Generate variants
 */

import { createCanvaClient } from '../src/ad-templates/ingestion/canva-client';
import { createTemplateStorage } from '../src/ad-templates/ingestion/template-storage';
import { createCanvaIngestionPipeline } from '../src/ad-templates/ingestion/canva-ingestion';

/**
 * Example 1: Ingest a single Canva design
 */
async function example1_ingestSingleDesign() {
  console.log('\n=== Example 1: Ingest Single Canva Design ===\n');

  // Initialize clients
  const canvaClient = createCanvaClient({
    accessToken: process.env.CANVA_ACCESS_TOKEN,
  });

  const storage = createTemplateStorage({
    storageDir: './data/templates',
  });
  await storage.initialize();

  // Create ingestion pipeline
  const pipeline = createCanvaIngestionPipeline(canvaClient, storage);

  // Ingest design
  const result = await pipeline.ingestDesign({
    designId: 'DAFxxxxxx', // Replace with your Canva design ID
    title: 'Product Ad Template',
    pageIndex: 0,
    exportQuality: 'high',
    semanticConfig: {
      confidenceThreshold: 0.8,
      inferRoles: true,
      inferConstraints: true,
    },
  });

  if (result.success) {
    console.log('✅ Success!');
    console.log('Template ID:', result.templateId);
    console.log('Layers:', result.template.layers.length);
    console.log('Canvas:', `${result.template.canvas.width}x${result.template.canvas.height}`);
    console.log('Confidence:', result.metadata.extraction.confidence);
    console.log('Reference:', result.referencePath);

    // Print layer details
    console.log('\nLayers:');
    result.template.layers.forEach((layer, i) => {
      const bind = layer.bind?.textKey || layer.bind?.assetKey || 'none';
      console.log(
        `  ${i + 1}. ${layer.type} [${layer.id}] → ${bind} (z: ${layer.z})`
      );
    });
  } else {
    console.error('❌ Failed:', result.error);
  }
}

/**
 * Example 2: Ingest multiple pages from a design
 */
async function example2_ingestMultiplePages() {
  console.log('\n=== Example 2: Ingest Multiple Pages ===\n');

  const canvaClient = createCanvaClient();
  const storage = createTemplateStorage();
  await storage.initialize();
  const pipeline = createCanvaIngestionPipeline(canvaClient, storage);

  // Ingest pages 0, 1, and 2
  const results = await pipeline.ingestMultiplePages('DAFxxxxxx', {
    pageIndices: [0, 1, 2],
    titlePrefix: 'Ad Template - Page',
    exportQuality: 'high',
  });

  console.log(`Ingested ${results.length} pages:`);
  results.forEach((result, i) => {
    if (result.success) {
      console.log(`  ✅ Page ${i}: ${result.templateId} (${result.template.layers.length} layers)`);
    } else {
      console.log(`  ❌ Page ${i}: ${result.error}`);
    }
  });
}

/**
 * Example 3: List and search templates
 */
async function example3_searchTemplates() {
  console.log('\n=== Example 3: Search Templates ===\n');

  const storage = createTemplateStorage();
  await storage.initialize();

  // List all templates
  console.log('All templates:');
  const allTemplates = await storage.listTemplates();
  allTemplates.forEach((template) => {
    console.log(
      `  - ${template.title} (${template.templateId}) - ${template.canvas.width}x${template.canvas.height}`
    );
  });

  // Search for Canva templates
  console.log('\nCanva templates:');
  const canvaTemplates = await storage.searchTemplates({
    sourceType: 'canva_design',
    minConfidence: 0.8,
  });
  canvaTemplates.forEach((template) => {
    console.log(
      `  - ${template.title} (confidence: ${template.extraction.confidence})`
    );
  });

  // Search by specific design ID
  console.log('\nTemplates from specific design:');
  const designTemplates = await storage.searchTemplates({
    canvaDesignId: 'DAFxxxxxx',
  });
  designTemplates.forEach((template) => {
    console.log(`  - ${template.title} (page: ${template.source.canvaPageId})`);
  });
}

/**
 * Example 4: Load and inspect a template
 */
async function example4_inspectTemplate() {
  console.log('\n=== Example 4: Inspect Template ===\n');

  const storage = createTemplateStorage();
  await storage.initialize();

  // Load template
  const templateId = 'canva_page_1_1234567890'; // Replace with actual template ID
  const stored = await storage.loadTemplate(templateId);

  if (!stored) {
    console.log('Template not found');
    return;
  }

  console.log('Template:', stored.metadata.title);
  console.log('Source:', stored.metadata.source.type);
  console.log('Confidence:', stored.metadata.extraction.confidence);
  console.log('Canvas:', `${stored.template.canvas.width}x${stored.template.canvas.height}`);
  console.log('Reference:', stored.referencePath || 'none');

  console.log('\nText Bindings:');
  Object.entries(stored.template.bindings?.text || {}).forEach(([key, value]) => {
    console.log(`  ${key}: "${value}"`);
  });

  console.log('\nAsset Bindings:');
  Object.entries(stored.template.bindings?.assets || {}).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });

  console.log('\nLayers:');
  stored.template.layers.forEach((layer) => {
    const details: string[] = [
      `type: ${layer.type}`,
      `z: ${layer.z}`,
      `rect: ${layer.rect.x},${layer.rect.y} ${layer.rect.w}x${layer.rect.h}`,
    ];

    if (layer.type === 'text') {
      const textLayer = layer as any;
      details.push(`font: ${textLayer.text?.fontFamily} ${textLayer.text?.fontSize}px`);
      details.push(`align: ${textLayer.text?.align}`);
    }

    if (layer.type === 'image') {
      const imageLayer = layer as any;
      details.push(`fit: ${imageLayer.image?.fit}`);
    }

    if (layer.type === 'shape') {
      const shapeLayer = layer as any;
      details.push(`shape: ${shapeLayer.shape?.kind}`);
      details.push(`fill: ${shapeLayer.shape?.fill}`);
    }

    if (layer.bind) {
      details.push(`bind: ${layer.bind.textKey || layer.bind.assetKey}`);
    }

    console.log(`  ${layer.id}: ${details.join(', ')}`);
  });
}

/**
 * Example 5: Update reference image
 */
async function example5_updateReferenceImage() {
  console.log('\n=== Example 5: Update Reference Image ===\n');

  const canvaClient = createCanvaClient();
  const storage = createTemplateStorage();
  await storage.initialize();
  const pipeline = createCanvaIngestionPipeline(canvaClient, storage);

  // Update reference for an existing template
  const templateId = 'canva_page_1_1234567890'; // Replace with actual template ID

  console.log(`Updating reference image for ${templateId}...`);

  await pipeline.updateReferenceImage(templateId, {
    exportQuality: 'high',
  });

  console.log('✅ Reference image updated!');
}

/**
 * Example 6: Generate template variants
 */
async function example6_generateVariants() {
  console.log('\n=== Example 6: Generate Template Variants ===\n');

  const storage = createTemplateStorage();
  await storage.initialize();

  // Load template
  const templateId = 'canva_page_1_1234567890'; // Replace with actual template ID
  const stored = await storage.loadTemplate(templateId);

  if (!stored) {
    console.log('Template not found');
    return;
  }

  // Create variants with different copy
  const copyVariants = [
    {
      variantId: 'variant_1',
      textOverrides: {
        headline: 'Summer Sale - 50% Off',
        subheadline: 'Limited time offer',
        cta: 'Shop Now',
      },
    },
    {
      variantId: 'variant_2',
      textOverrides: {
        headline: 'New Collection',
        subheadline: 'Discover the latest styles',
        cta: 'Explore',
      },
    },
    {
      variantId: 'variant_3',
      textOverrides: {
        headline: 'Free Shipping',
        subheadline: 'On orders over $50',
        cta: 'Get Started',
      },
    },
  ];

  console.log('Variants:');
  copyVariants.forEach((variant) => {
    console.log(`\n${variant.variantId}:`);
    Object.entries(variant.textOverrides).forEach(([key, value]) => {
      console.log(`  ${key}: "${value}"`);
    });
  });

  console.log('\nTo render these variants, use:');
  console.log('  npm run ad:render -- --template-id <templateId> --variant-id <variantId>');
}

/**
 * Example 7: Complete workflow
 */
async function example7_completeWorkflow() {
  console.log('\n=== Example 7: Complete Workflow ===\n');

  // 1. Ingest design
  console.log('Step 1: Ingest Canva design...');
  const canvaClient = createCanvaClient();
  const storage = createTemplateStorage();
  await storage.initialize();
  const pipeline = createCanvaIngestionPipeline(canvaClient, storage);

  const result = await pipeline.ingestDesign({
    designId: 'DAFxxxxxx',
    title: 'Product Ad Template',
    exportQuality: 'high',
  });

  if (!result.success) {
    console.error('❌ Ingestion failed:', result.error);
    return;
  }

  console.log('✅ Template ingested:', result.templateId);

  // 2. Verify storage
  console.log('\nStep 2: Verify template storage...');
  const stored = await storage.loadTemplate(result.templateId);
  if (stored) {
    console.log('✅ Template stored successfully');
    console.log(`  - Metadata: ${stored.referencePath ? 'yes' : 'no'}`);
    console.log(`  - Reference: ${stored.referencePath ? 'yes' : 'no'}`);
  }

  // 3. Inspect template
  console.log('\nStep 3: Inspect template structure...');
  console.log(`  - Canvas: ${result.template.canvas.width}x${result.template.canvas.height}`);
  console.log(`  - Layers: ${result.template.layers.length}`);
  console.log(`  - Text bindings: ${Object.keys(result.template.bindings?.text || {}).length}`);
  console.log(`  - Asset bindings: ${Object.keys(result.template.bindings?.assets || {}).length}`);

  // 4. List all templates
  console.log('\nStep 4: List all templates...');
  const allTemplates = await storage.listTemplates();
  console.log(`✅ Total templates: ${allTemplates.length}`);

  console.log('\n✅ Workflow complete!');
}

/**
 * Main function - run all examples
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Canva Integration Examples');
  console.log('='.repeat(60));

  try {
    // Uncomment the examples you want to run:

    // await example1_ingestSingleDesign();
    // await example2_ingestMultiplePages();
    // await example3_searchTemplates();
    // await example4_inspectTemplate();
    // await example5_updateReferenceImage();
    // await example6_generateVariants();
    await example7_completeWorkflow();

    console.log('\n' + '='.repeat(60));
    console.log('Examples completed!');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export {
  example1_ingestSingleDesign,
  example2_ingestMultiplePages,
  example3_searchTemplates,
  example4_inspectTemplate,
  example5_updateReferenceImage,
  example6_generateVariants,
  example7_completeWorkflow,
};
