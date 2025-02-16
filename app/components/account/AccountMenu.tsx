import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { UserCircleIcon, BuildingOfficeIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { UserOrganizations } from '@/app/types/account';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function AccountMenu() {
  const { data: session } = useSession();
  
  const { data: profile } = useQuery<UserOrganizations>({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await fetch('/api/account');
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
    enabled: !!session
  });

  const currentOrg = profile?.organizationId;
  const isOwner = profile?.role === 'owner';

  return (
    <Menu as="div" className="relative ml-3">
      <div>
        <Menu.Button className="flex rounded-full bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
          <span className="sr-only">Open user menu</span>
          <UserCircleIcon className="h-8 w-8 text-gray-400 dark:text-gray-300" aria-hidden="true" />
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {/* User Profile */}
          <Menu.Item>
            {({ active }) => (
              <Link
                href="/manage/account/profile"
                className={classNames(
                  active ? 'bg-gray-100 dark:bg-gray-700' : '',
                  'flex px-4 py-2 text-sm text-gray-700 dark:text-gray-200'
                )}
              >
                <UserCircleIcon className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-300" aria-hidden="true" />
                Your Profile
              </Link>
            )}
          </Menu.Item>

          {/* Organization Management - Only show if user is owner */}
          {isOwner && (
            <Menu.Item>
              {({ active }) => (
                <Link
                  href={`/manage/organizations/${currentOrg}/edit`}
                  className={classNames(
                    active ? 'bg-gray-100 dark:bg-gray-700' : '',
                    'flex px-4 py-2 text-sm text-gray-700 dark:text-gray-200'
                  )}
                >
                  <BuildingOfficeIcon className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-300" aria-hidden="true" />
                  Organization Settings
                </Link>
              )}
            </Menu.Item>
          )}

          {/* Organization Switcher - Only show if user has multiple organizations */}
          {profile?.organizations.length && profile?.organizations.length > 1 && (
            <div className="px-1 py-1">
              <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400">Switch Organization</div>
              {profile.organizations.map((organization) => (
                <Menu.Item key={organization.id}>
                  {({ active }) => (
                    <Link
                      href={`/switch-org?orgId=${organization.id}`}
                      className={classNames(
                        active ? 'bg-gray-100 dark:bg-gray-700' : '',
                        'block px-4 py-2 text-sm text-gray-700 dark:text-gray-200'
                      )}
                    >
                      {organization.name}
                    </Link>
                  )}
                </Menu.Item>
              ))}
            </div>
          )}

          {/* Sign Out */}
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={() => signOut()}
                className={classNames(
                  active ? 'bg-gray-100 dark:bg-gray-700' : '',
                  'flex w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200'
                )}
              >
                <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-300" aria-hidden="true" />
                Sign Out
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
} 