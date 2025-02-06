import { Message } from './types';

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
  onCancel?: () => void;
  onReplace?: (sectionId: string, content: string) => void;
  onAppend?: (sectionId: string, content: string) => void;
  onRefine?: (sectionId: string) => void;
}

export default function ChatMessage({ 
  message, 
  isLoading, 
  onCancel,
  onReplace,
  onAppend,
  onRefine 
}: ChatMessageProps) {
  const getProgressBar = () => {
    if (!message.progress) return null;
    const percentage = Math.round((message.progress.current / message.progress.total) * 100);
    
    return (
      <div className="mt-2">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>{message.progress.message}</span>
          <span>{percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] rounded-lg p-4 ${
        message.role === 'user' 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
      }`}>
        <div className="prose dark:prose-invert max-w-none">
          {message.content}
          {message.progress && getProgressBar()}
          {message.suggestion && (
            <div className="mt-4 border-t border-gray-300 dark:border-gray-600 pt-4">
              <div className="bg-white dark:bg-gray-800 rounded-md p-3">
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-3">
                  {message.suggestion.content}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onReplace?.(message.suggestion?.sectionId || '', message.suggestion?.content || '')}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Replace
                    </button>
                    <button
                      onClick={() => onAppend?.(message.suggestion?.sectionId || '', message.suggestion?.content || '')}
                      className="px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600"
                    >
                      Append
                    </button>
                    <button
                      onClick={() => onRefine?.(message.suggestion?.sectionId || '')}
                      className="px-3 py-1 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600"
                    >
                      Refine
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {isLoading && onCancel && (
          <button
            onClick={onCancel}
            className="mt-2 text-sm px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}