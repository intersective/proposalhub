import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserProfile, AccountRecord } from '@/app/types/account';

interface ExtendedUserProfile extends UserProfile {
  organizations: Array<{
    id: string;
    name: string;
    logoUrl?: string;
    role: string;
  }>;
}

export function useAccount() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading: isLoadingProfile } = useQuery<ExtendedUserProfile>({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await fetch('/api/account');
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    }
  });

  const { mutate: updateProfile, isPending: isUpdatingProfile } = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      const response = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });

  const { mutate: switchOrganization, isPending: isSwitchingOrg } = useMutation({
    mutationFn: async (organizationId: string) => {
      const response = await fetch('/api/switch-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      });
      if (!response.ok) throw new Error('Failed to switch organization');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      // Refresh the page to update all data with new organization context
      window.location.reload();
    },
  });

  const { data: account, isLoading: isLoadingAccount } = useQuery<AccountRecord>({
    queryKey: ['account', profile?.organizationId],
    enabled: !!profile?.organizationId,
    queryFn: async () => {
      const response = await fetch(`/api/account`);
      if (!response.ok) throw new Error('Failed to fetch account');
      return response.json();
    }
  });

  return {
    profile,
    account,
    organizations: profile?.organizations || [],
    isLoading: isLoadingProfile || isLoadingAccount,
    isUpdating: isUpdatingProfile || isSwitchingOrg,
    updateProfile,
    switchOrganization,
  };
} 