import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const results = [];

    // Refresh trending stocks
    try {
      const trendingResponse = await fetch(`${baseUrl}/api/trending-stocks`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (trendingResponse.ok) {
        const trendingData = await trendingResponse.json();
        results.push({
          endpoint: 'trending-stocks',
          success: true,
          count: trendingData.data?.length || 0
        });
      } else {
        results.push({
          endpoint: 'trending-stocks',
          success: false,
          error: `HTTP ${trendingResponse.status}`
        });
      }
    } catch (error) {
      results.push({
        endpoint: 'trending-stocks',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Refresh earnings calendar
    try {
      const earningsResponse = await fetch(`${baseUrl}/api/earnings-calendar`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (earningsResponse.ok) {
        const earningsData = await earningsResponse.json();
        results.push({
          endpoint: 'earnings-calendar',
          success: true,
          count: earningsData.data?.length || 0
        });
      } else {
        results.push({
          endpoint: 'earnings-calendar',
          success: false,
          error: `HTTP ${earningsResponse.status}`
        });
      }
    } catch (error) {
      results.push({
        endpoint: 'earnings-calendar',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Refresh IPO calendar
    try {
      const ipoResponse = await fetch(`${baseUrl}/api/ipo-calendar`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (ipoResponse.ok) {
        const ipoData = await ipoResponse.json();
        results.push({
          endpoint: 'ipo-calendar',
          success: true,
          count: ipoData.data?.length || 0
        });
      } else {
        results.push({
          endpoint: 'ipo-calendar',
          success: false,
          error: `HTTP ${ipoResponse.status}`
        });
      }
    } catch (error) {
      results.push({
        endpoint: 'ipo-calendar',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Refresh economic calendar
    try {
      const economicResponse = await fetch(`${baseUrl}/api/economic-calendar`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (economicResponse.ok) {
        const economicData = await economicResponse.json();
        results.push({
          endpoint: 'economic-calendar',
          success: true,
          count: economicData.data?.length || 0
        });
      } else {
        results.push({
          endpoint: 'economic-calendar',
          success: false,
          error: `HTTP ${economicResponse.status}`
        });
      }
    } catch (error) {
      results.push({
        endpoint: 'economic-calendar',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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