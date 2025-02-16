'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/app/components/navigation';
import { FileText, Upload, Link as LinkIcon, Plus } from 'lucide-react';

interface RFP {
  id: string;
  title: string;
  organization: string;
  status: 'draft' | 'active' | 'closed';
  dueDate?: string;
  createdAt: string;
  source: 'url' | 'file' | 'manual';
  sourceUrl?: string;
  sourceFile?: string;
}

export default function RFPsPageClient() {
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMethod, setAddMethod] = useState<'url' | 'file' | 'manual' | null>(null);
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchRFPs = async () => {
      try {
        const response = await fetch('/api/rfps');
        if (response.ok) {
          const data = await response.json();
          setRfps(data);
        }
      } catch (error) {
        console.error('Error fetching RFPs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRFPs();
  }, []);

  const handleAddRFP = async () => {
    if (!addMethod) return;

    setIsProcessing(true);
    try {
      let formData = new FormData();
      
      if (addMethod === 'url' && url) {
        formData.append('url', url);
      } else if (addMethod === 'file' && file) {
        formData.append('file', file);
      }
      formData.append('method', addMethod);

      const response = await fetch('/api/rfps', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const newRfp = await response.json();
        setRfps(prev => [...prev, newRfp]);
        setShowAddModal(false);
        setAddMethod(null);
        setUrl('');
        setFile(null);
      }
    } catch (error) {
      console.error('Error adding RFP:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">RFP Management</h1>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              Manage your Request for Proposals (RFPs) and generate proposals from them.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add RFP
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="mt-8 flex flex-col">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Title</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Organization</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Due Date</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Source</th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                      {rfps.map((rfp) => (
                        <tr key={rfp.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                            {rfp.title}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {rfp.organization}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              rfp.status === 'active' 
                                ? 'bg-green-100 text-green-800'
                                : rfp.status === 'closed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {rfp.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {rfp.dueDate ? new Date(rfp.dueDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {rfp.source === 'url' ? (
                              <a href={rfp.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                <LinkIcon className="w-4 h-4" />
                              </a>
                            ) : rfp.source === 'file' ? (
                              <a href={rfp.sourceFile} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                <FileText className="w-4 h-4" />
                              </a>
                            ) : (
                              'Manual'
                            )}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                              onClick={() => {/* Handle generate proposal */}}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Generate Proposal
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add RFP Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add New RFP</h3>
              <button onClick={() => {
                setShowAddModal(false);
                setAddMethod(null);
                setUrl('');
                setFile(null);
              }} className="text-gray-500 hover:text-gray-700">×</button>
            </div>

            {!addMethod ? (
              <div className="space-y-4">
                <button
                  onClick={() => setAddMethod('url')}
                  className="w-full p-4 text-left border rounded-lg hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
                  <div className="flex items-center">
                    <LinkIcon className="w-5 h-5 mr-3 text-gray-400" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Add from URL</h4>
                      <p className="text-sm text-gray-500">Import RFP details from a webpage</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setAddMethod('file')}
                  className="w-full p-4 text-left border rounded-lg hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
                  <div className="flex items-center">
                    <Upload className="w-5 h-5 mr-3 text-gray-400" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Upload Document</h4>
                      <p className="text-sm text-gray-500">Upload a PDF or Word document</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setAddMethod('manual')}
                  className="w-full p-4 text-left border rounded-lg hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 mr-3 text-gray-400" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Create Manually</h4>
                      <p className="text-sm text-gray-500">Enter RFP details manually</p>
                    </div>
                  </div>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {addMethod === 'url' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      RFP URL
                    </label>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                {addMethod === 'file' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Upload RFP Document
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="w-full"
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setAddMethod(null);
                      setUrl('');
                      setFile(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleAddRFP}
                    disabled={isProcessing || (addMethod === 'url' && !url) || (addMethod === 'file' && !file)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      'Continue'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 