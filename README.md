# Video Studio

A standalone, brief-driven video generation studio built with Remotion. Create professional videos programmatically by defining content in JSON briefs.

## Features

- **Brief-Driven**: Define videos using JSON content briefs
- **Multiple Formats**: Explainer, Listicle, Comparison, Shorts templates
- **Themed Styling**: Dark, Light, Neon themes with full customization
- **Animation Library**: Fade, Slide, Zoom, Bounce, Typewriter effects
- **Scene Templates**: Intro, Topic, List Item, Outro, Transition scenes
- **CLI Rendering**: Render videos from command line
- **Backend Integration Ready**: Designed for programmatic video generation

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Preview in Studio

```bash
npm run dev
```

Opens Remotion Studio at http://localhost:3000

### 3. Render from Brief

```bash
npm run render:brief data/briefs/example_explainer.json
```

## Project Structure

```
VideoStudio/
├── src/
│   ├── scenes/              # Scene templates
│   │   ├── IntroScene.tsx
│   │   ├── TopicScene.tsx
│   │   ├── OutroScene.tsx
│   │   ├── TransitionScene.tsx
│   │   └── ListItemScene.tsx
│   ├── components/          # Reusable visual components
│   │   ├── TextBlock.tsx
│   │   ├── ImageContainer.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── BackgroundGradient.tsx
│   │   └── IconBadge.tsx
│   ├── animations/          # Animation presets
│   │   ├── fadeIn.ts
│   │   ├── slideIn.ts
│   │   ├── typewriter.ts
│   │   ├── bounce.ts
│   │   └── zoom.ts
│   ├── styles/              # Style configurations
│   │   ├── themes/
│   │   ├── fonts.ts
│   │   └── colors.ts
│   ├── utils/               # Utility functions
│   │   ├── timing.ts
│   │   ├── easing.ts
│   │   └── layout.ts
│   ├── types/               # TypeScript types
│   │   └── ContentBrief.ts
│   └── compositions/        # Remotion compositions
│       └── BriefComposition.tsx
├── formats/                 # Video format definitions
│   ├── explainer_v1.ts
│   ├── listicle_v1.ts
│   ├── comparison_v1.ts
│   └── shorts_v1.ts
├── data/
│   ├── briefs/              # Content brief JSON files
│   │   ├── example_explainer.json
│   │   ├── example_listicle.json
│   │   └── schema.json
│   └── assets/              # Static assets
├── scripts/
│   ├── render.ts            # CLI render script
│   ├── preview.ts           # Dev preview server
│   └── validate-brief.ts    # Brief validation
└── output/                  # Rendered videos
```

## Content Brief Schema

Videos are defined using JSON content briefs:

```json
{
  "id": "my_video_001",
  "format": "explainer_v1",
  "version": "1.0",
  "settings": {
    "resolution": { "width": 1080, "height": 1920 },
    "fps": 30,
    "duration_sec": 60,
    "aspect_ratio": "9:16"
  },
  "style": {
    "theme": "dark",
    "primary_color": "#ffffff",
    "secondary_color": "#a1a1aa",
    "accent_color": "#3b82f6",
    "font_heading": "Inter",
    "font_body": "Inter",
    "background_type": "gradient",
    "background_value": "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)"
  },
  "sections": [
    {
      "id": "intro_001",
      "type": "intro",
      "duration_sec": 9,
      "start_time_sec": 0,
      "content": {
        "type": "intro",
        "title": "Your Title",
        "subtitle": "Your Subtitle",
        "hook_text": "Your hook text"
      }
    }
  ]
}
```

## Available Formats

| Format | Description | Aspect Ratio | Default Duration |
|--------|-------------|--------------|------------------|
| `explainer_v1` | Educational content | 9:16 | 60s |
| `listicle_v1` | Top N lists | 9:16 | 45s |
| `comparison_v1` | X vs Y format | 16:9 | 60s |
| `shorts_v1` | Fast-paced shorts | 9:16 | 30s |

## Section Types

- **intro**: Opening with title, subtitle, hook
- **topic**: Main content with heading, body, bullets, image
- **list_item**: Numbered item with title and description
- **comparison**: Side-by-side comparison
- **outro**: Closing with CTA and social handles
- **transition**: Animated transitions between sections

## CLI Commands

```bash
# Start development studio
npm run dev

# Render video from brief
npm run render:brief <brief.json> [output.mp4]

# Validate brief without rendering
npm run validate <brief.json>

# Preview with specific brief
npm run studio <brief.json>
```

## Backend Integration

When connecting to a backend system:

```python
# Python example
import subprocess
import json

def render_video(brief: dict, output_path: str):
    brief_path = f"/tmp/brief_{brief['id']}.json"
    with open(brief_path, 'w') as f:
        json.dump(brief, f)
    
    result = subprocess.run([
        "npx", "tsx", "scripts/render.ts",
        brief_path, output_path
    ], cwd="/path/to/VideoStudio", capture_output=True)
    
    if result.returncode != 0:
        raise RuntimeError(result.stderr.decode())
    
    return output_path
```

## Customization

### Adding New Themes

Create a new theme in `src/styles/themes/`:

```typescript
export const myTheme: Partial<StyleConfig> = {
  theme: 'custom',
  primary_color: '#yourcolor',
  // ...
};
```

### Adding New Scenes

1. Create scene in `src/scenes/MyScene.tsx`
2. Register in `src/scenes/index.ts`
3. Add to format definitions as needed

### Adding New Animations

Create animation in `src/animations/`:

```typescript
export function myAnimation(frame: number, options: Options) {
  // Return animated values
  return { opacity, scale, x, y };
}
```

## License

MIT






