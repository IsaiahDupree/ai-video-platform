#!/usr/bin/env npx tsx
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

interface ScriptHandoff {
  status: string;
  script: {
    script_id: string;
    topic: string;
    audience: string;
    text: string;
    timeline: Array<{ beat: string; start: number; end: number; text: string }>;
    source_receipt_ids: string[];
    evidence_summary: {
      viral_transcript_patterns: number;
      observed_views_snapshot: number;
    };
  };
  gates: {
    ready_for_render: boolean;
    required_decisions: Record<string, string>;
    latest_audits: Record<
      string,
      { decision: string; score: number; audit_id: string }
    >;
  };
}

const args = process.argv.slice(2);
const valueFor = (name: string, fallback?: string): string | undefined => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const scriptId = valueFor("--script-id");
if (!scriptId) {
  throw new Error(
    "Usage: render-evidence-first-short.ts --script-id <id> [--output /absolute/video.mp4]",
  );
}

const apiBase = valueFor("--api-base", "http://127.0.0.1:6010")!.replace(
  /\/$/,
  "",
);
const voice = valueFor("--voice", "Reed (English (US))")!;
const renderConcurrency = valueFor("--concurrency", "2")!;
const root = path.resolve(__dirname, "..");
const workDir = path.join(root, "work", "evidence-first", scriptId);
const publicDir = path.join(
  root,
  "public",
  "generated",
  "evidence-first",
  scriptId,
);
const outputPath = path.resolve(
  valueFor(
    "--output",
    path.join(root, "output", `${scriptId}-evidence-first.mp4`),
  )!,
);
const propsPath = path.join(workDir, "render-props.json");
const handoffPath = path.join(workDir, "script-handoff.json");
const receiptPath = path.join(workDir, "render-receipt.json");

const run = (command: string, commandArgs: string[]) => {
  execFileSync(command, commandArgs, { stdio: "inherit" });
};

const capture = (command: string, commandArgs: string[]) =>
  execFileSync(command, commandArgs, { encoding: "utf8" }).trim();

const duration = (filePath: string) =>
  Number(
    capture("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=nw=1:nk=1",
      filePath,
    ]),
  );

const atempoChain = (factor: number): string => {
  const stages: number[] = [];
  let remaining = factor;
  while (remaining > 2) {
    stages.push(2);
    remaining /= 2;
  }
  while (remaining < 0.5) {
    stages.push(0.5);
    remaining /= 0.5;
  }
  stages.push(remaining);
  return stages.map((value) => `atempo=${value.toFixed(8)}`).join(",");
};

const sha256 = (filePath: string): string => {
  const hash = createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
};

const main = async () => {
  fs.mkdirSync(workDir, { recursive: true });
  fs.mkdirSync(publicDir, { recursive: true });
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const response = await fetch(
    `${apiBase}/api/scripts/${encodeURIComponent(scriptId)}`,
  );
  if (!response.ok) {
    throw new Error(`Script handoff failed with HTTP ${response.status}`);
  }
  const handoff = (await response.json()) as ScriptHandoff;
  if (handoff.status !== "ok" || !handoff.gates.ready_for_render) {
    throw new Error(`Script ${scriptId} is not ready for render`);
  }
  for (const [auditType, requiredDecision] of Object.entries(
    handoff.gates.required_decisions,
  )) {
    const actual = handoff.gates.latest_audits[auditType]?.decision;
    if (actual !== requiredDecision) {
      throw new Error(
        `Gate ${auditType} is ${actual || "missing"}, expected ${requiredDecision}`,
      );
    }
  }
  fs.writeFileSync(handoffPath, `${JSON.stringify(handoff, null, 2)}\n`);

  const expectedDuration = Math.max(
    ...handoff.script.timeline.map((item) => item.end),
  );
  const rawBeats: Array<{
    beat: (typeof handoff.script.timeline)[number];
    raw: string;
    fitted: string;
    rawDuration: number;
  }> = [];
  for (let index = 0; index < handoff.script.timeline.length; index += 1) {
    const beat = handoff.script.timeline[index];
    if (!(beat.end - beat.start > 0))
      throw new Error(`Invalid timeline duration for ${beat.beat}`);
    const stem = `${String(index + 1).padStart(2, "0")}-${beat.beat}`;
    const raw = path.join(workDir, `${stem}.aiff`);
    const fitted = path.join(workDir, `${stem}.wav`);
    run("say", ["-v", voice, "-r", "165", "-o", raw, beat.text]);
    const rawDuration = duration(raw);
    rawBeats.push({ beat, raw, fitted, rawDuration });
  }

  const totalRawDuration = rawBeats.reduce(
    (total, item) => total + item.rawDuration,
    0,
  );
  if (!(totalRawDuration > 0)) {
    throw new Error("Narration provider returned no usable audio");
  }

  // Preserve one uniform, natural speaking-rate adjustment across the whole
  // script. The gated semantic timeline controls visual pattern changes while
  // this derived timeline keeps word highlighting synchronized to narration.
  const beatFiles: string[] = [];
  const narrationTimeline: Array<{
    beat: string;
    start: number;
    end: number;
    text: string;
  }> = [];
  const narrationSpeedFactors: number[] = [];
  let narrationCursor = 0;
  for (let index = 0; index < rawBeats.length; index += 1) {
    const { beat, raw, fitted, rawDuration } = rawBeats[index];
    const target =
      index === rawBeats.length - 1
        ? expectedDuration - narrationCursor
        : (expectedDuration * rawDuration) / totalRawDuration;
    const speedFactor = rawDuration / target;
    narrationSpeedFactors.push(speedFactor);
    run("ffmpeg", [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      raw,
      "-filter:a",
      `${atempoChain(speedFactor)},apad=pad_dur=${target.toFixed(6)},atrim=0:${target.toFixed(6)}`,
      "-ar",
      "48000",
      "-ac",
      "2",
      "-c:a",
      "pcm_s16le",
      fitted,
    ]);
    beatFiles.push(fitted);
    const narrationEnd = narrationCursor + target;
    narrationTimeline.push({
      beat: beat.beat,
      start: Number(narrationCursor.toFixed(6)),
      end: Number(narrationEnd.toFixed(6)),
      text: beat.text,
    });
    narrationCursor = narrationEnd;
  }

  const concatPath = path.join(workDir, "narration-concat.txt");
  fs.writeFileSync(
    concatPath,
    beatFiles
      .map((file) => `file '${file.replaceAll("'", "'\\''")}'`)
      .join("\n") + "\n",
  );
  const narrationPath = path.join(publicDir, "narration.wav");
  run("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concatPath,
    "-c:a",
    "pcm_s16le",
    narrationPath,
  ]);

  const narrationDuration = duration(narrationPath);
  if (Math.abs(narrationDuration - expectedDuration) > 0.08) {
    throw new Error(
      `Narration duration ${narrationDuration}s does not match timeline ${expectedDuration}s`,
    );
  }

  const props = {
    scriptId: handoff.script.script_id,
    topic: handoff.script.topic,
    audience: handoff.script.audience,
    audioSrc: path.basename(narrationPath),
    timeline: handoff.script.timeline,
    narrationTimeline,
    evidenceSummary: {
      viralTranscriptPatterns:
        handoff.script.evidence_summary.viral_transcript_patterns,
      observedViewsSnapshot:
        handoff.script.evidence_summary.observed_views_snapshot,
    },
    sourceReceiptIds: handoff.script.source_receipt_ids,
  };
  fs.writeFileSync(propsPath, `${JSON.stringify(props, null, 2)}\n`);

  const browserExecutable =
    process.env.REMOTION_BROWSER_EXECUTABLE ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  run("npx", [
    "remotion",
    "render",
    "EvidenceFirstShort",
    outputPath,
    `--props=${propsPath}`,
    "--codec=h264",
    "--crf=18",
    "--pixel-format=yuv420p",
    `--concurrency=${renderConcurrency}`,
    `--public-dir=${publicDir}`,
    `--browser-executable=${browserExecutable}`,
  ]);

  const probe = JSON.parse(
    capture("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate",
      "-of",
      "json",
      outputPath,
    ]),
  );
  const receipt = {
    schema_version: 1,
    receipt_type: "evidence_first_short_render",
    status: "rendered_pending_actual_video_audit",
    created_at: new Date().toISOString(),
    renderer: "remotion/EvidenceFirstShort",
    narration_provider: "macos_say",
    narration_voice: voice,
    script_id: handoff.script.script_id,
    source_receipt_ids: handoff.script.source_receipt_ids,
    input_gate_audits: handoff.gates.latest_audits,
    expected_duration_seconds: expectedDuration,
    narration_duration_seconds: narrationDuration,
    narration_timeline: narrationTimeline,
    narration_speed_factor: Number(
      (
        narrationSpeedFactors.reduce((total, value) => total + value, 0) /
        narrationSpeedFactors.length
      ).toFixed(4),
    ),
    output_path: outputPath,
    output_sha256: sha256(outputPath),
    output_probe: probe,
    render_props_path: propsPath,
  };
  fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        status: "rendered",
        output_path: outputPath,
        receipt_path: receiptPath,
      },
      null,
      2,
    ),
  );
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Evidence-first render failed: ${message}`);
  process.exitCode = 1;
});
