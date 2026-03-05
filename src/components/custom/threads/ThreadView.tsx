"use client"

import { useState, useEffect, useRef, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageItem } from './MessageItem'
import { MessageComposer } from './MessageComposer'
import { Thread, Message } from '@/data/threads'
import { getMessagesByThreadAction, getParticipantsByThreadAction } from '@/actions/threads'
import { useRBAC } from '@/context/rbac-context'
import { useRouter } from 'next/navigation'
import { Users, Calendar } from 'lucide-react'

interface ThreadViewProps {
    thread: Thread
    currentUserId: string
    onMessageSent?: (newMessage?: any) => void
}

export function ThreadView({ thread, currentUserId, onMessageSent }: ThreadViewProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [participants, setParticipants] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement | null>(null)

    const { hasPermission, loading: rbacLoading } = useRBAC()
    const router = useRouter()

    useEffect(() => {
        if (!rbacLoading && !hasPermission('threads.read')) {
            router.push('/unauthorized')
            return
        }
        if (thread.id) loadThreadData()
    }, [thread.id, rbacLoading, hasPermission, router])

    const scrollToBottom = (smooth = true) => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' })
        }, 50)
    }

    useEffect(() => {
        if (messages.length === 0) return
        scrollToBottom(!loading)
    }, [messages.length, loading])

    const messagesWithSeparators = useMemo(() => {
        const result: Array<{ type: 'message' | 'separator'; data?: any; label?: string }> = []
        let lastDate: string | null = null
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        const formatDate = (date: Date) => {
            const d = new Date(date)
            d.setHours(0, 0, 0, 0)
            return d.toDateString()
        }

        const todayStr = formatDate(today)
        const yesterdayStr = formatDate(yesterday)

        for (const message of messages) {
            const msgDateStr = formatDate(new Date(message.created_at))
            if (msgDateStr !== lastDate) {
                let label = ''
                if (msgDateStr === todayStr) label = 'Today'
                else if (msgDateStr === yesterdayStr) label = 'Yesterday'
                else label = new Date(message.created_at).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric',
                    year: new Date(message.created_at).getFullYear() !== today.getFullYear() ? 'numeric' : undefined
                })
                result.push({ type: 'separator', label })
                lastDate = msgDateStr
            }
            result.push({ type: 'message', data: message })
        }
        return result
    }, [messages])

    const loadThreadData = async () => {
        setLoading(true)
        try {
            const messagesResult = await getMessagesByThreadAction(thread.id)
            if (messagesResult.success && messagesResult.messages) setMessages(messagesResult.messages)

            const participantsResult = await getParticipantsByThreadAction(thread.id)
            if (participantsResult.success && participantsResult.participants) setParticipants(participantsResult.participants)
        } catch (error) {
            console.error('Error loading thread data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleMessageSent = (newMessage?: any) => {
        if (newMessage) {
            setMessages(prev => [...prev, {
                ...newMessage,
                user: { id: currentUserId, name: 'You', email: '', avatar_url: '' }
            }])
        }
        onMessageSent?.(newMessage)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
            case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-200'
            case 'closed': return 'bg-slate-50 text-slate-700 border-slate-200'
            default: return 'bg-slate-50 text-slate-700 border-slate-200'
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'low': return 'bg-gray-50 text-gray-700 border-gray-200'
            case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200'
            case 'high': return 'bg-orange-50 text-orange-700 border-orange-200'
            case 'urgent': return 'bg-red-50 text-red-700 border-red-200'
            default: return 'bg-gray-50 text-gray-700 border-gray-200'
        }
    }

    if (loading || rbacLoading) {
        return (
            <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                    <Skeleton className="h-5 w-48" />
                </div>
                <div className="p-6 space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3">
                            <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-3 w-28" />
                                <Skeleton className="h-14 w-full rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const canReply = hasPermission('threads.update')

    return (
        // Normal block element — fits naturally in the page
        // The message list has a fixed max-height and scrolls internally
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">

            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-6 py-4">
                <div className="flex items-center gap-6 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span>Created by {thread.user?.name || 'Unknown User'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>{new Date(thread.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    {participants.length > 0 && (
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-slate-400" />
                            <span>{participants.length} participant{participants.length !== 1 ? 's' : ''}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Body: sidebar + chat side by side */}
            <div className="flex">

                {/* Chat column */}
                <div className="flex-1 flex flex-col min-w-0">

                    {/*  THIS is the only thing that scrolls.
                        Fixed height — messages pile up inside, old ones scroll up. */}
                    <div
                        className="h-[500px] overflow-y-auto p-6 bg-slate-50/30 custom-scrollbar"
                        style={{ scrollBehavior: 'smooth' }}
                    >
                        <div className="space-y-6">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                        <Users className="h-8 w-8 text-slate-300" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-500">No messages yet</p>
                                    <p className="text-xs text-slate-400 mt-1">Start the conversation</p>
                                </div>
                            )}

                            {messagesWithSeparators.map((item, idx) => {
                                if (item.type === 'separator') {
                                    return (
                                        <div key={`sep-${idx}`} className="flex items-center gap-3 my-4">
                                            <div className="flex-1 border-t border-slate-200" />
                                            <span className="text-xs text-slate-400 font-medium px-2">{item.label}</span>
                                            <div className="flex-1 border-t border-slate-200" />
                                        </div>
                                    )
                                }
                                return (
                                    <MessageItem
                                        key={item.data.id}
                                        message={item.data}
                                        isOwnMessage={item.data.created_by === currentUserId}
                                    />
                                )
                            })}

                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Composer — sits right below the message box, never scrolls */}
                    <div className="border-t border-slate-100 bg-white p-4">
                        {canReply ? (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <MessageComposer
                                    threadId={thread.id}
                                    userId={currentUserId}
                                    onMessageSent={handleMessageSent}
                                    placeholder="Type your message here..."
                                />
                            </div>
                        ) : (
                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-center">
                                <p className="text-sm text-slate-500">You do not have permission to reply to this discussion.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="w-72 flex-none border-l border-slate-100 flex flex-col bg-white">
                    <div className="p-5 border-b border-slate-100">
                        <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Thread Details</h3>
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400">Status</span>
                                <Badge className={`px-2 py-0.5 text-[10px] font-medium border ${getStatusColor(thread.status)}`}>
                                    {thread.status?.replace('_', ' ').toUpperCase()}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400">Priority</span>
                                <Badge className={`px-2 py-0.5 text-[10px] font-medium border ${getPriorityColor(thread.priority)}`}>
                                    {thread.priority?.toUpperCase()}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400">Type</span>
                                <Badge variant="outline" className="px-2 py-0.5 text-[10px] font-medium">
                                    {thread.context_type?.replace('_', ' ').toUpperCase()}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 border-b border-slate-100">
                        <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Participants</h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                    {thread.user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-slate-800 truncate">{thread.user?.name || 'Unknown'}</p>
                                    <p className="text-[10px] text-slate-400">Creator</p>
                                </div>
                            </div>
                            {participants.map((participant, idx) => (
                                <div key={idx} className="flex items-center gap-2.5">
                                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                        {participant.user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-slate-800 truncate">{participant.user?.name || 'Unknown'}</p>
                                        <p className="text-[10px] text-slate-400">Participant</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-5">
                        <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Activity</h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Calendar className="h-3 w-3" />
                                <span>Created {new Date(thread.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Users className="h-3 w-3" />
                                <span>{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}