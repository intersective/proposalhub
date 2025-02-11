import { Message, MODEL_OPTIONS } from './types';
import { marked } from 'marked';
import { useEffect, useState } from 'react';

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
  onCancel?: () => void;
  onReplace?: (sectionId: string, content: string) => void;
  onAppend?: (sectionId: string, content: string) => void;
  onRefine?: (sectionId: string) => void;
  currentModel: string;
  onModelChange: (model: string) => void;
  isDraft?: boolean;
  isImprovable?: boolean;
}

export default function ChatMessage({ 
  message, 
  isLoading, 
  onCancel,
  onReplace,
  onAppend,
  onRefine,
  currentModel,
  onModelChange,
  isDraft = false,
  isImprovable = false
}: ChatMessageProps) {
  const [renderedContent, setRenderedContent] = useState<string>(message.content);
  const [renderedSuggestion, setRenderedSuggestion] = useState<string>(message.suggestion?.content || '');

  const renderMarkdown = (content: string) => {
    try {
      const parsed = marked.parse(content);
      return typeof parsed === 'string' ? parsed : content;
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return content;
    }
  };

  useEffect(() => {
    // Always render markdown for all messages
    setRenderedContent(renderMarkdown(message.content));

    if (message.suggestion?.content) {
      setRenderedSuggestion(renderMarkdown(message.suggestion.content));
    }
  }, [message]);

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
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4 w-full`}>
      <div className={`${
        message.role === 'user' 
          ? 'max-w-[70%] bg-blue-600 text-white' 
          : 'max-w-[85%] bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
      } rounded-lg p-4 ${isDraft ? 'border-2 border-yellow-400 dark:border-yellow-600' : ''}`}>
        <div 
          className="prose dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:mt-4 [&>h2]:mb-2 [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mt-3 [&>h3]:mb-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>li]:mt-1 [&>li]:mb-1"
          dangerouslySetInnerHTML={{ __html: renderedContent }}
        />
        {message.progress && getProgressBar()}
        {message.suggestion && (
          <div className="mt-4 border-t border-gray-300 dark:border-gray-600 pt-4">
            <div className="bg-white dark:bg-gray-800 rounded-md p-4">
              <div 
                className="prose dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:mt-4 [&>h2]:mb-2 [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mt-3 [&>h3]:mb-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>li]:mt-1 [&>li]:mb-1"
                dangerouslySetInnerHTML={{ __html: renderedSuggestion }}
              />
            </div>
            <div className="mt-4 flex flex-col space-y-3">
              <div className="flex space-x-3">
                <button
                  onClick={() => onReplace?.(message.suggestion?.sectionId || '', message.suggestion?.content || '')}
                  className={`px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 flex-1 ${
                    isDraft ? 'border-2 border-yellow-400 dark:border-yellow-600' : ''
                  }`}
                >
                  {isDraft ? 'Save Draft' : 'Replace Section'}
                </button>
                {!isDraft && (
                  <button
                    onClick={() => onAppend?.(message.suggestion?.sectionId || '', message.suggestion?.content || '')}
                    className="px-4 py-2 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 flex-1"
                  >
                    Append to Section
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <select
                  value={currentModel}
                  onChange={(e) => onModelChange(e.target.value)}
                  className="flex-1 p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  {MODEL_OPTIONS.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => onRefine?.(message.suggestion?.sectionId || '')}
                  className={`px-4 py-2 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600 flex-1 ${
                    isImprovable ? 'animate-pulse' : ''
                  }`}
                >
                  Refine
                </button>
              </div>
            </div>
          </div>
        )}
        {isLoading && onCancel && !message.content.includes('Analyzing section and generating improvements') && (
          <button
            onClick={onCancel}
            className="mt-2 text-sm px-3 py-1 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}