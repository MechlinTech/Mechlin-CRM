import { getAuthenticatedUser } from "@/lib/rbac"
import { cookies } from 'next/headers'

export async function GET() {
    console.log('\n🎯 /api/me/auth-status endpoint called 🎯')
    console.log('📍 Request received at:', new Date().toISOString())
    
    try {
        // Debug: Check what cookies we have
        const cookieStore = await cookies()
        const allCookies = cookieStore.getAll()
        console.log('🍪 Available cookies:', allCookies.map(c => ({ name: c.name, hasValue: !!c.value })))
        
        // Look for Supabase auth cookies
        const authCookie = allCookies.find(c => c.name.includes('supabase') || c.name.includes('auth'))
        console.log('🔑 Auth cookie found:', authCookie ? authCookie.name : 'NONE')
        
        const authStatus = await getAuthenticatedUser()
        console.log('📤 Returning auth status:', authStatus)
        console.log('✅ API call completed\n')
        
        return Response.json(authStatus)
    } catch (error) {
        console.error('❌ Error in /api/me/auth-status:', error)
        console.log('❌ API call failed\n')
        
        return Response.json(
            { 
                isAuthenticated: false,
                user: null,
                error: 'Internal server error' 
            },
            { status: 500 }
        )
    }
}
