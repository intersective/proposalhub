import { useState } from 'react';
import { useAccount } from '@/app/hooks/useAccount';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PasskeyCredential } from '@/app/types/account';

export default function PasskeyManager() {
  const { profile } = useAccount();
  const [isRegistering, setIsRegistering] = useState(false);
  const queryClient = useQueryClient();

  const { mutate: removePasskey, isLoading: isRemoving } = useMutation({
    mutationFn: async (credentialID: string) => {
      const response = await fetch(`/api/account/passkeys/${credentialID}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove passkey');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });

  const handleRegisterPasskey = async () => {
    try {
      setIsRegistering(true);
      
      // Get registration options from server
      const optionsRes = await fetch('/api/account/passkeys/options');
      const options = await optionsRes.json();
      
      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: options
      }) as PublicKeyCredential;

      // Send credential to server
      const response = await fetch('/api/account/passkeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawId: Array.from(new Uint8Array(credential.rawId)),
          response: {
            clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON)),
            attestationObject: Array.from(new Uint8Array((credential.response as AuthenticatorAttestationResponse).attestationObject)),
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to register passkey');
      
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    } catch (error) {
      console.error('Failed to register passkey:', error);
      alert('Failed to register passkey. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        {profile?.passkeys.map((passkey: PasskeyCredential) => (
          <div key={passkey.id} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Passkey</p>
              <p className="text-sm text-gray-500">
                Added on {new Date(passkey.createdAt).toLocaleDateString()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removePasskey(passkey.credentialID)}
              disabled={isRemoving}
              className="rounded-md bg-red-50 px-2.5 py-1.5 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-100 disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={handleRegisterPasskey}
          disabled={isRegistering}
          className="rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-100 disabled:opacity-50"
        >
          {isRegistering ? 'Registering...' : 'Add new passkey'}
        </button>
      </div>
    </div>
  );
} 