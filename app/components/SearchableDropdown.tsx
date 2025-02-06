'use client';

import { useState, useEffect, useRef } from 'react';
import { useDebounce } from 'use-debounce';

export interface Option {
  id: string;
  name: string;
  [key: string]: string;
}

interface SearchableDropdownProps {
  value: Option | null;
  onChange: (option: Option | null) => void;
  onSearch: (query: string) => Promise<Option[]>;
  onAISearch?: (query: string) => Promise<void>;
  showValidation?: boolean;
  onValidate?: (isValid: boolean) => void;
  onSearchAgain?: () => void;
  placeholder: string;
  label: string;
  disabled?: boolean;
}

export default function SearchableDropdown({
  value,
  onChange,
  onSearch,
  onAISearch,
  showValidation = false,
  onValidate,
  onSearchAgain,
  placeholder,
  label,
  disabled = false
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [options, setOptions] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastSearchTerm = useRef<string>('');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchOptions = async () => {
      if (!debouncedSearchTerm) {
        setOptions([]);
        return;
      }

      setIsLoading(true);
      try {
        const results = await onSearch(debouncedSearchTerm);
        setOptions(results);
        if (results.length === 0) {
          lastSearchTerm.current = debouncedSearchTerm;
        }
      } catch (error) {
        console.error('Error searching options:', error);
      } finally {
        setIsLoading(false);
      }
    };

    searchOptions();
  }, [debouncedSearchTerm, onSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  const handleOptionClick = (option: Option) => {
    onChange(option);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleAISearch = async () => {
    if (!searchTerm || !onAISearch) return;
    
    setIsSearching(true);
    try {
      await onAISearch(searchTerm);
      lastSearchTerm.current = searchTerm;
      setSearchTerm('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error performing AI search:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onAISearch) {
      e.preventDefault();
      handleAISearch();
    }
  };

  const handleSearchAgain = () => {
    if (onSearchAgain) {
      onSearchAgain();
    } else {
      setSearchTerm(lastSearchTerm.current);
      setIsOpen(true);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <div className="relative flex">
        <input
          type="text"
          className={`flex-1 p-2 border rounded-l-md ${
            disabled ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'
          } ${onAISearch ? 'rounded-r-none' : 'rounded-r-md'} text-gray-900 dark:text-white border-gray-300 dark:border-gray-600`}
          placeholder={placeholder}
          value={searchTerm || value?.name || ''}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled || showValidation}
        />
        {onAISearch && !showValidation && (
          <button
            onClick={handleAISearch}
            disabled={!searchTerm || isSearching}
            className={`px-4 py-2 border border-l-0 rounded-r-md ${
              isSearching || !searchTerm
                ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800'
            } border-gray-300 dark:border-gray-600`}
          >
            {isSearching ? (
              <div className="w-5 h-5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              'Search'
            )}
          </button>
        )}
        {value && !showValidation && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            onClick={() => {
              onChange(null);
              setSearchTerm('');
            }}
          >
            ×
          </button>
        )}
      </div>
      
      {isOpen && !showValidation && (searchTerm || options.length > 0) && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 shadow-lg rounded-md border border-gray-300 dark:border-gray-600">
          {isLoading ? (
            <div className="p-2 text-gray-500 dark:text-gray-400">Loading...</div>
          ) : options.length > 0 ? (
            <ul className="max-h-60 overflow-auto">
              {options.map(option => (
                <li
                  key={option.id}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-gray-900 dark:text-white"
                  onClick={() => handleOptionClick(option)}
                >
                  {option.name}
                </li>
              ))}
            </ul>
          ) : searchTerm ? (
            <div className="p-2 text-gray-500 dark:text-gray-400">
              No matches found. Press Enter or click Search to try AI search.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
} 