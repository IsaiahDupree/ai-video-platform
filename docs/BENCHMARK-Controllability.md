# Video Engine Controllability Benchmark

## Test Categories

| Category | Weight | Description |
|----------|--------|-------------|
| Animation Control | 25% | Keyframes, easing, programmatic animation |
| Audio Integration | 25% | SFX placement, volume, mixing, sync |
| Visual Effects | 20% | Transitions, filters, overlays |
| Programmatic Control | 20% | Data-driven, AI-addressable, API |
| Render Pipeline | 10% | CLI render, output formats, performance |

---

## 1. Animation Control

### Remotion
| Feature | Support | Notes |
|---------|---------|-------|
| Keyframe animation | ✅ | `interpolate()`, `spring()` |
| Custom easing | ✅ | Bezier curves, spring physics |
| Sequence timing | ✅ | `<Sequence from={frame}>` |
| Parallel animations | ✅ | Multiple components render simultaneously |
| Loop animations | ✅ | `loop` prop on components |
| Stagger animations | ✅ | Map with frame offsets |
| Timeline scrubbing | ✅ | Studio preview with frame control |

### Motion Canvas
| Feature | Support | Notes |
|---------|---------|-------|
| Keyframe animation | ✅ | `yield*` generator syntax |
| Custom easing | ✅ | `easeInOut`, custom curves |
| Sequence timing | ✅ | `waitFor()`, `waitUntil()` |
| Parallel animations | ✅ | `all()` for concurrent animations |
| Loop animations | ✅ | `loop()` helper |
| Stagger animations | ✅ | `sequence()` with delays |
| Timeline scrubbing | ✅ | Editor with time events |

**Animation Score: Remotion 9/10 | Motion Canvas 9/10** (tie)

---

## 2. Audio Integration

### Remotion
| Feature | Support | Notes |
|---------|---------|-------|
| Audio playback | ✅ | `<Audio>` component |
| Volume control | ✅ | `volume` prop, can animate |
| Multiple audio tracks | ✅ | Layer multiple `<Audio>` components |
| Frame-precise sync | ✅ | Audio starts at exact frame |
| Audio visualization | ✅ | `getAudioData()` for waveforms |
| Dynamic SFX | ✅ | Map events → `<Sequence><Audio>` |
| Audio ducking | ⚠️ | Manual volume adjustment |

### Motion Canvas
| Feature | Support | Notes |
|---------|---------|-------|
| Audio playback | ⚠️ | Single project audio track |
| Volume control | ⚠️ | Project-level only |
| Multiple audio tracks | ❌ | Requires pre-mixing |
| Frame-precise sync | ⚠️ | Time events, less precise |
| Audio visualization | ❌ | Not built-in |
| Dynamic SFX | ❌ | Needs external mixing |
| Audio ducking | ❌ | Must pre-mix |

**Audio Score: Remotion 9/10 | Motion Canvas 4/10** (Remotion wins)

---

## 3. Visual Effects

### Remotion
| Feature | Support | Notes |
|---------|---------|-------|
| CSS transforms | ✅ | Full CSS support |
| Filters (blur, glow) | ✅ | CSS filters |
| Masks/clipping | ✅ | CSS clip-path, SVG masks |
| Blend modes | ✅ | CSS mix-blend-mode |
| Video compositing | ✅ | `<Video>` with transforms |
| WebGL/Canvas | ✅ | Any React component |
| Particle systems | ✅ | Three.js integration |

### Motion Canvas
| Feature | Support | Notes |
|---------|---------|-------|
| CSS transforms | ⚠️ | Canvas-based, own API |
| Filters (blur, glow) | ✅ | Built-in filter nodes |
| Masks/clipping | ✅ | Clip paths, masks |
| Blend modes | ✅ | Canvas blend modes |
| Video compositing | ⚠️ | Limited video support |
| WebGL/Canvas | ✅ | Native Canvas2D |
| Particle systems | ⚠️ | Manual implementation |

**Effects Score: Remotion 9/10 | Motion Canvas 7/10** (Remotion wins)

---

## 4. Programmatic Control

### Remotion
| Feature | Support | Notes |
|---------|---------|-------|
| Data-driven content | ✅ | Props → composition |
| JSON input | ✅ | ContentBrief schema |
| API rendering | ✅ | `renderMedia()` function |
| Dynamic duration | ✅ | Calculate from data |
| Conditional scenes | ✅ | React conditionals |
| Template system | ✅ | Compositions as templates |
| AI-addressable | ✅ | JSON schema validation |

### Motion Canvas
| Feature | Support | Notes |
|---------|---------|-------|
| Data-driven content | ✅ | Import JSON, variables |
| JSON input | ✅ | Load external data |
| API rendering | ❌ | Browser-only render |
| Dynamic duration | ✅ | Calculate in scene |
| Conditional scenes | ✅ | Generator conditionals |
| Template system | ⚠️ | Scenes as templates |
| AI-addressable | ✅ | With manifest system |

**Programmatic Score: Remotion 10/10 | Motion Canvas 7/10** (Remotion wins)

---

## 5. Render Pipeline

### Remotion
| Feature | Support | Notes |
|---------|---------|-------|
| CLI render | ✅ | `remotion render` |
| Headless render | ✅ | Node.js API |
| Output formats | ✅ | MP4, WebM, GIF, PNG sequence |
| Parallel rendering | ✅ | Multi-core support |
| Cloud render | ✅ | Remotion Lambda |
| Render queue | ✅ | Batch processing |

### Motion Canvas
| Feature | Support | Notes |
|---------|---------|-------|
| CLI render | ❌ | Browser-based only |
| Headless render | ⚠️ | Playwright workaround |
| Output formats | ✅ | MP4, PNG sequence |
| Parallel rendering | ❌ | Single-threaded |
| Cloud render | ❌ | Not supported |
| Render queue | ❌ | Manual only |

**Render Score: Remotion 10/10 | Motion Canvas 4/10** (Remotion wins)

---

## Overall Scores

| Category | Remotion | Motion Canvas |
|----------|----------|---------------|
| Animation Control | 9 | 9 |
| Audio Integration | 9 | 4 |
| Visual Effects | 9 | 7 |
| Programmatic Control | 10 | 7 |
| Render Pipeline | 10 | 4 |
| **Weighted Total** | **9.4** | **6.2** |

---

## Recommendation

**Remotion is the clear winner** for full-capability video production:

1. **Audio** - Native multi-track SFX support (critical for AI-driven SFX)
2. **API** - True headless rendering for automation
3. **Pipeline** - Production-ready CLI and cloud rendering

**Motion Canvas strengths:**
- Cleaner animation syntax (generators)
- Better for motion graphics demos
- Good for simple animations without audio complexity

### Best Approach
Use **Remotion as primary engine** with the SFX pipeline we built:
- `SfxLayer` component for audio events
- `ContentBrief` schema for AI-driven content
- FFmpeg mixing for complex audio

Keep **Motion Canvas as secondary** for:
- Quick prototyping
- Motion graphics experiments
- When you need generator-based animation flow
