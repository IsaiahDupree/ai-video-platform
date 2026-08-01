// Technical-quality QC gate (research doc gate 4 / PRD Phase 1 gate (b)) — "reusing
// OpenMontage's demonstrated checks (FFprobe validation, black-frame/frozen-frame
// detection, audio clipping)". Real ffmpeg filters, real parsing of their real stderr
// output — not a stub that always returns pass.
//
// Reuses this repo's existing src/lib/VideoQAInspector.checkDuration for the
// FFprobe/duration validation leg (already real, already tested) rather than
// reimplementing it; adds the three detectors OpenMontage has that this repo didn't:
// black-frame, frozen-frame, audio-clipping.
import { spawnSync } from 'child_process';
import type { QCFinding, QCGateResult } from '../types.ts';
import { checkDuration } from '../../../src/lib/VideoQAInspector.ts';
import { probeStreams, measureDurationSeconds } from '../duration.ts';

export interface TechnicalGateOptions {
  blackDurationThresholdSec?: number; // flag black segments >= this long
  // Per-pixel luma threshold (0-1, fraction of max luma) for blackdetect's pix_th — how
  // dark a pixel must be to count as "black". ffmpeg's own default (0.10) treats this
  // repo's real dark-theme background (youtube_explainer_v2's #0a0a0a/#111827 gradient,
  // luma ~0.04-0.09) as black on any frame where foreground text/graphics cover only a
  // small fraction of the screen — a false positive on a legitimately dark UI, not a
  // render defect. Verified against a real render: default 0.10 flagged 20+s of a frame
  // that visibly has readable white heading/body text, the EverReach watermark, and a
  // progress bar over the intentional dark gradient. 0.02 (luma ~5/255) only fires on
  // near-absolute-zero luma — true broken/blank frames — while leaving a real dark theme
  // (luma ~10-24) alone.
  blackPixelLumaThreshold?: number;
  freezeDurationThresholdSec?: number; // flag frozen segments >= this long
  clipPeakDbThreshold?: number; // peak dB at/above this is treated as at digital full scale
  clipSampleRatioThreshold?: number; // fraction of samples at peak level to call it "clipped" vs one loud transient
  durationTolerancePct?: number;
}

const DEFAULTS: Required<TechnicalGateOptions> = {
  blackDurationThresholdSec: 0.5,
  blackPixelLumaThreshold: 0.02,
  freezeDurationThresholdSec: 2.0,
  clipPeakDbThreshold: -0.1,
  clipSampleRatioThreshold: 0.01,
  durationTolerancePct: 2.0,
};

function runFfmpegAnalysisCapture(filePath: string, hasVideo: boolean, hasAudio: boolean, opts: Required<TechnicalGateOptions>): string {
  // ffmpeg logs filter output to stderr even on a normal (exit 0) run, so capture via
  // spawnSync explicitly rather than execFileSync (which only surfaces stderr on throw).
  const args: string[] = ['-i', filePath];
  if (hasVideo) {
    args.push('-vf', `blackdetect=d=${opts.blackDurationThresholdSec}:pic_th=0.98:pix_th=${opts.blackPixelLumaThreshold},freezedetect=n=-60dB:d=${opts.freezeDurationThresholdSec}`);
  } else {
    args.push('-vn');
  }
  if (hasAudio) {
    args.push('-af', 'astats=metadata=1:reset=0');
  } else {
    args.push('-an');
  }
  args.push('-f', 'null', '-');
  const result = spawnSync('ffmpeg', args, { encoding: 'utf8' });
  return (result.stderr || '') + (result.stdout || '');
}

function parseBlackSegments(log: string, thresholdSec: number): Array<{ start: number; end: number; duration: number }> {
  const out: Array<{ start: number; end: number; duration: number }> = [];
  const re = /black_start:([\d.]+)\s+black_end:([\d.]+)\s+black_duration:([\d.]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(log))) {
    const duration = parseFloat(m[3]);
    if (duration >= thresholdSec) {
      out.push({ start: parseFloat(m[1]), end: parseFloat(m[2]), duration });
    }
  }
  return out;
}

function parseFreezeSegments(
  log: string,
  totalDurationSec: number,
  thresholdSec: number
): Array<{ start: number; duration: number; toEof: boolean }> {
  const starts = [...log.matchAll(/lavfi\.freezedetect\.freeze_start:\s*([\d.]+)/g)].map((m) => parseFloat(m[1]));
  const durations = [...log.matchAll(/lavfi\.freezedetect\.freeze_duration:\s*([\d.]+)/g)].map((m) => parseFloat(m[1]));

  const out: Array<{ start: number; duration: number; toEof: boolean }> = [];
  for (let i = 0; i < starts.length; i++) {
    if (i < durations.length) {
      if (durations[i] >= thresholdSec) out.push({ start: starts[i], duration: durations[i], toEof: false });
    } else {
      // Freeze never ended before EOF — treat as frozen through the end of the clip.
      const dur = totalDurationSec - starts[i];
      if (dur >= thresholdSec) out.push({ start: starts[i], duration: dur, toEof: true });
    }
  }
  return out;
}

function parseClipping(
  log: string,
  peakDbThreshold: number,
  sampleRatioThreshold: number
): {
  peakDb: number | null;
  peakCount: number | null;
  numSamples: number | null;
  clipped: boolean;
  plateauClip: boolean;
  overshootClip: boolean;
} {
  const peakDbMatches = [...log.matchAll(/Peak level dB:\s*(-?[\d.]+)/g)];
  const peakCountMatches = [...log.matchAll(/Peak count:\s*([\d.]+)/g)];
  const sampleMatches = [...log.matchAll(/Number of samples:\s*(\d+)/g)];

  const peakDb = peakDbMatches.length ? parseFloat(peakDbMatches[peakDbMatches.length - 1][1]) : null;
  const peakCount = peakCountMatches.length ? parseFloat(peakCountMatches[peakCountMatches.length - 1][1]) : null;
  const numSamples = sampleMatches.length ? parseInt(sampleMatches[sampleMatches.length - 1][1], 10) : null;

  // Two independent clipping signatures, either one is sufficient:
  //   (a) PCM-style hard clip: a flat-topped waveform plateau — a large fraction of
  //       samples pinned at exactly the peak value — even if the measured peak dB is
  //       just under the strict overshoot bar. Uses a looser "loud" dB floor (-3dB)
  //       since the plateau ratio itself is the real proof here.
  //   (b) Lossy-codec overshoot: the render pipeline's real output is h264+AAC, and AAC
  //       does NOT reproduce a flat clipped plateau (its psychoacoustic transform smears
  //       the overs across very few samples) — instead an over-driven source decodes with
  //       Peak level dB pushed at or above digital full scale (0 dBFS), often well above
  //       it. Measured directly: a 30dB-hot sine re-encoded through AAC peaks at +11.5dB
  //       with only 2/286720 samples at that exact value — (a)'s ratio test alone would
  //       miss this real-world case entirely, which is why both checks exist.
  const LOUD_FLOOR_DB = -3;
  const plateauClip = peakDb !== null && peakDb >= LOUD_FLOOR_DB && peakCount !== null && !!numSamples && peakCount / numSamples >= sampleRatioThreshold;
  const overshootClip = peakDb !== null && peakDb >= peakDbThreshold;
  const clipped = plateauClip || overshootClip;
  return { peakDb, peakCount, numSamples, clipped, plateauClip, overshootClip };
}

export function runTechnicalQualityGate(
  filePath: string,
  expectedDurationSec: number,
  options: TechnicalGateOptions = {}
): QCGateResult {
  const opts = { ...DEFAULTS, ...options };
  const findings: QCFinding[] = [];

  // 1. FFprobe structural validation.
  const streams = probeStreams(filePath);
  if (!streams.hasVideo && !streams.hasAudio) {
    findings.push({ severity: 'block', rule: 'ffprobe_validation', detail: 'File has neither a video nor an audio stream — ffprobe validation failed.' });
    return { gate: 'technical_quality', pass: false, findings, checked_at: new Date().toISOString() };
  }

  // 2. Duration validation — reuse the existing, tested checker when we have video.
  let measuredDuration: number;
  if (streams.hasVideo) {
    const durCheck = checkDuration(filePath, expectedDurationSec, opts.durationTolerancePct);
    measuredDuration = durCheck.renderedDurationSec;
    if (!durCheck.valid) {
      findings.push({ severity: 'block', rule: 'duration_validation', detail: durCheck.issue! });
    }
  } else {
    measuredDuration = measureDurationSeconds(filePath);
    const deltaPct = expectedDurationSec > 0 ? (Math.abs(measuredDuration - expectedDurationSec) / expectedDurationSec) * 100 : 100;
    if (deltaPct > opts.durationTolerancePct) {
      findings.push({
        severity: 'block',
        rule: 'duration_validation',
        detail: `Duration mismatch: measured=${measuredDuration.toFixed(2)}s expected=${expectedDurationSec.toFixed(2)}s delta=${deltaPct.toFixed(2)}%`,
      });
    }
  }

  // 3. Black-frame / frozen-frame / audio-clipping — one ffmpeg pass.
  const log = runFfmpegAnalysisCapture(filePath, streams.hasVideo, streams.hasAudio, opts);

  if (streams.hasVideo) {
    const blacks = parseBlackSegments(log, opts.blackDurationThresholdSec);
    for (const b of blacks) {
      findings.push({
        severity: 'block',
        rule: 'black_frame_detection',
        detail: `Black segment ${b.start.toFixed(2)}s-${b.end.toFixed(2)}s (${b.duration.toFixed(2)}s) >= threshold ${opts.blackDurationThresholdSec}s`,
      });
    }

    const freezes = parseFreezeSegments(log, measuredDuration, opts.freezeDurationThresholdSec);
    for (const f of freezes) {
      findings.push({
        severity: 'block',
        rule: 'frozen_frame_detection',
        detail: `Frozen segment starting ${f.start.toFixed(2)}s, duration ${f.duration.toFixed(2)}s${f.toEof ? ' (through end of clip)' : ''} >= threshold ${opts.freezeDurationThresholdSec}s`,
      });
    }
  }

  if (streams.hasAudio) {
    const clip = parseClipping(log, opts.clipPeakDbThreshold, opts.clipSampleRatioThreshold);
    if (clip.clipped) {
      const signals: string[] = [];
      if (clip.overshootClip) signals.push(`peak ${clip.peakDb?.toFixed(3)}dB >= overshoot threshold ${opts.clipPeakDbThreshold}dB`);
      if (clip.plateauClip) signals.push(`${clip.peakCount}/${clip.numSamples} samples (${((clip.peakCount! / clip.numSamples!) * 100).toFixed(2)}%) pinned at peak >= plateau threshold ${(opts.clipSampleRatioThreshold * 100).toFixed(1)}%`);
      findings.push({
        severity: 'block',
        rule: 'audio_clipping_detection',
        detail: `Audio clipping detected: ${signals.join(' AND ')}`,
      });
    }
  }

  const pass = findings.every((f) => f.severity !== 'block');
  return { gate: 'technical_quality', pass, findings, checked_at: new Date().toISOString() };
}
