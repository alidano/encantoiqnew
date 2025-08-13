
import type { ChatConversation, ChatMessage } from '@/types';
import MessageBubble from './MessageBubble';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, SendHorizonal, Smile, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import React from 'react';

interface MessageThreadProps {
  conversation: ChatConversation;
  messages: ChatMessage[];
  isLoading: boolean;
}

export default function MessageThread({ conversation, messages, isLoading }: MessageThreadProps) {
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);
  const [newMessage, setNewMessage] = React.useState('');

  // Sort messages by timestamp to ensure proper chat order (oldest first, newest last)
  const sortedMessages = React.useMemo(() => {
    return [...messages].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeA - timeB; // Ascending order (oldest first)
    });
  }, [messages]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sortedMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    // TODO: Implement send message logic (will connect to Bicomm API in future)
    console.log("Sending message:", newMessage, "to conversation:", conversation.conversation_id);
    // For demo, clear input. In real app, add to messages optimistically or after API success.
    setNewMessage(''); 
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center p-4 border-b bg-muted/30">
        <Avatar className="h-10 w-10 mr-3">
          {/* <AvatarImage src={conversation.avatarUrl} alt={conversation.contact_name} /> */}
          <AvatarFallback>{conversation.contact_name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-lg">{conversation.contact_name}</h2>
          {/* Placeholder for online status, could be dynamic */}
          <p className="text-xs text-green-500">Online</p>
        </div>
        {/* More actions (e.g., call, info) can be added here */}
      </header>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading messages...</span>
          </div>
        ) : sortedMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No messages in this conversation yet.
          </div>
        ) : (
          sortedMessages.map(msg => (
            <MessageBubble key={msg.message_id} message={msg} />
          ))
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input Area */}
      <footer className="p-4 border-t bg-muted/30">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon" className="text-muted-foreground">
            <Smile className="h-5 w-5" />
          </Button>
          <Input 
            type="text" 
            placeholder="Type a message..." 
            className="flex-1 bg-background"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <Button type="button" variant="ghost" size="icon" className="text-muted-foreground">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button type="submit" size="icon" className="bg-green-500 hover:bg-green-600 text-white">
            <SendHorizonal className="h-5 w-5" />
          </Button>
        </form>
      </footer>
    </div>
  );
}
