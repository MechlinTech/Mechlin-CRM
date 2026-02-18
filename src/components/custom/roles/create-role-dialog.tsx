"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { CreateRoleForm } from "@/components/custom/roles/create-role-form"
import { X } from "lucide-react"

interface CreateRoleDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateRoleDialog({ open, onOpenChange }: CreateRoleDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0 flex flex-col" showCloseButton={false}>
                <div className="flex-shrink-0 bg-gradient-to-r from-[#006AFF] to-[#0055CC] px-6 py-5 border-b rounded-t-lg flex items-start justify-between">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-white">Create New Role</DialogTitle>
                        <DialogDescription className="text-gray-300 text-sm">
                            Define a new role with specific permissions for your organisation.
                        </DialogDescription>
                    </DialogHeader>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="text-white hover:text-gray-200 hover:bg-white/10 transition-all duration-200 p-1 rounded"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
                    <CreateRoleForm onSuccess={() => onOpenChange(false)} showButton={true} />
                </div>
            </DialogContent>
        </Dialog>
    )
}
