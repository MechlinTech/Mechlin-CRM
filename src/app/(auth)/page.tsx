"use client"

import { LoginForm } from "@/components/auth/login-form"
import { useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function Login() {
  const router = useRouter()
  const previousProviderRef = useRef<string | null>(null)

  async function routeByRole(userId: string) {
    // ✅ correct table: user_roles
    const { data, error } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", userId)

    if (error) {
      console.error("routeByRole role fetch error:", error.message)
      router.replace("/users-dashboard")
      return
    }

    const roleNames = (data || [])
      .map((x: any) => x?.roles?.name)
      .filter(Boolean)

    const isAdmin = roleNames.includes("admin") || roleNames.includes("super_admin")

    router.replace(isAdmin ? "/dashboard" : "/users-dashboard")
  }

  useEffect(() => {
    // If session already exists, route immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        routeByRole(session.user.id)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user?.id) {
        const provider =
          session.user?.app_metadata?.provider ||
          session.user?.identities?.[0]?.provider

        if (provider && provider !== "email" && previousProviderRef.current !== provider) {
          const providerName =
            provider === "azure" ? "Microsoft" : provider === "google" ? "Google" : provider
          toast.success(`Successfully signed in with ${providerName}`)
          previousProviderRef.current = provider
        }

        routeByRole(session.user.id)
      }

      if (event === "SIGNED_OUT" || !session) {
        previousProviderRef.current = null
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  return (
    <div className="center-content">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}
