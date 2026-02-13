import { AddRoleButton } from "@/components/custom/roles/add-role-button"
import { getAllRolesAction } from "@/actions/rbac"
import { RolesTable } from "@/components/custom/roles/roles-table"

export default async function RolesPage() {
    const result = await getAllRolesAction()
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-zinc-50">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#006AFF] rounded-xl shadow-lg">
                                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-[#0F172A]">Role Based Permissions</h1>
                                <p className="text-xs text-[#0F172A]/60">Manage roles and access control</p>
                            </div>
                            <div className="bg-[#006AFF]/10 text-[#006AFF] border-[#006AFF]/20 font-semibold px-3 py-1 rounded-full text-xs">
                                {result.roles?.length || 0}
                            </div>
                        </div>
                        <AddRoleButton />
                    </div>

                    {/* Table Section */}
                    <div className="bg-white rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
                        <RolesTable roles={result.roles || []} />
                    </div>
                </div>
            </div>
        </div>
    )
}
