'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/app/components/navigation';
import { ProposalRecord, ProposalResponse } from '@/app/types/proposal';

// Helper function to get organization/contact info from sections
const getOrganizationAndContactInfo = (sections: ProposalRecord['sections']) => {
  const organizationSection = sections.find(s => s.id === 'organizationInfo');
  const contactSection = sections.find(s => s.id === 'contactInfo');
  
  return {
    organizationName: organizationSection?.type === 'fields' ? (organizationSection.content as Record<string, string>).name : undefined,
    contactName: contactSection?.type === 'fields' ? (contactSection.content as Record<string, string>).name : undefined
  };
};

export default function ProposalsPageClient() {
  const router = useRouter();
  const [proposals, setProposals] = useState<ProposalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const response = await fetch('/api/proposals');
        if (response.ok) {
          const data = await response.json();
          setProposals(data.map((p: ProposalResponse) => ({
            ...p,
            updatedAt: new Date(p.updatedAt)
          })));
        }
      } catch (error) {
        console.error('Error fetching proposals:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProposals();
  }, []);

  const handleNewProposal = async () => {
    try {
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'draft',
          sections: [
            {
              id: 'organizationInfo',
              title: 'Organization Information',
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
              id: 'contactInfo',
              title: 'Contact Information',
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
          ]
        })
      });

      if (response.ok) {
        const { id } = await response.json();
        router.push(`/manage/proposals/edit/${id}`);
      }
    } catch (error) {
      console.error('Error creating new proposal:', error);
    }
  };

  const handleDelete = async (proposalId: string) => {
    if (!confirm('Are you sure you want to delete this proposal?')) return;
    
    try {
      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setProposals(proposals.filter(p => p.id !== proposalId));
      }
    } catch (error) {
      console.error('Error deleting proposal:', error);
    }
  };

  const getStatusColor = (status: ProposalRecord['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Proposals</h1>
            <button
              onClick={handleNewProposal}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              New Proposal
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
            </div>
          ) : proposals.length > 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {proposals.map((proposal) => (
                  <li key={proposal.id}>
                    <div className="block hover:bg-gray-50">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-lg font-medium text-blue-600 truncate">
                              {proposal.title || 'Untitled Proposal'}
                            </p>
                            <div className="mt-1">
                              {getOrganizationAndContactInfo(proposal.sections).organizationName && (
                                <p className="text-sm text-gray-600">
                                  Organization: {getOrganizationAndContactInfo(proposal.sections).organizationName}
                                </p>
                              )}
                              {getOrganizationAndContactInfo(proposal.sections).contactName && (
                                <p className="text-sm text-gray-600">
                                  Contact: {getOrganizationAndContactInfo(proposal.sections).contactName}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(proposal.status)}`}>
                              {proposal.status}
                            </span>
                            <button
                              onClick={() => router.push(`/manage/proposals/edit/${proposal.id}`)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(proposal.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <p className="flex items-center text-sm text-gray-500">
                            Last updated {proposal.updatedAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="mt-2 text-sm font-medium text-gray-900">No proposals</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new proposal.
              </p>
              <div className="mt-6">
                <button
                  onClick={handleNewProposal}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  New Proposal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 