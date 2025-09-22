import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

// Global in-memory storage with better persistence
let tldrData: TLDRData = { updates: [], lastUpdated: 0, version: '4.0' };
let lastUpdateTime: number = 0;

// Enhanced in-memory storage with better retention
function readData(): TLDRData {
  console.log(`Reading data from memory: ${tldrData.updates.length} updates`);
  return tldrData;
}

// Enhanced write with better persistence
function writeData(data: TLDRData): void {
  tldrData = {
    ...data,
    lastUpdated: Date.now(),
    version: '4.0'
  };
  lastUpdateTime = Date.now();
  console.log(`Data written to memory: ${data.updates.length} updates`);
  
  // Log data persistence info
  console.log(`Data persistence: Memory storage active, ${data.updates.length} updates stored`);
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== ActivePieces POST request received ===');
    const body = await request.json();
    
    // Debug: Log the request structure
    console.log('ActivePieces request body:', JSON.stringify(body, null, 2));
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    // Check if this is a clear data command
    if (body.action === 'clear_all_data') {
      console.log('=== Clearing all data as requested ===');
      tldrData = { updates: [], lastUpdated: 0, version: '4.0' };
      lastUpdateTime = 0;
      console.log('All data cleared successfully');
      
      return NextResponse.json({ 
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: { 
          success: true,
          message: "All data cleared successfully",
          timestamp: new Date().toISOString(),
          totalUpdates: 0
        }
      });
    }
    
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

    // Enhanced data retention: keep today's data (always overridden by new ActivePieces data), others for 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];
    
    // Filter out old updates but always keep today's update (which gets overridden by new data)
    currentData.updates = currentData.updates.filter((update: TLDRUpdate) => 
      update.date >= cutoffDate || update.date === today
    );
    
    // Ensure we don't have too many updates (max 50 for better memory management)
    if (currentData.updates.length > 50) {
      currentData.updates = currentData.updates.slice(-50);
    }

    writeData(currentData);

    console.log(`ActivePieces TLDR update received for ${today}: ${processedText.substring(0, 100)}...`);
    console.log(`Total updates in memory storage: ${currentData.updates.length}`);
    console.log(`Data will persist until next Vercel deployment or function timeout`);
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
    console.log('=== Reading TLDR data from Supabase ===');
    
    // Get the most recent TLDR data from Supabase
    const { data: supabaseData, error } = await supabase
      .from('tldr_data')
      .select('data')
      .limit(1);

    console.log('Supabase query result:', { data: supabaseData, error });

    if (error) {
      console.error('Error reading data from Supabase:', error);
      return NextResponse.json(
        { 
          status: 500,
          headers: { "Content-Type": "application/json" },
          body: { 
            error: "Failed to read data from Supabase",
            details: error.message,
            code: error.code
          }
        }, 
        { status: 500 }
      );
    }

    const latestData = supabaseData?.[0]?.data || null;
    console.log('Latest data from Supabase:', latestData);
    
    if (!latestData) {
      return NextResponse.json({
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
          today: null,
          recent: [],
          total: 0,
          persistence: {
            lastUpdated: 0,
            minutesSinceLastUpdate: 0,
            behavior: "Data persists permanently in Supabase database",
            storage: 'supabase',
            version: '5.0',
            retention: 'permanent',
            maxUpdates: 'unlimited'
          },
          deploymentInfo: {
            hasData: false,
            message: "No data available in Supabase. Data will appear when ActivePieces sends the next update."
          }
        }
      });
    }

    // Parse the JSON data from Supabase
    let parsedData;
    try {
      parsedData = typeof latestData === 'string' ? JSON.parse(latestData) : latestData;
    } catch (parseError) {
      console.error('Error parsing data from Supabase:', parseError);
      return NextResponse.json(
        { 
          status: 500,
          headers: { "Content-Type": "application/json" },
          body: { 
            error: "Failed to parse data from Supabase",
            details: parseError
          }
        }, 
        { status: 500 }
      );
    }

    // Convert to the expected format
    const todayUpdate = {
      text: JSON.stringify(parsedData),
      date: new Date().toISOString().split('T')[0],
      source: 'activepieces',
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: {
        today: todayUpdate,
        recent: [],
        total: 1,
        persistence: {
          lastUpdated: new Date().getTime(),
          minutesSinceLastUpdate: 0,
          behavior: "Data persists permanently in Supabase database",
          storage: 'supabase',
          version: '5.0',
          retention: 'permanent',
          maxUpdates: 'unlimited'
        },
        deploymentInfo: {
          hasData: true,
          message: "Data is available from Supabase database. Data persists permanently."
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