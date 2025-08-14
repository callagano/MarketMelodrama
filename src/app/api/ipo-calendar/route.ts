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

    // Finnhub API key
    const apiKey = 'd2es8spr01qlu2r0k360d2es8spr01qlu2r0k36g';
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Finnhub API key not configured.',
        data: null
      }, { status: 500 });
    }

    // Use Finnhub IPO Calendar endpoint
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sixMonthsAhead = new Date(now.getFullYear(), now.getMonth() + 6, 0);
    const url = `https://finnhub.io/api/v1/calendar/ipo?from=${today.toISOString().split('T')[0]}&to=${sixMonthsAhead.toISOString().split('T')[0]}&token=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Finnhub returns JSON format for IPO calendar
    const ipos = data.ipoCalendar.map((ipo: any, index: number) => {
      return {
        id: index + 1,
        symbol: ipo.symbol || '',
        company: ipo.name || '',
        date: ipo.date || '',
        priceRangeLow: ipo.price ? ipo.price.split('-')[0] : '',
        priceRangeHigh: ipo.price && ipo.price.includes('-') ? ipo.price.split('-')[1] : ipo.price || '',
        currency: 'USD', // Finnhub typically uses USD
        exchange: ipo.exchange || '',
        priceRange: ipo.price || '',
        sharesOffered: ipo.numberOfShares ? `${(ipo.numberOfShares / 1000000).toFixed(1)}M` : '',
        totalValue: ipo.totalSharesValue ? `$${(ipo.totalSharesValue / 1000000).toFixed(1)}M` : '',
        underwriters: '', // Finnhub doesn't provide this
        status: ipo.status || 'Expected'
      };
    });

    // Filter for next 6 months, then sort by date
    const filteredIPOs = ipos
      .filter((ipo: any) => {
        if (!ipo.date) return false;
        const ipoDate = new Date(ipo.date);
        const isInRange = ipoDate >= today && ipoDate <= sixMonthsAhead;
        console.log(`IPO ${ipo.symbol} (${ipo.company}) - Date: ${ipo.date}, In Range: ${isInRange}`);
        return isInRange;
      })
      .sort((a: any, b: any) => {
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
      message: `Fresh IPO data from Finnhub API (${filteredIPOs.length} IPOs available for next 6 months, limited by API data)`,
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
