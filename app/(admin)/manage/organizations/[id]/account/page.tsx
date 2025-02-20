import { Suspense } from 'react';
import { getAccountByOrgId } from '@/app/lib/database/accountDatabase';
import { getUserProfile } from '@/app/lib/database/accountDatabase';
//import { Account, UserProfile } from '@/app/types/account';
import { redirect } from 'next/navigation';
import NextAuth from "next-auth"
import authConfig from '@/auth.config'
const { auth } = NextAuth(authConfig);

async function AccountPage({ params }: { params: { id: string } }) {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect('/signin');
  }

  const [account, profile] = await Promise.all([
    getAccountByOrgId(params.id),
    getUserProfile(session.user.id)
  ]);

  if (!account || !profile) {
    redirect('/manage/organizations');
  }

  // Check if user has permission to view/edit account
  const hasPermission = profile.accounts.some(
    acc => acc.organizationId === params.id && acc.roles.includes('owner')
  );

  if (!hasPermission) {
    redirect('/manage/organizations');
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="space-y-10 divide-y divide-gray-900/10">
        {/* Subscription section */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
          <div className="px-4 sm:px-0">
            <h2 className="text-base font-semibold leading-7 text-gray-900">Subscription</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Manage your organization&apos;s subscription plan.
            </p>
          </div>

          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
            <div className="px-4 py-6 sm:p-8">
              <div className="max-w-2xl space-y-6">
                <div>
                  <label className="block text-sm font-medium leading-6 text-gray-900">
                    Current Plan
                  </label>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      {account.subscriptionTier.charAt(0).toUpperCase() + account.subscriptionTier.slice(1)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Manage Subscription
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Billing section */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-8 pt-10 md:grid-cols-3">
          <div className="px-4 sm:px-0">
            <h2 className="text-base font-semibold leading-7 text-gray-900">Billing</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Update your billing information and view invoices.
            </p>
          </div>

          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
            <div className="px-4 py-6 sm:p-8">
              <div className="max-w-2xl space-y-6">
                <div>
                  <label className="block text-sm font-medium leading-6 text-gray-900">
                    Billing Email
                  </label>
                  <div className="mt-2">
                    <input
                      type="email"
                      name="billingEmail"
                      defaultValue={account.billingEmail}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Update Payment Method
                </button>

                <button
                  type="button"
                  className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  View Billing History
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Team Members section */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-8 pt-10 md:grid-cols-3">
          <div className="px-4 sm:px-0">
            <h2 className="text-base font-semibold leading-7 text-gray-900">Team Members</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Manage team member access and roles.
            </p>
          </div>

          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
            <div className="px-4 py-6 sm:p-8">
              <div className="max-w-2xl space-y-6">
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
                      {account.userRoles.map((userRole) => (
                        <tr key={userRole.contactId}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {userRole.contactId}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {userRole.contactId}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {userRole.roles.join(', ')}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                              type="button"
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Invite Team Member
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AccountPage params={params} />
    </Suspense>
  );
} 