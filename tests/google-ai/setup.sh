#!/bin/bash

# Setup script for Google AI testing suite

echo "🚀 Setting up Google AI Testing Suite..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your GOOGLE_AI_API_KEY"
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env and add your Google AI API key"
echo "2. Get your API key from: https://makersuite.google.com/app/apikey"
echo "3. Run tests:"
echo "   - npm run test:image  (Image generation)"
echo "   - npm run test:video  (Video generation)"
echo "   - npm run test:all    (All tests)"
echo ""
