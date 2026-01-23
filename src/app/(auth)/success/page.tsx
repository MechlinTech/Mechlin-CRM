'use client'
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
    const searchParams = useSearchParams();

    // Show toast after redirect if coming from email/password login
    useEffect(() => {
        const loginMethod = searchParams.get('login');
        if (loginMethod === 'email') {
            toast.success("Successfully signed in with email and password");
        }
    }, [searchParams]);

    async function signOut() {
        const {error} = await supabase.auth.signOut({scope: 'local'});
        if (error) {
            console.log("Error signing out:",error)
            toast.error(`Error signing out: ${error.message}`)
        }
        else {
            toast.success("Successfully signed out");
            redirect('/');
        }
    }
    return (
        <>
            <div className="page-layout">
                <div className="max-w-md w-full text-center space-y-4">
                    <h2>Successfully signed in with your account</h2>
                    <Button onClick={signOut}>Sign Out</Button>
                </div>
            </div>
        </>
    )
}