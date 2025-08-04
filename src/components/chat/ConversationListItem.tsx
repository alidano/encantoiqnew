
import type { ChatConversation } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, parseISO, isValid } from 'date-fns';
import { MessageCircle } from 'lucide-react'; // Using MessageCircle as a stand-in for WhatsApp icon

interface ConversationListItemProps {
  conversation: ChatConversation;
  isSelected: boolean;
  onSelect: () => void;
}

const getStatusColor = (status: string) => {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus === 'open') return 'bg-blue-500';
  if (lowerStatus === 'solved' || lowerStatus === 'resolved') return 'bg-green-500';
  if (lowerStatus === 'unread') return 'bg-red-500'; // More prominent for unread
  if (lowerStatus === 'pending') return 'bg-yellow-500';
  return 'bg-gray-400'; // Default
};

export default function ConversationListItem({ conversation, isSelected, onSelect }: ConversationListItemProps) {
  const avatarFallback = conversation.contact_name ? conversation.contact_name.charAt(0).toUpperCase() : 'U';
  
  const formattedTimestamp = conversation.last_message_timestamp && isValid(parseISO(conversation.last_message_timestamp))
    ? format(parseISO(conversation.last_message_timestamp), 'p') // HH:MM AM/PM
    : conversation.updated_at && isValid(parseISO(conversation.updated_at))
      ? format(parseISO(conversation.updated_at), 'p')
      : '';

  const lastMessagePreview = conversation.last_message_content 
    ? conversation.last_message_content.length > 30 
      ? `${conversation.last_message_content.substring(0, 30)}...`
      : conversation.last_message_content
    : 'No messages yet.';

  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex items-center w-full px-4 py-3 text-left hover:bg-accent/50 focus:outline-none focus:bg-accent/70 transition-colors",
        isSelected ? "bg-accent text-accent-foreground" : "bg-transparent"
      )}
      aria-current={isSelected ? "page" : undefined}
    >
      <div className="relative mr-3">
        <Avatar className="h-10 w-10">
          {/* In a real app, you might have actual avatar URLs */}
          {/* <AvatarImage src={conversation.avatarUrl} alt={conversation.contact_name} /> */}
          <AvatarFallback className={cn(isSelected ? "bg-primary text-primary-foreground" : "bg-muted")}>
            {avatarFallback}
          </AvatarFallback>
        </Avatar>
        <MessageCircle className="absolute bottom-0 right-0 h-4 w-4 p-0.5 fill-green-500 text-white rounded-full bg-white border-2 border-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className={cn("font-semibold truncate", isSelected ? "text-accent-foreground" : "text-foreground")}>
            {conversation.contact_name}
          </h3>
          {formattedTimestamp && (
            <time className={cn("text-xs", isSelected ? "text-accent-foreground/80" : "text-muted-foreground")}>
              {formattedTimestamp}
            </time>
          )}
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className={cn("text-sm truncate", isSelected ? "text-accent-foreground/70" : "text-muted-foreground")}>
            {lastMessagePreview}
          </p>
          {conversation.status && (
             <span className={cn("ml-2 h-2.5 w-2.5 rounded-full shrink-0", getStatusColor(conversation.status))} title={conversation.status} />
          )}
        </div>
      </div>
    </button>
  );
}
