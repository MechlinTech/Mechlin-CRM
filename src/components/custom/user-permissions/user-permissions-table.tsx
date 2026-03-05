"use client"

import { useState } from "react"
import { DataTable } from "@/components/shared/data-table"
import { columns } from "@/app/(authenticated)/(users-management)/user-permissions/columns"
import { EditUserPermissionsDialog } from "./edit-user-permissions-dialog"
import { ViewUserPermissionsDialog } from "./view-user-permissions-dialog"

interface UserPermissionsTableProps {
    users: any[]
}

export function UserPermissionsTable({ users }: UserPermissionsTableProps) {
    const [selectedUser, setSelectedUser] = useState<any | null>(null)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isViewOpen, setIsViewOpen] = useState(false)

    const handleEdit = (user: any) => {
        setSelectedUser(user)
        setIsEditOpen(true)
    }

    const handleView = (user: any) => {
        setSelectedUser(user)
        setIsViewOpen(true)
    }

    return (
        <>
            <DataTable
                columns={columns}
                data={users}
                meta={{
                    onEdit: handleEdit,
                    onView: handleView,
                }}
            />

            {selectedUser && (
                <>
                    <EditUserPermissionsDialog
                        user={selectedUser}
                        open={isEditOpen}
                        onOpenChange={setIsEditOpen}
                    />
                    <ViewUserPermissionsDialog
                        user={selectedUser}
                        open={isViewOpen}
                        onOpenChange={setIsViewOpen}
                    />
                </>
            )}
        </>
    )
}
