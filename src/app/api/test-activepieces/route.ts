import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Simulate ActivePieces data
    const testData = {
      title: "Test Market Update - " + new Date().toLocaleString(),
      sentiment: Math.floor(Math.random() * 100),
      highlights: [
        "Market shows strong bullish sentiment",
        "Tech stocks leading the charge",
        "Energy sector showing volatility"
      ],
      big_picture: [
        "Global markets responding to economic indicators",
        "Investor confidence remains high despite uncertainties"
      ]
    };

    // Send to ActivePieces endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/activepieces/tldr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Test data sent to ActivePieces endpoint',
      testData,
      response: result
    });

  } catch (error) {
    console.error('Error testing ActivePieces endpoint:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to test ActivePieces endpoint',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get current data from ActivePieces endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/activepieces/tldr`);
    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Current ActivePieces data retrieved',
      data
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
