import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';

interface LinkedInAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

export default function LinkedInAuthDialog({
  isOpen,
  onClose,
  onAuthenticated
}: LinkedInAuthDialogProps) {
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Get the auth URL from our API
      fetch('/api/linkedin/web/auth-url')
        .then(res => res.json())
        .then(data => setAuthUrl(data.url))
        .catch(() => setError('Failed to start authentication'));
    }
  }, [isOpen]);

  // Listen for messages from the popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'LINKEDIN_AUTH_SUCCESS') {
        onAuthenticated();
        onClose();
      } else if (event.data.type === 'LINKEDIN_AUTH_ERROR') {
        setError('Authentication failed. Please try again.');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onAuthenticated, onClose]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
              LinkedIn Authentication
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {error ? (
              <div className="text-red-500 dark:text-red-400">
                {error}
              </div>
            ) : authUrl ? (
              <div className="text-center">
                <p className="mb-4 text-gray-600 dark:text-gray-300">
                  Please log in to LinkedIn to continue. A new window will open for authentication.
                </p>
                <button
                  onClick={() => {
                    const width = 600;
                    const height = 700;
                    const left = window.screen.width / 2 - width / 2;
                    const top = window.screen.height / 2 - height / 2;
                    
                    window.open(
                      authUrl,
                      'linkedin-auth',
                      `width=${width},height=${height},top=${top},left=${left}`
                    );
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#0A66C2] hover:bg-[#004182] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A66C2]"
                >
                  Log in with LinkedIn
                </button>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 