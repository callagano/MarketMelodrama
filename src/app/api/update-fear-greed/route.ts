import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Get the absolute path to the Python script
    const scriptPath = path.join(process.cwd(), 'src', 'scripts', 'fear_greed.py');
    
    // Execute the Python script
    const { stdout, stderr } = await execAsync(`python3 ${scriptPath}`);
    
    if (stderr) {
      console.error('Error running Python script:', stderr);
      return NextResponse.json({ error: stderr }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: 'Fear and Greed index updated successfully',
      output: stdout 
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to update Fear and Greed index' }, { status: 500 });
  }
} 