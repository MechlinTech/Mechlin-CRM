"use client"

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useRBAC } from '@/context/rbac-context'

export function RBACWatcher() {
    const pathname = usePathname()
    const { refreshRBAC } = useRBAC()
    const lastPathname = useRef(pathname)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        // Only refresh if pathname actually changed
        if (lastPathname.current !== pathname) {
            console.log('🔄 Route changed from', lastPathname.current, 'to', pathname)
            
            // Clear existing timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
            
            // Debounce the refresh call
            timeoutRef.current = setTimeout(() => {
                console.log('📡 Refreshing RBAC data...')
                refreshRBAC().then(() => {
                    console.log('✅ RBAC data refreshed for route:', pathname)
                })
            }, 300) // 300ms debounce
            
            lastPathname.current = pathname
        }
    }, [pathname, refreshRBAC])

    // This component doesn't render anything - it just watches for route changes
    return null
}
