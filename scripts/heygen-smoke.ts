// Real HeyGen A-roll smoke test (test mode = cheap/watermarked). Proves the
// generation stage produces real avatar video. Run:
//   HEYGEN_API_KEY=$(grep ^HEYGEN_API_KEY= ~/.env | cut -d= -f2-) node scripts/heygen-smoke.ts
import { buildHeyGenRequest } from "../src/foundry/generate/HeyGenGenerator.ts";

const KEY = process.env.HEYGEN_API_KEY;
if (!KEY) { console.error("HEYGEN_API_KEY not set"); process.exit(1); }

const script = "If you want AI video people actually watch, retention has to start in the script.";
const req = buildHeyGenRequest(script, { test: true, width: 720, height: 1280 });
console.log("request engine (must be object):", JSON.stringify(req.video_inputs[0].character.engine), "test:", req.test);

const gen = await fetch("https://api.heygen.com/v2/video/generate", {
  method: "POST",
  headers: { "X-API-KEY": KEY, "Content-Type": "application/json" },
  body: JSON.stringify(req),
});
const gj: any = await gen.json();
const videoId = gj?.data?.video_id ?? gj?.video_id;
if (!videoId) { console.error("no video_id — response:", JSON.stringify(gj).slice(0, 300)); process.exit(1); }
console.log("submitted video_id:", videoId, "— polling…");

for (let i = 0; i < 40; i++) {
  await new Promise((r) => setTimeout(r, 6000));
  const s = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, { headers: { "X-API-KEY": KEY } });
  const sj: any = await s.json();
  const st = sj?.data?.status ?? sj?.status;
  process.stdout.write(`  [${i * 6}s] status=${st}\n`);
  if (st === "completed") {
    console.log("✅ DONE — url:", (sj.data.video_url || "").slice(0, 90), "… duration:", sj.data.duration, "s");
    process.exit(0);
  }
  if (st === "failed") { console.error("❌ failed:", JSON.stringify(sj.data?.error)); process.exit(1); }
}
console.log("timed out waiting (video may still be processing)");
