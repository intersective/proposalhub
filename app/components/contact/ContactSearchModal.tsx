import { useState, useEffect } from 'react';
import { Contact } from '@/app/types/contact';
import { Search, Plus, Loader2 } from 'lucide-react';

interface ContactSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (contact: Contact) => void;
  organizationId: string;
}

export default function ContactSearchModal({
  isOpen,
  onClose,
  onSelect,
  organizationId
}: ContactSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newContact, setNewContact] = useState<Partial<Contact>>({
    organizationId,
    firstName: '',
    lastName: '',
    email: '',
    title: '',
    phone: '',
    linkedIn: '',
    background: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen && searchQuery) {
      const searchContacts = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/contacts/search?organizationId=${organizationId}&q=${encodeURIComponent(searchQuery)}`);
          if (response.ok) {
            const data = await response.json();
            setSearchResults(data);
          }
        } catch (error) {
          console.error('Error searching contacts:', error);
        } finally {
          setIsLoading(false);
        }
      };

      const timeoutId = setTimeout(searchContacts, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, organizationId, isOpen]);

  const handleCreateContact = async () => {
    setIsCreating(true);
    try {
      const response = await fetch(`/api/organizations/${organizationId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact)
      });

      if (response.ok) {
        const contact = await response.json();
        onSelect(contact);
        onClose();
      }
    } catch (error) {
      console.error('Error creating contact:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAIExtract = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: searchQuery,
          type: 'contact'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to extract contact info');
      }

      const { contactInfo } = await response.json();
      setNewContact(prev => ({
        ...prev,
        firstName: contactInfo.name?.split(' ')[0] || '',
        lastName: contactInfo.name?.split(' ').slice(1).join(' ') || '',
        email: contactInfo.email || '',
        phone: contactInfo.phone || '',
        title: contactInfo.role || '',
        linkedIn: contactInfo.linkedIn || '',
        background: contactInfo.background || ''
      }));
      setShowCreateForm(true);
    } catch (error) {
      console.error('Error extracting contact info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Search Contacts</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>

        <div className="relative mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts or paste contact information..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
          />
          {searchQuery && !showCreateForm && (
            <button
              onClick={handleAIExtract}
              className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
              title="Extract contact information"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : showCreateForm ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input
                    type="text"
                    value={newContact.firstName}
                    onChange={(e) => setNewContact(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newContact.lastName}
                    onChange={(e) => setNewContact(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={newContact.title}
                  onChange={(e) => setNewContact(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={newContact.phone}
                  onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">LinkedIn</label>
                <input
                  type="url"
                  value={newContact.linkedIn}
                  onChange={(e) => setNewContact(prev => ({ ...prev, linkedIn: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Background</label>
                <textarea
                  value={newContact.background}
                  onChange={(e) => setNewContact(prev => ({ ...prev, background: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {searchResults.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => onSelect(contact)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">{contact.firstName} {contact.lastName}</div>
                    <div className="text-sm text-gray-500">{contact.email}</div>
                    {contact.title && (
                      <div className="text-sm text-gray-500">{contact.title}</div>
                    )}
                  </div>
                  <div className="text-blue-500 hover:text-blue-600">Select</div>
                </button>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No contacts found</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Contact
              </button>
            </div>
          ) : null}
        </div>

        {showCreateForm && (
          <div className="mt-4 flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateContact}
              disabled={isCreating}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create Contact'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 