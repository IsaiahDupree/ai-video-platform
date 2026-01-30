# Motion Canvas Integration

Remotion VideoStudio includes full support for **Motion Canvas** as an alternative rendering engine alongside Remotion.

## Overview

Motion Canvas is a TypeScript-based animation framework that provides:
- Declarative animation syntax
- Composition-based scene structure
- FFmpeg integration for rendering
- Developer-friendly API

This integration provides a **two-pass pipeline** for optimal audio-video sync:
1. **Pass 1**: Initial render with seed reveals → Captures real timing
2. **Pass 2**: Rebuilds audio with real timing → Final render

## Architecture

```
┌─────────────────────────────────────────┐
│  VideoStudio Core (Remotion)            │
│  - Format prep                          │
│  - Beat extraction                      │
│  - Macro cue generation                 │
│  - Audio mixing                         │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Motion Canvas Engine                   │
│  - Hybrid format rendering              │
│  - Visual reveals capture               │
│  - Two-pass pipeline                    │
│  - FFmpeg video compilation             │
└─────────────────────────────────────────┘
```

## Quick Start

### 1. Setup

```bash
# Install dependencies in motion-canvas directory
cd motion-canvas
npm install
npm run build
```

### 2. Run Two-Pass Pipeline

```bash
# From project root
cd motion-canvas
npm run mc:two-pass
```

This orchestrates the full workflow:
- Format prep (if script.txt exists)
- Macro cue generation
- Audio mix (Pass 1)
- CLI render (captures reveals)
- Rebuild audio with real timing
- Final render (Pass 2)
- Timeline QA validation

### 3. Rendered Output

Output videos are saved to:
- `motion-canvas/output/` - Primary output directory
- `data/visual_reveals.json` - Captured timing data

## Components

### Two-Pass Pipeline (`scripts/mc-two-pass.ts`)

Orchestrates the complete rendering workflow:
```typescript
interface PipelineConfig {
  projectRoot: string;    // Parent Remotion project
  mcRoot: string;         // Motion Canvas directory
  dataDir: string;        // Shared data directory
  outputDir: string;      // Output directory
  fps: number;            // Frames per second
}

// Run
await runTwoPassPipeline(config);
```

### Playwright Renderer (`scripts/mc-render.ts`)

Headless browser automation for rendering:
- Launches Motion Canvas dev server
- Opens in Chromium (headless or headed)
- Captures visual reveals timing
- Polls for output completion
- Saves reveals to JSON

```bash
npm run mc:render:playwright             # Default (headless, capture reveals)
npm run mc:render:playwright --headed    # Visible browser
```

### CLI Renderer (`scripts/mc-cli-render.ts`)

Simple polling-based renderer without Playwright dependency:
- Starts Vite dev server
- Opens browser (configurable)
- Polls output directory for new files
- Waits for file stabilization
- Optionally compiles image sequence with FFmpeg

```bash
npx tsx scripts/mc-cli-render.ts [--no-browser] [--no-capture]
```

### Dev Server (`scripts/mc-server.ts`)

Starts Motion Canvas dev server and provides API:
```typescript
interface McServerHandle {
  port: number;
  logs: string[];
  waitForReady(timeoutMs: number): Promise<boolean>;
  stop(): void;
}

const server = startMcDevServer();
await server.waitForReady(10000);
```

## Scene Components

### Hybrid Format Renderer (`src/format/reveal-ui.tsx`)

Renders hybrid format blocks with reveal timing:
- **keyword** - Bold highlighted text
- **bullet** - List items
- **code** - Monospace code blocks
- **error** - Red error banners
- **success** - Green success banners
- **cta** - Call-to-action blocks

### Visual Reveals System (`src/sfx/reveal-recorder.ts`)

Records visual element timing during render:
```typescript
// In components
useReveal('keyword', 'hook_text');
useReveal('code', 'example_1');

// Exports to data/visual_reveals.json
{
  "version": "1.0.0",
  "reveals": [
    { "t": 1.5, "kind": "keyword", "key": "hook_text" },
    { "t": 3.2, "kind": "code", "key": "example_1" }
  ]
}
```

## Workflow Examples

### Example 1: Simple Topic Render

```bash
# Prepare data
echo "My Topic" > data/script.txt

# Two-pass render
cd motion-canvas
npm run mc:two-pass
```

Output: `motion-canvas/output/topic.mp4`

### Example 2: Headless Batch Rendering

```bash
# Run without opening browser
cd motion-canvas
npx tsx scripts/mc-cli-render.ts --no-browser
```

### Example 3: Capture Reveals Only

```bash
cd motion-canvas
npm run mc:render:playwright

# Check captured timing
cat ../data/visual_reveals.json
```

## Configuration

### CLI Renderer Config (`scripts/mc-render.config.ts`)

```typescript
export const mcRenderConfig = {
  port: 9000,
  outputDir: './output',
  expectedExtensions: ['.mp4', '.webm', '.mov', '.png'],
  serverStartupMs: 10000,
  renderTimeoutMs: 300000,
  pollIntervalMs: 2000,
  openBrowser: true,
  fps: 30,
  compileWithFFmpeg: true,
  headless: true,
  captureReveals: true,
  revealsOutputPath: '../data/visual_reveals.json',
  editorUrl: 'http://localhost:9000/?render',
};
```

## Advanced Features

### Reveal Capture

Enable/disable during render:
```bash
# Capture reveals
npm run mc:render:playwright

# Skip reveal capture
npx tsx scripts/mc-cli-render.ts --no-capture
```

### FFmpeg Compilation

Automatic image sequence → video conversion:
- Detects PNG sequences in output
- Compiles with specified FPS
- Saves as MP4

Requires: `ffmpeg` command available in PATH

### Image Sequence Export

Motion Canvas automatically exports PNG sequences:
```
motion-canvas/output/
├── scene-001/
│   ├── 0001.png
│   ├── 0002.png
│   └── ...
└── scene-001.mp4  (compiled)
```

## Troubleshooting

### Server doesn't start
```bash
# Check port 9000 is free
lsof -i :9000

# Or use different port in config
```

### Render timeout
- Increase `renderTimeoutMs` in config
- Check Motion Canvas server logs
- Verify output directory is writable

### Reveals not captured
- Ensure `captureReveals: true` in config
- Check components use `useReveal()` hook
- Verify reveals data written to disk

### FFmpeg not found
- Install FFmpeg: `brew install ffmpeg` (macOS) or `apt install ffmpeg` (Linux)
- Or disable in config: `compileWithFFmpeg: false`

## Integration with Remotion

The Motion Canvas pipeline shares the same:
- **data/** directory for briefs, scripts, assets
- **Audio timing** from Remotion audio generation
- **SFX manifest** from Remotion library
- **Visual reveals** capture system
- **Timeline QA** validation

This allows seamless switching between rendering engines without changing input data.

## Performance

### Typical Render Times

| Duration | Resolution | Render Time |
|----------|------------|-------------|
| 10s      | 1080p      | 30-60s      |
| 30s      | 1080p      | 90-120s     |
| 60s      | 1080p      | 180-240s    |

### Memory Usage

- Dev server: ~500MB
- Browser process: ~300-400MB
- FFmpeg compilation: varies by duration

## Future Enhancements

- [ ] WebGL rendering backend
- [ ] Real-time preview server
- [ ] Distributed rendering (parallel scenes)
- [ ] Custom animation libraries
- [ ] Plugin system for extensions

## References

- [Motion Canvas Docs](https://motion-canvas.github.io/)
- [Two-Pass Pipeline](./scripts/mc-two-pass.ts)
- [Playwright Renderer](./scripts/mc-render.ts)
- [Main VideoStudio README](../README.md)
