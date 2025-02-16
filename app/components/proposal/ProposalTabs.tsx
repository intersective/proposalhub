'use client';

import { useState } from 'react';

interface ProposalTabsProps<T extends string> {
  title: string;
  onTitleChange: (title: string) => void;
  activeTab: T;
  onTabChange: (tab: T) => void;
  tabs: Array<{
    id: T;
    label: string;
    icon: React.ReactNode;
  }>;
  menuButtons?: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    dropdownItems?: Array<{
      label: string;
      href?: string;
      onClick?: () => void;
    }>;
  }>;
}

export default function ProposalTabs<T extends string>({
  title,
  onTitleChange,
  activeTab,
  onTabChange,
  tabs,
  menuButtons
}: ProposalTabsProps<T>) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleTitleChange = (newTitle: string) => {
    onTitleChange(newTitle);
    setIsEditingTitle(false);
  };

  return (
    <div className="sticky top-0 z-10 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex justify-between items-center">
          <div className="min-w-0 flex-1">
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                onBlur={() => handleTitleChange(title)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleChange(title);
                  if (e.key === 'Escape') {
                    setIsEditingTitle(false);
                  }
                }}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-xl sm:leading-6"
                autoFocus
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                className="text-xl font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-gray-600 dark:hover:text-gray-300"
              >
                {title || 'Untitled'}
              </h1>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Tab Pills */}
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  } p-2 rounded-md`}
                  title={tab.label}
                >
                  {tab.icon}
                </button>
              ))}
            </div>

            {/* Menu Buttons */}
            {menuButtons?.map((button) => (
              <div key={button.id} className="relative">
                <button
                  onClick={() => {
                    if (button.dropdownItems) {
                      setOpenDropdown(openDropdown === button.id ? null : button.id);
                    } else {
                      button.onClick();
                    }
                  }}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {button.icon}
                  <span className="ml-2">{button.label}</span>
                </button>
                {button.dropdownItems && openDropdown === button.id && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                    {button.dropdownItems.map((item, index) => (
                      item.href ? (
                        <a
                          key={index}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => {
                            setOpenDropdown(null);
                            item.onClick?.();
                          }}
                        >
                          {item.label}
                        </a>
                      ) : (
                        <button
                          key={index}
                          onClick={() => {
                            setOpenDropdown(null);
                            item.onClick?.();
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {item.label}
                        </button>
                      )
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 