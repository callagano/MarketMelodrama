import { NextRequest, NextResponse } from 'next/server';
import { supabase, TLDRData } from '@/lib/supabase';

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
      
      // Delete all data from Supabase
      const { error } = await supabase
        .from('tldr_data')
        .delete()
        .neq('id', 0); // Delete all rows
      
      if (error) {
        console.error('Error clearing data:', error);
        return NextResponse.json({ 
          status: 500,
          body: { 
            success: false,
            error: "Failed to clear data",
            details: error.message
          }
        }, { status: 500 });
      }
      
      console.log('All data cleared successfully from Supabase');
      
      return NextResponse.json({ 
        status: 200,
        body: { 
          success: true,
          message: "All data cleared successfully from Supabase",
          timestamp: new Date().toISOString(),
          totalUpdates: 0
        }
      });
    }
    
    // Validate required fields for structured data
    if (!body.title || !body.sentiment || !body.highlights || !body.big_picture) {
      console.log('Missing required fields. Available keys:', Object.keys(body));
      return NextResponse.json(
        { 
          status: 400,
          body: { 
            error: "Missing required fields: title, sentiment, highlights, big_picture",
            receivedKeys: Object.keys(body),
            requestBody: body
          }
        }, 
        { status: 400 }
      );
    }

    // Prepare data for Supabase
    const tldrData: TLDRData = {
      data: {
        title: body.title,
        sentiment: body.sentiment,
        highlights: body.highlights,
        big_picture: body.big_picture
      },
      source: 'activepieces'
    };

    // Insert data into Supabase
    const { data: insertedData, error } = await supabase
      .from('tldr_data')
      .insert([tldrData])
      .select();

    if (error) {
      console.error('Error inserting data into Supabase:', error);
      return NextResponse.json(
        { 
          status: 500,
          body: { 
            error: "Failed to save data to Supabase",
            details: error.message
          }
        }, 
        { status: 500 }
      );
    }

    console.log('Data successfully saved to Supabase:', insertedData);
    console.log('=== ActivePieces POST request completed successfully ===');

    return NextResponse.json({ 
      status: 200,
      body: { 
        success: true,
        message: "TLDR data saved to Supabase successfully",
        id: insertedData?.[0]?.id,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error processing ActivePieces TLDR update:', error);
    return NextResponse.json(
      { 
        status: 500,
        body: { error: "Failed to process TLDR update" }
      }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get the most recent TLDR data from Supabase
    const { data, error } = await supabase
      .from('tldr_data')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error reading data from Supabase:', error);
      return NextResponse.json(
        { 
          status: 500,
          body: { error: "Failed to read data from Supabase" }
        }, 
        { status: 500 }
      );
    }

    const latestData = data?.[0] || null;
    
    return NextResponse.json({
      status: 200,
      body: {
        today: latestData ? {
          text: JSON.stringify(latestData.data),
          date: latestData.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          source: latestData.source || 'activepieces',
          createdAt: latestData.created_at
        } : null,
        recent: data?.slice(1, 8) || [], // Get next 7 most recent
        total: data?.length || 0,
        persistence: {
          lastUpdated: latestData?.created_at ? new Date(latestData.created_at).getTime() : 0,
          minutesSinceLastUpdate: latestData?.created_at ? 
            Math.round((Date.now() - new Date(latestData.created_at).getTime()) / 1000 / 60) : 0,
          behavior: "Data persists permanently in Supabase database",
          storage: 'supabase',
          version: '4.0',
          retention: 'permanent',
          maxUpdates: 'unlimited'
        },
        deploymentInfo: {
          hasData: data && data.length > 0,
          message: !data || data.length === 0 ? 
            "No data available. Data will appear when ActivePieces sends the next update." :
            "Data is available in Supabase database. Data persists permanently."
        }
      }
    });
  } catch (error) {
    console.error('Error reading ActivePieces TLDR data:', error);
    return NextResponse.json(
      { 
        status: 500,
        body: { error: "Failed to read data" }
      }, 
      { status: 500 }
    );
  }
}