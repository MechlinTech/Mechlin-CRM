"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./useAuth"
import { supabase } from "@/lib/supabase"

interface UseAdminWithInternalFalseReturn {
  isAdminWithInternalFalse: boolean
  organisationId: string | null
  loading: boolean
}

/**
 * Hook to check if the current user is admin with is_internal === false.
 * Used to restrict UI (hide org selector, org filter) for external admins.
 */
export function useAdminWithInternalFalse(): UseAdminWithInternalFalseReturn {
  const { user } = useAuth()
  const [isAdminWithInternalFalse, setIsAdminWithInternalFalse] = useState(false)
  const [organisationId, setOrganisationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function check() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const [rolesResult, userDataResult] = await Promise.all([
          supabase
            .from("user_roles")
            .select("roles(name)")
            .eq("user_id", user.id),
          supabase
            .from("users")
            .select("organisation_id, organisations(is_internal)")
            .eq("id", user.id)
            .single(),
        ])

        const roles = rolesResult.data?.map((ur: any) => ur.roles?.name).filter(Boolean) || []
        const isAdmin = roles.includes("admin")
        const isInternal = (userDataResult.data as any)?.organisations?.is_internal || false
        const orgId = userDataResult.data?.organisation_id || null

        setIsAdminWithInternalFalse(isAdmin && !isInternal)
        setOrganisationId(orgId)
      } catch (error) {
        console.error("Error checking admin/internal status:", error)
      } finally {
        setLoading(false)
      }
    }

    check()
  }, [user])

  return { isAdminWithInternalFalse, organisationId, loading }
}
