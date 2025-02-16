'use client';

import { useState, useEffect, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import { Sparkles } from 'lucide-react';

export interface Option {
  label: string;
  value: string;
  html?: string;
  data?: unknown;
  [key: string]: string | Date | unknown | undefined;
}

interface SearchableDropdownProps {
  value: Option | null;
  onChange: (option: Option | null) => void;
  onSearch: (query: string) => Promise<Option[]>;
  onAISearch?: (query: string) => Promise<void>;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

export default function SearchableDropdown({
  value,
  onChange,
  onSearch,
  onAISearch,
  placeholder = 'Search...',
  label,
  disabled = false
}: SearchableDropdownProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [debouncedQuery] = useDebounce(query, 500);

  useEffect(() => {
    if (value) {
      setQuery(value.label);
    }
  }, [value]);

  useEffect(() => {
    const search = async () => {
      if (!debouncedQuery.trim()) {
        setOptions([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await onSearch(debouncedQuery);
        setOptions(results);
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setIsSearching(false);
      }
    };

    search();
  }, [debouncedQuery, onSearch]);

  const handleSelect = (option: Option | null) => {
    onChange(option);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleCancel = () => {
      if (value) {
        setQuery(value.label);
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
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white pr-20 disabled:bg-gray-100 dark:disabled:bg-gray-800"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          {isSearching && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          )}
        </div>
      </div>
      {isOpen && (options.length > 0 || onAISearch) && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {option.html ? (
                <div dangerouslySetInnerHTML={{ __html: option.html }} />
              ) : (
                <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
              )}
            </button>
          ))}
          {onAISearch && query && (
            <button
              onClick={() => {
                onAISearch(query);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-gray-700 flex items-center text-blue-600 dark:text-blue-400"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              <span>Search with AI</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
} 