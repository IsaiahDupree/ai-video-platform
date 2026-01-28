# Image Prompt Templates (IMG-005)

## Overview

Reusable prompt templates for generating consistent, high-quality AI images across different categories. Each template includes variables for customization while maintaining professional quality and consistent style.

## Directory Structure

```
prompts/
├── backgrounds/      # Background scene templates
├── characters/       # Character illustration templates
├── objects/          # Object and item templates
├── products/         # Product photography templates
├── tech/             # Technology and software UI templates
├── nature/           # Natural scene templates
└── abstract/         # Abstract and artistic templates
```

## Template Format

Each template is a JSON file with the following structure:

```json
{
  "id": "template-id",
  "category": "backgrounds",
  "name": "Template Name",
  "description": "Brief description of the template",
  "template": "Prompt text with {variables}",
  "variables": {
    "variable_name": {
      "type": "enum|string",
      "options": ["option1", "option2"],
      "default": "default value"
    }
  },
  "examples": [
    "Example of a fully rendered prompt"
  ],
  "tags": ["tag1", "tag2"],
  "aspectRatio": "16:9",
  "recommendedSize": "1792x1024"
}
```

## Available Templates

### Backgrounds

#### modern-office.json
Professional office workspace with customizable lighting, views, and objects.

**Variables:**
- `lighting`: Natural daylight, warm ambient, soft overhead, dramatic side
- `view`: City skyline, nature view, white wall, glass windows
- `objects`: Laptop/coffee, monitors, notebook, minimal setup
- `color_scheme`: Neutral, warm wood, black/white, blue/gray

**Example:**
```
Modern, minimalist office workspace with natural daylight from large windows,
city skyline view, clean desk with laptop and coffee cup, neutral white and
gray color palette, professional business environment, high quality, 8k resolution
```

#### gradient.json
Smooth gradient backgrounds for clean, modern looks.

**Variables:**
- `style`: Soft/dreamy, bold/vibrant, subtle/elegant, dynamic/energetic
- `color1`: Any color (string)
- `color2`: Any color (string)
- `direction`: Diagonal, vertical, horizontal, radial
- `texture`: Grain, flat, blur, noise
- `mood`: Calm, energetic, professional, creative

### Characters

#### professional.json
Business professional character illustrations.

**Variables:**
- `style`: Flat, realistic, minimalist, corporate
- `age`: Young, middle-aged, senior
- `gender`: Male, female, non-binary, androgynous
- `appearance`: Confident, serious, friendly, dynamic
- `attire`: Business suit, blazer, dress, casual
- `pose`: Arms crossed, sitting, presenting, walking
- `expression`: Smile, focused, friendly, thoughtful
- `background`: Solid, blurred office, white, gradient

### Products

#### hero-shot.json
Professional product photography style.

**Variables:**
- `product`: Product description (string)
- `angle`: Front, 3/4, isometric, low angle, overhead
- `lighting`: Soft studio, dramatic, bright, moody
- `background`: White, gradient, abstract, lifestyle, dark
- `style`: Minimalist, premium, modern, warm

### Tech

#### software-ui.json
Modern software interface designs.

**Variables:**
- `app_type`: Dashboard, analytics, code editor, project mgmt, design, mobile
- `layout`: Grid, card-based, sidebar, split-screen
- `color_scheme`: Dark/blue, light/minimal, vibrant, professional
- `style`: Flat, glassmorphic, neumorphic, minimalist
- `elements`: Charts, tables, cards, timeline, kanban

## Using Templates

### Method 1: Manual Variable Substitution

```bash
# Read template
cat data/prompts/backgrounds/modern-office.json | jq -r '.template'

# Manually replace variables
PROMPT="Modern, minimalist office workspace with warm ambient lighting, nature view with trees, clean desk with notebook and pen, warm wood tones color palette, professional business environment, high quality, 8k resolution"

# Generate image
npm run generate-images -- --prompt "$PROMPT" --output public/assets/scenes/backgrounds/office.png
```

### Method 2: Using Template Manager (Recommended)

Create a script to handle variable substitution:

```bash
npm run use-template backgrounds/modern-office \
  --lighting "natural daylight from large windows" \
  --view "city skyline view" \
  --output public/assets/scenes/backgrounds/office-modern.png
```

### Method 3: In TypeScript Code

```typescript
import * as fs from 'fs';
import * as path from 'path';

interface PromptTemplate {
  template: string;
  variables: Record<string, any>;
}

function renderTemplate(
  templatePath: string,
  variables: Record<string, string>
): string {
  const template: PromptTemplate = JSON.parse(
    fs.readFileSync(templatePath, 'utf-8')
  );

  let prompt = template.template;

  for (const [key, value] of Object.entries(variables)) {
    prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }

  return prompt;
}

// Usage
const prompt = renderTemplate(
  'data/prompts/backgrounds/modern-office.json',
  {
    lighting: 'natural daylight from large windows',
    view: 'city skyline view',
    objects: 'laptop and coffee cup',
    color_scheme: 'neutral white and gray'
  }
);
```

## Creating Custom Templates

### Step 1: Define Template Structure

```json
{
  "id": "my-template",
  "category": "backgrounds",
  "name": "My Custom Template",
  "description": "Description of what this template creates",
  "template": "Your prompt with {variable1} and {variable2}",
  "variables": {
    "variable1": {
      "type": "enum",
      "options": ["option1", "option2"],
      "default": "option1"
    },
    "variable2": {
      "type": "string",
      "default": "default value"
    }
  },
  "examples": [
    "Fully rendered example prompt 1",
    "Fully rendered example prompt 2"
  ],
  "tags": ["relevant", "tags"],
  "aspectRatio": "16:9",
  "recommendedSize": "1792x1024"
}
```

### Step 2: Test the Template

1. Manually substitute variables
2. Generate a test image
3. Refine prompt based on results
4. Update variables and options

### Step 3: Add to Library

Save your template in the appropriate category directory:
```
data/prompts/{category}/template-name.json
```

## Template Best Practices

### 1. Use Clear Variable Names

✅ Good:
```json
"{lighting} illuminating a {subject}"
```

❌ Bad:
```json
"{l} for {s}"
```

### 2. Provide Meaningful Options

✅ Good:
```json
"lighting": {
  "options": [
    "natural daylight from large windows",
    "warm ambient lighting",
    "soft overhead lighting"
  ]
}
```

❌ Bad:
```json
"lighting": {
  "options": ["light1", "light2", "light3"]
}
```

### 3. Include Quality Modifiers

Always include quality and resolution modifiers:
- "high quality"
- "8k resolution"
- "professional photography"
- "detailed illustration"

### 4. Specify Style Consistently

Be consistent with style descriptors:
- Art style (flat, realistic, minimalist)
- Mood (professional, creative, energetic)
- Quality level (studio, commercial, high-end)

### 5. Test Multiple Variations

Generate images with different variable combinations to ensure consistency.

### 6. Document Examples

Include 2-3 fully rendered examples showing different variable combinations.

## Integration with Image Generation

### DALL-E (IMG-001)

```bash
# Use template with DALL-E
npm run generate-images -- \
  --prompt "$(cat data/prompts/backgrounds/gradient.json | jq -r '.examples[0]')" \
  --output public/assets/scenes/backgrounds/gradient-blue-purple.png \
  --quality hd
```

### Gemini (IMG-002)

```bash
# Use template with Gemini
npm run remix-character-gemini -- \
  --prompt "$(cat data/prompts/characters/professional.json | jq -r '.examples[0]')" \
  --output public/assets/scenes/characters/business-pro.png
```

### Character Consistency (IMG-002)

Use templates to maintain character consistency:
```bash
# Base character
BASE_PROMPT=$(cat data/prompts/characters/professional.json | jq -r '.examples[0]')

# Generate consistent variations
npm run remix-character -- \
  --base-prompt "$BASE_PROMPT" \
  --variations "different poses and expressions" \
  --output-dir public/assets/scenes/characters/hero/
```

## Template Variables Reference

### Common Variable Types

#### enum (Enumerated Options)
Fixed set of predefined options.

```json
{
  "type": "enum",
  "options": ["option1", "option2", "option3"],
  "default": "option1"
}
```

#### string (Free-form Text)
Any text value, typically for custom descriptions.

```json
{
  "type": "string",
  "default": "default text"
}
```

### Standard Variables

These variables are commonly used across templates:

**Visual Style:**
- `style`: Overall artistic style
- `mood`: Emotional tone
- `quality`: Quality descriptors

**Lighting:**
- `lighting`: Light source and quality
- `brightness`: Light intensity
- `shadows`: Shadow characteristics

**Composition:**
- `angle`: Camera angle
- `perspective`: Viewpoint
- `framing`: Scene framing

**Color:**
- `color_scheme`: Color palette
- `colors`: Specific colors
- `saturation`: Color intensity

**Background:**
- `background`: Background type
- `environment`: Setting/location
- `backdrop`: Backdrop style

## Advanced Usage

### Combining Templates

Create compound prompts by combining multiple templates:

```typescript
const background = renderTemplate('backgrounds/gradient.json', {...});
const character = renderTemplate('characters/professional.json', {...});

const combinedPrompt = `${character}, placed in ${background}`;
```

### Template Inheritance

Create variations of existing templates:

```json
{
  "id": "modern-office-dark",
  "extends": "modern-office",
  "overrides": {
    "lighting": {
      "default": "moody dramatic lighting"
    }
  }
}
```

### Batch Generation

Generate multiple variations from a single template:

```bash
for lighting in "natural daylight" "warm ambient" "soft overhead"; do
  # Generate image for each lighting variant
done
```

## Related Features

- **IMG-001**: DALL-E Image Generation - Use templates with DALL-E
- **IMG-002**: Character Consistency - Consistent character generation
- **IMG-004**: Scene Image Library - Organize generated images
- **VID-007**: DALL-E Image Generation - Original image gen script

## Troubleshooting

### Template variables not substituting

1. Check variable names match exactly (case-sensitive)
2. Ensure proper JSON syntax
3. Verify the replacement logic in your script

### Generated images inconsistent

1. Make prompt more specific
2. Add more quality modifiers
3. Test with different variable combinations
4. Refine variable options

### Poor image quality

1. Add quality modifiers: "high quality", "8k", "professional"
2. Be more specific in descriptions
3. Use appropriate image model (dall-e-3 vs dall-e-2)

## Future Enhancements

- [ ] Template validation tool
- [ ] Visual template editor
- [ ] Template marketplace/sharing
- [ ] AI-powered template suggestions
- [ ] Template versioning
- [ ] Usage analytics per template
- [ ] Automated A/B testing of templates
- [ ] Template inheritance system
