"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { CreateRoleForm } from "@/components/custom/roles/create-role-form"

interface CreateRoleDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateRoleDialog({ open, onOpenChange }: CreateRoleDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-0">
                <div className="sticky top-0 bg-gradient-to-r from-[#0F172A] to-[#1e293b] px-6 py-5 border-b z-10">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-white">Create New Role</DialogTitle>
                        <DialogDescription className="text-gray-300 text-sm">
                            Define a new role with specific permissions for your organisation.
                        </DialogDescription>
                    </DialogHeader>
                </div>
                <div className="px-6 py-4">
                    <CreateRoleForm onSuccess={() => onOpenChange(false)} showButton={true} />
                </div>
            </DialogContent>
        </Dialog>
    )
}
