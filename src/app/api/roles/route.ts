import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET() {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: "", ...options })
          },
        },
      }
    )

    // Optional: require auth (recommended)
    const { data: userRes } = await supabase.auth.getUser()
    if (!userRes?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const userId = userRes.user.id

    // Get current user's organization with is_internal flag
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select(`
        organisation_id,
        organisation:organisations(is_internal)
      `)
      .eq('id', userId)
      .single()

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const isInternalOrg = (currentUser.organisation as any)?.is_internal || false

    // Fetch roles: all roles for internal orgs, org-specific for non-internal
    let query = supabaseAdmin
      .from("roles")
      .select("id, name, display_name, description, is_system_role, is_active")

    // Apply organization filter only for non-internal organizations
    if (!isInternalOrg) {
      query = query.eq('organisation_id', currentUser.organisation_id)
    }

    const { data, error } = await query
      .order("display_name", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ roles: data || [] })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500 }
    )
  }
}
