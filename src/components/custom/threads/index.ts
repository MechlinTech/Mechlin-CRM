// Main components
export { EnquiryThread } from './EnquiryThread'
export { ThreadView } from './ThreadView'
export { MessageComposer } from './MessageComposer'
export { MessageItem } from './MessageItem'

// Re-export types for convenience
export type { 
    Thread, 
    Message, 
    Participant, 
    Attachment,
    CreateThreadInput,
    UpdateThreadInput,
    CreateMessageInput,
    CreateAttachmentInput
} from '@/data/threads'
