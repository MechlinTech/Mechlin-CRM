"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { WysiwygEditor } from '@/components/shared/wysiwyg-editor'
import { Paperclip, Send } from 'lucide-react'
import { createMessageAction } from '@/actions/threads'

interface MessageComposerProps {
    threadId: string
    userId: string
    onMessageSent?: (newMessage?: any) => void
    placeholder?: string
}

export function MessageComposer({ 
    threadId, 
    userId, 
    onMessageSent,
    placeholder = "Write your message..." 
}: MessageComposerProps) {
    const [content, setContent] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [editorKey, setEditorKey] = useState(0) // Force editor re-render

    const handleSubmit = async () => {
        if (!content.trim()) return

        setIsSubmitting(true)
        try {
            const result = await createMessageAction({
                thread_id: threadId,
                content: content.trim(),
                message_type: 'text',
                created_by: userId
            })

            if (result.success && result.message) {
                // Clear the content immediately
                setContent('')
                
                // Force editor to re-render with empty content
                setEditorKey(prev => prev + 1)
                
                // Clear file input if it exists
                const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
                if (fileInput) {
                    fileInput.value = ''
                }
                
                // Pass the new message to parent for optimistic update
                onMessageSent?.(result.message)
            } else {
                console.error('Failed to send message:', result.error)
            }
        } catch (error) {
            console.error('Error sending message:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (!files || files.length === 0) return

        setIsUploading(true)
        try {
            // TODO: Implement file upload to storage bucket
            console.error('File upload not implemented yet')
        } catch (error) {
            console.error('Error uploading file:', error)
        } finally {
            setIsUploading(false)
        }
    }

    const handleKeyDown = (event: KeyboardEvent | React.KeyboardEvent) => {
        if (event.key === 'Enter' && ((event as KeyboardEvent).metaKey || (event as KeyboardEvent).ctrlKey)) {
            event.preventDefault()
            handleSubmit()
        }
    }

    return (
        <div className="h-full flex flex-col min-h-0 rounded-lg border border-gray-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-300">
            {/* WYSIWYG Editor */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                <WysiwygEditor
                    key={editorKey} // Force re-render when key changes
                    content={content}
                    onChange={setContent}
                    placeholder={placeholder}
                    editable={!isSubmitting}
                    autoFocus={true}
                    onKeyDown={(e) => handleKeyDown(e)}
                    className="border-0 focus:outline-none text-sm h-full p-3"
                />
            </div>

            {/* Action Bar - Always Visible at Bottom */}
            <div className="mt-auto flex-shrink-0 flex items-center justify-between gap-2 px-3 py-2 bg-white border-t border-gray-200 sticky bottom-0">
                <div className="flex items-center gap-2">
                    {/* File Upload */}
                    <label className="cursor-pointer">
                        <input
                            type="file"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={isUploading || isSubmitting}
                            multiple
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={isUploading || isSubmitting}
                            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        >
                            <Paperclip className="h-4 w-4" />
                        </Button>
                    </label>
                </div>

                {/* Send Button - Always Visible */}
                <Button
                    onClick={handleSubmit}
                    disabled={!content.trim() || isSubmitting || isUploading}
                    size="sm"
                    className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-4"
                >
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Sending...' : 'Send'}
                </Button>
            </div>
        </div>
    )
}
