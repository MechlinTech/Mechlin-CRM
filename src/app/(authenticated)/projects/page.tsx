import { supabase } from "@/lib/supabase"
import { ProjectsTable } from "@/components/custom/projects/projects-table"
import { AddProjectButton } from "@/components/custom/projects/add-project-button"

export default async function ProjectsPage() {
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
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight text-black">Project Management</h1>
                <AddProjectButton 
                    organisations={organisations || []} 
                    users={users || []} 
                />
            </div>
            <ProjectsTable 
                projects={projects || []} 
                organisations={organisations || []}
                users={users || []}
            />
        </div>
    )
}