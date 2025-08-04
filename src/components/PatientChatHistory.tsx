import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Phone, ArrowRight, ArrowLeft, Loader2, AlertTriangle, ExternalLink, MessageCircle } from "lucide-react";
import Link from 'next/link';

// Import the chat service functions
import { fetchPatientChatConversations, fetchPatientRecentMessages, fetchPatientChatStats } from '@/services/chatService';

interface PatientChatHistoryProps {
  patientPhone: string;
  patientName: string;
}

interface ChatStats {
  totalConversations: number;
  totalMessages: number;
  lastMessageDate: string | null;
  incomingMessages: number;
  outgoingMessages: number;
}

interface MessageWithConversation {
  message_id: number;
  conversation_id: number;
  message: string;
  media_url?: string;
  direction: 'incoming' | 'outgoing';
  timestamp: string;
  conversation?: {
    contact_name?: string;
    conversation_id: number;
  };
}

const PatientChatHistory: React.FC<PatientChatHistoryProps> = ({ patientPhone, patientName }) => {
  const [chatStats, setChatStats] = useState<ChatStats | null>(null);
  const [recentMessages, setRecentMessages] = useState<MessageWithConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllMessages, setShowAllMessages] = useState(false);

  useEffect(() => {
    loadChatData();
  }, [patientPhone]);

  const loadChatData = async () => {
    if (!patientPhone) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Load chat statistics and recent messages in parallel
      const [stats, messages] = await Promise.all([
        fetchPatientChatStats(patientPhone),
        fetchPatientRecentMessages(patientPhone, showAllMessages ? 50 : 10)
      ]);

      setChatStats(stats);
      setRecentMessages(messages);
    } catch (err) {
      console.error('Error loading chat data:', err);
      setError('Failed to load chat history');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "N/A";
    }
  };

  const formatMessagePreview = (message: string, maxLength = 60) => {
    if (!message) return 'No message content';
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
  };

  const getDirectionBadgeClass = (direction: string) => {
    return direction === 'incoming' 
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
  };

  const getDirectionIcon = (direction: string) => {
    return direction === 'incoming' ? <ArrowLeft className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />;
  };

  if (!patientPhone) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            WhatsApp Chat History
          </CardTitle>
          <CardDescription>No phone number available for this patient.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            WhatsApp Chat History
          </div>
          {chatStats && chatStats.totalConversations > 0 && (
            <Link href="/chat" className="text-sm">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                View in Chat
              </Button>
            </Link>
          )}
        </CardTitle>
        <CardDescription>
          WhatsApp communication history for {patientName} ({patientPhone})
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Loading chat history...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32 text-destructive">
            <AlertTriangle className="h-5 w-5 mr-2" />
            {error}
          </div>
        ) : chatStats && chatStats.totalMessages === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <MessageCircle className="h-8 w-8 mb-2 opacity-50" />
            <p>No WhatsApp conversations found</p>
            <p className="text-xs">Messages will appear here when the patient contacts via WhatsApp</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Chat Statistics */}
            {chatStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{chatStats.totalConversations}</div>
                  <div className="text-xs text-muted-foreground">Conversations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{chatStats.totalMessages}</div>
                  <div className="text-xs text-muted-foreground">Total Messages</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{chatStats.incomingMessages}</div>
                  <div className="text-xs text-muted-foreground">Received</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{chatStats.outgoingMessages}</div>
                  <div className="text-xs text-muted-foreground">Sent</div>
                </div>
              </div>
            )}

            {/* Recent Messages */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-md font-semibold">Recent Messages</h3>
                {recentMessages.length > 10 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setShowAllMessages(!showAllMessages);
                      loadChatData();
                    }}
                  >
                    {showAllMessages ? 'Show Less' : 'Show More'}
                  </Button>
                )}
              </div>

              <ScrollArea className="h-80">
                <div className="space-y-3">
                  {recentMessages.map((message) => (
                    <div 
                      key={message.message_id} 
                      className={`p-3 rounded-lg border ${
                        message.direction === 'incoming' 
                          ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' 
                          : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge 
                          variant="secondary" 
                          className={`${getDirectionBadgeClass(message.direction)} flex items-center gap-1`}
                        >
                          {getDirectionIcon(message.direction)}
                          {message.direction === 'incoming' ? 'Received' : 'Sent'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(message.timestamp)}
                        </span>
                      </div>
                      
                      <p className="text-sm leading-relaxed">
                        {formatMessagePreview(message.message, 200)}
                      </p>
                      
                      {message.media_url && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            📎 Media attachment
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {chatStats && chatStats.lastMessageDate && (
              <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                Last message: {formatDate(chatStats.lastMessageDate)}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PatientChatHistory;