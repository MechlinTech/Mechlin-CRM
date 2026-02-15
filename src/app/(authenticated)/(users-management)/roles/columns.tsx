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
import { MoreHorizontal, Shield, Edit, Trash2, Eye } from "lucide-react"
import type { Role } from "@/types/rbac"

export const columns: ColumnDef<any>[] = [
    {
        accessorKey: "display_name",
        header: "Role Name",
        cell: ({ row }) => {
            const isSystemRole = row.original.is_system_role
            return (
                <div className="flex items-center gap-2">
                    <div className="font-medium text-[#0F172A]">
                        {row.getValue("display_name")}
                    </div>
                    {isSystemRole && (
                        <Badge variant="outline" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            System
                        </Badge>
                    )}
                </div>
            )
        },
    },
    {
        accessorKey: "name",
        header: "Internal Name",
        cell: ({ row }) => (
            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                {row.getValue("name")}
            </code>
        ),
    },
    {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => {
            const description = row.getValue("description") as string
            return (
                <div className="text-sm text-gray-600 max-w-md truncate">
                    {description || "No description"}
                </div>
            )
        },
    },
    {
        accessorKey: "role_permissions",
        header: "Permissions",
        cell: ({ row }) => {
            const permissions = row.original.role_permissions || []
            return (
                <Badge variant="secondary" className="font-normal">
                    {permissions.length} permissions
                </Badge>
            )
        },
    },
    {
        accessorKey: "organisation_id",
        header: "Scope",
        cell: ({ row }) => {
            const orgId = row.getValue("organisation_id")
            return (
                <Badge variant={orgId ? "default" : "outline"}>
                    {orgId ? "Organisation" : "Global"}
                </Badge>
            )
        },
    },
    {
        accessorKey: "is_active",
        header: "Status",
        cell: ({ row }) => {
            const isActive = row.getValue("is_active")
            return (
                <Badge variant={isActive ? "default" : "secondary"}>
                    {isActive ? "Active" : "Inactive"}
                </Badge>
            )
        },
    },
    {
        id: "actions",
        cell: ({ row, table }) => {
            const role = row.original
            const isSystemRole = role.is_system_role

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
                        <DropdownMenuItem
                            onClick={() => (table.options.meta as any)?.onView?.(role)}
                        >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => (table.options.meta as any)?.onEdit?.(role)}
                        >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                        {!isSystemRole && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => (table.options.meta as any)?.onDelete?.(role)}
                                    className="text-red-600"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
