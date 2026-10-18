#!/usr/bin/env python3
"""
orion_voxcpm2_voiceover.py
==========================

Reusable Mac-side driver that generates a full multi-segment podcast voiceover at
**48 kHz** in Isaiah's cloned voice using the **Orion VoxCPM2** engine, seeded from the
clean golden reference (`clean-seed-voice-001`).

This is the AI Podcast Factory's default *voice step* -- it replaces the old 24 kHz
IndexTTS2 path. It closes the automation gap end to end:

    TTS (per segment, on Orion) -> scp back -> concatenate -> emit timed
    `voiceover_segments` ready to drop into a Remotion PodcastClipBrief.

--------------------------------------------------------------------------------
CLI
--------------------------------------------------------------------------------
    python3 scripts/orion_voxcpm2_voiceover.py --segments segs.json --out-name my-episode

    # segs.json is a JSON list of strings, OR a list of {"text": "..."} objects, OR
    # an object like {"segments": [...]}.

    Optional:
      --also-copy "/Volumes/My Passport/renders/my-episode-combined.wav"
      --fps 30
      --reference-audio /mnt/c/orion/foundry/jobs/clean-seed-voice-001/reference_seed.wav
      --host orion

--------------------------------------------------------------------------------
Importable
--------------------------------------------------------------------------------
    from orion_voxcpm2_voiceover import generate_voiceover
    result = generate_voiceover(segments, "my-episode")
    #   -> {"voiceover_path", "voiceover_segments", "totalFrames", ... extras}

--------------------------------------------------------------------------------
How it works (Orion mechanics -- proven, reused exactly)
--------------------------------------------------------------------------------
For every segment:
  1. Normalize numbers in the text for clean TTS ("$1.65 million" -> "one point six
     five million dollars", "68%" -> "sixty-eight percent", "1,000" -> "one thousand").
  2. Write a per-segment `request.json` (same shape as the working example
     `clean-seed-voice-001/request.json`) into its own Windows job dir
     `C:\\orion\\foundry\\jobs\\vo-<out_name>-seg<N>\\`.
  3. Run the proven VoxCPM2 runner synchronously on Orion:
       /opt/orion/engines/VoxCPM2/.venv/bin/python /opt/orion/bin/orion-avatar-tts.py <req>
     (run_voxcpm2: model.generate, cfg_value=2.0, inference_timesteps=10,
      normalize=True; native 48 kHz).
  4. scp the resulting `speech.wav` back to Remotion/public/audio/<out_name>-seg<N>.wav.

Then locally (Mac has ffmpeg/ffprobe):
  5. Concatenate segment WAVs in order -> one combined 48 kHz mono WAV.
  6. Measure each segment's real duration (ffprobe) and accumulate frames at `fps`:
       startFrame_i = round(cumulative_before_i * fps)
       endFrame_i   = round(cumulative_after_i  * fps)   (== next startFrame)
       totalFrames  = round(total_sec * fps)             (== last endFrame)
  7. Emit the combined WAV into Remotion/public/audio/ plus a sidecar JSON with
     {voiceover_path, voiceover_segments, totalFrames} ready for a PodcastClipBrief.

NOTE on caption vs speech text: the on-screen `voiceover_segments[].text` keeps the
*original* human-readable text (e.g. "68%", "$1.65 million") so captions read naturally,
while the *normalized* form is what gets spoken by the TTS.

Orion SSH transport: the Windows host runs OpenSSH -> we reach the Ubuntu WSL engine by
piping a bash script over stdin (`ssh <host> 'wsl -d Ubuntu bash -l' < script`), which
avoids all PowerShell quoting pitfalls. `request.json` is delivered base64-encoded so
arbitrary segment text can never break shell quoting.
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Union

# --------------------------------------------------------------------------------
# Constants -- Orion engine wiring (proven working; do not change casually)
# --------------------------------------------------------------------------------
FPS_DEFAULT = 30
ORION_HOST = os.environ.get("ORION_SSH_HOST", "orion")

VENV_PY = "/opt/orion/engines/VoxCPM2/.venv/bin/python"
RUNNER = "/opt/orion/bin/orion-avatar-tts.py"
MODEL_PATH = "/opt/orion/engines/VoxCPM2/pretrained_models/VoxCPM2"

# The ONLY approved reference (48 kHz, ~22 s clean cut). Never use 8/16 kHz or synthetic.
REF_AUDIO_WSL = "/mnt/c/orion/foundry/jobs/clean-seed-voice-001/reference_seed.wav"
REF_TEXT_WSL = "/mnt/c/orion/foundry/jobs/clean-seed-voice-001/reference_seed.txt"

# WSL-visible base for per-segment job dirs (== C:\orion\foundry\jobs)
JOBS_BASE_WSL = "/mnt/c/orion/foundry/jobs"
# Windows path form for scp fetch (OpenSSH serves Windows paths).
JOBS_BASE_WIN = "C:/orion/foundry/jobs"

# Fallback reference text (contents of reference_seed.txt) in case the live fetch fails.
REF_TEXT_FALLBACK = (
    "like there's so many tools there's so many ways of how to use AI there's so "
    "many AI agents out there there's so many like different you know processes and "
    "websites people can visit you got web apps you got mobile apps you got all these "
    "types of things right but let me be honest with you make.com in a and all"
)

# Remotion project layout (this script lives in Remotion/scripts/).
REMOTION_ROOT = Path(__file__).resolve().parent.parent
PUBLIC_AUDIO_DIR = REMOTION_ROOT / "public" / "audio"


# ================================================================================
# Number normalization  (raw display text -> clean spoken text)
# ================================================================================
_ONES = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
    "seventeen", "eighteen", "nineteen",
]
_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]
_SCALES = ["", "thousand", "million", "billion", "trillion"]


def _three_digits_to_words(n: int) -> str:
    """0..999 -> words."""
    words: List[str] = []
    hundreds, rest = divmod(n, 100)
    if hundreds:
        words.append(_ONES[hundreds])
        words.append("hundred")
    if rest:
        if rest < 20:
            words.append(_ONES[rest])
        else:
            tens, ones = divmod(rest, 10)
            words.append(f"{_TENS[tens]}-{_ONES[ones]}" if ones else _TENS[tens])
    return " ".join(words)


def _int_to_words(n: int) -> str:
    if n == 0:
        return "zero"
    chunks: List[tuple[int, int]] = []
    scale = 0
    while n > 0:
        n, chunk = divmod(n, 1000)
        if chunk:
            chunks.append((chunk, scale))
        scale += 1
    parts: List[str] = []
    for chunk, scale in reversed(chunks):
        words = _three_digits_to_words(chunk)
        if _SCALES[scale]:
            words = f"{words} {_SCALES[scale]}"
        parts.append(words)
    return " ".join(parts)


def _num_str_to_words(num_str: str) -> str:
    """'1,000' -> 'one thousand'; '1.65' -> 'one point six five'."""
    num_str = num_str.replace(",", "").strip()
    if "." in num_str:
        int_part, frac_part = num_str.split(".", 1)
        int_words = _int_to_words(int(int_part)) if int_part else "zero"
        frac_words = " ".join(_ONES[int(d)] for d in frac_part if d.isdigit())
        return f"{int_words} point {frac_words}".strip()
    return _int_to_words(int(num_str))


_CUR_RE = re.compile(
    r"\$\s?([\d,]+(?:\.\d+)?)(\s?(million|billion|trillion|thousand|hundred))?",
    re.IGNORECASE,
)
_PCT_RE = re.compile(r"([\d,]+(?:\.\d+)?)\s?%")
_NUM_RE = re.compile(r"\d[\d,]*(?:\.\d+)?")


def normalize_text(text: str) -> str:
    """Convert money / percentages / plain numbers to spoken words for clean TTS.

    Order matters: currency (may carry a scale word + must reorder 'dollars' to the
    end) -> percent -> any remaining plain numbers. Finally collapse whitespace and
    capitalize the first alphabetic character.
    """
    def _currency(m: "re.Match[str]") -> str:
        words = _num_str_to_words(m.group(1))
        scale = m.group(3)
        if scale:
            words = f"{words} {scale.lower()}"
        return f"{words} dollars"

    def _percent(m: "re.Match[str]") -> str:
        return f"{_num_str_to_words(m.group(1))} percent"

    def _plain(m: "re.Match[str]") -> str:
        return _num_str_to_words(m.group(0))

    text = _CUR_RE.sub(_currency, text)
    text = _PCT_RE.sub(_percent, text)
    text = _NUM_RE.sub(_plain, text)
    text = re.sub(r"\s+", " ", text).strip()

    for i, ch in enumerate(text):
        if ch.isalpha():
            text = text[:i] + ch.upper() + text[i + 1:]
            break
    return text


# ================================================================================
# Orion transport helpers
# ================================================================================
def _run(cmd: List[str], *, input_bytes: bytes | None = None, timeout: int = 1800
         ) -> subprocess.CompletedProcess:
    return subprocess.run(
        cmd, input=input_bytes, capture_output=True, timeout=timeout,
    )


def fetch_reference_text(host: str = ORION_HOST) -> str:
    """Read the approved reference_seed.txt contents from Orion (fallback baked in)."""
    try:
        script = f"cat {REF_TEXT_WSL}\n".encode()
        proc = _run(["ssh", host, "wsl -d Ubuntu bash -l"], input_bytes=script, timeout=60)
        text = proc.stdout.decode("utf-8", "replace").strip()
        text = re.sub(r"\s+", " ", text)
        if text:
            return text
    except Exception as exc:  # noqa: BLE001
        print(f"[warn] could not fetch reference_seed.txt ({exc}); using fallback", file=sys.stderr)
    return REF_TEXT_FALLBACK


def _remote_generate_segment(
    host: str,
    job_name: str,
    spoken_text: str,
    reference_text: str,
    reference_audio: str,
) -> Dict[str, Any]:
    """Create + run one VoxCPM2 job on Orion synchronously. Returns the runner's
    result dict augmented with 'seconds'. Raises RuntimeError on failure."""
    job_dir_wsl = f"{JOBS_BASE_WSL}/{job_name}"
    output_path_wsl = f"{job_dir_wsl}/speech.wav"

    request = {
        "engine": "voxcpm2",
        "model_path": MODEL_PATH,
        "text": spoken_text,
        "language": "English",
        "reference_audio": reference_audio,
        "reference_text": reference_text,
        "output_path": output_path_wsl,
        "attention": "sdpa",
        "num_steps": 10,
    }
    req_b64 = base64.b64encode(json.dumps(request).encode("utf-8")).decode("ascii")

    # Bash script piped over stdin into WSL (dodges all PowerShell/zsh quoting issues).
    script = f"""set -e
mkdir -p '{job_dir_wsl}'
printf '%s' '{req_b64}' | base64 -d > '{job_dir_wsl}/request.json'
START=$(date +%s)
set +e
{VENV_PY} {RUNNER} '{job_dir_wsl}/request.json' > '{job_dir_wsl}/result.json' 2> '{job_dir_wsl}/run.log'
RC=$?
set -e
END=$(date +%s)
echo "ORION_RC:$RC"
echo "ORION_SECONDS:$((END - START))"
echo "ORION_RESULT_BEGIN"
cat '{job_dir_wsl}/result.json' 2>/dev/null
echo
echo "ORION_RESULT_END"
if [ "$RC" -ne 0 ]; then
  echo "ORION_LOG_BEGIN"
  tail -n 20 '{job_dir_wsl}/run.log' 2>/dev/null
  echo "ORION_LOG_END"
fi
"""
    proc = _run(["ssh", host, "wsl -d Ubuntu bash -l"], input_bytes=script.encode("utf-8"))
    out = proc.stdout.decode("utf-8", "replace")
    err = proc.stderr.decode("utf-8", "replace")

    rc_m = re.search(r"ORION_RC:(-?\d+)", out)
    sec_m = re.search(r"ORION_SECONDS:(\d+)", out)
    rc = int(rc_m.group(1)) if rc_m else proc.returncode
    seconds = int(sec_m.group(1)) if sec_m else 0

    result_block = ""
    rb = re.search(r"ORION_RESULT_BEGIN\n(.*?)\nORION_RESULT_END", out, re.DOTALL)
    if rb:
        result_block = rb.group(1).strip()

    if rc != 0:
        log_block = ""
        lb = re.search(r"ORION_LOG_BEGIN\n(.*?)\nORION_LOG_END", out, re.DOTALL)
        if lb:
            log_block = lb.group(1)
        raise RuntimeError(
            f"Orion VoxCPM2 job '{job_name}' failed (rc={rc}).\n"
            f"--- run.log tail ---\n{log_block}\n--- ssh stderr ---\n{err}"
        )

    try:
        result = json.loads(result_block) if result_block else {}
    except json.JSONDecodeError:
        result = {"raw": result_block}
    result["seconds"] = seconds
    return result


def _fetch_segment_wav(host: str, job_name: str, dest: Path) -> None:
    """scp speech.wav (Windows path form) back to the Mac."""
    src = f"{host}:{JOBS_BASE_WIN}/{job_name}/speech.wav"
    proc = _run(["scp", "-q", src, str(dest)], timeout=300)
    if proc.returncode != 0 or not dest.is_file() or dest.stat().st_size == 0:
        raise RuntimeError(
            f"scp of '{src}' failed: rc={proc.returncode} "
            f"stderr={proc.stderr.decode('utf-8', 'replace')}"
        )


# ================================================================================
# ffmpeg / ffprobe helpers (local, Mac)
# ================================================================================
def ffprobe_duration(path: Union[str, Path]) -> float:
    proc = _run([
        "ffprobe", "-v", "error", "-select_streams", "a:0",
        "-show_entries", "format=duration", "-of",
        "default=noprint_wrappers=1:nokey=1", str(path),
    ], timeout=60)
    txt = proc.stdout.decode().strip()
    try:
        return float(txt)
    except ValueError as exc:  # noqa: BLE001
        raise RuntimeError(f"ffprobe could not read duration of {path}: {txt!r}") from exc


def ffprobe_stream(path: Union[str, Path]) -> Dict[str, Any]:
    proc = _run([
        "ffprobe", "-v", "error", "-select_streams", "a:0",
        "-show_entries", "stream=sample_rate,channels,duration",
        "-of", "json", str(path),
    ], timeout=60)
    data = json.loads(proc.stdout.decode() or "{}")
    stream = (data.get("streams") or [{}])[0]
    return {
        "sample_rate": int(stream.get("sample_rate", 0)),
        "channels": int(stream.get("channels", 0)),
        "duration": float(stream.get("duration", 0.0) or 0.0),
    }


def measure_mean_volume(path: Union[str, Path]) -> float:
    """Return mean volume in dB (volumedetect). Silence ~ -91 dB or -inf."""
    proc = _run([
        "ffmpeg", "-hide_banner", "-nostats", "-i", str(path),
        "-af", "volumedetect", "-f", "null", "-",
    ], timeout=120)
    err = proc.stderr.decode("utf-8", "replace")
    m = re.search(r"mean_volume:\s*(-?\d+(?:\.\d+)?) dB", err)
    if m:
        return float(m.group(1))
    if re.search(r"mean_volume:\s*-inf", err):
        return float("-inf")
    return 0.0


def concat_wavs(seg_paths: List[Path], out_path: Path) -> None:
    """Concatenate segment WAVs (in order) into one 48 kHz mono PCM WAV."""
    if not seg_paths:
        raise ValueError("no segment WAVs to concatenate")
    cmd: List[str] = ["ffmpeg", "-hide_banner", "-y"]
    for p in seg_paths:
        cmd += ["-i", str(p)]
    filt = "".join(f"[{i}:a]" for i in range(len(seg_paths)))
    filt += f"concat=n={len(seg_paths)}:v=0:a=1[out]"
    cmd += [
        "-filter_complex", filt, "-map", "[out]",
        "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", str(out_path),
    ]
    proc = _run(cmd, timeout=600)
    if proc.returncode != 0 or not out_path.is_file():
        raise RuntimeError(
            f"ffmpeg concat failed: {proc.stderr.decode('utf-8', 'replace')[-1500:]}"
        )


# ================================================================================
# Public API
# ================================================================================
def _coerce_segments(segments: Union[List[Any], Dict[str, Any]]) -> List[str]:
    """Accept list[str], list[{'text':...}], or {'segments':[...]}."""
    if isinstance(segments, dict):
        segments = segments.get("segments") or segments.get("voiceover_segments") or []
    out: List[str] = []
    for seg in segments:
        if isinstance(seg, str):
            out.append(seg)
        elif isinstance(seg, dict):
            txt = seg.get("text") or seg.get("caption") or ""
            out.append(str(txt))
        else:
            out.append(str(seg))
    out = [s.strip() for s in out if s and s.strip()]
    if not out:
        raise ValueError("no non-empty segment texts provided")
    return out


def generate_voiceover(
    segments: Union[List[Any], Dict[str, Any]],
    out_name: str,
    *,
    fps: int = FPS_DEFAULT,
    host: str = ORION_HOST,
    reference_audio: str = REF_AUDIO_WSL,
    reference_text: str | None = None,
    also_copy: Union[str, Path, None] = None,
    audio_dir: Union[str, Path, None] = None,
) -> Dict[str, Any]:
    """Generate a multi-segment 48 kHz voiceover in Isaiah's cloned voice via Orion VoxCPM2.

    Args:
        segments: list of strings (or {"text": ...} objects), one per spoken segment.
        out_name: base name for output files (e.g. "voxcpm2-vo-test").
        fps: frames per second for the emitted voiceover_segments (default 30).
        host: SSH host for Orion (default "orion").
        reference_audio: WSL path to the approved 48 kHz clean seed reference.
        reference_text: transcript of the reference; fetched from Orion if None.
        also_copy: optional extra path to duplicate the combined WAV to.
        audio_dir: output dir for WAVs (defaults to Remotion/public/audio).

    Returns:
        dict with voiceover_path, voiceover_segments, totalFrames, and extras.
    """
    display_texts = _coerce_segments(segments)
    audio_dir_path = Path(audio_dir) if audio_dir else PUBLIC_AUDIO_DIR
    audio_dir_path.mkdir(parents=True, exist_ok=True)

    if reference_text is None:
        reference_text = fetch_reference_text(host)

    print(f"[orion-voxcpm2] {len(display_texts)} segment(s) -> out-name '{out_name}' "
          f"@ {fps}fps  host={host}", file=sys.stderr)

    seg_paths: List[Path] = []
    seg_meta: List[Dict[str, Any]] = []
    total_gen_seconds = 0

    for i, display in enumerate(display_texts):
        spoken = normalize_text(display)
        job_name = f"vo-{out_name}-seg{i}"
        dest = audio_dir_path / f"{out_name}-seg{i}.wav"
        print(f"[orion-voxcpm2] seg{i}: generating ({len(spoken)} chars)...", file=sys.stderr)
        t0 = time.time()
        result = _remote_generate_segment(
            host=host, job_name=job_name, spoken_text=spoken,
            reference_text=reference_text, reference_audio=reference_audio,
        )
        _fetch_segment_wav(host, job_name, dest)
        wall = time.time() - t0
        total_gen_seconds += int(result.get("seconds", 0) or 0)
        stream = ffprobe_stream(dest)
        seg_paths.append(dest)
        seg_meta.append({
            "index": i,
            "job_name": job_name,
            "display_text": display,
            "spoken_text": spoken,
            "wav": str(dest),
            "sample_rate": stream["sample_rate"],
            "duration": stream["duration"],
            "orion_seconds": int(result.get("seconds", 0) or 0),
        })
        print(f"[orion-voxcpm2] seg{i}: {stream['sample_rate']}Hz "
              f"{stream['duration']:.2f}s (orion {result.get('seconds', 0)}s, "
              f"wall {wall:.0f}s) -> {dest.name}", file=sys.stderr)

    # ---- concatenate ----
    combined = audio_dir_path / f"{out_name}-combined.wav"
    concat_wavs(seg_paths, combined)
    combined_stream = ffprobe_stream(combined)
    mean_vol = measure_mean_volume(combined)

    # ---- frame math (accumulate from real per-segment durations) ----
    voiceover_segments: List[Dict[str, Any]] = []
    cumulative = 0.0
    for meta in seg_meta:
        start_frame = round(cumulative * fps)
        cumulative += meta["duration"]
        end_frame = round(cumulative * fps)
        voiceover_segments.append({
            "startFrame": start_frame,
            "endFrame": end_frame,
            "text": meta["display_text"],  # on-screen caption keeps human-readable text
        })
    total_seconds = cumulative
    total_frames = round(total_seconds * fps)

    # ---- optional extra copy ----
    also_copy_path = None
    if also_copy:
        also_copy_path = Path(also_copy)
        try:
            also_copy_path.parent.mkdir(parents=True, exist_ok=True)
            also_copy_path.write_bytes(combined.read_bytes())
            print(f"[orion-voxcpm2] copied combined -> {also_copy_path}", file=sys.stderr)
        except Exception as exc:  # noqa: BLE001
            print(f"[warn] could not copy to {also_copy_path}: {exc}", file=sys.stderr)
            also_copy_path = None

    # ---- brief-ready payload ----
    voiceover_path = f"audio/{combined.name}"  # Remotion staticFile() relative form
    payload: Dict[str, Any] = {
        "voiceover_path": voiceover_path,
        "voiceover_segments": voiceover_segments,
        "totalFrames": total_frames,
    }
    # extras (handy for callers / debugging; not required by the brief)
    payload["_meta"] = {
        "out_name": out_name,
        "fps": fps,
        "combined_wav_abs": str(combined),
        "sample_rate": combined_stream["sample_rate"],
        "channels": combined_stream["channels"],
        "duration_sec": round(combined_stream["duration"], 3),
        "sum_segment_sec": round(total_seconds, 3),
        "mean_volume_db": mean_vol,
        "orion_generation_seconds": total_gen_seconds,
        "also_copy": str(also_copy_path) if also_copy_path else None,
        "segments": seg_meta,
        "reference_audio": reference_audio,
    }

    # ---- sidecar JSON ----
    sidecar = audio_dir_path / f"{out_name}-voiceover.json"
    sidecar.write_text(json.dumps(payload, indent=2))
    payload["_meta"]["sidecar_json"] = str(sidecar)
    print(f"[orion-voxcpm2] wrote sidecar JSON -> {sidecar}", file=sys.stderr)

    return payload


# ================================================================================
# CLI
# ================================================================================
def _load_segments_file(path: Path) -> Union[List[Any], Dict[str, Any]]:
    data = json.loads(path.read_text())
    return data


def main(argv: List[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Generate a 48 kHz multi-segment podcast voiceover in Isaiah's "
                    "cloned voice via the Orion VoxCPM2 engine.")
    parser.add_argument("--segments", required=True,
                        help="Path to a JSON file: list of strings or {text} objects.")
    parser.add_argument("--out-name", required=True,
                        help="Base name for outputs (e.g. voxcpm2-vo-test).")
    parser.add_argument("--fps", type=int, default=FPS_DEFAULT)
    parser.add_argument("--host", default=ORION_HOST)
    parser.add_argument("--reference-audio", default=REF_AUDIO_WSL)
    parser.add_argument("--also-copy", default=None,
                        help="Optional extra path to duplicate the combined WAV to.")
    parser.add_argument("--audio-dir", default=None,
                        help="Override output dir (default Remotion/public/audio).")
    args = parser.parse_args(argv)

    segments = _load_segments_file(Path(args.segments))
    t0 = time.time()
    result = generate_voiceover(
        segments, args.out_name,
        fps=args.fps, host=args.host,
        reference_audio=args.reference_audio,
        also_copy=args.also_copy, audio_dir=args.audio_dir,
    )
    result["_meta"]["wall_seconds"] = round(time.time() - t0, 1)
    # brief-ready object on stdout (extras under _meta)
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
