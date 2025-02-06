'use client';

import { useState, useEffect } from 'react';
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

interface Section {
  id: string;
  title: string;
  content: string | Record<string, string>;
  type: 'text' | 'fields';
}

interface ProposalSectionProps {
  section: Section;
  onUpdate: (id: string, content: string | Record<string, string>) => void;
  onImprove: (id: string) => void;
  isEditing: boolean;
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
  isEditing
}: ProposalSectionProps) {
  const [isEditingLocally, setIsEditingLocally] = useState(false);
  const [editContent, setEditContent] = useState<string | Record<string, string>>(section.content);

  // Convert markdown to HTML when content is updated
  useEffect(() => {
    if (typeof section.content === 'string') {
      try {
        // Configure marked for clean, semantic HTML output
        marked.setOptions({
          gfm: true, // GitHub Flavored Markdown
          breaks: true, // Add <br> on single line breaks
        });

        // Check if content is already HTML by looking for HTML tags
        const isHTML = /<[a-z][\s\S]*>/i.test(section.content);
        
        if (!isHTML) {
          const html = marked.parse(section.content.trim());
          if (typeof html === 'string') {
            setEditContent(html);
          }
        } else {
          setEditContent(section.content);
        }
      } catch (error) {
        console.error('Error converting markdown to HTML:', error);
        setEditContent(section.content);
      }
    }
  }, [section.content]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Disable default heading to use our custom config
      }),
      Placeholder.configure({
        placeholder: 'Click to edit...',
      }),
      Heading.configure({
        levels: [2, 3],
      }),
      BulletList,
      OrderedList,
      Bold,
      Italic,
      Code,
      CodeBlock,
      Blockquote,
    ],
    content: typeof editContent === 'string' ? editContent : '',
    editorProps: {
      attributes: {
        class: `${styles.tiptap} prose max-w-none dark:prose-invert focus:outline-none min-h-[100px] py-2`,
      },
    },
    onUpdate: ({ editor }) => {
      if (section.type === 'text') {
        const html = editor.getHTML();
        setEditContent(html);
      }
    },
  });

  useEffect(() => {
    if (editor && !isEditingLocally) {
      editor.setEditable(false);
    }
  }, [editor, isEditingLocally]);

  useEffect(() => {
    if (editor && typeof editContent === 'string') {
      editor.commands.setContent(editContent);
    }
  }, [editor, editContent]);

  const handleSave = () => {
    if (section.type === 'text' && typeof editContent === 'string') {
      // Clean up the HTML before saving
      const cleanHTML = editContent
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/>\s+</g, '><') // Remove whitespace between tags
        .trim();
      onUpdate(section.id, cleanHTML);
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
      editor.commands.focus('end');
    }
  };

  const handleCancel = () => {
    setIsEditingLocally(false);
    setEditContent(section.content);
    if (editor) {
      editor.setEditable(false);
      editor.commands.setContent(typeof section.content === 'string' ? section.content : '');
    }
  };

  const renderFields = (fields: Record<string, string>) => {
    return Object.entries(fields).map(([key, value]) => (
      <div key={key} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {key.split(/(?=[A-Z])/).join(' ')}
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
    ));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{section.title}</h3>
        <div className="flex space-x-2">
          {!isEditing && (
            <button
              onClick={() => onImprove(section.id)}
              className="px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800"
            >
              Improve
            </button>
          )}
          {!isEditing && !isEditingLocally && (
            <button
              onClick={handleStartEditing}
              className="px-3 py-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Edit
            </button>
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
      </div>
      <div className="prose max-w-none dark:prose-invert">
        {section.type === 'fields' ? (
          renderFields(section.content as Record<string, string>)
        ) : (
          <div 
            className={`border border-transparent ${isEditingLocally ? 'border-gray-300 dark:border-gray-600 rounded-md p-2' : ''}`}
          >
            {isEditingLocally && <EditorMenuBar editor={editor} />}
            <div 
              onClick={!isEditingLocally ? handleStartEditing : undefined}
              className={isEditingLocally ? '' : 'cursor-pointer'}
            >
              <EditorContent editor={editor} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 