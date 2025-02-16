'use client';

import { useState } from 'react';
import { marked } from 'marked';
import { MODEL_OPTIONS } from '../chat/types';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalContent: string;
  newContent: string;
  onReplace: () => void;
  onAppend: () => void;
  onRetry: () => void;
  currentModel: string;
  onModelChange: (model: string) => void;
}

export default function ComparisonModal({
  isOpen,
  onClose,
  originalContent,
  newContent,
  onReplace,
  onAppend,
  onRetry,
  currentModel,
  onModelChange
}: ComparisonModalProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  if (!isOpen) return null;

  const handleRetry = async () => {
    setIsRetrying(true);
    await onRetry();
    setIsRetrying(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Compare Changes</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-2 gap-4 h-full">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 overflow-auto">
              <h4 className="font-medium mb-2">Original</h4>
              <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: marked.parse(originalContent) }} />
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 overflow-auto">
              <h4 className="font-medium mb-2">Improved</h4>
              {isRetrying ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">Generating new improvement...</p>
                </div>
              ) : (
                <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: marked.parse(newContent) }} />
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-3">
            <button
              onClick={onReplace}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Replace
            </button>
            <button
              onClick={onAppend}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Append
            </button>
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50"
            >
              {isRetrying ? 'Retrying...' : 'Retry'}
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Model:</span>
            <select
              value={currentModel}
              onChange={(e) => onModelChange(e.target.value)}
              className="p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900"
            >
              {MODEL_OPTIONS.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
} 