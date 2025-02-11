'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../../components/Navigation';
import { Company } from '@/app/lib/companyDatabase';
import { Search } from 'lucide-react';
import Image from 'next/image';

export default function EditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    sector: '',
    size: '',
    background: '',
    primaryColor: '#4B5563',
    secondaryColor: '#F3F4F6'
  });
  const [logoSearchQuery, setLogoSearchQuery] = useState('');
  const [isSearchingLogo, setIsSearchingLogo] = useState(false);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const { id } = await params;
        const response = await fetch(`/api/companies/${id}`);
        if (response.ok) {
          const data = await response.json();
          setCompany(data);
          setFormData({
            name: data.name || '',
            website: data.website || '',
            sector: data.sector || '',
            size: data.size || '',
            background: data.background || '',
            primaryColor: data.primaryColor || '#4B5563',
            secondaryColor: data.secondaryColor || '#F3F4F6'
          });
        }
      } catch (error) {
        console.error('Error fetching company:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCompany();
  }, [params]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/companies/${company.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push(`/companies/${company.id}`);
      }
    } catch (error) {
      console.error('Error updating company:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const { url } = await response.json();
        setFormData(prev => ({
          ...prev,
          logo: url
        }));
        
        // Update the company immediately
        await fetch(`/api/companies/${company.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ logo: url }),
        });
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
    }
  };

  const handleLogoSearch = async () => {
    if (!logoSearchQuery.trim() || !company) return;
    
    setIsSearchingLogo(true);
    try {
      const response = await fetch('/api/logo-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: logoSearchQuery }),
      });

      if (response.ok) {
        const { url } = await response.json();
        setFormData(prev => ({
          ...prev,
          logo: url
        }));
        
        // Update the company immediately
        await fetch(`/api/companies/${company.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ logo: url }),
        });
      }
    } catch (error) {
      console.error('Error searching for logo:', error);
    } finally {
      setIsSearchingLogo(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Company not found</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Company</h1>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
            <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Logo
                  </label>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {company.logo ? (
                        <Image 
                          src={company.logo} 
                          alt="Company logo preview"
                          className="h-20 w-20 object-contain rounded bg-white"
                        />
                      ) : (
                        <div 
                          className="h-20 w-20 rounded flex items-center justify-center"
                          style={{
                            backgroundColor: company.secondaryColor || '#F3F4F6',
                            color: company.primaryColor || '#4B5563'
                          }}
                        >
                          <span className="text-2xl font-medium">
                            {company.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-grow space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Upload Logo
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="block w-full text-sm text-gray-500 dark:text-gray-400
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-medium
                            file:bg-blue-50 file:text-blue-700
                            dark:file:bg-blue-900 dark:file:text-blue-300
                            hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Or Search for Logo
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={logoSearchQuery}
                            onChange={(e) => setLogoSearchQuery(e.target.value)}
                            placeholder="Search for company logo..."
                            className="flex-grow border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={handleLogoSearch}
                            disabled={isSearchingLogo}
                            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            {isSearchingLogo ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            ) : (
                              <Search className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    id="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="sector" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sector
                  </label>
                  <input
                    type="text"
                    name="sector"
                    id="sector"
                    value={formData.sector}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="size" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Size
                  </label>
                  <input
                    type="text"
                    name="size"
                    id="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Primary Color
                    </label>
                    <input
                      type="color"
                      name="primaryColor"
                      id="primaryColor"
                      value={formData.primaryColor}
                      onChange={handleInputChange}
                      className="mt-1 block w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label htmlFor="secondaryColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Secondary Color
                    </label>
                    <input
                      type="color"
                      name="secondaryColor"
                      id="secondaryColor"
                      value={formData.secondaryColor}
                      onChange={handleInputChange}
                      className="mt-1 block w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-800"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="background" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Background
                  </label>
                  <textarea
                    name="background"
                    id="background"
                    rows={4}
                    value={formData.background}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 