import { getAllUsersAction } from "@/actions/user-management"
import { UserPermissionsTable } from "@/components/custom/user-permissions/user-permissions-table"

export default async function UserPermissionsPage() {
    const result = await getAllUsersAction()
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-zinc-50">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-[#006AFF] rounded">
                            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-[#0F172A]">User Permissions</h1>
                            <p className="text-xs text-[#0F172A]/60">Manage direct user permissions</p>
                        </div>
                        <div className="bg-[#0F172A]/10 text-[#0F172A] border-[#0F172A]/20 font-semibold px-3 py-1 rounded-full text-xs">
                            {result.users?.length || 0}
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="bg-white rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
                        <UserPermissionsTable users={result.users || []} />
                    </div>
                </div>
            </div>
        </div>
    )
}
