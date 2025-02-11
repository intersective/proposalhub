import { useEffect, useState, useRef } from 'react';
import { Message } from './types';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { saveChatMessage, getChatMessages } from '@/app/lib/chatDatabase';

interface ProposalChatProps {
  proposalId: string;
  onReplace?: (sectionId: string, content: string) => void;
  onAppend?: (sectionId: string, content: string) => void;
  onRefine?: (sectionId: string) => void;
  isImproving?: boolean;
}

export default function ProposalChat({ 
  proposalId,
  onReplace,
  onAppend,
  onRefine,
  isImproving = false
}: ProposalChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState('gpt-4o-mini');
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load initial messages
  useEffect(() => {
    const loadInitialMessages = async () => {
      setIsLoading(true);
      const { messages: initialMessages, hasMore: moreMessages } = await getChatMessages(proposalId);
      setMessages(initialMessages);
      setHasMore(moreMessages);
      setIsLoading(false);
    };

    loadInitialMessages();
  }, [proposalId]);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current && !isLoadingMore) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoadingMore]);

  const handleLoadMore = async () => {
    if (!messages.length || isLoadingMore) return;

    setIsLoadingMore(true);
    const oldestMessage = messages[0];
    const { messages: olderMessages, hasMore: moreMessages } = await getChatMessages(
      proposalId,
      oldestMessage.timestamp
    );

    setMessages(prev => [...olderMessages, ...prev]);
    setHasMore(moreMessages);
    setIsLoadingMore(false);
  };

  const handleSendMessage = async (content: string) => {
    const newMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    await saveChatMessage(proposalId, newMessage);

    // Here you would typically also handle the AI response
    // and save it using saveChatMessage
  };

  const handleCancel = () => {
    // Implement cancel logic
  };

  return (
    <div className="flex flex-col h-full">
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {hasMore && (
          <div className="flex justify-center">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              {isLoadingMore ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
        {messages.map((message, index) => (
          <ChatMessage
            key={message.id || index}
            message={message}
            isLoading={isLoading}
            onCancel={handleCancel}
            onReplace={onReplace}
            onAppend={onAppend}
            onRefine={onRefine}
            currentModel={currentModel}
            onModelChange={setCurrentModel}
          />
        ))}
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <ChatInput onSubmit={handleSendMessage} disabled={isImproving} />
      </div>
    </div>
  );
} 