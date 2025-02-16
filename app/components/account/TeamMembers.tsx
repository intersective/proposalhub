import { useState } from 'react';
import { useAccount } from '@/app/hooks/useAccount';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SystemRole, UserRole } from '@/app/types/account';

const roleOptions: { id: SystemRole; name: string; description: string }[] = [
  { id: 'owner', name: 'Owner', description: 'Full access to all resources and settings' },
  { id: 'admin', name: 'Admin', description: 'Can manage most resources and settings' },
  { id: 'member', name: 'Member', description: 'Can view and interact with assigned resources' },
];

export default function TeamMembers() {
  const { account } = useAccount();
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<SystemRole>('member');
  const queryClient = useQueryClient();

  const { mutate: inviteMember, isLoading: isInviting } = useMutation({
    mutationFn: async (data: { email: string; role: SystemRole }) => {
      const response = await fetch('/api/account/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to invite team member');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] });
      setInviteEmail('');
      setSelectedRole('member');
    },
  });

  const { mutate: updateRole, isLoading: isUpdating } = useMutation({
    mutationFn: async ({ contactId, roles }: { contactId: string; roles: SystemRole[] }) => {
      const response = await fetch(`/api/account/team/${contactId}/roles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles }),
      });
      if (!response.ok) throw new Error('Failed to update role');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] });
    },
  });

  const { mutate: removeMember, isLoading: isRemoving } = useMutation({
    mutationFn: async (contactId: string) => {
      const response = await fetch(`/api/account/team/${contactId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove team member');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] });
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    inviteMember({ email: inviteEmail, role: selectedRole });
  };

  if (!account) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Current Team Members */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                Name
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Email
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Role
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {account.userRoles.map((userRole: UserRole) => (
              <tr key={userRole.contactId}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                  {userRole.contactId}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {userRole.contactId}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <select
                    value={userRole.roles[0]}
                    onChange={(e) => updateRole({ 
                      contactId: userRole.contactId, 
                      roles: [e.target.value as SystemRole] 
                    })}
                    disabled={isUpdating}
                    className="rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  >
                    {roleOptions.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <button
                    type="button"
                    onClick={() => removeMember(userRole.contactId)}
                    disabled={isRemoving}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Form */}
      <form onSubmit={handleInvite} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
            Invite Team Member
          </label>
          <div className="mt-2 flex gap-x-4">
            <input
              type="email"
              name="email"
              id="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Email address"
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as SystemRole)}
              className="rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            >
              {roleOptions.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={isInviting || !inviteEmail}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {isInviting ? 'Inviting...' : 'Invite'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 