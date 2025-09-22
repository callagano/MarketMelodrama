import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const OLD_DATA_FILE = path.join(process.cwd(), 'data', 'tldr-updates.json');
const NEW_DATA_FILE = path.join(process.cwd(), 'data', 'activepieces-tldr.json');

interface TLDRUpdate {
  text: string;
  date: string;
  source: string;
  createdAt?: string;
  updatedAt?: string;
}

interface OldDataFormat {
  updates: TLDRUpdate[];
}

interface NewDataFormat {
  updates: TLDRUpdate[];
  lastUpdated: number;
  version: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Starting TLDR data migration ===');
    
    // Check if old data file exists
    if (!fs.existsSync(OLD_DATA_FILE)) {
      return NextResponse.json({
        success: false,
        message: 'No old data file found to migrate',
        oldFile: OLD_DATA_FILE
      });
    }

    // Read old data
    const oldData: OldDataFormat = JSON.parse(fs.readFileSync(OLD_DATA_FILE, 'utf-8'));
    console.log(`Found ${oldData.updates.length} updates in old format`);

    // Check if new data file already exists
    let newData: NewDataFormat = { updates: [], lastUpdated: 0, version: '2.0' };
    if (fs.existsSync(NEW_DATA_FILE)) {
      newData = JSON.parse(fs.readFileSync(NEW_DATA_FILE, 'utf-8'));
      console.log(`Found existing new data file with ${newData.updates.length} updates`);
    }

    // Merge data (old data takes precedence for dates that don't exist in new data)
    const mergedUpdates = [...newData.updates];
    
    for (const oldUpdate of oldData.updates) {
      const existingIndex = mergedUpdates.findIndex(update => update.date === oldUpdate.date);
      if (existingIndex === -1) {
        // Add new update
        mergedUpdates.push({
          ...oldUpdate,
          source: oldUpdate.source || 'migrated'
        });
        console.log(`Added migrated update for ${oldUpdate.date}`);
      } else {
        // Update existing with old data (old data takes precedence)
        mergedUpdates[existingIndex] = {
          ...oldUpdate,
          source: oldUpdate.source || 'migrated',
          updatedAt: new Date().toISOString()
        };
        console.log(`Updated existing data for ${oldUpdate.date} with migrated data`);
      }
    }

    // Sort by date (newest first)
    mergedUpdates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Create new data structure
    const finalData: NewDataFormat = {
      updates: mergedUpdates,
      lastUpdated: Date.now(),
      version: '2.0'
    };

    // Ensure data directory exists
    const dataDir = path.dirname(NEW_DATA_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Write new data file
    fs.writeFileSync(NEW_DATA_FILE, JSON.stringify(finalData, null, 2));

    console.log(`Migration completed. Total updates: ${finalData.updates.length}`);
    console.log('=== TLDR data migration completed successfully ===');

    return NextResponse.json({
      success: true,
      message: 'Data migration completed successfully',
      stats: {
        oldUpdates: oldData.updates.length,
        newUpdates: finalData.updates.length,
        totalMerged: finalData.updates.length
      },
      files: {
        oldFile: OLD_DATA_FILE,
        newFile: NEW_DATA_FILE
      }
    });

  } catch (error) {
    console.error('Error during TLDR data migration:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const oldExists = fs.existsSync(OLD_DATA_FILE);
    const newExists = fs.existsSync(NEW_DATA_FILE);
    
    let oldDataCount = 0;
    let newDataCount = 0;
    
    if (oldExists) {
      const oldData = JSON.parse(fs.readFileSync(OLD_DATA_FILE, 'utf-8'));
      oldDataCount = oldData.updates?.length || 0;
    }
    
    if (newExists) {
      const newData = JSON.parse(fs.readFileSync(NEW_DATA_FILE, 'utf-8'));
      newDataCount = newData.updates?.length || 0;
    }

    return NextResponse.json({
      migration: {
        oldFileExists: oldExists,
        newFileExists: newExists,
        oldDataCount,
        newDataCount,
        migrationNeeded: oldExists && oldDataCount > 0
      },
      files: {
        oldFile: OLD_DATA_FILE,
        newFile: NEW_DATA_FILE
      }
    });
  } catch (error) {
    console.error('Error checking migration status:', error);
    return NextResponse.json(
      { error: 'Failed to check migration status' }, 
      { status: 500 }
    );
  }
}
