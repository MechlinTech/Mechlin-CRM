"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import { EditRoleForm } from "@/components/custom/roles/edit-role-form"
import { X } from "lucide-react"

interface EditRoleDialogProps {
    role: any
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditRoleDialog({ role, open, onOpenChange }: EditRoleDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] p-0 overflow-hidden" showCloseButton={false}>

                {/* Sticky Header */}
                <div className="sticky top-0 bg-gradient-to-r from-[#006AFF] to-[#0055CC] px-6 py-5 border-b z-10 flex items-start justify-between">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-white">
                            Edit Role: {role?.display_name}
                        </DialogTitle>
                        <DialogDescription className="text-gray-300 text-sm">
                            Update role information and permissions.
                        </DialogDescription>
                    </DialogHeader>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="text-white hover:text-gray-200 hover:bg-white/10 transition-all duration-200 p-1 rounded"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Scroll Area Only */}
                <div className="px-6 py-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
                    <EditRoleForm
                        role={role}
                        onSuccess={() => onOpenChange(false)}
                    />
                </div>

            </DialogContent>
        </Dialog>
    )
}
