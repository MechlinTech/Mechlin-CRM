"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MoreHorizontal } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import type { User } from "@/actions/user-management"
import { deleteUserAction } from "@/actions/user-management"
import { CreateUserForm } from "@/components/custom/users/create-user-form"
import { useState } from "react"
import { formatDate } from "@/lib/utils"

// This is the columns for the users table.
export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "organisations.name",
    header: "Organisation",
    cell: ({ row }) => {
      const user = row.original
      return <span className="text-xs font-medium text-gray-900">{user.organisations?.name || "N/A"}</span>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const user = row.original
      return (
        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border-2 ${
          user.status === 'active' 
            ? 'border-emerald-200 text-emerald-700 bg-emerald-50' 
            : user.status === 'suspended'
            ? 'border-red-200 text-red-700 bg-red-50'
            : 'border-gray-200 text-gray-700 bg-gray-50'
        }`}>
          {user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'Unknown'}
        </div>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }) => {
      const user = row.original
      return <span className="text-xs text-gray-600">{formatDate(user.created_at)}</span>
    },
  },
  {
    accessorKey: "updated_at",
    header: "Updated At",
    cell: ({ row }) => {
      const user = row.original
      return <span className="text-xs text-gray-600">{formatDate(user.updated_at)}</span>
    },
  },
  {
    header: "Actions",
    id: "actions",
    cell: ({ row }) => {
      const user = row.original
      const [editDialogOpen, setEditDialogOpen] = useState(false)
 
      return (
        <>
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
                onClick={() => setEditDialogOpen(true)}
              >
                Edit User
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => deleteUserAction(user.id)}
              >
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>
                  Update the user details below.
                </DialogDescription>
              </DialogHeader>
              <CreateUserForm 
                user={user}
                onSuccess={() => setEditDialogOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </>
      )
    },
  },
]
