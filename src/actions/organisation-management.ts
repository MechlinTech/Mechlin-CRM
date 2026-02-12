"use server"

import { supabase } from "@/lib/supabase"

export async function getOrganisationById(id: string) {
  const { data, error } = await supabase
    .from('organisations')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching organisation:', error)
    return null
  }

  return data
}

export async function getOrganisationProjects(organisationId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('organisation_id', organisationId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects:', error)
    return []
  }

  return data || []
}

export async function getOrganisationsWithProjectCounts() {
  const { data, error } = await supabase
    .from('organisations')
    .select(`
      *,
      projects!inner (
        id
      )
    `)

  if (error) {
    console.error('Error fetching organisations with project counts:', error)
    return []
  }

  // Count projects for each organization
  const orgsWithCounts = data.reduce((acc: any[], org: any) => {
    const existingOrg = acc.find((item: any) => item.id === org.id)
    if (existingOrg) {
      existingOrg.project_count = (existingOrg.project_count || 0) + 1
    } else {
      acc.push({
        ...org,
        project_count: 1
      })
    }
    return acc
  }, [])

  return orgsWithCounts
}
