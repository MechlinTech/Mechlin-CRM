"use client"

import { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Button } from '@/components/ui/button'
import { Bold, Italic, List, ListOrdered, Undo, Redo } from 'lucide-react'

export function WysiwygEditor({
  content = '',
  onChange,
  className = '',
}: any) {
  const [isMounted, setIsMounted] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { HTMLAttributes: { class: 'list-disc pl-5 mb-2' } },
        orderedList: { HTMLAttributes: { class: 'list-decimal pl-5 mb-2' } },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-blue-600 hover:text-blue-800' },
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        // FIXED: Using flex-1 and max-h-full to ensure it fills the large dialog container
        class: `prose prose-sm max-w-full focus:outline-none flex-1 min-h-[350px] max-h-full overflow-y-auto p-6 break-words whitespace-pre-wrap w-full ${className}`,
      },
    }
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (editor && content === '') {
      editor.commands.setContent('');
    }
  }, [content, editor]);

  if (!isMounted || !editor) return <div className="h-[400px] bg-zinc-50 animate-pulse rounded-2xl" />;

  return (
    <div className="border border-zinc-200 rounded-2xl overflow-hidden w-full h-full bg-white shadow-sm flex flex-col max-w-full">
      <div className="border-b bg-zinc-50/50 p-2 flex flex-wrap gap-0.5 sticky top-0 z-10">
        <Button variant="ghost" size="sm" type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'bg-zinc-200' : ''}><Bold className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'bg-zinc-200' : ''}><Italic className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'bg-zinc-200' : ''}><List className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'bg-zinc-200' : ''}><ListOrdered className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" type="button" onClick={() => editor.chain().focus().undo().run()}><Undo className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" type="button" onClick={() => editor.chain().focus().redo().run()}><Redo className="h-4 w-4" /></Button>
      </div>

      <div className="flex-1 overflow-y-auto bg-white max-w-full h-full">
        <EditorContent editor={editor} className="max-w-full h-full" />
      </div>
    </div>
  )
}