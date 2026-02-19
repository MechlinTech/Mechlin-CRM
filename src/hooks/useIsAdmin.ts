"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./useAuth"
import { supabase } from "@/lib/supabase"

interface UseIsAdminReturn {
  isAdmin: boolean
  isSuperAdmin: boolean
  isAdminOnly: boolean // admin but not super_admin
  loading: boolean
}

/**
 * Hook to check if the current user has admin or super_admin role
 */
export function useIsAdmin(): UseIsAdminReturn {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function check() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const { data } = await supabase
          .from("user_roles")
          .select("roles(name)")
          .eq("user_id", user.id)

        const roles = data?.map((ur: any) => ur.roles?.name).filter(Boolean) || []
        
        setIsAdmin(roles.includes("admin"))
        setIsSuperAdmin(roles.includes("super_admin"))
      } catch (error) {
        console.error("Error checking user roles:", error)
      } finally {
        setLoading(false)
      }
    }

    check()
  }, [user])

  const isAdminOnly = isAdmin && !isSuperAdmin

  return { isAdmin, isSuperAdmin, isAdminOnly, loading }
}
