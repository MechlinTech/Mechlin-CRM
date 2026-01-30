// src/components/custom/projects/projects-table.tsx
"use client"
import { useState } from "react"
import { DataTable } from "@/components/shared/data-table"
import { getColumns } from "./columns" 
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ProjectsTable({ projects, organisations, users }: any) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredProjects = projects?.filter((proj: any) => {
    const matchesSearch = searchQuery === "" || 
      proj.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.organisations?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || proj.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  // Now matches the definition in columns.tsx (both arguments accepted)
  const columns = getColumns(organisations, users);

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
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
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