'use client'
import { LoginForm } from "@/components/auth/login-form";
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { toast } from "sonner";

export default function Login() {
  // const navigate = useNavigate();
  const previousProviderRef = useRef<string | null>(null);

  // handle session changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        redirect('/success')
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        console.log("Session exists:", session)

        // Check if this is an OAuth login by checking the provider
        const provider = session.user?.app_metadata?.provider || session.user?.identities?.[0]?.provider;

        // Show success toast for OAuth logins (not email/password, which shows its own toast)
        if (provider && provider !== 'email' && previousProviderRef.current !== provider) {
          const providerName = provider === 'azure' ? 'Microsoft' : provider === 'google' ? 'Google' : provider;
          toast.success(`Successfully signed in with ${providerName}`);
          previousProviderRef.current = provider;
        }
        redirect('/organisations')
      } else if (event === 'SIGNED_OUT' || !session) {
        // User signed out, ensure we're on login page
        previousProviderRef.current = null;
        if (window.location.pathname !== '/') {
          redirect('/')
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="center-content">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}