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
