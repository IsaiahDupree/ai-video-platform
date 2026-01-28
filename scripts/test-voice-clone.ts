/**
 * Test script for voice clone API client
 *
 * This script demonstrates how to use the VoiceCloneClient to generate
 * speech using cloned voices.
 *
 * Usage:
 *   ts-node scripts/test-voice-clone.ts
 */

import { VoiceCloneClient, cloneVoice } from '../src/services/voiceClone';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config();

async function main() {
  console.log('Voice Clone API Client Test');
  console.log('============================\n');

  // Check if Modal URL is configured
  if (!process.env.MODAL_VOICE_CLONE_URL) {
    console.error('Error: MODAL_VOICE_CLONE_URL not set in .env file');
    console.error('Please deploy the Modal service first:');
    console.error('  modal deploy scripts/modal_voice_clone.py');
    console.error('Then add the URL to your .env file');
    process.exit(1);
  }

  console.log('Modal URL:', process.env.MODAL_VOICE_CLONE_URL);

  // Example 1: Basic voice cloning
  console.log('\nExample 1: Basic Voice Cloning');
  console.log('--------------------------------');

  try {
    // You would replace this with an actual reference audio file
    const referenceAudioPath = path.join(__dirname, '../public/assets/voices/reference.wav');

    console.log('Note: Make sure you have a reference audio file at:');
    console.log('  public/assets/voices/reference.wav');
    console.log('\nIf you don\'t have one, you can:');
    console.log('  1. Use generate-voice-with-elevenlabs.ts to create one');
    console.log('  2. Record your own voice');
    console.log('  3. Download a sample from the internet\n');

    // Create client
    const client = new VoiceCloneClient();

    // Clone voice - this would work if you have a reference file
    // Uncomment when you have a reference file:
    /*
    const audioBuffer = await client.cloneVoice({
      text: 'Hello, this is a test of the voice cloning system.',
      referenceAudio: referenceAudioPath,
      speakerName: 'test_speaker',
      speed: 1.0,
      temperature: 0.7,
    });

    const outputPath = path.join(__dirname, '../public/assets/audio/cloned_test.wav');
    await client.cloneVoiceToFile(
      {
        text: 'Hello, this is a test of the voice cloning system.',
        referenceAudio: referenceAudioPath,
        speakerName: 'test_speaker',
      },
      outputPath
    );

    console.log('✓ Voice cloned successfully!');
    console.log(`  Output: ${outputPath}`);
    */

  } catch (error) {
    console.error('✗ Error cloning voice:', error);
  }

  // Example 2: Batch voice cloning
  console.log('\nExample 2: Batch Voice Cloning');
  console.log('--------------------------------');

  try {
    const client = new VoiceCloneClient();

    const texts = [
      'This is the first sentence.',
      'This is the second sentence.',
      'And this is the third sentence.',
    ];

    console.log(`Texts to clone: ${texts.length}`);

    // Uncomment when you have a reference file:
    /*
    const referenceAudioPath = path.join(__dirname, '../public/assets/voices/reference.wav');
    const outputDir = path.join(__dirname, '../public/assets/audio/batch');

    const outputPaths = await client.batchClone(
      texts,
      referenceAudioPath,
      'batch_speaker',
      outputDir
    );

    console.log('✓ Batch cloning complete!');
    console.log(`  Generated ${outputPaths.length} audio files`);
    outputPaths.forEach((p, i) => console.log(`    ${i + 1}. ${p}`));
    */

  } catch (error) {
    console.error('✗ Error in batch cloning:', error);
  }

  // Example 3: Using convenience function
  console.log('\nExample 3: Convenience Function');
  console.log('--------------------------------');

  try {
    // Uncomment when you have a reference file:
    /*
    const referenceAudioPath = path.join(__dirname, '../public/assets/voices/reference.wav');
    const outputPath = path.join(__dirname, '../public/assets/audio/convenience_test.wav');

    await cloneVoice(
      'Using the convenience function makes it even easier!',
      referenceAudioPath,
      outputPath,
      {
        speakerName: 'convenience_speaker',
        speed: 1.2,
      }
    );

    console.log('✓ Cloning with convenience function successful!');
    console.log(`  Output: ${outputPath}`);
    */

  } catch (error) {
    console.error('✗ Error using convenience function:', error);
  }

  console.log('\n============================');
  console.log('Test complete!');
  console.log('\nNext steps:');
  console.log('1. Ensure Modal service is deployed');
  console.log('2. Add MODAL_VOICE_CLONE_URL to .env');
  console.log('3. Generate or add a reference audio file');
  console.log('4. Uncomment the test code above');
  console.log('5. Run: ts-node scripts/test-voice-clone.ts');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
