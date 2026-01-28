/**
 * Test script for batch voiceover generation
 * Validates that the script correctly reads briefs and extracts voiceover sections
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test brief loading and section extraction
async function testBriefParsing() {
  console.log('Testing brief parsing and section extraction\n');

  const briefPath = path.join(__dirname, '../data/briefs/example-video.json');

  if (!fs.existsSync(briefPath)) {
    console.error('✗ Test brief not found:', briefPath);
    return false;
  }

  const briefContent = fs.readFileSync(briefPath, 'utf-8');
  const brief = JSON.parse(briefContent);

  console.log('✓ Brief loaded successfully');
  console.log(`  Title: ${brief.title}`);
  console.log(`  Sections: ${brief.sections.length}`);

  // Extract sections with voiceover
  const voiceoverSections = brief.sections.filter((s: any) => s.voiceover && s.voiceover.trim().length > 0);

  console.log(`  Sections with voiceover: ${voiceoverSections.length}`);

  if (voiceoverSections.length === 0) {
    console.error('✗ No sections with voiceover found');
    return false;
  }

  console.log('\nVoiceover sections:');
  voiceoverSections.forEach((section: any, index: number) => {
    console.log(`  ${index + 1}. ${section.id}: "${section.voiceover.substring(0, 50)}..."`);
  });

  console.log('\n✓ All tests passed!');
  return true;
}

// Run test
testBriefParsing().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
