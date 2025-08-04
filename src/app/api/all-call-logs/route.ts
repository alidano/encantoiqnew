// src/app/api/call-logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('call_logs')
      .select(`
        *,
        patient:patients (
          firstname,
          lastname
        ),
        user:users (
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching all call logs:', error);
      return NextResponse.json({ error: 'Failed to fetch call logs' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Call logs API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
