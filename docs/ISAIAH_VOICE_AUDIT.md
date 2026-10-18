# ISAIAH DUPREE VOICE — COMPLETE CROSS-SYSTEM AUDIT (MAC · ORION · ELEVENLABS)

## 0. TL;DR (the one thing that matters)

Every Isaiah voice **model** in existence — the two Qwen3-TTS fine-tunes on ORION and all three ElevenLabs clones — was trained/seeded from **lossy or narrowband audio**, never from the one genuinely clean wideband recording that exists. The best clean real source (`tiktok_voice_ref.wav`, 44.1 kHz, ~16 kHz real bandwidth, 93 s, unclipped) has **never been used to build a model.** That is the whole finding: the ceiling is a data problem, not a model problem, and it is fixable with one clean capture session.

- **Best real reference (use this):** `.../Remotion/public/assets/voices/tiktok_voice_ref.wav` — 44.1 kHz/16-bit, ~16 kHz real HF, unclipped, 93 s. Only true-HIGH real source across all systems.
- **Flagship self-hosted model:** ORION `isaiah-qwen3-tts-youtube-only-20260810` (Qwen3-TTS-1.7B CustomVoice, spk_id `isaiah_dupree=3000`) — but 24 kHz native → ~11 kHz ceiling, and trained on lossy YouTube rips.
- **Best deployable cloud model today:** ElevenLabs `Isaiahdupree_v2` (`k0HDiJKO5QdXkGN6NSLI`) — dialed-in, but an **IVC, not a PVC** (hard quality ceiling).
- **The trap:** the ORION `reference.wav` (16 kHz / 8 kHz bandwidth, MD5 `093197B5…`, **35 byte-identical copies**) drove every ORION clone job. All "48 kHz wideband" VoxCPM2/Zonos outputs are **synthetic HF fabricated from that 8 kHz seed** — clean-measuring but not real Isaiah detail.

---

## 1. MASTER TABLE — every Isaiah model, reference, and notable output

### A. VOICE MODELS / CLONES

| # | Model | System | Kind | Tier | Key measurements / facts |
|---|-------|--------|------|------|--------------------------|
| M1 | `isaiah-qwen3-tts-youtube-only-20260810` | ORION | Fine-tune checkpoint | **MEDIUM (flagship)** | Qwen3-TTS-12Hz-1.7B CustomVoice; spk_id `isaiah_dupree=3000`; 24 kHz native → ~11 kHz eff BW. 4.53 GB `checkpoint.tar` (sha `7915c369…`); unpacked `model.safetensors` (sha `f44a67e0…`). Receipt: `promotion_allowed=false`, `publishing_allowed=false`. Trained "YouTube-only" — **no training manifest retained on-box.** |
| M2 | `isaiah-qwen3-tts-draft-20260810` | ORION | Fine-tune checkpoint (draft) | **MEDIUM (superseded)** | Same base/spk_id. `model.safetensors` 3.83 GB + `speech_tokenizer` 682 MB + 4.52 GB tar. 24 kHz. Own render samples **CLIP** (draft-003 peak 0.00 dB / flat-factor 2.18; draft-004 −0.00 / 4.44). Superseded by M1. |
| M3 | **Isaiah Dupree** `7B3f4QcIssMg3thV5ypj` | ElevenLabs | IVC clone (original) | Cloud IVC | `category=cloned`. 25 source samples = self-recordings **2020–2022** (WIN_20200707…, largest 8.7 MB). Settings: stab 0.55 / sim 0.54 / style 0.33. **NOT a PVC.** |
| M4 | **Isaiahdupree_v2** `k0HDiJKO5QdXkGN6NSLI` | ElevenLabs | IVC clone (production) | Cloud IVC (best-tuned) | 3 samples. Dialed-in: stab 0.5 / **sim 0.84** / style 0.34 / speed 1.04. The production Isaiah IVC. **NOT a PVC.** |
| M5 | **Isaiah-AB-Test** `xlC7hBNjAYkjWCiqxaHJ` | ElevenLabs | IVC clone (temp) | Disposable | 1 sample `isaiah_90s.mp3` (90 s, 3.97 MB), default settings. Created this session; safe to delete. |
| M6 | **"Untitled voice"** `K33VzGoBGgEQLHAJxmDP` | ElevenLabs | Empty *professional* slot | **UNUSABLE / unattributed** | Only self-created professional slot (not library-copied). **0 samples, empty `fine_tuning` state** → not a trained PVC. Cannot be confirmed as Isaiah. This is the slot to fill if a real PVC is ever trained. |
| — | *NO local model on Mac* | MAC | — | — | No `.pth/.safetensors/.onnx` Isaiah checkpoint on the Mac; models run remotely (ORION). Mac holds only reference audio + generated outputs. |

### B. REFERENCE AUDIO (real Isaiah voice)

| # | File | System | Tier | Key measurements |
|---|------|--------|------|------------------|
| R1 | `…/Remotion/public/assets/voices/tiktok_voice_ref.wav` | MAC | **HIGH** | 44.1 kHz/16-bit mono, **93.06 s**, real HF to **~16 kHz** (steep genuine roll-off, not upsampled), mean −27.7 / max −5.9 (unclipped, quiet). **Best clean real source anywhere.** |
| R2 | `…/voices/tiktok_voice_short.wav` | MAC | **HIGH** | 44.1 kHz, 15 s, ~16 kHz, mean −27.1 / max −8.4. Trimmed subset of R1. |
| R3 | `…/voices/isaiah.wav` | MAC | MEDIUM | 22.05 kHz mono, **656.26 s (~11 min)** — longest real source. Nyquist-capped → **~10.8 kHz BW** (muffled). Hot: max −0.9. Origin ambiguous (22.05 kHz = TTS-rate export). |
| R4 | `…/foundry-state/…/isaiah-youtube-qwen3-samples/…-clean-sample-001.norm.wav` | MAC | MEDIUM | **Fake 192 kHz** upsample of lossy YouTube; real ~15 kHz, 3.76 s. *Actual Qwen3 clone reference.* |
| R5 | `…-clean-sample-002.norm.wav` | MAC | MEDIUM | Fake 192 kHz, duller ~13 kHz, 5.92 s (longest of the 3). |
| R6 | `…-clean-sample-003.norm.wav` | MAC | MEDIUM | Fake 192 kHz, ~15 kHz, 4.88 s. |
| R7 | `C:\orion\foundry\jobs\audio8-tts-isaiah-probe-001\reference.wav` | ORION | **LOW (contaminating)** | 16 kHz mono → **8 kHz BW ceiling**. MD5 `093197B548F0…`, **35 byte-identical copies**; drove EVERY ORION clone. Peak −1.6, RMS −19.7, noise floor −37.8. |
| R8 | `C:\orion\foundry\jobs\isaiah-stage-capture-001\inputs\audio.wav` | ORION | LOW | Real stage capture, 16 kHz → 8 kHz BW, 6.02 s, quiet (RMS −28.3 / peak −10.5). Companion `source.mp4` has **no audio**; result mp4 is AAC 16 kHz 61 kbps → no higher-fi take exists. |
| R9 | `…/talent-discovery/pilot/isaiah-voice.wav` | MAC | LOW | 16 kHz → 8 kHz BW, 5 s. Avatar/lipsync model INPUT, not a voice source. |
| R10 | `…/avatar-video/isaiah-orion-model-probe-001/isaiah-probe-5s.wav` | MAC | LOW | 16 kHz → 8 kHz, 5 s (re-encoded twin of R9, different SHA). |
| R11 | `…/isaiah-probe-2s.wav` | MAC | LOW | 16 kHz → 8 kHz, 2 s. |

### C. NOTABLE OUTPUTS (generated — never use as references)

| # | File | System | Tier | Key measurements |
|---|------|--------|------|------------------|
| O1 | `…jobs\voxcpm2-isaiah-content-team-day1-5m-001\speech.wav` | ORION | HIGH (by measurement) | 48 kHz, **298.24 s**, real to ~17 kHz, noise floor −inf. **Widest/cleanest long Isaiah-timbre** — but peak −0.0 (near-clip) and **synthetic** (HF fabricated from 8 kHz seed). |
| O2 | `…jobs\voxcpm2-isaiah-ltx23-minute-001\speech.wav` | ORION | HIGH | 48 kHz, 66.88 s, ~16 kHz, nf −40.6. Synthetic. |
| O3 | `…jobs\voxcpm2-isaiah-marketing-10s-001\speech.wav` | ORION | HIGH | 48 kHz, 11.2 s, ~16 kHz, no clip. Synthetic. |
| O4/O5 | `…jobs\orion-duration-record-001/002-tts\speech.wav` | ORION | HIGH | 48 kHz, 48 s / 50.56 s, ~16 kHz, no clip. Synthetic (VoxCPM2 family). |
| O6 | `…jobs\zonos-tts-isaiah-probe-001\speech.wav` | ORION | MEDIUM | 44.1 kHz, **widest ~19 kHz**, nf −59.7, but peak −0.0 / flat-factor 4.44 = limiting. Synthetic. |
| O7 | `…jobs\ab-voice-test-001\speech.wav` | ORION | MEDIUM | **Flagship M1 output.** 24 kHz, 14.72 s, ~11 kHz, nf −66.8, no clip, flat-factor 0. Cleanest qwen3-native Isaiah render. |
| O8 | `…jobs\qwen3-youtube-only-isaiah-marketing-10s-001\speech.wav` | ORION | MEDIUM | M1 output w/ ref-prompt. 24 kHz, 8.56 s, ~10.5 kHz, nf −45.6. |
| O9 | `…/Remotion/public/audio/market-report-10min-combined.wav` | MAC | MEDIUM | Synthetic VO, 24 kHz, **1077 s (~18 min)**, ~11 kHz, **UNCLIPPED (max −5.5)** — the only long Mac VO without clipping. |
| O10 | `…/Remotion/public/audio/architect_vo.wav` (+ devvlog, market-report-2026-03-13, podcast, preset-store, safari-auto, video-studio) | MAC | LOW | Synthetic Remotion VOs, 24 kHz, **CLIPPED at 0.0 dBFS.** Finished video VOs only. |
| O11 | ORION draft/clip outputs: `isaiah-qwen3-draft-sample-003/004`, `orion-quality-10s-chatterbox-001` (flat-factor **7.65**, worst on box), `audio8-tts-isaiah-probe-001` | ORION | LOW | 24–44.1 kHz, clipped / flat-factor / fake-HQ container. |
| O12 | Mac `avatar-tts` probe set: `qwen3/voxcpm2/cosyvoice/chatterbox/zonos/moss/dots/audio8-…-probe-001.wav` + `marketing-10s` + `qwen3-draft-sample-004` | MAC | MEDIUM | 24 kHz synthetic clone outputs (mirrors of ORION jobs). Model outputs, not references. |

*(Omitted from table but noted: ~10 per-segment Remotion VO shards `…-seg*`, the `.raw.wav` twins of every ORION probe, and ~30 HeyGen campaign avatar-TTS **mp3s** under `foundry-state/work/{campaigns,heygen}/isaiah-founder-systems-week-*` — all lossy generated_output, none reference-grade.)*

---

## 2. WHERE THE BEST QUALITY IS — ranked

**Ranked by usefulness as a clean seed for a new build:**

1. **`…/Remotion/public/assets/voices/tiktok_voice_ref.wav` (MAC) — the winner.** 44.1 kHz, ~16 kHz genuine bandwidth with a real steep roll-off (>11k −59, >16k −72, >20k dead −91 = not upsampled), unclipped, 93 s of real Isaiah. Only true-HIGH real recording across all three systems. Just quiet (mean −27.7) — normalize +8–10 dB. **One caveat:** the ~16 kHz ceiling implies a lossy codec somewhere upstream, so it's the best available but still not studio-pristine.
2. **`tiktok_voice_short.wav` (MAC)** — same spectral profile, 15 s. Treat as a subset of #1, not independent material.
3. **`isaiah.wav` (MAC)** — by far the longest real source (**~11 min**), invaluable for volume/phonetic coverage, **but** hard-capped at 22.05 kHz (~10.8 kHz BW, muffled) and hot (−0.9). Use for *quantity*, not to define the timbre target. Origin (real vs TTS export) is ambiguous.
4. **`isaiah-youtube-qwen3-clean-sample-001/003/002.norm.wav` (MAC)** — real ~13–15 kHz but from a **lossy YouTube origin** wrapped in a fake 192 kHz container (broadband noise shelf above 16 kHz), each only 3.8–5.9 s. Content variety only; downsample 192k→48k first.

**Best *synthetic* Isaiah-timbre audio (for reuse in videos, NOT for training):** ORION VoxCPM2 48 kHz clones (O1 content-team-5m ~17 kHz; O2 ltx-minute; O3 marketing-10s; O4/O5 orion-duration). They measure cleanest and widest — but **every kHz above ~8 kHz is vocoder-invented** from the 8 kHz reference, so they are excellent finished audio and useless as a fidelity source.

**Best *deployable model* right now:** ElevenLabs **`Isaiahdupree_v2`** (`k0HDiJKO5QdXkGN6NSLI`) for cloud, ORION **`isaiah-qwen3-tts-youtube-only`** (M1) for self-hosted. Both are MEDIUM-ceiling by construction.

---

## 3. CONTAMINATION MAP — do NOT seed a clone/fine-tune from these

**(a) Narrowband real clips (16 kHz → 8 kHz bandwidth, telephone-grade):**
- ORION `…\audio8-tts-isaiah-probe-001\reference.wav` — **the single most consequential contaminant.** MD5 `093197B5…`, **35 byte-identical copies**, drove every ORION clone/probe. 8 kHz ceiling.
- ORION `…\isaiah-stage-capture-001\inputs\audio.wav` — real but 16 kHz + quiet.
- MAC `…/talent-discovery/pilot/isaiah-voice.wav`, `…/isaiah-orion-model-probe-001/isaiah-probe-5s.wav`, `…/isaiah-probe-2s.wav` — 16 kHz avatar/lipsync inputs.
- **Why:** <11 kHz true bandwidth caps timbre at "phone call." Any model seeded here inherits a permanent narrowband ceiling.

**(b) Synthetic outputs (model → training = collapse):**
- ALL Mac `avatar-tts` probes (qwen3, voxcpm2, cosyvoice, chatterbox, zonos, moss-nano, dots, audio8) + `marketing-10s` + `qwen3-draft-sample-004`.
- ALL ORION `jobs/*/speech.wav` clone outputs (VoxCPM2, Zonos, dots, MOSS, Chatterbox, qwen3 0.6B/1.7B renders) — including the clean-looking 48 kHz VoxCPM2 files.
- ALL Mac Remotion `public/audio/*` VOs.
- **Why:** synthetic; HF is fabricated. Training on model output = model collapse.

**(c) Clipped / limited outputs (also degraded):** Mac `architect_vo / devvlog / market-report-2026-03-13 / podcast / preset-store / safari-auto / video-studio` (all max 0.0 dBFS); ORION `isaiah-qwen3-draft-sample-003/004` (flat-factor 2.18/4.44), `orion-quality-10s-chatterbox-001` (flat-factor 7.65), `audio8-…probe-001` (fake-HQ 44.1 kHz but ~12 kHz real + flat-factor 3.52).

**(d) Fake-HQ containers (rate lies):** the three Mac YouTube samples (192 kHz container, ~15 kHz real); ORION Audio8 (44.1 kHz→~12 kHz), dots.tts & MOSS (48 kHz→~13 kHz). Don't trust the sample-rate header — use the measured bandwidth.

### Were the existing fine-tunes trained on contaminated audio? — **Yes, both.**
- **ORION draft (M2)** and the **clone-probe lineage** (VoxCPM2/Zonos/etc.): traced directly to the **8 kHz `reference.wav`** → timbre-capped at ~8 kHz, HF fabricated.
- **ORION youtube-only flagship (M1):** trained on "Isaiah YouTube audio," but **no training manifest was retained on either box**, so it can't be verified directly. **Cross-referencing MAC ↔ ORION** resolves it: the surviving YouTube training material is the Mac `isaiah-youtube-qwen3-samples` (~13–15 kHz real, lossy YouTube, fake 192 kHz). So M1 was **almost certainly trained on lossy ~13–15 kHz YouTube rips** — better than the 8 kHz clone seed, but still short of the clean 44.1 kHz TikTok reference, and additionally capped at 24 kHz native output (~11 kHz). **Net: no Isaiah model was ever trained on the best clean source (R1).**

---

## 4. CANONICAL CLEAN VOICE SET + next step

### 4.1 Standardize on this exact set (clean real Isaiah only)

**Golden seed (single source of truth):**
- `/Users/isaiahdupree/Documents/Software/Remotion/public/assets/voices/tiktok_voice_ref.wav`
  → Normalize to **−16 LUFS, true-peak −3 dBFS** before any use (it's ~11 dB too quiet). This becomes the one file every clone/prompt points at.

**Approved supplements:**
- `tiktok_voice_short.wav` — only if you need a 15 s cut (subset of the golden seed).
- `isaiah.wav` (22.05 kHz, 11 min) — use for **duration/phonetic backfill only**, after taming the −0.9 peak. Do **not** let its 10.8 kHz ceiling define the model target; exclude it from a wideband PVC training set.
- `isaiah-youtube-qwen3-clean-sample-001/002/003.norm.wav` — **content variety only**, and first `resample 192000→48000` to discard the fake noise shelf. Flag as lossy.

**Banned from any training/seed set:** everything in Section 3 — especially the 35 copies of the 8 kHz ORION `reference.wav`, all synthetic `speech.wav`/probe outputs, and all clipped Remotion VOs.

### 4.2 Which model to make canonical
- **Cloud / production:** train a real **ElevenLabs PVC** into slot `K33VzGoBGgEQLHAJxmDP` (or a fresh slot) — **not another IVC.** All three current Isaiah voices (M3/M4/M5) are IVCs and cannot reach PVC fidelity no matter how settings are tuned.
- **Self-hosted:** re-cut and **retrain the Qwen3-TTS-1.7B CustomVoice** (`isaiah_dupree` / spk_id 3000) from the clean seed, superseding `isaiah-qwen3-tts-youtube-only-20260810`. Be aware Qwen3's **24 kHz native output caps effective BW at ~12 kHz regardless of seed** — if you want genuinely wideband (>12 kHz) synthesis, run **VoxCPM2 (48 kHz)** but seed it from the clean capture, not the 8 kHz reference.

### 4.3 The concrete next step (the actual unlock)
The gating problem is **data, not models.** Do this in order:

1. **Capture a fresh clean corpus.** 30–45 min of Isaiah, **48 kHz / 24-bit WAV**, one cardioid mic at fixed distance, treated/quiet room, peaks held to **−3 to −6 dBFS**, scripted for phonetic + prosodic coverage. This is the only way to break the ~8–16 kHz ceiling that every current asset inherits.
2. **Cut two deliverables** from it: a **90 s "golden reference"** (drop-in replacement for `tiktok_voice_ref.wav` and for the 35 ORION `reference.wav` copies) + the full **30+ min corpus** (PVC/fine-tune training set).
3. **Rebuild all three stacks from the clean corpus:** (a) replace the 8 kHz `reference.wav` everywhere on ORION; (b) retrain the Qwen3 CustomVoice fine-tune → new dated checkpoint; (c) train the ElevenLabs **PVC** → new production voice.
4. **Housekeeping:** delete the 34 redundant `reference.wav` copies (keep one, quarantined), delete the `Isaiah-AB-Test` ElevenLabs voice after the A/B, and retain the ORION training manifest this time so provenance is measurable.
5. **Until capture happens:** standardize on the normalized `tiktok_voice_ref.wav` as the single interim seed, and stop seeding anything from the 16 kHz reference or from synthetic outputs.

### 4.4 Honest gaps / unknowns
- **No training manifest** exists on ORION for either fine-tune — M1's exact corpus is inferred (via the Mac YouTube samples), not proven.
- **`isaiah.wav`** real-vs-synthetic origin is ambiguous (22.05 kHz = common TTS export rate).
- The **25 original ElevenLabs samples (2020–2022)** on M3 live on ElevenLabs' servers and were **not downloaded or spectrally measured** — they may contain additional real Isaiah audio usable for a PVC. Unknown until pulled and analyzed. Worth checking before assuming a fresh capture is the *only* path to 30 min.
- **Total clean real audio on-hand today ≈ 93 s wideband (R1) + ~11 min band-limited 22 kHz (R3) ≈ 12.5 min** — below the ~30 min a quality PVC wants, which is why fresh capture (or recovering the EL originals) is the load-bearing step.