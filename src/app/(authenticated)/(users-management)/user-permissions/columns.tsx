"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Shield, Edit, Eye } from "lucide-react"
import { useRBAC } from "@/context/rbac-context" // Added RBAC Integration

export const columns: ColumnDef<any>[] = [
    {
        accessorKey: "name",
        header: "User Name",
        cell: ({ row }) => {
            const user = row.original
            return (
                <div className="flex items-center gap-2">
                    <div className="font-medium text-[#0F172A]">
                        {user.name}
                    </div>
                    <div className="text-sm text-gray-600">
                        {user.email}
                    </div>
                </div>
            )
        },
    },
    {
        accessorKey: "user_permissions",
        header: "Direct Permissions",
        cell: ({ row }) => {
            const permissions = row.original.user_permissions || []
            return (
                <Badge variant="secondary" className="font-normal">
                    {permissions.length} permissions
                </Badge>
            )
        },
    },
    {
        accessorKey: "user_roles",
        header: "Roles",
        cell: ({ row }) => {
            const roles = row.original.user_roles || []
            return (
                <div className="flex flex-wrap gap-1">
                    {roles.map((ur: any) => (
                        <Badge key={ur.roles.id} variant="outline" className="text-xs border-[#006AFF]/20 text-[#006AFF] bg-[#006AFF]/5">
                            {ur.roles.display_name}
                        </Badge>
                    ))}
                </div>
            )
        },
    },

    {   
        header: "Actions",
        id: "actions",
        cell: ({ row, table }) => {
            const user = row.original
            const { hasPermission, loading } = useRBAC() // Added RBAC Hook

            // Return loading placeholder while permissions are fetching
            if (loading) return <div className="h-8 w-8" />
         
            // Check if user has permission to assign roles/permissions
            const canEditPermissions = hasPermission('roles.update') ;
             const canViewPermissions = hasPermission('roles.read') ;
            
            


            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                       {canViewPermissions && <DropdownMenuItem
                            onClick={() => (table.options.meta as any)?.onView?.(user)}
                        >
                            <Eye className="mr-2 h-4 w-4" />
                            View Permissions
                        </DropdownMenuItem>}

                        {/* RBAC: Only show Edit option if user has users.assign_roles permission */}
                        {canEditPermissions && (
                            <DropdownMenuItem
                                onClick={() => (table.options.meta as any)?.onEdit?.(user)}
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Permissions
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]