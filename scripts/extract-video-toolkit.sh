#!/bin/bash
# =============================================================================
# Video Production Toolkit Extractor
# =============================================================================
# Extracts Remotion/Motion Canvas toolkit to another project

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Source directory (where this script lives)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(dirname "$SCRIPT_DIR")"

# Target directory (passed as argument)
TARGET_DIR="${1:-}"

# Options
INCLUDE_MC="${2:-no}"  # Include Motion Canvas? (yes/no)

print_header() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║         VIDEO PRODUCTION TOOLKIT EXTRACTOR                   ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_usage() {
    echo "Usage: $0 <target-directory> [include-motion-canvas]"
    echo ""
    echo "Arguments:"
    echo "  target-directory      Path to your new project"
    echo "  include-motion-canvas Optional: 'yes' to include Motion Canvas (default: no)"
    echo ""
    echo "Examples:"
    echo "  $0 /path/to/my-project"
    echo "  $0 /path/to/my-project yes"
    echo ""
}

print_header

if [ -z "$TARGET_DIR" ]; then
    echo -e "${RED}Error: No target directory specified${NC}"
    print_usage
    exit 1
fi

# Create target directory if it doesn't exist
mkdir -p "$TARGET_DIR"

echo -e "${YELLOW}Source:${NC} $SOURCE_DIR"
echo -e "${YELLOW}Target:${NC} $TARGET_DIR"
echo -e "${YELLOW}Include Motion Canvas:${NC} $INCLUDE_MC"
echo ""

# =============================================================================
# Copy Remotion Core Files
# =============================================================================

echo -e "${GREEN}[1/6] Copying Remotion components...${NC}"
mkdir -p "$TARGET_DIR/src/components"
cp "$SOURCE_DIR/src/components/AnimatedCaptions.tsx" "$TARGET_DIR/src/components/" 2>/dev/null || true
cp "$SOURCE_DIR/src/components/AICharacter.tsx" "$TARGET_DIR/src/components/" 2>/dev/null || true
cp "$SOURCE_DIR/src/components/TikTokCaptions.tsx" "$TARGET_DIR/src/components/" 2>/dev/null || true

echo -e "${GREEN}[2/6] Copying audio system...${NC}"
mkdir -p "$TARGET_DIR/src/audio"
cp "$SOURCE_DIR/src/audio/audio-types.ts" "$TARGET_DIR/src/audio/" 2>/dev/null || true
cp "$SOURCE_DIR/src/audio/audio-validate.ts" "$TARGET_DIR/src/audio/" 2>/dev/null || true
cp "$SOURCE_DIR/src/audio/beat-extractor.ts" "$TARGET_DIR/src/audio/" 2>/dev/null || true
cp "$SOURCE_DIR/src/audio/merge-events.ts" "$TARGET_DIR/src/audio/" 2>/dev/null || true
cp "$SOURCE_DIR/src/audio/sfx-thin.ts" "$TARGET_DIR/src/audio/" 2>/dev/null || true
cp "$SOURCE_DIR/src/audio/timeline-qa.ts" "$TARGET_DIR/src/audio/" 2>/dev/null || true
cp "$SOURCE_DIR/src/audio/sfx-context-pack.ts" "$TARGET_DIR/src/audio/" 2>/dev/null || true

echo -e "${GREEN}[3/6] Copying SFX and format systems...${NC}"
mkdir -p "$TARGET_DIR/src/sfx"
cp "$SOURCE_DIR/src/sfx/macro-cues.ts" "$TARGET_DIR/src/sfx/" 2>/dev/null || true
cp "$SOURCE_DIR/src/sfx/policy-engine.ts" "$TARGET_DIR/src/sfx/" 2>/dev/null || true

mkdir -p "$TARGET_DIR/src/format"
cp "$SOURCE_DIR/src/format/hybrid-types.ts" "$TARGET_DIR/src/format/" 2>/dev/null || true
cp "$SOURCE_DIR/src/format/format-generator.ts" "$TARGET_DIR/src/format/" 2>/dev/null || true
cp "$SOURCE_DIR/src/format/visual-reveals.ts" "$TARGET_DIR/src/format/" 2>/dev/null || true

echo -e "${GREEN}[4/6] Copying types and compositions...${NC}"
mkdir -p "$TARGET_DIR/src/types"
cp "$SOURCE_DIR/src/types/ContentBrief.ts" "$TARGET_DIR/src/types/" 2>/dev/null || true

mkdir -p "$TARGET_DIR/src/compositions"
cp "$SOURCE_DIR/src/compositions/BriefComposition.tsx" "$TARGET_DIR/src/compositions/" 2>/dev/null || true
cp "$SOURCE_DIR/src/compositions/FullVideoDemo.tsx" "$TARGET_DIR/src/compositions/" 2>/dev/null || true
cp "$SOURCE_DIR/src/compositions/BenchmarkTest.tsx" "$TARGET_DIR/src/compositions/" 2>/dev/null || true
cp "$SOURCE_DIR/src/compositions/CaptionStylesBenchmark.tsx" "$TARGET_DIR/src/compositions/" 2>/dev/null || true

echo -e "${GREEN}[5/6] Copying scripts...${NC}"
mkdir -p "$TARGET_DIR/scripts"
cp "$SOURCE_DIR/scripts/generate-audio.ts" "$TARGET_DIR/scripts/" 2>/dev/null || true
cp "$SOURCE_DIR/scripts/generate-character.ts" "$TARGET_DIR/scripts/" 2>/dev/null || true
cp "$SOURCE_DIR/scripts/build-audio-mix.ts" "$TARGET_DIR/scripts/" 2>/dev/null || true
cp "$SOURCE_DIR/scripts/timeline-gate.ts" "$TARGET_DIR/scripts/" 2>/dev/null || true
cp "$SOURCE_DIR/scripts/render-from-input.ts" "$TARGET_DIR/scripts/" 2>/dev/null || true

echo -e "${GREEN}[6/6] Copying assets and config...${NC}"
mkdir -p "$TARGET_DIR/public/assets/sfx"
cp -r "$SOURCE_DIR/public/assets/sfx/"* "$TARGET_DIR/public/assets/sfx/" 2>/dev/null || true

mkdir -p "$TARGET_DIR/public/assets/characters"
cp -r "$SOURCE_DIR/public/assets/characters/"* "$TARGET_DIR/public/assets/characters/" 2>/dev/null || true

# Copy config files
cp "$SOURCE_DIR/remotion.config.ts" "$TARGET_DIR/" 2>/dev/null || true
cp "$SOURCE_DIR/tsconfig.json" "$TARGET_DIR/" 2>/dev/null || true

# Copy docs
mkdir -p "$TARGET_DIR/docs"
cp "$SOURCE_DIR/docs/INTEGRATION-Guide.md" "$TARGET_DIR/docs/" 2>/dev/null || true
cp "$SOURCE_DIR/docs/REMOTION-Advanced-Capabilities.md" "$TARGET_DIR/docs/" 2>/dev/null || true
cp "$SOURCE_DIR/docs/BENCHMARK-Controllability.md" "$TARGET_DIR/docs/" 2>/dev/null || true

# =============================================================================
# Copy Motion Canvas (Optional)
# =============================================================================

if [ "$INCLUDE_MC" = "yes" ]; then
    echo -e "${GREEN}[+] Copying Motion Canvas...${NC}"
    mkdir -p "$TARGET_DIR/motion-canvas"
    cp -r "$SOURCE_DIR/motion-canvas/src" "$TARGET_DIR/motion-canvas/" 2>/dev/null || true
    cp -r "$SOURCE_DIR/motion-canvas/scripts" "$TARGET_DIR/motion-canvas/" 2>/dev/null || true
    cp "$SOURCE_DIR/motion-canvas/package.json" "$TARGET_DIR/motion-canvas/" 2>/dev/null || true
    cp "$SOURCE_DIR/motion-canvas/vite.config.ts" "$TARGET_DIR/motion-canvas/" 2>/dev/null || true
    cp "$SOURCE_DIR/motion-canvas/tsconfig.json" "$TARGET_DIR/motion-canvas/" 2>/dev/null || true
fi

# =============================================================================
# Create package.json template if it doesn't exist
# =============================================================================

if [ ! -f "$TARGET_DIR/package.json" ]; then
    echo -e "${GREEN}[+] Creating package.json template...${NC}"
    cat > "$TARGET_DIR/package.json" << 'EOF'
{
  "name": "video-production-toolkit",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "remotion studio",
    "render": "remotion render",
    "render:brief": "npx tsx scripts/render-from-input.ts",
    "generate:character": "npx tsx scripts/generate-character.ts",
    "generate:audio": "npx tsx scripts/generate-audio.ts",
    "audio:mix": "npx tsx scripts/build-audio-mix.ts",
    "sfx:beats": "npx tsx src/audio/beat-extractor.ts",
    "sfx:macro": "npx tsx src/sfx/macro-cues.ts",
    "qa:timeline": "npx tsx scripts/timeline-gate.ts"
  },
  "dependencies": {
    "@remotion/bundler": "^4.0.0",
    "@remotion/cli": "^4.0.0",
    "@remotion/renderer": "^4.0.0",
    "remotion": "^4.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "tsx": "^4.0.0"
  }
}
EOF
fi

# =============================================================================
# Create .env.local template
# =============================================================================

if [ ! -f "$TARGET_DIR/.env.local" ]; then
    echo -e "${GREEN}[+] Creating .env.local template...${NC}"
    cat > "$TARGET_DIR/.env.local" << 'EOF'
# Video Production Toolkit Environment Variables

# Required for AI character generation
OPENAI_API_KEY=sk-...

# Optional: TTS providers
ELEVENLABS_API_KEY=

# Optional: Additional AI providers
REPLICATE_API_TOKEN=
EOF
fi

# =============================================================================
# Summary
# =============================================================================

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Extraction complete!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Next steps:"
echo "  1. cd $TARGET_DIR"
echo "  2. npm install"
echo "  3. Add your API keys to .env.local"
echo "  4. npm run dev"
echo ""
echo "Files copied:"
find "$TARGET_DIR" -type f -name "*.ts" -o -name "*.tsx" | wc -l | xargs echo "  - TypeScript files:"
find "$TARGET_DIR" -type f -name "*.json" | wc -l | xargs echo "  - JSON files:"
find "$TARGET_DIR" -type f \( -name "*.mp3" -o -name "*.wav" \) | wc -l | xargs echo "  - Audio files:"
echo ""
echo "Documentation: $TARGET_DIR/docs/INTEGRATION-Guide.md"
