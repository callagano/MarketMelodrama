import { NextRequest, NextResponse } from 'next/server';
import { cacheManager } from '@/lib/cache';
import { storage } from '@/lib/storage';
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
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'tldr-data.json');

// In-memory cache for Vercel (fallback)
let memoryCache: TLDRData | null = null;
let memoryCacheTimestamp: number = 0;

// Read existing data from multiple persistence sources
async function readData(): Promise<TLDRData> {
  // Use simple storage (works in Vercel)
  try {
    const data = await storage.getData();
    if (data.updates && data.updates.length > 0) {
      console.log(`Reading data from storage: ${data.updates.length} updates`);
      return data;
    }
  } catch (error) {
    console.log('Failed to read from storage:', error);
  }

  // Fallback to memory cache
  if (memoryCache && memoryCache.updates.length > 0) {
    const now = Date.now();
    const cacheAge = now - memoryCacheTimestamp;
    if (cacheAge < 24 * 60 * 60 * 1000) { // 24 hours
      console.log(`Reading data from memory cache: ${memoryCache.updates.length} updates`);
      return memoryCache;
    }
  }

  // Try file cache (fastest)
  try {
    const cachedData = await cacheManager.get<TLDRData>(CACHE_KEY);
    if (cachedData && cachedData.updates.length > 0) {
      console.log(`Reading data from file cache: ${cachedData.updates.length} updates`);
      // Update memory cache
      memoryCache = cachedData;
      memoryCacheTimestamp = Date.now();
      return cachedData;
    }
  } catch (error) {
    console.log('Failed to read from file cache:', error);
  }

  // Try data file (committed to repo as fallback)
  try {
    const dataFileContent = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    const dataFile = JSON.parse(dataFileContent);
    if (dataFile.updates && dataFile.updates.length > 0) {
      console.log(`Reading data from data file: ${dataFile.updates.length} updates`);
      // Update memory cache
      memoryCache = dataFile;
      memoryCacheTimestamp = Date.now();
      return dataFile;
    }
  } catch (error) {
    console.log('Failed to read from data file:', error);
  }
  
  console.log('No persistent data found, returning empty data');
  return { updates: [] };
}

// Write data to persistent file (survives deployments)
async function writePersistentFile(data: TLDRData): Promise<void> {
  try {
    // Check if we're in a Vercel environment
    if (process.env.VERCEL) {
      console.log('Skipping persistent file write in Vercel environment');
      return;
    }
    
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
    // Don't throw - this is optional persistence
  }
}

// Write data to backup file (additional safety)
async function writeBackupFile(data: TLDRData): Promise<void> {
  try {
    // Check if we're in a Vercel environment
    if (process.env.VERCEL) {
      console.log('Skipping backup file write in Vercel environment');
      return;
    }
    
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
    // Don't throw - this is optional persistence
  }
}

// Write data to data file (committed to repo)
async function writeDataFile(data: TLDRData): Promise<void> {
  try {
    const dataFile = {
      ...data,
      lastUpdated: Date.now(),
      version: '1.0'
    };
    
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(dataFile, null, 2));
    console.log(`Data written to data file: ${data.updates.length} updates`);
  } catch (error) {
    console.error('Failed to write to data file:', error);
  }
}

// Write data to all persistence layers
async function writeData(data: TLDRData): Promise<void> {
  // Use simple storage (works in Vercel)
  await storage.setData(data);
  console.log(`Data written to storage: ${data.updates.length} updates`);

  // Update memory cache
  memoryCache = data;
  memoryCacheTimestamp = Date.now();
  console.log(`Data written to memory cache: ${data.updates.length} updates`);

  // Write to data file (committed to repo) - this will persist across deployments
  await writeDataFile(data);

  // Write to file cache (fast access) - this is the primary persistence in Vercel
  try {
    await cacheManager.set(CACHE_KEY, data, 24 * 7); // 7 days TTL
    console.log(`Data written to file cache: ${data.updates.length} updates`);
  } catch (error) {
    console.error('Failed to write to file cache:', error);
    // This is critical - if cache fails, we should still try to continue
  }

  // Write to persistent file (survives deployments) - optional
  try {
    await writePersistentFile(data);
  } catch (error) {
    console.error('Failed to write persistent file:', error);
  }
  
  // Write to backup file (additional safety) - optional
  try {
    await writeBackupFile(data);
  } catch (error) {
    console.error('Failed to write backup file:', error);
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
    console.log(`Total updates in storage: ${currentData.updates.length}`);
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
