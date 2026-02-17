import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

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

    // Fetch roles
    const { data, error } = await supabase
      .from("roles")
      .select("id, name, display_name, description, is_system_role, is_active")
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
