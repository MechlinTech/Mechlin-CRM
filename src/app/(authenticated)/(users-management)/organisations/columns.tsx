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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { MoreHorizontal } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import type { Organisation, EscalationContact } from "@/actions/user-management"
import { deleteOrganisationAction } from "@/actions/user-management"
import { CreateOrganisationForm } from "@/components/custom/organisations/create-organisation-form"
import { useState } from "react"
import { formatDate } from "@/lib/utils"

// Component for actions cell to properly handle React hooks
const ActionsCell = ({ organisation }: { organisation: Organisation }) => {
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
}

// Helper function to get primary contact display
const getPrimaryContact = (escalationContacts: EscalationContact[]) => {
  if (!escalationContacts || escalationContacts.length === 0) return "No contacts"
  
  const primary = escalationContacts[0]  // Just get first contact
  return primary.email || primary.name
}

// Tooltip component for escalation contacts
const EscalationContactsTooltip = ({ contacts }: { contacts: EscalationContact[] }) => {
  if (!contacts || contacts.length === 0) return <span>No contacts</span>

  return (
    <div className="space-y-2">
      {contacts.map((contact, index) => (
        <div key={index} className="border-b pb-2 last:border-b-0">
          <p className="font-medium text-xs">{contact.name}</p>
          <p className="text-xs text-gray-600">{contact.email}</p>
          {contact.phone && <p className="text-xs text-gray-600">{contact.phone}</p>}
        </div>
      ))}
    </div>
  )
}

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
    cell: ({ row }) => {
      const organisation = row.original
      return (
        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border-2 ${
          organisation.status === 'active' 
            ? 'border-emerald-200 text-emerald-700 bg-emerald-50' 
            : organisation.status === 'suspended'
            ? 'border-red-200 text-red-700 bg-red-50'
            : organisation.status === 'trial'
            ? 'border-yellow-200 text-yellow-700 bg-yellow-50'
            : 'border-gray-200 text-gray-700 bg-gray-50'
        }`}>
          {organisation.status ? organisation.status.charAt(0).toUpperCase() + organisation.status.slice(1) : 'Unknown'}
        </div>
      )
    },
  },
  {
    id: "escalation_contacts",
    header: "Escalation Contact",
    cell: ({ row }) => {
      const organisation = row.original
      const primaryContact = getPrimaryContact(organisation.escalation_contacts)
      
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-pointer text-xs font-medium text-gray-900 hover:text-[#4F46E5] transition-colors">
                {primaryContact}
              </span>
            </TooltipTrigger>
            <TooltipContent className="bg-white border border-gray-200/50 shadow-lg rounded-xl p-3">
              <EscalationContactsTooltip contacts={organisation.escalation_contacts} />
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }) => {
      const organisation = row.original
      return <span className="text-xs text-gray-600">{formatDate(organisation.created_at)}</span>
    },
  },
  {
    accessorKey: "updated_at",
    header: "Updated At",
    cell: ({ row }) => {
      const organisation = row.original
      return <span className="text-xs text-gray-600">{formatDate(organisation.updated_at)}</span>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const organisation = row.original
      return <ActionsCell organisation={organisation} />
    },
    header: "",
  },
]