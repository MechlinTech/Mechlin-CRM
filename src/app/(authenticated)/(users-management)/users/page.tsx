import { AddUserButton } from "@/components/custom/users/add-user-button";
import { getAllUsersAction } from "@/actions/user-management";
import { UsersTable } from "@/components/custom/users/users-table";

export default async function Page() {
    const users = await getAllUsersAction()
    
    return (
        <div className="min-h-screen bg-[#F7F8FA] p-0">
            <div className="px-4 sm:px-6 lg:px-8 ">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section with Inline Button */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#4C5C96] rounded-xl shadow-lg">
                                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-heading-primary">All Users</h1>
                                <p className="text-xs text-secondary">Manage your team members and collaborators</p>
                            </div>
                            <div className="bg-[#0F172A]/10 text-heading-primary border-[#0F172A]/20 font-semibold px-3 py-1 rounded-full text-xs">
                                {users.users?.length || 0}
                            </div>
                        </div>
                        <AddUserButton />
                    </div>

                    {/* Enhanced Table Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <UsersTable users={users.users || []} />
                    </div>
                </div>
            </div>
        </div>
    );
}