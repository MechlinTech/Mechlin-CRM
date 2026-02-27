"use client"

import { useState, useEffect, useCallback } from "react"
import { usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"

export function useProjectHierarchy() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { userOrg, loading: orgLoading, canAccessProject } = useOrganization()
  const [projects, setProjects] = useState<any[]>([])
  const [hierarchyLoading, setHierarchyLoading] = useState(true)

  const isUsersDashboard = pathname === '/users-dashboard'
  const isProjectsPage = pathname.startsWith('/projects/') && pathname !== '/projects'

  const fetchUserProjects = useCallback(async () => {
    if (!user) return
    
    const { data, error } = await supabase
      .from('project_members')
      .select(`
        project_id,
        projects!inner (
          *,
          organisations (*)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
    } else {
      const projectData = data?.map(item => item.projects) || []
      setProjects(projectData)
    }
    setHierarchyLoading(false)
  }, [user])

  const fetchProjectHierarchy = useCallback(async () => {
    // Only fetch if user has organization info
    if (!userOrg) return
    
    const currentProjectId = pathname.match(/\/projects\/([a-f0-9-]+)/)?.[1]
    if (!currentProjectId) return
    
    // Check access before fetching
    const hasAccess = await canAccessProject(currentProjectId)
    
    if (!hasAccess) {
      setHierarchyLoading(false)
      return
    }
    
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        phases (
          id,
          name,
          milestones (
            id,
            name,
            sprints (
              id,
              name,
              status
            )
          )
        )
      `)
      .eq('id', currentProjectId)
      .single()
    
    if (error) {
      console.error(error)
      setProjects([])
    } else {
      // Double-check access after fetching
      if (data && userOrg) {
        const hasAccess = userOrg.organisations?.is_internal || 
          data.organisation_id === userOrg.organisation_id;
        
        if (hasAccess) {
          setProjects([data])
        } else {
          setProjects([])
        }
      } else {
        setProjects([data])
      }
    }
    setHierarchyLoading(false)
  }, [userOrg, pathname])

  useEffect(() => {
    setHierarchyLoading(true)
    
    if (isUsersDashboard) {
      fetchUserProjects()
    } else if (isProjectsPage) {
      fetchProjectHierarchy()
    } else {
      setHierarchyLoading(false)
    }
  }, [isUsersDashboard, isProjectsPage, fetchUserProjects, fetchProjectHierarchy])

  return {
    projects,
    hierarchyLoading,
    isUsersDashboard,
    isProjectsPage
  }
}
