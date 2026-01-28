/**
 * Voice Reference Management CLI - VC-005
 * Command-line tool for managing voice references
 *
 * Usage:
 *   ts-node scripts/manage-voices.ts list
 *   ts-node scripts/manage-voices.ts add --id my-voice --name "My Voice" --category male
 *   ts-node scripts/manage-voices.ts search --category female
 *   ts-node scripts/manage-voices.ts info my-voice
 */

import { VoiceReferenceManager } from '../src/services/voiceReference';
import { VoiceReference } from '../src/types/voiceReference';

const manager = new VoiceReferenceManager();

/**
 * List all voice references
 */
function listVoices() {
  const voices = manager.listVoiceReferences();

  if (voices.length === 0) {
    console.log('No voice references found.');
    console.log('\nAdd a voice reference with:');
    console.log('  ts-node scripts/manage-voices.ts add --id my-voice --name "My Voice"');
    return;
  }

  console.log(`Voice References (${voices.length} total)\n`);

  voices.forEach((voice) => {
    console.log(`${voice.id} - ${voice.name}`);
    console.log(`  Category: ${voice.category}`);
    console.log(`  Source: ${voice.source.type}`);
    if (voice.description) {
      console.log(`  Description: ${voice.description}`);
    }
    if (voice.audioFiles.length > 0) {
      console.log(`  Audio files: ${voice.audioFiles.length}`);
    }
    if (voice.stats?.timesUsed) {
      console.log(`  Used: ${voice.stats.timesUsed} times`);
    }
    console.log('');
  });
}

/**
 * Show detailed info about a voice
 */
function showVoiceInfo(id: string) {
  const voice = manager.getVoiceReference(id);

  if (!voice) {
    console.error(`Voice reference not found: ${id}`);
    process.exit(1);
  }

  console.log(`Voice Reference: ${voice.name}`);
  console.log('='.repeat(50));
  console.log(`ID: ${voice.id}`);
  console.log(`Category: ${voice.category}`);
  if (voice.description) {
    console.log(`Description: ${voice.description}`);
  }
  console.log('');

  console.log('Characteristics:');
  if (voice.characteristics) {
    if (voice.characteristics.age) console.log(`  Age: ${voice.characteristics.age}`);
    if (voice.characteristics.accent) console.log(`  Accent: ${voice.characteristics.accent}`);
    if (voice.characteristics.pitch) console.log(`  Pitch: ${voice.characteristics.pitch}`);
    if (voice.characteristics.tone) {
      console.log(`  Tone: ${voice.characteristics.tone.join(', ')}`);
    }
  } else {
    console.log('  None specified');
  }
  console.log('');

  console.log('Source:');
  console.log(`  Type: ${voice.source.type}`);
  if (voice.source.elevenLabsVoiceId) {
    console.log(`  ElevenLabs Voice ID: ${voice.source.elevenLabsVoiceId}`);
  }
  if (voice.source.attribution) {
    console.log(`  Attribution: ${voice.source.attribution}`);
  }
  console.log('');

  console.log(`Audio Files (${voice.audioFiles.length}):`);
  if (voice.audioFiles.length > 0) {
    voice.audioFiles.forEach((file, i) => {
      console.log(`  ${i + 1}. ${file.path} (${file.format})`);
      if (file.duration) console.log(`     Duration: ${file.duration.toFixed(2)}s`);
      if (file.text) console.log(`     Text: "${file.text.substring(0, 50)}..."`);
    });
  } else {
    console.log('  No audio files');
  }
  console.log('');

  if (voice.tags && voice.tags.length > 0) {
    console.log(`Tags: ${voice.tags.join(', ')}`);
    console.log('');
  }

  if (voice.stats) {
    console.log('Usage Statistics:');
    console.log(`  Times used: ${voice.stats.timesUsed || 0}`);
    if (voice.stats.lastUsedAt) {
      console.log(`  Last used: ${voice.stats.lastUsedAt}`);
    }
    console.log('');
  }

  console.log('Metadata:');
  console.log(`  Created: ${voice.createdAt}`);
  console.log(`  Updated: ${voice.updatedAt}`);
}

/**
 * Add a new voice reference
 */
function addVoice(args: string[]) {
  const idIndex = args.indexOf('--id');
  const nameIndex = args.indexOf('--name');
  const categoryIndex = args.indexOf('--category');
  const descIndex = args.indexOf('--description');
  const sourceIndex = args.indexOf('--source');

  if (idIndex === -1 || nameIndex === -1) {
    console.error('Required: --id and --name');
    console.log('Usage: add --id voice-id --name "Voice Name" [--category male|female|child|neutral]');
    process.exit(1);
  }

  const id = args[idIndex + 1];
  const name = args[nameIndex + 1];
  const category = categoryIndex !== -1 ? args[categoryIndex + 1] : 'neutral';
  const description = descIndex !== -1 ? args[descIndex + 1] : undefined;
  const sourceType = sourceIndex !== -1 ? args[sourceIndex + 1] : 'other';

  const voice = manager.createVoiceReference({
    id,
    name,
    category: category as VoiceReference['category'],
    description,
    source: {
      type: sourceType as VoiceReference['source']['type'],
    },
    audioFiles: [],
  });

  console.log(`✓ Created voice reference: ${voice.name} (${voice.id})`);
  console.log(`  Directory: ${manager.getVoiceDirectory(id)}`);
  console.log('\nNext steps:');
  console.log(`  1. Add audio files to: ${manager.getVoiceDirectory(id)}`);
  console.log(`  2. Update metadata: ts-node scripts/manage-voices.ts update ${id} --description "..."`);
}

/**
 * Search for voices
 */
function searchVoices(args: string[]) {
  const queryIndex = args.indexOf('--query');
  const categoryIndex = args.indexOf('--category');
  const sourceIndex = args.indexOf('--source');

  const criteria: any = {};

  if (queryIndex !== -1) {
    criteria.query = args[queryIndex + 1];
  }
  if (categoryIndex !== -1) {
    criteria.category = args[categoryIndex + 1];
  }
  if (sourceIndex !== -1) {
    criteria.sourceType = args[sourceIndex + 1];
  }

  const results = manager.searchVoiceReferences(criteria);

  console.log(`Search Results (${results.length} found)\n`);

  if (results.length === 0) {
    console.log('No matching voices found.');
    return;
  }

  results.forEach((voice) => {
    console.log(`${voice.id} - ${voice.name}`);
    console.log(`  Category: ${voice.category} | Source: ${voice.source.type}`);
    if (voice.description) {
      console.log(`  ${voice.description}`);
    }
    console.log('');
  });
}

/**
 * Delete a voice reference
 */
function deleteVoice(id: string, deleteFiles: boolean = false) {
  const voice = manager.getVoiceReference(id);
  if (!voice) {
    console.error(`Voice reference not found: ${id}`);
    process.exit(1);
  }

  manager.deleteVoiceReference(id, deleteFiles);
  console.log(`✓ Deleted voice reference: ${voice.name} (${id})`);

  if (deleteFiles) {
    console.log('  Audio files deleted');
  } else {
    console.log('  Audio files preserved');
  }
}

/**
 * Export library
 */
function exportLibrary(outputPath?: string) {
  const json = manager.exportLibrary();

  if (outputPath) {
    const fs = require('fs');
    fs.writeFileSync(outputPath, json);
    console.log(`✓ Library exported to: ${outputPath}`);
  } else {
    console.log(json);
  }
}

/**
 * Main CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log('Voice Reference Management CLI - VC-005');
    console.log('');
    console.log('Commands:');
    console.log('  list                     List all voice references');
    console.log('  info <id>                Show detailed info about a voice');
    console.log('  add                      Add a new voice reference');
    console.log('  search                   Search for voices');
    console.log('  delete <id>              Delete a voice reference');
    console.log('  export [path]            Export library to JSON');
    console.log('');
    console.log('Examples:');
    console.log('  ts-node scripts/manage-voices.ts list');
    console.log('  ts-node scripts/manage-voices.ts add --id rachel --name "Rachel" --category female --source elevenlabs');
    console.log('  ts-node scripts/manage-voices.ts search --category male');
    console.log('  ts-node scripts/manage-voices.ts info rachel');
    console.log('  ts-node scripts/manage-voices.ts delete rachel --delete-files');
    console.log('  ts-node scripts/manage-voices.ts export voices-backup.json');
    return;
  }

  switch (command) {
    case 'list':
      listVoices();
      break;

    case 'info':
      if (!args[1]) {
        console.error('Usage: info <voice-id>');
        process.exit(1);
      }
      showVoiceInfo(args[1]);
      break;

    case 'add':
      addVoice(args.slice(1));
      break;

    case 'search':
      searchVoices(args.slice(1));
      break;

    case 'delete':
      if (!args[1]) {
        console.error('Usage: delete <voice-id> [--delete-files]');
        process.exit(1);
      }
      deleteVoice(args[1], args.includes('--delete-files'));
      break;

    case 'export':
      exportLibrary(args[1]);
      break;

    default:
      console.error(`Unknown command: ${command}`);
      console.log('Run without arguments to see available commands.');
      process.exit(1);
  }
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
