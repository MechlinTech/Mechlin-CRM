"use client"

import { useState } from "react"
import { DataTable } from "@/components/shared/data-table"
import { columns } from "../../../app/(authenticated)/(users-management)/users/columns"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { User } from "@/actions/user-management"

interface UsersTableProps {
  users: User[]
}

export function UsersTable({ users }: UsersTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [organisationFilter, setOrganisationFilter] = useState<string>("all")

  // Get unique organizations for filter dropdown
  const uniqueOrganisations = Array.from(
    new Map(
      users
        .filter(user => user.organisations?.name)
        .map(user => [user.organisation_id, user.organisations?.name])
    )
  ).map(([id, name]) => ({ id, name }))

  // Filter users based on search query, status, and organization
  const filteredUsers = users.filter((user) => {
    // Search filter - matches name or email
    const matchesSearch =
      searchQuery === "" ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())

    // Status filter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter

    // Organization filter
    const matchesOrganisation = organisationFilter === "all" || user.organisation_id === organisationFilter

    return matchesSearch && matchesStatus && matchesOrganisation
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Select value={organisationFilter} onValueChange={setOrganisationFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by organization" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Organisations</SelectItem>
            {uniqueOrganisations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DataTable columns={columns} data={filteredUsers} />
    </div>
  )
}
