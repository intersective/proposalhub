import { useState, useEffect } from 'react';
import { useAccount } from '@/app/hooks/useAccount';

const subscriptionTiers = [
  { id: 'free', name: 'Free', description: 'Basic features for small teams' },
  { id: 'basic', name: 'Basic', description: 'Essential features for growing teams' },
  { id: 'pro', name: 'Pro', description: 'Advanced features for professional teams' },
  { id: 'enterprise', name: 'Enterprise', description: 'Custom solutions for large organizations' },
] as const;

export default function AccountSettingsForm() {
  const { account, isUpdating } = useAccount();
  const [billingEmail, setBillingEmail] = useState('');

  useEffect(() => {
    if (account?.billingContactId) {
      // Fetch billing contact email from the account
      const fetchBillingContact = async () => {
        try {
          const response = await fetch(`/api/contacts/${account.billingContactId}`);
          if (response.ok) {
            const contact = await response.json();
            setBillingEmail(contact.email || '');
          }
        } catch (error) {
          console.error('Error fetching billing contact:', error);
        }
      };
      fetchBillingContact();
    }
  }, [account?.billingContactId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    // Update the billing contact's email
    if (account.billingContactId) {
      try {
        await fetch(`/api/contacts/${account.billingContactId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: billingEmail }),
        });
      } catch (error) {
        console.error('Error updating billing contact:', error);
      }
    }
  };

  if (!account) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Subscription Section */}
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Subscription</h3>
        <div className="mt-6 space-y-6">
          <div className="flex items-center gap-x-3">
            <h4 className="block text-sm font-medium leading-6 text-gray-900">
              Current Plan:
            </h4>
            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
              {subscriptionTiers.find(tier => tier.id === account.subscriptionTier)?.name}
            </span>
          </div>

          <div className="text-sm text-gray-500">
            {subscriptionTiers.find(tier => tier.id === account.subscriptionTier)?.description}
          </div>

          <button
            type="button"
            onClick={() => window.location.href = '/manage/billing'}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Manage Subscription
          </button>
        </div>
      </div>

      {/* Billing Section */}
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Billing</h3>
        <div className="mt-6 space-y-6">
          <div>
            <label htmlFor="billingEmail" className="block text-sm font-medium leading-6 text-gray-900">
              Billing Email
            </label>
            <div className="mt-2">
              <input
                type="email"
                name="billingEmail"
                id="billingEmail"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => window.location.href = '/manage/billing/payment-method'}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Update Payment Method
            </button>

            <button
              type="button"
              onClick={() => window.location.href = '/manage/billing/history'}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              View Billing History
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isUpdating}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
        >
          {isUpdating ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
} 