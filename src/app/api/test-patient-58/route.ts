import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    console.log('🔍 Testing patient ID 58...');
    
    // Test 1: Check if patient with customerid = 58 exists
    const { data: patient58ByCustomerId, error: error1 } = await supabase
      .from('customers')
      .select('*')
      .eq('customerid', 58)
      .eq('deleted', 0)
      .single();
    
    // Test 2: Check if patient with id = 58 exists (maybe the table has an 'id' field)
    const { data: patient58ById, error: error2 } = await supabase
      .from('customers')
      .select('*')
      .eq('id', 58)
      .eq('deleted', 0)
      .single();
    
    // Test 3: Get a few sample records to see the structure
    const { data: sampleRecords, error: error3 } = await supabase
      .from('customers')
      .select('customerid, id, firstname, lastname, deleted')
      .limit(5);
    
    // Test 4: Check what fields exist in the customers table
    const { data: tableStructure, error: error4 } = await supabase
      .from('customers')
      .select('*')
      .limit(1);
    
    return NextResponse.json({
      success: true,
      message: 'Patient ID 58 diagnostic completed',
      tests: {
        patient58ByCustomerId: {
          found: !!patient58ByCustomerId,
          data: patient58ByCustomerId || null,
          error: error1 || null
        },
        patient58ById: {
          found: !!patient58ById,
          data: patient58ById || null,
          error: error2 || null
        },
        sampleRecords: {
          data: sampleRecords || [],
          error: error3 || null
        },
        tableStructure: {
          columns: tableStructure && tableStructure.length > 0 ? Object.keys(tableStructure[0]) : [],
          error: error4 || null
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('💥 Unexpected error in patient 58 test:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
