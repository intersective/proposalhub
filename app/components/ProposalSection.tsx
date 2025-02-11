'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Code from '@tiptap/extension-code';
import CodeBlock from '@tiptap/extension-code-block';
import Blockquote from '@tiptap/extension-blockquote';
import { marked } from 'marked';
import styles from './ProposalSection.module.css';
import TurndownService from 'turndown';
import SearchableDropdown from './SearchableDropdown';
import { Company, Client } from '../lib/companyDatabase';
import { GripVertical as DragHandle, Trash2 } from 'lucide-react';
import { MODEL_OPTIONS } from './ProposalChat/types';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
});

interface Section {
  id: string;
  title: string;
  content: string | Record<string, string>;
  type: 'text' | 'fields';
}

interface SearchOption {
  id: string;
  name: string;
  [key: string]: string | Date | undefined;
}

interface ImprovementSuggestion {
  id: string;
  content: string;
  context: string[];
  timestamp: Date;
}

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalContent: string;
  newContent: string;
  onReplace: () => void;
  onAppend: () => void;
  onRetry: () => void;
  currentModel: string;
  onModelChange: (model: string) => void;
}

function ComparisonModal({
  isOpen,
  onClose,
  originalContent,
  newContent,
  onReplace,
  onAppend,
  onRetry,
  currentModel,
  onModelChange
}: ComparisonModalProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  if (!isOpen) return null;

  const handleRetry = async () => {
    setIsRetrying(true);
    await onRetry();
    setIsRetrying(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Compare Changes</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-2 gap-4 h-full">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 overflow-auto">
              <h4 className="font-medium mb-2">Original</h4>
              <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: marked.parse(originalContent) }} />
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 overflow-auto">
              <h4 className="font-medium mb-2">Improved</h4>
              {isRetrying ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">Generating new improvement...</p>
                </div>
              ) : (
                <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: marked.parse(newContent) }} />
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-3">
            <button
              onClick={onReplace}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Replace
            </button>
            <button
              onClick={onAppend}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Append
            </button>
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50"
            >
              {isRetrying ? 'Retrying...' : 'Retry'}
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Model:</span>
            <select
              value={currentModel}
              onChange={(e) => onModelChange(e.target.value)}
              className="p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900"
            >
              {MODEL_OPTIONS.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export interface ProposalSectionProps {
  section: Section;
  onUpdate: (id: string, content: string | Record<string, string>, title?: string) => void;
  onImprove: (id: string) => Promise<string>;
  onDelete?: (id: string, e?: React.MouseEvent) => void;
  onCancel?: () => void;
  isEditing: boolean;
  isImproving?: boolean;
  isDragging?: boolean;
  isImprovable?: boolean;
  isDrafting?: boolean;
  isAnySectionDragging?: boolean;
  dragHandleProps?: {
    onDragStart?: (event: React.DragEvent) => void;
    onDragEnd?: (event: React.DragEvent) => void;
    draggable?: boolean;
    [key: string]: unknown;
  };
  onCompanySearch?: (query: string) => Promise<SearchOption[]>;
  onClientSearch?: (query: string) => Promise<SearchOption[]>;
  onCompanyAISearch?: (query: string) => Promise<void>;
  onClientAISearch?: (query: string) => Promise<void>;
  onCompanySelect?: (company: Company | null) => void;
  onClientSelect?: (client: Client | null) => void;
  selectedCompany?: Company | null;
  selectedClient?: Client | null;
}

function EditorMenuBar({ editor }: { editor: Editor | null }) {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-2 flex flex-wrap gap-1">
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-2 py-1 text-sm rounded ${
          editor.isActive('heading', { level: 2 })
            ? 'bg-gray-200 dark:bg-gray-600'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        H2
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`px-2 py-1 text-sm rounded ${
          editor.isActive('heading', { level: 3 })
            ? 'bg-gray-200 dark:bg-gray-600'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        H3
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2 py-1 text-sm rounded ${
          editor.isActive('bold')
            ? 'bg-gray-200 dark:bg-gray-600'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        B
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2 py-1 text-sm rounded ${
          editor.isActive('italic')
            ? 'bg-gray-200 dark:bg-gray-600'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        I
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2 py-1 text-sm rounded ${
          editor.isActive('bulletList')
            ? 'bg-gray-200 dark:bg-gray-600'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        • List
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-2 py-1 text-sm rounded ${
          editor.isActive('orderedList')
            ? 'bg-gray-200 dark:bg-gray-600'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        1. List
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`px-2 py-1 text-sm rounded ${
          editor.isActive('blockquote')
            ? 'bg-gray-200 dark:bg-gray-600'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        Quote
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`px-2 py-1 text-sm rounded ${
          editor.isActive('code')
            ? 'bg-gray-200 dark:bg-gray-600'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        Code
      </button>
    </div>
  );
}

export default function ProposalSection({ 
  section, 
  onUpdate, 
  onImprove,
  onDelete,
  onCancel,
  isEditing,
  isImproving = false,
  isDragging = false,
  isImprovable = false,
  isDrafting = false,
  isAnySectionDragging = false,
  dragHandleProps,
  onCompanySearch,
  onClientSearch,
  onCompanyAISearch,
  onClientAISearch,
  onCompanySelect,
  onClientSelect,
  selectedCompany,
  selectedClient
}: ProposalSectionProps) {
  const [isEditingLocally, setIsEditingLocally] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editContent, setEditContent] = useState<string | Record<string, string>>(section.content);
  const [editTitle, setEditTitle] = useState(section.title);
  const [improvements, setImprovements] = useState<ImprovementSuggestion[]>([]);
  const [showImprovements, setShowImprovements] = useState(false);
  const [selectedImprovement, setSelectedImprovement] = useState<ImprovementSuggestion | null>(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [currentModel, setCurrentModel] = useState('gpt-4o-mini');

  // Convert content to markdown when component mounts or content changes
  useEffect(() => {
    if (typeof section.content === 'string') {
      try {
        // If content is HTML, convert to markdown
        if (section.content.includes('<')) {
          const markdown = turndownService.turndown(section.content);
          setEditContent(markdown);
        } else {
          setEditContent(section.content);
        }
      } catch (error) {
        console.error('Error converting content to markdown:', error);
        setEditContent(section.content);
      }
    } else {
      setEditContent(section.content);
    }
  }, [section.content]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
      }),
      Placeholder.configure({
        placeholder: 'Click to edit...',
      }),
      Heading.configure({
        levels: [2, 3],
        HTMLAttributes: {
          class: 'tiptap-heading',
        },
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'tiptap-bullet-list',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'tiptap-ordered-list',
        },
      }),
      Bold.configure({
        HTMLAttributes: {
          class: 'tiptap-bold',
        },
      }),
      Italic.configure({
        HTMLAttributes: {
          class: 'tiptap-italic',
        },
      }),
      Code.configure({
        HTMLAttributes: {
          class: 'tiptap-code',
        },
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'tiptap-code-block',
        },
      }),
      Blockquote.configure({
        HTMLAttributes: {
          class: 'tiptap-blockquote',
        },
      }),
    ],
    content: typeof editContent === 'string' ? marked.parse(editContent) : '',
    editorProps: {
      attributes: {
        class: `${styles.tiptap} prose max-w-none dark:prose-invert focus:outline-none min-h-[100px] py-2`,
      },
    },
    onUpdate: ({ editor }) => {
      if (section.type === 'text') {
        const html = editor.getHTML();
        const markdown = turndownService.turndown(html);
        setEditContent(markdown);
      }
    },
  });

  // Initialize editor content when component mounts
  useEffect(() => {
    if (editor && typeof section.content === 'string') {
      const html = marked.parse(section.content);
      editor.commands.setContent(html);
    }
  }, [editor, section.content]);

  useEffect(() => {
    if (editor && !isEditingLocally) {
      editor.setEditable(false);
    }
  }, [editor, isEditingLocally]);

  useEffect(() => {
    if (editor && typeof editContent === 'string') {
      const currentPos = editor.state.selection.$head.pos;
      const html = marked.parse(editContent);
      editor.commands.setContent(html);
      
      // Restore cursor position if editing
      if (isEditingLocally) {
        editor.commands.setTextSelection(currentPos);
      }
    }
  }, [editor, editContent, isEditingLocally]);

  const fetchImprovements = useCallback(async () => {
    try {
      const proposalId = window.location.pathname.split('/').pop();
      const response = await fetch(`/api/proposals/${proposalId}/improvements?sectionId=${section.id}`);
      if (response.ok) {
        const data = await response.json();
        setImprovements(data);
      }
    } catch (error) {
      console.error('Error fetching improvements:', error);
    }
  }, [section.id]);

  useEffect(() => {
    if (isImprovable) {
      fetchImprovements();
    }
  }, [isImprovable, fetchImprovements]);

  const handleSave = () => {
    if (section.type === 'text' && typeof editContent === 'string') {
      onUpdate(section.id, editContent);
    } else {
      onUpdate(section.id, editContent);
    }
    setIsEditingLocally(false);
    if (editor) {
      editor.setEditable(false);
    }
  };

  const handleStartEditing = () => {
    setIsEditingLocally(true);
    if (editor) {
      editor.setEditable(true);
      editor.commands.focus('start');
    }
  };

  const handleCancel = () => {
    setIsEditingLocally(false);
    setEditContent(section.content);
    if (editor) {
      editor.setEditable(false);
      if (typeof section.content === 'string') {
        const html = marked.parse(section.content);
        editor.commands.setContent(html);
      }
    }
  };

  const handleImprove = async () => {
    try {
      if (onImprove && section.type === 'text') {
        const improvedContent = await onImprove(section.id);
        if (improvedContent && typeof improvedContent === 'string') {
          setSelectedImprovement({
            id: 'current',
            content: improvedContent,
            context: [],
            timestamp: new Date()
          });
          setShowComparisonModal(true);
        }
      }
    } catch (error) {
      console.error('Error improving section:', error);
    }
  };

  const handleRetry = async () => {
    try {
      if (onImprove && section.type === 'text') {
        const improvedContent = await onImprove(section.id);
        if (improvedContent && typeof improvedContent === 'string') {
          setSelectedImprovement({
            id: 'current',
            content: improvedContent,
            context: [],
            timestamp: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Error retrying improvement:', error);
    }
  };

  const handleDraft = async () => {
    if (onImprove && section.type === 'text') {
      onImprove(section.id);
    }
  };

  const handleApplyImprovement = async (improvement: ImprovementSuggestion) => {
    if (section.type === 'text') {
      onUpdate(section.id, improvement.content);
      setShowImprovements(false);
      setSelectedImprovement(null);
    }
  };

  const handleAppendImprovement = async (improvement: ImprovementSuggestion) => {
    if (section.type === 'text' && typeof section.content === 'string') {
      onUpdate(section.id, `${section.content}\n\n${improvement.content}`);
      setShowImprovements(false);
      setSelectedImprovement(null);
    }
  };

  // const handleDiscardImprovement = async (improvement: ImprovementSuggestion) => {
  //   const proposalId = window.location.pathname.split('/').pop();
  //   await fetch(`/api/proposals/${proposalId}/improvements?improvementId=${improvement.id}`, {
  //     method: 'DELETE'
  //   });
  //   await fetchImprovements();
  // };

  const handleTitleSave = () => {
    if (editTitle !== section.title) {
      if (section.type === 'text') {
        onUpdate(section.id, section.content as string, editTitle);
      } else {
        onUpdate(section.id, section.content as Record<string, string>, editTitle);
      }
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setEditTitle(section.title);
    setIsEditingTitle(false);
  };

  const renderSearchForm = () => {
    if (section.id === 'companyInfo' && onCompanySearch && onCompanySelect) {
      return (
        <div className="space-y-4">
          <SearchableDropdown
            value={selectedCompany ? {
              id: selectedCompany.id,
              name: selectedCompany.name
            } : null}
            onChange={(option) => {
              if (!option) {
                onCompanySelect(null);
                return;
              }
              const company: Company = {
                id: option.id,
                name: option.name,
                website: typeof option.website === 'string' ? option.website : '',
                sector: typeof option.sector === 'string' ? option.sector : '',
                size: typeof option.size === 'string' ? option.size : '',
                background: typeof option.background === 'string' ? option.background : '',
                lastUpdated: option.lastUpdated instanceof Date ? option.lastUpdated : new Date(),
                createdAt: option.createdAt instanceof Date ? option.createdAt : new Date()
              };
              onCompanySelect(company);
            }}
            onSearch={onCompanySearch}
            onAISearch={onCompanyAISearch}
            placeholder="Search for a company..."
            label="Company"
          />
        </div>
      );
    }

    if (section.id === 'clientInfo' && onClientSearch && onClientSelect) {
      return (
        <div className="space-y-4">
          <SearchableDropdown
            value={selectedClient ? {
              id: selectedClient.id,
              name: selectedClient.name
            } : null}
            onChange={(option) => {
              if (!option) {
                onClientSelect(null);
                return;
              }
              const client: Client = {
                id: option.id,
                name: option.name,
                companyId: selectedCompany?.id || '',
                email: typeof option.email === 'string' ? option.email : '',
                linkedIn: typeof option.linkedIn === 'string' ? option.linkedIn : '',
                phone: typeof option.phone === 'string' ? option.phone : '',
                role: typeof option.role === 'string' ? option.role : '',
                background: typeof option.background === 'string' ? option.background : '',
                lastUpdated: option.lastUpdated instanceof Date ? option.lastUpdated : new Date(),
                createdAt: option.createdAt instanceof Date ? option.createdAt : new Date()
              };
              onClientSelect(client);
            }}
            onSearch={onClientSearch}
            onAISearch={onClientAISearch}
            placeholder="Search for a client..."
            label="Client"
          />
        </div>
      );
    }

    return null;
  };

  const renderFields = (fields: Record<string, string>) => {
    // If no content and it's a company/client section, show search
    if (Object.values(fields).every(v => !v) && (section.id === 'companyInfo' || section.id === 'clientInfo')) {
      return (
        <div className="space-y-4">
          {renderSearchForm()}
          {section.id === 'companyInfo' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Primary Color
                </label>
                <input
                  type="color"
                  value={fields.primaryColor || '#000000'}
                  onChange={async (e) => {
                    const newContent = {
                      ...editContent as Record<string, string>,
                      primaryColor: e.target.value
                    };
                    setEditContent(newContent);
                    // Save changes immediately when colors are updated
                    onUpdate(section.id, newContent);
                    
                    // Update company record if this is the company section
                    if (section.id === 'companyInfo' && selectedCompany) {
                      try {
                        await fetch(`/api/companies/${selectedCompany.id}`, {
                          method: 'PATCH',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            primaryColor: e.target.value
                          }),
                        });
                      } catch (error) {
                        console.error('Error updating company color:', error);
                      }
                    }
                  }}
                  className="h-9 w-20 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Secondary Color
                </label>
                <input
                  type="color"
                  value={fields.secondaryColor || '#ffffff'}
                  onChange={async (e) => {
                    const newContent = {
                      ...editContent as Record<string, string>,
                      secondaryColor: e.target.value
                    };
                    setEditContent(newContent);
                    // Save changes immediately when colors are updated
                    onUpdate(section.id, newContent);
                    
                    // Update company record if this is the company section
                    if (section.id === 'companyInfo' && selectedCompany) {
                      try {
                        await fetch(`/api/companies/${selectedCompany.id}`, {
                          method: 'PATCH',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            secondaryColor: e.target.value
                          }),
                        });
                      } catch (error) {
                        console.error('Error updating company color:', error);
                      }
                    }
                  }}
                  className="h-9 w-20 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                />
              </div>
            </>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {Object.entries(fields).map(([key, value]) => {
          // Special handling for name field in edit mode
          if (key === 'name' && isEditingLocally && (section.id === 'companyInfo' || section.id === 'clientInfo')) {
            return (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {key === 'name' && section.id === 'clientInfo' ? 'Contact Name' : 
                   key.split(/(?=[A-Z])/).join(' ')}
                  <span className="text-red-500">*</span>
                </label>
                {renderSearchForm()}
              </div>
            );
          }

          // Add color pickers for company section
          if (section.id === 'companyInfo' && (key === 'primaryColor' || key === 'secondaryColor')) {
            return (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {key === 'primaryColor' ? 'Primary Color' : 'Secondary Color'}
                </label>
                <input
                  type="color"
                  value={value || (key === 'primaryColor' ? '#000000' : '#ffffff')}
                  onChange={(e) => {
                    const newContent = {
                      ...editContent as Record<string, string>,
                      [key]: e.target.value
                    };
                    setEditContent(newContent);
                    // Save changes immediately when colors are updated
                    onUpdate(section.id, newContent);
                  }}
                  className="h-9 w-20 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                />
              </div>
            );
          }

          return (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {key === 'name' && section.id === 'clientInfo' ? 'Contact Name' : 
                 key.split(/(?=[A-Z])/).join(' ')}
                {!key.toLowerCase().includes('optional') && key !== 'background' && <span className="text-red-500">*</span>}
              </label>
              {isEditingLocally ? (
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setEditContent({
                    ...editContent as Record<string, string>,
                    [key]: e.target.value
                  })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              ) : (
                <p className="text-gray-900 dark:text-white">{value || 'Not provided'}</p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div 
      className={`group bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4 border ${
        isDrafting 
          ? 'border-yellow-300 dark:border-yellow-600 animate-pulse'
          : isDragging
          ? 'border-blue-300 dark:border-blue-600 shadow-lg'
          : 'border-gray-200 dark:border-gray-700'
      } transition-all duration-200 ${isDragging ? 'cursor-grabbing' : ''}`} 
      data-section-id={section.id}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <div className={`cursor-move ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`} {...dragHandleProps}>
            <DragHandle className="w-5 h-5 text-gray-400" />
          </div>
          {isEditingTitle && !isAnySectionDragging ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTitleSave();
                  } else if (e.key === 'Escape') {
                    handleTitleCancel();
                  }
                }}
                autoFocus
                className="text-lg font-semibold bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
              />
            </div>
          ) : (
            <h3 
              onClick={() => !isAnySectionDragging && setIsEditingTitle(true)}
              className={`text-lg font-semibold text-gray-900 dark:text-white ${!isAnySectionDragging && 'cursor-pointer hover:text-blue-500 dark:hover:text-blue-400'}`}
            >
              {section.title}
            </h3>
          )}
        </div>
        {!isAnySectionDragging && (
          <div className="flex items-center space-x-2">
            {!isEditing && section.type === 'text' && section.content && (
              <button
                onClick={handleImprove}
                disabled={isImproving}
                className={`px-3 py-1 text-sm ${
                  isImproving 
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : isImprovable
                    ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 animate-pulse'
                    : 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800'
                } rounded-md`}
              >
                {isImproving ? 'Improving...' : showImprovements ? `View Improvements (${improvements.length})` : 'Improve'}
              </button>
            )}
            {!isEditing && !isEditingLocally && (
              <>
                <button
                  onClick={handleStartEditing}
                  className="px-3 py-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Edit
                </button>
                {onDelete && (
                  <button
                    onClick={(e) => onDelete(section.id, e)}
                    className="p-1.5 text-sm text-red-500 hover:text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
            {isEditingLocally && (
              <>
                <button
                  onClick={handleSave}
                  className="px-3 py-1 text-sm bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-300 rounded-md hover:bg-green-100 dark:hover:bg-green-800"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1 text-sm bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-md hover:bg-red-100 dark:hover:bg-red-800"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {!isAnySectionDragging && (
        <div className="prose max-w-none dark:prose-invert mt-4">
          {section.type === 'fields' ? (
            renderFields(section.content as Record<string, string>)
          ) : (
            <div className={`border border-transparent ${isEditingLocally ? 'border-gray-300 dark:border-gray-600 rounded-md p-2' : ''}`}>
              {isEditingLocally && <EditorMenuBar editor={editor} />}
              <div 
                onClick={!isEditingLocally ? handleStartEditing : undefined}
                className={isEditingLocally ? '' : 'cursor-pointer'}
              >
                {!section.content && !isEditingLocally ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <p className="text-gray-500 dark:text-gray-400 text-sm italic mb-4">
                      This section is empty
                    </p>
                    <div className="flex space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDraft();
                        }}
                        disabled={isDrafting}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-75 flex items-center space-x-2"
                      >
                        {isDrafting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>AI is thinking...</span>
                          </>
                        ) : (
                          'Draft Section'
                        )}
                      </button>
                      {isDrafting && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onCancel) onCancel();
                          }}
                          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <EditorContent editor={editor} />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <ComparisonModal
        isOpen={showComparisonModal}
        onClose={() => {
          setShowComparisonModal(false);
          setSelectedImprovement(null);
        }}
        originalContent={typeof section.content === 'string' ? section.content : ''}
        newContent={selectedImprovement?.content || ''}
        onReplace={() => {
          if (selectedImprovement) {
            handleApplyImprovement(selectedImprovement);
          }
          setShowComparisonModal(false);
        }}
        onAppend={() => {
          if (selectedImprovement) {
            handleAppendImprovement(selectedImprovement);
          }
          setShowComparisonModal(false);
        }}
        onRetry={handleRetry}
        currentModel={currentModel}
        onModelChange={setCurrentModel}
      />
    </div>
  );
} 