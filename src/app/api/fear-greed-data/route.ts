import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Function to read and parse CSV files
function readCsvFile(filePath: string) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
  } catch (error) {
    console.error(`Error reading CSV file ${filePath}:`, error);
    return [];
  }
}

// Mock data for development when CSV file is not available
const generateMockData = (days: number = 1825) => {
  const data = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Generate random values for each metric
    const momentum = 50 + Math.sin(i / 30) * 30 + (Math.random() - 0.5) * 10;
    const strength = 50 + Math.sin(i / 45) * 30 + (Math.random() - 0.5) * 10;
    const safe_haven = 50 + Math.sin(i / 60) * 30 + (Math.random() - 0.5) * 10;
    const fearGreedIndex = (momentum + strength + safe_haven) / 3;
    
    data.push({
      date: date.toISOString().split('T')[0],
      momentum,
      strength,
      safe_haven,
      Fear_Greed_Index: fearGreedIndex
    });
  }
  
  return data;
};

async function fetchFearGreedData() {
  try {
    // Try to read from public/data directory
    const publicDataDir = path.join(process.cwd(), 'public', 'data');
    const csvPath = path.join(publicDataDir, 'fear_greed_index.csv');
    
    if (fs.existsSync(csvPath)) {
      console.log('Using fear_greed_index.csv data from public/data directory');
      const csvData = readCsvFile(csvPath);
      return csvData.map((row: any) => ({
        date: row.date,
        momentum: parseFloat(row.momentum),
        strength: parseFloat(row.strength),
        safe_haven: parseFloat(row.safe_haven),
        Fear_Greed_Index: parseFloat(row.Fear_Greed_Index)
      }));
    }
    
    // Fallback to scripts directory
    const scriptsDir = path.join(process.cwd(), 'src', 'scripts');
    const scriptsCsvPath = path.join(scriptsDir, 'fear_greed_index.csv');
    
    if (fs.existsSync(scriptsCsvPath)) {
      console.log('Using fear_greed_index.csv data from scripts directory');
      const csvData = readCsvFile(scriptsCsvPath);
      return csvData.map((row: any) => ({
        date: row.date,
        momentum: parseFloat(row.momentum),
        strength: parseFloat(row.strength),
        safe_haven: parseFloat(row.safe_haven),
        Fear_Greed_Index: parseFloat(row.Fear_Greed_Index)
      }));
    }
  } catch (error) {
    console.error('Error reading fear_greed_index.csv:', error);
  }
  
  // Fallback to mock data if CSV file is not available
  console.log('Falling back to mock data');
  return generateMockData();
}

export async function GET() {
  try {
    // Fetch fear and greed index data
    const data = await fetchFearGreedData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to load data' },
      { status: 500 }
    );
  }
} 