'use client';

import { useEffect } from 'react';
import { useEditor, EditorContent, Editor as TiptapEditor } from '@tiptap/react';
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
import TurndownService from 'turndown';
import styles from './editor.module.css';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
});

export interface EditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
}

function EditorMenuBar({ editor }: { editor: TiptapEditor | null }) {
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
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`px-2 py-1 text-sm rounded ${
          editor.isActive('code')
            ? 'bg-gray-200 dark:bg-gray-600'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        Code
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`px-2 py-1 text-sm rounded ${
          editor.isActive('codeBlock')
            ? 'bg-gray-200 dark:bg-gray-600'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        Code Block
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
    </div>
  );
}

export default function Editor({ value, onChange, placeholder = 'Click to edit...', editable = true, className = '' }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
      }),
      Placeholder.configure({
        placeholder,
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
    content: marked.parse(value),
    editorProps: {
      attributes: {
        class: `${styles.tiptap} prose max-w-none dark:prose-invert focus:outline-none min-h-[100px] py-2 ${className}`,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const markdown = turndownService.turndown(html);
      onChange(markdown);
    },
  });

  // Update editor content when value prop changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      const html = marked.parse(value);
      editor.commands.setContent(html);
    }
  }, [editor, value]);

  // Update editor editable state when editable prop changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  return (
    <div>
      {editable && <EditorMenuBar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}