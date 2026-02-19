"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type CheckRoleResponse = {
  hasRole: boolean
  roleNames?: string[]
  error?: string
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function signIn(provider: "azure" | "google") {
    const options: any = {
      scopes: "email openid",
      redirectTo: window.location.origin,
    }

    if (provider === "azure") {
      options.queryParams = { prompt: "select_account" }
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options,
    })

    if (error) {
      console.log("Error signing in with", provider, ":", error)
      toast.error(`Error signing in with ${provider}: ${error.message}`)
    }
  }

  // ✅ Helper: call server once and read role list
  async function getMyRoleNames(): Promise<string[]> {
    try {
      const res = await fetch("/api/check-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // send empty role to get roleNames back, OR send a dummy role and read roleNames
        body: JSON.stringify({ role: "__list__" }),
        cache: "no-store",
      })  

      const data: CheckRoleResponse = await res.json().catch(() => ({ hasRole: false }))

      // If API failed, return empty
      if (!res.ok) {
        console.error("[check-role] failed", data)
        return []
      }

      return Array.isArray(data.roleNames) ? data.roleNames : []
    } catch (e) {
      console.error("[check-role] error", e)
      return []
    }
  }

  async function signInWithEmail(email: string, password: string) {
    setError(null)
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message || "Failed to sign in. Please check your credentials.")
      toast.error(`Login failed: ${error.message}`)
      setLoading(false)
      return
    }

    console.log("Successfully signed in:", data)

    // ✅ Read internal role names from DB via API
    const roleNames = await getMyRoleNames()
    // if(roleNames.length===0){
    //   router.replace("/users-dashboard")
    //   return
    // }
    console.log("Role names:", roleNames)

    // ✅ IMPORTANT: match INTERNAL names from DB
    const isAdmin = roleNames.includes("admin")
    const isSuperAdmin = roleNames.includes("super_admin")

    setLoading(false)

    if (isAdmin || isSuperAdmin) {
      router.replace("/dashboard")
      return
    }

    router.replace("/users-dashboard")
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await signInWithEmail(email, password)
  }

  return (
    <div className={cn("", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {error && (
                <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </Field>

              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="/reset-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </Field>

              <Field>
                <Button type="submit" disabled={loading}>
                  {loading ? "Signing in..." : "Login"}
                </Button>

                <FieldSeparator className="my-2">Or continue with</FieldSeparator>

                <Button variant="outline" type="button" onClick={() => signIn("google")}>
                  Login with Google
                </Button>

                <Button variant="outline" type="button" onClick={() => signIn("azure")}>
                  Login with Microsoft
                </Button>

                <FieldDescription className="text-center">
                  Don&apos;t have an account? <Link href="/signup">Sign up</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
