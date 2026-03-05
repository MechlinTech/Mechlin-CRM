"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Plus, Search, Trash } from 'lucide-react'
import { ThreadView } from './ThreadView'
import { Thread } from '@/data/threads'
import { 
    getAllThreadsAction, 
    createThreadAction, 
    updateThreadAction,
    createMessageAction,
    deleteThreadAction 
} from '@/actions/threads'
import { useRBAC } from '@/context/rbac-context'
import { useRouter } from 'next/navigation'

interface EnquiryThreadProps {
    contextType: 'project' | 'support' | 'user' | 'general'
    contextId?: string
    currentUserId: string
    title?: string
    showThreadList?: boolean
    defaultView?: 'list' | 'create' | 'thread'
}

export function EnquiryThread({ 
    contextType, 
    contextId, 
    currentUserId,
    title = "Discussion Threads",
    showThreadList = true,
    defaultView = "list"
}: EnquiryThreadProps) {
    const [view, setView] = useState<'list' | 'create' | 'thread'>('list')
    const [threads, setThreads] = useState<Thread[]>([])
    const [selectedThread, setSelectedThread] = useState<Thread | null>(null)
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const { hasPermission, loading: rbacLoading } = useRBAC()
    const router = useRouter()
    
    // New thread form state
    const [newThreadTitle, setNewThreadTitle] = useState('')
    const [newThreadDescription, setNewThreadDescription] = useState('')
    const [newThreadPriority, setNewThreadPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
    const [newThreadStatus, setNewThreadStatus] = useState<'open' | 'in_progress' | 'closed'>('open')
    const [newThreadIsPublic, setNewThreadIsPublic] = useState(true)

    useEffect(() => {
        // RBAC: Path restriction check
        if (!rbacLoading && !hasPermission('threads.read')) {
            router.push('/unauthorized')
            return
        }

        setView(defaultView)
        if (defaultView === 'list' || showThreadList) {
            loadThreads()
        }
    }, [contextType, contextId, defaultView, rbacLoading, hasPermission, router])

    const loadThreads = async () => {
        setLoading(true)
        try {
            const result = await getAllThreadsAction(contextType, contextId)
            if (result.success && result.threads) {
                setThreads(result.threads)
            }
        } catch (error) {
            console.error('Error loading threads:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateThread = async () => {
        if (!newThreadTitle.trim()) return
        
        // RBAC Check
        if (!hasPermission('threads.create')) {
            console.error('Unauthorized to create threads')
            return
        }

        if (contextType !== 'general' && !contextId) {
            console.error(`Context ID is required for ${contextType} threads`)
            return
        }

        setLoading(true)
        try {
            const result = await createThreadAction({
                title: newThreadTitle.trim(),
                context_type: contextType,
                context_id: contextId || undefined,
                status: newThreadStatus,
                priority: newThreadPriority,
                created_by: currentUserId,
                is_public: newThreadIsPublic
            })

            if (result.success && result.thread) {
                setNewThreadTitle('')
                setNewThreadDescription('')
                setNewThreadPriority('medium')
                setNewThreadStatus('open')
                setNewThreadIsPublic(true)
                
                setSelectedThread(result.thread)
                setView('thread')
                loadThreads()
            } else {
                console.error('Failed to create thread:', result.error)
            }
        } catch (error) {
            console.error('Error creating thread:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteThread = async (threadId: string) => {
        // RBAC Check
        if (!hasPermission('threads.delete')) {
            console.error('Unauthorized to delete threads')
            return
        }

        if (!confirm('Are you sure you want to delete this thread? This action cannot be undone.')) {
            return
        }

        setLoading(true)
        try {
            const result = await deleteThreadAction(threadId)
            if (result.success) {
                if (selectedThread?.id === threadId) {
                    setSelectedThread(null)
                    setView('list')
                }
                loadThreads()
            } else {
                console.error('Failed to delete thread:', result.error)
            }
        } catch (error) {
            console.error('Error deleting thread:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSelectThread = (thread: Thread) => {
        setSelectedThread(thread)
        setView('thread')
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
            case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
            case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
            case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
            case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
            case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const filteredThreads = threads.filter(thread =>
        thread.title.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (rbacLoading) return null

    if (view === 'thread' && selectedThread) {
        return (
            <div className="space-y-4">
                <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-3">
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-gray-900 truncate">
                            {selectedThread.title}
                        </h2>
                    </div>

                    {showThreadList && (
                        <button
                            onClick={() => setView('list')}
                            className="flex items-center gap-2 text-xs text-gray-600 hover:text-blue-600 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                        </button>
                    )}
                </div>
                <ThreadView thread={selectedThread} currentUserId={currentUserId} />
            </div>
        )
    }

    if (view === 'create') {
        return (
            <div className="space-y-4">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setView('list')}
                        className="text-blue-600 hover:text-blue-800"
                    >
                        ← Back to Threads
                    </button>
                    <h2 className="text-lg font-bold">Create New Thread</h2>
                </div>
                
                <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">Thread Details</h3>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="title" className="text-xs font-medium">
                                Thread Title *
                            </label>
                            <Input
                                id="title"
                                value={newThreadTitle}
                                onChange={(e) => setNewThreadTitle(e.target.value)}
                                placeholder="Enter thread title..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        handleCreateThread()
                                    }
                                }}
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="description" className="text-xs font-medium">
                                Description
                            </label>
                            <textarea
                                id="description"
                                value={newThreadDescription}
                                onChange={(e) => setNewThreadDescription(e.target.value)}
                                placeholder="Enter thread description (optional)..."
                                className="w-full p-3 border rounded-md resize-none h-24"
                                rows={3}
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="priority" className="text-xs font-medium">
                                    Priority
                                </label>
                                <select
                                    id="priority"
                                    value={newThreadPriority}
                                    onChange={(e) => setNewThreadPriority(e.target.value as any)}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                            
                            <div>
                                <label htmlFor="status" className="text-xs font-medium">
                                    Status
                                </label>
                                <select
                                    id="status"
                                    value={newThreadStatus}
                                    onChange={(e) => setNewThreadStatus(e.target.value as any)}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="open">Open</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="isPublic"
                                checked={newThreadIsPublic}
                                onChange={(e) => setNewThreadIsPublic(e.target.checked)}
                                className="rounded"
                            />
                            <label htmlFor="isPublic" className="text-xs font-medium">
                                Public thread (visible to all users)
                            </label>
                        </div>
                        
                        <div className="flex space-x-2">
                            <Button
                                onClick={handleCreateThread}
                                disabled={!newThreadTitle.trim() || loading}
                            >
                                Create Thread
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setView('list')}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
                <h2 className="text-lg font-medium flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    {title}
                </h2>
                {hasPermission('threads.create') && (
                    <Button onClick={() => setView('create')}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Thread
                    </Button>
                )}
            </div>

            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                    placeholder="Search threads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-9"
                />
            </div>

            <div className="space-y-2">
                {loading ? (
                    <div className="text-center py-6 text-gray-600 text-xs">
                        Loading threads...
                    </div>
                ) : filteredThreads.length === 0 ? (
                    <div className="text-center py-6 text-gray-600 text-xs">
                        {searchTerm ? 'No threads found matching your search.' : 'No threads yet. Create the first one!'}
                    </div>
                ) : (
                    filteredThreads.map((thread) => (
                        <div 
                            key={thread.id} 
                            className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div 
                                    className="flex-1 cursor-pointer"
                                    onClick={() => handleSelectThread(thread)}
                                >
                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-lg text-gray-900">{thread.title}</h3>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(thread.status)}`}>
                                                    {thread.status.replace('_', ' ')}
                                                </span>
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(thread.priority)}`}>
                                                    {thread.priority}
                                                </span>
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                                                    {thread.context_type}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                <span>Created by {thread.user?.name || 'Unknown User'}</span>
                                                <span>•</span>
                                                <span>{new Date(thread.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {hasPermission('threads.delete') && thread.created_by === currentUserId && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeleteThread(thread.id)
                                        }}
                                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                    >
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}