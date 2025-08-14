import { NextResponse } from 'next/server';
import { cacheManager } from '@/lib/cache';

export async function GET(request: Request) {
  try {
    // Check cache first - cache for 24 hours to ensure only one API call per day
    const cacheKey = 'ipo-calendar';
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
          message: `Using cached IPO data (${ageHours}h old, API called once per day)`,
          lastFetched: lastFetched,
          nextFetch: nextFetch
        });
      }
    }

    // Alpha Vantage API key - using provided key
    const apiKey = 'WLHZLTATM9PMFVX9';
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Alpha Vantage API key not configured.',
        data: null
      }, { status: 500 });
    }

    // Use Alpha Vantage IPO Calendar endpoint
    const url = `https://www.alphavantage.co/query?function=IPO_CALENDAR&apikey=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }
    
    const data = await response.text();
    
    // Alpha Vantage returns CSV format for IPO calendar
    const lines = data.trim().split('\n');
    const headers = lines[0].split(',');
    const ipos = lines.slice(1).map((line, index) => {
      const values = line.split(',');
      return {
        id: index + 1,
        symbol: values[0] || '',
        company: values[1] || '',
        date: values[2] || '',
        priceRangeLow: values[3] || '',
        priceRangeHigh: values[4] || '',
        currency: values[5] || 'USD',
        exchange: values[6] || '',
        priceRange: values[3] && values[4] ? `$${values[3]}-$${values[4]}` : '',
        sharesOffered: '', // Alpha Vantage doesn't provide this
        totalValue: '', // Alpha Vantage doesn't provide this
        underwriters: '', // Alpha Vantage doesn't provide this
        status: 'Expected'
      };
    });

    // Filter for next 6 months, then sort by date
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sixMonthsAhead = new Date(now.getFullYear(), now.getMonth() + 6, 0);
    
    console.log(`IPO Calendar - Today: ${today.toISOString().split('T')[0]}`);
    console.log(`IPO Calendar - Date Range: ${today.toISOString().split('T')[0]} to ${sixMonthsAhead.toISOString().split('T')[0]}`);
    console.log(`IPO Calendar - Total IPOs from API: ${ipos.length}`);
    
    const filteredIPOs = ipos
      .filter(ipo => {
        if (!ipo.date) return false;
        const ipoDate = new Date(ipo.date);
        const isInRange = ipoDate >= today && ipoDate <= sixMonthsAhead;
        console.log(`IPO ${ipo.symbol} (${ipo.company}) - Date: ${ipo.date}, In Range: ${isInRange}`);
        return isInRange;
      })
      .sort((a, b) => {
        if (!a.date || !b.date) return 0;
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });
    
    console.log(`IPO Calendar - Filtered IPOs: ${filteredIPOs.length}`);

    // Save to cache for exactly 24 hours to ensure only one API call per day
    await cacheManager.set(cacheKey, filteredIPOs, 24 * 60 * 60); // 24 hours in seconds

    return NextResponse.json({
      success: true,
      data: filteredIPOs,
      count: filteredIPOs.length,
      cached: false,
      message: `Fresh IPO data from Alpha Vantage API (${filteredIPOs.length} IPOs available for next 6 months, limited by API data)`,
      lastFetched: new Date().toISOString(),
      nextFetch: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

  } catch (error) {
    console.error('IPO calendar API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch IPO data',
      data: null
    }, { status: 500 });
  }
}
