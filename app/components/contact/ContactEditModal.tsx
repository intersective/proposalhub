import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Search, X, Upload, User, GraduationCap, Briefcase, Layout } from 'lucide-react';
import { Contact } from '@/app/types/contact';
import ImageUploadEditModal from '@/app/components/editor/ImageUploadEditModal';
import Image from 'next/image';
import LinkedInAuthDialog from '@/app/components/linkedin/LinkedInAuthDialog';

interface ContactEditModalProps {
  contact?: Contact;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Contact>) => Promise<void>;
  onEnrich?: (contactId?: string) => Promise<{ ok: boolean; error?: string, needsAuth?: boolean }>;
  isEnriching?: boolean;
  showTeamMemberFields?: boolean;
}

type TabType = 'basic' | 'background' | 'credentials' | 'portfolio';

export default function ContactEditModal({
  contact,
  isOpen,
  onClose,
  onSave,
  onEnrich,
  isEnriching = false,
  showTeamMemberFields = false
}: ContactEditModalProps) {
  const [formData, setFormData] = useState<Partial<Contact>>({
    title: contact?.title || '',
    name: contact?.name || '',
    background: contact?.background || '',
    linkedIn: contact?.linkedIn || '',
    skills: contact?.skills || [],
    credentials: contact?.credentials || {
      degrees: [],
      pastRoles: [],
      certifications: []
    },
    portfolio: contact?.portfolio || []
  });
  const [showImageModal, setShowImageModal] = useState(false);
  const [showLinkedInAuth, setShowLinkedInAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('basic');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const contactData = { ...formData };
    delete (contactData as { teamMembershipId?: string }).teamMembershipId;
    await onSave(contactData);
    onClose();
  };

  const handleSkillAdd = (skill: string) => {
    if (!formData.skills?.includes(skill)) {
      setFormData((prev: Partial<Contact>) => ({
        ...prev,
        skills: [...(prev.skills || []), skill]
      }));
    }
  };

  const handleSkillRemove = (skillToRemove: string) => {
    setFormData((prev: Partial<Contact>) => ({
      ...prev,
      skills: prev.skills?.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleEnrich = async () => {
    if (!onEnrich) return;
    try {
      const result = await onEnrich(contact?.id);
      if (result.needsAuth) {
        setShowLinkedInAuth(true);
      }
    } catch (error: unknown) {
      console.error('Error enriching profile:', error);
    }
  };

  const handleLinkedInAuth = async () => {
    if (!onEnrich) return;
    try {
      await onEnrich(contact?.id);
    } catch (error) {
      console.error('Error after authentication:', error);
    }
  };

  const handleImageUpload = (imageUrl: string) => {
    if (contact?.id) {
      const contactData = { ...contact };
      delete (contactData as { teamMembershipId?: string }).teamMembershipId;
      onSave({ ...contactData, imageUrl });
    } else {
      setFormData(prev => ({ ...prev, imageUrl }));
    }
    setShowImageModal(false);
  };

  const tabs = [
    { id: 'basic' as TabType, label: 'Basic Info', icon: <User className="w-4 h-4" /> },
    { id: 'background' as TabType, label: 'Background', icon: <Briefcase className="w-4 h-4" /> },
    ...(showTeamMemberFields ? [
      { id: 'credentials' as TabType, label: 'Skills & Credentials', icon: <GraduationCap className="w-4 h-4" /> },
      { id: 'portfolio' as TabType, label: 'Portfolio', icon: <Layout className="w-4 h-4" /> }
    ] : [])
  ] as const;

  return (
    <>
      <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                {contact ? 'Edit Contact' : 'Add Contact'}
              </Dialog.Title>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2 p-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      inline-flex items-center px-3 py-2 rounded-md text-sm font-medium
                      ${activeTab === tab.id 
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }
                    `}
                  >
                    {tab.icon}
                    <span className="ml-2">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  {/* Headshot Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Profile Photo
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="relative h-24 w-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                        {contact?.imageUrl ? (
                          <Image
                            src={contact.imageUrl}
                            alt={contact.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                            <span className="text-2xl text-gray-400 dark:text-gray-500">
                              {formData.name?.charAt(0) || '?'}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowImageModal(true)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Change Photo
                      </button>
                    </div>
                  </div>

                  {/* Basic Info Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Title
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        LinkedIn URL
                      </label>
                      <div className="mt-1 flex items-center space-x-2">
                        <input
                          type="url"
                          value={formData.linkedIn}
                          onChange={e => setFormData(prev => ({ ...prev, linkedIn: e.target.value }))}
                          className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                        />
                        {onEnrich && (
                          <button
                            type="button"
                            onClick={handleEnrich}
                            disabled={isEnriching || !formData.linkedIn}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isEnriching ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Enriching...
                              </>
                            ) : (
                              <>
                                <Search className="w-4 h-4 mr-2" />
                                Import
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      {formData.linkedIn && !isEnriching && onEnrich && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Click Import to fetch profile data from LinkedIn
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'background' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Profile
                    </label>
                    <textarea
                      rows={8}
                      value={formData.background}
                      onChange={e => setFormData(prev => ({ ...prev, background: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  {/* Past Roles */}
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400">Past Roles</label>
                    <div className="space-y-2">
                      {formData.credentials?.pastRoles?.map((role, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={role}
                            onChange={e => {
                              const newRoles = [...(formData.credentials?.pastRoles || [])];
                              newRoles[index] = e.target.value;
                              setFormData(prev => ({
                                ...prev,
                                credentials: {
                                  ...prev.credentials,
                                  pastRoles: newRoles
                                }
                              }));
                            }}
                            className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newRoles = formData.credentials?.pastRoles?.filter((_, i) => i !== index);
                              setFormData(prev => ({
                                ...prev,
                                credentials: {
                                  ...prev.credentials,
                                  pastRoles: newRoles
                                }
                              }));
                            }}
                            className="text-red-500 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            credentials: {
                              ...prev.credentials,
                              pastRoles: [...(prev.credentials?.pastRoles || []), '']
                            }
                          }));
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        + Add Role
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showTeamMemberFields && activeTab === 'credentials' && (
                <div className="space-y-6">
                  {/* Skills */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Skills
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.skills?.map(skill => (
                        <span
                          key={skill}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleSkillRemove(skill)}
                            className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add a skill"
                        onKeyPress={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSkillAdd(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                        className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  {/* Degrees */}
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400">Degrees</label>
                    <div className="space-y-2">
                      {formData.credentials?.degrees?.map((degree, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={degree}
                            onChange={e => {
                              const newDegrees = [...(formData.credentials?.degrees || [])];
                              newDegrees[index] = e.target.value;
                              setFormData(prev => ({
                                ...prev,
                                credentials: {
                                  ...prev.credentials,
                                  degrees: newDegrees
                                }
                              }));
                            }}
                            className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newDegrees = formData.credentials?.degrees?.filter((_, i) => i !== index);
                              setFormData(prev => ({
                                ...prev,
                                credentials: {
                                  ...prev.credentials,
                                  degrees: newDegrees
                                }
                              }));
                            }}
                            className="text-red-500 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            credentials: {
                              ...prev.credentials,
                              degrees: [...(prev.credentials?.degrees || []), '']
                            }
                          }));
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        + Add Degree
                      </button>
                    </div>
                  </div>

                  {/* Certifications */}
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400">Certifications</label>
                    <div className="space-y-2">
                      {formData.credentials?.certifications?.map((cert, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={cert}
                            onChange={e => {
                              const newCerts = [...(formData.credentials?.certifications || [])];
                              newCerts[index] = e.target.value;
                              setFormData(prev => ({
                                ...prev,
                                credentials: {
                                  ...prev.credentials,
                                  certifications: newCerts
                                }
                              }));
                            }}
                            className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newCerts = formData.credentials?.certifications?.filter((_, i) => i !== index);
                              setFormData(prev => ({
                                ...prev,
                                credentials: {
                                  ...prev.credentials,
                                  certifications: newCerts
                                }
                              }));
                            }}
                            className="text-red-500 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            credentials: {
                              ...prev.credentials,
                              certifications: [...(prev.credentials?.certifications || []), '']
                            }
                          }));
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        + Add Certification
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showTeamMemberFields && activeTab === 'portfolio' && (
                <div className="space-y-6">
                  {formData.portfolio?.map((item, index) => (
                    <div key={index} className="space-y-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <input
                        type="text"
                        placeholder="Title"
                        value={item.title}
                        onChange={e => {
                          const newPortfolio = [...(formData.portfolio || [])];
                          newPortfolio[index] = { ...newPortfolio[index], title: e.target.value };
                          setFormData(prev => ({ ...prev, portfolio: newPortfolio }));
                        }}
                        className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                      />
                      <input
                        type="url"
                        placeholder="URL"
                        value={item.url}
                        onChange={e => {
                          const newPortfolio = [...(formData.portfolio || [])];
                          newPortfolio[index] = { ...newPortfolio[index], url: e.target.value };
                          setFormData(prev => ({ ...prev, portfolio: newPortfolio }));
                        }}
                        className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                      />
                      <textarea
                        placeholder="Description"
                        value={item.description}
                        onChange={e => {
                          const newPortfolio = [...(formData.portfolio || [])];
                          newPortfolio[index] = { ...newPortfolio[index], description: e.target.value };
                          setFormData(prev => ({ ...prev, portfolio: newPortfolio }));
                        }}
                        className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                        rows={2}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newPortfolio = formData.portfolio?.filter((_, i) => i !== index);
                          setFormData(prev => ({ ...prev, portfolio: newPortfolio }));
                        }}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        portfolio: [
                          ...(prev.portfolio || []),
                          { id: crypto.randomUUID(), title: '', url: '', description: '' }
                        ]
                      }));
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    + Add Portfolio Item
                  </button>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-500 dark:hover:text-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      <ImageUploadEditModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onSave={handleImageUpload}
        currentImage={contact?.imageUrl}
        title="Edit Profile Photo"
        aspectRatio={1}
        fallbackInitial={formData.name?.charAt(0) || '?'}
      />

      {onEnrich && (
        <LinkedInAuthDialog
          isOpen={showLinkedInAuth}
          onClose={() => setShowLinkedInAuth(false)}
          onAuthenticated={handleLinkedInAuth}
        />
      )}
    </>
  );
} 