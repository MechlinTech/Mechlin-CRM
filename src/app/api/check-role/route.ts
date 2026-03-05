import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const role = String(body?.role || "")

    if (!role) {
      return NextResponse.json(
        { hasRole: false, error: "Missing role in body" },
        { status: 400 }
      )
    }

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

    // 1) Must have authenticated user
    const { data: userRes, error: userErr } = await supabase.auth.getUser()
    const user = userRes?.user

    if (userErr || !user) {
      return NextResponse.json(
        { hasRole: false, error: "Not authenticated" },
        { status: 401 }
      )
    }

    // 2) Fetch role names (IMPORTANT: match roles.name, not display_name)
    const { data, error } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id)

    if (error) {
      return NextResponse.json(
        { hasRole: false, error: error.message },
        { status: 500 }
      )
    }

    const roleNames = (data || [])
      .map((r: any) => r?.roles?.name)
      .filter(Boolean)

    const hasRole = roleNames.includes(role)

    return NextResponse.json({ hasRole, roleNames })
  } catch (e: any) {
    console.error("❌ /api/check-role crashed:", e)
    return NextResponse.json(
      { hasRole: false, error: e?.message || "Unknown server error" },
      { status: 500 }
    )
  }
}
