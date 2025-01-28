import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Bold, Italic, Link as LinkIcon, List, ListOrdered } from 'lucide-react'
import PropTypes from 'prop-types'
import { useEffect } from 'react';

const MenuButton = ({ onClick, isActive, icon: Icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      p-1.5 rounded transition-colors
      ${isActive
        ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
        : 'text-[var(--color-text)]/60 hover:bg-[var(--color-secondary)]/10'
      }
    `}
    title={label}
  >
    <Icon className="w-4 h-4" />
  </button>
)

MenuButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  isActive: PropTypes.bool,
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired
}

const RichTextEditor = ({ value, onChange }) => {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          bulletList: { keepMarks: true, keepAttributes: false },
          orderedList: { keepMarks: true, keepAttributes: false }
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-[var(--color-primary)] underline cursor-pointer'
          }
        })
      ],
      content: value,
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML())
      },
      editorProps: {
        attributes: {
          class: 'prose max-w-none focus:outline-none min-h-[100px]'
        }
      }
    })
  
    // Add this effect to update editor content when value prop changes
    useEffect(() => {
      if (editor && value !== editor.getHTML()) {
        editor.commands.setContent(value);
      }
    }, [value, editor]);
  
    if (!editor) return null;

  const addLink = () => {
    const url = window.prompt('Enter a URL')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div className="w-full bg-[var(--color-surface)] border border-[var(--color-secondary)]/30 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 p-1.5 border-b border-[var(--color-secondary)]/20 bg-[var(--color-surface)]">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          icon={Bold}
          label="Bold"
        />
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          icon={Italic}
          label="Italic"
        />
        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          icon={List}
          label="Bullet List"
        />
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          icon={ListOrdered}
          label="Numbered List"
        />
        <MenuButton
          onClick={addLink}
          isActive={editor.isActive('link')}
          icon={LinkIcon}
          label="Add Link"
        />
      </div>

      {/* Editor Content Area */}
      <div className="bg-[var(--color-surface)]">
        <EditorContent editor={editor} />
      </div>

      <style>{`
        /* Tiptap / ProseMirror overrides */

        /* Editor container area */
        .ProseMirror {
          padding: 0.5rem 0.75rem;
          min-height: 100px;
          color: var(--color-text);
          background-color: var(--color-surface);
        }
        .ProseMirror:focus {
          outline: none;
          background-color: var(--color-surface);
        }

        /* Placeholder for empty editor */
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--color-text);
          opacity: 0.4;
          pointer-events: none;
          height: 0;
        }

        /* Basic reset for lists & paragraphs */
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5em;
          margin: 0;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5em;
          margin: 0;
        }
        .ProseMirror li {
          margin: 0.2em 0;
        }
        .ProseMirror p {
          margin: 0.3em 0;
        }
        .ProseMirror p:first-child {
          margin-top: 0;
        }
        .ProseMirror p:last-child {
          margin-bottom: 0;
        }

        /* Link color (if not using extension config) */
        .ProseMirror a {
          color: var(--color-primary);
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}

RichTextEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired
}

export default RichTextEditor
