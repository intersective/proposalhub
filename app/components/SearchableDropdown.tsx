'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
// import { useDebounce } from 'use-debounce';
import { Sparkles } from 'lucide-react';

export interface Option {
  id: string;
  name: string;
  [key: string]: string | Date | undefined;
}

interface SearchableDropdownProps {
  value: Option | null;
  onChange: (option: Option | null) => void;
  onSearch: (query: string) => Promise<Option[]>;
  onAISearch?: (query: string) => Promise<void>;
  showValidation?: boolean;
  onValidate?: (isValid: boolean) => void;
  onSearchAgain?: () => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

export default function SearchableDropdown({
  value,
  onChange,
  onSearch,
  onAISearch,
  // showValidation = false,
  // onValidate,
  // onSearchAgain,
  placeholder = 'Search...',
  label,
  // disabled = false
}: SearchableDropdownProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setQuery(value.name);
    }
  }, [value]);

  const handleSearch = useCallback(async (searchQuery: string) => {
    setQuery(searchQuery);
    if (!searchQuery.trim()) {
      setOptions([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await onSearch(searchQuery);
      setOptions(results);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsSearching(false);
    }
  }, [onSearch]);

  const handleAISearch = useCallback(async () => {
    if (!query.trim() || !onAISearch) return;

    setIsSearching(true);
    try {
      await onAISearch(query);
    } catch (error) {
      console.error('Error performing AI search:', error);
    } finally {
      setIsSearching(false);
    }
  }, [query, onAISearch]);

  const handleSelect = (option: Option | null) => {
    onChange(option);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleCancel = () => {
      if (value) {
        setQuery(value.name);
      } else {
        setQuery('');
      }
      setIsOpen(false);
    };
  
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        handleCancel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            handleSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white pr-20"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          {isSearching ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          ) : (
            query && (
              <button
                onClick={handleAISearch}
                className="text-blue-500 hover:text-blue-600 focus:outline-none"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            )
          )}
        </div>
      </div>
      {isOpen && options.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <div className="font-medium text-gray-900 dark:text-white">{option.name}</div>
              {option.website && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {String(option.website)}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 