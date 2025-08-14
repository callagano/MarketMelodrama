import { NextResponse } from 'next/server';
import { cacheManager } from '@/lib/cache';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const horizon = searchParams.get('horizon') || '1month';
    
    // Alpha Vantage API key - using provided key
    const apiKey = 'WLHZLTATM9PMFVX9';
    
    // Check cache first - cache for 24 hours to ensure only one API call per day
    const cacheKey = `earnings-${horizon}`;
    const cachedData = await cacheManager.get<any[]>(cacheKey);
    
    if (cachedData) {
      const cacheInfo = await cacheManager.getCacheInfo(cacheKey);
      const ageHours = cacheInfo?.age ? Math.floor(cacheInfo.age / (1000 * 60 * 60)) : 0;
      
      // If cache is less than 24 hours old, use it
      if (ageHours < 24) {
        const cacheAge = cacheInfo?.age || 0;
        const lastFetched = new Date(Date.now() - cacheAge).toISOString();
        const nextFetch = new Date(Date.now() - cacheAge + 24 * 60 * 60 * 1000).toISOString();
        
        return NextResponse.json({
          success: true,
          data: cachedData,
          count: cachedData.length,
          cached: true,
          message: `Using cached data (${ageHours}h old, API called once per day)`,
          lastFetched: lastFetched,
          nextFetch: nextFetch
        });
      }
    }

    // Try to get more data by requesting a larger horizon and limit
    const url = `https://www.alphavantage.co/query?function=EARNINGS_CALENDAR&horizon=3month&apikey=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }
    
    const data = await response.text();
    
    // Alpha Vantage returns CSV format for earnings calendar
    const lines = data.trim().split('\n');
    const headers = lines[0].split(',');
    const earnings = lines.slice(1).map((line, index) => {
      const values = line.split(',');
      return {
        id: index + 1,
        symbol: values[0] || '',
        name: values[1] || '',
        reportDate: values[2] || '',
        fiscalDateEnding: values[3] || '',
        estimate: values[4] || '',
        currency: values[5] || 'USD'
      };
    });

    // Filter for current day only, then sort by time
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const filteredEarnings = earnings
      .filter(earning => {
        if (!earning.reportDate) return false;
        const reportDate = new Date(earning.reportDate);
        return reportDate >= today && reportDate < tomorrow;
      })
      .sort((a, b) => {
        const dateA = new Date(a.reportDate || '');
        const dateB = new Date(b.reportDate || '');
        return dateA.getTime() - dateB.getTime();
      }); // No limit - show all earnings for today

    // Save to cache for exactly 24 hours to ensure only one API call per day
    await cacheManager.set(cacheKey, filteredEarnings, 24 * 60 * 60); // 24 hours in seconds

    return NextResponse.json({
      success: true,
      data: filteredEarnings,
      count: filteredEarnings.length,
      cached: false,
      message: `Fresh data from Alpha Vantage API (${filteredEarnings.length} earnings for today, cached for 24h)`,
      lastFetched: new Date().toISOString(),
      nextFetch: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

  } catch (error) {
    console.error('Earnings calendar API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch earnings data',
      data: null
    }, { status: 500 });
  }
}
