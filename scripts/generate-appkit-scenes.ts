#!/usr/bin/env npx tsx
/**
 * Generate promotional scene images for App-Kit using Gemini
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || fs.readFileSync('.env.local', 'utf-8').match(/GOOGLE_API_KEY=(.+)/)?.[1];

const scenes = [
  {
    id: 'hook',
    prompt: 'Modern tech promotional image: A sleek rocket ship launching from a laptop screen, symbolizing fast app deployment. Dark purple and indigo gradient background with glowing accents. Clean, minimalist SaaS marketing style. Text overlay area on left side. Professional product launch aesthetic.'
  },
  {
    id: 'problem',
    prompt: 'Frustrated developer at desk surrounded by floating icons: authentication locks, payment cards, database symbols, cloud servers. Tangled wires and complexity. Dark moody lighting with purple tones. Illustrating the pain of building infrastructure from scratch. Modern tech illustration style.'
  },
  {
    id: 'solution',
    prompt: 'Clean modern dashboard interface showing app kit components: authentication panel, payment integration, database schema visualized as connected nodes. Expo, Supabase, Stripe logos subtly incorporated. Dark theme with purple and green accent colors. Professional SaaS product screenshot style.'
  },
  {
    id: 'features',
    prompt: 'Isometric 3D illustration of app building blocks: authentication shield, credit card for payments, database cylinder, rocket for deployment, lock for security. All connected with glowing lines. Dark purple gradient background. Modern tech startup aesthetic.'
  },
  {
    id: 'guides',
    prompt: 'Stack of 14 glowing digital guidebooks/documents floating in space, each with different icons: gear, database, lock, dollar sign, chart, rocket. Dark background with purple and blue gradients. Professional documentation visualization. Clean modern tech style.'
  },
  {
    id: 'cta',
    prompt: 'Bold call-to-action scene: GitHub logo with download arrow, price tag showing $99, and a glowing "Start Now" button. Confetti and celebration particles. Dark purple background with green accent highlights. Exciting product launch energy. Professional marketing visual.'
  }
];

async function generateImage(prompt: string): Promise<Buffer | null> {
  const body = JSON.stringify({
    contents: [{
      role: 'user',
      parts: [{ text: `Create a promotional image for a SaaS product video. ${prompt} The image should be 1920x1080 landscape format, suitable as a video scene background. High quality, professional marketing aesthetic.` }]
    }],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT']
    }
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          const parts = response.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData?.data) {
              resolve(Buffer.from(part.inlineData.data, 'base64'));
              return;
            }
          }
          console.error('No image in response:', JSON.stringify(response).slice(0, 500));
          resolve(null);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const outputDir = 'public/assets/scenes/appkit';
  
  console.log('🎨 Generating App-Kit promotional scenes...\n');

  for (const scene of scenes) {
    const outputPath = path.join(outputDir, `${scene.id}.png`);
    
    console.log(`  Generating: ${scene.id}...`);
    
    try {
      const imageBuffer = await generateImage(scene.prompt);
      if (imageBuffer) {
        fs.writeFileSync(outputPath, imageBuffer);
        console.log(`  ✅ Saved: ${outputPath}`);
      } else {
        console.log(`  ⚠️ No image generated for ${scene.id}`);
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error}`);
    }
    
    // Rate limit
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n✅ Scene generation complete!');
}

main().catch(console.error);
