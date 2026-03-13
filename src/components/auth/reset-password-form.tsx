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
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + "/update-password",
        })
        
        if (error) {
            console.error("Error resetting password:", error)
            toast.error(`Error: ${error.message}`)
            return false // Indicate failure
        }
        
        return true // Indicate success
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        
        // 1. Basic Validation check
        if (!email || email.trim() === "") {
            toast.error("Please enter your email address.")
            return
        }

        setLoading(true)
        
        // 2. Only show success if the Supabase call actually works
        const success = await resetPassword(email)
        
        if (success) {
            toast.success("Open the link sent to your email to reset your password!")
            setEmail('')
        }
        
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
                                    {/* Added 'required' attribute for browser-level validation */}
                                    <Input 
                                        id="email"
                                        type="email" 
                                        placeholder="Email" 
                                        value={email} 
                                        onChange={(e) => setEmail(e.target.value)} 
                                        required 
                                        disabled={loading}
                                    />
                                </Field>
                                <Field>
                                    <Button type="submit" disabled={loading}>
                                        {loading ? "Sending reset email..." : "Reset Password"}
                                    </Button>
                                </Field>
                            </FieldGroup>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}