'use client'
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
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { useState } from "react"
import { redirect } from "next/navigation"
import { BrandedHeader } from "./branded-header"
import { cn } from "@/lib/utils"

export function SignupForm({ className, ...props }: React.ComponentProps<typeof Card>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // ✅ New: Password validation logic
  const validatePassword = (pass: string) => {
    const hasUppercase = /[A-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    const isLongEnough = pass.length >= 6;

    if (!isLongEnough) return "Password must be at least 6 characters long.";
    if (!hasUppercase) return "Password must include at least one uppercase letter.";
    if (!hasNumber) return "Password must include at least one number.";
    if (!hasSpecialChar) return "Password must include at least one special character.";
    
    return null; // No errors
  }

  async function signUp(email: string, password: string) {
    setError(null)
    setLoading(true)
    
    const {data, error} = await supabase.auth.signUp({
      email: email,
      password: password,
    })
    
    if (error) {
      console.log("Error signing up:", error)
      const errorMessage = error.message || "Failed to create account. Please try again."
      setError(errorMessage)
      toast.error(errorMessage)
      setLoading(false)
    } else {
      console.log("Successfully signed up:", data)
      toast.success("Account created successfully!")
      redirect('/')
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // ✅ Added client-side validation check
    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    await signUp(email, password)
  }

  return (
    <Card className={cn("w-[520px]", className)} {...props}>
      <CardHeader>
        <BrandedHeader />
        <CardTitle className="text-center">Create an account</CardTitle>
        <CardDescription className="text-center">
          Enter your information below to create your account
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
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password} 
                onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null); // Clear error while user types
                }}
                disabled={loading}
              />
              <FieldDescription>
                Must be at least 6 characters, including at least one uppercase letter, one number, and one special character.
              </FieldDescription>
            </Field>
            <FieldGroup>
              <Field>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
                <FieldDescription className="px-6 text-center">
                  Already have an account? <a href="/">Sign in</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}