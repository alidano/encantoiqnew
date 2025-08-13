/**
 * WATI Get Contacts API Route - Direct API Call
 * File Path: src/app/api/wati/get-contacts/route.ts
 * 
 * This API route fetches contacts/conversations directly from WATI API
 * GET /api/wati/get-contacts
 */

import { NextRequest, NextResponse } from 'next/server';

const WATI_API_ENDPOINT = process.env.WATI_API_ENDPOINT;
const WATI_AUTH_TOKEN = process.env.WATI_AUTH_TOKEN;

export async function GET(request: NextRequest) {
  try {
    // Check if WATI credentials are available
    if (!WATI_API_ENDPOINT || !WATI_AUTH_TOKEN) {
      console.error('[WATI API] WATI credentials not configured');
      return NextResponse.json(
        { 
          success: false, 
          error: 'WATI API not configured properly' 
        },
        { status: 500 }
      );
    }

    console.log('[WATI API] Fetching contacts from WATI...');
    console.log('[WATI API] Using endpoint:', WATI_API_ENDPOINT);
    console.log('[WATI API] Using token:', WATI_AUTH_TOKEN ? 'Present' : 'Missing');

    // Make request to WATI API
    const watiUrl = `${WATI_API_ENDPOINT}/api/v1/getContacts`;
    console.log('[WATI API] Full URL:', watiUrl);

    const response = await fetch(watiUrl, {
      method: 'GET',
      headers: {
        'Authorization': WATI_AUTH_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    console.log('[WATI API] Response status:', response.status);
    console.log('[WATI API] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[WATI API] Failed to fetch contacts: ${response.status}`, errorData);
      
      return NextResponse.json(
        { 
          success: false, 
          error: `WATI API error: ${response.statusText}`,
          details: errorData,
          status: response.status
        },
        { status: response.status }
      );
    }

    const responseData = await response.json();
    console.log('[WATI API] Raw response from WATI:', JSON.stringify(responseData, null, 2));
    console.log(`[WATI API] Response data keys:`, Object.keys(responseData));
    
    // WATI returns contacts in 'contact_list', not 'users'
    const contacts = responseData?.data?.contact_list || responseData?.contact_list || [];
    
    if (contacts.length > 0) {
      console.log(`[WATI API] Found ${contacts.length} contacts in response`);
      console.log('[WATI API] First contact sample:', contacts[0]);
    } else {
      console.log('[WATI API] No contacts array found in response');
    }

    // Transform WATI contacts to our conversation format
    const conversations = contacts.map((contact: any, index: number) => ({
      conversation_id: `wati-${contact.id || index}`,
      uid: contact.id || `wati-contact-${index}`,
      sender_number: contact.phone || contact.wAid,
      recipient_number: '+17879914145', // Your WATI number
      contact_name: contact.fullName || contact.firstName || contact.phone || 'Unknown Contact',
      status: 'active', // All WATI contacts are active
      sending_server_id: 2, // WATI
      created_at: contact.created || new Date().toISOString(),
      updated_at: contact.lastUpdated || contact.created || new Date().toISOString(),
      last_message_content: null, // We'll get this from messages API
      last_message_timestamp: contact.lastUpdated || null,
      // WATI specific fields
      wati_contact_id: contact.id,
      wati_tenant_id: contact.tenantId,
      wati_wa_id: contact.wAid,
      wati_first_name: contact.firstName,
      wati_full_name: contact.fullName,
      wati_source: contact.source,
      wati_contact_status: contact.contactStatus,
      wati_opted_in: contact.optedIn,
      wati_custom_params: contact.customParams || []
    }));

    console.log('[WATI API] Transformed conversations:', conversations.length);
    if (conversations.length > 0) {
      console.log('[WATI API] First conversation sample:', conversations[0]);
    }

    return NextResponse.json({
      success: true,
      data: conversations,
      count: conversations.length,
      raw: responseData // Include raw response for debugging
    });

  } catch (error) {
    console.error('[WATI API] Error in get-contacts route:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error while fetching contacts' 
      },
      { status: 500 }
    );
  }
}