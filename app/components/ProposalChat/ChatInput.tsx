import { useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';

interface ChatInputProps {
  onSubmit: (content: string, files?: File[]) => void;
  disabled?: boolean;
  currentSection: string | null;
}

export default function ChatInput({ onSubmit, disabled, currentSection }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'text/markdown': ['.md']
    },
    onDrop: (acceptedFiles) => {
      setFiles(acceptedFiles);
    },
    disabled: disabled
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || (!message.trim() && files.length === 0)) return;

    onSubmit(message, files);
    setMessage('');
    setFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
      {currentSection && (
        <div className="mb-2 text-sm text-gray-500">
          Improving section: {currentSection}
        </div>
      )}
      
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            adjustTextareaHeight();
          }}
          onKeyDown={handleKeyDown}
          placeholder={currentSection 
            ? "How would you like to improve this section?" 
            : "Type a message or drop a file..."
          }
          disabled={disabled}
          className="w-full p-3 pr-24 max-h-32 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
          rows={1}
        />
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-2">
          <div {...getRootProps()} className="cursor-pointer">
            <input {...getInputProps()} />
            <button
              type="button"
              disabled={disabled}
              className={`p-2 rounded-full ${
                isDragActive || files.length > 0
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
          </div>
          
          <button
            type="submit"
            disabled={disabled || (!message.trim() && files.length === 0)}
            className={`p-2 rounded-full ${
              disabled || (!message.trim() && files.length === 0)
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
      
      {files.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center space-x-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm"
            >
              <span className="truncate max-w-xs">{file.name}</span>
              <button
                type="button"
                onClick={() => setFiles(files.filter((_, i) => i !== index))}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </form>
  );
} 