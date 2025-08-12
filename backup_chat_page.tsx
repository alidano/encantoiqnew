
"use client";

import * as React from 'react';
import AppLayout from "@/components/layout/AppLayout";
import { fetchConversationsWithLastMessageFallback, fetchMessages } from '@/services/chatService'; // Using fallback for now
import type { ChatConversation, ChatMessage } from '@/types';
import ConversationListItem from '@/components/chat/ConversationListItem';
import MessageThread from '@/components/chat/MessageThread';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, MessageSquare, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ChatPage() {
  const [conversations, setConversations] = React.useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = React.useState<ChatConversation | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  
  const [isLoadingConversations, setIsLoadingConversations] = React.useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isClientMounted, setIsClientMounted] = React.useState(false);

  React.useEffect(() => {
    setIsClientMounted(true);
    const loadConversations = async () => {
      setIsLoadingConversations(true);
      setError(null);
      try {
        // Using the fallback version for now, which is less efficient but uses standard client methods
        const fetchedConversations = await fetchConversationsWithLastMessageFallback();
        setConversations(fetchedConversations);
      } catch (e) {
        console.error(e);
        setError("Failed to load conversations.");
      } finally {
        setIsLoadingConversations(false);
      }
    };
    loadConversations();
  }, []);

  const handleSelectConversation = async (conversation: ChatConversation) => {
    setSelectedConversation(conversation);
    setIsLoadingMessages(true);
    setError(null);
    setMessages([]); // Clear previous messages
    try {
      const fetchedMessages = await fetchMessages(conversation.conversation_id);
      setMessages(fetchedMessages);
    } catch (e) {
      console.error(e);
      setError(`Failed to load messages for ${conversation.contact_name}.`);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const filteredConversations = conversations.filter(conv => 
    conv.contact_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-4rem-2*1rem)] border rounded-lg shadow-lg bg-card text-card-foreground"> {/* Adjusted height, 4rem for header, 1rem for p-4 of main */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel: Conversation List */}
          <aside className="w-full md:w-2/5 lg:w-1/3 border-r bg-muted/20 flex flex-col"> {/* Updated width classes */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold">Chats</h2>
                {/* Add new chat button or more actions here if needed */}
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                {isClientMounted ? (
                  <Input 
                    placeholder="Search chats..." 
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                ) : (
                  <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-8 text-sm text-muted-foreground animate-pulse" aria-label="Loading search input">
                    Search chats...
                  </div>
                )}
              </div>
            </div>
            <ScrollArea className="flex-1">
              {isLoadingConversations ? (
                <div className="flex items-center justify-center h-full p-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading chats...</span>
                </div>
              ) : error && filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-destructive">
                  <AlertTriangle className="mx-auto h-6 w-6 mb-2" />
                  {error}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No conversations found.</div>
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

          {/* Right Panel: Message Thread */}
          <main className="flex-1 flex flex-col bg-background">
            {selectedConversation ? (
              <MessageThread 
                conversation={selectedConversation} 
                messages={messages}
                isLoading={isLoadingMessages} 
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4">
                <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-lg">Select a conversation to start chatting.</p>
                <p className="text-sm">Or, start a new conversation.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </AppLayout>
  );
}
