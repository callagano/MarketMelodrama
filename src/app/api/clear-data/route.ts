import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Clearing all data from ActivePieces storage ===');
    
    // This will be handled by the ActivePieces endpoint itself
    // We'll call it to clear the data
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://marketmelodrama.vercel.app';
    
    // Send a special clear command to ActivePieces endpoint
    const response = await fetch(`${baseUrl}/api/activepieces/tldr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'clear_all_data',
        timestamp: new Date().toISOString()
      })
    });

    const result = await response.json();
    console.log('Clear data response:', result);

    return NextResponse.json({
      success: true,
      message: 'All data cleared successfully',
      timestamp: new Date().toISOString(),
      note: 'System is now ready for real ActivePieces data'
    });

  } catch (error) {
    console.error('Error clearing data:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to clear data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get current data status
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://marketmelodrama.vercel.app';
    const response = await fetch(`${baseUrl}/api/activepieces/tldr`);
    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Current data status retrieved',
      data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting data status:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get data status',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
