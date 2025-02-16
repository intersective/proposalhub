'use client';

import { useState, useEffect } from 'react';
import { ProposalRecord } from '@/app/types/proposal';
import { TEMPLATES } from '@/app/lib/constants';
import Image from 'next/image';

export default function LayoutTab({ proposalId }: { proposalId: string }) {

    const [proposal, setProposal] = useState<ProposalRecord | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [printTemplate, setPrintTemplate] = useState('modern');
    const [presentationTemplate, setPresentationTemplate] = useState('modern-slides');
    const [presentationMarkdown, setPresentationMarkdown] = useState('');
    const [brandType, setBrandType] = useState<'client' | 'service'>('client');
    const [primaryColor, setPrimaryColor] = useState('#000000');
    const [secondaryColor, setSecondaryColor] = useState('#ffffff');

    useEffect(() => {
        const fetchProposal = async () => {
          try {
            const response = await fetch(`/api/proposals/${proposalId}`);
            if (response.ok) {
              const data = await response.json();
              setProposal(data);
            }
          } catch (error) {
            console.error('Error fetching proposal:', error);
          } finally {
            setIsLoading(false);
          }
        };
    
        fetchProposal();
      }, [proposalId]);
    
    const handleRegenerateSlides = async () => {
        if (!proposal) return;
        try {
        const response = await fetch('/api/generate-slides', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            sections: proposal.sections,
            template: presentationTemplate
            })
        });

        if (!response.ok) throw new Error('Failed to generate slides');
        
        const data = await response.json();
        setPresentationMarkdown(data.markdown);
        } catch (error) {
        console.error('Error generating slides:', error);
        }
    };

  const handleSaveLayout = async () => {
    if (!proposal) return;

    try {
      const response = await fetch(`/api/proposals/${proposal.id}/layout`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printTemplate,
          presentationTemplate,
          presentationMarkdown,
          brandType,
          primaryColor,
          secondaryColor
        })
      });

      if (!response.ok) throw new Error('Failed to save layout');
    } catch (error) {
      console.error('Error saving layout:', error);
    }
  };

  const handleGenerateImage = async (sectionId: string, type: 'background' | 'content') => {
    try {
      const section = proposal?.sections.find(s => s.id === sectionId);
      if (!section) return;

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Generate an image for ${section.title} section of a business proposal`,
          type,
          sectionId
        })
      });

      if (!response.ok) throw new Error('Failed to generate image');
      
      const data = await response.json();
      
      // Update the section's images separately
      const updatedSection = {
        ...section,
        images: {
          ...section.images,
          [type]: [...(section.images?.[type] || []), data.url]
        }
      };
      
      await fetch(`/api/proposals/${proposal?.id}/sections/${sectionId}/images`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: updatedSection.images })
      });
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    sectionId: string,
    type: 'background' | 'content'
  ) => {
    const files = e.target.files;
    if (!files || !proposal) return;

    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('images', file);
      });
      formData.append('sectionId', sectionId);
      formData.append('type', type);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to upload image');
      
      const data = await response.json();
      const section = proposal.sections.find(s => s.id === sectionId);
      if (!section) return;

      // Update section with new image URLs
      const updatedSection = {
        ...section,
        images: {
          ...section.images,
          [type]: [...(section.images?.[type] || []), ...data.urls]
        }
      };
      
      await fetch(`/api/proposals/${proposal.id}/sections/${sectionId}/images`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: updatedSection.images })
      });
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleDeleteImage = async (sectionId: string, type: 'background' | 'content', index: number) => {
    if (!proposal) return;

    try {
      const section = proposal.sections.find(s => s.id === sectionId);
      if (!section || !section.images) return;

      const updatedImages = { ...section.images };
      const imageArray = updatedImages[type] || [];
      imageArray.splice(index, 1);
      updatedImages[type] = imageArray;

      const updatedSection = {
        ...section,
        images: updatedImages
      };

      const updatedSections = proposal.sections.map(s =>
        s.id === sectionId ? updatedSection : s
      );

      await fetch(`/api/proposals/${proposalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: updatedSections }),
      });

      setProposal(prev => prev ? {
        ...prev,
        sections: updatedSections
      } : null);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

    return   (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Print Layout */}
        <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Print Layout</h3>
        <div className="space-y-6">
            <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Brand Colors
            </label>
            <div className="flex flex-wrap gap-6 mb-4">
                <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Brand Type
                </label>
                <select
                    value={brandType}
                    onChange={(e) => setBrandType(e.target.value as 'client' | 'service')}
                    className="block w-48 rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-800 text-sm"
                >
                    <option value="client">Client Brand</option>
                    <option value="service">Service Brand</option>
                </select>
                </div>
                <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Primary Color
                </label>
                <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-9 w-24 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                />
                </div>
                <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Secondary Color
                </label>
                <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-9 w-24 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                />
                </div>
            </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
            {TEMPLATES.filter(t => t.type === 'document').map(template => (
                <button
                key={template.id}
                onClick={() => setPrintTemplate(template.id)}
                className={`
                    p-4 border rounded-lg text-left transition-all
                    ${printTemplate === template.id
                    ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'}
                `}
                >
                <div className="aspect-[8.5/11] mb-2 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                    <Image
                    src={`/templates/${template.id}-preview.png`}
                    alt={template.name}
                    width={300}
                    height={424}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = '/templates/default-preview.png';
                    }}
                    />
                </div>
                <h4 className="font-medium text-gray-900 dark:text-white">{template.name}</h4>
                </button>
            ))}
            </div>
        </div>
        </div>

        {/* Presentation Layout */}
        <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Presentation Layout</h3>
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
            {TEMPLATES.filter(t => t.type === 'presentation').map(template => (
                <button
                key={template.id}
                onClick={() => setPresentationTemplate(template.id)}
                className={`
                    p-4 border rounded-lg text-left transition-all
                    ${presentationTemplate === template.id
                    ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'}
                `}
                >
                <div className="aspect-video mb-2 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                    <Image
                    src={`/templates/${template.id}-preview.png`}
                    alt={template.name}
                    width={480}
                    height={270}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = '/templates/default-preview.png';
                    }}
                    />
                </div>
                <h4 className="font-medium text-gray-900 dark:text-white">{template.name}</h4>
                </button>
            ))}
            </div>

            <div className="mt-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Presentation Content</h4>
            <div className="border rounded-lg dark:border-gray-700">
                <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Edit RevealJS Markdown</span>
                    <button
                    onClick={handleRegenerateSlides}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700"
                    >
                    Regenerate with AI
                    </button>
                </div>
                </div>
                <div className="p-4">
                <textarea
                    value={presentationMarkdown}
                    onChange={(e) => setPresentationMarkdown(e.target.value)}
                    className="w-full h-64 p-2 border rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white font-mono text-sm"
                    placeholder="Edit your presentation markdown here..."
                />
                </div>
            </div>
            </div>
        </div>
        </div>
    </div>

    {/* Section Image Management */}
    <div className="mt-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Section Images</h3>
        <div className="space-y-6">
        {proposal?.sections.map(section => (
            <div key={section.id} className="border rounded-lg p-6 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">{section.title}</h4>
            <div className="grid grid-cols-2 gap-8">
                <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Background Image
                </label>
                <div className="flex items-center space-x-2">
                    <button
                    onClick={() => handleGenerateImage(section.id, 'background')}
                    className="px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                    Generate with AI
                    </button>
                    <span className="text-gray-500 dark:text-gray-400">or</span>
                    <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, section.id, 'background')}
                    className="text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4 file:rounded-md
                    file:border-0 file:text-sm file:font-medium
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                    />
                </div>
                {section.images?.background && section.images.background.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                    {section.images.background.map((url, index) => (
                        <div key={index} className="relative group">
                        <Image
                            src={url}
                            alt={`Background ${index + 1}`}
                            width={200}
                            height={150}
                            className="rounded-md object-cover"
                        />
                        <button
                            onClick={() => handleDeleteImage(section.id, 'background', index)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            ×
                        </button>
                        </div>
                    ))}
                    </div>
                )}
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Content Images
                </label>
                <div className="flex items-center space-x-2">
                    <button
                    onClick={() => handleGenerateImage(section.id, 'content')}
                    className="px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                    Generate with AI
                    </button>
                    <span className="text-gray-500 dark:text-gray-400">or</span>
                    <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageUpload(e, section.id, 'content')}
                    className="text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4 file:rounded-md
                    file:border-0 file:text-sm file:font-medium
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                    />
                </div>
                {section.images?.content && section.images.content.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                    {section.images.content.map((url, index) => (
                        <div key={index} className="relative group">
                        <Image
                            src={url}
                            alt={`Content ${index + 1}`}
                            width={200}
                            height={150}
                            className="rounded-md object-cover"
                        />
                        <button
                            onClick={() => handleDeleteImage(section.id, 'content', index)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            ×
                        </button>
                        </div>
                    ))}
                    </div>
                )}
                </div>
            </div>
            </div>
        ))}
        </div>
    </div>

    <div className="mt-12 flex justify-end space-x-4">
        <button
        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
        Cancel
        </button>
        <button
        onClick={handleSaveLayout}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
        Save Layout
        </button>
    </div>
    </div>
    </div>
    )
}