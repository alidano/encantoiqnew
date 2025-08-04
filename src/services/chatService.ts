/**
 * Chat Service - Updated with WATI Support
 * File Path: src/services/chatService.ts
 * 
 * Extended chat service functions to support WATI WhatsApp conversations.
 * Includes filtering by sending_server_id to separate different chat providers.
 */

'use server';

import { supabase } from '@/lib/supabase/client';
import type { ChatConversation, ChatMessage, ChatDashboardTodayMetrics, ChatStatusDistributionItem } from '@/types';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function fetchConversations(): Promise<ChatConversation[]> {
  return fetchConversationsWithLastMessageFallback();
}

export async function fetchMessages(conversationId: number): Promise<ChatMessage[]> {
  if (!conversationId) return [];

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('timestamp', { ascending: true });

  if (error) {
    console.error(`[chatService] Error fetching messages for conversation ${conversationId}:`, error);
    throw new Error(`Failed to fetch messages for conversation ${conversationId}.`);
  }
  return data || [];
}

export async function fetchConversationsWithLastMessageFallback(): Promise<ChatConversation[]> {
  console.log('[chatService] Using fallback to fetch conversations for the current month.');

  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);

  console.log(`[chatService] Fetching conversations from ${currentMonthStart.toISOString()} to ${currentMonthEnd.toISOString()}`);

  const { data: conversationsData, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .gte('updated_at', currentMonthStart.toISOString())
    .lte('updated_at', currentMonthEnd.toISOString())
    .order('updated_at', { ascending: false });

  if (convError) {
    console.error('[chatService] Error fetching conversations (fallback):', convError);
    throw new Error('Failed to fetch conversations.');
  }
  if (!conversationsData) return [];

  console.log(`[chatService] Fetched ${conversationsData.length} conversations for this month.`);

  const conversationsWithLastMessage: ChatConversation[] = await Promise.all(
    conversationsData.map(async (conv) => {
      const { data: lastMessageData, error: msgError } = await supabase
        .from('messages')
        .select('message, timestamp')
        .eq('conversation_id', conv.conversation_id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      return {
        ...conv,
        last_message_content: lastMessageData?.message || null,
        last_message_timestamp: lastMessageData?.timestamp || null,
      };
    })
  );
  
  return conversationsWithLastMessage;
}

/**
 * Fetch conversations filtered by sending server (e.g., WATI only)
 */
export async function fetchConversationsByServer(sendingServerId: number): Promise<ChatConversation[]> {
  console.log(`[chatService] Fetching conversations for sending_server_id: ${sendingServerId}`);

  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);

  const { data: conversationsData, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .eq('sending_server_id', sendingServerId)
    .gte('updated_at', currentMonthStart.toISOString())
    .lte('updated_at', currentMonthEnd.toISOString())
    .order('updated_at', { ascending: false });

  if (convError) {
    console.error(`[chatService] Error fetching conversations for server ${sendingServerId}:`, convError);
    throw new Error(`Failed to fetch conversations for server ${sendingServerId}.`);
  }
  if (!conversationsData) return [];

  console.log(`[chatService] Fetched ${conversationsData.length} conversations for server ${sendingServerId}.`);

  const conversationsWithLastMessage: ChatConversation[] = await Promise.all(
    conversationsData.map(async (conv) => {
      const { data: lastMessageData } = await supabase
        .from('messages')
        .select('message, timestamp')
        .eq('conversation_id', conv.conversation_id)
        .eq('sending_server_id', sendingServerId) // Also filter messages by server
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      return {
        ...conv,
        last_message_content: lastMessageData?.message || null,
        last_message_timestamp: lastMessageData?.timestamp || null,
      };
    })
  );
  
  return conversationsWithLastMessage;
}

/**
 * Fetch WATI WhatsApp conversations only
 */
export async function fetchWatiConversations(): Promise<ChatConversation[]> {
  return fetchConversationsByServer(2); // 2 = WATI server ID
}

/**
 * Fetch messages filtered by sending server
 */
export async function fetchMessagesByServer(conversationId: number, sendingServerId: number): Promise<ChatMessage[]> {
  if (!conversationId) return [];

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('sending_server_id', sendingServerId)
    .order('timestamp', { ascending: true });

  if (error) {
    console.error(`[chatService] Error fetching messages for conversation ${conversationId}, server ${sendingServerId}:`, error);
    throw new Error(`Failed to fetch messages for conversation ${conversationId}.`);
  }
  return data || [];
}

/**
 * Fetch WATI messages for a conversation
 */
export async function fetchWatiMessages(conversationId: number): Promise<ChatMessage[]> {
  return fetchMessagesByServer(conversationId, 2); // 2 = WATI server ID
}

export async function fetchChatDashboardMonthlyMetrics(): Promise<ChatDashboardTodayMetrics> {
  console.log('[chatService] Fetching chat dashboard metrics for this month via RPC call to get_chat_dashboard_monthly_metrics...');
  const { data, error } = await supabase.rpc('get_chat_dashboard_monthly_metrics');

  if (error) {
    console.error('[chatService] Error fetching chat dashboard monthly metrics via RPC:', JSON.stringify(error, null, 2));
    return {
      totalConversationsToday: 0,
      responseRateToday: 0,
      avgResponseTimeMinutes: 0,
      statusDistribution: [],
      totalMessagesToday: 0,
      sentMessagesToday: 0,
      receivedMessagesToday: 0,
      busiestHourToday: 'No data',
    };
  }

  if (!data) {
    console.warn('[chatService] No data returned from get_chat_dashboard_monthly_metrics RPC.');
    return {
      totalConversationsToday: 0,
      responseRateToday: 0,
      avgResponseTimeMinutes: 0,
      statusDistribution: [],
      totalMessagesToday: 0,
      sentMessagesToday: 0,
      receivedMessagesToday: 0,
      busiestHourToday: 'No data',
    };
  }

  console.log('[chatService] Successfully fetched chat dashboard monthly metrics:', data);
  const metricsData = data as any;

  const statusDistributionArray = Array.isArray(metricsData.statusDistribution) 
    ? metricsData.statusDistribution 
    : [];

  return {
    totalConversationsToday: metricsData.totalconversationstoday ?? metricsData.totalConversationsToday ?? 0,
    responseRateToday: metricsData.responseratetoday ?? metricsData.responseRateToday ?? 0,
    avgResponseTimeMinutes: metricsData.avgresponsetimeminutes ?? metricsData.avgResponseTimeMinutes ?? 0,
    statusDistribution: statusDistributionArray as ChatStatusDistributionItem[],
    totalMessagesToday: metricsData.totalmessagestoday ?? metricsData.totalMessagesToday ?? 0,
    sentMessagesToday: metricsData.sentmessagestoday ?? metricsData.sentMessagesToday ?? 0,
    receivedMessagesToday: metricsData.receivedmessagestoday ?? metricsData.receivedMessagesToday ?? 0,
    busiestHourToday: metricsData.busiesthourtoday ?? metricsData.busiestHourToday ?? 'No data',
  } as ChatDashboardTodayMetrics;
}

// NEW PATIENT-SPECIFIC CHAT FUNCTIONS

export async function fetchPatientChatConversations(patientPhoneNumber: string): Promise<ChatConversation[]> {
  if (!patientPhoneNumber) {
    return [];
  }

  try {
    console.log(`[chatService] Fetching conversations for patient phone: ${patientPhoneNumber}`);

    // Clean phone number - remove all non-digits
    const cleanPhoneNumber = patientPhoneNumber.replace(/\D/g, '');

    // Try different phone number formats
    const phoneVariants = [
      cleanPhoneNumber,
      `+1${cleanPhoneNumber}`,
      `+${cleanPhoneNumber}`,
      `1${cleanPhoneNumber}`
    ];

    console.log(`[chatService] Searching for phone variants:`, phoneVariants);

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        conversation_id,
        uid,
        sender_number,
        recipient_number,
        contact_name,
        status,
        created_at,
        updated_at,
        sending_server_id
      `)
      .or(phoneVariants.map(variant => `sender_number.eq.${variant},recipient_number.eq.${variant}`).join(','))
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[chatService] Error fetching patient conversations:', error);
      throw error;
    }

    console.log(`[chatService] Found ${conversations?.length || 0} conversations for patient`);

    // Get last message for each conversation
    const conversationsWithLastMessage: ChatConversation[] = await Promise.all(
      (conversations || []).map(async (conv) => {
        const { data: lastMessageData } = await supabase
          .from('messages')
          .select('message, timestamp')
          .eq('conversation_id', conv.conversation_id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();
        
        return {
          ...conv,
          last_message_content: lastMessageData?.message || null,
          last_message_timestamp: lastMessageData?.timestamp || null,
        };
      })
    );

    return conversationsWithLastMessage;

  } catch (error) {
    console.error('[chatService] Error in fetchPatientChatConversations:', error);
    throw error;
  }
}

export async function fetchPatientRecentMessages(patientPhoneNumber: string, limit = 20): Promise<any[]> {
  if (!patientPhoneNumber) {
    return [];
  }

  try {
    console.log(`[chatService] Fetching recent messages for patient phone: ${patientPhoneNumber}`);

    // First get all conversation IDs for this patient
    const conversations = await fetchPatientChatConversations(patientPhoneNumber);

    if (conversations.length === 0) {
      console.log(`[chatService] No conversations found for patient`);
      return [];
    }

    const conversationIds = conversations.map(conv => conv.conversation_id);
    console.log(`[chatService] Found conversation IDs:`, conversationIds);

    // Get recent messages from all conversations
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        message_id,
        conversation_id,
        message,
        media_url,
        sms_type,
        direction,
        timestamp,
        updated_at,
        sending_server_id
      `)
      .in('conversation_id', conversationIds)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[chatService] Error fetching patient recent messages:', error);
      throw error;
    }

    console.log(`[chatService] Found ${messages?.length || 0} recent messages for patient`);

    // Add conversation info to each message
    const messagesWithConversation = (messages || []).map(message => {
      const conversation = conversations.find(conv => conv.conversation_id === message.conversation_id);
      return {
        ...message,
        conversation: conversation
      };
    });

    return messagesWithConversation;

  } catch (error) {
    console.error('[chatService] Error in fetchPatientRecentMessages:', error);
    throw error;
  }
}

export async function fetchPatientChatStats(patientPhoneNumber: string) {
  if (!patientPhoneNumber) {
    return {
      totalConversations: 0,
      totalMessages: 0,
      lastMessageDate: null,
      incomingMessages: 0,
      outgoingMessages: 0
    };
  }

  try {
    console.log(`[chatService] Fetching chat stats for patient phone: ${patientPhoneNumber}`);

    const conversations = await fetchPatientChatConversations(patientPhoneNumber);

    if (conversations.length === 0) {
      return {
        totalConversations: 0,
        totalMessages: 0,
        lastMessageDate: null,
        incomingMessages: 0,
        outgoingMessages: 0
      };
    }

    const conversationIds = conversations.map(conv => conv.conversation_id);

    // Get message statistics
    const { data: messageStats, error } = await supabase
      .from('messages')
      .select('direction, timestamp')
      .in('conversation_id', conversationIds);

    if (error) {
      console.error('[chatService] Error fetching patient chat stats:', error);
      throw error;
    }

    const stats = {
      totalConversations: conversations.length,
      totalMessages: messageStats?.length || 0,
      lastMessageDate: null as string | null,
      incomingMessages: 0,
      outgoingMessages: 0
    };

    if (messageStats && messageStats.length > 0) {
      // Find most recent message
      const sortedMessages = messageStats.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      stats.lastMessageDate = sortedMessages[0]?.timestamp || null;

      // Count incoming vs outgoing
      stats.incomingMessages = messageStats.filter(msg => msg.direction === 'inbound').length;
      stats.outgoingMessages = messageStats.filter(msg => msg.direction === 'outbound').length;
    }

    console.log(`[chatService] Chat stats for patient:`, stats);
    return stats;

  } catch (error) {
    console.error('[chatService] Error in fetchPatientChatStats:', error);
    return {
      totalConversations: 0,
      totalMessages: 0,
      lastMessageDate: null,
      incomingMessages: 0,
      outgoingMessages: 0
    };
  }
}