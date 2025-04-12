import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Get the absolute paths
    const scriptPath = path.join(process.cwd(), 'src', 'scripts', 'fear_greed.py');
    const venvPath = path.join(process.cwd(), '.venv', 'bin', 'python3');
    
    // Execute the Python script using the virtual environment
    const { stdout, stderr } = await execAsync(`${venvPath} ${scriptPath}`);
    
    if (stderr && !stderr.includes('IMKClient')) {
      console.error('Error running Python script:', stderr);
      return NextResponse.json({ error: stderr }, { status: 500 });
    }
    
    // Read the latest data from the CSV
    const csvPath = path.join(process.cwd(), 'src', 'scripts', 'fear_greed_index.csv');
    const latestData = await execAsync(`tail -n 1 ${csvPath}`);
    
    return NextResponse.json({ 
      message: 'Fear and Greed index updated successfully',
      output: stdout,
      latestData: latestData.stdout.trim()
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to update Fear and Greed index' }, { status: 500 });
  }
} 