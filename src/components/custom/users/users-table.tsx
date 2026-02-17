"use client"

import { useState, useEffect } from "react"
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
import { useRBAC } from "@/context/rbac-context" // RBAC Integration
import { useRouter } from "next/navigation"

interface UsersTableProps {
  users: User[]
}

export function UsersTable({ users }: UsersTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [organisationFilter, setOrganisationFilter] = useState<string>("all")
  
  // RBAC Hooks
  const { hasPermission, loading } = useRBAC()
  const router = useRouter()

  // RBAC: Path Restriction Logic
  useEffect(() => {
    if (!loading && !hasPermission('users.read')) {
      router.push('/unauthorized')
    }
  }, [loading, hasPermission, router])

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

  // Prevent UI flicker while checking permissions
  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-gray-500">Verifying permissions...</p>
      </div>
    )
  }

  // Double check visibility before rendering content
  if (!hasPermission('users.read')) return null;

  return (
    <div className="space-y-6 p-2">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 shadow-sm">
        <div className="flex-1 w-full sm:w-auto">
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm border-gray-200/50 focus:border-purple-300 focus:ring-purple-500/20"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] border-gray-200/50 focus:border-purple-300 focus:ring-purple-500/20">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Select value={organisationFilter} onValueChange={setOrganisationFilter}>
          <SelectTrigger className="w-full sm:w-[200px] border-gray-200/50 focus:border-purple-300 focus:ring-purple-500/20">
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
      <div className="bg-white rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
        <DataTable columns={columns} data={filteredUsers} />
      </div>
    </div>
  )
}