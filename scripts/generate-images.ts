/**
 * VID-007: DALL-E Image Generation
 * Scene and character image generation using DALL-E API
 */

import OpenAI from 'openai';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ImageGenerationOptions {
  prompt: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  outputPath: string;
  model?: 'dall-e-3' | 'dall-e-2';
}

/**
 * Generate an image using DALL-E API
 */
export async function generateImage(options: ImageGenerationOptions): Promise<string> {
  const {
    prompt,
    size = '1024x1024',
    quality = 'standard',
    style = 'vivid',
    outputPath,
    model = 'dall-e-3',
  } = options;

  console.log(`\nGenerating image with DALL-E ${model}...`);
  console.log(`Prompt: "${prompt.substring(0, 80)}${prompt.length > 80 ? '...' : ''}"`);
  console.log(`Size: ${size}, Quality: ${quality}, Style: ${style}`);

  try {
    // Generate image
    const response = await openai.images.generate({
      model,
      prompt,
      n: 1,
      size,
      quality: model === 'dall-e-3' ? quality : undefined,
      style: model === 'dall-e-3' ? style : undefined,
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      throw new Error('No image URL returned from DALL-E');
    }

    console.log(`Image generated: ${imageUrl}`);

    // Download the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.statusText}`);
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    // Save image
    await fs.writeFile(outputPath, imageBuffer);

    console.log(`✓ Image saved to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}

/**
 * Generate images for all sections in a content brief
 */
export async function generateBriefImages(
  briefPath: string,
  outputDir: string = 'public/assets/scenes',
  imageOptions: Partial<ImageGenerationOptions> = {}
): Promise<Record<string, string>> {
  // Read brief file
  const briefContent = await fs.readFile(briefPath, 'utf-8');
  const brief = JSON.parse(briefContent);

  const imageFiles: Record<string, string> = {};

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Generating images for brief: ${brief.title}`);
  console.log(`Total sections: ${brief.sections.length}`);
  console.log(`${'='.repeat(60)}\n`);

  // Generate images for sections that need them
  for (const section of brief.sections) {
    // Skip if section already has an image path or no prompt available
    if (section.image?.src || !section.body) {
      console.log(`Skipping section "${section.id}" - ${section.image?.src ? 'already has image' : 'no description available'}`);
      continue;
    }

    // Create image prompt based on section content
    const imagePrompt = createImagePrompt(section, brief.style);

    const outputPath = path.join(
      outputDir,
      `${brief.title.toLowerCase().replace(/\s+/g, '-')}-${section.id}.png`
    );

    try {
      await generateImage({
        prompt: imagePrompt,
        outputPath,
        size: imageOptions.size || '1792x1024',
        quality: imageOptions.quality || 'standard',
        style: imageOptions.style || 'vivid',
        model: imageOptions.model || 'dall-e-3',
      });

      imageFiles[section.id] = outputPath;
    } catch (error) {
      console.error(`Failed to generate image for section ${section.id}:`, error);
    }

    // Add delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✓ Generated ${Object.keys(imageFiles).length} images`);
  console.log(`${'='.repeat(60)}\n`);

  return imageFiles;
}

/**
 * Create an image prompt based on section content and style
 */
function createImagePrompt(section: any, style: any): string {
  const themeStyle = style.theme === 'dark' ? 'dark, moody' : 'bright, vibrant';
  const basePrompt = section.body || section.heading || 'Abstract scene';

  // Build a detailed prompt
  let prompt = `${basePrompt}. `;

  // Add style direction
  prompt += `Professional, high-quality, ${themeStyle}, modern design. `;

  // Add composition guidance
  if (section.type === 'topic') {
    prompt += 'Cinematic composition, suitable for a video background. ';
  }

  // Add color guidance if available
  if (style.colors?.primary) {
    prompt += `Primary color scheme using ${style.colors.primary}. `;
  }

  return prompt;
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage:
  npm run generate-images <brief-path> [output-dir] [options]

Examples:
  # Generate images for all sections in a brief
  npm run generate-images data/briefs/example-video.json

  # Specify output directory
  npm run generate-images data/briefs/example-video.json public/assets/scenes

Options:
  --size <size>        Image size (1024x1024, 1792x1024, 1024x1792)
  --quality <quality>  Image quality (standard, hd)
  --style <style>      Image style (vivid, natural)
  --model <model>      Model to use (dall-e-3, dall-e-2)

Single image generation:
  npm run generate-images --prompt "Your prompt here" --output path/to/image.png
    `);
    process.exit(1);
  }

  // Check for single image mode
  const promptIndex = args.indexOf('--prompt');
  const outputIndex = args.indexOf('--output');

  if (promptIndex !== -1 && outputIndex !== -1) {
    // Single image mode
    const prompt = args[promptIndex + 1];
    const outputPath = args[outputIndex + 1];

    const sizeIndex = args.indexOf('--size');
    const qualityIndex = args.indexOf('--quality');
    const styleIndex = args.indexOf('--style');
    const modelIndex = args.indexOf('--model');

    generateImage({
      prompt,
      outputPath,
      size: sizeIndex !== -1 ? args[sizeIndex + 1] as any : '1024x1024',
      quality: qualityIndex !== -1 ? args[qualityIndex + 1] as any : 'standard',
      style: styleIndex !== -1 ? args[styleIndex + 1] as any : 'vivid',
      model: modelIndex !== -1 ? args[modelIndex + 1] as any : 'dall-e-3',
    })
      .then(() => {
        console.log('\n✓ Image generation complete!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n✗ Image generation failed:', error);
        process.exit(1);
      });
  } else {
    // Brief mode
    const briefPath = args[0];
    const outputDir = args[1] || 'public/assets/scenes';

    const sizeIndex = args.indexOf('--size');
    const qualityIndex = args.indexOf('--quality');
    const styleIndex = args.indexOf('--style');
    const modelIndex = args.indexOf('--model');

    const imageOptions: Partial<ImageGenerationOptions> = {};
    if (sizeIndex !== -1) imageOptions.size = args[sizeIndex + 1] as any;
    if (qualityIndex !== -1) imageOptions.quality = args[qualityIndex + 1] as any;
    if (styleIndex !== -1) imageOptions.style = args[styleIndex + 1] as any;
    if (modelIndex !== -1) imageOptions.model = args[modelIndex + 1] as any;

    generateBriefImages(briefPath, outputDir, imageOptions)
      .then(() => {
        console.log('\n✓ Image generation complete!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n✗ Image generation failed:', error);
        process.exit(1);
      });
  }
}
