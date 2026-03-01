/**
 * generate-everreach-assets.ts
 *
 * EverReach AI Asset Generation Pipeline
 *
 * Architecture (observable, sequential):
 *   Stage 1 — Nano Banana (Gemini): generate before/after PNG images per ad angle
 *   Stage 2 — Veo 3: animate the before image into a raw MP4 video
 *
 * Remotion is NOT involved here — it is a downstream compositor.
 * This script produces the raw AI-generated assets only.
 *
 * Usage:
 *   npx tsx scripts/generate-everreach-assets.ts --angle UA_TIMING_01
 *   npx tsx scripts/generate-everreach-assets.ts --angle UA_TIMING_01 --images-only
 *   npx tsx scripts/generate-everreach-assets.ts --angle UA_TIMING_01 --video-only
 *   npx tsx scripts/generate-everreach-assets.ts --all --images-only
 *   npx tsx scripts/generate-everreach-assets.ts --angle UA_TIMING_01 --aspect=1:1
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { execSync } from 'child_process';

// =============================================================================
// EverReach Scene Prompts — one per ad angle
// =============================================================================

interface ScenePrompt {
  before: string;   // Gemini prompt for the "problem" image
  after: string;    // Gemini prompt for the "solution" image
  motionPrompt: string; // Veo 3 motion description
}

const ANGLE_SCENES: Record<string, ScenePrompt> = {
  UA_TIMING_01: {
    before: 'A professional in their 30s at a desk, stressed, scrolling through a long contact list on their phone with no idea who to message. Soft office lighting, clean background.',
    after: 'Same professional, now relaxed and smiling, confidently sending a message on their phone. Screen shows one highlighted contact. Warm office lighting.',
    motionPrompt: 'Smooth cinematic pan from a stressed professional at their desk to them confidently sending a message, natural UGC-style, warm lighting, authentic feel',
  },
  UA_FADE_02: {
    before: 'A person looking at an old photo on their phone of friends they used to be close with. Nostalgic and slightly sad expression. Soft warm home lighting.',
    after: 'Same person smiling while typing a message to an old friend. Phone screen shows a warm conversation restarting. Cozy home, golden hour lighting.',
    motionPrompt: 'Gentle camera movement from wistful nostalgia to smiling reconnection via message, warm nostalgic lighting, authentic lifestyle feel',
  },
  UA_TAX_03: {
    before: 'A busy professional rushing through their day — coffee in hand, phone buzzing, frazzled. Packed calendar visible. No time for personal connections.',
    after: 'Same professional calmly taking 60 seconds to send one thoughtful message. Purposeful and at ease. Small timer on screen shows 60 seconds.',
    motionPrompt: 'Quick cut from a frazzled busy professional to the same person calmly taking 60 seconds to send a meaningful message, authentic UGC style',
  },
  UA_HABIT_04: {
    before: 'A person starting their morning — coffee, phone, groggy. Contacts app open with hundreds of names, scrolling past without engaging. No habit formed.',
    after: 'Same morning routine but now they open a clean app showing just one person to reach out to. They smile, type quickly, put the phone down satisfied.',
    motionPrompt: 'Morning routine montage from aimless scrolling to a focused 60-second daily relationship habit, warm morning light, lifestyle UGC feel',
  },
  PA_SYSTEM_05: {
    before: 'A professional staring at a massive disorganized contact list on their laptop — hundreds of names, sticky notes everywhere, overwhelmed.',
    after: 'Same professional looking at a clean app showing contacts sorted by warmth score — Hot, Warm, Cool, Cold. Calm and in control.',
    motionPrompt: 'Pan from a chaotic desk with disorganized contacts to a clean warmth-score app, professional setting, satisfying reveal',
  },
  PA_DECAY_06: {
    before: 'A person looking at their phone realizing they have not talked to someone important in months. Nostalgic and slightly regretful.',
    after: 'Same person proactively reaching out before the relationship goes cold. Their app shows a warning — they act immediately. Relief on their face.',
    motionPrompt: 'Emotional shot of someone realizing a relationship has faded, then the relief of catching it early with a simple app alert, cinematic and authentic',
  },
  PA_MEMORY_07: {
    before: 'A person trying to remember who to follow up with — sticky notes everywhere, multiple apps open, frustrated. Memory is failing as a system.',
    after: 'Same person with one clean app telling them exactly who to reach out to and what to say. No sticky notes. No mental load. One clear action.',
    motionPrompt: 'Satisfying transition from a cluttered sticky-note desk to a clean single app showing one daily action, relief and clarity, UGC lifestyle style',
  },
  PA_COST_08: {
    before: 'A sales professional looking at a deal that fell through — email thread gone cold, no response. Frustrated, realizing they waited too long.',
    after: 'Same professional proactively following up at the right moment, getting a positive response. Their app prompted them to act before it went cold.',
    motionPrompt: 'Business professional going from frustration of a lost deal to satisfaction of a timely follow-up that gets a positive response, authentic office setting',
  },
  SA_WORDS_09: {
    before: 'A person staring at a blank message compose screen, cursor blinking. They want to reach out but do not know what to say. Frustrated, phone in hand.',
    after: 'Same person looking at their phone with a perfectly drafted message ready to send — personal, warm, sounds exactly like them. They smile and hit send.',
    motionPrompt: 'Close-up of a phone screen going from blank to a perfectly crafted personal message, person smiling and hitting send, satisfying and authentic',
  },
  SA_CRM_10: {
    before: 'A professional looking at a complex CRM dashboard — fields, pipelines, data entry forms. Overwhelmed, has not actually reached out to anyone.',
    after: 'Same professional using a simple clean app — one tap, one person, one message drafted. They actually send it. Action over logging.',
    motionPrompt: 'Contrast between a complex CRM interface and a simple one-action app, professional going from frustrated to productive, clean office setting',
  },
  SA_DAILY_11: {
    before: 'A person with a complicated relationship system — multiple apps, spreadsheets, calendar reminders. Maintaining the system takes more effort than the relationships.',
    after: 'Same person with one simple daily ritual — open app, see one person, send one message. Done in 60 seconds. Sustainable and actually used every day.',
    motionPrompt: 'Lifestyle montage of a simple 60-second relationship ritual replacing a complicated multi-app system, morning routine feel, warm and authentic',
  },
  SA_SIMPLE_12: {
    before: 'A person overthinking relationship maintenance — complex system, paralyzed by where to start. Too many contacts, too many options, no action.',
    after: 'Same person using the simplest possible flow: pick one person, get a suggested message, send. Three steps. 60 seconds. Done. They look relieved.',
    motionPrompt: 'Satisfying three-step reveal on a clean phone screen: pick person, get message, send — relieved person in background, minimal and clean',
  },
  PD_DEMO_13: {
    before: 'A person opening their phone unsure where to start. Contacts app open, hundreds of names, no clear next action. Decision paralysis.',
    after: 'Same person in a clean app — one suggested contact, AI drafts a message, they edit and send in under 60 seconds. The whole flow visible on screen.',
    motionPrompt: 'Clean product demo feel — phone screen showing three-step flow: pick person, get message, send — person completing it in 60 seconds, satisfying and clear',
  },
  PD_NOENTRY_14: {
    before: 'A person dreading setting up another app — data import screens, form fields, onboarding steps. They look like they have been through this before.',
    after: 'Same person surprised by simplicity — add one contact, get a message suggestion, send. No import required. Up and running in 60 seconds.',
    motionPrompt: 'Contrast between complicated app setup and instant simplicity of adding one contact and sending a message, surprise and delight reaction, authentic UGC',
  },
  PD_WARMTH_15: {
    before: 'A professional looking at their contacts with no idea who is going cold. Everyone looks the same in a flat list. No signal for who needs attention.',
    after: 'Same professional looking at warmth scores — contacts color-coded Hot, Warm, Cool, Cold. They immediately see who needs a message today.',
    motionPrompt: 'Reveal of a warmth score dashboard — contacts lighting up in warm and cool colors, professional immediately knowing who to reach out to, satisfying',
  },
  PD_APPROVE_16: {
    before: 'A person worried about AI sending messages that do not sound like them — imagining robotic, generic, obviously automated messages. Cringe expression.',
    after: 'Same person editing an AI-drafted message — tweaking a word, making it sound exactly like them, then sending with confidence. Full control, their voice.',
    motionPrompt: 'Close-up of editing an AI message draft on phone — personal touches being added, message becoming authentic, person smiling as they send it',
  },
  PD_OBJECTIONS_17: {
    before: 'A person with hesitation — arms crossed, skeptical expression, thinking about all the reasons not to try another app. Privacy concerns, complexity worries.',
    after: 'Same person now relaxed and using a simple app naturally — concerns addressed, sending a genuine message to someone they care about. At ease.',
    motionPrompt: 'Transformation from skeptical crossed-arms hesitation to relaxed natural app use, genuine smile as they send a personal message, authentic lifestyle',
  },
  MA_START_18: {
    before: 'A person who has been meaning to stay in better touch — looking at their phone, thinking about it but not starting. Intention without action.',
    after: 'Same person who just took the first step — added one person, sent their first message. They look like they finally did the thing they have been meaning to do.',
    motionPrompt: 'The satisfying moment of finally taking action — person adding first contact and sending first message, relief and accomplishment, warm and authentic',
  },
  MA_SILENCE_19: {
    before: 'A business professional looking at a deal or opportunity that went quiet — no response, relationship gone cold. Silence cost them something real.',
    after: 'Same professional now proactively reaching out before silence sets in. App shows who to message. They send it. The relationship stays warm.',
    motionPrompt: 'Business professional going from the pain of a silent cold relationship to the confidence of proactive outreach, office setting, authentic and motivating',
  },
  MA_ENGINE_20: {
    before: 'A networker looking at their contact list as a static database — names and numbers not doing anything for them. Untapped potential, flat and lifeless.',
    after: 'Same person seeing their network as a living active engine — warmth scores, daily actions, relationships compounding over time. One message a day building real opportunity.',
    motionPrompt: 'Inspiring reveal of a network coming alive — contacts lighting up with warmth, messages going out, opportunities flowing back, compound effect visualization',
  },
};

// =============================================================================
// Voice Scripts — EverReach Un-Ghosting Series
// 20 angles mapped to the 21-script library (stage + category aligned).
// Rules: EverReach name NEVER appears in unaware/problem/solution scripts.
// All lowercase, no punctuation — natural speech rhythm for TTS.
// =============================================================================

interface VoiceScript {
  script: string;
  stage: 'unaware' | 'problem-aware' | 'solution-aware' | 'product-aware';
  category: string;
  commentKeyword: string;
}

const VOICE_SCRIPTS: Record<string, VoiceScript> = {
  UA_TIMING_01: {
    stage: 'unaware', category: 'friend', commentKeyword: 'list',
    script: `most friendships don't end, they drift.
you care, you just get busy, and time disappears.
the goal isn't to catch up, it's to make the next message normal again.
that takes a rhythm, not motivation.
i built a simple system for that, link in bio.`,
  },
  UA_FADE_02: {
    stage: 'unaware', category: 'old friend', commentKeyword: 'old friend',
    script: `you are not avoiding them, you are avoiding the emotion.
because reaching out after years, feels like reopening a whole era.
but here is what i know, they have probably thought about you too.
and the message does not have to explain everything, it just has to start.
i have the opener, link in bio.`,
  },
  UA_TAX_03: {
    stage: 'unaware', category: 'coworker', commentKeyword: 'coworker',
    script: `your best career opportunities will not come from job boards.
they will come from people who already know you.
but work relationships fade, because there is no default rhythm.
the fix is not networking events, it is one small message every few weeks.
i have the format, link in bio.`,
  },
  UA_HABIT_04: {
    stage: 'unaware', category: 'family', commentKeyword: 'family',
    script: `most family distance is not conflict, it is drift.
you love them, you just stopped having a rhythm.
and adult life fills every gap, before you notice.
the goal is not a big catch up call.
the goal is one tiny message, that feels normal.
i have a system for that, link in bio.`,
  },
  PA_SYSTEM_05: {
    stage: 'problem-aware', category: 'friend', commentKeyword: 'rhythm',
    script: `you are not a bad friend.
you are just doing friendship from memory.
and memory fails, when life gets loud.
so weeks turn into months, and months turn into awkward.
and here is where it gets interesting.
the problem is not effort, the problem is no rhythm.
comment rhythm, and i will drop my friend check in plan.`,
  },
  PA_DECAY_06: {
    stage: 'problem-aware', category: 'family', commentKeyword: 'family',
    script: `family guilt hits different.
because you think it should be automatic.
but adult life steals attention, every single day.
so you wait for the perfect time, and the perfect time never comes.
and here is where it gets interesting.
most family distance is not conflict, it is drift.
comment family, if you want my easiest check in method.`,
  },
  PA_MEMORY_07: {
    stage: 'problem-aware', category: 'mentor', commentKeyword: 'mentor',
    script: `the reason you avoid your mentor is not disrespect, it is pressure.
you think you need a big impressive update, so you delay.
and here is where it gets interesting.
mentors do not want perfection, they want progress.
comment mentor, and i will give you the easiest outreach format.`,
  },
  PA_COST_08: {
    stage: 'problem-aware', category: 'client', commentKeyword: 'client',
    script: `clients do not get mad at silence first, they get confused.
then they lose trust, because silence makes them imagine the worst.
and here is where it gets interesting.
apologies do not rebuild trust, clarity does.
comment client, and i will drop my cleanest update templates.`,
  },
  SA_WORDS_09: {
    stage: 'solution-aware', category: 'crush', commentKeyword: 'smooth',
    script: `use the light, specific, easy reply format.
one, light line. two, specific reference. three, easy question.
yo this made me laugh, i thought of you, how is your week going.
and here is where it gets interesting.
easy questions get answers, heavy messages get ignored.
comment smooth, for templates.`,
  },
  SA_CRM_10: {
    stage: 'solution-aware', category: 'client', commentKeyword: 'client',
    script: `use this three line system.
line one, quick update. line two, next step. line three, delivery time.
hey, quick update, i am doing x, next step is y, you will have it by z.
and here is where it gets interesting.
certainty calms people down.
comment client, for my copy paste scripts.`,
  },
  SA_DAILY_11: {
    stage: 'solution-aware', category: 'coworker', commentKeyword: 'coworker',
    script: `use the value ping format.
one, compliment. two, quick question. three, offer help.
hey, i liked how you handled x, how is y going, anything i can help with.
and here is where it gets interesting.
being useful, makes you unforgettable.
comment coworker, for templates.`,
  },
  SA_SIMPLE_12: {
    stage: 'solution-aware', category: 'friend', commentKeyword: 'list',
    script: `here is the simple system i use.
pick your top five people, give each person one tiny lane.
one person gets a weekly two minute check in.
one person gets a meme, one person gets a voice note.
then rotate, one per week.
and here is where it gets interesting.
tiny repeats beat big catch ups.
comment list, and i will share message starters.`,
  },
  PD_DEMO_13: {
    stage: 'product-aware', category: 'friend', commentKeyword: 'list',
    script: `if you are tired of doing relationships from memory, this is how i keep it simple.
top people list, last touch, and gentle reminders.
message starters, so it never feels awkward.
the goal is not to catch up on everything.
the goal is to make the next message, normal again.
download everreach, and start your free trial.`,
  },
  PD_NOENTRY_14: {
    stage: 'product-aware', category: 'family', commentKeyword: 'family',
    script: `if family drift feels like your fault, but you don't know how to fix it, this is how i keep it simple.
top people list, last touch, and gentle reminders.
message starters, so it never feels awkward.
the goal is not to catch up on everything.
the goal is to make the next message, normal again.
download everreach, and start your free trial.`,
  },
  PD_WARMTH_15: {
    stage: 'product-aware', category: 'coworker', commentKeyword: 'coworker',
    script: `if you want your network to remember you, before you need something, this is how i keep it simple.
top people list, last touch, and gentle reminders.
message starters, so it never feels awkward.
the goal is not to catch up on everything.
the goal is to make the next message, normal again.
download everreach, and start your free trial.`,
  },
  PD_APPROVE_16: {
    stage: 'product-aware', category: 'mentor', commentKeyword: 'mentor',
    script: `if you want to stay on your mentor's radar, without being annoying, this is how i keep it simple.
top people list, last touch, and gentle reminders.
message starters, so it never feels awkward.
the goal is not to catch up on everything.
the goal is to make the next message, normal again.
download everreach, and start your free trial.`,
  },
  PD_OBJECTIONS_17: {
    stage: 'product-aware', category: 'crush', commentKeyword: 'smooth',
    script: `if you want to stay warm, without overthinking every message, this is how i keep it simple.
top people list, last touch, and gentle reminders.
message starters, so it never feels awkward.
the goal is not to catch up on everything.
the goal is to make the next message, normal again.
download everreach, and start your free trial.`,
  },
  MA_START_18: {
    stage: 'problem-aware', category: 'old friend', commentKeyword: 'old friend',
    script: `you are not avoiding them, you are avoiding the emotion.
because reaching out, feels like reopening a whole era.
and here is where it gets interesting.
nostalgia is the bridge, not the burden.
comment old friend, if you want my safest openers.`,
  },
  MA_SILENCE_19: {
    stage: 'unaware', category: 'client', commentKeyword: 'client',
    script: `the best clients don't leave because of bad work, they leave because of silence.
and silence makes people, imagine the worst.
the fix is not a long apology.
it is one clear message, that shows you are on it.
i have a three line system for that, link in bio.`,
  },
  MA_ENGINE_20: {
    stage: 'solution-aware', category: 'mentor', commentKeyword: 'mentor',
    script: `use the gratitude, update, question format.
thank you again for x.
quick update, i tried it, and here is what happened.
can i ask one quick question about y.
and here is where it gets interesting.
one good question, keeps the relationship alive.
comment mentor, for templates.`,
  },
};

// =============================================================================
// Stage 3: Voiceover — ElevenLabs TTS
// Uses the render service's preferred TTS path (ElevenLabs) directly.
// Voice: 'charlie' (IKne3meq5aSn9XLyUdCD) — casual male, conversational,
// perfect for UGC-style social content.
// =============================================================================

const ELEVENLABS_VOICE_ID = 'IKne3meq5aSn9XLyUdCD'; // charlie — casual male

async function generateVoiceover(script: string, outputPath: string): Promise<string> {
  if (fs.existsSync(outputPath)) {
    console.log(`   ⏭️  voiceover.mp3 exists`);
    return outputPath;
  }

  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error('ELEVENLABS_API_KEY not set in .env.local');

  console.log(`   🎙️  Generating voiceover (ElevenLabs charlie)...`);

  const body = JSON.stringify({
    text: script,
    model_id: 'eleven_turbo_v2_5',
    voice_settings: { stability: 0.45, similarity_boost: 0.75, style: 0.35, use_speaker_boost: true },
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.elevenlabs.io',
        path: `/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': key,
          'Accept': 'audio/mpeg',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          let err = '';
          res.on('data', (c) => (err += c));
          res.on('end', () => reject(new Error(`ElevenLabs ${res.statusCode}: ${err.substring(0, 200)}`)));
          return;
        }
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        const file = fs.createWriteStream(outputPath);
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          const kb = (fs.statSync(outputPath).size / 1024).toFixed(0);
          console.log(`   ✅ voiceover.mp3 (${kb}KB)`);
          resolve(outputPath);
        });
        file.on('error', reject);
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// =============================================================================
// Stage 1: Nano Banana — Imagen 4 Image Generation
//
// Uses Imagen 4 (imagen-4.0-generate-001) via the Gemini API key.
// Imagen 4 generates photorealistic people suitable for real UGC-style ads
// and does NOT trigger Veo's celebrity-likeness RAI filter (unlike Gemini
// image gen which sometimes produces faces that match known celebrities).
// =============================================================================

function getGeminiKey(): string {
  const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY not set in .env.local');
  return key;
}

// Imagen 4: text-only generation (no image input — use for character sheet + before)
async function imagen4Generate(prompt: string, aspectRatio = '9:16', sampleCount = 1): Promise<Buffer[]> {
  const key = getGeminiKey();
  const body = JSON.stringify({
    instances: [{ prompt }],
    parameters: { sampleCount, aspectRatio, personGeneration: 'allow_adult' },
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/imagen-4.0-generate-001:predict?key=${key}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            if (parsed.error) return reject(new Error(`Imagen4: ${parsed.error.message}`));
            const preds = parsed.predictions || [];
            const bufs = preds
              .map((p: any) => p.bytesBase64Encoded || p.image?.imageBytes)
              .filter(Boolean)
              .map((d: string) => Buffer.from(d, 'base64'));
            if (bufs.length === 0) return reject(new Error(`No images in Imagen4 response. Body: ${raw.substring(0, 300)}`));
            resolve(bufs);
          } catch (e: any) {
            reject(new Error(`Parse error: ${e.message}. Raw: ${raw.substring(0, 200)}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Gemini image editing: takes reference images + text prompt → edited/consistent image.
// Used for after.png to maintain character consistency from the before image.
function geminiEditImage(prompt: string, imagePaths: string[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const parts: object[] = [];
    for (const imgPath of imagePaths) {
      if (fs.existsSync(imgPath)) {
        const data = fs.readFileSync(imgPath).toString('base64');
        const mimeType = imgPath.endsWith('.png') ? 'image/png' : 'image/jpeg';
        parts.push({ inline_data: { mime_type: mimeType, data } });
      }
    }
    parts.push({ text: prompt });

    const body = JSON.stringify({
      contents: [{ parts }],
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    });

    const req = https.request(
      {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${getGeminiKey()}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            if (parsed.error) return reject(new Error(`Gemini edit: ${parsed.error.message}`));
            const resParts = parsed.candidates?.[0]?.content?.parts || [];
            for (const part of resParts) {
              const data = part.inline_data?.data || part.inlineData?.data;
              if (data) return resolve(Buffer.from(data, 'base64'));
            }
            reject(new Error(`No image in Gemini edit response. Body: ${raw.substring(0, 300)}`));
          } catch (e: any) {
            reject(new Error(`Parse error: ${e.message}. Raw: ${raw.substring(0, 200)}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// =============================================================================
// Character Consistency Pipeline — Real Human / UGC Style
//
// Step 0: Imagen 4 generates a reference photo set (front + 3/4 view) of a
//         real-looking person. This is the identity anchor.
// Step 1: Imagen 4 generates before.png — same person described in detail,
//         in the problem/pain scene. UGC style: candid, natural light.
// Step 2: Gemini image editing takes [reference + before] and generates the
//         after image, maintaining character consistency via multimodal context.
//         3 candidates generated, best selected.
//
// Why Imagen 4 for steps 0+1: photorealistic, real people, avoids Veo's
// celebrity-likeness filter (Gemini flash image gen sometimes produces
// faces that match known celebrities).
// Why Gemini edit for step 2: supports multi-image input for consistency.
// =============================================================================

const UGC_STYLE = `authentic UGC-style photo, shot on iPhone, natural lighting, candid moment, real person, no studio lighting, no professional photography, genuine emotion, slightly imperfect composition, social media native feel`;

async function generateCharacterSheet(outputDir: string): Promise<string> {
  const sheetPath = path.join(outputDir, 'character_sheet.png');
  if (fs.existsSync(sheetPath)) {
    console.log(`   ⏭️  character_sheet.png exists`);
    return sheetPath;
  }

  console.log(`   📸 Step 0: Generating character reference (Imagen 4)...`);
  // Generate 2 reference shots: front-facing and 3/4 angle
  // Use 1:1 for the sheet so both shots fit side by side
  const prompt = `Portrait photo reference sheet of a real person.
Left half: Front-facing headshot of a professional man in his early 30s, light stubble, brown hair, wearing a casual blue button-down shirt, neutral expression, white background, studio-style reference photo.
Right half: Same man, 3/4 angle view, slight smile, same shirt, same background.
This is a character reference sheet. Both photos show the exact same person.
Photo quality, sharp focus, clean white background.`;

  const bufs = await imagen4Generate(prompt, '1:1', 1);
  fs.writeFileSync(sheetPath, bufs[0]);
  console.log(`   ✅ character_sheet.png (${(bufs[0].length / 1024).toFixed(0)}KB)`);
  return sheetPath;
}

async function generateBefore(sheetPath: string, scene: ScenePrompt, outputDir: string): Promise<string> {
  const beforePath = path.join(outputDir, 'before.png');
  if (fs.existsSync(beforePath)) {
    console.log(`   ⏭️  before.png exists`);
    return beforePath;
  }

  console.log(`   📸 Step 1: Generating BEFORE image (Imagen 4)...`);
  // Describe the character explicitly so Imagen 4 generates the same person
  const charDesc = `professional man in his early 30s, light stubble, brown hair, casual blue button-down shirt`;
  const prompt = `${UGC_STYLE}.
Subject: ${charDesc}.
SCENE: ${scene.before}
Composition: Subject is the clear foreground focus, face and upper body visible. 9:16 vertical format.`;

  const bufs = await imagen4Generate(prompt, '9:16', 1);
  fs.writeFileSync(beforePath, bufs[0]);
  console.log(`   ✅ before.png (${(bufs[0].length / 1024).toFixed(0)}KB)`);
  return beforePath;
}

async function generateAfter(sheetPath: string, beforePath: string, scene: ScenePrompt, outputDir: string, candidates = 3): Promise<string> {
  const afterPath = path.join(outputDir, 'after.png');
  if (fs.existsSync(afterPath)) {
    console.log(`   ⏭️  after.png exists`);
    return afterPath;
  }

  console.log(`   📸 Step 2: Generating AFTER image (${candidates} candidates, Gemini edit)...`);
  const prompt = `- Image 1: Character reference sheet showing the person (front and 3/4 views).
- Image 2: The BEFORE scene — the problem/pain state.

Generate the AFTER scene showing the same person in a transformed, positive state.
SCENE: ${scene.after}
Style: ${UGC_STYLE}, 9:16 vertical.
CRITICAL: Same person as Image 1 — same face, hair, stubble, blue shirt.
Only the emotion, action, and context change to show the positive outcome.
Setting should feel like a natural continuation of Image 2.`;

  const buffers: Buffer[] = [];
  for (let i = 0; i < candidates; i++) {
    console.log(`      Candidate ${i + 1}/${candidates}...`);
    try {
      const buf = await geminiEditImage(prompt, [sheetPath, beforePath]);
      buffers.push(buf);
    } catch (err: any) {
      console.log(`      ⚠️  Candidate ${i + 1} failed: ${err.message}`);
    }
    if (i < candidates - 1) await new Promise(r => setTimeout(r, 2000));
  }

  if (buffers.length === 0) throw new Error('All after-image candidates failed');

  buffers.forEach((buf, i) => {
    fs.writeFileSync(path.join(outputDir, `after_candidate_${i + 1}.png`), buf);
  });

  const best = buffers.reduce((a, b) => (a.length >= b.length ? a : b));
  fs.writeFileSync(afterPath, best);
  console.log(`   ✅ after.png — best of ${buffers.length} candidates (${(best.length / 1024).toFixed(0)}KB)`);
  return afterPath;
}

async function runNanoBanana(angleId: string, scene: ScenePrompt, outputDir: string) {
  // Step 0: Character reference — the identity anchor (Imagen 4)
  const sheetPath = await generateCharacterSheet(outputDir);
  await new Promise(r => setTimeout(r, 2000));

  // Step 1: Before image — Imagen 4 with explicit character description
  const beforePath = await generateBefore(sheetPath, scene, outputDir);
  await new Promise(r => setTimeout(r, 2000));

  // Step 2: After image — Gemini edit with [sheet + before] as context
  const afterPath = await generateAfter(sheetPath, beforePath, scene, outputDir, 3);

  return { beforePath, afterPath, sheetPath };
}

// =============================================================================
// Stage 2: Veo 3 — Video Generation
// =============================================================================

function getVeoKey(): string {
  const key = process.env.GOOGLE_VEO_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) throw new Error('GOOGLE_VEO_API_KEY or GOOGLE_API_KEY not set in .env.local');
  return key;
}

async function runVeo3(beforeImagePath: string, scene: ScenePrompt, outputDir: string, aspectRatio: string) {
  const safeAspect = aspectRatio.replace(':', 'x');
  const videoPath = path.join(outputDir, `video_${safeAspect}.mp4`);
  const opFile = path.join(outputDir, 'veo_operation.json');

  if (fs.existsSync(videoPath)) {
    console.log(`   ⏭️  video_${safeAspect}.mp4 exists`);
    return videoPath;
  }

  const apiKey = getVeoKey();

  // Submit or resume
  let operationName: string;
  if (fs.existsSync(opFile)) {
    operationName = JSON.parse(fs.readFileSync(opFile, 'utf-8')).operationName;
    console.log(`   ♻️  Resuming operation: ${operationName}`);
  } else {
    console.log(`   📡 Submitting to Veo 3...`);
    const beforeBase64 = fs.readFileSync(beforeImagePath).toString('base64');
    const payload = {
      instances: [{ prompt: scene.motionPrompt, image: { bytesBase64Encoded: beforeBase64, mimeType: 'image/png' } }],
      parameters: { aspectRatio, personGeneration: 'allow_adult' },
    };

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-generate-preview:predictLongRunning?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    );
    if (!res.ok) throw new Error(`Veo submit ${res.status}: ${(await res.text()).substring(0, 300)}`);
    const result = await res.json() as any;
    if (result.error) throw new Error(`Veo: ${result.error.message}`);
    if (!result.name) throw new Error('No operation name from Veo');
    operationName = result.name;
    fs.writeFileSync(opFile, JSON.stringify({ operationName, submittedAt: new Date().toISOString() }, null, 2));
    console.log(`   ✅ Submitted: ${operationName}`);
  }

  // Poll
  console.log(`   ⏳ Polling (up to 10 min)...`);
  const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`;
  const start = Date.now();

  while (Date.now() - start < 600_000) {
    await new Promise(r => setTimeout(r, 10_000));
    const res = await fetch(pollUrl);
    if (!res.ok) { console.log(`   ⏳ Poll ${res.status}, retrying...`); continue; }
    const result = await res.json() as any;
    if (result.error) throw new Error(`Veo failed: ${result.error.message}`);
    const pct = result.metadata?.progressPercent || 0;
    console.log(`   ⏳ ${pct}% (${Math.round((Date.now() - start) / 1000)}s)`);
    if (!result.done) continue;

    const videoUrl =
      result.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ||
      result.response?.videoUri || result.response?.videos?.[0]?.uri || '';

    if (!videoUrl) {
      fs.writeFileSync(opFile.replace('.json', '_result.json'), JSON.stringify(result, null, 2));
      throw new Error('Veo done but no video URL. Raw result saved.');
    }

    const sep = videoUrl.includes('?') ? '&' : '?';
    const dlRes = await fetch(`${videoUrl}${sep}key=${apiKey}`, { headers: { 'x-goog-api-key': apiKey }, redirect: 'follow' });
    if (!dlRes.ok) throw new Error(`Download failed: ${dlRes.status}`);
    const buf = Buffer.from(await dlRes.arrayBuffer());
    fs.writeFileSync(videoPath, buf);
    console.log(`   ✅ video_${safeAspect}.mp4 (${(buf.length / 1024 / 1024).toFixed(1)}MB)`);
    return videoPath;
  }

  throw new Error('Veo timed out after 10 minutes');
}

// =============================================================================
// Stage 4: Compose — ffmpeg merge + caption burn-in
//
// Takes:  video_9x16.mp4 (Veo, 8s) + voiceover.mp3 (ElevenLabs, ~15s)
// Does:
//   1. Loop Veo video to match voiceover duration
//   2. Mix Veo ambient audio (-14dB) under voiceover (0dB)
//   3. Burn captions: script lines timed evenly, bottom-third, white bold text
// Outputs: final_9x16.mp4 — ready to post
// =============================================================================

function getVoiceDuration(audioPath: string): number {
  try {
    const out = execSync(
      `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${audioPath}"`,
      { encoding: 'utf-8' }
    ).trim();
    return parseFloat(out) || 15;
  } catch {
    return 15;
  }
}

function formatAssTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h}:${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`;
}

function buildAssSubtitles(script: string, totalDuration: number, videoW = 720, videoH = 1280): string {
  const lines = script.split('\n').map(l => l.trim()).filter(Boolean);
  const sliceDur = totalDuration / lines.length;
  const marginV = Math.round(videoH * 0.08); // 8% from bottom

  const header = [
    '[Script Info]',
    'ScriptType: v4.00+',
    `PlayResX: ${videoW}`,
    `PlayResY: ${videoH}`,
    'WrapStyle: 0',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    // Alignment 2 = bottom-center; BorderStyle 1 = outline+shadow; Outline 3px; white text; semi-black outline
    `Style: Caption,Arial,62,&H00FFFFFF,&H000000FF,&H00000000,&HAA000000,-1,0,0,0,100,100,0,0,1,3,1,2,40,40,${marginV},1`,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ].join('\n');

  const events = lines.map((line, i) => {
    const start = formatAssTime(i * sliceDur);
    const end = formatAssTime((i + 1) * sliceDur);
    // ASS escape: { } are control codes, backslash is literal
    const text = line.replace(/\\/g, '\\\\').replace(/{/g, '\\{').replace(/}/g, '\\}');
    return `Dialogue: 0,${start},${end},Caption,,0,0,0,,${text}`;
  }).join('\n');

  return `${header}\n${events}\n`;
}

function writeAssFile(script: string, totalDuration: number, outputDir: string): string {
  const assPath = path.join(outputDir, 'captions.ass');
  const content = buildAssSubtitles(script, totalDuration);
  fs.writeFileSync(assPath, content, 'utf-8');
  return assPath;
}

async function composeVideo(
  videoPath: string,
  voicePath: string,
  script: string,
  outputDir: string,
  aspectRatio: string,
  forceRecompose = false
): Promise<string> {
  const safeAspect = aspectRatio.replace(':', 'x');
  const finalPath = path.join(outputDir, `final_${safeAspect}.mp4`);

  if (fs.existsSync(finalPath) && !forceRecompose) {
    console.log(`   ⏭️  final_${safeAspect}.mp4 exists`);
    return finalPath;
  }

  const voiceDur = getVoiceDuration(voicePath);
  console.log(`   🎞️  Composing: ${voiceDur.toFixed(1)}s — looped video + voice + ASS captions`);

  // Write ASS subtitle file for libass burn-in
  const assPath = writeAssFile(script, voiceDur, outputDir);
  // Escape path for ffmpeg filter (colons on macOS paths are fine, but spaces need escaping)
  const assEscaped = assPath.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/ /g, '\\ ');

  // ffmpeg:
  //  -stream_loop -1   loop Veo video to match voiceover length
  //  amix              blend Veo ambient at -14dB under voiceover
  //  ass filter        burn in ASS subtitles (libass — handles word-wrap, font, position)
  const cmd = [
    'ffmpeg -y',
    `-stream_loop -1 -i "${videoPath}"`,
    `-i "${voicePath}"`,
    `-t ${voiceDur.toFixed(3)}`,
    `-filter_complex`,
    `"[0:a]volume=0.12[amb];[1:a]volume=1.0[vo];[amb][vo]amix=inputs=2:duration=first:dropout_transition=0[aout];[0:v]ass='${assEscaped}'[vout]"`,
    `-map "[vout]" -map "[aout]"`,
    `-c:v libx264 -preset fast -crf 20`,
    `-c:a aac -b:a 192k`,
    `-movflags +faststart`,
    `"${finalPath}"`,
  ].join(' ');

  console.log(`   ⚙️  Running ffmpeg...`);
  try {
    execSync(cmd, { stdio: 'pipe' });
    const mb = (fs.statSync(finalPath).size / 1024 / 1024).toFixed(1);
    console.log(`   ✅ final_${safeAspect}.mp4 (${mb}MB)`);
    return finalPath;
  } catch (err: any) {
    const stderr = err.stderr?.toString() || err.message;
    throw new Error(`ffmpeg compose failed: ${stderr.slice(-400)}`);
  }
}

// =============================================================================
// Pipeline Runner
// =============================================================================

async function runAngle(angleId: string, opts: { imagesOnly: boolean; videoOnly: boolean; voiceOnly: boolean; composeOnly: boolean; aspectRatio: string }) {
  const scene = ANGLE_SCENES[angleId];
  if (!scene) {
    console.error(`❌ Unknown angle: ${angleId}. Available: ${Object.keys(ANGLE_SCENES).join(', ')}`);
    process.exit(1);
  }

  const voiceScript = VOICE_SCRIPTS[angleId];
  const outputDir = path.join('output', 'everreach-assets', angleId);
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  🎯 ${angleId}`);
  if (voiceScript) console.log(`  🎙️  Stage: ${voiceScript.stage} | Category: ${voiceScript.category}`);
  console.log(`  📁 ${outputDir}`);
  console.log(`${'═'.repeat(60)}`);

  const safeAspect = opts.aspectRatio.replace(':', 'x');
  let beforePath = path.join(outputDir, 'before.png');
  const videoPath = path.join(outputDir, `video_${safeAspect}.mp4`);
  const voPath = path.join(outputDir, 'voiceover.mp3');
  const scriptPath = path.join(outputDir, 'script.txt');

  // Stage 1: Nano Banana (images)
  const skipImages = opts.videoOnly || opts.voiceOnly || opts.composeOnly;
  if (!skipImages) {
    console.log(`\n🍌 Stage 1: Nano Banana — Before/After Images`);
    console.log('─'.repeat(50));
    const result = await runNanoBanana(angleId, scene, outputDir);
    beforePath = result.beforePath;
  } else {
    if ((opts.videoOnly || opts.composeOnly) && !fs.existsSync(beforePath)) {
      console.error(`❌ before.png required at: ${beforePath}`);
      process.exit(1);
    }
    console.log(`\n🍌 Stage 1: Skipped`);
  }

  // Stage 2: Veo 3 (video)
  const skipVideo = opts.imagesOnly || opts.voiceOnly || opts.composeOnly;
  if (!skipVideo) {
    console.log(`\n🎬 Stage 2: Veo 3 — Video Generation`);
    console.log('─'.repeat(50));
    await runVeo3(beforePath, scene, outputDir, opts.aspectRatio);
  } else {
    if (opts.composeOnly && !fs.existsSync(videoPath)) {
      console.error(`❌ ${videoPath} required for --compose-only`);
      process.exit(1);
    }
    console.log(`\n🎬 Stage 2: Skipped`);
  }

  // Stage 3: Voiceover (TTS)
  const skipVoice = opts.imagesOnly || opts.videoOnly;
  if (!skipVoice && voiceScript) {
    console.log(`\n🎙️  Stage 3: Voiceover — ElevenLabs TTS`);
    console.log('─'.repeat(50));
    try {
      await generateVoiceover(voiceScript.script, voPath);
      if (!fs.existsSync(scriptPath)) {
        fs.writeFileSync(scriptPath, [
          `ANGLE: ${angleId}`,
          `STAGE: ${voiceScript.stage}`,
          `CATEGORY: ${voiceScript.category}`,
          `KEYWORD: ${voiceScript.commentKeyword}`,
          ``,
          voiceScript.script,
        ].join('\n'));
      }
    } catch (err: any) {
      console.log(`   ⚠️  Voiceover failed: ${err.message}`);
    }
  } else {
    console.log(`\n🎙️  Stage 3: Skipped`);
  }

  // Stage 4: Compose — merge video + voice + captions
  const skipCompose = opts.imagesOnly || opts.videoOnly || opts.voiceOnly;
  if (!skipCompose && voiceScript && fs.existsSync(videoPath) && fs.existsSync(voPath)) {
    console.log(`\n�️  Stage 4: Compose — ffmpeg merge + captions`);
    console.log('─'.repeat(50));
    try {
      await composeVideo(videoPath, voPath, voiceScript.script, outputDir, opts.aspectRatio);
    } catch (err: any) {
      console.log(`   ⚠️  Compose failed: ${err.message}`);
    }
  } else if (!skipCompose) {
    console.log(`\n🎞️  Stage 4: Skipped (missing video or voiceover)`);
  } else {
    console.log(`\n🎞️  Stage 4: Skipped`);
  }

  // Manifest
  const manifest = {
    angleId,
    stage: voiceScript?.stage,
    category: voiceScript?.category,
    commentKeyword: voiceScript?.commentKeyword,
    assets: {
      characterSheet: fs.existsSync(path.join(outputDir, 'character_sheet.png')) ? 'character_sheet.png' : null,
      beforeImage: fs.existsSync(path.join(outputDir, 'before.png')) ? 'before.png' : null,
      afterImage: fs.existsSync(path.join(outputDir, 'after.png')) ? 'after.png' : null,
      video: fs.existsSync(videoPath) ? `video_${safeAspect}.mp4` : null,
      voiceover: fs.existsSync(voPath) ? 'voiceover.mp3' : null,
      script: fs.existsSync(scriptPath) ? 'script.txt' : null,
      final: fs.existsSync(path.join(outputDir, `final_${safeAspect}.mp4`)) ? `final_${safeAspect}.mp4` : null,
    },
    generatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\n✅ ${angleId} complete → ${outputDir}`);
}

// =============================================================================
// CLI
// =============================================================================

async function main() {
  const args = process.argv.slice(2);

  const angleIdx = args.indexOf('--angle');
  const angleArg = angleIdx !== -1 ? args[angleIdx + 1] : args.find(a => a.startsWith('--angle='))?.split('=')[1];
  const runAll = args.includes('--all');
  const imagesOnly = args.includes('--images-only');
  const videoOnly = args.includes('--video-only');
  const voiceOnly = args.includes('--voice-only');
  const composeOnly = args.includes('--compose-only');
  const aspectRatio = args.find(a => a.startsWith('--aspect='))?.split('=')[1] || '9:16';

  if (!angleArg && !runAll) {
    console.log(`
EverReach Asset Generator
─────────────────────────
Pipeline: Nano Banana (Gemini) → before/after PNGs → Veo 3 → raw MP4

Usage:
  npx tsx scripts/generate-everreach-assets.ts --angle UA_TIMING_01
  npx tsx scripts/generate-everreach-assets.ts --angle UA_TIMING_01 --images-only
  npx tsx scripts/generate-everreach-assets.ts --angle UA_TIMING_01 --video-only
  npx tsx scripts/generate-everreach-assets.ts --all --images-only
  npx tsx scripts/generate-everreach-assets.ts --angle UA_TIMING_01 --aspect=1:1

Available angles:
${Object.keys(ANGLE_SCENES).map(id => `  ${id}`).join('\n')}
`);
    process.exit(0);
  }

  // Load .env.local
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const k = line.slice(0, eq).trim();
      const v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (k && !process.env[k]) process.env[k] = v;
    }
  }

  const angles = runAll ? Object.keys(ANGLE_SCENES) : [angleArg!];

  console.log(`\nEverReach Asset Generator`);
  console.log(`Pipeline: Nano Banana → Veo 3 → ElevenLabs TTS`);
  console.log(`Angles:   ${angles.join(', ')}`);
  console.log(`Mode:     ${imagesOnly ? 'images only' : videoOnly ? 'video only' : voiceOnly ? 'voice only' : composeOnly ? 'compose only' : 'full pipeline'}`);
  console.log(`Aspect:   ${aspectRatio}`);

  for (const angleId of angles) {
    try {
      await runAngle(angleId, { imagesOnly, videoOnly, voiceOnly, composeOnly, aspectRatio });
    } catch (err: any) {
      console.error(`\n❌ ${angleId} failed: ${err.message}`);
      if (angles.length === 1) process.exit(1);
    }
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  Done. Output: output/everreach-assets/`);
  console.log(`${'═'.repeat(60)}\n`);
}

main().catch(err => {
  console.error(`\nFatal: ${err.message}`);
  process.exit(1);
});
