import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { useAccount } from '@/app/hooks/useAccount';
import Image from 'next/image';
import Link from 'next/link';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function OrganizationSwitcher() {
  const { profile, switchOrganization, isUpdating } = useAccount();

  if (!profile?.organizations) {
    return null;
  }

  const currentOrg = profile.organizations.find(acc => acc.id === profile.organizations[0]?.id);
  const recentOrgs = profile.organizations.slice(0, 3);
  const hasMoreOrgs = profile.organizations.length > 3;

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        className="flex items-center gap-x-2 text-sm font-medium leading-6 text-gray-900 hover:text-gray-600  dark:text-gray-200 dark:hover:text-gray-400"
        disabled={isUpdating}
      >
        {currentOrg?.logoUrl ? (
          <div className="relative w-8 h-8">
            <Image
              src={currentOrg.logoUrl}
              alt={currentOrg.name}
              fill
              className="object-contain rounded-md"
            />
          </div>
        ) : (
          <BuildingOfficeIcon className="h-8 w-8 text-gray-400 dark:text-gray-200" aria-hidden="true" />
        )}
        <span>{currentOrg?.name}</span>
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute left-0 z-10 mt-2 w-72 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:text-gray-200">

          {/* Recent Organizations */}
          <div className="py-2">
            <p className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-200">Recent Organizations</p>
            {recentOrgs.map((org) => (
              <Menu.Item key={org.id}>
                {({ active }) => (
                  <button
                    onClick={() => switchOrganization(org.id)}
                    disabled={isUpdating || org.id === currentOrg?.id}
                    className={classNames(
                      active ? 'bg-gray-50 dark:bg-gray-700' : '',
                      org.id === currentOrg?.id ? 'cursor-default' : '',
                      'flex items-center w-full px-4 py-2 text-sm text-gray-700 disabled:opacity-50 dark:text-gray-200 dark:hover:text-gray-100'
                    )}
                  >
                    <div className="flex items-center gap-x-3 flex-1">
                      {org.logoUrl ? (
                        <div className="relative w-6 h-6">
                          <Image
                            src={org.logoUrl}
                            alt={org.name}
                            fill
                            className="object-contain rounded-md"
                          />
                        </div>
                      ) : (
                        <BuildingOfficeIcon className="h-6 w-6 text-gray-400 dark:text-gray-300" aria-hidden="true" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-gray-900 dark:group-hover:text-white">{org.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-200">{org.role}</p>
                      </div>
                      {org.id === currentOrg?.id && (
                        <span className="text-xs text-blue-600 dark:text-blue-200">Current</span>
                      )}
                    </div>
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>

          {/* View All Link */}
          {hasMoreOrgs && (
            <div className="py-1 border-t border-gray-100">
              <Menu.Item>
                {({ active }) => (
                  <Link
                    href="/manage/organizations"
                    className={classNames(
                      active ? 'bg-gray-50' : '',
                      'block px-4 py-2 text-sm text-gray-700 dark:text-gray-200'
                    )}
                  >
                    View all organizations
                  </Link>
                )}
              </Menu.Item>
            </div>
          )}

        </Menu.Items>
      </Transition>
    </Menu>
  );
} 