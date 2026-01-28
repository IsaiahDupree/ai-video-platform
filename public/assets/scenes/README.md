# Scene Image Library (IMG-004)

## Overview

The scene image library provides organized storage for AI-generated and custom scene images used in video compositions. Images are categorized by type for easy discovery and management.

## Directory Structure

```
scenes/
├── backgrounds/      # Full-screen background images
├── characters/       # Character illustrations and avatars
├── objects/          # Individual objects and items
├── overlays/         # Transparent overlays and effects
├── products/         # Product images and mockups
├── tech/             # Technology and software-related imagery
├── nature/           # Natural scenes and landscapes
└── abstract/         # Abstract patterns and designs
```

## Categories

### `/backgrounds`
Full-screen background images for video scenes.

**Use cases:**
- Scene backgrounds
- Title card backgrounds
- Transition slides

**Recommended specs:**
- Resolution: 1920x1080 (16:9) or higher
- Format: PNG or JPG
- File size: < 2MB per image

**Examples:**
- `gradient-blue.png` - Solid gradient background
- `office-workspace.jpg` - Professional office scene
- `minimalist-white.png` - Clean white background

### `/characters`
Character illustrations, avatars, and people images.

**Use cases:**
- Character-driven narratives
- Testimonials
- Instructional videos

**Recommended specs:**
- Resolution: Variable (portrait orientation)
- Format: PNG (with transparency if needed)
- File size: < 1MB per image

**Examples:**
- `business-woman.png` - Professional character
- `developer-avatar.png` - Developer persona
- `customer-portrait.jpg` - Customer testimonial image

### `/objects`
Individual objects, icons, and items.

**Use cases:**
- Product features
- Icon libraries
- Visual metaphors

**Recommended specs:**
- Resolution: 512x512 to 1024x1024
- Format: PNG (with transparency)
- File size: < 500KB per image

**Examples:**
- `smartphone.png` - Mobile device
- `laptop.png` - Computer illustration
- `coffee-cup.png` - Lifestyle object

### `/overlays`
Transparent overlays, effects, and decorative elements.

**Use cases:**
- Visual effects
- Frame overlays
- Decorative elements

**Recommended specs:**
- Resolution: Match video resolution
- Format: PNG with alpha channel
- File size: < 1MB per image

**Examples:**
- `light-leak-01.png` - Light leak effect
- `film-grain.png` - Grain texture overlay
- `corner-decoration.png` - Frame decoration

### `/products`
Product images, mockups, and demonstrations.

**Use cases:**
- Product showcases
- E-commerce videos
- Feature demonstrations

**Recommended specs:**
- Resolution: 1024x1024 or higher
- Format: PNG or JPG
- File size: < 2MB per image

**Examples:**
- `product-hero.jpg` - Main product image
- `feature-closeup.png` - Detail shot
- `product-in-use.jpg` - Usage demonstration

### `/tech`
Technology, software, and digital-related imagery.

**Use cases:**
- Tech product videos
- Software tutorials
- Digital service explanations

**Recommended specs:**
- Resolution: Variable
- Format: PNG or JPG
- File size: < 1MB per image

**Examples:**
- `code-editor.png` - Code interface
- `dashboard-ui.jpg` - Software dashboard
- `circuit-board.png` - Tech background

### `/nature`
Natural scenes, landscapes, and outdoor imagery.

**Use cases:**
- Environmental videos
- Lifestyle content
- Background variety

**Recommended specs:**
- Resolution: 1920x1080 or higher
- Format: JPG
- File size: < 2MB per image

**Examples:**
- `forest-scene.jpg` - Natural landscape
- `ocean-sunset.jpg` - Scenic view
- `mountain-range.jpg` - Outdoor scene

### `/abstract`
Abstract patterns, shapes, and artistic designs.

**Use cases:**
- Creative transitions
- Artistic backgrounds
- Visual variety

**Recommended specs:**
- Resolution: 1920x1080 or higher
- Format: PNG or JPG
- File size: < 1MB per image

**Examples:**
- `geometric-pattern.png` - Geometric design
- `watercolor-splash.png` - Artistic effect
- `gradient-blend.jpg` - Color blend

## Naming Conventions

Use descriptive, lowercase names with hyphens:

```
{description}-{variant}.{ext}

Examples:
- office-workspace-modern.jpg
- character-developer-sitting.png
- product-hero-angle-1.jpg
- gradient-blue-purple.png
```

## Generating Images

### Using DALL-E (IMG-001)

Generate images using the image generation script:

```bash
# Generate a single scene image
npm run generate-images -- \
  --prompt "Modern office workspace with natural lighting" \
  --output public/assets/scenes/backgrounds/office-modern.png

# Generate images from a brief
npm run generate-images data/briefs/product-video.json
```

### Using Gemini (IMG-002)

```bash
# Generate with Gemini
npm run remix-character-gemini -- \
  --prompt "Professional business character" \
  --output public/assets/scenes/characters/business-pro.png
```

### Manual Upload

1. Place images in appropriate category directory
2. Follow naming conventions
3. Optimize images before upload (compress, resize)
4. Ensure proper licensing/attribution

## Usage in Compositions

Reference scene images in Remotion compositions:

```tsx
import { Img } from 'remotion';

export const MyScene = () => {
  return (
    <div>
      {/* Background */}
      <Img
        src="/assets/scenes/backgrounds/office-modern.jpg"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      {/* Character overlay */}
      <Img
        src="/assets/scenes/characters/developer.png"
        style={{
          position: 'absolute',
          right: 100,
          bottom: 0,
          height: '80%',
        }}
      />
    </div>
  );
};
```

## Usage in Content Briefs

Reference in JSON briefs:

```json
{
  "sections": [
    {
      "id": "intro",
      "heading": "Welcome",
      "body": "Introduction to our product",
      "image": {
        "src": "/assets/scenes/backgrounds/gradient-blue.png",
        "fit": "cover",
        "position": "center"
      }
    }
  ]
}
```

## Image Optimization

### Recommended Tools

- **TinyPNG** - Compress PNG/JPG files
- **ImageOptim** - Batch image optimization (Mac)
- **Squoosh** - Web-based image compression

### Optimization Guidelines

1. **Compress before upload**
   - JPG quality: 85-90%
   - PNG: Use 8-bit when possible

2. **Resize appropriately**
   - Backgrounds: 1920x1080
   - Characters: Maximum 1500px height
   - Objects: 512-1024px

3. **Choose correct format**
   - JPG: Photos, complex images, no transparency
   - PNG: Graphics, transparency, text
   - WebP: Modern browsers, best compression

4. **Test loading performance**
   - Keep individual files < 2MB
   - Total scene assets < 10MB

## Integration with Other Features

### With Sticker Generation (IMG-003)

```bash
# Generate a sticker from a scene image
npm run generate-stickers -- \
  public/assets/scenes/characters/avatar.jpg \
  public/assets/scenes/overlays/avatar-sticker.png
```

### With Character Consistency (IMG-002)

```bash
# Generate consistent character variations
npm run remix-character -- \
  --base public/assets/scenes/characters/hero.png \
  --output-dir public/assets/scenes/characters/hero-variants/
```

## Asset Management

### Version Control

Scene images can become large. Consider:

- **Git LFS** - Track large files separately
- **External storage** - S3, Cloudflare R2
- **CDN** - Serve images from CDN in production

### Metadata

Create a manifest for tracking image metadata:

```json
{
  "scenes": {
    "backgrounds/office-modern.jpg": {
      "description": "Modern office workspace",
      "tags": ["office", "workspace", "professional"],
      "source": "dall-e-3",
      "license": "generated",
      "created": "2024-01-15"
    }
  }
}
```

## Best Practices

1. **Organize by type** - Use category directories
2. **Name descriptively** - Easy to find and understand
3. **Optimize file size** - Faster loading, better performance
4. **Use consistent aspect ratios** - Easier composition
5. **Document sources** - Track AI generation or licensing
6. **Create variants** - Multiple options per concept
7. **Clean up unused** - Remove old/unused images
8. **Backup regularly** - Don't lose custom assets

## Related Features

- **IMG-001**: DALL-E Image Generation - Generate scene images
- **IMG-002**: Character Consistency - Create consistent characters
- **IMG-003**: Sticker Generation - Create overlay stickers
- **IMG-005**: Image Prompt Templates - Reusable prompts
- **VID-003**: Topic Scene Component - Use scenes in videos

## Troubleshooting

### Image not loading in composition

1. Check file path is correct (relative to public/)
2. Verify file exists in correct directory
3. Check file extension matches actual format
4. Clear Remotion cache and reload

### Image quality issues

1. Use higher resolution source images
2. Avoid excessive compression
3. Use PNG for graphics, JPG for photos
4. Check `objectFit` CSS property

### Slow loading

1. Optimize/compress images
2. Use appropriate resolution
3. Consider lazy loading for large sets
4. Use WebP format for modern browsers

## Future Enhancements

- [ ] Automatic image tagging and search
- [ ] Image preview thumbnails
- [ ] Usage tracking and analytics
- [ ] Automated optimization pipeline
- [ ] AI-powered image suggestions
- [ ] Version history for images
- [ ] Integration with cloud storage
