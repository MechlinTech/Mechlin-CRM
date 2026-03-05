"use client"

import { formatDistanceToNow } from 'date-fns'
import { Message } from '@/data/threads'
import { cn } from '@/lib/utils'

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
    
    const avatarColor = isOwnMessage 
        ? 'bg-blue-500 text-white' 
        : 'bg-slate-400 text-white'

    return (
        <div className={cn(
            "flex gap-3",
            isOwnMessage ? "flex-row-reverse" : "flex-row"
        )}>
            {/* Avatar */}
            <div className={cn(
                "h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-medium",
                avatarColor
            )}>
                {initials}
            </div>

            {/* Message Content */}
            <div className={cn(
                "flex flex-col gap-1 max-w-[70%]",
                isOwnMessage ? "items-end" : "items-start"
            )}>
                {/* User Info and Timestamp */}
                <div className={cn(
                    "flex items-center gap-2 text-xs",
                    isOwnMessage ? "flex-row-reverse" : "flex-row"
                )}>
                    <span className="font-medium text-slate-700">
                        {isOwnMessage ? 'You' : userName}
                    </span>
                    <span className="text-slate-500">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </span>
                </div>

                {/* Message Content - Simple Box */}
                <div className={cn(
                    "rounded-lg px-3 py-2 text-sm",
                    isOwnMessage 
                        ? "bg-blue-50 text-blue-900 border border-blue-100" 
                        : "bg-slate-50 text-slate-900 border border-slate-200"
                )}>
                    <div className="leading-relaxed break-words">
                        <div dangerouslySetInnerHTML={{ __html: message.content }} />
                    </div>
                </div>

                {/* Message Status Indicator for own messages */}
                {isOwnMessage && (
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                        <span>Sent</span>
                    </div>
                )}
            </div>
        </div>
    )
}
