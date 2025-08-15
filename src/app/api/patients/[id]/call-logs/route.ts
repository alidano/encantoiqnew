// src/app/api/patients/[id]/call-logs/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const customerId = params.id; // This is now a UUID string
  
  if (!customerId) {
    return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching call logs:', error);
      return NextResponse.json({ error: 'Failed to fetch call logs' }, { status: 500 });
    }

    // Transform the data to match expected format
    const callLogs = (data || []).map(log => ({
      ...log,
      id: log.id.toString(),
      created_at: log.created_at
    }));

    return NextResponse.json({ call_logs: callLogs });
  } catch (error) {
    console.error('Call logs API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = getAuth(request);
  const customerId = params.id; // This is now a UUID string

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  if (!customerId) {
    return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { 
      call_outcome, 
      call_notes, 
      call_duration, 
      follow_up_date, 
      priority_level 
    } = body;
    
    if (!call_outcome) {
      return NextResponse.json({ error: 'Call outcome is required' }, { status: 400 });
    }
    
    const callLogData = {
      customer_id: customerId,
      call_outcome,
      call_notes: call_notes || null,
      call_duration: call_duration || null,
      follow_up_date: follow_up_date || null,
      priority_level: priority_level || 'normal',
      user_id: userId,
    };
    
    const { data, error } = await supabase
      .from('call_logs')
      .insert([callLogData])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error adding call log:', error);
      return NextResponse.json({ error: 'Failed to add call log' }, { status: 500 });
    }
    
    // Transform the response to match expected format
    const callLog = {
      ...data,
      id: data.id.toString(),
      created_at: data.created_at
    };
    
    return NextResponse.json({ call_log: callLog }, { status: 201 });
    
  } catch (error) {
    console.error('Call logs API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
