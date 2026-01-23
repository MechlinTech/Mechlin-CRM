'use client'
import { cn } from "@/lib/utils";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  import {
    Field,
    FieldGroup,
    FieldLabel,
  } from "@/components/ui/field";
import { supabase } from "@/lib/supabase";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState } from "react";
import { toast } from "sonner";

export function UpdatePasswordForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        await updatePassword(newPassword)
        setNewPassword('')
        setLoading(false)
    }

    // Function to update password
    async function updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
    })
    if (error) {
        console.log("Error updating password:", error)
        setError(error.message)
    }
    else {
        console.log("Successfully updated password:", data)
        toast.success("Password updated successfully!")
    }
}
    return (
        <div className={cn("center-content", className)} {...props}>
            <div className="w-full max-w-sm">
            <Card>
                <CardHeader>
                    <CardTitle>Update Password</CardTitle>
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
                                <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
                                <Input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                            </Field>
                            <Field>
                                <Button type="submit" disabled={loading}>{loading ? "Updating password..." : "Update Password"}</Button>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
            </div>
        </div>
    )
}   