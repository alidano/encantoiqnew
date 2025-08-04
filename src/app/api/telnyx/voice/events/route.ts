
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// This webhook handler responds to events from the Telnyx Voice API.

export async function POST(request: NextRequest) {
  try {
    const eventType = request.headers.get('x-telnyx-event-type');
    const signature = request.headers.get('x-telnyx-signature-ed25519');
    const timestamp = request.headers.get('x-telnyx-timestamp');
    
    let body: any;
    try {
      body = await request.json(); // Telnyx typically sends JSON for v2 events
    } catch (e) {
      console.warn('[Telnyx Webhook] Could not parse request body as JSON, trying text:', e);
      body = await request.text();
    }

    console.log(`[Telnyx Webhook] Received event. Type: ${eventType}`);
    console.log('[Telnyx Webhook] Request Body:', JSON.stringify(body, null, 2)); // Log the parsed body
    console.log(`[Telnyx Webhook] Signature: ${signature}, Timestamp: ${timestamp}`);

    // TODO: Verify Telnyx signature here for security

    let tcxmlResponse = `
<Response>
  <Say voice="female" language="en-US">Webhook received. Please configure appropriate actions.</Say>
  <Hangup/>
</Response>
    `.trim();

    if (eventType === 'call.answered') {
      console.log('[Telnyx Webhook] Call answered event detected. Responding with a greeting and hangup.');
      tcxmlResponse = `
<Response>
  <Say voice="female" language="en-US">Hello! You are connected to EncantoIQ.</Say>
  <Hangup/>
</Response>
      `.trim();
    } else if (eventType === 'call.initiated') {
      // Example: For an outbound call initiated by your app, Telnyx sends call.initiated
      // You might not need to respond with TCXML if this event is purely informational for an outbound leg.
      // Or, if you need to execute commands on this leg immediately, you can.
      // For now, we'll let it fall through to the default, or you could specifically send nothing if no action needed.
      console.log('[Telnyx Webhook] Call initiated event detected. No specific TCXML action for now, default hangup will apply if call progresses without further commands.');
      // If Telnyx expects some response even for this, the default above is fine.
      // If you want to do nothing and wait for 'call.answered' or 'call.hangup' for this leg,
      // Telnyx might not require a command response for 'call.initiated' on an API-originated call.
      // However, providing a simple Say/Hangup or just Hangup is safe.
    }
    // Add more handlers for other event types like call.hangup, dtmf.received etc. as needed.

    return new NextResponse(tcxmlResponse, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
      },
    });

  } catch (error) {
    console.error('[Telnyx Webhook] Error processing event:', error);
    return new NextResponse('Error processing webhook', { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  console.log('[Telnyx Webhook] Received GET request for verification.');
  return NextResponse.json({ message: "Webhook endpoint is active. Send POST for events." });
}
