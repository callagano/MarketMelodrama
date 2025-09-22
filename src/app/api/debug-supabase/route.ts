import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('=== Debug Supabase Query ===');
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('tldr_data')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('Supabase query error:', testError);
      return NextResponse.json({
        success: false,
        error: testError.message,
        details: testError,
        query: 'Basic select failed'
      }, { status: 500 });
    }

    console.log('Basic query successful, data:', testData);

    // Test with order by
    const { data: orderedData, error: orderError } = await supabase
      .from('tldr_data')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (orderError) {
      console.error('Order by query error:', orderError);
      return NextResponse.json({
        success: false,
        error: orderError.message,
        details: orderError,
        query: 'Order by query failed',
        basicQuery: testData
      }, { status: 500 });
    }

    console.log('Order by query successful, data:', orderedData);

    return NextResponse.json({
      success: true,
      message: 'All queries successful',
      basicQuery: testData,
      orderedQuery: orderedData,
      totalRecords: testData?.length || 0
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      success: false,
      error: 'Debug failed',
      details: error
    }, { status: 500 });
  }
}
