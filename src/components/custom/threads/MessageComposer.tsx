"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Paperclip, Send } from 'lucide-react'
import { createMessageAction } from '@/actions/threads'
import { useRBAC } from '@/context/rbac-context'
import { cn } from '@/lib/utils'

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
    placeholder = "Type a message..." 
}: MessageComposerProps) {
    const [content, setContent] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const { hasPermission, loading: rbacLoading } = useRBAC()

    const handleSubmit = async () => {
        if (!content.trim()) return
        
        // RBAC check: Sending a message requires thread update permission 
        if (!hasPermission('threads.update')) {
            console.error('Unauthorized to send messages')
            return
        }

        setIsSubmitting(true)
        try {
            const result = await createMessageAction({
                thread_id: threadId,
                content: content.trim(),
                message_type: 'text',
                created_by: userId
            })

            if (result.success && result.message) {
                // Clear content immediately
                setContent('')
                
                // Reset textarea height
                if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto'
                }
                
                // Clear file input if it exists
                const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
                if (fileInput) {
                    fileInput.value = ''
                }
                
                // Pass new message to parent for optimistic update
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

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            handleSubmit()
        }
    }

    // Auto-resize textarea
    const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(event.target.value)
        
        // Auto-resize
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }

    // Focus textarea on mount
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus()
        }
    }, [])

    // While permissions are loading, return null to avoid layout shift
    if (rbacLoading) return null;

    // RBAC: Hide entire composer if user lacks update permissions 
    if (!hasPermission('threads.update')) {
        return (
            <div className="h-full flex items-center justify-center p-6 text-center">
                <div className="space-y-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                        <Paperclip className="h-8 w-8 text-slate-400" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-700">
                            Permission Required
                        </p>
                        <p className="text-xs text-slate-500">
                            You do not have permission to reply to this thread.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex items-end gap-2 p-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
            {/* File Upload Button */}
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
                    className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full h-10 w-10 p-0 transition-all duration-200"
                >
                    <Paperclip className="h-5 w-5" />
                </Button>
            </label>

            {/* Simple Textarea - WhatsApp Style */}
            <div className="flex-1 relative">
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={isSubmitting || isUploading}
                    rows={1}
                    className="w-full resize-none border-0 bg-transparent placeholder:text-slate-400 text-slate-900 text-sm focus:outline-none focus:ring-0 max-h-32 overflow-y-auto py-2 px-0"
                    style={{
                        minHeight: '24px',
                        height: 'auto'
                    }}
                />
            </div>

            {/* Send Button - Always visible */}
            <Button
                onClick={handleSubmit}
                disabled={!content.trim() || isSubmitting || isUploading}
                size="sm"
                className={cn(
                    "rounded-full h-10 w-10 p-0 transition-all duration-200",
                    content.trim() && !isSubmitting && !isUploading
                        ? "bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transform hover:scale-105"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                )}
            >
                <Send className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    isSubmitting && "animate-pulse"
                )} />
            </Button>
        </div>
    )
}