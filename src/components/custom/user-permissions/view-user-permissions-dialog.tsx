"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { ViewUserPermissionsForm } from "./view-user-permissions-form"

interface ViewUserPermissionsDialogProps {
    user: any
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ViewUserPermissionsDialog({ user, open, onOpenChange }: ViewUserPermissionsDialogProps) {
   return (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">

      {/* Header — fixed */}
      <div className="sticky top-0 bg-[#006AFF] px-6 py-4 border-b z-10 flex items-start justify-between">
        <DialogHeader>
          <DialogTitle className="text-lg text-white">
            View Permissions: {user?.name}
          </DialogTitle>
          <DialogDescription className="text-gray-200 text-sm">
            User's direct permissions and assigned roles.
          </DialogDescription>
        </DialogHeader>
        <button
          onClick={() => onOpenChange(false)}
          className="text-white hover:text-gray-200 transition-colors p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scroll area — only this scrolls */}
      <div className="px-6 py-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
        <ViewUserPermissionsForm user={user} />
      </div>

    </DialogContent>
  </Dialog>
);

}
