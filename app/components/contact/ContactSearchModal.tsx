import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Search, X, UserPlus } from 'lucide-react';
import { Contact } from '@/app/types/contact';
import Image from 'next/image';
import { useDebounce } from '@/app/hooks/useDebounce';

interface ContactSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (contact: Contact) => void;
  onCreateNew: () => void;
  organizationId: string;
}

export default function ContactSearchModal({
  isOpen,
  onClose,
  onSelect,
  onCreateNew,
  organizationId
}: ContactSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    const searchContacts = async () => {
      if (!debouncedSearchTerm) {
        setContacts([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/contacts/search?q=${encodeURIComponent(debouncedSearchTerm)}&organizationId=${organizationId}`
        );
        if (response.ok) {
          const data = await response.json();
          setContacts(data);
        }
      } catch (error) {
        console.error('Error searching contacts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    searchContacts();
  }, [debouncedSearchTerm, organizationId]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
              Add to Team
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search contacts..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="mt-6 space-y-2 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                </div>
              ) : contacts.length > 0 ? (
                contacts.map(contact => (
                  <div
                    key={contact.id}
                    onClick={() => onSelect(contact)}
                    className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                  >
                    <div className="relative h-12 w-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-600 mr-4">
                      {contact.imageUrl ? (
                        <Image
                          src={contact.imageUrl}
                          alt={contact.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <span className="text-xl text-gray-400 dark:text-gray-500">
                            {contact.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">{contact.name}</h3>
                      {contact.title && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{contact.title}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : searchTerm ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No contacts found</p>
                  <button
                    onClick={onCreateNew}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create New Member
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 