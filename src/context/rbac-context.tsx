"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode,useRef } from 'react'
import { getUserPermissions } from '@/lib/permissions'
import { supabase } from '@/lib/supabase'

interface RBACData {
    roles: string[]
    permissions: string[]
    userId: string | null
}

interface RBACContextType {
    rbac: RBACData | null
    refreshRBAC: () => Promise<void>
    loading: boolean
    hasPermission: (name: string) => boolean // Added for your UI checks
}

const RBACContext = createContext<RBACContextType | null>(null)

export function RBACProvider({ children }: { children: ReactNode }) {
    const [rbac, setRBAC] = useState<RBACData | null>(null)
    const [loading, setLoading] = useState(true)
    const hasFetched = useRef(false) // Add this

    const refreshRBAC = useCallback(async () => {
        // Skip if already fetched (permissions don't change between tabs)
        if (hasFetched.current && rbac) {
            return
        }
        
        try {
            setLoading(true)
            const perms = await getUserPermissions()
            const { data: { user } } = await supabase.auth.getUser()
            
            setRBAC({
                roles: [],
                permissions: perms,
                userId: user?.id || null
            })
            hasFetched.current = true // Mark as fetched
        } catch (error) {
            console.error('❌ Error refreshing RBAC:', error)
        } finally {
            setLoading(false)
        }
    }, [rbac]) // Add rbac to deps

    useEffect(() => {
        refreshRBAC()
        // ... auth listener
    }, [refreshRBAC])

    // Helper logic for your components
    const hasPermission = (name: string) => rbac?.permissions.includes(name) || false

    return (
        <RBACContext.Provider value={{ rbac, refreshRBAC, loading, hasPermission }}>
            {children}
        </RBACContext.Provider>
    )
}

export function useRBAC() {
    const context = useContext(RBACContext)
    if (!context) {
        throw new Error('useRBAC must be used within an RBACProvider')
    }
    return context
}