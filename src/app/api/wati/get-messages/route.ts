/**
 * WATI Get Messages API Route - Direct API Call
 * File Path: src/app/api/wati/get-messages/route.ts
 * 
 * This API route fetches messages for a specific WhatsApp number from WATI API
 * GET /api/wati/get-messages?whatsappNumber=1234567890
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

    // Get whatsappNumber from query parameters
    const { searchParams } = new URL(request.url);
    const whatsappNumber = searchParams.get('whatsappNumber');

    if (!whatsappNumber) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'WhatsApp number is required' 
        },
        { status: 400 }
      );
    }

    // Clean phone number (remove any formatting)
    const cleanPhoneNumber = whatsappNumber.replace(/\D/g, '');

    console.log(`[WATI API] Fetching messages for ${cleanPhoneNumber}...`);

    // Make request to WATI API
    const response = await fetch(`${WATI_API_ENDPOINT}/api/v1/getMessages/${cleanPhoneNumber}`, {
      method: 'GET',
      headers: {
        'Authorization': WATI_AUTH_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[WATI API] Failed to fetch messages: ${response.status}`, errorData);
      
      return NextResponse.json(
        { 
          success: false, 
          error: `WATI API error: ${response.statusText}`,
          details: errorData
        },
        { status: response.status }
      );
    }

    const responseData = await response.json();
    console.log('[WATI API] Raw response for messages:', JSON.stringify(responseData, null, 2));
    console.log('[WATI API] Response keys:', Object.keys(responseData));
    console.log(`[WATI API] Looking for messages in responseData:`, {
      messages: responseData?.messages,
      data: responseData?.data,
      result: responseData?.result
    });

    // Check different possible structures for messages
    let messagesList = [];
    if (responseData?.messages?.items) {
      // WATI returns messages in responseData.messages.items
      messagesList = responseData.messages.items.filter((item: any) => item.eventType === 'message');
    } else if (responseData?.messages) {
      messagesList = Array.isArray(responseData.messages) ? responseData.messages : [];
    } else if (responseData?.data?.messages) {
      messagesList = responseData.data.messages;
    } else if (responseData?.data) {
      messagesList = responseData.data;
    } else if (Array.isArray(responseData)) {
      messagesList = responseData;
    }
    
    console.log(`[WATI API] Found ${messagesList?.length || 0} messages. Type:`, typeof messagesList, 'IsArray:', Array.isArray(messagesList));
    
    if (messagesList?.length > 0) {
      console.log('[WATI API] First message sample:', messagesList[0]);
    }

    // Transform WATI messages to our message format
    const messages = messagesList.map((message: any, index: number) => ({
      message_id: `wati-msg-${message.id || index}`,
      conversation_id: `wati-${cleanPhoneNumber}`,
      message: message.text || message.caption || '[Media Message]',
      media_url: message.data || null,
      direction: message.owner ? 'from' : 'to', // owner = true means sent by us ('from'), false = received ('to')
      sending_server_id: 2, // WATI
      timestamp: message.created || new Date().toISOString(),
      updated_at: message.created || new Date().toISOString(),
      message_status: message.statusString?.toLowerCase() || 'delivered',
      sms_type: message.type || 'text',
      // WATI specific fields
      wati_message_id: message.id,
      wati_message_type: message.type,
      wati_status: message.statusString,
      wati_owner: message.owner,
      wati_operator_name: message.operatorName,
      wati_timestamp: message.timestamp,
      wati_conversation_id: message.conversationId,
      wati_ticket_id: message.ticketId
    }));

    // Sort messages by timestamp (oldest first, newest last) for proper chat order
    messages.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeA - timeB; // Ascending order (oldest first)
    });

    return NextResponse.json({
      success: true,
      data: messages,
      count: messages.length,
      whatsappNumber: cleanPhoneNumber
    });

  } catch (error) {
    console.error('[WATI API] Error in get-messages route:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error while fetching messages' 
      },
      { status: 500 }
    );
  }
}