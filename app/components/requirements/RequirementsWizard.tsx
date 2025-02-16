'use client';

import { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import Wizard, { WizardStep } from '@/app/components/wizard';
import OrganizationSection from '@/app/components/organization';
import ContactSection from '@/app/components/contact';
import { Organization } from '@/app/types/organization';
import { Contact } from '@/app/types/contact';
import LogoEditorModal from '@/app/components/editor/LogoEditorModal';

interface RequirementsWizardProps {
  onComplete: (data: {
    organization: Organization;
    leadContact: Contact;
    initialContent: string;
    files?: File[];
  }) => void;
  existingOrganizationId?: string;
  existingContactId?: string;
}

export default function RequirementsWizard({ onComplete, existingOrganizationId, existingContactId }: RequirementsWizardProps) {
  const [organization, setOrganization] = useState<Partial<Organization>>({});
  const [leadContact, setLeadContact] = useState<Partial<Contact>>({});
  const [initialContent, setInitialContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!existingOrganizationId) {
        setShowSearch(true);
        return;
      }
      try {
        const response = await fetch(`/api/organizations/${existingOrganizationId}`);
        if (response.ok) {
          const data = await response.json();
          setOrganization(data);
          setShowSearch(false);
        } else {
          setShowSearch(true);
        }
      } catch (error) {
        console.error('Error fetching organization:', error);
        setShowSearch(true);
      }
    };

    fetchOrganization();
  }, [existingOrganizationId]);

  useEffect(() => {
    const fetchContact = async () => {
      if (!existingContactId) return;
      try {
        const response = await fetch(`/api/contacts/${existingContactId}`);
        if (response.ok) {
          const data = await response.json();
          setLeadContact(data);
        }
      } catch (error) {
        console.error('Error fetching contact:', error);
      }
    };

    fetchContact();
  }, [existingContactId]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const handleOrganizationAISearch = async (query: string) => {
    // You'll need to implement this function to handle AI search
    // For now, we'll just log the query
    console.log('AI Search:', query);
  };

  const handleLogoClick = () => {
    if (organization.name) {
      setIsLogoModalOpen(true);
    }
  };

  const handleLogoSave = (logoUrl: string) => {
    setOrganization(prev => ({ ...prev, logoUrl }));
    setIsLogoModalOpen(false);
  };

  const steps: WizardStep[] = [
    {
      id: 'organization',
      title: 'Customer',
      component: (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Customer Organization</h3>
          <div className="space-y-4">
            <OrganizationSection
              value={organization}
              onChange={setOrganization}
              editable={true}
              onOrganizationSearch={async (query) => {
                console.log('RequirementsWizard onOrganizationSearch:', query);
                const response = await fetch(`/api/organizations/search?query=${encodeURIComponent(query)}`);
                if (!response.ok) throw new Error('Failed to search organizations');
                const results = await response.json();
                console.log('RequirementsWizard search results:', results);
                return results;
              }}
              onOrganizationAISearch={handleOrganizationAISearch}
              onLogoClick={handleLogoClick}
            />
          </div>
          <LogoEditorModal
            isOpen={isLogoModalOpen}
            onClose={() => setIsLogoModalOpen(false)}
            onSave={handleLogoSave}
            currentLogo={organization.logoUrl}
            organizationName={organization.name || ''}
            primaryColor={organization.primaryColor}
            secondaryColor={organization.secondaryColor}
          />
        </div>
      ),
      onNext: async () => {
        try {
          // Always save/update the organization when proceeding
          const method = organization.id ? 'PUT' : 'POST';
          const url = organization.id ? `/api/organizations/${organization.id}` : '/api/organizations';
          
          const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(organization),
          });
          
          if (!response.ok) {
            throw new Error('Failed to save organization');
          }
          
          const savedOrg = await response.json();
          setOrganization(savedOrg);
          return true;
        } catch (error) {
          console.error('Error saving organization:', error);
          return false;
        }
      }
    },
    {
      id: 'contact',
      title: 'Lead Contact',
      component: (
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Who is the lead contact?
          </h2>
          <ContactSection
            value={leadContact}
            onChange={setLeadContact}
            editable={true}
            onContactSearch={async (query) => {
              console.log('RequirementsWizard onContactSearch:', query);
              const response = await fetch(`/api/contacts/search?query=${encodeURIComponent(query)}`);
              if (!response.ok) throw new Error('Failed to search contacts');
              const results = await response.json();
              console.log('RequirementsWizard contact search results:', results);
              return results;
            }}
          />
        </div>
      ),
      onNext: async () => {
        try {
          // Always save/update the contact when proceeding
          const method = leadContact.id ? 'PUT' : 'POST';
          const url = leadContact.id ? `/api/contacts/${leadContact.id}` : '/api/contacts';
          
          const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leadContact),
          });
          
          if (!response.ok) {
            throw new Error('Failed to save contact');
          }
          
          const savedContact = await response.json();
          setLeadContact(savedContact);
          return true;
        } catch (error) {
          console.error('Error saving contact:', error);
          return false;
        }
      }
    },
    {
      id: 'content',
      title: 'Gather Information',
      component: (
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Do you have any initial information to add? Upload files or type directly.
          </h2>
          
          {/* File Upload */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-600 px-6 py-10"
          >
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4 flex text-sm leading-6 text-gray-600 dark:text-gray-400">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer rounded-md bg-white dark:bg-gray-800 font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500"
                >
                  <span>Upload files</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    multiple
                    onChange={handleFileSelect}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs leading-5 text-gray-600 dark:text-gray-400">
                PDF, DOC, DOCX, TXT up to 10MB each
              </p>
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <ul className="mt-4 divide-y divide-gray-200 dark:divide-gray-700">
              {files.map((file, index) => (
                <li key={index} className="py-3 flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-900 dark:text-white">{file.name}</span>
                    <span className="ml-2 text-xs text-gray-500">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFiles(files.filter((_, i) => i !== index))}
                    className="text-red-600 hover:text-red-900"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Text Input */}
          <div className="mt-6">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Or type requirements directly
            </label>
            <div className="mt-2">
              <textarea
                id="content"
                name="content"
                rows={4}
                value={initialContent}
                onChange={(e) => setInitialContent(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-white dark:bg-gray-800"
                placeholder="Enter any initial requirements..."
              />
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleComplete = () => {
    onComplete({
      organization: organization as Organization,
      leadContact: leadContact as Contact,
      initialContent: initialContent,
      files: files.length > 0 ? files : undefined
    });
  };

  return <Wizard steps={steps} onComplete={handleComplete} />;
} 