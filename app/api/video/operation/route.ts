import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const operationId = searchParams.get('operationId');

  if (!operationId) {
    return NextResponse.json(
      { error: 'Operation ID is required' },
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

  try {
    // Poll the operation status
    const url = `https://generativelanguage.googleapis.com/v1beta/${operationId}?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Failed to fetch operation: ${errorText}` },
        { status: response.status }
      );
    }

    const operation = await response.json();

    // Check if operation is complete
    if (operation.done) {
      // Extract video data if available
      if (operation.response?.predictions?.[0]?.bytesBase64Encoded) {
        const videoBase64 = operation.response.predictions[0].bytesBase64Encoded;
        
        return NextResponse.json({
          status: 'completed',
          videoUrl: `data:video/mp4;base64,${videoBase64}`,
          operation: operation,
        });
      } else if (operation.error) {
        return NextResponse.json({
          status: 'failed',
          error: operation.error.message || 'Unknown error',
          operation: operation,
        });
      }
    }

    // Operation still in progress
    return NextResponse.json({
      status: 'processing',
      operation: operation,
    });

  } catch (error) {
    console.error('Error polling operation:', error);
    return NextResponse.json(
      { error: 'Failed to poll operation status' },
      { status: 500 }
    );
  }
}
