#!/usr/bin/env npx tsx
/**
 * Multi-Language Video Generator
 *
 * Generate videos in multiple languages with localized TTS, subtitles, and lip-sync.
 *
 * Usage:
 *   npx tsx scripts/generate-multi-language.ts --text "Hello world" --languages en,es,fr
 *   npx tsx scripts/generate-multi-language.ts --list-languages
 *   npx tsx scripts/generate-multi-language.ts --help
 *
 * Supports 30+ languages with:
 * - Text-to-speech via OpenAI TTS and ElevenLabs
 * - Automatic subtitle generation
 * - Lip-sync support for 20+ languages
 */

import MultiLanguageHandler, {
  LANGUAGE_CONFIG,
  SupportedLanguage,
} from '../src/api/multi-language';

// =============================================================================
// CLI Functions
// =============================================================================

function showHelp(): void {
  console.log(`
Multi-Language Video Generator

Generate videos in multiple languages with TTS, subtitles, and lip-sync support.

Usage:
  npx tsx scripts/generate-multi-language.ts [command] [options]

Commands:
  generate         Generate multi-language video (default)
  list-languages   List all supported languages
  language-info    Show info for specific language
  lip-sync-info    Show languages with lip-sync support

Options for 'generate':
  --text <text>           Text to convert to speech
  --languages <codes>     Comma-separated language codes (en,es,fr)
  --source <lang>         Source language for translation (default: en)
  --subtitles             Generate subtitle files
  --tts-provider <p>      TTS provider: openai | elevenlabs (default: elevenlabs)
  --output <dir>          Output directory (default: ./output/multi-language)

Options for 'language-info':
  --language <code>       Language code to show info for

Examples:
  # Generate in English and Spanish
  npx tsx scripts/generate-multi-language.ts generate --text "Hello, how are you?" --languages en,es

  # Generate with subtitles
  npx tsx scripts/generate-multi-language.ts generate --text "Welcome to our product" --languages en,es,fr,de --subtitles

  # List all supported languages
  npx tsx scripts/generate-multi-language.ts list-languages

  # Show languages with lip-sync support
  npx tsx scripts/generate-multi-language.ts lip-sync-info

  # Get info for specific language
  npx tsx scripts/generate-multi-language.ts language-info --language es
`);
}

function listLanguages(): void {
  const languages = Object.values(LANGUAGE_CONFIG);

  console.log('\n📚 Supported Languages (30+)\n');
  console.log('Code  | Name                 | Native Name         | Lip-Sync | Region');
  console.log('------|----------------------|---------------------|----------|--------');

  for (const lang of languages) {
    const lipSync = lang.lipSyncSupported ? '✓' : '✗';
    const region = lang.region || '-';
    console.log(
      `${lang.code.padEnd(5)} | ${lang.name.padEnd(20)} | ${lang.nativeName.padEnd(19)} | ${lipSync.padEnd(8)} | ${region}`
    );
  }

  console.log(`\nTotal: ${languages.length} languages`);

  const handler = new MultiLanguageHandler();
  const { supported, unsupported } = handler.getLanguagesByLipSyncSupport();

  console.log(`\n✓ Lip-Sync Supported: ${supported.length} languages`);
  console.log(`   ${supported.join(', ')}`);

  console.log(`\n✗ Lip-Sync Limited: ${unsupported.length} languages`);
  console.log(`   ${unsupported.join(', ')}\n`);
}

function showLanguageInfo(code: string): void {
  const config = LANGUAGE_CONFIG[code as SupportedLanguage];

  if (!config) {
    console.log(`\n❌ Language not found: ${code}\n`);
    return;
  }

  console.log(`\n📋 Language Information: ${config.name}\n`);
  console.log(`Code:              ${config.code}`);
  console.log(`English Name:      ${config.name}`);
  console.log(`Native Name:       ${config.nativeName}`);
  console.log(`Direction:         ${config.direction === 'ltr' ? 'Left-to-Right' : 'Right-to-Left'}`);
  console.log(`Lip-Sync Support:  ${config.lipSyncSupported ? '✓ Yes' : '✗ No'}`);
  if (config.region) {
    console.log(`Region:            ${config.region}`);
  }
  if (config.voiceId) {
    console.log(`ElevenLabs Voice:  ${config.voiceId}`);
  }
  if (config.openaiVoice) {
    console.log(`OpenAI Voice:      ${config.openaiVoice}`);
  }

  console.log();
}

function showLipSyncInfo(): void {
  const handler = new MultiLanguageHandler();
  const { supported, unsupported } = handler.getLanguagesByLipSyncSupport();

  console.log(`\n✓ Lip-Sync Supported Languages (${supported.length}):`);
  console.log(`\n  This languages support accurate lip-sync for talking avatar videos.\n`);

  for (const code of supported) {
    const config = LANGUAGE_CONFIG[code];
    console.log(`  ${code.padEnd(6)} - ${config.name} (${config.nativeName})`);
  }

  console.log(`\n✗ Limited Lip-Sync Languages (${unsupported.length}):`);
  console.log(`\n  These languages have limited or no lip-sync support.\n`);

  for (const code of unsupported) {
    const config = LANGUAGE_CONFIG[code];
    console.log(`  ${code.padEnd(6)} - ${config.name} (${config.nativeName})`);
  }

  console.log();
}

async function generateMultiLanguage(
  text: string,
  languageCodes: string[],
  options: {
    sourceLanguage?: string;
    subtitles?: boolean;
    ttsProvider?: 'openai' | 'elevenlabs';
    outputDir?: string;
  } = {}
): Promise<void> {
  const handler = new MultiLanguageHandler(options.outputDir);

  console.log('\n🌍 Multi-Language Video Generator');
  console.log('═══════════════════════════════════════');
  console.log(`📝 Text: "${text.substring(0, 60)}${text.length > 60 ? '...' : ''}"`);
  console.log(`🗣️  Languages: ${languageCodes.join(', ')}`);
  console.log(`📁 Output: ${options.outputDir || './output/multi-language'}\n`);

  const validLanguages: SupportedLanguage[] = [];
  const invalidLanguages: string[] = [];

  // Validate languages
  for (const code of languageCodes) {
    if (LANGUAGE_CONFIG[code as SupportedLanguage]) {
      validLanguages.push(code as SupportedLanguage);
    } else {
      invalidLanguages.push(code);
    }
  }

  if (invalidLanguages.length > 0) {
    console.warn(`⚠️  Invalid languages: ${invalidLanguages.join(', ')}`);
  }

  if (validLanguages.length === 0) {
    console.error('❌ No valid languages specified');
    return;
  }

  console.log(`✓ Processing ${validLanguages.length} languages\n`);

  const results: Record<string, { audioPath?: string; subtitlesPath?: string; lipSync: boolean; error?: string }> = {};

  // Generate audio for each language
  for (const lang of validLanguages) {
    const langConfig = LANGUAGE_CONFIG[lang];

    console.log(`[${lang.toUpperCase()}] ${langConfig.name}`);

    try {
      // Generate speech
      const provider = options.ttsProvider || 'elevenlabs';
      const audioPath = await handler.generateSpeech(text, lang, provider);
      console.log(`   ✓ Audio generated`);
      results[lang] = {
        audioPath,
        lipSync: handler.supportsLipSync(lang),
      };

      // Generate subtitles if requested
      if (options.subtitles) {
        const subtitlesPath = await handler.generateSubtitles(text, lang);
        console.log(`   ✓ Subtitles generated`);
        results[lang].subtitlesPath = subtitlesPath;
      }

      // Show lip-sync availability
      const lipSyncStatus = handler.supportsLipSync(lang) ? '✓' : '✗';
      console.log(`   ${lipSyncStatus} Lip-sync support`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`   ✗ Error: ${errorMsg}`);
      results[lang] = { error: errorMsg, lipSync: false };
    }

    console.log();
  }

  // Summary
  console.log('═══════════════════════════════════════');
  console.log('📊 Generation Summary\n');

  const successful = Object.values(results).filter(r => !r.error).length;
  const lipSyncCount = Object.values(results).filter(r => r.lipSync && !r.error).length;

  console.log(`✓ Successful: ${successful}/${validLanguages.length}`);
  console.log(`✓ With Lip-Sync: ${lipSyncCount}`);

  if (options.subtitles) {
    const subtitleCount = Object.values(results).filter(r => r.subtitlesPath).length;
    console.log(`✓ Subtitles Generated: ${subtitleCount}`);
  }

  console.log();
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  const command = args[0];

  switch (command) {
    case 'list-languages': {
      listLanguages();
      break;
    }

    case 'language-info': {
      const langIdx = args.indexOf('--language');
      if (langIdx === -1 || !args[langIdx + 1]) {
        console.log('\n❌ --language is required\n');
        break;
      }
      showLanguageInfo(args[langIdx + 1]);
      break;
    }

    case 'lip-sync-info': {
      showLipSyncInfo();
      break;
    }

    case 'generate':
    default: {
      const textIdx = args.indexOf('--text');
      const langIdx = args.indexOf('--languages');
      const sourceIdx = args.indexOf('--source');
      const subtitlesIdx = args.indexOf('--subtitles');
      const ttsIdx = args.indexOf('--tts-provider');
      const outputIdx = args.indexOf('--output');

      if (textIdx === -1 || !args[textIdx + 1]) {
        console.log('\n❌ --text is required\n');
        showHelp();
        break;
      }

      if (langIdx === -1 || !args[langIdx + 1]) {
        console.log('\n❌ --languages is required\n');
        showHelp();
        break;
      }

      const text = args[textIdx + 1];
      const languages = args[langIdx + 1].split(',').map(l => l.trim());
      const sourceLanguage = args[sourceIdx + 1] || 'en';
      const hasSubtitles = subtitlesIdx !== -1;
      const ttsProvider = (args[ttsIdx + 1] || 'elevenlabs') as 'openai' | 'elevenlabs';
      const outputDir = args[outputIdx + 1];

      await generateMultiLanguage(text, languages, {
        sourceLanguage,
        subtitles: hasSubtitles,
        ttsProvider,
        outputDir,
      });
      break;
    }
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export { generateMultiLanguage, listLanguages, showLanguageInfo };
