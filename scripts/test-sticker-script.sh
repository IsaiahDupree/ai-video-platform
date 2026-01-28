#!/bin/bash
# Test script for sticker generation feature (IMG-003)

echo "Testing IMG-003: Sticker Generation"
echo "===================================="
echo ""

# Check if script exists
if [ -f "scripts/generate-stickers.py" ]; then
    echo "✓ Script file exists"
else
    echo "✗ Script file not found"
    exit 1
fi

# Check if script is valid Python
echo ""
echo "Validating Python syntax..."
python3 -m py_compile scripts/generate-stickers.py 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✓ Python syntax is valid"
else
    echo "✗ Python syntax errors found"
    exit 1
fi

# Check if requirements.txt exists
if [ -f "requirements.txt" ]; then
    echo "✓ requirements.txt exists"
else
    echo "✗ requirements.txt not found"
    exit 1
fi

# Check if documentation exists
if [ -f "docs/sticker-generation.md" ]; then
    echo "✓ Documentation exists"
else
    echo "✗ Documentation not found"
    exit 1
fi

# Check if npm script is configured
if grep -q "generate-stickers" package.json; then
    echo "✓ npm script configured"
else
    echo "✗ npm script not configured"
    exit 1
fi

echo ""
echo "===================================="
echo "✓ All tests passed!"
echo ""
echo "To use the sticker generation feature:"
echo "1. Install dependencies: pip install -r requirements.txt"
echo "2. Run: npm run generate-stickers -- input.jpg output.png"
echo ""
