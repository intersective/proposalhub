'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { UserPlus, Briefcase, GraduationCap, Award } from 'lucide-react';
import ContactSearchModal from '@/app/components/contact/ContactSearchModal';
import TeamMemberEditModal from './TeamMemberEditModal';
import { Contact } from '@/app/types/contact';
import Navigation from '@/app/components/navigation';
import { TeamMember } from './types';

interface TeamPageClientProps {
  organizationId: string;
  initialTeam?: TeamMember[];
}

interface EnrichedData {
  title?: string;
  background?: string;
  linkedIn?: string;
  image?: string;
  additionalTitles?: string[];
}

export default function TeamPageClient({ organizationId, initialTeam = [] }: TeamPageClientProps) {
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [team, setTeam] = useState<TeamMember[]>(initialTeam);
  const [isEnrichingMember, setIsEnrichingMember] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await fetch(`/api/organizations/team`);
        if (response.ok) {
          const data = await response.json();
          setTeam(data);
        }
      } catch (error) {
        console.error('Error fetching team members:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamMembers();
  }, [organizationId]);

  const handleAddMember = async (contact: Contact) => {
    try {
      const response = await fetch(`/api/organizations/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: contact.id })
      });

      if (response.ok) {
        const newMember = await response.json();
        setTeam(prev => [...prev, newMember]);
      }
    } catch (error) {
      console.error('Error adding team member:', error);
    } finally {
      setShowContactModal(false);
    }
  };

  const handleCreateMember = async (memberData: Partial<TeamMember>) => {
    try {
      const response = await fetch(`/api/organizations/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...memberData, isTeamMember: true })
      });

      if (response.ok) {
        const newMember = await response.json();
        setTeam(prev => [...prev, newMember]);
      }
    } catch (error) {
      console.error('Error creating team member:', error);
    }
  };

  const handleRemoveMember = async (contactId: string) => {
    try {
      await fetch(`/api/organizations/team/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTeamMember: false })
      });
      setTeam(prev => prev.filter(member => member.id !== contactId));
    } catch (error) {
      console.error('Error removing team member:', error);
    }
  };

  const handleEnrichMember = async (memberId?: string): Promise<{ ok: boolean; error?: string, needsAuth?: boolean, data?: EnrichedData }> => {
    if (memberId) {
      setIsEnrichingMember(memberId);
    }
    let result = {ok: true, error: "", needsAuth: false};
    try {
      const member = memberId ? team.find(m => m.id === memberId) : null;
      if (memberId && !member) {
        throw new Error('Member not found');
      }

      const response = await fetch(`/api/organizations/team/${memberId || 'search'}/ai-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(member ? {
          firstName: member.name.split(' ')[0],
          lastName: member.name.split(' ').slice(1).join(' '),
          linkedIn: member.linkedIn,
          organizationName: member.organization?.name
        } : {
          firstName: '',
          lastName: '',
          linkedIn: '',
          organizationName: ''
        })
      });

      if (response.ok) {
        const enrichedData = await response.json();
        if (memberId) {
          setTeam(prev => prev.map(member => 
            member.id === memberId ? { ...member, ...enrichedData } : member
          ));
        }
        return { ok: true, data: enrichedData };
      } else {
        const error = await response.json();
        result = {ok: false, error: error.error, needsAuth: error.needsAuth};
      }
    } catch (error) {
      console.error('Error enriching member data:', error);
      result.ok = false;
    } finally {
      if (memberId) {
        setIsEnrichingMember(null);
      }
    }
    return result;
  };

  const handleUpdateMember = async (memberId: string, updates: Partial<TeamMember>) => {
    try {
      const response = await fetch(`/api/organizations/team/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        const updatedMember = await response.json();
        setTeam(prev => prev.map(member => 
          member.id === memberId ? { ...member, ...updatedMember } : member
        ));
      }
    } catch (error) {
      console.error('Error updating team member:', error);
    }
  };

  const handleSaveMember = async (updates: Partial<TeamMember>) => {
    if (editingMember) {
      await handleUpdateMember(editingMember.id, updates);
      setEditingMember(null);
    } else {
      await handleCreateMember(updates);
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Members</h1>
            <button
              onClick={() => setShowContactModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Add to Team
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoading ? (
              <div className="col-span-full flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
              </div>
            ) : team.map(member => (
              <div 
                key={member.id} 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer transition-transform hover:scale-105"
                onClick={() => setEditingMember(member)}
              >
                <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
                  {member.imageUrl ? (
                    <Image
                      src={member.imageUrl}
                      alt={member.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                      <span className="text-4xl text-gray-400 dark:text-gray-500">
                        {member.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{member.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{member.title}</p>
                    </div>
                  </div>

                  {member.skills && member.skills.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {member.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {member.credentials && (
                    <div className="space-y-3">
                      {member.credentials.pastRoles && member.credentials.pastRoles.length > 0 && (
                        <div className="flex items-start space-x-2">
                          <Briefcase className="w-4 h-4 text-gray-400 mt-1" />
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {member.credentials.pastRoles[0]}
                          </div>
                        </div>
                      )}
                      {member.credentials.degrees && member.credentials.degrees.length > 0 && (
                        <div className="flex items-start space-x-2">
                          <GraduationCap className="w-4 h-4 text-gray-400 mt-1" />
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {member.credentials.degrees[0]}
                          </div>
                        </div>
                      )}
                      {member.credentials.certifications && member.credentials.certifications.length > 0 && (
                        <div className="flex items-start space-x-2">
                          <Award className="w-4 h-4 text-gray-400 mt-1" />
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {member.credentials.certifications[0]}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveMember(member.id);
                      }}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <ContactSearchModal
            isOpen={showContactModal}
            onClose={() => setShowContactModal(false)}
            onSelect={handleAddMember}
            onCreateNew={() => {
              setShowContactModal(false);
              setIsCreating(true);
            }}
            organizationId={organizationId}
          />

          <TeamMemberEditModal
            member={editingMember || undefined}
            isOpen={Boolean(editingMember) || isCreating}
            onClose={() => {
              setEditingMember(null);
              setIsCreating(false);
            }}
            onSave={handleSaveMember}
            onEnrich={handleEnrichMember}
            isEnriching={Boolean(isEnrichingMember)}
          />
        </div>
      </div>
    </div>
  );
} 