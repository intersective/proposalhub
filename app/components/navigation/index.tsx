'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ProposalHubLogo from '@/app/components/navigation/Logo';
import OrganizationSwitcher from '@/app/components/navigation/OrganizationSwitcher';
import AccountMenu from '@/app/components/account/AccountMenu';

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname.startsWith(path);
  };

  return (
    <nav className="bg-white shadow-sm  dark:bg-gray-900">
      <div className="mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* ProposalHub Logo */}
            <div className="flex-shrink-0">
              <ProposalHubLogo />
            </div>

            {/* Divider */}
            <div className="mx-4 h-6 w-px bg-gray-200  dark:bg-gray-100" />

            {/* Organization Switcher */}
            <OrganizationSwitcher />
          </div>

          <div className="flex items-center">
            {/* Navigation Links */}
            <div className="hidden sm:flex sm:space-x-8 mr-8">
              {[
                { name: 'Proposals', href: '/manage/proposals' },
                { name: 'RFPs', href: '/manage/rfps' },
                { name: 'Solutions', href: '/manage/solutions' },
                { name: 'Customers', href: '/manage/organizations' },
                { name: 'Team', href: '/manage/team' },
              ].map(link => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive(link.href)
                      ? 'border-blue-500 text-gray-900 dark:text-gray-100'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-400 dark:text-gray-100'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Account Menu */}
            <AccountMenu />
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 