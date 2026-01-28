/**
 * IMG-004: Scene Image Library Management
 * Helper script for managing scene images
 */

import * as fs from 'fs/promises';
import * as path from 'path';

const SCENES_DIR = 'public/assets/scenes';
const MANIFEST_PATH = path.join(SCENES_DIR, 'manifest.json');

const CATEGORIES = [
  'backgrounds',
  'characters',
  'objects',
  'overlays',
  'products',
  'tech',
  'nature',
  'abstract',
];

interface SceneMetadata {
  path: string;
  description: string;
  tags: string[];
  category: string;
  resolution?: string;
  format: string;
  size?: string;
  source: string;
  license: string;
  created: string;
  usage_count: number;
}

interface Manifest {
  version: string;
  lastUpdated: string;
  categories: string[];
  scenes: Record<string, SceneMetadata>;
  stats: {
    total_images: number;
    by_category: Record<string, number>;
    total_size: string;
  };
}

/**
 * Load the scene manifest
 */
async function loadManifest(): Promise<Manifest> {
  try {
    const content = await fs.readFile(MANIFEST_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error loading manifest:', error);
    throw error;
  }
}

/**
 * Save the scene manifest
 */
async function saveManifest(manifest: Manifest): Promise<void> {
  manifest.lastUpdated = new Date().toISOString().split('T')[0];
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

/**
 * Scan the scenes directory and update stats
 */
async function scanScenes(): Promise<void> {
  console.log('Scanning scene library...\n');

  const manifest = await loadManifest();
  const stats = {
    total_images: 0,
    by_category: {} as Record<string, number>,
    total_size: '0MB',
  };

  // Initialize category counts
  for (const category of CATEGORIES) {
    stats.by_category[category] = 0;
  }

  let totalBytes = 0;

  // Scan each category
  for (const category of CATEGORIES) {
    const categoryPath = path.join(SCENES_DIR, category);

    try {
      const files = await fs.readdir(categoryPath);

      for (const file of files) {
        // Skip hidden files and README
        if (file.startsWith('.') || file === 'README.md') continue;

        const filePath = path.join(categoryPath, file);
        const stat = await fs.stat(filePath);

        if (stat.isFile()) {
          stats.total_images++;
          stats.by_category[category]++;
          totalBytes += stat.size;

          console.log(`  ${category}/${file} - ${formatBytes(stat.size)}`);
        }
      }
    } catch (error) {
      console.error(`Error scanning ${category}:`, error);
    }
  }

  stats.total_size = formatBytes(totalBytes);

  // Update manifest
  manifest.stats = stats;
  await saveManifest(manifest);

  console.log('\n' + '='.repeat(60));
  console.log('Scene Library Statistics');
  console.log('='.repeat(60));
  console.log(`Total images: ${stats.total_images}`);
  console.log(`Total size: ${stats.total_size}`);
  console.log('\nBy category:');

  for (const category of CATEGORIES) {
    const count = stats.by_category[category];
    if (count > 0) {
      console.log(`  ${category}: ${count}`);
    }
  }

  console.log('='.repeat(60) + '\n');
}

/**
 * List all scenes in a category
 */
async function listScenes(category?: string): Promise<void> {
  const categoriesToList = category ? [category] : CATEGORIES;

  console.log('\nScene Library Contents\n');

  for (const cat of categoriesToList) {
    if (!CATEGORIES.includes(cat)) {
      console.error(`Invalid category: ${cat}`);
      continue;
    }

    const categoryPath = path.join(SCENES_DIR, cat);

    try {
      const files = await fs.readdir(categoryPath);
      const imageFiles = files.filter(
        f => !f.startsWith('.') && f !== 'README.md'
      );

      if (imageFiles.length > 0) {
        console.log(`\n${cat}/ (${imageFiles.length} images)`);
        console.log('-'.repeat(60));

        for (const file of imageFiles) {
          const filePath = path.join(categoryPath, file);
          const stat = await fs.stat(filePath);
          console.log(`  ${file.padEnd(40)} ${formatBytes(stat.size)}`);
        }
      }
    } catch (error) {
      console.error(`Error listing ${cat}:`, error);
    }
  }

  console.log('');
}

/**
 * Add metadata for a scene
 */
async function addSceneMetadata(
  sceneId: string,
  metadata: Partial<SceneMetadata>
): Promise<void> {
  const manifest = await loadManifest();

  const fullMetadata: SceneMetadata = {
    path: metadata.path || '',
    description: metadata.description || '',
    tags: metadata.tags || [],
    category: metadata.category || 'backgrounds',
    format: metadata.format || path.extname(metadata.path || '').slice(1),
    source: metadata.source || 'manual',
    license: metadata.license || 'custom',
    created: metadata.created || new Date().toISOString().split('T')[0],
    usage_count: metadata.usage_count || 0,
    resolution: metadata.resolution,
    size: metadata.size,
  };

  manifest.scenes[sceneId] = fullMetadata;
  await saveManifest(manifest);

  console.log(`✓ Added metadata for scene: ${sceneId}`);
}

/**
 * Search scenes by tag or description
 */
async function searchScenes(query: string): Promise<void> {
  const manifest = await loadManifest();
  const results: Array<[string, SceneMetadata]> = [];

  for (const [id, scene] of Object.entries(manifest.scenes)) {
    if (id === '_example') continue;

    const searchText = [
      id,
      scene.description,
      ...scene.tags,
      scene.category,
    ].join(' ').toLowerCase();

    if (searchText.includes(query.toLowerCase())) {
      results.push([id, scene]);
    }
  }

  console.log(`\nSearch results for "${query}":\n`);

  if (results.length === 0) {
    console.log('No scenes found.');
  } else {
    for (const [id, scene] of results) {
      console.log(`${id}`);
      console.log(`  Path: ${scene.path}`);
      console.log(`  Description: ${scene.description}`);
      console.log(`  Tags: ${scene.tags.join(', ')}`);
      console.log(`  Category: ${scene.category}`);
      console.log('');
    }
  }
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * CLI usage
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help') {
    console.log(`
Scene Library Management Tool

Usage:
  npm run manage-scenes <command> [options]

Commands:
  scan                   Scan directory and update stats
  list [category]        List all scenes (or specific category)
  search <query>         Search scenes by tag or description
  add <id> <path>        Add scene metadata
  help                   Show this help message

Examples:
  # Scan and update statistics
  npm run manage-scenes scan

  # List all scenes
  npm run manage-scenes list

  # List backgrounds only
  npm run manage-scenes list backgrounds

  # Search for scenes
  npm run manage-scenes search "office"

  # Add scene metadata
  npm run manage-scenes add office-modern backgrounds/office.jpg
    `);
    return;
  }

  try {
    switch (command) {
      case 'scan':
        await scanScenes();
        break;

      case 'list':
        await listScenes(args[1]);
        break;

      case 'search':
        if (!args[1]) {
          console.error('Error: Search query required');
          process.exit(1);
        }
        await searchScenes(args[1]);
        break;

      case 'add':
        if (!args[1] || !args[2]) {
          console.error('Error: Scene ID and path required');
          process.exit(1);
        }
        await addSceneMetadata(args[1], {
          path: args[2],
          category: path.dirname(args[2]),
        });
        break;

      default:
        console.error(`Unknown command: ${command}`);
        console.log('Run "npm run manage-scenes help" for usage');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}
