import { NextRequest, NextResponse } from 'next/server';
import { cacheManager } from '@/lib/cache';
import { promises as fs } from 'fs';
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
}

// Cache key for TLDR data
const CACHE_KEY = 'tldr-activepieces-data';
const PERSISTENT_FILE_PATH = path.join(process.cwd(), 'data', 'tldr-persistent.json');
const BACKUP_FILE_PATH = path.join(process.cwd(), 'data', 'tldr-backup.json');

// Read existing data from multiple persistence sources
async function readData(): Promise<TLDRData> {
  // Try cache first (fastest)
  try {
    const cachedData = await cacheManager.get<TLDRData>(CACHE_KEY);
    if (cachedData && cachedData.updates.length > 0) {
      console.log(`Reading data from cache: ${cachedData.updates.length} updates`);
      return cachedData;
    }
  } catch (error) {
    console.log('Failed to read from cache:', error);
  }

  // Try persistent file (survives deployments)
  try {
    const persistentData = await fs.readFile(PERSISTENT_FILE_PATH, 'utf-8');
    const parsedData = JSON.parse(persistentData);
    if (parsedData.updates && parsedData.updates.length > 0) {
      console.log(`Reading data from persistent file: ${parsedData.updates.length} updates`);
      // Restore to cache for faster future access
      await cacheManager.set(CACHE_KEY, parsedData, 24 * 7);
      return parsedData;
    }
  } catch (error) {
    console.log('Failed to read from persistent file:', error);
  }

  // Try backup file (last resort)
  try {
    const backupData = await fs.readFile(BACKUP_FILE_PATH, 'utf-8');
    const parsedData = JSON.parse(backupData);
    if (parsedData.updates && parsedData.updates.length > 0) {
      console.log(`Reading data from backup file: ${parsedData.updates.length} updates`);
      // Restore to both cache and persistent file
      await cacheManager.set(CACHE_KEY, parsedData, 24 * 7);
      await writePersistentFile(parsedData);
      return parsedData;
    }
  } catch (error) {
    console.log('Failed to read from backup file:', error);
  }
  
  console.log('No persistent data found, returning empty data');
  return { updates: [] };
}

// Write data to persistent file (survives deployments)
async function writePersistentFile(data: TLDRData): Promise<void> {
  try {
    // Ensure data directory exists
    await fs.mkdir(path.dirname(PERSISTENT_FILE_PATH), { recursive: true });
    
    const persistentData = {
      ...data,
      lastUpdated: Date.now(),
      version: '1.0'
    };
    
    await fs.writeFile(PERSISTENT_FILE_PATH, JSON.stringify(persistentData, null, 2));
    console.log(`Data written to persistent file: ${data.updates.length} updates`);
  } catch (error) {
    console.error('Failed to write to persistent file:', error);
  }
}

// Write data to backup file (additional safety)
async function writeBackupFile(data: TLDRData): Promise<void> {
  try {
    // Ensure data directory exists
    await fs.mkdir(path.dirname(BACKUP_FILE_PATH), { recursive: true });
    
    const backupData = {
      ...data,
      lastUpdated: Date.now(),
      version: '1.0',
      backup: true
    };
    
    await fs.writeFile(BACKUP_FILE_PATH, JSON.stringify(backupData, null, 2));
    console.log(`Data written to backup file: ${data.updates.length} updates`);
  } catch (error) {
    console.error('Failed to write to backup file:', error);
  }
}

// Write data to all persistence layers
async function writeData(data: TLDRData): Promise<void> {
  // Write to cache (fast access)
  try {
    await cacheManager.set(CACHE_KEY, data, 24 * 7); // 7 days TTL
    console.log(`Data written to cache: ${data.updates.length} updates`);
  } catch (error) {
    console.error('Failed to write to cache:', error);
  }

  // Write to persistent file (survives deployments)
  await writePersistentFile(data);
  
  // Write to backup file (additional safety)
  await writeBackupFile(data);
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

    const currentData = await readData();
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

    await writeData(currentData);

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
    const data = await readData();
    const today = new Date().toISOString().split('T')[0];
    
    // Return today's update if available
    const todayUpdate = data.updates.find((update: TLDRUpdate) => update.date === today);
    
    // Get recent updates excluding today's update
    const recentUpdates = data.updates.filter((update: TLDRUpdate) => update.date !== today).slice(-7);
    
    // Get cache info for persistence details
    const cacheInfo = await cacheManager.getCacheInfo(CACHE_KEY);
    const now = Date.now();
    const timeUntilExpiry = cacheInfo?.expiresAt ? Math.round((cacheInfo.expiresAt - now) / 1000 / 60) : 0;
    
    // Check persistent file status
    let persistentFileStatus = 'not_found';
    try {
      const persistentStats = await fs.stat(PERSISTENT_FILE_PATH);
      persistentFileStatus = 'exists';
    } catch (error) {
      // File doesn't exist
    }
    
    return NextResponse.json({
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: {
        today: todayUpdate || null,
        recent: recentUpdates,
        total: data.updates.length,
        persistence: {
          lastUpdated: cacheInfo?.age ? now - cacheInfo.age : 0,
          expiresInMinutes: timeUntilExpiry,
          isExpired: timeUntilExpiry <= 0,
          behavior: "Data persists until new data arrives - survives Vercel deployments",
          cacheStatus: cacheInfo?.exists ? 'cached' : 'not_cached',
          persistentFileStatus: persistentFileStatus,
          layers: ['cache', 'persistent_file', 'backup_file']
        },
        deploymentInfo: {
          hasData: data.updates.length > 0,
          message: data.updates.length === 0 ? 
            "No data available. Data will be restored from persistent storage when ActivePieces sends the next update." :
            "Data is available and persisted across deployments. New data will override existing data."
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
