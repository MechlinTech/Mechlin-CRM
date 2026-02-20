import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { getAllOrganisationsAction } from "@/actions/user-management"
import { useAdminWithInternalFalse } from "@/hooks/useAdminWithInternalFalse"
import { toast } from "sonner"

interface UseOrganisationDataProps {
  form: ReturnType<typeof useForm<any>>
  organisationField: string
}

export function useOrganisationData({ form, organisationField }: UseOrganisationDataProps) {
  const [organisations, setOrganisations] = useState<any[]>([])
  const [loadingOrgs, setLoadingOrgs] = useState(true)
  const [organisationName, setOrganisationName] = useState<string>("")
  const { isAdminWithInternalFalse, organisationId: userOrgId, loading: adminCheckLoading } = useAdminWithInternalFalse()

  // Fetch organization name for display
  async function fetchOrganisationName(orgId: string) {
    try {
      const { supabase } = await import("@/lib/supabase")
      const { data, error } = await supabase
        .from("organisations")
        .select("name")
        .eq("id", orgId)
        .single()
      
      if (data && !error) {
        setOrganisationName(data.name)
      }
    } catch (error) {
      console.error("Failed to fetch organisation name:", error)
    }
  }

  // Fetch all organisations
  async function fetchOrganisations() {
    try {
      const result = await getAllOrganisationsAction()
      if (result.success && result.organisations) {
        setOrganisations(result.organisations)
      }
    } catch (error) {
      console.error("Failed to fetch organisations:", error)
      toast.error("Failed to load organisations")
    } finally {
      setLoadingOrgs(false)
    }
  }

  useEffect(() => {
    if (adminCheckLoading) return
    
    if (isAdminWithInternalFalse && userOrgId) {
      form.setValue(organisationField, userOrgId)
      setLoadingOrgs(false)
      fetchOrganisationName(userOrgId)
      return
    }
    
    fetchOrganisations()
  }, [adminCheckLoading, isAdminWithInternalFalse, userOrgId, form, organisationField])

  return {
    organisations,
    loadingOrgs,
    organisationName,
    isAdminWithInternalFalse,
    userOrgId
  }
}
