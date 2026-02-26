import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthenticatedUser } from '@/lib/rbac'
import { sendInvitationEmail } from '@/lib/email-service'

interface InviteUserBody {
    email: string
    organisationId: string
}

export async function POST(request: NextRequest) {
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

        // Generate a simple invitation URL without Azure AD
        const inviteRedeemUrl = 'https://devcrm.mechlintech.com/'

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
            .select(`
                *,
                organisation:organisations(name)
            `)
            .single()

        if (dbError) {
            return Response.json(
                { error: 'Failed to store invite record' },
                { status: 500 }
            )
        }

        // Fetch inviter details separately
        const { data: inviter } = await supabaseAdmin
            .from('users')
            .select('name, email')
            .eq('id', userId)
            .single()

        // Send custom email invitation
        try {
            await sendInvitationEmail({
                to: email,
                inviterName: inviter?.name || 'Administrator',
                organisationName: inviteRecord.organisation?.name || 'MechlinTech',
                inviteRedeemUrl: inviteRedeemUrl,
                expiresAt: inviteRecord.expires_at,
            })
        } catch (emailError) {
        }

        return Response.json({
            success: true,
            message: 'Invitation sent successfully via custom email',
            invite: {
                id: inviteRecord.id,
                email: inviteRecord.email,
                status: inviteRecord.status,
                invitedAt: inviteRecord.invited_at,
                expiresAt: inviteRecord.expires_at,
                inviteRedeemUrl: inviteRedeemUrl,
            }
        })

    } catch (error) {
        return Response.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// GET endpoint to fetch all pending invites
export async function GET() {
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

        // Get current user's organization with is_internal flag
        const { data: currentUser } = await supabaseAdmin
            .from('users')
            .select(`
                organisation_id,
                organisation:organisations(is_internal)
            `)
            .eq('id', userId)
            .single()

        if (!currentUser) {
            return Response.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        const isInternalOrg = (currentUser.organisation as any)?.is_internal || false

        // Fetch invites: all invites for internal orgs, org-specific for non-internal
        let query = supabaseAdmin
            .from('user_invites')
            .select(`
                *,
                organisation:organisations(name)
            `)

        // Apply organization filter only for non-internal organizations
        if (!isInternalOrg) {
            query = query.eq('organisation_id', currentUser.organisation_id)
        }

        const { data: invites, error } = await query
            .order('invited_at', { ascending: false })

        if (error) {
            return Response.json(
                { error: 'Failed to fetch invites' },
                { status: 500 }
            )
        }

        // Fetch inviter details for each invite
        const invitesWithInviters = await Promise.all(
            invites.map(async (invite) => {
                const { data: inviter } = await supabaseAdmin
                    .from('users')
                    .select('name, email')
                    .eq('id', invite.invited_by)
                    .single()
                
                return {
                    ...invite,
                    inviter: inviter || { name: 'Administrator', email: null }
                }
            })
        )
        return Response.json({
            success: true,
            invites: invitesWithInviters
        })

    } catch (error) {
        return Response.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
