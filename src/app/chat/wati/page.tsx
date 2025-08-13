/**
 * WATI WhatsApp Chat Page
 * File Path: src/app/chat/wati/page.tsx
 * 
 * This page displays WATI WhatsApp conversations and messages.
 * It's similar to the main chat page but specifically filtered for WATI conversations.
 * 
 * Features:
 * - Shows only WATI WhatsApp conversations (sending_server_id = 2)
 * - Displays WhatsApp-specific message types (images, interactive messages)
 * - Real-time updates from WATI webhook
 * - Send messages back to customers via WATI API
 */

"use client";

import * as React from 'react';
import AppLayout from "@/components/layout/AppLayout";
import type { ChatConversation, ChatMessage } from '@/types';
import ConversationListItem from '@/components/chat/ConversationListItem';
import MessageThread from '@/components/chat/MessageThread';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, MessageSquare, AlertTriangle, MessageCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { fetchWatiContacts, fetchWatiMessages, sendTextMessage } from '@/services/watiService';

export default function WatiChatPage() {
  const [conversations, setConversations] = React.useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = React.useState<ChatConversation | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);

  const [isLoadingConversations, setIsLoadingConversations] = React.useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isClientMounted, setIsClientMounted] = React.useState(false);

  // Message sending states
  const [newMessage, setNewMessage] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);

  React.useEffect(() => {
    setIsClientMounted(true);
    const loadWatiConversations = async () => {
      setIsLoadingConversations(true);
      setError(null);
      try {
        console.log('[WATI Chat] Loading conversations directly from WATI API...');
        
        // Fetch conversations directly from WATI API
        const watiContacts = await fetchWatiContacts();
        
        console.log(`[WATI Chat] Found ${watiContacts.length} contacts from WATI`);
        setConversations(watiContacts);
        
      } catch (e) {
        console.error('[WATI Chat] Error loading WATI conversations:', e);
        setError("Failed to load WhatsApp conversations from WATI.");
      } finally {
        setIsLoadingConversations(false);
      }
    };
    loadWatiConversations();
  }, []);

  const handleSelectConversation = async (conversation: ChatConversation) => {
    setSelectedConversation(conversation);
    setIsLoadingMessages(true);
    setError(null);
    setMessages([]);
    
    try {
      console.log(`[WATI Chat] Loading messages for ${conversation.sender_number}...`);
      
      // Fetch messages directly from WATI API
      const watiMessages = await fetchWatiMessages(conversation.sender_number);
      
      console.log(`[WATI Chat] Found ${watiMessages.length} messages from WATI`);
      setMessages(watiMessages);
      
    } catch (e) {
      console.error('[WATI Chat] Error loading messages:', e);
      setError(`Failed to load messages for ${conversation.contact_name}.`);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    setIsSending(true);
    try {
      // Send message via WATI API
      const response = await sendTextMessage(
        selectedConversation.sender_number, 
        newMessage.trim()
      );

      if (response) {
        console.log('Message sent successfully:', response);
        setNewMessage('');
        
        // Optionally refresh messages to show the sent message
        // Note: The webhook should handle this automatically, but we can refresh as backup
        setTimeout(() => {
          if (selectedConversation) {
            handleSelectConversation(selectedConversation);
          }
        }, 1000);
      } else {
        throw new Error('Failed to send message via WATI');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter(conv => 
    conv.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.sender_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-4rem-2*1rem)] border rounded-lg shadow-lg bg-card text-card-foreground">
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel: WATI Conversation List */}
          <aside className="w-full md:w-2/5 lg:w-1/3 border-r bg-muted/20 flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  <h2 className="text-xl font-semibold">WhatsApp (WATI)</h2>
                </div>
                <div className="text-sm text-muted-foreground">
                  {filteredConversations.length} conversations
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                {isClientMounted ? (
                  <Input 
                    placeholder="Search WhatsApp chats..." 
                    className="pl-8" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                ) : (
                  <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-8 text-sm text-muted-foreground animate-pulse">
                    Search WhatsApp chats...
                  </div>
                )}
              </div>
            </div>
            <ScrollArea className="flex-1">
              {isLoadingConversations ? (
                <div className="flex items-center justify-center h-full p-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading WhatsApp chats...</span>
                </div>
              ) : error && filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-destructive">
                  <AlertTriangle className="mx-auto h-6 w-6 mb-2" />
                  {error}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <MessageCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg">No WhatsApp conversations found.</p>
                  <p className="text-sm">Messages will appear here when customers contact you via WhatsApp.</p>
                </div>
              ) : (
                <nav className="py-2">
                  {filteredConversations.map(conv => (
                    <ConversationListItem 
                      key={conv.conversation_id} 
                      conversation={conv}
                      isSelected={selectedConversation?.conversation_id === conv.conversation_id}
                      onSelect={() => handleSelectConversation(conv)}
                    />
                  ))}
                </nav>
              )}
            </ScrollArea>
          </aside>

          {/* Right Panel: WhatsApp Message Thread */}
          <main className="flex-1 flex flex-col bg-background">
            {selectedConversation ? (
              <>
                <MessageThread 
                  conversation={selectedConversation} 
                  messages={messages}
                  isLoading={isLoadingMessages} 
                />
                
                {/* Message Input Area */}
                <div className="border-t p-4 bg-background">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a WhatsApp message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isSending}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Send'
                      )}
                    </Button>
                  </div>
                  {error && (
                    <div className="mt-2 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                  <div className="mt-2 text-xs text-muted-foreground">
                    Press Enter to send • Shift+Enter for new line
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4">
                <MessageCircle className="h-16 w-16 mb-4 opacity-50 text-green-600" />
                <p className="text-lg">Select a WhatsApp conversation</p>
                <p className="text-sm">Choose a customer to start chatting via WhatsApp.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </AppLayout>
  );
}