import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export const runtime = 'nodejs';

// This function will be called by Vercel's cron job
export async function GET() {
  try {
    console.log('Starting cron job at:', new Date().toISOString());
    
    // Execute the Python script
    const scriptPath = path.join(process.cwd(), 'src', 'scripts', 'fear_greed_vercel.py');
    const { stdout, stderr } = await execAsync(`python3 ${scriptPath}`);
    
    console.log('Python script output:', stdout);
    if (stderr) {
      console.error('Python script errors:', stderr);
    }
    
    // Copy the generated CSV file to the public directory
    const sourceFile = path.join(process.cwd(), 'fear_greed_index.csv');
    const destDir = path.join(process.cwd(), 'public', 'data');
    const destFile = path.join(destDir, 'fear_greed_index.csv');
    
    // Ensure the destination directory exists
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // Copy the file
    fs.copyFileSync(sourceFile, destFile);
    console.log('CSV file copied to public directory');
    
    return NextResponse.json({ success: true, message: 'Data updated successfully' });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update data' },
      { status: 500 }
    );
  }
} 