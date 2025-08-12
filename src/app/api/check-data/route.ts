import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    console.log('🔍 Checking customer data structure...');
    
    // Get 5 sample customers to see actual customerid values
    const { data: sampleCustomers, error: sampleError } = await supabase
      .from('customers')
      .select('customerid, firstname, lastname, redcard, redcardyear, redcardmonth, redcardday, deleted')
      .eq('deleted', 0)
      .limit(5);
    
    if (sampleError) {
      return NextResponse.json({ success: false, error: sampleError });
    }
    
    // Check for customers with expiring licenses (next 60 days)
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    const { data: expiringCustomers, error: expiringError } = await supabase
      .from('customers')
      .select('customerid, firstname, lastname, redcard, redcardyear, redcardmonth, cell, email')
      .eq('deleted', 0)
      .not('redcardyear', 'is', null)
      .not('redcardmonth', 'is', null)
      .limit(10);
    
    if (expiringError) {
      return NextResponse.json({ success: false, error: expiringError });
    }
    
    // Get call logs structure
    const { data: callLogsSchema, error: callLogsError } = await supabase
      .from('call_logs')
      .select('*')
      .limit(3);
    
    return NextResponse.json({
      success: true,
      data: {
        sampleCustomers: sampleCustomers || [],
        expiringCustomers: expiringCustomers || [],
        callLogsExample: callLogsSchema || [],
        totalSampleCustomers: sampleCustomers?.length || 0,
        totalExpiringCustomers: expiringCustomers?.length || 0
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
