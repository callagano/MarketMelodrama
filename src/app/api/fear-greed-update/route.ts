import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Fear & Greed Index Update Check ===');
    
    // Check if it's a weekday (Monday = 1, Friday = 5)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    if (isWeekend) {
      console.log('Skipping Fear & Greed update on weekend');
      return NextResponse.json({
        status: 200,
        message: 'Skipped: Markets are closed on weekends',
        dayOfWeek: dayOfWeek,
        isWeekend: true
      });
    }

    console.log('Fear & Greed Index update is handled by GitHub Actions');
    console.log('Check the Actions tab in GitHub for update status');

    return NextResponse.json({
      status: 200,
      message: 'Fear & Greed Index update is handled by GitHub Actions',
      note: 'Data is updated automatically via GitHub Actions workflow',
      timestamp: new Date().toISOString(),
      dayOfWeek: dayOfWeek,
      isWeekend: false
    });

  } catch (error) {
    console.error('Error in Fear & Greed update check:', error);
    
    return NextResponse.json(
      {
        status: 500,
        message: 'Failed to check Fear & Greed Index update',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 200,
    message: 'Fear & Greed Index Update API',
    description: 'POST to this endpoint to run the daily Fear & Greed update',
    schedule: 'Runs automatically at 6:00 AM GMT+2 on weekdays',
    endpoint: '/api/fear-greed-update'
  });
}
