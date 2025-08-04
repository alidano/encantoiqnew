// src/app/api/sms/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for server-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const phoneFilter = searchParams.get('phone');

    // Build the query to filter out entries with null important fields
    let query = supabase
      .from('sms')
      .select('*')
      .not('from', 'is', null)
      .not('to', 'is', null)
      .not('status', 'is', null)
      .order('created_at', { ascending: false });

    // Add phone number filter if provided
    if (phoneFilter) {
      const cleanPhone = phoneFilter.replace(/\D/g, '');
      query = query.or(`from.eq.${cleanPhone},to.eq.${cleanPhone}`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error fetching SMS logs:', error);
      return NextResponse.json({ error: 'Failed to fetch SMS logs' }, { status: 500 });
    }

    // Filter out any remaining entries that don't have meaningful data
    const smsLogs = (data || []).filter(log => 
      log.from && log.to && log.status
    ).map(log => ({
      ...log,
      id: log.id,
      created_at: log.created_at,
      from: log.from,
      to: log.to,
      status: log.status,
      sent_at: log.sent_at,
      error_message: log.error_message,
      message_text: log.message_text
    }));

    // Get total count for pagination (only entries with data)
    const { count: totalCount } = await supabase
      .from('sms')
      .select('*', { count: 'exact', head: true })
      .not('from', 'is', null)
      .not('to', 'is', null)
      .not('status', 'is', null);

    return NextResponse.json({ 
      sms_logs: smsLogs,
      total: smsLogs.length,
      totalCount: totalCount || 0,
      hasMore: (offset + limit) < (totalCount || 0)
    });

  } catch (error) {
    console.error('SMS API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}