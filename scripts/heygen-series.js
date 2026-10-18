#!/usr/bin/env node
// heygen-series.js — generate a HeyGen talking-avatar video for the
// "what people want from AI" series. HeyGen is the pinned voice engine, so this
// runs with ZERO ElevenLabs characters.
//
//   node scripts/heygen-series.js "Your script here"          # test/watermark (FREE, no credits)
//   node scripts/heygen-series.js --live "Your script here"   # real render (spends HeyGen credits)
//   node scripts/heygen-series.js --check                     # auth + quota only, no generation
//
// Prints JSON { ok, live, videoId, videoUrl, ... } on success. The videoUrl can
// then be handed to StoryRail as a `video` content_kind for scheduled YouTube posting.

const fs = require('fs');
const path = require('path');
const os = require('os');

// Load env (HEYGEN_API_KEY from ~/.env, VOICE_PROVIDER from Remotion/.env). process.env wins.
function loadEnv(p) {
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    if (line.trim().startsWith('#')) continue;
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const k = m[1], v = m[2].trim().replace(/^["']|["']$/g, '');
    if (process.env[k] === undefined && v !== '') process.env[k] = v;
  }
}
loadEnv(path.join(__dirname, '..', '.env'));
loadEnv(path.join(os.homedir(), '.env'));

const voice = require('../voice-provider');

const argv = process.argv.slice(2);
const live = argv.includes('--live');
const checkOnly = argv.includes('--check');
const script = argv.filter((a) => !a.startsWith('--')).join(' ').trim()
  || 'Here is what people actually want from AI in twenty twenty-six, based on what a hundred builders told me.';

(async () => {
  const provider = voice.resolveVoiceProvider('heygen'); // pin heygen regardless of env
  if (!voice.isAvatarProvider(provider)) {
    console.error(`[heygen-series] ERROR: provider resolved to "${provider}", not an avatar provider`);
    process.exit(1);
  }
  console.error(`[heygen-series] provider=${provider}  test=${!live}  script_chars=${script.length}`);

  try {
    const q = await voice.heygenRemainingQuota();
    console.error(`[heygen-series] HeyGen auth OK via ${q.endpoint}`);
    if (checkOnly) { console.log(JSON.stringify({ ok: true, check: true, provider, endpoint: q.endpoint }, null, 2)); return; }

    const res = await voice.generateHeyGenAvatar({ script, test: !live, maxPolls: 48, pollMs: 5000 });
    console.log(JSON.stringify({ ok: true, live, provider, ...res }, null, 2));
  } catch (e) {
    console.error(`[heygen-series] FAILED: ${e.message}`);
    process.exit(1);
  }
})();
