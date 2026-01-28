# IMG-002: Character Consistency Script

## Overview

The Character Consistency Script enables consistent character generation across multiple images using DALL-E. This is critical for video production, storytelling, and brand identity where the same character needs to appear in different scenes and scenarios while maintaining their appearance.

## Features

- **Character Presets**: 5 built-in professional character presets (tech founder, creative director, data scientist, marketing exec, product designer)
- **Custom Characters**: Create and save your own character configurations
- **Detailed Prompting**: Uses comprehensive prompts with physical features, traits, clothing, and style to maintain consistency
- **Scenario Remixing**: Generate the same character in different scenarios, poses, and environments
- **Batch Generation**: Generate multiple character variations in one command
- **High Quality Output**: Supports HD quality DALL-E 3 generation

## Installation

The script is already integrated into the project. Ensure you have:

1. OpenAI API key in `.env`:
   ```bash
   OPENAI_API_KEY=your_key_here
   ```

2. Dependencies installed:
   ```bash
   npm install
   ```

## Usage

### 1. List Available Presets

```bash
npm run remix-character list-presets
```

This shows all built-in character presets with their features.

### 2. Generate Base Character

Generate a character image from a preset:

```bash
npm run remix-character generate -- --preset tech-founder --output public/assets/characters/founder.png
```

Generate with a custom scenario:

```bash
npm run remix-character generate -- --preset tech-founder --scenario "in a startup office" --output public/assets/characters/founder-office.png
```

### 3. Remix Character in New Scenario

Remix a preset character:

```bash
npm run remix-character remix -- --preset tech-founder --scenario "giving a keynote presentation" --output public/assets/characters/founder-keynote.png
```

Remix with additional details:

```bash
npm run remix-character remix -- --preset tech-founder --scenario "product launch event" --action "unveiling new product" --environment "modern auditorium" --mood "excited" --output public/assets/characters/founder-launch.png
```

### 4. Create Custom Character

Create a reusable character configuration:

```bash
npm run remix-character create-preset -- --name "My Character" --base "A friendly software engineer" --features "glasses,smile,casual attire" --traits "helpful,patient,skilled" --clothing "hoodie and jeans" --style "modern illustration" --output my-character.json
```

Then use it:

```bash
npm run remix-character remix -- --character my-character.json --scenario "pair programming" --output character-coding.png
```

### 5. Batch Generate Character Variations

Create a batch configuration file (e.g., `batch-config.json`):

```json
{
  "character": {
    "name": "Tech Founder",
    "basePrompt": "A confident tech startup founder in their early 30s",
    "physicalFeatures": ["short dark hair", "focused brown eyes", "clean-shaven"],
    "traits": ["innovative", "driven", "charismatic"],
    "clothing": "dark hoodie and jeans",
    "style": "professional digital illustration"
  },
  "scenarios": [
    {
      "scenario": "presenting to investors",
      "action": "gesturing towards presentation",
      "outputName": "founder-presenting.png"
    },
    {
      "scenario": "coding at laptop",
      "action": "working late at night",
      "outputName": "founder-coding.png"
    }
  ]
}
```

Run batch generation:

```bash
npm run remix-character batch -- --config batch-config.json --output-dir public/assets/characters/
```

## Character Configuration Structure

```typescript
{
  "name": "Character Name",
  "basePrompt": "Base description of the character",
  "physicalFeatures": [
    "feature 1",
    "feature 2",
    "feature 3"
  ],
  "traits": [
    "personality trait 1",
    "personality trait 2"
  ],
  "clothing": "What the character wears",
  "style": "Art style for rendering",
  "negativePrompt": "Optional: things to avoid"
}
```

## Tips for Consistency

1. **Be Specific**: The more detailed the physical features, the more consistent results
2. **Use Consistent Terminology**: Use the same descriptive words across generations
3. **Reference Previous Images**: Keep generated images as visual references
4. **Batch Process**: Generate multiple variations at once for better consistency
5. **HD Quality**: Use HD quality for professional results (default in remix mode)

## Built-in Presets

- **tech-founder**: Tech startup founder in casual business attire
- **creative-director**: Artistic creative professional with distinctive style
- **data-scientist**: Analytical professional with glasses
- **marketing-exec**: Charismatic executive in modern business attire
- **product-designer**: Friendly designer in comfortable creative wear

## Examples

### Example 1: Tech Founder Story

```bash
# Base character
npm run remix-character generate -- --preset tech-founder --output founder-base.png

# Different scenarios
npm run remix-character remix -- --preset tech-founder --scenario "brainstorming session" --output founder-brainstorm.png
npm run remix-character remix -- --preset tech-founder --scenario "celebrating funding" --output founder-celebrate.png
npm run remix-character remix -- --preset tech-founder --scenario "working from coffee shop" --output founder-coffee.png
```

### Example 2: Custom Character for Video Series

```bash
# Create character
npm run remix-character create-preset -- --name "Dev Educator" --base "Friendly programming teacher" --features "round glasses,warm smile,casual dress" --traits "patient,enthusiastic,clear" --output educator.json

# Generate tutorial scenes
npm run remix-character remix -- --character educator.json --scenario "explaining code on whiteboard" --output edu-whiteboard.png
npm run remix-character remix -- --character educator.json --scenario "live coding demonstration" --output edu-coding.png
```

## Integration with Video Platform

Use generated characters in your video content briefs:

```json
{
  "sections": [
    {
      "id": "intro",
      "heading": "Meet the Founder",
      "image": {
        "src": "public/assets/characters/founder-base.png"
      }
    },
    {
      "id": "pitch",
      "heading": "The Vision",
      "image": {
        "src": "public/assets/characters/founder-presenting.png"
      }
    }
  ]
}
```

## Limitations

- DALL-E consistency is good but not perfect - subtle variations may occur
- Complex scenes may be harder to maintain consistency
- Rate limits apply (handled with delays in batch mode)
- Works best with clear, professional character archetypes

## Future Enhancements

- Integration with reference image support (when DALL-E supports it)
- Character style transfer
- Automated character sprite sheets
- Video frame consistency tools

## Support

For issues or questions, check the main project README or create an issue.
