import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Call the trending stocks API to refresh data
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/trending-stocks`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh trending stocks: ${response.status}`);
    }

    const data = await response.json();
    
    console.log(`[${new Date().toISOString()}] Cron job executed successfully. Refreshed ${data.length} trending stocks.`);
    
    return NextResponse.json({
      success: true,
      message: 'Trending stocks refreshed successfully',
      timestamp: new Date().toISOString(),
      stocksCount: data.length
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Cron job failed:`, error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to refresh trending stocks',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 