"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface User {
    id: string
    email?: string
    name?: string
    avatar_url?: string
}

interface UseAuthReturn {
    user: User | null
    loading: boolean
    error: string | null
}

export function useAuth(): UseAuthReturn {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Get initial user
        const getUser = async () => {
            try {
                const { data: { user }, error } = await supabase.auth.getUser()
                
                if (error) {
                    setError(error.message)
                    window.location.href = '/'
                    return
                }
                
                setUser(user)
            } catch (err) {
                    setError((err as Error).message)
                    window.location.href = '/'
                } finally {
                    setLoading(false)
                }
        }

        getUser()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser(session.user)
                setError(null)
            } else {
                setUser(null)
                setError(null)
                window.location.href = '/'
            }
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    return { user, loading, error }
}
