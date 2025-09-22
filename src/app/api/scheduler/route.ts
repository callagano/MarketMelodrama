import { NextRequest, NextResponse } from 'next/server';

interface ScheduledTask {
  name: string;
  endpoint: string;
  schedule: string;
  description: string;
  lastRun?: string;
  status?: 'success' | 'error' | 'pending';
}

const SCHEDULED_TASKS: ScheduledTask[] = [
  {
    name: 'Market Data Refresh',
    endpoint: '/api/cron',
    schedule: '0 4 * * *',
    description: 'Updates trending stocks, IPO calendar, economic calendar'
  },
  {
    name: 'Fear & Greed Index Update',
    endpoint: '/api/fear-greed-update',
    schedule: '0 4 * * 1-5',
    description: 'Updates Fear & Greed Index data (weekdays only)'
  }
];

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const results = [];

    // Check current time and day
    const now = new Date();
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const currentTime = now.toISOString();

    console.log(`[${currentTime}] Scheduler status check - Day: ${dayOfWeek}, Weekend: ${isWeekend}`);

    // Execute scheduled tasks based on current time and day
    for (const task of SCHEDULED_TASKS) {
      try {
        // Check if task should run today
        const shouldRun = task.schedule.includes('1-5') ? !isWeekend : true;
        
        if (!shouldRun) {
          console.log(`Skipping ${task.name} - not scheduled for weekends`);
          results.push({
            task: task.name,
            status: 'skipped',
            reason: 'Weekend - not scheduled',
            timestamp: currentTime
          });
          continue;
        }

        // Execute the task
        console.log(`Executing ${task.name}...`);
        const response = await fetch(`${baseUrl}${task.endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          results.push({
            task: task.name,
            status: 'success',
            message: data.message || 'Task completed successfully',
            timestamp: currentTime,
            details: data
          });
        } else {
          results.push({
            task: task.name,
            status: 'error',
            error: `HTTP ${response.status}`,
            timestamp: currentTime
          });
        }
      } catch (error) {
        results.push({
          task: task.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: currentTime
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const totalCount = results.length;
    
    console.log(`[${currentTime}] Scheduler executed. ${successCount}/${totalCount} tasks successful.`);
    
    return NextResponse.json({
      success: true,
      message: `Scheduler executed. ${successCount}/${totalCount} tasks successful.`,
      timestamp: currentTime,
      dayOfWeek: dayOfWeek,
      isWeekend: isWeekend,
      results: results,
      summary: {
        total: totalCount,
        successful: successCount,
        failed: results.filter(r => r.status === 'error').length,
        skipped: results.filter(r => r.status === 'skipped').length
      },
      scheduledTasks: SCHEDULED_TASKS
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Scheduler failed:`, error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Scheduler execution failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Manual trigger for testing
  return GET();
}
