"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { X } from "lucide-react"
import { EditUserPermissionsForm } from "./edit-user-permissions-form"

interface EditUserPermissionsDialogProps {
    user: any
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditUserPermissionsDialog({ user, open, onOpenChange }: EditUserPermissionsDialogProps) {
   return (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
      
      {/* Header — fixed */}
      <div className="sticky top-0 bg-gradient-to-r from-[#006AFF] to-[#0055CC] px-6 py-4 border-b z-10 flex items-start justify-between">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white">
            Edit Permissions: {user?.name}
          </DialogTitle>
          <DialogDescription className="text-gray-200 text-sm">
            Manage direct permissions for this user.
          </DialogDescription>
        </DialogHeader>
        <button
          onClick={() => onOpenChange(false)}
          className="text-white hover:text-gray-200 hover:bg-white/10 transition-all duration-200 p-1 rounded"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scroll area — only this scrolls */}
      <div className="px-6 py-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
        <EditUserPermissionsForm
          user={user}
          onSuccess={() => onOpenChange(false)}
        />
      </div>

    </DialogContent>
  </Dialog>
);

}
