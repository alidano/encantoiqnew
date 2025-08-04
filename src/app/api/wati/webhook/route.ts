/**
 * WATI WhatsApp Webhook Handler - Basado en Estructura Real
 * File Path: src/app/api/wati/webhook/route.ts
 * 
 * Este webhook maneja la estructura real que WATI envía según el ejemplo capturado.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  console.log('🚀 [WATI Webhook] POST request received');
  
  try {
    const payload = await request.json();
    console.log('📦 [WATI Webhook] Full payload:', JSON.stringify(payload, null, 2));

    // Validate required fields
    if (!payload.eventType) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Missing required field: eventType'
        },
        { status: 400 }
      );
    }

    // Check if this is a test message
    const isTestMessage = payload.id === 'message.Id' || 
                         payload.whatsappMessageId === 'message.WhatsappMessageId' ||
                         payload.conversationId === 'message.ConversationId';

    if (isTestMessage) {
      console.log('🧪 [WATI Webhook] Test message received');
      return NextResponse.json({ 
        status: 'success', 
        message: 'Test message received successfully',
        timestamp: new Date().toISOString()
      });
    }

    // Extract data based on real WATI structure
    const eventType = payload.eventType;
    const messageId = payload.id;
    const conversationId = payload.conversationId;
    const ticketId = payload.ticketId;
    const messageText = payload.text;
    const messageType = payload.type;
    const timestamp = payload.timestamp || payload.created; // Handle both timestamp formats
    const whatsappMessageId = payload.whatsappMessageId;
    const statusString = payload.statusString;
    const assigneeId = payload.assigneeId;

    console.log(`📝 [WATI Webhook] Event: ${eventType}, Message ID: ${messageId}, Conversation: ${conversationId}`);

    // Handle different event types based on real WATI events
    switch (eventType) {
      case 'message':
        await handleIncomingMessage(payload);
        break;
      
      case 'sentMessageDELIVERED':
      case 'sentMessageDELIVERED_v2':
        await handleMessageDelivered(payload);
        break;
      
      case 'sentMessageREAD':
      case 'sentMessageREAD_v2':
        await handleMessageRead(payload);
        break;
      
      case 'sessionMessageSent':
      case 'sessionMessageSent_v2':
        await handleOutgoingMessage(payload);
        break;

      case 'sentMessageREPLIED':
      case 'sentMessageREPLIED_v2':
        await handleMessageReplied(payload);
        break;
      
      default:
        console.log(`ℹ️ [WATI Webhook] Unhandled event type: ${eventType}`);
        // Still return success for unhandled events
        return NextResponse.json({ 
          status: 'success', 
          message: `Event ${eventType} acknowledged`,
          timestamp: new Date().toISOString()
        });
    }

    return NextResponse.json({ 
      status: 'success',
      timestamp: new Date().toISOString()
    }, { status: 200 });
    
  } catch (error) {
    console.error('💥 [WATI Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Webhook processing failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}

async function handleIncomingMessage(payload: any) {
  try {
    console.log('💬 [WATI Webhook] Processing incoming message');
    
    const messageId = payload.id;
    const conversationId = payload.conversationId;
    const messageText = payload.text || '';
    const messageType = payload.type || 'text';
    const timestamp = payload.timestamp;
    const whatsappMessageId = payload.whatsappMessageId;

    // Check if message already exists to prevent duplicates
    const { data: existingMessage } = await supabase
      .from('messages')
      .select('message_id')
      .eq('wati_message_id', messageId)
      .single();

    if (existingMessage) {
      console.log(`[WATI Webhook] Message ${messageId} already exists, skipping...`);
      return;
    }

    // Convert WATI timestamp (Unix timestamp) to ISO string
    const messageTimestamp = timestamp ? new Date(parseInt(timestamp) * 1000).toISOString() : new Date().toISOString();

    const newMessage = {
      message_id: parseInt(messageId.slice(-8), 16) || Math.floor(Math.random() * 1000000), // Convert hex to int
      direction: 'from', // Incoming message
      sending_server_id: 2, // WATI server ID
      timestamp: messageTimestamp,
      updated_at: new Date().toISOString(),
      wati_message_id: messageId,
      message_status: 'received',
      // Additional WATI-specific fields
      wati_conversation_id: conversationId,
      wati_whatsapp_id: whatsappMessageId,
      wati_ticket_id: payload.ticketId || null,
      wati_event_type: payload.eventType,
      wati_message_text: messageText,
      wati_message_type: messageType
    };

    console.log('💾 [WATI Webhook] Inserting incoming message:', newMessage);

    const { data, error } = await supabase
      .from('messages')
      .insert(newMessage)
      .select();

    if (error) {
      console.error('❌ [WATI Webhook] Database insert error:', error);
      throw error;
    }

    console.log('✅ [WATI Webhook] Incoming message inserted successfully:', data);

  } catch (error) {
    console.error('❌ [WATI Webhook] Error handling incoming message:', error);
    throw error;
  }
}

async function handleOutgoingMessage(payload: any) {
  try {
    console.log('📤 [WATI Webhook] Processing outgoing message');
    
    const messageId = payload.id;
    const conversationId = payload.conversationId;
    const messageText = payload.text || '';
    const messageType = payload.type || 'text';
    const timestamp = payload.timestamp;

    // Check if message already exists
    const { data: existingMessage } = await supabase
      .from('messages')
      .select('message_id')
      .eq('wati_message_id', messageId)
      .single();

    if (existingMessage) {
      console.log(`[WATI Webhook] Outgoing message ${messageId} already exists, skipping...`);
      return;
    }

    const messageTimestamp = timestamp ? new Date(parseInt(timestamp) * 1000).toISOString() : new Date().toISOString();

    const newMessage = {
      message_id: parseInt(messageId.slice(-8), 16) || Math.floor(Math.random() * 1000000),
      direction: 'to', // Outgoing message
      sending_server_id: 2,
      timestamp: messageTimestamp,
      updated_at: new Date().toISOString(),
      wati_message_id: messageId,
      message_status: 'sent',
      wati_conversation_id: conversationId,
      wati_whatsapp_id: payload.whatsappMessageId,
      wati_ticket_id: payload.ticketId || null,
      wati_event_type: payload.eventType,
      wati_message_text: messageText,
      wati_message_type: messageType,
      wati_assignee_id: payload.assigneeId
    };

    const { data, error } = await supabase
      .from('messages')
      .insert(newMessage)
      .select();

    if (error) {
      console.error('❌ [WATI Webhook] Error inserting outgoing message:', error);
      throw error;
    }

    console.log('✅ [WATI Webhook] Outgoing message inserted successfully:', data);

  } catch (error) {
    console.error('❌ [WATI Webhook] Error handling outgoing message:', error);
    throw error;
  }
}

async function handleMessageDelivered(payload: any) {
  try {
    console.log('📋 [WATI Webhook] Processing delivery confirmation');
    
    const messageId = payload.id;
    const statusString = payload.statusString; // "Delivered"
    
    console.log(`📋 [WATI Webhook] Updating message ${messageId} status to: ${statusString}`);

    const { error } = await supabase
      .from('messages')
      .update({ 
        message_status: 'delivered',
        updated_at: new Date().toISOString(),
        wati_status_string: statusString
      })
      .eq('wati_message_id', messageId);

    if (error) {
      console.error('❌ [WATI Webhook] Error updating delivery status:', error);
    } else {
      console.log(`✅ [WATI Webhook] Message ${messageId} marked as delivered`);
    }

  } catch (error) {
    console.error('❌ [WATI Webhook] Error handling delivery confirmation:', error);
  }
}

async function handleMessageRead(payload: any) {
  try {
    console.log('📖 [WATI Webhook] Processing read confirmation');
    
    const messageId = payload.id;
    const statusString = payload.statusString;

    const { error } = await supabase
      .from('messages')
      .update({ 
        message_status: 'read',
        updated_at: new Date().toISOString(),
        wati_status_string: statusString
      })
      .eq('wati_message_id', messageId);

    if (error) {
      console.error('❌ [WATI Webhook] Error updating read status:', error);
    } else {
      console.log(`✅ [WATI Webhook] Message ${messageId} marked as read`);
    }

  } catch (error) {
    console.error('❌ [WATI Webhook] Error handling read confirmation:', error);
  }
}

async function handleMessageReplied(payload: any) {
  try {
    console.log('💬 [WATI Webhook] Processing reply confirmation');
    
    const messageId = payload.id;
    const statusString = payload.statusString;

    const { error } = await supabase
      .from('messages')
      .update({ 
        message_status: 'replied',
        updated_at: new Date().toISOString(),
        wati_status_string: statusString
      })
      .eq('wati_message_id', messageId);

    if (error) {
      console.error('❌ [WATI Webhook] Error updating reply status:', error);
    } else {
      console.log(`✅ [WATI Webhook] Message ${messageId} marked as replied`);
    }

  } catch (error) {
    console.error('❌ [WATI Webhook] Error handling reply confirmation:', error);
  }
}

// Test endpoint
export async function GET() {
  console.log('🔍 [WATI Webhook] GET request received');
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    return NextResponse.json({
      status: 'success',
      message: 'WATI Webhook endpoint is working - Real Structure',
      environment: {
        supabaseUrl: supabaseUrl ? 'Present' : 'Missing',
        supabaseServiceKey: supabaseServiceKey ? 'Present' : 'Missing'
      },
      supportedEvents: [
        'message',
        'sentMessageDELIVERED',
        'sentMessageREAD',
        'sessionMessageSent',
        'sentMessageREPLIED'
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'GET endpoint error' },
      { status: 500 }
    );
  }
}