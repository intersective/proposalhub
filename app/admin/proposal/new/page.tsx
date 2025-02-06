'use client'
// pages/admin/new-proposal.tsx
import { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import ProposalSection from '../../../components/ProposalSection';
import LoadingIndicator from '../../../components/LoadingIndicator';
import Navigation from '../../../components/Navigation';
import SearchableDropdown from '../../../components/SearchableDropdown';
import { Company, Client } from '../../../lib/companyDatabase';
import { Option } from '../../../components/SearchableDropdown';

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

interface ClientInfo {
  name: string | null;
  company: string | null;
  email?: string | null;
  linkedIn?: string | null;
  background?: string;
  companyBackground?: string;
}

interface ExtractedResponse {
  clientInfo: ClientInfo;
  models: {
    extraction: string;
    background: string | null;
  };
  content?: string | Record<string, string>;
  proposalSections?: Record<string, string>;
}

interface Section {
  id: string;
  title: string;
  content: string | Record<string, string>;
  type: 'text' | 'fields';
}

interface DraftProposal {
  id: string;
  clientName: string;
  companyName: string;
  lastUpdated: Date;
  sections: Section[];
}

export default function NewProposal() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: "Select a company and client or tell me the name, email, LinkedIn or website of your client or company to start."
    }
  ]);
  const [sections, setSections] = useState<Section[]>([
    {
      id: 'companyInfo',
      title: 'Company Information',
      type: 'fields',
      content: {
        name: '',
        url: '',
        sector: '',
        size: '',
        background: ''
      }
    },
    {
      id: 'clientInfo',
      title: 'Client Information',
      type: 'fields',
      content: {
        name: '',
        email: '',
        linkedInUrl: '',
        phoneOptional: '',
        background: ''
      }
    },
    {
      id: 'executiveSummary',
      title: 'Executive Summary',
      type: 'text',
      content: ''
    },
    {
      id: 'projectBackground',
      title: 'Project Background',
      type: 'text',
      content: ''
    },
    {
      id: 'projectScope',
      title: 'Project Scope',
      type: 'text',
      content: ''
    },
    {
      id: 'proposedApproach',
      title: 'Proposed Approach',
      type: 'text',
      content: ''
    },
    {
      id: 'projectTimeline',
      title: 'Project Timeline',
      type: 'text',
      content: ''
    },
    {
      id: 'deliverables',
      title: 'Deliverables',
      type: 'text',
      content: ''
    },
    {
      id: 'pricing',
      title: 'Pricing',
      type: 'text',
      content: ''
    },
    {
      id: 'team',
      title: 'Team',
      type: 'text',
      content: ''
    },
    {
      id: 'conclusion',
      title: 'Conclusion',
      type: 'text',
      content: ''
    }
  ]);
  const [pendingInfo, setPendingInfo] = useState<ExtractedResponse | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortController = useRef<AbortController | null>(null);
  const [draftProposals, setDraftProposals] = useState<DraftProposal[]>([]);
  const [showDraftSelector, setShowDraftSelector] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      setMessages(prev => [...prev, {
        role: 'user',
        content: 'Uploaded files:',
        files: acceptedFiles
      }]);
      scrollToBottom();
    }
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Fetch draft proposals when component mounts
    const fetchDrafts = async () => {
      try {
        const response = await fetch('/api/proposals/drafts');
        if (response.ok) {
          const drafts = await response.json();
          setDraftProposals(drafts);
        }
      } catch (error) {
        console.error('Error fetching drafts:', error);
      }
    };
    fetchDrafts();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCancel = () => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = {
      role: 'user' as const,
      content: inputValue
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    abortController.current = new AbortController();

    try {
      const response = await fetch('/api/process-client-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: inputValue,
          section: currentSection 
        }),
        signal: abortController.current.signal
      });
      
      if (response.ok) {
        const data: ExtractedResponse = await response.json();
        if (!currentSection) {
          setPendingInfo(data);
          const aiResponse = {
            role: 'assistant' as const,
            content: `I found the following information:\n\nClient: ${data.clientInfo.name || 'Not found'}\nCompany: ${data.clientInfo.company || 'Not found'}\n\n${data.clientInfo.background ? `\nCompany Background:\n${data.clientInfo.background}` : ''}\n\nIs this information correct?`
          };
          setMessages(prev => [...prev, aiResponse]);
        } else if (data.content) {
          // Update the section content
          setSections(prev => prev.map(section => 
            section.id === currentSection
              ? { ...section, content: data.content! }
              : section
          ));
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'I\'ve updated the section. Would you like to make any other improvements?'
          }]);
        }
      } else {
        const errorData = await response.json();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `I'm sorry, I couldn't process that information. ${errorData.error}`
        }]);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'The operation was cancelled.'
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `I'm sorry, there was an error processing your information. ${error instanceof Error ? error.message : 'Please try again.'}`
        }]);
      }
    } finally {
      setIsLoading(false);
      abortController.current = null;
    }
  };

  const handleCompanyCreation = async (metadata: MessageMetadata) => {
    if (!metadata.companyInfo) return;
    
    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata.companyInfo)
      });

      if (response.ok) {
        const company = await response.json();
        handleCompanySelect(company);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `I've created a new company record for ${company.name}.`
        }]);
      }
    } catch (error) {
      console.error('Error creating company:', error);
    }
  };

  const handleClientCreation = async (metadata: MessageMetadata) => {
    if (!metadata.clientInfo || !selectedCompany) return;
    
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...metadata.clientInfo,
          companyId: selectedCompany.id
        })
      });

      if (response.ok) {
        const client = await response.json();
        handleClientSelect(client);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `I've created a new client record for ${client.name}. Now, tell me about the project you're working on with them.`
        }]);
      }
    } catch (error) {
      console.error('Error creating client:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, there was an error creating the client record. Please try again."
      }]);
    }
  };

  const handleValidation = (isCorrect: boolean, message: Message) => {
    const metadata = message.metadata;
    if (!metadata) return;

    if (isCorrect) {
      if (metadata.type === 'company_creation') {
        handleCompanyCreation(metadata);
      } else if (metadata.type === 'client_creation') {
        handleClientCreation(metadata);
      }
    } else {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I apologize for the mistake. Please try searching again with more specific information."
      }]);
    }
  };

  const createNewProposal = async (info: ExtractedResponse) => {
    try {
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientInfo: info.clientInfo,
          sections: info.proposalSections
        })
      });

      if (response.ok) {
        const { id } = await response.json();
        router.push(`/admin/proposal/${id}`);
      }
    } catch (error) {
      console.error('Error creating proposal:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, there was an error creating the proposal. Please try again."
      }]);
    }
  };

  const handleDraftSelection = (draft: DraftProposal) => {
    setShowDraftSelector(false);
    router.push(`/admin/proposal/${draft.id}`);
  };

  const handleSectionUpdate = (id: string, content: string | Record<string, string>) => {
    setSections(prev => prev.map(section =>
      section.id === id ? { ...section, content } : section
    ));
  };

  const handleSectionImprove = async (id: string) => {
    setCurrentSection(id);
    const section = sections.find(s => s.id === id);
    if (section) {
      if (section.id === 'companyInfo' && selectedCompany) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `I'll search for more information about ${selectedCompany.name}.`
        }]);

        try {
          const response = await fetch('/api/process-client-info', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: `Find detailed information about the company: ${selectedCompany.name}`,
              type: 'company'
            })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.companyInfo) {
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: `I found additional information about ${selectedCompany.name}:\n\n${data.companyInfo.background}\n\nWould you like me to update the company information with these details?`,
                metadata: {
                  type: 'company_update',
                  companyInfo: data.companyInfo
                }
              }]);
            }
          }
        } catch (error) {
          console.error('Error improving company info:', error);
        }
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Let's improve the ${section.title.toLowerCase()} section. What would you like to change or enhance?`
        }]);
      }
    }
  };

  const searchCompanies = async (query: string) => {
    try {
      const response = await fetch(`/api/companies/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const companies = await response.json();
        return companies;
      }
      return [];
    } catch (error) {
      console.error('Error searching companies:', error);
      return [];
    }
  };

  const handleCompanyAISearch = async (query: string) => {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `The company "${query}" was not found in our database. I'll search for information about it.`
    }]);

    try {
      const aiResponse = await fetch('/api/process-client-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Find information about the company: ${query}`,
          type: 'company'
        })
      });

      if (aiResponse.ok) {
        const data = await aiResponse.json();
        if (data.companyInfo) {
          const metadata: MessageMetadata = {
            type: 'company_creation',
            companyInfo: data.companyInfo
          };
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `I found the following information about ${query}:\n\n${data.companyInfo.background}\n\nIs this the company you're looking for?`,
            metadata
          }]);
        }
      }
    } catch (error) {
      console.error('Error performing AI search:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error while searching for company information.'
      }]);
    }
  };

  const searchClients = async (query: string) => {
    try {
      const url = new URL('/api/clients/search', window.location.origin);
      url.searchParams.set('q', query);
      if (selectedCompany) {
        url.searchParams.set('companyId', selectedCompany.id);
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const clients = await response.json();
        return clients;
      }
      return [];
    } catch (error) {
      console.error('Error searching clients:', error);
      return [];
    }
  };

  const handleClientAISearch = async (query: string) => {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `I'll search for information about ${query}.`
    }]);

    try {
      const response = await fetch('/api/process-client-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          type: 'client'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.clientInfo) {
          const metadata: MessageMetadata = {
            type: 'client_creation',
            clientInfo: data.clientInfo
          };
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `I found the following information:\n\nName: ${data.clientInfo.name}\nEmail: ${data.clientInfo.email || 'Not found'}\nLinkedIn: ${data.clientInfo.linkedIn || 'Not found'}\n\n${data.clientInfo.background ? `Background:\n${data.clientInfo.background}` : ''}\n\nIs this the person you're looking for?`,
            metadata
          }]);
        }
      }
    } catch (error) {
      console.error('Error performing AI search:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error while searching for client information.'
      }]);
    }
  };

  const handleCompanySelect = async (company: Company | null) => {
    setSelectedCompany(company);
    if (company) {
      // Update company info section
      setSections(prev => prev.map(section => {
        if (section.id === 'companyInfo') {
          return {
            ...section,
            content: {
              name: company.name,
              website: company.website || '',
              sector: company.sector || '',
              size: company.size || '',
              background: company.background || ''
            }
          };
        }
        return section;
      }));

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I found ${company.name} in our database. Please select or enter the client contact information.`
      }]);
    } else {
      setSelectedClient(null);
    }
  };

  const handleClientSelect = async (client: Client | null) => {
    setSelectedClient(client);
    if (client) {
      // Update client info section
      setSections(prev => prev.map(section => {
        if (section.id === 'clientInfo') {
          return {
            ...section,
            content: {
              name: client.name,
              email: client.email || '',
              linkedInUrl: client.linkedIn || '',
              phoneOptional: client.phone || '',
              background: client.background || ''
            }
          };
        }
        return section;
      }));

      // Create new proposal
      createNewProposal({
        clientInfo: {
          name: client.name,
          company: selectedCompany?.name || null,
          email: client.email || null,
          linkedIn: client.linkedIn || null,
          background: client.background,
          companyBackground: selectedCompany?.background
        },
        models: { extraction: 'database', background: 'database' }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      {/* Draft Selector Modal */}
      {showDraftSelector && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Existing Drafts Found</h3>
            <div className="space-y-4">
              {draftProposals.map(draft => (
                <div
                  key={draft.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleDraftSelection(draft)}
                >
                  <div className="font-medium text-gray-900 dark:text-white">{draft.clientName}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{draft.companyName}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    Last updated: {new Date(draft.lastUpdated).toLocaleDateString()}
                  </div>
                </div>
              ))}
              <button
                onClick={() => {
                  setShowDraftSelector(false);
                  if (pendingInfo) {
                    createNewProposal(pendingInfo);
                  }
                }}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                Create New Proposal
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex h-[calc(100vh-10rem)]">
          {/* Left column - Chat */}
          <div className="w-1/2 flex flex-col h-full border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-l-lg shadow-sm">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="space-y-4">
                <SearchableDropdown
                  value={selectedCompany as unknown as Option}
                  onChange={(option) => handleCompanySelect(option as unknown as Company | null)}
                  onSearch={searchCompanies}
                  onAISearch={handleCompanyAISearch}
                  placeholder="Search for a company..."
                  label="Company"
                />
                <SearchableDropdown
                  value={selectedClient as unknown as Option}
                  onChange={(option) => handleClientSelect(option as unknown as Client | null)}
                  onSearch={searchClients}
                  onAISearch={handleClientAISearch}
                  placeholder="Search for a client..."
                  label="Client"
                  disabled={!selectedCompany}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-3/4 p-4 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.files && (
                      <div className="mt-2">
                        {message.files.map((file, i) => (
                          <div key={i} className="text-sm">
                            📎 {file.name}
                          </div>
                        ))}
                      </div>
                    )}
                    {message.role === 'assistant' && message.metadata && message.content.includes('Is this') && (
                      <div className="mt-4 flex space-x-4">
                        <button
                          onClick={() => handleValidation(true, message)}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => handleValidation(false, message)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                        >
                          No
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <LoadingIndicator onCancel={handleCancel} />
              )}
              <div ref={messagesEndRef} />
            </div>

            <div
              {...getRootProps()}
              className={`p-4 border-t border-b border-gray-200 dark:border-gray-700 ${
                isDragActive ? 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-800'
              }`}
            >
              <input {...getInputProps()} />
              <p className="text-center text-gray-500 dark:text-gray-400">
                {isDragActive
                  ? 'Drop the files here...'
                  : 'Drag and drop files here, or click to select files'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-gray-800">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={currentSection 
                    ? `Improving ${sections.find(s => s.id === currentSection)?.title}...` 
                    : "Type your message..."}
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-800"
                >
                  Send
                </button>
              </div>
            </form>
          </div>

          {/* Right column - Proposal Sections */}
          <div className="w-1/2 overflow-y-auto p-4 bg-white dark:bg-gray-800 rounded-r-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Proposal Sections</h2>
            {sections.map(section => (
              <ProposalSection
                key={section.id}
                section={section}
                onUpdate={handleSectionUpdate}
                onImprove={handleSectionImprove}
                isEditing={currentSection === section.id}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}