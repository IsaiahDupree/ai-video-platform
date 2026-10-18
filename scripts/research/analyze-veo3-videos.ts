/**
 * Veo3 UGC Ad Research Pipeline
 *
 * For each video:
 *   1. Parse SRT → clean transcript
 *   2. Extract metadata from info.json (title, channel, views, duration)
 *   3. Extract 8 key frames via ffmpeg
 *   4. GPT-4o vision: analyze frames for on-screen text, visual style, shot types
 *   5. GPT-4o text: deep analysis of transcript (hook, structure, CTA, Veo3 prompt patterns)
 *   6. Write per-video markdown doc
 *
 * Then synthesize a master learnings doc + strategy doc.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// ─── Config ──────────────────────────────────────────────────────────────────

const VIDEOS_DIR = 'research/veo3-ugc-analysis/videos';
const FRAMES_DIR = 'research/veo3-ugc-analysis/frames';
const PER_VIDEO_DIR = 'research/veo3-ugc-analysis/per-video';
const DOCS_DIR = 'research/veo3-ugc-analysis';

const VIDEO_IDS = [
  'Z5ull80A-y0',
  'ROULTijOrLY',
  '8ApvS7nE5kQ',
  'WOxMc2gCtVU',
  'T0jn6vABYXI',
  'EjTrPcPOUwA',
  'faDr6Gc8XlQ',
  'AYsg5gAMWyo',
  'HaixBXsJIRI',
  'KTMxEbsInI0',
  'HIiLt3Kb1kQ',
];

// ─── Env ─────────────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = '.env.local';
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not set');
  return key;
}

// ─── SRT Parser ──────────────────────────────────────────────────────────────

function parseSRT(srtPath: string): string {
  if (!fs.existsSync(srtPath)) return '';
  const raw = fs.readFileSync(srtPath, 'utf-8');
  const lines: string[] = [];
  const blocks = raw.split(/\n\n+/);
  for (const block of blocks) {
    const blockLines = block.trim().split('\n');
    // Skip index line and timestamp line, collect text
    const textLines = blockLines.filter(
      (l) => l.trim() && !/^\d+$/.test(l.trim()) && !l.includes('-->')
    );
    for (const t of textLines) {
      // Strip HTML tags and clean
      const clean = t.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
      if (clean && !lines[lines.length - 1]?.includes(clean)) {
        lines.push(clean);
      }
    }
  }
  return lines.join(' ').replace(/\s+/g, ' ').trim();
}

// ─── Metadata ────────────────────────────────────────────────────────────────

interface VideoMeta {
  id: string;
  title: string;
  channel: string;
  duration: number;
  viewCount: number;
  likeCount: number;
  uploadDate: string;
  description: string;
  url: string;
}

function loadMeta(id: string): VideoMeta {
  const jsonPath = path.join(VIDEOS_DIR, `${id}.info.json`);
  if (!fs.existsSync(jsonPath)) {
    return { id, title: id, channel: '', duration: 0, viewCount: 0, likeCount: 0, uploadDate: '', description: '', url: `https://youtube.com/watch?v=${id}` };
  }
  const j = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  return {
    id,
    title: j.title || id,
    channel: j.channel || j.uploader || '',
    duration: j.duration || 0,
    viewCount: j.view_count || 0,
    likeCount: j.like_count || 0,
    uploadDate: j.upload_date || '',
    description: (j.description || '').slice(0, 500),
    url: `https://youtube.com/watch?v=${id}`,
  };
}

// ─── Frame Extraction ────────────────────────────────────────────────────────

function extractFrames(id: string, count = 8): string[] {
  const videoPath = path.join(VIDEOS_DIR, `${id}.mp4`);
  const frameDir = path.join(FRAMES_DIR, id);
  fs.mkdirSync(frameDir, { recursive: true });

  const framePaths: string[] = [];
  for (let i = 0; i < count; i++) {
    framePaths.push(path.join(frameDir, `frame_${String(i + 1).padStart(2, '0')}.jpg`));
  }

  // Check if already extracted
  if (framePaths.every((f) => fs.existsSync(f))) {
    console.log(`   ⏭️  Frames exist for ${id}`);
    return framePaths;
  }

  if (!fs.existsSync(videoPath)) {
    console.log(`   ⚠️  No video file for ${id} — skipping frames`);
    return [];
  }

  try {
    // Get duration
    const dur = parseFloat(
      execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${videoPath}"`, { encoding: 'utf-8' }).trim()
    ) || 60;

    // Extract frames evenly spaced (skip first 2s and last 2s)
    const start = 2;
    const end = Math.max(dur - 2, start + 1);
    const step = (end - start) / (count - 1);

    for (let i = 0; i < count; i++) {
      const t = start + i * step;
      const outPath = framePaths[i];
      if (!fs.existsSync(outPath)) {
        execSync(
          `ffmpeg -ss ${t.toFixed(2)} -i "${videoPath}" -vframes 1 -q:v 3 -vf "scale=960:-1" "${outPath}" -y 2>/dev/null`,
          { stdio: 'pipe' }
        );
      }
    }
    console.log(`   ✅ Extracted ${count} frames for ${id}`);
    return framePaths;
  } catch (e: any) {
    console.log(`   ❌ Frame extraction failed for ${id}: ${e.message}`);
    return [];
  }
}

// ─── GPT-4o Vision Analysis ──────────────────────────────────────────────────

async function analyzeFrames(id: string, framePaths: string[], meta: VideoMeta, apiKey: string): Promise<string> {
  if (framePaths.length === 0) return 'No frames available for visual analysis.';

  const cacheFile = path.join(PER_VIDEO_DIR, `${id}_visual.json`);
  if (fs.existsSync(cacheFile)) {
    return JSON.parse(fs.readFileSync(cacheFile, 'utf-8')).analysis;
  }

  // Build image content array (max 6 frames to keep tokens reasonable)
  const selectedFrames = framePaths.slice(0, 6);
  const imageContent: any[] = selectedFrames.map((fp) => {
    const b64 = fs.readFileSync(fp).toString('base64');
    return { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}`, detail: 'low' } };
  });

  const prompt = `You are analyzing a YouTube video about Veo3 AI video generation for UGC (user-generated content) ads.

Video: "${meta.title}" by ${meta.channel}
URL: ${meta.url}

Analyze these ${selectedFrames.length} frames and provide:

1. **ON-SCREEN TEXT** — List every piece of text visible in the frames (captions, overlays, titles, prompts shown, UI elements)
2. **VISUAL STYLE** — Camera setup, lighting, background, production quality
3. **SHOT TYPES** — Types of shots used (selfie, talking head, screen recording, B-roll, etc.)
4. **CHARACTER/PRESENTER** — Description of presenter if visible (age, style, energy)
5. **VEO3 PROMPTS SHOWN** — If any Veo3 prompts are displayed on screen, transcribe them exactly
6. **AD EXAMPLES SHOWN** — Describe any UGC ad examples demonstrated in the video
7. **KEY VISUAL LEARNINGS** — What visual techniques are being taught/demonstrated?

Be specific and detailed. Focus on extracting actionable Veo3 prompting insights.`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 2000,
      messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, ...imageContent] }],
    }),
  });

  if (!res.ok) throw new Error(`GPT-4o vision ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const result = await res.json() as any;
  const analysis = result.choices[0].message.content;
  fs.writeFileSync(cacheFile, JSON.stringify({ analysis, analyzedAt: new Date().toISOString() }, null, 2));
  return analysis;
}

// ─── GPT-4o Transcript Analysis ──────────────────────────────────────────────

async function analyzeTranscript(id: string, transcript: string, meta: VideoMeta, visualAnalysis: string, apiKey: string): Promise<string> {
  const cacheFile = path.join(PER_VIDEO_DIR, `${id}_transcript.json`);
  if (fs.existsSync(cacheFile)) {
    return JSON.parse(fs.readFileSync(cacheFile, 'utf-8')).analysis;
  }

  if (!transcript || transcript.length < 100) {
    return 'Transcript too short or unavailable for analysis.';
  }

  // Truncate very long transcripts
  const truncated = transcript.length > 8000 ? transcript.slice(0, 8000) + '...[truncated]' : transcript;

  const prompt = `You are a world-class UGC ad strategist and Veo3 AI video expert analyzing a YouTube video.

Video: "${meta.title}" by ${meta.channel}
Duration: ${Math.round(meta.duration / 60)}min | Views: ${meta.viewCount?.toLocaleString()}
URL: ${meta.url}

VISUAL ANALYSIS (from frames):
${visualAnalysis.slice(0, 1000)}

FULL TRANSCRIPT:
${truncated}

Provide an extremely detailed analysis covering:

## 1. HOOK ANALYSIS
- Exact hook line (first 3-5 seconds)
- Hook type (question, pain point, curiosity gap, bold claim, social proof)
- Why it works psychologically

## 2. VIDEO STRUCTURE
- Full breakdown of the video's narrative arc
- Timestamps/sections if identifiable
- Pacing and flow

## 3. VEO3 PROMPT FORMULAS TAUGHT
- Every specific Veo3 prompt formula, template, or technique mentioned
- Exact prompt syntax examples if given
- What makes each formula effective

## 4. UGC AD PATTERNS
- Specific UGC ad structures demonstrated
- Character types recommended
- Setting/environment recommendations
- Dialogue/speech patterns

## 5. TECHNICAL VEO3 INSIGHTS
- Model parameters mentioned (duration, aspect ratio, resolution)
- Audio/speech generation tips
- Common mistakes to avoid
- Quality improvement techniques

## 6. ECOMMERCE vs SOFTWARE AD DIFFERENCES
- Any specific advice for ecommerce products
- Any specific advice for software/SaaS products

## 7. TOP 5 ACTIONABLE TAKEAWAYS
- Numbered list of the most important learnings
- Each with a specific implementation note

## 8. EXACT PROMPT TEMPLATES
- Any verbatim prompt templates shared in the video
- Format them as copy-paste ready templates

Be extremely specific. Quote directly from the transcript where relevant.`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`GPT-4o transcript ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const result = await res.json() as any;
  const analysis = result.choices[0].message.content;
  fs.writeFileSync(cacheFile, JSON.stringify({ analysis, analyzedAt: new Date().toISOString() }, null, 2));
  return analysis;
}

// ─── Per-Video Doc Writer ─────────────────────────────────────────────────────

function writeVideoDoc(id: string, meta: VideoMeta, transcript: string, visualAnalysis: string, transcriptAnalysis: string) {
  const docPath = path.join(PER_VIDEO_DIR, `${id}.md`);
  const duration = `${Math.floor(meta.duration / 60)}:${String(meta.duration % 60).padStart(2, '0')}`;
  const views = meta.viewCount?.toLocaleString() ?? 'N/A';

  const doc = `# Video Analysis: ${meta.title}

**URL:** ${meta.url}
**Channel:** ${meta.channel}
**Duration:** ${duration}
**Views:** ${views}
**Upload Date:** ${meta.uploadDate}

---

## Raw Transcript

\`\`\`
${transcript.slice(0, 3000)}${transcript.length > 3000 ? '\n...[truncated — see full SRT file]' : ''}
\`\`\`

---

## Visual Analysis (GPT-4o Vision)

${visualAnalysis}

---

## Transcript Analysis (GPT-4o)

${transcriptAnalysis}

---

*Analyzed: ${new Date().toISOString()}*
`;

  fs.writeFileSync(docPath, doc, 'utf-8');
  console.log(`   📄 Written: ${docPath}`);
}

// ─── Master Synthesis ─────────────────────────────────────────────────────────

async function synthesizeMasterDoc(
  allAnalyses: Array<{ meta: VideoMeta; transcript: string; visual: string; transcriptAnalysis: string }>,
  apiKey: string
): Promise<void> {
  console.log('\n🧠 Synthesizing master learnings doc...');

  const cacheFile = path.join(DOCS_DIR, 'master_synthesis_raw.json');
  let masterAnalysis: string;

  if (fs.existsSync(cacheFile)) {
    masterAnalysis = JSON.parse(fs.readFileSync(cacheFile, 'utf-8')).analysis;
    console.log('   ⏭️  Using cached synthesis');
  } else {
    // Build a condensed summary of all analyses for the synthesis prompt
    const summaries = allAnalyses.map((a, i) =>
      `### VIDEO ${i + 1}: "${a.meta.title}" (${a.meta.url})\n${a.transcriptAnalysis.slice(0, 1500)}`
    ).join('\n\n---\n\n');

    const prompt = `You are the world's leading expert on AI-generated UGC video ads, specifically using Google Veo3.

You have analyzed ${allAnalyses.length} expert YouTube videos about Veo3 UGC ad creation. Below are the detailed analyses of each video.

${summaries.slice(0, 20000)}

Now synthesize ALL of this into the ultimate master guide. Structure it as follows:

# MASTER VEO3 UGC AD LEARNINGS

## SECTION 1: THE UNIVERSAL VEO3 PROMPT FORMULA
- The single best-performing prompt structure that works across all videos
- Exact template with fill-in-the-blank sections
- Why each component matters

## SECTION 2: PROVEN PROMPT TEMPLATES BY AD TYPE
### Ecommerce Product Ads
- 3-5 proven templates with examples
### Software/SaaS Ads  
- 3-5 proven templates with examples
### Service/Coaching Ads
- 3-5 proven templates with examples

## SECTION 3: CHARACTER & SETTING FORMULAS
- Best character descriptions for maximum authenticity
- Best settings/environments
- What to NEVER include (AI tells)

## SECTION 4: HOOK FORMULAS THAT CONVERT
- Top 10 hook patterns with examples
- Psychology behind each
- How to adapt for different audiences

## SECTION 5: DIALOGUE & SPEECH PATTERNS
- How to write dialogue that sounds natural in Veo3
- Pacing and pause techniques
- Words/phrases that cause AI artifacts

## SECTION 6: AVOIDING AI ANOMALIES (0 ARTIFACT GOAL)
- Complete list of what causes AI artifacts in Veo3
- Prevention techniques for each
- Quality checklist before publishing

## SECTION 7: AD STRUCTURE FRAMEWORKS
- The winning 15-second structure
- The winning 30-second structure  
- The winning 60-second funnel structure

## SECTION 8: TESTING & ITERATION STRATEGY
- How to A/B test Veo3 ads systematically
- What variables to test first
- How to read results and iterate

## SECTION 9: PLATFORM-SPECIFIC OPTIMIZATION
- TikTok/Reels optimization
- Facebook/Instagram optimization
- YouTube Shorts optimization

## SECTION 10: THE 90% WIN RATE SYSTEM
- Step-by-step process to consistently create winning ads
- Quality gates and checkpoints
- Common failure modes and fixes

Be extremely specific, actionable, and include exact prompt text wherever possible.`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`GPT-4o synthesis ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const result = await res.json() as any;
    masterAnalysis = result.choices[0].message.content;
    fs.writeFileSync(cacheFile, JSON.stringify({ analysis: masterAnalysis, synthesizedAt: new Date().toISOString() }, null, 2));
  }

  // Write master learnings doc
  const masterDoc = `# Veo3 UGC Ad Master Learnings

> Synthesized from ${allAnalyses.length} expert YouTube videos on Veo3 UGC ad creation.
> Generated: ${new Date().toISOString()}

## Source Videos

${allAnalyses.map((a, i) => `${i + 1}. [${a.meta.title}](${a.meta.url}) — ${a.meta.channel}`).join('\n')}

---

${masterAnalysis}

---

## Per-Video Analysis Files

${allAnalyses.map((a) => `- [${a.meta.title}](per-video/${a.meta.id}.md)`).join('\n')}
`;

  fs.writeFileSync(path.join(DOCS_DIR, 'MASTER_LEARNINGS.md'), masterDoc, 'utf-8');
  console.log(`   ✅ Written: research/veo3-ugc-analysis/MASTER_LEARNINGS.md`);
}

// ─── Strategy Doc ─────────────────────────────────────────────────────────────

async function writeStrategyDoc(
  allAnalyses: Array<{ meta: VideoMeta; transcriptAnalysis: string }>,
  apiKey: string
): Promise<void> {
  console.log('\n📋 Writing comprehensive strategy doc...');

  const cacheFile = path.join(DOCS_DIR, 'strategy_raw.json');
  let strategyContent: string;

  if (fs.existsSync(cacheFile)) {
    strategyContent = JSON.parse(fs.readFileSync(cacheFile, 'utf-8')).content;
    console.log('   ⏭️  Using cached strategy');
  } else {
    const topLearnings = allAnalyses.map((a) => a.transcriptAnalysis.slice(0, 800)).join('\n---\n');

    const prompt = `Based on analysis of ${allAnalyses.length} expert Veo3 UGC ad videos, write a comprehensive, actionable strategy document for creating and testing UGC video ads at scale.

Key learnings from the videos:
${topLearnings.slice(0, 15000)}

Write a detailed strategy covering:

# VEO3 UGC AD CREATION & TESTING STRATEGY

## PHASE 1: RESEARCH & BRIEF
- How to research winning angles for any product
- Brief template for Veo3 UGC ads
- Audience targeting considerations

## PHASE 2: SCRIPT WRITING
- Script formula for maximum conversion
- Word count and pacing guidelines
- How to write for Veo3's speech synthesis
- Dialogue patterns that feel authentic

## PHASE 3: PROMPT ENGINEERING
- Step-by-step prompt building process
- Character consistency techniques
- Setting and environment selection
- Audio/speech prompt optimization

## PHASE 4: GENERATION & QUALITY CONTROL
- Generation checklist
- Quality gates (what to reject immediately)
- AI artifact detection guide
- Re-generation triggers

## PHASE 5: TESTING FRAMEWORK
- Minimum viable test batch size
- Variables to test (hook, CTA, character, setting)
- Success metrics and thresholds
- How to read early signals

## PHASE 6: ITERATION & SCALING
- Winner identification criteria
- How to scale winning ads
- Creative refresh cadence
- Budget allocation by phase

## APPENDIX: QUICK REFERENCE
- Prompt cheat sheet
- Common mistakes and fixes
- Platform spec sheet (TikTok, Meta, YouTube)

Include specific numbers, timelines, and examples throughout.`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`GPT-4o strategy ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const result = await res.json() as any;
    strategyContent = result.choices[0].message.content;
    fs.writeFileSync(cacheFile, JSON.stringify({ content: strategyContent, generatedAt: new Date().toISOString() }, null, 2));
  }

  const strategyDoc = `# Veo3 UGC Ad Creation & Testing Strategy

> Comprehensive strategy derived from analysis of ${allAnalyses.length} expert Veo3 UGC ad videos.
> Generated: ${new Date().toISOString()}

${strategyContent}
`;

  fs.writeFileSync(path.join(DOCS_DIR, 'STRATEGY.md'), strategyDoc, 'utf-8');
  console.log(`   ✅ Written: research/veo3-ugc-analysis/STRATEGY.md`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  loadEnv();
  const apiKey = getOpenAIKey();

  fs.mkdirSync(PER_VIDEO_DIR, { recursive: true });
  fs.mkdirSync(FRAMES_DIR, { recursive: true });

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  🎬 Veo3 UGC Ad Research Pipeline`);
  console.log(`  Analyzing ${VIDEO_IDS.length} videos`);
  console.log(`${'═'.repeat(70)}\n`);

  const allAnalyses: Array<{
    meta: VideoMeta;
    transcript: string;
    visual: string;
    transcriptAnalysis: string;
  }> = [];

  for (const id of VIDEO_IDS) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`  📹 ${id}`);

    const meta = loadMeta(id);
    console.log(`  "${meta.title}" — ${meta.channel}`);
    console.log(`  Duration: ${Math.round(meta.duration / 60)}min | Views: ${meta.viewCount?.toLocaleString()}`);

    // 1. Parse transcript
    const srtPath = path.join(VIDEOS_DIR, `${id}.en.srt`);
    const transcript = parseSRT(srtPath);
    console.log(`  📝 Transcript: ${transcript.length} chars`);

    // 2. Extract frames
    console.log(`  🖼️  Extracting frames...`);
    const framePaths = extractFrames(id, 8);

    // 3. Visual analysis
    console.log(`  👁️  Visual analysis...`);
    let visualAnalysis = 'No frames available.';
    try {
      visualAnalysis = await analyzeFrames(id, framePaths, meta, apiKey);
      console.log(`  ✅ Visual analysis complete`);
    } catch (e: any) {
      console.log(`  ⚠️  Visual analysis failed: ${e.message}`);
    }

    // 4. Transcript analysis
    console.log(`  🧠 Transcript analysis...`);
    let transcriptAnalysis = 'No transcript available.';
    try {
      transcriptAnalysis = await analyzeTranscript(id, transcript, meta, visualAnalysis, apiKey);
      console.log(`  ✅ Transcript analysis complete`);
    } catch (e: any) {
      console.log(`  ⚠️  Transcript analysis failed: ${e.message}`);
    }

    // 5. Write per-video doc
    writeVideoDoc(id, meta, transcript, visualAnalysis, transcriptAnalysis);

    allAnalyses.push({ meta, transcript, visual: visualAnalysis, transcriptAnalysis });

    // Small delay between videos to avoid rate limits
    await new Promise((r) => setTimeout(r, 1000));
  }

  // 6. Synthesize master doc
  await synthesizeMasterDoc(allAnalyses, apiKey);

  // 7. Write strategy doc
  await writeStrategyDoc(allAnalyses, apiKey);

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  ✅ Research pipeline complete!`);
  console.log(`  📁 research/veo3-ugc-analysis/`);
  console.log(`     MASTER_LEARNINGS.md`);
  console.log(`     STRATEGY.md`);
  console.log(`     per-video/${VIDEO_IDS.map((id) => id + '.md').join(', ')}`);
  console.log(`${'═'.repeat(70)}\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
