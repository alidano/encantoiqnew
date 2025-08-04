
import type { ChatMessage } from '@/types';
import { cn } from '@/lib/utils';
import { format, parseISO, isValid } from 'date-fns';

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isSentByMe = message.direction === 'from'; // 'from' means sent by our system/agent

  const formattedTimestamp = message.timestamp && isValid(parseISO(message.timestamp))
    ? format(parseISO(message.timestamp), 'p') // HH:MM AM/PM
    : '';

  return (
    <div className={cn("flex mb-3", isSentByMe ? "justify-end" : "justify-start")}>
      <div 
        className={cn(
          "max-w-[70%] p-3 rounded-xl shadow-md",
          isSentByMe 
            ? "bg-green-200 dark:bg-green-700 text-gray-800 dark:text-gray-100 rounded-br-none" 
            : "bg-muted dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none"
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
        {message.media_url && (
          <div className="mt-2">
            {/* Basic image display, could be enhanced for other media types */}
            <img src={message.media_url} alt="Attached media" className="max-w-xs max-h-48 rounded-md" data-ai-hint="chat attachment" />
          </div>
        )}
        <div className={cn("text-xs mt-1", isSentByMe ? "text-right text-green-700 dark:text-green-400/80" : "text-left text-muted-foreground/80")}>
          {formattedTimestamp}
          {/* TODO: Add read status ticks for sent messages in the future */}
        </div>
      </div>
    </div>
  );
}
