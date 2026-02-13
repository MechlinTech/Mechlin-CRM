"use client"

import { useState } from "react"
import { DataTable } from "@/components/shared/data-table"
import { columns } from "@/app/(authenticated)/(users-management)/roles/columns"
import { EditRoleDialog } from "./edit-role-dialog"
import { ViewRoleDialog } from "./view-role-dialog"
import { DeleteRoleDialog } from "./delete-role-dialog"
import type { Role } from "@/types/rbac"

interface RolesTableProps {
    roles: any[]
}

export function RolesTable({ roles }: RolesTableProps) {
    const [selectedRole, setSelectedRole] = useState<any | null>(null)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isViewOpen, setIsViewOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)

    const handleEdit = (role: any) => {
        setSelectedRole(role)
        setIsEditOpen(true)
    }

    const handleView = (role: any) => {
        setSelectedRole(role)
        setIsViewOpen(true)
    }

    const handleDelete = (role: any) => {
        setSelectedRole(role)
        setIsDeleteOpen(true)
    }

    return (
        <>
            <DataTable
                columns={columns}
                data={roles}
                meta={{
                    onEdit: handleEdit,
                    onView: handleView,
                    onDelete: handleDelete,
                }}
            />

            {selectedRole && (
                <>
                    <EditRoleDialog
                        role={selectedRole}
                        open={isEditOpen}
                        onOpenChange={setIsEditOpen}
                    />
                    <ViewRoleDialog
                        role={selectedRole}
                        open={isViewOpen}
                        onOpenChange={setIsViewOpen}
                    />
                    <DeleteRoleDialog
                        role={selectedRole}
                        open={isDeleteOpen}
                        onOpenChange={setIsDeleteOpen}
                    />
                </>
            )}
        </>
    )
}
