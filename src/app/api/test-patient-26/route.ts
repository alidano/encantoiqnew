import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    console.log('🔍 Testing patient ID 26...');
    
    // Test 1: Check if patient with customerid = 26 exists
    const { data: patient26ByCustomerId, error: error1 } = await supabase
      .from('customers')
      .select('*')
      .eq('customerid', 26)
      .eq('deleted', 0)
      .single();
    
    // Test 2: Check if patient with customerid = "26" exists (as string)
    const { data: patient26ByCustomerIdString, error: error2 } = await supabase
      .from('customers')
      .select('*')
      .eq('customerid', '26')
      .eq('deleted', 0)
      .single();
    
    // Test 3: Get a few sample records to see what customerid values exist
    const { data: sampleRecords, error: error3 } = await supabase
      .from('customers')
      .select('customerid, firstname, lastname, deleted')
      .limit(10);
    
    // Test 4: Check if there are any customers with numeric customerid
    const { data: numericCustomerIds, error: error4 } = await supabase
      .from('customers')
      .select('customerid, firstname, lastname')
      .eq('deleted', 0)
      .not('customerid', 'like', '%[a-zA-Z]%') // Only numeric customerids
      .limit(10);
    
    return NextResponse.json({
      success: true,
      message: 'Patient ID 26 diagnostic completed',
      tests: {
        patient26ByCustomerId: {
          found: !!patient26ByCustomerId,
          data: patient26ByCustomerId || null,
          error: error1 || null
        },
        patient26ByCustomerIdString: {
          found: !!patient26ByCustomerIdString,
          data: patient26ByCustomerIdString || null,
          error: error2 || null
        },
        sampleRecords: {
          data: sampleRecords || [],
          error: error3 || null
        },
        numericCustomerIds: {
          data: numericCustomerIds || [],
          error: error4 || null
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('💥 Unexpected error in patient 26 test:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
