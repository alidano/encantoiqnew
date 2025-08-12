import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    // Test 1: Basic Supabase connection
    console.log('🔍 Testing Supabase connection...');
    
    // Test 2: Check if customers table exists and has data
    console.log('🔍 Testing customers table...');
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .select('customerid, firstname, lastname')
      .limit(5);
    
    if (customersError) {
      console.error('❌ Customers table error:', customersError);
      return NextResponse.json({
        success: false,
        error: 'Customers table error',
        details: customersError,
        timestamp: new Date().toISOString()
      });
    }
    
    // Test 3: Check specific patient ID 13
    console.log('🔍 Testing specific patient ID 13...');
    const { data: patient13Data, error: patient13Error } = await supabase
      .from('customers')
      .select('*')
      .eq('customerid', 13)
      .eq('deleted', 0)
      .single();
    
    if (patient13Error) {
      console.error('❌ Patient 13 error:', patient13Error);
    }
    
    // Test 4: Check table structure
    console.log('🔍 Checking table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('customers')
      .select('*')
      .limit(1);
    
    return NextResponse.json({
      success: true,
      message: 'Patient API test completed',
      tests: {
        connection: 'OK',
        customersTable: {
          exists: true,
          sampleData: customersData?.slice(0, 3) || [],
          totalCount: customersData?.length || 0
        },
        patient13: {
          found: !!patient13Data,
          data: patient13Data || null,
          error: patient13Error || null
        },
        tableStructure: {
          columns: tableInfo && tableInfo.length > 0 ? Object.keys(tableInfo[0]) : [],
          error: tableError || null
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('💥 Unexpected error in patient test:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
