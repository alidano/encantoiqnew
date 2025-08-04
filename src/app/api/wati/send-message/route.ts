/**
 * WATI Send Message API Route - Server-Side
 * File Path: src/app/api/wati/send-message/route.ts
 * 
 * This API route handles sending messages via WATI API from the server-side.
 * It has access to environment variables and keeps WATI credentials secure.
 * 
 * POST /api/wati/send-message
 * Body: { whatsappNumber: string, messageText: string }
 */

import { NextRequest, NextResponse } from 'next/server';

const WATI_API_ENDPOINT = process.env.WATI_API_ENDPOINT;
const WATI_AUTH_TOKEN = process.env.WATI_AUTH_TOKEN;

export async function POST(request: NextRequest) {
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

    // Parse request body
    const { whatsappNumber, messageText } = await request.json();

    // Validate input
    if (!whatsappNumber || !messageText) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'WhatsApp number and message text are required' 
        },
        { status: 400 }
      );
    }

    // Clean phone number (remove any formatting)
    const cleanPhoneNumber = whatsappNumber.replace(/\D/g, '');

    console.log(`[WATI API] Sending message to ${cleanPhoneNumber}`);

    // Make request to WATI API
    const response = await fetch(`${WATI_API_ENDPOINT}/api/v1/sendSessionMessage/${cleanPhoneNumber}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': WATI_AUTH_TOKEN, // Already includes "Bearer " prefix
      },
      body: JSON.stringify({
        messageText: messageText
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`[WATI API] Failed to send message: ${response.status}`, errorData);
      
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
    console.log('[WATI API] Message sent successfully:', responseData);

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('[WATI API] Error in send-message route:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error while sending message' 
      },
      { status: 500 }
    );
  }
}