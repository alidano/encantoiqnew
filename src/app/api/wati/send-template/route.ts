/**
 * WATI Send Template Message API Route - Server-Side
 * File Path: src/app/api/wati/send-template/route.ts
 * 
 * This API route handles sending template messages via WATI API from the server-side.
 * 
 * POST /api/wati/send-template
 * Body: { whatsappNumber: string, templateName: string, parameters?: string[] }
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
    const { whatsappNumber, templateName, parameters = [] } = await request.json();

    // Validate input
    if (!whatsappNumber || !templateName) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'WhatsApp number and template name are required' 
        },
        { status: 400 }
      );
    }

    // Clean phone number (remove any formatting)
    const cleanPhoneNumber = whatsappNumber.replace(/\D/g, '');

    console.log(`[WATI API] Sending template '${templateName}' to ${cleanPhoneNumber}`);

    // Make request to WATI API
    const response = await fetch(`${WATI_API_ENDPOINT}/api/v1/sendTemplateMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': WATI_AUTH_TOKEN,
      },
      body: JSON.stringify({
        whatsappNumber: cleanPhoneNumber,
        templateName: templateName,
        parameters: parameters
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`[WATI API] Failed to send template: ${response.status}`, errorData);
      
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
    console.log('[WATI API] Template sent successfully:', responseData);

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('[WATI API] Error in send-template route:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error while sending template' 
      },
      { status: 500 }
    );
  }
}