import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const csvPath = path.join(process.cwd(), 'src', 'scripts', 'fear_greed_index.csv');
    const csvData = await fs.readFile(csvPath, 'utf-8');
    
    const data = csvData
      .split('\n')
      .slice(1) // Skip header
      .filter(line => line.trim()) // Remove empty lines
      .map(line => {
        const [date, momentum, strength, safe_haven, Fear_Greed_Index] = line.split(',');
        return {
          date,
          momentum: parseFloat(momentum),
          strength: parseFloat(strength),
          safe_haven: parseFloat(safe_haven),
          Fear_Greed_Index: parseFloat(Fear_Greed_Index)
        };
      });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading CSV:', error);
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
  }
} 