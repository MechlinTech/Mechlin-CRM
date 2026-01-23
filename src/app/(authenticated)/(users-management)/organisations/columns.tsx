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
import type { Organisation } from "@/actions/user-management"
import { deleteOrganisationAction } from "@/actions/user-management"
import { CreateOrganisationForm } from "@/components/custom/organisations/create-organisation-form"
import { useState } from "react"
import { formatDate } from "@/lib/utils"

// This is the columns for the organisations table.
export const columns: ColumnDef<Organisation>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "slug",
    header: "Slug",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }) => {
      const organisation = row.original
      return <span>{formatDate(organisation.created_at)}</span>
    },
  },
  {
    accessorKey: "updated_at",
    header: "Updated At",
    cell: ({ row }) => {
      const organisation = row.original
      return <span>{formatDate(organisation.updated_at)}</span>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const organisation = row.original
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
                Edit Organisation
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => deleteOrganisationAction(organisation.id)}
              >
                Delete Organisation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Organisation</DialogTitle>
                <DialogDescription>
                  Update the organisation details below.
                </DialogDescription>
              </DialogHeader>
              <CreateOrganisationForm 
                organisation={organisation}
                onSuccess={() => setEditDialogOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </>
      )
    },
  },
]