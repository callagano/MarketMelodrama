import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory storage for Vercel compatibility
let tldrData = { updates: [] };

// Read existing data
function readData() {
  return tldrData;
}

// Write data
function writeData(data: any) {
  tldrData = data;
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
    const existingIndex = currentData.updates.findIndex((update: any) => update.date === today);
    
    if (existingIndex !== -1) {
      // Update existing entry
      currentData.updates[existingIndex] = {
        text: cleanText,
        date: today,
        source: 'activepieces',
        updatedAt: new Date().toISOString()
      };
    } else {
      // Add new entry
      currentData.updates.push({
        text: cleanText,
        date: today,
        source: 'activepieces',
        createdAt: new Date().toISOString()
      });
    }

    // Keep only last 30 days of updates
    if (currentData.updates.length > 30) {
      currentData.updates = currentData.updates.slice(-30);
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
    const todayUpdate = data.updates.find((update: any) => update.date === today);
    
    // Get recent updates excluding today's update
    const recentUpdates = data.updates.filter((update: any) => update.date !== today).slice(-7);
    
    return NextResponse.json({
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: {
        today: todayUpdate || null,
        recent: recentUpdates,
        total: data.updates.length
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
