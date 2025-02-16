'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/app/components/navigation';
import Editor from '@/app/components/editor';
import { SolutionRecord } from '@/app/types/solution';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';

interface SolutionEditorClientProps {
  solutionId: string;
}

export default function SolutionEditorClient({ solutionId }: SolutionEditorClientProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<SolutionRecord['status']>('draft');
  const [sections, setSections] = useState<SolutionRecord['sections']>({
    description: { id: 'description', title: 'Description', content: '' },
    benefits: { id: 'benefits', title: 'Benefits', content: '' },
    painPoints: { id: 'painPoints', title: 'Pain Points Addressed', content: '' },
    timeline: { id: 'timeline', title: 'Implementation Timeline', content: '' },
    competitivePosition: { id: 'competitivePosition', title: 'Competitive Positioning', content: '' },
    pricing: { id: 'pricing', title: 'Pricing', content: '' }
  });
  const [mediaAssets, setMediaAssets] = useState<SolutionRecord['mediaAssets']>([]);

  useEffect(() => {
    fetchSolution();
  }, [solutionId]);

  const fetchSolution = async () => {
    try {
      const response = await fetch(`/api/solutions/${solutionId}`);
      if (response.ok) {
        const data = await response.json();
        setTitle(data.title);
        setStatus(data.status);
        setSections(data.sections);
        setMediaAssets(data.mediaAssets || []);
      }
    } catch (error) {
      console.error('Error fetching solution:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/solutions/${solutionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          status,
          sections,
          mediaAssets
        }),
      });

      if (response.ok) {
        const updatedSolution = await response.json();
        setTitle(updatedSolution.title);
        setStatus(updatedSolution.status);
        setSections(updatedSolution.sections);
        setMediaAssets(updatedSolution.mediaAssets || []);
      }
    } catch (error) {
      console.error('Error saving solution:', error);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value as SolutionRecord['status']);
  };

  const handleSectionChange = (sectionId: keyof SolutionRecord['sections'], content: string) => {
    setSections(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        content
      }
    }));
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    const formData = new FormData();
    formData.append('file', files[0]);

    try {
      const response = await fetch(`/api/solutions/${solutionId}/media`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const mediaAsset = await response.json();
        setMediaAssets(prev => [...prev, mediaAsset]);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    try {
      const response = await fetch(`/api/solutions/${solutionId}/media`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mediaId }),
      });

      if (response.ok) {
        setMediaAssets(prev => prev.filter(asset => asset.id !== mediaId));
      }
    } catch (error) {
      console.error('Error deleting media:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                className="block w-full text-2xl font-semibold bg-transparent border-0 border-b-2 border-gray-200 dark:border-gray-700 focus:ring-0 focus:border-blue-500 dark:text-white"
                placeholder="Solution Title"
              />
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={status}
                onChange={handleStatusChange}
                className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              <button
                onClick={handleSave}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {Object.entries(sections).map(([id, section]) => (
              <div key={id} className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    {section.title}
                  </h3>
                  <Editor
                    value={section.content}
                    onChange={(content) => handleSectionChange(id as keyof SolutionRecord['sections'], content)}
                    placeholder={`Write your ${section.title.toLowerCase()}...`}
                  />
                </div>
              </div>
            ))}

            {/* Media Assets Section */}
            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Media Assets
                </h3>
                
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          onChange={(e) => handleFileUpload(e.target.files)}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>

                {mediaAssets.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {mediaAssets.map((asset) => (
                      <div key={asset.id} className="relative group">
                        <div className="relative aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
                          <Image
                            src={asset.url}
                            alt={asset.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <button
                          onClick={() => handleDeleteMedia(asset.id)}
                          className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 