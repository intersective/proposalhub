'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatContainer } from '../../../../components/ProposalChat';
import ProposalSection, { ProposalSectionProps } from '../../../../components/ProposalSection';
import Navigation from '../../../../components/Navigation';
import { Company, Client } from '@/app/lib/companyDatabase';
//import { Option } from '@/app/components/SearchableDropdown';
//import { useDropzone } from 'react-dropzone';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Download, Eye, FileText, Users, BarChart2, Settings } from 'lucide-react';
import { TEMPLATES } from '@/app/lib/constants';
import Image from 'next/image';

interface Section {
  id: string;
  title: string;
  content: string | Record<string, string>;
  type: 'text' | 'fields';
  images?: {
    background?: string[];
    content?: string[];
  };
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

type MessageMetadata = {
  type: 'company_creation' | 'company_update' | 'client_creation';
  companyInfo?: {
    name: string;
    website?: string;
    sector?: string;
    size?: string;
    background?: string;
  };
  clientInfo?: {
    name: string | null;
    email: string | null;
    linkedIn: string | null;
    background?: string;
  };
};

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  files?: File[];
  metadata?: MessageMetadata;
}

// interface ClientInfo {
//   name: string | null;
//   company: string | null;
//   email?: string | null;
//   linkedIn?: string | null;
//   background?: string;
//   companyBackground?: string;
// }

// interface ExtractedResponse {
//   clientInfo: ClientInfo;
//   models: {
//     extraction: string;
//     background: string | null;
//   };
//   content?: string | Record<string, string>;
//   proposalSections?: Record<string, string>;
// }

// // Add type adapters for Company and Client
// const companyToOption = (company: Company): Option => ({
//   id: company.id,
//   name: company.name,
//   website: company.website || '',
//   sector: company.sector || '',
//   size: company.size || '',
//   background: company.background || '',
//   lastUpdated: company.lastUpdated.toISOString(),
//   createdAt: company.createdAt.toISOString()
// });

// const clientToOption = (client: Client): Option => ({
//   id: client.id,
//   name: client.name,
//   companyId: client.companyId,
//   email: client.email || '',
//   linkedIn: client.linkedIn || '',
//   phone: client.phone || '',
//   role: client.role || '',
//   background: client.background || '',
//   lastUpdated: client.lastUpdated.toISOString(),
//   createdAt: client.createdAt.toISOString()
// });



// // Helper function to get company/client info from sections
// const getCompanyAndClientInfo = (sections: Section[]) => {
//   const companySection = sections.find(s => s.id === 'companyInfo');
//   const clientSection = sections.find(s => s.id === 'clientInfo');
  
//   return {
//     company: companySection?.type === 'fields' ? companySection.content as Record<string, string> : null,
//     client: clientSection?.type === 'fields' ? clientSection.content as Record<string, string> : null
//   };
// };

function SortableProposalSection(props: ProposalSectionProps & { id: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ProposalSection 
        {...props} 
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

function AddSectionButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation(); // Prevent event bubbling
        onClick();
      }}
      className="w-full flex items-center justify-center py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 group transition-colors"
    >
      <Plus className="w-5 h-5 text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
    </button>
  );
}

interface Props {
  params: Promise<{ id: string }>;
}

interface DraftingUpdates {
  [sectionId: string]: boolean;
}

// interface ChatContainerProps {
//   proposalId: string;
//   onSectionUpdate: (sectionId: string, content: string | Record<string, string>, title?: string) => Promise<void>;
//   onSectionImprove: (sectionId: string) => Promise<string>;
//   onDocumentAnalysis: (content: string, signal: AbortSignal) => Promise<void>;
//   currentSection: string | null;
//   onSetCurrentSection: (sectionId: string | null) => void;
//   isImproving: boolean;
//   sections: Section[];
//   onDraftingSectionsUpdate: (updates: DraftingUpdates) => void;
// }

export default function EditProposal({ params }: Props) {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  //const [editingSections, setEditingSections] = useState<Record<string, boolean>>({});
  const [improvingSections, setImprovingSections] = useState<Record<string, boolean>>({});
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [title, setTitle] = useState('');
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  // const [sections, setSections] = useState<Section[]>([
  //   {
  //     id: 'companyInfo',
  //     title: 'Company Information',
  //     type: 'fields',
  //     content: {
  //       name: '',
  //       url: '',
  //       sector: '',
  //       size: '',
  //       background: '',
  //       primaryColor: '#000000',
  //       secondaryColor: '#ffffff'
  //     }
  //   },
  //   {
  //     id: 'clientInfo',
  //     title: 'Company Contact',
  //     type: 'fields',
  //     content: {
  //       name: '',
  //       email: '',
  //       linkedInUrl: '',
  //       phoneOptional: '',
  //       background: ''
  //     }
  //   },
  //   {
  //     id: 'executiveSummary',
  //     title: 'Executive Summary',
  //     type: 'text',
  //     content: ''
  //   },
  //   {
  //     id: 'projectBackground',
  //     title: 'Project Background',
  //     type: 'text',
  //     content: ''
  //   },
  //   {
  //     id: 'projectScope',
  //     title: 'Project Scope',
  //     type: 'text',
  //     content: ''
  //   },
  //   {
  //     id: 'proposedApproach',
  //     title: 'Proposed Approach',
  //     type: 'text',
  //     content: ''
  //   },
  //   {
  //     id: 'projectTimeline',
  //     title: 'Project Timeline',
  //     type: 'text',
  //     content: ''
  //   },
  //   {
  //     id: 'deliverables',
  //     title: 'Deliverables',
  //     type: 'text',
  //     content: ''
  //   },
  //   {
  //     id: 'pricing',
  //     title: 'Pricing',
  //     type: 'text',
  //     content: ''
  //   },
  //   {
  //     id: 'team',
  //     title: 'Team',
  //     type: 'text',
  //     content: ''
  //   },
  //   {
  //     id: 'conclusion',
  //     title: 'Conclusion',
  //     type: 'text',
  //     content: ''
  //   }
  // ]);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: "Select a company and client or tell me the name, email, LinkedIn or website of your client or company to start."
    }
  ]);  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  //const abortController = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };


  // const dropzone = useDropzone({
  //   onDrop: (acceptedFiles: File[]) => {
  //     setMessages(prev => [...prev, {
  //       role: 'user',
  //       content: 'Uploaded files:',
  //       files: acceptedFiles
  //     }]);
  //     scrollToBottom();
  //   }
  // });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchProposal = async () => {
      const { id } = await params;
      try {
        const response = await fetch(`/api/proposals/${id}`);
        if (response.ok) {
          const data = await response.json();
          setProposal(data);
          setTitle(data.title || '');

          // Load company and client data if IDs are present
          if (data.companyId) {
            const companyResponse = await fetch(`/api/companies/${data.companyId}`);
            if (companyResponse.ok) {
              const company = await companyResponse.json();
              setSelectedCompany(company);
            }
          }

          if (data.clientId) {
            const clientResponse = await fetch(`/api/clients/${data.clientId}`);
            if (clientResponse.ok) {
              const client = await clientResponse.json();
              setSelectedClient(client);
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
  }, [params]);

  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const handleTitleChange = async (newTitle: string) => {
    setTitle(newTitle);
    setIsEditingTitle(false);
    try {
      await fetch(`/api/proposals/${proposal?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });
    } catch (error) {
      console.error('Error updating title:', error);
    }
  };

  const [draftingSections, setDraftingSections] = useState<DraftingUpdates>({});
  const [isAnySectionDragging, setIsAnySectionDragging] = useState(false);

  const handleDraftingSectionsUpdate = useCallback((updates: DraftingUpdates) => {
    setDraftingSections(prev => ({ ...prev, ...updates }));
  }, []);

  const handleSectionUpdate = async (sectionId: string, content: string | Record<string, string>, title?: string) => {
    if (!proposal) return;

    // Create a new array with all sections, only updating the target section
    const updatedSections = proposal.sections.map(section =>
      section.id === sectionId 
        ? { 
            ...section, 
            content,
            ...(title ? { title } : {})
          } 
        : section
    );

    try {
      const response = await fetch(`/api/proposals/${proposal.id}`, {
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
      // Clear drafting status on error
      handleDraftingSectionsUpdate({
        [sectionId]: false
      });
    }
  };

  const handleSectionImprove = async (sectionId: string) => {
    setCurrentSection(sectionId);
    setImprovingSections({ ...improvingSections, [sectionId]: true });
    try {
      const section = proposal?.sections.find(s => s.id === sectionId);
      if (!section || !proposal) {
        setImprovingSections({ ...improvingSections, [sectionId]: false });
        return '';
      }

      // Create a context string from other sections
      const contextSections = proposal.sections
        .filter(s => s.id !== sectionId && s.content && typeof s.content === 'string' && s.content.trim() !== '')
        .map(s => `${s.title}:\n${s.content}`)
        .join('\n\n');

      // If section is empty, ask for initial content based on context
      const message = section.content 
        ? `Please improve the following ${section.title.toLowerCase()} section.\n\n` +
          `Current content:\n${section.content}\n\n` +
          `Context from other sections:\n${contextSections}`
        : `Please generate content for the ${section.title.toLowerCase()} section based on the following context:\n\n${contextSections}`;

      const response = await fetch('/api/process-client-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          section: section.title,
          type: 'improve'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to improve section');
      }

      const data = await response.json();
      if (data.content) {
        return data.content;
      }
      throw new Error('No improvement content received');
    } catch (error) {
      console.error('Error improving section:', error);
      return '';
    } finally {
      setImprovingSections({ ...improvingSections, [sectionId]: false });
    }
  };

  const handleDocumentAnalysis = async (content: string, signal: AbortSignal) => {
    if (!proposal) return;

    try {
      const response = await fetch(`/api/proposals/${proposal.id}/analyze-document`, {
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
        const companies = await response.json();
        return companies.map((company: Company) => ({
          id: company.id,
          name: company.name,
          website: company.website,
          sector: company.sector,
          size: company.size,
          background: company.background,
          lastUpdated: new Date(company.lastUpdated),
          createdAt: new Date(company.createdAt)
        }));
      }
      return [];
    } catch (error) {
      console.error('Error searching companies:', error);
      return [];
    }
  };

  const handleClientSearch = async (query: string) => {
    try {
      const response = await fetch(`/api/clients/search?q=${encodeURIComponent(query)}${
        selectedCompany ? `&companyId=${selectedCompany.id}` : ''
      }`);
      if (response.ok) {
        const clients = await response.json();
        return clients.map((client: Client) => ({
          id: client.id,
          name: client.name,
          companyId: client.companyId,
          email: client.email,
          linkedIn: client.linkedIn,
          phone: client.phone,
          role: client.role,
          background: client.background,
          lastUpdated: new Date(client.lastUpdated),
          createdAt: new Date(client.createdAt)
        }));
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
          // Search for existing companies with this name
          const searchResponse = await fetch(`/api/companies/search?q=${encodeURIComponent(data.companyInfo.name)}`);
          if (searchResponse.ok) {
            const companies = await searchResponse.json();
            if (companies.length === 1) {
              // If exactly one company found, automatically select it
              handleCompanySelect(companies[0]);
              return;
            } else if (companies.length > 1) {
              // If multiple companies found, show them in dropdown with additional info
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: `I found multiple companies matching "${data.companyInfo.name}". Please select the correct one:`,
                metadata: {
                  type: 'company_creation',
                  companyInfo: {
                    ...data.companyInfo,
                    primaryColor: data.companyInfo.primaryColor || '#000000',
                    secondaryColor: data.companyInfo.secondaryColor || '#ffffff'
                  }
                }
              }]);
              return companies;
            }
          }
          
          // If no existing company found, create new one
          const createResponse = await fetch('/api/companies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...data.companyInfo,
              primaryColor: data.companyInfo.primaryColor || '#000000',
              secondaryColor: data.companyInfo.secondaryColor || '#ffffff'
            })
          });
          if (createResponse.ok) {
            const company = await createResponse.json();
            handleCompanySelect(company);
          }
        }
      }
    } catch (error) {
      console.error('Error searching company with AI:', error);
    }
  };

  // const searchCompanies = async (query: string) => {
  //   try {
  //     const response = await fetch(`/api/companies/search?q=${encodeURIComponent(query)}`);
  //     if (response.ok) {
  //       const companies = await response.json();
  //       return companies;
  //     }
  //     return [];
  //   } catch (error) {
  //     console.error('Error searching companies:', error);
  //     return [];
  //   }
  // };

  // const searchClients = async (query: string) => {
  //   try {
  //     const url = new URL('/api/clients/search', window.location.origin);
  //     url.searchParams.set('q', query);
  //     if (selectedCompany) {
  //       url.searchParams.set('companyId', selectedCompany.id);
  //     }
      
  //     const response = await fetch(url);
  //     if (response.ok) {
  //       const clients = await response.json();
  //       return clients;
  //     }
  //     return [];
  //   } catch (error) {
  //     console.error('Error searching clients:', error);
  //     return [];
  //   }
  // };

  const handleClientAISearch = async (query: string) => {
    if (!selectedCompany) return;
    
    try {
      const response = await fetch('/api/process-client-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          type: 'client'
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.clientInfo) {
          // Search for existing clients with this name in the selected company
          const searchResponse = await fetch(`/api/clients/search?q=${encodeURIComponent(data.clientInfo.name)}&companyId=${selectedCompany.id}`);
          if (searchResponse.ok) {
            const clients = await searchResponse.json();
            if (clients.length === 1) {
              // If exactly one client found, automatically select it
              handleClientSelect(clients[0]);
              return;
            } else if (clients.length > 1) {
              // If multiple clients found, show them in dropdown with additional info
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: `I found multiple contacts matching "${data.clientInfo.name}" at ${selectedCompany.name}. Please select the correct one:`,
                metadata: {
                  type: 'client_creation',
                  clientInfo: data.clientInfo
                }
              }]);
              return clients;
            }
          }
          
          // If no existing client found, create new one
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
            handleClientSelect(client);
          }
        }
      }
    } catch (error) {
      console.error('Error searching client with AI:', error);
    }
  };

  const handleCompanySelect = async (company: Company | null) => {
    if (!proposal) return;
    
    // Only clear selected client if saving a null company
    if (!company) {
      setSelectedClient(null);
    }
    
    setSelectedCompany(company);
    const updatedSections = proposal.sections.map(section => {
      if (section.id === 'companyInfo' && section.type === 'fields') {
        if (company) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `I found ${company.name} in our database. Please select or enter the client contact information.`
          }]);
        }
        return {
          ...section,
          content: company ? {
            name: company.name,
            website: company.website || '',
            sector: company.sector || '',
            size: company.size || '',
            background: company.background || '',
            primaryColor: company.primaryColor || '#000000',
            secondaryColor: company.secondaryColor || '#ffffff'
          } : {
            name: '',
            website: '',
            sector: '',
            size: '',
            background: '',
            primaryColor: '#000000',
            secondaryColor: '#ffffff'
          }
        };
      }
      // Only clear client info if saving a null company
      if (!company && section.id === 'clientInfo' && section.type === 'fields') {
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
      const response = await fetch(`/api/proposals/${proposal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sections: updatedSections,
          companyId: company?.id || null 
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
      console.error('Error updating company:', error);
    }
  };

  const handleClientSelect = async (client: Client | null) => {
    if (!proposal) return;
    setSelectedClient(client);
    const updatedSections = proposal.sections.map(section => {
      if (section.id === 'clientInfo' && section.type === 'fields') {
        return {
          ...section,
          content: client ? {
            name: client.name,
            email: client.email || '',
            linkedInUrl: client.linkedIn || '',
            phoneOptional: client.phone || '',
            background: client.background || ''
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
      const response = await fetch(`/api/proposals/${proposal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sections: updatedSections,
          clientId: client?.id || null 
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
      console.error('Error updating client:', error);
    }
  };

  //const [draggingId, setDraggingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = () => {
    setIsAnySectionDragging(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setIsAnySectionDragging(false);
    const { active, over } = event;

    if (over && active.id !== over.id && proposal) {
      const oldIndex = proposal.sections.findIndex(s => s.id === active.id);
      const newIndex = proposal.sections.findIndex(s => s.id === over.id);

      const updatedSections = [...proposal.sections];
      const [movedSection] = updatedSections.splice(oldIndex, 1);
      updatedSections.splice(newIndex, 0, movedSection);

      try {
        const response = await fetch(`/api/proposals/${proposal.id}`, {
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
        console.error('Error reordering sections:', error);
      }
    }
  };

  const handleDeleteSection = async (sectionId: string, e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent event bubbling
    if (!proposal) return;

    const updatedSections = proposal.sections.filter(s => s.id !== sectionId);

    try {
      const response = await fetch(`/api/proposals/${proposal.id}`, {
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
      console.error('Error deleting section:', error);
    }
  };

  const handleAddSection = async () => {
    if (!proposal) return;

    const newSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      type: 'text' as const,
      content: ''
    };

    const updatedSections = [...proposal.sections, newSection];

    try {
      const response = await fetch(`/api/proposals/${proposal.id}`, {
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
      console.error('Error adding section:', error);
    }
  };

  const [improvableSections] = useState<string[]>([]);
  const [isImprovingSections] = useState<Record<string, boolean>>({});

  // Add handler for updating improvable sections
  // const handleImprovableSectionsUpdate = (sectionIds: string[]) => {
  //   setImprovableSections(sectionIds);
  // };

  // const [selectedTemplate, setSelectedTemplate] = useState('modern');
  // const [showTemplates, setShowTemplates] = useState(false);
  const [showPreviewOptions, setShowPreviewOptions] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);

  const [activeTab, setActiveTab] = useState('content');
  const [printTemplate, setPrintTemplate] = useState('modern');
  const [presentationTemplate, setPresentationTemplate] = useState('modern-slides');
  const [presentationMarkdown, setPresentationMarkdown] = useState('');

  const handleCancelDrafting = () => {
    if (currentSection && draftingSections[currentSection]) {
      handleDraftingSectionsUpdate({ [currentSection]: false });
    }
  };

  const handleGenerateImage = async (sectionId: string, type: 'background' | 'content') => {
    try {
      const section = proposal?.sections.find(s => s.id === sectionId);
      if (!section) return;

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Generate an image for ${section.title} section of a business proposal`,
          type,
          sectionId
        })
      });

      if (!response.ok) throw new Error('Failed to generate image');
      
      const data = await response.json();
      // Handle the generated image URL
      await handleSectionUpdate(sectionId, section.content, section.title);
      
      // Update the section's images separately
      const updatedSection = {
        ...section,
        images: {
          ...section.images,
          [type]: [...(section.images?.[type] || []), data.url]
        }
      };
      
      await fetch(`/api/proposals/${proposal?.id}/sections/${sectionId}/images`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: updatedSection.images })
      });
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    sectionId: string,
    type: 'background' | 'content'
  ) => {
    const files = e.target.files;
    if (!files || !proposal) return;

    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('images', file);
      });
      formData.append('sectionId', sectionId);
      formData.append('type', type);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to upload image');
      
      const data = await response.json();
      const section = proposal.sections.find(s => s.id === sectionId);
      if (!section) return;

      // Update section with new image URLs
      const updatedSection = {
        ...section,
        images: {
          ...section.images,
          [type]: [...(section.images?.[type] || []), ...data.urls]
        }
      };
      
      await fetch(`/api/proposals/${proposal.id}/sections/${sectionId}/images`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: updatedSection.images })
      });
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleRegenerateSlides = async () => {
    if (!proposal) return;

    try {
      const response = await fetch('/api/generate-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: proposal.sections,
          template: presentationTemplate
        })
      });

      if (!response.ok) throw new Error('Failed to generate slides');
      
      const data = await response.json();
      setPresentationMarkdown(data.markdown);
    } catch (error) {
      console.error('Error generating slides:', error);
    }
  };

  const handleSaveLayout = async () => {
    if (!proposal) return;

    try {
      const response = await fetch(`/api/proposals/${proposal.id}/layout`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printTemplate,
          presentationTemplate,
          presentationMarkdown,
          brandType,
          primaryColor,
          secondaryColor
        })
      });

      if (!response.ok) throw new Error('Failed to save layout');
      
      setActiveTab('content');
    } catch (error) {
      console.error('Error saving layout:', error);
    }
  };

  const [brandType, setBrandType] = useState<'client' | 'service'>('client');
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [secondaryColor, setSecondaryColor] = useState('#ffffff');

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
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              {isEditingTitle ? (
              <input
                type="text"
                value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => handleTitleChange(title)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleChange(title);
                    if (e.key === 'Escape') {
                      setIsEditingTitle(false);
                      setTitle(proposal?.title || '');
                    }
                  }}
                  autoFocus
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter proposal title..."
                />
              ) : (
                <h2
                  onClick={() => setIsEditingTitle(true)}
                  className="text-xl font-semibold cursor-pointer text-gray-900 dark:text-white"
                >
                  {title || 'Click to add title...'}
                </h2>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 border-r border-gray-200 dark:border-gray-700 pr-3 mr-3">
                <button
                  onClick={() => setActiveTab('content')}
                  className={`p-2 rounded-md ${
                    activeTab === 'content'
                      ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title="Edit Content"
                >
                  <FileText className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveTab('layout')}
                  className={`p-2 rounded-md ${
                    activeTab === 'layout'
                      ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title="Customize Layout"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveTab('viewers')}
                  className={`p-2 rounded-md ${
                    activeTab === 'viewers'
                      ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title="Manage Viewers"
                >
                  <Users className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveTab('performance')}
                  className={`p-2 rounded-md ${
                    activeTab === 'performance'
                      ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title="View Performance"
                >
                  <BarChart2 className="w-5 h-5" />
                </button>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowPreviewOptions(prev => !prev)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md flex items-center bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </button>
                {showPreviewOptions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 z-50">
                    <a
                      href={`/api/proposals/${proposal?.id}/export?format=html&template=${printTemplate}&brandType=${brandType}&primaryColor=${encodeURIComponent(primaryColor)}&secondaryColor=${encodeURIComponent(secondaryColor)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setShowPreviewOptions(false)}
                    >
                      Print Preview
                    </a>
                    <a
                      href={`/api/proposals/${proposal?.id}/export?format=html&template=${presentationTemplate}&type=presentation&brandType=${brandType}&primaryColor=${encodeURIComponent(primaryColor)}&secondaryColor=${encodeURIComponent(secondaryColor)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setShowPreviewOptions(false)}
                    >
                      Presentation Preview
                    </a>
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowExportOptions(prev => !prev)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md flex items-center bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
                {showExportOptions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 z-50">
                    <a
                      href={`/api/proposals/${proposal?.id}/export?format=pdf&template=${printTemplate}&brandType=${brandType}&primaryColor=${encodeURIComponent(primaryColor)}&secondaryColor=${encodeURIComponent(secondaryColor)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setShowExportOptions(false)}
                    >
                      Print PDF
                    </a>
                    <a
                      href={`/api/proposals/${proposal?.id}/export?format=pdf&template=${presentationTemplate}&type=presentation&brandType=${brandType}&primaryColor=${encodeURIComponent(primaryColor)}&secondaryColor=${encodeURIComponent(secondaryColor)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setShowExportOptions(false)}
                    >
                      Presentation PDF
                    </a>
                    <a
                      href={`/api/proposals/${proposal?.id}/export?format=markdown`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setShowExportOptions(false)}
                    >
                      Markdown
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
            </div>
            
        {/* Content Tab */}
        {activeTab === 'content' && (
          <>
            <div className="flex h-[calc(100vh-16rem)]">
              {/* Left column - Proposal Sections */}
              <div className="w-2/3 overflow-y-auto pr-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={proposal.sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    {proposal.sections.map((section) => (
                      <SortableProposalSection
                        key={section.id}
                        id={section.id}
                        section={section}
                        onUpdate={handleSectionUpdate}
                        onImprove={handleSectionImprove}
                        onDelete={handleDeleteSection}
                        onCancel={handleCancelDrafting}
                        isEditing={currentSection === section.id}
                        isImproving={currentSection === section.id && isImprovingSections[section.id]}
                        isDrafting={draftingSections[section.id]}
                        isImprovable={improvableSections.includes(section.id)}
                        isAnySectionDragging={isAnySectionDragging}
                        onCompanySearch={section.id === 'companyInfo' ? handleCompanySearch : undefined}
                        onClientSearch={section.id === 'clientInfo' ? handleClientSearch : undefined}
                        onCompanyAISearch={section.id === 'companyInfo' ? handleCompanyAISearch : undefined}
                        onClientAISearch={section.id === 'clientInfo' ? handleClientAISearch : undefined}
                        onCompanySelect={section.id === 'companyInfo' ? handleCompanySelect : undefined}
                        onClientSelect={section.id === 'clientInfo' ? handleClientSelect : undefined}
                        selectedCompany={selectedCompany}
                        selectedClient={selectedClient}
                      />
                    ))}
                  </SortableContext>
                </DndContext>

                <AddSectionButton onClick={handleAddSection} />
          </div>

              {/* Right column - Chat */}
              <div className="w-1/3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <ChatContainer
                  proposalId={proposal.id}
              onSectionUpdate={handleSectionUpdate}
              onSectionImprove={handleSectionImprove}
              onDocumentAnalysis={handleDocumentAnalysis}
              currentSection={currentSection}
              onSetCurrentSection={setCurrentSection}
                  isImproving={Object.values(improvingSections).some(Boolean)}
                  sections={proposal.sections}
                  onDraftingSectionsUpdate={handleDraftingSectionsUpdate}
            />
          </div>
        </div>
          </>
        )}

        {/* Layout Tab */}
        {activeTab === 'layout' && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="grid grid-cols-2 gap-8">
              {/* Print Layout */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Print Layout</h3>
                <div className="space-y-4">
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Brand Colors
                    </label>
                    <div className="flex items-center space-x-4 mb-4">
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Brand Type
                        </label>
                        <select
                          value={brandType}
                          onChange={(e) => setBrandType(e.target.value as 'client' | 'service')}
                          className="block w-40 rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-800 text-sm"
                        >
                          <option value="client">Client Brand</option>
                          <option value="service">Service Brand</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Primary Color
                        </label>
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="h-9 w-20 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Secondary Color
                        </label>
                        <input
                          type="color"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="h-9 w-20 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {TEMPLATES.filter(t => t.type === 'document').map(template => (
                      <button
                        key={template.id}
                        onClick={() => setPrintTemplate(template.id)}
                        className={`
                          p-4 border rounded-lg text-left transition-all
                          ${printTemplate === template.id
                            ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'}
                        `}
                      >
                        <div className="aspect-[8.5/11] mb-2 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                          <Image
                            src={`/templates/${template.id}-preview.png`}
                            alt={template.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/templates/default-preview.png';
                            }}
                          />
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{template.name}</h4>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Presentation Layout */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Presentation Layout</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {TEMPLATES.filter(t => t.type === 'presentation').map(template => (
                      <button
                        key={template.id}
                        onClick={() => setPresentationTemplate(template.id)}
                        className={`
                          p-4 border rounded-lg text-left transition-all
                          ${presentationTemplate === template.id
                            ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'}
                        `}
                      >
                        <div className="aspect-video mb-2 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                          <Image
                            src={`/templates/${template.id}-preview.png`}
                            alt={template.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/templates/default-preview.png';
                            }}
                          />
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{template.name}</h4>
                      </button>
            ))}
          </div>

                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Presentation Content</h4>
                    <div className="border rounded-lg dark:border-gray-700">
                      <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Edit RevealJS Markdown</span>
                          <button
                            onClick={() => handleRegenerateSlides()}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700"
                          >
                            Regenerate with AI
                          </button>
        </div>
                      </div>
                      <div className="p-4">
                        <textarea
                          value={presentationMarkdown}
                          onChange={(e) => setPresentationMarkdown(e.target.value)}
                          className="w-full h-64 p-2 border rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white font-mono text-sm"
                          placeholder="Edit your presentation markdown here..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Image Management */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Section Images</h3>
              <div className="space-y-4">
                {proposal.sections.map(section => (
                  <div key={section.id} className="border rounded-lg p-4 dark:border-gray-700">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">{section.title}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Background Image
                        </label>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleGenerateImage(section.id, 'background')}
                            className="px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
                          >
                            Generate with AI
                          </button>
                          <span className="text-gray-500 dark:text-gray-400">or</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, section.id, 'background')}
                            className="text-sm text-gray-500 dark:text-gray-400
                            file:mr-4 file:py-2 file:px-4 file:rounded-md
                            file:border-0 file:text-sm file:font-medium
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Content Images
                        </label>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleGenerateImage(section.id, 'content')}
                            className="px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
                          >
                            Generate with AI
                          </button>
                          <span className="text-gray-500 dark:text-gray-400">or</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleImageUpload(e, section.id, 'content')}
                            className="text-sm text-gray-500 dark:text-gray-400
                            file:mr-4 file:py-2 file:px-4 file:rounded-md
                            file:border-0 file:text-sm file:font-medium
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-4">
              <button
                onClick={() => setActiveTab('content')}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLayout}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Layout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 