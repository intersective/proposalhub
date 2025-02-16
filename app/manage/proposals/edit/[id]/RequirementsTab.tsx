'use client';

import { useState, useEffect } from 'react';
import { ChatContainer } from '@/app/components/chat';
import RequirementsWizard from '@/app/components/requirements/RequirementsWizard';
import OrganizationSection from '@/app/components/organization';
import ContactSection from '@/app/components/contact';
import { Organization } from '@/app/types/organization';
import { Contact } from '@/app/types/contact';
import { Section } from '@/app/types/section';

interface Requirements {
  organization: Organization;
  leadContact: Contact;
  overview: string;
  requirements: string;
  timeline: string;
  budget: string;
  notes: string;
  referenceDocuments: Array<{
    id: string;
    name: string;
    url: string;
  }>;
}

interface RequirementsTabProps {
  proposalId: string;
  onUpdate: (data: Partial<Requirements>) => void;
  proposal?: {
    forOrganizationId: string;
  };
}

export default function RequirementsTab({ proposalId, onUpdate, proposal }: RequirementsTabProps) {
  const [requirements, setRequirements] = useState<Requirements | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [draftingSections, setDraftingSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchRequirements = async () => {
      try {
        const response = await fetch(`/api/proposals/${proposalId}/requirements`);
        if (response.ok) {
          const data = await response.json();
          setRequirements(data);
        }
      } catch (error) {
        console.error('Error fetching requirements:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequirements();
  }, [proposalId]);

  const handleWizardComplete = async (data: {
    organization: Organization;
    leadContact: Contact;
    initialContent: string;
    files?: File[];
  }) => {
    try {
      // First, update the basic requirements
      const updatedRequirements: Requirements = {
        organization: data.organization,
        leadContact: data.leadContact,
        overview: data.initialContent,
        requirements: '',
        timeline: '',
        budget: '',
        notes: '',
        referenceDocuments: []
      };

      await onUpdate(updatedRequirements);
      setRequirements(updatedRequirements);

      // Then, if there are files, upload them
      if (data.files?.length) {
        for (const file of data.files) {
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch(`/api/proposals/${proposalId}/documents`, {
            method: 'POST',
            body: formData
          });

          if (response.ok) {
            const document = await response.json();
            setRequirements(prev => prev ? {
              ...prev,
              referenceDocuments: [...prev.referenceDocuments, document]
            } : null);
          }
        }
      }
    } catch (error) {
      console.error('Error setting up requirements:', error);
    }
  };

  const handleSectionUpdate = async (sectionId: string, content: string) => {
    if (!requirements) return;

    const updates = {
      ...requirements,
      [sectionId]: content
    };

    await onUpdate(updates);
    setRequirements(updates);
  };

  const handleSectionImprove = async (sectionId: string) => {
    try {
      const response = await fetch(`/api/proposals/${proposalId}/improvements?sectionId=${sectionId}`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        return data.content;
      }
      return null;
    } catch (error) {
      console.error('Error improving section:', error);
      return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!requirements || (!requirements.organization && !requirements.leadContact)) {
    return <RequirementsWizard 
      onComplete={handleWizardComplete} 
      existingOrganizationId={proposal?.forOrganizationId}
    />;
  }

  const sections: Section[] = [
    { id: 'overview', title: 'Overview', content: requirements?.overview || '', type: 'text' },
    { id: 'requirements', title: 'Requirements', content: requirements?.requirements || '', type: 'text' },
    { id: 'timeline', title: 'Timeline', content: requirements?.timeline || '', type: 'text' },
    { id: 'budget', title: 'Budget', content: requirements?.budget || '', type: 'text' },
    { id: 'notes', title: 'Notes', content: requirements?.notes || '', type: 'text' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-8rem)] overflow-hidden">
      <div className="lg:col-span-2 overflow-y-auto shadow lg:ps-4 md:p-0 sm:px-0">
        <div className="bg-white dark:bg-gray-800 shadow xs:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {/* Organization Section */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Organization</h3>
              <OrganizationSection value={requirements.organization} onChange={(org) => onUpdate({ organization: org as Organization })} />
            </div>

            {/* Lead Contact Section */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Lead Contact</h3>
              <ContactSection value={requirements.leadContact} onChange={(contact) => onUpdate({ leadContact: contact as Contact })} />
            </div>

            {/* Requirements Sections */}
            {sections.map((section) => (
              <div key={section.id} className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{section.title}</h3>
                <textarea
                  value={section.content}
                  onChange={(e) => handleSectionUpdate(section.id, e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-white dark:bg-gray-800"
                  rows={6}
                />
              </div>
            ))}

            {/* Reference Documents */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Reference Documents</h3>
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {requirements.referenceDocuments.map((doc) => (
                  <li key={doc.id} className="py-3 flex justify-between items-center">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {doc.name}
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        // Handle document removal
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-1 shadow sticky lg:pe-4 md:p-0 sm:px-0">
        <div className="bg-white dark:bg-gray-800 shadow h-full">
          <div className="h-full">
            <ChatContainer
              proposalId={proposalId}
              onSectionUpdate={handleSectionUpdate}
              onSectionImprove={handleSectionImprove}
              onDocumentAnalysis={async () => {}}
              currentSection={currentSection}
              onSetCurrentSection={setCurrentSection}
              sections={sections}
              onDraftingSectionsUpdate={setDraftingSections}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 