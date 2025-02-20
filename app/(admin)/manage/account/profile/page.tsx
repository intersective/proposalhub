import { Suspense } from 'react';
import { getUserProfile } from '@/app/lib/database/accountDatabase';
//import { UserProfile } from '@/types/account';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
async function ProfilePage() {
  const session = await auth();
  console.log('session', session);
  if (!session?.user?.email) {
    redirect('/signin');
  }

  const profile = await getUserProfile(session.user.id);

  if (!profile) {
    redirect('/signin');
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="space-y-10 divide-y divide-gray-900/10">
        {/* Profile section */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
          <div className="px-4 sm:px-0">
            <h2 className="text-base font-semibold leading-7 text-gray-900">Profile</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Update your personal information.
            </p>
          </div>

          <form className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
            <div className="px-4 py-6 sm:p-8">
              <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="firstName" className="block text-sm font-medium leading-6 text-gray-900">
                    First name
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      name="firstName"
                      id="firstName"
                      defaultValue={profile.firstName}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="lastName" className="block text-sm font-medium leading-6 text-gray-900">
                    Last name
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      name="lastName"
                      id="lastName"
                      defaultValue={profile.lastName}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>

                <div className="sm:col-span-4">
                  <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                    Email address
                  </label>
                  <div className="mt-2">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={profile.email}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
              <button
                type="submit"
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Save
              </button>
            </div>
          </form>
        </div>

        {/* Passkeys section */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-8 pt-10 md:grid-cols-3">
          <div className="px-4 sm:px-0">
            <h2 className="text-base font-semibold leading-7 text-gray-900">Passkeys</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Manage your authentication passkeys.
            </p>
          </div>

          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
            <div className="px-4 py-6 sm:p-8">
              <div className="flex flex-col space-y-4">
                {profile.passkeys.map((passkey) => (
                  <div key={passkey.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Passkey</p>
                      <p className="text-sm text-gray-500">Added on {new Date(passkey.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button
                      type="button"
                      className="rounded-md bg-red-50 px-2.5 py-1.5 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-100"
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-100"
                >
                  Add new passkey
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Organizations section */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-8 pt-10 md:grid-cols-3">
          <div className="px-4 sm:px-0">
            <h2 className="text-base font-semibold leading-7 text-gray-900">Organizations</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Organizations you belong to.
            </p>
          </div>

          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
            <div className="px-4 py-6 sm:p-8">
              <div className="flex flex-col space-y-4">
                {profile.accounts.map((account) => (
                  <div key={account.organizationId} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{account.organizationName}</p>
                      <p className="text-sm text-gray-500">Roles: {account.roles.join(', ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfilePage />
    </Suspense>
  );
} 