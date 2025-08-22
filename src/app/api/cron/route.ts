import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const results = [];

    // Refresh all data sources
    const endpoints = [
      'trending-stocks',
      'earnings-calendar', 
      'ipo-calendar',
      'economic-calendar'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${baseUrl}/api/${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          results.push({
            endpoint: endpoint,
            success: true,
            count: data.data?.length || 0
          });
        } else {
          results.push({
            endpoint: endpoint,
            success: false,
            error: `HTTP ${response.status}`
          });
        }
      } catch (error) {
        results.push({
          endpoint: endpoint,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    console.log(`[${new Date().toISOString()}] Daily cron job executed successfully. ${successCount}/${totalCount} endpoints refreshed.`);
    
    return NextResponse.json({
      success: true,
      message: `Daily data refresh completed. ${successCount}/${totalCount} endpoints successful.`,
      timestamp: new Date().toISOString(),
      results: results,
      summary: {
        total: totalCount,
        successful: successCount,
        failed: totalCount - successCount
      }
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Daily cron job failed:`, error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to execute daily data refresh',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 