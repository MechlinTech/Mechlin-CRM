"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface UserOrganization {
  organisation_id: string
  organisations: {
    id: string
    name: string
    is_internal: boolean
  }
}

interface UseOrganizationReturn {
  userOrg: UserOrganization | null
  loading: boolean
  isInternal: boolean
  canAccessProject: (projectId: string) => Promise<boolean>
  refresh: () => Promise<void>
}

/**
 * Hook to get user's organization info and check project access
 */
export function useOrganization(): UseOrganizationReturn {
  const [userOrg, setUserOrg] = useState<UserOrganization | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchOrganization = async () => {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUserOrg(null)
        return
      }

      const { data, error } = await supabase
        .from("users")
        .select(`
          organisation_id,
          organisations(*)
        `)
        .eq("id", user.id)
        .single()

      if (error) {
        console.error("Error fetching organization:", error)
        setUserOrg(null)
        return
      }

      setUserOrg(data as unknown as UserOrganization)
    } catch (error) {
      console.error("Error in fetchOrganization:", error)
      setUserOrg(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganization()
  }, [])

  const canAccessProject = async (projectId: string): Promise<boolean> => {
    if (!userOrg) return false

    // Internal users can access all projects
    if (userOrg.organisations?.is_internal) {
      return true
    }

    // Get project's organization
    const { data: projectData, error } = await supabase
      .from("projects")
      .select("organisation_id")
      .eq("id", projectId)
      .single()

    if (error || !projectData) {
      return false
    }

    // External users can only access projects from their own organization
    return userOrg.organisation_id === projectData.organisation_id
  }

  const isInternal = userOrg?.organisations?.is_internal || false

  return {
    userOrg,
    loading,
    isInternal,
    canAccessProject,
    refresh: fetchOrganization,
  }
}
