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
  Code
} from 'lucide-react'

interface WysiwygEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
}

export function WysiwygEditor({
  content = '',
  onChange,
  placeholder = 'Start writing...',
  editable = true,
  className = ''
}: WysiwygEditorProps) {
  const [url, setUrl] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
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
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-lg xl:prose-2xl max-w-none focus:outline-none min-h-[200px] p-4 ${className}`,
        placeholder: placeholder
      }
    }
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!editor || !isMounted) {
    return (
      <div className="border rounded-lg overflow-hidden w-full">
        <div className="border-b bg-gray-50 p-3">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-32"></div>
        </div>
        <div className="min-h-[400px] bg-white p-4">
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
    <div className="border rounded-lg overflow-hidden w-full">
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-3 flex flex-wrap gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}`}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}`}
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
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          className="p-2"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          className="p-2"
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
              if (e.key === 'Enter') {
                setLink()
              }
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
      <div className="min-h-[400px] bg-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
