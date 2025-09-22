import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test connection by getting table info
    const { data, error } = await supabase
      .from('tldr_data')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Supabase connection error:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 });
    }

    console.log('Supabase connection successful!');
    
    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful!',
      timestamp: new Date().toISOString(),
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sxxrayfrdqfmzgekpzga.supabase.co'
    });

  } catch (error) {
    console.error('Test connection error:', error);
    return NextResponse.json({
      success: false,
      error: 'Connection test failed',
      details: error
    }, { status: 500 });
  }
}
