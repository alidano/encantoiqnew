import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// API specifically designed for n8n automation workflow
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const daysAhead = parseInt(searchParams.get('days') || '30'); // Default 30 days for n8n
    const urgencyLevel = searchParams.get('urgency') || 'all'; // all, critical, high, medium
    const limit = parseInt(searchParams.get('limit') || '100'); // Limit for n8n processing
    
    console.log(`📱 n8n SMS workflow requesting expiring licenses - Days: ${daysAhead}, Urgency: ${urgencyLevel}`);
    
    // Get customers with expiring licenses from customers table
    const { data: customers, error } = await supabase
      .from('customers')
      .select(`
        customerid,
        firstname,
        lastname,
        cell,
        phone,
        email,
        redcard,
        redcardyear,
        redcardmonth,
        redcardday,
        location,
        locations!inner(name)
      `)
      .eq('deleted', 0)
      .not('redcardyear', 'is', null)
      .not('redcardmonth', 'is', null)
      .limit(limit);
    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        n8n_friendly: true 
      });
    }
    
    if (!customers || customers.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data: [], 
        message: 'No customers found with license expiration data',
        n8n_friendly: true
      });
    }
    
    // Calculate expiration dates and prepare SMS data
    const today = new Date();
    
    const smsTargets = customers.map(customer => {
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
        
        const daysToExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Only include if within the specified timeframe
        if (daysToExpiration >= 0 && daysToExpiration <= daysAhead) {
          const urgency = daysToExpiration <= 7 ? 'critical' : 
                         daysToExpiration <= 30 ? 'high' : 'medium';
          
          return {
            // Core customer data for n8n
            customer_id: customer.customerid,
            first_name: customer.firstname,
            last_name: customer.lastname,
            full_name: `${customer.firstname} ${customer.lastname}`,
            
            // Contact information
            primary_phone: customer.cell || customer.phone,
            backup_phone: customer.cell ? customer.phone : null,
            email: customer.email,
            
            // License information
            license_number: customer.redcard,
            expiration_date: expirationDate.toISOString().split('T')[0],
            days_to_expiration: daysToExpiration,
            urgency_level: urgency,
            
            // Location info
            location_name: customer.locations?.name || 'Unknown Location',
            
            // SMS specific data for n8n
            sms_ready: !!(customer.cell || customer.phone),
            sms_message_template: daysToExpiration <= 7 
              ? `🚨 URGENT: ${customer.firstname}, your medical license ${customer.redcard} expires in ${daysToExpiration} days! Contact us immediately to renew.`
              : `Hi ${customer.firstname}, your medical license ${customer.redcard} expires in ${daysToExpiration} days. Schedule your renewal today to avoid interruption.`,
            
            // n8n workflow data
            workflow_priority: daysToExpiration <= 7 ? 1 : daysToExpiration <= 15 ? 2 : 3,
            should_send_sms: true,
            follow_up_days: daysToExpiration <= 7 ? 1 : 3
          };
        }
      }
      
      return null;
    }).filter(target => {
      if (!target) return false;
      
      // Filter by urgency level if specified
      if (urgencyLevel !== 'all') {
        return target.urgency_level === urgencyLevel;
      }
      
      return target.sms_ready; // Only include customers with phone numbers
    }).sort((a, b) => a.days_to_expiration - b.days_to_expiration); // Most urgent first
    
    return NextResponse.json({
      success: true,
      n8n_friendly: true,
      data: smsTargets,
      metadata: {
        total_sms_targets: smsTargets.length,
        days_ahead: daysAhead,
        urgency_filter: urgencyLevel,
        generated_at: new Date().toISOString(),
        workflow_ready: true,
        urgency_breakdown: {
          critical: smsTargets.filter(t => t.urgency_level === 'critical').length,
          high: smsTargets.filter(t => t.urgency_level === 'high').length,
          medium: smsTargets.filter(t => t.urgency_level === 'medium').length
        }
      }
    });
    
  } catch (error) {
    console.error('💥 Error in n8n SMS workflow API:', error);
    return NextResponse.json({
      success: false,
      n8n_friendly: true,
      error: error instanceof Error ? error.message : 'Unknown error',
      workflow_ready: false
    });
  }
}

// POST endpoint to log SMS sent status back from n8n
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer_id, sms_status, sent_at, message_content, provider_response } = body;
    
    // Log the SMS send attempt to a tracking table (you may want to create this)
    console.log(`📱 SMS Status from n8n: Customer ${customer_id} - Status: ${sms_status}`);
    
    // You can store this in a sms_logs table or update customer records
    const logData = {
      customer_id,
      sms_status,
      sent_at: sent_at || new Date().toISOString(),
      message_content,
      provider_response,
      source: 'n8n_workflow'
    };
    
    // Optional: Store in SMS logs table
    // const { error } = await supabase
    //   .from('sms_logs')
    //   .insert([logData]);
    
    return NextResponse.json({
      success: true,
      message: 'SMS status logged successfully',
      logged_data: logData
    });
    
  } catch (error) {
    console.error('💥 Error logging SMS status:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
