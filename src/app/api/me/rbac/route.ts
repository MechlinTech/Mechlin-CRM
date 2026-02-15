import { getUserRBAC } from "@/lib/rbac"

export async function GET() {
    console.log('\n🎯🎯🎯 /api/me/rbac endpoint called 🎯🎯🎯')
    console.log('📍 Request received at:', new Date().toISOString())
    
    try {
        console.log('⏳ Calling getUserRBAC()...')
        const rbacData = await getUserRBAC()
        // console.log('📤📤📤 Returning RBAC data:', rbacData)
        console.log('✅ API call completed successfully\n')
        return Response.json(rbacData)
    } catch (error) {
        console.error('❌❌❌ Error in /api/me/rbac:', error)
        console.log('❌ API call failed\n')
        return Response.json(
            { error: 'Failed to fetch RBAC data' },
            { status: 500 }
        )
    }
}
