import { AddOrganisationButton } from "@/components/custom/organisations/add-organisation-button";
import { getAllOrganisationsAction } from "@/actions/user-management";
import { OrganisationsTable } from "../../../../components/custom/organisations/organisations-table";
import { getServerUserPermissions } from "@/lib/rbac-middleware";
import { redirect } from "next/navigation";

export default async function Page() {
    const organisations = await getAllOrganisationsAction()
    
    // RBAC: Fetch permissions on server
    const permissions = await getServerUserPermissions();
    console.log("Current User Permissions:", permissions);
const canCreate = permissions.includes('organisations.create');
    const canRead = permissions.includes('organisations.read');
    const canUpdate = permissions.includes('organisations.update');
    const canDelete = permissions.includes('organisations.delete');

    // FIX: User has 'organisations.read', so this condition will now be FALSE.
    // They will NOT be redirected.
    if (!canRead && !canCreate && !canUpdate && !canDelete) {
        redirect('/unauthorized');
    }
    return (
        <div className="min-h-screen ">
            <div className="px-4 sm:px-6 lg:px-8 ">
                <div className="max-w-7xl mx-auto ">
                    {/* Header Section with Inline Button */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#006AFF] rounded-xl shadow-lg">
                                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-[#0F172A]">All Organisations</h1>
                                <p className="text-xs text-[#0F172A]/60">Manage your organization portfolios</p>
                            </div>
                            <div className="bg-[#006AFF]/10 text-[#0F172A] border-[#0F172A]/20 font-semibold px-3 py-1 rounded-full text-xs">
                                {organisations.organisations?.length || 0}
                            </div>
                        </div>
                        
                        {/* RBAC: Only show Add button if user has organisations.create permission */}
                        {canCreate && <AddOrganisationButton />}
                    </div>

                    {/* Enhanced Table Section */}
                    <div className="bg-white rounded-2xl   overflow-hidden p-2 ">
                        <OrganisationsTable organisations={organisations.organisations || []} />
                    </div>
                </div>
            </div>
        </div>
    );
}