import { NextResponse } from 'next/server';

interface TaskStatus {
  name: string;
  endpoint: string;
  schedule: string;
  description: string;
  nextRun: string;
  lastRun?: string;
  status: 'active' | 'inactive' | 'error';
}

export async function GET() {
  try {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Calculate next run times
    const nextRun = new Date(now);
    nextRun.setUTCHours(4, 0, 0, 0);
    if (now.getUTCHours() >= 4) {
      nextRun.setUTCDate(nextRun.getUTCDate() + 1);
    }
    
    const tasks: TaskStatus[] = [
      {
        name: 'Market Data Refresh',
        endpoint: '/api/cron',
        schedule: '0 4 * * *',
        description: 'Updates trending stocks, IPO calendar, economic calendar',
        nextRun: nextRun.toISOString(),
        status: 'active'
      },
      {
        name: 'Fear & Greed Index Update',
        endpoint: '/api/fear-greed-update',
        schedule: '0 4 * * 1-5',
        description: 'Updates Fear & Greed Index data (weekdays only)',
        nextRun: isWeekend ? 
          new Date(nextRun.getTime() + (8 - dayOfWeek) * 24 * 60 * 60 * 1000).toISOString() :
          nextRun.toISOString(),
        status: isWeekend ? 'inactive' : 'active'
      }
    ];

    return NextResponse.json({
      success: true,
      message: 'Scheduler status retrieved successfully',
      timestamp: now.toISOString(),
      currentTime: {
        utc: now.toISOString(),
        local: now.toLocaleString(),
        dayOfWeek: dayOfWeek,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
        isWeekend: isWeekend
      },
      tasks: tasks,
      summary: {
        total: tasks.length,
        active: tasks.filter(t => t.status === 'active').length,
        inactive: tasks.filter(t => t.status === 'inactive').length,
        error: tasks.filter(t => t.status === 'error').length
      },
      nextExecution: {
        time: nextRun.toISOString(),
        local: nextRun.toLocaleString(),
        willRun: !isWeekend || dayOfWeek !== 0 // Will run if not Sunday
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to retrieve scheduler status',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
