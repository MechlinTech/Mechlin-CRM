'use client'
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
export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Function to sign in with Microsoft or Google
  async function signIn(provider: 'azure' | 'google') {
    const options: any = {
      scopes: 'email openid',
      redirectTo: window.location.origin,
    }

    // Add prompt parameter for Azure to force account selection
    if (provider === 'azure') {
      options.queryParams = {
        prompt: 'select_account'
      }
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: options,
    })
    if (error) {
      console.log("Error signing in with", provider, ":", error)
      toast.error(`Error signing in with ${provider}: ${error.message}`)
    }
  }

  // Function to sign in with email and password
  async function signInWithEmail(email: string, password: string) {
    setError(null)
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (error) {
      console.log("Error signing in with email and password:", error)
      setError(error.message || "Failed to sign in. Please check your credentials.")
      toast.error(`Error signing in with email and password: ${error.message}`)
      setLoading(false)
    } else {
      console.log("Successfully signed in with email and password:", data)
      setLoading(false)
      // Navigate with query parameter to trigger toast on success page
      router.push('/success?login=email')
    }
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
                <Button variant="outline" type="button" onClick={() => signIn('google')}>
                  Login with Google
                </Button>
                <Button variant="outline" type="button" onClick={() => signIn('azure')}>
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
