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

    // Basic email validation regex
    const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    async function resetPassword(email: string) {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + "/update-password",
        })
        if (error) {
            console.log("Error resetting password:", error)
            toast.error(`Error resetting password: ${error.message}`)
            return false; // Indicate failure
        }
        else {
            console.log("Successfully reset password:", data)
            return true; // Indicate success
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        
        // 1. Check if empty
        if (!email.trim()) {
            return toast.error("Please enter your email address first.");
        }

        // 2. Validate format
        if (!isValidEmail(email)) {
            return toast.error("Please enter a valid email address.");
        }

        setLoading(true)
        const success = await resetPassword(email)
        
        if (success) {
            setEmail('')
            toast.success("Open the link sent to your email to reset your password!")
        }
        
        setLoading(false)
    }

    // Disable button if input is empty or loading
    const isButtonDisabled = loading || email.length === 0;

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
                    <Input 
                        id="email"
                        type="email" 
                        placeholder="example@domain.com" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required // Browser-level backup validation
                    />
                </Field>
                <Field>
                    <Button 
                        type="submit" 
                        disabled={isButtonDisabled}
                        className="w-full"
                    >
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