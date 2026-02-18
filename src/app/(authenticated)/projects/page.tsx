import { supabase } from "@/lib/supabase"
import { ProjectsTable } from "@/components/custom/projects/projects-table"
import { AddProjectButton } from "@/components/custom/projects/add-project-button"
import { redirect } from "next/navigation";
import { getServerUserPermissions } from "@/lib/rbac-middleware";

export default async function ProjectsPage() {
      const permissions = await getServerUserPermissions();
        
        // Check if user has permission to read user information
        if (!permissions.includes('projects.create')) {
            redirect('/unauthorized');
        }
    const { data: projects } = await supabase
        .from("projects")
        .select(`*, organisations(name), project_members(user_id)`)
        .order('created_at', { ascending: false });

    const { data: organisations } = await supabase
        .from("organisations")
        .select("id, name");

    // Fetch users where the organization name is 'Mechlin'
    // This removes the need for a hardcoded UUID [cite: 9]
    const { data: users } = await supabase
        .from("users")
        .select(`id, name, organisations!inner(name)`)
        .eq('organisations.name', 'Mechlin')
        .eq('status', 'active');

    return (
        <div className="p-0">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section with Inline Button */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#006AFF] rounded-xl shadow-lg">
                                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-heading-primary">All Projects</h1>
                                <p className="text-xs text-[#0F172A]/60">Manage your project portfolio</p>
                            </div>
                            <div className="bg-[#006AFF]/10 text-heading-primary border-[#006AFF]/20 font-semibold px-3 py-1 rounded-full text-xs">
                                {projects?.length || 0}
                            </div>
                        </div>
                        <AddProjectButton 
                            organisations={organisations || []} 
                            users={users || []} 
                        />
                    </div>

                    {/* Enhanced Table Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-2">
                        <ProjectsTable 
                            projects={projects || []} 
                            organisations={organisations || []}
                            users={users || []}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}