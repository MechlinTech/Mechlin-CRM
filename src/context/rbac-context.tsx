"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

interface RBACData {
    roles: string[]
    permissions: string[]
    userId: string | null
}

interface RBACContextType {
    rbac: RBACData | null
    refreshRBAC: () => Promise<void>
    loading: boolean
}

const RBACContext = createContext<RBACContextType | null>(null)

export function RBACProvider({ children }: { children: ReactNode }) {
    const [rbac, setRBAC] = useState<RBACData | null>(null)
    const [loading, setLoading] = useState(true)

    const refreshRBAC = useCallback(async () => {
        try {
            setLoading(true)
            console.log('🌐 Calling /api/me/rbac endpoint...')
            const response = await fetch('/api/me/rbac')
            if (response.ok) {
                const data = await response.json()
                console.log('📦 RBAC data received:', data)
                setRBAC(data)
            } else {
                console.error('❌ Failed to fetch RBAC data:', response.statusText)
            }
        } catch (error) {
            console.error('❌ Error refreshing RBAC:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    // Initial load
    useEffect(() => {
        refreshRBAC()
    }, [])

    return (
        <RBACContext.Provider value={{ rbac, refreshRBAC, loading }}>
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
