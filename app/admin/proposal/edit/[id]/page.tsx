'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { ChatContainer } from '../../../../components/ProposalChat';
import ProposalSection from '../../../../components/ProposalSection';
import Navigation from '../../../../components/Navigation';
import SearchableDropdown from '../../../../components/SearchableDropdown';
import { Company, Client } from '../../../../lib/companyDatabase';
import { Option } from '@/app/components/SearchableDropdown';

interface Section {
  id: string;
  title: string;
  content: string | Record<string, string>;
  type: 'text' | 'fields';
}

interface AnalyzedSection {
  id: string;
  title: string;
  content: string;
  confidence: number;
  sourceSection?: string;
  mergeType?: 'direct' | 'partial' | 'enhancement';
}

interface DocumentAnalysisResult {
  sections: AnalyzedSection[];
  unmatched: {
    content: string;
    potentialSections: Array<{
      sectionId: string;
      relevance: number;
    }>;
  }[];
}

interface Proposal {
  id: string;
  sections: Section[];
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  lastUpdated: Date;
  title?: string;
  companyId?: string;
  clientId?: string;
}

// Add type adapters for Company and Client
const companyToOption = (company: Company): Option => ({
  id: company.id,
  name: company.name,
  website: company.website || '',
  sector: company.sector || '',
  size: company.size || '',
  background: company.background || '',
  lastUpdated: company.lastUpdated.toISOString(),
  createdAt: company.createdAt.toISOString()
});

const clientToOption = (client: Client): Option => ({
  id: client.id,
  name: client.name,
  companyId: client.companyId,
  email: client.email || '',
  linkedIn: client.linkedIn || '',
  phone: client.phone || '',
  role: client.role || '',
  background: client.background || '',
  lastUpdated: client.lastUpdated.toISOString(),
  createdAt: client.createdAt.toISOString()
});

// Helper function to get company/client info from sections
const getCompanyAndClientInfo = (sections: Section[]) => {
  const companySection = sections.find(s => s.id === 'companyInfo');
  const clientSection = sections.find(s => s.id === 'clientInfo');
  
  return {
    company: companySection?.type === 'fields' ? companySection.content as Record<string, string> : null,
    client: clientSection?.type === 'fields' ? clientSection.content as Record<string, string> : null
  };
};

export default function EditProposal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [title, setTitle] = useState('');

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const response = await fetch(`/api/proposals/${id}`);
        if (response.ok) {
          const data = await response.json();
          setProposal({
            ...data,
            lastUpdated: new Date(data.lastUpdated)
          });
          setTitle(data.title || '');

          // Load company and client if they exist
          if (data.companyId) {
            const companyResponse = await fetch(`/api/companies/${data.companyId}`);
            if (companyResponse.ok) {
              const companyData = await companyResponse.json();
              setSelectedCompany(companyData);
            }
          }

          if (data.clientId) {
            const clientResponse = await fetch(`/api/clients/${data.clientId}`);
            if (clientResponse.ok) {
              const clientData = await clientResponse.json();
              setSelectedClient(clientData);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching proposal:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProposal();
  }, [id]);

  const handleTitleChange = async (newTitle: string) => {
    setTitle(newTitle);
    try {
      await fetch(`/api/proposals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });
    } catch (error) {
      console.error('Error updating title:', error);
    }
  };

  const handleSectionUpdate = async (sectionId: string, content: string | Record<string, string>) => {
    if (!proposal) return;

    const updatedSections = proposal.sections.map(section =>
      section.id === sectionId ? { ...section, content } : section
    );

    try {
      const response = await fetch(`/api/proposals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: updatedSections
        })
      });

      if (response.ok) {
        const data = await response.json();
        setProposal({
          ...data,
          lastUpdated: new Date(data.lastUpdated)
        });
      }
    } catch (error) {
      console.error('Error updating section:', error);
    }
  };

  const handleSectionImprove = async (sectionId: string) => {
    if (!proposal) return '';
    const section = proposal.sections.find(s => s.id === sectionId);
    if (!section || typeof section.content !== 'string') return '';

    try {
      const response = await fetch('/api/process-client-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: section.content,
          section: section.title
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          return data.content;
        }
      }
      return '';
    } catch (error) {
      console.error('Error improving section:', error);
      return '';
    }
  };

  const handleDocumentAnalysis = async (content: string, signal: AbortSignal) => {
    if (!proposal) return;

    try {
      const response = await fetch(`/api/proposals/${id}/analyze-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          type: 'markdown'
        }),
        signal
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = (await response.json()) as DocumentAnalysisResult;

      // Update sections with matched content
      const updatedSections = proposal.sections.map(section => {
        const match = result.sections.find(s => s.id === section.id);
        if (match) {
          return { ...section, content: match.content };
        }
        return section;
      });

      // Update each section individually to maintain type safety
      for (const section of updatedSections) {
        await handleSectionUpdate(section.id, section.content);
      }
    } catch (error) {
      if (error instanceof Error && error.message !== 'Analysis cancelled') {
        console.error('Error analyzing document:', error);
      }
      throw error;
    }
  };

  const handleCompanySearch = async (query: string) => {
    try {
      const response = await fetch(`/api/companies/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return [];
    } catch (error) {
      console.error('Error searching companies:', error);
      return [];
    }
  };

  const handleClientSearch = async (query: string) => {
    try {
      const params = new URLSearchParams({
        q: query,
        ...(selectedCompany && { companyId: selectedCompany.id })
      });
      const response = await fetch(`/api/clients/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return [];
    } catch (error) {
      console.error('Error searching clients:', error);
      return [];
    }
  };

  const handleCompanyAISearch = async (query: string) => {
    try {
      const response = await fetch('/api/process-client-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          type: 'company'
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.companyInfo) {
          // Create new company
          const createResponse = await fetch('/api/companies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data.companyInfo)
          });
          if (createResponse.ok) {
            const company = await createResponse.json();
            setSelectedCompany(company);
          }
        }
      }
    } catch (error) {
      console.error('Error searching company with AI:', error);
    }
  };

  const handleClientAISearch = async (query: string) => {
    if (!selectedCompany) return;
    
    try {
      const response = await fetch('/api/process-client-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.clientInfo) {
          // Create new client
          const createResponse = await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...data.clientInfo,
              companyId: selectedCompany.id
            })
          });
          if (createResponse.ok) {
            const client = await createResponse.json();
            setSelectedClient(client);
          }
        }
      }
    } catch (error) {
      console.error('Error searching client with AI:', error);
    }
  };

  const handleCompanySelect = async (option: Option | null) => {
    if (!proposal) return;

    const updatedSections = proposal.sections.map(section => {
      if (section.id === 'companyInfo' && section.type === 'fields') {
        return {
          ...section,
          content: option ? {
            name: option.name,
            website: option.website || '',
            sector: option.sector || '',
            size: option.size || '',
            background: option.background || ''
          } : {
            name: '',
            website: '',
            sector: '',
            size: '',
            background: ''
          }
        };
      }
      // Clear client when company changes
      if (section.id === 'clientInfo' && section.type === 'fields') {
        return {
          ...section,
          content: {
            name: '',
            email: '',
            linkedInUrl: '',
            phoneOptional: '',
            background: ''
          }
        };
      }
      return section;
    });

    try {
      const response = await fetch(`/api/proposals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: updatedSections })
      });

      if (response.ok) {
        const data = await response.json();
        setProposal({
          ...data,
          lastUpdated: new Date(data.lastUpdated)
        });
      }
    } catch (error) {
      console.error('Error updating company:', error);
    }
  };

  const handleClientSelect = async (option: Option | null) => {
    if (!proposal) return;

    const updatedSections = proposal.sections.map(section => {
      if (section.id === 'clientInfo' && section.type === 'fields') {
        return {
          ...section,
          content: option ? {
            name: option.name,
            email: option.email || '',
            linkedInUrl: option.linkedIn || '',
            phoneOptional: option.phone || '',
            background: option.background || ''
          } : {
            name: '',
            email: '',
            linkedInUrl: '',
            phoneOptional: '',
            background: ''
          }
        };
      }
      return section;
    });

    try {
      const response = await fetch(`/api/proposals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: updatedSections })
      });

      if (response.ok) {
        const data = await response.json();
        setProposal({
          ...data,
          lastUpdated: new Date(data.lastUpdated)
        });
      }
    } catch (error) {
      console.error('Error updating client:', error);
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

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Proposal not found</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="flex h-[calc(100vh-4rem)]"> {/* Full height minus navigation */}
        {/* Left pane - Chat and Search */}
        <div className="w-[480px] flex flex-col h-full p-6">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Proposal Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter proposal title..."
                className="w-full p-2 border rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
              />
            </div>
            <SearchableDropdown
              value={getCompanyAndClientInfo(proposal?.sections || []).company ? {
                id: 'current',
                ...getCompanyAndClientInfo(proposal?.sections || []).company
              } as Option : null}
              onChange={handleCompanySelect}
              onSearch={handleCompanySearch}
              onAISearch={handleCompanyAISearch}
              placeholder="Search or create company..."
              label="Company"
            />
            <div className="mt-4">
              <SearchableDropdown
                value={getCompanyAndClientInfo(proposal?.sections || []).client ? {
                  id: 'current',
                  ...getCompanyAndClientInfo(proposal?.sections || []).client
                } as Option : null}
                onChange={handleClientSelect}
                onSearch={handleClientSearch}
                onAISearch={handleClientAISearch}
                placeholder="Search or create client..."
                label="Client"
                disabled={!getCompanyAndClientInfo(proposal?.sections || []).company}
              />
            </div>
          </div>
          <div className="flex-1 bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden flex flex-col">
            <ChatContainer
              onSectionUpdate={handleSectionUpdate}
              onSectionImprove={handleSectionImprove}
              onDocumentAnalysis={handleDocumentAnalysis}
            />
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            {proposal.sections.map(section => (
              <ProposalSection
                key={section.id}
                section={section}
                onUpdate={handleSectionUpdate}
                onImprove={handleSectionImprove}
                isEditing={false}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 