import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'tldr-updates.json');

// Ensure data directory exists
function ensureDataDirectory() {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Read existing data
function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading data file:', error);
  }
  return { updates: [] };
}

// Write data to file
function writeData(data: any) {
  try {
    ensureDataDirectory();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing data file:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract text from various possible field names
    const text = body.text || body.body || body.content || body.message || body.data;
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text content is required' }, 
        { status: 400 }
      );
    }

    // Clean up the text by removing markdown formatting
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold**
      .replace(/\*(.*?)\*/g, '$1')     // Remove *italic*
      .replace(/📈|💹|🛢️|🚗|🌍/g, '') // Remove emojis
      .replace(/\n\n/g, ' ')           // Replace double line breaks with single space
      .replace(/\n/g, ' ')             // Replace single line breaks with space
      .trim();                         // Remove extra whitespace

    const currentData = readData();
    const today = new Date().toISOString().split('T')[0];
    
    // Check if we already have an update for today
    const existingIndex = currentData.updates.findIndex((update: any) => update.date === today);
    
    if (existingIndex !== -1) {
      // Update existing entry
      currentData.updates[existingIndex] = {
        text: cleanText,
        date: today,
        source: 'webhook',
        updatedAt: new Date().toISOString()
      };
    } else {
      // Add new entry
      currentData.updates.push({
        text: cleanText,
        date: today,
        source: 'webhook',
        createdAt: new Date().toISOString()
      });
    }

    // Keep only last 30 days of updates
    if (currentData.updates.length > 30) {
      currentData.updates = currentData.updates.slice(-30);
    }

    writeData(currentData);

    console.log(`Webhook TLDR update received for ${today}: ${cleanText.substring(0, 100)}...`);

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook update received successfully',
      date: today,
      textLength: cleanText.length
    });

  } catch (error) {
    console.error('Error processing webhook TLDR update:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook update' }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const data = readData();
    const today = new Date().toISOString().split('T')[0];
    
    // Return today's update if available
    const todayUpdate = data.updates.find((update: any) => update.date === today);
    
    // Get recent updates excluding today's update
    const recentUpdates = data.updates.filter((update: any) => update.date !== today).slice(-7);
    
    return NextResponse.json({
      today: todayUpdate || null,
      recent: recentUpdates,
      total: data.updates.length
    });
  } catch (error) {
    console.error('Error reading webhook TLDR data:', error);
    return NextResponse.json(
      { error: 'Failed to read data' }, 
      { status: 500 }
    );
  }
}
