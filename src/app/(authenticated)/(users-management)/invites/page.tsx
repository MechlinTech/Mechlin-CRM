import { InvitesTable } from "@/components/custom/invites/invites-table"
import { getServerUserPermissions } from "@/lib/rbac-middleware" // RBAC Server Utility
import { redirect } from "next/navigation"

export default async function InvitesPage() {
    // 1. RBAC CHECK: Verify permission on the server side
    const permissions = await getServerUserPermissions();
    
    // Track and manage invitations requires the ability to create/manage users
    const canManageInvites = permissions.includes('users.create');

    // 2. RESTRICTION: If user lacks permission, prevent access
    if (!canManageInvites) {
        redirect('/unauthorized');
    }

    // 3. UI: Remains 100% exactly as you setup
    return (
        <div className="p-0">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#006AFF] rounded-xl shadow-lg">
                                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-heading-primary">User Invitations</h1>
                                <p className="text-xs text-[#6C7F93]">Track and manage pending user invitations</p>
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <InvitesTable />
                    </div>
                </div>
            </div>
        </div>
    )
}