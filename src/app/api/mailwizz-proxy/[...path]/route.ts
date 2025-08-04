// src/app/api/mailwizz-proxy/[...path]/route.ts

import { NextRequest } from 'next/server';

const MAILWIZZ_CONFIG = {
  baseUrl: process.env.MAILWIZZ_API_URL || 'https://inbi.bicomm.app/api/index.php',
  publicKey: process.env.MAILWIZZ_API_KEY || '994b4737c089504cba4861b569f4f92cb3f58ab9'
};

// For Firebase hosting, ensure environment variables are loaded
if (!MAILWIZZ_CONFIG.publicKey || MAILWIZZ_CONFIG.publicKey === '994b4737c089504cba4861b569f4f92cb3f58ab9') {
  console.warn('Using default MailWizz API key. Make sure MAILWIZZ_API_KEY is set in production.');
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const url = new URL(request.url);
    const mailwizzPath = `/${params.path.join('/')}`;
    
    // Special handling for email search endpoints
    if (mailwizzPath.includes('search-by-email')) {
      const email = url.searchParams.get('email') || url.searchParams.get('EMAIL');
      console.log('Email search request for:', email);
      
      if (!email) {
        return Response.json(
          { error: 'EMAIL parameter is required' },
          { status: 400 }
        );
      }
      
      // For email search, construct the URL with uppercase EMAIL parameter
      const searchUrl = `${MAILWIZZ_CONFIG.baseUrl}${mailwizzPath}`;
      const finalUrl = `${searchUrl}?EMAIL=${email}`;
      
      console.log('Final MailWizz URL:', finalUrl);
      
      const response = await fetch(finalUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-MW-PUBLIC-KEY': MAILWIZZ_CONFIG.publicKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('MailWizz API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          requestUrl: finalUrl
        });
        
        return Response.json(
          { 
            error: `MailWizz API error: ${response.status} - ${response.statusText}`, 
            details: errorText,
            requestUrl: finalUrl
          },
          { status: response.status }
        );
      }

      const data = await response.json();
      return Response.json(data);
    }
    
    // Regular handling for other endpoints
    const searchParams = new URLSearchParams();
    url.searchParams.forEach((value, key) => {
      searchParams.append(key, value);
    });
    
    const queryString = searchParams.toString();
    const fullPath = queryString ? `${mailwizzPath}?${queryString}` : mailwizzPath;
    const mailwizzUrl = `${MAILWIZZ_CONFIG.baseUrl}${fullPath}`;

    console.log('Proxying GET request to:', mailwizzUrl);

    const response = await fetch(mailwizzUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-MW-PUBLIC-KEY': MAILWIZZ_CONFIG.publicKey
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MailWizz API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        requestUrl: mailwizzUrl
      });
      
      return Response.json(
        { 
          error: `MailWizz API error: ${response.status} - ${response.statusText}`, 
          details: errorText,
          requestUrl: mailwizzUrl
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    return Response.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const body = await request.json();
    const mailwizzPath = `/${params.path.join('/')}`;
    const mailwizzUrl = `${MAILWIZZ_CONFIG.baseUrl}${mailwizzPath}`;

    console.log('Proxying POST request to:', mailwizzUrl);

    const response = await fetch(mailwizzUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-MW-PUBLIC-KEY': MAILWIZZ_CONFIG.publicKey
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MailWizz API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      return Response.json(
        { 
          error: `MailWizz API error: ${response.status} - ${response.statusText}`, 
          details: errorText 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    return Response.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const body = await request.json();
    const mailwizzPath = `/${params.path.join('/')}`;
    const mailwizzUrl = `${MAILWIZZ_CONFIG.baseUrl}${mailwizzPath}`;

    console.log('Proxying PUT request to:', mailwizzUrl);

    const response = await fetch(mailwizzUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-MW-PUBLIC-KEY': MAILWIZZ_CONFIG.publicKey
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MailWizz API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      return Response.json(
        { 
          error: `MailWizz API error: ${response.status} - ${response.statusText}`, 
          details: errorText 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    return Response.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const mailwizzPath = `/${params.path.join('/')}`;
    const mailwizzUrl = `${MAILWIZZ_CONFIG.baseUrl}${mailwizzPath}`;

    console.log('Proxying DELETE request to:', mailwizzUrl);

    const response = await fetch(mailwizzUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-MW-PUBLIC-KEY': MAILWIZZ_CONFIG.publicKey
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MailWizz API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      return Response.json(
        { 
          error: `MailWizz API error: ${response.status} - ${response.statusText}`, 
          details: errorText 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    return Response.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}