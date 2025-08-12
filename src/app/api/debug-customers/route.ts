import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    console.log('🔍 Quick debug for customer IDs...');
    
    // Get first 5 customers to see actual customerid values
    const { data: customers, error } = await supabase
      .from('customers')
      .select('customerid, firstname, lastname, deleted')
      .eq('deleted', 0)
      .limit(5);
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
    
    // Also check for specific IDs
    const { data: customer13, error: error13 } = await supabase
      .from('customers')
      .select('customerid, firstname, lastname')
      .eq('customerid', '13')
      .eq('deleted', 0)
      .maybeSingle();
    
    const { data: customer58, error: error58 } = await supabase
      .from('customers')
      .select('customerid, firstname, lastname')
      .eq('customerid', '58')
      .eq('deleted', 0)
      .maybeSingle();
    
    return NextResponse.json({
      success: true,
      data: {
        sampleCustomers: customers,
        customer13: { found: !!customer13, data: customer13, error: error13 },
        customer58: { found: !!customer58, data: customer58, error: error58 },
        customerTypes: customers?.map(c => ({
          id: c.customerid,
          type: typeof c.customerid,
          isNumeric: !isNaN(Number(c.customerid))
        }))
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
