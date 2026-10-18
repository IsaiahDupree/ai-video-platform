import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

// =============================================================================
// Motion Canvas Two-Pass Pipeline
// =============================================================================
// Pass 1: Render with seed reveals → Capture real reveals
// Pass 2: Rebuild audio with real timing → Final render

interface PipelineConfig {
  projectRoot: string;
  mcRoot: string;
  dataDir: string;
  outputDir: string;
  fps: number;
}

const defaultConfig: PipelineConfig = {
  projectRoot: path.resolve(__dirname, '../../'),
  mcRoot: path.resolve(__dirname, '../'),
  dataDir: path.resolve(__dirname, '../../data'),
  outputDir: path.resolve(__dirname, '../output'),
  fps: 30,
};

async function runCommand(
  cmd: string,
  args: string[],
  cwd: string,
  label: string
): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(`\n🔧 ${label}`);
    console.log(`   $ ${cmd} ${args.join(' ')}`);

    const proc = spawn(cmd, args, {
      cwd,
      shell: true,
      stdio: 'inherit',
    });

    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`   ✅ ${label} complete`);
        resolve(true);
      } else {
        console.error(`   ❌ ${label} failed (exit ${code})`);
        resolve(false);
      }
    });

    proc.on('error', (err) => {
      console.error(`   ❌ ${label} error: ${err}`);
      resolve(false);
    });
  });
}

async function runTwoPassPipeline(config = defaultConfig): Promise<boolean> {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   Motion Canvas Two-Pass Pipeline');
  console.log('═══════════════════════════════════════════════════════════════');

  const { projectRoot, mcRoot, dataDir } = config;

  // Step 1: Format prep (generate format, beats, seed reveals)
  const hasScript = fs.existsSync(path.join(dataDir, 'script.txt'));
  if (hasScript) {
    const formatOk = await runCommand(
      'npm',
      ['run', 'format:prep'],
      projectRoot,
      'Format Prep (script → format → beats → seed reveals)'
    );
    if (!formatOk) return false;
  } else {
    console.log('⚠️  No script.txt found, skipping format prep');
  }

  // Step 2: Generate macro cues from seed reveals
  const macroCuesOk = await runCommand(
    'npm',
    ['run', 'sfx:macro'],
    projectRoot,
    'Generate Macro Cues'
  );
  if (!macroCuesOk) return false;

  // Step 3: Build audio mix (Pass 1 - using seed reveals)
  const audioMixOk = await runCommand(
    'npm',
    ['run', 'audio:mix'],
    projectRoot,
    'Build Audio Mix (Pass 1)'
  );
  // Audio mix is optional - continue even if it fails
  if (!audioMixOk) {
    console.log('   ⚠️  Audio mix failed, continuing without audio');
  }

  // Step 4: First render (captures real reveals)
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('   PASS 1: Initial Render (capturing reveals)');
  console.log('═══════════════════════════════════════════════════════════════');

  const render1Ok = await runCommand(
    'npx',
    ['tsx', 'scripts/mc-cli-render.ts'],
    mcRoot,
    'CLI Render Pass 1'
  );

  if (!render1Ok) {
    console.error('❌ Pass 1 render failed');
    return false;
  }

  // Step 5: Check if we got real reveals
  const realRevealsPath = path.join(dataDir, 'visual_reveals.json');
  const hasRealReveals = fs.existsSync(realRevealsPath);

  if (!hasRealReveals) {
    console.log('⚠️  No real reveals captured, skipping Pass 2');
    console.log('✅ Pipeline complete (single pass)');
    return true;
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('   PASS 2: Rebuild with Real Reveals');
  console.log('═══════════════════════════════════════════════════════════════');

  // Step 6: Regenerate macro cues with real reveals
  const macroCues2Ok = await runCommand(
    'npm',
    ['run', 'sfx:macro'],
    projectRoot,
    'Regenerate Macro Cues (with real reveals)'
  );
  if (!macroCues2Ok) return false;

  // Step 7: Rebuild audio mix with real timing
  const audioMix2Ok = await runCommand(
    'npm',
    ['run', 'audio:mix'],
    projectRoot,
    'Rebuild Audio Mix (Pass 2)'
  );
  if (!audioMix2Ok) {
    console.log('   ⚠️  Audio mix failed, continuing without updated audio');
  }

  // Step 8: Final render
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('   PASS 2: Final Render');
  console.log('═══════════════════════════════════════════════════════════════');

  const render2Ok = await runCommand(
    'npx',
    ['tsx', 'scripts/mc-cli-render.ts'],
    mcRoot,
    'CLI Render Pass 2 (Final)'
  );

  if (!render2Ok) {
    console.error('❌ Pass 2 render failed');
    return false;
  }

  // Step 9: Run QA gate
  const qaOk = await runCommand(
    'npm',
    ['run', 'qa:timeline:warn'],
    projectRoot,
    'Timeline QA Gate'
  );
  // QA is advisory, don't fail pipeline

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('   ✅ Two-Pass Pipeline Complete!');
  console.log('═══════════════════════════════════════════════════════════════');

  return true;
}

// =============================================================================
// CLI
// =============================================================================

async function main() {
  const success = await runTwoPassPipeline();
  process.exit(success ? 0 : 1);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

export { runTwoPassPipeline, PipelineConfig };
