"use client"

import { formatDistanceToNow } from 'date-fns'
import { Message } from '@/data/threads'

interface MessageItemProps {
    message: Message & {
        user?: {
            id: string
            name?: string
            email?: string
            avatar_url?: string
        }
    }
    isOwnMessage?: boolean
}

export function MessageItem({ message, isOwnMessage = false }: MessageItemProps) {
    const userName = message.user?.name || message.user?.email || 'Unknown User'

    // Local initial-based avatar
    const initials = userName
        .split(' ')
        .map(part => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('')
    const avatarColor = isOwnMessage ? 'bg-blue-500 text-white' : 'bg-gray-400 text-white'

    return (
        <div className={`flex ${isOwnMessage ? 'justify-start' : 'justify-end'}`}>
            <div className={`flex max-w-[85%] gap-3 ${isOwnMessage ? 'flex-row' : 'flex-row-reverse'}`}>
                {/* Avatar - Local initials */}
                <div className={`h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-medium ${avatarColor}`}>
                    {initials}
                </div>

                {/* Message Bubble */}
                <div className={`rounded-lg border px-3 py-2 ${isOwnMessage ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-200'}`}>
                    <div className={`flex items-center gap-2 text-xs ${isOwnMessage ? 'justify-start' : 'justify-end'}`}>
                        <span className="font-medium text-gray-900">
                            {isOwnMessage ? 'You' : userName}
                        </span>
                        <span className="text-gray-500">
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                    </div>

                    <div className="mt-1 text-sm text-gray-900 leading-relaxed">
                        <div dangerouslySetInnerHTML={{ __html: message.content }} />
                    </div>
                </div>
            </div>
        </div>
    )
}
