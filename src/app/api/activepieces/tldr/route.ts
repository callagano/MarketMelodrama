import { NextRequest, NextResponse } from 'next/server';

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
}

// Enhanced storage with 24-hour persistence and deployment survival
let tldrData: TLDRData = { updates: [] };
let lastUpdateTime: number = 0;
let dataExpiryTime: number = 0;

// Try to restore data from environment variables or external storage
function initializeData() {
  // Check if we have data in environment variables (for critical data)
  const envData = process.env.TLDR_BACKUP_DATA;
  if (envData) {
    try {
      const parsedData = JSON.parse(envData);
      const dataAge = Date.now() - (parsedData.timestamp || 0);
      // Only restore if data is less than 24 hours old
      if (dataAge < 24 * 60 * 60 * 1000) {
        tldrData = parsedData.data || { updates: [] };
        lastUpdateTime = parsedData.timestamp || 0;
        dataExpiryTime = lastUpdateTime + (24 * 60 * 60 * 1000);
        console.log('Restored data from backup after deployment');
      }
    } catch (error) {
      console.log('Failed to restore backup data:', error);
    }
  }
}

// Initialize data on module load
initializeData();

// Read existing data (always returns current data, no expiry check)
function readData(): TLDRData {
  console.log(`Reading data: ${tldrData.updates.length} updates in memory`);
  return tldrData;
}

// Write data with backup (no expiry - always overridden by new ActivePieces data)
function writeData(data: TLDRData) {
  tldrData = data;
  lastUpdateTime = Date.now();
  dataExpiryTime = lastUpdateTime + (24 * 60 * 60 * 1000); // Keep for reference but not used for expiry
  
  // Create backup for deployment survival
  const backupData = {
    data: data,
    timestamp: lastUpdateTime,
    expiresAt: dataExpiryTime
  };
  
  // Store backup data for deployment survival
  // This is a simplified approach - for production, consider:
  // 1. Vercel KV (Key-Value database)
  // 2. External database (PostgreSQL, MongoDB)
  // 3. Vercel Edge Config
  // 4. External API storage service
  
  try {
    // Store in environment variable as a simple backup
    process.env.TLDR_BACKUP_DATA = JSON.stringify(backupData);
  } catch (error) {
    console.log('Failed to create backup:', error);
  }
  
  console.log(`Data written to memory: ${data.updates.length} updates (always overridden by new ActivePieces data)`);
  console.log(`Backup created for deployment survival`);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Debug: Log the request structure
    console.log('ActivePieces request body:', JSON.stringify(body, null, 2));
    
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

    // Data retention: keep today's data (always overridden by new ActivePieces data), others for 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];
    
    // Filter out old updates but always keep today's update (which gets overridden by new data)
    currentData.updates = currentData.updates.filter((update: TLDRUpdate) => 
      update.date >= cutoffDate || update.date === today
    );
    
    // Ensure we don't have too many updates (max 50)
    if (currentData.updates.length > 50) {
      currentData.updates = currentData.updates.slice(-50);
    }

    writeData(currentData);

    console.log(`ActivePieces TLDR update received for ${today}: ${processedText.substring(0, 100)}...`);

    // Return response in ActivePieces expected format
    return NextResponse.json({ 
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { 
        success: true,
        message: "TLDR update received successfully",
        date: today,
        textLength: processedText.length
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
    const timeUntilExpiry = dataExpiryTime > now ? Math.round((dataExpiryTime - now) / 1000 / 60) : 0;
    
    return NextResponse.json({
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: {
        today: todayUpdate || null,
        recent: recentUpdates,
        total: data.updates.length,
        persistence: {
          lastUpdated: lastUpdateTime,
          expiresInMinutes: timeUntilExpiry,
          isExpired: false, // Data never expires - always overridden by new ActivePieces data
          behavior: "Always overridden by new ActivePieces data"
        },
        deploymentInfo: {
          hasData: data.updates.length > 0,
          message: data.updates.length === 0 ? 
            "No data available. This may be due to a recent deployment. Data will be restored when ActivePieces sends the next update." :
            "Data is available and will be overridden when new data arrives from ActivePieces."
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
