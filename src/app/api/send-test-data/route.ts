import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Sending test data to ActivePieces endpoint ===');
    
    // Create test data that simulates ActivePieces format
    const testData = {
      title: `Test Market Update - ${new Date().toLocaleString('it-IT')}`,
      sentiment: Math.floor(Math.random() * 100),
      highlights: [
        "Mercati mostrano sentiment positivo",
        "Azioni tech in crescita",
        "Settore energetico volatile"
      ],
      big_picture: [
        "I mercati globali rispondono agli indicatori economici",
        "La fiducia degli investitori rimane alta nonostante le incertezze"
      ]
    };

    console.log('Test data created:', testData);

    // Send to ActivePieces endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://marketmelodrama.vercel.app';
    const response = await fetch(`${baseUrl}/api/activepieces/tldr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    console.log('ActivePieces response:', result);

    return NextResponse.json({
      success: true,
      message: 'Test data sent successfully',
      testData,
      response: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error sending test data:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to send test data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get current data from ActivePieces endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://marketmelodrama.vercel.app';
    const response = await fetch(`${baseUrl}/api/activepieces/tldr`);
    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Current ActivePieces data retrieved',
      data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting ActivePieces data:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get ActivePieces data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
