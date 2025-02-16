'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
import styles from './section.module.css';
import TurndownService from 'turndown';
import ComparisonModal from '../shared/ComparisonModal';
import { GripVertical, Trash2, Wand2 } from 'lucide-react';

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

interface ImprovementSuggestion {
  id: string;
  content: string;
  context: string[];
  timestamp: Date;
}

export interface SectionProps {
  section: Section;
  onUpdate: (content: string | Record<string, string>, title?: string) => void;
  onImprove: () => Promise<{ content: string, directApply: boolean }>;
  onDelete?: () => void;
  isCollapsed?: boolean;
  onEditStateChange?: (isEditing: boolean) => void;
  isImproving?: boolean;
  isDragging?: boolean;
  isImprovable?: boolean;
  dragHandleProps?: {
    onDragStart?: (event: React.DragEvent) => void;
    onDragEnd?: (event: React.DragEvent) => void;
    draggable?: boolean;
    [key: string]: unknown;
  };
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

export default function Section({ 
  section, 
  onUpdate, 
  onImprove,
  onDelete,
  isCollapsed = false,
  onEditStateChange,
  isImproving = false,
  isDragging = false,
  isImprovable = false,
  dragHandleProps
}: SectionProps) {
  const [isEditingLocally, setIsEditingLocally] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editContent, setEditContent] = useState<string | Record<string, string>>(section.content);
  const [editTitle, setEditTitle] = useState(section.title);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [selectedImprovement, setSelectedImprovement] = useState<ImprovementSuggestion | null>(null);
  const [currentModel, setCurrentModel] = useState('gpt-4o-mini');
  const [isSaving, setIsSaving] = useState(false);
  const [originalContent, setOriginalContent] = useState(section.content);
  const [originalTitle, setOriginalTitle] = useState(section.title);

  // Create a ref for the editor container
  const editorContainerRef = useRef<HTMLDivElement>(null);

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

  // Update local content and title when section changes
  useEffect(() => {
    setEditContent(section.content);
    setEditTitle(section.title);
    setOriginalContent(section.content);
    setOriginalTitle(section.title);
  }, [section.content, section.title]);

  const handleTitleSave = async () => {
    if (editTitle === section.title) {
      setIsEditingTitle(false);
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(section.content, editTitle);
      // Ensure minimum 2 second delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsEditingTitle(false);
    } catch (error) {
      console.error('Error saving title:', error);
      setEditTitle(originalTitle); // Revert only on error
    } finally {
      setIsSaving(false);
    }
  };

  const handleTitleCancel = () => {
    setEditTitle(originalTitle);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  const handleSave = useCallback(async () => {
    if (editContent === section.content) {
      setIsEditingLocally(false);
      onEditStateChange?.(false);
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(editContent);
      // Ensure minimum 2 second delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsEditingLocally(false);
      if (editor) {
        editor.setEditable(false);
      }
      onEditStateChange?.(false);
    } catch (error) {
      console.error('Error saving content:', error);
      setEditContent(originalContent);
    } finally {
      setIsSaving(false);
    }
  }, [editContent, section.content, editor, onUpdate, onEditStateChange, originalContent]);

  const handleCancel = () => {
    setIsEditingLocally(false);
    setEditContent(originalContent);
    if (editor) {
      editor.setEditable(false);
      if (typeof section.content === 'string') {
        const html = marked.parse(originalContent as string);
        editor.commands.setContent(html);
      }
    }
    onEditStateChange?.(false);
  };

  const handleStartEditing = () => {
    setIsEditingLocally(true);
    if (editor) {
      editor.setEditable(true);
      editor.commands.focus('start');
    }
    onEditStateChange?.(true);
  };

  // Handle clicks outside the editor
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isEditingLocally && 
        editorContainerRef.current && 
        !editorContainerRef.current.contains(event.target as Node)
      ) {
        handleSave();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditingLocally, handleSave]);

  // Initialize editor content when component mounts or content changes
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

  const handleImprove = async () => {
    try {
      if (onImprove && section.type === 'text') {
        const response = await onImprove();
        if (response && typeof response.content === 'string') {
          if (response.directApply) {
            onUpdate(response.content);
            return;
          }
          setSelectedImprovement({
            id: 'current',
            content: response.content,
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
        const response = await onImprove();
        if (response && typeof response.content === 'string') {
          setSelectedImprovement({
            id: 'current',
            content: response.content,
            context: [],
            timestamp: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Error retrying improvement:', error);
    }
  };

  const handleApplyImprovement = async (improvement: ImprovementSuggestion) => {
    if (section.type === 'text') {
      onUpdate(improvement.content);
      setShowComparisonModal(false);
      setSelectedImprovement(null);
    }
  };

  const handleAppendImprovement = async (improvement: ImprovementSuggestion) => {
    if (section.type === 'text' && typeof section.content === 'string') {
      onUpdate(`${section.content}\n\n${improvement.content}`);
      setShowComparisonModal(false);
      setSelectedImprovement(null);
    }
  };

  return (
    <div className="prose max-w-none dark:prose-invert">
      <div className="flex justify-between items-center mb-4">
        <div className="flex-1 flex items-center space-x-2">
          {dragHandleProps && (
            <div className={`cursor-move ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`} {...dragHandleProps}>
              <GripVertical className="w-5 h-5 text-gray-400" />
            </div>
          )}
          {isEditingTitle ? (
            <div className="flex-1">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                autoFocus
                className="w-full text-lg font-semibold bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
              />
            </div>
          ) : (
            <h3 
              onClick={() => !isCollapsed && setIsEditingTitle(true)}
              className={`text-lg font-semibold text-gray-900 dark:text-white ${!isCollapsed && 'cursor-pointer hover:text-blue-500 dark:hover:text-blue-400'}`}
            >
              {section.title}
            </h3>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {!isCollapsed && !isEditingLocally && !isEditingTitle && (
            <>
              {section.type === 'text' && section.content && (
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
                  {isImproving ? 'Improving...' : 'Improve'}
                </button>
              )}
              <button
                onClick={handleStartEditing}
                className="px-3 py-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Edit
              </button>
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="p-1.5 text-sm text-red-500 hover:text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
          {(isEditingLocally || isEditingTitle) && (
            <>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-3 py-1 text-sm bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-md hover:bg-red-100 dark:hover:bg-red-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-3 py-1 text-sm bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-300 rounded-md hover:bg-green-100 dark:hover:bg-green-800 disabled:opacity-50 flex items-center space-x-1"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 dark:border-green-300 border-t-transparent"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div 
          ref={editorContainerRef}
          className={`border border-transparent ${isEditingLocally ? 'border-gray-300 dark:border-gray-600 rounded-md p-2' : ''}`}
        >
          {isEditingLocally && (
            <div className="flex justify-between items-center mb-2">
              <EditorMenuBar editor={editor} />
            </div>
          )}
          <div 
            onClick={!isEditingLocally ? handleStartEditing : undefined}
            className={isEditingLocally ? '' : 'cursor-pointer'}
          >
            {!section.content && !isEditingLocally ? (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-gray-500 dark:text-gray-400 text-sm italic mb-4">
                  {section.title === 'New Section' 
                    ? 'Add a descriptive title to enable AI create'
                    : 'This section is empty'
                  }
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImprove();
                    }}
                    disabled={section.title === 'New Section' || isImproving}
                    className={`px-4 py-2 rounded-md flex items-center space-x-2 ${
                      section.title === 'New Section' || isImproving
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isImproving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        <span>Create</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <EditorContent editor={editor} />
            )}
          </div>
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