#!/usr/bin/env npx tsx
/**
 * Offer-Agnostic Video Ad Pipeline — CLI Runner
 *
 * Loads any offer JSON + framework, generates AI inputs via GPT-4o,
 * then runs all 4 stages (images → video → voice → compose) with
 * full traceability per angle.
 *
 * Usage:
 *   npx tsx scripts/pipeline/run.ts --offer offers/everreach.json --count 5
 *   npx tsx scripts/pipeline/run.ts --offer offers/everreach.json --count 3 --start 5
 *   npx tsx scripts/pipeline/run.ts --offer offers/everreach.json --count 5 --voice-only
 *   npx tsx scripts/pipeline/run.ts --offer offers/everreach.json --count 5 --compose-only
 *   npx tsx scripts/pipeline/run.ts --offer offers/everreach.json --count 5 --aspect=1:1
 *   npx tsx scripts/pipeline/run.ts --offer offers/everreach.json --count 2 --lipsync
 *
 * Flags:
 *   --offer=<path>     Path to offer JSON (default: offers/everreach.json)
 *   --count=<n>        Number of angles to generate (default: 5)
 *   --start=<n>        Start index into angle combos (default: 0)
 *   --aspect=<ratio>   Output aspect ratio: 9:16 | 1:1 | 16:9 (default: 9:16)
 *   --images-only      Run Stage 1 only
 *   --video-only       Run Stage 2 only
 *   --voice-only       Run Stage 3 only
 *   --compose-only     Run Stage 4 only (recompose existing assets)
 *   --lipsync          Use Veo 3 native speech instead of ElevenLabs TTS
 *                      Generates one clip per script line, stitches + burns captions
 *                      No ElevenLabs API key needed in this mode
 *   --force            Re-run even if outputs already exist
 *   --dry-run          Generate AI inputs only, no pipeline execution
 */

import * as fs from 'fs';
import * as path from 'path';

import type { Offer, CreativeFramework, AngleInputs, GenerationRecord } from './offer.schema.js';
import { generateAngleInputs } from './ai-inputs.js';
import { runStageImages } from './stage-images.js';
import { runStageVideo } from './stage-video.js';
import { runStageVoice } from './stage-voice.js';
import { runStageCompose } from './stage-compose.js';
import { runStageLipsync } from './stage-lipsync.js';
import { makeRecord, writeGenerationRecord, updateSessionSummary } from './tracing.js';

// =============================================================================
// Angle combos — all awareness stage × audience category combinations
// The runner picks `count` combos starting at `startIndex`
// =============================================================================

const ANGLE_COMBOS: Array<{ stage: string; category: string }> = [
  { stage: 'unaware',         category: 'friend'     },
  { stage: 'unaware',         category: 'old friend' },
  { stage: 'unaware',         category: 'coworker'   },
  { stage: 'unaware',         category: 'family'     },
  { stage: 'unaware',         category: 'client'     },
  { stage: 'problem-aware',   category: 'friend'     },
  { stage: 'problem-aware',   category: 'family'     },
  { stage: 'problem-aware',   category: 'mentor'     },
  { stage: 'problem-aware',   category: 'client'     },
  { stage: 'problem-aware',   category: 'old friend' },
  { stage: 'solution-aware',  category: 'crush'      },
  { stage: 'solution-aware',  category: 'client'     },
  { stage: 'solution-aware',  category: 'coworker'   },
  { stage: 'solution-aware',  category: 'friend'     },
  { stage: 'solution-aware',  category: 'mentor'     },
  { stage: 'product-aware',   category: 'friend'     },
  { stage: 'product-aware',   category: 'family'     },
  { stage: 'product-aware',   category: 'coworker'   },
  { stage: 'product-aware',   category: 'mentor'     },
  { stage: 'product-aware',   category: 'crush'      },
];

// =============================================================================
// CLI arg parser
// =============================================================================

function parseArgs(argv: string[]): {
  offerPath: string;
  count: number;
  startIndex: number;
  aspectRatio: string;
  imagesOnly: boolean;
  videoOnly: boolean;
  voiceOnly: boolean;
  composeOnly: boolean;
  lipsync: boolean;
  force: boolean;
  dryRun: boolean;
} {
  const get = (flag: string): string | undefined => {
    const eqForm = argv.find((a) => a.startsWith(`--${flag}=`));
    if (eqForm) return eqForm.split('=').slice(1).join('=');
    const idx = argv.indexOf(`--${flag}`);
    if (idx !== -1 && idx + 1 < argv.length && !argv[idx + 1].startsWith('--')) return argv[idx + 1];
    return undefined;
  };

  return {
    offerPath:   get('offer')  ?? 'offers/everreach.json',
    count:       parseInt(get('count')  ?? '5', 10),
    startIndex:  parseInt(get('start')  ?? '0', 10),
    aspectRatio: get('aspect') ?? '9:16',
    imagesOnly:  argv.includes('--images-only'),
    videoOnly:   argv.includes('--video-only'),
    voiceOnly:   argv.includes('--voice-only'),
    composeOnly: argv.includes('--compose-only'),
    lipsync:     argv.includes('--lipsync'),
    force:       argv.includes('--force'),
    dryRun:      argv.includes('--dry-run'),
  };
}

// =============================================================================
// .env.local loader
// =============================================================================

function loadEnv(): void {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const eq = line.indexOf('=');
    if (eq === -1 || line.startsWith('#')) continue;
    const k = line.slice(0, eq).trim();
    const v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (k && !process.env[k]) process.env[k] = v;
  }
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  loadEnv();

  const args = parseArgs(process.argv.slice(2));

  // Load offer + framework
  const offerFile = path.resolve(process.cwd(), args.offerPath);
  if (!fs.existsSync(offerFile)) {
    console.error(`❌ Offer file not found: ${offerFile}`);
    console.error(`   Create one with: npx tsx scripts/pipeline/run.ts --help`);
    process.exit(1);
  }

  const offerData: { offer: Offer; framework: CreativeFramework } = JSON.parse(
    fs.readFileSync(offerFile, 'utf-8')
  );
  const { offer, framework } = offerData;

  // Determine mode label
  const mode = args.imagesOnly ? 'images-only'
    : args.videoOnly  ? 'video-only'
    : args.voiceOnly  ? 'voice-only'
    : args.composeOnly ? 'compose-only'
    : args.lipsync    ? 'lipsync'
    : args.dryRun     ? 'dry-run'
    : 'full-pipeline';

  const aspectRatio = args.aspectRatio ?? framework.aspectRatio ?? '9:16';
  const sessionId = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const sessionDir = path.join('output', 'pipeline', offer.productName.toLowerCase().replace(/\s+/g, '-'), sessionId);
  fs.mkdirSync(sessionDir, { recursive: true });

  const combos = ANGLE_COMBOS.slice(args.startIndex, args.startIndex + args.count);

  console.log(`\n${'═'.repeat(62)}`);
  console.log(`  🚀 Video Ad Pipeline`);
  console.log(`  📦 Product:  ${offer.productName}`);
  console.log(`  📋 Session:  ${sessionId}`);
  console.log(`  🎯 Angles:   ${combos.length} (start: ${args.startIndex})`);
  console.log(`  🎬 Mode:     ${mode}`);
  console.log(`  📐 Aspect:   ${aspectRatio}`);
  console.log(`  📁 Output:   ${sessionDir}`);
  console.log(`${'═'.repeat(62)}`);

  const sessionRecords: GenerationRecord[] = [];

  for (let i = 0; i < combos.length; i++) {
    const combo = combos[i];
    const angleId = `${offer.productName.toUpperCase().replace(/\s+/g, '_').slice(0, 8)}_${sessionId.slice(0, 10)}_${String(args.startIndex + i + 1).padStart(2, '0')}`;
    const outputDir = path.join(sessionDir, angleId);
    fs.mkdirSync(outputDir, { recursive: true });

    const record = makeRecord(angleId, offer);
    record.outputs.outputDir = outputDir;

    console.log(`\n${'─'.repeat(62)}`);
    console.log(`  [${i + 1}/${combos.length}] ${angleId}`);
    console.log(`  Stage: ${combo.stage}  |  Category: ${combo.category}`);
    console.log(`${'─'.repeat(62)}`);

    // ── AI Input Generation ────────────────────────────────────────────────
    console.log(`\n🤖 Generating inputs (GPT-4o)${args.lipsync ? ' + lip-sync prompts' : ''}...`);
    let inputs: AngleInputs;
    try {
      const t0 = Date.now();
      const result = await generateAngleInputs(offer, framework, combo.stage, combo.category, angleId);
      inputs = result.inputs;

      record.aiGeneration = {
        model: result.model,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        totalTokens: result.totalTokens,
        inputs,
      };

      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`   ✅ ${elapsed}s | ${result.totalTokens} tokens`);
      console.log(`   📝 "${inputs.headline}"`);
      console.log(`   🎙️  "${inputs.voiceScript.split('\n')[0]}..."`);

      // Inject audience context + framework fields so downstream stages can use them
      (inputs as any).audienceCategory = combo.category;
      (inputs as any).awarenessStage = combo.stage;
      if ((framework as any).characterGender)      (inputs as any).characterGender      = (framework as any).characterGender;
      if ((framework as any).preferredCharacterId) (inputs as any).preferredCharacterId = (framework as any).preferredCharacterId;
      if ((framework as any).preferredEthnicity)   (inputs as any).preferredEthnicity   = (framework as any).preferredEthnicity;
      if ((framework as any).voiceGender)          (inputs as any).voiceGender          = (framework as any).voiceGender;
      if ((framework as any).voiceAge)             (inputs as any).voiceAge             = (framework as any).voiceAge;

      // Save scene config for reference / re-runs
      fs.writeFileSync(path.join(outputDir, 'scene_config.json'), JSON.stringify(inputs, null, 2));
    } catch (err: any) {
      record.errors.push(`AI generation: ${err.message}`);
      console.log(`   ❌ ${err.message}`);
      record.completedAt = new Date().toISOString();
      sessionRecords.push(record);
      writeGenerationRecord(record, outputDir);
      updateSessionSummary(sessionDir, sessionId, offer, mode, aspectRatio, sessionRecords);
      continue;
    }

    if (args.dryRun) {
      console.log(`\n   [dry-run] Skipping pipeline execution`);
      record.completedAt = new Date().toISOString();
      sessionRecords.push(record);
      writeGenerationRecord(record, outputDir);
      updateSessionSummary(sessionDir, sessionId, offer, mode, aspectRatio, sessionRecords);
      continue;
    }

    // ── Stage 1: Images ────────────────────────────────────────────────────
    if (!args.videoOnly && !args.voiceOnly && !args.composeOnly) {
      record.pipeline.stage1_images = await runStageImages(inputs, outputDir, aspectRatio);
      if (record.pipeline.stage1_images.status === 'failed') {
        record.errors.push(`Stage 1: ${record.pipeline.stage1_images.error}`);
      }
    } else {
      record.pipeline.stage1_images.status = 'skipped';
    }

    // ── Stage 2: Video (standard) OR Stage 2b: Lip-Sync ─────────────────────────────────────────
    if (!args.imagesOnly && !args.voiceOnly && !args.composeOnly) {
      if (args.lipsync) {
        // Lip-sync mode: Veo 3 generates native speech per line, no ElevenLabs needed
        // Stages 3 + 4 are replaced by a single stitch+caption step inside runStageLipsync
        record.pipeline.stage2_video = await runStageLipsync(inputs, outputDir, aspectRatio, args.force);  // inputs already has framework fields injected above
        if (record.pipeline.stage2_video.status === 'failed') {
          record.errors.push(`Stage 2b (lipsync): ${record.pipeline.stage2_video.error}`);
        }
        const lipsyncPath = path.join(outputDir, `lipsync_${aspectRatio.replace(':', 'x')}.mp4`);
        if (fs.existsSync(lipsyncPath)) record.outputs.finalVideo = lipsyncPath;
        // Skip stages 3 + 4 — audio is baked into lipsync video
        record.pipeline.stage3_voice.status = 'skipped';
        record.pipeline.stage4_compose.status = 'skipped';
      } else {
        record.pipeline.stage2_video = await runStageVideo(inputs, outputDir, aspectRatio);
        if (record.pipeline.stage2_video.status === 'failed') {
          record.errors.push(`Stage 2: ${record.pipeline.stage2_video.error}`);
        }
      }
    } else {
      record.pipeline.stage2_video.status = 'skipped';
    }

    // ── Stage 3: Voice (skipped in lipsync mode) ───────────────────────────────────────────────────
    if (!args.imagesOnly && !args.videoOnly && !args.lipsync) {
      record.pipeline.stage3_voice = await runStageVoice(inputs, framework, outputDir);
      if (record.pipeline.stage3_voice.status === 'failed') {
        record.errors.push(`Stage 3: ${record.pipeline.stage3_voice.error}`);
      }
    } else if (!args.lipsync) {
      record.pipeline.stage3_voice.status = 'skipped';
    }

    // ── Stage 4: Compose (skipped in lipsync mode) ───────────────────────────────────────────────
    if (!args.imagesOnly && !args.videoOnly && !args.voiceOnly && !args.lipsync) {
      record.pipeline.stage4_compose = await runStageCompose(inputs, outputDir, aspectRatio, args.force);
      if (record.pipeline.stage4_compose.status === 'failed') {
        record.errors.push(`Stage 4: ${record.pipeline.stage4_compose.error}`);
      }
      const finalPath = path.join(outputDir, `final_${aspectRatio.replace(':', 'x')}.mp4`);
      if (fs.existsSync(finalPath)) record.outputs.finalVideo = finalPath;
    } else if (!args.lipsync) {
      record.pipeline.stage4_compose.status = 'skipped';
    }

    // ── Finalize record ────────────────────────────────────────────────────
    record.completedAt = new Date().toISOString();
    record.durationMs = new Date(record.completedAt).getTime() - new Date(record.startedAt).getTime();

    const stageStatuses = Object.values(record.pipeline).map((s) => s.status);
    const anyFailed = stageStatuses.includes('failed');
    const icon = anyFailed ? '⚠️ ' : '✅';
    console.log(`\n${icon} ${angleId} complete (${(record.durationMs / 1000).toFixed(0)}s)`);
    if (record.errors.length) console.log(`   Errors: ${record.errors.join(' | ')}`);

    // Auto-open final video when done
    if (record.outputs.finalVideo && !anyFailed) {
      try {
        const { execSync } = await import('child_process');
        execSync(`open "${record.outputs.finalVideo}"`, { stdio: 'ignore' });
        console.log(`   🎬 Opening: ${path.basename(record.outputs.finalVideo)}`);
      } catch { /* non-fatal — open may not be available */ }
    }

    sessionRecords.push(record);
    writeGenerationRecord(record, outputDir);
    updateSessionSummary(sessionDir, sessionId, offer, mode, aspectRatio, sessionRecords);
  }

  // ── Session summary ──────────────────────────────────────────────────────
  const done = sessionRecords.filter((r) => !r.errors.length).length;
  const failed = sessionRecords.filter((r) => r.errors.length > 0).length;
  const totalTokens = sessionRecords.reduce((s, r) => s + (r.aiGeneration?.totalTokens ?? 0), 0);

  console.log(`\n${'═'.repeat(62)}`);
  console.log(`  ✅ Session complete`);
  console.log(`  📦 ${done} succeeded | ${failed} failed | ${totalTokens} tokens used`);
  console.log(`  📁 ${sessionDir}/session.json`);
  console.log(`${'═'.repeat(62)}\n`);
}

main().catch((err) => {
  console.error(`\n❌ Pipeline error: ${err.message}`);
  process.exit(1);
});
