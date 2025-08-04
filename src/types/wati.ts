/**
 * WATI WhatsApp Integration - TypeScript Type Definitions
 * File Path: src/types/wati.ts
 * 
 * This file contains all TypeScript interfaces and types for WATI integration:
 * - Webhook payload structures based on real WATI data
 * - API request/response types for sending messages
 * - Database mapping interfaces for Supabase integration
 * - Event types and message direction enums
 * 
 * These types ensure type safety when handling WATI webhook data
 * and when sending messages through the WATI API.
 */

// src/types/wati.ts

/**
 * Main WATI webhook payload structure based on actual data
 */
export interface WatiWebhookPayload {
  id: string;
  created?: string;
  whatsappMessageId?: string;
  conversationId: string;
  ticketId?: string;
  text?: string | null;
  type: string;
  data?: string | null;
  sourceId?: string | null;
  sourceUrl?: string | null;
  timestamp: string;
  owner: boolean;
  eventType: string;
  statusString: string;
  avatarUrl?: string | null;
  assignedId?: string | null;
  operatorName?: string | null;
  operatorEmail?: string | null;
  waId: string;
  messageContact?: any | null;
  senderName?: string;
  listReply?: WatiListReply | null;
  interactiveButtonReply?: any | null;
  buttonReply?: any | null;
  replyContextId?: string;
  sourceType?: number;
  frequentlyForwarded?: boolean;
  forwarded?: boolean;
  assigneeId?: string;
  localMessageId?: string;
  chatbotTriggeredEventId?: any | null;
}

/**
 * WATI List Reply structure
 */
export interface WatiListReply {
  title: string;
  description?: string | null;
  id: string;
}

/**
 * Event types from WATI
 */
export type WatiEventType = 
  | 'message'
  | 'sentMessageDELIVERED'
  | 'sentMessageDELIVERED_v2'
  | 'sentMessageREAD'
  | 'sentMessageREAD_v2'
  | 'sessionMessageSent'
  | 'sessionMessageSent_v2';

/**
 * Message types from WATI
 */
export type WatiMessageType = 
  | 'text'
  | 'image'
  | 'interactive'
  | 'audio'
  | 'video'
  | 'document';

/**
 * Direction of message flow
 */
export type WatiMessageDirection = 'inbound' | 'outbound';

/**
 * Payload for sending messages via WATI API
 */
export interface WatiSendMessagePayload {
  whatsappNumber: string;
  messageText: string;
  messageId?: string;
}

/**
 * Response from WATI API when sending messages
 */
export interface WatiSendMessageResponse {
  result: boolean;
  info?: string;
  data?: {
    id: string;
    created: string;
    whatsappMessageId: string;
    conversationId: string;
    text: string;
    type: string;
    timestamp: string;
    statusString: string;
  };
}

/**
 * Database mapping interfaces
 */
export interface WatiConversationData {
  conversation_id: string;
  user_id?: number | null;
  notification?: number;
  created_at: string;
  updated_at: string;
  sending_server_id: number; // 2 for WATI
  uid: string; // waId
  status: string;
  sender_number: string;
  recipient_number?: string;
  contact_name?: string;
}

export interface WatiMessageData {
  conversation_id: string;
  timestamp: string;
  updated_at: string;
  payload: WatiWebhookPayload;
  private: boolean;
  message_id: string;
  sending_server_id: number; // 2 for WATI
  message?: string | null;
  media_url?: string | null;
  sms_type: string;
  direction: WatiMessageDirection;
  topic: string; // 'wati'
  extension: string; // 'whatsapp'
  event: string;
}