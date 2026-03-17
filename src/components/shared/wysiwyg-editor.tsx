"use client"

import { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Heading3,
  Link as LinkIcon,
  Undo,
  Redo,
} from 'lucide-react'

interface WysiwygEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
  autoFocus?: boolean
  onKeyDown?: (event: KeyboardEvent) => void
}

export function WysiwygEditor({
  content = '',
  onChange,
  placeholder = 'Start writing...',
  editable = true,
  className = '',
  autoFocus = false,
  onKeyDown
}: WysiwygEditorProps) {
  const [url, setUrl] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            // Base class — level-specific styles handled via CSS below
            class: 'wysiwyg-heading',
          },
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: 'list-disc pl-5 mb-2'
          }
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: 'list-decimal pl-5 mb-2'
          }
        },
        listItem: {
          HTMLAttributes: {
            class: 'mb-1'
          }
        },
        paragraph: {
          HTMLAttributes: {
            class: 'mb-2'
          }
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 cursor-pointer',
        },
      }),
    ],
    content,
    editable,
    immediatelyRender: false,
    onTransaction: ({ transaction }) => {
      if (transaction.docChanged) {
        setRefreshKey(prev => prev + 1)
      }
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
      setRefreshKey(prev => prev + 1)
    },
    editorProps: {
      attributes: {
        class: `wysiwyg-editor max-w-none focus:outline-none min-h-[200px] p-4 ${className}`,
        placeholder: placeholder
      },
      handleDOMEvents: {
        keydown: (_view, event) => {
          onKeyDown?.(event)
          return false
        }
      }
    }
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!autoFocus) return
    if (!editor) return
    const t = setTimeout(() => {
      editor.commands.focus('end')
    }, 0)
    return () => clearTimeout(t)
  }, [autoFocus, editor])

  if (!editor || !isMounted) {
    return (
      <div className="border rounded-lg overflow-hidden w-full">
        <div className="border-b bg-gray-50 p-3">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-32"></div>
        </div>
        <div className="min-h-[200px] bg-white p-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
        </div>
      </div>
    )
  }

  const setLink = () => {
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
      setUrl('')
      setShowUrlInput(false)
    }
  }

  const unsetLink = () => {
    editor.chain().focus().unsetLink().run()
    setShowUrlInput(false)
    setUrl('')
  }

  return (
    <>
      {/* Scoped styles — no Tailwind Typography plugin required */}
      <style>{`
        .wysiwyg-editor h1 {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1.2;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }
        .wysiwyg-editor h2 {
          font-size: 1.5rem;
          font-weight: 700;
          line-height: 1.3;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        .wysiwyg-editor h3 {
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.4;
          margin-top: 0.75rem;
          margin-bottom: 0.4rem;
        }
        .wysiwyg-editor p {
          margin-bottom: 0.5rem;
        }
        .wysiwyg-editor ul {
          list-style-type: disc;
          padding-left: 1.25rem;
          margin-bottom: 0.5rem;
        }
        .wysiwyg-editor ol {
          list-style-type: decimal;
          padding-left: 1.25rem;
          margin-bottom: 0.5rem;
        }
        .wysiwyg-editor li {
          margin-bottom: 0.25rem;
        }
        .wysiwyg-editor strong {
          font-weight: 700;
        }
        .wysiwyg-editor em {
          font-style: italic;
        }
        .wysiwyg-editor code {
          background: #f3f4f6;
          border-radius: 0.25rem;
          padding: 0.1em 0.35em;
          font-size: 0.875em;
          font-family: ui-monospace, monospace;
        }
        .wysiwyg-editor a {
          color: #2563eb;
          text-decoration: underline;
          cursor: pointer;
        }
        .wysiwyg-editor a:hover {
          color: #1e40af;
        }
        /* Placeholder */
        .wysiwyg-editor p.is-editor-empty:first-child::before {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>

      <div className="border rounded-lg overflow-hidden w-full">
        {/* Toolbar */}
        <div className="border-b bg-gray-50 p-3 flex flex-wrap gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
            title="Ordered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            key={`h1-${refreshKey}`}
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}`}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            key={`h2-${refreshKey}`}
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            key={`h3-${refreshKey}`}
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}`}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (editor.isActive('link')) {
                unsetLink()
              } else {
                setShowUrlInput(!showUrlInput)
              }
            }}
            className={`p-2 ${editor.isActive('link') ? 'bg-gray-200' : ''}`}
            title="Link"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2"
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2"
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        {/* URL Input */}
        {showUrlInput && (
          <div className="border-b bg-gray-50 p-3 flex gap-2">
            <Input
              value={url || (editor.isActive('link') ? editor.getAttributes('link').href : '')}
              onChange={(e: any) => setUrl(e.target.value)}
              placeholder="Enter URL..."
              className="flex-1"
              onKeyDown={(e: any) => {
                if (e.key === 'Enter') setLink()
                if (e.key === 'Escape') {
                  setShowUrlInput(false)
                  setUrl('')
                }
              }}
            />
            <Button onClick={setLink} size="sm">
              {editor.isActive('link') ? 'Update Link' : 'Add Link'}
            </Button>
            <Button variant="outline" onClick={() => {
              setShowUrlInput(false)
              setUrl('')
            }} size="sm">
              Cancel
            </Button>
          </div>
        )}

        {/* Editor Content */}
        <div className="min-h-[200px] bg-white">
          <EditorContent editor={editor} />
        </div>
      </div>
    </>
  )
}