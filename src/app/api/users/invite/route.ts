import { NextRequest } from 'next/server'
import { adminAuthClient, supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthenticatedUser } from '@/lib/rbac'

interface InviteUserBody {
    email: string
    organisationId: string
}

export async function POST(request: NextRequest) {
    console.log('\n🎯 /api/users/invite endpoint called 🎯')
    
    try {
        // Check if user is authenticated
        const authStatus = await getAuthenticatedUser()
        
        if (!authStatus.isAuthenticated || !authStatus.user) {
            return Response.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const userId = authStatus.user.id
        const body: InviteUserBody = await request.json()
        const { email, organisationId } = body

        // Validate input
        if (!email || !organisationId) {
            return Response.json(
                { error: 'Email and organisation ID are required' },
                { status: 400 }
            )
        }

        // Check if user already exists
        const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', email)
            .single()

        if (existingUser) {
            return Response.json(
                { error: 'User with this email already exists' },
                { status: 400 }
            )
        }

        // Check if invite already exists and is pending
        const { data: existingInvite } = await supabaseAdmin
            .from('user_invites')
            .select('id, status')
            .eq('email', email)
            .single()

        if (existingInvite && existingInvite.status === 'pending') {
            return Response.json(
                { error: 'An invitation has already been sent to this email' },
                { status: 400 }
            )
        }

        // Send invite via Supabase Auth
        const { data: inviteData, error: inviteError } = await adminAuthClient.inviteUserByEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
        })

        if (inviteError) {
            console.error('❌ Error sending invite:', inviteError)
            return Response.json(
                { error: `Failed to send invite: ${inviteError.message}` },
                { status: 500 }
            )
        }

        // Store invite in database
        const { data: inviteRecord, error: dbError } = await supabaseAdmin
            .from('user_invites')
            .insert({
                email,
                organisation_id: organisationId,
                invited_by: userId,
                status: 'pending',
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            })
            .select()
            .single()

        if (dbError) {
            console.error('❌ Error storing invite:', dbError)
            return Response.json(
                { error: 'Failed to store invite record' },
                { status: 500 }
            )
        }

        console.log('✅ Invite sent successfully to:', email)

        return Response.json({
            success: true,
            message: 'Invitation sent successfully',
            invite: {
                id: inviteRecord.id,
                email: inviteRecord.email,
                status: inviteRecord.status,
                invitedAt: inviteRecord.invited_at,
                expiresAt: inviteRecord.expires_at,
            }
        })

    } catch (error) {
        console.error('❌ Error in /api/users/invite:', error)
        return Response.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// GET endpoint to fetch all pending invites
export async function GET() {
    console.log('\n🎯 /api/users/invite GET endpoint called 🎯')
    
    try {
        // Check if user is authenticated
        const authStatus = await getAuthenticatedUser()
        
        if (!authStatus.isAuthenticated || !authStatus.user) {
            return Response.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Fetch all pending invites
        const { data: invites, error } = await supabaseAdmin
            .from('user_invites')
            .select(`
                *,
                organisation:organisations(name),
                inviter:users!user_invites_invited_by_fkey(name, email)
            `)
            .order('invited_at', { ascending: false })

        if (error) {
            console.error('❌ Error fetching invites:', error)
            return Response.json(
                { error: 'Failed to fetch invites' },
                { status: 500 }
            )
        }

        return Response.json({
            success: true,
            invites
        })

    } catch (error) {
        console.error('❌ Error in /api/users/invite GET:', error)
        return Response.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
