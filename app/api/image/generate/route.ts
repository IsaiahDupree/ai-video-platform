import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, numberOfImages = 1, aspectRatio = '3:4' } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google AI API key not configured' },
        { status: 500 }
      );
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;
    
    const requestBody = {
      instances: [{
        prompt: prompt,
      }],
      parameters: {
        sampleCount: numberOfImages,
        aspectRatio: aspectRatio,
        safetyFilterLevel: 'block_some',
        personGeneration: 'allow_adult',
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Image generation failed: ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json() as any;

    // Convert base64 images to data URLs
    const images = result.predictions?.map((prediction: any, index: number) => ({
      id: `img-${Date.now()}-${index}`,
      url: `data:image/png;base64,${prediction.bytesBase64Encoded}`,
      prompt: prompt,
    })) || [];

    return NextResponse.json({
      success: true,
      images: images,
    });

  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
