
import { type NextRequest, NextResponse } from 'next/server';
import Telnyx from 'telnyx';

export async function POST(request: NextRequest) {
  const telnyxApiKey = process.env.TELNYX_API_KEY;
  const telnyxApplicationId = process.env.TELNYX_APPLICATION_ID; // This should be your Connection ID or Outbound Voice Profile ID
  const telnyxFromNumber = process.env.TELNYX_FROM_NUMBER;
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL;

  let missingVars = [];
  if (!telnyxApiKey) missingVars.push('TELNYX_API_KEY');
  if (!telnyxApplicationId) missingVars.push('TELNYX_APPLICATION_ID');
  if (!telnyxFromNumber) missingVars.push('TELNYX_FROM_NUMBER');
  if (!appBaseUrl) missingVars.push('NEXT_PUBLIC_APP_BASE_URL');


  if (missingVars.length > 0) {
    const errorMessage = `Server configuration error: Missing ${missingVars.join(', ')}.`;
    console.error(`[Telnyx Make Call] ${errorMessage}`);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }

  try {
    const { toNumber } = await request.json();

    if (!toNumber || typeof toNumber !== 'string') {
      const errorMessage = 'Missing or invalid "toNumber" parameter.';
      console.error('[Telnyx Make Call] Missing or invalid "toNumber" parameter in request body.');
      return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
    }

    const formattedToNumber = toNumber.startsWith('+') ? toNumber : `+${toNumber.replace(/\D/g, '')}`;
    const formattedFromNumber = telnyxFromNumber.startsWith('+') ? telnyxFromNumber : `+${telnyxFromNumber.replace(/\D/g, '')}`;

    const callPayload = {
      to: formattedToNumber,
      from: formattedFromNumber,
      connection_id: telnyxApplicationId,
      webhook_url: `${appBaseUrl}/api/telnyx/voice/events`,
      webhook_url_method: 'POST'
    };

    console.log(`[Telnyx Make Call] Initiating call with payload:`, JSON.stringify(callPayload, null, 2));

    // Ensure Telnyx is initialized with the API key
    const telnyx = new Telnyx(telnyxApiKey);

    const call = await telnyx.calls.create(callPayload);

    console.log('[Telnyx Make Call] Call initiated successfully. Call Control ID:', call.data.call_control_id);

    return NextResponse.json({ success: true, message: 'Call initiated.', call_id: call.data.call_control_id });

  } catch (error: any) {
    console.error('[Telnyx Make Call] Error initiating call. Raw error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    let errorMessage = 'Failed to initiate call.';
    // Attempt to parse Telnyx specific errors
    if (error.response && error.response.data && error.response.data.errors && Array.isArray(error.response.data.errors)) {
        const telnyxErrors = error.response.data.errors;
        errorMessage = telnyxErrors.map((e: any) => e.detail || e.title || JSON.stringify(e)).join(', ');
        // Check for specific D13 error (code 10010)
        const d13Error = telnyxErrors.find((e: any) => e.code === 10010 && e.detail?.toLowerCase().includes('whitelisted countries'));
        if (d13Error) {
            errorMessage += " This often means the destination country (e.g., Puerto Rico for +1787) needs to be enabled in your Telnyx account's outbound calling settings.";
        }
    } else if (error.message) {
        errorMessage = error.message;
    }
    
    console.error('[Telnyx Make Call] Parsed error message to be sent to client:', errorMessage);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
