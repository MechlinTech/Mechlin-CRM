"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar, X } from "lucide-react"

interface ViewRoleDialogProps {
  role: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewRoleDialog({ role, open, onOpenChange }: ViewRoleDialogProps) {
  const permissions = role?.role_permissions || []

  // Group permissions by module
  const permissionsByModule = permissions.reduce((acc: any, rp: any) => {
    const perm = rp.permissions
    if (perm) {
      if (!acc[perm.module]) acc[perm.module] = []
      acc[perm.module].push(perm)
    }
    return acc
  }, {})

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden" showCloseButton={false}>

        {/* ===== Sticky Header ===== */}
        <div className="sticky top-0 bg-[#006AFF] px-6 py-4 border-b z-10 flex items-start justify-between">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">
              {role?.display_name}
            </DialogTitle>

            <DialogDescription className="text-white">
              View role details and associated permissions
            </DialogDescription>
          </DialogHeader>
          <button
            onClick={() => onOpenChange(false)}
            className="text-white hover:text-gray-200 hover:bg-white/10 transition-all duration-200 p-1 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ===== Scroll Body (shorter scrollbar) ===== */}
        <div className="px-6 py-4 overflow-y-auto max-h-[70vh] custom-scrollbar">
          <div className="space-y-6">

            {/* -------- Basic Info -------- */}
            <div className="space-y-3">

              {role?.description && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Description</p>
                  <p className="text-sm text-gray-700">{role.description}</p>
                </div>
              )}

              <div className="flex gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <Badge variant={role?.is_active ? "default" : "secondary"}>
                    {role?.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                Created {new Date(role?.created_at).toLocaleDateString()}
              </div>
            </div>

            {/* -------- Permissions -------- */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Permissions</p>
                <Badge variant="secondary">
                  {permissions.length} total
                </Badge>
              </div>

              {/* Inner permissions scroll — keep separate */}
              <div className="border rounded-lg p-4 space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                {Object.entries(permissionsByModule).map(
                  ([module, modulePerms]: [string, any]) => (
                    <div key={module} className="space-y-2">
                      <p className="text-sm font-semibold capitalize border-b pb-1">
                        {module}
                      </p>

                      <div className="grid grid-cols-2 gap-2 pl-4">
                        {modulePerms.map((perm: any) => (
                          <div key={perm.id} className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            <span className="text-sm text-gray-700">
                              {perm.display_name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}

                {permissions.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No permissions assigned to this role
                  </p>
                )}
              </div>

            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  )
}
