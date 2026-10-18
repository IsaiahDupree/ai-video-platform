// Generate the full A-roll set for the demo video via real HeyGen (test mode),
// download each clip, and report paths. Completes the generation stage.
// Run: HEYGEN_API_KEY=$(grep ^HEYGEN_API_KEY= ~/.env | cut -d= -f2-) node scripts/generate-aroll.ts
import { buildHeyGenRequest } from "../src/foundry/generate/HeyGenGenerator.ts";
import { mkdirSync, writeFileSync } from "node:fs";

const KEY = process.env.HEYGEN_API_KEY;
if (!KEY) { console.error("HEYGEN_API_KEY not set"); process.exit(1); }
const OUT = "output/aroll";
mkdirSync(OUT, { recursive: true });

// The heygen_avatar beats from the founders-explainer shot plan.
const shots = [
  { id: "hook", script: "Most AI video tools make one thing. A video people actually watch is a different problem." },
  { id: "how", script: "The fix is a retention critic and a closed revision loop sitting above the generator." },
  { id: "cta", script: "Follow for the full build." },
];

async function j(url: string, init?: any) { for (let a = 0; a < 4; a++) { try { return await (await fetch(url, init)).json(); } catch { await new Promise(r => setTimeout(r, 2000)); } } return null; }

// 1. Submit all.
const jobs: { id: string; videoId: string }[] = [];
for (const s of shots) {
  const req = buildHeyGenRequest(s.script, { test: true, width: 720, height: 1280 });
  const r: any = await j("https://api.heygen.com/v2/video/generate", { method: "POST", headers: { "X-API-KEY": KEY, "Content-Type": "application/json" }, body: JSON.stringify(req) });
  const videoId = r?.data?.video_id ?? r?.video_id;
  if (!videoId) { console.error(`submit ${s.id} failed:`, JSON.stringify(r).slice(0, 160)); continue; }
  jobs.push({ id: s.id, videoId });
  console.log(`submitted ${s.id} → ${videoId}`);
}

// 2. Poll + download each.
const results: { id: string; file?: string; durationSec?: number }[] = [];
for (const job of jobs) {
  let done = false;
  for (let i = 0; i < 40 && !done; i++) {
    await new Promise(r => setTimeout(r, 6000));
    const sj: any = await j(`https://api.heygen.com/v1/video_status.get?video_id=${job.videoId}`, { headers: { "X-API-KEY": KEY } });
    const st = sj?.data?.status;
    if (st === "completed") {
      const url = sj.data.video_url;
      const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
      const file = `${OUT}/${job.id}.mp4`;
      writeFileSync(file, buf);
      results.push({ id: job.id, file, durationSec: sj.data.duration });
      console.log(`✅ ${job.id}: ${file} (${sj.data.duration}s, ${(buf.length / 1024).toFixed(0)}KB)`);
      done = true;
    } else if (st === "failed") { console.error(`❌ ${job.id} failed`); done = true; }
  }
}
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(results, null, 2));
console.log(`\nA-roll set: ${results.length}/${shots.length} clips in ${OUT}/ (manifest.json written)`);
