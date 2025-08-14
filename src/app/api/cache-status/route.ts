import { NextResponse } from 'next/server';
import { cacheManager } from '@/lib/cache';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'clear') {
      await cacheManager.clear();
      return NextResponse.json({
        success: true,
        message: 'Cache cleared successfully'
      });
    }
    
    // Get cache info for all known keys
    const cacheKeys = ['earnings-1month', 'ipo-calendar'];
    const cacheStatus = {};
    
    for (const key of cacheKeys) {
      const info = await cacheManager.getCacheInfo(key);
      if (info) {
        const now = Date.now();
        const ageHours = info.age ? Math.floor(info.age / (1000 * 60 * 60)) : 0;
        const expiresInHours = info.expiresAt ? Math.floor((info.expiresAt - now) / (1000 * 60 * 60)) : 0;
        
        cacheStatus[key] = {
          exists: info.exists,
          ageHours,
          expiresInHours,
          isExpired: info.expiresAt ? now > info.expiresAt : true
        };
      } else {
        cacheStatus[key] = {
          exists: false,
          ageHours: 0,
          expiresInHours: 0,
          isExpired: true
        };
      }
    }
    
    return NextResponse.json({
      success: true,
      cacheStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Cache status API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get cache status',
      data: null
    }, { status: 500 });
  }
}

