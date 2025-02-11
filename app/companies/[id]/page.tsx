  'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';
import LogoEditorModal from '../../components/LogoEditorModal';
import { Company, Client } from '@/app/lib/companyDatabase';
import { Edit, Plus, Search, Trash2 } from 'lucide-react';
import Image from 'next/image';

export default function CompanyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContacts, setFilteredContacts] = useState<Client[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isLogoEditorOpen, setIsLogoEditorOpen] = useState(false);

 

  useEffect(() => {
    const fetchCompanyAndContacts = async () => {
      try {
        const { id } = await params;
        const [companyResponse, contactsResponse] = await Promise.all([
          fetch(`/api/companies/${id}`),
          fetch(`/api/companies/${id}/contacts`)
        ]);
  
        if (companyResponse.ok) {
          const companyData = await companyResponse.json();
          setCompany(companyData);
        }
  
        if (contactsResponse.ok) {
          const contactsData = await contactsResponse.json();
          setContacts(contactsData);
          setFilteredContacts(contactsData);
        }
      } catch (error) {
        console.error('Error fetching company details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCompanyAndContacts();
  }, [params]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredContacts(
        contacts.filter(
          contact =>
            contact.name.toLowerCase().includes(query) ||
            contact.email?.toLowerCase().includes(query) ||
            contact.role?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, contacts]);

 

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      const response = await fetch(`/api/clients/${contactId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setContacts(contacts.filter(c => c.id !== contactId));
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  const handleEditField = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value);
  };

  const handleSaveField = async () => {
    if (!company || !editingField) return;

    try {
      const response = await fetch(`/api/companies/${company.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [editingField]: editValue
        }),
      });

      if (response.ok) {
        const updatedCompany = await response.json();
        setCompany(updatedCompany);
      }
    } catch (error) {
      console.error('Error updating company:', error);
    } finally {
      setEditingField(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveField();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    try {
      const response = await fetch(`/api/companies/${companyId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        router.push('/companies');
      }
    } catch (error) {
      console.error('Error deleting company:', error);
    }
  };

  const handleLogoSave = async (logoUrl: string) => {
    if (!company) return;
    
    try {
      const response = await fetch(`/api/companies/${company.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logo: logoUrl }),
      });

      if (response.ok) {
        const updatedCompany = await response.json();
        setCompany(updatedCompany);
      }
    } catch (error) {
      console.error('Error updating company logo:', error);
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
          {/* Company Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <div 
                onClick={() => handleEditField('name', company.name)}
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
              >
                {editingField === 'name' ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSaveField}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="text-3xl font-bold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                  />
                ) : (
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{company.name}</h1>
                )}
              </div>
              <div 
                onClick={() => handleEditField('website', company.website || '')}
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded mt-1"
              >
                {editingField === 'website' ? (
                  <input
                    type="url"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSaveField}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                  />
                ) : (
                  company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {company.website}
                    </a>
                  )
                )}
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this company?')) {
                    handleDeleteCompany(company.id);
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>

          {/* Company Details */}
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Company Details</h3>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Logo</dt>
                  <dd className="mt-1 flex-shrink-0">
                    <div 
                      onClick={() => setIsLogoEditorOpen(true)}
                      className="cursor-pointer group relative"
                    >
                      {company.logo ? (
                        <Image 
                          src={company.logo} 
                          alt={`${company.name} logo`}
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
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded flex items-center justify-center">
                        <Edit className="hidden group-hover:block w-6 h-6 text-gray-700 dark:text-gray-300" />
                      </div>
                    </div>
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Sector</dt>
                  <dd 
                    onClick={() => handleEditField('sector', company.sector || '')}
                    className="mt-1 text-sm text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
                  >
                    {editingField === 'sector' ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleSaveField}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                      />
                    ) : (
                      company.sector || '-'
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Size</dt>
                  <dd 
                    onClick={() => handleEditField('size', company.size || '')}
                    className="mt-1 text-sm text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
                  >
                    {editingField === 'size' ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleSaveField}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                      />
                    ) : (
                      company.size || '-'
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Brand Colors</dt>
                  <dd className="mt-1 flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="color"
                        value={editingField === 'primaryColor' ? editValue : (company.primaryColor || '#000000')}
                        onChange={(e) => {
                          setEditingField('primaryColor');
                          setEditValue(e.target.value);
                          handleSaveField();
                        }}
                        className="w-8 h-8 rounded border border-gray-200 dark:border-gray-600 cursor-pointer"
                      />
                      <input 
                        type="color"
                        value={editingField === 'secondaryColor' ? editValue : (company.secondaryColor || '#ffffff')}
                        onChange={(e) => {
                          setEditingField('secondaryColor');
                          setEditValue(e.target.value);
                          handleSaveField();
                        }}
                        className="w-8 h-8 rounded border border-gray-200 dark:border-gray-600 cursor-pointer"
                      />
                    </div>
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Background</dt>
                  <dd 
                    onClick={() => handleEditField('background', company.background || '')}
                    className="mt-1 text-sm text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
                  >
                    {editingField === 'background' ? (
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleSaveField}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSaveField();
                          } else if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                        autoFocus
                        rows={4}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                      />
                    ) : (
                      company.background || '-'
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Contacts Section */}
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Contacts</h3>
              <button
                onClick={() => router.push(`/companies/${company.id}/contacts/new`)}
                className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Contact
              </button>
            </div>
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="max-w-lg w-full lg:max-w-xs">
                <label htmlFor="search" className="sr-only">Search contacts</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="search"
                    name="search"
                    id="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Search contacts..."
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Phone
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredContacts.map((contact) => (
                    <tr key={contact.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{contact.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{contact.role || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {contact.email ? (
                          <a 
                            href={`mailto:${contact.email}`}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {contact.email}
                          </a>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {contact.phone ? (
                          <a 
                            href={`tel:${contact.phone}`}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {contact.phone}
                          </a>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => router.push(`/companies/${company.id}/contacts/${contact.id}/edit`)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-4"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteContact(contact.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredContacts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        {searchQuery ? 'No contacts found matching your search.' : 'No contacts added yet.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Logo Editor Modal */}
      <LogoEditorModal
        isOpen={isLogoEditorOpen}
        onClose={() => setIsLogoEditorOpen(false)}
        onSave={handleLogoSave}
        currentLogo={company.logo}
        companyName={company.name}
        primaryColor={company.primaryColor}
        secondaryColor={company.secondaryColor}
      />
    </div>
  );
} 