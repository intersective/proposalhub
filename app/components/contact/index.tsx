'use client';

import { useState, useEffect } from 'react';
import { Contact } from '@/app/types/contact';
import { Option } from '../shared/SearchableDropdown';
import SearchableDropdown from '../shared/SearchableDropdown';

interface ContactSectionProps {
  value: Partial<Contact>;
  onChange: (value: Partial<Contact>) => void;
  editable?: boolean;
  onContactSearch?: (query: string) => Promise<Option[]>;
}

export default function ContactSection({ 
  value, 
  onChange, 
  editable = true,
  onContactSearch
}: ContactSectionProps) {
  const [showForm, setShowForm] = useState(!!value.id);

  useEffect(() => {
    setShowForm(!!value.id);
  }, [value.id]);

  const handleChange = (field: keyof Contact, fieldValue: string) => {
    onChange({
      ...value as Contact,
      [field]: fieldValue
    });
  };

  const handleContactSelect = (option: Option | null) => {
    if (!option) {
      onChange({} as Partial<Contact>);
      setShowForm(false);
      return;
    }
    const contactData = option.data as Contact;
    onChange({
      id: option.value,
      firstName: contactData.firstName || '',
      lastName: contactData.lastName || '',
      email: contactData.email || '',
      phone: contactData.phone || '',
      title: contactData.title || '',
      background: contactData.background || ''
    });
    setShowForm(true);
  };

  const handleSearchAgain = () => {
    onChange({});
    setShowForm(false);
  };

  const renderSearchForm = () => {
    if (showForm) {
      return (
        <div className="flex justify-end items-center mb-6">
          <button
            type="button"
            onClick={handleSearchAgain}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Change Contact
          </button>
        </div>
      );
    }

    return (   
      <div className="space-y-4">
        <SearchableDropdown
          value={null}
          onChange={(option) => {
            console.log('SearchableDropdown onChange:', option);
            handleContactSelect(option);
          }}
          onSearch={async (query) => {
            console.log('SearchableDropdown onSearch:', query);
            if (onContactSearch) {
              const results = await onContactSearch(query);
              console.log('Search results:', results);
              return results;
            }
            return [];
          }}
          placeholder="Search for a contact..."
          label="Contact"
        />
      </div>
    );
  };

  const renderFields = () => {
    if (showForm) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                id="firstName"
                value={value.firstName || ''}
                onChange={(e) => handleChange('firstName', e.target.value)}
                disabled={!editable}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:disabled:bg-gray-900"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                id="lastName"
                value={value.lastName || ''}
                onChange={(e) => handleChange('lastName', e.target.value)}
                disabled={!editable}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:disabled:bg-gray-900"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={value.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={!editable}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:disabled:bg-gray-900"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              id="phone"
              value={value.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              disabled={!editable}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:disabled:bg-gray-900"
            />
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Job Title
            </label>
            <input
              type="text"
              name="title"
              id="title"
              value={value.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              disabled={!editable}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:disabled:bg-gray-900"
            />
          </div>

          <div>
            <label htmlFor="background" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Background
            </label>
            <textarea
              id="background"
              name="background"
              rows={3}
              value={value.background || ''}
              onChange={(e) => handleChange('background', e.target.value)}
              disabled={!editable}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:disabled:bg-gray-900"
            />
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {renderSearchForm()}
      {renderFields()}
    </div>
  );
}
