import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const daysAhead = parseInt(searchParams.get('days') || '60'); // Default 60 days
    const format = searchParams.get('format') || 'json'; // json or csv
    const includeExpired = searchParams.get('include_expired') === 'true';
    
    console.log(`🔍 Fetching expiring licenses - Days ahead: ${daysAhead}, Include expired: ${includeExpired}`);
    
    // Get customers with expiring licenses
    const { data: customers, error } = await supabase
      .from('customers')
      .select(`
        customerid,
        firstname,
        lastname,
        email,
        cell,
        phone,
        redcard,
        redcardyear,
        redcardmonth,
        redcardday,
        location,
        locations!inner(name)
      `)
      .eq('deleted', 0)
      .not('redcardyear', 'is', null)
      .not('redcardmonth', 'is', null);
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message });
    }
    
    if (!customers || customers.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data: [], 
        message: 'No customers found with license expiration data' 
      });
    }
    
    // Calculate expiration dates and filter by days ahead
    const today = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(today.getDate() + daysAhead);
    
    const expiringCustomers = customers.filter(customer => {
      const year = parseInt(customer.redcardyear);
      const month = parseInt(customer.redcardmonth);
      const day = customer.redcardday ? parseInt(customer.redcardday) : null;
      
      if (year > 1900 && month >= 1 && month <= 12) {
        let expirationDate: Date;
        
        if (day && day >= 1 && day <= 31) {
          expirationDate = new Date(year, month - 1, day);
        } else {
          // Use last day of the month if no specific day
          expirationDate = new Date(year, month - 1, 1);
          expirationDate.setMonth(expirationDate.getMonth() + 1);
          expirationDate.setDate(expirationDate.getDate() - 1);
        }
        
        // Calculate days to expiration
        const daysToExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Add calculated fields to customer object
        customer.license_exp_date = expirationDate.toISOString().split('T')[0];
        customer.days_to_expiration = daysToExpiration;
        customer.location_name = customer.locations?.name || 'Unknown Location';
        
        // Filter logic
        if (includeExpired) {
          return daysToExpiration <= daysAhead; // Include expired (negative days) up to future days
        } else {
          return daysToExpiration >= 0 && daysToExpiration <= daysAhead; // Only non-expired within range
        }
      }
      
      return false;
    }).map(customer => ({
      // Clean up the response - remove the nested locations object
      customerid: customer.customerid,
      firstname: customer.firstname,
      lastname: customer.lastname,
      email: customer.email,
      cell: customer.cell,
      phone: customer.phone,
      redcard: customer.redcard,
      license_exp_date: customer.license_exp_date,
      days_to_expiration: customer.days_to_expiration,
      location_name: customer.location_name,
      sms_contact: customer.cell || customer.phone, // Primary SMS contact
      email_contact: customer.email,
      renewal_urgency: customer.days_to_expiration <= 0 ? 'EXPIRED' : 
                      customer.days_to_expiration <= 7 ? 'CRITICAL' :
                      customer.days_to_expiration <= 30 ? 'HIGH' :
                      customer.days_to_expiration <= 60 ? 'MEDIUM' : 'LOW'
    })).sort((a, b) => a.days_to_expiration - b.days_to_expiration); // Sort by most urgent first
    
    // Format response based on requested format
    if (format === 'csv') {
      const csvHeaders = 'customerid,firstname,lastname,email,cell,redcard,license_exp_date,days_to_expiration,location_name,renewal_urgency\\n';
      const csvData = expiringCustomers.map(c => 
        `${c.customerid},\"${c.firstname}\",\"${c.lastname}\",\"${c.email || ''}\",\"${c.cell || ''}\",\"${c.redcard}\",\"${c.license_exp_date}\",${c.days_to_expiration},\"${c.location_name}\",\"${c.renewal_urgency}\"`
      ).join('\\n');
      
      return new Response(csvHeaders + csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=\"expiring_licenses_${daysAhead}days.csv\"`
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      data: expiringCustomers,
      metadata: {
        total_found: expiringCustomers.length,
        days_ahead: daysAhead,
        include_expired: includeExpired,
        generated_at: new Date().toISOString(),
        urgency_breakdown: {
          expired: expiringCustomers.filter(c => c.renewal_urgency === 'EXPIRED').length,
          critical: expiringCustomers.filter(c => c.renewal_urgency === 'CRITICAL').length,
          high: expiringCustomers.filter(c => c.renewal_urgency === 'HIGH').length,
          medium: expiringCustomers.filter(c => c.renewal_urgency === 'MEDIUM').length,
          low: expiringCustomers.filter(c => c.renewal_urgency === 'LOW').length
        }
      }
    });
    
  } catch (error) {
    console.error('💥 Error in expiring licenses API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
