'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, Eye, FileText, Share2, BarChart2, ClipboardList, Users, Layout } from 'lucide-react';

import Navigation from '@/app/components/navigation';
import ProposalTabs from '@/app/components/proposal/ProposalTabs';
import SectionCollection from '@/app/components/section/SectionCollection';
import ContactSearchModal from '@/app/components/contact/ContactSearchModal';
import { ChatContainer } from '@/app/components/chat';

import AnalysisTab from './AnalysisTab';
import RequirementsTab from './RequirementsTab';
import DeliveryTeamTab from './DeliveryTeamTab';
import LayoutTab from './LayoutTab';
import ShareTab from './ShareTab';

import { Contact } from '@/app/types/contact';
import { Organization } from '@/app/types/organization';
import { Section } from '@/app/types/section';
import { ProposalRecord } from '@/app/types/proposal';

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

interface DraftingUpdates {
  [sectionId: string]: boolean;
}

export type TabType = 'content' | 'layout' | 'share' | 'team' | 'analysis' | 'requirements';

interface ProposalEditorClientProps {
  proposalId: string;
  initialTab?: TabType;
}

export default function ProposalEditorClient({ proposalId, initialTab = 'analysis' }: ProposalEditorClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [proposal, setProposal] = useState<ProposalRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [improvingSections, setImprovingSections] = useState<Record<string, boolean>>({});
  const [title, setTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftingSections, setDraftingSections] = useState<DraftingUpdates>({});
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [showPreviewOptions, setShowPreviewOptions] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [sectionContacts, setSectionContacts] = useState<Record<string, Contact[]>>({});
  const [printTemplate] = useState('modern');
  const [presentationTemplate] = useState('modern-slides');
  const [showContactModal, setShowContactModal] = useState(false);

  // Listen to URL changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['analysis', 'requirements', 'team', 'content', 'layout', 'share'].includes(tabParam)) {
      setActiveTab(tabParam as TabType);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const response = await fetch(`/api/proposals/${proposalId}`);
        if (response.ok) {
          const data = await response.json();
          setProposal(data);
          setTitle(data.title || '');
        }
      } catch (error) {
        console.error('Error fetching proposal:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProposal();
  }, [proposalId]);


  useEffect(() => {
    if (proposal) {
      // Fetch section contacts
      const fetchSectionContacts = async () => {
        try {
          const response = await fetch(`/api/proposals/${proposalId}/section-contacts`);
          if (response.ok) {
            const data = await response.json();
            setSectionContacts(data);
          }
        } catch (error) {
          console.error('Error fetching section contacts:', error);
        }
      };

      fetchSectionContacts();
    }
  }, [proposal, proposalId]);

  const handleSectionUpdate = useCallback(async (sectionId: string, content: string | Record<string, string>, title?: string) => {
    if (!proposal) return;

    try {
      const updatedSections = proposal.sections.map(section => {
        if (section.id === sectionId) {
          return { 
            ...section, 
            content,
            ...(title ? { title } : {})
          };
        }
        return section;
      });

      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: updatedSections,
        }),
      });

      if (response.ok) {
        setProposal(prev => prev ? { ...prev, sections: updatedSections } : null);
      }
    } catch (error) {
      console.error('Error updating section:', error);
    }
  }, [proposal, proposalId]);

  const handleSectionImprove = useCallback(async (sectionId: string) => {
    if (!proposal) return null;

    setImprovingSections(prev => ({ ...prev, [sectionId]: true }));
    try {
      const response = await fetch(`/api/proposals/${proposalId}/improvements?sectionId=${sectionId}`, {
        method: 'POST',
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error improving section:', error);
      return null;
    } finally {
      setImprovingSections(prev => ({ ...prev, [sectionId]: false }));
    }
  }, [proposal, proposalId]);

  const handleDocumentAnalysis = useCallback(async (content: string, signal: AbortSignal) => {
    try {
      await fetch(`/api/proposals/${proposalId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
        signal,
      });
    } catch (error) {
      console.error('Error analyzing document:', error);
    }
  }, [proposalId]);

  const handleAddSection = useCallback(async () => {
    console.log('handleAddSection');
    if (!proposal) return;

    try {
      const newSection = {
        id: crypto.randomUUID(),
        title: 'New Section',
        content: '',
        type: 'text' as const,
      };

      const updatedSections = [...proposal.sections, newSection];
      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: updatedSections,
        }),
      });

      if (response.ok) {
        setProposal(prev => prev ? { ...prev, sections: updatedSections } : null);
      }
    } catch (error) {
      console.error('Error adding section:', error);
    }
  }, [proposal, proposalId]);

  const handleDeleteSection = useCallback(async (sectionId: string) => {
    if (!proposal) return;

    try {
      const updatedSections = proposal.sections.filter(section => section.id !== sectionId);
      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: updatedSections,
        }),
      });

      if (response.ok) {
        setProposal(prev => prev ? { ...prev, sections: updatedSections } : null);
      }
    } catch (error) {
      console.error('Error deleting section:', error);
    }
  }, [proposal, proposalId]);

  const handleTitleChange = async (newTitle: string) => {
    if (!isEditingTitle) {
      setIsEditingTitle(true);
    }
    setTitle(newTitle);
    setIsEditingTitle(false);
    try {
      await fetch(`/api/proposals/${proposalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
    } catch (error) {
      console.error('Error updating title:', error);
    }
  };

  const handleSectionReorder = useCallback(async (updatedSections: Section[]) => {
    if (!proposal) return;

    // Update local state immediately
    setProposal(prev => prev ? { ...prev, sections: updatedSections } : null);

    try {
      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: updatedSections,
        }),
      });

      if (!response.ok) {
        // If the API call fails, revert to the previous state
        setProposal(prev => prev ? { ...prev, sections: proposal.sections } : null);
      }
    } catch (error) {
      // If there's an error, revert to the previous state
      setProposal(prev => prev ? { ...prev, sections: proposal.sections } : null);
      console.error('Error reordering sections:', error);
    }
  }, [proposal, proposalId]);

  const handleAddSectionContact = async (sectionId: string) => {
    setSelectedSection(sectionId);
    setShowContactModal(true);
  };

  const handleContactSelect = async (contact: Contact) => {
    if (!selectedSection) return;

    try {
      const response = await fetch(`/api/proposals/${proposalId}/section-contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: selectedSection,
          contactId: contact.id
        })
      });

      if (response.ok) {
        setSectionContacts(prev => ({
          ...prev,
          [selectedSection]: [...(prev[selectedSection] || []), contact]
        }));
      }
    } catch (error) {
      console.error('Error adding section contact:', error);
    } finally {
      setShowContactModal(false);
      setSelectedSection(null);
    }
  };

  const handleRemoveSectionContact = async (sectionId: string, contactId: string) => {
    try {
      await fetch(`/api/proposals/${proposalId}/section-contacts/${sectionId}/${contactId}`, {
        method: 'DELETE'
      });

      setSectionContacts(prev => ({
        ...prev,
        [sectionId]: prev[sectionId]?.filter(c => c.id !== contactId) || []
      }));
    } catch (error) {
      console.error('Error removing section contact:', error);
    }
  };

  // Update URL when tab changes
  const handleTabChange = (tab: TabType) => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    router.push(url.toString(), { scroll: false });
    setActiveTab(tab);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="mx-auto">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Proposal not found</h3>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'analysis' as const, label: 'Analysis', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'requirements' as const, label: 'Requirements', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'team' as const, label: 'Delivery Team', icon: <Users className="w-4 h-4" /> },
    { id: 'content' as const, label: 'Content', icon: <FileText className="w-4 h-4" /> },
    { id: 'layout' as const, label: 'Layout', icon: <Layout className="w-4 h-4" /> },
    { id: 'share' as const, label: 'Share', icon: <Share2 className="w-4 h-4" /> }
  ];

  const menuButtons = [
    {
      id: 'preview',
      label: 'Preview',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => setShowPreviewOptions(!showPreviewOptions),
      dropdownItems: [
        {
          label: 'Print Preview',
          href: `/api/proposals/${proposalId}/export?format=html&template=${printTemplate}`,
          onClick: () => setShowPreviewOptions(false)
        },
        {
          label: 'Presentation Preview',
          href: `/api/proposals/${proposalId}/export?format=html&template=${presentationTemplate}&type=presentation`,
          onClick: () => setShowPreviewOptions(false)
        }
      ]
    },
    {
      id: 'export',
      label: 'Export',
      icon: <Download className="h-4 w-4" />,
      onClick: () => setShowExportOptions(!showExportOptions),
      dropdownItems: [
        {
          label: 'Print PDF',
          href: `/api/proposals/${proposalId}/export?format=pdf&template=${printTemplate}`,
          onClick: () => setShowExportOptions(false)
        },
        {
          label: 'Presentation PDF',
          href: `/api/proposals/${proposalId}/export?format=pdf&template=${presentationTemplate}&type=presentation`,
          onClick: () => setShowExportOptions(false)
        },
        {
          label: 'Markdown',
          href: `/api/proposals/${proposalId}/export?format=markdown`,
          onClick: () => setShowExportOptions(false)
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <ProposalTabs
        title={title}
        onTitleChange={handleTitleChange}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={tabs}
        menuButtons={menuButtons}
      />
      
      <div className="mx-auto">
        {/* Main content grid */}
        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
          {/* Chat Container - Left on desktop, bottom on mobile */}
          <div className="fixed lg:relative lg:col-span-1 shadow 
              lg:h-full lg:ps-4 md:p-0 sm:px-0
              bottom-0 left-0 right-0 
              lg:bottom-auto lg:left-auto lg:right-auto
              z-10">
            <div className="bg-white dark:bg-gray-800 shadow h-full">
              <ChatContainer
                proposalId={proposalId}
                onSectionUpdate={handleSectionUpdate}
                onSectionImprove={handleSectionImprove}
                onDocumentAnalysis={handleDocumentAnalysis}
                currentSection={currentSection}
                onSetCurrentSection={setCurrentSection}
                isImproving={Object.values(improvingSections).some(Boolean)}
                sections={proposal.sections}
                onDraftingSectionsUpdate={setDraftingSections}
              />
            </div>
          </div>

          {/* Proposal Editor - Right on desktop, main area on mobile */}
          <div className="lg:col-span-2 overflow-y-auto shadow lg:pe-4 md:p-0 sm:px-0 pb-16 lg:pb-0">
            <div className="bg-white dark:bg-gray-800 shadow xs:rounded-lg">
              {activeTab === 'analysis' && (
                <AnalysisTab proposalId={proposalId} />
              )}

              {activeTab === 'requirements' && (
                <RequirementsTab 
                  proposalId={proposalId} 
                  proposal={proposal}
                  onUpdate={async (data: Partial<Requirements>) => {
                    try {
                      const response = await fetch(`/api/proposals/${proposalId}/requirements`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                      });
                      if (!response.ok) throw new Error('Failed to update requirements');
                    } catch (error) {
                      console.error('Error updating requirements:', error);
                    }
                  }} 
                />
              )}

              {activeTab === 'team' && (
                <DeliveryTeamTab proposalId={proposalId} />
              )}

              {activeTab === 'content' && (
                <div className="px-4 py-5 sm:p-6">
                  <SectionCollection
                    sections={proposal.sections}
                    onSectionUpdate={handleSectionUpdate}
                    onSectionImprove={handleSectionImprove}
                    onSectionDelete={handleDeleteSection}
                    onSectionAdd={handleAddSection}
                    onSectionReorder={handleSectionReorder}
                    currentSection={currentSection}
                    improvingSections={improvingSections}
                    draftingSections={draftingSections}
                    sectionContacts={sectionContacts}
                    onAddContact={handleAddSectionContact}
                    onRemoveContact={handleRemoveSectionContact}
                  />
                </div>
              )}

              {activeTab === 'layout' && (
                <LayoutTab 
                  proposalId={proposalId} 
                />
              )}

              {activeTab === 'share' && (
                <ShareTab 
                  proposalId={proposalId} 
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <ContactSearchModal
        isOpen={showContactModal}
        onClose={() => {
          setShowContactModal(false);
          setSelectedSection(null);
        }}
        onSelect={handleContactSelect}
        organizationId={proposal.ownerOrganizationId}
      />
    </div>
  );
} 