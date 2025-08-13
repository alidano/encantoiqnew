/**
 * WATI Test API Route - Debug endpoint
 * File Path: src/app/api/wati/test/route.ts
 * 
 * GET /api/wati/test - Test WATI API connection
 */

import { NextRequest, NextResponse } from 'next/server';

const WATI_API_ENDPOINT = process.env.WATI_API_ENDPOINT;
const WATI_AUTH_TOKEN = process.env.WATI_AUTH_TOKEN;

export async function GET(request: NextRequest) {
  try {
    console.log('[WATI Test] Testing WATI API connection...');
    
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

    console.log('[WATI Test] Credentials found, testing API call...');
    
    // Test the API call
    const watiUrl = `${WATI_API_ENDPOINT}/api/v1/getContacts`;
    console.log('[WATI Test] URL:', watiUrl);
    
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
      credentials: {
        endpoint: WATI_API_ENDPOINT,
        tokenPrefix: WATI_AUTH_TOKEN?.substring(0, 20) + '...'
      }
    });

  } catch (error) {
    console.error('[WATI Test] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}