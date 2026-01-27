'use client'
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Field,
    FieldGroup,
    FieldLabel,
  } from "@/components/ui/field"
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ResetPasswordForm({
    className,
    ...props
}: React.ComponentProps<"div">) {

    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)

    // Function to reset password (send reset email)
    async function resetPassword(email: string) {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + "/update-password",
        })
        if (error) {
            console.log("Error resetting password:", error)
            toast.error(`Error resetting password: ${error.message}`)
        }
        else {
            console.log("Successfully reset password:", data)
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        await resetPassword(email)
        setEmail('')
        toast.success("Open the link sent to your email to reset your password!")
        setLoading(false)
    }

  return (
    <div className={cn("center-content", className)} {...props}>
        <div className="w-full max-w-md">
        <Card>
        <CardHeader>
            <CardTitle>Reset Password</CardTitle>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit}>
            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <Field>
                    <Button type="submit" disabled={loading}>{loading ? "Sending reset email..." : "Reset Password"}</Button>
                </Field>
            </FieldGroup>
            </form>
        </CardContent>
        </Card>
        </div>
    </div>
  )
}