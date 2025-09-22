import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('=== Simple Supabase Test ===');
    
    // Test with minimal query
    const { data, error } = await supabase
      .from('tldr_data')
      .select('id, created_at')
      .limit(1);

    console.log('Simple query result:', { data, error });

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error
      });
    }

    return NextResponse.json({
      success: true,
      data: data,
      count: data?.length || 0
    });

  } catch (error) {
    console.error('Simple test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error
    });
  }
}
