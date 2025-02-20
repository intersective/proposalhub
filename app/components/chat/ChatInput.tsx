import { useState, KeyboardEvent } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { ExpandIcon } from 'lucide-react';

interface ChatInputProps {
  onSubmit: (content: string, files?: File[]) => void;
  disabled?: boolean;
  currentSection?: string | null;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onFocus?: () => void;
}

export default function ChatInput({ 
  onSubmit, 
  disabled = false, 
  currentSection, 
  isExpanded = false, 
  onToggleExpand,
  onFocus 
}: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSubmit(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFocus = () => {
    onFocus?.();
  };

  return (
    <div className="flex space-x-2 p-3">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        disabled={disabled}
        placeholder={currentSection ? "Type your improvement suggestions..." : "Type your message..."}
        className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
        rows={1}
      />
      {/* Expand/collapse toggle button */}
      <button
        onClick={onToggleExpand}
        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed sm:hidden"
      >
        <ExpandIcon className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={!message.trim() || disabled}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <PaperAirplaneIcon className="w-4 h-4" />
      </button>
    </div>
  );
} 