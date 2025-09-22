import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Define types for better TypeScript support
interface TLDRUpdate {
  text: string;
  date: string;
  source: string;
  createdAt?: string;
  updatedAt?: string;
}

interface TLDRData {
  updates: TLDRUpdate[];
  lastUpdated: number;
  version: string;
}

const DATA_FILE = path.join(process.cwd(), 'data', 'activepieces-tldr.json');

// Ensure data directory exists
function ensureDataDirectory() {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Read existing data from file
function readData(): TLDRData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      console.log(`Reading data from file: ${parsed.updates?.length || 0} updates`);
      return parsed;
    }
  } catch (error) {
    console.error('Error reading data file:', error);
  }
  console.log('No data file found, returning empty data');
  return { updates: [], lastUpdated: 0, version: '2.0' };
}

// Write data to file
function writeData(data: TLDRData): void {
  try {
    ensureDataDirectory();
    const dataWithTimestamp = {
      ...data,
      lastUpdated: Date.now(),
      version: '2.0'
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(dataWithTimestamp, null, 2));
    console.log(`Data written to file: ${data.updates.length} updates`);
  } catch (error) {
    console.error('Error writing data file:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== ActivePieces POST request received ===');
    const body = await request.json();
    
    // Debug: Log the request structure
    console.log('ActivePieces request body:', JSON.stringify(body, null, 2));
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    // Extract text from various possible locations in ActivePieces request
    // If the body itself is structured data (has title, sentiment, etc.), use it directly
    let text;
    if (body.title && body.sentiment && body.highlights && body.big_picture) {
      // This is structured data, stringify it for processing
      text = JSON.stringify(body);
    } else {
      // Extract text from various possible field names
      text = body.text || 
             body.body || 
             body.content || 
             body.message || 
             body.data ||
             (body.body && body.body.text) ||
             (body.response && body.response.text) ||
             (body.data && body.data.text);
    }
    
    if (!text) {
      console.log('No text found in request. Available keys:', Object.keys(body));
      return NextResponse.json(
        { 
          status: 400,
          headers: { "Content-Type": "application/json" },
          body: { 
            error: "Text content is required",
            receivedKeys: Object.keys(body),
            requestBody: body
          }
        }, 
        { status: 400 }
      );
    }

    // Check if the text is valid JSON (ActivePieces structured format)
    let processedText = text;
    let isStructuredData = false;
    
    try {
      const parsedData = JSON.parse(text);
      if (parsedData.title && parsedData.sentiment && parsedData.highlights && parsedData.big_picture) {
        // This is structured ActivePieces data, keep it as JSON
        processedText = text; // Keep original JSON
        isStructuredData = true;
        console.log('Detected structured ActivePieces data, preserving JSON format');
      } else {
        throw new Error('Not structured data');
      }
    } catch (parseError) {
      // Not JSON or not the expected structure, clean up as plain text
      processedText = text
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold**
        .replace(/\*(.*?)\*/g, '$1')     // Remove *italic*
        .replace(/📈|💹|🛢️|🚗|🌍/g, '') // Remove emojis
        .replace(/\n\n/g, ' ')           // Replace double line breaks with single space
        .replace(/\n/g, ' ')             // Replace single line breaks with space
        .trim();                         // Remove extra whitespace
      console.log('Processing as plain text data');
    }

    const currentData = readData();
    const today = new Date().toISOString().split('T')[0];
    
    // Always override data when new data comes from ActivePieces
    const existingIndex = currentData.updates.findIndex((update: TLDRUpdate) => update.date === today);
    
    if (existingIndex !== -1) {
      // Override existing entry (regardless of age or expiry)
      const updatedEntry: TLDRUpdate = {
        text: processedText,
        date: today,
        source: 'activepieces',
        updatedAt: new Date().toISOString()
      };
      currentData.updates[existingIndex] = updatedEntry;
      console.log(`Overriding existing TLDR for ${today} with new ActivePieces data`);
    } else {
      // Add new entry
      const newEntry: TLDRUpdate = {
        text: processedText,
        date: today,
        source: 'activepieces',
        createdAt: new Date().toISOString()
      };
      currentData.updates.push(newEntry);
      console.log(`Added new TLDR for ${today} from ActivePieces`);
    }

    // Data retention: keep today's data (always overridden by new ActivePieces data), others for 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];
    
    // Filter out old updates but always keep today's update (which gets overridden by new data)
    currentData.updates = currentData.updates.filter((update: TLDRUpdate) => 
      update.date >= cutoffDate || update.date === today
    );
    
    // Ensure we don't have too many updates (max 100 for better history)
    if (currentData.updates.length > 100) {
      currentData.updates = currentData.updates.slice(-100);
    }

    writeData(currentData);

    console.log(`ActivePieces TLDR update received for ${today}: ${processedText.substring(0, 100)}...`);
    console.log(`Total updates in persistent storage: ${currentData.updates.length}`);
    console.log('=== ActivePieces POST request completed successfully ===');

    // Return response in ActivePieces expected format
    return NextResponse.json({ 
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { 
        success: true,
        message: "TLDR update received successfully",
        date: today,
        textLength: processedText.length,
        totalUpdates: currentData.updates.length
      }
    });

  } catch (error) {
    console.error('Error processing ActivePieces TLDR update:', error);
    return NextResponse.json(
      { 
        status: 500,
        headers: { "Content-Type": "application/json" },
        body: { error: "Failed to process TLDR update" }
      }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const data = readData();
    const today = new Date().toISOString().split('T')[0];
    
    // Return today's update if available
    const todayUpdate = data.updates.find((update: TLDRUpdate) => update.date === today);
    
    // Get recent updates excluding today's update
    const recentUpdates = data.updates.filter((update: TLDRUpdate) => update.date !== today).slice(-7);
    
    const now = Date.now();
    const timeSinceLastUpdate = data.lastUpdated > 0 ? Math.round((now - data.lastUpdated) / 1000 / 60) : 0;
    
    return NextResponse.json({
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: {
        today: todayUpdate || null,
        recent: recentUpdates,
        total: data.updates.length,
        persistence: {
          lastUpdated: data.lastUpdated,
          minutesSinceLastUpdate: timeSinceLastUpdate,
          behavior: "Data persists in file system until manually deleted or overwritten",
          storage: 'file',
          dataFile: DATA_FILE,
          version: data.version || '2.0'
        },
        deploymentInfo: {
          hasData: data.updates.length > 0,
          message: data.updates.length === 0 ? 
            "No data available. Data will appear when ActivePieces sends the next update." :
            "Data is available in persistent storage. New data will override existing data for the same date."
        }
      }
    });
  } catch (error) {
    console.error('Error reading ActivePieces TLDR data:', error);
    return NextResponse.json(
      { 
        status: 500,
        headers: { "Content-Type": "application/json" },
        body: { error: "Failed to read data" }
      }, 
      { status: 500 }
    );
  }
}
