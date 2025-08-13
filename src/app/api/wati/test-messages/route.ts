/**
 * WATI Test Messages API Route - Debug endpoint
 * File Path: src/app/api/wati/test-messages/route.ts
 * 
 * GET /api/wati/test-messages?whatsappNumber=17879347577 - Test WATI messages API
 */

import { NextRequest, NextResponse } from 'next/server';

const WATI_API_ENDPOINT = process.env.WATI_API_ENDPOINT;
const WATI_AUTH_TOKEN = process.env.WATI_AUTH_TOKEN;

export async function GET(request: NextRequest) {
  try {
    console.log('[WATI Test Messages] Testing WATI messages API...');
    
    // Check credentials
    if (!WATI_API_ENDPOINT || !WATI_AUTH_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'WATI credentials not configured',
        env: {
          endpoint: WATI_API_ENDPOINT ? 'Present' : 'Missing',
          token: WATI_AUTH_TOKEN ? 'Present' : 'Missing'
        }
      });
    }

    // Get phone number from query
    const { searchParams } = new URL(request.url);
    const whatsappNumber = searchParams.get('whatsappNumber') || '17879347577'; // Default to first contact
    const cleanPhoneNumber = whatsappNumber.replace(/\D/g, '');

    console.log(`[WATI Test Messages] Testing with number: ${cleanPhoneNumber}`);
    
    // Test the messages API call
    const watiUrl = `${WATI_API_ENDPOINT}/api/v1/getMessages/${cleanPhoneNumber}`;
    console.log('[WATI Test Messages] URL:', watiUrl);
    
    const response = await fetch(watiUrl, {
      method: 'GET',
      headers: {
        'Authorization': WATI_AUTH_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = responseText;
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
      url: watiUrl,
      phoneNumber: cleanPhoneNumber,
      rawResponse: responseText
    });

  } catch (error) {
    console.error('[WATI Test Messages] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}