// src/app/api/call-outcome-types/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('call_outcome_types')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Supabase error fetching call outcome types:', error);
      // Return default options if database table doesn't exist yet
      const defaultOutcomes = [
        { id: 1, outcome_code: 'LICENSE_RENEWAL_INTERESTED', outcome_label: 'Interested in License Renewal', is_active: true, sort_order: 1 },
        { id: 2, outcome_code: 'LICENSE_RENEWAL_SCHEDULED', outcome_label: 'License Renewal Scheduled', is_active: true, sort_order: 2 },
        { id: 3, outcome_code: 'NOT_INTERESTED', outcome_label: 'Not Interested', is_active: true, sort_order: 3 },
        { id: 4, outcome_code: 'NO_ANSWER', outcome_label: 'No Answer', is_active: true, sort_order: 4 },
        { id: 5, outcome_code: 'CALLBACK_REQUESTED', outcome_label: 'Callback Requested', is_active: true, sort_order: 5 },
        { id: 6, outcome_code: 'VOICEMAIL_LEFT', outcome_label: 'Voicemail Left', is_active: true, sort_order: 6 },
        { id: 7, outcome_code: 'WRONG_NUMBER', outcome_label: 'Wrong Number', is_active: true, sort_order: 7 },
        { id: 8, outcome_code: 'DO_NOT_CALL', outcome_label: 'Do Not Call', is_active: true, sort_order: 8 },
        { id: 9, outcome_code: 'FOLLOW_UP_NEEDED', outcome_label: 'Follow-up Needed', is_active: true, sort_order: 9 },
        { id: 10, outcome_code: 'COMPLETED_RENEWAL', outcome_label: 'Completed Renewal', is_active: true, sort_order: 10 },
        { id: 11, outcome_code: 'OTHER', outcome_label: 'Other', is_active: true, sort_order: 99 }
      ];
      
      return NextResponse.json({ outcome_types: defaultOutcomes });
    }

    return NextResponse.json({ outcome_types: data || [] });
  } catch (error) {
    console.error('Call outcome types API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}