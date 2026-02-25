"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface CachedPermission {
  value: boolean
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class PermissionCache {
  private cache = new Map<string, CachedPermission>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 

  set(key: string, value: boolean, ttl: number = this.DEFAULT_TTL) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    })
  }

  get(key: string): boolean | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > cached.ttl
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return cached.value
  }

  clear() {
    this.cache.clear()
  }

  // Clear expired entries
  cleanup() {
    const now = Date.now()
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

const permissionCache = new PermissionCache()

// Cleanup expired cache entries every minute
setInterval(() => permissionCache.cleanup(), 60 * 1000)

/**
 * Cached version of hasPermission function
 */
export async function hasPermissionCached(permissionName: string): Promise<boolean> {
  const cacheKey = `permission:${permissionName}`
  
  // Check cache first
  const cached = permissionCache.get(cacheKey)
  if (cached !== null) {
    return cached
  }

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      permissionCache.set(cacheKey, false)
      return false
    }
    
    // Get user's permissions with optimized query
    const { data, error } = await supabase
      .from("user_roles")
      .select(`
        roles(
          role_permissions(
            permissions(name)
          )
        )
      `)
      .eq("user_id", user.id)
    
    if (error) {
      permissionCache.set(cacheKey, false)
      return false
    }
    
    // Check if permission exists in any of user's roles
    const hasPermission = data?.some((userRole: any) => 
      userRole.roles?.role_permissions?.some((rp: any) => 
        rp.permissions?.name === permissionName
      )
    ) || false
    
    // Cache the result
    permissionCache.set(cacheKey, hasPermission)
    return hasPermission
  } catch (error) {
    console.error("Error checking permission:", error)
    permissionCache.set(cacheKey, false)
    return false
  }
}

/**
 * Cached version of hasRole function
 */
export async function hasRoleCached(roleName: string): Promise<boolean> {
  const cacheKey = `role:${roleName}`
  
  // Check cache first
  const cached = permissionCache.get(cacheKey)
  if (cached !== null) {
    return cached
  }

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      permissionCache.set(cacheKey, false)
      return false
    }
    
    const { data, error } = await supabase
      .from("user_roles")
      .select(`
        roles(name)
      `)
      .eq("user_id", user.id)
    
    if (error) {
      permissionCache.set(cacheKey, false)
      return false
    }
    
    const hasRole = data?.some((ur: any) => ur.roles?.name === roleName) || false
    
    // Cache the result
    permissionCache.set(cacheKey, hasRole)
    return hasRole
  } catch (error) {
    console.error("Error checking role:", error)
    permissionCache.set(cacheKey, false)
    return false
  }
}

/**
 * Cached version of isInternalUser function
 */
export async function isInternalUserCached(): Promise<boolean> {
  const cacheKey = 'internal_user'
  
  // Check cache first
  const cached = permissionCache.get(cacheKey)
  if (cached !== null) {
    return cached
  }

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      permissionCache.set(cacheKey, false)
      return false
    }
    
    const { data, error } = await supabase
      .from("users")
      .select(`
        organisations(is_internal)
      `)
      .eq("id", user.id)
      .single()
    
    if (error) {
      permissionCache.set(cacheKey, false)
      return false
    }
    
    const isInternal = (data as any)?.organisations?.is_internal || false
    
    // Cache the result
    permissionCache.set(cacheKey, isInternal)
    return isInternal
  } catch (error) {
    console.error("Error checking internal user:", error)
    permissionCache.set(cacheKey, false)
    return false
  }
}

/**
 * Check if user is admin (cached version)
 */
export async function isAdminCached(): Promise<boolean> {
  const cacheKey = 'admin_role'
  
  // Check cache first
  const cached = permissionCache.get(cacheKey)
  if (cached !== null) {
    return cached
  }

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      permissionCache.set(cacheKey, false)
      return false
    }
    
    const { data, error } = await supabase
      .from("user_roles")
      .select(`
        roles(name)
      `)
      .eq("user_id", user.id)
    
    if (error) {
      permissionCache.set(cacheKey, false)
      return false
    }
    
    const isAdmin = data?.some((ur: any) => 
      ur.roles?.name === 'admin' || ur.roles?.name === 'super_admin'
    ) || false
    
    // Cache the result
    permissionCache.set(cacheKey, isAdmin)
    return isAdmin
  } catch (error) {
    console.error("Error checking admin role:", error)
    permissionCache.set(cacheKey, false)
    return false
  }
}

/**
 * Clear permission cache (useful after role changes)
 */
export function clearPermissionCache() {
  permissionCache.clear()
}
