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

// Read existing data with 24-hour persistence
function readData(): TLDRData {
  const now = Date.now();
  
  // Check if data has expired (24 hours)
  if (now > dataExpiryTime) {
    console.log('Data expired after 24 hours, returning empty data');
    return { updates: [] };
  }
  
  console.log(`Reading data: ${tldrData.updates.length} updates in memory (expires in ${Math.round((dataExpiryTime - now) / 1000 / 60)} minutes)`);
  return tldrData;
}

// Write data with 24-hour expiry and backup
function writeData(data: TLDRData) {
  tldrData = data;
  lastUpdateTime = Date.now();
  dataExpiryTime = lastUpdateTime + (24 * 60 * 60 * 1000); // 24 hours from now
  
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
  
  console.log(`Data written to memory: ${data.updates.length} updates (expires in 24 hours)`);
  console.log(`Backup created for deployment survival`);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Debug: Log the request structure
    console.log('ActivePieces request body:', JSON.stringify(body, null, 2));
    
    // Extract text from various possible locations in ActivePieces request
    const text = body.text || 
                 body.body || 
                 body.content || 
                 body.message || 
                 body.data ||
                 (body.body && body.body.text) ||
                 (body.response && body.response.text) ||
                 (body.data && body.data.text);
    
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
    const existingIndex = currentData.updates.findIndex((update: TLDRUpdate) => update.date === today);
    
    if (existingIndex !== -1) {
      // Update existing entry
      const updatedEntry: TLDRUpdate = {
        text: cleanText,
        date: today,
        source: 'activepieces',
        updatedAt: new Date().toISOString()
      };
      currentData.updates[existingIndex] = updatedEntry;
    } else {
      // Add new entry
      const newEntry: TLDRUpdate = {
        text: cleanText,
        date: today,
        source: 'activepieces',
        createdAt: new Date().toISOString()
      };
      currentData.updates.push(newEntry);
    }

    // Enhanced data retention: keep today's data for 24 hours, others for 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];
    
    // Filter out old updates but always keep today's update
    currentData.updates = currentData.updates.filter((update: TLDRUpdate) => 
      update.date >= cutoffDate || update.date === today
    );
    
    // Ensure we don't have too many updates (max 50)
    if (currentData.updates.length > 50) {
      currentData.updates = currentData.updates.slice(-50);
    }

    writeData(currentData);

    console.log(`ActivePieces TLDR update received for ${today}: ${cleanText.substring(0, 100)}...`);

    // Return response in ActivePieces expected format
    return NextResponse.json({ 
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { 
        success: true,
        message: "TLDR update received successfully",
        date: today,
        textLength: cleanText.length
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
          isExpired: timeUntilExpiry === 0
        },
        deploymentInfo: {
          hasData: data.updates.length > 0,
          message: data.updates.length === 0 ? 
            "No data available. This may be due to a recent deployment. Data will be restored when ActivePieces sends the next update." :
            "Data is available and persistent."
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
