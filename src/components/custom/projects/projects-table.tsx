"use client"
import { useState } from "react"
import { DataTable } from "@/components/shared/data-table"
import { getColumns } from "./columns" 
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRBAC } from "@/context/rbac-context" // Added RBAC Integration

export function ProjectsTable({ projects, organisations, users }: any) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { hasPermission, loading } = useRBAC(); // Added RBAC Hook

  const filteredProjects = projects?.filter((proj: any) => {
    const matchesSearch = searchQuery === "" || 
      proj.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.organisations?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || proj.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const columns = getColumns(organisations, users);

  // RBAC: Show restriction if user cannot read projects
  if (!loading && !hasPermission('projects.read')) {
    return (
        <div className="p-10 text-center bg-white border border-slate-100 rounded-[24px]">
            <p className="text-sm text-slate-400 font-medium italic">
                Access Restricted: You do not have permission to view project lists.
            </p>
        </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search projects or organizations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] cursor-pointer">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable columns={columns} data={filteredProjects} />
    </div>
  )
}