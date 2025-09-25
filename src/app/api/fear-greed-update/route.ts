import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    console.log('=== Fear & Greed Index Daily Update Started ===');
    
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

    // Run the Fear & Greed update script
    const scriptPath = process.cwd() + '/src/scripts/fear_greed_index';
    const venvPath = `${scriptPath}/venv`;
    
    console.log(`Running Fear & Greed update from: ${scriptPath}`);
    console.log(`Virtual environment path: ${venvPath}`);
    
    // Check if virtual environment exists, if not create it
    const { stdout: checkVenv } = await execAsync(`ls -la ${venvPath}`, { timeout: 5000 }).catch(() => ({ stdout: '' }));
    
    if (!checkVenv.includes('bin')) {
      console.log('Virtual environment not found, creating it...');
      await execAsync(`cd ${scriptPath} && python3 -m venv venv`, { timeout: 60000 });
      await execAsync(`cd ${scriptPath} && source venv/bin/activate && pip install -r requirements.txt`, { timeout: 120000 });
    }
    
    const { stdout, stderr } = await execAsync(
      `cd ${scriptPath} && source venv/bin/activate && python fngindex.py`,
      { timeout: 300000 } // 5 minute timeout
    );

    if (stderr) {
      console.error('Fear & Greed update stderr:', stderr);
    }

    console.log('Fear & Greed update stdout:', stdout);
    console.log('=== Fear & Greed Index Daily Update Completed ===');

    return NextResponse.json({
      status: 200,
      message: 'Fear & Greed Index updated successfully',
      output: stdout,
      error: stderr || null,
      timestamp: new Date().toISOString(),
      dayOfWeek: dayOfWeek,
      isWeekend: false
    });

  } catch (error) {
    console.error('Error running Fear & Greed update:', error);
    
    return NextResponse.json(
      {
        status: 500,
        message: 'Failed to update Fear & Greed Index',
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
