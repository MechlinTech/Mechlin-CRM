"use client"

import { useState, useEffect, useRef, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageItem } from './MessageItem'
import { MessageComposer } from './MessageComposer'
import { Thread, Message } from '@/data/threads'
import { getMessagesByThreadAction, getParticipantsByThreadAction } from '@/actions/threads'
import { supabase } from '@/lib/supabase'

interface ThreadViewProps {
    thread: Thread
    currentUserId: string
    onMessageSent?: (newMessage?: any) => void
}

export function ThreadView({ thread, currentUserId, onMessageSent }: ThreadViewProps) {
    const [messages, setMessages] = useState<(Message & {
        user?: {
            id: string
            name?: string
            email?: string
            avatar_url?: string
        }
    })[]>([])
    const [participants, setParticipants] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        loadThreadData()
    }, [thread.id])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages.length])

    // Group messages by day for date separators
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
                if (msgDateStr === todayStr) {
                    label = 'Today'
                } else if (msgDateStr === yesterdayStr) {
                    label = 'Yesterday'
                } else {
                    label = new Date(message.created_at).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: new Date(message.created_at).getFullYear() !== today.getFullYear() ? 'numeric' : undefined
                    })
                }
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
            // Load messages
            const messagesResult = await getMessagesByThreadAction(thread.id)
            if (messagesResult.success && messagesResult.messages) {
                // Load user data for each message
                const messagesWithUsers = await Promise.all(
                    messagesResult.messages.map(async (message) => {
                        // Get user data for message creator
                        const { data: userData } = await supabase.auth.admin.getUserById(message.created_by)
                        return {
                            ...message,
                            user: userData.user ? {
                                id: userData.user.id,
                                name: userData.user.user_metadata?.name || userData.user.email,
                                email: userData.user.email,
                                avatar_url: userData.user.user_metadata?.avatar_url
                            } : null
                        }
                    })
                )
                setMessages(messagesWithUsers)
            }

            // Load participants
            const participantsResult = await getParticipantsByThreadAction(thread.id)
            if (participantsResult.success && participantsResult.participants) {
                setParticipants(participantsResult.participants)
            }
        } catch (error) {
            console.error('Error loading thread data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleMessageSent = (newMessage?: any) => {
        if (newMessage) {
            // Optimistically add the new message to the UI immediately
            const messageWithUser = {
                ...newMessage,
                user: {
                    id: currentUserId,
                    name: 'You', // This should be replaced with actual user data
                    email: '',
                    avatar_url: ''
                }
            }
            setMessages(prev => [...prev, messageWithUser])
        }
        
        // Also call parent callback if provided
        onMessageSent?.(newMessage)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-green-100 text-green-800'
            case 'in_progress': return 'bg-blue-100 text-blue-800'
            case 'closed': return 'bg-gray-100 text-gray-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'low': return 'bg-gray-100 text-gray-800'
            case 'medium': return 'bg-yellow-100 text-yellow-800'
            case 'high': return 'bg-orange-100 text-orange-800'
            case 'urgent': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold">{thread.title}</h1>
                    <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(thread.status)}`}>
                            {thread.status}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(thread.priority)}`}>
                            {thread.priority}
                        </span>
                        <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">
                            {thread.context_type}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>Created by Unknown User</span>
                        <span>•</span>
                        <span>{new Date(thread.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="h-[70vh] flex flex-col">
            {/* Messages and Input Side by Side */}
            <div className="flex-1 flex overflow-hidden">
                {/* Messages Section - Takes 2/3 space */}
                <div className="flex-1 bg-white overflow-hidden flex flex-col border border-gray-200 rounded-lg">
                    <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-white">
                        <h3 className="text-sm font-medium text-gray-700">Messages</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="space-y-4">
                            {messagesWithSeparators.map((item, idx) => {
                                if (item.type === 'separator') {
                                    return (
                                        <div key={`sep-${idx}`} className="flex items-center justify-center my-4">
                                            <div className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                                {item.label}
                                            </div>
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
                            
                            {messages.length === 0 && (
                                <div className="text-center text-gray-600 py-8">
                                    No messages yet. Start the conversation!
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                </div>

                {/* Input Section - Takes 1/3 space */}
                <div className="w-1/3 bg-gray-50 border-l border-gray-200 flex flex-col sticky top-0 self-start h-full">
                    <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-white">
                        <h3 className="text-sm font-medium text-gray-700">Reply to Thread</h3>
                    </div>
                    <div className="flex-1 overflow-hidden p-4">
                        <MessageComposer
                            threadId={thread.id}
                            userId={currentUserId}
                            onMessageSent={handleMessageSent}
                            placeholder="Type your message here..."
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
