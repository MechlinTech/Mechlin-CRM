"use client"

import { useState } from "react"
import { DataTable } from "@/components/shared/data-table"
import { columns } from "../../../app/(authenticated)/(users-management)/organisations/columns"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Organisation } from "@/actions/user-management"
import { useRBAC } from "@/context/rbac-context"

interface OrganisationsTableProps {
  organisations: Organisation[]
}

export function OrganisationsTable({ organisations }: OrganisationsTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { hasPermission, loading } = useRBAC();

  // Filter organisations based on search query and status
  const filteredOrganisations = organisations.filter((org) => {
    // Search filter - matches name or slug
    const matchesSearch =
      searchQuery === "" ||
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchQuery.toLowerCase())

    // Status filter
    const matchesStatus = statusFilter === "all" || org.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // RBAC: Show restriction if user cannot read organisations
  if (!loading && !hasPermission('organisations.read')) {
    return (
        <div className="p-8 text-center bg-white rounded-md border border-gray-100">
            <p className="text-sm text-red-500 font-medium italic">
                Access Restricted: You do not have permission to view organisations.
            </p>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-md p-4 shadow-sm">
        <div className="flex-1 w-full sm:w-auto">
          <Input
            placeholder="Search by name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm border-gray-200/50 focus:border-emerald-300 focus:ring-emerald-500/20"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] border-gray-200/50 focus:border-emerald-300 focus:ring-emerald-500/20 rounded-md">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="bg-white rounded-md border border-gray-200/50 shadow-sm overflow-hidden">
        <DataTable columns={columns} data={filteredOrganisations} />
      </div>
    </div>
  )
}