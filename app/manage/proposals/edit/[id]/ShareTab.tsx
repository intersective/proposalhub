
'use client';

import { useState, useEffect } from 'react';
import { ProposalRecord } from '@/app/types/proposal';
import { PermissionRecord } from '@/app/types/permission';

export default function ShareTab({ proposalId }: { proposalId: string }) {

    const [proposal, setProposal] = useState<ProposalRecord | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [customerContacts, setCustomerContacts] = useState<Array<{ id: string; name: string; email: string; role?: string }>>([]);
    const [isLoadingContacts, setIsLoadingContacts] = useState(false);
    const [companyContacts, setCompanyContacts] = useState<Array<{ id: string; name: string; email: string; role?: string }>>([]);
    const [currentUser, setCurrentUser] = useState<string | null>(null);

    useEffect(() => {
        const fetchProposal = async () => {
          try {
            const response = await fetch(`/api/proposals/${proposalId}`);
            if (response.ok) {
              const data = await response.json();
              setProposal(data);
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
      const fetchContacts = async () => {
        setIsLoadingContacts(true);
        try {
          // Get current user's contact ID
          const userResponse = await fetch('/api/account');
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setCurrentUser(userData.id);
          }

          // Fetch team contacts
          const companyResponse = await fetch(`/api/contacts/search?organizationId=${proposal.ownerOrganizationId}`);
          if (companyResponse.ok) {
            const companyData = await companyResponse.json();
            setCompanyContacts(companyData);
          }

          // Fetch customer contacts
          const customerResponse = await fetch(`/api/contacts/search?organizationId=${proposal.forOrganizationId}`);
          if (customerResponse.ok) {
            const customerData = await customerResponse.json();
            setCustomerContacts(customerData);
          }

          // Fetch existing permissions
          const permissionsResponse = await fetch(`/api/proposals/${proposalId}/permissions`);
          if (permissionsResponse.ok) {
            const permissions = await permissionsResponse.json() as PermissionRecord[];
            
            // Update contact roles based on permissions
            setCompanyContacts(prev => prev.map(contact => ({
              ...contact,
              role: permissions.find((p: PermissionRecord) => p.permittedEntityId === contact.id)?.role || undefined
            })));
            
            setCustomerContacts(prev => prev.map(contact => ({
              ...contact,
              role: permissions.find((p: PermissionRecord) => p.permittedEntityId === contact.id)?.role || undefined
            })));
          }
        } catch (error) {
          console.error('Error fetching contacts:', error);
        } finally {
          setIsLoadingContacts(false);
        }
      };

      fetchContacts();
    }
  }, [proposal, proposalId]);


  const handleRoleChange = async (contactId: string, newRole: string | undefined, isTeam: boolean) => {
    // Prevent lead from changing their own role
    if (contactId === currentUser && companyContacts.find(c => c.id === contactId)?.role === 'lead') {
      return;
    }

    try {
      if (newRole) {
        // Add or update permission
        await fetch(`/api/proposals/${proposalId}/permissions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            permittedEntity: 'contact',
            permittedEntityId: contactId,
            targetEntity: 'proposal',
            targetEntityId: proposalId,
            role: newRole
          }),
        });
      } else {
        // Prevent removing the lead
        const contact = companyContacts.find(c => c.id === contactId);
        if (contact?.role === 'lead') {
          return;
        }

        // Remove permission
        await fetch(`/api/proposals/${proposalId}/permissions?contactId=${contactId}`, {
          method: 'DELETE',
        });
      }

      // Update local state
      if (isTeam) {
        setCompanyContacts(prev => prev.map(contact => 
          contact.id === contactId ? { ...contact, role: newRole } : contact
        ));
      } else {
        setCustomerContacts(prev => prev.map(contact => 
          contact.id === contactId ? { ...contact, role: newRole } : contact
        ));
      }
    } catch (error) {
      console.error('Error updating permission:', error);
    }
  };

    return (

    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8">
      {isLoadingContacts ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Team Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Team Access</h3>
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Name</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Email</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600 bg-white dark:bg-gray-800">
                  {companyContacts.map((contact) => {
                    const isLead = contact.role === 'lead';
                    const isCurrentUser = contact.id === currentUser;
                    const isDisabled = (isLead && isCurrentUser) || (isLead && !isCurrentUser);
                    
                    return (
                      <tr key={contact.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                          {contact.name}
                          {isCurrentUser && <span className="ml-2 text-xs text-gray-500">(You)</span>}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {contact.email}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <select
                            value={contact.role || ''}
                            onChange={(e) => handleRoleChange(contact.id, e.target.value || undefined, true)}
                            disabled={isDisabled}
                            className="rounded-md border-gray-300 dark:border-gray-600 py-1.5 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 sm:text-sm disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-600"
                          >
                            <option value="">No Access</option>
                            <option value="lead">Lead</option>
                            <option value="team">Team</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Customer Access</h3>
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Name</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Email</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600 bg-white dark:bg-gray-800">
                  {customerContacts.map((contact) => (
                    <tr key={contact.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                        {contact.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {contact.email}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <select
                          value={contact.role || ''}
                          onChange={(e) => handleRoleChange(contact.id, e.target.value || undefined, false)}
                          className="rounded-md border-gray-300 dark:border-gray-600 py-1.5 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 sm:text-sm"
                        >
                          <option value="">No Access</option>
                          <option value="lead">Lead</option>
                          <option value="team">Team</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
    )
}