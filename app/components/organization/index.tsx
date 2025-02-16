'use client';

import { useState, useEffect } from 'react';
import { Organization } from '@/app/types/organization';
import { Option } from '../shared/SearchableDropdown';
import SearchableDropdown from '../shared/SearchableDropdown';
import Image from 'next/image';
import LogoEditorModal from '../editor/LogoEditorModal';

interface OrganizationSectionProps {
  value: Partial<Organization>;
  onChange: (value: Partial<Organization>) => void;
  editable?: boolean;
  onOrganizationSearch?: (query: string) => Promise<Option[]>;
  onOrganizationAISearch?: (query: string) => Promise<void>;
  onLogoClick?: () => void;
}

export default function OrganizationSection({ 
  value, 
  onChange, 
  editable = true,
  onOrganizationSearch,
  onOrganizationAISearch,
  onLogoClick
}: OrganizationSectionProps) {
  const [showForm, setShowForm] = useState(!!value.id);

  useEffect(() => {
    setShowForm(!!value.id);
  }, [value.id]);

  const handleChange = (field: keyof Organization, fieldValue: string) => {
    onChange({
      ...value as Organization,
      [field]: fieldValue
    });
  };

  const handleOrganizationSelect = (option: Option | null) => {
    if (!option) {
      onChange({} as Partial<Organization>);
      setShowForm(false);
      return;
    }
    if (option.value === 'search-with-ai') {
      if (onOrganizationAISearch) {
        onOrganizationAISearch(option.query?.toString() || '');
      }
      return;
    } 
    const orgData = option.data as Organization;
    onChange({
      id: option.value,
      name: option.label,
      website: orgData.website || '',
      sector: orgData.sector || '',
      size: orgData.size || '',
      background: orgData.background || '',
      primaryColor: orgData.primaryColor || '',
      secondaryColor: orgData.secondaryColor || '',
      logoUrl: orgData.logoUrl || ''
    });
    setShowForm(true);
  };

  const handleSearchAgain = () => {
    onChange({});
    setShowForm(false);
  };

  const handleLogoSave = (logoUrl: string) => {
    onChange({
      ...value,
      logoUrl
    });
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
            Change Organization
          </button>
        </div>
      );
    }

    console.log('Rendering search form with onOrganizationSearch:', !!onOrganizationSearch);
    
    return (   
      <div className="space-y-4">
        <SearchableDropdown
          value={null}
          onChange={(option) => {
            console.log('SearchableDropdown onChange:', option);
            handleOrganizationSelect(option);
          }}
          onSearch={async (query) => {
            console.log('SearchableDropdown onSearch:', query);
            if (onOrganizationSearch) {
              const results = await onOrganizationSearch(query);
              console.log('Search results:', results);
              return results;
            }
            return [];
          }}
          onAISearch={onOrganizationAISearch}
          placeholder="Search for an organization..."
          label="Organization"
        />
      </div>
    );
  };

  const renderFields = () => {
    if (showForm) {
      return (
        <div className="space-y-6">
          {/* Basic Info */}
        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-4 gap-6">
            {/* Logo/Thumbnail */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Logo
              </label>
              <button
                onClick={onLogoClick}
                className="relative w-24 h-24 rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              >
                {value.logoUrl ? (
                  <Image 
                    src={value.logoUrl} 
                    alt={value.name || 'Organization logo'} 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                    <span className="text-3xl text-gray-400">
                      {value.name ? value.name.charAt(0).toUpperCase() : 'L'}
                    </span>
                  </div>
                )}
              </button>
            </div>
            <div className="col-span-3">
              {/* Name */}
              <div className="">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={value.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-white dark:bg-gray-800"
                  disabled={!editable}
                />
              </div>

              {/* Website */}
              <div className="mt-4">
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  id="website"
                  value={value.website || ''}
                  onChange={(e) => handleChange('website', e.target.value)}
                  className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-white dark:bg-gray-800"
                  disabled={!editable}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Sector and Size in a grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="sector" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Sector
            </label>
            <input
              type="text"
              id="sector"
              value={value.sector || ''}
              onChange={(e) => handleChange('sector', e.target.value)}
              className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-white dark:bg-gray-800"
              disabled={!editable}
            />
          </div>
          <div>
            <label htmlFor="size" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Company Size
            </label>
            <input
              type="text"
              id="size"
              value={value.size || ''}
              onChange={(e) => handleChange('size', e.target.value)}
              className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-white dark:bg-gray-800"
              disabled={!editable}
            />
          </div>
        </div>

        {/* Background */}
        <div>
          <label htmlFor="background" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Background
          </label>
          <textarea
            id="background"
            value={value.background || ''}
            onChange={(e) => handleChange('background', e.target.value)}
            rows={4}
            className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-white dark:bg-gray-800"
            disabled={!editable}
          />
        </div>

          {/* Colors in a grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Primary Color
              </label>
              <input
                type="color"
                id="primaryColor"
                value={value.primaryColor || '#000000'}
                onChange={(e) => handleChange('primaryColor', e.target.value)}
                className="block w-full h-10 rounded-md border-0 px-3 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-white dark:bg-gray-800"
                disabled={!editable}
              />
            </div>
            <div>
              <label htmlFor="secondaryColor" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Secondary Color
              </label>
              <input
                type="color"
                id="secondaryColor"
                value={value.secondaryColor || '#000000'}
                onChange={(e) => handleChange('secondaryColor', e.target.value)}
                className="block w-full h-10 rounded-md border-0 px-3 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-white dark:bg-gray-800"
                disabled={!editable}
              />
            </div>
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
      <LogoEditorModal
        isOpen={false}
        onClose={() => {}}
        onSave={handleLogoSave}
        currentLogo={value.logoUrl}
        organizationName={value.name || ''}
        primaryColor={value.primaryColor}
        secondaryColor={value.secondaryColor}
      />
    </div>
  );
}
