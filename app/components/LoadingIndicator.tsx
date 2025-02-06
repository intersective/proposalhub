'use client';

interface LoadingIndicatorProps {
  onCancel: () => void;
}

export default function LoadingIndicator({ onCancel }: LoadingIndicatorProps) {
  return (
    <div className="flex items-center space-x-3 bg-blue-50 p-3 rounded-lg">
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
      <span className="text-blue-600">AI is thinking...</span>
      <button
        onClick={onCancel}
        className="px-2 py-1 text-xs bg-white text-blue-600 rounded hover:bg-blue-100"
      >
        Cancel
      </button>
    </div>
  );
} 